import { z } from 'zod';

import { numericParam, optionalBooleanParam, optionalIntegerParam, commonValidations } from './common.js';
import { QueryResponseSchema } from './query.js';
import { SourceMapSchema } from './sourcebook.js';

// Monster relationship schemas
export const MonsterTypeMapSchema = z.object({
    typeId: z.number().int().nonnegative('Type ID must be a positive integer'),
});

export const MonsterSubtypeMapSchema = z.object({
    subtypeId: z.number().int().nonnegative('Subtype ID must be a positive integer'),
});

export const MonsterSkillMapSchema = z.object({
    id: commonValidations.positiveInt('ID'),
    skillId: commonValidations.positiveInt('Skill ID'),
    skillSubId: commonValidations.positiveInt('Skill Sub ID').nullable(),
    ranks: z.number().int().nullable(), // Can be negative (penalties)
    notes: z.string().nullable(),
});

export const MonsterFeatMapSchema = z.object({
    id: commonValidations.positiveInt('ID'),
    featId: commonValidations.positiveInt('Feat ID'),
    notes: z.string().max(128, 'Notes must be less than 128 characters').nullable(),
});

export const MonsterSpecialAbilitySchema = z.object({
    id: commonValidations.positiveInt('ID'),
    name: commonValidations.name(),
    // TEXT in MySQL; several MM abilities exceed the 2000-char common description helper
    description: z.string().nullable(),
    abilityType: commonValidations.positiveInt('Ability type'),
    effectiveCasterLevel: commonValidations.positiveInt('Effective caster level').nullable(),
    saveAbility: commonValidations.positiveInt('Save ability').nullable(),
});

export const MonsterSpecialAbilityMapSchema = z.object({
    abilityId: commonValidations.positiveInt('Ability ID'),
    ability: MonsterSpecialAbilitySchema.nullable(),
});

export const MonsterArmorBreakdownSchema = z.object({
    id: commonValidations.positiveInt('ID'),
    componentType: commonValidations.positiveInt('Component type'),
    value: z.number().int().nullable(),
    equipmentItemId: commonValidations.positiveInt('Equipment item ID').nullable(),
    description: z.string().nullable(),
});

export const MonsterEquipmentSchema = z.object({
    itemId: commonValidations.positiveInt('Item ID'),
});

export const MonsterSpellSchema = z.object({
    id: commonValidations.positiveInt('ID'),
    spellId: commonValidations.positiveInt('Spell ID'),
    spellType: commonValidations.positiveInt('Spell type'),
    quantity: commonValidations.positiveInt('Quantity').nullable(),
    usesPerDayId: commonValidations.positiveInt('Uses per day ID').nullable(),
    saveDC: z.number().int().nullable(),
    level: commonValidations.nonNegativeInt('Level', 9).nullable(),
    specialAbilityId: commonValidations.positiveInt('Special ability ID').nullable(),
    notes: z.string().max(200, 'Notes must be less than 200 characters').nullable(),
});

export const MonsterPreparedSpellSlotsSchema = z.object({
    id: commonValidations.positiveInt('ID'),
    spellLevel: commonValidations.nonNegativeInt('Spell level', 9),
    numSlots: commonValidations.positiveInt('Number of slots'),
});

export const MonsterExtraHitDieSchema = z.object({
    id: commonValidations.positiveInt('ID'),
    hitDiceQty: z.number(),
    hitDiceType: commonValidations.nonNegativeInt('Hit dice type'), // Can be 0 (D4)
    bonusHP: z.number().int().nullable(),
});

export const MonsterAlternateSpeedSchema = z.object({
    id: commonValidations.positiveInt('ID'),
    movementTypeId: commonValidations.positiveInt('Movement type ID'),
    speed: commonValidations.positiveInt('Speed'),
    maneuverability: commonValidations.positiveInt('Maneuverability').nullable(),
});

export const MonsterDomainMapSchema = z.object({
    domainId: commonValidations.positiveInt('Domain ID'),
});

export const MonsterExtraDescriptionSchema = z.object({
    id: commonValidations.positiveInt('ID'),
    type: commonValidations.positiveInt('Type'),
    description: z.string().nullable(),
});

export const MonsterSourceMapSchema = SourceMapSchema;

// Hierarchy entry schema for variant monsters
export const MonsterHierarchyEntrySchema = z.object({
    id: commonValidations.positiveInt('ID'),
    name: z.string(),
    level: commonValidations.nonNegativeInt('Level'),
    description: z.string().nullable(),
    combatDescription: z.string().nullable(),
    flavorText: z.string().nullable(),
    extraDescriptions: z.array(MonsterExtraDescriptionSchema).nullable(),
    specialAbilities: z.array(MonsterSpecialAbilityMapSchema).nullable(),
});

// Core Monster schema
export const MonsterSchema = z.object({
    id: commonValidations.positiveInt('Monster ID'),
    name: commonValidations.name(),
    baseMonsterId: commonValidations.positiveInt('Base monster ID').nullable(),
    editionId: commonValidations.positiveInt('Edition ID'),
    isVisible: z.boolean().default(true),
    flavorText: z.string().nullable(),
    description: z.string().nullable(),
    combatDescription: z.string().nullable(),
    sizeId: commonValidations.positiveInt('Size ID').nullable(),
    baseSpeed: commonValidations.nonNegativeInt('Base speed').nullable(),
    armorClass: z.number().int().nullable(),
    touchAC: z.number().int().nullable(),
    flatFootedAC: z.number().int().nullable(),
    hitDiceQty: z.number().nullable(),
    hitDiceType: z.number().int().nonnegative('Hit dice type must be non-negative').nullable(), // Can be 0 (D4)
    bonusHP: z.number().int().nullable(),
    averageHP: z.number().int().nullable(),
    initiative: z.number().int().nullable(),
    baseAttack: z.number().int().nullable(),
    grapple: z.number().int().nullable(),
    attack: z.string().nullable(),
    fullAttack: z.string().nullable(),
    space: z.number().nullable(),
    reach: z.number().int().nonnegative('Reach must be non-negative').nullable(),
    optionalReach: z.number().int().nonnegative('Optional reach must be non-negative').nullable(),
    optionalReachDescription: z.string().max(100, 'Optional reach description must be less than 100 characters').nullable(),
    fortSave: z.number().int().nullable(),
    refSave: z.number().int().nullable(),
    willSave: z.number().int().nullable(),
    strength: z.number().int().nullable(),
    dexterity: z.number().int().nullable(),
    constitution: z.number().int().nullable(),
    intelligence: z.number().int().nullable(),
    wisdom: z.number().int().nullable(),
    charisma: z.number().int().nullable(),
    organization: z.string().nullable(),
    treasure: z.string().nullable(),
    alignment: z.string().max(100, 'Alignment must be less than 100 characters').nullable(),
    advancement: z.string().nullable(),
    challengeRating: z.string().max(100, 'Challenge rating must be less than 100 characters').nullable(),
    levelAdjustment: z.string().max(100, 'Level adjustment must be less than 100 characters').nullable(),
    specialAttacks: z.string().max(512, 'Special attacks must be less than 512 characters').nullable(),
    specialQualities: z.string().max(512, 'Special qualities must be less than 512 characters').nullable(),
    types: z.array(MonsterTypeMapSchema).nullable(),
    subtypes: z.array(MonsterSubtypeMapSchema).nullable(),
    skills: z.array(MonsterSkillMapSchema).nullable(),
    feats: z.array(MonsterFeatMapSchema).nullable(),
    specialAbilities: z.array(MonsterSpecialAbilityMapSchema).nullable(),
    armorBreakdown: z.array(MonsterArmorBreakdownSchema).nullable(),
    equipment: z.array(MonsterEquipmentSchema).nullable(),
    spells: z.array(MonsterSpellSchema).nullable(),
    preparedSpellSlots: z.array(MonsterPreparedSpellSlotsSchema).nullable(),
    extraHitDice: z.array(MonsterExtraHitDieSchema).nullable(),
    alternateSpeeds: z.array(MonsterAlternateSpeedSchema).nullable(),
    domains: z.array(MonsterDomainMapSchema).nullable(),
    extraDescriptions: z.array(MonsterExtraDescriptionSchema).nullable(),
    sourceBookInfo: z.array(MonsterSourceMapSchema).nullable(),
});

// Response schemas
export const GetAllMonstersResponseSchema = QueryResponseSchema.extend({
    results: z.array(MonsterSchema),
});

export const GetAllMonstersQuerySchema = z.object({
    includeStatblockOnly: optionalBooleanParam(),
    typeId: optionalIntegerParam(),
});

export const GetMonsterResponseSchema = MonsterSchema.omit({
    id: true,
}).extend({
    hierarchyData: z.array(MonsterHierarchyEntrySchema).nullable(),
});

export const UpdateMonsterSchema = MonsterSchema.omit({
    id: true,
}).partial();

export const MonsterIdParamSchema = z.object({
    id: numericParam(),
});

export const MonsterCacheSchema = MonsterSchema.pick({
    id: true,
    name: true,
    editionId: true,
    isVisible: true,
}).extend({
    typeIds: z.array(z.number().int().nonnegative()).default([]), // Array of monster type IDs
});

export const MonsterCacheResponseSchema = QueryResponseSchema.extend({
    results: z.array(MonsterCacheSchema),
});

// Type exports
export type MonsterIdParamRequest = z.infer<typeof MonsterIdParamSchema>;
export type GetAllMonstersQueryRequest = z.infer<typeof GetAllMonstersQuerySchema>;
export type UpdateMonsterRequest = z.infer<typeof UpdateMonsterSchema>;
export type GetMonsterResponse = z.infer<typeof GetMonsterResponseSchema>;
export type GetAllMonstersResponse = z.infer<typeof GetAllMonstersResponseSchema>;
export type Monster = z.infer<typeof MonsterSchema>;
export type MonsterTypeMap = z.infer<typeof MonsterTypeMapSchema>;
export type MonsterSubtypeMap = z.infer<typeof MonsterSubtypeMapSchema>;
export type MonsterSkillMap = z.infer<typeof MonsterSkillMapSchema>;
export type MonsterFeatMap = z.infer<typeof MonsterFeatMapSchema>;
export type MonsterSpecialAbility = z.infer<typeof MonsterSpecialAbilitySchema>;
export type MonsterSpecialAbilityMap = z.infer<typeof MonsterSpecialAbilityMapSchema>;
export type MonsterArmorBreakdown = z.infer<typeof MonsterArmorBreakdownSchema>;
export type MonsterEquipment = z.infer<typeof MonsterEquipmentSchema>;
export type MonsterSpell = z.infer<typeof MonsterSpellSchema>;
export type MonsterPreparedSpellSlots = z.infer<typeof MonsterPreparedSpellSlotsSchema>;
export type MonsterExtraHitDie = z.infer<typeof MonsterExtraHitDieSchema>;
export type MonsterAlternateSpeed = z.infer<typeof MonsterAlternateSpeedSchema>;
export type MonsterDomainMap = z.infer<typeof MonsterDomainMapSchema>;
export type MonsterExtraDescription = z.infer<typeof MonsterExtraDescriptionSchema>;
export type MonsterSourceMap = z.infer<typeof MonsterSourceMapSchema>;
export type MonsterHierarchyEntry = z.infer<typeof MonsterHierarchyEntrySchema>;
export type MonsterCacheResponse = z.infer<typeof MonsterCacheResponseSchema>;
export type MonsterCacheEntry = z.infer<typeof MonsterCacheSchema>;

