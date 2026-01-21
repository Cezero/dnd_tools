import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    FeatureIdParamSchema,
    EditionIdParamSchema,
    CreateFeatureSchema,
    UpdateFeatureBasicSchema,
    UpdateFeatureSchema,
    CreateFeatureRequestSchema,
    UpdateFeaturesRequestSchema,
    FeatureQuerySchema,
    CloneClassFeaturesRequestSchema,
    ForkFeatureRequestSchema,
} from '@shared/schema';

import {
    GetAllFeatures,
    GetFeatureById,
    CreateFeature,
    UpdateFeatureById,
    DeleteFeatureById,
    CreateFeatureWithRelations,
    UpdateFeatures,
    GetFeatures,
    GetFeaturesByFeatId,
    GetFeaturesByEditionId,
    GetFeatureList,
    GetFeatureCache,
    CloneClassFeatures,
    ForkFeatureForClass,
    GetFeatureLockStatus,
} from './featureSystemController.js';
import { requireAdmin } from '../../middleware/authMiddleware.js';

const { router: FeatureSystemRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

// Core Feature Routes
get('/cache', {}, GetFeatureCache);
get('/:id', { params: FeatureIdParamSchema }, GetFeatureById);
get('/:id/lock-status', { params: FeatureIdParamSchema }, GetFeatureLockStatus);
post('/query', { body: FeatureQuerySchema }, GetAllFeatures);
post('/list', { body: FeatureQuerySchema }, GetFeatureList);
post('/', requireAdmin, { body: CreateFeatureSchema }, CreateFeature);
put('/:id', requireAdmin, { params: FeatureIdParamSchema, body: UpdateFeatureSchema }, UpdateFeatureById);
deleteRoute('/:id', requireAdmin, { params: FeatureIdParamSchema }, DeleteFeatureById);

// Feature Routes (for individual feature management)
get('/:id/features', { params: FeatureIdParamSchema }, GetFeatures);
put('/:id/features', requireAdmin, { params: FeatureIdParamSchema, body: UpdateFeaturesRequestSchema }, UpdateFeatures);

// Feature Routes (for feat management)
get('/by-feat/:id/features', { params: FeatureIdParamSchema }, GetFeaturesByFeatId);

// Feature Routes (for edition management)
get('/by-edition/:editionId/features', { params: EditionIdParamSchema }, GetFeaturesByEditionId);

// Bulk Feature Routes (for class/race creation)
post('/features/bulk', requireAdmin, { body: CreateFeatureRequestSchema }, CreateFeatureWithRelations);

// Clone and Fork Routes (for variant class creation)
post('/clone-class-features', requireAdmin, { body: CloneClassFeaturesRequestSchema }, CloneClassFeatures);
post('/fork-feature', requireAdmin, { body: ForkFeatureRequestSchema }, ForkFeatureForClass);

export { FeatureSystemRouter }; 
