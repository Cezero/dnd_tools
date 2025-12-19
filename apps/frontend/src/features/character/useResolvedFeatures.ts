import { useState, useEffect, useCallback } from 'react';

import { useCacheFunctions } from '@/services/cache';
import { FeatureProgression, CharacterFeatureChoice } from '@shared/schema';
import { EntityAppliesToType } from '@shared/static-data';

import { ResolvedFeatureService } from './ResolvedFeatureService';
import type { PendingChoice, UseResolvedFeaturesProps, FeatureResolutionReturn } from './types';

/**
 * Extract existing choices from advancement.featureChoices and convert to userChoices format
 * Uses resolved progressions to look up FeatureEntity and determine choice type synchronously
 */
function extractExistingChoices(
    featureChoices: CharacterFeatureChoice[],
    resolvedProgressions: FeatureProgression[]
): {
    domains?: number[];
    feats?: number[];
    skills?: number[];
    spells?: number[];
    features?: number[];
} {
    const choices: {
        domains?: number[];
        feats?: number[];
        skills?: number[];
        spells?: number[];
        features?: number[];
    } = {};

    featureChoices.forEach(choice => {
        // Look up the FeatureEntity in resolved progressions to determine choice type
        let entityAppliesTo: number | null = null;

        for (const progression of resolvedProgressions) {
            if (progression.id === choice.progressionId && progression.entities) {
                const entity = progression.entities.find(e => e.id === choice.featureEntityId);
                if (entity) {
                    entityAppliesTo = entity.appliesTo;
                    break;
                }
            }
        }

        // If we couldn't find the entity, skip this choice (shouldn't happen in normal flow)
        if (entityAppliesTo === null) {
            console.warn(`Could not find FeatureEntity for choice: progressionId=${choice.progressionId}, featureEntityId=${choice.featureEntityId}`);
            return;
        }

        // Route the choice to the appropriate array based on appliesTo type
        switch (entityAppliesTo) {
            case EntityAppliesToType.Domain:
                if (!choices.domains) {
                    choices.domains = [];
                }
                choices.domains.push(choice.appliesToId);
                break;
            case EntityAppliesToType.Feat:
                if (!choices.feats) {
                    choices.feats = [];
                }
                choices.feats.push(choice.appliesToId);
                break;
            case EntityAppliesToType.Skill:
                if (!choices.skills) {
                    choices.skills = [];
                }
                choices.skills.push(choice.appliesToId);
                break;
            case EntityAppliesToType.Spell:
                if (!choices.spells) {
                    choices.spells = [];
                }
                choices.spells.push(choice.appliesToId);
                break;
            case EntityAppliesToType.Feature:
                if (!choices.features) {
                    choices.features = [];
                }
                choices.features.push(choice.appliesToId);
                break;
            default:
                console.warn(`Unknown appliesTo type ${entityAppliesTo} for choice: progressionId=${choice.progressionId}, featureEntityId=${choice.featureEntityId}`);
        }
    });

    return choices;
}

export function useResolvedFeatures({
    character,
    targetLevel,
    advancement,
    raceDetails,
    classDetails,
    secondaryClassDetails,
    userChoices,
}: UseResolvedFeaturesProps): FeatureResolutionReturn {
    const { getClassNameById, getDomainSelectByEdition } = useCacheFunctions();
    const [resolvedProgressions, setResolvedProgressions] = useState<FeatureProgression[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Resolve features when dependencies change
    useEffect(() => {
        const resolveFeatures = async () => {
            if (!character || !advancement || !character.advancements || character.advancements.length === 0) {
                setResolvedProgressions([]);
                return;
            }

            // Additional guard to prevent infinite loops
            if (!advancement.level || advancement.level < 1) {
                setResolvedProgressions([]);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                // Add timeout to prevent hanging
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('Feature resolution timeout')), 10000); // 10 second timeout
                });

                // Two-pass resolution to handle circular dependency:
                // 1. First pass: Resolve without user choices to get base progressions
                // 2. Extract choices from base progressions
                // 3. Second pass: Resolve with extracted choices merged

                // First pass: Resolve base features without user choices
                const baseResolved = await Promise.race([
                    ResolvedFeatureService.getResolvedFeatures(
                        character,
                        targetLevel,
                        advancement,
                        raceDetails,
                        classDetails,
                        secondaryClassDetails,
                        undefined // No user choices for first pass
                    ),
                    timeoutPromise
                ]);

                // Extract existing choices from advancement.featureChoices using base progressions
                const existingChoices = extractExistingChoices(
                    advancement.featureChoices || [],
                    baseResolved
                );

                // Merge with any new userChoices
                const mergedChoices = {
                    ...existingChoices,
                    ...userChoices
                };

                // Second pass: Resolve with extracted choices
                const resolved = await Promise.race([
                    ResolvedFeatureService.getResolvedFeatures(
                        character,
                        targetLevel,
                        advancement,
                        raceDetails,
                        classDetails,
                        secondaryClassDetails,
                        mergedChoices
                    ),
                    timeoutPromise
                ]);

                setResolvedProgressions(resolved);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to resolve features');
                console.error('Error resolving features:', err);
            } finally {
                setIsLoading(false);
            }
        };

        resolveFeatures();
    }, [character, targetLevel, advancement, raceDetails, classDetails, secondaryClassDetails, userChoices]);

    // Memoized class skill checker
    const isClassSkill = useCallback((skillId: number, skillSubId?: number | null): boolean => {
        return ResolvedFeatureService.isClassSkill(skillId, skillSubId || null, resolvedProgressions);
    }, [resolvedProgressions]);

    // Memoized granted feats getter
    const getGrantedFeats = useCallback((): number[] => {
        const grantedFeatEntities = ResolvedFeatureService.getGrantedFeats(resolvedProgressions);
        return grantedFeatEntities.map(entity => entity.appliesToId).filter((id): id is number => id !== null && id !== undefined);
    }, [resolvedProgressions]);

    // Memoized granted proficiencies getter
    const getGrantedProficiencies = useCallback((): Array<{ type: string; id: number; source: string }> => {
        // TODO: Implement getGrantedProficiencies in ResolvedFeatureService
        // For now, return empty array
        return [];
    }, []);

    // Memoized pending choices getter
    const getPendingChoices = useCallback(async (): Promise<PendingChoice[]> => {
        // Extract existing choices from advancement.featureChoices to filter them out
        const existingChoices = advancement?.featureChoices?.map(choice => ({
            progressionId: choice.progressionId,
            featureEntityId: choice.featureEntityId
        })) || [];
        return await ResolvedFeatureService.getPendingChoices(
            resolvedProgressions,
            { getClassNameById, getDomainSelectByEdition },
            character.editionId,
            existingChoices
        );
    }, [resolvedProgressions, character.editionId, getClassNameById, getDomainSelectByEdition, advancement]);

    // Memoized skill total calculator
    const calculateSkillTotal = useCallback((skillId: number, skillSubId: number | null, baseTotal: number): number => {
        return ResolvedFeatureService.calculateSkillTotal(skillId, skillSubId, baseTotal, resolvedProgressions);
    }, [resolvedProgressions]);

    return {
        resolvedProgressions,
        isLoading,
        error,
        isClassSkill,
        getGrantedFeats,
        getGrantedProficiencies,
        getPendingChoices,
        calculateSkillTotal,
    };
}
