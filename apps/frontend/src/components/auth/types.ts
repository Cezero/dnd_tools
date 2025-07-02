import React from 'react';
import type { AuthUser } from '@shared/schema';

// Auth context interface
export interface AuthContextType {
    user: AuthUser | null;
    Login: (username: string, password: string) => Promise<boolean>;
    Logout: () => void;
    isLoading: boolean;
    UpdatePreferredEdition: (editionId: number) => Promise<boolean>;
}

// Auth provider props
export interface AuthProviderProps {
    children: React.ReactNode;
}

// Protected route props
export interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAuth?: boolean;
    requireAdmin?: boolean;
    redirectTo?: string;
    fallback?: React.ReactNode;
}

// Login page props (if needed for future extensibility)
export interface LoginPageProps {
    redirectTo?: string;
}

// Register page props (if needed for future extensibility)
export interface RegisterPageProps {
    redirectTo?: string;
}

// WithAuth HOC props
export interface WithAuthProps {
    user: AuthUser | null;
    isLoading: boolean;
}

// UseAuthAuto hook return type
export interface UseAuthAutoReturn {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
}

// RequireAuth component props
export interface RequireAuthProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
} 