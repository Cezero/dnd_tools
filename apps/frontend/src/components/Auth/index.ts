// Main provider and context exports
export { AuthProvider, UseAuth } from './AuthProvider';

// Route protection components
export { ProtectedRoute, AdminRoute, AuthRoute, OptionalAuthRoute } from './ProtectedRoute';
export { RequireAuth } from './RequireAuth';

// Page components
export { LoginPage } from './LoginPage';
export { RegisterPage } from './RegisterPage';

// HOC exports
export { withAuth, withAuthContext } from './withAuth';

// Hook exports
export { useAuthAuto, useAdminAuth, useRequireAuth } from './useAuthAuto';

// Type exports
export type {
    // Frontend-specific types
    FrontendUser,
    AuthContextType,
    AuthProviderProps,
    ProtectedRouteProps,
    LoginPageProps,
    RegisterPageProps,
    WithAuthProps,
    UseAuthAutoReturn,
    RequireAuthProps,
    // Re-exported shared types
    LoginUserRequest,
    RegisterUserRequest,
    AuthHeaderRequest,
    JwtPayload,
    LoginResponse,
    UserProfileResponse
} from './types'; 