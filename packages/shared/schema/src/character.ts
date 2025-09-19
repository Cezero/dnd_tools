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

export const CharacterIdParamSchema2 = z.object({
    characterId: z.string().transform((val: string) => parseInt(val)),
});

export const SpellPreparationParamSchema = z.object({
    characterId: z.string().transform((val: string) => parseInt(val)),
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
    alignmentId: z.number().int().positive('Alignment ID must be a positive integer'),
    deityId: z.number().int().positive('Deity ID must be a positive integer').nullable(),
    age: z.number().int().min(0, 'Age must be a non-negative integer').max(1000, 'Age must be less than 1000').nullable(),
    height: z.number().int().min(1, 'Height must be a positive integer').max(1000, 'Height must be less than 1000').nullable(),
    weight: z.number().int().min(1, 'Weight must be a positive integer').max(10000, 'Weight must be less than 10000').nullable(),
    eyes: z.string().max(50, 'Eye color must be less than 50 characters').nullable(),
    hair: z.string().max(50, 'Hair color must be less than 50 characters').nullable(),
    gender: z.string().max(20, 'Gender must be less than 20 characters').nullable(),
    notes: z.string().max(1000, 'Notes must be less than 1000 characters').nullable(),
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
    createdAt: z.date(),
});

export const AdvancementSkillSchema = z.object({
    advancementId: z.number().int().positive('Advancement ID must be a positive integer'),
    skillId: z.number().int().positive('Skill ID must be a positive integer'),
    skillSubId: z.number().int().positive('Skill subtype ID must be a positive integer').nullable(),
    pointsSpent: z.number().int().min(0, 'Points spent must be a non-negative integer'),
    customSubtype: z.string().max(100, 'Custom subtype must be less than 100 characters').nullable(),
});

export const AdvancementFeatSchema = z.object({
    advancementId: z.number().int().positive('Advancement ID must be a positive integer'),
    featId: z.number().int().positive('Feat ID must be a positive integer'),
});

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
    key: z.string().nullable(),
    value: z.string().nullable(),
    choiceIndex: z.number().int().nullable(),
});

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

// Character with all related data
export const CharacterWithAllDetailsSchema = CharacterWithRaceSchema.extend({
    abilityScores: z.array(CharacterAbilityScoreSchema),
    advancements: z.array(CharacterAdvancementWithDetailsSchema),
    preparedSpells: z.array(CharacterSpellPreparationWithMetamagicSchema),
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
    secondaryClassId: z.number().int().positive('Secondary class ID must be a positive integer').nullable(),
    hitPoints: z.number().int().min(1, 'Hit points must be a positive integer'),
    abilityId: z.number().int().positive('Ability ID must be a positive integer').nullable(),
    notes: z.string().max(1000, 'Notes must be less than 1000 characters').nullable(),
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

// Character item schemas
export const CharacterItemSchema = z.object({
    id: z.number().int().positive('Character item ID must be a positive integer'),
    name: z.string().min(1, 'Character item name is required').max(100, 'Character item name must be less than 100 characters').trim(),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').nullable(),
    characterId: z.number().int().positive('Character ID must be a positive integer'),
    baseItemId: z.number().int().positive('Base item ID must be a positive integer'),
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

// Request/response schemas for character feature choices
export const CreateCharacterFeatureChoiceSchema = CharacterFeatureChoiceSchema.omit({ id: true });
export const UpdateCharacterFeatureChoiceSchema = CharacterFeatureChoiceSchema.partial().omit({ id: true });

export const UpdateCharacterItemPropertySchema = CharacterItemPropertySchema.partial().omit({ id: true });

export const UpdateCharacterAbilityScoreSchema = CreateCharacterAbilityScoreSchema.partial();

// Character context for formatter calculations
export const CharacterContextSchema = z.object({
    abilityScores: z.record(z.enum(AbilityId), z.number().int()), // abilityId -> score
    classLevels: z.record(z.number().int(), z.number().int()), // classId -> level
    raceId: z.number().int().optional(),
    sizeId: z.number().int().optional(), // Maps directly to FeatureModifierCondition.conditionValue
});

export type CharacterIdParamRequest = z.infer<typeof CharacterIdParamSchema>;
export type AdvancementIdParamRequest = z.infer<typeof AdvancementIdParamSchema>;
export type CharacterIdParam2Request = z.infer<typeof CharacterIdParamSchema2>;
export type SpellPreparationParamRequest = z.infer<typeof SpellPreparationParamSchema>;
export type AbilityIdParamRequest = z.infer<typeof AbilityIdParamSchema>;

export type CreateCharacterRequest = z.infer<typeof CreateCharacterSchema>;
export type UpdateCharacterRequest = z.infer<typeof UpdateCharacterSchema>;
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

// Character feature choice types
export type CharacterFeatureChoice = z.infer<typeof CharacterFeatureChoiceSchema>;
export type CreateCharacterFeatureChoiceRequest = z.infer<typeof CreateCharacterFeatureChoiceSchema>;
export type UpdateCharacterFeatureChoiceRequest = z.infer<typeof UpdateCharacterFeatureChoiceSchema>;

export type CreateCharacterAbilityScoreRequest = z.infer<typeof CreateCharacterAbilityScoreSchema>;
export type UpdateCharacterAbilityScoreRequest = z.infer<typeof UpdateCharacterAbilityScoreSchema>;
export type CharacterAbilityScoreResponse = z.infer<typeof CharacterAbilityScoreSchema>;

// Character context type
export type CharacterContext = z.infer<typeof CharacterContextSchema>;
