import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    FeatureIdParamSchema,
    CreateFeatureSchema,
    UpdateFeatureSchema,
    CreateFeatureProgressionSchema,
} from '@shared/schema';

import {
    GetAllFeatures,
    GetFeatureById,
    CreateFeature,
    UpdateFeatureById,
    DeleteFeatureById,
    CreateFeatureProgressionWithRelations,
} from './featureSystemController.js';
import { requireAdmin } from '../../middleware/authMiddleware.js';

const { router: FeatureSystemRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

// Core Feature Routes
get('/', {}, GetAllFeatures);
get('/:id', { params: FeatureIdParamSchema }, GetFeatureById);

post('/', requireAdmin, { body: CreateFeatureSchema }, CreateFeature);
put('/:id', requireAdmin, { params: FeatureIdParamSchema, body: UpdateFeatureSchema }, UpdateFeatureById);
deleteRoute('/:id', requireAdmin, { params: FeatureIdParamSchema }, DeleteFeatureById);

// Bulk Feature Progression Routes (for class/race creation)
post('/progressions/bulk', requireAdmin, { body: CreateFeatureProgressionSchema }, CreateFeatureProgressionWithRelations);

export { FeatureSystemRouter }; 
