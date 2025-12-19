import { z } from 'zod';
import { QueryResponseSchema } from './query.js';
import { AbilityId } from '@shared/static-data';

export const CharacterIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

// Route parameter schemas for new endpoints
export const AdvancementIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

export const CharacterAttackIdParamSchema = CharacterIdParamSchema.extend({
    attackId: z.string().transform((val: string) => parseInt(val)),
});

export const SpellPreparationParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
    prepKey: z.string(),
});

export const AbilityIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

export const BaseCharacterSchema = z.object({
    userId: z.number().int().positive('User ID must be a positive integer'),
    name: z.string()
        .min(1, 'Character name is required')
        .max(100, 'Character name must be less than 100 characters')
        .trim(),
    raceId: z.number().int().positive('Race ID must be a positive integer'),
    alignmentId: z.union([z.number().int().positive('Alignment ID must be a positive integer'), z.null()]),
    deityId: z.number().int().positive('Deity ID must be a positive integer').nullable(),
    age: z.number().int().min(0, 'Age must be a non-negative integer').max(1000, 'Age must be less than 1000').nullable(),
    height: z.number().int().min(1, 'Height must be a positive integer').max(1000, 'Height must be less than 1000').nullable(),
    weight: z.number().int().min(1, 'Weight must be a positive integer').max(10000, 'Weight must be less than 10000').nullable(),
    eyes: z.string().max(50, 'Eye color must be less than 50 characters').nullable(),
    hair: z.string().max(50, 'Hair color must be less than 50 characters').nullable(),
    gender: z.string().max(20, 'Gender must be less than 20 characters').nullable(),
    notes: z.string().max(1000, 'Notes must be less than 1000 characters').nullable(),

    // NEW: Character configuration fields
    editionId: z.number().int().positive('Edition ID must be a positive integer').nullable(),
    allowVariantClasses: z.boolean().default(false),
    isGestalt: z.boolean().default(false),
    ignoreLevelAdjustment: z.boolean().default(false),

    // Money fields
    platinum: z.number().int().min(0, 'Platinum must be non-negative').default(0),
    gold: z.number().int().min(0, 'Gold must be non-negative').default(0),
    silver: z.number().int().min(0, 'Silver must be non-negative').default(0),
    copper: z.number().int().min(0, 'Copper must be non-negative').default(0),
});

export const CharacterSchema = BaseCharacterSchema.extend({
    id: z.number().int().positive('Character ID must be a positive integer'),
    xp: z.number().int().min(0, 'XP must be a non-negative integer').default(0),
});

// Schema for character with race information
export const CharacterWithRaceSchema = CharacterSchema.extend({
    race: z.object({
        id: z.number().int().positive('Race ID must be a positive integer'),
        name: z.string().min(1, 'Race name is required'),
    }),
    // Class/level information calculated from advancements
    characterLevel: z.number().int().min(0, 'Character level must be non-negative').default(0),
    classLevelString: z.string().default(''),
});

// Character ability score schema
export const CharacterAbilityScoreSchema = z.object({
    id: z.number().int().positive('Ability score ID must be a positive integer'),
    characterId: z.number().int().positive('Character ID must be a positive integer'),
    abilityId: z.number().int().positive('Ability ID must be a positive integer'),
    value: z.number().int().min(1, 'Ability score value must be a positive integer').max(50, 'Ability score value must be less than 50'),
});

// Character advancement schemas
export const CharacterAdvancementSchema = z.object({
    id: z.number().int().positive('Advancement ID must be a positive integer'),
    characterId: z.number().int().positive('Character ID must be a positive integer'),
    level: z.number().int().min(1, 'Level must be a positive integer').max(100, 'Level must be less than 100'),
    version: z.number().int().min(1, 'Version must be a positive integer'),
    classId: z.number().int().positive('Class ID must be a positive integer'),
    secondaryClassId: z.number().int().positive('Secondary class ID must be a positive integer').nullable(),
    hitPoints: z.number().int().min(1, 'Hit points must be a positive integer'),
    abilityId: z.number().int().positive('Ability ID must be a positive integer').nullable(),
    notes: z.string().max(1000, 'Notes must be less than 1000 characters').nullable(),
    createdAt: z.coerce.date(), // Accepts both Date objects and ISO date strings
});

export const AdvancementSkillSchema = z.object({
    advancementId: z.number().int().positive('Advancement ID must be a positive integer'),
    skillId: z.number().int().positive('Skill ID must be a positive integer'),
    skillSubId: z.union([z.number().int().positive('Skill subtype ID must be a positive integer'), z.null()]),
    pointsSpent: z.number().int().min(0, 'Points spent must be a non-negative integer'),
    customSubtype: z.union([z.string().max(100, 'Custom subtype must be less than 100 characters'), z.null()]),
});

// Schema for creating advancement skills (without advancementId, as it's set by the parent)
export const CreateAdvancementSkillSchema = AdvancementSkillSchema.omit({ advancementId: true });

export const AdvancementFeatSchema = z.object({
    advancementId: z.number().int().positive('Advancement ID must be a positive integer'),
    featId: z.number().int().positive('Feat ID must be a positive integer'),
    featSubId: z.number().int().positive('Feat sub ID must be a positive integer').nullable().optional(),
});

// Schema for creating advancement feats (without advancementId, as it's set by the parent)
export const CreateAdvancementFeatSchema = AdvancementFeatSchema.omit({ advancementId: true });

export const AdvancementSpellSchema = z.object({
    advancementId: z.number().int().positive('Advancement ID must be a positive integer'),
    spellId: z.number().int().positive('Spell ID must be a positive integer'),
});

// Character feature choice schema
export const CharacterFeatureChoiceSchema = z.object({
    id: z.number().int().positive('Character feature choice ID must be a positive integer'),
    characterId: z.number().int().positive('Character ID must be a positive integer'),
    progressionId: z.number().int().positive('Progression ID must be a positive integer'),
    advancementId: z.number().int().positive('Advancement ID must be a positive integer'),
    featureEntityId: z.number().int().positive('Feature entity ID must be a positive integer'),
    appliesToId: z.number().int().positive('Applies to ID must be a positive integer'),
    appliesToSubId: z.number().int().nullable(),
    choiceIndex: z.number().int().nullable(),
});

// Request/response schemas for character feature choices (defined early to avoid forward reference)
export const CreateCharacterFeatureChoiceSchema = CharacterFeatureChoiceSchema.omit({ id: true });
export const UpdateCharacterFeatureChoiceSchema = CharacterFeatureChoiceSchema.partial().omit({ id: true });

// Character advancement with related data
export const CharacterAdvancementWithDetailsSchema = CharacterAdvancementSchema.extend({
    skills: z.array(AdvancementSkillSchema),
    feats: z.array(AdvancementFeatSchema),
    spellsKnown: z.array(AdvancementSpellSchema),
    featureChoices: z.array(CharacterFeatureChoiceSchema),
});

// Spell preparation schemas
export const CharacterSpellPreparationSchema = z.object({
    characterId: z.number().int().positive('Character ID must be a positive integer'),
    classId: z.number().int().positive('Class ID must be a positive integer'),
    spellId: z.number().int().positive('Spell ID must be a positive integer'),
    spellLevel: z.number().int().min(0, 'Spell level must be a non-negative integer').max(20, 'Spell level must be less than 20'),
    quantity: z.number().int().min(1, 'Quantity must be a positive integer'),
    prepKey: z.string().min(1, 'Preparation key is required'),
    slotType: z.number().int().min(1, 'Slot type must be a positive integer').default(1),
    isDomainSpell: z.boolean().default(false), // NEW: Is this a domain spell?
    domainId: z.number().int().positive('Domain ID must be a positive integer').nullable(), // NEW: Which domain (if domain spell)
});

export const SpellPreparationMetamagicSchema = z.object({
    characterId: z.number().int().positive('Character ID must be a positive integer'),
    prepKey: z.string().min(1, 'Preparation key is required'),
    featId: z.number().int().positive('Feat ID must be a positive integer'),
});

// Character spell preparation with metamagic
export const CharacterSpellPreparationWithMetamagicSchema = CharacterSpellPreparationSchema.extend({
    metamagics: z.array(SpellPreparationMetamagicSchema),
});

// Character disallowed source schemas
export const CharacterDisallowedSourceSchema = z.object({
    id: z.number().int().positive('Disallowed source ID must be a positive integer'),
    characterId: z.number().int().positive('Character ID must be a positive integer'),
    sourceBookId: z.number().int().positive('Source book ID must be a positive integer'),
});

// Character item schemas (defined before CharacterWithAllDetailsSchema to avoid forward reference)
export const CharacterItemSchema = z.object({
    id: z.number().int().positive('Character item ID must be a positive integer'),
    name: z.string().min(1, 'Character item name is required').max(100, 'Character item name must be less than 100 characters').trim(),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').nullable(),
    location: z.number().int().min(0).max(15).nullable(),
    characterId: z.number().int().positive('Character ID must be a positive integer'),
    baseItemId: z.number().int().positive('Base item ID must be a positive integer'),
});

// Character attack definition schemas (defined before CharacterWithAllDetailsSchema to avoid forward reference)
export const CharacterAttackDefinitionSchema = z.object({
    id: z.number().int().positive('Attack definition ID must be a positive integer'),
    characterId: z.number().int().positive('Character ID must be a positive integer'),
    attackSlot: z.number().int().min(1).max(7).nullable(),
    mainHandCharacterItemId: z.number().int().positive('Main hand character item ID must be a positive integer').nullable(),
    offHandCharacterItemId: z.number().int().positive('Off hand character item ID must be a positive integer').nullable(),
});

// Character with all related data
export const CharacterWithAllDetailsSchema = CharacterWithRaceSchema.extend({
    abilityScores: z.array(CharacterAbilityScoreSchema),
    advancements: z.array(CharacterAdvancementWithDetailsSchema),
    preparedSpells: z.array(CharacterSpellPreparationWithMetamagicSchema),
    disallowedSources: z.array(CharacterDisallowedSourceSchema),
    characterItems: z.array(CharacterItemSchema).optional(),
    attackDefinitions: z.array(CharacterAttackDefinitionSchema).optional(),
});

export const GetAllCharactersResponseSchema = QueryResponseSchema.extend({
    results: z.array(CharacterWithRaceSchema),
});

export const UpdateCharacterSchema = BaseCharacterSchema.partial();

export const CreateCharacterSchema = BaseCharacterSchema;

// Request/response schemas for advancement
export const CreateAdvancementSchema = z.object({
    characterId: z.number().int().positive('Character ID must be a positive integer'),
    level: z.number().int().min(1, 'Level must be a positive integer').max(100, 'Level must be less than 100'),
    classId: z.number().int().positive('Class ID must be a positive integer'),
    secondaryClassId: z.union([z.number().int().positive('Secondary class ID must be a positive integer'), z.null()]),
    hitPoints: z.number().int().min(1, 'Hit points must be a positive integer'),
    abilityId: z.union([z.number().int().positive('Ability ID must be a positive integer'), z.null()]),
    notes: z.union([z.string().max(1000, 'Notes must be less than 1000 characters'), z.null()]),
    skills: z.array(CreateAdvancementSkillSchema).optional(),
    feats: z.array(CreateAdvancementFeatSchema).optional(),
    featureChoices: z.array(CreateCharacterFeatureChoiceSchema.omit({ characterId: true, advancementId: true })).optional(),
});

export const UpdateAdvancementSchema = CreateAdvancementSchema.partial();

// Request/response schemas for spell preparation
export const CreateSpellPreparationSchema = z.object({
    characterId: z.number().int().positive('Character ID must be a positive integer'),
    classId: z.number().int().positive('Class ID must be a positive integer'),
    spellId: z.number().int().positive('Spell ID must be a positive integer'),
    spellLevel: z.number().int().min(0, 'Spell level must be a non-negative integer').max(20, 'Spell level must be less than 20'),
    quantity: z.number().int().min(1, 'Quantity must be a positive integer'),
    slotType: z.number().int().min(1, 'Slot type must be a positive integer').default(1),
});

export const UpdateSpellPreparationSchema = CreateSpellPreparationSchema.partial();

// Request/response schemas for character ability scores
export const CreateCharacterAbilityScoreSchema = z.object({
    characterId: z.number().int().positive('Character ID must be a positive integer'),
    abilityId: z.number().int().positive('Ability ID must be a positive integer'),
    value: z.number().int().min(1, 'Ability score value must be a positive integer').max(50, 'Ability score value must be less than 50'),
});

// Bulk upsert ability scores schema (replaces all ability scores for a character)
// Note: characterId comes from URL params, not body
export const UpsertCharacterAbilityScoresSchema = z.object({
    abilityScores: z.array(CreateCharacterAbilityScoreSchema.omit({ characterId: true })).max(6, 'Maximum 6 ability scores allowed'),
});

export const CharacterItemPropertySchema = z.object({
    id: z.number().int().positive('Character item property ID must be a positive integer'),
    characterItemId: z.number().int().positive('Character item ID must be a positive integer'),
    propertyId: z.number().int().positive('Property ID must be a positive integer'),
});

// Request/response schemas for character items
export const CreateCharacterItemSchema = CharacterItemSchema.omit({ id: true });
export const UpdateCharacterItemSchema = CharacterItemSchema.partial().omit({ id: true });

// Request/response schemas for character item properties
export const CreateCharacterItemPropertySchema = CharacterItemPropertySchema.omit({ id: true });

// Request/response schemas for character attack definitions
export const CreateCharacterAttackDefinitionSchema = CharacterAttackDefinitionSchema.omit({ id: true });
export const UpdateCharacterAttackDefinitionSchema = CreateCharacterAttackDefinitionSchema.partial();
export const GetAllCharacterAttackDefinitionsResponseSchema = z.array(CharacterAttackDefinitionSchema);
export const ReorderCharacterAttackDefinitionsSchema = z.object({
    attackDefinitionIds: z.array(z.number().int().positive('Attack definition ID must be a positive integer')),
});


export const UpdateCharacterItemPropertySchema = CharacterItemPropertySchema.partial().omit({ id: true });

export const UpdateCharacterAbilityScoreSchema = CreateCharacterAbilityScoreSchema.partial();

// Unified save schema that includes nested ability scores and advancement data
// Note: Defined after CreateCharacterAbilityScoreSchema and CreateAdvancementSchema to avoid forward reference errors
export const SaveCharacterSchema = BaseCharacterSchema.extend({
    // Optional ability scores (nested)
    abilityScores: z.array(CreateCharacterAbilityScoreSchema.omit({ characterId: true })).optional(),
    // Optional advancement data (nested)
    advancement: CreateAdvancementSchema.omit({ characterId: true }).optional(),
    // Optional equipment (nested)
    equipment: z.array(CreateCharacterItemSchema.omit({ characterId: true })).optional(),
    // Optional attack definitions (nested)
    attackDefinitions: z.array(CreateCharacterAttackDefinitionSchema.omit({ characterId: true })).optional(),
}).partial(); // Make all fields optional for updates

// Request/response schemas for character disallowed sources
export const CreateCharacterDisallowedSourceSchema = CharacterDisallowedSourceSchema.omit({ id: true });
export const UpdateCharacterDisallowedSourceSchema = CreateCharacterDisallowedSourceSchema.partial();

// Character context for formatter calculations
export const CharacterContextSchema = z.object({
    abilityScores: z.record(z.enum(AbilityId), z.number().int()), // abilityId -> score
    classLevels: z.record(z.number().int(), z.number().int()), // classId -> level
    raceId: z.number().int().optional(),
    sizeId: z.number().int().optional(), // Maps directly to FeatureModifierCondition.conditionValue
});

export type CharacterIdParamRequest = z.infer<typeof CharacterIdParamSchema>;
export type AdvancementIdParamRequest = z.infer<typeof AdvancementIdParamSchema>;
export type SpellPreparationParamRequest = z.infer<typeof SpellPreparationParamSchema>;
export type CharacterAttackIdParamRequest = z.infer<typeof CharacterAttackIdParamSchema>;
export type AbilityIdParamRequest = z.infer<typeof AbilityIdParamSchema>;

export type CreateCharacterRequest = z.infer<typeof CreateCharacterSchema>;
export type UpdateCharacterRequest = z.infer<typeof UpdateCharacterSchema>;
export type SaveCharacterRequest = z.infer<typeof SaveCharacterSchema>;
export type Character = z.infer<typeof CharacterSchema>;
export type CharacterWithRaceResponse = z.infer<typeof CharacterWithRaceSchema>;
export type CharacterWithAllDetailsResponse = z.infer<typeof CharacterWithAllDetailsSchema>;
export type GetAllCharactersResponse = z.infer<typeof GetAllCharactersResponseSchema>;

// Advancement types
export type CreateAdvancementRequest = z.infer<typeof CreateAdvancementSchema>;
export type UpdateAdvancementRequest = z.infer<typeof UpdateAdvancementSchema>;
export type CharacterAdvancementResponse = z.infer<typeof CharacterAdvancementSchema>;
export type CharacterAdvancementWithDetailsResponse = z.infer<typeof CharacterAdvancementWithDetailsSchema>;

// Spell preparation types
export type CreateSpellPreparationRequest = z.infer<typeof CreateSpellPreparationSchema>;
export type UpdateSpellPreparationRequest = z.infer<typeof UpdateSpellPreparationSchema>;
export type CharacterSpellPreparationResponse = z.infer<typeof CharacterSpellPreparationSchema>;
export type CharacterSpellPreparationWithMetamagicResponse = z.infer<typeof CharacterSpellPreparationWithMetamagicSchema>;

// Character item types
export type CharacterItem = z.infer<typeof CharacterItemSchema>;
export type CreateCharacterItemRequest = z.infer<typeof CreateCharacterItemSchema>;
export type UpdateCharacterItemRequest = z.infer<typeof UpdateCharacterItemSchema>;

export type CharacterItemProperty = z.infer<typeof CharacterItemPropertySchema>;
export type CreateCharacterItemPropertyRequest = z.infer<typeof CreateCharacterItemPropertySchema>;
export type UpdateCharacterItemPropertyRequest = z.infer<typeof UpdateCharacterItemPropertySchema>;

// Character attack definition types
export type CharacterAttackDefinition = z.infer<typeof CharacterAttackDefinitionSchema>;
export type CreateCharacterAttackDefinitionRequest = z.infer<typeof CreateCharacterAttackDefinitionSchema>;
export type UpdateCharacterAttackDefinitionRequest = z.infer<typeof UpdateCharacterAttackDefinitionSchema>;

// Character feature choice types
export type CharacterFeatureChoice = z.infer<typeof CharacterFeatureChoiceSchema>;
export type CreateCharacterFeatureChoiceRequest = z.infer<typeof CreateCharacterFeatureChoiceSchema>;
export type UpdateCharacterFeatureChoiceRequest = z.infer<typeof UpdateCharacterFeatureChoiceSchema>;

export type CreateCharacterAbilityScoreRequest = z.infer<typeof CreateCharacterAbilityScoreSchema>;
export type UpdateCharacterAbilityScoreRequest = z.infer<typeof UpdateCharacterAbilityScoreSchema>;
export type CharacterAbilityScoreResponse = z.infer<typeof CharacterAbilityScoreSchema>;
export type UpsertCharacterAbilityScoresRequest = z.infer<typeof UpsertCharacterAbilityScoresSchema>;

// Character disallowed source types
export type CharacterDisallowedSource = z.infer<typeof CharacterDisallowedSourceSchema>;
export type CreateCharacterDisallowedSourceRequest = z.infer<typeof CreateCharacterDisallowedSourceSchema>;
export type UpdateCharacterDisallowedSourceRequest = z.infer<typeof UpdateCharacterDisallowedSourceSchema>;

// Character context type
export type CharacterContext = z.infer<typeof CharacterContextSchema>;
