import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    FeatureIdParamSchema,
    CreateFeatureSchema,
    UpdateFeatureSchema,
    CreateFeatureProgressionSchema,
    UpdateFeatureProgressionsRequestSchema,
    FeatureQuerySchema,
} from '@shared/schema';

import {
    GetAllFeatures,
    GetFeatureById,
    CreateFeature,
    UpdateFeatureById,
    DeleteFeatureById,
    CreateFeatureProgressionWithRelations,
    UpdateFeatureProgressions,
    GetFeatureProgressions,
    GetFeatureProgressionsByFeatId,
    GetFeatureList,
} from './featureSystemController.js';
import { requireAdmin } from '../../middleware/authMiddleware.js';

const { router: FeatureSystemRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

// Core Feature Routes
get('/:id', { params: FeatureIdParamSchema }, GetFeatureById);
post('/query', { body: FeatureQuerySchema }, GetAllFeatures);
post('/list', { body: FeatureQuerySchema }, GetFeatureList);
post('/', requireAdmin, { body: CreateFeatureSchema }, CreateFeature);
put('/:id', requireAdmin, { params: FeatureIdParamSchema, body: UpdateFeatureSchema }, UpdateFeatureById);
deleteRoute('/:id', requireAdmin, { params: FeatureIdParamSchema }, DeleteFeatureById);

// Feature Progression Routes (for individual feature management)
get('/:id/progressions', { params: FeatureIdParamSchema }, GetFeatureProgressions);
put('/:id/progressions', requireAdmin, { params: FeatureIdParamSchema, body: UpdateFeatureProgressionsRequestSchema }, UpdateFeatureProgressions);

// Feature Progression Routes (for feat management)
get('/by-feat/:id/progressions', { params: FeatureIdParamSchema }, GetFeatureProgressionsByFeatId);

// Bulk Feature Progression Routes (for class/race creation)
post('/progressions/bulk', requireAdmin, { body: CreateFeatureProgressionSchema }, CreateFeatureProgressionWithRelations);

export { FeatureSystemRouter }; 
