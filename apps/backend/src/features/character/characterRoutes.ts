import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    CharacterIdParamSchema,
    CreateCharacterSchema,
    SaveCharacterSchema,
    // New schemas for advancement and spell preparation
    AdvancementIdParamSchema,
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
    RemoveDisallowedSourceParamSchema,
    // NEW: Character attack definition schemas
    CreateCharacterAttackDefinitionSchema,
    UpdateCharacterAttackDefinitionSchema,
    CharacterAttackIdParamSchema,
    ReorderAttackDefinitionsSchema,
    // NEW: Spell selection schemas
    AddSpellKnownRequestSchema,
    RemoveSpellKnownRequestSchema,
    CharacterSpellSelectionParamSchema,
} from '@shared/schema';

import {
    GetAllCharacters,
    GetAllCharactersAdmin,
    GetCharacterById,
    GetCharacterWithAllDetails,
    CreateCharacter,
    DeleteCharacter,
    SaveCharacter,
    UpdateCharacter,
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
    // NEW: Spell selection controllers
    GetCharacterSpellSelection,
    AddSpellKnown,
    RemoveSpellKnown,
} from './characterController';
import { requireAuth, requireAdmin } from '../../middleware/authMiddleware.js';

const { router: CharacterRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

// Character Read Routes
get('/', requireAuth, {}, GetAllCharacters);
get('/admin/all', requireAuth, requireAdmin, {}, GetAllCharactersAdmin);
get('/:id', requireAuth, { params: CharacterIdParamSchema }, GetCharacterById);
get('/:id/details', requireAuth, { params: CharacterIdParamSchema }, GetCharacterWithAllDetails);

// Character Write Routes
post('/', requireAuth, { body: CreateCharacterSchema }, CreateCharacter);
// Unified save endpoint - handles character + ability scores + advancement in one transaction
post('/save', requireAuth, { body: SaveCharacterSchema }, SaveCharacter);
put('/save/:id', requireAuth, { params: CharacterIdParamSchema, body: SaveCharacterSchema }, UpdateCharacter);
deleteRoute('/:id', requireAuth, { params: CharacterIdParamSchema }, DeleteCharacter);

// Character Advancement Routes
get('/:id/advancements', requireAuth, { params: CharacterIdParamSchema }, GetCharacterAdvancements);
get('/advancements/:id', requireAuth, { params: AdvancementIdParamSchema }, GetAdvancementById);
post('/advancements', requireAuth, { body: CreateAdvancementSchema }, CreateAdvancement);
put('/advancements/:id', requireAuth, { params: AdvancementIdParamSchema, body: UpdateAdvancementSchema }, UpdateAdvancement);
deleteRoute('/advancements/:id', requireAuth, { params: AdvancementIdParamSchema }, DeleteAdvancement);

// Spell Preparation Routes
get('/:id/spell-preparations', requireAuth, { params: CharacterIdParamSchema }, GetCharacterSpellPreparations);
post('/spell-preparations', requireAuth, { body: CreateSpellPreparationSchema }, CreateSpellPreparation);
put('/spell-preparations/:id/:prepKey', requireAuth, { params: SpellPreparationParamSchema, body: UpdateSpellPreparationSchema }, UpdateSpellPreparation);
deleteRoute('/spell-preparations/:id/:prepKey', requireAuth, { params: SpellPreparationParamSchema }, DeleteSpellPreparation);

// Character Ability Score Routes
get('/:id/abilities', requireAuth, { params: CharacterIdParamSchema }, GetCharacterAbilityScores);
post('/abilities', requireAuth, { body: CreateCharacterAbilityScoreSchema }, CreateCharacterAbilityScore);
put('/abilities/:id', requireAuth, { params: AbilityIdParamSchema, body: UpdateCharacterAbilityScoreSchema }, UpdateCharacterAbilityScore);
deleteRoute('/abilities/:id', requireAuth, { params: AbilityIdParamSchema }, DeleteCharacterAbilityScore);
put('/:id/abilities', requireAuth, { params: CharacterIdParamSchema, body: UpsertCharacterAbilityScoresSchema }, UpsertCharacterAbilityScores);

// NEW: Character Disallowed Sources Routes
get('/:id/disallowed-sources', requireAuth, { params: CharacterIdParamSchema }, GetDisallowedSources);
post('/disallowed-sources', requireAuth, { body: CreateCharacterDisallowedSourceSchema }, AddDisallowedSource);
deleteRoute('/:id/disallowed-sources/:sourceBookId', requireAuth, { params: RemoveDisallowedSourceParamSchema }, RemoveDisallowedSource);

// NEW: Character Attack Definition Routes
get('/:id/attack-definitions', requireAuth, { params: CharacterIdParamSchema }, GetCharacterAttackDefinitions);
post('/:id/attack-definitions', requireAuth, { params: CharacterIdParamSchema, body: CreateCharacterAttackDefinitionSchema }, CreateCharacterAttackDefinition);
put('/:id/attack-definitions/:attackId', requireAuth, { params: CharacterAttackIdParamSchema, body: UpdateCharacterAttackDefinitionSchema }, UpdateCharacterAttackDefinition);
deleteRoute('/:id/attack-definitions/:attackId', requireAuth, { params: CharacterAttackIdParamSchema }, DeleteCharacterAttackDefinition);
put('/:id/attack-definitions/reorder', requireAuth, { params: CharacterIdParamSchema, body: ReorderAttackDefinitionsSchema }, ReorderCharacterAttackDefinitions);

// NEW: Spell Selection Routes
get('/:id/spell-selection/:classId', requireAuth, { params: CharacterSpellSelectionParamSchema }, GetCharacterSpellSelection);
post('/spell-selection/add', requireAuth, { body: AddSpellKnownRequestSchema }, AddSpellKnown);
post('/spell-selection/remove', requireAuth, { body: RemoveSpellKnownRequestSchema }, RemoveSpellKnown);

export { CharacterRouter };
