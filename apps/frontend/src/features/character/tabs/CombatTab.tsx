import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import React, { useMemo, useState, useCallback, useEffect } from 'react';
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
import { TabComponentProps, CharacterEditStateUpdateType, AttackDefinition } from '@/features/character/types';
import { AttackDefinitionModal } from '../components/AttackDefinitionModal';
import { CharacterApi } from '../CharacterApi';
import {
    CharacterCalculationService,
    formatAttackBonus,
    formatWeight,
    formatSize,
    formatDamageType,
    getUnarmedDamageType,
} from '@/lib/character-calculation';
import type { CharacterWithAllDetailsResponse, DnDClass } from '@shared/schema';
import { ItemQueryHooks } from '@/services/query/ItemQueryHooks';
import { ClassQueryHooks } from '@/services/query/ClassQueryHooks';
import { calculateCharacterStats } from '../characterStatsCalculator';
import { useToast } from '@/components/toast/useToast';

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
    isDualWield?: boolean;
    offHandDisplay?: CalculatedAttackDisplay;
}

function SortableAttackRow({
    attack: attackDisplay,
    onEdit,
    onDelete,
    isDualWieldGroup,
}: {
    attack: CalculatedAttackDisplay;
    onEdit: () => void;
    onDelete: () => void;
    isDualWieldGroup: boolean;
}): React.JSX.Element {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: attackDisplay.attackDefinition.id });

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
            {attackDisplay.isDualWield && attackDisplay.offHandDisplay && (
                <div className="grid grid-cols-10 gap-4 py-3 px-4 items-center bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                    <div className="col-span-2 pl-8 text-sm text-gray-600 dark:text-gray-400">
                        {attackDisplay.offHandDisplay.weaponName} (Off-hand)
                    </div>
                    <div className="col-span-1 text-sm text-gray-700 dark:text-gray-300">
                        {typeof attackDisplay.offHandDisplay.totalAttackBonus === 'string'
                            ? attackDisplay.offHandDisplay.totalAttackBonus
                            : `${attackDisplay.offHandDisplay.totalAttackBonus >= 0 ? '+' : ''}${attackDisplay.offHandDisplay.totalAttackBonus}`}
                    </div>
                    <div className="col-span-1 text-sm text-gray-700 dark:text-gray-300">{attackDisplay.offHandDisplay.damage}</div>
                    <div className="col-span-1 text-sm text-gray-700 dark:text-gray-300">{attackDisplay.offHandDisplay.critical}</div>
                    <div className="col-span-1 text-sm text-gray-700 dark:text-gray-300">{attackDisplay.offHandDisplay.range || '-'}</div>
                    <div className="col-span-1 text-sm text-gray-700 dark:text-gray-300">{attackDisplay.offHandDisplay.weight || '-'}</div>
                    <div className="col-span-1 text-sm text-gray-700 dark:text-gray-300">{attackDisplay.offHandDisplay.type}</div>
                    <div className="col-span-1 text-sm text-gray-700 dark:text-gray-300">{attackDisplay.offHandDisplay.size || '-'}</div>
                    <div className="col-span-1"></div>
                </div>
            )}
        </div>
    );
}

export function CombatTab({
    state,
    updateState,
    resolvedData,
}: TabComponentProps): React.JSX.Element {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDefinition, setEditingDefinition] = useState<AttackDefinition | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Fetch character data - use state if available, otherwise fetch
    const [characterData, setCharacterData] = React.useState<CharacterWithAllDetailsResponse | null>(null);
    const [items, setItems] = React.useState<Array<{ id: number; name: string; weight: number | null; sizeId: number | null; weapon?: { category: number; type: number; damageMedium: string | null; critical: string | null; range: number | null; damageType: string | null } | null }>>([]);
    const [classDetailsMap, setClassDetailsMap] = React.useState<Map<number, DnDClass>>(new Map());

    useEffect(() => {
        if (state.characterId) {
            CharacterApi.getCharacterWithAllDetails(undefined, { id: state.characterId })
                .then(setCharacterData)
                .catch(console.error);
        }
    }, [state.characterId]);

    // Fetch items for weapons
    useEffect(() => {
        ItemQueryHooks.getItems()
            .then(result => {
                if (result?.results) {
                    setItems(result.results.map(item => ({
                        id: item.id,
                        name: item.name,
                        weight: item.weight,
                        sizeId: item.sizeId,
                        weapon: item.weapon ? {
                            category: item.weapon.category,
                            type: item.weapon.type,
                            damageMedium: item.weapon.damageMedium,
                            critical: item.weapon.critical,
                            range: item.weapon.range,
                            damageType: item.weapon.damageType,
                        } : null,
                    })));
                }
            })
            .catch(console.error);
    }, []);

    // Fetch class details
    useEffect(() => {
        if (characterData) {
            const classIds = new Set<number>();
            if (characterData.advancements) {
                for (const adv of characterData.advancements) {
                    if (adv.classId) classIds.add(adv.classId);
                    if (adv.secondaryClassId) classIds.add(adv.secondaryClassId);
                }
            }

            const map = new Map<number, DnDClass>();
            const fetchPromises = Array.from(classIds).map(async (classId) => {
                try {
                    const classData = await ClassQueryHooks.getClassById(classId);
                    map.set(classId, classData);
                } catch (error) {
                    console.error(`Failed to fetch class ${classId}:`, error);
                }
            });

            Promise.all(fetchPromises).then(() => {
                setClassDetailsMap(map);
            });
        }
    }, [characterData]);

    // Calculate character stats
    const stats = useMemo(() => {
        if (!characterData || classDetailsMap.size === 0) return null;
        return calculateCharacterStats(characterData, classDetailsMap);
    }, [characterData, classDetailsMap]);

    // Calculate attack displays
    const calculatedAttacks = useMemo<CalculatedAttackDisplay[]>(() => {
        if (!characterData || !stats || classDetailsMap.size === 0) {
            console.log('CombatTab: Missing prerequisites', {
                hasCharacterData: !!characterData,
                hasStats: !!stats,
                itemsLength: items.length,
                classDetailsMapSize: classDetailsMap.size,
            });
            return [];
        }

        // Items are only needed for weapon attacks, not unarmed strikes

        const attacks: CalculatedAttackDisplay[] = [];
        const definitions = state.attackDefinitions.filter(def => def.attackSlot !== null);

        console.log('CombatTab: Processing attack definitions', {
            totalDefinitions: state.attackDefinitions.length,
            definitionsWithSlots: definitions.length,
            definitions,
        });

        // Sort by attack slot
        definitions.sort((a, b) => {
            if (a.attackSlot === null) return 1;
            if (b.attackSlot === null) return -1;
            return a.attackSlot - b.attackSlot;
        });

        for (const definition of definitions) {
            try {
                const characterItems = characterData.characterItems || [];

                console.log('CombatTab: Processing definition', {
                    definition,
                    characterItemsCount: characterItems.length,
                    itemsCount: items.length,
                });

                // Convert attack definition to combat calculation context
                const ATTACK_TYPE_MAP: Record<number, 'unarmed' | 'main-hand' | 'off-hand' | 'ranged' | 'dual-wield'> = {
                    1: 'unarmed',
                    2: 'main-hand',
                    3: 'dual-wield',
                    4: 'ranged',
                };

                const attackType = ATTACK_TYPE_MAP[definition.attackTypeId] ?? 'main-hand';

                // For unarmed strikes, we don't need items
                if (attackType === 'unarmed') {
                    const progressions = resolvedData?.progressions ?? [];
                    const result = CharacterCalculationService.getCombatValues(
                        characterData,
                        progressions,
                        { attackType: 'unarmed' },
                        classDetailsMap
                    );

                    attacks.push({
                        attackDefinition: definition,
                        weaponName: result.weaponName,
                        totalAttackBonus: formatAttackBonus(result.value, result.nonlethalAttackBonus),
                        damage: result.damage,
                        critical: result.critical,
                        range: result.range,
                        weight: null,
                        type: getUnarmedDamageType(),
                        size: null,
                        specialProperties: null,
                    });
                    continue;
                }

                // Find main hand item (required for weapon attacks)
                let mainHandItem: typeof items[0] | undefined;
                if (definition.mainHandCharacterItemId) {
                    const mainHandCharacterItem = characterItems.find(ci => ci.id === definition.mainHandCharacterItemId);
                    if (mainHandCharacterItem) {
                        mainHandItem = items.find(i => i.id === mainHandCharacterItem.baseItemId);
                        if (!mainHandItem) {
                            console.warn('CombatTab: Main hand item not found', {
                                characterItemId: definition.mainHandCharacterItemId,
                                baseItemId: mainHandCharacterItem.baseItemId,
                                availableItemIds: items.map(i => i.id),
                            });
                        }
                    }
                }

                // Find off hand item
                let offHandItem: typeof items[0] | undefined;
                if (definition.offHandCharacterItemId) {
                    const offHandCharacterItem = characterItems.find(ci => ci.id === definition.offHandCharacterItemId);
                    if (offHandCharacterItem) {
                        offHandItem = items.find(i => i.id === offHandCharacterItem.baseItemId);
                        if (!offHandItem) {
                            console.warn('CombatTab: Off hand item not found', {
                                characterItemId: definition.offHandCharacterItemId,
                                baseItemId: offHandCharacterItem.baseItemId,
                                availableItemIds: items.map(i => i.id),
                            });
                        }
                    }
                }

                const context = {
                    attackType,
                    mainHandItem,
                    offHandItem,
                };

                // Use new calculation service
                const progressions = resolvedData?.progressions ?? [];
                console.log('CombatTab: Calling getCombatValues', {
                    attackType,
                    hasMainHandItem: !!mainHandItem,
                    hasOffHandItem: !!offHandItem,
                    progressionsCount: progressions.length,
                });

                const result = CharacterCalculationService.getCombatValues(
                    characterData,
                    progressions,
                    context,
                    classDetailsMap
                );

                console.log('CombatTab: Got result', result);

                attacks.push({
                    attackDefinition: definition,
                    weaponName: result.weaponName,
                    totalAttackBonus: formatAttackBonus(result.value, result.nonlethalAttackBonus),
                    damage: result.damage,
                    critical: result.critical,
                    range: result.range,
                    weight: formatWeight(mainHandItem?.weight),
                    type: formatDamageType(mainHandItem?.weapon?.damageType ?? null),
                    size: formatSize(mainHandItem?.sizeId),
                    specialProperties: null,
                    isDualWield: result.isDualWield,
                    offHandDisplay: result.offHandResult ? {
                        attackDefinition: definition, // Same definition for off-hand
                        weaponName: result.offHandResult.weaponName,
                        totalAttackBonus: formatAttackBonus(result.offHandResult.value, result.offHandResult.nonlethalAttackBonus),
                        damage: result.offHandResult.damage,
                        critical: result.offHandResult.critical,
                        range: result.offHandResult.range,
                        weight: formatWeight(offHandItem?.weight),
                        type: formatDamageType(offHandItem?.weapon?.damageType ?? null),
                        size: formatSize(offHandItem?.sizeId),
                        specialProperties: null,
                    } : undefined,
                });
            } catch (error) {
                console.error('Error calculating attack stats:', error, {
                    definition,
                    mainHandItemId: definition.mainHandCharacterItemId,
                    offHandItemId: definition.offHandCharacterItemId,
                });
                // Don't silently fail - add a placeholder so user knows something is wrong
                attacks.push({
                    attackDefinition: definition,
                    weaponName: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    totalAttackBonus: 0,
                    damage: 'N/A',
                    critical: 'N/A',
                    range: null,
                    weight: null,
                    type: '',
                    size: null,
                    specialProperties: null,
                });
            }
        }

        return attacks;
    }, [state.attackDefinitions, characterData, items, classDetailsMap, resolvedData.progressions, stats]);

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

        try {
            setIsLoading(true);
            await CharacterApi.deleteCharacterAttackDefinition(undefined, {
                id: state.characterId.toString(),
                attackId: definition.id.toString(),
            });

            // Update local state
            const updated = state.attackDefinitions.filter(def => def.id !== definition.id);
            updateState({
                type: CharacterEditStateUpdateType.SET_ATTACK_DEFINITIONS,
                payload: { attackDefinitions: updated },
            });

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
        } finally {
            setIsLoading(false);
        }
    }, [state.characterId, state.attackDefinitions, updateState, toast]);

    const handleSaveAttack = useCallback(async (definitionData: Omit<AttackDefinition, 'id'>) => {
        if (!state.characterId) return;

        try {
            setIsLoading(true);
            if (editingDefinition) {
                // Update existing
                await CharacterApi.updateCharacterAttackDefinition({
                    ...definitionData,
                    characterId: state.characterId,
                }, {
                    id: state.characterId.toString(),
                    attackId: editingDefinition.id.toString(),
                });

                const updated = state.attackDefinitions.map(def =>
                    def.id === editingDefinition.id
                        ? { ...editingDefinition, ...definitionData }
                        : def
                );
                updateState({
                    type: CharacterEditStateUpdateType.SET_ATTACK_DEFINITIONS,
                    payload: { attackDefinitions: updated },
                });
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
                    id: state.characterId.toString(),
                });

                const newDefinition: AttackDefinition = {
                    id: parseInt(result.id, 10),
                    ...definitionData,
                };

                updateState({
                    type: CharacterEditStateUpdateType.SET_ATTACK_DEFINITIONS,
                    payload: { attackDefinitions: [...state.attackDefinitions, newDefinition] },
                });
                toast?.add({
                    title: 'Success',
                    description: 'Attack definition created',
                    type: 'success',
                });
            }
            setIsModalOpen(false);
            setEditingDefinition(null);
        } catch (error: any) {
            console.error('Error saving attack definition:', error);
            toast?.add({
                title: 'Error',
                description: error?.response?.data?.error || 'Failed to save attack definition',
                type: 'error',
            });
        } finally {
            setIsLoading(false);
        }
    }, [state.characterId, state.attackDefinitions, editingDefinition, updateState, toast]);

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id || !state.characterId) {
            return;
        }

        const oldIndex = calculatedAttacks.findIndex(a => a.attackDefinition.id === active.id);
        const newIndex = calculatedAttacks.findIndex(a => a.attackDefinition.id === over.id);

        if (oldIndex === -1 || newIndex === -1) {
            return;
        }

        // Handle dual wield groups - if dragging a dual wield, move both main and off-hand together
        const draggedAttack = calculatedAttacks[oldIndex];
        const isDualWield = draggedAttack.isDualWield;

        // Reorder attacks
        const reordered = arrayMove(calculatedAttacks, oldIndex, newIndex);
        const attackDefinitionIds = reordered.map(a => a.attackDefinition.id);

        try {
            setIsLoading(true);
            await CharacterApi.reorderCharacterAttackDefinitions({ attackDefinitionIds }, {
                id: state.characterId.toString(),
            });

            // Update slots based on new order
            const updated = state.attackDefinitions.map(def => {
                const newIndex = attackDefinitionIds.indexOf(def.id);
                if (newIndex === -1) return def;

                // Calculate new slot (1-based, accounting for dual wield taking 2 slots)
                let slot = 1;
                for (let i = 0; i < newIndex; i++) {
                    const prevDef = state.attackDefinitions.find(d => d.id === attackDefinitionIds[i]);
                    if (prevDef?.attackTypeId === 3 && prevDef.offHandCharacterItemId !== null) {
                        slot += 2; // Dual wield takes 2 slots
                    } else {
                        slot += 1;
                    }
                }

                // For dual wield, ensure we don't exceed slot 6
                if (def.attackTypeId === 3 && def.offHandCharacterItemId !== null && slot === 7) {
                    slot = 6; // Move to slot 6 instead
                }

                return { ...def, attackSlot: slot };
            });

            updateState({
                type: CharacterEditStateUpdateType.SET_ATTACK_DEFINITIONS,
                payload: { attackDefinitions: updated },
            });

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
        } finally {
            setIsLoading(false);
        }
    }, [calculatedAttacks, state.characterId, state.attackDefinitions, updateState, toast]);

    // Update character data when attack definitions change
    useEffect(() => {
        if (state.characterId && state.attackDefinitions.length > 0) {
            CharacterApi.getCharacterWithAllDetails(undefined, { id: state.characterId })
                .then(setCharacterData)
                .catch(console.error);
        }
    }, [state.characterId, state.attackDefinitions.length]);

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
                <SortableContext items={calculatedAttacks.map(a => a.attackDefinition.id)} strategy={verticalListSortingStrategy}>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {calculatedAttacks.map(attack => (
                            <SortableAttackRow
                                key={attack.attackDefinition.id}
                                attack={attack}
                                onEdit={() => handleEditAttack(attack.attackDefinition)}
                                onDelete={() => handleDeleteAttack(attack.attackDefinition)}
                                isDualWieldGroup={attack.isDualWield || false}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {calculatedAttacks.length === 0 && (
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
                />
            )}
        </div>
    );
}

