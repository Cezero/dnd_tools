import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    CharacterIdParamSchema,
    CreateCharacterSchema,
    UpdateCharacterSchema,
    // New schemas for advancement and spell preparation
    AdvancementIdParamSchema,
    CharacterIdParamSchema2,
    SpellPreparationParamSchema,
    AttributeIdParamSchema,
    CreateAdvancementSchema,
    UpdateAdvancementSchema,
    CreateSpellPreparationSchema,
    UpdateSpellPreparationSchema,
    CreateCharacterAttributeSchema,
    UpdateCharacterAttributeSchema,
} from '@shared/schema';

import {
    GetAllCharacters,
    GetCharacterById,
    GetCharacterWithAllDetails,
    CreateCharacter,
    UpdateCharacter,
    DeleteCharacter,
    // New controller methods
    CreateAdvancement,
    UpdateAdvancement,
    DeleteAdvancement,
    GetAdvancementById,
    GetCharacterAdvancements,
    CreateSpellPreparation,
    UpdateSpellPreparation,
    DeleteSpellPreparation,
    GetCharacterSpellPreparations,
    CreateCharacterAttribute,
    UpdateCharacterAttribute,
    DeleteCharacterAttribute,
    GetCharacterAttributes,
} from './characterController';
import { requireAuth } from '../../middleware/authMiddleware.js';

const { router: CharacterRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

// Character Read Routes
get('/', requireAuth, {}, GetAllCharacters);
get('/:id', requireAuth, { params: CharacterIdParamSchema }, GetCharacterById);
get('/:id/details', requireAuth, { params: CharacterIdParamSchema }, GetCharacterWithAllDetails);

// Character Write Routes
post('/', requireAuth, { body: CreateCharacterSchema }, CreateCharacter);
put('/:id', requireAuth, { params: CharacterIdParamSchema, body: UpdateCharacterSchema }, UpdateCharacter);
deleteRoute('/:id', requireAuth, { params: CharacterIdParamSchema }, DeleteCharacter);

// Character Advancement Routes
get('/:characterId/advancements', requireAuth, { params: CharacterIdParamSchema2 }, GetCharacterAdvancements);
get('/advancements/:id', requireAuth, { params: AdvancementIdParamSchema }, GetAdvancementById);
post('/advancements', requireAuth, { body: CreateAdvancementSchema }, CreateAdvancement);
put('/advancements/:id', requireAuth, { params: AdvancementIdParamSchema, body: UpdateAdvancementSchema }, UpdateAdvancement);
deleteRoute('/advancements/:id', requireAuth, { params: AdvancementIdParamSchema }, DeleteAdvancement);

// Spell Preparation Routes
get('/:characterId/spell-preparations', requireAuth, { params: CharacterIdParamSchema2 }, GetCharacterSpellPreparations);
post('/spell-preparations', requireAuth, { body: CreateSpellPreparationSchema }, CreateSpellPreparation);
put('/spell-preparations/:characterId/:prepKey', requireAuth, { params: SpellPreparationParamSchema, body: UpdateSpellPreparationSchema }, UpdateSpellPreparation);
deleteRoute('/spell-preparations/:characterId/:prepKey', requireAuth, { params: SpellPreparationParamSchema }, DeleteSpellPreparation);

// Character Attribute Routes
get('/:characterId/attributes', requireAuth, { params: CharacterIdParamSchema2 }, GetCharacterAttributes);
post('/attributes', requireAuth, { body: CreateCharacterAttributeSchema }, CreateCharacterAttribute);
put('/attributes/:id', requireAuth, { params: AttributeIdParamSchema, body: UpdateCharacterAttributeSchema }, UpdateCharacterAttribute);
deleteRoute('/attributes/:id', requireAuth, { params: AttributeIdParamSchema }, DeleteCharacterAttribute);

export { CharacterRouter };
