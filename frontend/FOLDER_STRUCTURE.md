# Frontend Folder Structure

This document explains the organized folder structure for the Netlayer Cloud frontend application.

## Directory Overview

```
frontend/
├── src/
│   ├── components/              # Reusable React components
│   │   ├── shared/             # Shared/generic components (Button, Modal, etc.)
│   │   ├── landing/            # Landing page specific components
│   │   ├── dashboard/          # Dashboard specific components
│   │   ├── auth/               # Authentication related components
│   │   ├── Layout/             # Layout wrapper components (Sidebar, Topbar)
│   │   ├── billing/            # Billing/payment components
│   │   └── ui/                 # UI library components
│   │
│   ├── pages/                   # Page components (one per route)
│   │   ├── landing/            # Landing page route
│   │   ├── dashboard/          # Dashboard routes
│   │   ├── admin/              # Admin routes
│   │   └── auth/               # Auth pages (login, signup, etc.)
│   │
│   ├── layouts/                 # Layout container components
│   │   ├── DashboardLayout.tsx
│   │   ├── AuthLayout.tsx
│   │   └── PublicLayout.tsx
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── custom/             # Custom hooks (useAuth, useFetch, etc.)
│   │   └── index.ts            # Barrel export
│   │
│   ├── utils/                   # Utility functions
│   │   ├── helpers/            # Helper functions
│   │   ├── formatters/         # Data formatting utilities
│   │   ├── validators/         # Validation functions
│   │   └── index.ts            # Barrel export
│   │
│   ├── services/                # API and service layer
│   │   ├── api/                # API client and endpoints
│   │   ├── hooks/              # Service-related hooks
│   │   └── index.ts            # Service exports
│   │
│   ├── store/                   # State management (Redux/Zustand)
│   │   ├── slices/             # Redux slices or Zustand stores
│   │   ├── middleware/         # Store middleware
│   │   └── index.ts            # Store configuration
│   │
│   ├── types/                   # TypeScript type definitions
│   │   ├── api/                # API response types
│   │   ├── models.ts           # Data models
│   │   ├── ui.ts               # UI-related types
│   │   └── index.ts            # Type exports
│   │
│   ├── constants/               # Application constants
│   │   ├── urls.ts             # API URLs and routes
│   │   ├── messages.ts         # Error/success messages
│   │   └── config.ts           # App configuration
│   │
│   ├── assets/                  # Static files
│   │   ├── images/             # PNG, JPG, SVG images
│   │   ├── icons/              # Icon assets
│   │   └── fonts/              # Font files
│   │
│   ├── styles/                  # Global styles
│   │   ├── globals.css         # Global CSS
│   │   ├── variables.css       # CSS variables
│   │   └── animations.css      # Animation definitions
│   │
│   ├── App.tsx                  # Root app component
│   ├── main.tsx                 # Application entry point
│   └── index.css                # Root styles
│
├── public/                       # Static public assets
│   ├── images/
│   ├── icons/
│   └── index.html
│
├── .env                          # Environment variables
├── .env.local                    # Local environment overrides
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Detailed Explanation

### `/src/components`
Reusable React components organized by feature/section:
- **shared/** - Generic components used across the app (Button, Input, Card, Modal)
- **landing/** - Components specific to the landing/home page (Hero, Features, Pricing)
- **dashboard/** - Components for the dashboard section (Charts, Tables, Cards)
- **auth/** - Authentication components (LoginForm, RegisterForm, ForgotPassword)
- **Layout/** - Layout wrappers (Sidebar, Topbar, Footer)

### `/src/pages`
Organized by route/feature:
- **landing/** - Public landing page components
- **dashboard/** - Protected dashboard pages
- **admin/** - Admin panel pages
- **auth/** - Authentication pages (login, register, reset password)

Each page should be a container component that handles data fetching and passes data to child components.

### `/src/hooks`
Custom React hooks:
- **custom/** - Your custom hooks (useAuth, useFetch, useForm, etc.)
- **index.ts** - Barrel export for easy importing

Example:
```typescript
// hooks/custom/useAuth.ts
export function useAuth() { ... }

// hooks/index.ts
export { useAuth } from './custom/useAuth';
export { useFetch } from './custom/useFetch';
```

### `/src/utils`
Pure utility functions:
- **helpers/** - General helper functions
- **formatters/** - Data formatting (dates, numbers, currencies)
- **validators/** - Form validation and data validation

Example:
```typescript
// utils/formatters/date.ts
export function formatDate(date: Date) { ... }

// utils/validators/email.ts
export function validateEmail(email: string) { ... }
```

### `/src/services`
API integration and service layer:
- **api/** - API client configuration and endpoint definitions
- **hooks/** - Service-related hooks (useGetUsers, useCreateProject)

Example:
```typescript
// services/api/client.ts
export const apiClient = axios.create({ ... });

// services/api/endpoints.ts
export const endpoints = { users: '/api/users', ... };
```

### `/src/store`
State management configuration:
- **slices/** - Redux slices or Zustand stores
- **middleware/** - Custom middleware
- **index.ts** - Store initialization

### `/src/types`
TypeScript type definitions:
- **api/** - API response and request types
- **models.ts** - Business logic data models
- **ui.ts** - UI component prop types

### `/src/constants`
Application-wide constants:
- **urls.ts** - API endpoints, route paths
- **messages.ts** - Error messages, success messages
- **config.ts** - Feature flags, environment config

### `/src/assets`
Static files that are bundled:
- **images/** - Product images, screenshots, logos
- **icons/** - Icon SVGs or images
- **fonts/** - Custom fonts

## Naming Conventions

### Files
- **Components**: PascalCase (Button.tsx, UserCard.tsx)
- **Utilities**: camelCase (formatDate.ts, validateEmail.ts)
- **Constants**: UPPER_SNAKE_CASE (API_BASE_URL, DEFAULT_TIMEOUT)
- **Types**: PascalCase (UserType.ts, ApiResponse.ts)
- **Styles**: kebab-case (global.css, variables.css)

### Folders
- All lowercase with hyphens (custom-hooks, api-client)
- Plural when containing multiple items (components, utils)
- Singular when containing related items of a category (store, types)

## Import Best Practices

### Avoid
```typescript
import Button from '../../../../components/shared/Button';
import { formatDate } from '../../../../../../utils/formatters/date';
```

### Prefer (with barrel exports)
```typescript
import { Button } from '@/components/shared';
import { formatDate } from '@/utils/formatters';
```

Create `index.ts` files in each folder:
```typescript
// components/shared/index.ts
export { Button } from './Button';
export { Input } from './Input';
export { Card } from './Card';
```

## Path Aliases
Configure in `vite.config.ts` and `tsconfig.json`:
```typescript
// vite.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}

// tsconfig.json
"paths": {
  "@/*": ["./src/*"]
}
```

## Module Responsibility

| Folder | Responsibility |
|--------|-----------------|
| `components/` | UI rendering and interaction |
| `pages/` | Route containers, data fetching |
| `hooks/` | Logic reuse across components |
| `utils/` | Pure functions, helpers |
| `services/` | API communication |
| `store/` | Global state management |
| `types/` | Type safety and definitions |
| `constants/` | Static values and configuration |

## Best Practices

1. **Keep components small and focused** - Each component should have a single responsibility
2. **Use index.ts for barrel exports** - Makes imports cleaner
3. **Collocate related files** - Keep styles, tests, and components together
4. **Separate container and presentational components** - Container for logic, presentational for UI
5. **Use custom hooks for logic** - Extract component logic into hooks
6. **Centralize API calls** - Use services/api folder
7. **Type everything** - Use TypeScript for type safety

## Growth Strategy

As your application grows:
1. Break down large component folders into subfolders
2. Create feature-specific stores in `/store/slices`
3. Organize API endpoints by feature in `/services/api`
4. Create domain-specific hook collections in `/hooks/custom`
5. Organize utilities by domain (date, form, string, etc.)

## Related Files

- `NEON_LANDING_README.md` - Documentation for the Neon Landing page
- `.env.example` - Example environment variables
- `vite.config.ts` - Vite configuration with path aliases
