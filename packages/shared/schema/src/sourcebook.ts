import { z } from 'zod';

export const BaseSourceBookSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    abbreviation: z.string().min(1, 'Abbreviation is required'),
    releaseDate: z.date().nullable(),
    editionId: z.number().int().positive('Edition ID must be a positive integer').nullable(),
    description: z.string().nullable(),
    isVisible: z.boolean().default(true),
});

export const SourceBookSchema = BaseSourceBookSchema.extend({
    id: z.number().int().positive('Source book ID must be a positive integer'),
});

export const SourceBookWithSpellsSchema = SourceBookSchema.extend({
    hasSpells: z.boolean().default(false),
});

export const SourceBookIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

export type SourceBookResponse = z.infer<typeof SourceBookSchema>;
export type SourceBookWithSpellsResponse = z.infer<typeof SourceBookWithSpellsSchema>;
export type SourceBookIdParamRequest = z.infer<typeof SourceBookIdParamSchema>;
