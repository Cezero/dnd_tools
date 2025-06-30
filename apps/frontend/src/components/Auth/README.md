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
- JWT token management
- Automatic token refresh
- Login/logout functionality
- User profile updates

### Route Protection
- **ProtectedRoute**: Configurable route protection with auth/admin requirements
- **AdminRoute**: Convenience component for admin-only routes
- **AuthRoute**: Convenience component for authenticated routes
- **OptionalAuthRoute**: Routes that work with or without authentication
- **RequireAuth**: Simple authentication requirement wrapper

### Page Components
- **LoginPage**: User login form with validation
- **RegisterPage**: User registration form with validation

### Higher-Order Components
- **withAuth**: HOC that injects auth context into components
- **withAuthContext**: Alternative HOC with separate auth prop

### Hooks
- **useAuthAuto**: Enhanced auth hook with utility functions
- **useAdminAuth**: Hook for admin-only components
- **useRequireAuth**: Hook for authenticated-only components

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
  const { user, Login, Logout, isLoading } = UseAuth();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {user ? (
        <button onClick={Logout}>Logout</button>
      ) : (
        <LoginPage />
      )}
    </div>
  );
}
```

### Route Protection

```tsx
import { ProtectedRoute, AdminRoute } from '@/components/auth';

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
    </Routes>
  );
}
```

### Enhanced Hooks

```tsx
import { useAuthAuto, useAdminAuth } from '@/components/auth';

function MyComponent() {
  const auth = useAuthAuto();
  
  if (auth.isAuthenticated()) {
    // User is logged in
  }
  
  if (auth.isAdmin()) {
    // User is admin
  }
}

function AdminComponent() {
  const auth = useAdminAuth(); // Throws error if not admin
  // Component only renders for admin users
}
```

## Features

- **JWT Token Management**: Automatic token refresh and validation
- **Type Safety**: Full TypeScript support with shared type definitions
- **Route Protection**: Flexible route protection with multiple levels
- **Validation**: Zod schema validation for all inputs
- **Dark Mode**: Built-in dark mode support
- **Error Handling**: Comprehensive error handling and user feedback
- **Auto-login**: Automatic login after registration
- **User Profile**: User profile management with preferred edition

## Type Definitions

All types are exported from the main index file and can be imported as needed:

```tsx
import type { 
  AuthContextType, 
  FrontendUser, 
  ProtectedRouteProps 
} from '@/components/auth';
```

## API Integration

The auth system integrates with the backend API endpoints:
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh-token` - Refresh JWT token

## Security Features

- **Token Expiration**: Automatic token refresh before expiration
- **Input Validation**: Zod schema validation for all inputs
- **Error Handling**: Secure error messages without information leakage
- **Route Protection**: Multiple levels of route protection
- **Admin Access**: Separate admin access controls 