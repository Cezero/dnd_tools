import {
    SpellIdParamSchema,
    SpellClassParamSchema,
    UpdateSpellSchema,
    GetSpellResponseSchema,
    GetAllSpellsResponseSchema,
    UpdateResponseSchema,
} from '@shared/schema';

import { createQueryHooks } from './QueryHooksFactory';

// Create query hook configurations
const spellsConfig = createQueryHooks({
    path: '/spells',
    method: 'GET',
    responseSchema: GetAllSpellsResponseSchema,
    queryKey: 'spells',
    queryKeyBuilder: (params) => ['spells', 'list', params as string | number | object],
});

const spellByIdConfig = createQueryHooks({
    path: '/spells/:id',
    method: 'GET',
    paramsSchema: SpellIdParamSchema,
    responseSchema: GetSpellResponseSchema,
    queryKey: 'spells',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { id?: number } } | undefined;
        return ['spells', 'item', typedParams?.pathParams?.id];
    },
});

const updateSpellConfig = createQueryHooks({
    path: '/spells/:id',
    method: 'PUT',
    paramsSchema: SpellIdParamSchema,
    requestSchema: UpdateSpellSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'spells',
});

const deleteSpellConfig = createQueryHooks({
    path: '/spells/:id',
    method: 'DELETE',
    paramsSchema: SpellIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'spells',
});

const spellsForClassConfig = createQueryHooks({
    path: '/spells/class/:classId',
    method: 'GET',
    paramsSchema: SpellClassParamSchema,
    responseSchema: GetAllSpellsResponseSchema,
    queryKey: 'spells',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { classId?: number } } | undefined;
        return ['spells', 'class', typedParams?.pathParams?.classId];
    },
});

export const SpellQueryHooks = {
    // Keep existing hooks for backward compatibility during transition
    useGetAllSpells: spellsConfig.useQuery,
    useGetSpellById: spellByIdConfig.useQuery,
    useUpdateSpell: updateSpellConfig.useMutation,
    useDeleteSpell: deleteSpellConfig.useMutation,
    useGetSpellsForClass: spellsForClassConfig.useQuery,

    // Add imperative methods
    getAllSpells: (params?: unknown) => spellsConfig.fetch(params),
    getSpellById: (spellId: number) => spellByIdConfig.fetch({ pathParams: { id: spellId } }),
    updateSpell: (spellId: number, data: unknown) => updateSpellConfig.mutate({
        requestData: data,
        pathParams: { id: spellId }
    }),
    deleteSpell: (spellId: number) => deleteSpellConfig.mutate({
        pathParams: { id: spellId }
    }),
    getSpellsForClass: (classId: number) => spellsForClassConfig.fetch({ pathParams: { classId } }),

    // Expose query functions for advanced usage
    getAllSpellsQueryFn: spellsConfig.queryFn,
    getSpellByIdQueryFn: spellByIdConfig.queryFn,
    getSpellsForClassQueryFn: spellsForClassConfig.queryFn,
    getAllSpellsQueryKey: (params?: unknown) => spellsConfig.queryKeyBuilder(params),
    getSpellByIdQueryKey: (spellId: number) => spellByIdConfig.queryKeyBuilder({ pathParams: { id: spellId } }),
    getSpellsForClassQueryKey: (classId: number) => spellsForClassConfig.queryKeyBuilder({ pathParams: { classId } }),
};
