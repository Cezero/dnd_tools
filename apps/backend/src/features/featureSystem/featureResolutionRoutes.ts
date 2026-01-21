import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    FeatureResolutionFeatureIdParamSchema,
    ApplyFeatureUpdateBodySchema,
} from '@shared/schema';

import {
    StartFeatureEditing,
    GetFeatureState,
    ApplyFeatureUpdate,
    SaveFeatureState,
    CancelFeatureEditing,
    ForceReleaseFeatureLock,
} from './featureResolutionController';
import { requireAuth } from '../../middleware/authMiddleware.js';

const { router: FeatureResolutionRouter, get, post, put } = buildValidatedRouter();

// Feature Resolution API Routes
// These routes will be mounted under /features, so the full path will be:
// /api/features/:featureId/...

// Start Editing
post('/:featureId/start-editing', requireAuth, {
    params: FeatureResolutionFeatureIdParamSchema
}, StartFeatureEditing);

// Get Current State
get('/:featureId/state', requireAuth, {
    params: FeatureResolutionFeatureIdParamSchema,
}, GetFeatureState);

// Apply Update
put('/:featureId/update', requireAuth, {
    params: FeatureResolutionFeatureIdParamSchema,
    body: ApplyFeatureUpdateBodySchema,
}, ApplyFeatureUpdate);

// Save State
post('/:featureId/save', requireAuth, {
    params: FeatureResolutionFeatureIdParamSchema,
}, SaveFeatureState);

// Cancel Editing
post('/:featureId/cancel', requireAuth, {
    params: FeatureResolutionFeatureIdParamSchema,
}, CancelFeatureEditing);

// Admin: Force Release Lock
post('/:featureId/lock/force-release', requireAuth, {
    params: FeatureResolutionFeatureIdParamSchema,
}, ForceReleaseFeatureLock);

export { FeatureResolutionRouter };
