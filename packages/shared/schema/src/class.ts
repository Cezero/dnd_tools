import { z } from 'zod';
import { QueryResponseSchema } from './query.js';
import { SourceMapSchema } from './sourcebook.js';
import { ProgressionType } from '@shared/static-data';
import { FeatureSchema } from './feature.js';
import { SpellcastingProgressionSchema } from './spellcasting.js';

// Enum schemas
export const CastingTypeEnumSchema = z.enum(['Prepared', 'Spontaneous']);



export const BaseClassSchema = z.object({
    name: z.string()
        .min(1, 'Class name is required')
        .max(100, 'Class name must be less than 100 characters')
        .trim(),
    abbreviation: z.string()
        .min(1, 'Class abbreviation is required')
        .max(10, 'Class abbreviation must be less than 10 characters')
        .trim(),
    editionId: z.number().int().positive('Edition ID must be a positive integer').nullable(),
    isPrestige: z.boolean().default(false),
    isVisible: z.boolean().default(true),
    canCastSpells: z.boolean().default(false),
    hitDie: z.number().int().min(0, 'Hit die must be at least 0').max(20, 'Hit die must be at most 20'),
    skillPoints: z.number().int().min(0, 'Skill points must be non-negative').max(100, 'Skill points must be less than 100'),
    castingAbilityId: z.number().int().positive('Casting ability ID must be a positive integer').nullable(),
    castingType: CastingTypeEnumSchema.nullable(),
    babProgression: z.nativeEnum(ProgressionType),
    fortProgression: z.nativeEnum(ProgressionType),
    refProgression: z.nativeEnum(ProgressionType),
    willProgression: z.nativeEnum(ProgressionType),
    description: z.string().max(10000, 'Description must be less than 10000 characters').nullable(),
    sourceBookInfo: z.array(SourceMapSchema).nullable(),
    features: z.array(FeatureSchema).nullable(),
    spellcastingProgression: z.array(SpellcastingProgressionSchema).nullable(),
});

export const ClassIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

export const ClassSummarySchema = BaseClassSchema.omit({
    features: true,
    spellcastingProgression: true,
}).extend({
    id: z.number().int().positive('Class ID must be a positive integer'),
});

export const GetAllClassesResponseSchema = QueryResponseSchema.extend({
    results: z.array(ClassSummarySchema),
});

export const GetClassResponseSchema = BaseClassSchema;

export const UpdateClassSchema = BaseClassSchema.partial();

export const CreateClassSchema = BaseClassSchema;

// Enum type exports
export type CastingType = z.infer<typeof CastingTypeEnumSchema>;

export type ClassInQueryResponse = z.infer<typeof ClassSummarySchema>;
export type ClassIdParamRequest = z.infer<typeof ClassIdParamSchema>;
export type GetAllClassesResponse = z.infer<typeof GetAllClassesResponseSchema>;
export type CreateClassRequest = z.infer<typeof CreateClassSchema>;
export type UpdateClassRequest = z.infer<typeof UpdateClassSchema>;
export type GetClassResponse = z.infer<typeof GetClassResponseSchema>;
