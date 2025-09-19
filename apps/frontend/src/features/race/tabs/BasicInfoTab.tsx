import React from 'react';

import { ValidatedInput, SourceEditor } from '@/components/forms';
import { CustomCheckbox, CustomSelect } from '@/components/forms/FormComponents';
import { EDITION_SELECT_LIST_FULL, SIZE_SELECT_LIST, GetBaseClassesByEdition, SourceType } from '@shared/static-data';

import type { RaceTabProps } from './types';

export function BasicInfoTab({
    formData,
    setFormData,
    isLoading: _isLoading = false
}: RaceTabProps): React.JSX.Element {
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
                            value={formData.sizeId}
                            options={SIZE_SELECT_LIST}
                            required
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-30"
                            itemExtraClassName="w-auto"
                            itemTextExtraClassName="w-16"
                            onValueChange={(value) => setFormData({ ...formData, sizeId: value as number })}
                            placeholder="Select size"
                        />
                        <ValidatedInput
                            field="speed"
                            label="Speed"
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-30"
                            inputExtraClassName="w-auto"
                            type="number"
                            min={0}
                            max={60}
                            step={5}
                        />
                        <CustomSelect
                            label="Favored Class"
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-30"
                            itemExtraClassName="w-full"
                            itemTextExtraClassName="w-24"
                            value={formData.favoredClassId}
                            onValueChange={(value) => setFormData({ ...formData, favoredClassId: value as number })}
                            options={[
                                { value: -1, label: 'Any' },
                                ...GetBaseClassesByEdition(formData.editionId)
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
                                options={EDITION_SELECT_LIST_FULL}
                                placeholder="Select edition"
                            />
                            <CustomCheckbox
                                label="Visible in Lists"
                                checked={formData.isVisible as boolean}
                                onCheckedChange={(checked) => setFormData({ ...formData, isVisible: checked })}
                            />
                            <ValidatedInput
                                field="levelAdjustment"
                                label="Level Adjustment"
                                componentExtraClassName="flex items-center gap-2"
                                labelExtraClassName="w-30"
                                inputExtraClassName="w-auto"
                                type="number"
                                min={0}
                                max={100}
                                step={1}
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Source References */}
            <div>
                <SourceEditor
                    sources={formData.sources || []}
                    onSourcesChange={(sources) => setFormData({ ...formData, sources })}
                    sourceType={SourceType.Races}
                />
            </div>
        </div>
    );
}
