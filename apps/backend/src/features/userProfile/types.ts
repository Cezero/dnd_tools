import type { Request } from 'express';

import type { UpdateUserProfileRequest, UserProfileResponse, UserProfileUpdateResponse } from '@shared/schema';

// Request interfaces extending Express Request
export interface UserProfileUpdateRequest extends Request {
    body: UpdateUserProfileRequest;
}

/**
 * Service interface for user profile operations.
 *
 * Implemented by `apps/backend/src/features/userProfile/userProfileService.ts`.
 */
export interface UserProfileService {
    getUserProfile: (userId: number) => Promise<UserProfileResponse | null>;
    updateUserProfile: (userId: number, data: UpdateUserProfileRequest) => Promise<UserProfileUpdateResponse>;
    verifyToken: (token: string) => Promise<{ success: boolean; userId?: number; error?: string }>;
}

// Re-export types from shared schema for convenience
export type { UpdateUserProfileRequest };