import {
    SpellIdParamSchema,
    SpellClassParamSchema,
    UpdateSpellSchema,
    GetSpellResponseSchema,
    GetAllSpellsResponseSchema,
    UpdateResponseSchema,
} from '@shared/schema';

import { createQueryHooks } from './QueryHooksFactory';

export const SpellQueryHooks = {
    // Get all spells
    useGetAllSpells: createQueryHooks({
        path: '/spells',
        method: 'GET',
        responseSchema: GetAllSpellsResponseSchema,
        queryKey: 'spells',
        queryKeyBuilder: (params) => ['spells', 'list', params as string | number | object],
    }).useQuery,

    // Get spell by ID
    useGetSpellById: createQueryHooks({
        path: '/spells/:id',
        method: 'GET',
        paramsSchema: SpellIdParamSchema,
        responseSchema: GetSpellResponseSchema,
        queryKey: 'spells',
        queryKeyBuilder: (params) => {
            const typedParams = params as { pathParams?: { id?: number } } | undefined;
            return ['spells', 'item', typedParams?.pathParams?.id];
        },
    }).useQuery,

    // Update spell mutation
    useUpdateSpell: createQueryHooks({
        path: '/spells/:id',
        method: 'PUT',
        paramsSchema: SpellIdParamSchema,
        requestSchema: UpdateSpellSchema,
        responseSchema: UpdateResponseSchema,
        queryKey: 'spells',
    }).useMutation,

    // Delete spell mutation
    useDeleteSpell: createQueryHooks({
        path: '/spells/:id',
        method: 'DELETE',
        paramsSchema: SpellIdParamSchema,
        responseSchema: UpdateResponseSchema,
        queryKey: 'spells',
    }).useMutation,

    // Get spells for class
    useGetSpellsForClass: createQueryHooks({
        path: '/spells/class/:classId',
        method: 'GET',
        paramsSchema: SpellClassParamSchema,
        responseSchema: GetAllSpellsResponseSchema,
        queryKey: 'spells',
        queryKeyBuilder: (params) => {
            const typedParams = params as { pathParams?: { classId?: number } } | undefined;
            return ['spells', 'class', typedParams?.pathParams?.classId];
        },
    }).useQuery,
};
