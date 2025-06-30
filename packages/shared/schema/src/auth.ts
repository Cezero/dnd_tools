import { z } from 'zod';

// Schema for user registration
export const RegisterUserSchema = z.object({
    username: z.string()
        .min(3, 'Username must be at least 3 characters long')
        .max(50, 'Username must be less than 50 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string()
        .email('Invalid email format')
        .max(255, 'Email must be less than 255 characters'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters long')
        .max(100, 'Password must be less than 100 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
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

// Schema for JWT token payload (matches the API response format)
export const JwtPayloadSchema = z.object({
    id: z.number(),
    username: z.string(),
    is_admin: z.boolean(), // API uses snake_case for compatibility
    preferred_edition_id: z.number().nullable(), // API uses snake_case for compatibility
    iat: z.number(),
    exp: z.number(),
});

// Schema for login response (matches the API response format)
export const LoginResponseSchema = z.object({
    token: z.string(),
    user: z.object({
        id: z.number(),
        username: z.string(),
        is_admin: z.boolean(), // API uses snake_case for compatibility
        preferred_edition_id: z.number().nullable(), // API uses snake_case for compatibility
    }),
});

// Schema for user profile response (matches the API response format)
export const UserProfileResponseSchema = z.object({
    user: z.object({
        id: z.number(),
        username: z.string(),
        email: z.string(),
        is_admin: z.boolean(), // API uses snake_case for compatibility
        preferred_edition_id: z.number().nullable(), // API uses snake_case for compatibility
    }),
});

// Type inference from schemas
export type RegisterUserRequest = z.infer<typeof RegisterUserSchema>;
export type LoginUserRequest = z.infer<typeof LoginUserSchema>;
export type AuthHeaderRequest = z.infer<typeof AuthHeaderSchema>;
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>; 