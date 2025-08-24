import React from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { ValidatedInput } from '@/components/forms';

interface ArrayPairEditorProps {
    thresholds: number[];
    values: (string | number)[];
    onThresholdsChange: (thresholds: number[]) => void;
    onValuesChange: (values: (string | number)[]) => void;
    thresholdLabel?: string;
    valueLabel?: string;
    thresholdPlaceholder?: string;
    valuePlaceholder?: string;
    thresholdMin?: number;
    thresholdMax?: number;
    className?: string;
}

export function ArrayPairEditor({
    thresholds,
    values,
    onThresholdsChange,
    onValuesChange,
    thresholdLabel = "Threshold",
    valueLabel = "Value",
    thresholdPlaceholder = "e.g., 4",
    valuePlaceholder = "e.g., -2",
    thresholdMin = 1,
    thresholdMax = 20,
    className = ""
}: ArrayPairEditorProps) {

    // Add empty row for editing
    const displayThresholds = [...thresholds, 0];
    const displayValues = [...values, ''];

    const removePair = (index: number) => {
        const newThresholds = thresholds.filter((_, i) => i !== index);
        const newValues = values.filter((_, i) => i !== index);
        onThresholdsChange(newThresholds);
        onValuesChange(newValues);
    };

    const updateThreshold = (index: number, value: number) => {
        if (index >= thresholds.length) {
            // Adding new pair
            onThresholdsChange([...thresholds, value]);
            onValuesChange([...values, '']);
        } else {
            // Updating existing pair
            const newThresholds = [...thresholds];
            newThresholds[index] = value;
            onThresholdsChange(newThresholds);
        }
    };

    const updateValue = (index: number, value: string | number) => {
        if (index >= values.length) {
            // Adding new pair
            onThresholdsChange([...thresholds, 0]);
            onValuesChange([...values, value]);
        } else {
            // Updating existing pair
            const newValues = [...values];
            newValues[index] = value;
            onValuesChange(newValues);
        }
    };

    return (
        <div className={`space-y-4 ${className}`}>
            <h4 className="text-sm font-medium">Threshold-Value Pairs</h4>

            <div className="overflow-x-auto">
                <div className="inline-block min-w-0">
                    {/* Header row */}
                    <div className="grid grid-cols-3 gap-0.5 mb-1">
                        <div className="w-16 h-6 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                            Level
                        </div>
                        <div className="w-20 h-6 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                            Value
                        </div>
                        <div className="w-8 h-6 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                            {/* Empty header for trash icon column */}
                        </div>
                    </div>

                    {/* Data rows */}
                    {displayThresholds.map((_, index) => (
                        <div key={index} className="grid grid-cols-3 gap-0.5">
                            <div>
                                <input
                                    type="number"
                                    value={displayThresholds[index] || ''}
                                    onChange={(e) => updateThreshold(index, parseInt(e.target.value) || 0)}
                                    placeholder={thresholdPlaceholder}
                                    min={thresholdMin}
                                    max={thresholdMax}
                                    className="w-16 h-6 text-center text-xs border rounded transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <input
                                    type="text"
                                    value={displayValues[index] || ''}
                                    onChange={(e) => updateValue(index, e.target.value)}
                                    placeholder={valuePlaceholder}
                                    className="w-20 h-6 text-center text-xs border rounded transition-colors border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
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
