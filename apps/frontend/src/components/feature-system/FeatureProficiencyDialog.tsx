import { Dialog } from '@base-ui-components/react/dialog';
import React, { useState, useEffect } from 'react';

import { CustomSelect } from '@/components/forms';
import { FeatService } from '@/features/feat/FeatService';
import { ItemService } from '@/features/item/ItemService';
import { FeatBenefitType, PROFICIENCY_TYPES } from '@shared/static-data';

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

interface FeatureProficiencyDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onAddProficiency: (featId: number, itemId: number) => void;
    existingProficiencies: Array<{ featId: number; itemId: number }>;
    title?: string;
}

export function FeatureProficiencyDialog({
    isOpen,
    onClose,
    onAddProficiency,
    existingProficiencies,
    title = "Add Proficiency"
}: FeatureProficiencyDialogProps) {
    const [proficiencyFeats, setProficiencyFeats] = useState<ProficiencyFeat[]>([]);
    const [selectedProficiencyFeat, setSelectedProficiencyFeat] = useState<ProficiencyFeat | null>(null);
    const [proficiencyItems, setProficiencyItems] = useState<ProficiencyItem[]>([]);
    const [selectedProficiencyItem, setSelectedProficiencyItem] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load proficiency feats when dialog opens
    useEffect(() => {
        if (isOpen) {
            loadProficiencyFeats();
        }
    }, [isOpen]);

    const loadProficiencyFeats = async () => {
        try {
            setIsLoading(true);
            // Use the new proficiency query endpoint
            const response = await FeatService.featQuery({ queryType: 'proficiency' });

            // Extract proficiency type from benefits
            const feats: ProficiencyFeat[] = [];

            for (const feat of response.results) {
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
            setIsLoading(false);
        }
    };

    const handleFeatSelection = async (featId: number) => {
        const feat = proficiencyFeats.find(f => f.id === featId);
        if (feat) {
            setSelectedProficiencyFeat(feat);
            setSelectedProficiencyItem(null);

            // Load items for this proficiency type
            try {
                setIsLoading(true);
                // Get proficiency info from the enhanced PROFICIENCY_TYPES
                const proficiencyInfo = PROFICIENCY_TYPES[feat.proficiencyTypeId];
                if (!proficiencyInfo) {
                    console.error('Unknown proficiency type:', feat.proficiencyTypeId);
                    setProficiencyItems([]);
                    return;
                }

                // Use the new item query endpoint with the mapped values
                const response = await ItemService.itemQuery({
                    queryType: 'byCategory',
                    typeId: proficiencyInfo.itemTypeId,
                    category: proficiencyInfo.category
                });

                // For tower shield proficiency, filter to only tower shields
                let filteredItems = response.results;
                if (feat.proficiencyTypeId === 8) { // Tower Shield
                    filteredItems = response.results.filter(item =>
                        item.name.toLowerCase().includes('tower')
                    );
                }

                const items = filteredItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    typeId: item.typeId,
                    weapon: item.weapon,
                    armor: item.armor
                }));

                setProficiencyItems(items);
            } catch (error) {
                console.error('Failed to load items for proficiency type:', error);
                setProficiencyItems([]);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleItemSelection = (itemId: number) => {
        setSelectedProficiencyItem(itemId);
    };

    const handleAddProficiency = () => {
        if (selectedProficiencyFeat && selectedProficiencyItem !== null) {
            onAddProficiency(selectedProficiencyFeat.id, selectedProficiencyItem);
            onClose();
        }
    };

    const isProficiencyAlreadyAdded = (featId: number, itemId: number) => {
        return existingProficiencies.some(prof => prof.featId === featId && prof.itemId === itemId);
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Backdrop className="fixed inset-0 bg-black bg-opacity-25 z-40" />
            <Dialog.Portal>
                <Dialog.Popup className="fixed inset-0 flex items-center justify-center p-4">
                    <div className="w-full max-w-md transform overflow-visible rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                        <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            {title}
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
                                    disabled={isLoading}
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
                                        disabled={isLoading}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-2 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleAddProficiency}
                                disabled={!selectedProficiencyFeat || selectedProficiencyItem === null || isLoading}
                                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add Proficiency
                            </button>
                        </div>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
