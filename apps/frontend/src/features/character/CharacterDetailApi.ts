import { typedApi } from '@/services/Api';
import {
    CharacterIdParamSchema,
    UpdateResponseSchema,
    CreateResponseSchema,
    CreateSpellPreparationSchema,
    UpdateSpellPreparationSchema,
    SpellPreparationParamSchema,
    GetCharacterSpellPreparationsResponseSchema,
    GetCharacterUsesResponseSchema,
    CharacterFeatureUsesSchema,
    UpdateFeatureUsesRequestSchema,
    UpdateMoneyRequestSchema,
    AddItemRequestSchema,
    UpdateWoundsRequestSchema,
    UpdateNotesRequestSchema,
    SyncItemsRequestSchema,
    SyncSpellPreparationsRequestSchema,
    SpellCastParamSchema,
    FeatureUsesParamSchema,
    CharacterItemIdParamSchema,
} from '@shared/schema';

export const CharacterDetailApi = {
    // Uses tracking
    getCharacterUses: typedApi<undefined, typeof GetCharacterUsesResponseSchema, typeof CharacterIdParamSchema>({
        path: '/characters/:id/uses',
        method: 'GET',
        paramsSchema: CharacterIdParamSchema,
        responseSchema: GetCharacterUsesResponseSchema,
    }),

    updateFeatureUses: typedApi<typeof UpdateFeatureUsesRequestSchema, typeof CharacterFeatureUsesSchema, typeof FeatureUsesParamSchema>({
        path: '/characters/:id/uses/:progressionId/:entityId',
        method: 'POST',
        requestSchema: UpdateFeatureUsesRequestSchema,
        paramsSchema: FeatureUsesParamSchema,
        responseSchema: CharacterFeatureUsesSchema,
    }),

    resetDailyUses: typedApi<undefined, typeof UpdateResponseSchema, typeof CharacterIdParamSchema>({
        path: '/characters/:id/uses/reset-daily',
        method: 'POST',
        paramsSchema: CharacterIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    resetAllUses: typedApi<undefined, typeof UpdateResponseSchema, typeof CharacterIdParamSchema>({
        path: '/characters/:id/uses/reset-all',
        method: 'POST',
        paramsSchema: CharacterIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    // Money
    updateMoney: typedApi<typeof UpdateMoneyRequestSchema, typeof UpdateResponseSchema, typeof CharacterIdParamSchema>({
        path: '/characters/:id/money',
        method: 'POST',
        requestSchema: UpdateMoneyRequestSchema,
        paramsSchema: CharacterIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    // Items
    addItem: typedApi<typeof AddItemRequestSchema, typeof CreateResponseSchema, typeof CharacterIdParamSchema>({
        path: '/characters/:id/items',
        method: 'POST',
        requestSchema: AddItemRequestSchema,
        paramsSchema: CharacterIdParamSchema,
        responseSchema: CreateResponseSchema,
    }),

    removeItem: typedApi<undefined, typeof UpdateResponseSchema, typeof CharacterItemIdParamSchema>({
        path: '/characters/:id/items/:itemId',
        method: 'DELETE',
        paramsSchema: CharacterItemIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    syncItems: typedApi<typeof SyncItemsRequestSchema, typeof UpdateResponseSchema, typeof CharacterIdParamSchema>({
        path: '/characters/:id/items/sync',
        method: 'POST',
        requestSchema: SyncItemsRequestSchema,
        paramsSchema: CharacterIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    // Wounds
    updateWounds: typedApi<typeof UpdateWoundsRequestSchema, typeof UpdateResponseSchema, typeof CharacterIdParamSchema>({
        path: '/characters/:id/wounds',
        method: 'POST',
        requestSchema: UpdateWoundsRequestSchema,
        paramsSchema: CharacterIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    // Notes
    updateNotes: typedApi<typeof UpdateNotesRequestSchema, typeof UpdateResponseSchema, typeof CharacterIdParamSchema>({
        path: '/characters/:id/notes',
        method: 'POST',
        requestSchema: UpdateNotesRequestSchema,
        paramsSchema: CharacterIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    // Spell preparation
    getSpellPreparations: typedApi<undefined, typeof GetCharacterSpellPreparationsResponseSchema, typeof CharacterIdParamSchema>({
        path: '/characters/:id/spell-preparations',
        method: 'GET',
        paramsSchema: CharacterIdParamSchema,
        responseSchema: GetCharacterSpellPreparationsResponseSchema,
    }),

    createSpellPreparation: typedApi<typeof CreateSpellPreparationSchema, typeof CreateResponseSchema>({
        path: '/characters/spell-preparations',
        method: 'POST',
        requestSchema: CreateSpellPreparationSchema,
        responseSchema: CreateResponseSchema,
    }),

    updateSpellPreparation: typedApi<typeof UpdateSpellPreparationSchema, typeof UpdateResponseSchema, typeof SpellPreparationParamSchema>({
        path: '/characters/spell-preparations/:preparationId',
        method: 'PUT',
        requestSchema: UpdateSpellPreparationSchema,
        paramsSchema: SpellPreparationParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    deleteSpellPreparation: typedApi<undefined, typeof UpdateResponseSchema, typeof SpellPreparationParamSchema>({
        path: '/characters/spell-preparations/:preparationId',
        method: 'DELETE',
        paramsSchema: SpellPreparationParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    syncSpellPreparations: typedApi<typeof SyncSpellPreparationsRequestSchema, typeof UpdateResponseSchema, typeof CharacterIdParamSchema>({
        path: '/characters/:id/spell-preparations/sync',
        method: 'POST',
        requestSchema: SyncSpellPreparationsRequestSchema,
        paramsSchema: CharacterIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    // Spell cast tracking
    castSpell: typedApi<undefined, typeof UpdateResponseSchema, typeof SpellCastParamSchema>({
        path: '/characters/:id/spell-preparations/:preparationId/cast',
        method: 'POST',
        paramsSchema: SpellCastParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    uncastSpell: typedApi<undefined, typeof UpdateResponseSchema, typeof SpellCastParamSchema>({
        path: '/characters/:id/spell-preparations/:preparationId/uncast',
        method: 'POST',
        paramsSchema: SpellCastParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    resetDailySpellPreparations: typedApi<undefined, typeof UpdateResponseSchema, typeof CharacterIdParamSchema>({
        path: '/characters/:id/spell-preparations/reset-daily',
        method: 'POST',
        paramsSchema: CharacterIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),
};
