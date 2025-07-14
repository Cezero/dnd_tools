import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    CharacterIdParamSchema,
    CreateCharacterSchema,
    UpdateCharacterSchema
} from '@shared/schema';

import {
    GetAllCharacters,
    GetCharacterById,
    CreateCharacter,
    UpdateCharacter,
    DeleteCharacter
} from './characterController';
import { requireAuth } from '../../middleware/authMiddleware.js';

const { router: CharacterRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

get('/', {}, GetAllCharacters);
get('/:id', { params: CharacterIdParamSchema }, GetCharacterById);
post('/', requireAuth, { body: CreateCharacterSchema }, CreateCharacter);
put('/:id', requireAuth, { params: CharacterIdParamSchema, body: UpdateCharacterSchema }, UpdateCharacter);
deleteRoute('/:id', requireAuth, { params: CharacterIdParamSchema }, DeleteCharacter);

export { CharacterRouter };
