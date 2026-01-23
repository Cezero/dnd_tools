import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import { DraftRefRequestSchema, UpdateStateValueSchema } from '@shared/schema';

import {
    StartDraftEditing,
    UpdateDraftValue,
    SaveDraftState,
    CancelDraftEditing,
    ForceReleaseDraftLock,
} from './draftController';
import { requireAuth } from '../../../middleware/authMiddleware.js';

const { router: DraftRouter, post, put } = buildValidatedRouter();

/**
 * Generic Draft API Routes
 * 
 * These routes provide a unified interface for draft state management operations
 * across all draft types (class, race, feature, character, etc.).
 * 
 * All routes accept draftType and id in the request body to avoid string/number conversions.
 * 
 * Routes:
 * - POST /drafts/start-editing - Start editing draft
 * - PUT /drafts/update-value - Update draft value by path
 * - POST /drafts/save - Save draft state to database
 * - POST /drafts/cancel - Cancel editing
 * - POST /drafts/lock/force-release - Admin: Force release lock
 */

// Start Editing
post('/start-editing', requireAuth, {
    body: DraftRefRequestSchema,
}, StartDraftEditing);

// Update Value (path-based)
put('/update-value', requireAuth, {
    body: UpdateStateValueSchema,
}, UpdateDraftValue);

// Save State
post('/save', requireAuth, {
    body: DraftRefRequestSchema,
}, SaveDraftState);

// Cancel Editing
post('/cancel', requireAuth, {
    body: DraftRefRequestSchema,
}, CancelDraftEditing);

// Admin: Force Release Lock
post('/lock/force-release', requireAuth, {
    body: DraftRefRequestSchema,
}, ForceReleaseDraftLock);

export { DraftRouter };
