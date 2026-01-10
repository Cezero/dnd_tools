import { z } from 'zod';
import { QueryResponseSchema } from './query.js';
import { SourceMapSchema } from './sourcebook.js';
import { AlignmentId } from '@shared/static-data';

export const DeityIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

// FavoredWeaponSchema and LocalDomainSummarySchema removed - use domainIds and favoredWeaponIds instead
// Frontend should resolve entity names from domains-cache and items-cache

export const BaseDeitySchema = z.object({
    name: z.string()
        .min(1, 'Deity name is required')
        .max(200, 'Deity name must be less than 200 characters')
        .trim(),
    title: z.string()
        .max(200, 'Deity title must be less than 200 characters')
        .nullable(),
    alignmentId: z.enum(AlignmentId),
    description: z.string().max(10000, 'Description must be less than 10000 characters').nullable(),
    editionId: z.number().int().positive('Edition ID must be a positive integer'),
    isVisible: z.boolean().default(true),
    pantheonId: z.number().int().positive('Pantheon ID must be a positive integer').nullable(),
    sourceBookInfo: z.array(SourceMapSchema).nullable(),
    classIds: z.array(z.number().int().positive()).nullable(),
    raceIds: z.array(z.number().int().positive()).nullable(),
    domainIds: z.array(z.number().int().positive()).nullable(),
    favoredWeaponIds: z.array(z.number().int().positive()).nullable(),
});

export const DeitySchema = BaseDeitySchema.extend({
    id: z.number().int().positive('Deity ID must be a positive integer'),
});

export const DeitySummarySchema = DeitySchema.omit({
    description: true,
    classIds: true,
    raceIds: true,
    domainIds: true,
    favoredWeaponIds: true,
});

export const DeityCacheSchema = DeitySummarySchema.omit({
    sourceBookInfo: true,
    alignmentId: true,
    title: true,
});

export const DeityCacheResponseSchema = QueryResponseSchema.extend({
    results: z.array(DeityCacheSchema),
});

export const DeityInQueryResponseSchema = DeitySummarySchema;

export const DeityQueryResponseSchema = QueryResponseSchema.extend({
    results: z.array(DeitySchema),
});

export const GetAllDeitiesResponseSchema = QueryResponseSchema.extend({
    results: z.array(DeityInQueryResponseSchema),
});

export const CreateDeitySchema = BaseDeitySchema;

export const UpdateDeitySchema = CreateDeitySchema.partial();

export type DeityIdParamRequest = z.infer<typeof DeityIdParamSchema>;
export type DeityInQueryResponse = z.infer<typeof DeityInQueryResponseSchema>;
export type CreateDeityRequest = z.infer<typeof CreateDeitySchema>;
export type UpdateDeityRequest = z.infer<typeof UpdateDeitySchema>;

export type GetAllDeitiesResponse = z.infer<typeof GetAllDeitiesResponseSchema>;
export type DeityQueryResponse = z.infer<typeof DeityQueryResponseSchema>;
export type Deity = z.infer<typeof DeitySchema>;
export type DeitySummary = z.infer<typeof DeitySummarySchema>;

export type DeityCacheResponse = z.infer<typeof DeityCacheResponseSchema>;
export type DeityCacheEntry = z.infer<typeof DeityCacheSchema>;
