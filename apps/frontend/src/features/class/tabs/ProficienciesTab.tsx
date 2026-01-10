import { Dialog } from '@base-ui-components/react/dialog';
import { TrashIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect } from 'react';

import { FeatureSystemService } from '@/components/feature-system/FeatureSystemService';
import { CustomSelect } from '@/components/forms';
import { ClassProficiencyService } from '@/features/class/ClassProficiencyService';
import { displayStrategyFactory } from '@/lib/formatters';
import type { CharacterSheetDisplayResult, FormattedEntityResult } from '@/lib/formatters/types';
import { DisplayType, SpecialFeatureId, PROFICIENCY_TYPE_LIST, CoreComponent } from '@shared/static-data';

import type { ClassTabProps } from './types';

export interface ProficiencyItem {
    id: number;
    name: string;
    typeId: number;
    weapon?: {
        category: number;
        type: number;
    };
    armor?: {
        category: number;
    };
}

export function ProficienciesTab({
    formData: _formData,
    setFormData: _setFormData,
    validation: _validation,
    isLoading: _isLoading = false,
    featureProgressions = [],
    onAddProficiency,
    onRemoveProficiency
}: ClassTabProps): React.JSX.Element {

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedProficiencyType, setSelectedProficiencyType] = useState<CoreComponent | null>(null);
    const [proficiencyItems, setProficiencyItems] = useState<ProficiencyItem[]>([]);
    const [selectedProficiencyItem, setSelectedProficiencyItem] = useState<number | null>(null);
    const [_isDialogLoading, _setIsDialogLoading] = useState(false);

    const [isLoadingItems, setIsLoadingItems] = useState(false);

    const handleProficiencyTypeSelection = (proficiencyTypeId: number) => {
        const proficiencyType = PROFICIENCY_TYPE_LIST.find(pt => pt.id === proficiencyTypeId);
        if (proficiencyType) {
            setSelectedProficiencyType(proficiencyType);
            setSelectedProficiencyItem(null);
            setProficiencyItems([]);
        }
    };

    // Load items when a proficiency type is selected
    useEffect(() => {
        const loadItems = async () => {
            if (!selectedProficiencyType?.id) {
                setProficiencyItems([]);
                return;
            }

            setIsLoadingItems(true);
            try {
                const itemsResult = await FeatureSystemService.getItemsByProficiencyType(selectedProficiencyType.id);
                const transformedItems = (itemsResult.results || []).map(item => ({
                    id: item.id,
                    name: item.name,
                    typeId: item.typeId,
                    weapon: item.weapon,
                    armor: item.armor
                }));
                setProficiencyItems(transformedItems);
            } catch (error) {
                console.error('Failed to load proficiency items:', error);
                setProficiencyItems([]);
            } finally {
                setIsLoadingItems(false);
            }
        };

        loadItems();
    }, [selectedProficiencyType]);

    const handleItemSelection = (itemId: number) => {
        setSelectedProficiencyItem(itemId);
    };

    const handleAddProficiency = () => {
        if (selectedProficiencyType && selectedProficiencyItem !== null) {
            const itemName = selectedProficiencyItem === -1 ? 'All Items' : proficiencyItems.find(item => item.id === selectedProficiencyItem)?.name;
            // Pass proficiencyTypeId directly (the parameter name is misleading but kept for compatibility)
            onAddProficiency(selectedProficiencyType.id, selectedProficiencyItem, selectedProficiencyType.name, itemName);
            setIsDialogOpen(false);
        }
    };

    const isProficiencyAlreadyAdded = (proficiencyTypeId: number, itemId: number) => {
        return classProficiencies.some(modifier => modifier.appliesToId === proficiencyTypeId && modifier.appliesToSubId === itemId);
    };

    const classProficiencies = ClassProficiencyService.getClassProficiencies(featureProgressions);


    // Find proficiency progressions for display strategy
    const proficiencyProgressions = featureProgressions.filter(progression =>
        progression.featureId === SpecialFeatureId.ClassProficiency
    );

    // Use CharacterSheet strategy to format proficiencies individually
    const strategy = displayStrategyFactory.createStrategy(DisplayType.CharacterSheet);
    const result = strategy.format(proficiencyProgressions, undefined, false) as CharacterSheetDisplayResult; // Cast to access new properties

    return (
        <div className="p-6 space-y-6">
            <div>
                {/* Add Proficiency Section */}
                <div className="mb-6">
                    <button
                        type="button"
                        onClick={() => setIsDialogOpen(true)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                        Add Proficiency
                    </button>
                </div>

                {/* Proficiencies Grid */}
                {classProficiencies.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {classProficiencies.map((modifier) => {
                            const key = `${modifier.appliesToId}-${modifier.appliesToSubId}`;

                            // Find the formatted result for this entity from the display strategy
                            const entityResult = result.individualEntities?.find((entity: FormattedEntityResult) =>
                                entity.entity.id === modifier.id
                            );
                            const formattedText = entityResult?.formattedValue || 'Unknown Proficiency';

                            return (
                                <div key={key} className="border border-gray-200 rounded-lg p-3 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <div className="flex justify-between items-center">
                                        <div className="font-medium text-base flex-1">{formattedText}</div>
                                        <button
                                            type="button"
                                            onClick={() => onRemoveProficiency(modifier.appliesToId || 0, modifier.appliesToSubId || -1)}
                                            className="text-red-500 hover:text-red-700 p-1 ml-2 flex-shrink-0"
                                            title="Remove Proficiency"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-6 border border-dashed border-gray-300 rounded-md dark:border-gray-600">
                        <p className="text-gray-500 dark:text-gray-400">
                            No class proficiencies added yet. Use the button above to add proficiencies.
                        </p>
                    </div>
                )}
            </div>

            {/* Proficiency Dialog */}
            <Dialog.Root open={isDialogOpen} onOpenChange={(open) => !open && setIsDialogOpen(false)}>
                <Dialog.Backdrop className="fixed inset-0 bg-black bg-opacity-25 z-40" />
                <Dialog.Portal>
                    <Dialog.Popup className="fixed inset-0 flex items-center justify-center p-4">
                        <div className="w-full max-w-md transform overflow-visible rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                Add Class Proficiency
                            </Dialog.Title>

                            <div className="space-y-4">
                                {/* Proficiency Type Selection */}
                                <div>
                                    <CustomSelect
                                        label="Select Proficiency Type"
                                        popupExtraClassName='w-60'
                                        triggerExtraClassName="w-60"
                                        itemExtraClassName="w-68"
                                        itemTextExtraClassName="w-60"
                                        value={selectedProficiencyType?.id || null}
                                        onValueChange={(value) => handleProficiencyTypeSelection(value as number)}
                                        options={PROFICIENCY_TYPE_LIST}
                                        placeholder="Choose a proficiency type"
                                    />
                                </div>

                                {/* Item Selection - only show if proficiency type is selected */}
                                {selectedProficiencyType && (
                                    <div>
                                        <CustomSelect
                                            label="Select Items"
                                            popupExtraClassName='w-60'
                                            triggerExtraClassName="w-60"
                                            itemExtraClassName="w-68"
                                            itemTextExtraClassName="w-60"
                                            value={selectedProficiencyItem}
                                            onValueChange={(value) => handleItemSelection(value as number)}
                                            options={[
                                                { id: -1, name: 'All Items' },
                                                ...proficiencyItems
                                                    .filter(item => !isProficiencyAlreadyAdded(selectedProficiencyType.id, item.id))
                                                    .sort((a, b) => a.name.localeCompare(b.name))
                                                    .map(item => ({ id: item.id, name: item.name }))
                                            ]}
                                            placeholder="Choose items or 'All Items'"
                                            disabled={isLoadingItems}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end space-x-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsDialogOpen(false)}
                                    className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                    disabled={isLoadingItems}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddProficiency}
                                    disabled={!selectedProficiencyType || selectedProficiencyItem === null || isLoadingItems}
                                    className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Add Proficiency
                                </button>
                            </div>
                        </div>
                    </Dialog.Popup>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
