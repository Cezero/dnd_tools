import { z } from 'zod';

import { commonValidations } from './common.js';
import { FeatureProgressionSchema, FeatureEntitySchema } from './feature.js';
import { SourceMapSchema } from './sourcebook.js';
import { BaseRaceSchema, RaceSummarySchema } from './race.js';
import { RaceUpdateType } from '@shared/static-data';

// Race Update Schema - discriminated union for all update operations
export const RaceUpdateSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal(RaceUpdateType.LinkProgression),
        payload: z.object({
            progressionId: commonValidations.positiveInt(),
            featureId: commonValidations.positiveInt(),
        }),
    }),
    z.object({
        type: z.literal(RaceUpdateType.UnlinkProgression),
        payload: z.object({
            progressionId: commonValidations.positiveInt(),
        }),
    }),
    z.object({
        type: z.literal(RaceUpdateType.AddProgression),
        payload: z.object({
            progression: FeatureProgressionSchema,
        }),
    }),
    z.object({
        type: z.literal(RaceUpdateType.UpdateProgression),
        payload: z.object({
            progressionId: commonValidations.positiveInt(),
            progression: FeatureProgressionSchema.partial(),
        }),
    }),
    z.object({
        type: z.literal(RaceUpdateType.RemoveProgression),
        payload: z.object({
            progressionId: commonValidations.positiveInt(),
        }),
    }),
    z.object({
        type: z.literal(RaceUpdateType.AddEntity),
        payload: z.object({
            progressionId: commonValidations.positiveInt(),
            entity: FeatureEntitySchema,
        }),
    }),
    z.object({
        type: z.literal(RaceUpdateType.UpdateEntity),
        payload: z.object({
            entityId: commonValidations.positiveInt(),
            entity: FeatureEntitySchema.partial(),
        }),
    }),
    z.object({
        type: z.literal(RaceUpdateType.RemoveEntity),
        payload: z.object({
            entityId: commonValidations.positiveInt(),
        }),
    }),
    z.object({
        type: z.literal(RaceUpdateType.UpdateRaceField),
        payload: z.object({
            field: z.string(),
            value: z.any(),
        }),
    }),
]);

// Route parameter schemas
export const RaceResolutionRaceIdParamSchema = z.object({
    raceId: z.string().regex(/^\d+$/),
});

export const RaceSessionIdParamSchema = z.object({
    sessionId: z.uuid(),
});

export const RaceResolutionParamsSchema = RaceResolutionRaceIdParamSchema.extend({
    sessionId: z.uuid(),
});

// Body schema for applying updates
export const ApplyRaceUpdateBodySchema = z.object({
    update: RaceUpdateSchema,
});

// Race Edit State Schema
export const RaceEditStateSchema = z.object({
    raceId: z.number().int().nullable(),
    name: z.string(),
    editionId: commonValidations.positiveInt(),
    isVisible: z.boolean(),
    description: z.string().nullable(),
    sourceBookInfo: z.array(SourceMapSchema).nullable(),
    featureProgressions: z.array(FeatureProgressionSchema),
});

// Response schemas
export const InitializeRaceSessionResponseSchema = z.object({
    sessionId: z.uuid(),
    raceState: RaceEditStateSchema,
});

export const GetRaceSessionStateResponseSchema = z.object({
    raceState: RaceEditStateSchema,
});

export const ApplyRaceUpdateResponseSchema = z.object({
    raceState: RaceEditStateSchema,
});

// Schema for race entity with ID (used in resolution system)
// Extends BaseRaceSchema with id field for cases where ID is needed
export const RaceWithIdSchema = BaseRaceSchema.extend({
    id: commonValidations.positiveInt('Race ID'),
});

// Response schema for saving race session
export const SaveRaceSessionResponseSchema = z.object({
    race: RaceSummarySchema,
});

// TypeScript type exports
export type RaceUpdate = z.infer<typeof RaceUpdateSchema>;
export type RaceResolutionRaceIdParamRequest = z.infer<typeof RaceResolutionRaceIdParamSchema>;
export type RaceSessionIdParamRequest = z.infer<typeof RaceSessionIdParamSchema>;
export type RaceResolutionParamsRequest = z.infer<typeof RaceResolutionParamsSchema>;
export type ApplyRaceUpdateBodyRequest = z.infer<typeof ApplyRaceUpdateBodySchema>;
export type RaceEditState = z.infer<typeof RaceEditStateSchema>;
export type RaceWithId = z.infer<typeof RaceWithIdSchema>;
export type InitializeRaceSessionResponse = z.infer<typeof InitializeRaceSessionResponseSchema>;
export type GetRaceSessionStateResponse = z.infer<typeof GetRaceSessionStateResponseSchema>;
export type ApplyRaceUpdateResponse = z.infer<typeof ApplyRaceUpdateResponseSchema>;
export type SaveRaceSessionResponse = z.infer<typeof SaveRaceSessionResponseSchema>;
