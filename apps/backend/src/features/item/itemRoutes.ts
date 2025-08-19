import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    ItemIdParamSchema,
    CreateItemSchema,
    UpdateItemSchema,
    ItemQuerySchema
} from '@shared/schema';

import {
    GetAllItems,
    GetItemById,
    CreateItem,
    UpdateItem,
    DeleteItem,
    GetItemQuery
} from './itemController.js';
import { requireAdmin } from '../../middleware/authMiddleware.js';

const { router: ItemRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

// Read routes
get('/', {}, GetAllItems);
get('/all', {}, GetAllItems);
get('/query', { query: ItemQuerySchema }, GetItemQuery);
get('/:id', { params: ItemIdParamSchema }, GetItemById);

// Write routes
post('/', requireAdmin, { body: CreateItemSchema }, CreateItem);
put('/:id', requireAdmin, { params: ItemIdParamSchema, body: UpdateItemSchema }, UpdateItem);
deleteRoute('/:id', requireAdmin, { params: ItemIdParamSchema }, DeleteItem);

export { ItemRouter }; 
