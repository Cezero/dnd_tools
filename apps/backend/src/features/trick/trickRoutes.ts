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

// Trick Read Routes (public, with optional edition filtering)
// GET /api/tricks - Get all tricks with optional editionId query parameter
get('/', {}, GetAllTricks);
// GET /api/tricks/:id - Get specific trick by ID
get('/:id', { params: TrickIdParamSchema }, GetTrickById);

// Trick Write Routes (admin only)
// POST /api/tricks - Create trick with source book mapping
post('/', requireAdmin, { body: CreateTrickSchema }, CreateTrick);
// PUT /api/tricks/:id - Update trick with source book mapping management
put('/:id', requireAdmin, { params: TrickIdParamSchema, body: UpdateTrickSchema }, UpdateTrick);
// DELETE /api/tricks/:id - Delete trick
deleteRoute('/:id', requireAdmin, { params: TrickIdParamSchema }, DeleteTrick);

export { TrickRouter };

