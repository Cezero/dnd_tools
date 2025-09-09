import { Dialog } from '@base-ui-components/react/dialog';
import { TrashIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect } from 'react';

import { FeatureSystemService } from '@/components/feature-system/FeatureSystemService';
import { CustomSelect } from '@/components/forms';
import { renderCellValue } from '@/components/generic-list/columnUtils';
import { ClassProficiencyService } from '@/features/class/ClassProficiencyService';
import { FeatApi } from '@/features/feat/FeatApi';
import { displayStrategyFactory } from '@/lib/formatters';
import type { CharacterSheetDisplayResult, FormattedEntityResult } from '@/lib/formatters/types';
import { DisplayType, FeatBenefitType, SpecialFeatureId } from '@shared/static-data';

import type { ClassTabProps } from './types';

export interface ProficiencyFeat {
    id: number;
    name: string;
    proficiencyTypeId: number;
}

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
    const [proficiencyFeats, setProficiencyFeats] = useState<ProficiencyFeat[]>([]);
    const [selectedProficiencyFeat, setSelectedProficiencyFeat] = useState<ProficiencyFeat | null>(null);
    const [proficiencyItems, setProficiencyItems] = useState<ProficiencyItem[]>([]);
    const [selectedProficiencyItem, setSelectedProficiencyItem] = useState<number | null>(null);
    const [isDialogLoading, setIsDialogLoading] = useState(false);

    // Load proficiency feats when dialog opens
    useEffect(() => {
        if (isDialogOpen) {
            loadProficiencyFeats();
        }
    }, [isDialogOpen]);

    const loadProficiencyFeats = async () => {
        try {
            setIsDialogLoading(true);
            // We need the full feat data to extract proficiency type from benefits
            // TODO: Optimize backend to include proficiencyTypeId in list response
            const fullFeats = await FeatApi.featQuery({ queryType: 'proficiency' });

            // Extract proficiency type from benefits
            const feats: ProficiencyFeat[] = [];

            for (const feat of fullFeats.results) {
                if (feat.benefits && feat.benefits.length > 0) {
                    const proficiencyBenefit = feat.benefits.find(benefit =>
                        benefit.typeId === FeatBenefitType.PROFICIENCY
                    );

                    if (proficiencyBenefit && proficiencyBenefit.referenceId) {
                        feats.push({
                            id: feat.id,
                            name: feat.name,
                            proficiencyTypeId: proficiencyBenefit.referenceId
                        });
                    }
                }
            }

            setProficiencyFeats(feats);
            setSelectedProficiencyFeat(null);
            setSelectedProficiencyItem(null);
            setProficiencyItems([]);
        } catch (error) {
            console.error('Failed to load proficiency feats:', error);
        } finally {
            setIsDialogLoading(false);
        }
    };

    const handleFeatSelection = async (featId: number) => {
        const feat = proficiencyFeats.find(f => f.id === featId);
        if (feat) {
            setSelectedProficiencyFeat(feat);
            setSelectedProficiencyItem(null);

            // Load items for this proficiency type
            try {
                setIsDialogLoading(true);
                // Use the FeatureSystemService to get items by proficiency type
                const items = await FeatureSystemService.getItemsByProficiencyType(feat.proficiencyTypeId);

                // Transform to the expected format
                const transformedItems = items.map(item => ({
                    id: item.id,
                    name: item.name,
                    typeId: item.typeId,
                    weapon: item.weapon,
                    armor: item.armor
                }));

                setProficiencyItems(transformedItems);
            } catch (error) {
                console.error('Failed to load items for proficiency type:', error);
                setProficiencyItems([]);
            } finally {
                setIsDialogLoading(false);
            }
        }
    };

    const handleItemSelection = (itemId: number) => {
        setSelectedProficiencyItem(itemId);
    };

    const handleAddProficiency = () => {
        if (selectedProficiencyFeat && selectedProficiencyItem !== null) {
            const itemName = selectedProficiencyItem === -1 ? 'All Items' : proficiencyItems.find(item => item.id === selectedProficiencyItem)?.name;
            onAddProficiency(selectedProficiencyFeat.id, selectedProficiencyItem, selectedProficiencyFeat.name, itemName);
            setIsDialogOpen(false);
        }
    };

    const isProficiencyAlreadyAdded = (featId: number, itemId: number) => {
        return classProficiencies.some(modifier => modifier.appliesToId === featId && modifier.appliesToSubId === itemId);
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

                            // Find the formatted result for this entity
                            const entityResult = result.individualEntities?.find((entity: FormattedEntityResult) =>
                                entity.entity.id === modifier.id
                            );
                            const formattedText = entityResult?.formattedValue || 'Unknown Proficiency';

                            return (
                                <div key={key} className="border border-gray-200 rounded-lg p-3 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-medium text-base flex-1">{formattedText}</h4>
                                        <button
                                            type="button"
                                            onClick={() => onRemoveProficiency(modifier.appliesToId || 0, modifier.appliesToSubId || -1)}
                                            className="text-red-500 hover:text-red-700 p-1 ml-2 flex-shrink-0"
                                            title="Remove Proficiency"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div>
                                        {modifier.item?.description ? (
                                            <div className="text-sm">
                                                {renderCellValue(
                                                    modifier.item.description,
                                                    { truncate: 200, isMarkdown: true },
                                                    `proficiency-${key}-item-description`
                                                )}
                                            </div>
                                        ) : modifier.feat?.description ? (
                                            <div className="text-sm">
                                                {renderCellValue(
                                                    modifier.feat.description,
                                                    { truncate: 200, isMarkdown: true },
                                                    `proficiency-${key}-feat-description`
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                                                No description available
                                            </div>
                                        )}
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
                                {/* Feat Selection */}
                                <div>
                                    <CustomSelect
                                        label="Select Proficiency Feat"
                                        popupExtraClassName='w-60'
                                        triggerExtraClassName="w-60"
                                        itemExtraClassName="w-68"
                                        itemTextExtraClassName="w-60"
                                        value={selectedProficiencyFeat?.id || null}
                                        onValueChange={(value) => handleFeatSelection(value as number)}
                                        options={proficiencyFeats.map(feat => ({ value: feat.id, label: feat.name }))}
                                        placeholder="Choose a proficiency feat"
                                        disabled={isDialogLoading}
                                    />
                                </div>

                                {/* Item Selection - only show if feat is selected */}
                                {selectedProficiencyFeat && (
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
                                                { value: -1, label: 'All Items' },
                                                ...proficiencyItems
                                                    .filter(item => !isProficiencyAlreadyAdded(selectedProficiencyFeat.id, item.id))
                                                    .sort((a, b) => a.name.localeCompare(b.name))
                                                    .map(item => ({ value: item.id, label: item.name }))
                                            ]}
                                            placeholder="Choose items or 'All Items'"
                                            disabled={isDialogLoading}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end space-x-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsDialogOpen(false)}
                                    className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                    disabled={isDialogLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddProficiency}
                                    disabled={!selectedProficiencyFeat || selectedProficiencyItem === null || isDialogLoading}
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
