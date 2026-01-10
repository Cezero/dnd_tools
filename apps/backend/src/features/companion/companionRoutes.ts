import { z } from 'zod';

import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    CompanionIdParamSchema,
    CreateCompanionSchema,
    UpdateCompanionSchema,
    CreateCharacterCompanionSchema,
    UpdateCharacterCompanionSchema,
    CharacterCompanionIdParamSchema,
} from '@shared/schema';

import {
    GetAllCompanions,
    GetCompanionById,
    CreateCompanion,
    UpdateCompanion,
    DeleteCompanion,
    GetCharacterCompanions,
    CreateCharacterCompanion,
    UpdateCharacterCompanion,
    DeleteCharacterCompanion,
} from './companionController.js';
import { requireAdmin, requireAuth } from '../../middleware/authMiddleware.js';

const { router: CompanionRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

// Companion Definition Read Routes (public)
// GET /api/companions - Get all companion definitions
get('/', {}, GetAllCompanions);
// GET /api/companions/:id - Get specific companion definition by ID
get('/:id', { params: CompanionIdParamSchema }, GetCompanionById);

// Companion Definition Write Routes (admin only)
// POST /api/companions - Create companion definition
post('/', requireAdmin, { body: CreateCompanionSchema }, CreateCompanion);
// PUT /api/companions/:id - Update companion definition
put('/:id', requireAdmin, { params: CompanionIdParamSchema, body: UpdateCompanionSchema }, UpdateCompanion);
// DELETE /api/companions/:id - Delete companion definition
deleteRoute('/:id', requireAdmin, { params: CompanionIdParamSchema }, DeleteCompanion);

// Character Companion Routes (authenticated, ownership validated in controller)
// GET /api/companions/character/:characterId - Get all companions for a character
get('/character/:characterId', { params: z.object({ characterId: z.string().transform((val: string) => parseInt(val)) }) }, GetCharacterCompanions);
// POST /api/companions/character - Create character companion (ownership validated)
post('/character', requireAuth, { body: CreateCharacterCompanionSchema }, CreateCharacterCompanion);
// PUT /api/companions/character/:id - Update character companion (ownership validated)
put('/character/:id', requireAuth, { params: CharacterCompanionIdParamSchema, body: UpdateCharacterCompanionSchema }, UpdateCharacterCompanion);
// DELETE /api/companions/character/:id - Delete character companion (ownership validated)
deleteRoute('/character/:id', requireAuth, { params: CharacterCompanionIdParamSchema }, DeleteCharacterCompanion);

export { CompanionRouter };

