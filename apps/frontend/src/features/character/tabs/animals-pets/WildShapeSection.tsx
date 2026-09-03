import { TrashIcon } from '@heroicons/react/24/outline';
import React, { useMemo, useState } from 'react';

import { CustomSelect } from '@/components/forms/FormComponents';
import { SelectedFormQueryHooks } from '@/features/character/SelectedFormQueryHooks';
import { formatHitDiceNotation } from '@/lib/formatHitDice';
import { CacheQueryHooks } from '@/services/query/CacheQueryHooks';
import {
    ELEMENTAL_WILD_SHAPE_FEATURE_SLUG,
    SIZE_MAP,
    WILD_SHAPE_FEATURE_SLUG,
} from '@shared/static-data';

import type { WildShapeFeatureOption, WildShapeSectionProps } from './types';

/**
 * Picker for eligible wild-shape forms. Writes selections into the character draft.
 */
export function WildShapeSection({
    characterId,
    features,
    selectedForms,
    onAdd,
    onRemove,
}: WildShapeSectionProps): React.JSX.Element {
    const wildShapeFeatures = useMemo<WildShapeFeatureOption[]>(() => {
        return features
            .filter((feature) => (
                feature.slug === WILD_SHAPE_FEATURE_SLUG
                || feature.slug === ELEMENTAL_WILD_SHAPE_FEATURE_SLUG
            ))
            .map((feature) => ({
                featureId: feature.id,
                name: feature.name,
                slug: feature.slug,
            }));
    }, [features]);

    const [activeFeatureId, setActiveFeatureId] = useState<number | null>(null);
    const [pendingMonsterId, setPendingMonsterId] = useState<number | null>(null);
    const selectedFeatureId = activeFeatureId ?? wildShapeFeatures[0]?.featureId ?? null;

    const { data: monstersCache } = CacheQueryHooks.useMonstersCache();
    const { data: eligibleData, isLoading: isLoadingEligible } = SelectedFormQueryHooks.useGetEligibleForms(
        characterId,
        selectedFeatureId
    );

    const selectedMonsterIds = useMemo(
        () => new Set(selectedForms.map((form) => form.monsterId)),
        [selectedForms]
    );

    const eligibleOptions = useMemo(() => {
        return (eligibleData?.results ?? [])
            .filter((form) => !selectedMonsterIds.has(form.monsterId))
            .map((form) => {
                const sizeName = form.sizeId !== null ? SIZE_MAP[form.sizeId]?.name : null;
                const hdLabel = formatHitDiceNotation(form.hitDiceQty, form.hitDiceType) || null;
                const suffix = [sizeName, hdLabel].filter(Boolean).join(', ');
                return {
                    id: form.monsterId,
                    name: suffix ? `${form.name} (${suffix})` : form.name,
                };
            });
    }, [eligibleData?.results, selectedMonsterIds]);

    if (wildShapeFeatures.length === 0) {
        return (
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Wild Shape forms unlock when the character gains Wild Shape.
            </p>
        );
    }

    const handleAdd = () => {
        if (!selectedFeatureId || !pendingMonsterId) {
            return;
        }
        onAdd(selectedFeatureId, pendingMonsterId);
        setPendingMonsterId(null);
    };

    return (
        <div className="space-y-4">
            {wildShapeFeatures.length > 1 && (
                <CustomSelect
                    label="Feature"
                    value={selectedFeatureId}
                    onValueChange={(value) => {
                        setActiveFeatureId(value);
                        setPendingMonsterId(null);
                    }}
                    options={wildShapeFeatures.map((feature) => ({
                        id: feature.featureId,
                        name: feature.name,
                    }))}
                />
            )}

            <div className="flex items-end gap-3">
                <div className="flex-1">
                    <CustomSelect
                        label="Eligible form"
                        value={pendingMonsterId}
                        onValueChange={setPendingMonsterId}
                        options={eligibleOptions}
                        placeholder={isLoadingEligible ? 'Loading forms...' : 'Select a form'}
                        disabled={isLoadingEligible || eligibleOptions.length === 0}
                    />
                </div>
                <button
                    type="button"
                    onClick={handleAdd}
                    disabled={!pendingMonsterId}
                    className="px-3 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md disabled:opacity-50"
                >
                    Add Form
                </button>
            </div>

            {selectedForms.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No forms selected.</p>
            ) : (
                <ul className="space-y-2">
                    {selectedForms.map((form) => {
                        const monsterName = monstersCache?.results?.find((monster) => monster.id === form.monsterId)?.name
                            ?? `Monster ${form.monsterId}`;
                        const featureName = wildShapeFeatures.find((feature) => feature.featureId === form.featureId)?.name
                            ?? 'Wild Shape';
                        return (
                            <li
                                key={form.id}
                                className="flex items-center justify-between border border-gray-200 dark:border-gray-600 rounded px-3 py-2"
                            >
                                <div>
                                    <div className="font-medium">{monsterName}</div>
                                    <div className="text-xs text-gray-500">{featureName}</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onRemove(form.id)}
                                    className="p-1 text-red-600 hover:text-red-800"
                                    title="Remove form"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
