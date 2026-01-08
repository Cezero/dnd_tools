import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { QueryFunctionContext, QueryClient } from '@tanstack/react-query';

import {
    SpellIdParamSchema,
    SpellClassParamSchema,
    UpdateSpellSchema,
    GetSpellResponseSchema,
    GetAllSpellsResponseSchema,
    UpdateResponseSchema,
    type GetSpellResponse,
    type GetAllSpellsResponse,
    type Spell,
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

// Create base config for spellById
const spellByIdBaseConfig = createQueryHooks({
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

// Create a custom queryFn that checks the 'spells', 'list' cache first
// This works for both TanStack Query context and direct calls
const createSpellByIdQueryFn = (originalQueryFn: (params?: unknown) => Promise<GetSpellResponse | null>) => {
    return async (contextOrParams: QueryFunctionContext | { pathParams?: { id?: number } } | undefined): Promise<GetSpellResponse | null> => {
        // Check if this is a QueryFunctionContext from TanStack Query
        if (contextOrParams && 'queryKey' in contextOrParams && 'client' in contextOrParams) {
            const context = contextOrParams as QueryFunctionContext;
            const queryKey = context.queryKey as (string | number)[];
            const spellId = queryKey[2] as number | undefined;

            // Check if 'spells', 'list' exists in cache (with undefined params for getAll)
            if (context.client && spellId !== undefined) {
                const allSpellsData = context.client.getQueryData<GetAllSpellsResponse>(['spells', 'list', undefined]);
                if (allSpellsData?.results) {
                    // GetAllSpellsResponse has Spell[] which includes id, GetSpellResponse omits id
                    // So we find by id and return the spell (which matches GetSpellResponse when id is omitted)
                    const spell = allSpellsData.results.find(s => s.id === spellId) as Spell | undefined;
                    if (spell) {
                        // Return spell without id to match GetSpellResponse schema
                        const { id: _id, ...spellWithoutId } = spell;
                        return spellWithoutId as GetSpellResponse;
                    }
                }
            }

            // Fall back to API call
            const typedParams = { pathParams: { id: spellId } };
            return originalQueryFn(typedParams);
        } else {
            // This is a direct call (not from TanStack Query context)
            // For direct calls, we can't check cache without queryClient, so just call the API
            return originalQueryFn(contextOrParams);
        }
    };
};

// Override the queryFn to use our cache-checking version
const spellByIdQueryFn = createSpellByIdQueryFn(spellByIdBaseConfig.queryFn);

// Create a custom useQuery hook that uses the cache-checking queryFn
const useGetSpellByIdWithCache = (params?: unknown, options?: unknown) => {
    const typedParams = params as { pathParams?: { id?: number } } | undefined;
    const spellId = typedParams?.pathParams?.id;
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: spellByIdBaseConfig.queryKeyBuilder(params),
        queryFn: async () => {
            // Check cache first using the queryClient
            if (spellId !== undefined && queryClient) {
                const allSpellsData = queryClient.getQueryData<GetAllSpellsResponse>(['spells', 'list', undefined]);
                if (allSpellsData?.results) {
                    const spell = allSpellsData.results.find(s => s.id === spellId) as Spell | undefined;
                    if (spell) {
                        // Return spell without id to match GetSpellResponse schema
                        const { id: _id, ...spellWithoutId } = spell;
                        return spellWithoutId as GetSpellResponse;
                    }
                }
            }

            // Fall back to API call - pass params directly
            return spellByIdQueryFn(params);
        },
        ...(options as Record<string, unknown>),
    });
};

// Override the fetch method to also check cache
const spellByIdFetch = async (params?: unknown, options?: { staleTime?: number }, queryClient?: QueryClient) => {
    if (!queryClient) {
        // If no queryClient provided, just call the API directly
        return spellByIdQueryFn(params);
    }

    const typedParams = params as { pathParams?: { id?: number } } | undefined;
    const spellId = typedParams?.pathParams?.id;

    // Check cache first
    if (spellId !== undefined) {
        const allSpellsData = queryClient.getQueryData<GetAllSpellsResponse>(['spells', 'list', undefined]);
        if (allSpellsData?.results) {
            const spell = allSpellsData.results.find(s => s.id === spellId) as Spell | undefined;
            if (spell) {
                // Return spell without id to match GetSpellResponse schema
                const { id: _id, ...spellWithoutId } = spell;
                const spellResponse = spellWithoutId as GetSpellResponse;
                // Still cache it under the individual key for consistency
                queryClient.setQueryData(['spells', 'item', spellId], spellResponse);
                return spellResponse;
            }
        }
    }

    // Fall back to normal fetch
    return queryClient.fetchQuery({
        queryKey: spellByIdBaseConfig.queryKeyBuilder(params),
        queryFn: () => spellByIdQueryFn(params),
        staleTime: options?.staleTime || 5 * 60 * 1000,
    });
};

const spellByIdConfig = {
    ...spellByIdBaseConfig,
    queryFn: spellByIdQueryFn,
    useQuery: useGetSpellByIdWithCache,
    fetch: spellByIdFetch,
};

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
    updateSpell: (spellId: number, data: unknown, queryClient?: QueryClient) => updateSpellConfig.mutate({
        requestData: data,
        pathParams: { id: spellId }
    }, queryClient),
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
