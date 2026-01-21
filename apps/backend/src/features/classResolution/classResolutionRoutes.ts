import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    ClassResolutionClassIdParamSchema,
    ApplyClassUpdateBodySchema,
} from '@shared/schema';

import {
    StartClassEditing,
    GetClassState,
    ApplyClassUpdate,
    SaveClassState,
    CancelClassEditing,
} from './classResolutionController';
import { requireAuth } from '../../middleware/authMiddleware.js';

const { router: ClassResolutionRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

// Class Resolution API Routes
// These routes will be mounted under /classes, so the full path will be:
// /api/classes/:classId/...

// Start Editing
post('/:classId/start-editing', requireAuth, {
    params: ClassResolutionClassIdParamSchema
}, StartClassEditing);

// Get Current State
get('/:classId/state', requireAuth, {
    params: ClassResolutionClassIdParamSchema,
}, GetClassState);

// Apply Update
put('/:classId/update', requireAuth, {
    params: ClassResolutionClassIdParamSchema,
    body: ApplyClassUpdateBodySchema,
}, ApplyClassUpdate);

// Save State
post('/:classId/save', requireAuth, {
    params: ClassResolutionClassIdParamSchema,
}, SaveClassState);

// Cancel Editing
post('/:classId/cancel', requireAuth, {
    params: ClassResolutionClassIdParamSchema,
}, CancelClassEditing);

export { ClassResolutionRouter };
