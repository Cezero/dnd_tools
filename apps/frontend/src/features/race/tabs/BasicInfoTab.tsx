import React, { useEffect, useState, useMemo } from 'react';

import { ValidatedInput, SourceEditor } from '@/components/forms';
import { CustomCheckbox, CustomSelect } from '@/components/forms/FormComponents';
import { extractRaceMechanics } from '@/lib/feature-extraction/raceMechanicsExtractor';
import { useCacheFunctions } from '@/services/cache';
import { EDITION_LIST, SIZE_LIST, SourceType, EditionId, CoreComponent } from '@shared/static-data';

import { findRaceMechanicsProgression, updateRaceMechanicsEntity } from '../raceMechanicsHelpers';
import type { RaceTabProps } from './types';


export function BasicInfoTab({
    formData,
    setFormData,
    isLoading: _isLoading = false,
    featureProgressions = [],
    setFeatureProgressions,
    raceId
}: RaceTabProps): React.JSX.Element {
    const { getBaseClassSelectByEdition } = useCacheFunctions();
    const [availableClasses, setAvailableClasses] = useState<CoreComponent[]>([]);

    // Extract mechanics from progressions
    const mechanics = useMemo(() => {
        if (!raceId) {
            return { sizeId: null, speed: null, favoredClassId: null, levelAdjustment: null };
        }
        return extractRaceMechanics(featureProgressions, raceId);
    }, [featureProgressions, raceId]);

    // Helper to update progressions directly
    const handleMechanicsFieldChange = (
        field: 'sizeId' | 'speed' | 'favoredClassId' | 'levelAdjustment',
        value: number | null
    ) => {
        // Update progressions if available
        if (setFeatureProgressions && raceId && value !== null) {
            const mechanicsProgression = findRaceMechanicsProgression(featureProgressions, raceId);
            if (mechanicsProgression) {
                updateRaceMechanicsEntity(mechanicsProgression, field, value, featureProgressions, setFeatureProgressions);
            }
        }
    };

    useEffect(() => {
        const loadClasses = async () => {
            try {
                const classes = await getBaseClassSelectByEdition(formData.editionId);
                setAvailableClasses(classes);
            } catch (error) {
                console.error('Failed to load classes:', error);
                setAvailableClasses([]);
            }
        };

        loadClasses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.editionId]);

    return (
        <div className="p-6 space-y-6">
            <div>
                <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 w-full">
                        <ValidatedInput
                            field="name"
                            label="Name"
                            type="text"
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-30"
                            inputExtraClassName="w-auto"
                            required
                            placeholder="e.g., Human, Elf, Dwarf"
                            data-1p-ignore
                        />
                        <CustomSelect
                            label="Size"
                            value={mechanics.sizeId ?? undefined}
                            options={SIZE_LIST}
                            required
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-30"
                            itemExtraClassName="w-auto"
                            itemTextExtraClassName="w-16"
                            onValueChange={(value) => handleMechanicsFieldChange('sizeId', value as number)}
                            placeholder="Select size"
                        />
                        <div className="flex items-center gap-2">
                            <label className={`block font-medium w-30 ${mechanics.speed === null ? 'text-gray-400' : ''}`}>
                                Speed
                            </label>
                            <input
                                type="number"
                                min={0}
                                max={60}
                                step={5}
                                value={mechanics.speed ?? ''}
                                onChange={(e) => handleMechanicsFieldChange('speed', e.target.value ? parseInt(e.target.value, 10) : null)}
                                className="w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                        <CustomSelect
                            label="Favored Class"
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-30"
                            itemExtraClassName="w-full"
                            itemTextExtraClassName="w-24"
                            value={mechanics.favoredClassId ?? undefined}
                            onValueChange={(value) => handleMechanicsFieldChange('favoredClassId', value as number)}
                            options={[
                                { id: -1, name: 'Any' },
                                ...availableClasses
                            ]}
                            placeholder="Select favored class"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex flex-col justify-end">
                            <CustomSelect
                                label="Edition"
                                required
                                componentExtraClassName="flex items-center gap-2"
                                labelExtraClassName="w-2/7"
                                itemExtraClassName="w-24"
                                itemTextExtraClassName="w-16"
                                value={formData.editionId}
                                onValueChange={(value) => setFormData({ ...formData, editionId: value as number })}
                                options={EDITION_LIST}
                                placeholder="Select edition"
                            />
                            <CustomCheckbox
                                label="Visible in Lists"
                                checked={formData.isVisible as boolean}
                                onCheckedChange={(checked) => setFormData({ ...formData, isVisible: checked })}
                            />
                            <div className="flex items-center gap-2">
                                <label className={`block font-medium w-30 ${mechanics.levelAdjustment === null ? 'text-gray-400' : ''}`}>
                                    Level Adjustment
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    step={1}
                                    placeholder="0"
                                    value={mechanics.levelAdjustment ?? ''}
                                    onChange={(e) => handleMechanicsFieldChange('levelAdjustment', e.target.value ? parseInt(e.target.value, 10) : null)}
                                    className="w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Source References */}
            <div>
                <SourceEditor
                    sources={formData.sourceBookInfo || []}
                    onSourcesChange={(sources) => setFormData({ ...formData, sourceBookInfo: sources })}
                    sourceType={SourceType.Races}
                    editionId={formData.editionId as EditionId}
                />
            </div>
        </div>
    );
}
