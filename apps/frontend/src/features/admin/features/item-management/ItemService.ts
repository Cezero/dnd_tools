import { z } from 'zod';

import { typedApi } from '@/services/Api';
import {
    ItemQuerySchema,
    ItemIdParamSchema,
    CreateItemSchema,
    UpdateItemSchema,
    ItemQueryResponseSchema,
    ItemWithDetailsSchema,
    UpdateResponseSchema,
    CreateResponseSchema,
} from '@shared/schema';

/**
 * ItemService with path parameter support
 * 
 * Usage examples:
 * 
 * // Get items with query parameters
 * const items = await ItemService.getItems({ page: 1, limit: 10 });
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
    // Get items with query parameters
    getItems: typedApi<typeof ItemQuerySchema, typeof ItemQueryResponseSchema>({
        path: '/items',
        method: 'GET',
        requestSchema: ItemQuerySchema,
        responseSchema: ItemQueryResponseSchema,
    }),

    // Get item by ID with path parameter
    getItemById: typedApi<undefined, typeof ItemWithDetailsSchema, typeof ItemIdParamSchema>({
        path: '/items/:id',
        method: 'GET',
        paramsSchema: ItemIdParamSchema,
        responseSchema: ItemWithDetailsSchema,
    }),

    // Create item
    createItem: typedApi<typeof CreateItemSchema, typeof CreateResponseSchema>({
        path: '/items',
        method: 'POST',
        requestSchema: CreateItemSchema,
        responseSchema: CreateResponseSchema,
    }),

    // Update item with path parameter
    updateItem: typedApi<typeof UpdateItemSchema, typeof UpdateResponseSchema, typeof ItemIdParamSchema>({
        path: '/items/:id',
        method: 'PUT',
        requestSchema: UpdateItemSchema,
        paramsSchema: ItemIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    // Delete item with path parameter
    deleteItem: typedApi<undefined, typeof UpdateResponseSchema, typeof ItemIdParamSchema>({
        path: '/items/:id',
        method: 'DELETE',
        paramsSchema: ItemIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),
}; 