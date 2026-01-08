import { useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import ordinal from 'ordinal';
import React, { useMemo, useState, useCallback } from 'react';

import { ScrollableCategorizedList } from '@/components/scrollable-categorized-list';
import type { ScrollableCategorizedListProps } from '@/components/scrollable-categorized-list/types';
import type { TabComponentProps } from '@/features/character/types';
import { CharacterQueryHooks } from '@/services/query/CharacterQueryHooks';
import type { CharacterSpellSelectionEntry, DnDClass } from '@shared/schema';
import { SPELL_SCHOOL_MAP, SPELL_SUBSCHOOL_MAP } from '@shared/static-data';

type SpellSelectionEntry = CharacterSpellSelectionEntry & {
    level: number; // Spell level from SpellLevelMap for grouping
    domainName?: string | null; // Domain name if this is a domain spell
};

export function SpellSelectionTab({
    state,
    character,
    resolvedData,
    sharedData
}: TabComponentProps): React.JSX.Element {
    const queryClient = useQueryClient();
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

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
        console.log('SpellSelectionTab: Found spellcasting classes', result.map(sc => ({ id: sc.classId, name: sc.class.name, level: sc.level })));
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

        return spells;
    }, [spellData]);

    // Handle learn spell
    const handleLearnSpell = useCallback(async (spell: SpellSelectionEntry) => {
        if (!character?.id || !selectedClassId) return;

        // Find the most recent advancement for this class
        const advancement = character.advancements
            .filter(a => a.classId === selectedClassId || a.secondaryClassId === selectedClassId)
            .sort((a, b) => b.level - a.level)[0];

        if (!advancement) return;

        try {
            await CharacterQueryHooks.addSpellKnown({
                characterId: character.id,
                classId: selectedClassId,
                spellId: spell.id,
                advancementId: advancement.id
            });

            // Invalidate queries to refresh data
            queryClient.invalidateQueries({
                queryKey: CharacterQueryHooks.getCharacterSpellSelectionQueryKey(character.id, selectedClassId)
            });
            queryClient.invalidateQueries({
                queryKey: CharacterQueryHooks.getCharacterWithAllDetailsQueryKey(character.id)
            });
        } catch (error) {
            console.error('Failed to learn spell:', error);
        }
    }, [character, selectedClassId, queryClient]);

    // Handle remove spell
    const handleRemoveSpell = useCallback(async (spell: SpellSelectionEntry) => {
        if (!character?.id) return;

        // Find advancement that has this spell
        const advancement = character.advancements.find(a =>
            a.spellsKnown?.some(s => s.spellId === spell.id)
        );

        if (!advancement) return;

        try {
            await CharacterQueryHooks.removeSpellKnown({
                characterId: character.id,
                spellId: spell.id,
                advancementId: advancement.id
            });

            // Invalidate queries to refresh data
            queryClient.invalidateQueries({
                queryKey: CharacterQueryHooks.getCharacterSpellSelectionQueryKey(character.id, selectedClassId ?? 0)
            });
            queryClient.invalidateQueries({
                queryKey: CharacterQueryHooks.getCharacterWithAllDetailsQueryKey(character.id)
            });
        } catch (error) {
            console.error('Failed to remove spell:', error);
        }
    }, [character, selectedClassId, queryClient]);

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

    // Check if action should be disabled
    const isActionDisabled = useCallback((spell: SpellSelectionEntry): boolean => {
        if (!selectedClass?.spellsKnown) return true; // No action for non-spellsKnown classes
        if (isSpellKnown(spell)) return true; // Already known
        if (isMaxSpellsReached(spell.level)) return true; // Max spells reached for this level
        return false;
    }, [selectedClass, isSpellKnown, isMaxSpellsReached]);

    // Define columns for spell display
    const spellColumns: ColumnDef<SpellSelectionEntry, unknown>[] = useMemo(() => [
        {
            accessorKey: 'name',
            header: 'Spell Name',
            size: 75,
            cell: ({ row }) => row.original.name
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
                    {spellcastingClasses.map(sc => (
                        <option key={sc.classId} value={sc.classId}>
                            {sc.class.name} (Level {sc.level})
                        </option>
                    ))}
                </select>
            </div>

            {!isQueryEnabled ? (
                <div className="p-6">
                    <p className="text-gray-600 dark:text-gray-400">Please select a spellcasting class.</p>
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
                <div className="h-[calc(100vh-300px)]">
                    <ScrollableCategorizedList<SpellSelectionEntry>
                        dataFetcher={async () => ({
                            results: transformedSpells,
                            total: transformedSpells.length
                        })}
                        groupingFields={['level']}
                        groupingConfig={groupingConfig}
                        columns={spellColumns}
                        actionButtonLabel={selectedClass.spellsKnown ? 'Learn' : undefined}
                        onAction={selectedClass.spellsKnown ? handleLearnSpell : undefined}
                        isActionDisabled={selectedClass.spellsKnown ? isActionDisabled : undefined}
                        searchPlaceholder="Search spells by name..."
                        storageKey={`spell-selection-${selectedClassId}`}
                        itemDesc="spells"
                        maxHeight="auto"
                    />
                </div>
            )}
        </div>
    );
}

