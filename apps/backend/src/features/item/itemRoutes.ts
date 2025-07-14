import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    ItemQuerySchema,
    ItemIdParamSchema,
    CreateItemSchema,
    UpdateItemSchema
} from '@shared/schema';
import {
    GetItems,
    GetAllItems,
    GetItemById,
    CreateItem,
    UpdateItem,
    DeleteItem
} from './itemController.js';
import { requireAdmin } from '../../middleware/authMiddleware.js';

const { router: ItemRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

// Read routes
get('/', { query: ItemQuerySchema }, GetItems);
get('/all', {}, GetAllItems);
get('/:id', { params: ItemIdParamSchema }, GetItemById);

// Write routes
post('/', requireAdmin, { body: CreateItemSchema }, CreateItem);
put('/:id', requireAdmin, { params: ItemIdParamSchema, body: UpdateItemSchema }, UpdateItem);
deleteRoute('/:id', requireAdmin, { params: ItemIdParamSchema }, DeleteItem);

export { ItemRouter }; 