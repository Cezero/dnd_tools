import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    DeityIdParamSchema,
    CreateDeitySchema,
    UpdateDeitySchema
} from '@shared/schema';

import {
    GetAllDeities,
    GetDeityById,
    CreateDeity,
    UpdateDeity,
    DeleteDeity,
    ValidateDeitySelection,
    GetDeityCache,
} from './deityController.js';
import { requireAdmin } from '../../middleware/authMiddleware.js';

const { router: DeityRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

// Deity Read Routes
get('/', {}, GetAllDeities);
get('/cache', {}, GetDeityCache);
get('/:id', { params: DeityIdParamSchema }, GetDeityById);

// Deity Write Routes
post('/', requireAdmin, { body: CreateDeitySchema }, CreateDeity);
put('/:id', requireAdmin, { params: DeityIdParamSchema, body: UpdateDeitySchema }, UpdateDeity);
deleteRoute('/:id', requireAdmin, { params: DeityIdParamSchema }, DeleteDeity);

// Deity-specific routes
post('/validate-selection', {}, ValidateDeitySelection);

export { DeityRouter };
