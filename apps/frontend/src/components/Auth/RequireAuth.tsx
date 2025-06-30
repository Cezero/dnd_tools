import React from 'react';
import { Navigate } from 'react-router-dom';
import { UseAuth } from './AuthProvider';
import type { RequireAuthProps } from './types';

export function RequireAuth({ children, fallback = <div className="p-4 text-black dark:text-white">Loading authentication...</div> }: RequireAuthProps): React.JSX.Element {
    const { user, isLoading } = UseAuth();

    if (isLoading) {
        return fallback;
    }

    return user ? <>{children}</> : <Navigate to="/login" replace />;
} 