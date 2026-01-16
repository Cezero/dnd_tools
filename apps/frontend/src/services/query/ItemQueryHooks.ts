import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { QueryFunctionContext, QueryClient } from '@tanstack/react-query';

import {
    ItemIdParamSchema,
    CreateItemSchema,
    UpdateItemSchema,
    ItemWithDetailsSchema,
    UpdateResponseSchema,
    CreateResponseSchema,
    GetAllItemsResponseSchema,
    type ItemWithDetails,
    type GetAllItemsResponse,
} from '@shared/schema';

/**
 * Item Query Hooks
 * 
 * Provides query hooks and imperative methods for item-related API endpoints.
 * Includes optimized cache-checking for individual item queries and list queries.
 * 
 * **Key Features**:
 * - List queries use simplified query keys: ['items', 'list'] (no parameters)
 * - Individual item queries check list cache first before API calls (performance optimization)
 * - Client-side filtering uses items-cache endpoint instead of removed itemQuery endpoint
 * 
 * @see [Query Hooks and Caching Architecture](../../../../packages/shared/docs/application-overview/query-hooks-and-caching.md)
 */

import { createQueryHooks } from './QueryHooksFactory';

// List query configuration - returns all items with full details (weapon/armor relationships)
// Query key: ['items', 'list'] (no parameters - simplified to avoid duplicate cache entries)
// This cache is checked first by getItemById to avoid unnecessary API calls
const itemsConfig = createQueryHooks({
    path: '/items',
    method: 'GET',
    responseSchema: GetAllItemsResponseSchema,
    queryKey: 'items',
    queryKeyBuilder: () => ['items', 'list'], // No parameters - endpoint doesn't accept query params
});

// Create base config for itemById
const itemByIdBaseConfig = createQueryHooks({
    path: '/items/:id',
    method: 'GET',
    paramsSchema: ItemIdParamSchema,
    responseSchema: ItemWithDetailsSchema,
    queryKey: 'items',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { id?: number } } | undefined;
        return ['items', 'item', typedParams?.pathParams?.id];
    },
});

/**
 * Creates a custom queryFn that checks the list cache first before making API calls.
 * 
 * **Cache Optimization Pattern**:
 * 1. Check if ['items', 'list'] cache exists
 * 2. Search cache for the requested item by ID
 * 3. Return cached item if found (avoids API call)
 * 4. Fall back to API call if item not in cache
 * 
 * This optimization reduces API calls and improves performance by leveraging already-loaded list data.
 * 
 * @param originalQueryFn - The original query function that makes the API call
 * @returns Enhanced query function that checks cache first
 */
const createItemByIdQueryFn = (originalQueryFn: (params?: unknown) => Promise<ItemWithDetails | null>) => {
    return async (contextOrParams: QueryFunctionContext | { pathParams?: { id?: number } } | undefined): Promise<ItemWithDetails | null> => {
        // Check if this is a QueryFunctionContext from TanStack Query
        if (contextOrParams && 'queryKey' in contextOrParams) {
            const context = contextOrParams as QueryFunctionContext;
            const queryKey = context.queryKey as (string | number)[];
            const itemId = queryKey[2] as number | undefined;

            // Check if 'items', 'list' exists in cache
            if (context.client && itemId !== undefined) {
                const allItemsData = context.client.getQueryData<GetAllItemsResponse>(['items', 'list']);
                if (allItemsData?.results) {
                    const item = allItemsData.results.find(i => i.id === itemId);
                    if (item) {
                        return item;
                    }
                }
            }

            // Fall back to API call
            const typedParams = { pathParams: { id: itemId } };
            return originalQueryFn(typedParams);
        } else {
            // This is a direct call (not from TanStack Query context)
            // For direct calls, pass params as-is
            return originalQueryFn(contextOrParams);
        }
    };
};

// Override the queryFn to use our cache-checking version
const itemByIdQueryFn = createItemByIdQueryFn(itemByIdBaseConfig.queryFn);

/**
 * Custom useQuery hook that checks list cache before making API calls.
 * 
 * This hook wraps the standard useQuery to add cache-checking optimization.
 * It first checks if the item exists in the ['items', 'list'] cache, and only
 * makes an API call if the item is not found in cache.
 */
const useGetItemByIdWithCache = (params?: unknown, options?: unknown) => {
    const typedParams = params as { pathParams?: { id?: number } } | undefined;
    const itemId = typedParams?.pathParams?.id;
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: itemByIdBaseConfig.queryKeyBuilder(params),
        queryFn: async () => {
            // Check cache first using the queryClient
            if (itemId !== undefined && queryClient) {
                const allItemsData = queryClient.getQueryData<GetAllItemsResponse>(['items', 'list']);
                if (allItemsData?.results) {
                    const item = allItemsData.results.find(i => i.id === itemId);
                    if (item) {
                        return item;
                    }
                }
            }

            // Fall back to API call - pass params directly
            return itemByIdQueryFn(params);
        },
        ...(options as Record<string, unknown>),
    });
};

/**
 * Imperative fetch method that checks list cache before making API calls.
 * 
 * **Cache-Checking Logic**:
 * 1. If queryClient provided, check ['items', 'list'] cache first
 * 2. If item found in cache, return it and also cache it under ['items', 'item', id] for consistency
 * 3. If not in cache or no queryClient, fall back to normal fetchQuery
 * 
 * This ensures that individual item queries leverage the list cache when available,
 * reducing API calls and improving performance.
 */
const itemByIdFetch = async (params?: unknown, options?: { staleTime?: number; gcTime?: number }, queryClient?: QueryClient) => {
    if (!queryClient) {
        // If no queryClient provided, just call the API directly
        return itemByIdQueryFn(params);
    }

    const typedParams = params as { pathParams?: { id?: number } } | undefined;
    const itemId = typedParams?.pathParams?.id;

    // Check cache first
    if (itemId !== undefined) {
        const allItemsData = queryClient.getQueryData<GetAllItemsResponse>(['items', 'list']);
        if (allItemsData?.results) {
            const item = allItemsData.results.find(i => i.id === itemId);
            if (item) {
                // Still cache it under the individual key for consistency
                queryClient.setQueryData(['items', 'item', itemId], item);
                return item;
            }
        }
    }

    // Fall back to normal fetch - use the base config's queryFn directly
    return queryClient.fetchQuery({
        queryKey: itemByIdBaseConfig.queryKeyBuilder(params),
        queryFn: () => itemByIdBaseConfig.queryFn(params),
        staleTime: options?.staleTime || 5 * 60 * 1000,
        gcTime: options?.gcTime || 10 * 60 * 1000,
    });
};

const itemByIdConfig = {
    ...itemByIdBaseConfig,
    queryFn: itemByIdQueryFn,
    useQuery: useGetItemByIdWithCache,
    fetch: itemByIdFetch,
};

const createItemConfig = createQueryHooks({
    path: '/items',
    method: 'POST',
    requestSchema: CreateItemSchema,
    responseSchema: CreateResponseSchema,
    queryKey: 'items',
});

const updateItemConfig = createQueryHooks({
    path: '/items/:id',
    method: 'PUT',
    requestSchema: UpdateItemSchema,
    paramsSchema: ItemIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'items',
});

const deleteItemConfig = createQueryHooks({
    path: '/items/:id',
    method: 'DELETE',
    paramsSchema: ItemIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'items',
});

/**
 * Item Query Hooks Export
 * 
 * Provides React hooks and imperative methods for item-related operations.
 * 
 * **Note**: The itemQueryConfig and related methods were removed. All filtering operations
 * now use client-side filtering of the items-cache endpoint. See getItemsByProficiencyType
 * in @/services/cache/itemCache for examples of client-side filtering patterns.
 * 
 * **React Hooks**: Use in React components (useGetItems, useGetItemById, etc.)
 * **Imperative Methods**: Use in event handlers or async functions (getItems, getItemById, etc.)
 * **Query Functions**: Advanced usage for custom query logic (getItemsQueryFn, etc.)
 */
export const ItemQueryHooks = {
    // React hooks for use in components
    useGetItems: itemsConfig.useQuery,
    useGetItemById: itemByIdConfig.useQuery,
    useCreateItem: createItemConfig.useMutation,
    useUpdateItem: updateItemConfig.useMutation,
    useDeleteItem: deleteItemConfig.useMutation,

    // Add imperative methods
    getItems: (params?: unknown) => itemsConfig.fetch(params),
    getItemById: (itemId: number) => itemByIdConfig.fetch({ pathParams: { id: itemId } }),
    createItem: (data: unknown) => createItemConfig.mutate({ requestData: data }),
    updateItem: (itemId: number, data: unknown) => updateItemConfig.mutate({
        requestData: data,
        pathParams: { id: itemId }
    }),
    deleteItem: (itemId: number) => deleteItemConfig.mutate({
        pathParams: { id: itemId }
    }),

    // Expose query functions for advanced usage
    getItemsQueryFn: itemsConfig.queryFn,
    getItemByIdQueryFn: itemByIdConfig.queryFn,
    getItemsQueryKey: (params?: unknown) => itemsConfig.queryKeyBuilder(),
    getItemByIdQueryKey: (itemId: number) => itemByIdConfig.queryKeyBuilder({ pathParams: { id: itemId } }),
};
