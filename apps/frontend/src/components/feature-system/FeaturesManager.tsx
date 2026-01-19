import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';

import { FeatureDisplay } from '@/components/feature-system/FeatureDisplay';
import { FeatureEditForm } from '@/components/feature-system/FeatureEditForm';
import { ListSelectionDialog } from '@/components/generic-list';
import { usePrecacheFeatureEntities } from '@/lib/formatters/hooks/usePrecacheFeatureEntities';
import { FeatureQueryHooks } from '@/services/query/FeatureQueryHooks';
import { Feature, FeatureProgression } from '@shared/schema';
import { FeatureSourceType } from '@shared/static-data';

import type { ClassEditState, ClassEditStateUpdate } from '../../features/class/types';
import { ClassEditStateUpdateType } from '../../features/class/types';
import type { RaceEditState, RaceEditStateUpdate } from '../../features/race/types';
import { RaceEditStateUpdateType } from '../../features/race/types';

type EditState = ClassEditState | RaceEditState;
type EditStateUpdate = ClassEditStateUpdate | RaceEditStateUpdate;

interface FeaturesManagerProps {
    // State-based props (preferred for ClassEdit/RaceEdit)
    state?: EditState;
    updateState?: (update: EditStateUpdate) => void;

    // Legacy props (for backward compatibility with FeatEdit/CompanionEdit)
    featureProgressions?: FeatureProgression[];
    onEditProgression?: (progression: FeatureProgression) => void;
    onRemoveProgression?: (progressionId: number) => void;
    onAddFeature?: (feature: { id: number; name: string; description: string; slug: string }) => void;

    // Context-specific props
    contextType: FeatureSourceType;
    contextId?: number; // Optional when using state-based pattern
    parentType?: 'class' | 'race' | 'domain' | 'feat';

    // UI text props
    title: string;
    emptyMessage: string;

    // Special feature filtering
    excludeSpecialFeatures?: number[];

    // Dialog state management (legacy - only used if state/updateState not provided)
    setEditingProgression?: (progression: FeatureProgression | null) => void;
    setPreSelectedFeature?: (feature: FeatureProgression['feature'] | null) => void;
    setIsProgressionDialogOpen?: (open: boolean) => void;
}

export function FeaturesManager({
    state,
    updateState,
    featureProgressions: propFeatureProgressions = [],
    onEditProgression,
    onRemoveProgression,
    onAddFeature,
    contextType,
    contextId: propContextId,
    parentType,
    title,
    emptyMessage,
    excludeSpecialFeatures = [],
    setEditingProgression,
    setPreSelectedFeature,
    setIsProgressionDialogOpen
}: FeaturesManagerProps): React.JSX.Element {
    const [isFeatureSelectionOpen, setIsFeatureSelectionOpen] = useState(false);
    const [isFeatureEditOpen, setIsFeatureEditOpen] = useState(false);
    const [isNewFeatureDialogOpen, setIsNewFeatureDialogOpen] = useState(false);
    const [editingFeatureId, setEditingFeatureId] = useState<number | 'new' | undefined>(undefined);
    const queryClient = useQueryClient();

    // Use state-based pattern if state/updateState provided, otherwise use legacy props
    const isStateBased = state !== undefined && updateState !== undefined;
    const featureProgressions = isStateBased ? state.featureProgressions : propFeatureProgressions;

    // Type guard to determine if state is ClassEditState or RaceEditState
    const getContextIdFromState = (editState: EditState): number => {
        if ('classId' in editState) {
            return editState.classId ?? 0;
        }
        if ('raceId' in editState) {
            return editState.raceId ?? 0;
        }
        return 0;
    };

    const contextId = isStateBased
        ? getContextIdFromState(state)
        : (propContextId ?? 0);

    // Precache all entities referenced in feature progressions (including prerequisites)
    const { isComplete: prereqsPrefetched } = usePrecacheFeatureEntities(featureProgressions);

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
        if (isStateBased && updateState) {
            // Use state-based pattern
            if ('classId' in state) {
                updateState({ type: ClassEditStateUpdateType.SET_EDITING_PROGRESSION, payload: { editingProgression: progression } });
                updateState({ type: ClassEditStateUpdateType.SET_IS_PROGRESSION_DIALOG_OPEN, payload: { isProgressionDialogOpen: true } });
            } else {
                updateState({ type: RaceEditStateUpdateType.SET_EDITING_PROGRESSION, payload: { editingProgression: progression } });
                updateState({ type: RaceEditStateUpdateType.SET_IS_PROGRESSION_DIALOG_OPEN, payload: { isProgressionDialogOpen: true } });
            }
        } else {
            // Use legacy callback pattern
            onEditProgression?.(progression);
        }
    };

    const handleRemoveProgression = (progressionId: number) => {
        if (isStateBased && updateState) {
            // Use state-based pattern
            if ('classId' in state) {
                updateState({ type: ClassEditStateUpdateType.REMOVE_FEATURE_PROGRESSION, payload: { progressionId } });
            } else {
                updateState({ type: RaceEditStateUpdateType.REMOVE_FEATURE_PROGRESSION, payload: { progressionId } });
            }
        } else {
            // Use legacy callback pattern
            onRemoveProgression?.(progressionId);
        }
    };

    const handleFeatureSelected = (feature: { id: number; name: string; description: string; slug: string }) => {
        if (isStateBased && updateState) {
            // For state-based pattern, we need to create a new progression
            // This will be handled by the parent component when the progression dialog opens
            // For now, just open the progression dialog with the pre-selected feature
            if ('classId' in state) {
                updateState({
                    type: ClassEditStateUpdateType.SET_PRE_SELECTED_FEATURE,
                    payload: { preSelectedFeature: { id: feature.id, name: feature.name, description: feature.description, slug: feature.slug } as FeatureProgression['feature'] }
                });
                updateState({ type: ClassEditStateUpdateType.SET_IS_PROGRESSION_DIALOG_OPEN, payload: { isProgressionDialogOpen: true } });
            } else {
                updateState({
                    type: RaceEditStateUpdateType.SET_PRE_SELECTED_FEATURE,
                    payload: { preSelectedFeature: { id: feature.id, name: feature.name, description: feature.description, slug: feature.slug } as FeatureProgression['feature'] }
                });
                updateState({ type: RaceEditStateUpdateType.SET_IS_PROGRESSION_DIALOG_OPEN, payload: { isProgressionDialogOpen: true } });
            }
        } else {
            // Use legacy callback pattern
            onAddFeature?.(feature);
        }
    };

    const handleAddProgression = (_feature: Feature) => {
        if (isStateBased && updateState) {
            // Use state-based pattern
            if ('classId' in state) {
                updateState({ type: ClassEditStateUpdateType.SET_EDITING_PROGRESSION, payload: { editingProgression: null } });
                updateState({
                    type: ClassEditStateUpdateType.SET_PRE_SELECTED_FEATURE,
                    payload: { preSelectedFeature: _feature as FeatureProgression['feature'] }
                });
                updateState({ type: ClassEditStateUpdateType.SET_IS_PROGRESSION_DIALOG_OPEN, payload: { isProgressionDialogOpen: true } });
            } else {
                updateState({ type: RaceEditStateUpdateType.SET_EDITING_PROGRESSION, payload: { editingProgression: null } });
                updateState({
                    type: RaceEditStateUpdateType.SET_PRE_SELECTED_FEATURE,
                    payload: { preSelectedFeature: _feature as FeatureProgression['feature'] }
                });
                updateState({ type: RaceEditStateUpdateType.SET_IS_PROGRESSION_DIALOG_OPEN, payload: { isProgressionDialogOpen: true } });
            }
        } else {
            // Use legacy callback pattern
            setEditingProgression?.(null);
            setPreSelectedFeature?.(_feature);
            setIsProgressionDialogOpen?.(true);
        }
    };

    const handleEditFeature = (featureId: number) => {
        setEditingFeatureId(featureId);
        setIsFeatureEditOpen(true);
    };

    const handleFeatureSave = async (feature: Feature, _progressions: FeatureProgression[]) => {
        await queryClient.invalidateQueries({
            queryKey: ['features'],
            exact: false
        });
        await queryClient.invalidateQueries({
            queryKey: ['features', 'item', feature.id]
        });
        await queryClient.invalidateQueries({
            queryKey: ['features', 'progressions', feature.id]
        });

        if (parentType === 'class' && contextId) {
            await queryClient.invalidateQueries({
                queryKey: ['classes', 'item', contextId]
            });
            await queryClient.invalidateQueries({
                queryKey: ['classes'],
                exact: false
            });
        }
        if (parentType === 'race' && contextId) {
            await queryClient.invalidateQueries({
                queryKey: ['races', 'item', contextId]
            });
            await queryClient.invalidateQueries({
                queryKey: ['races'],
                exact: false
            });
        }
        if (parentType === 'domain' && contextId) {
            await queryClient.invalidateQueries({
                queryKey: ['domains', 'item', contextId]
            });
            await queryClient.invalidateQueries({
                queryKey: ['domains'],
                exact: false
            });
        }
        if (parentType === 'feat' && contextId) {
            await queryClient.invalidateQueries({
                queryKey: ['feats', 'item', contextId]
            });
            await queryClient.invalidateQueries({
                queryKey: ['feats'],
                exact: false
            });
            await queryClient.invalidateQueries({
                queryKey: ['feats-cache'],
                exact: false
            });
        }

        const wasNewFeature = editingFeatureId === 'new' || isNewFeatureDialogOpen;

        setIsFeatureEditOpen(false);
        setIsNewFeatureDialogOpen(false);
        setEditingFeatureId(undefined);

        // If this was a new feature created from the selection dialog, automatically add it
        if (wasNewFeature) {
            if (isStateBased && updateState) {
                // Use state-based pattern - open progression dialog with pre-selected feature
                if ('classId' in state) {
                    updateState({
                        type: ClassEditStateUpdateType.SET_PRE_SELECTED_FEATURE,
                        payload: { preSelectedFeature: { id: feature.id, name: feature.name, description: feature.description, slug: feature.slug } as FeatureProgression['feature'] }
                    });
                    updateState({ type: ClassEditStateUpdateType.SET_IS_PROGRESSION_DIALOG_OPEN, payload: { isProgressionDialogOpen: true } });
                } else {
                    updateState({
                        type: RaceEditStateUpdateType.SET_PRE_SELECTED_FEATURE,
                        payload: { preSelectedFeature: { id: feature.id, name: feature.name, description: feature.description, slug: feature.slug } as FeatureProgression['feature'] }
                    });
                    updateState({ type: RaceEditStateUpdateType.SET_IS_PROGRESSION_DIALOG_OPEN, payload: { isProgressionDialogOpen: true } });
                }
            } else if (onAddFeature) {
                // Use legacy callback pattern
                onAddFeature({
                    id: feature.id,
                    name: feature.name,
                    description: feature.description ?? '',
                    slug: feature.slug
                });
            }
        }
    };

    const handleFeatureEditClose = () => {
        setIsFeatureEditOpen(false);
        setEditingFeatureId(undefined);
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
                        {sortedFeatures.map(({ feature, progressions: _progressions }) => (
                            <FeatureDisplay
                                key={`${feature?.id || 'unknown'}-${prereqsPrefetched ? 'prefetched' : 'loading'}`}
                                feature={feature}
                                progressions={_progressions}
                                onEditProgression={handleEditProgression}
                                onRemoveProgression={handleRemoveProgression}
                                onAddProgression={handleAddProgression}
                                showAddProgressionButton={true}
                                onEditFeature={handleEditFeature}
                                parentType={parentType === 'class' || parentType === 'race' ? parentType : undefined}
                                parentId={contextId}
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
                parentType={parentType === 'class' || parentType === 'race' ? parentType : undefined}
                dataFetcher={async () => {
                    return await FeatureQueryHooks.getFeatures({ requestData: { sourceTypes: [contextType] } });
                }}
                storageKey="feature-selection"
                itemDesc="feature"
                createNewRoute="/features/new/edit"
                onCreateNew={() => {
                    setIsFeatureSelectionOpen(false);
                    setIsNewFeatureDialogOpen(true);
                    setEditingFeatureId('new');
                }}
                transformSelectedItems={(features) => features.map(f => ({
                    id: f.id,
                    name: f.name,
                    description: f.description ?? '',
                    slug: f.slug
                }))}
                dialogTitle="Select Features"
                createNewButtonText="Create New Feature"
            />

            {/* Feature Edit Dialog */}
            {editingFeatureId !== undefined && (
                <FeatureEditForm
                    featureId={editingFeatureId}
                    isOpen={isFeatureEditOpen || isNewFeatureDialogOpen}
                    onClose={() => {
                        handleFeatureEditClose();
                        setIsNewFeatureDialogOpen(false);
                    }}
                    onSave={handleFeatureSave}
                    mode="modal"
                    context={parentType ? {
                        sourceType: contextType,
                        parentId: contextId,
                        parentType: parentType
                    } : undefined}
                />
            )}
        </>
    );
}
