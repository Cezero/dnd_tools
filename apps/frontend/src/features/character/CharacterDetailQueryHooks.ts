import { createQueryHooks } from '@/services/query/QueryHooksFactory';
import {
    AddItemRequestSchema,
    CharacterFeatureUsesSchema,
    CharacterIdParamSchema,
    CharacterItemIdParamSchema,
    CreateResponseSchema,
    CreateSpellPreparationSchema,
    FeatureUsesParamSchema,
    GetCharacterSpellPreparationsResponseSchema,
    GetCharacterUsesResponseSchema,
    SpellCastParamSchema,
    SpellPreparationParamSchema,
    SyncItemsRequestSchema,
    SyncSpellPreparationsRequestSchema,
    UpdateFeatureUsesRequestSchema,
    UpdateMoneyRequestSchema,
    UpdateNotesRequestSchema,
    UpdateResponseSchema,
    UpdateSpellPreparationSchema,
    UpdateWoundsRequestSchema,
} from '@shared/schema';

const characterUsesConfig = createQueryHooks({
    path: '/characters/:id/uses',
    method: 'GET',
    paramsSchema: CharacterIdParamSchema,
    responseSchema: GetCharacterUsesResponseSchema,
    queryKey: 'characters',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { id?: number } } | undefined;
        return ['characters', 'uses', typedParams?.pathParams?.id];
    },
});

const updateFeatureUsesConfig = createQueryHooks({
    path: '/characters/:id/uses/:featureId/:entityId',
    method: 'POST',
    requestSchema: UpdateFeatureUsesRequestSchema,
    paramsSchema: FeatureUsesParamSchema,
    responseSchema: CharacterFeatureUsesSchema,
    queryKey: 'characters',
});

const resetDailyUsesConfig = createQueryHooks({
    path: '/characters/:id/uses/reset-daily',
    method: 'POST',
    paramsSchema: CharacterIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'characters',
});

const resetAllUsesConfig = createQueryHooks({
    path: '/characters/:id/uses/reset-all',
    method: 'POST',
    paramsSchema: CharacterIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'characters',
});

const updateMoneyConfig = createQueryHooks({
    path: '/characters/:id/money',
    method: 'POST',
    requestSchema: UpdateMoneyRequestSchema,
    paramsSchema: CharacterIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'characters',
});

const addItemConfig = createQueryHooks({
    path: '/characters/:id/items',
    method: 'POST',
    requestSchema: AddItemRequestSchema,
    paramsSchema: CharacterIdParamSchema,
    responseSchema: CreateResponseSchema,
    queryKey: 'characters',
});

const removeItemConfig = createQueryHooks({
    path: '/characters/:id/items/:itemId',
    method: 'DELETE',
    paramsSchema: CharacterItemIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'characters',
});

const syncItemsConfig = createQueryHooks({
    path: '/characters/:id/items/sync',
    method: 'POST',
    requestSchema: SyncItemsRequestSchema,
    paramsSchema: CharacterIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'characters',
});

const updateWoundsConfig = createQueryHooks({
    path: '/characters/:id/wounds',
    method: 'POST',
    requestSchema: UpdateWoundsRequestSchema,
    paramsSchema: CharacterIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'characters',
});

const updateNotesConfig = createQueryHooks({
    path: '/characters/:id/notes',
    method: 'POST',
    requestSchema: UpdateNotesRequestSchema,
    paramsSchema: CharacterIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'characters',
});

const spellPreparationsConfig = createQueryHooks({
    path: '/characters/:id/spell-preparations',
    method: 'GET',
    paramsSchema: CharacterIdParamSchema,
    responseSchema: GetCharacterSpellPreparationsResponseSchema,
    queryKey: 'characters',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { id?: number } } | undefined;
        return ['characters', 'spell-preparations', typedParams?.pathParams?.id];
    },
});

const createSpellPreparationConfig = createQueryHooks({
    path: '/characters/spell-preparations',
    method: 'POST',
    requestSchema: CreateSpellPreparationSchema,
    responseSchema: CreateResponseSchema,
    queryKey: 'characters',
});

const updateSpellPreparationConfig = createQueryHooks({
    path: '/characters/spell-preparations/:preparationId',
    method: 'PUT',
    requestSchema: UpdateSpellPreparationSchema,
    paramsSchema: SpellPreparationParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'characters',
});

const deleteSpellPreparationConfig = createQueryHooks({
    path: '/characters/spell-preparations/:preparationId',
    method: 'DELETE',
    paramsSchema: SpellPreparationParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'characters',
});

const syncSpellPreparationsConfig = createQueryHooks({
    path: '/characters/:id/spell-preparations/sync',
    method: 'POST',
    requestSchema: SyncSpellPreparationsRequestSchema,
    paramsSchema: CharacterIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'characters',
});

const castSpellConfig = createQueryHooks({
    path: '/characters/:id/spell-preparations/:preparationId/cast',
    method: 'POST',
    paramsSchema: SpellCastParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'characters',
});

const uncastSpellConfig = createQueryHooks({
    path: '/characters/:id/spell-preparations/:preparationId/uncast',
    method: 'POST',
    paramsSchema: SpellCastParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'characters',
});

const resetDailySpellPreparationsConfig = createQueryHooks({
    path: '/characters/:id/spell-preparations/reset-daily',
    method: 'POST',
    paramsSchema: CharacterIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'characters',
});

export const CharacterDetailQueryHooks = {
    useGetCharacterUses: characterUsesConfig.useQuery,
    useGetSpellPreparations: spellPreparationsConfig.useQuery,

    useUpdateFeatureUses: updateFeatureUsesConfig.useMutation,
    useResetDailyUses: resetDailyUsesConfig.useMutation,
    useResetAllUses: resetAllUsesConfig.useMutation,
    useUpdateMoney: updateMoneyConfig.useMutation,
    useAddItem: addItemConfig.useMutation,
    useRemoveItem: removeItemConfig.useMutation,
    useSyncItems: syncItemsConfig.useMutation,
    useUpdateWounds: updateWoundsConfig.useMutation,
    useUpdateNotes: updateNotesConfig.useMutation,
    useCreateSpellPreparation: createSpellPreparationConfig.useMutation,
    useUpdateSpellPreparation: updateSpellPreparationConfig.useMutation,
    useDeleteSpellPreparation: deleteSpellPreparationConfig.useMutation,
    useSyncSpellPreparations: syncSpellPreparationsConfig.useMutation,
    useCastSpell: castSpellConfig.useMutation,
    useUncastSpell: uncastSpellConfig.useMutation,
    useResetDailySpellPreparations: resetDailySpellPreparationsConfig.useMutation,

    // Imperative methods
    getCharacterUses: (characterId: number) => characterUsesConfig.fetch({ pathParams: { id: characterId } }),
    updateFeatureUses: (characterId: number, featureId: number, entityId: number, data: unknown) => updateFeatureUsesConfig.mutate({
        requestData: data,
        pathParams: { id: characterId, featureId, entityId },
    }),
    resetDailyUses: (characterId: number) => resetDailyUsesConfig.mutate({ pathParams: { id: characterId } }),
    resetAllUses: (characterId: number) => resetAllUsesConfig.mutate({ pathParams: { id: characterId } }),
    updateMoney: (characterId: number, data: unknown) => updateMoneyConfig.mutate({ requestData: data, pathParams: { id: characterId } }),
    addItem: (characterId: number, data: unknown) => addItemConfig.mutate({ requestData: data, pathParams: { id: characterId } }),
    removeItem: (characterId: number, itemId: number) => removeItemConfig.mutate({ pathParams: { id: characterId, itemId } }),
    syncItems: (characterId: number, data: unknown) => syncItemsConfig.mutate({ requestData: data, pathParams: { id: characterId } }),
    updateWounds: (characterId: number, data: unknown) => updateWoundsConfig.mutate({ requestData: data, pathParams: { id: characterId } }),
    updateNotes: (characterId: number, data: unknown) => updateNotesConfig.mutate({ requestData: data, pathParams: { id: characterId } }),
    getSpellPreparations: (characterId: number) => spellPreparationsConfig.fetch({ pathParams: { id: characterId } }),
    createSpellPreparation: (data: unknown) => createSpellPreparationConfig.mutate({ requestData: data }),
    updateSpellPreparation: (preparationId: number, data: unknown) => updateSpellPreparationConfig.mutate({ requestData: data, pathParams: { preparationId } }),
    deleteSpellPreparation: (preparationId: number) => deleteSpellPreparationConfig.mutate({ pathParams: { preparationId } }),
    syncSpellPreparations: (characterId: number, data: unknown) => syncSpellPreparationsConfig.mutate({ requestData: data, pathParams: { id: characterId } }),
    castSpell: (characterId: number, preparationId: number) => castSpellConfig.mutate({ pathParams: { id: characterId, preparationId } }),
    uncastSpell: (characterId: number, preparationId: number) => uncastSpellConfig.mutate({ pathParams: { id: characterId, preparationId } }),
    resetDailySpellPreparations: (characterId: number) => resetDailySpellPreparationsConfig.mutate({ pathParams: { id: characterId } }),

    // Query keys
    getCharacterUsesQueryKey: (characterId: number) => characterUsesConfig.queryKeyBuilder({ pathParams: { id: characterId } }),
    getSpellPreparationsQueryKey: (characterId: number) => spellPreparationsConfig.queryKeyBuilder({ pathParams: { id: characterId } }),
};

