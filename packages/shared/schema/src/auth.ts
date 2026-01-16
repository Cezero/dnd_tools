import { z } from 'zod';

import { numericParam, commonValidations } from './common.js';
import { UserDiceConfigOverrideSchema, DiceBoxAdminConfigSchema } from './diceBox.js';

// User dice configuration schema (aligned with Prisma database structure)
export const UserDiceConfigSchema = z.object({
    diceConfigBase: z.number().nullable(),
    diceConfigOverrides: z.array(UserDiceConfigOverrideSchema).default([])
});

// Schema for user registration
export const RegisterUserSchema = z.object({
    username: commonValidations.username,
    email: commonValidations.email,
    password: commonValidations.password,
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
    username: commonValidations.username,
    password: commonValidations.password,
});

// Schema for JWT token in Authorization header
export const AuthHeaderSchema = commonValidations.authHeader;

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
    preferredEditionId: commonValidations.positiveInt().optional(),
    diceConfigBase: commonValidations.positiveInt().optional(),
    diceConfigOverrides: z.array(UserDiceConfigOverrideSchema).optional(),
});

export const UserProfileIdParamSchema = z.object({
    id: numericParam(),
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
    diceConfigBase: commonValidations.positiveInt(),
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
