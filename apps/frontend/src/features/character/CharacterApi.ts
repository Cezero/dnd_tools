import { typedApi } from '@/services/Api';
import {
    CharacterIdParamSchema,
    CreateCharacterSchema,
    UpdateResponseSchema,
    CreateResponseSchema,
    CharacterSchema,
    GetAllCharactersResponseSchema,
    CharacterWithAllDetailsSchema,
    CreateAdvancementSchema,
    UpdateAdvancementSchema,
    AdvancementIdParamSchema,
    CreateCharacterAbilityScoreSchema,
    UpdateCharacterAbilityScoreSchema,
    AbilityIdParamSchema,
    UpsertCharacterAbilityScoresSchema,
    CharacterIdParamSchema2,
    SaveCharacterSchema,
    CreateCharacterAttackDefinitionSchema,
    UpdateCharacterAttackDefinitionSchema,
    CharacterAttackDefinitionSchema,
} from '@shared/schema';
import { z } from 'zod';

export const CharacterApi = {
    getCharacters: typedApi({
        path: '/characters',
        method: 'GET',
        responseSchema: GetAllCharactersResponseSchema,
    }),

    getCharacterById: typedApi<undefined, typeof CharacterSchema, typeof CharacterIdParamSchema>({
        path: '/characters/:id',
        method: 'GET',
        paramsSchema: CharacterIdParamSchema,
        responseSchema: CharacterSchema,
    }),

    createCharacter: typedApi<typeof CreateCharacterSchema, typeof CreateResponseSchema>({
        path: '/characters',
        method: 'POST',
        requestSchema: CreateCharacterSchema,
        responseSchema: CreateResponseSchema,
    }),

    deleteCharacter: typedApi<undefined, typeof UpdateResponseSchema, typeof CharacterIdParamSchema>({
        path: '/characters/:id',
        method: 'DELETE',
        paramsSchema: CharacterIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    getCharacterWithAllDetails: typedApi<undefined, typeof CharacterWithAllDetailsSchema, typeof CharacterIdParamSchema>({
        path: '/characters/:id/details',
        method: 'GET',
        paramsSchema: CharacterIdParamSchema,
        responseSchema: CharacterWithAllDetailsSchema,
    }),

    createAdvancement: typedApi<typeof CreateAdvancementSchema, typeof CreateResponseSchema>({
        path: '/characters/advancements',
        method: 'POST',
        requestSchema: CreateAdvancementSchema,
        responseSchema: CreateResponseSchema,
    }),

    updateAdvancement: typedApi<typeof UpdateAdvancementSchema, typeof UpdateResponseSchema, typeof AdvancementIdParamSchema>({
        path: '/characters/advancements/:id',
        method: 'PUT',
        requestSchema: UpdateAdvancementSchema,
        paramsSchema: AdvancementIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    createCharacterAbilityScore: typedApi<typeof CreateCharacterAbilityScoreSchema, typeof CreateResponseSchema>({
        path: '/characters/abilities',
        method: 'POST',
        requestSchema: CreateCharacterAbilityScoreSchema,
        responseSchema: CreateResponseSchema,
    }),

    updateCharacterAbilityScore: typedApi<typeof UpdateCharacterAbilityScoreSchema, typeof UpdateResponseSchema, typeof AbilityIdParamSchema>({
        path: '/characters/abilities/:id',
        method: 'PUT',
        requestSchema: UpdateCharacterAbilityScoreSchema,
        paramsSchema: AbilityIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    deleteCharacterAbilityScore: typedApi<undefined, typeof UpdateResponseSchema, typeof AbilityIdParamSchema>({
        path: '/characters/abilities/:id',
        method: 'DELETE',
        paramsSchema: AbilityIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    upsertCharacterAbilityScores: typedApi<typeof UpsertCharacterAbilityScoresSchema, typeof UpdateResponseSchema, typeof CharacterIdParamSchema2>({
        path: '/characters/:characterId/abilities',
        method: 'PUT',
        requestSchema: UpsertCharacterAbilityScoresSchema,
        paramsSchema: CharacterIdParamSchema2,
        responseSchema: UpdateResponseSchema,
    }),

    saveCharacter: typedApi<typeof SaveCharacterSchema, typeof UpdateResponseSchema, typeof CharacterIdParamSchema>({
        path: '/characters/save/:id',
        method: 'PUT',
        requestSchema: SaveCharacterSchema,
        paramsSchema: CharacterIdParamSchema,
        responseSchema: UpdateResponseSchema, // Update response doesn't include id
    }),

    createCharacterWithSave: typedApi<typeof SaveCharacterSchema, typeof CreateResponseSchema>({
        path: '/characters/save',
        method: 'POST',
        requestSchema: SaveCharacterSchema,
        responseSchema: CreateResponseSchema,
    }),

    // Attack definition methods
    getCharacterAttackDefinitions: typedApi<undefined, z.ZodArray<typeof CharacterAttackDefinitionSchema>, typeof CharacterIdParamSchema>({
        path: '/characters/:id/attack-definitions',
        method: 'GET',
        paramsSchema: CharacterIdParamSchema,
        responseSchema: z.array(CharacterAttackDefinitionSchema),
    }),

    createCharacterAttackDefinition: typedApi<typeof CreateCharacterAttackDefinitionSchema, typeof CreateResponseSchema, typeof CharacterIdParamSchema>({
        path: '/characters/:id/attack-definitions',
        method: 'POST',
        requestSchema: CreateCharacterAttackDefinitionSchema,
        paramsSchema: CharacterIdParamSchema,
        responseSchema: CreateResponseSchema,
    }),

    updateCharacterAttackDefinition: typedApi<typeof UpdateCharacterAttackDefinitionSchema, typeof UpdateResponseSchema, ReturnType<typeof CharacterIdParamSchema.extend<{ attackId: z.ZodString }>>>({
        path: '/characters/:id/attack-definitions/:attackId',
        method: 'PUT',
        requestSchema: UpdateCharacterAttackDefinitionSchema,
        paramsSchema: CharacterIdParamSchema.extend({ attackId: z.string() }),
        responseSchema: UpdateResponseSchema,
    }),

    deleteCharacterAttackDefinition: typedApi<undefined, typeof UpdateResponseSchema, ReturnType<typeof CharacterIdParamSchema.extend<{ attackId: z.ZodString }>>>({
        path: '/characters/:id/attack-definitions/:attackId',
        method: 'DELETE',
        paramsSchema: CharacterIdParamSchema.extend({ attackId: z.string() }),
        responseSchema: UpdateResponseSchema,
    }),

    reorderCharacterAttackDefinitions: typedApi<ReturnType<typeof z.object<{ attackDefinitionIds: z.ZodArray<z.ZodNumber> }>>, typeof UpdateResponseSchema, typeof CharacterIdParamSchema>({
        path: '/characters/:id/attack-definitions/reorder',
        method: 'PUT',
        requestSchema: z.object({ attackDefinitionIds: z.array(z.number().int().positive()) }),
        paramsSchema: CharacterIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),
}; 
