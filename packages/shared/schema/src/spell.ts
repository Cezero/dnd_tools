import { z } from 'zod';

// Schema for spell query parameters
export const SpellQuerySchema = z.object({
    page: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : 1),
    limit: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : 10),
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

// Nested relationship schemas for Prisma compatibility
const SpellSchoolMapSchema = z.object({
    schoolId: z.number().int().positive(),
});

const SpellSubschoolMapSchema = z.object({
    schoolId: z.number().int().positive(),
});

const SpellDescriptorMapSchema = z.object({
    descriptorId: z.number().int().positive(),
});

const SpellComponentMapSchema = z.object({
    componentId: z.number().int().positive(),
});

// Schema for updating a spell - aligned with Prisma Spell model and nested relationships
export const UpdateSpellSchema = z.object({
    // Required fields from Prisma model
    name: z.string().min(1, 'Spell name is required').max(200, 'Spell name must be less than 200 characters').optional(),
    editionId: z.number().int().positive('Edition ID must be a positive integer').optional(),
    baseLevel: z.number().int().min(0, 'Base level must be non-negative').max(20, 'Base level must be at most 20').optional(),

    // Optional fields from Prisma model
    summary: z.string().max(1000, 'Summary must be less than 1000 characters').optional(),
    description: z.string().max(10000, 'Description must be less than 10000 characters').optional(),
    castingTime: z.string().max(200, 'Casting time must be less than 200 characters').optional(),
    range: z.string().max(200, 'Range must be less than 200 characters').optional(),
    rangeTypeId: z.number().int().positive('Range type ID must be a positive integer').optional(),
    rangeValue: z.string().max(100, 'Range value must be less than 100 characters').optional(),
    area: z.string().max(200, 'Area must be less than 200 characters').optional(),
    duration: z.string().max(200, 'Duration must be less than 200 characters').optional(),
    savingThrow: z.string().max(200, 'Saving throw must be less than 200 characters').optional(),
    spellResistance: z.string().max(200, 'Spell resistance must be less than 200 characters').optional(),
    effect: z.string().max(500, 'Effect must be less than 500 characters').optional(),
    target: z.string().max(200, 'Target must be less than 200 characters').optional(),

    // Nested relationship fields for Prisma compatibility
    schools: z.object({
        deleteMany: z.object({}).optional(),
        create: z.array(SpellSchoolMapSchema).optional(),
    }).optional(),
    subschools: z.object({
        deleteMany: z.object({}).optional(),
        create: z.array(SpellSubschoolMapSchema).optional(),
    }).optional(),
    descriptors: z.object({
        deleteMany: z.object({}).optional(),
        create: z.array(SpellDescriptorMapSchema).optional(),
    }).optional(),
    components: z.object({
        deleteMany: z.object({}).optional(),
        create: z.array(SpellComponentMapSchema).optional(),
    }).optional(),
});

// Type inference from schemas
export type SpellQueryRequest = z.infer<typeof SpellQuerySchema>;
export type SpellQueryRaw = z.input<typeof SpellQuerySchema>; // Raw string values for Express
export type SpellIdParamRequest = z.infer<typeof SpellIdParamSchema>;
export type UpdateSpellRequest = z.infer<typeof UpdateSpellSchema>; 