import { z } from 'zod';

import { commonValidations } from './common.js';
import { FeatureWithRelationsSchema, FeatureEntitySchema } from './feature.js';
import { SourceMapSchema } from './sourcebook.js';
import { BaseRaceSchema, RaceSummarySchema } from './race.js';
import { RaceUpdateType } from '@shared/static-data';

// Race Update Schema - discriminated union for all update operations
// Note: Features are now managed independently via feature state system.
// Race updates only handle feature linking/unlinking and race-specific fields.
export const RaceUpdateSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal(RaceUpdateType.LinkFeature),
        payload: z.object({
            featureId: commonValidations.positiveInt(),
        }),
    }),
    z.object({
        type: z.literal(RaceUpdateType.UnlinkFeature),
        payload: z.object({
            featureId: commonValidations.positiveInt(),
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
    featureIds: z.array(z.number().int()),
});

// Response schemas
export const StartRaceEditingResponseSchema = z.object({
    raceState: RaceEditStateSchema,
});

export const GetRaceStateResponseSchema = z.object({
    raceState: RaceEditStateSchema,
});

export const ApplyRaceUpdateResponseSchema = z.object({
    raceState: RaceEditStateSchema,
});

export const SaveRaceStateResponseSchema = z.object({
    race: RaceSummarySchema,
});

export const CancelRaceEditingResponseSchema = z.object({
    success: z.boolean(),
});

// Schema for race entity with ID (used in resolution system)
// Extends BaseRaceSchema with id field for cases where ID is needed
export const RaceWithIdSchema = BaseRaceSchema.extend({
    id: commonValidations.positiveInt('Race ID'),
});

// TypeScript type exports
export type RaceUpdate = z.infer<typeof RaceUpdateSchema>;
export type RaceResolutionRaceIdParamRequest = z.infer<typeof RaceResolutionRaceIdParamSchema>;
export type ApplyRaceUpdateBodyRequest = z.infer<typeof ApplyRaceUpdateBodySchema>;
export type RaceEditState = z.infer<typeof RaceEditStateSchema>;
export type RaceWithId = z.infer<typeof RaceWithIdSchema>;
export type StartRaceEditingResponse = z.infer<typeof StartRaceEditingResponseSchema>;
export type GetRaceStateResponse = z.infer<typeof GetRaceStateResponseSchema>;
export type ApplyRaceUpdateResponse = z.infer<typeof ApplyRaceUpdateResponseSchema>;
export type SaveRaceStateResponse = z.infer<typeof SaveRaceStateResponseSchema>;
export type CancelRaceEditingResponse = z.infer<typeof CancelRaceEditingResponseSchema>;
