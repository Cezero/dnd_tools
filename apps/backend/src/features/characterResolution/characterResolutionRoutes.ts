import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    CharacterResolutionCharacterIdParamSchema,
    CharacterResolutionParamsSchema,
    ApplyCharacterUpdateBodySchema,
} from '@shared/schema';

import {
    InitializeSession,
    ResumeSession,
    ApplyUpdate,
    GetCurrentState,
    SaveSession,
    CancelSession,
    GetAvailableFeats,
} from './characterResolutionController';
import { requireAuth } from '../../middleware/authMiddleware.js';

const { router: CharacterResolutionRouter, get, post, patch, delete: deleteRoute } = buildValidatedRouter();

// Resolution API Routes
// These routes will be mounted under /characters, so the full path will be:
// /api/characters/:characterId/resolution/...

// Initialize Session
post('/:characterId/resolution/session', requireAuth, { params: CharacterResolutionCharacterIdParamSchema }, InitializeSession);

// Resume Session
get('/:characterId/resolution/session', requireAuth, { params: CharacterResolutionCharacterIdParamSchema }, ResumeSession);

// Apply Update
patch('/:characterId/resolution/session/:sessionId', requireAuth, {
    params: CharacterResolutionParamsSchema,
    body: ApplyCharacterUpdateBodySchema,
}, ApplyUpdate);

// Get Current State
get('/:characterId/resolution/session/:sessionId', requireAuth, {
    params: CharacterResolutionParamsSchema,
}, GetCurrentState);

// Save Session
post('/:characterId/resolution/session/:sessionId/save', requireAuth, {
    params: CharacterResolutionParamsSchema,
}, SaveSession);

// Cancel Session
deleteRoute('/:characterId/resolution/session/:sessionId', requireAuth, {
    params: CharacterResolutionParamsSchema,
}, CancelSession);

// Get Available Feats
get('/:characterId/resolution/available-feats', requireAuth, {
    params: CharacterResolutionCharacterIdParamSchema,
}, GetAvailableFeats);

export { CharacterResolutionRouter };

