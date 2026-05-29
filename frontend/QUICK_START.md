# Frontend Quick Start Guide

Get up and running with the Netlayer Cloud frontend in minutes.

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Basic knowledge of React and TypeScript

## Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
# or
yarn install
```

## Development

```bash
# Start development server
npm run dev
# or
yarn dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/        # React components
├── pages/            # Page components
├── hooks/            # Custom hooks
├── utils/            # Utility functions
├── services/         # API services
├── store/            # State management
├── types/            # TypeScript types
├── constants/        # App constants
├── assets/           # Images, icons, fonts
└── styles/           # Global styles
```

See [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) for detailed information.

## Key Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript types

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

## Using Path Aliases

All imports use path aliases for cleaner code:

```typescript
// ✅ Good
import { Button } from '@/components/shared';
import { useAuth } from '@/hooks';
import { formatDate } from '@/utils/formatters';

// ❌ Bad
import { Button } from '../../../components/shared/Button';
import { useAuth } from '../../hooks/custom/useAuth';
```

Available aliases:
- `@` - src directory
- `@components` - src/components
- `@pages` - src/pages
- `@hooks` - src/hooks
- `@utils` - src/utils
- `@services` - src/services
- `@store` - src/store
- `@types` - src/types
- `@constants` - src/constants
- `@assets` - src/assets
- `@styles` - src/styles

## Creating a New Component

### 1. Create the component file

```typescript
// src/components/shared/UserCard.tsx
import { memo } from 'react';
import type { User } from '@/types';

interface UserCardProps {
  user: User;
  onSelect?: (userId: string) => void;
}

export const UserCard = memo(function UserCard({ user, onSelect }: UserCardProps) {
  return (
    <div className="p-4 border rounded-lg">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      {onSelect && (
        <button onClick={() => onSelect(user.id)}>Select</button>
      )}
    </div>
  );
});
```

### 2. Export from index.ts

```typescript
// src/components/shared/index.ts
export { UserCard } from './UserCard';
```

### 3. Use in your app

```typescript
import { UserCard } from '@/components/shared';

export function UserList() {
  return (
    <div>
      <UserCard user={currentUser} onSelect={handleSelect} />
    </div>
  );
}
```

## Creating a Custom Hook

### 1. Create the hook

```typescript
// src/hooks/custom/useUserForm.ts
import { useState } from 'react';
import { validateEmail } from '@/utils/validators';

export function useUserForm() {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name) newErrors.name = 'Name is required';
    
    const { valid, error } = validateEmail(formData.email);
    if (!valid) newErrors.email = error;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return { formData, errors, validate, handleChange };
}
```

### 2. Export from index

```typescript
// src/hooks/index.ts
export { useUserForm } from './custom/useUserForm';
```

### 3. Use in components

```typescript
import { useUserForm } from '@/hooks';

export function UserForm() {
  const { formData, errors, handleChange, validate } = useUserForm();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      console.log('Form valid:', formData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Name"
      />
      {errors.name && <span className="error">{errors.name}</span>}
      
      <input
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
      />
      {errors.email && <span className="error">{errors.email}</span>}
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Environment Variables

Create `.env` file in frontend directory:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=Netlayer Cloud
VITE_ENABLE_ANALYTICS=true
```

Access in your code:

```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL;
const appName = import.meta.env.VITE_APP_NAME;
```

## Common Patterns

### Data Fetching with React Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services';

export function UsersList() {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await apiClient.get('/users');
      return response.data;
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {users?.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### Form Validation

```typescript
import { useState } from 'react';
import { validateEmail } from '@/utils/validators';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    const { valid, error } = validateEmail(email);
    if (!valid) newErrors.email = error;

    if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit form
    try {
      await login(email, password);
    } catch (err) {
      setErrors({ submit: err.message });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      {errors.email && <span className="error">{errors.email}</span>}

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      {errors.password && <span className="error">{errors.password}</span>}

      <button type="submit">Login</button>
      {errors.submit && <span className="error">{errors.submit}</span>}
    </form>
  );
}
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5173
# macOS/Linux
lsof -ti:5173 | xargs kill -9

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Module Not Found
- Check path aliases in `vite.config.ts` and `tsconfig.json`
- Make sure files are in correct directories
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### TypeScript Errors
- Run `npm run type-check` to see all type errors
- Check `tsconfig.json` settings
- Ensure all imports have correct types

## Next Steps

1. Read [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) for detailed folder organization
2. Check [BEST_PRACTICES.md](./BEST_PRACTICES.md) for coding guidelines
3. Review existing components in `src/components`
4. Start building features!

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Query](https://tanstack.com/query/latest)

## Getting Help

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review project documentation files
3. Check existing components for similar implementations
4. Create an issue with detailed error messages
