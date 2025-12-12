import React from 'react';

import type { UserProfile, UserDiceConfig, UpdateUserProfileRequest } from '@shared/schema';

// Auth context interface
export interface AuthContextType {
    user: UserProfile | null;
    Login: (username: string, password: string) => Promise<boolean>;
    Logout: () => void;
    isLoading: boolean;
    UpdatePreferredEdition: (editionId: number) => Promise<boolean>;
    UpdateUserProfile: (data: UpdateUserProfileRequest) => Promise<boolean>;
    userDiceConfig: UserDiceConfig | null;
    isLoadingDiceConfig: boolean;
    refreshDiceConfig: () => Promise<void>;
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
    user: UserProfile | null;
    isLoading: boolean;
}

// UseAuthAuto hook return type
export interface UseAuthAutoReturn {
    user: UserProfile | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
}

// RequireAuth component props
export interface RequireAuthProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
} 
