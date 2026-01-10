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

/**
 * Spell Query Hooks
 * 
 * Provides query hooks and imperative methods for spell-related API endpoints.
 * Includes optimized cache-checking for individual spell queries.
 * 
 * **Key Features**:
 * - List queries use simplified query keys: ['spells', 'list'] (no parameters)
 * - Individual spell queries check list cache first before API calls (performance optimization)
 * - Response transformation: GetSpellResponse omits id field, so cached spells are transformed
 */

import { createQueryHooks } from './QueryHooksFactory';

// List query configuration - returns all spells with full details
// Query key: ['spells', 'list'] (no parameters - simplified to avoid duplicate cache entries)
// This cache is checked first by getSpellById to avoid unnecessary API calls
const spellsConfig = createQueryHooks({
    path: '/spells',
    method: 'GET',
    responseSchema: GetAllSpellsResponseSchema,
    queryKey: 'spells',
    queryKeyBuilder: () => ['spells', 'list'], // No parameters - endpoint doesn't accept query params
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

/**
 * Creates a custom queryFn that checks the list cache first before making API calls.
 * 
 * **Cache Optimization Pattern**:
 * 1. Check if ['spells', 'list'] cache exists
 * 2. Search cache for the requested spell by ID
 * 3. Transform spell (remove id field) to match GetSpellResponse schema
 * 4. Return cached spell if found (avoids API call)
 * 5. Fall back to API call if spell not in cache
 * 
 * **Note**: GetSpellResponse omits the id field, so cached spells (which include id)
 * must be transformed before returning to match the expected response schema.
 * 
 * @param originalQueryFn - The original query function that makes the API call
 * @returns Enhanced query function that checks cache first
 */
const createSpellByIdQueryFn = (originalQueryFn: (params?: unknown) => Promise<GetSpellResponse | null>) => {
    return async (contextOrParams: QueryFunctionContext | { pathParams?: { id?: number } } | undefined): Promise<GetSpellResponse | null> => {
        // Check if this is a QueryFunctionContext from TanStack Query
        if (contextOrParams && 'queryKey' in contextOrParams && 'client' in contextOrParams) {
            const context = contextOrParams as QueryFunctionContext;
            const queryKey = context.queryKey as (string | number)[];
            const spellId = queryKey[2] as number | undefined;

            // Check if 'spells', 'list' exists in cache
            if (context.client && spellId !== undefined) {
                const allSpellsData = context.client.getQueryData<GetAllSpellsResponse>(['spells', 'list']);
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

/**
 * Custom useQuery hook that checks list cache before making API calls.
 * 
 * This hook wraps the standard useQuery to add cache-checking optimization.
 * It first checks if the spell exists in the ['spells', 'list'] cache, transforms
 * it to match GetSpellResponse schema (removes id field), and only makes an API
 * call if the spell is not found in cache.
 */
const useGetSpellByIdWithCache = (params?: unknown, options?: unknown) => {
    const typedParams = params as { pathParams?: { id?: number } } | undefined;
    const spellId = typedParams?.pathParams?.id;
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: spellByIdBaseConfig.queryKeyBuilder(params),
        queryFn: async () => {
            // Check cache first using the queryClient
            if (spellId !== undefined && queryClient) {
                const allSpellsData = queryClient.getQueryData<GetAllSpellsResponse>(['spells', 'list']);
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

/**
 * Imperative fetch method that checks list cache before making API calls.
 * 
 * **Cache-Checking Logic**:
 * 1. If queryClient provided, check ['spells', 'list'] cache first
 * 2. If spell found in cache, transform it (remove id field) to match GetSpellResponse schema
 * 3. Cache transformed spell under ['spells', 'item', id] for consistency
 * 4. If not in cache or no queryClient, fall back to normal fetchQuery
 * 
 * This ensures that individual spell queries leverage the list cache when available,
 * reducing API calls and improving performance.
 */
const spellByIdFetch = async (params?: unknown, options?: { staleTime?: number }, queryClient?: QueryClient) => {
    if (!queryClient) {
        // If no queryClient provided, just call the API directly
        return spellByIdQueryFn(params);
    }

    const typedParams = params as { pathParams?: { id?: number } } | undefined;
    const spellId = typedParams?.pathParams?.id;

    // Check cache first
    if (spellId !== undefined) {
        const allSpellsData = queryClient.getQueryData<GetAllSpellsResponse>(['spells', 'list']);
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
    getAllSpellsQueryKey: (params?: unknown) => spellsConfig.queryKeyBuilder(),
    getSpellByIdQueryKey: (spellId: number) => spellByIdConfig.queryKeyBuilder({ pathParams: { id: spellId } }),
    getSpellsForClassQueryKey: (classId: number) => spellsForClassConfig.queryKeyBuilder({ pathParams: { classId } }),
};
