import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    FeatQuerySchema,
    FeatIdParamSchema,
    CreateFeatSchema,
    UpdateFeatSchema
} from '@shared/schema';

import {
    GetFeats,
    GetAllFeats,
    GetFeatById,
    CreateFeat,
    UpdateFeat,
    DeleteFeat,
} from './featController.js';
import { requireAdmin } from '../../middleware/authMiddleware.js';

const { router: FeatRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

get('/', { query: FeatQuerySchema }, GetFeats);

get('/all', {}, GetAllFeats);

get('/:id', { params: FeatIdParamSchema }, GetFeatById);

post('/', requireAdmin, { body: CreateFeatSchema }, CreateFeat);

put('/:id', requireAdmin, { params: FeatIdParamSchema, body: UpdateFeatSchema }, UpdateFeat);

deleteRoute('/:id', requireAdmin, { params: FeatIdParamSchema }, DeleteFeat);

export { FeatRouter };