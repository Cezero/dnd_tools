import React, { useState } from 'react';

import { FeatureDisplay } from '@/components/feature-system/FeatureDisplay';
import { FeatureSystemApi } from '@/components/feature-system/FeatureSystemApi';
import { ListSelectionDialog } from '@/components/generic-list';
import { Feature, FeatureProgression } from '@shared/schema';
import { FeatureSourceType } from '@shared/static-data';

interface FeaturesTabProps {
    // Common props
    featureProgressions?: FeatureProgression[];
    onEditProgression?: (progression: FeatureProgression) => void;
    onRemoveProgression?: (progressionId: number) => void;
    onAddFeature?: (feature: { id: number; name: string; description: string; slug: string }) => void;

    // Context-specific props
    contextType: FeatureSourceType;
    contextId: number;
    parentType?: 'class' | 'race';

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
    parentType,
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

    const handleAddProgression = (feature: Feature) => {
        setEditingProgression?.(null);
        setPreSelectedFeature?.(feature);
        setIsProgressionDialogOpen?.(true);
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
                        {sortedFeatures.map(({ feature, progressions }) => (
                            <FeatureDisplay
                                key={feature?.id || 'unknown'}
                                feature={feature}
                                progressions={progressions}
                                onEditProgression={handleEditProgression}
                                onRemoveProgression={handleRemoveProgression}
                                onAddProgression={handleAddProgression}
                                showAddProgressionButton={true}
                            />
                        ))}
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
                    // Get current feature IDs (excluding special features)
                    const currentFeatureIds = featureProgressions
                        .filter(p => !excludeSpecialFeatures.includes(p.featureId))
                        .map(p => p.featureId);

                    // Get selected feature IDs
                    const selectedFeatureIds = features.map(f => f.id);

                    // Find features to add (newly selected)
                    const featuresToAdd = selectedFeatureIds.filter(id => !currentFeatureIds.includes(id));

                    // Only call onAddFeature for newly selected features
                    features
                        .filter(feature => featuresToAdd.includes(feature.id))
                        .forEach(feature => {
                            handleFeatureSelected(feature);
                        });
                }}
                initialSelectedIds={featureProgressions.map(p => p.featureId)}
                parentId={contextId}
                parentType={parentType}
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
