import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    DraftRefRequestSchema,
    DraftRefQueryOptionalSchema,
} from '@shared/schema';

import {
    GetMySession,
    AddViewingEntity,
    RemoveViewingEntity,
    SetEditingEntity,
    ClearEditingEntity,
} from './UserSessionController';
import { requireAuth } from '../../../middleware/authMiddleware.js';

/**
 * Router for user session management endpoints.
 * 
 * All routes require authentication.
 * 
 * Routes:
 * - GET /api/sessions/me - Get current user's session
 * - POST /api/sessions/me/viewing - Add entity to viewing list
 * - DELETE /api/sessions/me/viewing - Remove entity from viewing list
 * - POST /api/sessions/me/editing - Set editing entity
 * - DELETE /api/sessions/me/editing - Clear editing entity
 * 
 * @see UserSessionController - For endpoint implementations
 */
const { router: UserSessionRouter, get, post, delete: deleteRoute } = buildValidatedRouter();

// Get current user's session
get('/me', requireAuth, {}, GetMySession);

// Add entity to viewing list
post('/me/viewing', requireAuth, { body: DraftRefRequestSchema }, AddViewingEntity);

// Remove entity from viewing list
deleteRoute('/me/viewing', requireAuth, { body: DraftRefRequestSchema }, RemoveViewingEntity);

// Set editing entity
post('/me/editing', requireAuth, { body: DraftRefRequestSchema }, SetEditingEntity);

// Clear editing entity (optional query params for clearing specific entity or all)
deleteRoute('/me/editing', requireAuth, { query: DraftRefQueryOptionalSchema }, ClearEditingEntity);

export { UserSessionRouter };
