import type { Request } from 'express';

import type { User } from '@shared/prisma-client';
import type { LoginUserRequest, RegisterUserRequest } from '@shared/schema';

export interface JwtPayload {
    id: number;
    username: string;
    is_admin: boolean;
    preferred_edition_id: number | null;
}

// Use Prisma User type for auth user data
export type AuthUser = Pick<User, 'id' | 'username' | 'isAdmin' | 'preferredEditionId'> & {
    is_admin: User['isAdmin'];
    preferred_edition_id: User['preferredEditionId'];
};

// Request interfaces extending Express Request
export interface LoginRequest extends Request {
    body: LoginUserRequest;
}

export interface RegisterRequest extends Request {
    body: RegisterUserRequest;
}

export interface RefreshRequest extends Request {
    body: { token: string };
}

export interface AuthResponse {
    token: string;
    user: AuthUser;
}

export interface AuthServiceResult {
    success: boolean;
    error?: string;
    token?: string;
    user?: AuthUser;
    newToken?: string;
}

export type { LoginUserRequest, RegisterUserRequest }; 