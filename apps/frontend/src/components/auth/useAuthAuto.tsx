import { useCallback } from 'react';

import { UseAuth } from './AuthProvider';
import type { UseAuthAutoReturn } from './types';

// Enhanced auth hook with additional utilities
export function useAuthAuto(): UseAuthAutoReturn & {
    hasPermission: (permission: string) => boolean;
    requireAuth: (redirectTo?: string) => boolean;
} {
    const auth = UseAuth();

    // Helper functions
    const isAuthenticated = useCallback(() => {
        return auth.user !== null;
    }, [auth.user]);

    const isAdmin = useCallback(() => {
        return auth.user?.isAdmin === true;
    }, [auth.user]);

    const hasPermission = useCallback((permission: string) => {
        // You can extend this to check specific permissions
        if (permission === 'admin') {
            return isAdmin();
        }
        return isAuthenticated();
    }, [isAuthenticated, isAdmin]);

    const requireAuth = useCallback((redirectTo = '/login') => {
        if (!isAuthenticated()) {
            // You could trigger a redirect here if needed
            return false;
        }
        return true;
    }, [isAuthenticated]);

    return {
        ...auth,
        isAuthenticated: isAuthenticated(),
        isAdmin: isAdmin(),
        hasPermission,
        requireAuth,
    };
}

// Hook for components that need admin access
export function useAdminAuth() {
    const auth = useAuthAuto();

    if (!auth.isAdmin) {
        throw new Error('Admin access required');
    }

    return auth;
}

// Hook for components that need authentication
export function useRequireAuth() {
    const auth = useAuthAuto();

    if (!auth.isAuthenticated) {
        throw new Error('Authentication required');
    }

    return auth;
} 