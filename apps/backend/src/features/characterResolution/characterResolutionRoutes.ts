import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import { z } from 'zod';
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

// Character Update Schema
const CharacterUpdateSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('SET_ABILITY_SCORE'),
        payload: z.object({
            abilityId: z.number().int().positive(),
            value: z.number().int().min(1).max(100),
        }),
    }),
    z.object({
        type: z.literal('SET_SKILL_RANK'),
        payload: z.object({
            skillId: z.number().int().positive(),
            skillSubId: z.number().int().nullable(),
            customSubtype: z.string().nullable(),
            pointsSpent: z.number().int().min(0),
        }),
    }),
    z.object({
        type: z.literal('SET_RACE'),
        payload: z.object({
            raceId: z.number().int().positive(),
        }),
    }),
    z.object({
        type: z.literal('SET_CLASS'),
        payload: z.object({
            classId: z.number().int().positive(),
        }),
    }),
    z.object({
        type: z.literal('SET_SECONDARY_CLASS'),
        payload: z.object({
            secondaryClassId: z.number().int().positive().nullable(),
        }),
    }),
    z.object({
        type: z.literal('SET_LEVEL'),
        payload: z.object({
            level: z.number().int().positive().max(20),
        }),
    }),
    z.object({
        type: z.literal('MAKE_CHOICE'),
        payload: z.object({
            progressionId: z.number().int().positive(),
            featureEntityId: z.number().int().positive(),
            appliesToId: z.number().int().positive(),
            appliesToSubId: z.number().int().nullable(),
        }),
    }),
    z.object({
        type: z.literal('SET_FEAT'),
        payload: z.object({
            featId: z.number().int().positive(),
            featSubId: z.number().int().nullable(),
        }),
    }),
    z.object({
        type: z.literal('REMOVE_FEAT'),
        payload: z.object({
            featId: z.number().int().positive(),
        }),
    }),
    z.object({
        type: z.literal('SET_DISALLOWED_SOURCE'),
        payload: z.object({
            sourceType: z.number().int().nonnegative(),
            sourceId: z.number().int().positive(),
        }),
    }),
    z.object({
        type: z.literal('REMOVE_DISALLOWED_SOURCE'),
        payload: z.object({
            sourceType: z.number().int().nonnegative(),
            sourceId: z.number().int().positive(),
        }),
    }),
]);

// Route parameter schemas
const CharacterIdParamSchema = z.object({
    characterId: z.string().regex(/^\d+$/),
});

const SessionIdParamSchema = z.object({
    sessionId: z.string().uuid(),
});

const CharacterIdAndSessionIdParamSchema = CharacterIdParamSchema.extend({
    sessionId: z.string().uuid(),
});

// Resolution API Routes
// These routes will be mounted under /characters, so the full path will be:
// /api/characters/:characterId/resolution/...

// Initialize Session
post('/:characterId/resolution/session', requireAuth, { params: CharacterIdParamSchema }, InitializeSession);

// Resume Session
get('/:characterId/resolution/session', requireAuth, { params: CharacterIdParamSchema }, ResumeSession);

// Apply Update
patch('/:characterId/resolution/session/:sessionId', requireAuth, {
    params: CharacterIdAndSessionIdParamSchema,
    body: z.object({ update: CharacterUpdateSchema }),
}, ApplyUpdate);

// Get Current State
get('/:characterId/resolution/session/:sessionId', requireAuth, {
    params: CharacterIdAndSessionIdParamSchema,
}, GetCurrentState);

// Save Session
post('/:characterId/resolution/session/:sessionId/save', requireAuth, {
    params: CharacterIdAndSessionIdParamSchema,
}, SaveSession);

// Cancel Session
deleteRoute('/:characterId/resolution/session/:sessionId', requireAuth, {
    params: CharacterIdAndSessionIdParamSchema,
}, CancelSession);

// Get Available Feats
get('/:characterId/resolution/available-feats', requireAuth, {
    params: CharacterIdParamSchema,
}, GetAvailableFeats);

export { CharacterResolutionRouter };

