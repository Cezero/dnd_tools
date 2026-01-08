import { z } from 'zod';
import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    TrickIdParamSchema,
    CreateTrickSchema,
    UpdateTrickSchema,
} from '@shared/schema';

import {
    GetAllTricks,
    GetTrickById,
    CreateTrick,
    UpdateTrick,
    DeleteTrick,
} from './trickController.js';
import { requireAdmin } from '../../middleware/authMiddleware.js';

const { router: TrickRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

// Trick Read Routes
get('/', {}, GetAllTricks);
get('/:id', { params: TrickIdParamSchema }, GetTrickById);

// Trick Write Routes
post('/', requireAdmin, { body: CreateTrickSchema }, CreateTrick);
put('/:id', requireAdmin, { params: TrickIdParamSchema, body: UpdateTrickSchema }, UpdateTrick);
deleteRoute('/:id', requireAdmin, { params: TrickIdParamSchema }, DeleteTrick);

export { TrickRouter };

