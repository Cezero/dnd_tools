import { z } from 'zod';

import { commonValidations } from './common.js';
import { FeatureWithRelationsSchema, FeatureEntitySchema, FeaturePrerequisiteSchema } from './feature.js';
import { FeatureUpdateType } from '@shared/static-data';

/**
 * Feature Update Schema - discriminated union for all feature update operations.
 * 
 * Used for applying incremental updates to feature state during editing sessions.
 * Each update type has a specific payload structure.
 * 
 * @see FeatureUpdateType - Enum values for update types
 * @see packages/shared/docs/feature-system/backend-implementation.md - Full documentation
 */
export const FeatureUpdateSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal(FeatureUpdateType.UpdateFeatureField),
        payload: z.object({
            field: z.string(),
            value: z.any(),
        }),
    }),
    z.object({
        type: z.literal(FeatureUpdateType.AddEntity),
        payload: z.object({
            entity: FeatureEntitySchema.omit({ id: true, featureId: true }),
        }),
    }),
    z.object({
        type: z.literal(FeatureUpdateType.UpdateEntity),
        payload: z.object({
            entityId: commonValidations.positiveInt(),
            entity: FeatureEntitySchema.partial().omit({ id: true, featureId: true }),
        }),
    }),
    z.object({
        type: z.literal(FeatureUpdateType.RemoveEntity),
        payload: z.object({
            entityId: commonValidations.positiveInt(),
        }),
    }),
    z.object({
        type: z.literal(FeatureUpdateType.AddPrerequisite),
        payload: z.object({
            prerequisite: FeaturePrerequisiteSchema.omit({ id: true, featureId: true }),
        }),
    }),
    z.object({
        type: z.literal(FeatureUpdateType.UpdatePrerequisite),
        payload: z.object({
            prerequisiteId: commonValidations.positiveInt(),
            prerequisite: FeaturePrerequisiteSchema.partial().omit({ id: true, featureId: true }),
        }),
    }),
    z.object({
        type: z.literal(FeatureUpdateType.RemovePrerequisite),
        payload: z.object({
            prerequisiteId: commonValidations.positiveInt(),
        }),
    }),
]);

/**
 * Feature State Schema.
 * 
 * The feature state is the full FeatureWithRelations object, containing all
 * feature data including entities, prerequisites, and related information.
 * 
 * This schema is used for validating feature state stored in Redis.
 */
export const FeatureStateSchema = FeatureWithRelationsSchema;

// Route parameter schemas
// featureId can be 'new' for new features or a number for existing features
export const FeatureResolutionFeatureIdParamSchema = z.object({
    featureId: z.string().refine(
        (val) => val === 'new' || /^\d+$/.test(val),
        { message: 'Feature ID must be "new" or a number' }
    ),
});

// Note: sessionId removed - we use user sessions now, not entity sessions

// Body schema for applying updates
export const ApplyFeatureUpdateBodySchema = z.object({
    update: FeatureUpdateSchema,
});

// Response schemas
export const StartFeatureEditingResponseSchema = z.object({
    featureState: FeatureStateSchema,
});

export const GetFeatureStateResponseSchema = z.object({
    featureState: FeatureStateSchema,
});

export const ApplyFeatureUpdateResponseSchema = z.object({
    featureState: FeatureStateSchema,
});

export const SaveFeatureStateResponseSchema = z.object({
    success: z.boolean(),
    featureId: z.number().int(),
});

export const CancelFeatureEditingResponseSchema = z.object({
    success: z.boolean(),
});

// TypeScript type exports
export type FeatureUpdate = z.infer<typeof FeatureUpdateSchema>;
export type FeatureState = z.infer<typeof FeatureStateSchema>;
export type FeatureResolutionFeatureIdParamRequest = z.infer<typeof FeatureResolutionFeatureIdParamSchema>;
export type ApplyFeatureUpdateBodyRequest = z.infer<typeof ApplyFeatureUpdateBodySchema>;
export type StartFeatureEditingResponse = z.infer<typeof StartFeatureEditingResponseSchema>;
export type GetFeatureStateResponse = z.infer<typeof GetFeatureStateResponseSchema>;
export type ApplyFeatureUpdateResponse = z.infer<typeof ApplyFeatureUpdateResponseSchema>;
export type SaveFeatureStateResponse = z.infer<typeof SaveFeatureStateResponseSchema>;
export type CancelFeatureEditingResponse = z.infer<typeof CancelFeatureEditingResponseSchema>;
