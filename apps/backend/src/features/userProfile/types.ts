import type { Request } from 'express';
import type { UpdateUserProfileRequest } from '@shared/schema';

// Request interfaces extending Express Request
export interface UserProfileUpdateRequest extends Request {
    body: UpdateUserProfileRequest;
}

// Re-export types from shared schema for convenience
export type { UpdateUserProfileRequest };