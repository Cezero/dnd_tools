import { z } from 'zod';

import { numericParam, commonValidations } from './common.js';
import { QueryResponseSchema } from './query.js';
import { SourceMapSchema } from './sourcebook.js';
import { FeatureResponseSchema, UpdateFeatureSchema } from './feature.js';
import { CharacterFeatureChoiceForEnrichmentSchema } from './class.js';
import { ValidationErrorResponseSchema } from './validation.js';

// Query schema for optional character feature choices
export const RaceIdQuerySchema = z.object({
    characterFeatureChoices: z.string().optional().transform((val) => {
        if (!val) return undefined;
        try {
            return JSON.parse(val) as z.infer<typeof CharacterFeatureChoiceForEnrichmentSchema>[];
        } catch {
            return undefined;
        }
    }),
});

export const BaseRaceSchema = z.object({
    name: commonValidations.name(),
    description: commonValidations.description(10000).nullable(),
    editionId: commonValidations.positiveInt('Edition ID'),
    isVisible: z.boolean().default(true),
    sourceBookInfo: z.array(SourceMapSchema).nullable(),
    featureIds: z.array(z.number().int()),
});

export const RaceSummarySchema = BaseRaceSchema.extend({
    id: commonValidations.positiveInt('Race ID'),
    sizeId: z.number().int().nullable().optional(),
    speed: z.number().int().nullable().optional(),
    favoredClassId: z.number().int().nullable().optional(),
});

export const GetAllRacesResponseSchema = QueryResponseSchema.extend({
    results: z.array(RaceSummarySchema),
});

export const UpdateRaceSchema = BaseRaceSchema.partial();

export const CreateRaceSchema = BaseRaceSchema;

export const RaceCacheSchema = RaceSummarySchema.omit({
    description: true,
    sourceBookInfo: true,
});

export const RaceCacheResponseSchema = QueryResponseSchema.extend({
    results: z.array(RaceCacheSchema),
});

export type RaceIdQueryRequest = z.infer<typeof RaceIdQuerySchema>;
export type CreateRaceRequest = z.infer<typeof CreateRaceSchema>;
export type UpdateRaceRequest = z.infer<typeof UpdateRaceSchema>;
export type RaceSummary = z.infer<typeof RaceSummarySchema>;
export type Race = z.infer<typeof BaseRaceSchema>;
export type GetAllRacesResponse = z.infer<typeof GetAllRacesResponseSchema>;

export type RaceCacheResponse = z.infer<typeof RaceCacheResponseSchema>;
export type RaceCacheEntry = z.infer<typeof RaceCacheSchema>;

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

/**
 * Draft-state schema for Race editing.
 *
 * Supports both persisted and draft-only ids:
 * - `raceId > 0`: persisted race being edited
 * - `raceId < 0`: draft-only race being created
 */
export const RaceDraftStateSchema = RaceEditStateSchema.extend({
    raceId: z.number().int(),
});

// Race Resolution TypeScript type exports
export type RaceEditState = z.infer<typeof RaceEditStateSchema>;
export type RaceDraftState = z.infer<typeof RaceDraftStateSchema>;
