import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    FeatIdParamSchema,
    BaseFeatSchema,
    CreateFeatWithProgressionsSchema,
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
    GetAllFeatsFull,
    GetAllFeatsWithFeatureInfo,
} from './featController.js';
import { requireAdmin } from '../../middleware/authMiddleware.js';

const { router: FeatRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

get('/', {}, GetAllFeats);
get('/full', {}, GetAllFeatsFull);
get('/with-feature-info', {}, GetAllFeatsWithFeatureInfo);
get('/cache', { query: FeatQuerySchema }, GetFeatCache);
get('/query', { query: FeatQuerySchema }, GetFeatQuery);
get('/list', { query: FeatQuerySchema }, GetFeatList);
get('/:id', { params: FeatIdParamSchema }, GetFeatById);

post('/', requireAdmin, { body: CreateFeatWithProgressionsSchema }, CreateFeat);

put('/:id', requireAdmin, { params: FeatIdParamSchema, body: BaseFeatSchema }, UpdateFeat);

deleteRoute('/:id', requireAdmin, { params: FeatIdParamSchema }, DeleteFeat);

export { FeatRouter };
