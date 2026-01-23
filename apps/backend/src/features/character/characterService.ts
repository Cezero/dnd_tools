/**
 * Character Service - Central service for all character management operations.
 * 
 * This service provides comprehensive character management capabilities by composing
 * specialized sub-services for different functional domains:
 * - Character CRUD operations (characterCrudService)
 * - Character advancement management (characterAdvancementService)
 * - Ability score operations (characterAbilityService)
 * - Spell operations (characterSpellService)
 * - Character detail operations (characterDetailService)
 * - Attack definitions (characterAttackService)
 * - Disallowed sources (characterDisallowedSourceService)
 * - Gestalt calculations (characterGestaltService)
 * 
 * Architecture Decisions:
 * - Service Composition: Main service delegates to focused sub-services
 * - Separation of Concerns: Each sub-service handles a specific domain
 * - Backward Compatibility: Maintains the same CharacterService interface
 * - Transaction Safety: Uses Prisma transactions for multi-table operations
 * 
 * Usage Pattern:
 * Controllers call service methods which delegate to appropriate sub-services.
 * The service ensures data consistency and proper error handling throughout.
 * 
 * Source File: `apps/backend/src/features/character/characterService.ts`
 * 
 * @see CharacterService interface for method signatures
 * @see characterController for HTTP request handling
 * @see characterRoutes for API endpoint definitions
 */

import {
    characterAbilityService,
    characterAdvancementService,
    characterAttackService,
    characterCrudService,
    characterDetailService,
    characterDisallowedSourceService,
    characterGestaltService,
    characterSpellService,
} from './services';
import type { CharacterService } from './types';

/**
 * Character service implementation providing all character management operations.
 * 
 * This service object implements the CharacterService interface by composing
 * all sub-services together, maintaining backward compatibility with existing
 * controllers and routes.
 */
export const characterService: CharacterService = {
    // Character CRUD operations
    getAllCharacters: characterCrudService.getAllCharacters,
    getAllCharactersAdmin: characterCrudService.getAllCharactersAdmin,
    getCharacterById: characterCrudService.getCharacterById,
    getCharacterWithAllDetails: characterCrudService.getCharacterWithAllDetails,
    createCharacter: characterCrudService.createCharacter,
    saveCharacter: characterCrudService.saveCharacter,
    deleteCharacter: characterCrudService.deleteCharacter,

    // Character advancement methods
    createAdvancement: characterAdvancementService.createAdvancement,
    updateAdvancement: characterAdvancementService.updateAdvancement,
    deleteAdvancement: characterAdvancementService.deleteAdvancement,
    getAdvancementById: characterAdvancementService.getAdvancementById,
    getCharacterAdvancements: characterAdvancementService.getCharacterAdvancements,

    // Spell preparation methods
    createSpellPreparation: characterSpellService.createSpellPreparation,
    updateSpellPreparation: characterSpellService.updateSpellPreparation,
    deleteSpellPreparation: characterSpellService.deleteSpellPreparation,
    getCharacterSpellPreparations: characterSpellService.getCharacterSpellPreparations,

    // Character ability score methods
    createCharacterAbilityScore: characterAbilityService.createCharacterAbilityScore,
    updateCharacterAbilityScore: characterAbilityService.updateCharacterAbilityScore,
    deleteCharacterAbilityScore: characterAbilityService.deleteCharacterAbilityScore,
    getCharacterAbilityScores: characterAbilityService.getCharacterAbilityScores,
    upsertCharacterAbilityScores: characterAbilityService.upsertCharacterAbilityScores,

    // Character disallowed sources methods
    addDisallowedSource: characterDisallowedSourceService.addDisallowedSource,
    removeDisallowedSource: characterDisallowedSourceService.removeDisallowedSource,
    getDisallowedSources: characterDisallowedSourceService.getDisallowedSources,

    // Character attack definition methods
    getCharacterAttackDefinitions: characterAttackService.getCharacterAttackDefinitions,
    createCharacterAttackDefinition: characterAttackService.createCharacterAttackDefinition,
    updateCharacterAttackDefinition: characterAttackService.updateCharacterAttackDefinition,
    deleteCharacterAttackDefinition: characterAttackService.deleteCharacterAttackDefinition,
    reorderCharacterAttackDefinitions: characterAttackService.reorderCharacterAttackDefinitions,

    // Gestalt character calculation methods
    calculateCharacterStats: characterGestaltService.calculateCharacterStats,
    calculateAdvancementStats: characterGestaltService.calculateAdvancementStats,

    // Spell selection methods
    getCharacterDomains: characterSpellService.getCharacterDomains,
    getAvailableSpellsForClass: characterSpellService.getAvailableSpellsForClass,
    addSpellKnown: characterSpellService.addSpellKnown,
    removeSpellKnown: characterSpellService.removeSpellKnown,
    getMaxCastableSpellLevel: characterSpellService.getMaxCastableSpellLevel,
    validateSpellLevelForAdvancement: characterSpellService.validateSpellLevelForAdvancement,
    countFreeGrantsForAdvancement: characterSpellService.countFreeGrantsForAdvancement,

    // Character detail methods (uses tracking, money, items, wounds, spell cast)
    getCharacterUses: characterDetailService.getCharacterUses,
    updateFeatureUses: characterDetailService.updateFeatureUses,
    resetDailyUses: characterDetailService.resetDailyUses,
    resetAllUses: characterDetailService.resetAllUses,
    resetDailySpellPreparations: characterDetailService.resetDailySpellPreparations,
    updateMoney: characterDetailService.updateMoney,
    addItem: characterDetailService.addItem,
    removeItem: characterDetailService.removeItem,
    updateWounds: characterDetailService.updateWounds,
    updateNotes: characterDetailService.updateNotes,
    castSpell: characterDetailService.castSpell,
    uncastSpell: characterDetailService.uncastSpell,
    syncItems: characterDetailService.syncItems,
    syncSpellPreparations: characterDetailService.syncSpellPreparations,
    syncSpellsKnown: characterDetailService.syncSpellsKnown,
};
