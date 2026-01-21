import { z } from 'zod';

import { numericParam, commonValidations } from './common.js';
import { QueryResponseSchema } from './query.js';
import { SourceMapSchema } from './sourcebook.js';
import { CreateFeatureRequestSchema, FeatureResponseSchema, UpdateFeatureSchema } from './feature.js';
import { CharacterFeatureChoiceForEnrichmentSchema } from './class.js';

export const RaceIdParamSchema = z.object({
    id: numericParam(),
});

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
    features: z.array(FeatureResponseSchema).nullable(),
});

export const RaceSummarySchema = BaseRaceSchema.omit({
    features: true,
}).extend({
    id: commonValidations.positiveInt('Race ID'),
    sizeId: z.number().int().nullable().optional(),
    speed: z.number().int().nullable().optional(),
    favoredClassId: z.number().int().nullable().optional(),
});

export const GetAllRacesResponseSchema = QueryResponseSchema.extend({
    results: z.array(RaceSummarySchema),
});

export const UpdateRaceSchema = BaseRaceSchema.omit({
    features: true,
}).extend({
    features: z.array(UpdateFeatureSchema).nullable(),
}).partial();

export const CreateRaceSchema = BaseRaceSchema.omit({
    features: true,
}).extend({
    features: z.array(UpdateFeatureSchema).nullable(),
});

export const RaceCacheSchema = RaceSummarySchema.omit({
    description: true,
    sourceBookInfo: true,
});

export const RaceCacheResponseSchema = QueryResponseSchema.extend({
    results: z.array(RaceCacheSchema),
});

export type RaceIdParamRequest = z.infer<typeof RaceIdParamSchema>;
export type RaceIdQueryRequest = z.infer<typeof RaceIdQuerySchema>;
export type CreateRaceRequest = z.infer<typeof CreateRaceSchema>;
export type UpdateRaceRequest = z.infer<typeof UpdateRaceSchema>;
export type RaceSummary = z.infer<typeof RaceSummarySchema>;
export type Race = z.infer<typeof BaseRaceSchema>;
export type GetAllRacesResponse = z.infer<typeof GetAllRacesResponseSchema>;

export type RaceCacheResponse = z.infer<typeof RaceCacheResponseSchema>;
export type RaceCacheEntry = z.infer<typeof RaceCacheSchema>;
