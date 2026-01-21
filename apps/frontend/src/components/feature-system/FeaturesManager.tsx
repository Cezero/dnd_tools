import { useQueryClient } from '@tanstack/react-query';
import React, { useState, useEffect, useMemo, useRef } from 'react';

import { FeatureDisplay } from '@/components/feature-system/FeatureDisplay';
import { FeatureEditForm } from '@/components/feature-system/FeatureEditForm';
import { FeatureSystemApi } from '@/components/feature-system/FeatureSystemApi';
import { ListSelectionDialog } from '@/components/generic-list';
import { usePrecacheFeatureEntities } from '@/lib/formatters/hooks/usePrecacheFeatureEntities';
import { FeatureQueryHooks } from '@/services/query/FeatureQueryHooks';
import { useFeatureStateStore } from '@/lib/stores/FeatureStateStore';
import { Feature, FeatureWithRelations } from '@shared/schema';

import type { EditState, FeaturesManagerProps, MinimalFeatureState } from './types';
import { ClassEditStateUpdateType } from '../../features/class/types';
import { RaceEditStateUpdateType } from '../../features/race/types';

// Type guard function - must be defined before use
const isMinimalState = (s: EditState | MinimalFeatureState): s is MinimalFeatureState => {
    return !('classId' in s) && !('raceId' in s);
};

export function FeaturesManager({
    state,
    updateState,
    contextType,
    contextId: propContextId,
    parentType,
    title,
    emptyMessage,
    excludeSpecialFeatures = []
}: FeaturesManagerProps): React.JSX.Element {
    const [isFeatureSelectionOpen, setIsFeatureSelectionOpen] = useState(false);
    const [isFeatureEditOpen, setIsFeatureEditOpen] = useState(false);
    const [isNewFeatureDialogOpen, setIsNewFeatureDialogOpen] = useState(false);
    const [editingFeatureId, setEditingFeatureId] = useState<number | 'new' | undefined>(undefined);
    const queryClient = useQueryClient();
    const featureStateStore = useFeatureStateStore();

    // Get featureIds from state (for ClassEditState/RaceEditState) or features array (for MinimalFeatureState)
    const featureIds = useMemo(() => {
        if (isMinimalState(state)) {
            return state.features.map(f => f.id);
        } else if ('featureIds' in state) {
            return state.featureIds;
        } else {
            // Fallback for old state structure (should not happen after migration)
            return [];
        }
    }, [state]);

    // Load features from FeatureStateStore
    const [features, setFeatures] = useState<FeatureWithRelations[]>([]);
    const [isLoadingFeatures, setIsLoadingFeatures] = useState(false);
    const prevFeatureIdsRef = useRef<number[]>([]);

    useEffect(() => {
        // Only reload if featureIds actually changed
        const featureIdsChanged = 
            prevFeatureIdsRef.current.length !== featureIds.length ||
            prevFeatureIdsRef.current.some((id, index) => id !== featureIds[index]);
        
        if (!featureIdsChanged && prevFeatureIdsRef.current.length > 0) {
            return;
        }

        const loadFeatures = async () => {
            if (featureIds.length === 0) {
                setFeatures([]);
                prevFeatureIdsRef.current = [];
                return;
            }

            setIsLoadingFeatures(true);
            try {
                const loadedFeatures: FeatureWithRelations[] = [];

                for (const featureId of featureIds) {
                    try {
                        // For read-only viewing, use loadFeatureData to avoid creating sessions
                        const featureData = await featureStateStore.loadFeatureData(featureId);
                        if (featureData) {
                            loadedFeatures.push(featureData);
                        }
                    } catch (error) {
                        // Handle missing features gracefully - log warning but don't fail entire load
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        if (errorMessage.includes('not found') || errorMessage.includes('Not Found')) {
                            console.warn(`Feature ${featureId} not found, skipping`);
                        } else {
                            // Re-throw unexpected errors
                            throw error;
                        }
                    }
                }

                setFeatures(loadedFeatures);
                prevFeatureIdsRef.current = [...featureIds];
            } catch (error) {
                console.error('Error loading features:', error);
            } finally {
                setIsLoadingFeatures(false);
            }
        };

        loadFeatures();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [featureIds]); // Only depend on featureIds, not featureStateStore

    const getContextIdFromState = (editState: EditState | MinimalFeatureState): number => {
        if ('classId' in editState) {
            return editState.classId ?? 0;
        }
        if ('raceId' in editState) {
            return editState.raceId ?? 0;
        }
        return 0;
    };

    const contextId = propContextId ?? getContextIdFromState(state);

    // Precache all entities referenced in feature features (including prerequisites)
    const { isComplete: prereqsPrefetched } = usePrecacheFeatureEntities(features);

    // Group features by feature ID, excluding special features based on context
    const featuresByFeature = features
        .filter(feature => !excludeSpecialFeatures.includes(feature.id))
        .reduce((acc, feature) => {
            const featureId = feature.id;
            if (!acc[featureId]) {
                acc[featureId] = {
                    feature: feature,
                    features: []
                };
            }
            acc[featureId].features.push(feature);
            return acc;
        }, {} as Record<number, { feature: FeatureWithRelations; features: FeatureWithRelations[] }>);

    // Sort features by name
    const sortedFeatures = Object.values(featuresByFeature).sort((a, b) =>
        (a.feature?.name || '').localeCompare(b.feature?.name || '')
    );

    const handleEditProgression = (feature: FeatureWithRelations) => {
        // Open FeatureEditForm instead of FeatureDetailEdit
        setEditingFeatureId(feature.id);
        setIsFeatureEditOpen(true);
    };

    const handleRemoveProgression = (featureId: number) => {
        if (isMinimalState(state)) {
            updateState({ type: 'REMOVE_FEATURE_PROGRESSION', payload: { featureId } });
        } else if ('classId' in state) {
            updateState({ type: ClassEditStateUpdateType.UNLINK_FEATURE, payload: { featureId } });
        } else {
            updateState({ type: RaceEditStateUpdateType.UNLINK_FEATURE, payload: { featureId } });
        }
    };


    const handleAddProgression = (_feature: Feature) => {
        if (isMinimalState(state)) {
            // Minimal state doesn't support feature selection
            return;
        } else if ('classId' in state) {
            updateState({
                type: ClassEditStateUpdateType.SET_PRE_SELECTED_FEATURE_ID,
                payload: { preSelectedFeatureId: _feature.id }
            });
        } else {
            updateState({
                type: RaceEditStateUpdateType.SET_PRE_SELECTED_FEATURE_ID,
                payload: { preSelectedFeatureId: _feature.id }
            });
        }
    };


    const handleFeatureSave = async (feature: Feature, _progressions: FeatureWithRelations[]) => {
        await queryClient.invalidateQueries({
            queryKey: ['features'],
            exact: false
        });
        await queryClient.invalidateQueries({
            queryKey: ['features', 'item', feature.id]
        });
        await queryClient.invalidateQueries({
            queryKey: ['features', 'features', feature.id]
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

        // If this was a new feature created, link it to the parent entity
        if (wasNewFeature && feature.id) {
            try {
                // Load feature data (no session needed for linking)
                await featureStateStore.loadFeatureData(feature.id);

                // Link feature to parent entity
                if (isMinimalState(state)) {
                    updateState({
                        type: 'ADD_FEATURE_PROGRESSION',
                        payload: { feature: feature as FeatureWithRelations }
                    });
                } else if ('classId' in state) {
                    updateState({
                        type: ClassEditStateUpdateType.LINK_FEATURE,
                        payload: { featureId: feature.id }
                    });
                } else {
                    updateState({
                        type: RaceEditStateUpdateType.LINK_FEATURE,
                        payload: { featureId: feature.id }
                    });
                }
            } catch (error) {
                console.error(`Failed to link newly created feature ${feature.id}:`, error);
            }
        }
    };

    const handleFeatureEditClose = () => {
        setIsFeatureEditOpen(false);
        setEditingFeatureId(undefined);
    };

    /**
     * Handles associating existing features by linking them to the parent entity.
     * Features are loaded into the FeatureStateStore and linked via featureIds.
     */
    const handleAssociateFeatures = async (selectedFeatures: { id: number; name: string; description: string; slug: string }[]) => {
        // Get current feature IDs (excluding special features)
        const currentFeatureIds = featureIds.filter(id => !excludeSpecialFeatures.includes(id));

        // Get selected feature IDs
        const selectedFeatureIds = selectedFeatures.map(f => f.id);

        // Find features to add (newly selected)
        const featuresToAdd = selectedFeatureIds.filter(id => !currentFeatureIds.includes(id));

        // Load features into store and link them
        for (const feature of selectedFeatures.filter(f => featuresToAdd.includes(f.id))) {
            try {
                // Load feature data (no session needed for linking)
                await featureStateStore.loadFeatureData(feature.id);

                // Link feature to parent entity
                if (isMinimalState(state)) {
                    // For minimal state, we still need the full feature object
                    const featuresResponse = await FeatureSystemApi.getFeatures(undefined, { id: feature.id });
                    const fullFeature = featuresResponse[0];
                    if (fullFeature) {
                        updateState({
                            type: 'ADD_FEATURE_PROGRESSION',
                            payload: { feature: fullFeature }
                        });
                    }
                } else if ('classId' in state) {
                    updateState({
                        type: ClassEditStateUpdateType.LINK_FEATURE,
                        payload: { featureId: feature.id }
                    });
                } else {
                    updateState({
                        type: RaceEditStateUpdateType.LINK_FEATURE,
                        payload: { featureId: feature.id }
                    });
                }
            } catch (error) {
                console.error(`Failed to link feature ${feature.id}:`, error);
            }
        }
    };

    /**
     * Handles opening the create new feature dialog
     */
    const handleCreateNewFeature = () => {
        setIsNewFeatureDialogOpen(true);
        setEditingFeatureId('new');
    };

    return (
        <>
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{title}</h2>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setIsFeatureSelectionOpen(true)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                            Associate Existing Feature
                        </button>
                        <button
                            type="button"
                            onClick={handleCreateNewFeature}
                            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                        >
                            Create New Feature
                        </button>
                    </div>
                </div>

                {sortedFeatures.length > 0 ? (
                    <div className="space-y-4">
                        {sortedFeatures.map(({ feature, features: _progressions }) => (
                            <FeatureDisplay
                                key={`${feature?.id || 'unknown'}-${prereqsPrefetched ? 'prefetched' : 'loading'}`}
                                feature={feature}
                                features={_progressions}
                                onEditProgression={handleEditProgression}
                                onRemoveProgression={handleRemoveProgression}
                                onAddProgression={handleAddProgression}
                                showAddProgressionButton={true}
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

            {/* Feature Selection Dialog (Associate Existing) */}
            <ListSelectionDialog<Feature, { id: number; name: string; description: string; slug: string }>
                isOpen={isFeatureSelectionOpen}
                onClose={() => setIsFeatureSelectionOpen(false)}
                onSave={async (selectedFeatures) => {
                    await handleAssociateFeatures(selectedFeatures);
                    setIsFeatureSelectionOpen(false);
                }}
                initialSelectedIds={featureIds}
                parentId={contextId}
                parentType={parentType === 'class' || parentType === 'race' ? parentType : undefined}
                dataFetcher={async () => {
                    return await FeatureQueryHooks.getFeatures({ sourceTypes: [contextType] });
                }}
                storageKey="feature-selection"
                itemDesc="feature"
                transformSelectedItems={(features) => features.map(f => ({
                    id: f.id,
                    name: f.name,
                    description: f.description ?? '',
                    slug: f.slug
                }))}
                dialogTitle="Associate Existing Features"
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
