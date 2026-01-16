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
    // NEW: Character detail schemas
    UpdateFeatureUsesRequestSchema,
    UpdateMoneyRequestSchema,
    AddItemRequestSchema,
    UpdateWoundsRequestSchema,
    UpdateNotesRequestSchema,
    SyncItemsRequestSchema,
    SyncSpellPreparationsRequestSchema,
    SyncSpellsKnownRequestSchema,
    SyncSpellsKnownParamSchema,
    SpellCastParamSchema,
    FeatureUsesParamSchema,
    CharacterItemIdParamSchema,
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
    // NEW: Character detail controllers
    GetCharacterUses,
    UpdateFeatureUses,
    ResetDailyUses,
    ResetAllUses,
    UpdateMoney,
    AddItem,
    RemoveItem,
    UpdateWounds,
    UpdateNotes,
    SyncItems,
    SyncSpellPreparations,
    SyncSpellsKnown,
    CastSpell,
    UncastSpell,
    ResetDailySpellPreparations,
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
post('/:id/spell-preparations', requireAuth, { params: CharacterIdParamSchema, body: CreateSpellPreparationSchema }, CreateSpellPreparation);
put('/spell-preparations/:preparationId', requireAuth, { params: SpellPreparationParamSchema, body: UpdateSpellPreparationSchema }, UpdateSpellPreparation);
deleteRoute('/spell-preparations/:preparationId', requireAuth, { params: SpellPreparationParamSchema }, DeleteSpellPreparation);

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

// NEW: Character Detail Routes (uses tracking, money, items, wounds, spell cast)
get('/:id/uses', requireAuth, { params: CharacterIdParamSchema }, GetCharacterUses);
post('/:id/uses/:progressionId/:entityId', requireAuth, { params: FeatureUsesParamSchema, body: UpdateFeatureUsesRequestSchema }, UpdateFeatureUses);
post('/:id/uses/reset-daily', requireAuth, { params: CharacterIdParamSchema }, ResetDailyUses);
post('/:id/uses/reset-all', requireAuth, { params: CharacterIdParamSchema }, ResetAllUses);
post('/:id/money', requireAuth, { params: CharacterIdParamSchema, body: UpdateMoneyRequestSchema }, UpdateMoney);
post('/:id/items', requireAuth, { params: CharacterIdParamSchema, body: AddItemRequestSchema }, AddItem);
post('/:id/items/sync', requireAuth, { params: CharacterIdParamSchema, body: SyncItemsRequestSchema }, SyncItems);
deleteRoute('/:id/items/:itemId', requireAuth, { params: CharacterItemIdParamSchema }, RemoveItem);
post('/:id/wounds', requireAuth, { params: CharacterIdParamSchema, body: UpdateWoundsRequestSchema }, UpdateWounds);
post('/:id/notes', requireAuth, { params: CharacterIdParamSchema, body: UpdateNotesRequestSchema }, UpdateNotes);
post('/:id/spell-preparations/:preparationId/cast', requireAuth, { params: SpellCastParamSchema }, CastSpell);
post('/:id/spell-preparations/:preparationId/uncast', requireAuth, { params: SpellCastParamSchema }, UncastSpell);
post('/:id/spell-preparations/sync', requireAuth, { params: CharacterIdParamSchema, body: SyncSpellPreparationsRequestSchema }, SyncSpellPreparations);
post('/:id/spell-preparations/reset-daily', requireAuth, { params: CharacterIdParamSchema }, ResetDailySpellPreparations);
post('/:id/advancements/:advancementId/spells-known/sync', requireAuth, { params: SyncSpellsKnownParamSchema, body: SyncSpellsKnownRequestSchema }, SyncSpellsKnown);

export { CharacterRouter };
