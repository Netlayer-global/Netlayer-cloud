# Frontend Best Practices Guide

This guide outlines best practices for working with the Netlayer Cloud frontend codebase.

## Project Structure

The project uses a well-organized, scalable folder structure. See `FOLDER_STRUCTURE.md` for detailed information.

## Import Patterns

### Using Path Aliases

Always use path aliases for imports to keep them clean and maintainable.

#### ✅ Good Examples

```typescript
// Import from shared components
import { Button, Card } from '@/components/shared';

// Import hooks
import { useAuth, useFetch } from '@/hooks';

// Import utils
import { formatDate, validateEmail } from '@/utils';

// Import constants
import { ROUTES, API_CONFIG } from '@/constants';

// Import types
import type { User, ApiResponse } from '@/types';

// Import services
import { apiClient } from '@/services';

// Import from subdirectories
import { formatCurrency } from '@/utils/formatters';
import { useAuthHook } from '@/hooks/custom/useAuth';
```

#### ❌ Bad Examples

```typescript
// Long relative paths - hard to maintain
import Button from '../../../../components/shared/Button';
import { formatDate } from '../../utils/formatters/date';
import { useAuth } from '../../../hooks/custom/useAuth';
```

### Create Barrel Exports

For folders with multiple exports, create an `index.ts` file:

```typescript
// src/components/shared/index.ts
export { Button } from './Button';
export { Card } from './Card';
export { Modal } from './Modal';
export { Input } from './Input';

// Now you can import cleanly:
import { Button, Card, Modal } from '@/components/shared';
```

## Component Patterns

### Presentational vs Container Components

#### Presentational (Dumb) Components
- Receive data via props
- No side effects or state management
- Focused on rendering UI
- Easily testable and reusable

```typescript
// Good: presentational component
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={`btn btn-${variant}`}>
      {children}
    </button>
  );
}
```

#### Container (Smart) Components
- Handle data fetching and state management
- Pass data to presentational components
- Contain business logic

```typescript
// Good: container component
export function UsersList() {
  const { data: users, loading } = useFetch('/api/users');

  if (loading) return <Spinner />;

  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

### Component Naming

```typescript
// Pages - match the route or feature
// /dashboard/servers → ServersDashboard.tsx or Servers.tsx

// Components - descriptive, PascalCase
// UserCard.tsx, ServerDetailModal.tsx, BillingTable.tsx

// Hooks - useXxx pattern
// useAuth.ts, useFetch.ts, useForm.ts

// Utils - descriptive, camelCase
// formatDate.ts, validateEmail.ts, debounce.ts
```

## State Management

### Global State (Redux/Zustand)
Use for:
- User authentication state
- Theme preferences
- Global notifications
- Critical business logic state

### Local State (useState)
Use for:
- Form inputs and validation
- UI visibility (modals, dropdowns)
- Loading states for specific components
- Temporary UI state

### Server State (React Query/SWR)
Use for:
- API data fetching and caching
- Server state synchronization
- Pagination and filtering

```typescript
// Good: separating concerns
export function ServersList() {
  // Server state from API
  const { data: servers, isLoading, error } = useFetch('/api/servers');
  
  // Global state
  const { user } = useSelector(state => state.auth);
  
  // Local UI state
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  
  // ...
}
```

## Hooks

### Custom Hook Naming

```typescript
// Provide clear purpose
useAuth()          // Authentication state
useFetch()         // Data fetching
useForm()          // Form state and validation
usePagination()    // Pagination logic
useLocalStorage()  // LocalStorage integration
useDebounce()      // Debounce functionality
useAsync()         // Async operation management
```

### Custom Hook Structure

```typescript
// src/hooks/custom/useAuth.ts
import { useState, useCallback } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      setUser(response.data.user);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { user, isLoading, error, login };
}

// Export from index
// src/hooks/index.ts
export { useAuth } from './custom/useAuth';
```

## Type Safety

### Type Definitions

```typescript
// src/types/api.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export interface Server {
  id: string;
  name: string;
  status: 'active' | 'stopped' | 'error';
  ip: string;
}

// src/types/ui.ts
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}
```

### Generic Types for Common Patterns

```typescript
// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// Paginated Response
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Async State
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}
```

## Error Handling

### Consistent Error Handling

```typescript
// src/utils/validators/email.ts
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) return { valid: false, error: 'Email is required' };
  if (!email.includes('@')) return { valid: false, error: 'Invalid email format' };
  return { valid: true };
}

// In components
const { valid, error } = validateEmail(formData.email);
if (!valid) {
  showError(error); // "Email is required" or "Invalid email format"
}
```

### API Error Handling

```typescript
// src/utils/helpers/handleApiError.ts
export function handleApiError(error: any): string {
  if (error.response?.status === 401) {
    return 'Unauthorized. Please log in again.';
  }
  if (error.response?.status === 404) {
    return 'Resource not found.';
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  return 'An unexpected error occurred.';
}

// In components
try {
  await apiClient.post('/servers', serverData);
} catch (error) {
  const errorMessage = handleApiError(error);
  showError(errorMessage);
}
```

## Performance Optimization

### Code Splitting

```typescript
// Route-based splitting
import { lazy, Suspense } from 'react';

const DashboardPage = lazy(() => import('@/pages/dashboard/Dashboard'));
const ServersList = lazy(() => import('@/pages/dashboard/Servers'));

export function Routes() {
  return (
    <Suspense fallback={<Spinner />}>
      <DashboardPage />
    </Suspense>
  );
}
```

### Memoization

```typescript
import { memo, useCallback, useMemo } from 'react';

// Memoize expensive components
const UserCard = memo(({ user, onSelect }) => {
  return (
    <div onClick={onSelect}>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
});

// Memoize callbacks
function UsersList({ users }) {
  const handleSelect = useCallback((userId) => {
    console.log('Selected:', userId);
  }, []);

  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} onSelect={() => handleSelect(user.id)} />
      ))}
    </div>
  );
}
```

## Testing

### Component Testing

```typescript
// src/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

## File Organization Examples

### Feature-based organization
```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── types/
│   │   └── utils/
│   ├── dashboard/
│   │   ├── components/
│   │   ├── pages/
│   │   └── utils/
```

## Common Mistakes to Avoid

1. **Importing everything in index.ts** - Only export what's needed
2. **Circular dependencies** - Keep dependencies unidirectional
3. **Deeply nested folder structures** - Keep it 3-4 levels deep max
4. **Mixing concerns** - Keep components focused on one responsibility
5. **Not using TypeScript** - Always use proper types
6. **Hard-coded values** - Use constants instead
7. **Missing error handling** - Handle errors gracefully
8. **Not memoizing when needed** - Profile before optimizing

## Documentation

### Component Documentation

```typescript
/**
 * Button component for user interactions
 * 
 * @param {ButtonProps} props - Component props
 * @param {string} props.variant - Button style variant ('primary' | 'secondary')
 * @param {string} props.size - Button size ('sm' | 'md' | 'lg')
 * @param {() => void} props.onClick - Click handler
 * @param {React.ReactNode} props.children - Button content
 * 
 * @example
 * <Button variant="primary" onClick={handleClick}>
 *   Click me
 * </Button>
 */
export function Button({ variant = 'primary', size = 'md', onClick, children }: ButtonProps) {
  return (
    <button className={`btn btn-${variant} btn-${size}`} onClick={onClick}>
      {children}
    </button>
  );
}
```

## Resources

- [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) - Detailed folder structure
- [NEON_LANDING_README.md](./NEON_LANDING_README.md) - Neon landing page documentation
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Vite Docs](https://vitejs.dev/)
