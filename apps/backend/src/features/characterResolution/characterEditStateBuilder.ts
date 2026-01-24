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
 * @param targetLevel - The target level for the character edit state
 * @param isGestalt - Whether the character is a gestalt character
 * @returns Complete CharacterEditState object with all fields properly extracted
 * 
 * @example
 * ```typescript
 * const state = buildCharacterEditState(character, 5, true);
 * ```
 */
export function buildCharacterEditState(
    character: CharacterWithAllDetailsResponse,
    targetLevel: number,
    isGestalt: boolean
): CharacterEditState {
    return {
        characterId: character.id,
        name: character.name,
        abilityScores: character.abilityScores?.map(as => ({
            abilityId: as.abilityId,
            value: as.value
        })) || [],
        skillRanks: character.advancements?.flatMap(adv =>
            adv.skills?.map(sr => ({
                skillId: sr.skillId,
                skillSubId: sr.skillSubId,
                customSubtype: sr.customSubtype,
                pointsSpent: sr.pointsSpent
            })) || []
        ) || [],
        raceId: character.raceId,
        classId: character.advancements?.[0]?.classId || null,
        secondaryClassId: character.advancements?.[0]?.secondaryClassId || null,
        level: targetLevel,
        editionId: character.editionId || EditionId.DND_3_5E,
        isGestalt,
        allowVariantClasses: character.allowVariantClasses || false,
        ignoreLevelAdjustment: character.ignoreLevelAdjustment || false,
        featureChoices: character.advancements?.flatMap(adv => adv.featureChoices || []) || [],
        selectedFeats: character.advancements?.flatMap(adv => adv.feats?.map(f => f.featId) || []) || [],
        disallowedSources: character.disallowedSources?.map(ds => ({
            sourceBookId: ds.sourceBookId
        })) || []
    };
}
