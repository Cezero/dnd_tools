import { z } from 'zod';
import { Api } from '@/services/Api';
import type { FeatInQueryResponse } from '@shared/schema';

/**
 * Character update operation schema
 */
const CharacterUpdateSchema = z.discriminatedUnion('type', [
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
            sourceType: z.number().int().nonnegative(),
            sourceId: z.number().int().positive(),
        }),
    }),
    z.object({
        type: z.literal('REMOVE_DISALLOWED_SOURCE'),
        payload: z.object({
            sourceType: z.number().int().nonnegative(),
            sourceId: z.number().int().positive(),
        }),
    }),
]);

/**
 * Resolved character result schema
 */
const ResolvedCharacterResultSchema = z.object({
    resolvedProgressions: z.array(z.any()), // FeatureProgression[] - complex type, using any for now
    pendingChoices: z.array(z.any()), // PendingChoice[] - complex type, using any for now
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
 * Character resolution API client
 */
export const CharacterResolutionApi = {
    /**
     * Initialize a new resolution session
     */
    initializeSession: async (characterId: number): Promise<z.infer<typeof ResolvedCharacterResultSchema>> => {
        return Api<z.infer<typeof ResolvedCharacterResultSchema>>(
            `/characters/${characterId}/resolution/session`,
            {
                method: 'POST',
                responseSchema: ResolvedCharacterResultSchema,
            }
        );
    },

    /**
     * Resume an existing resolution session
     */
    resumeSession: async (characterId: number): Promise<z.infer<typeof ResolvedCharacterResultSchema> | null> => {
        return Api<z.infer<typeof ResolvedCharacterResultSchema> | null>(
            `/characters/${characterId}/resolution/session`,
            {
                method: 'GET',
                responseSchema: z.union([ResolvedCharacterResultSchema, z.null()]),
            }
        );
    },

    /**
     * Apply an update to the resolution session
     */
    applyUpdate: async (
        characterId: number,
        sessionId: string,
        update: z.infer<typeof CharacterUpdateSchema>
    ): Promise<z.infer<typeof ResolvedCharacterResultSchema>> => {
        return Api<z.infer<typeof ResolvedCharacterResultSchema>>(
            `/characters/${characterId}/resolution/session/${sessionId}`,
            {
                method: 'PATCH',
                body: { update },
                requestSchema: z.object({ update: CharacterUpdateSchema }),
                responseSchema: ResolvedCharacterResultSchema,
            }
        );
    },

    /**
     * Get current state of resolution session
     */
    getCurrentState: async (
        characterId: number,
        sessionId: string
    ): Promise<z.infer<typeof ResolvedCharacterResultSchema>> => {
        return Api<z.infer<typeof ResolvedCharacterResultSchema>>(
            `/characters/${characterId}/resolution/session/${sessionId}`,
            {
                method: 'GET',
                responseSchema: ResolvedCharacterResultSchema,
            }
        );
    },

    /**
     * Save session to database
     */
    saveSession: async (
        characterId: number,
        sessionId: string
    ): Promise<{ character: any }> => {
        return Api<{ character: any }>(
            `/characters/${characterId}/resolution/session/${sessionId}/save`,
            {
                method: 'POST',
                responseSchema: z.object({ character: z.any() }),
            }
        );
    },

    /**
     * Cancel session without saving
     */
    cancelSession: async (
        characterId: number,
        sessionId: string
    ): Promise<void> => {
        return Api<void>(
            `/characters/${characterId}/resolution/session/${sessionId}`,
            {
                method: 'DELETE',
                responseSchema: z.object({ success: z.boolean() }).transform(() => undefined),
            }
        );
    },

    /**
     * Get available feats for a character (filtered by prerequisites and proficiencies)
     */
    getAvailableFeats: async (characterId: number): Promise<{ results: FeatInQueryResponse[]; total: number }> => {
        return Api<{ results: FeatInQueryResponse[]; total: number }>(
            `/characters/${characterId}/resolution/available-feats`,
            {
                method: 'GET',
                responseSchema: z.object({
                    results: z.array(z.any()) as z.ZodType<FeatInQueryResponse[]>,
                    total: z.number().int().nonnegative(),
                }),
            }
        );
    },
};

/**
 * Export types for use in components
 */
export type CharacterUpdate = z.infer<typeof CharacterUpdateSchema>;
export type ResolvedCharacterResult = z.infer<typeof ResolvedCharacterResultSchema>;










