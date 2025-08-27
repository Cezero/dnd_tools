import { z } from 'zod';
import { QueryResponseSchema } from './query.js';

// Base DiceBox admin configuration schema (includes id, no createdAt/updatedAt)
export const DiceBoxAdminConfigSchema = z.object({
    id: z.number().int().positive('Dice configuration ID must be a positive integer'),
    name: z.string().default('Default Configuration'),
    isDefault: z.boolean().default(false),
    gravity: z.number().min(0).max(5).default(1),
    mass: z.number().min(0.1).max(10).default(1),
    friction: z.number().min(0).max(1).default(0.8),
    restitution: z.number().min(0).max(1).default(0),
    angularDamping: z.number().min(0).max(1).default(0.4),
    linearDamping: z.number().min(0).max(1).default(0.4),
    spinForce: z.number().min(0).max(10).default(4),
    throwForce: z.number().min(0).max(10).default(5),
    startingHeight: z.number().min(1).max(20).default(8),
    settleTimeout: z.number().min(1000).max(10000).default(5000),
    lightIntensity: z.number().min(0).max(5).default(1),
    enableShadows: z.boolean().default(true),
    shadowTransparency: z.number().min(0).max(1).default(0.8),
    theme: z.number().default(1), // 3D dice theme ID
    themeColor: z.string().default('#2e8555'),
    iconColor: z.string().nullable(), // Separate color for icons (can be null)
    scale: z.number().min(2).max(9).default(6)
});

// Parameter schemas
export const DiceBoxConfigIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)), // Follow established pattern
});

// Response schemas following established patterns
export const GetAllDiceConfigsResponseSchema = QueryResponseSchema.extend({
    results: z.array(DiceBoxAdminConfigSchema),
});

export const CreateDiceBoxAdminConfigRequestSchema = z.object({
    config: DiceBoxAdminConfigSchema.omit({ id: true })
});

export const UpdateDiceBoxAdminConfigRequestSchema = z.object({
    config: DiceBoxAdminConfigSchema.omit({ id: true }).partial()
});

// Type exports following established patterns
export type DiceBoxConfigIdParamRequest = z.infer<typeof DiceBoxConfigIdParamSchema>;
export type DiceBoxAdminConfig = z.infer<typeof DiceBoxAdminConfigSchema>;
export type GetAllDiceConfigsResponse = z.infer<typeof GetAllDiceConfigsResponseSchema>;
// User dice config override schema
export const UserDiceConfigOverrideSchema = z.object({
    id: z.number().int().positive('Override ID must be a positive integer'),
    userId: z.number().int().positive('User ID must be a positive integer'),
    propertyName: z.string().min(1, 'Property name is required').max(50, 'Property name must be less than 50 characters').trim(),
    propertyValue: z.string().min(1, 'Property value is required').max(100, 'Property value must be less than 100 characters').trim(),
});

// Request/response schemas for user dice config overrides
export const CreateUserDiceConfigOverrideSchema = UserDiceConfigOverrideSchema.omit({ id: true });
export const UpdateUserDiceConfigOverrideSchema = UserDiceConfigOverrideSchema.partial().omit({ id: true });

export type CreateDiceBoxAdminConfigRequest = z.infer<typeof CreateDiceBoxAdminConfigRequestSchema>;
export type UpdateDiceBoxAdminConfigRequest = z.infer<typeof UpdateDiceBoxAdminConfigRequestSchema>;

// User dice config override types
export type UserDiceConfigOverride = z.infer<typeof UserDiceConfigOverrideSchema>;
export type CreateUserDiceConfigOverrideRequest = z.infer<typeof CreateUserDiceConfigOverrideSchema>;
export type UpdateUserDiceConfigOverrideRequest = z.infer<typeof UpdateUserDiceConfigOverrideSchema>;
