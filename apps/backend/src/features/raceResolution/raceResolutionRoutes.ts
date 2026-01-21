import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    RaceResolutionRaceIdParamSchema,
    ApplyRaceUpdateBodySchema,
} from '@shared/schema';

import {
    StartRaceEditing,
    GetRaceState,
    ApplyRaceUpdate,
    SaveRaceState,
    CancelRaceEditing,
} from './raceResolutionController';
import { requireAuth } from '../../middleware/authMiddleware.js';

const { router: RaceResolutionRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

// Race Resolution API Routes
// These routes will be mounted under /races, so the full path will be:
// /api/races/:raceId/...

// Start Editing
post('/:raceId/start-editing', requireAuth, {
    params: RaceResolutionRaceIdParamSchema
}, StartRaceEditing);

// Get Current State
get('/:raceId/state', requireAuth, {
    params: RaceResolutionRaceIdParamSchema,
}, GetRaceState);

// Apply Update
put('/:raceId/update', requireAuth, {
    params: RaceResolutionRaceIdParamSchema,
    body: ApplyRaceUpdateBodySchema,
}, ApplyRaceUpdate);

// Save State
post('/:raceId/save', requireAuth, {
    params: RaceResolutionRaceIdParamSchema,
}, SaveRaceState);

// Cancel Editing
post('/:raceId/cancel', requireAuth, {
    params: RaceResolutionRaceIdParamSchema,
}, CancelRaceEditing);

export { RaceResolutionRouter };
