import { z } from 'zod';
import { QueryResponseSchema } from './query.js';
import { SourceMapSchema } from './sourcebook.js';
import { CreateFeatureProgressionSchema, FeatureProgressionSchema } from './feature.js';

export const RaceIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

export const BaseRaceSchema = z.object({
    name: z.string().min(1, 'Race name is required').max(100, 'Race name must be less than 100 characters').trim(),
    description: z.string().max(10000, 'Description must be less than 10000 characters').nullable(),
    sizeId: z.number().int().positive('Size ID must be a positive integer'),
    speed: z.number().int().min(0, 'Speed must be non-negative').max(1000, 'Speed must be less than 1000'),
    favoredClassId: z.number().int().min(-1, 'Favored class ID must be -1 or greater'),
    editionId: z.number().int().positive('Edition ID must be a positive integer').nullable(),
    isVisible: z.boolean().default(true),
    sources: z.array(SourceMapSchema).nullable(),
    features: z.array(FeatureProgressionSchema).nullable(),
});

export const RaceSummarySchema = BaseRaceSchema.omit({
    features: true,
}).extend({
    id: z.number().int().positive('Race ID must be a positive integer'),
});

export const GetAllRacesResponseSchema = QueryResponseSchema.extend({
    results: z.array(RaceSummarySchema),
});

export const GetRaceResponseSchema = BaseRaceSchema;

export const UpdateRaceSchema = BaseRaceSchema.omit({
    features: true,
}).extend({
    features: z.array(CreateFeatureProgressionSchema).nullable(),
}).partial();

export const CreateRaceSchema = BaseRaceSchema.omit({
    features: true,
}).extend({
    features: z.array(CreateFeatureProgressionSchema).nullable(),
});

export type RaceIdParamRequest = z.infer<typeof RaceIdParamSchema>;
export type CreateRaceRequest = z.infer<typeof CreateRaceSchema>;
export type UpdateRaceRequest = z.infer<typeof UpdateRaceSchema>;
export type RaceInQueryResponse = z.infer<typeof RaceSummarySchema>;
export type GetRaceResponse = z.infer<typeof GetRaceResponseSchema>;
export type GetAllRacesResponse = z.infer<typeof GetAllRacesResponseSchema>;
