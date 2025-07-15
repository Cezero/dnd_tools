import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    FeatIdParamSchema,
    CreateFeatSchema,
    UpdateFeatSchema,
    FeatQuerySchema
} from '@shared/schema';

import {
    GetAllFeats,
    GetFeatById,
    CreateFeat,
    UpdateFeat,
    DeleteFeat,
    GetFeatQuery,
} from './featController.js';
import { requireAdmin } from '../../middleware/authMiddleware.js';

const { router: FeatRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

get('/', {}, GetAllFeats);
get('/query', { query: FeatQuerySchema }, GetFeatQuery);
get('/:id', { params: FeatIdParamSchema }, GetFeatById);

post('/', requireAdmin, { body: CreateFeatSchema }, CreateFeat);

put('/:id', requireAdmin, { params: FeatIdParamSchema, body: UpdateFeatSchema }, UpdateFeat);

deleteRoute('/:id', requireAdmin, { params: FeatIdParamSchema }, DeleteFeat);

export { FeatRouter };
