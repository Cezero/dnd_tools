import { z } from 'zod';
import { PageQueryResponseSchema, PageQuerySchema } from './query.js';
import { SourceMapSchema } from './sourcebook.js';
import { optionalBooleanParam, optionalIntegerParam } from './utils.js';
import { SpellProgressionType, ProgressionType } from '@shared/static-data';

// Schema for class query parameters
export const ClassQuerySchema = PageQuerySchema.extend({
    name: z.string().optional(),
    abbreviation: z.string().optional(),
    editionId: optionalIntegerParam(),
    isPrestige: optionalBooleanParam(),
    isVisible: optionalBooleanParam(),
    canCastSpells: optionalBooleanParam(),
    hitDie: optionalIntegerParam(),
    skillPoints: optionalIntegerParam(),
    castingAbilityId: optionalIntegerParam(),
    sourceId: z.union([z.string(), z.array(z.string())]).optional().transform((val) => {
        if (!val) return undefined;
        if (Array.isArray(val)) {
            return val.map(v => parseInt(v));
        }
        return [parseInt(val)];
    }),
});

// Schema for class feature query parameters
export const ClassFeatureQuerySchema = PageQuerySchema.extend({
    slug: z.string().optional(),
    description: z.string().optional(),
});

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

// Schema for class feature path parameters
export const ClassFeatureSlugParamSchema = z.object({
    slug: z.string(),
});

// Schema for class feature base
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

export const ClassFeatureQueryResponseSchema = PageQueryResponseSchema.extend({
    results: z.array(ClassFeatureSummarySchema),
});

export const GetAllClassFeaturesResponseSchema = z.array(ClassFeatureSummarySchema);

export const GetClassFeatureResponseSchema = BaseClassFeatureSchema;

export const UpdateClassFeatureSchema = BaseClassFeatureSchema.partial();

export const CreateClassFeatureSchema = BaseClassFeatureSchema;

export const ClassSkillSchema = z.object({
    classId: z.number().int().positive('Class ID must be a positive integer'),
    skillId: z.number().int().positive('Skill ID must be a positive integer'),
});

// Schema for class base
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
// Schema for class path parameters
export const ClassIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

export const ClassSummarySchema = BaseClassSchema.omit({
    features: true,
    skills: true,
}).extend({
    id: z.number().int().positive('Class ID must be a positive integer'),
});

export const ClassQueryResponseSchema = PageQueryResponseSchema.extend({
    results: z.array(ClassSummarySchema),
});

export const GetAllClassesResponseSchema = z.array(ClassSummarySchema);

export const GetClassResponseSchema = BaseClassSchema;

export const UpdateClassSchema = BaseClassSchema.partial();

export const CreateClassSchema = BaseClassSchema;

// Type inference from schemas
export type ClassQueryRequest = z.infer<typeof ClassQuerySchema>;
export type ClassQueryResponse = z.infer<typeof ClassQueryResponseSchema>;
export type ClassInQueryResponse = z.infer<typeof ClassSummarySchema>;
export type ClassIdParamRequest = z.infer<typeof ClassIdParamSchema>;
export type GetAllClassesResponse = z.infer<typeof GetAllClassesResponseSchema>;
export type CreateClassRequest = z.infer<typeof CreateClassSchema>;
export type UpdateClassRequest = z.infer<typeof UpdateClassSchema>;
export type GetClassResponse = z.infer<typeof GetClassResponseSchema>;

// Class feature type exports
export type ClassFeatureQueryRequest = z.infer<typeof ClassFeatureQuerySchema>;
export type ClassFeatureQueryResponse = z.infer<typeof ClassFeatureQueryResponseSchema>;
export type ClassFeatureInQueryResponse = z.infer<typeof ClassFeatureSummarySchema>;
export type ClassFeatureSlugParamRequest = z.infer<typeof ClassFeatureSlugParamSchema>;
export type GetAllClassFeaturesResponse = z.infer<typeof GetAllClassFeaturesResponseSchema>;
export type CreateClassFeatureRequest = z.infer<typeof CreateClassFeatureSchema>;
export type UpdateClassFeatureRequest = z.infer<typeof UpdateClassFeatureSchema>;
export type GetClassFeatureResponse = z.infer<typeof GetClassFeatureResponseSchema>;
