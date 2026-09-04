import { ColumnDef } from '@tanstack/react-table';
import ordinal from 'ordinal';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import { SpellTooltip } from '@/components/entity-tooltip/SpellTooltip';
import { ScrollableCategorizedList } from '@/components/scrollable-categorized-list';
import { CharacterDetailStateUpdateType } from '@/features/character/types';
import { hasZeroLevelSpellbookSpellsGrant } from '@/features/character/utils/spellbookUtils';
import { getCastingAbilityId, getSpellcastingClasses, knowsFullClassSpellList, shouldIncludeSpellOnSheet } from '@/features/character/utils/spellcastingUtils';
import { getSpellsPerDayMap } from '@/lib/ClassProgression';
import { formatSpellSchool, formatSpellComponents } from '@/lib/formatters';
import { useCacheFunctions, formatSourceFromObject } from '@/services/cache';
import type { CharacterSpellPreparationResponse, Spell } from '@shared/schema';
import { ABILITY_MAP, GetAbilityModifier, GetBonusSpellsForAbility, SpellSlotType } from '@shared/static-data';

import type { SpellsTabProps, SpellEntry } from './types';

/**
 * SpellsTab displays spell list, preparation interface, and cast tracking.
 * 
 * **Sync Pattern**: This tab follows the standardized state → useEffect → API + refreshState pattern.
 * - Updates state via `updateState()` when spell preparations change
 * - CharacterDetail component automatically syncs state changes to backend
 * - Do NOT call APIs directly - use `updateState()` instead
 * 
 * @see CharacterDetail component for sync pattern documentation
 */
export function SpellsTab({ character, classDetailsMap, resolvedProgressions, characterId, state, updateState, resolution }: SpellsTabProps): React.JSX.Element {
    const { getClassNameFromCache } = useCacheFunctions();
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

    // Use spell preparations from centralized state
    const spellPreparations = state.spellPreparations.map(prep => ({
        id: prep.id!,
        characterId: character.id,
        classId: prep.classId,
        spellId: prep.spellId,
        spellLevel: prep.spellLevel,
        quantity: prep.quantity,
        timesCast: prep.timesCast ?? 0,
        slotType: (prep.slotType ?? SpellSlotType.NORMAL) as number,
        featId: prep.featId ?? null,
    })) as CharacterSpellPreparationResponse[];

    // Store preparations in a Map keyed by a composite key for efficient lookup
    // Key format: `${classId}-${spellId}-${spellLevel}`
    const preparationsMap = useMemo(() => {
        const map = new Map<string, CharacterSpellPreparationResponse>();
        for (const prep of spellPreparations) {
            const key = `${prep.classId}-${prep.spellId}-${prep.spellLevel}`;
            // If multiple preparations exist for same spell/level, use the first one
            // (for now - we can enhance this later to handle multiple preparations)
            if (!map.has(key)) {
                map.set(key, prep);
            }
        }
        return map;
    }, [spellPreparations]);

    // Get all spellcasting classes
    const spellcastingClasses = useMemo(() => {
        return getSpellcastingClasses(character?.advancements, classDetailsMap);
    }, [character?.advancements, classDetailsMap]);

    // Auto-select first class if none selected
    useEffect(() => {
        if (!selectedClassId && spellcastingClasses.length > 0) {
            setSelectedClassId(spellcastingClasses[0].classId);
        }
    }, [selectedClassId, spellcastingClasses]);

    // Get selected class data
    const selectedClass = useMemo(() => {
        if (!selectedClassId) return null;
        return spellcastingClasses.find(sc => sc.classId === selectedClassId) || null;
    }, [selectedClassId, spellcastingClasses]);

    // Calculate total prepared spells per level for the selected class
    const totalPreparedPerLevel = useMemo(() => {
        if (!selectedClass) return new Map<number, number>();

        const totals = new Map<number, number>();
        for (const prep of spellPreparations) {
            if (prep.classId === selectedClass.classId) {
                const current = totals.get(prep.spellLevel) ?? 0;
                totals.set(prep.spellLevel, current + prep.quantity);
            }
        }
        return totals;
    }, [spellPreparations, selectedClass]);

    const isLoadingSpells = resolution.isLoading;

    // Get spell selection data from resolved character
    // Access spellSelection if it exists, regardless of isLoading (isLoading can be true during updates while data exists)
    const spellSelectionData = useMemo(() => {
        if (!selectedClassId) return null;
        // Check if spellSelection exists (could be empty object {} if no spells for any class)
        if (!resolution.resolvedCharacter?.spellSelection) {
            return null;
        }
        const classKey = selectedClassId.toString();
        return resolution.resolvedCharacter.spellSelection[classKey] || null;
    }, [selectedClassId, resolution.resolvedCharacter?.spellSelection]);

    // Process spell data similar to PDF service
    const spellData = useMemo(() => {
        if (!spellSelectionData || !selectedClass) return null;

        // Extract domain spells
        let domainSpellsFromArray: Array<{ domainId: number; domainName: string; spell: Spell; spellLevel: number; classSpellLevel: number | null; isKnown: boolean }> = [];
        if (spellSelectionData.domainSpells && spellSelectionData.domainSpells.length > 0) {
            domainSpellsFromArray = spellSelectionData.domainSpells.map(ds => ({
                domainId: ds.domainId ?? 0,
                domainName: ds.domainName ?? '',
                spell: ds as unknown as Spell,
                spellLevel: ds.domainSpellLevel ?? 0,
                classSpellLevel: ds.classSpellLevel,
                isKnown: ds.isKnown ?? false
            }));
        }

        const domainSpellsFromResults = (spellSelectionData.spells ?? [])
            .filter(s => s.domainName != null && s.domainName !== undefined)
            .map(s => ({
                domainId: s.domainId ?? 0,
                domainName: s.domainName ?? '',
                spell: s as unknown as Spell,
                spellLevel: s.domainSpellLevel ?? 0,
                classSpellLevel: s.classSpellLevel,
                isKnown: s.isKnown ?? false
            }));

        const domainSpellIds = new Set([...domainSpellsFromArray, ...domainSpellsFromResults].map(ds => ds.spell.id));
        const domainSpells = [...domainSpellsFromArray, ...domainSpellsFromResults.filter(ds => !domainSpellsFromArray.some(dsa => dsa.spell.id === ds.spell.id))];

        // Regular spells
        const allSpells = (spellSelectionData.spells ?? [])
            .filter(s => s.domainName == null && !domainSpellIds.has(s.id))
            .map(s => ({
                spell: s as unknown as Spell,
                classSpellLevel: s.classSpellLevel,
                isKnown: s.isKnown ?? false
            }));

        const hasZeroLevelGrant = hasZeroLevelSpellbookSpellsGrant(resolvedProgressions, selectedClass.classId);
        let castableLevels: Map<number, number> | undefined;
        if (knowsFullClassSpellList(selectedClass.class)) {
            const slots = getSpellsPerDayMap(
                resolvedProgressions ?? [],
                selectedClass.level,
                selectedClass.classId
            );
            if (slots.size > 0) {
                castableLevels = slots;
            }
        }

        const spells = allSpells.filter(s => shouldIncludeSpellOnSheet(selectedClass.class, {
            isKnown: s.isKnown,
            classSpellLevel: s.classSpellLevel,
            hasZeroLevelGrant,
            castableLevels,
        }));

        const filteredDomainSpells = domainSpells.filter(ds => shouldIncludeSpellOnSheet(selectedClass.class, {
            isKnown: ds.isKnown,
            classSpellLevel: ds.spellLevel,
            hasZeroLevelGrant,
            castableLevels,
        }));

        return { spells, domainSpells: filteredDomainSpells };
    }, [spellSelectionData, selectedClass, resolvedProgressions]);

    // Transform spells for ScrollableCategorizedList
    const transformedSpells = useMemo(() => {
        if (!spellData) return [];

        const spells: SpellEntry[] = [];

        // Add domain spells
        for (const domainSpell of spellData.domainSpells) {
            const spell = domainSpell.spell;
            spells.push({
                id: spell.id,
                spell,
                level: domainSpell.spellLevel,
                domainName: domainSpell.domainName,
                isDomain: true,
                classSpellLevel: domainSpell.classSpellLevel,
                isKnown: domainSpell.isKnown,
                spellName: spell.name,
                school: formatSpellSchool(spell),
                components: formatSpellComponents(spell.componentIds),
                castingTime: spell.castingTime ?? '',
                range: spell.range ?? '',
                duration: spell.duration ?? '',
                savingThrow: spell.savingThrow ?? '',
                spellResistance: spell.spellResistance ?? '',
                description: spell.summary ?? '',
                reference: formatSourceFromObject(spell, { sourceSelection: 'first' }),
                categoryGroup: domainSpell.domainName || null
            });
        }

        // Add regular spells
        for (const spellEntry of spellData.spells) {
            if (spellEntry.classSpellLevel !== null) {
                const spell = spellEntry.spell;
                spells.push({
                    id: spell.id,
                    spell,
                    level: spellEntry.classSpellLevel,
                    domainName: null,
                    isDomain: false,
                    classSpellLevel: spellEntry.classSpellLevel,
                    isKnown: spellEntry.isKnown,
                    spellName: spell.name,
                    school: formatSpellSchool(spell),
                    components: formatSpellComponents(spell.componentIds),
                    castingTime: spell.castingTime ?? '',
                    range: spell.range ?? '',
                    duration: spell.duration ?? '',
                    savingThrow: spell.savingThrow ?? '',
                    spellResistance: spell.spellResistance ?? '',
                    description: spell.summary ?? '',
                    reference: formatSourceFromObject(spell, { sourceSelection: 'first' }),
                    categoryGroup: null // Regular spells have null categoryGroup
                });
            }
        }

        return spells;
    }, [spellData]);

    // Calculate caster level and spell save DC
    const casterInfo = useMemo(() => {
        if (!selectedClass) return null;

        const classLevel = character.advancements.filter(a =>
            a.classId === selectedClass.classId || a.secondaryClassId === selectedClass.classId
        ).length;

        const castingAbilityId = getCastingAbilityId(resolvedProgressions, selectedClass.classId);

        // ERROR if casting ability not found - do NOT default
        if (castingAbilityId === null) {
            // Casting ability should always be found in level 1 class features
        }

        const abilityScore = castingAbilityId !== null
            ? character.abilityScores.find(a => a.abilityId === castingAbilityId)?.value ?? 10
            : 10; // Use 10 (modifier 0) if casting ability not found
        const abilityModifier = GetAbilityModifier(abilityScore);
        const baseSpellSaveDC = 10 + abilityModifier;

        // Slots come from FeatureEntity formulas. getClassById leaves spellcastingProgression null.
        let spellsPerDay = getSpellsPerDayMap(
            resolvedProgressions ?? [],
            classLevel,
            selectedClass.classId
        );
        if (spellsPerDay.size === 0 && selectedClass.class.spellcastingProgression) {
            spellsPerDay = new Map<number, number>();
            for (const feature of selectedClass.class.spellcastingProgression) {
                if (feature.classLevel <= classLevel) {
                    for (const slot of feature.slots || []) {
                        if (slot.spellLevel >= 0 && slot.spellLevel <= 9) {
                            spellsPerDay.set(slot.spellLevel, slot.slotsPerDay);
                        }
                    }
                }
            }
        }

        // Add bonus spells from high casting ability (only for levels 1-9, not 0)
        // Only grant bonus spells for spell levels the character has access to
        const bonusSpells = GetBonusSpellsForAbility(abilityScore);
        for (let level = 1; level <= 9; level++) {
            // Only add bonus spells if the character already has access to this spell level
            if (spellsPerDay.has(level)) {
                const bonus = bonusSpells[level - 1]; // Array is 0-indexed for levels 1-9
                if (bonus > 0) {
                    const current = spellsPerDay.get(level)!;
                    spellsPerDay.set(level, current + bonus);
                }
            }
        }

        // Calculate spell ranges with caster level
        const close = 25 + Math.floor(classLevel / 2) * 5;
        const medium = 100 + classLevel * 10;
        const long = 400 + classLevel * 40;

        return {
            casterLevel: classLevel,
            castingAbilityId, // Keep as null if not found - will show error in UI
            abilityModifier,
            baseSpellSaveDC,
            spellsPerDay,
            isDivine: selectedClass.class.isDivine ?? false,
            ranges: {
                close: `${close} ft.`,
                medium: `${medium} ft.`,
                long: `${long} ft.`
            }
        };
    }, [selectedClass, character, resolvedProgressions]);

    // Mutations for spell preparation
    // Preparation increment/decrement handlers - update state, CharacterDetail will sync automatically
    const handlePrepIncrement = useCallback((spellEntry: SpellEntry) => {
        if (!selectedClass) return;

        const key = `${selectedClass.classId}-${spellEntry.spell.id}-${spellEntry.level}`;
        const existingPrep = preparationsMap.get(key);
        const newQuantity = (existingPrep?.quantity ?? 0) + 1;

        if (existingPrep) {
            // Update existing preparation
            const updatedPreparations = state.spellPreparations.map(prep => {
                if (prep.id === existingPrep.id) {
                    return { ...prep, quantity: newQuantity };
                }
                return prep;
            });
            updateState({
                type: CharacterDetailStateUpdateType.SET_SPELL_PREPARATIONS,
                payload: { spellPreparations: updatedPreparations }
            });
        } else {
            // Add new preparation
            const newPrep = {
                id: null,
                classId: selectedClass.classId,
                spellId: spellEntry.spell.id,
                spellLevel: spellEntry.level,
                quantity: newQuantity,
                timesCast: 0,
                slotType: SpellSlotType.NORMAL,
                featId: null,
            };
            updateState({
                type: CharacterDetailStateUpdateType.ADD_SPELL_PREPARATION,
                payload: { spellPreparation: newPrep }
            });
        }
    }, [selectedClass, preparationsMap, state.spellPreparations, updateState]);

    const handlePrepDecrement = useCallback((spellEntry: SpellEntry) => {
        if (!selectedClass) return;

        const key = `${selectedClass.classId}-${spellEntry.spell.id}-${spellEntry.level}`;
        const existingPrep = preparationsMap.get(key);
        const currentQuantity = existingPrep?.quantity ?? 0;

        if (currentQuantity <= 0) return;

        const newQuantity = currentQuantity - 1;

        if (newQuantity === 0) {
            // Remove preparation
            if (existingPrep) {
                updateState({
                    type: CharacterDetailStateUpdateType.REMOVE_SPELL_PREPARATION,
                    payload: { spellPreparationId: existingPrep.id }
                });
            }
        } else {
            // Update preparation quantity
            const updatedPreparations = state.spellPreparations.map(prep => {
                if (prep.id === existingPrep.id) {
                    return { ...prep, quantity: newQuantity };
                }
                return prep;
            });
            updateState({
                type: CharacterDetailStateUpdateType.SET_SPELL_PREPARATIONS,
                payload: { spellPreparations: updatedPreparations }
            });
        }
    }, [selectedClass, preparationsMap, state.spellPreparations, updateState]);

    // Determine if class is spellsKnown
    const isSpellsKnown = selectedClass?.class.spellsKnown ?? false;

    // Define columns for the table
    const columns = useMemo<ColumnDef<SpellEntry>[]>(() => {
        const baseColumns: ColumnDef<SpellEntry>[] = [];

        // Prep column (only for prepared casters)
        if (!isSpellsKnown) {
            baseColumns.push({
                id: 'prep',
                header: 'Prep',
                size: 70,
                cell: ({ row }) => {
                    const spellEntry = row.original;
                    if (!selectedClass) return <div className="w-14"></div>;

                    const key = `${selectedClass.classId}-${spellEntry.spell.id}-${spellEntry.level}`;
                    const prep = preparationsMap.get(key);
                    const currentQuantity = prep?.quantity ?? 0;
                    const isLoading = false; // No longer using mutations - state updates are synchronous

                    // Check if at max spells for this level
                    const totalPreparedForLevel = totalPreparedPerLevel.get(spellEntry.level) ?? 0;
                    const maxSpellsForLevel = casterInfo?.spellsPerDay.get(spellEntry.level) ?? 0;
                    const isAtMax = maxSpellsForLevel > 0 && totalPreparedForLevel >= maxSpellsForLevel;

                    return (
                        <div className="flex items-center gap-1 w-14">
                            <span className="text-sm text-gray-900 dark:text-white min-w-[20px] text-center">
                                {currentQuantity}
                            </span>
                            <button
                                onClick={() => handlePrepIncrement(spellEntry)}
                                disabled={isLoading || isAtMax}
                                className="px-1 py-0.5 text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded flex items-center justify-center"
                                title={isAtMax ? "Maximum spells prepared for this level" : "Increase preparation"}
                            >
                                ▲
                            </button>
                            <button
                                onClick={() => handlePrepDecrement(spellEntry)}
                                disabled={currentQuantity === 0 || isLoading}
                                className="px-1 py-0.5 text-xs bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded flex items-center justify-center"
                                title="Decrease preparation"
                            >
                                ▼
                            </button>
                        </div>
                    );
                }
            });
        }

        // Spell Name column
        baseColumns.push({
            accessorKey: 'spellName',
            header: 'Spell Name',
            size: 170,
            cell: ({ row }) => {
                const spellName = row.original.spellName;
                const spellId = row.original.spell.id;
                return (
                    <SpellTooltip spellId={spellId}>
                        <span className="font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                            {spellName}
                        </span>
                    </SpellTooltip>
                );
            }
        });

        // School column
        baseColumns.push({
            accessorKey: 'school',
            header: 'School',
            size: 80,
        });

        // Range column
        baseColumns.push({
            accessorKey: 'range',
            header: 'Range',
            size: 80,
            cell: ({ getValue }) => {
                const range = getValue() as string;
                if (!range || !casterInfo?.ranges) return range;

                // Substitute calculated ranges for Close, Med, Long
                const rangeLower = range.toLowerCase().trim();
                if (rangeLower === 'close') {
                    return casterInfo.ranges.close;
                }
                if (rangeLower === 'med' || rangeLower === 'medium') {
                    return casterInfo.ranges.medium;
                }
                if (rangeLower === 'long') {
                    return casterInfo.ranges.long;
                }
                return range;
            }
        });

        // Save column
        baseColumns.push({
            accessorKey: 'savingThrow',
            header: 'Save',
            size: 120,
            cell: ({ getValue, row }) => {
                const savingThrow = getValue() as string;
                if (!savingThrow || savingThrow.toLowerCase() === 'none' || !casterInfo) {
                    return savingThrow;
                }

                // Calculate spell save DC: baseSpellSaveDC + spell level
                const spellLevel = row.original.level;
                const spellSaveDC = casterInfo.baseSpellSaveDC + spellLevel;

                return `${savingThrow} (DC ${spellSaveDC})`;
            }
        });

        // Cast column (for all casters)
        baseColumns.push({
            id: 'cast',
            header: 'Cast',
            size: 100,
            cell: ({ row }) => {
                const spellEntry = row.original;
                if (!selectedClass || !casterInfo) return <div className="w-20"></div>;

                const key = `${selectedClass.classId}-${spellEntry.spell.id}-${spellEntry.level}`;
                const prep = preparationsMap.get(key);

                if (isSpellsKnown) {
                    // Known casters: show timesCast / maxSlotsPerLevel
                    const maxSlots = casterInfo.spellsPerDay.get(spellEntry.level) ?? 0;
                    const timesCast = prep?.timesCast ?? 0;
                    const canCast = timesCast < maxSlots;
                    const canUncast = timesCast > 0;
                    const isLoading = false; // No longer using mutations - state updates are synchronous

                    // For known casters, create prep on-the-fly if needed when casting
                    const handleCast = () => {
                        if (prep) {
                            // Cast existing preparation
                            updateState({
                                type: CharacterDetailStateUpdateType.CAST_SPELL,
                                payload: { classId: selectedClass.classId, spellId: spellEntry.spell.id }
                            });
                        } else {
                            // Create prep first with quantity set to maxSlots, then cast it
                            const newPrep = {
                                id: null,
                                classId: selectedClass.classId,
                                spellId: spellEntry.spell.id,
                                spellLevel: spellEntry.level,
                                quantity: maxSlots,
                                timesCast: 1, // Cast immediately
                                slotType: SpellSlotType.NORMAL,
                                featId: null,
                            };
                            updateState({
                                type: CharacterDetailStateUpdateType.ADD_SPELL_PREPARATION,
                                payload: { spellPreparation: newPrep }
                            });
                        }
                    };

                    const handleUncast = () => {
                        if (prep) {
                            updateState({
                                type: CharacterDetailStateUpdateType.UNCAST_SPELL,
                                payload: { classId: selectedClass.classId, spellId: spellEntry.spell.id }
                            });
                        }
                    };

                    return (
                        <div className="flex items-center gap-1 w-20">
                            <span className={`text-sm ${timesCast === maxSlots && maxSlots > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                {timesCast}/{maxSlots}
                            </span>
                            <button
                                onClick={handleCast}
                                disabled={!canCast || isLoading}
                                className="px-1 py-0.5 text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded"
                            >
                                +
                            </button>
                            <button
                                onClick={handleUncast}
                                disabled={!canUncast || isLoading}
                                className="px-1 py-0.5 text-xs bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded"
                            >
                                −
                            </button>
                        </div>
                    );
                } else {
                    // Prepared casters: show timesCast / quantity
                    const quantity = prep?.quantity ?? 0;
                    const timesCast = prep?.timesCast ?? 0;
                    const canCast = quantity > 0 && timesCast < quantity;
                    const canUncast = quantity > 0 && timesCast > 0;
                    const isLoading = false; // No longer using mutations - state updates are synchronous

                    const handleCast = () => {
                        if (prep) {
                            updateState({
                                type: CharacterDetailStateUpdateType.CAST_SPELL,
                                payload: { classId: selectedClass.classId, spellId: spellEntry.spell.id }
                            });
                        }
                    };

                    const handleUncast = () => {
                        if (prep) {
                            updateState({
                                type: CharacterDetailStateUpdateType.UNCAST_SPELL,
                                payload: { classId: selectedClass.classId, spellId: spellEntry.spell.id }
                            });
                        }
                    };

                    return (
                        <div className="flex items-center gap-1 w-20">
                            {quantity === 0 ? (
                                <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                            ) : (
                                <>
                                    <span className={`text-sm ${timesCast === quantity ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                        {timesCast}/{quantity}
                                    </span>
                                    <button
                                        onClick={handleCast}
                                        disabled={!canCast || isLoading}
                                        className="px-1 py-0.5 text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded"
                                    >
                                        +
                                    </button>
                                    <button
                                        onClick={handleUncast}
                                        disabled={!canUncast || isLoading}
                                        className="px-1 py-0.5 text-xs bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded"
                                    >
                                        −
                                    </button>
                                </>
                            )}
                        </div>
                    );
                }
            }
        });

        // Description column
        baseColumns.push({
            accessorKey: 'description',
            header: 'Description',
            size: 300,
        });

        // Reference column
        baseColumns.push({
            accessorKey: 'reference',
            header: 'Ref',
            size: 100,
        });

        return baseColumns;
    }, [isSpellsKnown, selectedClass, preparationsMap, casterInfo, totalPreparedPerLevel, handlePrepIncrement, handlePrepDecrement, updateState]);

    // Define grouping fields - categoryGroup first (domainName for domain spells, null for regular), then level
    const groupingFields = useMemo(() => {
        return ['categoryGroup', 'level'];
    }, []);

    // Custom grouping config to format category labels and handle null categoryGroup
    const groupingConfig = useMemo(() => ({
        // Skip categoryGroup grouping for regular spells (categoryGroup is null)
        getEffectiveFields: (item: SpellEntry, _groupingFields: string[]): string[] => {
            if (item.categoryGroup) {
                // Domain spell: group by categoryGroup (domainName), then level
                return ['categoryGroup', 'level'];
            }
            // Regular spell: skip categoryGroup, only group by level
            return ['level'];
        },
        getEffectiveFieldForFormatting: (
            field: string,
            value: unknown,
            _item: SpellEntry | null,
            _groupingFields: string[],
            _fieldIndex: number
        ): string => {
            // If field is categoryGroup but value is a number, it means we're actually at the level field
            // (because regular spells skip categoryGroup and level becomes the first field)
            if (field === 'categoryGroup' && typeof value === 'number') {
                // This is actually a level value, format it as level
                const zeroLevelLabel = casterInfo?.isDivine ? 'Orisons' : 'Cantrips';
                const levelLabel = value === 0 ? zeroLevelLabel : `${ordinal(value)}-Level Spells`;
                return `-- ${levelLabel} --`;
            }
            if (field === 'categoryGroup' && typeof value === 'string' && value) {
                // This is actually a domain name
                return `-- ${value} Domain --`;
            }
            if (field === 'level' && typeof value === 'number') {
                const zeroLevelLabel = casterInfo?.isDivine ? 'Orisons' : 'Cantrips';
                const levelLabel = value === 0 ? zeroLevelLabel : `${ordinal(value)}-Level Spells`;
                return `-- ${levelLabel} --`;
            }
            return field;
        },
        sortGroupKeys: (
            entries: Array<[unknown, unknown]>,
            field: string,
            _groupingFields: string[],
            _fieldIndex: number
        ): Array<[unknown, unknown]> => {
            if (field === 'categoryGroup') {
                // Sort domain names alphabetically, nulls last
                return entries.sort(([a], [b]) => {
                    if (a === null || a === undefined) return 1;
                    if (b === null || b === undefined) return -1;
                    return String(a).localeCompare(String(b));
                });
            }
            if (field === 'level') {
                // Sort levels numerically
                return entries.sort(([a], [b]) => {
                    const aNum = typeof a === 'number' ? a : 0;
                    const bNum = typeof b === 'number' ? b : 0;
                    return aNum - bNum;
                });
            }
            return entries;
        }
    }), [casterInfo?.isDivine]);

    // Data fetcher for ScrollableCategorizedList
    const dataFetcher = useMemo(() => {
        return async () => {
            return {
                results: transformedSpells,
                total: transformedSpells.length
            };
        };
    }, [transformedSpells]);

    if (spellcastingClasses.length === 0) {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Spells</h2>
                <p className="text-gray-600 dark:text-gray-400">This character has no spellcasting classes.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Spells</h2>
                {spellcastingClasses.length > 1 && (
                    <select
                        value={selectedClassId ?? ''}
                        onChange={(e) => setSelectedClassId(parseInt(e.target.value))}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                        {spellcastingClasses.map(sc => (
                            <option key={sc.classId} value={sc.classId}>
                                {getClassNameFromCache(sc.classId) || sc.class.name} (Level {sc.level})
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {selectedClass && casterInfo && (
                <div className="grid grid-cols-[300px_1fr_300px] gap-6 mb-4 p-4 border border-gray-300 dark:border-gray-600 rounded-md">
                    <div className="space-y-3 pr-6 border-r border-gray-300 dark:border-gray-600">
                        <div className="flex items-center justify-between gap-2">
                            <div className="text-sm text-gray-600 dark:text-gray-400">Caster Level</div>
                            <div className="text-lg font-semibold">{casterInfo.casterLevel}</div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <div className="text-sm text-gray-600 dark:text-gray-400">Spell Save DC</div>
                            <div className="text-lg font-semibold">{casterInfo.baseSpellSaveDC} + spell level</div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <div className="text-sm text-gray-600 dark:text-gray-400">Casting Ability</div>
                            <div className="text-lg font-semibold">
                                {casterInfo.castingAbilityId !== null && casterInfo.castingAbilityId !== undefined ? (
                                    <>
                                        {ABILITY_MAP[casterInfo.castingAbilityId]?.abbreviation || 'ERROR'} ({casterInfo.abilityModifier >= 0 ? '+' : ''}{casterInfo.abilityModifier})
                                    </>
                                ) : (
                                    <span className="text-red-600 dark:text-red-400">ERROR: Casting ability not found</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center px-6 border-r border-gray-300 dark:border-gray-600">
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Spells Per Day</div>
                            <div className="grid grid-cols-[repeat(10,30px)] gap-0">
                                {/* Level labels row */}
                                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center border border-gray-300 dark:border-gray-600 py-1">0</div>
                                {Array.from({ length: 9 }, (_, i) => i + 1).map(level => (
                                    <div key={level} className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center border border-gray-300 dark:border-gray-600 py-1">
                                        {ordinal(level)}
                                    </div>
                                ))}
                                {/* Spells per day values row */}
                                {Array.from({ length: 10 }, (_, i) => i).map(level => {
                                    const slots = casterInfo.spellsPerDay.get(level);
                                    return (
                                        <div key={level} className="text-sm font-semibold text-center border border-gray-300 dark:border-gray-600 py-1">
                                            {slots !== undefined ? slots : '-'}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    {casterInfo.ranges && (
                        <div className="pl-6">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">Close</span>
                                        <span className="text-xs text-gray-600 dark:text-gray-400">(25 ft. + 5 ft. / 2 levels)</span>
                                    </div>
                                    <div className="text-lg font-semibold text-gray-900 dark:text-white">{casterInfo.ranges.close}</div>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">Medium</span>
                                        <span className="text-xs text-gray-600 dark:text-gray-400">(100 ft. + 10 ft. / level)</span>
                                    </div>
                                    <div className="text-lg font-semibold text-gray-900 dark:text-white">{casterInfo.ranges.medium}</div>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">Long</span>
                                        <span className="text-xs text-gray-600 dark:text-gray-400">(400 ft. + 40 ft. / level)</span>
                                    </div>
                                    <div className="text-lg font-semibold text-gray-900 dark:text-white">{casterInfo.ranges.long}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {isLoadingSpells ? (
                <div className="text-center py-8">
                    <div className="text-gray-600 dark:text-gray-400">Loading spells...</div>
                </div>
            ) : transformedSpells.length === 0 ? (
                <div className="text-center py-8">
                    <div className="text-gray-600 dark:text-gray-400">No spells available.</div>
                </div>
            ) : (
                <div className="h-[calc(100vh-420px)]">
                    <ScrollableCategorizedList
                        dataFetcher={dataFetcher}
                        groupingFields={groupingFields}
                        groupingConfig={groupingConfig}
                        columns={columns}
                        searchPlaceholder="Search spells by name..."
                        storageKey={`spells-tab-${characterId}-${selectedClassId}`}
                        itemDesc="spells"
                        maxHeight="auto"
                    />
                </div>
            )}
        </div>
    );
}
