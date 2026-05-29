# Frontend Structure Visual Guide

A visual reference for the frontend folder organization.

## Complete Folder Tree

```
frontend/
├── public/                           # Static assets served as-is
│   ├── images/
│   ├── icons/
│   └── index.html
│
├── src/
│   ├── components/                   # 🎨 React Components
│   │   ├── shared/                  # Generic, reusable components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── index.ts             # ← Barrel export
│   │   │
│   │   ├── landing/                 # Landing page components
│   │   │   ├── Hero.tsx
│   │   │   ├── Features.tsx
│   │   │   ├── Pricing.tsx
│   │   │   ├── CTA.tsx
│   │   │   └── ...
│   │   │
│   │   ├── dashboard/               # Dashboard components
│   │   │   ├── Charts.tsx
│   │   │   ├── Tables.tsx
│   │   │   ├── Cards.tsx
│   │   │   └── ...
│   │   │
│   │   ├── auth/                    # Authentication components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ...
│   │   │
│   │   ├── Layout/                  # Layout wrapper components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Topbar.tsx
│   │   │   └── index.tsx
│   │   │
│   │   ├── billing/                 # Billing specific components
│   │   │   ├── AddCreditModal.tsx
│   │   │   ├── InvoiceTable.tsx
│   │   │   └── ...
│   │   │
│   │   ├── ui/                      # UI library components
│   │   │   ├── Badge.tsx
│   │   │   ├── Alert.tsx
│   │   │   └── ...
│   │   │
│   │   ├── ProtectedRoute.tsx       # Route protection component
│   │   ├── NotificationBell.tsx     # Feature components
│   │   └── ...
│   │
│   ├── pages/                        # 📄 Page Components
│   │   ├── landing/
│   │   │   ├── LandingPage.tsx
│   │   │   └── NeonLanding.tsx
│   │   │
│   │   ├── dashboard/               # Protected routes
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Servers.tsx
│   │   │   ├── Billing.tsx
│   │   │   └── ...
│   │   │
│   │   ├── admin/                   # Admin only routes
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── Users.tsx
│   │   │   └── ...
│   │   │
│   │   ├── auth/                    # Auth pages
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── ForgotPassword.tsx
│   │   │   └── ResetPassword.tsx
│   │   │
│   │   ├── public/                  # Public route pages
│   │   │   ├── PricingPage.tsx
│   │   │   ├── BlogPage.tsx
│   │   │   └── ...
│   │   │
│   │   └── Home.tsx                 # Root page
│   │
│   ├── layouts/                      # 📐 Layout Containers
│   │   ├── DashboardLayout.tsx      # Dashboard layout wrapper
│   │   ├── AuthLayout.tsx           # Auth pages layout
│   │   ├── PublicLayout.tsx         # Public pages layout
│   │   └── AdminLayout.tsx          # Admin pages layout
│   │
│   ├── hooks/                        # 🪝 Custom Hooks
│   │   ├── custom/                  # Your custom hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useFetch.ts
│   │   │   ├── useForm.ts
│   │   │   └── ...
│   │   │
│   │   ├── useCountUp.ts            # Existing hooks
│   │   ├── useInView.ts
│   │   ├── useSocket.ts
│   │   └── index.ts                 # ← Barrel export
│   │
│   ├── utils/                        # 🛠️ Utility Functions
│   │   ├── formatters/              # Data formatting
│   │   │   ├── date.ts              # formatDate()
│   │   │   ├── currency.ts          # formatCurrency()
│   │   │   ├── number.ts            # formatNumber()
│   │   │   └── ...
│   │   │
│   │   ├── helpers/                 # Helper functions
│   │   │   ├── debounce.ts
│   │   │   ├── throttle.ts
│   │   │   ├── classNames.ts
│   │   │   └── ...
│   │   │
│   │   ├── validators/              # Validation functions
│   │   │   ├── email.ts             # validateEmail()
│   │   │   ├── password.ts          # validatePassword()
│   │   │   ├── form.ts              # validateForm()
│   │   │   └── ...
│   │   │
│   │   ├── animations.ts            # Animation utilities
│   │   └── index.ts                 # ← Barrel export
│   │
│   ├── services/                     # 🔧 API & Services
│   │   ├── api/                     # API configuration
│   │   │   ├── client.ts            # axios/fetch client
│   │   │   ├── endpoints.ts         # API endpoint definitions
│   │   │   ├── admin.ts
│   │   │   ├── infra.ts
│   │   │   ├── platform.ts
│   │   │   └── ...
│   │   │
│   │   ├── hooks/                   # Service hooks
│   │   │   ├── useGetUsers.ts
│   │   │   ├── useCreateServer.ts
│   │   │   └── ...
│   │   │
│   │   └── index.ts                 # ← Service exports
│   │
│   ├── store/                        # 📊 State Management
│   │   ├── slices/                  # Redux slices or Zustand stores
│   │   │   ├── authSlice.ts
│   │   │   ├── uiSlice.ts
│   │   │   ├── notificationsSlice.ts
│   │   │   └── ...
│   │   │
│   │   ├── middleware/              # Custom middleware
│   │   │   ├── logger.ts
│   │   │   ├── apiMiddleware.ts
│   │   │   └── ...
│   │   │
│   │   ├── authStore.ts             # Auth store
│   │   └── index.ts                 # Store configuration
│   │
│   ├── types/                        # 📋 TypeScript Types
│   │   ├── api/                     # API types
│   │   │   ├── user.ts
│   │   │   ├── server.ts
│   │   │   ├── responses.ts
│   │   │   └── ...
│   │   │
│   │   ├── models.ts                # Data models
│   │   ├── ui.ts                    # UI component types
│   │   ├── index.ts                 # ← Type exports
│   │   └── ...
│   │
│   ├── constants/                    # ⚙️ Constants
│   │   ├── urls.ts                  # API URLs & routes
│   │   ├── messages.ts              # Error/success messages
│   │   ├── config.ts                # App configuration
│   │   └── index.ts                 # ← Barrel export
│   │
│   ├── assets/                       # 🎁 Static Files
│   │   ├── images/                  # Product images, screenshots
│   │   │   ├── logo.png
│   │   │   ├── hero-bg.jpg
│   │   │   └── ...
│   │   │
│   │   ├── icons/                   # Icon assets
│   │   │   ├── check.svg
│   │   │   ├── arrow.svg
│   │   │   └── ...
│   │   │
│   │   └── fonts/                   # Custom fonts
│   │       ├── inter.woff2
│   │       └── ...
│   │
│   ├── styles/                       # 🎨 Global Styles
│   │   ├── globals.css              # Global styles
│   │   ├── variables.css            # CSS variables & theme
│   │   ├── animations.css           # Animation definitions
│   │   ├── neon.css                 # Neon theme styles
│   │   └── tokens.css               # Design tokens
│   │
│   ├── test/                         # 🧪 Tests
│   │   ├── setup.ts                 # Test configuration
│   │   ├── utils.test.ts
│   │   ├── Component.test.tsx
│   │   └── ...
│   │
│   ├── lib/                          # Library code
│   │   ├── socket.ts
│   │   ├── razorpay.ts
│   │   └── utils.ts
│   │
│   ├── api/                          # (Legacy) API client
│   │   ├── client.ts
│   │   ├── endpoints.ts
│   │   └── ...
│   │
│   ├── App.tsx                       # Root component
│   ├── main.tsx                      # Entry point
│   └── vite-env.d.ts                 # Vite env types
│
├── docs/                             # Documentation
│   ├── FOLDER_STRUCTURE.md           # Folder organization guide
│   ├── BEST_PRACTICES.md             # Coding standards
│   ├── QUICK_START.md                # Quick reference
│   └── STRUCTURE_VISUAL_GUIDE.md     # This file!
│
├── .env                              # Environment variables
├── .env.example                      # Example env vars
├── .eslintrc.json                   # ESLint configuration
├── .gitignore
├── package.json
├── tsconfig.json                     # TypeScript config (with paths)
├── vite.config.ts                    # Vite config (with path aliases)
├── tailwind.config.js                # Tailwind CSS config
└── README.md
```

## Module Responsibility Matrix

```
┌─────────────────┬──────────────────────────────────────────┐
│ Folder          │ Primary Responsibility                   │
├─────────────────┼──────────────────────────────────────────┤
│ components/     │ UI rendering and component logic         │
│ pages/          │ Page layout & route-level state          │
│ layouts/        │ Page layout wrappers                     │
│ hooks/          │ Reusable logic & state                   │
│ utils/          │ Pure functions & helpers                 │
│ services/       │ API communication & data fetching        │
│ store/          │ Global state management                  │
│ types/          │ TypeScript type definitions              │
│ constants/      │ Static values & configuration            │
│ assets/         │ Images, icons, fonts                     │
│ styles/         │ Global CSS & theming                     │
└─────────────────┴──────────────────────────────────────────┘
```

## Import Path Examples

### Component Imports
```typescript
// From shared components
import { Button, Card, Modal } from '@/components/shared';

// From specific feature
import { Hero, Features } from '@/components/landing';

// From specific component
import { UserCard } from '@/components/dashboard';
```

### Hook Imports
```typescript
// From hooks barrel export
import { useAuth, useFetch, useForm } from '@/hooks';

// From specific custom hook
import { useAuthForm } from '@/hooks/custom/useAuthForm';
```

### Utility Imports
```typescript
// From utils barrel export
import { formatDate, validateEmail } from '@/utils';

// From specific utility folder
import { formatCurrency } from '@/utils/formatters';
import { debounce } from '@/utils/helpers';
```

### Service Imports
```typescript
import { apiClient } from '@/services';
import { endpoints } from '@/services/api';
```

### Type Imports
```typescript
import type { User, Server } from '@/types/api';
import type { ButtonProps } from '@/types/ui';
```

### Constant Imports
```typescript
import { ROUTES, API_CONFIG, ERROR_MESSAGES } from '@/constants';
```

## File Naming Patterns

```
Components:          ✓ Button.tsx, UserCard.tsx, LoginModal.tsx
Pages:              ✓ Dashboard.tsx, Servers.tsx, NotFound.tsx
Hooks:              ✓ useAuth.ts, useFetch.ts, useForm.ts
Utils:              ✓ formatDate.ts, validateEmail.ts, debounce.ts
Types:              ✓ User.ts, ApiResponse.ts, ButtonProps.ts
Constants:          ✓ ROUTES.ts, API_CONFIG.ts, MESSAGES.ts
Styles:             ✓ globals.css, variables.css, animations.css
Tests:              ✓ Button.test.tsx, utils.test.ts
```

## Quick Navigation

### "I need to..."

**Add a new button component**
```
→ src/components/shared/Button.tsx
→ Update src/components/shared/index.ts
→ Import: import { Button } from '@/components/shared'
```

**Create a custom form hook**
```
→ src/hooks/custom/useForm.ts
→ Update src/hooks/index.ts
→ Import: import { useForm } from '@/hooks'
```

**Add API endpoint handling**
```
→ src/services/api/endpoints.ts
→ Update src/services/index.ts
→ Import: import { endpoints } from '@/services'
```

**Add validation logic**
```
→ src/utils/validators/email.ts
→ Update src/utils/index.ts
→ Import: import { validateEmail } from '@/utils'
```

**Add global constant**
```
→ src/constants/config.ts
→ Update src/constants/index.ts
→ Import: import { CONFIG } from '@/constants'
```

**Add state slice**
```
→ src/store/slices/authSlice.ts
→ Update src/store/index.ts
→ Configure in store
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      User Interface                       │
│                   (pages/ & components/)                  │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    State Management                       │
│                    (hooks/ & store/)                      │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   Business Logic                         │
│              (utils/ & custom hooks/)                    │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   Data Layer                             │
│              (services/ & api client/)                   │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   Backend API                            │
└─────────────────────────────────────────────────────────┘
```

## Best Practices Summary

- ✅ Use path aliases for all imports
- ✅ Keep components small and focused
- ✅ Extract logic into custom hooks
- ✅ Use barrel exports for cleaner imports
- ✅ Follow naming conventions consistently
- ✅ Keep types in dedicated types/ folder
- ✅ Separate business logic from UI
- ✅ Use TypeScript for type safety
- ✅ Organize utilities by category
- ✅ Document complex components

---

For more details, see:
- [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) - Deep dive into organization
- [BEST_PRACTICES.md](./BEST_PRACTICES.md) - Coding standards and patterns
- [QUICK_START.md](./QUICK_START.md) - Getting started guide
