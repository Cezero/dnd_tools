import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import {
    ValidatedForm,
    ValidatedInput,
    useValidatedForm,
} from '@/components/forms';
import { CustomSelect } from '@/components/forms/FormComponents';
import { MonsterSearchInput } from '@/components/forms/MonsterSearchInput';
import { FeatureProgressionDetailEdit } from '@/components/feature-system/FeatureProgressionDetailEdit';
import { FeaturesManager } from '@/components/feature-system/FeaturesManager';
import { CompanionQueryHooks } from '@/services/query/CompanionQueryHooks';
import { FeatureSystemApi } from '@/components/feature-system/FeatureSystemApi';
import { CacheQueryHooks } from '@/services/query/CacheQueryHooks';
import { CreateCompanionRequest, UpdateCompanionRequest, UpdateCompanionSchema, CreateCompanionSchema, CompanionWithRelations, FeatureProgression } from '@shared/schema';
import { COMPANION_TYPE_LIST, CompanionType, SpecialFeatureId, FeatureSourceType, MonsterTypeId } from '@shared/static-data';
import { useQueryClient } from '@tanstack/react-query';

type CompanionFormData = CreateCompanionRequest | UpdateCompanionRequest;

export function CompanionEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';
    const isNew = id === 'new';
    const queryClient = useQueryClient();

    const createMutation = CompanionQueryHooks.useCreateCompanion();
    const updateMutation = CompanionQueryHooks.useUpdateCompanion();

    const [companion, setCompanion] = useState<CompanionWithRelations | null>(null);
    const [isLoadingCompanion, setIsLoadingCompanion] = useState(false);
    const [companionError, setCompanionError] = useState<Error | null>(null);
    const [featureProgressions, setFeatureProgressions] = useState<FeatureProgression[]>([]);
    const [isProgressionDialogOpen, setIsProgressionDialogOpen] = useState(false);
    const [editingProgression, setEditingProgression] = useState<FeatureProgression | null>(null);
    const [preSelectedFeature, setPreSelectedFeature] = useState<FeatureProgression['feature'] | null>(null);
    const [isSavingProgression, setIsSavingProgression] = useState(false);

    // Fetch monster cache to get monster names
    const { data: monstersCache } = CacheQueryHooks.useMonstersCache();

    const [formData, setFormData] = useState<CompanionFormData>({
        type: CompanionType.Familiar,
        monsterId: undefined,
        minLevel: undefined,
    });

    const form = useValidatedForm(
        isNew ? CreateCompanionSchema : UpdateCompanionSchema,
        formData,
        setFormData
    );

    // Load companion data and feature progressions
    useEffect(() => {
        const fetchCompanion = async () => {
            if (isNew || !id) {
                return;
            }

            const companionId = parseInt(id, 10);
            if (isNaN(companionId)) {
                return;
            }

            try {
                setIsLoadingCompanion(true);
                setCompanionError(null);
                const fetchedCompanion = await CompanionQueryHooks.getCompanionById(companionId);
                setCompanion(fetchedCompanion);

                if (fetchedCompanion) {
                    setFormData({
                        type: fetchedCompanion.type,
                        monsterId: fetchedCompanion.monsterId,
                        minLevel: fetchedCompanion.minLevel || undefined,
                    });

                    // Use feature progressions from companion response
                    setFeatureProgressions(fetchedCompanion.features || []);
                }
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Failed to fetch companion');
                setCompanionError(error);
                console.error('Error loading companion:', error);
            } finally {
                setIsLoadingCompanion(false);
            }
        };

        fetchCompanion();
    }, [id, isNew]);

    const handleEditProgression = useCallback((progression: FeatureProgression) => {
        setEditingProgression(progression);
        setPreSelectedFeature(null);
        setIsProgressionDialogOpen(true);
    }, []);

    const handleRemoveProgression = useCallback(async (progressionId: number) => {
        try {
            // Delete by updating with empty progressions array for that feature
            const progression = featureProgressions.find(p => p.id === progressionId);
            if (!progression) {
                return;
            }

            // Get remaining progressions for this feature
            const remainingProgressions = featureProgressions
                .filter(p => p.id !== progressionId && p.featureId === progression.featureId)
                .map(p => ({
                    ...p,
                    feature: p.feature ? {
                        id: p.feature.id,
                        name: p.feature.name,
                        slug: p.feature.slug
                    } : undefined,
                    entities: p.entities?.map(e => ({
                        ...e,
                        conditions: e.conditions?.map(c => ({
                            ...c,
                            entity: c.entity ? { id: c.entity.id } : undefined
                        }))
                    })),
                }));

            await FeatureSystemApi.updateFeatureProgressions(
                { progressions: remainingProgressions },
                { id: progression.featureId }
            );
            
            // Refetch companion to get updated features
            if (id && id !== 'new') {
                const companionId = parseInt(id, 10);
                if (!isNaN(companionId)) {
                    const refetchedCompanion = await CompanionQueryHooks.getCompanionById(companionId);
                    if (refetchedCompanion) {
                        setFeatureProgressions(refetchedCompanion.features || []);
                    }
                }
            }

            queryClient.invalidateQueries({
                queryKey: ['features'],
                exact: false
            });
        } catch (err) {
            console.error('Error removing feature progression:', err);
        }
    }, [id, queryClient, featureProgressions]);

    const handleAddFeature = useCallback(async (feature: { id: number; name: string; description: string; slug: string }) => {
        const companionId = id && id !== 'new' ? parseInt(id, 10) : undefined;
        if (!companionId) {
            console.error('Cannot add feature: companion ID is required');
            return;
        }

        try {
            const newProgression: FeatureProgression = {
                id: 0,
                featureId: feature.id,
                companionId: companionId,
                sourceType: FeatureSourceType.Companion,
                level: 1,
                classId: null,
                raceId: null,
                variantOverrideId: null,
                domainId: null,
                featId: null,
                entities: [],
                feature: {
                    id: feature.id,
                    name: feature.name,
                    description: feature.description,
                    slug: feature.slug,
                    summary: null,
                    displayInCharacterSheet: true,
                    prerequisites: []
                }
            };

            // Add to existing progressions for this feature
            const existingProgressions = featureProgressions.filter(p => p.featureId === feature.id);
            const updatedProgressions = [...existingProgressions, newProgression].map(p => ({
                ...p,
                feature: p.feature ? {
                    id: p.feature.id,
                    name: p.feature.name,
                    slug: p.feature.slug
                } : undefined,
                entities: p.entities?.map(e => ({
                    ...e,
                    conditions: e.conditions?.map(c => ({
                        ...c,
                        entity: c.entity ? { id: c.entity.id } : undefined
                    }))
                })),
            }));

            await FeatureSystemApi.updateFeatureProgressions(
                { progressions: updatedProgressions },
                { id: feature.id }
            );

            // Refetch companion to get updated features
            const refetchedCompanion = await CompanionQueryHooks.getCompanionById(companionId);
            if (refetchedCompanion) {
                setFeatureProgressions(refetchedCompanion.features || []);
            }

            queryClient.invalidateQueries({
                queryKey: ['features'],
                exact: false
            });
        } catch (err) {
            console.error('Error adding feature:', err);
        }
    }, [id, queryClient, featureProgressions]);

    const handleSaveProgression = async (progression: FeatureProgression) => {
        setIsSavingProgression(true);
        try {
            if (!progression.featureId) {
                console.error('Cannot save progression: missing featureId', progression);
                return;
            }

            const companionId = id && id !== 'new' ? parseInt(id, 10) : undefined;
            if (!companionId) {
                console.error('Cannot save progression: companion ID is required');
                return;
            }

            // Ensure companionId and sourceType are set correctly
            const progressionData = {
                ...progression,
                companionId: companionId,
                sourceType: FeatureSourceType.Companion,
                feature: progression.feature ? {
                    id: progression.feature.id,
                    name: progression.feature.name,
                    slug: progression.feature.slug
                } : undefined,
                entities: progression.entities?.map(e => ({
                    ...e,
                    conditions: e.conditions?.map(c => ({
                        ...c,
                        entity: c.entity ? { id: c.entity.id } : undefined
                    }))
                })),
            };

            await FeatureSystemApi.updateFeatureProgressions(
                { progressions: [progressionData] },
                { id: progression.featureId }
            );

            // Close the dialog
            setIsProgressionDialogOpen(false);
            setEditingProgression(null);
            setPreSelectedFeature(null);

            // Refetch companion to get updated features
            if (id && id !== 'new') {
                const companionId = parseInt(id, 10);
                if (!isNaN(companionId)) {
                    const refetchedCompanion = await CompanionQueryHooks.getCompanionById(companionId);
                    if (refetchedCompanion) {
                        setFeatureProgressions(refetchedCompanion.features || []);
                    }
                }
            }

            // Invalidate queries
            queryClient.invalidateQueries({
                queryKey: ['features', 'progressions', progression.featureId]
            });
            queryClient.invalidateQueries({
                queryKey: ['features'],
                exact: false
            });
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to save feature progression');
            console.error('Error saving feature progression:', error);
        } finally {
            setIsSavingProgression(false);
        }
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate the entire form
        if (!form.validation.validateForm(formData)) {
            return;
        }

        try {
            if (isNew) {
                await createMutation.mutateAsync({ requestData: formData });
            } else if (id && id !== 'new') {
                const companionId = parseInt(id, 10);
                if (!isNaN(companionId)) {
                    await updateMutation.mutateAsync({
                        requestData: formData,
                        pathParams: { id: companionId }
                    });
                }
            }
            navigate(`/companions${fromListParams ? `?${fromListParams}` : ''}`);
        } catch (error) {
            console.error('Error saving companion:', error);
        }
    };

    if (isLoadingCompanion && !isNew) {
        return <div className="p-4">Loading...</div>;
    }

    if (companionError) {
        return <div className="p-4 text-red-500">Error loading companion: {companionError.message}</div>;
    }

    // Get monster name from companion relation (when editing) or from cache (when creating/editing)
    const monsterNameFromCompanion = companion?.monster?.name;
    const monsterNameFromCache = formData.monsterId
        ? monstersCache?.results?.find(m => m.id === formData.monsterId)?.name
        : undefined;
    const monsterName = monsterNameFromCompanion || monsterNameFromCache;

    const companionId = id && id !== 'new' ? parseInt(id, 10) : undefined;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">
                {isNew ? 'New Companion' : `Edit Companion${monsterName ? `: ${monsterName}` : ''}`}
            </h1>
            <ValidatedForm
                onSubmit={onSubmit}
                validationState={form.validation.validationState}
                isLoading={createMutation.isPending || updateMutation.isPending || isSavingProgression}
                formData={formData}
                setFormData={setFormData}
                validation={form.validation}
            >
                <div className="space-y-6">
                    <div className="w-[40%] space-y-4">
                        <CustomSelect
                            label="Type"
                            value={formData.type ?? CompanionType.Familiar}
                            onValueChange={(value) => setFormData({ ...formData, type: value })}
                            options={COMPANION_TYPE_LIST}
                            componentExtraClassName="flex items-center gap-4"
                            labelExtraClassName="w-32 flex-shrink-0"
                        />
                        <MonsterSearchInput
                            label="Monster"
                            value={formData.monsterId ?? null}
                            onValueChange={(monsterId) => setFormData({ ...formData, monsterId: monsterId ?? undefined })}
                            placeholder="Search for a monster..."
                            componentExtraClassName="flex items-center gap-4 [&>div]:flex-1"
                            labelExtraClassName="w-32 flex-shrink-0"
                            filter={(monster) => {
                                // Filter to only show Animal type monsters
                                return monster.typeIds?.includes(MonsterTypeId.Animal) ?? false;
                            }}
                        />
                        <ValidatedInput
                            field="minLevel"
                            label="Minimum Level"
                            type="number"
                            placeholder="Enter minimum character level"
                            componentExtraClassName="flex items-center gap-4"
                            labelExtraClassName="w-32 flex-shrink-0"
                            inputExtraClassName="flex-1"
                        />
                        {formData.monsterId && (monsterName || formData.minLevel) && (
                            <div className="text-sm text-gray-600 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                                {monsterName && (
                                    <p><strong>Monster:</strong> {monsterName}</p>
                                )}
                                {formData.minLevel && (
                                    <p><strong>Minimum Level:</strong> {formData.minLevel}</p>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end space-x-4 pt-2">
                            <button
                                type="button"
                                onClick={() => navigate(`/companions${fromListParams ? `?${fromListParams}` : ''}`)}
                                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createMutation.isPending || updateMutation.isPending || isSavingProgression}
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                            >
                                {createMutation.isPending || updateMutation.isPending || isSavingProgression ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>

                    {/* Features Section - Only show if companion exists */}
                    {!isNew && companionId && (
                        <div>
                            <FeaturesManager
                                featureProgressions={featureProgressions}
                                onEditProgression={handleEditProgression}
                                onRemoveProgression={handleRemoveProgression}
                                onAddFeature={handleAddFeature}
                                contextType={FeatureSourceType.Companion}
                                contextId={companionId}
                                title="Companion Benefits"
                                emptyMessage="No benefits configured for this companion"
                                excludeSpecialFeatures={[]}
                                setEditingProgression={setEditingProgression}
                                setPreSelectedFeature={setPreSelectedFeature}
                                setIsProgressionDialogOpen={setIsProgressionDialogOpen}
                            />
                        </div>
                    )}
                </div>
            </ValidatedForm>

            {/* Feature Progression Edit Dialog */}
            <FeatureProgressionDetailEdit
                isOpen={isProgressionDialogOpen}
                onClose={() => {
                    setIsProgressionDialogOpen(false);
                    setEditingProgression(null);
                    setPreSelectedFeature(null);
                }}
                progression={editingProgression}
                onSave={handleSaveProgression}
                preSelectedFeature={preSelectedFeature || undefined}
                showSourceTypeSelector={false}
            />
        </div>
    );
}
