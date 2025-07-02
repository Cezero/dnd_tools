# Auth Component

A comprehensive authentication system with JWT token management, route protection, and user management capabilities.

## Structure

```
auth/
├── index.ts          # Main exports and types
├── types.ts          # Shared type definitions
├── AuthProvider.tsx  # Main auth context and provider
├── ProtectedRoute.tsx # Route protection components
├── RequireAuth.tsx   # Simple auth requirement component
├── LoginPage.tsx     # Login page component
├── RegisterPage.tsx  # Registration page component
├── withAuth.tsx      # Higher-order components
├── useAuthAuto.tsx   # Enhanced auth hooks
└── README.md         # This documentation
```

## Components

### AuthProvider
The main authentication context provider that manages:
- User authentication state
- JWT token management with automatic refresh
- Login/logout functionality
- User profile updates (preferred edition)
- Token expiration handling

**Key Features:**
- Automatic token refresh 10 minutes before expiration
- JWT payload validation using Zod schemas
- Persistent authentication state via localStorage
- Comprehensive error handling

### Route Protection
- **ProtectedRoute**: Configurable route protection with auth/admin requirements
- **AdminRoute**: Convenience component for admin-only routes
- **AuthRoute**: Convenience component for authenticated routes
- **OptionalAuthRoute**: Routes that work with or without authentication
- **RequireAuth**: Simple authentication requirement wrapper

### Page Components
- **LoginPage**: User login form with Zod validation and error handling
- **RegisterPage**: User registration form with auto-login after registration

### Higher-Order Components
- **withAuth**: HOC that injects auth context into components
- **withAuthContext**: Alternative HOC with separate auth prop

### Hooks
- **useAuthAuto**: Enhanced auth hook with utility functions
- **useAdminAuth**: Hook for admin-only components (throws error if not admin)
- **useRequireAuth**: Hook for authenticated-only components (throws error if not authenticated)

## Usage

### Basic Setup

```tsx
import { AuthProvider } from '@/components/auth';

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Your app routes */}
      </Router>
    </AuthProvider>
  );
}
```

### Using Authentication

```tsx
import { UseAuth, LoginPage, ProtectedRoute } from '@/components/auth';

function MyComponent() {
  const { user, Login, Logout, isLoading, UpdatePreferredEdition } = UseAuth();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {user ? (
        <div>
          <p>Welcome, {user.username}!</p>
          <button onClick={Logout}>Logout</button>
          <button onClick={() => UpdatePreferredEdition(1)}>
            Set Preferred Edition
          </button>
        </div>
      ) : (
        <LoginPage />
      )}
    </div>
  );
}
```

### Route Protection

```tsx
import { ProtectedRoute, AdminRoute, AuthRoute, OptionalAuthRoute } from '@/components/auth';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/public" element={<PublicPage />} />
      
      <Route 
        path="/protected" 
        element={
          <ProtectedRoute>
            <ProtectedPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin" 
        element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        } 
      />

      <Route 
        path="/auth-only" 
        element={
          <AuthRoute>
            <AuthOnlyPage />
          </AuthRoute>
        } 
      />

      <Route 
        path="/optional-auth" 
        element={
          <OptionalAuthRoute>
            <OptionalAuthPage />
          </OptionalAuthRoute>
        } 
      />
    </Routes>
  );
}
```

### Enhanced Hooks

```tsx
import { useAuthAuto, useAdminAuth, useRequireAuth } from '@/components/auth';

function MyComponent() {
  const auth = useAuthAuto();
  
  if (auth.isAuthenticated) {
    // User is logged in
  }
  
  if (auth.isAdmin) {
    // User is admin
  }

  // Check specific permissions
  if (auth.hasPermission('admin')) {
    // User has admin permission
  }
}

function AdminComponent() {
  const auth = useAdminAuth(); // Throws error if not admin
  // Component only renders for admin users
}

function AuthenticatedComponent() {
  const auth = useRequireAuth(); // Throws error if not authenticated
  // Component only renders for authenticated users
}
```

### Higher-Order Components

```tsx
import { withAuth, withAuthContext } from '@/components/auth';

// Using withAuth
interface MyComponentProps {
  user: AuthUser | null;
  isLoading: boolean;
  someOtherProp: string;
}

const MyComponent = ({ user, isLoading, someOtherProp }: MyComponentProps) => {
  return <div>{user?.username}</div>;
};

const WrappedComponent = withAuth(MyComponent);

// Using withAuthContext
interface MyComponentWithAuthProps {
  auth: AuthContextType;
  someOtherProp: string;
}

const MyComponentWithAuth = ({ auth, someOtherProp }: MyComponentWithAuthProps) => {
  return <div>{auth.user?.username}</div>;
};

const WrappedComponentWithAuth = withAuthContext(MyComponentWithAuth);
```

## Features

- **JWT Token Management**: Automatic token refresh and validation with Zod schemas
- **Type Safety**: Full TypeScript support with shared type definitions
- **Route Protection**: Flexible route protection with multiple levels (auth, admin, optional)
- **Validation**: Zod schema validation for all inputs (login, register)
- **Dark Mode**: Built-in dark mode support in UI components
- **Error Handling**: Comprehensive error handling and user feedback
- **Auto-login**: Automatic login after successful registration
- **User Profile**: User profile management with preferred edition updates
- **Permission System**: Extensible permission checking system
- **Loading States**: Proper loading state management throughout the auth flow

## Type Definitions

All types are exported from the main index file and can be imported as needed:

```tsx
import type { 
  AuthContextType, 
  AuthProviderProps,
  ProtectedRouteProps,
  LoginPageProps,
  RegisterPageProps,
  WithAuthProps,
  UseAuthAutoReturn,
  RequireAuthProps
} from '@/components/auth';
```

## API Integration

The auth system integrates with the backend API endpoints:
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration  
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh-token` - Refresh JWT token
- `PUT /api/user/profile` - Update user profile (preferred edition)

## Security Features

- **Token Expiration**: Automatic token refresh 10 minutes before expiration
- **Input Validation**: Zod schema validation for all inputs
- **Error Handling**: Secure error messages without information leakage
- **Route Protection**: Multiple levels of route protection (auth, admin, optional)
- **Admin Access**: Separate admin access controls with error throwing
- **JWT Validation**: Server-side JWT payload validation using Zod schemas
- **Persistent Auth**: Secure localStorage token management with automatic cleanup

## Exports

The main `index.ts` file exports:

**Components:**
- `AuthProvider`, `UseAuth` - Main auth context and hook
- `ProtectedRoute`, `AdminRoute`, `AuthRoute`, `OptionalAuthRoute` - Route protection
- `RequireAuth` - Simple auth requirement
- `LoginPage`, `RegisterPage` - Auth pages

**HOCs:**
- `withAuth`, `withAuthContext` - Higher-order components

**Hooks:**
- `useAuthAuto`, `useAdminAuth`, `useRequireAuth` - Enhanced auth hooks

**Types:**
- All TypeScript interfaces and types for the auth system 