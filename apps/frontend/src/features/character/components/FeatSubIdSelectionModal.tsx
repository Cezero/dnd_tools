import { Dialog } from '@base-ui-components/react/dialog';
import React, { useState, useEffect, useMemo } from 'react';

import { CustomSelect } from '@/components/forms/FormComponents';
import { extractProficiencies } from '@/lib/attack-calculation';
import { useCacheFunctions } from '@/services/cache/CacheFunctions';
import { FeaturePrerequisiteType, FeatureSourceType } from '@shared/static-data';

import type { FeatSubIdSelectionModalProps } from './types';

export function FeatSubIdSelectionModal({
    isOpen,
    onClose,
    onConfirm,
    feat,
    resolvedProgressions,
}: FeatSubIdSelectionModalProps): React.JSX.Element {
    const [selectedWeaponId, setSelectedWeaponId] = useState<number | null>(null);
    const { getAllWeapons, transformItemCacheEntriesToCoreComponents } = useCacheFunctions();

    // Extract proficiencies from resolved features
    const proficiencies = useMemo(() => {
        return extractProficiencies(resolvedProgressions);
    }, [resolvedProgressions]);

    // Find feature features for this feat
    const featProgressions = useMemo(() => {
        if (!feat || !resolvedProgressions) return [];
        return resolvedProgressions.filter(
            p => p.sourceType === FeatureSourceType.Feat && p.featId === feat.id
        );
    }, [feat, resolvedProgressions]);

    // Get feature description from feature
    const featureDescription = useMemo(() => {
        return featProgressions[0]?.description || null;
    }, [featProgressions]);

    // Check if feat has proficiency prerequisite from Feature system
    const hasProficiencyPrereq = useMemo(() => {
        if (!featProgressions.length) return false;

        // Check if any feature has a proficiency prerequisite
        return featProgressions.some(feature =>
            feature.prerequisites?.some(
                prereq => prereq.type === FeaturePrerequisiteType.Proficiency
            )
        );
    }, [featProgressions]);

    /**
     * Retrieves all weapons from the items cache.
     * Only loads weapons when the modal is open and a feat is provided.
     */
    const weaponItems = useMemo(() => {
        if (!isOpen || !feat) return [];
        return getAllWeapons();
    }, [isOpen, feat, getAllWeapons]);

    /**
     * Filters weapons based on proficiency prerequisites.
     * If the feat has no proficiency prerequisite, all weapons are shown.
     * Otherwise, only weapons the character is proficient with are shown.
     */
    const filteredWeapons = useMemo(() => {
        if (!feat) {
            return [];
        }

        // If no proficiency prerequisite, show all weapons
        if (!hasProficiencyPrereq) {
            return transformItemCacheEntriesToCoreComponents(weaponItems);
        }

        // Filter weapons based on proficiency
        const proficientWeapons = weaponItems.filter(item => {
            // Check if weapon is in proficient item IDs (specific item proficiency)
            if (proficiencies.itemIds.includes(item.id)) {
                return true;
            }

            // Check if weapon category is in proficient weapon categories
            if (item.weaponCategory && proficiencies.weaponCategories.includes(item.weaponCategory)) {
                return true;
            }

            return false;
        });

        return transformItemCacheEntriesToCoreComponents(proficientWeapons);
    }, [weaponItems, feat, hasProficiencyPrereq, proficiencies, transformItemCacheEntriesToCoreComponents]);

    // Reset selection when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSelectedWeaponId(null);
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (selectedWeaponId !== null) {
            onConfirm(selectedWeaponId);
            onClose();
        }
    };

    if (!feat) return <></>;

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Backdrop className="fixed inset-0 bg-black bg-opacity-25 z-40" />
            <Dialog.Portal>
                <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-md transform overflow-visible rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-800">
                        <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4">
                            Select Weapon for {feat.name}
                        </Dialog.Title>
                        <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {featureDescription || 'Please select a weapon for this feat.'}
                        </Dialog.Description>

                        {filteredWeapons.length === 0 ? (
                            <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                                {hasProficiencyPrereq
                                    ? 'No weapons available. You must be proficient with a weapon to select this feat.'
                                    : 'No weapons available.'}
                            </div>
                        ) : (
                            <div className="mb-4">
                                <CustomSelect
                                    label="Weapon"
                                    required
                                    value={selectedWeaponId}
                                    onValueChange={(value) => setSelectedWeaponId(value)}
                                    options={filteredWeapons}
                                    placeholder="Select a weapon"
                                    componentExtraClassName="w-full"
                                />
                            </div>
                        )}

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={selectedWeaponId === null}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

