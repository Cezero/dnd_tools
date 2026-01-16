import { useState, useCallback } from 'react';

import type { CharacterDetailState, CharacterDetailStateUpdate } from './types';
import { CharacterDetailStateUpdateType } from './types';

/**
 * Custom hook for managing centralized character detail state.
 * 
 * Provides a single source of truth for all character detail data and eliminates
 * the need for per-tab state management. Follows the same pattern as
 * useCharacterEditState.
 * 
 * **State Synchronization Pattern**:
 * - Tabs update state via `updateState()`
 * - CharacterDetail component uses useEffect hooks to watch state changes
 * - useEffect hooks call backend APIs and refresh resolution state
 * - All sync logic is centralized in CharacterDetail component
 * 
 * @param initialState - Optional initial state values
 * @returns Object with `state` and `updateState` function
 * 
 * @see useCharacterEditState - Similar hook for character editing
 * @see CharacterDetail - Component that uses this hook
 */
export function useCharacterDetailState(initialState?: Partial<CharacterDetailState>) {
    const [state, setState] = useState<CharacterDetailState>({
        characterId: null,

        // OverviewTab state
        wounds: 0,

        // EquipmentTab state
        money: {
            platinum: 0,
            gold: 0,
            silver: 0,
            copper: 0,
        },
        items: [],

        // DescriptionTab state
        notes: null,

        // SpellsTab state
        spellPreparations: [],

        // Apply any initial state overrides
        ...initialState
    });

    const updateState = useCallback((update: CharacterDetailStateUpdate) => {
        setState(prev => {
            switch (update.type) {
                case CharacterDetailStateUpdateType.SET_CHARACTER_ID:
                    return { ...prev, characterId: update.payload.characterId ?? null };
                case CharacterDetailStateUpdateType.SET_WOUNDS:
                    return { ...prev, wounds: update.payload.wounds ?? 0 };
                case CharacterDetailStateUpdateType.SET_MONEY:
                    return {
                        ...prev,
                        money: {
                            platinum: update.payload.money?.platinum ?? prev.money.platinum,
                            gold: update.payload.money?.gold ?? prev.money.gold,
                            silver: update.payload.money?.silver ?? prev.money.silver,
                            copper: update.payload.money?.copper ?? prev.money.copper,
                        }
                    };
                case CharacterDetailStateUpdateType.SET_ITEMS:
                    return { ...prev, items: update.payload.items ?? [] };
                case CharacterDetailStateUpdateType.ADD_ITEM:
                    if (update.payload.item) {
                        return { ...prev, items: [...prev.items, update.payload.item] };
                    }
                    return prev;
                case CharacterDetailStateUpdateType.REMOVE_ITEM:
                    if (update.payload.id !== undefined) {
                        return { ...prev, items: prev.items.filter(item => item.id !== update.payload.id) };
                    }
                    return prev;
                case CharacterDetailStateUpdateType.UPDATE_ITEM:
                    if (update.payload.item) {
                        return {
                            ...prev,
                            items: prev.items.map(item =>
                                item.id === update.payload.item!.id ? update.payload.item! : item
                            )
                        };
                    }
                    return prev;
                case CharacterDetailStateUpdateType.SET_NOTES:
                    return { ...prev, notes: update.payload.notes ?? null };
                case CharacterDetailStateUpdateType.SET_SPELL_PREPARATIONS:
                    return { ...prev, spellPreparations: update.payload.spellPreparations ?? [] };
                case CharacterDetailStateUpdateType.ADD_SPELL_PREPARATION:
                    if (update.payload.spellPreparation) {
                        return { ...prev, spellPreparations: [...prev.spellPreparations, update.payload.spellPreparation] };
                    }
                    return prev;
                case CharacterDetailStateUpdateType.UPDATE_SPELL_PREPARATION:
                    if (update.payload.spellPreparation) {
                        const prep = update.payload.spellPreparation;
                        // Find by id if present, otherwise by composite key
                        return {
                            ...prev,
                            spellPreparations: prev.spellPreparations.map(existing => {
                                if (prep.id && existing.id === prep.id) {
                                    return prep;
                                }
                                if (!prep.id && !existing.id) {
                                    // Both are new - match by composite key
                                    if (
                                        existing.classId === prep.classId &&
                                        existing.spellId === prep.spellId &&
                                        existing.spellLevel === prep.spellLevel
                                    ) {
                                        return prep;
                                    }
                                }
                                return existing;
                            })
                        };
                    }
                    return prev;
                case CharacterDetailStateUpdateType.REMOVE_SPELL_PREPARATION:
                    if (update.payload.spellPreparationId !== undefined) {
                        return {
                            ...prev,
                            spellPreparations: prev.spellPreparations.filter(
                                prep => prep.id !== update.payload.spellPreparationId
                            )
                        };
                    }
                    return prev;
                case CharacterDetailStateUpdateType.CAST_SPELL:
                    if (update.payload.classId !== undefined && update.payload.spellId !== undefined) {
                        return {
                            ...prev,
                            spellPreparations: prev.spellPreparations.map(prep => {
                                if (
                                    prep.classId === update.payload.classId &&
                                    prep.spellId === update.payload.spellId
                                ) {
                                    return { ...prep, timesCast: (prep.timesCast ?? 0) + 1 };
                                }
                                return prep;
                            })
                        };
                    }
                    return prev;
                case CharacterDetailStateUpdateType.UNCAST_SPELL:
                    if (update.payload.classId !== undefined && update.payload.spellId !== undefined) {
                        return {
                            ...prev,
                            spellPreparations: prev.spellPreparations.map(prep => {
                                if (
                                    prep.classId === update.payload.classId &&
                                    prep.spellId === update.payload.spellId &&
                                    (prep.timesCast ?? 0) > 0
                                ) {
                                    return { ...prep, timesCast: (prep.timesCast ?? 0) - 1 };
                                }
                                return prep;
                            })
                        };
                    }
                    return prev;
                default:
                    return prev;
            }
        });
    }, []);

    return { state, updateState };
}
