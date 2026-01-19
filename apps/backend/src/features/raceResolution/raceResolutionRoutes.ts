import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    RaceResolutionRaceIdParamSchema,
    RaceResolutionParamsSchema,
    ApplyRaceUpdateBodySchema,
} from '@shared/schema';

import {
    InitializeRaceSession,
    GetRaceSessionState,
    ApplyRaceUpdate,
    SaveRaceSession,
    CancelRaceSession,
} from './raceResolutionController';
import { requireAuth } from '../../middleware/authMiddleware.js';

const { router: RaceResolutionRouter, get, post, patch, delete: deleteRoute } = buildValidatedRouter();

// Race Resolution API Routes
// These routes will be mounted under /races, so the full path will be:
// /api/races/:raceId/session/...

// Initialize Session
post('/:raceId/session', requireAuth, { params: RaceResolutionRaceIdParamSchema }, InitializeRaceSession);

// Get Current State
get('/:raceId/session/:sessionId', requireAuth, {
    params: RaceResolutionParamsSchema,
}, GetRaceSessionState);

// Apply Update
patch('/:raceId/session/:sessionId', requireAuth, {
    params: RaceResolutionParamsSchema,
    body: ApplyRaceUpdateBodySchema,
}, ApplyRaceUpdate);

// Save Session
post('/:raceId/session/:sessionId/save', requireAuth, {
    params: RaceResolutionParamsSchema,
}, SaveRaceSession);

// Cancel Session
deleteRoute('/:raceId/session/:sessionId', requireAuth, {
    params: RaceResolutionParamsSchema,
}, CancelRaceSession);

export { RaceResolutionRouter };
