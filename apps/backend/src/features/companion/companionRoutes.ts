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

// Companion Read Routes
get('/', {}, GetAllCompanions);
get('/:id', { params: CompanionIdParamSchema }, GetCompanionById);

// Companion Write Routes
post('/', requireAdmin, { body: CreateCompanionSchema }, CreateCompanion);
put('/:id', requireAdmin, { params: CompanionIdParamSchema, body: UpdateCompanionSchema }, UpdateCompanion);
deleteRoute('/:id', requireAdmin, { params: CompanionIdParamSchema }, DeleteCompanion);

// Character Companion Routes
get('/character/:characterId', { params: z.object({ characterId: z.string().transform((val: string) => parseInt(val)) }) }, GetCharacterCompanions);
post('/character', requireAuth, { body: CreateCharacterCompanionSchema }, CreateCharacterCompanion);
put('/character/:id', requireAuth, { params: CharacterCompanionIdParamSchema, body: UpdateCharacterCompanionSchema }, UpdateCharacterCompanion);
deleteRoute('/character/:id', requireAuth, { params: CharacterCompanionIdParamSchema }, DeleteCharacterCompanion);

export { CompanionRouter };

