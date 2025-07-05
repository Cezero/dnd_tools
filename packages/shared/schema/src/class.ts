import { z } from 'zod';
import { PageQueryResponseSchema, PageQuerySchema } from './query.js';
import { SourceMapSchema } from './sourcebook.js';
import { optionalBooleanParam, optionalIntegerParam } from './utils.js';

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

export const ClassFeatureSchema = z.object({
    slug: z.string().min(1, 'Feature slug is required').max(100, 'Feature slug must be less than 100 characters').trim(),
    description: z.string().max(10000, 'Description must be less than 10000 characters'),
});

export const ClassFeatureMapSchema = z.object({
    classId: z.number().int().positive('Class ID must be a positive integer'),
    featureSlug: z.string().min(1, 'Feature slug is required').max(100, 'Feature slug must be less than 100 characters').trim(),
    level: z.number().int().min(1, 'Level must be at least 1').max(20, 'Level must be at most 20'),
});

export const ClassLevelAttributeSchema = z.object({
    classId: z.number().int().positive('Class ID must be a positive integer'),
    level: z.number().int().min(1, 'Level must be at least 1').max(20, 'Level must be at most 20'),
    baseAttackBonus: z.number().int().min(1, 'Base attack bonus must be at least 1').max(20, 'Base attack bonus must be at most 20'),
    fortSave: z.number().int().min(1, 'Fortitude save must be at least 1').max(10, 'Fortitude save must be at most 10'),
    refSave: z.number().int().min(1, 'Reflex save must be at least 1').max(10, 'Reflex save must be at most 10'),
    willSave: z.number().int().min(1, 'Will save must be at least 1').max(10, 'Will save must be at most 10'),
});

export const ClassSpellProgressionSchema = z.object({
    classId: z.number().int().positive('Class ID must be a positive integer'),
    level: z.number().int().min(1, 'Level must be at least 1').max(20, 'Level must be at most 20'),
    spellLevel: z.number().int().min(1, 'Spell level must be at least 1').max(9, 'Spell level must be at most 9'),
    spellSlots: z.number().int().min(1, 'Spell slots must be non-negative').max(10, 'Spell slots must be at most 10'),
});

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
    description: z.string().max(10000, 'Description must be less than 10000 characters').nullable(),
    sourceBookInfo: z.array(SourceMapSchema).nullable(),
    features: z.array(ClassFeatureMapSchema).nullable(),
    attributes: z.array(ClassLevelAttributeSchema).nullable(),
    spellProgression: z.array(ClassSpellProgressionSchema).nullable(),
    skills: z.array(ClassSkillSchema).nullable(),
});
// Schema for class path parameters
export const ClassIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

export const ClassSummarySchema = BaseClassSchema.omit({
    features: true,
    attributes: true,
    spellProgression: true,
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
