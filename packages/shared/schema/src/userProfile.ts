import { z } from 'zod';

// Schema for updating user profile (matches Prisma User model field names)
export const UpdateUserProfileSchema = z.object({
    preferredEditionId: z.number().int().positive().optional(),
});

// Type inference from the schema
export type UpdateUserProfileRequest = z.infer<typeof UpdateUserProfileSchema>; 