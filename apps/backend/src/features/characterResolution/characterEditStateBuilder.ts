import type { CharacterEditState, CharacterWithAllDetailsResponse } from '@shared/schema';
import { EditionId } from '@shared/static-data';

/**
 * Builds a CharacterEditState from character data.
 * 
 * Centralizes the logic for constructing CharacterEditState objects to ensure
 * consistency across all locations where it's needed. This eliminates code
 * duplication and provides a single source of truth for state construction.
 * 
 * @param character - Character data with all details including advancements
 * @returns Complete CharacterEditState object with all fields properly extracted
 * 
 * @example
 * ```typescript
 * const state = buildCharacterEditState(character, 5, true);
 * ```
 */
export function buildCharacterEditState(
    character: CharacterWithAllDetailsResponse
): CharacterEditState {
    return {
        characterId: character.id,
        name: character.name,
        raceId: character.raceId,
        editionId: character.editionId || EditionId.DND_3_5E,
        alignmentId: character.alignmentId ?? null,
        deityId: character.deityId ?? null,
        age: character.age ?? null,
        height: character.height ?? null,
        weight: character.weight ?? null,
        eyes: character.eyes ?? null,
        hair: character.hair ?? null,
        gender: character.gender ?? null,
        notes: character.notes ?? null,

        allowVariantClasses: character.config?.allowVariantClasses ?? false,
        isGestalt: character.config?.isGestalt ?? false,
        ignoreLevelAdjustment: character.config?.ignoreLevelAdjustment ?? false,
        maxHpAtFirstLevel: character.config?.maxHpAtFirstLevel ?? false,

        abilityScores: character.abilityScores?.map((a) => ({ abilityId: a.abilityId, value: a.value })) ?? [],
        disallowedSources: character.disallowedSources?.map((ds) => ({ sourceBookId: ds.sourceBookId })) ?? [],

        wealth: character.wealth ?? [],
        characterItems: character.characterItems ?? [],
        attackDefinitions: character.attackDefinitions ?? [],
        characterLanguages: character.characterLanguages ?? [],
        bonusSkillRanks: character.bonusSkillRanks ?? [],
        companions: character.companions ?? [],
        selectedForms: character.selectedForms ?? [],
    };
}
