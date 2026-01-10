import { z } from 'zod';
import { EntityAppliesToType } from '@shared/static-data';
import { FeatureProgressionSchema } from './feature.js';
import { CharacterWithAllDetailsSchema } from './character.js';
import { FeatInQueryResponseSchema } from './feat.js';
import type { CharacterWithAllDetailsResponse } from './character.js';
import type { FeatInQueryResponse } from './feat.js';

// Character Update Schema - discriminated union for all update operations
export const CharacterUpdateSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('SET_ABILITY_SCORE'),
        payload: z.object({
            abilityId: z.number().int().positive(),
            value: z.number().int().min(1).max(100),
        }),
    }),
    z.object({
        type: z.literal('SET_SKILL_RANK'),
        payload: z.object({
            skillId: z.number().int().positive(),
            skillSubId: z.number().int().nullable(),
            customSubtype: z.string().nullable(),
            pointsSpent: z.number().int().min(0),
        }),
    }),
    z.object({
        type: z.literal('SET_RACE'),
        payload: z.object({
            raceId: z.number().int().positive(),
        }),
    }),
    z.object({
        type: z.literal('SET_CLASS'),
        payload: z.object({
            classId: z.number().int().positive(),
        }),
    }),
    z.object({
        type: z.literal('SET_SECONDARY_CLASS'),
        payload: z.object({
            secondaryClassId: z.number().int().positive().nullable(),
        }),
    }),
    z.object({
        type: z.literal('SET_LEVEL'),
        payload: z.object({
            level: z.number().int().positive().max(20),
        }),
    }),
    z.object({
        type: z.literal('MAKE_CHOICE'),
        payload: z.object({
            progressionId: z.number().int().positive(),
            featureEntityId: z.number().int().positive(),
            appliesToId: z.number().int().positive(),
            appliesToSubId: z.number().int().nullable(),
        }),
    }),
    z.object({
        type: z.literal('SET_FEAT'),
        payload: z.object({
            featId: z.number().int().positive(),
            featSubId: z.number().int().nullable(),
        }),
    }),
    z.object({
        type: z.literal('REMOVE_FEAT'),
        payload: z.object({
            featId: z.number().int().positive(),
        }),
    }),
    z.object({
        type: z.literal('SET_DISALLOWED_SOURCE'),
        payload: z.object({
            sourceBookId: z.number().int().positive(),
        }),
    }),
    z.object({
        type: z.literal('REMOVE_DISALLOWED_SOURCE'),
        payload: z.object({
            sourceBookId: z.number().int().positive(),
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
    value: z.number().int().positive(),
});

// Pending choice schema
export const PendingChoiceSchema = z.object({
    id: z.string(),
    type: z.enum(EntityAppliesToType),
    name: z.string(),
    description: z.string(),
    source: z.string(),
    level: z.number().int().positive(),
    required: z.boolean(),
    maxSelections: z.number().int().nonnegative(),
    minSelections: z.number().int().nonnegative(),
    options: z.array(PendingChoiceOptionSchema),
});

// Resolved character result schema
export const ResolvedCharacterResultSchema = z.object({
    resolvedProgressions: z.array(FeatureProgressionSchema),
    pendingChoices: z.array(PendingChoiceSchema),
    classSkills: z.array(z.object({
        skillId: z.number().int().positive(),
        skillSubId: z.number().int().nullable(),
    })),
    skillBonuses: z.array(z.object({
        skillId: z.number().int().positive(),
        skillSubId: z.number().int().nullable(),
        bonus: z.number(),
        source: z.string(),
    })),
    grantedFeats: z.array(z.number().int().positive()),
    availableFeats: z.number().int().nonnegative(),
    availableFighterBonusFeats: z.number().int().nonnegative(),
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
export type ResolvedCharacterResult = z.infer<typeof ResolvedCharacterResultSchema>;
export type SaveSessionResponse = z.infer<typeof SaveSessionResponseSchema>;
export type GetAvailableFeatsResponse = z.infer<typeof GetAvailableFeatsResponseSchema>;
