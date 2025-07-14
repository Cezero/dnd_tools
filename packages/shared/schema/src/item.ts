import { z } from 'zod';
import { QueryResponseSchema } from './query.js';
import { Decimal } from '@shared/prisma-client/client/runtime/library.js';

export const ItemIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

export const BaseItemSchema = z.object({
    name: z.string().min(1, 'Item name is required').max(100, 'Item name must be less than 100 characters').trim(),
    description: z.string().max(10000, 'Description must be less than 10000 characters').nullable(),
    typeId: z.number().int().positive('Item type ID must be a positive integer'),
    cost: z.string().nullable()
    .transform((val) => {
      if (val === null || val.trim() === '') return null;
      return new Decimal(val);
    })
    .refine((val) => val === null || (val.gte(0) && val.lte(999999.99)), {
      message: 'Cost must be between 0 and 999999.99',
    }).optional(),
    weight: z
    .string()
    .nullable()
    .transform((val) => {
      if (val === null || val.trim() === '') return null;
      return new Decimal(val);
    })
    .refine((val) => val === null || (val.gte(0) && val.lte(999.99)), {
      message: 'Weight must be between 0 and 999.99',
    }).optional(),
    quantity: z.number().int().min(0, 'Quantity must be non-negative').nullable().optional(),
});

export const ItemSchema = BaseItemSchema.extend({
    id: z.number().int().positive('Item ID must be a positive integer'),
});

export const ArmorSchema = z.object({
    category: z.number().int(),
    bonus: z.number().int().nullable(),
    dexterityCap: z.number().int().nullable(),
    checkPenalty: z.number().int().nullable(),
    arcaneSpellFailure: z.number().int().nullable(),
    speedCapThirty: z.number().int().nullable(),
    speedCapTwenty: z.number().int().nullable(),
});

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

export const ItemWithDetailsSchema = ItemSchema.extend({
    armor: ArmorSchema.nullable(),
    weapon: WeaponSchema.nullable(),
});

export const GetAllItemsResponseSchema = QueryResponseSchema.extend({
    results: z.array(ItemWithDetailsSchema),
});

export const CreateItemSchema = BaseItemSchema.extend({
    armor: ArmorSchema.nullable().optional(),
    weapon: WeaponSchema.nullable().optional(),
});

export const UpdateItemSchema = CreateItemSchema.partial();

export type ItemIdParamRequest = z.infer<typeof ItemIdParamSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type Armor = z.infer<typeof ArmorSchema>;
export type Weapon = z.infer<typeof WeaponSchema>;
export type ItemWithDetails = z.infer<typeof ItemWithDetailsSchema>;
export type GetAllItemsResponse = z.infer<typeof GetAllItemsResponseSchema>;
export type CreateItemRequest = z.infer<typeof CreateItemSchema>;
export type UpdateItemRequest = z.infer<typeof UpdateItemSchema>; 
