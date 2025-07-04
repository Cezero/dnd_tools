import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { UseAuth } from './AuthProvider';
import type { ProtectedRouteProps } from './types';

export function ProtectedRoute({
    children,
    requireAuth = true,
    requireAdmin = false,
    redirectTo = '/login',
    fallback = <div className="p-4 text-black dark:text-white">Loading authentication...</div>
}: ProtectedRouteProps): React.JSX.Element {
    const { user, isLoading } = UseAuth();
    const location = useLocation();

    // Show loading state
    if (isLoading) {
        return <>{fallback}</>;
    }

    // Check if authentication is required and user is not authenticated
    if (requireAuth && !user) {
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    // Check if admin access is required and user is not admin
    if (requireAdmin && !user?.isAdmin) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
}

// Convenience components for common use cases
export function AdminRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requireAuth' | 'requireAdmin'>) {
    return (
        <ProtectedRoute requireAuth={true} requireAdmin={true} {...props}>
            {children}
        </ProtectedRoute>
    );
}

export function AuthRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requireAuth'>) {
    return (
        <ProtectedRoute requireAuth={true} {...props}>
            {children}
        </ProtectedRoute>
    );
}

export function OptionalAuthRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requireAuth'>) {
    return (
        <ProtectedRoute requireAuth={false} {...props}>
            {children}
        </ProtectedRoute>
    );
} 