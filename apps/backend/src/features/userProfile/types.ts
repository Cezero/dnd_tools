import type { UpdateUserProfileRequest } from '@shared/schema';
import type { User } from '@shared/prisma-client/client';

// Use Prisma User type for user profile data
export type UserProfile = Pick<User, 'id' | 'username' | 'email' | 'isAdmin' | 'preferredEditionId'> & {
    is_admin: User['isAdmin'];
    preferred_edition_id: User['preferredEditionId'];
};

export interface UserProfileUpdateResponse {
    message: string;
    user: UserProfile;
    token: string;
}

export type { UpdateUserProfileRequest }; 