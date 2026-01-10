import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useQueryClient } from '@tanstack/react-query';
import React from 'react';

import { useAuthAuto } from '@/components/auth';
import { renderCellValue } from '@/components/generic-list/columnUtils';
import { displayStrategyFactory } from '@/lib/formatters';
import { usePrecacheFeatureEntities } from '@/lib/formatters/hooks/usePrecacheFeatureEntities';
import { FeatureProgression } from '@shared/schema';
import { DisplayType } from '@shared/static-data';

import { FeatureDisplayProps } from './types';

export function FeatureDisplay({
    feature,
    progressions,
    onEditProgression,
    onRemoveProgression,
    onAddProgression,
    showAddProgressionButton = true,
    className = '',
    onEditFeature,
    parentType: _parentType,
    parentId: _parentId
}: FeatureDisplayProps): React.JSX.Element {
    const { isAdmin } = useAuthAuto();
    const queryClient = useQueryClient();

    // Precache all entities referenced in feature progressions
    usePrecacheFeatureEntities(progressions);

    const handleEditProgression = (progression: FeatureProgression) => {
        onEditProgression?.(progression);
    };

    const handleRemoveProgression = (progressionId: number) => {
        onRemoveProgression?.(progressionId);
    };

    const handleAddProgression = () => {
        onAddProgression?.(feature);
    };

    const handleEditFeature = () => {
        if (feature?.id && onEditFeature) {
            onEditFeature(feature.id);
        }
    };

    return (
        <div className={`border border-gray-200 rounded-md dark:border-gray-600 ${className}`}>
            <div className="p-3 bg-gray-50 dark:bg-gray-700">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <div className="text-lg font-medium">
                                {feature?.name || `Feature ${feature?.id || 'Unknown'}`}
                                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                                    ({feature?.slug || `feature-${feature?.id || 'unknown'}`})
                                </span>
                            </div>
                            {isAdmin && onEditFeature && feature?.id && (
                                <button
                                    type="button"
                                    onClick={handleEditFeature}
                                    className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-500"
                                    title="Edit feature definition"
                                >
                                    <PencilIcon className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                    {/* Show prerequisites if they exist - use formatting system (Phase 6) */}
                    {feature.prerequisites && feature.prerequisites.length > 0 && (() => {
                        // Format prerequisites using the display strategy system
                        // Use the first progression if available, otherwise create a minimal one for formatting
                        // IMPORTANT: Always use the feature prop's prerequisites, not the progression's feature prerequisites
                        const baseProgression = progressions?.[0];

                        // Create a feature object that definitely has prerequisites from the prop
                        const featureWithPrerequisites = {
                            ...feature,
                            prerequisites: feature.prerequisites // Explicitly use the prop's prerequisites
                        };

                        const progressionForFormatting: FeatureProgression = baseProgression
                            ? {
                                ...baseProgression,
                                feature: featureWithPrerequisites // Always use the feature prop with prerequisites
                            }
                            : {
                                id: 0,
                                sourceType: 0,
                                level: 1,
                                featureId: feature.id || 0,
                                feature: featureWithPrerequisites
                            } as FeatureProgression;

                        const strategy = displayStrategyFactory.createStrategy(DisplayType.Detail);
                        const displayResult = strategy.format(progressionForFormatting);
                        const formattedPrereqs = displayResult.formattedPrerequisites || [];

                        return (
                            <div className="ml-4 p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-md flex-shrink-0">
                                <p className="text-xs text-slate-700 dark:text-slate-300">
                                    <strong>Prerequisites:</strong> {formattedPrereqs.join(', ')}
                                </p>
                            </div>
                        );
                    })()}
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
                    {/* Use display strategy for ALL progressions */}
                    {progressions.map((progression, progIndex) => (
                        <div key={progIndex} className="flex items-start gap-1">
                            <button
                                type="button"
                                onClick={() => handleEditProgression(progression)}
                                className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-left"
                                title="Edit progression details"
                            >
                                {(() => {
                                    const strategy = displayStrategyFactory.createStrategy(DisplayType.Edit);
                                    const result = strategy.format(progression);
                                    return result.formattedValue || 'No preview';
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
                    {showAddProgressionButton && (
                        <button
                            type="button"
                            onClick={handleAddProgression}
                            className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Add Progression
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
