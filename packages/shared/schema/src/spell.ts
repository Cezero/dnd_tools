import { z } from 'zod';
import { PageQueryResponseSchema, PageQuerySchema } from './query.js';

// Nested relationship schemas for Prisma compatibility
export const SpellSchoolMapSchema = z.object({
    spellId: z.number().int().positive('Spell ID must be a positive integer'),
    schoolId: z.number().int().positive('School ID must be a positive integer'),
});

export const SpellSubschoolMapSchema = z.object({
    spellId: z.number().int().positive('Spell ID must be a positive integer'),
    schoolId: z.number().int().positive('Subschool ID must be a positive integer'),
});

export const SpellDescriptorMapSchema = z.object({
    spellId: z.number().int().positive('Spell ID must be a positive integer'),
    descriptorId: z.number().int().positive('Descriptor ID must be a positive integer'),
});

export const SpellComponentMapSchema = z.object({
    spellId: z.number().int().positive('Spell ID must be a positive integer'),
    componentId: z.number().int().positive('Component ID must be a positive integer'),
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
    schools: z.array(SpellSchoolMapSchema).optional(),
    subschools: z.array(SpellSubschoolMapSchema).optional(),
    descriptors: z.array(SpellDescriptorMapSchema).optional(),
    components: z.array(SpellComponentMapSchema).optional(),
});

export const SpellQueryResponseSchema = PageQueryResponseSchema.extend({
    results: z.array(SpellSchema),
});

// Schema for spell query parameters
export const SpellQuerySchema = PageQuerySchema.extend({
    name: z.string().optional(),
    editionId: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : undefined),
    spellLevel: z.union([z.string(), z.array(z.string())]).optional().transform((val) => {
        if (!val) return undefined;
        if (Array.isArray(val)) {
            return val.map(v => parseInt(v));
        }
        return [parseInt(val)];
    }),
    classId: z.union([z.string(), z.array(z.string())]).optional().transform((val) => {
        if (!val) return undefined;
        if (Array.isArray(val)) {
            return val.map(v => parseInt(v));
        }
        return [parseInt(val)];
    }),
    schools: z.union([z.string(), z.array(z.string())]).optional().transform((val) => {
        if (!val) return undefined;
        if (Array.isArray(val)) {
            return val.map(v => parseInt(v));
        }
        return [parseInt(val)];
    }),
    descriptors: z.union([z.string(), z.array(z.string())]).optional().transform((val) => {
        if (!val) return undefined;
        if (Array.isArray(val)) {
            return val.map(v => parseInt(v));
        }
        return [parseInt(val)];
    }),
    source: z.union([z.string(), z.array(z.string())]).optional(),
    components: z.union([z.string(), z.array(z.string())]).optional().transform((val) => {
        if (!val) return undefined;
        if (Array.isArray(val)) {
            return val.map(v => parseInt(v));
        }
        return [parseInt(val)];
    }),
});

// Schema for spell path parameters
export const SpellIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

export const UpdateSpellSchema = SpellSchema.partial();

// Type inference from schemas
export type SpellQueryRequest = z.infer<typeof SpellQuerySchema>;
export type SpellIdParamRequest = z.infer<typeof SpellIdParamSchema>;
export type UpdateSpellRequest = z.infer<typeof UpdateSpellSchema>; 
export type SpellResponse = z.infer<typeof SpellSchema>;
export type SpellQueryResponse = z.infer<typeof SpellQueryResponseSchema>;
export type SpellSchoolMap = z.infer<typeof SpellSchoolMapSchema>;
export type SpellSubschoolMap = z.infer<typeof SpellSubschoolMapSchema>;
export type SpellDescriptorMap = z.infer<typeof SpellDescriptorMapSchema>;
export type SpellComponentMap = z.infer<typeof SpellComponentMapSchema>;