import { z } from 'zod';

// Schema for updating user profile (matches Prisma User model field names)
export const UpdateUserProfileSchema = z.object({
    preferredEditionId: z.number().int().positive().optional(),
});

// Schema for user profile response (matches the API response format)
export const UserProfileResponseSchema = z.object({
    id: z.number(),
    username: z.string(),
    email: z.string(),
    isAdmin: z.boolean(),
    preferredEditionId: z.number().nullable(),
    is_admin: z.boolean(), // API uses snake_case for compatibility
    preferred_edition_id: z.number().nullable(), // API uses snake_case for compatibility
});

// Schema for user profile update response
export const UserProfileUpdateResponseSchema = z.object({
    message: z.string(),
    user: UserProfileResponseSchema,
    token: z.string(),
});

// Type inference from schemas
export type UpdateUserProfileRequest = z.infer<typeof UpdateUserProfileSchema>;
export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>;
export type UserProfileUpdateResponse = z.infer<typeof UserProfileUpdateResponseSchema>; 