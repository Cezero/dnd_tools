import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { UseAuth } from '@/auth/AuthProvider';

interface RequireAuthProps {
    children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps): React.JSX.Element {
    const { user, isLoading } = UseAuth();

    if (isLoading) {
        return <div className="p-4 text-black dark:text-white">Loading authentication...</div>;
    }

    return user ? <>{children}</> : <Navigate to="/login" replace />;
} 