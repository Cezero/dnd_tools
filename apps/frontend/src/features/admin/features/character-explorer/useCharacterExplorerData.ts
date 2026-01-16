import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';

import type { ResolutionContext } from '@/features/character/types';
import { extractRaceMechanics } from '@/lib/feature-extraction/raceMechanicsExtractor';
import { displayStrategyFactory } from '@/lib/formatters';
import type { FormattedCharacterResult, DisplayResult, BaseCharacterInfo } from '@/lib/formatters/types';
import { CharacterResolutionApi } from '@/services/api/CharacterResolutionApi';
import { CharacterQueryHooks } from '@/services/query/CharacterQueryHooks';
import { ClassQueryHooks } from '@/services/query/ClassQueryHooks';
import { ItemQueryHooks } from '@/services/query/ItemQueryHooks';
import type { CharacterWithAllDetailsResponse, FeatureProgression, DnDClass, ItemWithDetails, PendingChoice } from '@shared/schema';
import { DisplayType } from '@shared/static-data';

import type { CharacterExplorerData } from './types';

export function useCharacterExplorerData(characterId: number | null, selectedDisplayType: DisplayType = DisplayType.CharacterSheet): CharacterExplorerData {
    const queryClient = useQueryClient();

    const [character, setCharacter] = useState<CharacterWithAllDetailsResponse | null>(null);
    const [resolvedProgressions, setResolvedProgressions] = useState<FeatureProgression[]>([]);
    const [resolutionContext, setResolutionContext] = useState<ResolutionContext | null>(null);
    const [pendingChoices, setPendingChoices] = useState<PendingChoice[]>([]);
    const [classSkills, setClassSkills] = useState<Array<{ skillId: number; skillSubId: number | null }>>([]);
    const [skillBonuses, setSkillBonuses] = useState<Array<{ skillId: number; skillSubId: number | null; bonus: number; source: string }>>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load character data
    useEffect(() => {
        const loadCharacter = async () => {
            if (!characterId) {
                setCharacter(null);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);
                const characterData = await queryClient.fetchQuery({
                    queryKey: CharacterQueryHooks.getCharacterWithAllDetailsQueryKey(characterId),
                    queryFn: () => CharacterQueryHooks.getCharacterWithAllDetailsQueryFn({ pathParams: { id: characterId } }),
                    staleTime: 5 * 60 * 1000,
                    gcTime: 10 * 60 * 1000,
                }) as CharacterWithAllDetailsResponse;
                setCharacter(characterData);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to load character';
                setError(errorMessage);
                console.error('Failed to load character:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadCharacter();
    }, [characterId, queryClient]);

    // Resolve features using backend API
    useEffect(() => {
        const resolveFeatures = async () => {
            if (!character || character.advancements.length === 0) {
                setResolvedProgressions([]);
                setResolutionContext(null);
                setPendingChoices([]);
                setClassSkills([]);
                setSkillBonuses([]);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                // Use backend resolution API to get resolved features
                const resolvedResult = await CharacterResolutionApi.initializeSession(character.id);

                setResolvedProgressions(resolvedResult.resolvedProgressions);
                setPendingChoices(resolvedResult.pendingChoices);
                setClassSkills(resolvedResult.classSkills.map(skill => ({
                    skillId: skill.skillId,
                    skillSubId: skill.skillSubId ?? null
                })));
                setSkillBonuses(resolvedResult.skillBonuses.map(bonus => ({
                    skillId: bonus.skillId,
                    skillSubId: bonus.skillSubId ?? null,
                    bonus: bonus.bonus,
                    source: bonus.source
                })));

                // Create resolution context for display purposes
                const maxLevel = Math.max(...character.advancements.map(a => a.level));
                const advancement = character.advancements.find(a => a.level === maxLevel);

                if (advancement) {
                    const context: ResolutionContext = {
                        character,
                        targetLevel: maxLevel,
                        advancement,
                        raceDetails: undefined, // Not needed for display - character.race is minimal object
                        classDetails: undefined, // Not needed for display
                        secondaryClassDetails: undefined, // Not needed for display
                        isGestalt: !!advancement.secondaryClassId,
                        userChoices: undefined, // Already applied in resolved progressions
                        includePendingChoices: false,
                        resolveCascading: true,
                        maxResolutionDepth: 10,
                    };
                    setResolutionContext(context);
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to resolve features';
                setError(errorMessage);
                console.error('Failed to resolve features:', err);
            } finally {
                setIsLoading(false);
            }
        };

        resolveFeatures();
    }, [character?.id, character?.advancements?.length]);

    // Load items and feats for formatting
    const [items, setItems] = useState<ItemWithDetails[]>([]);
    // Feats are now accessed via cache lookups in formatters, no need for featsMap
    const [classDetailsMap, setClassDetailsMap] = useState<Map<number, DnDClass>>(new Map());

    useEffect(() => {
        const loadDependencies = async () => {
            if (!character) {
                setItems([]);
                setClassDetailsMap(new Map());
                return;
            }

            try {
                // Load items
                const itemsData = await queryClient.fetchQuery({
                    queryKey: ItemQueryHooks.getItemsQueryKey(),
                    queryFn: ItemQueryHooks.getItemsQueryFn,
                    staleTime: 5 * 60 * 1000,
                    gcTime: 10 * 60 * 1000,
                });
                setItems(itemsData?.results || []);

                // Feats are now accessed via cache lookups in formatters, no need to build a map

                // Load class details map (needed for formatting)
                const classMap = new Map<number, DnDClass>();
                const classIds = new Set<number>();
                for (const adv of character.advancements) {
                    if (adv.classId) classIds.add(adv.classId);
                    if (adv.secondaryClassId) classIds.add(adv.secondaryClassId);
                }
                for (const classId of classIds) {
                    try {
                        const classData = await queryClient.fetchQuery({
                            queryKey: ClassQueryHooks.getClassByIdQueryKey(classId),
                            queryFn: () => ClassQueryHooks.getClassById(classId),
                            staleTime: 5 * 60 * 1000,
                            gcTime: 10 * 60 * 1000,
                        });
                        if (classData) {
                            classMap.set(classId, classData);
                        }
                    } catch (err) {
                        console.error(`Failed to load class ${classId}:`, err);
                    }
                }
                setClassDetailsMap(classMap);
            } catch (err) {
                console.error('Failed to load dependencies:', err);
            }
        };

        loadDependencies();
    }, [character, queryClient]);

    // Create stable keys for memoization
    const progressionsKey = useMemo(() => {
        if (!resolvedProgressions.length) return '';
        return resolvedProgressions.map(p => p.id).sort((a, b) => a - b).join(',');
    }, [resolvedProgressions]);

    const itemsKey = useMemo(() => {
        if (!items.length) return '';
        return items.map(i => i.id).sort((a, b) => a - b).join(',');
    }, [items]);

    // Feats are now accessed via cache lookups, no need for featsKey

    const classesKey = useMemo(() => {
        if (classDetailsMap.size === 0) return '';
        return Array.from(classDetailsMap.keys()).sort((a, b) => a - b).join(',');
    }, [classDetailsMap]);

    // Format character based on selected display type
    const formattedCharacterResult = useMemo<FormattedCharacterResult | null>(() => {
        if (!character || !resolvedProgressions.length || classDetailsMap.size === 0 || items.length === 0) {
            return null;
        }

        if (selectedDisplayType !== DisplayType.CharacterSheet) {
            return null;
        }

        const strategy = displayStrategyFactory.createStrategy(DisplayType.CharacterSheet);
        if (!strategy.formatCharacter) {
            return null;
        }

        const characterContext: BaseCharacterInfo = {
            abilityScores: Object.fromEntries(
                character.abilityScores.map(a => [a.abilityId, a.value])
            ),
            classLevels: Object.fromEntries(
                Array.from(classDetailsMap.keys()).map(classId => {
                    const level = character.advancements.filter(a => a.classId === classId || a.secondaryClassId === classId).length;
                    return [classId, level];
                })
            ),
            raceId: character.raceId ?? undefined,
            sizeId: (() => {
                // Extract sizeId from resolved progressions
                if (character.raceId && resolvedProgressions.length > 0) {
                    const raceMechanics = extractRaceMechanics(resolvedProgressions, character.raceId);
                    return raceMechanics.sizeId ?? undefined;
                }
                return undefined;
            })()
        };

        try {
            return strategy.formatCharacter(
                character,
                resolvedProgressions,
                items,
                character.characterItems || [],
                classDetailsMap,
                {
                    character: characterContext,
                    classSkills: classSkills.length > 0 ? classSkills : undefined,
                    skillBonuses: skillBonuses.length > 0 ? skillBonuses : undefined
                },
                null // raceDetails not needed for display - character.race is minimal object
            );
        } catch (err) {
            console.error('Error formatting character:', err);
            return null;
        }
    }, [character?.id, progressionsKey, itemsKey, classesKey, selectedDisplayType, classSkills, skillBonuses, queryClient]);

    // Format display result for Edit/Detail types
    const formattedDisplayResult = useMemo<DisplayResult | null>(() => {
        if (!resolvedProgressions.length || (selectedDisplayType === DisplayType.CharacterSheet)) {
            return null;
        }

        try {
            const strategy = displayStrategyFactory.createStrategy(selectedDisplayType);
            return strategy.format(resolvedProgressions);
        } catch (err) {
            console.error('Error formatting display result:', err);
            return null;
        }
    }, [resolvedProgressions, selectedDisplayType]);

    return {
        character,
        resolvedProgressions,
        formattedCharacterResult,
        formattedDisplayResult,
        resolutionContext,
        pendingChoices,
        selectedDisplayType,
        isLoading,
        error,
    };
}


