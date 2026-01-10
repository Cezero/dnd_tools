import { TrashIcon } from '@heroicons/react/24/outline';
import { useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import ordinal from 'ordinal';
import React, { useMemo, useState, useCallback } from 'react';

import { EntityLink } from '@/components/entity-link';
import { ScrollableCategorizedList } from '@/components/scrollable-categorized-list';
import type { ScrollableCategorizedListProps } from '@/components/scrollable-categorized-list/types';
import type { TabComponentProps } from '@/features/character/types';
import { useCharacterResolution } from '@/features/character/useCharacterResolution';
import { hasSpellbook, getAvailableSpellbookSpells, getMaxCastableSpellLevel, canScribeSpellAtLevel, getFreeSpellsUsed, getRemainingFreeSpells, hasZeroLevelSpellbookSpellsGrant } from '@/features/character/utils/spellbookUtils';
import type { ResolvedCharacterResult } from '@/services/api/CharacterResolutionApi';
import { useCacheFunctions } from '@/services/cache';
import { CharacterQueryHooks } from '@/services/query/CharacterQueryHooks';
import type { CharacterSpellSelectionEntry, DnDClass, CharacterAdvancementWithDetailsResponse, CharacterSpellSelectionResponse, CharacterWithAllDetailsResponse, AddSpellKnownResponse, RemoveSpellKnownResponse } from '@shared/schema';
import { SPELL_SCHOOL_MAP, SPELL_SUBSCHOOL_MAP } from '@shared/static-data';

type SpellSelectionEntry = CharacterSpellSelectionEntry & {
    level: number; // Spell level from SpellLevelMap for grouping
    domainName?: string | null; // Domain name if this is a domain spell
};

export function SpellSelectionTab({
    state,
    character,
    resolvedData,
    sharedData,
    spellbookMode = 'level-up'
}: TabComponentProps & { spellbookMode?: 'level-up' | 'scribing' }): React.JSX.Element {
    const resolution = useCharacterResolution(character?.id || null);
    const queryClient = useQueryClient();
    const { getClassNameFromCache } = useCacheFunctions();
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [cacheUpdateTrigger, setCacheUpdateTrigger] = useState(0);

    // Get all spellcasting classes the character has using classDetailsMap from sharedData
    const spellcastingClasses = useMemo(() => {
        if (!character?.advancements || !sharedData?.classDetailsMap) {
            console.log('SpellSelectionTab: No spellcasting classes - missing data', {
                hasCharacter: !!character,
                hasAdvancements: !!character?.advancements,
                hasSharedData: !!sharedData,
                hasClassDetailsMap: !!sharedData?.classDetailsMap,
                classDetailsMapSize: sharedData?.classDetailsMap?.size ?? 0
            });
            return [];
        }

        const classMap = new Map<number, { classId: number; class: DnDClass; level: number }>();

        for (const advancement of character.advancements) {
            const classData = sharedData.classDetailsMap.get(advancement.classId);

            if (classData?.canCastSpells) {
                const existing = classMap.get(advancement.classId);
                if (existing) {
                    existing.level += 1;
                } else {
                    classMap.set(advancement.classId, {
                        classId: advancement.classId,
                        class: classData,
                        level: 1
                    });
                }
            }

            if (advancement.secondaryClassId) {
                const secondaryClassData = sharedData.classDetailsMap.get(advancement.secondaryClassId);

                if (secondaryClassData?.canCastSpells) {
                    const existing = classMap.get(advancement.secondaryClassId);
                    if (existing) {
                        existing.level += 1;
                    } else {
                        classMap.set(advancement.secondaryClassId, {
                            classId: advancement.secondaryClassId,
                            class: secondaryClassData,
                            level: 1
                        });
                    }
                }
            }
        }

        const result = Array.from(classMap.values());
        console.log('SpellSelectionTab: Found spellcasting classes', result.map(sc => ({ 
            id: sc.classId, 
            name: sc.class?.name || getClassNameFromCache(sc.classId) || 'Unknown Class', 
            level: sc.level 
        })));
        return result;
    }, [character?.advancements, sharedData?.classDetailsMap]);

    // Auto-select first class if none selected
    React.useEffect(() => {
        if (!selectedClassId && spellcastingClasses.length > 0) {
            console.log('SpellSelectionTab: Auto-selecting first class', spellcastingClasses[0].classId);
            setSelectedClassId(spellcastingClasses[0].classId);
        }
    }, [selectedClassId, spellcastingClasses]);

    const selectedClass = useMemo(() => {
        if (!selectedClassId) return null;
        return spellcastingClasses.find(sc => sc.classId === selectedClassId)?.class ?? null;
    }, [selectedClassId, spellcastingClasses]);

    const classLevel = useMemo(() => {
        if (!selectedClassId || !character?.advancements) return 0;
        return character.advancements.filter(a =>
            a.classId === selectedClassId || a.secondaryClassId === selectedClassId
        ).length;
    }, [selectedClassId, character?.advancements]);

    // Check if selected class is a spellbook class
    const isSpellbookClass = useMemo(() => {
        if (!selectedClassId || !resolvedData?.progressions) return false;
        return hasSpellbook(resolvedData.progressions, selectedClassId);
    }, [selectedClassId, resolvedData?.progressions]);

    // Get current advancement for free spell tracking
    const currentAdvancement = useMemo(() => {
        if (!character?.advancements || !selectedClassId) return null;
        return character.advancements
            .filter(a => a.classId === selectedClassId || a.secondaryClassId === selectedClassId)
            .sort((a, b) => b.level - a.level)[0] ?? null;
    }, [character?.advancements, selectedClassId]);

    // Calculate available free spells for spellbook classes
    const availableFreeSpells = useMemo(() => {
        if (!isSpellbookClass || !character || !selectedClassId || !resolvedData?.progressions) return undefined;
        const characterLevel = character.advancements.length;
        return getAvailableSpellbookSpells(
            resolvedData.progressions,
            characterLevel,
            selectedClassId,
            character
        );
    }, [isSpellbookClass, character, selectedClassId, resolvedData?.progressions]);

    /**
     * Count free spells used for current advancement.
     * 
     * Reads from cached character data (via TanStack Query cache) to get the most up-to-date
     * `spellsKnown` array. This ensures the count updates immediately after optimistic cache
     * updates, without waiting for a server refetch.
     * 
     * **Why cache-based?**:
     * - Optimistic updates modify the cache immediately for responsive UI
     * - The `character` prop may not update immediately after spell operations
     * - Reading from cache ensures we always have the latest state
     * 
     * **Dependencies**:
     * - `cacheUpdateTrigger`: Incremented after each optimistic update to force recalculation
     * - `character`, `selectedClassId`, `isSpellbookClass`: Used to find the correct advancement
     */
    const freeSpellsUsed = useMemo(() => {
        if (!character?.id || !selectedClassId || !isSpellbookClass) return 0;

        // Get cached character data to ensure we have the latest spellsKnown array
        const characterQueryKey = CharacterQueryHooks.getCharacterWithAllDetailsQueryKey(character.id);
        const cachedCharacter = queryClient.getQueryData<CharacterWithAllDetailsResponse>(characterQueryKey);
        const characterToUse = cachedCharacter || character;

        // Find current advancement from cached character data
        const cachedCurrentAdvancement = characterToUse.advancements
            ?.filter(a => a.classId === selectedClassId || a.secondaryClassId === selectedClassId)
            .sort((a, b) => b.level - a.level)[0] ?? null;

        if (!cachedCurrentAdvancement) return 0;

        return getFreeSpellsUsed(cachedCurrentAdvancement);
    }, [character, selectedClassId, isSpellbookClass, queryClient, cacheUpdateTrigger]);

    // Calculate remaining free spells
    const remainingFreeSpells = useMemo(() => {
        if (availableFreeSpells === undefined) return undefined;
        return Math.max(0, availableFreeSpells - freeSpellsUsed);
    }, [availableFreeSpells, freeSpellsUsed]);

    // Fetch spell selection data
    const isQueryEnabled = !!character?.id && !!selectedClassId;
    const { data: spellData, isLoading: isLoadingSpells, error: spellError } = CharacterQueryHooks.useGetCharacterSpellSelection(
        character?.id ?? 0,
        selectedClassId ?? 0,
        {
            enabled: isQueryEnabled,
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
        }
    );


    // Debug logging
    React.useEffect(() => {
        if (isQueryEnabled) {
            console.log('SpellSelectionTab: Query enabled', { characterId: character?.id, selectedClassId, isLoadingSpells, hasData: !!spellData, error: spellError });
        } else {
            console.log('SpellSelectionTab: Query disabled', { characterId: character?.id, selectedClassId, hasCharacter: !!character, hasSelectedClass: !!selectedClassId });
        }
    }, [isQueryEnabled, character?.id, selectedClassId, isLoadingSpells, spellData, spellError]);

    // Get list of known free grant spells for the current advancement
    // Uses spellData which is optimistically updated, and filters by isKnown and isFreeGrant
    // Also reads from cached character data to get the most up-to-date spellsKnown array
    /**
     * Get list of known free grant spells for the current advancement.
     * 
     * Derives the list of currently known free grant spells from `spellData` (which is
     * optimistically updated) and the cached `character` data. This list is displayed
     * in the "Free spells" notification section with remove buttons.
     * 
     * **Cache Synchronization**:
     * - Reads from cached character data to ensure we have the latest `spellsKnown` array
     * - Filters by `isFreeGrant: true` to only show free grant spells
     * - Matches against `spellData` to get spell names and levels
     * - Recalculates when `cacheUpdateTrigger` changes (after optimistic updates)
     * 
     * **Purpose**:
     * - Display known free grant spells in the UI
     * - Provide remove buttons for each spell
     * - Update immediately after spell add/remove operations
     */
    const knownFreeGrantSpells = useMemo(() => {
        if (!character?.id || !selectedClassId || !spellData?.results || !isSpellbookClass) return [];

        // Get cached character data to ensure we have the latest spellsKnown array
        const characterQueryKey = CharacterQueryHooks.getCharacterWithAllDetailsQueryKey(character.id);
        const cachedCharacter = queryClient.getQueryData<CharacterWithAllDetailsResponse>(characterQueryKey);
        const characterToUse = cachedCharacter || character;

        // Find current advancement from cached character data
        const cachedCurrentAdvancement = characterToUse.advancements
            ?.filter(a => a.classId === selectedClassId || a.secondaryClassId === selectedClassId)
            .sort((a, b) => b.level - a.level)[0] ?? null;

        if (!cachedCurrentAdvancement) return [];

        // Get spell IDs that are free grants from the current advancement
        const freeGrantSpellIds = new Set(
            (cachedCurrentAdvancement.spellsKnown || [])
                .filter(s => s.isFreeGrant)
                .map(s => s.spellId)
        );

        // Find spells in spellData that are known and are free grants
        const knownSpells: Array<{ spellId: number; name: string; level: number }> = [];
        for (const spellEntry of spellData.results) {
            if (spellEntry.isKnown && freeGrantSpellIds.has(spellEntry.id)) {
                knownSpells.push({
                    spellId: spellEntry.id,
                    name: spellEntry.name,
                    level: spellEntry.classSpellLevel ?? 0
                });
            }
        }

        // Sort by level, then by name
        return knownSpells.sort((a, b) => {
            if (a.level !== b.level) return a.level - b.level;
            return a.name.localeCompare(b.name);
        });
    }, [character, selectedClassId, spellData, isSpellbookClass, queryClient, cacheUpdateTrigger]);

    // 0th level spells for spellbook classes are granted via feature system
    // (EntityType.Other + EntityAppliesToType.SpellbookSpell with appliesToId: 0, appliesToSubId: -1)
    // They appear as "known" in the spell list without needing database records

    // Get spells known for this class to calculate max spells per level
    const spellsKnownByLevel = useMemo(() => {
        if (!character?.advancements || !selectedClassId) return new Map<number, number>();

        const counts = new Map<number, number>();
        for (const advancement of character.advancements) {
            if (advancement.classId === selectedClassId || advancement.secondaryClassId === selectedClassId) {
                for (const spell of advancement.spellsKnown || []) {
                    // Get spell level from SpellLevelMap for this class
                    const spellEntry = spellData?.results.find(s => s.id === spell.spellId);
                    const level = spellEntry?.classSpellLevel ?? 0;
                    counts.set(level, (counts.get(level) ?? 0) + 1);
                }
            }
        }
        return counts;
    }, [character?.advancements, selectedClassId, spellData]);

    // Get max spells per level from spellcasting progression
    const maxSpellsPerLevel = useMemo(() => {
        if (!selectedClass?.spellcastingProgression) return new Map<number, number>();

        const maxSpells = new Map<number, number>();
        for (const progression of selectedClass.spellcastingProgression) {
            if (progression.classLevel <= classLevel) {
                for (const slot of progression.slots || []) {
                    if (slot.spellLevel >= 0 && slot.spellLevel <= 9) {
                        // For spellsKnown classes, check classSpellsKnown progression
                        if (selectedClass.spellsKnown && selectedClass.spellsKnownProgression) {
                            const knownProg = selectedClass.spellsKnownProgression.find(
                                p => p.classLevel === progression.classLevel
                            );
                            if (knownProg?.slots) {
                                const knownSlot = knownProg.slots.find(s => s.spellLevel === slot.spellLevel);
                                if (knownSlot) {
                                    maxSpells.set(slot.spellLevel, knownSlot.slotsPerDay);
                                }
                            }
                        }
                    }
                }
            }
        }
        return maxSpells;
    }, [selectedClass, classLevel]);

    // Transform spell data for ScrollableCategorizedList
    // Note: Domain spells are excluded as they are handled in the Choices tab
    const transformedSpells = useMemo(() => {
        if (!spellData?.results) return [];

        const spells: SpellSelectionEntry[] = [];
        const domainSpellIds = new Set(spellData.domainSpells?.map(ds => ds.id) ?? []);

        // Add only regular spells (exclude domain spells)
        for (const spell of spellData.results) {
            // Skip if it's a domain spell
            if (domainSpellIds.has(spell.id)) {
                continue;
            }
            spells.push({
                ...spell,
                level: spell.classSpellLevel ?? 0,
                domainName: null
            });
        }

        // For spellbook classes, filter out spell levels where all spells are already known
        if (isSpellbookClass) {
            // Group spells by level and check if all are known
            const spellsByLevel = new Map<number, SpellSelectionEntry[]>();
            for (const spell of spells) {
                const level = spell.level;
                if (!spellsByLevel.has(level)) {
                    spellsByLevel.set(level, []);
                }
                spellsByLevel.get(level)!.push(spell);
            }

            // Filter out levels where all spells are known
            const filteredSpells: SpellSelectionEntry[] = [];
            for (const [level, levelSpells] of spellsByLevel.entries()) {
                const allKnown = levelSpells.every(spell => spell.isKnown);
                if (!allKnown) {
                    filteredSpells.push(...levelSpells);
                }
            }

            return filteredSpells;
        }

        return spells;
    }, [spellData, isSpellbookClass]);

    // Memoize dataFetcher to prevent unnecessary refetches
    const dataFetcher = useMemo(() => async () => ({
        results: transformedSpells,
        total: transformedSpells.length
    }), [transformedSpells]);

    // Handle learn spell
    const handleLearnSpell = useCallback(async (spell: SpellSelectionEntry) => {
        if (!character?.id || !selectedClassId) return;

        // Find the most recent advancement for this class
        const advancement = character.advancements
            .filter(a => a.classId === selectedClassId || a.secondaryClassId === selectedClassId)
            .sort((a, b) => b.level - a.level)[0];

        if (!advancement) return;

        // Determine if this is a free grant (for spellbook classes in level-up mode)
        const isFreeGrant = isSpellbookClass && spellbookMode === 'level-up';

        try {
            /**
             * Handles adding a spell to the character's spellbook or known spells.
             * 
             * **Integration with Character Resolution**:
             * - Calls the backend API to add the spell (which validates and updates the database)
             * - If the response includes `resolvedCharacter`, updates the resolution session state
             *   using `useCharacterResolution.updateResolvedCharacter()` to keep frontend resolution
             *   state synchronized with backend changes
             * 
             * **Optimistic Cache Updates**:
             * - Updates spell data cache (`isKnown: true`) for immediate UI feedback
             * - Updates character cache (`advancements[].spellsKnown` array) to keep `currentAdvancement` in sync
             * - Triggers `cacheUpdateTrigger` to force memo recalculation (e.g., `knownFreeGrantSpells`)
             * 
             * **State Management**:
             * - Does not manually manipulate TanStack Query caches for character details
             * - Relies on `useCharacterResolution` hook for resolution state synchronization
             * - Free spells count is calculated from cached character data (not local state)
             * 
             * @param spell - The spell to add
             * 
             * @see useCharacterResolution.updateResolvedCharacter - For resolution state updates
             * @see CharacterQueryHooks.addSpellKnown - For API call
             */
            const response = await CharacterQueryHooks.addSpellKnown({
                characterId: character.id,
                classId: selectedClassId,
                spellId: spell.id,
                advancementId: advancement.id,
                isFreeGrant
            }) as AddSpellKnownResponse;

            // Update resolution session state if response includes resolved character data
            if (response?.resolvedCharacter) {
                resolution.updateResolvedCharacter(response.resolvedCharacter as ResolvedCharacterResult);
            }

            // Optimistically update the spell's isKnown flag in the cached query data
            if (character?.id && selectedClassId) {
                const queryKey = CharacterQueryHooks.getCharacterSpellSelectionQueryKey(character.id, selectedClassId);
                queryClient.setQueryData(queryKey, (oldData: CharacterSpellSelectionResponse | undefined) => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        results: oldData.results.map((s) =>
                            s.id === spell.id ? { ...s, isKnown: true } : s
                        )
                    };
                });

                // Also update character cache to add spell to advancement's spellsKnown array
                const characterQueryKey = CharacterQueryHooks.getCharacterWithAllDetailsQueryKey(character.id);
                queryClient.setQueryData(characterQueryKey, (oldCharacter: CharacterWithAllDetailsResponse | undefined) => {
                    if (!oldCharacter || !oldCharacter.advancements) return oldCharacter;
                    return {
                        ...oldCharacter,
                        advancements: oldCharacter.advancements.map((adv) => {
                            if (adv.id === advancement.id) {
                                // Check if spell is already in the array
                                const hasSpell = adv.spellsKnown?.some(s => s.spellId === spell.id);
                                if (!hasSpell) {
                                    return {
                                        ...adv,
                                        spellsKnown: [
                                            ...(adv.spellsKnown || []),
                                            {
                                                spellId: spell.id,
                                                isFreeGrant: isFreeGrant
                                            }
                                        ]
                                    };
                                }
                            }
                            return adv;
                        })
                    };
                });

                // Trigger memo recalculation
                setCacheUpdateTrigger(prev => prev + 1);
            }

            // No need to update local state - freeSpellsUsed is now calculated from cached character data
        } catch (error) {
            console.error('Failed to learn spell:', error);
        }
    }, [character, selectedClassId, isSpellbookClass, spellbookMode, resolution, queryClient]);

    // Handle remove spell
    const handleRemoveSpell = useCallback(async (spell: SpellSelectionEntry) => {
        if (!character?.id || !selectedClassId) return;

        // Use current advancement directly - spells are always added to the most recent advancement for the class
        // If spell is known in spellData, it should be in currentAdvancement (even if prop hasn't updated yet)
        if (!currentAdvancement) {
            console.warn('Could not find current advancement for spell removal:', spell.id);
            return;
        }

        const advancement = currentAdvancement;

        // Check if this was a free grant BEFORE removing
        const spellRecord = advancement.spellsKnown?.find(s => s.spellId === spell.id);
        const wasFreeGrant = spellRecord?.isFreeGrant ?? false;
        const isFreeGrantRemoval = isSpellbookClass && spellbookMode === 'level-up' && wasFreeGrant;

        try {
            /**
             * Handles removing a spell from the character's spellbook or known spells.
             * 
             * **Integration with Character Resolution**:
             * - Calls the backend API to remove the spell (which validates and updates the database)
             * - If the response includes `resolvedCharacter`, updates the resolution session state
             *   using `useCharacterResolution.updateResolvedCharacter()` to keep frontend resolution
             *   state synchronized with backend changes
             * 
             * **Optimistic Cache Updates**:
             * - Updates spell data cache (`isKnown: false`) for immediate UI feedback
             * - Updates character cache (`advancements[].spellsKnown` array) to keep `currentAdvancement` in sync
             * - Triggers `cacheUpdateTrigger` to force memo recalculation (e.g., `knownFreeGrantSpells`)
             * 
             * **State Management**:
             * - Does not manually manipulate TanStack Query caches for character details
             * - Relies on `useCharacterResolution` hook for resolution state synchronization
             * - Free spells count is calculated from cached character data (not local state)
             * 
             * @param spell - The spell to remove
             * 
             * @see useCharacterResolution.updateResolvedCharacter - For resolution state updates
             * @see CharacterQueryHooks.removeSpellKnown - For API call
             */
            const response = await CharacterQueryHooks.removeSpellKnown({
                characterId: character.id,
                spellId: spell.id,
                advancementId: advancement.id
            }) as RemoveSpellKnownResponse;

            // Update resolution session state if response includes resolved character data
            if (response?.resolvedCharacter) {
                resolution.updateResolvedCharacter(response.resolvedCharacter as ResolvedCharacterResult);
            }

            // Optimistically update the spell's isKnown flag in the cached query data
            if (character?.id && selectedClassId) {
                const queryKey = CharacterQueryHooks.getCharacterSpellSelectionQueryKey(character.id, selectedClassId);
                queryClient.setQueryData(queryKey, (oldData: CharacterSpellSelectionResponse | undefined) => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        results: oldData.results.map((s) =>
                            s.id === spell.id ? { ...s, isKnown: false } : s
                        )
                    };
                });

                // Also update character cache to remove spell from advancement's spellsKnown array
                const characterQueryKey = CharacterQueryHooks.getCharacterWithAllDetailsQueryKey(character.id);
                queryClient.setQueryData(characterQueryKey, (oldCharacter: CharacterWithAllDetailsResponse | undefined) => {
                    if (!oldCharacter || !oldCharacter.advancements) return oldCharacter;
                    return {
                        ...oldCharacter,
                        advancements: oldCharacter.advancements.map((adv) => {
                            if (adv.id === advancement.id && adv.spellsKnown) {
                                return {
                                    ...adv,
                                    spellsKnown: adv.spellsKnown.filter(s => s.spellId !== spell.id)
                                };
                            }
                            return adv;
                        })
                    };
                });

                // Trigger memo recalculation
                setCacheUpdateTrigger(prev => prev + 1);
            }

            // No need to update local state - freeSpellsUsed is now calculated from cached character data
        } catch (error) {
            console.error('Failed to remove spell:', error);
        }
    }, [character, selectedClassId, currentAdvancement, isSpellbookClass, spellbookMode, resolution, queryClient]);

    // Check if spell is known
    const isSpellKnown = useCallback((spell: SpellSelectionEntry): boolean => {
        return spell.isKnown ?? false;
    }, []);

    // Check if max spells reached for a level
    const isMaxSpellsReached = useCallback((level: number): boolean => {
        if (!selectedClass?.spellsKnown) return false;
        const current = spellsKnownByLevel.get(level) ?? 0;
        const max = maxSpellsPerLevel.get(level) ?? 0;
        return max > 0 && current >= max;
    }, [selectedClass, spellsKnownByLevel, maxSpellsPerLevel]);

    // Check if spell level is valid for current advancement level
    const isSpellLevelValid = useCallback((spell: SpellSelectionEntry): boolean => {
        if (!selectedClass || !currentAdvancement) return false;

        // For spellbook classes, validate spell level against max castable at advancement level
        if (isSpellbookClass && selectedClass.spellcastingProgression) {
            return canScribeSpellAtLevel(
                currentAdvancement,
                spell.level,
                selectedClass.spellcastingProgression
            );
        }

        // For other classes, allow all spells
        return true;
    }, [selectedClass, currentAdvancement, isSpellbookClass]);

    // Check if action should be disabled
    const isActionDisabled = useCallback((spell: SpellSelectionEntry): boolean => {
        // Enable action for spellbook classes or spellsKnown classes
        const hasAction = selectedClass?.spellsKnown || isSpellbookClass;
        if (!hasAction) return true;

        // Don't disable if spell is known - allow removal
        // if (isSpellKnown(spell)) return true; // Already known

        // For spellsKnown classes, check max spells per level
        if (selectedClass?.spellsKnown && isMaxSpellsReached(spell.level)) {
            return true;
        }

        // For spellbook classes, check spell level validity (always enforced)
        if (isSpellbookClass && !isSpellLevelValid(spell)) {
            return true;
        }

        // For spellbook classes in level-up mode, check free spell limit
        if (isSpellbookClass && spellbookMode === 'level-up') {
            if (availableFreeSpells !== undefined && remainingFreeSpells !== undefined) {
                if (remainingFreeSpells <= 0) {
                    return true; // No free spells remaining
                }
            }
        }

        return false;
    }, [selectedClass, isMaxSpellsReached, isSpellbookClass, spellbookMode, isSpellLevelValid, availableFreeSpells, remainingFreeSpells]);

    // Define columns for spell display
    const spellColumns: ColumnDef<SpellSelectionEntry, unknown>[] = useMemo(() => [
        {
            accessorKey: 'name',
            header: 'Spell Name',
            size: 75,
            cell: ({ row }) => {
                const spell = row.original;
                return (
                    <EntityLink
                        entityType="spell"
                        entityId={spell.id}
                        href={`/spells/${spell.id}`}
                    >
                        {spell.name}
                    </EntityLink>
                );
            }
        },
        {
            accessorKey: 'school',
            header: 'School',
            size: 75,
            cell: ({ row }) => {
                const schools = row.original.schoolIds?.map(s => {
                    const school = SPELL_SCHOOL_MAP[s.schoolId as keyof typeof SPELL_SCHOOL_MAP];
                    return school?.name ?? '';
                }).filter(Boolean).join(', ') ?? '';
                const subschools = row.original.subSchoolIds?.map(s => {
                    const subschool = SPELL_SUBSCHOOL_MAP[s.subSchoolId as keyof typeof SPELL_SUBSCHOOL_MAP];
                    return subschool?.name ?? '';
                }).filter(Boolean);
                if (subschools && subschools.length > 0) {
                    return `${schools} [${subschools.join(', ')}]`;
                }
                return schools;
            }
        },
        {
            accessorKey: 'summary',
            header: 'Description',
            cell: ({ row }) => row.original.summary ?? ''
        },
        {
            accessorKey: 'source',
            header: 'Source',
            size: 30,
            cell: ({ row }) => {
                const sourceInfo = row.original.sourceBookInfo?.[0];
                if (!sourceInfo) return '';
                // Type assertion needed until schema package is rebuilt
                const sourceBook = (sourceInfo as { sourceBook?: { abbreviation: string } | null }).sourceBook;
                const abbrev = sourceBook?.abbreviation ?? '';
                const page = sourceInfo.pageNumber;
                if (!abbrev && !page) return '';
                if (!page) return abbrev;
                return `${abbrev} ${page}`;
            }
        }
    ], []);

    // Determine if the selected class is divine or arcane
    const isDivineCaster = useMemo(() => {
        if (!selectedClass) return false;
        return selectedClass.isDivine ?? false;
    }, [selectedClass]);

    // Custom grouping config to group by spell level
    const groupingConfig: ScrollableCategorizedListProps<SpellSelectionEntry>['groupingConfig'] = useMemo(() => ({
        getEffectiveFields: (_item: SpellSelectionEntry, _groupingFields: string[]) => {
            // Group only by level (domain spells are excluded)
            return ['level'];
        },
        sortGroupKeys: (keys: Array<[unknown, unknown]>, fieldPath: string) => {
            if (fieldPath === 'level') {
                // Sort levels: 0, 1, 2, ..., 9
                return keys.sort((a, b) => {
                    const aLevel = typeof a[0] === 'number' ? a[0] : -1;
                    const bLevel = typeof b[0] === 'number' ? b[0] : -1;
                    return aLevel - bLevel;
                });
            }
            return keys;
        },
        getEffectiveFieldForFormatting: (currentField: string, categoryValue: unknown) => {
            // Format level
            if (currentField === 'level' && typeof categoryValue === 'number') {
                if (categoryValue === 0) {
                    // Use "orison" for divine casters, "cantrip" for arcane casters
                    return isDivineCaster ? 'Orisons' : 'Cantrips';
                }
                // Use ordinal library for other levels: "1st Level", "2nd Level", etc.
                return `${ordinal(categoryValue)} Level`;
            }
            return currentField;
        }
    }), [isDivineCaster]);

    // Format level for display
    const formatLevel = (level: number): string => {
        if (level === 0) return '0th';
        const suffixes = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'];
        const lastDigit = level % 10;
        return `${level}${suffixes[lastDigit]}`;
    };

    if (spellcastingClasses.length === 0) {
        return (
            <div className="p-6">
                <p className="text-gray-600 dark:text-gray-400">
                    This character has no spellcasting classes.
                </p>
            </div>
        );
    }

    if (!selectedClass) {
        return (
            <div className="p-6">
                <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Spellcasting Class
                </label>
                <select
                    value={selectedClassId ?? ''}
                    onChange={(e) => setSelectedClassId(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                    {spellcastingClasses.map(sc => {
                        const className = sc.class?.name || getClassNameFromCache(sc.classId) || 'Unknown Class';
                        return (
                            <option key={sc.classId} value={sc.classId}>
                                {className} (Level {sc.level})
                            </option>
                        );
                    })}
                </select>
            </div>

            {!isQueryEnabled ? (
                <div className="p-6">
                    <p className="text-gray-600 dark:text-gray-400">
                        {!character?.id
                            ? 'Please save the character first to view and select spells.'
                            : 'Please select a spellcasting class.'}
                    </p>
                </div>
            ) : isLoadingSpells ? (
                <div className="p-6">
                    <p className="text-gray-600 dark:text-gray-400">Loading spells...</p>
                    {spellError && (
                        <p className="text-red-600 dark:text-red-400 mt-2">Error: {String(spellError)}</p>
                    )}
                </div>
            ) : transformedSpells.length === 0 ? (
                <div className="p-6">
                    <p className="text-gray-600 dark:text-gray-400">No spells available for this class.</p>
                </div>
            ) : (
                <>
                    {/* Display free spells count for spellbook classes */}
                    {isSpellbookClass && availableFreeSpells !== undefined && spellbookMode === 'level-up' && (
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                Free spells: {freeSpellsUsed} of {availableFreeSpells} used
                                {remainingFreeSpells !== undefined && remainingFreeSpells > 0 && (
                                    <span className="ml-2 text-green-600 dark:text-green-400">
                                        ({remainingFreeSpells} remaining)
                                    </span>
                                )}
                            </p>
                            {knownFreeGrantSpells.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                        Spells added to spellbook:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {knownFreeGrantSpells.map((knownSpell) => {
                                            const spellEntry = spellData?.results.find(s => s.id === knownSpell.spellId);
                                            if (!spellEntry) return null;

                                            return (
                                                <div
                                                    key={knownSpell.spellId}
                                                    className="group relative inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:border-red-400 dark:hover:border-red-500 transition-colors"
                                                >
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">
                                                        {knownSpell.level === 0 ? '0th' : ordinal(knownSpell.level)}
                                                    </span>
                                                    <EntityLink
                                                        entityType="spell"
                                                        entityId={knownSpell.spellId}
                                                        href={`/spells/${knownSpell.spellId}`}
                                                    >
                                                        {knownSpell.name}
                                                    </EntityLink>
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            await handleRemoveSpell(spellEntry as SpellSelectionEntry);
                                                        }}
                                                        className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                                        title="Remove from spellbook"
                                                        aria-label={`Remove ${knownSpell.name} from spellbook`}
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="h-[calc(100vh-300px)]">
                        <ScrollableCategorizedList<SpellSelectionEntry>
                            dataFetcher={dataFetcher}
                            groupingFields={['level']}
                            groupingConfig={groupingConfig}
                            columns={spellColumns}
                            getActionButtonLabel={(spell) => {
                                if (selectedClass.spellsKnown) {
                                    return isSpellKnown(spell) ? 'Forget' : 'Learn';
                                }
                                if (isSpellbookClass) {
                                    if (isSpellKnown(spell)) {
                                        return 'Remove from Spellbook';
                                    }
                                    return spellbookMode === 'level-up'
                                        ? 'Add to Spellbook'
                                        : 'Scribe to Spellbook';
                                }
                                return '';
                            }}
                            onAction={
                                selectedClass.spellsKnown || isSpellbookClass
                                    ? async (spell) => {
                                        if (isSpellKnown(spell)) {
                                            await handleRemoveSpell(spell);
                                        } else {
                                            await handleLearnSpell(spell);
                                        }
                                    }
                                    : undefined
                            }
                            isActionDisabled={
                                selectedClass.spellsKnown || isSpellbookClass
                                    ? (spell) => {
                                        // Don't disable if spell is known (allow removal)
                                        if (isSpellKnown(spell)) {
                                            return false;
                                        }
                                        // Otherwise use the existing disabled logic
                                        return isActionDisabled(spell);
                                    }
                                    : undefined
                            }
                            searchPlaceholder="Search spells by name..."
                            storageKey={`spell-selection-${selectedClassId}`}
                            itemDesc="spells"
                            maxHeight="auto"
                        />
                    </div>
                </>
            )}
        </div>
    );
}

