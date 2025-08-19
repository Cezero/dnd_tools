import React from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { formatProgression, formatPrerequisites } from '@/lib/Formatters';
import { renderCellValue } from '@/components/generic-list/columnUtils';
import {
    SpecialFeatureId,
} from '@shared/static-data';
import type { ClassTabProps } from './types';
import type { FeatureProgressionWithRelations } from '@shared/schema';

interface FeatureGroup {
    feature: FeatureProgressionWithRelations['feature'];
    progressions: FeatureProgressionWithRelations[];
}

export function FeaturesTab({
    formData,
    setFormData,
    validation,
    isLoading = false,
    featureProgressions = [],
    setFeatureProgressions,
    setIsFeatureAssocOpen,
    setIsProgressionDialogOpen,
    setEditingProgression,
    setPreSelectedFeature
}: ClassTabProps): React.JSX.Element {
    const handleRemoveProgression = (progressionId: number) => {
        if (!setFeatureProgressions) return;
        const updatedProgressions = (featureProgressions as FeatureProgressionWithRelations[]).filter((p: FeatureProgressionWithRelations) => p.id !== progressionId);
        setFeatureProgressions(updatedProgressions);
    };

    const handleEditProgression = (progression: FeatureProgressionWithRelations) => {
        setEditingProgression?.(progression);
        setIsProgressionDialogOpen?.(true);
    };

    // Filter out special features (class skills and proficiencies) from the features display
    const filteredProgressions = (featureProgressions as FeatureProgressionWithRelations[]).filter((prog: FeatureProgressionWithRelations) =>
        prog.featureId !== SpecialFeatureId.ClassSkill &&
        prog.featureId !== SpecialFeatureId.ClassProficiency
    );

    // Group filtered progressions by feature for display
    const progressionsByFeature = filteredProgressions.reduce((acc: Record<number, FeatureGroup>, progression: FeatureProgressionWithRelations) => {
        const featureId = progression.featureId;
        if (!acc[featureId]) {
            acc[featureId] = {
                feature: progression.feature!,
                progressions: []
            };
        }
        acc[featureId].progressions.push(progression);
        return acc;
    }, {});

    // Sort features by the first level where they apply
    const sortedFeatures = Object.values(progressionsByFeature).sort((a: FeatureGroup, b: FeatureGroup) => {
        const aMinLevel = Math.min(...a.progressions.map((p: FeatureProgressionWithRelations) => p.level));
        const bMinLevel = Math.min(...b.progressions.map((p: FeatureProgressionWithRelations) => p.level));
        return aMinLevel - bMinLevel;
    });

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Class Features</h3>
                <button
                    type="button"
                    onClick={() => setIsFeatureAssocOpen?.(true)}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                    Add Features
                </button>
            </div>

            {sortedFeatures.length > 0 ? (
                <div className="space-y-4">
                    {sortedFeatures.map(({ feature, progressions }) => (
                        <div key={feature?.id || 'unknown'} className="border border-gray-200 rounded-md dark:border-gray-600">
                            <div className="p-3 bg-gray-50 dark:bg-gray-700">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="text-lg font-medium">
                                            {feature?.name || `Feature ${feature?.id || 'Unknown'}`}
                                            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                                                ({feature?.slug || `feature-${feature?.id || 'unknown'}`})
                                            </span>
                                        </div>
                                    </div>
                                    {/* Show prerequisites if they exist */}
                                    {feature.prerequisites && feature.prerequisites.length > 0 && (
                                        <div className="ml-4 p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-md flex-shrink-0">
                                            <p className="text-xs text-slate-700 dark:text-slate-300">
                                                <strong>Prerequisites:</strong> {formatPrerequisites(feature.prerequisites)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                {/* Show feature description */}
                                {feature?.description && (
                                    <div className="mt-2">
                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                            {renderCellValue(
                                                feature.description,
                                                { truncate: 300, isMarkdown: true },
                                                `feature-${feature?.id || 'unknown'}-description`
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Feature Progressions */}
                            <div className="p-2">
                                <div className="flex flex-wrap gap-2 items-start">
                                    {progressions.map((progression: FeatureProgressionWithRelations, progIndex: number) => (
                                        <div key={progIndex} className="flex items-start gap-1">
                                            <button
                                                type="button"
                                                onClick={() => handleEditProgression(progression)}
                                                className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-left"
                                                title="Edit progression details"
                                            >
                                                {(() => {
                                                    const formatted = formatProgression(progression);
                                                    if (formatted.label === '') {
                                                        // Formula-based progression - return the raw value without wrapping
                                                        return formatted.value;
                                                    } else {
                                                        // Regular progression - wrap with level and details
                                                        const details = [];
                                                        if (formatted.value) details.push(formatted.value);
                                                        if (formatted.note) details.push(formatted.note);
                                                        return `Level ${progression.level}${details.length > 0 ? ` (${details.join(', ')})` : ''}`;
                                                    }
                                                })()}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveProgression(progression.id)}
                                                className="text-red-500 hover:text-red-700"
                                                title="Remove Progression"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingProgression?.(null);
                                            setPreSelectedFeature?.(feature);
                                            setIsProgressionDialogOpen?.(true);
                                        }}
                                        className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        Add Progression
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-gray-500 text-center py-4 border border-dashed border-gray-300 rounded-md dark:border-gray-600">
                    No features associated with this class
                </div>
            )}
        </div>
    );
}
