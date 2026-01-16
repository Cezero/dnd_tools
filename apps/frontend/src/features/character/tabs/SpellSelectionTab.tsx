import { TrashIcon } from '@heroicons/react/24/outline';
import { ColumnDef } from '@tanstack/react-table';
import ordinal from 'ordinal';
import React, { useMemo, useState, useCallback } from 'react';

import { EntityLink } from '@/components/entity-link';
import { ScrollableCategorizedList } from '@/components/scrollable-categorized-list';
import type { ScrollableCategorizedListProps } from '@/components/scrollable-categorized-list/types';
import { CharacterEditStateUpdateType, type TabComponentProps } from '@/features/character/types';
import { hasSpellbook } from '@/features/character/utils/spellbookUtils';
import { getSpellcastingClasses } from '@/features/character/utils/spellcastingUtils';
import { formatSpellSchool } from '@/lib/formatters';
import { useCacheFunctions, formatSourceReference } from '@/services/cache';

import type { SpellSelectionEntry } from './types';

/**
 * Spell selection tab component for managing character spells (known spells, spellbook, etc.).
 * 
 * **State Management Pattern**: This tab follows the standardized state → useEffect → API + refreshState pattern.
 * - Updates state via `updateState()` when spellsKnown changes
 * - CharacterEdit component automatically syncs state changes to backend via `syncSpellsKnown` API
 * - Do NOT call APIs directly for state management - use `updateState()` instead
 * 
 * **Spell Selection Data**: Uses spell selection data from resolved character response (architecturally correct).
 * - Spell selection data (spells list, domain spells, availableFreeSpells) is calculated during
 *   character resolution using resolved progressions
 * - Data is accessed via `resolvedData.spellSelection?.[classId]`
 * - This is architecturally correct since spell selection data depends on resolved progressions,
 *   class choices, domain choices, and feat choices - all part of the resolved character
 * 
 * **Backend Validation**: Spell level validation is handled by the backend in `syncSpellsKnown()`.
 * The UI allows optimistic selection and the backend validates and rejects invalid spells.
 * 
 * @see CharacterEdit component for sync pattern documentation
 * @see ResolvedCharacterResultSchema - Schema for resolved character including spell selection data
 */
export function SpellSelectionTab({
    state,
    updateState,
    character,
    resolvedData,
    sharedData,
    isLoading,
    spellbookMode = 'level-up'
}: TabComponentProps & { spellbookMode?: 'level-up' | 'scribing' }): React.JSX.Element {
    const { getClassNameFromCache } = useCacheFunctions();
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

    // Get all spellcasting classes the character has using classDetailsMap from sharedData
    const spellcastingClasses = useMemo(() => {
        if (!character?.advancements || !sharedData?.classDetailsMap) {
            return [];
        }

        return getSpellcastingClasses(character.advancements, sharedData.classDetailsMap);
    }, [character?.advancements, sharedData?.classDetailsMap]);

    // Auto-select first class if none selected
    React.useEffect(() => {
        if (!selectedClassId && spellcastingClasses.length > 0) {
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

    // Get spell selection data from resolved character (architecturally correct - data depends on resolved progressions)
    // Access spellSelection if it exists, regardless of isLoading (isLoading can be true during updates while data exists)
    const classSpellSelection = useMemo(() => {
        if (!selectedClassId) return undefined;
        // Check if spellSelection exists (could be empty object {} if no spells for any class)
        if (!resolvedData?.spellSelection) {
            return undefined;
        }
        const classKey = selectedClassId.toString();
        return resolvedData.spellSelection[classKey];
    }, [selectedClassId, resolvedData?.spellSelection]);

    // Get available free spells from resolved character data (for spellbook classes)
    const availableFreeSpells = useMemo(() => {
        if (!isSpellbookClass || !classSpellSelection) return undefined;
        return classSpellSelection.availableFreeSpells;
    }, [isSpellbookClass, classSpellSelection]);

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
        if (!isSpellbookClass) return 0;
        // Count free grant spells from state
        return state.spellsKnown.filter(s => s.isFreeGrant === true).length;
    }, [isSpellbookClass, state.spellsKnown]);

    // Calculate remaining free spells
    const remainingFreeSpells = useMemo(() => {
        if (availableFreeSpells === undefined) return undefined;
        return Math.max(0, availableFreeSpells - freeSpellsUsed);
    }, [availableFreeSpells, freeSpellsUsed]);

    // Get spell data from resolved character (spell selection data is now part of resolved character response)
    const spellData = useMemo(() => {
        if (!classSpellSelection) return undefined;
        // Resolved character format uses 'spells' (ClassSpellSelection format)
        return {
            results: classSpellSelection.spells ?? [],
            domainSpells: classSpellSelection.domainSpells ?? [],
            total: (classSpellSelection.spells?.length ?? 0) + (classSpellSelection.domainSpells?.length ?? 0),
        };
    }, [classSpellSelection]);

    // Get list of known free grant spells for the current advancement
    // Uses spellData which is optimistically updated, and filters by isKnown and isFreeGrant
    // Also reads from cached character data to get the most up-to-date spellsKnown array
    /**
     * Get list of known free grant spells for the current advancement.
     * 
     * Derives the list of currently known free grant spells from `spellData` (from resolved character)
     * and the `state.spellsKnown` array. This list is displayed in the "Free spells" notification
     * section with remove buttons.
     * 
     * **Data Source**:
     * - Uses spell selection data from resolved character (architecturally correct)
     * - Reads from `state.spellsKnown` to identify free grant spells
     * - Matches against `spellData` to get spell names and levels
     * 
     * **Purpose**:
     * - Display known free grant spells in the UI
     * - Provide remove buttons for each spell
     * - Update immediately after spell add/remove operations
     */
    const knownFreeGrantSpells = useMemo(() => {
        if (!spellData?.results || !isSpellbookClass) return [];

        // Get spell IDs that are free grants from state
        const freeGrantSpellIds = new Set(
            state.spellsKnown
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
    }, [state.spellsKnown, spellData, isSpellbookClass]);

    // 0th level spells for spellbook classes are granted via feature system
    // (EntityType.Other + EntityAppliesToType.SpellbookSpell with appliesToId: 0, appliesToSubId: -1)
    // They appear as "known" in the spell list without needing database records

    // Get spells known for this class to calculate max spells per level
    const spellsKnownByLevel = useMemo(() => {
        if (!selectedClassId || !spellData) return new Map<number, number>();

        const counts = new Map<number, number>();
        for (const spell of state.spellsKnown) {
            // Get spell level from SpellLevelMap for this class
            const spellEntry = spellData.results.find(s => s.id === spell.spellId);
            if (spellEntry) {
                const level = spellEntry.classSpellLevel ?? 0;
                counts.set(level, (counts.get(level) ?? 0) + 1);
            }
        }
        return counts;
    }, [state.spellsKnown, selectedClassId, spellData]);

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

        // Determine if this is a free grant (for spellbook classes in level-up mode)
        const isFreeGrant = isSpellbookClass && spellbookMode === 'level-up';

        // Check if spell is already known
        const isAlreadyKnown = state.spellsKnown.some(s => s.spellId === spell.id);
        if (isAlreadyKnown) return;

        // Update state - CharacterEdit will sync to backend automatically
        updateState({
            type: CharacterEditStateUpdateType.SET_SPELLS_KNOWN,
            payload: {
                spellsKnown: [
                    ...state.spellsKnown,
                    { spellId: spell.id, isFreeGrant }
                ]
            }
        });
    }, [character, selectedClassId, isSpellbookClass, spellbookMode, state.spellsKnown, updateState]);

    // Handle remove spell
    const handleRemoveSpell = useCallback(async (spell: SpellSelectionEntry) => {
        // Update state - CharacterEdit will sync to backend automatically
        updateState({
            type: CharacterEditStateUpdateType.SET_SPELLS_KNOWN,
            payload: {
                spellsKnown: state.spellsKnown.filter(s => s.spellId !== spell.id)
            }
        });
    }, [state.spellsKnown, updateState]);

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

    // Note: Spell level validation is handled by the backend in syncSpellsKnown().
    // The UI allows optimistic selection and the backend will validate and reject invalid spells.

    // Memoized helper function for school/subschool formatting
    const formatSchoolSubschool = useCallback((schoolIds: Array<{ schoolId: number }> | null | undefined, subSchoolIds: Array<{ subSchoolId: number }> | null | undefined): string => {
        return formatSpellSchool(schoolIds, subSchoolIds, { useAbbreviation: false });
    }, []);

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

        // Note: Spell level validation for spellbook classes is handled by the backend.
        // The UI allows selection and the backend validates in syncSpellsKnown().

        // For spellbook classes in level-up mode, check free spell limit
        if (isSpellbookClass && spellbookMode === 'level-up') {
            if (availableFreeSpells !== undefined && remainingFreeSpells !== undefined) {
                if (remainingFreeSpells <= 0) {
                    return true; // No free spells remaining
                }
            }
        }

        return false;
    }, [selectedClass, isMaxSpellsReached, isSpellbookClass, spellbookMode, availableFreeSpells, remainingFreeSpells]);

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
                return formatSchoolSubschool(row.original.schoolIds, row.original.subSchoolIds);
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
                return formatSourceReference({ sourceBookId: sourceInfo.sourceBookId, pageNumber: sourceInfo.pageNumber });
            }
        }
    ], [formatSchoolSubschool]);

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

            {!character?.id ? (
                <div className="p-6">
                    <p className="text-gray-600 dark:text-gray-400">
                        Please save the character first to view and select spells.
                    </p>
                </div>
            ) : !selectedClassId ? (
                <div className="p-6">
                    <p className="text-gray-600 dark:text-gray-400">Please select a spellcasting class.</p>
                </div>
            ) : isLoading && !resolvedData?.spellSelection ? (
                <div className="p-6">
                    <p className="text-gray-600 dark:text-gray-400">Loading spells...</p>
                </div>
            ) : !spellData || spellData.results.length === 0 ? (
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

