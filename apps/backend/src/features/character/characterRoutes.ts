import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    CharacterIdParamSchema,
    CreateCharacterSchema,
    UpdateCharacterSchema,
    // New schemas for advancement and spell preparation
    AdvancementIdParamSchema,
    CharacterIdParamSchema2,
    SpellPreparationParamSchema,
    AbilityIdParamSchema,
    CreateAdvancementSchema,
    UpdateAdvancementSchema,
    CreateSpellPreparationSchema,
    UpdateSpellPreparationSchema,
    CreateCharacterAbilityScoreSchema,
    UpdateCharacterAbilityScoreSchema,
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
    CreateCharacterAbilityScore,
    UpdateCharacterAbilityScore,
    DeleteCharacterAbilityScore,
    GetCharacterAbilityScores,
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

// Character Ability Score Routes
get('/:characterId/abilities', requireAuth, { params: CharacterIdParamSchema2 }, GetCharacterAbilityScores);
post('/abilities', requireAuth, { body: CreateCharacterAbilityScoreSchema }, CreateCharacterAbilityScore);
put('/abilities/:id', requireAuth, { params: AbilityIdParamSchema, body: UpdateCharacterAbilityScoreSchema }, UpdateCharacterAbilityScore);
deleteRoute('/abilities/:id', requireAuth, { params: AbilityIdParamSchema }, DeleteCharacterAbilityScore);

export { CharacterRouter };
