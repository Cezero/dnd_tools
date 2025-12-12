import {
    ItemIdParamSchema,
    CreateItemSchema,
    UpdateItemSchema,
    ItemWithDetailsSchema,
    UpdateResponseSchema,
    CreateResponseSchema,
    GetAllItemsResponseSchema,
    ItemQuerySchema,
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

const itemByIdConfig = createQueryHooks({
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
    itemQuery: (data: unknown) => itemQueryConfig.fetch({ requestData: data }),

    // Expose query functions for advanced usage
    getItemsQueryFn: itemsConfig.queryFn,
    getItemByIdQueryFn: itemByIdConfig.queryFn,
    itemQueryQueryFn: itemQueryConfig.queryFn,
    getItemsQueryKey: (params?: unknown) => itemsConfig.queryKeyBuilder(params),
    getItemByIdQueryKey: (itemId: number) => itemByIdConfig.queryKeyBuilder({ pathParams: { id: itemId } }),
    itemQueryQueryKey: (params?: unknown) => itemQueryConfig.queryKeyBuilder(params),
};
