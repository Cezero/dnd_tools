import { z } from 'zod';

import { numericParam, commonValidations } from './common.js';
import { QueryResponseSchema } from './query.js';
import { Decimal } from 'decimal.js';

// Enum schemas
export const ItemPropertyTypeEnumSchema = z.enum(['Material', 'Enhancement', 'SpecialAbility', 'Structural']);
export const ItemApplicableTypeEnumSchema = z.enum(['Weapon', 'Armor', 'Shield', 'MountArmor', 'Ammunition']);

export const ItemIdParamSchema = z.object({
  id: numericParam(),
});

export const ItemQueryTypeSchema = z.enum(['byType', 'byCategory', 'byName']);

export const ItemQuerySchema = z.discriminatedUnion('queryType', [
  z.object({
    queryType: z.literal(ItemQueryTypeSchema.enum.byType),
    typeId: numericParam()
  }),
  z.object({
    queryType: z.literal(ItemQueryTypeSchema.enum.byCategory),
    typeId: numericParam(),
    category: numericParam()
  }),
  z.object({
    queryType: z.literal(ItemQueryTypeSchema.enum.byName),
    name: z.string().min(1)
  })
]);

export const BaseItemSchema = z.object({
  name: commonValidations.name(),
  description: commonValidations.description(10000).nullable(),
  typeId: commonValidations.positiveInt('Item type ID'),
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
  quantity: commonValidations.nonNegativeInt('Quantity').nullable().optional(),
  sizeId: commonValidations.positiveInt('Size ID').nullable().default(5), // Default to Medium (5)
});

export const ItemSchema = BaseItemSchema.extend({
  id: z.number().int().refine(val => val === -1 || val > 0, 'Item ID must be -1 (all items) or a positive integer'),
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
// Item Type schemas
export const ItemTypeSchema = z.object({
  id: commonValidations.positiveInt('Item type ID'),
  name: commonValidations.name(),
});

// Item Property schemas
export const ItemPropertySchema = z.object({
  id: commonValidations.positiveInt('Property ID'),
  name: commonValidations.name(),
  type: ItemPropertyTypeEnumSchema,
  flatCostModifier: z.number().int().nullable(),
  costMultiplier: z.number().nullable(),
  costFormula: z.string().nullable(),
  enhancementBonusValue: z.number().int().nullable(),
  bonusEquivalentModifier: z.number().int().nullable(),
  exclusiveMaterial: z.boolean().default(false),
});

export const ItemPropertyAppliesToSchema = z.object({
  id: commonValidations.positiveInt('Applies to ID'),
  propertyId: commonValidations.positiveInt('Property ID'),
  itemType: ItemApplicableTypeEnumSchema,
});

export const ItemPropertyIncompatibilitySchema = z.object({
  id: commonValidations.positiveInt('Incompatibility ID'),
  propertyAId: commonValidations.positiveInt('Property A ID'),
  propertyBId: commonValidations.positiveInt('Property B ID'),
});

// Item Template schemas
export const ItemTemplateSchema = z.object({
  id: commonValidations.positiveInt('Template ID'),
  name: commonValidations.name(),
  itemId: commonValidations.positiveInt('Item ID'),
});

export const ItemTemplatePropertySchema = z.object({
  id: commonValidations.positiveInt('Template property ID'),
  templateId: commonValidations.positiveInt('Template ID'),
  propertyId: commonValidations.positiveInt('Property ID'),
});

// Request/response schemas for item types
export const CreateItemTypeSchema = ItemTypeSchema.omit({ id: true });
export const UpdateItemTypeSchema = ItemTypeSchema.partial().omit({ id: true });

// Request/response schemas for item properties
export const CreateItemPropertySchema = ItemPropertySchema.omit({ id: true });
export const UpdateItemPropertySchema = ItemPropertySchema.partial().omit({ id: true });

// Request/response schemas for item property applies to
export const CreateItemPropertyAppliesToSchema = ItemPropertyAppliesToSchema.omit({ id: true });
export const UpdateItemPropertyAppliesToSchema = ItemPropertyAppliesToSchema.partial().omit({ id: true });

// Request/response schemas for item property incompatibilities
export const CreateItemPropertyIncompatibilitySchema = ItemPropertyIncompatibilitySchema.omit({ id: true });
export const UpdateItemPropertyIncompatibilitySchema = ItemPropertyIncompatibilitySchema.partial().omit({ id: true });

// Request/response schemas for item templates
export const CreateItemTemplateSchema = ItemTemplateSchema.omit({ id: true });
export const UpdateItemTemplateSchema = ItemTemplateSchema.partial().omit({ id: true });

// Request/response schemas for item template properties
export const CreateItemTemplatePropertySchema = ItemTemplatePropertySchema.omit({ id: true });
export const UpdateItemTemplatePropertySchema = ItemTemplatePropertySchema.partial().omit({ id: true });

// Type exports for item types
export type ItemType = z.infer<typeof ItemTypeSchema>;
export type CreateItemTypeRequest = z.infer<typeof CreateItemTypeSchema>;
export type UpdateItemTypeRequest = z.infer<typeof UpdateItemTypeSchema>;

// Type exports for item properties
export type ItemProperty = z.infer<typeof ItemPropertySchema>;
export type CreateItemPropertyRequest = z.infer<typeof CreateItemPropertySchema>;
export type UpdateItemPropertyRequest = z.infer<typeof UpdateItemPropertySchema>;

// Type exports for item property applies to
export type ItemPropertyAppliesTo = z.infer<typeof ItemPropertyAppliesToSchema>;
export type CreateItemPropertyAppliesToRequest = z.infer<typeof CreateItemPropertyAppliesToSchema>;
export type UpdateItemPropertyAppliesToRequest = z.infer<typeof UpdateItemPropertyAppliesToSchema>;

// Type exports for item property incompatibilities
export type ItemPropertyIncompatibility = z.infer<typeof ItemPropertyIncompatibilitySchema>;
export type CreateItemPropertyIncompatibilityRequest = z.infer<typeof CreateItemPropertyIncompatibilitySchema>;
export type UpdateItemPropertyIncompatibilityRequest = z.infer<typeof UpdateItemPropertyIncompatibilitySchema>;

// Type exports for item templates
export type ItemTemplate = z.infer<typeof ItemTemplateSchema>;
export type CreateItemTemplateRequest = z.infer<typeof CreateItemTemplateSchema>;
export type UpdateItemTemplateRequest = z.infer<typeof UpdateItemTemplateSchema>;

// Type exports for item template properties
export type ItemTemplateProperty = z.infer<typeof ItemTemplatePropertySchema>;
// Enum type exports
export type ItemPropertyType = z.infer<typeof ItemPropertyTypeEnumSchema>;
export type ItemApplicableType = z.infer<typeof ItemApplicableTypeEnumSchema>;

export type CreateItemTemplatePropertyRequest = z.infer<typeof CreateItemTemplatePropertySchema>;
export type UpdateItemTemplatePropertyRequest = z.infer<typeof UpdateItemTemplatePropertySchema>;

/**
 * Item Cache Schema
 * 
 * Lightweight schema for item cache endpoint, optimized for dropdowns, select components, and client-side filtering.
 * 
 * **Omitted Fields**: Excludes heavy fields (description, cost, weight, quantity, sizeId) to minimize payload size.
 * 
 * **Extended Fields**: Includes weaponCategory and armorCategory to enable client-side filtering by proficiency type.
 * These fields were added to eliminate the need for server-side query endpoints (e.g., /items/query).
 * 
 * **Usage**: Used by `/items/cache` endpoint and client-side filtering operations in FeatureSystemService.
 * 
 * **Relationship to ItemWithDetailsSchema**: This is a subset of ItemWithDetailsSchema. For full item details
 * including weapon/armor objects, use the `/items` endpoint which returns ItemWithDetailsSchema.
 * 
 * @see ItemWithDetailsSchema for complete item data structure
 * @see [Query Hooks and Caching Architecture](../../docs/application-overview/query-hooks-and-caching.md)
 */
export const ItemCacheSchema = ItemSchema.omit({
  description: true,
  cost: true,
  weight: true,
  quantity: true,
  sizeId: true,
}).extend({
  weaponCategory: z.number().int().nullable(),
  armorCategory: z.number().int().nullable(),
});

export const ItemCacheResponseSchema = QueryResponseSchema.extend({
  results: z.array(ItemCacheSchema),
});

export type CreateItemRequest = z.infer<typeof CreateItemSchema>;
export type UpdateItemRequest = z.infer<typeof UpdateItemSchema>;
export type ItemQueryRequest = z.infer<typeof ItemQuerySchema>;
export type ItemCacheResponse = z.infer<typeof ItemCacheResponseSchema>;
export type ItemCacheEntry = z.infer<typeof ItemCacheSchema>;
