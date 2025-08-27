import { z } from 'zod';
import { QueryResponseSchema } from './query.js';
import { SourceMapSchema } from './sourcebook.js';

export const SpellSchoolMapSchema = z.object({
    schoolId: z.number().int().nonnegative('School ID must be a positive integer'),
});

export const SpellSubschoolMapSchema = z.object({
    subSchoolId: z.number().int().nonnegative('Subschool ID must be a positive integer'),
});

export const SpellDescriptorMapSchema = z.object({
    descriptorId: z.number().int().nonnegative('Descriptor ID must be a positive integer'),
});

export const SpellComponentMapSchema = z.object({
    componentId: z.number().int().nonnegative('Component ID must be a positive integer'),
});

export const SpellLevelMappingSchema = z.object({
    classId: z.number().int().positive('Class ID must be a positive integer'),
    level: z.number().int().min(0, 'Level must be non-negative').max(9, 'Level must be at most 9'),
});

export const SpellSchema = z.object({
    id: z.number().int().positive('Spell ID must be a positive integer'),
    name: z.string().min(1, 'Spell name is required').max(200, 'Spell name must be less than 200 characters').trim(),
    editionId: z.number().int().positive('Edition ID must be a positive integer'),
    baseLevel: z.number().int().min(0, 'Base level must be non-negative').max(20, 'Base level must be at most 20'),
    summary: z.string().max(1000, 'Summary must be less than 1000 characters').nullable(),
    description: z.string().max(10000, 'Description must be less than 10000 characters').nullable(),
    castingTime: z.string().max(200, 'Casting time must be less than 200 characters').nullable(),
    range: z.string().max(200, 'Range must be less than 200 characters').nullable(),
    rangeTypeId: z.number().int().positive('Range type ID must be a positive integer').nullable(),
    rangeValue: z.string().max(100, 'Range value must be less than 100 characters').nullable(),
    area: z.string().max(200, 'Area must be less than 200 characters').nullable(),
    duration: z.string().max(200, 'Duration must be less than 200 characters').nullable(),
    savingThrow: z.string().max(200, 'Saving throw must be less than 200 characters').nullable(),
    spellResistance: z.string().max(200, 'Spell resistance must be less than 200 characters').nullable(),
    effect: z.string().max(500, 'Effect must be less than 500 characters').nullable(),
    target: z.string().max(200, 'Target must be less than 200 characters').nullable(),
    schoolIds: z.array(SpellSchoolMapSchema).nullable(),
    subSchoolIds: z.array(SpellSubschoolMapSchema).nullable(),
    descriptorIds: z.array(SpellDescriptorMapSchema).nullable(),
    componentIds: z.array(SpellComponentMapSchema).nullable(),
    levelMapping: z.array(SpellLevelMappingSchema).nullable(),
    sourceBookInfo: z.array(SourceMapSchema).nullable(),
});

export const GetAllSpellsResponseSchema = QueryResponseSchema.extend({
    results: z.array(SpellSchema),
});

export const SpellIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

export const UpdateSpellSchema = SpellSchema.omit({
    id: true
}).partial();

export const GetSpellResponseSchema = SpellSchema.omit({
    id: true
});

export type SpellIdParamRequest = z.infer<typeof SpellIdParamSchema>;
export type UpdateSpellRequest = z.infer<typeof UpdateSpellSchema>;
export type GetSpellResponse = z.infer<typeof GetSpellResponseSchema>;
export type GetAllSpellsResponse = z.infer<typeof GetAllSpellsResponseSchema>;
export type Spell = z.infer<typeof SpellSchema>;
export type SpellSchoolMap = z.infer<typeof SpellSchoolMapSchema>;
export type SpellSubschoolMap = z.infer<typeof SpellSubschoolMapSchema>;
export type SpellDescriptorMap = z.infer<typeof SpellDescriptorMapSchema>;
export type SpellComponentMap = z.infer<typeof SpellComponentMapSchema>;
export type SpellLevelMapping = z.infer<typeof SpellLevelMappingSchema>;
