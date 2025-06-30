import React from 'react';
import type { User } from '@shared/prisma-client/client';
import {
    LoginUserSchema,
    RegisterUserSchema,
    AuthHeaderSchema,
    JwtPayloadSchema,
    LoginResponseSchema,
    UserProfileResponseSchema,
    type LoginUserRequest,
    type RegisterUserRequest,
    type AuthHeaderRequest,
    type JwtPayload,
    type LoginResponse,
    type UserProfileResponse
} from '@shared/schema';

// Re-export shared types for convenience
export {
    LoginUserRequest,
    RegisterUserRequest,
    AuthHeaderRequest,
    JwtPayload,
    LoginResponse,
    UserProfileResponse
};

// Frontend User type (subset of Prisma User type)
export type FrontendUser = Pick<User, 'id' | 'username' | 'isAdmin' | 'preferredEditionId'> & {
    is_admin: boolean; // Backend uses snake_case
    preferred_edition_id?: number | null; // Backend uses snake_case
};

// Auth context interface
export interface AuthContextType {
    user: FrontendUser | null;
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
    user: FrontendUser | null;
    isLoading: boolean;
}

// UseAuthAuto hook return type
export interface UseAuthAutoReturn {
    user: FrontendUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
}

// RequireAuth component props
export interface RequireAuthProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
} 