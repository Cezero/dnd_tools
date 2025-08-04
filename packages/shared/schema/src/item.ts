import { z } from 'zod';
import { QueryResponseSchema } from './query.js';
import { Decimal } from 'decimal.js';

// Enum schemas
export const ItemPropertyTypeEnumSchema = z.enum(['Material', 'Enhancement', 'SpecialAbility', 'Structural']);
export const ItemApplicableTypeEnumSchema = z.enum(['Weapon', 'Armor', 'Shield', 'MountArmor', 'Ammunition']);

export const ItemIdParamSchema = z.object({
  id: z.string().transform((val: string) => parseInt(val)),
});

export const ItemQueryTypeSchema = z.enum(['byType', 'byCategory', 'byName']);

export const ItemQuerySchema = z.discriminatedUnion('queryType', [
  z.object({
    queryType: z.literal(ItemQueryTypeSchema.enum.byType),
    typeId: z.string().transform((val: string) => parseInt(val))
  }),
  z.object({
    queryType: z.literal(ItemQueryTypeSchema.enum.byCategory),
    typeId: z.string().transform((val: string) => parseInt(val)),
    category: z.string().transform((val: string) => parseInt(val))
  }),
  z.object({
    queryType: z.literal(ItemQueryTypeSchema.enum.byName),
    name: z.string().min(1)
  })
]);

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
  id: z.number().int().positive('Item type ID must be a positive integer'),
  name: z.string().min(1, 'Item type name is required').max(100, 'Item type name must be less than 100 characters').trim(),
});

// Item Property schemas
export const ItemPropertySchema = z.object({
  id: z.number().int().positive('Property ID must be a positive integer'),
  name: z.string().min(1, 'Property name is required').max(100, 'Property name must be less than 100 characters').trim(),
  type: ItemPropertyTypeEnumSchema,
  flatCostModifier: z.number().int().nullable(),
  costMultiplier: z.number().nullable(),
  costFormula: z.string().nullable(),
  enhancementBonusValue: z.number().int().nullable(),
  bonusEquivalentModifier: z.number().int().nullable(),
  exclusiveMaterial: z.boolean().default(false),
});

export const ItemPropertyAppliesToSchema = z.object({
  id: z.number().int().positive('Applies to ID must be a positive integer'),
  propertyId: z.number().int().positive('Property ID must be a positive integer'),
  itemType: ItemApplicableTypeEnumSchema,
});

export const ItemPropertyIncompatibilitySchema = z.object({
  id: z.number().int().positive('Incompatibility ID must be a positive integer'),
  propertyAId: z.number().int().positive('Property A ID must be a positive integer'),
  propertyBId: z.number().int().positive('Property B ID must be a positive integer'),
});

// Item Template schemas
export const ItemTemplateSchema = z.object({
  id: z.number().int().positive('Template ID must be a positive integer'),
  name: z.string().min(1, 'Template name is required').max(100, 'Template name must be less than 100 characters').trim(),
  itemId: z.number().int().positive('Item ID must be a positive integer'),
});

export const ItemTemplatePropertySchema = z.object({
  id: z.number().int().positive('Template property ID must be a positive integer'),
  templateId: z.number().int().positive('Template ID must be a positive integer'),
  propertyId: z.number().int().positive('Property ID must be a positive integer'),
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

export type CreateItemRequest = z.infer<typeof CreateItemSchema>;
export type UpdateItemRequest = z.infer<typeof UpdateItemSchema>;
export type ItemQueryRequest = z.infer<typeof ItemQuerySchema>;
