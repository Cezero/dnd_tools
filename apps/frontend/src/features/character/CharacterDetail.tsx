import { Menu } from '@base-ui-components/react/menu';
import {
    UserIcon, ShieldCheckIcon, SparklesIcon, DocumentTextIcon, BriefcaseIcon, Bars3Icon, BoltIcon
} from '@heroicons/react/24/outline';
import { useQueryClient } from '@tanstack/react-query';
import isEqual from 'lodash/isEqual';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { useToast } from '@/components/toast/useToast';
import { CharacterDetailApi } from '@/features/character/CharacterDetailApi';
import { ClassQueryHooks } from '@/features/class/ClassQueryHooks';
import { ItemQueryHooks } from '@/features/item/ItemQueryHooks';
import { RaceQueryHooks } from '@/features/race/RaceQueryHooks';
import { extractRaceMechanics } from '@/lib/feature-extraction/raceMechanicsExtractor';
import { displayStrategyFactory } from '@/lib/formatters';
import type { DisplayContext } from '@/lib/formatters/types';
import { useCacheFunctions } from '@/services/cache/CacheFunctions';
import type { DnDClass, Race, ItemWithDetails, RaceCacheEntry } from '@shared/schema';
import { DisplayType } from '@shared/static-data';

import { generateCharacterPdf } from './characterPdfService';
import { CharacterQueryHooks } from './CharacterQueryHooks';
import { DescriptionTab } from './detail-tabs/DescriptionTab';
import { EquipmentTab } from './detail-tabs/EquipmentTab';
import { FeaturesTab } from './detail-tabs/FeaturesTab';
import { OverviewTab } from './detail-tabs/OverviewTab';
import { SkillsTab } from './detail-tabs/SkillsTab';
import { SpellsTab } from './detail-tabs/SpellsTab';
import type { TabConfig } from './types';
import { CharacterDetailStateUpdateType } from './types';
import { useCharacterDetailState } from './useCharacterDetailState';
import { useCharacterResolution } from './useCharacterResolution';

/**
 * Main character detail component with tab-based interface for viewing and editing character details.
 * 
 * **State Synchronization Pattern**:
 * 
 * This component implements the standardized state → useEffect → API + refreshState pattern for
 * synchronizing character detail state changes with the backend:
 * 
 * 1. **Tabs update state**: Tab components call `updateState()` to modify character detail state
 * 2. **CharacterDetail syncs automatically**: useEffect hooks watch state changes and automatically
 *    call backend APIs and `resolution.refreshState()` to sync changes
 * 3. **Backend handles diffing**: For array fields (items, spellPreparations), backend receives
 *    full arrays and determines what operations to perform (create/update/delete)
 * 4. **Resolution state updates**: Backend resolution session is updated, and resolved data
 *    flows back to tabs via `resolvedCharacter` prop
 * 
 * **Benefits of this pattern**:
 * - Centralized sync logic: All sync happens in CharacterDetail, easier to maintain
 * - Tabs are simpler: Tabs don't need to know about APIs or resolution
 * - Automatic sync: No risk of forgetting to sync - it's automatic
 * - React-idiomatic: Uses effects to react to state changes
 * - Consistent: All tabs work the same way
 * - Backend is source of truth: Backend handles diffing and determines operations
 * 
 * **useEffect Hooks**:
 * - Wounds: Watches `state.wounds` and calls `updateWounds()` API
 * - Money: Watches `state.money` and calls `updateMoney()` API
 * - Notes: Watches `state.notes` and calls `updateNotes()` API
 * - Items: Watches `state.items` array and calls `syncItems()` API (backend handles diffing)
 * - Spell preparations: Watches `state.spellPreparations` array and calls `syncSpellPreparations()` API (backend handles diffing)
 * 
 * **Why refs are used**: Refs track previous values to avoid syncing on initial mount and
 * to detect actual changes vs. initial state loading.
 * 
 * @see useCharacterDetailState - For state management hook
 * @see useCharacterResolution - For resolution session management
 */
export function CharacterDetail(): React.JSX.Element {
    const { user, isLoading: isAuthLoading } = useAuthAuto();
    const queryClient = useQueryClient();
    const { id } = useParams<{ id: string }>();
    const toastManager = useToast();
    const [activeTab, setActiveTab] = useState<string>('overview');
    const [isExporting, setIsExporting] = useState(false);

    const characterId = id ? parseInt(id) : null;

    // Load character data
    const { data: characterData, isLoading: isLoadingCharacter } = CharacterQueryHooks.useGetCharacterWithAllDetails(
        characterId ? { pathParams: { id: characterId } } : undefined,
        { enabled: !!characterId }
    );

    // Use character resolution
    const resolution = useCharacterResolution(characterId);

    // Use centralized state management
    const { state, updateState } = useCharacterDetailState();

    // Load items
    const { data: itemsData } = ItemQueryHooks.useGetItems(undefined, { enabled: !!characterData });
    const items: ItemWithDetails[] = itemsData?.results || [];

    // Initialize state from character data when it loads
    useEffect(() => {
        if (!characterData || !characterId) return;

        updateState({
            type: CharacterDetailStateUpdateType.SET_CHARACTER_ID,
            payload: { characterId }
        });

        // Initialize wounds (default to 0 if not in character data)
        const wounds = (characterData as { wounds?: number }).wounds || 0;
        updateState({
            type: CharacterDetailStateUpdateType.SET_WOUNDS,
            payload: { wounds }
        });

        // Initialize money
        updateState({
            type: CharacterDetailStateUpdateType.SET_MONEY,
            payload: {
                money: {
                    platinum: characterData.platinum || 0,
                    gold: characterData.gold || 0,
                    silver: characterData.silver || 0,
                    copper: characterData.copper || 0,
                }
            }
        });

        // Initialize items
        if (characterData.characterItems) {
            const items = characterData.characterItems.map(item => ({
                id: item.id,
                baseItemId: item.baseItemId,
                quantity: item.quantity ?? 1,
                location: item.location,
                name: item.name,
            }));
            updateState({
                type: CharacterDetailStateUpdateType.SET_ITEMS,
                payload: { items }
            });
        }

        // Initialize notes
        updateState({
            type: CharacterDetailStateUpdateType.SET_NOTES,
            payload: { notes: characterData.notes }
        });

        // Initialize spell preparations
        if (characterData.preparedSpells) {
            const spellPreparations = characterData.preparedSpells.map(prep => ({
                id: prep.id,
                classId: prep.classId,
                spellId: prep.spellId,
                spellLevel: prep.spellLevel,
                quantity: prep.quantity,
                timesCast: prep.timesCast,
                slotType: prep.slotType,
                featId: prep.featId,
            }));
            updateState({
                type: CharacterDetailStateUpdateType.SET_SPELL_PREPARATIONS,
                payload: { spellPreparations }
            });
        }
    }, [characterData, characterId, updateState]);

    // Track previous values to avoid unnecessary updates and infinite loops
    const prevWoundsRef = useRef<number | null>(null);
    const prevMoneyRef = useRef<{ platinum: number; gold: number; silver: number; copper: number } | null>(null);
    const prevNotesRef = useRef<string | null>(null);
    const prevItemsRef = useRef<typeof state.items | null>(null);
    const prevSpellPreparationsRef = useRef<typeof state.spellPreparations | null>(null);

    /**
     * Sync wounds changes to backend.
     * 
     * Automatically syncs wounds changes to the backend and refreshes resolution state.
     * Watches `state.wounds` for changes.
     * 
     * @see CharacterDetail component JSDoc for overall sync pattern documentation
     */
    useEffect(() => {
        if (!characterId || !resolution.resolvedCharacter) {
            return;
        }

        if (prevWoundsRef.current === null) {
            prevWoundsRef.current = state.wounds;
            return;
        }

        if (state.wounds !== prevWoundsRef.current) {
            CharacterDetailApi.updateWounds({ wounds: state.wounds }, { id: characterId })
                .then(() => {
                    queryClient.invalidateQueries({
                        queryKey: CharacterQueryHooks.getCharacterWithAllDetailsQueryKey(characterId),
                    });
                    if (resolution.resolvedCharacter) {
                        return resolution.refreshState();
                    }
                })
                .catch(error => {
                    console.error('Failed to sync wounds to backend:', error);
                });
            prevWoundsRef.current = state.wounds;
        }
    }, [characterId, state.wounds, resolution.resolvedCharacter, resolution.refreshState, queryClient]);

    /**
     * Sync money changes to backend.
     * 
     * Automatically syncs money changes to the backend and refreshes resolution state.
     * Watches `state.money` for changes.
     * 
     * @see CharacterDetail component JSDoc for overall sync pattern documentation
     */
    useEffect(() => {
        if (!characterId || !resolution.resolvedCharacter) {
            return;
        }

        if (prevMoneyRef.current === null) {
            prevMoneyRef.current = state.money;
            return;
        }

        if (!isEqual(state.money, prevMoneyRef.current)) {
            CharacterDetailApi.updateMoney(state.money, { id: characterId })
                .then(() => {
                    queryClient.invalidateQueries({
                        queryKey: CharacterQueryHooks.getCharacterWithAllDetailsQueryKey(characterId),
                    });
                    if (resolution.resolvedCharacter) {
                        return resolution.refreshState();
                    }
                })
                .catch(error => {
                    console.error('Failed to sync money to backend:', error);
                });
            prevMoneyRef.current = state.money;
        }
    }, [characterId, state.money, resolution.resolvedCharacter, resolution.refreshState, queryClient]);

    /**
     * Sync notes changes to backend.
     * 
     * Automatically syncs notes changes to the backend and refreshes resolution state.
     * Watches `state.notes` for changes.
     * 
     * @see CharacterDetail component JSDoc for overall sync pattern documentation
     */
    useEffect(() => {
        if (!characterId || !resolution.resolvedCharacter) {
            return;
        }

        if (prevNotesRef.current === null) {
            prevNotesRef.current = state.notes;
            return;
        }

        if (state.notes !== prevNotesRef.current) {
            CharacterDetailApi.updateNotes({ notes: state.notes }, { id: characterId })
                .then(() => {
                    queryClient.invalidateQueries({
                        queryKey: CharacterQueryHooks.getCharacterWithAllDetailsQueryKey(characterId),
                    });
                    if (resolution.resolvedCharacter) {
                        return resolution.refreshState();
                    }
                })
                .catch(error => {
                    console.error('Failed to sync notes to backend:', error);
                });
            prevNotesRef.current = state.notes;
        }
    }, [characterId, state.notes, resolution.resolvedCharacter, resolution.refreshState, queryClient]);

    /**
     * Sync items changes to backend.
     * 
     * Automatically syncs items array changes to the backend and refreshes resolution state.
     * Watches `state.items` for changes. Sends full array to backend sync endpoint.
     * 
     * @see CharacterDetail component JSDoc for overall sync pattern documentation
     */
    useEffect(() => {
        if (!characterId || !resolution.resolvedCharacter) {
            return;
        }

        if (prevItemsRef.current === null) {
            prevItemsRef.current = state.items;
            return;
        }

        if (!isEqual(state.items, prevItemsRef.current)) {
            CharacterDetailApi.syncItems({ items: state.items }, { id: characterId })
                .then(() => {
                    queryClient.invalidateQueries({
                        queryKey: CharacterQueryHooks.getCharacterWithAllDetailsQueryKey(characterId),
                    });
                    if (resolution.resolvedCharacter) {
                        return resolution.refreshState();
                    }
                })
                .catch(error => {
                    console.error('Failed to sync items to backend:', error);
                });
            prevItemsRef.current = state.items;
        }
    }, [characterId, state.items, resolution.resolvedCharacter, resolution.refreshState, queryClient]);

    /**
     * Sync spell preparations changes to backend.
     * 
     * Automatically syncs spell preparations array changes to the backend and refreshes resolution state.
     * Watches `state.spellPreparations` for changes. Sends full array to backend sync endpoint.
     * 
     * @see CharacterDetail component JSDoc for overall sync pattern documentation
     */
    useEffect(() => {
        if (!characterId || !resolution.resolvedCharacter) {
            return;
        }

        if (prevSpellPreparationsRef.current === null) {
            prevSpellPreparationsRef.current = state.spellPreparations;
            return;
        }

        if (!isEqual(state.spellPreparations, prevSpellPreparationsRef.current)) {
            CharacterDetailApi.syncSpellPreparations({ spellPreparations: state.spellPreparations }, { id: characterId })
                .then(() => {
                    queryClient.invalidateQueries({
                        queryKey: CharacterQueryHooks.getCharacterWithAllDetailsQueryKey(characterId),
                    });
                    if (resolution.resolvedCharacter) {
                        return resolution.refreshState();
                    }
                })
                .catch(error => {
                    console.error('Failed to sync spell preparations to backend:', error);
                });
            prevSpellPreparationsRef.current = state.spellPreparations;
        }
    }, [characterId, state.spellPreparations, resolution.resolvedCharacter, resolution.refreshState, queryClient]);

    // Get race data from cache (for sizeId)
    const cacheFunctions = useCacheFunctions();
    const raceCacheEntry: RaceCacheEntry | undefined = characterData?.raceId
        ? cacheFunctions.getRaceSummaryById(characterData.raceId)
        : undefined;

    // Build classDetailsMap from character's advancements - load classes using imperative API
    const [classDetailsMap, setClassDetailsMap] = useState<Map<number, DnDClass>>(new Map());

    useEffect(() => {
        if (!characterData?.advancements) {
            setClassDetailsMap(new Map());
            return;
        }

        const loadClasses = async () => {
            const classIds = new Set<number>();
            characterData.advancements.forEach(adv => {
                classIds.add(adv.classId);
                if (adv.secondaryClassId) {
                    classIds.add(adv.secondaryClassId);
                }
            });

            const classPromises = Array.from(classIds).map(classId =>
                ClassQueryHooks.getClassById(classId).catch(() => null)
            );
            const classResults = await Promise.all(classPromises);

            const newMap = new Map<number, DnDClass>();
            Array.from(classIds).forEach((classId, index) => {
                const classData = classResults[index];
                if (classData) {
                    newMap.set(classId, classData);
                }
            });

            setClassDetailsMap(newMap);
        };

        loadClasses();
    }, [characterData?.advancements]);

    // Build DisplayContext
    const displayContext: DisplayContext | undefined = useMemo(() => {
        if (!characterData || !resolution.resolvedCharacter) return undefined;

        const characterContext = {
            abilityScores: Object.fromEntries(
                characterData.abilityScores.map(a => [a.abilityId, a.value])
            ),
            classLevels: Object.fromEntries(
                Array.from(classDetailsMap.keys()).map(classId => {
                    const level = characterData.advancements.filter(a =>
                        a.classId === classId || a.secondaryClassId === classId
                    ).length;
                    return [classId, level];
                })
            ),
            raceId: characterData.raceId ?? undefined,
            sizeId: (() => {
                // Extract sizeId from resolved features
                if (characterData.raceId && resolution.resolvedCharacter?.resolvedProgressions) {
                    const raceMechanics = extractRaceMechanics(resolution.resolvedCharacter.resolvedProgressions, characterData.raceId);
                    return raceMechanics.sizeId ?? undefined;
                }
                return undefined;
            })()
        };

        return {
            character: characterContext,
            classSkills: resolution.resolvedCharacter.classSkills.map(skill => ({
                skillId: skill.skillId,
                skillSubId: skill.skillSubId ?? null
            })),
            skillBonuses: resolution.resolvedCharacter.skillBonuses.map(bonus => ({
                skillId: bonus.skillId,
                skillSubId: bonus.skillSubId ?? null,
                bonus: bonus.bonus,
                source: bonus.source
            })),
        };
    }, [characterData, resolution.resolvedCharacter, classDetailsMap, raceCacheEntry]);

    // Format character using display strategy
    const formattedCharacter = useMemo(() => {
        if (!characterData || !resolution.resolvedCharacter || items.length === 0 || classDetailsMap.size === 0) {
            return null;
        }

        const strategy = displayStrategyFactory.createStrategy(DisplayType.CharacterSheet);
        return strategy.formatCharacter(
            characterData,
            resolution.resolvedCharacter.resolvedProgressions,
            items,
            characterData.characterItems || [],
            classDetailsMap,
            displayContext,
            null // Race is optional - sizeId is already in characterContext
        );
    }, [characterData, resolution.resolvedCharacter, items, classDetailsMap, displayContext]);

    // Check if character has spellcasting classes
    const hasSpellcastingClasses = useMemo(() => {
        if (!characterData?.advancements || classDetailsMap.size === 0) return false;

        // Check if any of the character's classes can cast spells
        for (const advancement of characterData.advancements) {
            const primaryClass = classDetailsMap.get(advancement.classId);
            if (primaryClass?.canCastSpells) {
                return true;
            }

            if (advancement.secondaryClassId) {
                const secondaryClass = classDetailsMap.get(advancement.secondaryClassId);
                if (secondaryClass?.canCastSpells) {
                    return true;
                }
            }
        }

        return false;
    }, [characterData?.advancements, classDetailsMap]);

    // Handle reset daily uses
    const handleResetDailyUses = async () => {
        if (!characterId) return;
        try {
            // Reset spell cast status in state (will be synced by useEffect)
            const resetSpellPreparations = state.spellPreparations.map(prep => ({
                ...prep,
                timesCast: 0,
            }));
            updateState({
                type: CharacterDetailStateUpdateType.SET_SPELL_PREPARATIONS,
                payload: { spellPreparations: resetSpellPreparations }
            });

            // Reset feature uses (not tracked in state, so call API directly)
            await CharacterDetailApi.resetDailyUses({ id: characterId });

            toastManager?.add({
                title: 'Daily uses reset successfully',
                type: 'success',
            });
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({
                queryKey: CharacterQueryHooks.getCharacterWithAllDetailsQueryKey(characterId),
            });
        } catch (error) {
            toastManager?.add({
                title: error instanceof Error ? error.message : 'Failed to reset daily uses',
                type: 'error',
            });
        }
    };

    // Handle reset all uses
    const handleResetAllUses = async () => {
        if (!characterId) return;
        try {
            await CharacterDetailApi.resetAllUses({ id: characterId });
            toastManager?.add({
                title: 'All uses reset successfully',
                type: 'success',
            });
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({
                queryKey: CharacterQueryHooks.getCharacterWithAllDetailsQueryKey(characterId),
            });
        } catch (error) {
            toastManager?.add({
                title: error instanceof Error ? error.message : 'Failed to reset all uses',
                type: 'error',
            });
        }
    };

    // Export handler
    const handleExport = async (): Promise<void> => {
        if (!characterId || !characterData) {
            toastManager?.add({
                title: 'Export Failed',
                description: 'Character data not available',
                type: 'error',
            });
            return;
        }

        try {
            setIsExporting(true);

            // Get race data - fetch full Race object
            let raceData: Race | null = null;
            if (characterData.raceId) {
                try {
                    raceData = await queryClient.fetchQuery({
                        queryKey: RaceQueryHooks.getRaceByIdQueryKey(characterData.raceId),
                        queryFn: () => RaceQueryHooks.getRaceById(characterData.raceId),
                        staleTime: 5 * 60 * 1000, // 5 minutes
                        gcTime: 10 * 60 * 1000, // 10 minutes
                    });
                } catch (error) {
                    console.warn('Failed to fetch race data for export:', error);
                    raceData = null;
                }
            }

            // Generate PDF using existing data
            await generateCharacterPdf(
                characterData,
                classDetailsMap,
                resolution.resolvedCharacter?.resolvedProgressions || [],
                queryClient,
                raceData,
                resolution.resolvedCharacter?.classSkills.map(skill => ({ skillId: skill.skillId, skillSubId: skill.skillSubId ?? null })) || [],
                resolution.resolvedCharacter?.skillBonuses.map(bonus => ({ skillId: bonus.skillId, skillSubId: bonus.skillSubId ?? null, bonus: bonus.bonus, source: bonus.source })) || []
            );

            toastManager?.add({
                title: 'Export Successful',
                description: 'Character sheet PDF has been downloaded',
                type: 'success',
            });
        } catch (error) {
            console.error('Failed to export character:', error);
            let errorMessage = 'Failed to export character';
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }

            toastManager?.add({
                title: 'Export Failed',
                description: errorMessage,
                type: 'error',
            });
        } finally {
            setIsExporting(false);
        }
    };

    const tabs: TabConfig[] = useMemo(() => {
        const baseTabs: TabConfig[] = [
            { id: 'overview', label: 'Overview', icon: UserIcon, component: OverviewTab },
            { id: 'skills', label: 'Skills', icon: ShieldCheckIcon, component: SkillsTab },
            { id: 'features', label: 'Features & Feats', icon: SparklesIcon, component: FeaturesTab },
            { id: 'equipment', label: 'Equipment', icon: BriefcaseIcon, component: EquipmentTab },
            { id: 'description', label: 'Notes', icon: DocumentTextIcon, component: DescriptionTab },
        ];

        // Add Spells tab if character has spellcasting classes
        if (hasSpellcastingClasses) {
            baseTabs.splice(2, 0, { id: 'spells', label: 'Spells', icon: BoltIcon, component: SpellsTab });
        }

        return baseTabs;
    }, [hasSpellcastingClasses]);

    const currentTab = tabs.find(tab => tab.id === activeTab);
    const CurrentTabComponent = currentTab?.component;

    if (!user || isAuthLoading || isLoadingCharacter || !characterData || !formattedCharacter || classDetailsMap.size === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Loading...
                    </h1>
                </div>
            </div>
        );
    }

    // Create tab props
    const tabProps = {
        character: characterData,
        formattedCharacter,
        resolvedProgressions: resolution.resolvedCharacter?.resolvedProgressions || [],
        characterId: characterId!,
        classDetailsMap,
        items,
        state,
        updateState,
        resolution,
    };

    return (
        <div className="max-w-7xl mx-auto py-6">
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {characterData.name}
                        </h1>
                        <Menu.Root>
                            <Menu.Trigger className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                <Bars3Icon className="h-5 w-5" />
                            </Menu.Trigger>
                            <Menu.Portal>
                                <Menu.Positioner className="outline-none" sideOffset={8}>
                                    <Menu.Popup className="min-w-[160px] origin-[var(--transform-origin)] rounded-md bg-white dark:bg-gray-800 py-1 text-gray-900 dark:text-gray-100 shadow-lg shadow-gray-200 dark:shadow-gray-900 outline outline-1 outline-gray-200 dark:outline-gray-700 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0">
                                        <Menu.Item
                                            onClick={handleResetDailyUses}
                                            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none"
                                        >
                                            Reset Daily Uses
                                        </Menu.Item>
                                        <Menu.Item
                                            onClick={handleResetAllUses}
                                            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none"
                                        >
                                            Reset All Uses
                                        </Menu.Item>
                                        <Menu.Item
                                            onClick={() => handleExport()}
                                            disabled={isExporting || isLoadingCharacter || !characterId}
                                            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none"
                                            title={!characterId ? 'Character not available' : 'Export character sheet as PDF'}
                                        >
                                            {isExporting ? 'Exporting...' : 'Export Character Sheet'}
                                        </Menu.Item>
                                    </Menu.Popup>
                                </Menu.Positioner>
                            </Menu.Portal>
                        </Menu.Root>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8 px-6">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                        }`}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="bg-white dark:bg-gray-800 p-6">
                    {CurrentTabComponent && (
                        React.createElement(CurrentTabComponent as React.ComponentType<Record<string, unknown>>, tabProps)
                    )}
                </div>
            </div>
        </div>
    );
}
