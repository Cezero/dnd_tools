import { z } from 'zod';
import { EntityAppliesToType } from '@shared/static-data';
import { FeatureProgressionSchema } from './feature.js';
import { CharacterWithAllDetailsSchema } from './character.js';
import { FeatInQueryResponseSchema } from './feat.js';
import { CharacterSpellSelectionEntrySchema } from './spell.js';
import { commonValidations } from './common.js';

// Character Update Schema - discriminated union for all update operations
export const CharacterUpdateSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('SET_ABILITY_SCORE'),
        payload: z.object({
            abilityId: commonValidations.positiveInt(),
            value: z.number().int().min(1).max(100),
        }),
    }),
    z.object({
        type: z.literal('SET_SKILL_RANK'),
        payload: z.object({
            skillId: commonValidations.positiveInt(),
            skillSubId: z.number().int().nullable(),
            customSubtype: z.string().nullable(),
            pointsSpent: commonValidations.nonNegativeInt(),
        }),
    }),
    z.object({
        type: z.literal('SET_RACE'),
        payload: z.object({
            raceId: commonValidations.positiveInt(),
        }),
    }),
    z.object({
        type: z.literal('SET_CLASS'),
        payload: z.object({
            classId: commonValidations.positiveInt(),
        }),
    }),
    z.object({
        type: z.literal('SET_SECONDARY_CLASS'),
        payload: z.object({
            secondaryClassId: commonValidations.positiveInt().nullable(),
        }),
    }),
    z.object({
        type: z.literal('SET_LEVEL'),
        payload: z.object({
            level: z.number().int().positive().max(20), // Keep as-is since it has max(20) constraint
        }),
    }),
    z.object({
        type: z.literal('MAKE_CHOICE'),
        payload: z.object({
            progressionId: commonValidations.positiveInt(),
            featureEntityId: commonValidations.positiveInt(),
            appliesToId: commonValidations.positiveInt(),
            appliesToSubId: z.number().int().nullable(),
        }),
    }),
    z.object({
        type: z.literal('SET_FEAT'),
        payload: z.object({
            featId: commonValidations.positiveInt(),
            featSubId: z.number().int().nullable(),
        }),
    }),
    z.object({
        type: z.literal('REMOVE_FEAT'),
        payload: z.object({
            featId: commonValidations.positiveInt(),
        }),
    }),
    z.object({
        type: z.literal('SET_DISALLOWED_SOURCE'),
        payload: z.object({
            sourceBookId: commonValidations.positiveInt(),
        }),
    }),
    z.object({
        type: z.literal('REMOVE_DISALLOWED_SOURCE'),
        payload: z.object({
            sourceBookId: commonValidations.positiveInt(),
        }),
    }),
]);

// Route parameter schemas
export const CharacterResolutionCharacterIdParamSchema = z.object({
    characterId: z.string().regex(/^\d+$/),
});

export const SessionIdParamSchema = z.object({
    sessionId: z.string().uuid(),
});

export const CharacterResolutionParamsSchema = CharacterResolutionCharacterIdParamSchema.extend({
    sessionId: z.string().uuid(),
});

// Body schema for applying updates
export const ApplyCharacterUpdateBodySchema = z.object({
    update: CharacterUpdateSchema,
});

// Pending choice option schema
export const PendingChoiceOptionSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    value: commonValidations.positiveInt(),
});

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
    options: z.array(PendingChoiceOptionSchema),
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
 * 
 * @see ResolvedCharacterResultSchema - Used in resolved character results
 */
export const ClassSpellSelectionSchema = z.object({
    spells: z.array(CharacterSpellSelectionEntrySchema),
    domainSpells: z.array(CharacterSpellSelectionEntrySchema).optional(),
    availableFreeSpells: z.number().int().nonnegative().optional(),
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
    resolvedProgressions: z.array(FeatureProgressionSchema),
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
    warnings: z.array(z.string()),
    errors: z.array(z.string()),
    sessionId: z.string().uuid(),
});

/**
 * Schema for the save session response.
 * 
 * When a resolution session is saved, the backend persists the character state to the database
 * and returns the updated character with all details. This schema validates that response structure.
 * 
 * @see SaveSessionResponse - TypeScript type for this schema
 * @see CharacterWithAllDetailsSchema - Schema for the character data
 */
export const SaveSessionResponseSchema = z.object({
    character: CharacterWithAllDetailsSchema,
});

/**
 * Schema for the cancel session response.
 * 
 * When a resolution session is cancelled, the backend returns a success indicator.
 * This schema transforms the response to void to match the API client's return type,
 * as the frontend doesn't need the success value.
 * 
 * The transform pattern is used because the backend returns `{ success: boolean }` but
 * the frontend API client expects `Promise<void>` for this operation.
 */
export const CancelSessionResponseSchema = z.object({
    success: z.boolean(),
}).transform(() => undefined);

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

// TypeScript type exports
export type CharacterUpdate = z.infer<typeof CharacterUpdateSchema>;
export type CharacterResolutionCharacterIdParamRequest = z.infer<typeof CharacterResolutionCharacterIdParamSchema>;
export type SessionIdParamRequest = z.infer<typeof SessionIdParamSchema>;
export type CharacterResolutionParamsRequest = z.infer<typeof CharacterResolutionParamsSchema>;
export type ApplyCharacterUpdateBodyRequest = z.infer<typeof ApplyCharacterUpdateBodySchema>;
export type PendingChoiceOption = z.infer<typeof PendingChoiceOptionSchema>;
export type PendingChoice = z.infer<typeof PendingChoiceSchema>;
export type ClassSkill = z.infer<typeof ClassSkillSchema>;
export type SkillBonus = z.infer<typeof SkillBonusSchema>;
export type ClassSpellSelection = z.infer<typeof ClassSpellSelectionSchema>;
export type ResolvedCharacterResult = z.infer<typeof ResolvedCharacterResultSchema>;
export type SaveSessionResponse = z.infer<typeof SaveSessionResponseSchema>;
export type GetAvailableFeatsResponse = z.infer<typeof GetAvailableFeatsResponseSchema>;
