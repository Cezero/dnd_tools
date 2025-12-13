import { z } from 'zod';
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
    id: z.number().int().positive('ID must be a positive integer'),
    skillId: z.number().int().positive('Skill ID must be a positive integer'),
    skillSubId: z.number().int().positive('Skill Sub ID must be a positive integer').nullable(),
    ranks: z.number().int().nullable(), // Can be negative (penalties)
    notes: z.string().nullable(),
});

export const MonsterFeatMapSchema = z.object({
    id: z.number().int().positive('ID must be a positive integer'),
    featId: z.number().int().positive('Feat ID must be a positive integer'),
    notes: z.string().max(128, 'Notes must be less than 128 characters').nullable(),
});

export const MonsterSpecialAbilitySchema = z.object({
    id: z.number().int().positive('ID must be a positive integer'),
    name: z.string().min(1, 'Name is required'),
    description: z.string().nullable(),
    abilityType: z.number().int().positive('Ability type must be a positive integer'),
    effectiveCasterLevel: z.number().int().positive('Effective caster level must be a positive integer').nullable(),
    saveAbility: z.number().int().positive('Save ability must be a positive integer').nullable(),
});

export const MonsterSpecialAbilityMapSchema = z.object({
    abilityId: z.number().int().positive('Ability ID must be a positive integer'),
    ability: MonsterSpecialAbilitySchema.nullable(),
});

export const MonsterArmorBreakdownSchema = z.object({
    id: z.number().int().positive('ID must be a positive integer'),
    componentType: z.number().int().positive('Component type must be a positive integer'),
    value: z.number().int().nullable(),
    equipmentItemId: z.number().int().positive('Equipment item ID must be a positive integer').nullable(),
    description: z.string().nullable(),
});

export const MonsterEquipmentSchema = z.object({
    itemId: z.number().int().positive('Item ID must be a positive integer'),
});

export const MonsterSpellSchema = z.object({
    id: z.number().int().positive('ID must be a positive integer'),
    spellId: z.number().int().positive('Spell ID must be a positive integer'),
    spellType: z.number().int().positive('Spell type must be a positive integer'),
    quantity: z.number().int().positive('Quantity must be a positive integer').nullable(),
    usesPerDayId: z.number().int().positive('Uses per day ID must be a positive integer').nullable(),
    saveDC: z.number().int().nullable(),
    level: z.number().int().min(0, 'Level must be non-negative').max(9, 'Level must be at most 9').nullable(),
    specialAbilityId: z.number().int().positive('Special ability ID must be a positive integer').nullable(),
    notes: z.string().max(200, 'Notes must be less than 200 characters').nullable(),
});

export const MonsterPreparedSpellSlotsSchema = z.object({
    id: z.number().int().positive('ID must be a positive integer'),
    spellLevel: z.number().int().min(0, 'Spell level must be non-negative').max(9, 'Spell level must be at most 9'),
    numSlots: z.number().int().positive('Number of slots must be a positive integer'),
});

export const MonsterExtraHitDieSchema = z.object({
    id: z.number().int().positive('ID must be a positive integer'),
    hitDiceQty: z.number(),
    hitDiceType: z.number().int().nonnegative('Hit dice type must be non-negative'), // Can be 0 (D4)
    bonusHP: z.number().int().nullable(),
});

export const MonsterAlternateSpeedSchema = z.object({
    id: z.number().int().positive('ID must be a positive integer'),
    movementTypeId: z.number().int().positive('Movement type ID must be a positive integer'),
    speed: z.number().int().positive('Speed must be a positive integer'),
    maneuverability: z.number().int().positive('Maneuverability must be a positive integer').nullable(),
});

export const MonsterDomainMapSchema = z.object({
    domainId: z.number().int().positive('Domain ID must be a positive integer'),
});

export const MonsterExtraDescriptionSchema = z.object({
    id: z.number().int().positive('ID must be a positive integer'),
    type: z.number().int().positive('Type must be a positive integer'),
    description: z.string().nullable(),
});

export const MonsterSourceMapSchema = SourceMapSchema;

// Hierarchy entry schema for variant monsters
export const MonsterHierarchyEntrySchema = z.object({
    id: z.number().int().positive('ID must be a positive integer'),
    name: z.string(),
    level: z.number().int().nonnegative('Level must be non-negative'),
    description: z.string().nullable(),
    combatDescription: z.string().nullable(),
    flavorText: z.string().nullable(),
    extraDescriptions: z.array(MonsterExtraDescriptionSchema).nullable(),
    specialAbilities: z.array(MonsterSpecialAbilityMapSchema).nullable(),
});

// Core Monster schema
export const MonsterSchema = z.object({
    id: z.number().int().positive('Monster ID must be a positive integer'),
    name: z.string().min(1, 'Monster name is required'),
    baseMonsterId: z.number().int().positive('Base monster ID must be a positive integer').nullable(),
    editionId: z.number().int().positive('Edition ID must be a positive integer'),
    isVisible: z.boolean().default(true),
    flavorText: z.string().nullable(),
    description: z.string().nullable(),
    combatDescription: z.string().nullable(),
    sizeId: z.number().int().positive('Size ID must be a positive integer').nullable(),
    baseSpeed: z.number().int().nonnegative('Base speed must be non-negative').nullable(),
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
    includeStatblockOnly: z.string().optional().transform((val) => val === 'true'),
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
    id: z.string().transform((val: string) => parseInt(val)),
});

export const MonsterCacheSchema = MonsterSchema.pick({
    id: true,
    name: true,
    editionId: true,
    isVisible: true,
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

