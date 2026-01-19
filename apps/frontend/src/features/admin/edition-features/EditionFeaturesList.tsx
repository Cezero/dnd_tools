import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthAuto } from '@/components/auth';
import { FeatureProgressionDetailEdit } from '@/components/feature-system';
import { FeaturesManager } from '@/components/feature-system/FeaturesManager';
import { FeatureSystemApi } from '@/components/feature-system/FeatureSystemApi';
import { CustomSelect } from '@/components/forms/FormComponents';
import { FeatureQueryHooks } from '@/services/query/FeatureQueryHooks';
import { Feature, FeatureProgression } from '@shared/schema';
import { EditionId, FeatureSourceType, EDITION_LIST } from '@shared/static-data';

import { EditionFeaturesApi } from './EditionFeaturesApi';

export default function EditionFeaturesList() {
    const { isLoading: isAuthLoading, isAdmin } = useAuthAuto();
    const [selectedEditionId, setSelectedEditionId] = useState<number | null>(EditionId.DND_3_5E);
    const [editionProgressions, setEditionProgressions] = useState<FeatureProgression[]>([]);
    const editionProgressionsRef = useRef<FeatureProgression[]>([]);
    const [_isLoading, setIsLoading] = useState(false);
    const [editingProgression, setEditingProgression] = useState<FeatureProgression | null>(null);
    const [isProgressionDialogOpen, setIsProgressionDialogOpen] = useState(false);
    const [preSelectedFeature, setPreSelectedFeature] = useState<Feature | null>(null);

    // Keep ref in sync with state
    useEffect(() => {
        editionProgressionsRef.current = editionProgressions;
    }, [editionProgressions]);

    // Load edition progressions when selectedEditionId changes
    useEffect(() => {
        if (!selectedEditionId) {
            setEditionProgressions([]);
            return;
        }

        let isMounted = true;

        const loadEditionProgressions = async () => {
            setIsLoading(true);
            try {
                const progressions = await EditionFeaturesApi.getEditionFeatureProgressions(selectedEditionId);
                if (isMounted) {
                    setEditionProgressions(progressions);
                }
            } catch (error) {
                console.error('Failed to load edition progressions:', error);
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

        // Create a default progression for the new feature
        const defaultProgression: FeatureProgression = {
            id: Date.now() + Math.random(),
            sourceType: FeatureSourceType.Edition,
            domainId: null,
            featId: null,
            companionId: null,
            editionId: selectedEditionId,
            level: 1,
            featureId: feature.id,
            entities: [],
            feature: {
                id: feature.id,
                name: feature.name,
                slug: feature.slug,
                description: feature.description,
                displayInCharacterSheet: true,
                prerequisites: [],
            }
        };

        setEditionProgressions(prev => [...prev, defaultProgression]);
    }, [selectedEditionId]);

    const handleEditProgression = useCallback((progression: FeatureProgression) => {
        setEditingProgression(progression);
        setIsProgressionDialogOpen(true);
    }, []);

    const handleRemoveProgression = useCallback(async (progressionId: number) => {
        if (!selectedEditionId) return;

        // Use ref to get current state without dependency
        const progression = editionProgressionsRef.current.find(p => p.id === progressionId);
        if (!progression) return;

        try {
            // Remove from backend - get all progressions for this feature and filter out the one to delete
            const allProgressions = await FeatureQueryHooks.getFeatureProgressions(progression.featureId);
            const remainingProgressions = allProgressions
                .filter(p => p.id !== progressionId)
                .map(p => ({
                    id: p.id,
                    level: p.level,
                    sourceType: p.sourceType,
                    featureId: p.featureId,
                    domainId: p.domainId,
                    featId: p.featId,
                    companionId: p.companionId,
                    editionId: p.editionId,
                    entities: p.entities || [],
                }));

            await FeatureSystemApi.updateFeatureProgressions(
                { progressions: remainingProgressions },
                { id: progression.featureId }
            );

            // Reload progressions for the current edition
            const updatedProgressions = await EditionFeaturesApi.getEditionFeatureProgressions(selectedEditionId);
            setEditionProgressions(updatedProgressions);
        } catch (error) {
            console.error('Failed to remove progression:', error);
        }
    }, [selectedEditionId]);

    const handleSaveProgression = useCallback(async (progression: FeatureProgression) => {
        if (!selectedEditionId || !progression.featureId) return;

        // Ensure sourceType and editionId are set correctly
        const progressionToSave: FeatureProgression = {
            ...progression,
            sourceType: FeatureSourceType.Edition,
            editionId: selectedEditionId,
            domainId: null,
            featId: null,
            companionId: null,
        };

        try {
            // Get all existing progressions for this feature
            const allProgressions = await FeatureQueryHooks.getFeatureProgressions(progressionToSave.featureId);

            // Check if this is a new progression (id is 0, null, undefined, or a temporary ID > 1000000000000)
            const isTemporaryId = editingProgression && editingProgression.id && editingProgression.id > 1000000000000;
            const isNewProgression = !editingProgression ||
                editingProgression.id === 0 ||
                editingProgression.id === null ||
                editingProgression.id === undefined ||
                isTemporaryId ||
                !allProgressions.some(p => p.id === editingProgression.id);

            let progressionsToSave;
            if (!isNewProgression && editingProgression && editingProgression.id) {
                // Update existing progression - replace the edited one
                // Strip nested objects like RaceEdit does
                const { id: _progId, feature: _progFeature, ...progressionData } = progressionToSave;
                progressionsToSave = allProgressions.map(p => {
                    if (p.id === editingProgression.id) {
                        return {
                            ...progressionData,
                            id: editingProgression.id,
                            sourceType: FeatureSourceType.Edition,
                            featureId: progressionToSave.featureId,
                            domainId: null,
                            featId: null,
                            companionId: null,
                            editionId: selectedEditionId,
                            entities: (progressionToSave.entities || []).map(entity => {
                                const { id: _entityId, progressionId: _progressionId, ...entityData } = entity;
                                return entityData;
                            }),
                        };
                    } else {
                        const { id: _progId2, feature: _progFeature2, ...progData } = p;
                        return {
                            ...progData,
                            id: p.id,
                            entities: (p.entities || []).map(entity => {
                                const { id: _entityId, progressionId: _progressionId, ...entityData } = entity;
                                return entityData;
                            }),
                        };
                    }
                });
            } else {
                // Create new progression - add to existing ones
                // Strip temporary ID and nested objects like RaceEdit does
                const { id: _, feature: _feature, ...progressionData } = progressionToSave;
                const newProgression = {
                    ...progressionData,
                    id: 0, // Will be assigned by backend
                    sourceType: FeatureSourceType.Edition,
                    featureId: progressionToSave.featureId,
                    domainId: null,
                    featId: null,
                    companionId: null,
                    editionId: selectedEditionId,
                    entities: (progressionToSave.entities || []).map(entity => {
                        const { id: _entityId, progressionId: _progressionId, ...entityData } = entity;
                        return entityData;
                    }),
                };
                progressionsToSave = [...allProgressions.map(p => {
                    const { id: _progId, feature: _progFeature, ...progData } = p;
                    return {
                        ...progData,
                        id: p.id,
                        entities: (p.entities || []).map(entity => {
                            const { id: _entityId, progressionId: _progressionId, ...entityData } = entity;
                            return entityData;
                        }),
                    };
                }), newProgression];
            }

            await FeatureSystemApi.updateFeatureProgressions(
                { progressions: progressionsToSave },
                { id: progressionToSave.featureId }
            );

            // Reload progressions for the current edition
            const updatedProgressions = await EditionFeaturesApi.getEditionFeatureProgressions(selectedEditionId);
            setEditionProgressions(updatedProgressions);
            setIsProgressionDialogOpen(false);
            setEditingProgression(null);
            setPreSelectedFeature(null);
        } catch (error) {
            console.error('Failed to save progression:', error);
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
                These features typically include feat progression and ability score increases.
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
                    featureProgressions={editionProgressions}
                    onEditProgression={handleEditProgression}
                    onRemoveProgression={handleRemoveProgression}
                    onAddFeature={handleAddFeature}
                    contextType={FeatureSourceType.Edition}
                    contextId={selectedEditionId}
                    title={`${editionName} Features`}
                    emptyMessage={`No edition features configured for ${editionName}. Add features to define feat progression, ability score increases, etc.`}
                    setEditingProgression={setEditingProgression}
                    setPreSelectedFeature={setPreSelectedFeature}
                    setIsProgressionDialogOpen={setIsProgressionDialogOpen}
                />
            )}

            {isProgressionDialogOpen && (
                <FeatureProgressionDetailEdit
                    isOpen={isProgressionDialogOpen}
                    onClose={() => {
                        setIsProgressionDialogOpen(false);
                        setEditingProgression(null);
                        setPreSelectedFeature(null);
                    }}
                    onSave={handleSaveProgression}
                    progression={editingProgression ? {
                        ...editingProgression,
                        sourceType: FeatureSourceType.Edition,
                        editionId: selectedEditionId,
                    } : null}
                    preSelectedFeature={preSelectedFeature}
                    showSourceTypeSelector={false}
                />
            )}
        </div>
    );
}
