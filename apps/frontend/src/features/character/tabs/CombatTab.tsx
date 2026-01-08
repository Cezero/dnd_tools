import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState, useCallback, useEffect } from 'react';

import { useToast } from '@/components/toast/useToast';
import { CharacterApi } from '@/features/character';
import { TabComponentProps, CharacterEditStateUpdateType, AttackDefinition } from '@/features/character/types';
import { ItemQueryHooks } from '@/services/query/ItemQueryHooks';
import type { CharacterWithAllDetailsResponse, ItemWithDetails } from '@shared/schema';

import { AttackDefinitionModal } from '../components/AttackDefinitionModal';

interface CalculatedAttackDisplay {
    attackDefinition: AttackDefinition;
    weaponName: string;
    totalAttackBonus: number | string; // Can be number or "X / Y nonlethal" string
    damage: string;
    critical: string;
    range: string | null;
    weight: string | null;
    type: string;
    size: string | null;
    specialProperties: string | null;
    uniqueKey: string; // Unique identifier for React keys
}

function SortableAttackRow({
    attack: attackDisplay,
    onEdit,
    onDelete,
}: {
    attack: CalculatedAttackDisplay;
    onEdit: () => void;
    onDelete: () => void;
}): React.JSX.Element {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: attackDisplay.uniqueKey });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-10 gap-4 py-3 px-4 items-center">
                <div className="col-span-2 flex items-center gap-2">
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                        </svg>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{attackDisplay.weaponName}</span>
                </div>
                <div className="col-span-1 text-sm text-gray-700 dark:text-gray-300">
                    {typeof attackDisplay.totalAttackBonus === 'string'
                        ? attackDisplay.totalAttackBonus
                        : `${attackDisplay.totalAttackBonus >= 0 ? '+' : ''}${attackDisplay.totalAttackBonus}`}
                </div>
                <div className="col-span-1 text-sm text-gray-700 dark:text-gray-300">{attackDisplay.damage}</div>
                <div className="col-span-1 text-sm text-gray-700 dark:text-gray-300">{attackDisplay.critical}</div>
                <div className="col-span-1 text-sm text-gray-700 dark:text-gray-300">{attackDisplay.range || '-'}</div>
                <div className="col-span-1 text-sm text-gray-700 dark:text-gray-300">{attackDisplay.weight || '-'}</div>
                <div className="col-span-1 text-sm text-gray-700 dark:text-gray-300">{attackDisplay.type}</div>
                <div className="col-span-1 text-sm text-gray-700 dark:text-gray-300">{attackDisplay.size || '-'}</div>
                <div className="col-span-1 flex gap-2 justify-end">
                    <button
                        onClick={onEdit}
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title="Edit"
                    >
                        <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        title="Delete"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export function CombatTab({
    state,
    updateState,
    resolvedData: _resolvedData,
    formattedCharacter,
    character: characterData,
    refetchCharacter,
}: TabComponentProps): React.JSX.Element {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDefinition, setEditingDefinition] = useState<AttackDefinition | null>(null);
    const toast = useToast();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const [items, setItems] = React.useState<ItemWithDetails[]>([]);

    // Fetch items for weapons - use TanStack Query cache
    const queryClient = useQueryClient();
    useEffect(() => {
        queryClient.fetchQuery({
            queryKey: ItemQueryHooks.getItemsQueryKey(),
            queryFn: () => ItemQueryHooks.getItemsQueryFn(),
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
        })
            .then(result => {
                if (result?.results) {
                    setItems(result.results);
                }
            })
            .catch(console.error);
    }, [queryClient]);


    // Map formatted attacks to attack definitions
    // Process all definitions together to avoid cross-matching attacks
    const processAllAttackDefinitions = useCallback((): Map<number, CalculatedAttackDisplay[]> => {
        const result = new Map<number, CalculatedAttackDisplay[]>();

        if (!formattedCharacter || !formattedCharacter.attacks || formattedCharacter.attacks.length === 0) {
            return result;
        }

        const characterItems = characterData?.characterItems || [];
        const matchedAttackIndices = new Set<number>();

        // Process definitions in the order they appear in state (which should match formattedCharacter order)
        for (const definition of state.attackDefinitions) {
            if (definition.attackSlot === null) continue;

            const matchingAttacks: CalculatedAttackDisplay[] = [];

            // Get the expected items for this definition
            const mainHandCharItem = definition.mainHandCharacterItemId
                ? characterItems.find(ci => ci.id === definition.mainHandCharacterItemId)
                : null;
            const offHandCharItem = definition.offHandCharacterItemId
                ? characterItems.find(ci => ci.id === definition.offHandCharacterItemId)
                : null;

            const mainHandItem = mainHandCharItem
                ? items.find(i => i.id === mainHandCharItem.baseItemId)
                : null;
            const offHandItem = offHandCharItem
                ? items.find(i => i.id === offHandCharItem.baseItemId)
                : null;

            // For dual-wield, we expect exactly 2 attacks (mainhand and offhand)
            // For single weapon, we expect 1 attack
            const expectedCount = definition.offHandCharacterItemId ? 2 : 1;

            // Match attacks in order, only using unmatched attacks
            for (let attackIndex = 0; attackIndex < formattedCharacter.attacks.length; attackIndex++) {
                if (matchedAttackIndices.has(attackIndex)) continue;
                if (matchingAttacks.length >= expectedCount) break;

                const formattedAttack = formattedCharacter.attacks[attackIndex];

                // Strip labeler suffixes from weapon name for matching (e.g., "Longsword (main-hand)" -> "Longsword")
                const baseWeaponName = formattedAttack.weaponName.replace(/\s*\(main-hand\)$/, '')
                    .replace(/\s*\(off-hand\)$/, '')
                    .replace(/\s*\(both hands\)$/, '');

                // Check if this attack matches the mainhand item
                const mainHandName = mainHandCharItem?.name || mainHandItem?.name;
                const matchesMainHand = mainHandItem && baseWeaponName === mainHandName;

                // Check if this attack matches the offhand item
                const offHandName = offHandCharItem?.name || offHandItem?.name;
                const matchesOffHand = offHandItem && baseWeaponName === offHandName;

                // For single weapon attacks, match mainhand only
                if (!definition.offHandCharacterItemId && matchesMainHand) {
                    matchedAttackIndices.add(attackIndex);
                    matchingAttacks.push({
                        attackDefinition: definition,
                        weaponName: formattedAttack.weaponName,
                        totalAttackBonus: formattedAttack.attackBonus,
                        damage: formattedAttack.damage,
                        critical: formattedAttack.critical,
                        range: formattedAttack.range,
                        weight: formattedAttack.weight,
                        type: formattedAttack.type ?? '',
                        size: formattedAttack.size,
                        specialProperties: null,
                        uniqueKey: `${definition.id}-${formattedAttack.weaponName}`,
                    });
                }
                // For dual-wield, match mainhand first, then offhand
                else if (definition.offHandCharacterItemId) {
                    if (matchingAttacks.length === 0 && matchesMainHand) {
                        // First attack should be mainhand
                        matchedAttackIndices.add(attackIndex);
                        matchingAttacks.push({
                            attackDefinition: definition,
                            weaponName: formattedAttack.weaponName,
                            totalAttackBonus: formattedAttack.attackBonus,
                            damage: formattedAttack.damage,
                            critical: formattedAttack.critical,
                            range: formattedAttack.range,
                            weight: formattedAttack.weight,
                            type: formattedAttack.type ?? '',
                            size: formattedAttack.size,
                            specialProperties: null,
                            uniqueKey: `${definition.id}-mainhand-${formattedAttack.weaponName}`,
                        });
                    } else if (matchingAttacks.length === 1 && matchesOffHand) {
                        // Second attack should be offhand
                        matchedAttackIndices.add(attackIndex);
                        matchingAttacks.push({
                            attackDefinition: definition,
                            weaponName: formattedAttack.weaponName,
                            totalAttackBonus: formattedAttack.attackBonus,
                            damage: formattedAttack.damage,
                            critical: formattedAttack.critical,
                            range: formattedAttack.range,
                            weight: formattedAttack.weight,
                            type: formattedAttack.type ?? '',
                            size: formattedAttack.size,
                            specialProperties: null,
                            uniqueKey: `${definition.id}-offhand-${formattedAttack.weaponName}`,
                        });
                    }
                }
            }

            if (matchingAttacks.length > 0) {
                result.set(definition.id, matchingAttacks);
            }
        }

        return result;
    }, [formattedCharacter, characterData, items, state.attackDefinitions]);

    // Calculate attack displays - separate assigned and unassigned
    const { assignedAttacks, unassignedAttacks } = useMemo(() => {
        if (!formattedCharacter || !formattedCharacter.attacks) {
            return { assignedAttacks: [], unassignedAttacks: [] };
        }

        // Process all definitions together to avoid cross-matching
        const definitionAttacksMap = processAllAttackDefinitions();

        const assigned: CalculatedAttackDisplay[] = [];
        const unassigned: CalculatedAttackDisplay[] = [];

        // Separate definitions by whether they have a slot
        const definitionsWithSlots = state.attackDefinitions.filter(def => def.attackSlot !== null);
        const definitionsWithoutSlots = state.attackDefinitions.filter(def => def.attackSlot === null);

        // Sort assigned definitions by attack slot
        definitionsWithSlots.sort((a, b) => {
            if (a.attackSlot === null) return 1;
            if (b.attackSlot === null) return -1;
            return a.attackSlot - b.attackSlot;
        });

        // Process assigned attacks
        for (const definition of definitionsWithSlots) {
            const attacks = definitionAttacksMap.get(definition.id) || [];
            if (attacks.length > 0) {
                assigned.push(...attacks);
            }
        }

        // Process unassigned attacks
        for (const definition of definitionsWithoutSlots) {
            const attacks = definitionAttacksMap.get(definition.id) || [];
            if (attacks.length > 0) {
                unassigned.push(...attacks);
            }
        }

        return { assignedAttacks: assigned, unassignedAttacks: unassigned };
    }, [state.attackDefinitions, formattedCharacter, processAllAttackDefinitions]);

    // For backward compatibility, keep calculatedAttacks as assigned attacks only (for drag-and-drop)
    const calculatedAttacks = assignedAttacks;

    const handleAddAttack = () => {
        setEditingDefinition(null);
        setIsModalOpen(true);
    };

    const handleEditAttack = (definition: AttackDefinition) => {
        setEditingDefinition(definition);
        setIsModalOpen(true);
    };

    const handleDeleteAttack = useCallback(async (definition: AttackDefinition) => {
        if (!state.characterId || !confirm('Are you sure you want to delete this attack definition?')) {
            return;
        }

        if (!state.characterId) {
            return;
        }

        try {
            await CharacterApi.deleteCharacterAttackDefinition(undefined, {
                id: state.characterId,
                attackId: definition.id,
            });

            // Refetch character data to get updated attack definitions
            if (refetchCharacter) {
                await refetchCharacter();
            } else {
                // Fallback: Update local state if refetchCharacter is not available
                const updated = state.attackDefinitions.filter(def => def.id !== definition.id);
                updateState({
                    type: CharacterEditStateUpdateType.SET_ATTACK_DEFINITIONS,
                    payload: { attackDefinitions: updated },
                });
            }

            toast?.add({
                title: 'Success',
                description: 'Attack definition deleted',
                type: 'success',
            });
        } catch (error) {
            console.error('Error deleting attack definition:', error);
            toast?.add({
                title: 'Error',
                description: 'Failed to delete attack definition',
                type: 'error',
            });
        }
    }, [state.characterId, state.attackDefinitions, updateState, toast, refetchCharacter]);

    const handleSaveAttack = useCallback(async (definitionData: Omit<AttackDefinition, 'id'>) => {
        if (!state.characterId) return;

        if (!state.characterId) {
            return;
        }

        try {
            if (editingDefinition) {
                // Update existing
                await CharacterApi.updateCharacterAttackDefinition({
                    ...definitionData,
                    characterId: state.characterId,
                }, {
                    id: state.characterId,
                    attackId: editingDefinition.id,
                });

                // Refetch character data to get updated attack definitions
                if (refetchCharacter) {
                    await refetchCharacter();
                } else {
                    // Fallback: Update local state if refetchCharacter is not available
                    const updated = state.attackDefinitions.map(def =>
                        def.id === editingDefinition.id
                            ? { ...editingDefinition, ...definitionData }
                            : def
                    );
                    updateState({
                        type: CharacterEditStateUpdateType.SET_ATTACK_DEFINITIONS,
                        payload: { attackDefinitions: updated },
                    });
                }

                toast?.add({
                    title: 'Success',
                    description: 'Attack definition updated',
                    type: 'success',
                });
            } else {
                // Create new
                const result = await CharacterApi.createCharacterAttackDefinition({
                    ...definitionData,
                    characterId: state.characterId,
                }, {
                    id: state.characterId,
                });

                // Refetch character data to get updated attack definitions
                if (refetchCharacter) {
                    await refetchCharacter();
                } else {
                    // Fallback: Update local state if refetchCharacter is not available
                    const newDefinition: AttackDefinition = {
                        id: Number.parseInt(result.id, 10),
                        ...definitionData,
                    };
                    updateState({
                        type: CharacterEditStateUpdateType.SET_ATTACK_DEFINITIONS,
                        payload: { attackDefinitions: [...state.attackDefinitions, newDefinition] },
                    });
                }

                toast?.add({
                    title: 'Success',
                    description: 'Attack definition created',
                    type: 'success',
                });
            }
            setIsModalOpen(false);
            setEditingDefinition(null);
        } catch (error: unknown) {
            console.error('Error saving attack definition:', error);
            const errorMessage = error && typeof error === 'object' && 'response' in error
                && typeof error.response === 'object' && error.response !== null
                && 'data' in error.response
                && typeof error.response.data === 'object' && error.response.data !== null
                && 'error' in error.response.data
                && typeof error.response.data.error === 'string'
                ? error.response.data.error
                : 'Failed to save attack definition';
            toast?.add({
                title: 'Error',
                description: errorMessage,
                type: 'error',
            });
        }
    }, [state.characterId, state.attackDefinitions, editingDefinition, updateState, toast, refetchCharacter]);

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id || !state.characterId) {
            return;
        }

        const oldIndex = calculatedAttacks.findIndex(a => a.uniqueKey === active.id);
        const newIndex = calculatedAttacks.findIndex(a => a.uniqueKey === over.id);

        if (oldIndex === -1 || newIndex === -1) {
            return;
        }

        // Reorder attacks
        const reordered = arrayMove(calculatedAttacks, oldIndex, newIndex);
        // Extract unique attack definition IDs in order (deduplicate for dual-wield)
        const attackDefinitionIds: number[] = [];
        const seenIds = new Set<number>();
        for (const attack of reordered) {
            if (!seenIds.has(attack.attackDefinition.id)) {
                attackDefinitionIds.push(attack.attackDefinition.id);
                seenIds.add(attack.attackDefinition.id);
            }
        }

        if (!state.characterId) {
            return;
        }

        try {
            await CharacterApi.reorderCharacterAttackDefinitions({ attackDefinitionIds }, {
                id: state.characterId,
            });

            // Refetch character data to get updated attack definitions
            if (refetchCharacter) {
                await refetchCharacter();
            } else {
                // Fallback: Update slots based on new order if refetchCharacter is not available
                const updated = state.attackDefinitions.map(def => {
                    const newIndex = attackDefinitionIds.indexOf(def.id);
                    if (newIndex === -1) return def;

                    // Calculate new slot (1-based, accounting for dual wield taking 2 slots)
                    let slot = 1;
                    for (let i = 0; i < newIndex; i++) {
                        const prevDef = state.attackDefinitions.find(d => d.id === attackDefinitionIds[i]);
                        if (prevDef?.offHandCharacterItemId !== null) {
                            slot += 2; // Dual wield takes 2 slots
                        } else {
                            slot += 1;
                        }
                    }

                    // For dual wield, ensure we don't exceed slot 6
                    if (def.offHandCharacterItemId !== null && slot === 7) {
                        slot = 6; // Move to slot 6 instead
                    }

                    return { ...def, attackSlot: slot };
                });

                updateState({
                    type: CharacterEditStateUpdateType.SET_ATTACK_DEFINITIONS,
                    payload: { attackDefinitions: updated },
                });
            }

            toast?.add({
                title: 'Success',
                description: 'Attack definitions reordered',
                type: 'success',
            });
        } catch (error) {
            console.error('Error reordering attack definitions:', error);
            toast?.add({
                title: 'Error',
                description: 'Failed to reorder attack definitions',
                type: 'error',
            });
        }
    }, [calculatedAttacks, state.characterId, state.attackDefinitions, updateState, toast, refetchCharacter]);

    // Note: Character data is now provided via props from CharacterEdit, which uses TanStack Query cache
    // No need to fetch character data here - it's already available via the character prop

    if (!characterData) {
        return <div className="p-4">Loading character data...</div>;
    }

    return (
        <div className="p-4">
            <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Combat Attacks</h2>
                <button
                    onClick={handleAddAttack}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    <PlusIcon className="w-5 h-5" />
                    Add Attack
                </button>
            </div>

            {/* Assigned Attacks Section */}
            {assignedAttacks.length > 0 && (
                <>
                    <div className="mb-2 mt-4">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Assigned Attacks</h3>
                    </div>
                    {/* Table Header */}
                    <div className="grid grid-cols-10 gap-4 py-2 px-4 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 font-medium text-sm text-gray-700 dark:text-gray-300">
                        <div className="col-span-2">Weapon Name</div>
                        <div className="col-span-1">Attack Bonus</div>
                        <div className="col-span-1">Damage</div>
                        <div className="col-span-1">Critical</div>
                        <div className="col-span-1">Range</div>
                        <div className="col-span-1">Weight</div>
                        <div className="col-span-1">Type</div>
                        <div className="col-span-1">Size</div>
                        <div className="col-span-1"></div>
                    </div>

                    {/* Sortable Attack List */}
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={calculatedAttacks.map(a => a.uniqueKey)} strategy={verticalListSortingStrategy}>
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {calculatedAttacks.map(attack => (
                                    <SortableAttackRow
                                        key={attack.uniqueKey}
                                        attack={attack}
                                        onEdit={() => handleEditAttack(attack.attackDefinition)}
                                        onDelete={() => handleDeleteAttack(attack.attackDefinition)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </>
            )}

            {/* Unassigned Attacks Section */}
            {unassignedAttacks.length > 0 && (
                <>
                    <div className="mb-2 mt-6">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Unassigned Attacks (not displayed on sheet)</h3>
                    </div>
                    {/* Table Header */}
                    <div className="grid grid-cols-10 gap-4 py-2 px-4 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 font-medium text-sm text-gray-700 dark:text-gray-300">
                        <div className="col-span-2">Weapon Name</div>
                        <div className="col-span-1">Attack Bonus</div>
                        <div className="col-span-1">Damage</div>
                        <div className="col-span-1">Critical</div>
                        <div className="col-span-1">Range</div>
                        <div className="col-span-1">Weight</div>
                        <div className="col-span-1">Type</div>
                        <div className="col-span-1">Size</div>
                        <div className="col-span-1"></div>
                    </div>

                    {/* Non-sortable Attack List */}
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {unassignedAttacks.map(attack => (
                            <SortableAttackRow
                                key={attack.uniqueKey}
                                attack={attack}
                                onEdit={() => handleEditAttack(attack.attackDefinition)}
                                onDelete={() => handleDeleteAttack(attack.attackDefinition)}
                            />
                        ))}
                    </div>
                </>
            )}

            {assignedAttacks.length === 0 && unassignedAttacks.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No attack definitions. Click "Add Attack" to create one.
                </div>
            )}

            {/* Modal */}
            {characterData && (
                <AttackDefinitionModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingDefinition(null);
                    }}
                    onSave={handleSaveAttack}
                    attackDefinition={editingDefinition}
                    character={characterData}
                    characterItems={characterData.characterItems || []}
                    items={items}
                />
            )}
        </div>
    );
}

