import type { TabComponentProps } from '../types';
import type { FeatInQueryResponse, Feat, CharacterWithAllDetailsResponse } from '@shared/schema';
import { meetsPrerequisites, getCharacterBAB } from '@/lib/characterUtils';
import { getAllCharacterFeats } from '@/lib/character-calculation/core/featAccessor';

/**
 * Filter feats based on character qualifications and prerequisites
 * This is shared between FeatsTab and ChoicesTab
 * 
 * Note: Requires featsMap from CharacterEdit's cached full feats (via sharedData.featsMap).
 * Throws an error if featsMap is not available.
 */
export async function filterAvailableFeats(
    allFeats: FeatInQueryResponse[],
    state: TabComponentProps['state'],
    resolvedData: TabComponentProps['resolvedData'],
    sharedData: TabComponentProps['sharedData'],
    character: CharacterWithAllDetailsResponse
): Promise<FeatInQueryResponse[]> {
    const classDetails = {
        primary: sharedData.primaryClass,
        secondary: sharedData.secondaryClass
    };
    const raceDetails = sharedData.race;

    // Get granted feats from resolved data (includes both direct feats and proficiency feats)
    const grantedFeats = resolvedData.grantedFeats;
    const grantedFeatIds = grantedFeats.map(entity => entity.appliesToId).filter((id): id is number => id !== null && id !== undefined);

    // Combine user-selected feats with all granted feats
    const allOwnedFeats = new Set([...state.selectedFeats, ...grantedFeatIds]);

    // Get all character feats (including choice-based feats) for prerequisite checking
    const allCharacterFeats = getAllCharacterFeats(character, resolvedData.progressions);
    const allCharacterFeatIds = new Set(allCharacterFeats.map(f => f.featId));

    // Combine owned feats with choice-based feats for prerequisite checking
    const allFeatsForPrereqCheck = new Set([...allOwnedFeats, ...allCharacterFeatIds]);

    // Filter feats and check prerequisites
    const filteredFeats: FeatInQueryResponse[] = [];

    // Fetch full feat data for ALL feats to check prerequisites
    // The prerequisites string is display-only and often empty, so we must check the prereqs array
    // featsMap must be provided by CharacterEdit (cached full feats)
    if (!state.abilityScores || state.abilityScores.length === 0 || !classDetails.primary) {
        // If we can't check prerequisites, we can't safely filter, so return empty array
        // (or we could return all feats, but that's unsafe)
        return [];
    }

    // featsMap must be available from CharacterEdit
    if (!sharedData.featsMap || sharedData.featsMap.size === 0) {
        throw new Error('featsMap is required but not available. CharacterEdit should provide cached full feats via sharedData.featsMap');
    }

    // Use the cached featsMap from CharacterEdit
    const fullFeatMap = sharedData.featsMap;

    for (const feat of allFeats) {
        // Check if character already has this feat
        if (allOwnedFeats.has(feat.id)) {
            // If it's repeatable, check if they have the "all" version (appliesToSubId: -1)
            if (feat.repeatable === true) {
                // Check if this feat was granted with appliesToSubId: -1 (all iterations)
                const hasAllIterations = grantedFeats.some(entity =>
                    entity.appliesToId === feat.id && entity.appliesToSubId === -1
                );

                // If they have all iterations, filter it out
                if (hasAllIterations) {
                    continue;
                }

                // Otherwise, allow it (they can take more iterations)
                // Continue to prerequisite check below
            } else {
                // Non-repeatable feat - filter it out
                continue;
            }
        }

        // Get full feat data to check prerequisites array
        // Note: prerequisites string is display-only and should be ignored
        const fullFeat = fullFeatMap.get(feat.id);

        // If we don't have full feat data, filter it out to be safe (we should have fetched all feats)
        if (!fullFeat) {
            continue;
        }

        // If feat has no prerequisites in the prereqs array, it's available
        if (!fullFeat.prereqs || fullFeat.prereqs.length === 0) {
            filteredFeats.push(feat);
            continue;
        }

        // Feat has prerequisites - we need to check them

        // Create character object for prerequisite checking
        // Use the character data passed in, but update advancements to include current state
        // Important: getCharacterBAB uses character.advancements.length to determine level,
        // so we need to create the correct number of advancement entries
        const characterLevel = state.level || character.advancements.length || 1;
        const advancementId = character.advancements[0]?.id || 1;
        const classId = state.classId || character.advancements[0]?.classId || 0;

        // Create advancements array that reflects the actual character level
        // Each advancement represents one level, so we need one per level
        const advancementsForPrereqs = Array.from({ length: characterLevel }, (_, index) => {
            const level = index + 1;
            // Use existing advancement if available, otherwise create a minimal one with all required fields
            const existingAdvancement = character.advancements[index];
            const baseAdvancement = existingAdvancement || {
                id: advancementId + index,
                characterId: character.id,
                classId: classId,
                level: level,
                version: 1,
                secondaryClassId: null,
                hitPoints: 0,
                abilityId: null,
                notes: null,
                createdAt: new Date(),
                skills: [],
                feats: [],
                spellsKnown: [],
                featureChoices: []
            };

            // For the current level (last advancement), include current skills and feats
            if (index === characterLevel - 1) {
                return {
                    ...baseAdvancement,
                    skills: state.skillRanks?.map(sr => ({
                        advancementId: baseAdvancement.id,
                        skillId: sr.skillId,
                        pointsSpent: sr.pointsSpent,
                        skillSubId: sr.skillSubId ?? undefined,
                        customSubtype: sr.customSubtype ?? undefined
                    })) || [],
                    feats: Array.from(allFeatsForPrereqCheck).map(featId => ({
                        advancementId: baseAdvancement.id,
                        featId
                    })),
                    spellsKnown: baseAdvancement.spellsKnown || [],
                    featureChoices: baseAdvancement.featureChoices || []
                };
            }

            // For previous levels, preserve the original advancement data (if available)
            // Otherwise create a minimal advancement with the correct classId and all required fields
            return {
                ...baseAdvancement,
                classId: baseAdvancement.classId || classId,
                level: baseAdvancement.level || level,
                skills: baseAdvancement.skills || [],
                feats: baseAdvancement.feats || [],
                spellsKnown: baseAdvancement.spellsKnown || [],
                featureChoices: baseAdvancement.featureChoices || []
            };
        });

        const characterForPrereqs: CharacterWithAllDetailsResponse = {
            ...character,
            abilityScores: state.abilityScores,
            raceId: state.raceId,
            allowVariantClasses: state.allowVariantClasses,
            isGestalt: state.isGestalt,
            ignoreLevelAdjustment: state.ignoreLevelAdjustment,
            advancements: advancementsForPrereqs
        };

        try {
            // Check prerequisites using the full feat data
            const meetsPrereqs = meetsPrerequisites(
                fullFeat,
                characterForPrereqs,
                classDetails.primary,
                raceDetails,
                { results: allFeats, total: allFeats.length }
            );

            if (meetsPrereqs) {
                filteredFeats.push(feat);
            }
        } catch (error) {
            // If prerequisite checking fails, filter out the feat to be safe
            console.warn('Failed to check prerequisites for feat:', feat.name, error);
            continue;
        }
    }

    return filteredFeats;
}

