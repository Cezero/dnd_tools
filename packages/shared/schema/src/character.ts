import { z } from 'zod';
import { EntityAppliesToType } from '@shared/static-data';
import { AbilityId, AlignmentId, CurrencyId, SpellSlotType } from '@shared/static-data';
import { QueryResponseSchema } from './query.js';
import { numericParam, commonValidations } from './common.js';
import { CharacterCompanionDraftSchema, ResolvedCharacterCompanionDraftSchema } from './companion.js';
import { FeatInQueryResponseSchema } from './feat.js';
import { FeatureWithRelationsSchema } from './feature.js';
import { CharacterSelectedFormDraftSchema, ResolvedSelectedFormDraftSchema } from './selectedForm.js';
import { CharacterSpellSelectionEntrySchema } from './spell.js';
import { ValidationErrorResponseSchema } from './validation.js';

/**
 * Draft-compatible ID schemas.
 *
 * Draft-backed endpoints may return negative IDs during create/edit sessions.
 * We keep request schemas strict (e.g. `BaseCharacterSchema`), but allow response
 * schemas to accept draft-only IDs and draft placeholder values (e.g. `classId = 0`).
 */
const DraftIdSchema = z.number().int();

export const CharacterIdParamSchema = z.object({
    id: numericParam(),
});

// Route parameter schemas for new endpoints
export const AdvancementIdParamSchema = z.object({
    id: numericParam(),
});

export const CharacterAttackIdParamSchema = CharacterIdParamSchema.extend({
    attackId: numericParam(),
});

export const RemoveDisallowedSourceParamSchema = CharacterIdParamSchema.extend({
    sourceBookId: numericParam(),
});

export const CharacterSpellSelectionParamSchema = CharacterIdParamSchema.extend({
    classId: numericParam(),
});

export const SyncSpellsKnownParamSchema = CharacterIdParamSchema.extend({
    advancementId: numericParam(),
});

export const ReorderAttackDefinitionsSchema = z.object({
    attackDefinitionIds: z.array(commonValidations.positiveInt('Attack definition ID')),
});

export const SpellPreparationParamSchema = z.object({
    preparationId: numericParam(),
});

export const AbilityIdParamSchema = z.object({
    id: numericParam(),
});

export const BaseCharacterSchema = z.object({
    userId: commonValidations.positiveInt('User ID'),
    name: commonValidations.name(),
    raceId: commonValidations.positiveInt('Race ID'),
    alignmentId: z.enum(AlignmentId).nullable(),
    deityId: commonValidations.positiveInt('Deity ID').nullable(),
    age: commonValidations.nonNegativeInt('Age', 1000).nullable(),
    height: z.number().int().min(1, 'Height must be a positive integer').max(1000, 'Height must be less than 1000').nullable(),
    weight: z.number().int().min(1, 'Weight must be a positive integer').max(10000, 'Weight must be less than 10000').nullable(),
    eyes: z.string().max(50, 'Eye color must be less than 50 characters').nullable(),
    hair: z.string().max(50, 'Hair color must be less than 50 characters').nullable(),
    gender: z.string().max(20, 'Gender must be less than 20 characters').nullable(),
    notes: commonValidations.description(10000).nullable(),

    // Edition is stored on the character row; defaulting is handled by the service layer.
    editionId: commonValidations.positiveInt('Edition ID').nullable(),
});

/**
 * Response schema for characters.
 *
 * Note: This is intentionally more permissive than `BaseCharacterSchema` to support
 * draft-backed character create/edit flows where:
 * - `id` may be negative
 * - `name` may be empty until saved
 * - `raceId` may be null until selected
 */
const BaseCharacterResponseSchema = BaseCharacterSchema.extend({
    name: z.string().max(100, 'Name must be less than 100 characters').trim(),
    raceId: DraftIdSchema.nullable(),
});

export const CharacterSchema = BaseCharacterResponseSchema.extend({
    id: DraftIdSchema,
    xp: commonValidations.nonNegativeInt('XP').default(0),
});

// Schema for character with race information
// race object removed - frontend should resolve race names from races-cache using raceId (already in base schema)
export const CharacterWithRaceSchema = CharacterSchema.extend({
    // Class/level information calculated from advancements
    characterLevel: commonValidations.nonNegativeInt('Character level').default(0),
    classLevelString: z.string().default(''),
});

// Character ability score schema
export const CharacterAbilityScoreSchema = z.object({
    id: DraftIdSchema,
    characterId: DraftIdSchema,
    abilityId: commonValidations.positiveInt('Ability ID'),
    value: z.number().int().min(1, 'Ability score value must be a positive integer').max(50, 'Ability score value must be less than 50'),
});

export const CharacterConfigSchema = z.object({
    characterId: DraftIdSchema,
    allowVariantClasses: z.boolean().default(false),
    isGestalt: z.boolean().default(false),
    ignoreLevelAdjustment: z.boolean().default(false),
    /** Official 3.0/3.5: max Hit Die at 1st level. Character-level until campaign settings exist. */
    maxHpAtFirstLevel: z.boolean().default(false),
});

export const CharacterWealthSchema = z.object({
    id: DraftIdSchema,
    characterId: DraftIdSchema,
    currencyId: z.enum(CurrencyId),
    quantity: commonValidations.nonNegativeInt('Quantity', 1_000_000_000),
    /** Used only for gpValue==0 currencies (Gems/ArtObjects/Other); expressed in gold pieces. */
    value: commonValidations.nonNegativeInt('Value (gp)', 1_000_000_000).nullable(),
    description: z.string().max(255, 'Description must be less than 255 characters').nullable(),
});

// Character advancement schemas
export const CharacterAdvancementSchema = z.object({
    id: DraftIdSchema,
    characterId: DraftIdSchema,
    level: z.number().int().min(1, 'Level must be a positive integer').max(100, 'Level must be less than 100'),
    version: z.number().int().min(1, 'Version must be a positive integer'),
    // Draft create/edit uses `0` as an “unselected” placeholder.
    classId: commonValidations.nonNegativeInt('Class ID'),
    secondaryClassId: commonValidations.positiveInt('Secondary class ID').nullable(),
    // Draft create/edit may start at 0 until calculated/rolled.
    hitPoints: commonValidations.nonNegativeInt('Hit points'),
    abilityId: commonValidations.positiveInt('Ability ID').nullable(),
    notes: z.string().max(1000, 'Notes must be less than 1000 characters').nullable(),
    createdAt: z.coerce.date(), // Accepts both Date objects and ISO date strings
});

export const AdvancementSkillSchema = z.object({
    advancementId: DraftIdSchema,
    skillId: commonValidations.positiveInt('Skill ID'),
    skillSubId: z.union([commonValidations.positiveInt('Skill subtype ID'), z.null()]),
    pointsSpent: commonValidations.nonNegativeInt('Points spent'),
    customSubtype: z.union([z.string().max(100, 'Custom subtype must be less than 100 characters'), z.null()]),
});

// Schema for creating advancement skills (without advancementId, as it's set by the parent)
export const CreateAdvancementSkillSchema = AdvancementSkillSchema.omit({ advancementId: true });

export const AdvancementFeatSchema = z.object({
    advancementId: DraftIdSchema,
    featId: commonValidations.positiveInt('Feat ID'),
    featSubId: commonValidations.positiveInt('Feat sub ID').nullable().optional(),
});

// Schema for creating advancement feats (without advancementId, as it's set by the parent)
export const CreateAdvancementFeatSchema = AdvancementFeatSchema.omit({ advancementId: true });

export const AdvancementSpellSchema = z.object({
    advancementId: DraftIdSchema,
    spellId: commonValidations.positiveInt('Spell ID'),
    isFreeGrant: z.boolean().default(false),
});

// Character feature choice schema
export const CharacterFeatureChoiceSchema = z.object({
    id: DraftIdSchema,
    characterId: DraftIdSchema,
    featureId: commonValidations.positiveInt('Feature ID'),
    advancementId: DraftIdSchema,
    featureEntityId: commonValidations.positiveInt('Feature entity ID'),
    appliesToId: commonValidations.positiveInt('Applies to ID'),
    appliesToSubId: z.number().int().nullable(),
    choiceIndex: z.number().int().nullable(),
    choiceGroupId: z.string().nullable().optional(),
    choiceData: z.any().nullable().optional(),
    linkedChoiceGroupId: z.string().nullable().optional(),
});

/**
 * Draft-safe variant of CharacterFeatureChoice.
 *
 * Draft state may include unsaved choices with temporary IDs (0/negative) and may use
 * placeholder advancement IDs during editing.
 *
 * This schema is specifically intended for draft/edit state (not persisted rows).
 */
export const CharacterFeatureChoiceDraftSchema = z.object({
    id: z.number().int(),
    characterId: z.number().int(),
    featureId: z.number().int(),
    advancementId: z.number().int(),
    featureEntityId: z.number().int(),
    appliesToId: z.number().int(),
    appliesToSubId: z.number().int().nullable(),
    choiceIndex: z.number().int().nullable(),
    choiceGroupId: z.string().nullable().optional(),
    choiceData: z.any().nullable().optional(),
    linkedChoiceGroupId: z.string().nullable().optional(),
});

// Request/response schemas for character feature choices (defined early to avoid forward reference)
export const CreateCharacterFeatureChoiceSchema = CharacterFeatureChoiceSchema.omit({ id: true });
export const UpdateCharacterFeatureChoiceSchema = CharacterFeatureChoiceSchema.partial().omit({ id: true });

// Character advancement with related data
export const CharacterAdvancementWithDetailsSchema = CharacterAdvancementSchema.extend({
    skills: z.array(AdvancementSkillSchema),
    feats: z.array(AdvancementFeatSchema),
    spellsKnown: z.array(AdvancementSpellSchema),
    // Feature choices may be draft-only (0/negative IDs).
    featureChoices: z.array(CharacterFeatureChoiceSchema),
});

// Character disallowed source schemas
export const CharacterDisallowedSourceSchema = z.object({
    id: DraftIdSchema,
    characterId: DraftIdSchema,
    sourceBookId: commonValidations.positiveInt('Source book ID'),
});

// Character language map schemas
export const CharacterLanguageMapSchema = z.object({
    characterId: DraftIdSchema,
    languageId: commonValidations.positiveInt('Language ID'),
});

// Request/response schemas for character language map
export const CreateCharacterLanguageMapSchema = CharacterLanguageMapSchema;

/**
 * DM-granted bonus skill ranks tied to a character (not an advancement).
 * These count as real ranks on the sheet and do not spend skill points.
 */
export const CharacterBonusSkillRankSchema = z.object({
    id: DraftIdSchema,
    characterId: DraftIdSchema,
    skillId: commonValidations.positiveInt('Skill ID'),
    skillSubId: z.union([commonValidations.positiveInt('Skill subtype ID'), z.null()]),
    customSubtype: z.union([z.string().max(100, 'Custom subtype must be less than 100 characters'), z.null()]),
    ranks: commonValidations.positiveInt('Bonus ranks'),
    description: z.string().min(1, 'Description is required').max(255, 'Description must be less than 255 characters'),
});

export const CharacterBonusSkillRankDraftSchema = CharacterBonusSkillRankSchema.omit({
    id: true,
    characterId: true,
}).extend({
    id: z.number().int(),
    characterId: z.number().int(),
});

export const CreateCharacterBonusSkillRankSchema = CharacterBonusSkillRankSchema.omit({
    id: true,
    characterId: true,
});

// Character item schemas (defined before CharacterWithAllDetailsSchema to avoid forward reference)
export const CharacterItemSchema = z.object({
    id: DraftIdSchema,
    name: z.string().max(100, 'Name must be less than 100 characters').trim(),
    quantity: commonValidations.nonNegativeInt('Quantity', 1_000_000_000).nullable(),
    location: commonValidations.nonNegativeInt('Location', 15).nullable(),
    characterId: DraftIdSchema,
    // Draft create/edit may use `0` until an item is selected.
    baseItemId: commonValidations.nonNegativeInt('Base item ID'),
});

// Character attack definition schemas (defined before CharacterWithAllDetailsSchema to avoid forward reference)
export const CharacterAttackDefinitionSchema = z.object({
    id: DraftIdSchema,
    characterId: DraftIdSchema,
    attackSlot: z.number().int().min(1).max(7).nullable(),
    mainHandCharacterItemId: DraftIdSchema.nullable(),
    offHandCharacterItemId: DraftIdSchema.nullable(),
    wieldTwoHanded: z.boolean().default(false),
});

// Spell preparation schemas
export const CharacterSpellPreparationSchema = z.object({
    id: DraftIdSchema,
    characterId: DraftIdSchema,
    classId: commonValidations.positiveInt('Class ID'),
    spellId: commonValidations.positiveInt('Spell ID'),
    spellLevel: commonValidations.nonNegativeInt('Spell level', 20),
    quantity: z.number().int().min(1, 'Quantity must be a positive integer'),
    timesCast: commonValidations.nonNegativeInt('Times cast').default(0).optional(),
    slotType: z.enum(SpellSlotType).default(SpellSlotType.NORMAL).optional(), // 0=NORMAL, 1=BONUS, 2=DOMAIN
    featId: commonValidations.positiveInt('Feat ID').nullable().optional(),
});

// Character with all related data
export const CharacterWithAllDetailsSchema = CharacterWithRaceSchema.extend({
    abilityScores: z.array(CharacterAbilityScoreSchema),
    advancements: z.array(CharacterAdvancementWithDetailsSchema),
    preparedSpells: z.array(CharacterSpellPreparationSchema),
    config: CharacterConfigSchema.optional().nullable(),
    wealth: z.array(CharacterWealthSchema).optional(),
    disallowedSources: z.array(CharacterDisallowedSourceSchema),
    characterLanguages: z.array(CharacterLanguageMapSchema).optional(),
    bonusSkillRanks: z.array(CharacterBonusSkillRankSchema).optional(),
    characterItems: z.array(CharacterItemSchema).optional(),
    attackDefinitions: z.array(CharacterAttackDefinitionSchema).optional(),
    companions: z.array(CharacterCompanionDraftSchema).optional(),
    selectedForms: z.array(CharacterSelectedFormDraftSchema).optional(),
});

/**
 * Draft-safe variants of nested character collections.
 *
 * These allow draft-only IDs (0/negative) and draft-only parent `characterId` values (negative).
 */
export const CharacterItemDraftSchema = CharacterItemSchema.omit({
    id: true,
    characterId: true,
}).extend({
    id: z.number().int(),
    characterId: z.number().int(),
});

export const CharacterAttackDefinitionDraftSchema = CharacterAttackDefinitionSchema.omit({
    id: true,
    characterId: true,
    mainHandCharacterItemId: true,
    offHandCharacterItemId: true,
}).extend({
    id: z.number().int(),
    characterId: z.number().int(),
    mainHandCharacterItemId: z.number().int().nullable(),
    offHandCharacterItemId: z.number().int().nullable(),
});

export const CharacterLanguageDraftSchema = z.object({
    languageId: commonValidations.positiveInt('Language ID'),
});

/**
 * Character edit state used by the draft editing system.
 *
 * This is distinct from `CharacterWithAllDetailsSchema`:
 * - It is optimized for incremental UI editing and draft persistence
 * - It may contain draft-only IDs (e.g., negative ids)
 */
export const CharacterEditStateSchema = BaseCharacterSchema.omit({
    userId: true,
    raceId: true,
    editionId: true,
}).extend({
    // Draft IDs may be negative while creating.
    characterId: z.number().int(),
    // During editing/creation, race may not be selected yet.
    raceId: z.number().int().nullable(),
    // Edition is required for resolution and downstream lookups.
    editionId: z.number().int(),
    // Character-core ability scores (part of character, not advancements).
    abilityScores: z.array(z.object({
        abilityId: commonValidations.positiveInt('Ability ID'),
        value: z.number().int(),
    })),
    // Character configuration fields that affect resolution behavior.
    allowVariantClasses: z.boolean(),
    isGestalt: z.boolean(),
    ignoreLevelAdjustment: z.boolean(),
    maxHpAtFirstLevel: z.boolean().default(false),
    // Character wealth entries (coins and valuables).
    wealth: z.array(
        CharacterWealthSchema.omit({ id: true, characterId: true }).extend({
            id: z.number().int(),
            characterId: z.number().int(),
        })
    ).optional(),
    // Disallowed sources are character-core config (not part of advancements).
    disallowedSources: z.array(z.object({
        sourceBookId: commonValidations.positiveInt('Source book ID'),
    })),
    /**
     * Equipment / attacks / languages are intentionally part of the character draft state so the
     * editor can persist them via the generic draft save flow (not ad-hoc endpoints).
     *
     * These are draft-safe shapes (IDs may be 0/negative during editing).
     */
    characterItems: z.array(CharacterItemDraftSchema).optional(),
    attackDefinitions: z.array(CharacterAttackDefinitionDraftSchema).optional(),
    characterLanguages: z.array(CharacterLanguageDraftSchema).optional(),
    bonusSkillRanks: z.array(CharacterBonusSkillRankDraftSchema).optional(),
    companions: z.array(CharacterCompanionDraftSchema).optional(),
    selectedForms: z.array(CharacterSelectedFormDraftSchema).optional(),
});

export const GetAllCharactersResponseSchema = QueryResponseSchema.extend({
    results: z.array(CharacterWithRaceSchema),
});

// Schema for character with user information (for admin endpoints)
export const CharacterWithRaceAndUserSchema = CharacterWithRaceSchema.extend({
    // User information (included in admin endpoints for administrative oversight)
    user: z.object({
        id: commonValidations.positiveInt('User ID'),
        username: z.string(),
    }).optional(),
});

export const GetAllCharactersAdminResponseSchema = QueryResponseSchema.extend({
    results: z.array(CharacterWithRaceAndUserSchema),
});

export const UpdateCharacterSchema = BaseCharacterSchema.partial();

export const CreateCharacterSchema = BaseCharacterSchema;

/**
 * Schema for creating a character advancement.
 * 
 * This schema uses CharacterAdvancementSchema.omit() to avoid duplication while excluding
 * fields that are auto-generated (id, version, createdAt). The characterId is kept as it's
 * required for creation. The schema is extended with optional nested arrays for skills, feats, and feature choices.
 * 
 * Pattern: BaseSchema.omit({ auto-generated fields }) + optional nested data
 * 
 * @see CharacterAdvancementSchema - Base schema this is derived from
 * @see CreateAdvancementSkillSchema - Schema for nested skills
 * @see CreateAdvancementFeatSchema - Schema for nested feats
 * @see CreateCharacterFeatureChoiceSchema - Schema for nested feature choices
 */
export const CreateAdvancementSchema = CharacterAdvancementSchema.omit({
    id: true,
    version: true,
    createdAt: true,
}).extend({
    skills: z.array(CreateAdvancementSkillSchema).optional(),
    feats: z.array(CreateAdvancementFeatSchema).optional(),
    featureChoices: z.array(CreateCharacterFeatureChoiceSchema.omit({ characterId: true, advancementId: true })).optional(),
});

export const UpdateAdvancementSchema = CreateAdvancementSchema.partial();

/**
 * Schema for creating a character ability score.
 * 
 * This schema uses CharacterAbilityScoreSchema.omit() to avoid duplication while excluding
 * the id field which is auto-generated during creation.
 * 
 * Pattern: BaseSchema.omit({ auto-generated fields })
 * 
 * @see CharacterAbilityScoreSchema - Base schema this is derived from
 */
export const CreateCharacterAbilityScoreSchema = CharacterAbilityScoreSchema.omit({
    id: true,
});

// Bulk upsert ability scores schema (replaces all ability scores for a character)
// Note: characterId comes from URL params, not body
export const UpsertCharacterAbilityScoresSchema = z.object({
    abilityScores: z.array(CreateCharacterAbilityScoreSchema.omit({ characterId: true })).max(6, 'Maximum 6 ability scores allowed'),
});

export const CharacterItemPropertySchema = z.object({
    id: commonValidations.positiveInt('Character item property ID'),
    characterItemId: commonValidations.positiveInt('Character item ID'),
    propertyId: commonValidations.positiveInt('Property ID'),
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
    attackDefinitionIds: z.array(commonValidations.positiveInt('Attack definition ID')),
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
    // Optional character languages (nested)
    characterLanguages: z.array(CreateCharacterLanguageMapSchema.omit({ characterId: true })).optional(),
    // Optional DM-granted bonus skill ranks (nested)
    bonusSkillRanks: z.array(CreateCharacterBonusSkillRankSchema).optional(),
}).partial().transform((data) => {
    // Transform null editionId to undefined so service can apply default
    if (data.editionId === null) {
        return { ...data, editionId: undefined };
    }
    return data;
}); // Make all fields optional for updates

// Request/response schemas for character disallowed sources
export const CreateCharacterDisallowedSourceSchema = CharacterDisallowedSourceSchema.omit({ id: true });
export const UpdateCharacterDisallowedSourceSchema = CreateCharacterDisallowedSourceSchema.partial();

// Character feature uses schemas
export const CharacterFeatureUsesSchema = z.object({
    id: commonValidations.positiveInt('Feature uses ID'),
    characterId: commonValidations.positiveInt('Character ID'),
    featureId: commonValidations.positiveInt('Feature ID'),
    featureEntityId: commonValidations.positiveInt('Feature entity ID'),
    currentUses: commonValidations.nonNegativeInt('Current uses'),
    maxUses: commonValidations.nonNegativeInt('Max uses'),
    frequency: z.number().int().min(1, 'Frequency must be a positive integer'),
});

// Request/response schemas for spell preparations
export const CreateSpellPreparationSchema = CharacterSpellPreparationSchema.omit({ id: true, characterId: true });
export const UpdateSpellPreparationSchema = CharacterSpellPreparationSchema.partial().omit({ id: true, characterId: true, classId: true, spellId: true, spellLevel: true });
export const GetCharacterSpellPreparationsResponseSchema = z.array(CharacterSpellPreparationSchema);
export const GetCharacterUsesResponseSchema = z.array(CharacterFeatureUsesSchema);

export const UpdateFeatureUsesRequestSchema = z.object({
    delta: z.number().int(), // Positive to increment, negative to decrement
});

export const UpdateMoneyRequestSchema = z.object({
    // Deprecated: wealth is now modeled via CharacterWealth.
});

export const AddItemRequestSchema = CreateCharacterItemSchema.omit({ characterId: true });

export const UpdateWoundsRequestSchema = z.object({
    wounds: commonValidations.nonNegativeInt('Wounds').optional(),
    nonlethal: commonValidations.nonNegativeInt('Nonlethal damage').optional(),
});

export const UpdateNotesRequestSchema = z.object({
    notes: z.string().max(10000, 'Notes must be less than 10000 characters').nullable(),
});

// Sync schemas for bulk operations
export const SyncItemsRequestSchema = z.object({
    items: z.array(
        CharacterItemSchema
            .omit({ characterId: true })
            .extend({
                id: z.number().int().positive().optional(), // Optional for new items (temporary IDs)
            })
    ),
});

export const SyncSpellPreparationsRequestSchema = z.object({
    spellPreparations: z.array(
        CharacterSpellPreparationSchema
            .omit({ characterId: true })
            .extend({
                id: z.number().int().positive().nullable().optional(), // null for new preparations
            })
    ),
});

export const SyncSpellsKnownRequestSchema = z.object({
    spellsKnown: z.array(
        AdvancementSpellSchema.omit({ advancementId: true })
    ),
});

export const SpellCastParamSchema = CharacterIdParamSchema.extend({
    preparationId: numericParam(),
});

export const FeatureUsesParamSchema = CharacterIdParamSchema.extend({
    featureId: numericParam(),
    entityId: numericParam(),
});

export const CharacterItemIdParamSchema = CharacterIdParamSchema.extend({
    itemId: numericParam(),
});

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
export type RemoveDisallowedSourceParamRequest = z.infer<typeof RemoveDisallowedSourceParamSchema>;
export type AbilityIdParamRequest = z.infer<typeof AbilityIdParamSchema>;
export type SyncSpellsKnownParamRequest = z.infer<typeof SyncSpellsKnownParamSchema>;

export type CreateCharacterRequest = z.infer<typeof CreateCharacterSchema>;
export type UpdateCharacterRequest = z.infer<typeof UpdateCharacterSchema>;
export type SaveCharacterRequest = z.infer<typeof SaveCharacterSchema>;
export type Character = z.infer<typeof CharacterSchema>;
export type CharacterWithRaceResponse = z.infer<typeof CharacterWithRaceSchema>;
export type CharacterWithRaceAndUserResponse = z.infer<typeof CharacterWithRaceAndUserSchema>;
export type CharacterWithAllDetailsResponse = z.infer<typeof CharacterWithAllDetailsSchema>;
export type GetAllCharactersResponse = z.infer<typeof GetAllCharactersResponseSchema>;
export type GetAllCharactersAdminResponse = z.infer<typeof GetAllCharactersAdminResponseSchema>;

// Advancement types
export type CreateAdvancementRequest = z.infer<typeof CreateAdvancementSchema>;
export type UpdateAdvancementRequest = z.infer<typeof UpdateAdvancementSchema>;
export type CharacterAdvancementResponse = z.infer<typeof CharacterAdvancementSchema>;
export type CharacterAdvancementWithDetailsResponse = z.infer<typeof CharacterAdvancementWithDetailsSchema>;

// Spell preparation types
export type CreateSpellPreparationRequest = z.infer<typeof CreateSpellPreparationSchema>;
export type UpdateSpellPreparationRequest = z.infer<typeof UpdateSpellPreparationSchema>;
export type CharacterSpellPreparationResponse = z.infer<typeof CharacterSpellPreparationSchema>;

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
export type ReorderAttackDefinitionsRequest = z.infer<typeof ReorderAttackDefinitionsSchema>;
export type CharacterSpellSelectionParamRequest = z.infer<typeof CharacterSpellSelectionParamSchema>;

// Character feature choice types
export type CharacterFeatureChoice = z.infer<typeof CharacterFeatureChoiceSchema>;
export type CharacterFeatureChoiceDraft = z.infer<typeof CharacterFeatureChoiceDraftSchema>;
export type CreateCharacterFeatureChoiceRequest = z.infer<typeof CreateCharacterFeatureChoiceSchema>;
export type UpdateCharacterFeatureChoiceRequest = z.infer<typeof UpdateCharacterFeatureChoiceSchema>;

export type CharacterEditState = z.infer<typeof CharacterEditStateSchema>;

export type CreateCharacterAbilityScoreRequest = z.infer<typeof CreateCharacterAbilityScoreSchema>;
export type UpdateCharacterAbilityScoreRequest = z.infer<typeof UpdateCharacterAbilityScoreSchema>;
export type CharacterAbilityScoreResponse = z.infer<typeof CharacterAbilityScoreSchema>;
export type UpsertCharacterAbilityScoresRequest = z.infer<typeof UpsertCharacterAbilityScoresSchema>;

// Character disallowed source types
export type CharacterDisallowedSource = z.infer<typeof CharacterDisallowedSourceSchema>;
export type CreateCharacterDisallowedSourceRequest = z.infer<typeof CreateCharacterDisallowedSourceSchema>;
export type UpdateCharacterDisallowedSourceRequest = z.infer<typeof UpdateCharacterDisallowedSourceSchema>;

// Character language map types
export type CharacterLanguageMap = z.infer<typeof CharacterLanguageMapSchema>;
export type CreateCharacterLanguageMapRequest = z.infer<typeof CreateCharacterLanguageMapSchema>;

// Character bonus skill rank types
export type CharacterBonusSkillRank = z.infer<typeof CharacterBonusSkillRankSchema>;
export type CharacterBonusSkillRankDraft = z.infer<typeof CharacterBonusSkillRankDraftSchema>;
export type CreateCharacterBonusSkillRankRequest = z.infer<typeof CreateCharacterBonusSkillRankSchema>;

// Character feature uses types
export type CharacterFeatureUses = z.infer<typeof CharacterFeatureUsesSchema>;
export type UpdateFeatureUsesRequest = z.infer<typeof UpdateFeatureUsesRequestSchema>;
export type UpdateMoneyRequest = z.infer<typeof UpdateMoneyRequestSchema>;
export type AddItemRequest = z.infer<typeof AddItemRequestSchema>;
export type UpdateWoundsRequest = z.infer<typeof UpdateWoundsRequestSchema>;
export type UpdateNotesRequest = z.infer<typeof UpdateNotesRequestSchema>;
export type SyncItemsRequest = z.infer<typeof SyncItemsRequestSchema>;
export type SyncSpellPreparationsRequest = z.infer<typeof SyncSpellPreparationsRequestSchema>;
export type SyncSpellsKnownRequest = z.infer<typeof SyncSpellsKnownRequestSchema>;
export type SpellCastParamRequest = z.infer<typeof SpellCastParamSchema>;

// Character context type
export type CharacterContext = z.infer<typeof CharacterContextSchema>;


// Pending choice schema
export const PendingChoiceSchema = z.object({
    id: z.string(),
    type: z.enum(EntityAppliesToType),
    name: z.string(),
    description: z.string(),
    source: z.string(),
    level: commonValidations.positiveInt(),
    required: z.boolean(),
    maxSelections: z.number().int().nonnegative(),
    minSelections: z.number().int().nonnegative(),
    options: z.array(commonValidations.positiveInt()), // Just an array of numeric IDs - frontend will look up names from cache
});

/**
 * Schema for a class skill entry.
 * Represents a skill that is a class skill for a character, including optional skill subtype.
 * 
 * This schema is used in resolved character results to indicate which skills are class skills.
 * 
 * @see ResolvedCharacterResultSchema - Used in resolved character results
 * @see AddSpellKnownResponseSchema - Also used in spell addition responses
 */
export const ClassSkillSchema = z.object({
    skillId: commonValidations.positiveInt(),
    skillSubId: z.number().int().nullable(),
});

/**
 * Schema for a skill bonus entry.
 * Represents a bonus applied to a skill, with the source of the bonus.
 * 
 * This schema is used in resolved character results to track skill bonuses from various sources.
 * 
 * @see ResolvedCharacterResultSchema - Used in resolved character results
 * @see AddSpellKnownResponseSchema - Also used in spell addition responses
 */
export const SkillBonusSchema = z.object({
    skillId: commonValidations.positiveInt(),
    skillSubId: z.number().int().nullable(),
    bonus: z.number(),
    source: z.string(),
});

/**
 * Schema for spell selection data for a single class.
 * 
 * Contains all spell-related data for a specific spellcasting class, including:
 * - Available spells for the class
 * - Domain spells (if the character has domains)
 * - Available free spells for spellbook classes
 * - Feature-based spells-known limits for SpellsKnown classes
 * 
 * @see ResolvedCharacterResultSchema - Used in resolved character results
 */
export const ClassSpellSelectionSchema = z.object({
    spells: z.array(CharacterSpellSelectionEntrySchema),
    domainSpells: z.array(CharacterSpellSelectionEntrySchema).optional(),
    availableFreeSpells: z.number().int().nonnegative().optional(),
    /**
     * Map of spell level -> maximum number of known spells allowed for that level
     * for this class, derived from SpellsKnownProgression feature entities.
     *
     * Only populated for SpellsKnown classes (e.g. Sorcerer, Bard). Prepared/spellbook
     * classes do not use this structure for enforcement.
     */
    maxSpellsKnownByLevel: z.record(z.string(), z.number().int().nonnegative()).optional(),
});

/**
 * Schema for resolved character result.
 * Contains all computed data from character resolution including progressions, choices, skills, feats, spells, and warnings.
 * 
 * This schema represents the complete state of a character after resolution, including:
 * - Resolved feature progressions
 * - Pending choices that need user input
 * - Class skills and skill bonuses
 * - Available and granted feats
 * - Qualified feats (list of feats the character qualifies for)
 * - Spell selection data (by class ID)
 * - Warnings and errors from resolution
 * 
 * **Feat Data Distinction**:
 * - `availableFeatsCount` (number): Count of feat slots/choices available to the character. Answers "How many feats can you select?"
 * - `qualifiedFeats` (array): List of feats the character qualifies for based on prerequisites, proficiencies, etc. Answers "Which feats can you select from?"
 * 
 * **Spell Selection Data**: The `spellSelection` field contains spell selection data for each spellcasting class
 * the character has. This data is calculated during resolution using resolved progressions, making it
 * architecturally consistent with other resolved data.
 * 
 * @see ResolvedCharacterResult - TypeScript type for this schema
 * @see AddSpellKnownResponseSchema - Uses this schema for resolvedCharacter field
 * @see ClassSpellSelectionSchema - Schema for individual class spell selection data
 */
export const ResolvedCharacterResultSchema = z.object({
    resolvedProgressions: z.array(FeatureWithRelationsSchema),
    pendingChoices: z.array(PendingChoiceSchema),
    classSkills: z.array(ClassSkillSchema),
    skillBonuses: z.array(SkillBonusSchema),
    grantedFeats: z.array(commonValidations.positiveInt()),
    /** Count of feat slots/choices available to the character. Calculated from resolved progressions. */
    availableFeatsCount: commonValidations.nonNegativeInt(),
    availableFighterBonusFeats: commonValidations.nonNegativeInt(),
    /** List of feats the character qualifies for, filtered by prerequisites, proficiencies, owned feats, etc. */
    qualifiedFeats: z.array(FeatInQueryResponseSchema),
    spellSelection: z.record(z.string(), ClassSpellSelectionSchema).optional(),
    /** Map of entity IDs to resolved formula values. Keyed by entity ID (or composite key). Used for BAB, saves, and other formula-based mechanics. */
    resolvedFormulaValues: z.record(z.string(), z.number()).optional(),
    /** Pets, familiars, and animal companions with computed stat blocks from the current draft. */
    resolvedCompanions: z.array(ResolvedCharacterCompanionDraftSchema).optional(),
    /** Selected wild-shape forms with computed Alternate Form sheets from the current draft. */
    resolvedSelectedForms: z.array(ResolvedSelectedFormDraftSchema).optional(),
    warnings: z.array(z.string()),
    errors: z.array(z.string())
});

/**
 * Schema for the available feats response.
 * 
 * Returns a paginated list of feats that are available for selection by the character,
 * filtered by prerequisites, proficiencies, and other character-specific requirements.
 * 
 * The response includes:
 * - `results`: Array of feat data (using FeatInQueryResponseSchema for type safety)
 * - `total`: Total count of available feats (non-negative integer)
 * 
 * @see GetAvailableFeatsResponse - TypeScript type for this schema
 * @see FeatInQueryResponseSchema - Schema for individual feat items in the results array
 */
export const GetAvailableFeatsResponseSchema = z.object({
    results: z.array(FeatInQueryResponseSchema),
    total: z.number().int().nonnegative(),
});

/** Response for GET /characters/:id/resolve - read-only character resolution (no lock, no session) */
export const GetCharacterResolveResponseSchema = z.object({
    resolvedCharacter: ResolvedCharacterResultSchema,
});

// Character Resolution TypeScript type exports
export type PendingChoice = z.infer<typeof PendingChoiceSchema>;
export type ClassSkill = z.infer<typeof ClassSkillSchema>;
export type SkillBonus = z.infer<typeof SkillBonusSchema>;
export type ClassSpellSelection = z.infer<typeof ClassSpellSelectionSchema>;
export type ResolvedCharacterResult = z.infer<typeof ResolvedCharacterResultSchema>;
export type GetAvailableFeatsResponse = z.infer<typeof GetAvailableFeatsResponseSchema>;
export type GetCharacterResolveResponse = z.infer<typeof GetCharacterResolveResponseSchema>;
