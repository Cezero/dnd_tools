import { TrashIcon } from '@heroicons/react/24/outline';
import React from 'react';

import { ValidatedCustomSelect, ValidatedInput } from '@/components/forms';
import { CoreComponent } from '@shared/static-data';

interface ArrayPairEditorProps {
    thresholds: number[];
    values: (string | number)[];
    onThresholdsChange: (thresholds: number[]) => void;
    onValuesChange: (values: (string | number)[]) => void;
    thresholdPlaceholder?: string;
    valuePlaceholder?: string;
    thresholdMin?: number;
    thresholdMax?: number;
    className?: string;
    // New props for enhanced conditional scaling
    valuesRepresent?: 'value' | 'appliesToId';
    appliesToSelectOptions?: CoreComponent[];
    // Form context props for ValidatedCustomSelect
    entityKey?: string;
    index?: number;
}

export function ArrayPairEditor({
    thresholds,
    values,
    onThresholdsChange,
    onValuesChange,
    thresholdPlaceholder = "e.g., 4",
    valuePlaceholder = "e.g., -2",
    thresholdMin = 1,
    thresholdMax = 20,
    className = "",
    valuesRepresent = 'value',
    appliesToSelectOptions = [],
    entityKey,
    index: _index
}: ArrayPairEditorProps) {
    // index is used in the ValidatedCustomSelect field prop below

    const removePair = (index: number) => {
        const newThresholds = thresholds.filter((_, i) => i !== index);
        const newValues = values.filter((_, i) => i !== index);
        onThresholdsChange(newThresholds);
        onValuesChange(newValues);
    };


    return (
        <div className={`space-y-4 ${className}`}>
            <h4 className="text-sm font-medium">Threshold-Value Pairs</h4>

            <div className="overflow-x-auto">
                <div className="inline-block min-w-0 p-1">
                    {/* Header row */}
                    <div className={`grid gap-1.5 ${valuesRepresent === 'appliesToId' ? 'grid-cols-[36px_94px_10px]' : 'grid-cols-[36px_48px_10px]'}`}>
                        <div className="w-10 h-6 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                            Level
                        </div>
                        <div className={`${valuesRepresent === 'appliesToId' ? 'w-24' : 'w-10'} h-6 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400`}>
                            Value
                        </div>
                        <div className="w-8 h-6 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                            {/* Empty header for trash icon column */}
                        </div>
                    </div>

                    {/* Data rows */}
                    {[...thresholds, 0].map((_, index) => (
                        <div key={index} className={`grid gap-1.5 ${valuesRepresent === 'appliesToId' ? 'grid-cols-[36px_94px_10px]' : 'grid-cols-[36px_48px_10px]'}`}>
                            <div>
                                <ValidatedInput
                                    field={`${entityKey}.${_index}.formulaParams.thresholds.${index}`}
                                    label=""
                                    type="number"
                                    placeholder={thresholdPlaceholder}
                                    min={thresholdMin}
                                    max={thresholdMax}
                                    componentExtraClassName={`flex items-center w-10 ${valuesRepresent === 'appliesToId' ? 'h-8' : 'h-6'}`}
                                    inputExtraClassName="w-10 p-0 text-xs text-center [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                                    nested
                                />
                            </div>
                            <div>
                                {valuesRepresent === 'appliesToId' ? (
                                    <ValidatedCustomSelect
                                        field={`${entityKey}.${_index}.formulaParams.values.${index}`}
                                        options={appliesToSelectOptions}
                                        placeholder={valuePlaceholder}
                                        componentExtraClassName="flex items-center w-26 h-8"
                                        triggerExtraClassName="w-26 h-6 pl-1 pt-0 pb-0 text-xs"
                                        nested
                                    />
                                ) : (
                                    <ValidatedInput
                                        field={`${entityKey}.${_index}.formulaParams.values.${index}`}
                                        label=""
                                        placeholder={valuePlaceholder}
                                        componentExtraClassName="flex items-center w-10 h-6 text-center text-xs"
                                        inputExtraClassName="w-10 p-0 text-xs text-center"
                                        nested
                                    />
                                )}
                            </div>
                            <div className="flex items-center justify-center">
                                {index < thresholds.length && (
                                    <button
                                        type="button"
                                        onClick={() => removePair(index)}
                                        className="text-red-500 hover:text-red-700 p-1 transition-colors"
                                        title="Remove pair"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400">
                <p>• Each pair represents a threshold level and its corresponding value</p>
                <p>• Values change at each threshold level and above</p>
                <p>• Example: Level 4, Value -2 means "at level 4 and above, use value -2"</p>
            </div>
        </div>
    );
}
