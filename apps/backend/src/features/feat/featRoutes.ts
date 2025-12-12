import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    FeatIdParamSchema,
    BaseFeatSchema,
    FeatQuerySchema
} from '@shared/schema';

import {
    GetAllFeats,
    GetFeatById,
    CreateFeat,
    UpdateFeat,
    DeleteFeat,
    GetFeatQuery,
    GetFeatList,
    GetFeatCache,
} from './featController.js';
import { requireAdmin } from '../../middleware/authMiddleware.js';

const { router: FeatRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

get('/', {}, GetAllFeats);
get('/cache', { query: FeatQuerySchema }, GetFeatCache);
get('/query', { query: FeatQuerySchema }, GetFeatQuery);
get('/list', { query: FeatQuerySchema }, GetFeatList);
get('/:id', { params: FeatIdParamSchema }, GetFeatById);

post('/', requireAdmin, { body: BaseFeatSchema }, CreateFeat);

put('/:id', requireAdmin, { params: FeatIdParamSchema, body: BaseFeatSchema }, UpdateFeat);

deleteRoute('/:id', requireAdmin, { params: FeatIdParamSchema }, DeleteFeat);

export { FeatRouter };
