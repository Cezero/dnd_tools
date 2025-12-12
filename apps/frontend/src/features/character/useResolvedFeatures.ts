import { useState, useEffect, useCallback } from 'react';

import { useCacheFunctions } from '@/services/cache';
import { FeatureProgression, CharacterFeatureChoice } from '@shared/schema';

import { ResolvedFeatureService } from './ResolvedFeatureService';
import type { PendingChoice, UseResolvedFeaturesProps, FeatureResolutionReturn } from './types';

/**
 * Extract existing choices from advancement.featureChoices and convert to userChoices format
 */
function extractExistingChoices(featureChoices: CharacterFeatureChoice[]): {
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
        // For now, we'll assume all choices are domain choices since that's what we're testing
        // In a full implementation, we'd need to query the FeatureEntity to determine the choice type
        if (!choices.domains) {
            choices.domains = [];
        }
        choices.domains.push(choice.appliesToId);
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

                // Extract existing choices from advancement.featureChoices
                const existingChoices = extractExistingChoices(advancement.featureChoices || []);

                // Merge with any new userChoices
                const mergedChoices = {
                    ...existingChoices,
                    ...userChoices
                };

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
        return ResolvedFeatureService.getGrantedFeats(resolvedProgressions);
    }, [resolvedProgressions]);

    // Memoized granted proficiencies getter
    const getGrantedProficiencies = useCallback(() => {
        return ResolvedFeatureService.getGrantedProficiencies(resolvedProgressions);
    }, [resolvedProgressions]);

    // Memoized pending choices getter
    const getPendingChoices = useCallback(async (): Promise<PendingChoice[]> => {
        return await ResolvedFeatureService.getPendingChoices(resolvedProgressions, { getClassNameById, getDomainSelectByEdition }, character.editionId);
    }, [resolvedProgressions, character.editionId, getClassNameById, getDomainSelectByEdition]);

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
