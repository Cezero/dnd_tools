import React, { useState, useEffect, useRef } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { renderCellValue } from '@/components/generic-list/columnUtils';
import { FeatService } from '@/features/feat/FeatService';
import { ItemService } from '@/features/item/ItemService';
import { ClassProficiencyService } from '@/features/class/ClassProficiencyService';

import type { ClassTabProps } from './types';
import type { GetFeatResponse, ItemWithDetails, FeatureProgressionWithRelations } from '@shared/schema';

export function ProficienciesTab({
    formData,
    setFormData,
    validation,
    isLoading = false,
    featureProgressions = [],
    setFeatureProgressions,
    setIsProficiencyDialogOpen
}: ClassTabProps): React.JSX.Element {
    const [proficiencyDetails, setProficiencyDetails] = useState<{
        feats: Record<number, GetFeatResponse>;
        items: Record<number, ItemWithDetails>;
    }>({ feats: {}, items: {} });
    const [loadingProficiencies, setLoadingProficiencies] = useState<Set<string>>(new Set());

    // Use refs to track what's been loaded to avoid infinite loops
    const loadedFeatsRef = useRef<Set<number>>(new Set());
    const loadedItemsRef = useRef<Set<number>>(new Set());
    const loadingRef = useRef<Set<string>>(new Set());

    // Load proficiency details for class proficiencies
    useEffect(() => {
        const classProficiencies = ClassProficiencyService.getClassProficiencies(featureProgressions);
        const proficienciesToLoad = classProficiencies.filter(prof => {
            const key = `${prof.featId}-${prof.itemId}`;
            const featLoaded = loadedFeatsRef.current.has(prof.featId);
            const itemLoaded = prof.itemId === -1 || loadedItemsRef.current.has(prof.itemId);
            const currentlyLoading = loadingRef.current.has(key);
            return (!featLoaded || !itemLoaded) && !currentlyLoading;
        });

        if (proficienciesToLoad.length > 0) {
            const keysToLoad = proficienciesToLoad.map(prof => `${prof.featId}-${prof.itemId}`);

            // Update loading state
            keysToLoad.forEach(key => loadingRef.current.add(key));
            setLoadingProficiencies(new Set(loadingRef.current));

            Promise.all(
                proficienciesToLoad.map(async (prof) => {
                    const results: { featId: number; itemId: number; feat?: GetFeatResponse; item?: ItemWithDetails } = {
                        featId: prof.featId,
                        itemId: prof.itemId
                    };

                    try {
                        // Load feat details
                        if (!loadedFeatsRef.current.has(prof.featId)) {
                            results.feat = await FeatService.getFeatById(undefined, { id: prof.featId });
                        }

                        // Load item details if applicable
                        if (prof.itemId !== -1 && !loadedItemsRef.current.has(prof.itemId)) {
                            results.item = await ItemService.getItemById(undefined, { id: prof.itemId });
                        }

                        return results;
                    } catch (error) {
                        console.error(`Failed to load proficiency ${prof.featId}-${prof.itemId}:`, error);
                        return results;
                    }
                })
            ).then((results) => {
                const newFeats = { ...proficiencyDetails.feats };
                const newItems = { ...proficiencyDetails.items };

                results.forEach(({ featId, itemId, feat, item }) => {
                    if (feat) {
                        newFeats[featId] = feat;
                        loadedFeatsRef.current.add(featId);
                    }
                    if (item) {
                        newItems[itemId] = item;
                        loadedItemsRef.current.add(itemId);
                    }
                });

                setProficiencyDetails({ feats: newFeats, items: newItems });

                // Clear loading state
                keysToLoad.forEach(key => loadingRef.current.delete(key));
                setLoadingProficiencies(new Set(loadingRef.current));
            });
        }
    }, [featureProgressions]); // Only depend on featureProgressions

    const handleRemoveProficiency = (featId: number, itemId: number) => {
        if (!setFeatureProgressions) return;
        ClassProficiencyService.removeProficiency(
            featureProgressions as FeatureProgressionWithRelations[],
            setFeatureProgressions,
            featId,
            itemId
        );

        // Remove proficiency details from state
        setProficiencyDetails(prev => {
            const newFeats = { ...prev.feats };
            const newItems = { ...prev.items };

            // Only remove feat if no other proficiencies use it
            const otherProficiencies = ClassProficiencyService.getClassProficiencies(featureProgressions as FeatureProgressionWithRelations[]).filter(
                p => !(p.featId === featId && p.itemId === itemId)
            );
            const featStillUsed = otherProficiencies.some(p => p.featId === featId);
            if (!featStillUsed) {
                delete newFeats[featId];
            }

            // Only remove item if no other proficiencies use it
            if (itemId !== -1) {
                const itemStillUsed = otherProficiencies.some(p => p.itemId === itemId);
                if (!itemStillUsed) {
                    delete newItems[itemId];
                }
            }

            return { feats: newFeats, items: newItems };
        });
    };

    const classProficiencies = ClassProficiencyService.getClassProficiencies(featureProgressions);

    return (
        <div className="p-6 space-y-6">
            <div>
                {/* Add Proficiency Section */}
                <div className="mb-6">
                    <button
                        type="button"
                        onClick={() => setIsProficiencyDialogOpen?.(true)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                        Add Proficiency
                    </button>
                </div>

                {/* Proficiencies Grid */}
                {classProficiencies.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {classProficiencies.map((proficiency) => {
                            const key = `${proficiency.featId}-${proficiency.itemId}`;
                            const isLoading = loadingProficiencies.has(key);
                            const featDetail = proficiencyDetails.feats[proficiency.featId];
                            const itemDetail = proficiency.itemId !== -1 ? proficiencyDetails.items[proficiency.itemId] : null;

                            // Format the header: "Feat Name - Item Name" or just "Feat Name"
                            const headerText = proficiency.itemName
                                ? `${proficiency.featName} - ${proficiency.itemName}`
                                : proficiency.featName;

                            return (
                                <div key={key} className="border border-gray-200 rounded-lg p-3 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-medium text-base flex-1">{headerText}</h4>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveProficiency(proficiency.featId, proficiency.itemId)}
                                            className="text-red-500 hover:text-red-700 p-1 ml-2 flex-shrink-0"
                                            title="Remove Proficiency"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div>
                                        {isLoading ? (
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                Loading proficiency details...
                                            </div>
                                        ) : (itemDetail?.description ? (
                                            <div className="text-sm">
                                                {renderCellValue(
                                                    itemDetail.description,
                                                    { truncate: 200, isMarkdown: true },
                                                    `proficiency-${key}-item-description`
                                                )}
                                            </div>
                                        ) : featDetail?.description ? (
                                            <div className="text-sm">
                                                {renderCellValue(
                                                    featDetail.description,
                                                    { truncate: 200, isMarkdown: true },
                                                    `proficiency-${key}-feat-description`
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                                                No description available
                                            </div>
                                        ))}
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
        </div>
    );
}
