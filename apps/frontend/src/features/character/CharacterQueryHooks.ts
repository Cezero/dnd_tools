import type { QueryClient } from '@tanstack/react-query';

import { createQueryHooks } from '@/services/query/QueryHooksFactory';
import {
    AddSpellKnownRequestSchema,
    AddSpellKnownResponseSchema,
    AbilityIdParamSchema,
    AdvancementIdParamSchema,
    CharacterIdParamSchema,
    CharacterAttackIdParamSchema,
    CharacterSchema,
    CharacterSpellSelectionParamSchema,
    CharacterSpellSelectionResponseSchema,
    CharacterWithAllDetailsSchema,
    CreateAdvancementSchema,
    CreateCharacterSchema,
    CreateCharacterAbilityScoreSchema,
    CreateCharacterAttackDefinitionSchema,
    CreateResponseSchema,
    GetAllCharactersAdminResponseSchema,
    GetAllCharactersResponseSchema,
    GetAllCharacterAttackDefinitionsResponseSchema,
    GetCharacterResolveResponseSchema,
    ReorderCharacterAttackDefinitionsSchema,
    RemoveSpellKnownRequestSchema,
    RemoveSpellKnownResponseSchema,
    SaveCharacterSchema,
    SyncSpellsKnownParamSchema,
    SyncSpellsKnownRequestSchema,
    UpdateAdvancementSchema,
    UpdateCharacterAbilityScoreSchema,
    UpdateCharacterAttackDefinitionSchema,
    UpdateResponseSchema,
    UpsertCharacterAbilityScoresSchema,
} from '@shared/schema';


// Create query hook configurations
const charactersConfig = createQueryHooks({
    path: '/characters',
    method: 'GET',
    responseSchema: GetAllCharactersResponseSchema,
    queryKey: 'characters',
    queryKeyBuilder: (params) => ['characters', 'list', params as string | number | object],
});

const characterByIdConfig = createQueryHooks({
    path: '/characters/:id',
    method: 'GET',
    paramsSchema: CharacterIdParamSchema,
    responseSchema: CharacterSchema,
    queryKey: 'characters',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { id?: number } } | undefined;
        return ['characters', 'item', typedParams?.pathParams?.id];
    },
});

const createCharacterConfig = createQueryHooks({
    path: '/characters',
    method: 'POST',
    requestSchema: CreateCharacterSchema,
    responseSchema: CreateResponseSchema,
    queryKey: 'characters',
});

const deleteCharacterConfig = createQueryHooks({
    path: '/characters/:id',
    method: 'DELETE',
    paramsSchema: CharacterIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'characters',
});

const characterWithAllDetailsConfig = createQueryHooks({
    path: '/characters/:id/details',
    method: 'GET',
    paramsSchema: CharacterIdParamSchema,
    responseSchema: CharacterWithAllDetailsSchema,
    queryKey: 'characters',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { id?: number } } | undefined;
        return ['characters', 'details', typedParams?.pathParams?.id];
    },
});

const characterResolvedConfig = createQueryHooks({
    path: '/characters/:id/resolve',
    method: 'GET',
    paramsSchema: CharacterIdParamSchema,
    responseSchema: GetCharacterResolveResponseSchema,
    queryKey: 'characters',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { id?: number } } | undefined;
        return ['characters', 'resolved', typedParams?.pathParams?.id];
    },
});

const getAllCharactersAdminConfig = createQueryHooks({
    path: '/characters/admin/all',
    method: 'GET',
    responseSchema: GetAllCharactersAdminResponseSchema,
    queryKey: 'characters',
    queryKeyBuilder: () => ['characters', 'admin', 'list'],
});

const getCharacterSpellSelectionConfig = createQueryHooks({
    path: '/characters/:id/spell-selection/:classId',
    method: 'GET',
    paramsSchema: CharacterSpellSelectionParamSchema,
    responseSchema: CharacterSpellSelectionResponseSchema,
    queryKey: 'characters',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { id?: number; classId?: string } } | undefined;
        return ['characters', 'spell-selection', typedParams?.pathParams?.id, typedParams?.pathParams?.classId];
    },
});

const addSpellKnownConfig = createQueryHooks({
    path: '/characters/spell-selection/add',
    method: 'POST',
    requestSchema: AddSpellKnownRequestSchema,
    responseSchema: AddSpellKnownResponseSchema,
    queryKey: 'characters',
});

const removeSpellKnownConfig = createQueryHooks({
    path: '/characters/spell-selection/remove',
    method: 'POST',
    requestSchema: RemoveSpellKnownRequestSchema,
    responseSchema: RemoveSpellKnownResponseSchema,
    queryKey: 'characters',
});

const createAdvancementConfig = createQueryHooks({
    path: '/characters/advancements',
    method: 'POST',
    requestSchema: CreateAdvancementSchema,
    responseSchema: CreateResponseSchema,
    queryKey: 'characters',
});

const updateAdvancementConfig = createQueryHooks({
    path: '/characters/advancements/:id',
    method: 'PUT',
    requestSchema: UpdateAdvancementSchema,
    paramsSchema: AdvancementIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'characters',
});

const createCharacterAbilityScoreConfig = createQueryHooks({
    path: '/characters/abilities',
    method: 'POST',
    requestSchema: CreateCharacterAbilityScoreSchema,
    responseSchema: CreateResponseSchema,
    queryKey: 'characters',
});

const updateCharacterAbilityScoreConfig = createQueryHooks({
    path: '/characters/abilities/:id',
    method: 'PUT',
    requestSchema: UpdateCharacterAbilityScoreSchema,
    paramsSchema: AbilityIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'characters',
});

const deleteCharacterAbilityScoreConfig = createQueryHooks({
    path: '/characters/abilities/:id',
    method: 'DELETE',
    paramsSchema: AbilityIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'characters',
});

const upsertCharacterAbilityScoresConfig = createQueryHooks({
    path: '/characters/:id/abilities',
    method: 'PUT',
    requestSchema: UpsertCharacterAbilityScoresSchema,
    paramsSchema: CharacterIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'characters',
});

const saveCharacterConfig = createQueryHooks({
    path: '/characters/save/:id',
    method: 'PUT',
    requestSchema: SaveCharacterSchema,
    paramsSchema: CharacterIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'characters',
});

const createCharacterWithSaveConfig = createQueryHooks({
    path: '/characters/save',
    method: 'POST',
    requestSchema: SaveCharacterSchema,
    responseSchema: CreateResponseSchema,
    queryKey: 'characters',
});

const characterAttackDefinitionsConfig = createQueryHooks({
    path: '/characters/:id/attack-definitions',
    method: 'GET',
    paramsSchema: CharacterIdParamSchema,
    responseSchema: GetAllCharacterAttackDefinitionsResponseSchema,
    queryKey: 'characters',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { id?: number } } | undefined;
        return ['characters', 'attack-definitions', typedParams?.pathParams?.id];
    },
});

const createCharacterAttackDefinitionConfig = createQueryHooks({
    path: '/characters/:id/attack-definitions',
    method: 'POST',
    requestSchema: CreateCharacterAttackDefinitionSchema,
    paramsSchema: CharacterIdParamSchema,
    responseSchema: CreateResponseSchema,
    queryKey: 'characters',
});

const updateCharacterAttackDefinitionConfig = createQueryHooks({
    path: '/characters/:id/attack-definitions/:attackId',
    method: 'PUT',
    requestSchema: UpdateCharacterAttackDefinitionSchema,
    paramsSchema: CharacterAttackIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'characters',
});

const deleteCharacterAttackDefinitionConfig = createQueryHooks({
    path: '/characters/:id/attack-definitions/:attackId',
    method: 'DELETE',
    paramsSchema: CharacterAttackIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'characters',
});

const reorderCharacterAttackDefinitionsConfig = createQueryHooks({
    path: '/characters/:id/attack-definitions/reorder',
    method: 'PUT',
    requestSchema: ReorderCharacterAttackDefinitionsSchema,
    paramsSchema: CharacterIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'characters',
});

const syncSpellsKnownConfig = createQueryHooks({
    path: '/characters/:id/advancements/:advancementId/spells-known/sync',
    method: 'POST',
    requestSchema: SyncSpellsKnownRequestSchema,
    paramsSchema: SyncSpellsKnownParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'characters',
});

export const CharacterQueryHooks = {
    useGetCharacters: charactersConfig.useQuery,
    useGetAllCharactersAdmin: getAllCharactersAdminConfig.useQuery,
    useGetCharacterById: characterByIdConfig.useQuery,
    useGetCharacterWithAllDetails: characterWithAllDetailsConfig.useQuery,
    useGetCharacterResolved: characterResolvedConfig.useQuery,
    useCreateCharacter: createCharacterConfig.useMutation,
    useDeleteCharacter: deleteCharacterConfig.useMutation,
    useCreateAdvancement: createAdvancementConfig.useMutation,
    useUpdateAdvancement: updateAdvancementConfig.useMutation,
    useCreateCharacterAbilityScore: createCharacterAbilityScoreConfig.useMutation,
    useUpdateCharacterAbilityScore: updateCharacterAbilityScoreConfig.useMutation,
    useDeleteCharacterAbilityScore: deleteCharacterAbilityScoreConfig.useMutation,
    useUpsertCharacterAbilityScores: upsertCharacterAbilityScoresConfig.useMutation,
    useSaveCharacter: saveCharacterConfig.useMutation,
    useCreateCharacterWithSave: createCharacterWithSaveConfig.useMutation,
    useGetCharacterAttackDefinitions: characterAttackDefinitionsConfig.useQuery,
    useCreateCharacterAttackDefinition: createCharacterAttackDefinitionConfig.useMutation,
    useUpdateCharacterAttackDefinition: updateCharacterAttackDefinitionConfig.useMutation,
    useDeleteCharacterAttackDefinition: deleteCharacterAttackDefinitionConfig.useMutation,
    useReorderCharacterAttackDefinitions: reorderCharacterAttackDefinitionsConfig.useMutation,
    useSyncSpellsKnown: syncSpellsKnownConfig.useMutation,

    // Add imperative methods
    getCharacters: (params?: unknown) => charactersConfig.fetch(params),
    getAllCharactersAdmin: () => getAllCharactersAdminConfig.fetch(),
    getCharacterById: (characterId: number) => characterByIdConfig.fetch({ pathParams: { id: characterId } }),
    getCharacterWithAllDetails: (characterId: number) => characterWithAllDetailsConfig.fetch({ pathParams: { id: characterId } }),
    getCharacterResolved: (characterId: number) => characterResolvedConfig.fetch({ pathParams: { id: characterId } }),
    createCharacter: (data: unknown) => createCharacterConfig.mutate({ requestData: data }),
    deleteCharacter: (characterId: number) => deleteCharacterConfig.mutate({
        pathParams: { id: characterId }
    }),
    createAdvancement: (data: unknown) => createAdvancementConfig.mutate({ requestData: data }),
    updateAdvancement: (advancementId: number, data: unknown) => updateAdvancementConfig.mutate({
        requestData: data,
        pathParams: { id: advancementId },
    }),
    createCharacterAbilityScore: (data: unknown) => createCharacterAbilityScoreConfig.mutate({ requestData: data }),
    updateCharacterAbilityScore: (abilityId: number, data: unknown) => updateCharacterAbilityScoreConfig.mutate({
        requestData: data,
        pathParams: { id: abilityId },
    }),
    deleteCharacterAbilityScore: (abilityId: number) => deleteCharacterAbilityScoreConfig.mutate({
        pathParams: { id: abilityId },
    }),
    upsertCharacterAbilityScores: (characterId: number, data: unknown) => upsertCharacterAbilityScoresConfig.mutate({
        requestData: data,
        pathParams: { id: characterId },
    }),
    saveCharacter: (characterId: number, data: unknown) => saveCharacterConfig.mutate({
        requestData: data,
        pathParams: { id: characterId },
    }),
    createCharacterWithSave: (data: unknown) => createCharacterWithSaveConfig.mutate({ requestData: data }),
    getCharacterAttackDefinitions: (characterId: number) => characterAttackDefinitionsConfig.fetch({ pathParams: { id: characterId } }),
    createCharacterAttackDefinition: (characterId: number, data: unknown) => createCharacterAttackDefinitionConfig.mutate({
        requestData: data,
        pathParams: { id: characterId },
    }),
    updateCharacterAttackDefinition: (characterId: number, attackId: number, data: unknown) => updateCharacterAttackDefinitionConfig.mutate({
        requestData: data,
        pathParams: { id: characterId, attackId },
    }),
    deleteCharacterAttackDefinition: (characterId: number, attackId: number) => deleteCharacterAttackDefinitionConfig.mutate({
        pathParams: { id: characterId, attackId },
    }),
    reorderCharacterAttackDefinitions: (characterId: number, data: unknown) => reorderCharacterAttackDefinitionsConfig.mutate({
        requestData: data,
        pathParams: { id: characterId },
    }),
    syncSpellsKnown: (characterId: number, advancementId: number, data: unknown) => syncSpellsKnownConfig.mutate({
        requestData: data,
        pathParams: { id: characterId, advancementId },
    }),

    // Expose query functions for advanced usage
    getCharactersQueryFn: charactersConfig.queryFn,
    getAllCharactersAdminQueryFn: getAllCharactersAdminConfig.queryFn,
    getCharacterByIdQueryFn: characterByIdConfig.queryFn,
    getCharacterWithAllDetailsQueryFn: characterWithAllDetailsConfig.queryFn,
    getCharacterResolvedQueryFn: characterResolvedConfig.queryFn,
    getCharactersQueryKey: (params?: unknown) => charactersConfig.queryKeyBuilder(params),
    getAllCharactersAdminQueryKey: () => getAllCharactersAdminConfig.queryKeyBuilder(),
    getCharacterByIdQueryKey: (characterId: number) => characterByIdConfig.queryKeyBuilder({ pathParams: { id: characterId } }),
    getCharacterWithAllDetailsQueryKey: (characterId: number) => characterWithAllDetailsConfig.queryKeyBuilder({ pathParams: { id: characterId } }),
    getCharacterResolvedQueryKey: (characterId: number) => characterResolvedConfig.queryKeyBuilder({ pathParams: { id: characterId } }),
    getCharacterAttackDefinitionsQueryFn: characterAttackDefinitionsConfig.queryFn,
    getCharacterAttackDefinitionsQueryKey: (characterId: number) => characterAttackDefinitionsConfig.queryKeyBuilder({ pathParams: { id: characterId } }),

    // Spell selection hooks
    /**
     * @deprecated Use spell selection data from resolved character response (ResolvedCharacterResult.spellSelection) instead.
     * Spell selection data is now calculated during character resolution and included in the resolved character response.
     * This hook may be removed in a future version.
     */
    useGetCharacterSpellSelection: (characterId: number, classId: number, options?: unknown) => {
        return getCharacterSpellSelectionConfig.useQuery(
            { pathParams: { id: characterId, classId } },
            options
        );
    },
    useAddSpellKnown: addSpellKnownConfig.useMutation,
    useRemoveSpellKnown: removeSpellKnownConfig.useMutation,

    getCharacterSpellSelection: (characterId: number, classId: number) => getCharacterSpellSelectionConfig.fetch({ pathParams: { id: characterId, classId } }),
    addSpellKnown: (data: unknown, queryClient?: QueryClient) => addSpellKnownConfig.mutate({ requestData: data }, queryClient),
    removeSpellKnown: (data: unknown, queryClient?: QueryClient) => removeSpellKnownConfig.mutate({ requestData: data }, queryClient),

    getCharacterSpellSelectionQueryFn: getCharacterSpellSelectionConfig.queryFn,
    getCharacterSpellSelectionQueryKey: (characterId: number, classId: number) => getCharacterSpellSelectionConfig.queryKeyBuilder({ pathParams: { id: characterId, classId } }),
};
