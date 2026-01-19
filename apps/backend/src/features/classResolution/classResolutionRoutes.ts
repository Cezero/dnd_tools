import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    ClassResolutionClassIdParamSchema,
    ClassResolutionParamsSchema,
    ApplyClassUpdateBodySchema,
} from '@shared/schema';

import {
    InitializeClassSession,
    GetClassSessionState,
    ApplyClassUpdate,
    SaveClassSession,
    CancelClassSession,
} from './classResolutionController';
import { requireAuth } from '../../middleware/authMiddleware.js';

const { router: ClassResolutionRouter, get, post, patch, delete: deleteRoute } = buildValidatedRouter();

// Class Resolution API Routes
// These routes will be mounted under /classes, so the full path will be:
// /api/classes/:classId/session/...

// Initialize Session
post('/:classId/session', requireAuth, { params: ClassResolutionClassIdParamSchema }, InitializeClassSession);

// Get Current State
get('/:classId/session/:sessionId', requireAuth, {
    params: ClassResolutionParamsSchema,
}, GetClassSessionState);

// Apply Update
patch('/:classId/session/:sessionId', requireAuth, {
    params: ClassResolutionParamsSchema,
    body: ApplyClassUpdateBodySchema,
}, ApplyClassUpdate);

// Save Session
post('/:classId/session/:sessionId/save', requireAuth, {
    params: ClassResolutionParamsSchema,
}, SaveClassSession);

// Cancel Session
deleteRoute('/:classId/session/:sessionId', requireAuth, {
    params: ClassResolutionParamsSchema,
}, CancelClassSession);

export { ClassResolutionRouter };
