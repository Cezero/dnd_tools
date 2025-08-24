import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    FeatureIdParamSchema,
    CreateFeatureSchema,
    UpdateFeatureSchema,
    CreateFeatureProgressionSchema,
    UpdateFeatureProgressionsRequestSchema,
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
} from './featureSystemController.js';
import { requireAdmin } from '../../middleware/authMiddleware.js';

const { router: FeatureSystemRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

// Core Feature Routes
get('/', {}, GetAllFeatures);
get('/:id', { params: FeatureIdParamSchema }, GetFeatureById);

post('/', requireAdmin, { body: CreateFeatureSchema }, CreateFeature);
put('/:id', requireAdmin, { params: FeatureIdParamSchema, body: UpdateFeatureSchema }, UpdateFeatureById);
deleteRoute('/:id', requireAdmin, { params: FeatureIdParamSchema }, DeleteFeatureById);

// Feature Progression Routes (for individual feature management)
get('/:id/progressions', { params: FeatureIdParamSchema }, GetFeatureProgressions);
put('/:id/progressions', requireAdmin, { params: FeatureIdParamSchema, body: UpdateFeatureProgressionsRequestSchema }, UpdateFeatureProgressions);

// Bulk Feature Progression Routes (for class/race creation)
post('/progressions/bulk', requireAdmin, { body: CreateFeatureProgressionSchema }, CreateFeatureProgressionWithRelations);

export { FeatureSystemRouter }; 
