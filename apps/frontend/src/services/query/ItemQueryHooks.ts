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
    ItemQuerySchema,
    type ItemWithDetails,
    type GetAllItemsResponse,
} from '@shared/schema';

import { createQueryHooks } from './QueryHooksFactory';

// Create query hook configurations
const itemsConfig = createQueryHooks({
    path: '/items',
    method: 'GET',
    responseSchema: GetAllItemsResponseSchema,
    queryKey: 'items',
    queryKeyBuilder: (params) => ['items', 'list', params as string | number | object],
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

// Create a custom queryFn that checks the 'items', 'list' cache first
// This works for both TanStack Query context and direct calls
const createItemByIdQueryFn = (originalQueryFn: (params?: unknown) => Promise<ItemWithDetails | null>) => {
    return async (contextOrParams: QueryFunctionContext | { pathParams?: { id?: number } } | undefined): Promise<ItemWithDetails | null> => {
        // Check if this is a QueryFunctionContext from TanStack Query
        if (contextOrParams && 'queryKey' in contextOrParams) {
            const context = contextOrParams as QueryFunctionContext;
            const queryKey = context.queryKey as (string | number)[];
            const itemId = queryKey[2] as number | undefined;

            // Check if 'items', 'list' exists in cache (with undefined params for getAll)
            if (context.client && itemId !== undefined) {
                const allItemsData = context.client.getQueryData<GetAllItemsResponse>(['items', 'list', undefined]);
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

// Create a custom useQuery hook that uses the cache-checking queryFn
const useGetItemByIdWithCache = (params?: unknown, options?: unknown) => {
    const typedParams = params as { pathParams?: { id?: number } } | undefined;
    const itemId = typedParams?.pathParams?.id;
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: itemByIdBaseConfig.queryKeyBuilder(params),
        queryFn: async () => {
            // Check cache first using the queryClient
            if (itemId !== undefined && queryClient) {
                const allItemsData = queryClient.getQueryData<GetAllItemsResponse>(['items', 'list', undefined]);
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

// Override the fetch method to also check cache
const itemByIdFetch = async (params?: unknown, options?: { staleTime?: number; gcTime?: number }, queryClient?: QueryClient) => {
    if (!queryClient) {
        // If no queryClient provided, just call the API directly
        return itemByIdQueryFn(params);
    }

    const typedParams = params as { pathParams?: { id?: number } } | undefined;
    const itemId = typedParams?.pathParams?.id;

    // Check cache first
    if (itemId !== undefined) {
        const allItemsData = queryClient.getQueryData<GetAllItemsResponse>(['items', 'list', undefined]);
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

const itemQueryConfig = createQueryHooks({
    path: '/items/query',
    method: 'GET',
    requestSchema: ItemQuerySchema,
    responseSchema: GetAllItemsResponseSchema,
    queryKey: 'items',
    queryKeyBuilder: (params) => ['items', 'query', params as string | number | object],
});

export const ItemQueryHooks = {
    // Keep existing hooks for backward compatibility during transition
    useGetItems: itemsConfig.useQuery,
    useGetItemById: itemByIdConfig.useQuery,
    useCreateItem: createItemConfig.useMutation,
    useUpdateItem: updateItemConfig.useMutation,
    useDeleteItem: deleteItemConfig.useMutation,
    useItemQuery: itemQueryConfig.useQuery,

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
    itemQuery: (data: unknown) => itemQueryConfig.fetch(data),

    // Expose query functions for advanced usage
    getItemsQueryFn: itemsConfig.queryFn,
    getItemByIdQueryFn: itemByIdConfig.queryFn,
    itemQueryQueryFn: itemQueryConfig.queryFn,
    getItemsQueryKey: (params?: unknown) => itemsConfig.queryKeyBuilder(params),
    getItemByIdQueryKey: (itemId: number) => itemByIdConfig.queryKeyBuilder({ pathParams: { id: itemId } }),
    itemQueryQueryKey: (params?: unknown) => itemQueryConfig.queryKeyBuilder(params),
};
