import { z } from 'zod';
import { UserDiceConfigOverrideSchema, DiceBoxAdminConfigSchema } from './diceBox.js';

// User dice configuration schema (aligned with Prisma database structure)
export const UserDiceConfigSchema = z.object({
    diceConfigBase: z.number().nullable(),
    diceConfigOverrides: z.array(UserDiceConfigOverrideSchema).default([])
});

// Schema for user registration
export const RegisterUserSchema = z.object({
    username: z.string()
        .min(3, 'Username must be at least 3 characters long')
        .max(50, 'Username must be less than 50 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.email({ message: 'Invalid email format' })
        .max(255, { message: 'Email must be less than 255 characters' }),
    password: z.string()
        .min(8, 'Password must be at least 8 characters long')
        .max(100, 'Password must be less than 100 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
});

// Base auth user schema (authentication and role information only)
export const AuthUserSchema = z.object({
    id: z.number(),
    username: z.string(),
    isAdmin: z.boolean(),
});

// User profile schema (profile-related data) - matches Prisma User structure
export const UserProfileSchema = AuthUserSchema.extend({
    email: z.string(),
    preferredEditionId: z.number().nullable(),
    diceConfigBase: z.number().nullable(),
    diceConfigOverrides: z.array(UserDiceConfigOverrideSchema).default([]),
});

// Schema for user login
export const LoginUserSchema = z.object({
    username: z.string()
        .min(1, 'Username is required'),
    password: z.string()
        .min(1, 'Password is required'),
});

// Schema for JWT token in Authorization header
export const AuthHeaderSchema = z.object({
    authorization: z.string()
        .regex(/^Bearer\s+/, 'Authorization header must start with "Bearer "')
        .min(7, 'Authorization header is too short'),
});

// Schema for JWT token payload (extends AuthUserSchema with JWT fields)
export const JwtPayloadSchema = AuthUserSchema.extend({
    iat: z.number(),
    exp: z.number(),
});

export const AuthServiceResultSchema = z.object({
    success: z.boolean(),
    error: z.string().nullable(),
    token: z.string().nullable(),
    user: UserProfileSchema.nullable(),
});

// Schema for updating user profile (matches Prisma User model field names)
export const UpdateUserProfileSchema = z.object({
    preferredEditionId: z.number().int().positive().optional(),
    diceConfigBase: z.number().int().positive().optional(),
    diceConfigOverrides: z.array(UserDiceConfigOverrideSchema).optional(),
});

export const UserProfileIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

// Schema for user profile response
export const UserProfileResponseSchema = UserProfileSchema;

// Schema for user profile update response
export const UserProfileUpdateResponseSchema = z.object({
    message: z.string(),
    user: UserProfileResponseSchema,
    token: z.string(),
});

// Schema for updating user dice configuration (separate from profile updates)
export const UpdateUserDiceConfigSchema = z.object({
    diceConfigBase: z.number().int().positive(),
    diceConfigOverrides: z.array(UserDiceConfigOverrideSchema).default([])
});

// Type inference from schemas
export type UpdateUserProfileRequest = z.infer<typeof UpdateUserProfileSchema>;
export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>;
export type UserProfileUpdateResponse = z.infer<typeof UserProfileUpdateResponseSchema>;
export type UserProfileIdParamRequest = z.infer<typeof UserProfileIdParamSchema>;
export type UpdateUserDiceConfigRequest = z.infer<typeof UpdateUserDiceConfigSchema>;

// Type inference from schemas
export type RegisterUserRequest = z.infer<typeof RegisterUserSchema>;
export type LoginUserRequest = z.infer<typeof LoginUserSchema>;
export type AuthHeaderRequest = z.infer<typeof AuthHeaderSchema>;
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;
export type AuthServiceResult = z.infer<typeof AuthServiceResultSchema>;
export type AuthUser = z.infer<typeof AuthUserSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UserDiceConfig = z.infer<typeof UserDiceConfigSchema>;
