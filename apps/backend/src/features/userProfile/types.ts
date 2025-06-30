import type { Request } from 'express';

import type { User } from '@shared/prisma-client';
import type { UpdateUserProfileRequest } from '@shared/schema';

// Use Prisma User type for user profile data
export type UserProfile = Pick<User, 'id' | 'username' | 'email' | 'isAdmin' | 'preferredEditionId'> & {
    is_admin: User['isAdmin'];
    preferred_edition_id: User['preferredEditionId'];
};

// Extend Prisma User type for query parameters, making all fields optional and string-based
export type UserProfileQuery = Partial<Record<keyof User, string>> & {
    page?: string;
    limit?: string;
    [key: string]: string | undefined;
};

// Request interfaces extending Express Request
export interface UserProfileRequest extends Request {
    query: UserProfileQuery;
}

export interface UserProfileUpdateRequest extends Request {
    body: UpdateUserProfileRequest;
}

export interface UserProfileDeleteRequest extends Request {
    params: { id: string };
}

export interface UserProfileUpdateResponse {
    message: string;
    user: UserProfile;
    token: string;
}

export type { UpdateUserProfileRequest }; 