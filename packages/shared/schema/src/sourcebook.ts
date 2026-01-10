import { z } from 'zod';
import { QueryResponseSchema } from './query.js';

export const BaseSourceBookSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    abbreviation: z.string().min(1, 'Abbreviation is required'),
    releaseDate: z.date().nullable(),
    editionId: z.number().int().positive('Edition ID must be a positive integer').nullable(),
    description: z.string().nullable(),
    isVisible: z.boolean().default(false),
    settingId: z.number().int().positive('Setting ID must be a positive integer').nullable(),
    hasClasses: z.boolean().default(false),
    hasSpells: z.boolean().default(false),
    hasRaces: z.boolean().default(false),
    hasDomains: z.boolean().default(false),
    hasDeities: z.boolean().default(false),
    hasItems: z.boolean().default(false),
});

export const SourceBookSchema = BaseSourceBookSchema.extend({
    id: z.number().int().positive('Source book ID must be a positive integer'),
});

/**
 * Thin cache schema for SourceBook - includes only essential fields for lookups
 * Excludes: releaseDate, description (large text fields)
 */
export const SourceBookCacheSchema = SourceBookSchema.omit({
    releaseDate: true,
    description: true,
});

export const SourceBookCacheResponseSchema = QueryResponseSchema.extend({
    results: z.array(SourceBookCacheSchema),
});

export const SourceBookWithSpellsSchema = SourceBookSchema.extend({
    hasSpells: z.boolean().default(false),
});

export const SourceMapSchema = z.object({
    sourceBookId: z.number().int().nonnegative('Source Book ID must be a positive integer'),
    pageNumber: z.number().int().nonnegative('Page number must be a positive integer').nullable(),
    sourceBook: z.object({
        id: z.number().int().positive('Source book ID must be a positive integer'),
        abbreviation: z.string().min(1, 'Abbreviation is required'),
    }).nullable().optional(),
});

export const SourceBookIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

export type SourceBook = z.infer<typeof SourceBookSchema>;
export type SourceMap = z.infer<typeof SourceMapSchema>;
export type SourceBookWithSpellsResponse = z.infer<typeof SourceBookWithSpellsSchema>;
export type SourceBookIdParamRequest = z.infer<typeof SourceBookIdParamSchema>;
export type SourceBookCacheEntry = z.infer<typeof SourceBookCacheSchema>;
export type SourceBookCacheResponse = z.infer<typeof SourceBookCacheResponseSchema>;
