import { TrashIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

import { FeatureSystemApi } from '@/components/feature-system/FeatureSystemApi';
import { ListSelectionDialog } from '@/components/generic-list';
import { renderCellValue } from '@/components/generic-list/columnUtils';
import { displayStrategyFactory } from '@/lib/formatters';
import { Feature, FeatureProgression } from '@shared/schema';
import { DisplayType, FeatureSourceType } from '@shared/static-data';

interface FeaturesTabProps {
    // Common props
    featureProgressions?: FeatureProgression[];
    onEditProgression?: (progression: FeatureProgression) => void;
    onRemoveProgression?: (progressionId: number) => void;
    onAddFeature?: (feature: { id: number; name: string; description: string; slug: string }) => void;

    // Context-specific props
    contextType: FeatureSourceType;
    contextId: number;

    // UI text props
    title: string;
    emptyMessage: string;

    // Special feature filtering
    excludeSpecialFeatures?: number[];

    // Dialog state management
    setEditingProgression?: (progression: FeatureProgression | null) => void;
    setPreSelectedFeature?: (feature: FeatureProgression['feature'] | null) => void;
    setIsProgressionDialogOpen?: (open: boolean) => void;
}

export function FeaturesTab({
    featureProgressions = [],
    onEditProgression,
    onRemoveProgression,
    onAddFeature,
    contextType,
    contextId,
    title,
    emptyMessage,
    excludeSpecialFeatures = [],
    setEditingProgression,
    setPreSelectedFeature,
    setIsProgressionDialogOpen
}: FeaturesTabProps): React.JSX.Element {
    const [isFeatureSelectionOpen, setIsFeatureSelectionOpen] = useState(false);

    // Group progressions by feature, excluding special features based on context
    const featuresByFeature = featureProgressions
        .filter(progression => !excludeSpecialFeatures.includes(progression.featureId))
        .reduce((acc, progression) => {
            const featureId = progression.featureId;
            if (!acc[featureId]) {
                acc[featureId] = {
                    feature: progression.feature,
                    progressions: []
                };
            }
            acc[featureId].progressions.push(progression);
            return acc;
        }, {} as Record<number, { feature: FeatureProgression['feature']; progressions: FeatureProgression[] }>);

    // Sort features by name
    const sortedFeatures = Object.values(featuresByFeature).sort((a, b) =>
        (a.feature?.name || '').localeCompare(b.feature?.name || '')
    );

    const handleEditProgression = (progression: FeatureProgression) => {
        onEditProgression?.(progression);
    };

    const handleRemoveProgression = (progressionId: number) => {
        onRemoveProgression?.(progressionId);
    };

    const handleFeatureSelected = (feature: { id: number; name: string; description: string; slug: string }) => {
        onAddFeature?.(feature);
    };

    return (
        <>
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{title}</h2>
                    <button
                        type="button"
                        onClick={() => setIsFeatureSelectionOpen(true)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                        Add Feature
                    </button>
                </div>

                {sortedFeatures.length > 0 ? (
                    <div className="space-y-4">
                        {sortedFeatures.map(({ feature, progressions }) => {
                            // Check if this is a wild shape feature
                            const isWildShape = feature?.name?.toLowerCase().includes('wild shape');

                            // Group progressions by level for wild shape features
                            const progressionsByLevel = isWildShape ?
                                (() => {
                                    // Expand formula-based progressions
                                    const expandedProgressions = progressions; // TODO: Implement formula expansion
                                    return expandedProgressions.reduce((acc, progression) => {
                                        const level = progression.level;
                                        if (!acc[level]) {
                                            acc[level] = [];
                                        }
                                        acc[level].push(progression);
                                        return acc;
                                    }, {} as Record<number, FeatureProgression[]>);
                                })() :
                                null;

                            return (
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
                                                        <strong>Prerequisites:</strong> {feature.prerequisites.length} prerequisite(s)
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
                                            {isWildShape && progressionsByLevel ? (
                                                // Special formatting for wild shape features
                                                Object.entries(progressionsByLevel)
                                                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                                    .map(([level, levelProgressions]) => {
                                                        const wildShapeDetails = ''; // TODO: Implement wild shape formatting
                                                        return (
                                                            <div key={level} className="flex items-start gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleEditProgression(levelProgressions[0])}
                                                                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-left"
                                                                    title="Edit progression details"
                                                                >
                                                                    Level {level}{wildShapeDetails ? ` (${wildShapeDetails})` : ''}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveProgression(levelProgressions[0].id)}
                                                                    className="text-red-500 hover:text-red-700"
                                                                    title="Remove Progression"
                                                                >
                                                                    <TrashIcon className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        );
                                                    })
                                            ) : (
                                                // Regular formatting for other features
                                                progressions.map((progression: FeatureProgression, progIndex: number) => (
                                                    <div key={progIndex} className="flex items-start gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditProgression(progression)}
                                                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-left"
                                                            title="Edit progression details"
                                                        >
                                                            {(() => {
                                                                const strategy = displayStrategyFactory.createStrategy(DisplayType.Edit);
                                                                const result = strategy.formatProgression(progression);
                                                                return result.formattedValue;
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
                                                ))
                                            )}
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
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-gray-500 text-center py-4 border border-dashed border-gray-300 rounded-md dark:border-gray-600">
                        {emptyMessage}
                    </div>
                )}
            </div>

            {/* Feature Selection Dialog */}
            <ListSelectionDialog<Feature, { id: number; name: string; description: string; slug: string }>
                isOpen={isFeatureSelectionOpen}
                onClose={() => setIsFeatureSelectionOpen(false)}
                onSave={(features) => {
                    // Handle all selected features - call onAddFeature for each one
                    features.forEach(feature => {
                        handleFeatureSelected(feature);
                    });
                }}
                initialSelectedIds={featureProgressions.map(p => p.featureId)}
                parentId={contextId}
                serviceFunction={async () => {
                    const response = await FeatureSystemApi.getFeatures({ sourceType: contextType });
                    return response;
                }}
                storageKey="feature-selection"
                itemDesc="feature"
                createNewRoute="/features/new/edit"
                transformSelectedItems={(features) => features.map(f => ({
                    id: f.id,
                    name: f.name,
                    description: f.description,
                    slug: f.slug
                }))}
                dialogTitle="Select Features"
                createNewButtonText="Create New Feature"
            />
        </>
    );
}
