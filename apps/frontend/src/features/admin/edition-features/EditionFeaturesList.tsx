import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthAuto } from '@/components/auth';
import { FeatureEditForm } from '@/components/feature-system/FeatureEditForm';
import { FeatureQueryHooks } from '@/components/feature-system/FeatureQueryHooks';
import { FeaturesManager } from '@/components/feature-system/FeaturesManager';
import { FeatureSystemApi } from '@/components/feature-system/FeatureSystemApi';
import { CustomSelect } from '@/components/forms/FormComponents';
import { Feature, FeatureWithRelations } from '@shared/schema';
import { EditionId, FeatureSourceType, EDITION_LIST } from '@shared/static-data';

import { EditionFeaturesApi } from './EditionFeaturesApi';

export default function EditionFeaturesList() {
    const { isLoading: isAuthLoading, isAdmin } = useAuthAuto();
    const [selectedEditionId, setSelectedEditionId] = useState<number | null>(EditionId.DND_3_5E);
    const [editionProgressions, setEditionProgressions] = useState<FeatureWithRelations[]>([]);
    const editionProgressionsRef = useRef<FeatureWithRelations[]>([]);
    const [_isLoading, setIsLoading] = useState(false);
    const [editingProgression, setEditingProgression] = useState<FeatureWithRelations | null>(null);
    const [isProgressionDialogOpen, setIsProgressionDialogOpen] = useState(false);
    const [preSelectedFeature, setPreSelectedFeature] = useState<Feature | null>(null);

    // Keep ref in sync with state
    useEffect(() => {
        editionProgressionsRef.current = editionProgressions;
    }, [editionProgressions]);

    // Load edition features when selectedEditionId changes
    useEffect(() => {
        if (!selectedEditionId) {
            setEditionProgressions([]);
            return;
        }

        let isMounted = true;

        const loadEditionProgressions = async () => {
            setIsLoading(true);
            try {
                const features = await EditionFeaturesApi.getEditionFeatures(selectedEditionId);
                if (isMounted) {
                    setEditionProgressions(features);
                }
            } catch (error) {
                console.error('Failed to load edition features:', error);
                if (isMounted) {
                    setEditionProgressions([]);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadEditionProgressions();

        return () => {
            isMounted = false;
        };
    }, [selectedEditionId]);

    const handleAddFeature = useCallback(async (feature: { id: number; name: string; description: string; slug: string }) => {
        if (!selectedEditionId) return;

        // Create a default feature for the new feature
        const defaultProgression: FeatureWithRelations = {
            id: feature.id,
            name: feature.name,
            slug: feature.slug,
            description: feature.description,
            displayInCharacterSheet: true,
            sourceType: FeatureSourceType.Edition,
            level: 1,
            editionId: selectedEditionId,
            domainId: null,
            featId: null,
            companionId: null,
            entities: [],
            prerequisites: []
        };

        setEditionProgressions(prev => [...prev, defaultProgression]);
    }, [selectedEditionId]);

    const handleEditProgression = useCallback((feature: FeatureWithRelations) => {
        setEditingProgression(feature);
        setIsProgressionDialogOpen(true);
    }, []);

    const handleRemoveProgression = useCallback(async (featureId: number) => {
        if (!selectedEditionId) return;

        // Use ref to get current state without dependency
        const feature = editionProgressionsRef.current.find(p => p.id === featureId);
        if (!feature) return;

        try {
            // Remove from backend - get all features for this feature and filter out the one to delete
            const allProgressions = await FeatureQueryHooks.getFeatureProgressions(feature.id);
            const remainingProgressions = allProgressions
                .filter(p => p.id !== featureId)
                .map(p => ({
                    id: p.id,
                    level: p.level,
                    sourceType: p.sourceType,
                    domainId: p.domainId,
                    featId: p.featId,
                    companionId: p.companionId,
                    editionId: p.editionId,
                    entities: p.entities || [],
                }));

            await FeatureSystemApi.updateFeatures(
                { features: remainingProgressions },
                { id: feature.id }
            );

            // Reload features for the current edition
            const updatedProgressions = await EditionFeaturesApi.getEditionFeatures(selectedEditionId);
            setEditionProgressions(updatedProgressions);
        } catch (error) {
            console.error('Failed to remove feature:', error);
        }
    }, [selectedEditionId]);

    const handleSaveProgression = useCallback(async (feature: FeatureWithRelations) => {
        if (!selectedEditionId || !feature.id) return;

        // Ensure sourceType and editionId are set correctly
        const progressionToSave: FeatureWithRelations = {
            ...feature,
            sourceType: FeatureSourceType.Edition,
            editionId: selectedEditionId,
            domainId: null,
            featId: null,
            companionId: null,
        };

        try {
            // Get all existing features for this feature
            const allProgressions = await FeatureQueryHooks.getFeatureProgressions(progressionToSave.id);

            // Check if this is a new feature (id is 0, null, undefined, or a temporary ID > 1000000000000)
            const isTemporaryId = editingProgression && editingProgression.id && editingProgression.id > 1000000000000;
            const isNewProgression = !editingProgression ||
                editingProgression.id === 0 ||
                editingProgression.id === null ||
                editingProgression.id === undefined ||
                isTemporaryId ||
                !allProgressions.some(p => p.id === editingProgression.id);

            let progressionsToSave;
            if (!isNewProgression && editingProgression && editingProgression.id) {
                // Update existing feature - replace the edited one
                // Strip nested objects like RaceEdit does
                const { id: _progId, ...progressionData } = progressionToSave;
                progressionsToSave = allProgressions.map(p => {
                    if (p.id === editingProgression.id) {
                        return {
                            ...progressionData,
                            id: editingProgression.id,
                            sourceType: FeatureSourceType.Edition,
                            domainId: null,
                            featId: null,
                            companionId: null,
                            editionId: selectedEditionId,
                            entities: (progressionToSave.entities || []).map(entity => {
                                const { id: _entityId, featureId: _featureId, ...entityData } = entity;
                                return entityData;
                            }),
                        };
                    } else {
                        const { id: _progId2, ...progData } = p;
                        return {
                            ...progData,
                            id: p.id,
                            entities: (p.entities || []).map(entity => {
                                const { id: _entityId, featureId: _featureId, ...entityData } = entity;
                                return entityData;
                            }),
                        };
                    }
                });
            } else {
                // Create new feature - add to existing ones
                // Strip temporary ID and nested objects like RaceEdit does
                const { id: _, ...progressionData } = progressionToSave;
                const newProgression = {
                    ...progressionData,
                    id: 0, // Will be assigned by backend
                    sourceType: FeatureSourceType.Edition,
                    domainId: null,
                    featId: null,
                    companionId: null,
                    editionId: selectedEditionId,
                    entities: (progressionToSave.entities || []).map(entity => {
                        const { id: _entityId, featureId: _featureId, ...entityData } = entity;
                        return entityData;
                    }),
                };
                progressionsToSave = [...allProgressions.map(p => {
                    const { id: _progId, ...progData } = p;
                    return {
                        ...progData,
                        id: p.id,
                        entities: (p.entities || []).map(entity => {
                            const { id: _entityId, featureId: _featureId, ...entityData } = entity;
                            return entityData;
                        }),
                    };
                }), newProgression];
            }

            await FeatureSystemApi.updateFeatures(
                { features: progressionsToSave },
                { id: progressionToSave.id }
            );

            // Reload features for the current edition
            const updatedProgressions = await EditionFeaturesApi.getEditionFeatures(selectedEditionId);
            setEditionProgressions(updatedProgressions);
            setIsProgressionDialogOpen(false);
            setEditingProgression(null);
            setPreSelectedFeature(null);
        } catch (error) {
            console.error('Failed to save feature:', error);
        }
    }, [selectedEditionId, editingProgression]);

    if (isAuthLoading) {
        return <div className="p-4">Loading...</div>;
    }

    if (!isAdmin) {
        return <div className="p-4">Access denied. Admin privileges required.</div>;
    }

    const selectedEdition = selectedEditionId ? EDITION_LIST.find(e => e.id === selectedEditionId) : null;
    const editionName = selectedEdition?.name || 'Unknown Edition';

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Edition Features Management</h1>
            <p className="text-gray-600 mb-4">
                Manage edition-specific features that apply to all characters with a matching edition.
                These features typically include feat feature and ability score increases.
            </p>

            <div className="mb-4">
                <CustomSelect
                    value={selectedEditionId ?? null}
                    onValueChange={(value) => setSelectedEditionId(value)}
                    options={EDITION_LIST}
                    placeholder="Select Edition"
                    label="Select Edition"
                    componentExtraClassName="max-w-xs"
                />
            </div>

            {selectedEditionId && (
                <FeaturesManager
                    state={{
                        features: editionProgressions,
                        editingProgression,
                        isProgressionDialogOpen,
                        preSelectedFeature
                    }}
                    updateState={(update) => {
                        if (update.type === 'SET_EDITING_PROGRESSION') {
                            setEditingProgression(update.payload.editingProgression);
                        } else if (update.type === 'SET_IS_PROGRESSION_DIALOG_OPEN') {
                            setIsProgressionDialogOpen(update.payload.isProgressionDialogOpen);
                        } else if (update.type === 'SET_PRE_SELECTED_FEATURE') {
                            setPreSelectedFeature(update.payload.preSelectedFeature);
                        } else if (update.type === 'REMOVE_FEATURE_PROGRESSION') {
                            handleRemoveProgression(update.payload.featureId);
                        } else if (update.type === 'SET_FEATURES') {
                            setEditionProgressions(update.payload.features);
                        }
                    }}
                    contextType={FeatureSourceType.Edition}
                    contextId={selectedEditionId}
                    title={`${editionName} Features`}
                    emptyMessage={`No edition features configured for ${editionName}. Add features to define feat feature, ability score increases, etc.`}
                />
            )}

            {isProgressionDialogOpen && (
                <FeatureEditForm
                    isOpen={isProgressionDialogOpen}
                    onClose={() => {
                        setIsProgressionDialogOpen(false);
                        setEditingProgression(null);
                        setPreSelectedFeature(null);
                    }}
                    featureId={
                        Number(editingProgression?.id ?? preSelectedFeature?.id ?? 0) || 0
                    }
                    onSave={async (featureId: number) => {
                        const feature = await FeatureQueryHooks.getFeatureById(featureId);
                        if (feature) {
                            // Ensure sourceType and editionId are set correctly before saving
                            const featureWithEdition: FeatureWithRelations = {
                                ...feature as FeatureWithRelations,
                                sourceType: FeatureSourceType.Edition,
                                editionId: selectedEditionId ?? undefined,
                            };
                            handleSaveProgression(featureWithEdition);
                        }
                    }}
                    mode="modal"
                // Note: edition not supported in FeatureEditContext, editionId is set directly on feature
                />
            )}
        </div>
    );
}
