import { z } from 'zod';

import { typedApi } from '@/services/Api';
import {
    ItemIdParamSchema,
    CreateItemSchema,
    UpdateItemSchema,
    ItemWithDetailsSchema,
    UpdateResponseSchema,
    CreateResponseSchema,
    GetAllItemsResponseSchema,
} from '@shared/schema';

/**
 * ItemService with path parameter support
 * 
 * Usage examples:
 *
 * // Get item by ID (path parameter)
 * const item = await ItemService.getItemById(undefined, { id: 123 });
 * 
 * // Create item
 * const newItem = await ItemService.createItem({ name: "Longsword", type: "WEAPON" });
 * 
 * // Update item (path parameter + body)
 * const updatedItem = await ItemService.updateItem(
 *   { name: "Updated Longsword" }, 
 *   { id: 123 }
 * );
 * 
 * // Delete item (path parameter)
 * await ItemService.deleteItem(undefined, { id: 123 });
 */
export const ItemService = {
    getItems: typedApi({
        path: '/items',
        method: 'GET',
        responseSchema: GetAllItemsResponseSchema,
    }),

    getItemById: typedApi<undefined, typeof ItemWithDetailsSchema, typeof ItemIdParamSchema>({
        path: '/items/:id',
        method: 'GET',
        paramsSchema: ItemIdParamSchema,
        responseSchema: ItemWithDetailsSchema,
    }),

    createItem: typedApi<typeof CreateItemSchema, typeof CreateResponseSchema>({
        path: '/items',
        method: 'POST',
        requestSchema: CreateItemSchema,
        responseSchema: CreateResponseSchema,
    }),

    updateItem: typedApi<typeof UpdateItemSchema, typeof UpdateResponseSchema, typeof ItemIdParamSchema>({
        path: '/items/:id',
        method: 'PUT',
        requestSchema: UpdateItemSchema,
        paramsSchema: ItemIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    deleteItem: typedApi<undefined, typeof UpdateResponseSchema, typeof ItemIdParamSchema>({
        path: '/items/:id',
        method: 'DELETE',
        paramsSchema: ItemIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),
}; 
