import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    TrickPurposeIdParamSchema,
    CreateTrickPurposeSchema,
    UpdateTrickPurposeSchema,
} from '@shared/schema';

import {
    GetAllTrickPurposes,
    GetTrickPurposeById,
    GetTrickPurposeCache,
    CreateTrickPurpose,
    UpdateTrickPurpose,
    DeleteTrickPurpose,
} from './trickPurposeController.js';
import { requireAdmin } from '../../middleware/authMiddleware.js';

const { router: TrickPurposeRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

get('/', {}, GetAllTrickPurposes);
get('/cache', {}, GetTrickPurposeCache);
get('/:id', { params: TrickPurposeIdParamSchema }, GetTrickPurposeById);

post('/', requireAdmin, { body: CreateTrickPurposeSchema }, CreateTrickPurpose);
put('/:id', requireAdmin, { params: TrickPurposeIdParamSchema, body: UpdateTrickPurposeSchema }, UpdateTrickPurpose);
deleteRoute('/:id', requireAdmin, { params: TrickPurposeIdParamSchema }, DeleteTrickPurpose);

export { TrickPurposeRouter };
