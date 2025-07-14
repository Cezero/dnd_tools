import { z } from 'zod';
import { QueryResponseSchema } from './query.js';
import { SourceMapSchema } from './sourcebook.js';
import { SpellProgressionType, ProgressionType } from '@shared/static-data';

export const ClassFeatureSchema = z.object({
    slug: z.string().min(1, 'Feature slug is required').max(100, 'Feature slug must be less than 100 characters').trim(),
    description: z.string().max(10000, 'Description must be less than 10000 characters'),
});

export const ClassFeatureMapSchema = z.object({
    classId: z.number().int().positive('Class ID must be a positive integer'),
    featureSlug: z.string().min(1, 'Feature slug is required').max(100, 'Feature slug must be less than 100 characters').trim(),
    description: z.string().max(10000, 'Description must be less than 10000 characters'),
    level: z.number().int().min(1, 'Level must be at least 1').max(20, 'Level must be at most 20'),
});

export const ClassFeatureSlugParamSchema = z.object({
    slug: z.string(),
});

export const BaseClassFeatureSchema = z.object({
    slug: z.string()
        .min(1, 'Feature slug is required')
        .max(100, 'Feature slug must be less than 100 characters')
        .trim(),
    description: z.string().max(10000, 'Description must be less than 10000 characters'),
});

export const ClassFeatureSummarySchema = BaseClassFeatureSchema.extend({
    slug: z.string(),
});

export const GetAllClassFeaturesResponseSchema = QueryResponseSchema.extend({
    results: z.array(ClassFeatureSummarySchema),
});

export const GetClassFeatureResponseSchema = BaseClassFeatureSchema;

export const UpdateClassFeatureSchema = BaseClassFeatureSchema.partial();

export const CreateClassFeatureSchema = BaseClassFeatureSchema;

export const ClassSkillSchema = z.object({
    classId: z.number().int().positive('Class ID must be a positive integer'),
    skillId: z.number().int().positive('Skill ID must be a positive integer'),
});

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
    hitDie: z.number().int().min(1, 'Hit die must be at least 1').max(20, 'Hit die must be at most 20'),
    skillPoints: z.number().int().min(0, 'Skill points must be non-negative').max(100, 'Skill points must be less than 100'),
    castingAbilityId: z.number().int().positive('Casting ability ID must be a positive integer').nullable(),
    spellProgression: z.nativeEnum(SpellProgressionType).nullable(),
    babProgression: z.nativeEnum(ProgressionType),
    fortProgression: z.nativeEnum(ProgressionType),
    refProgression: z.nativeEnum(ProgressionType),
    willProgression: z.nativeEnum(ProgressionType),
    description: z.string().max(10000, 'Description must be less than 10000 characters').nullable(),
    sourceBookInfo: z.array(SourceMapSchema).nullable(),
    features: z.array(ClassFeatureMapSchema).nullable(),
    skills: z.array(ClassSkillSchema).nullable(),
});

export const ClassIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

export const ClassSummarySchema = BaseClassSchema.omit({
    features: true,
    skills: true,
}).extend({
    id: z.number().int().positive('Class ID must be a positive integer'),
});

export const GetAllClassesResponseSchema = QueryResponseSchema.extend({
    results: z.array(ClassSummarySchema),
});

export const GetClassResponseSchema = BaseClassSchema;

export const UpdateClassSchema = BaseClassSchema.partial();

export const CreateClassSchema = BaseClassSchema;

export type ClassInQueryResponse = z.infer<typeof ClassSummarySchema>;
export type ClassIdParamRequest = z.infer<typeof ClassIdParamSchema>;
export type GetAllClassesResponse = z.infer<typeof GetAllClassesResponseSchema>;
export type CreateClassRequest = z.infer<typeof CreateClassSchema>;
export type UpdateClassRequest = z.infer<typeof UpdateClassSchema>;
export type GetClassResponse = z.infer<typeof GetClassResponseSchema>;

export type ClassFeatureInQueryResponse = z.infer<typeof ClassFeatureSummarySchema>;
export type ClassFeatureSlugParamRequest = z.infer<typeof ClassFeatureSlugParamSchema>;
export type GetAllClassFeaturesResponse = z.infer<typeof GetAllClassFeaturesResponseSchema>;
export type CreateClassFeatureRequest = z.infer<typeof CreateClassFeatureSchema>;
export type UpdateClassFeatureRequest = z.infer<typeof UpdateClassFeatureSchema>;
export type GetClassFeatureResponse = z.infer<typeof GetClassFeatureResponseSchema>;
