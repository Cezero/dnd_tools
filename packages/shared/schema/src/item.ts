import { z } from 'zod';
import { PageQueryResponseSchema, PageQuerySchema } from './query.js';
import { optionalStringParam, optionalIntegerParam } from './utils.js';

// Query schema for items
export const ItemQuerySchema = PageQuerySchema.extend({
    name: optionalStringParam(),
    typeId: optionalIntegerParam(),
    cost: optionalStringParam(),
    weight: optionalStringParam(),
});

export const ItemIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

// Base Item schema (matches Prisma Item)
export const BaseItemSchema = z.object({
    name: z.string().min(1, 'Item name is required').max(100, 'Item name must be less than 100 characters').trim(),
    description: z.string().max(10000, 'Description must be less than 10000 characters').nullable(),
    typeId: z.number().int().positive('Item type ID must be a positive integer'),
    cost: z.string().nullable().optional(), // Decimal as string for transport
    weight: z.union([z.string(), z.number(), z.null()]).transform((val) => {
        if (val === null || val === undefined || val === '') return null;
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return isNaN(num) ? null : num;
    }).pipe(z.number().min(0, 'Weight must be non-negative').max(999.99, 'Weight must be less than 1000').nullable()),
    quantity: z.number().int().min(0, 'Quantity must be non-negative').nullable().optional(),
});

export const ItemSchema = BaseItemSchema.extend({
    id: z.number().int().positive('Item ID must be a positive integer'),
});

// Armor schema (matches Prisma Armor)
export const ArmorSchema = z.object({
    category: z.number().int(),
    bonus: z.number().int().nullable(),
    dexterityCap: z.number().int().nullable(),
    checkPenalty: z.number().int().nullable(),
    arcaneSpellFailure: z.number().int().nullable(),
    speedCapThirty: z.number().int().nullable(),
    speedCapTwenty: z.number().int().nullable(),
});

// Weapon schema (matches Prisma Weapon)
export const WeaponSchema = z.object({
    category: z.number().int(),
    type: z.number().int(),
    attackBonus: z.number().int().nullable(),
    damageSmall: z.string().nullable(),
    damageMedium: z.string().nullable(),
    critical: z.string().nullable(),
    range: z.string().nullable(),
    damageType: z.string().nullable(),
    reach: z.boolean().default(false),
    double: z.boolean().default(false),
    nonlethal: z.boolean().default(false),
});

// Extended Item schema with armor/weapon
export const ItemWithDetailsSchema = ItemSchema.extend({
    armor: ArmorSchema.nullable(),
    weapon: WeaponSchema.nullable(),
});

export const ItemQueryResponseSchema = PageQueryResponseSchema.extend({
    results: z.array(ItemWithDetailsSchema),
});

export const GetAllItemsResponseSchema = z.array(ItemWithDetailsSchema);

export const CreateItemSchema = BaseItemSchema.extend({
    armor: ArmorSchema.nullable().optional(),
    weapon: WeaponSchema.nullable().optional(),
});

export const UpdateItemSchema = CreateItemSchema.partial();

// Types
export type ItemQueryRequest = z.infer<typeof ItemQuerySchema>;
export type ItemIdParamRequest = z.infer<typeof ItemIdParamSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type Armor = z.infer<typeof ArmorSchema>;
export type Weapon = z.infer<typeof WeaponSchema>;
export type ItemWithDetails = z.infer<typeof ItemWithDetailsSchema>;
export type ItemQueryResponse = z.infer<typeof ItemQueryResponseSchema>;
export type GetAllItemsResponse = z.infer<typeof GetAllItemsResponseSchema>;
export type CreateItemRequest = z.infer<typeof CreateItemSchema>;
export type UpdateItemRequest = z.infer<typeof UpdateItemSchema>; 
