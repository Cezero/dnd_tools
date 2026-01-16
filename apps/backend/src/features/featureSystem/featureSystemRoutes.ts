import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    FeatureIdParamSchema,
    EditionIdParamSchema,
    CreateFeatureSchema,
    UpdateFeatureSchema,
    CreateFeatureProgressionRequestSchema,
    UpdateFeatureProgressionsRequestSchema,
    FeatureQuerySchema,
    CloneClassFeaturesRequestSchema,
    ForkProgressionRequestSchema,
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
    GetFeatureProgressionsByEditionId,
    GetFeatureList,
    CloneClassFeatures,
    ForkProgressionForClass,
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

// Feature Progression Routes (for edition management)
get('/by-edition/:editionId/progressions', { params: EditionIdParamSchema }, GetFeatureProgressionsByEditionId);

// Bulk Feature Progression Routes (for class/race creation)
post('/progressions/bulk', requireAdmin, { body: CreateFeatureProgressionRequestSchema }, CreateFeatureProgressionWithRelations);

// Clone and Fork Routes (for variant class creation)
post('/clone-class-features', requireAdmin, { body: CloneClassFeaturesRequestSchema }, CloneClassFeatures);
post('/fork-progression', requireAdmin, { body: ForkProgressionRequestSchema }, ForkProgressionForClass);

export { FeatureSystemRouter }; 
