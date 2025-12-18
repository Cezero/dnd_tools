import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    CharacterIdParamSchema,
    CreateCharacterSchema,
    SaveCharacterSchema,
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
    UpsertCharacterAbilityScoresSchema,
    // NEW: Character disallowed source schemas
    CreateCharacterDisallowedSourceSchema,
    // NEW: Character attack definition schemas
    CreateCharacterAttackDefinitionSchema,
    UpdateCharacterAttackDefinitionSchema,
} from '@shared/schema';
import { z } from 'zod';

import {
    GetAllCharacters,
    GetCharacterById,
    GetCharacterWithAllDetails,
    CreateCharacter,
    DeleteCharacter,
    SaveCharacter,
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
    UpsertCharacterAbilityScores,
    // NEW: Character disallowed sources controllers
    AddDisallowedSource,
    RemoveDisallowedSource,
    GetDisallowedSources,
    // NEW: Character attack definition controllers
    GetCharacterAttackDefinitions,
    CreateCharacterAttackDefinition,
    UpdateCharacterAttackDefinition,
    DeleteCharacterAttackDefinition,
    ReorderCharacterAttackDefinitions,
} from './characterController';
import { requireAuth } from '../../middleware/authMiddleware.js';

const { router: CharacterRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

// Character Read Routes
get('/', requireAuth, {}, GetAllCharacters);
get('/:id', requireAuth, { params: CharacterIdParamSchema }, GetCharacterById);
get('/:id/details', requireAuth, { params: CharacterIdParamSchema }, GetCharacterWithAllDetails);

// Character Write Routes
post('/', requireAuth, { body: CreateCharacterSchema }, CreateCharacter);
// Unified save endpoint - handles character + ability scores + advancement in one transaction
post('/save', requireAuth, { body: SaveCharacterSchema }, SaveCharacter);
put('/save/:id', requireAuth, { params: CharacterIdParamSchema, body: SaveCharacterSchema }, SaveCharacter);
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
put('/:characterId/abilities', requireAuth, { params: CharacterIdParamSchema2, body: UpsertCharacterAbilityScoresSchema }, UpsertCharacterAbilityScores);

// NEW: Character Disallowed Sources Routes
get('/:characterId/disallowed-sources', requireAuth, { params: CharacterIdParamSchema2 }, GetDisallowedSources);
post('/disallowed-sources', requireAuth, { body: CreateCharacterDisallowedSourceSchema }, AddDisallowedSource);
deleteRoute('/:characterId/disallowed-sources/:sourceBookId', requireAuth, { params: CharacterIdParamSchema2 }, RemoveDisallowedSource);

// NEW: Character Attack Definition Routes
get('/:id/attack-definitions', requireAuth, { params: CharacterIdParamSchema }, GetCharacterAttackDefinitions);
post('/:id/attack-definitions', requireAuth, { params: CharacterIdParamSchema, body: CreateCharacterAttackDefinitionSchema }, CreateCharacterAttackDefinition);
put('/:id/attack-definitions/:attackId', requireAuth, { params: CharacterIdParamSchema.extend({ attackId: z.string() }), body: UpdateCharacterAttackDefinitionSchema }, UpdateCharacterAttackDefinition);
deleteRoute('/:id/attack-definitions/:attackId', requireAuth, { params: CharacterIdParamSchema.extend({ attackId: z.string() }) }, DeleteCharacterAttackDefinition);
put('/:id/attack-definitions/reorder', requireAuth, { params: CharacterIdParamSchema, body: z.object({ attackDefinitionIds: z.array(z.number().int().positive()) }) }, ReorderCharacterAttackDefinitions);

export { CharacterRouter };
