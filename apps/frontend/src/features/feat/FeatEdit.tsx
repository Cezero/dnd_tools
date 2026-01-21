import { useQueryClient } from '@tanstack/react-query';
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import { FeatureEditForm } from '@/components/feature-system/FeatureEditForm';
import { FeaturesManager } from '@/components/feature-system/FeaturesManager';
import { FeatureSystemApi } from '@/components/feature-system/FeatureSystemApi';
import {
    ValidatedForm,
    ValidatedInput,
    useValidatedForm,
    SourceEditor
} from '@/components/forms';
import { CustomCheckbox, CustomSelect } from '@/components/forms/FormComponents';
import { FeatQueryHooks } from '@/services/query/FeatQueryHooks';
import { CreateFeatRequest, UpdateFeatRequest, UpdateFeatSchema, BaseFeatSchema, Feat, Feature, FeatureWithRelations } from '@shared/schema';
import { FEAT_TYPE_LIST, EDITION_LIST, SourceType, EditionId, FeatureSourceType } from '@shared/static-data';

// Type definitions for the form state
type FeatFormData = CreateFeatRequest | UpdateFeatRequest;

export function FeatEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Use imperative API for data fetching and mutations
    const [feat, setFeat] = useState<Feat | null>(null);
    const [isLoadingFeat, setIsLoadingFeat] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [featError, setFeatError] = useState<Error | null>(null);

    // Feature feature management state
    const [isProgressionDialogOpen, setIsProgressionDialogOpen] = useState(false);
    const [editingProgression, setEditingProgression] = useState<FeatureWithRelations | null>(null);
    const [preSelectedFeature, setPreSelectedFeature] = useState<FeatureWithRelations | null>(null);
    const [isSavingProgression, setIsSavingProgression] = useState(false);
    // Store features in state for new feats (before they're saved)
    const [unsavedProgressions, setUnsavedProgressions] = useState<FeatureWithRelations[]>([]);

    // Get query client for cache invalidation
    const queryClient = useQueryClient();

    // Use the mutation hooks for proper cache invalidation
    const updateFeatMutation = FeatQueryHooks.useUpdateFeat();
    const createFeatMutation = FeatQueryHooks.useCreateFeat();

    const fromListParams = location.state?.fromListParams || '';

    // Determine which schema to use based on whether we're creating or editing
    const schema = id === 'new' ? BaseFeatSchema : UpdateFeatSchema;

    // Initialize form data with default values (only feat-specific metadata)
    const initialFormData: FeatFormData = useMemo(() => ({
        name: '',
        typeId: 1,
        editionId: 1,
        repeatable: false,
        fighterBonus: false,
        useSubId: false,
        sourceBookInfo: [],
        ...(id !== 'new' && { id: parseInt(id) })
    }), [id]);

    const [formData, setFormData] = useState<FeatFormData>(initialFormData);

    // Use the validated form hook
    const form = useValidatedForm(
        schema,
        formData,
        setFormData,
        {
            validateOnChange: true,
            validateOnBlur: true,
            debounceMs: 300
        }
    );

    // FeatOptions doesn't need initialization - it's a static utility
    // Handle feat data loading with imperative API
    useEffect(() => {
        const fetchFeat = async () => {
            if (id === 'new') {
                return;
            }

            try {
                setIsLoadingFeat(true);
                setFeatError(null);
                const fetchedFeat = await FeatQueryHooks.getFeatById(parseInt(id!));
                setFeat(fetchedFeat);

                setFormData({
                    name: fetchedFeat.name || '',
                    typeId: fetchedFeat.typeId || 1,
                    editionId: fetchedFeat.editionId || 1,
                    repeatable: fetchedFeat.repeatable ?? false,
                    fighterBonus: fetchedFeat.fighterBonus ?? false,
                    useSubId: fetchedFeat.useSubId ?? false,
                    sourceBookInfo: fetchedFeat.sourceBookInfo || [],
                    ...(fetchedFeat.id && { id: fetchedFeat.id })
                } as FeatFormData);
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Failed to fetch feat');
                setFeatError(error);
                setError(error.message);
            } finally {
                setIsLoadingFeat(false);
            }
        };

        fetchFeat();
    }, [id]);

    // Get the associated feature features from feat
    const featWithProgressions = feat as (typeof feat & { features?: FeatureWithRelations[] }) | undefined;

    // Create a properly initialized feature when adding a new one
    useEffect(() => {
        if (isProgressionDialogOpen && !editingProgression && preSelectedFeature) {
            // Generate temporary ID for new feats, use actual ID for existing feats
            const featIdValue = id === 'new' ? Date.now() + Math.random() : parseInt(id || '0');

            const newProgression: FeatureWithRelations = {
                id: preSelectedFeature.id,
                sourceType: FeatureSourceType.Feat,
                domainId: null,
                featId: featIdValue,
                companionId: null,
                level: 1,
                name: preSelectedFeature.name,
                slug: preSelectedFeature.slug,
                description: preSelectedFeature.description,
                displayInCharacterSheet: preSelectedFeature.displayInCharacterSheet,
                entities: []
            };
            setEditingProgression(newProgression);
        }
    }, [isProgressionDialogOpen, editingProgression, preSelectedFeature, id]);

    // Feature feature handlers
    const handleSaveProgression = async (feature: FeatureWithRelations) => {
        setIsSavingProgression(true);
        try {
            if (!feature.id) {
                console.error('Cannot save feature: missing id', feature);
                setError('Cannot save feature: missing feature ID');
                setIsSavingProgression(false);
                return;
            }

            // Check if this is a new feat - store in state instead of saving
            if (id === 'new') {
                // Ensure sourceType and featId are set correctly (using temporary ID)
                const progressionData: FeatureWithRelations = {
                    ...feature,
                    id: Date.now() + Math.random(), // Temporary ID for frontend
                    sourceType: FeatureSourceType.Feat,
                    companionId: null, // Ensure companionId is null for feat features
                    featId: Date.now() + Math.random(), // Temporary ID, will be replaced when feat is saved
                };

                // Update or add to unsaved features
                if (editingProgression && editingProgression.id !== 0) {
                    // Update existing feature
                    setUnsavedProgressions(prev =>
                        prev.map(p => p.id === editingProgression.id ? progressionData : p)
                    );
                } else {
                    // Add new feature
                    setUnsavedProgressions(prev => [...prev, progressionData]);
                }

                setIsProgressionDialogOpen(false);
                setEditingProgression(null);
                setPreSelectedFeature(null);
                setMessage('Feature feature added (will be saved with feat)');
                setIsSavingProgression(false);
                return;
            }

            // For existing feats, save to backend
            const featIdNum = parseInt(id || '0');
            if (!featIdNum) {
                setError('Cannot save feature: feat ID is required');
                setIsSavingProgression(false);
                return;
            }

            // Ensure featId and sourceType are set correctly
            const progressionData = {
                ...feature,
                featId: featIdNum,
                companionId: null, // Ensure companionId is null for feat features
                sourceType: FeatureSourceType.Feat,
                // FeatureWithRelations is now the unified Feature model, no need to add feature property
                entities: feature.entities?.map(e => ({
                    ...e,
                    conditions: e.conditions?.map(c => ({
                        ...c
                    }))
                }))
            };

            await FeatureSystemApi.updateFeatures(
                { features: [progressionData] },
                { id: feature.id }
            );

            // Close the dialog FIRST, before any other state changes
            // This ensures the guard in HandleSubmit can catch it if needed
            setIsProgressionDialogOpen(false);
            setEditingProgression(null);
            setPreSelectedFeature(null);

            // Refetch the feat data to get updated features
            // Use imperative fetch instead of invalidate to avoid triggering navigation
            const refetchedFeat = await FeatQueryHooks.getFeatById(featIdNum);
            if (refetchedFeat) {
                setFeat(refetchedFeat);
            }

            // Invalidate other queries (but don't await to avoid blocking)
            // These will be refetched when needed, but won't cause navigation
            queryClient.invalidateQueries({
                queryKey: ['feats'],
                exact: false
            });
            queryClient.invalidateQueries({
                queryKey: ['feats-cache'],
                exact: false
            });
            queryClient.invalidateQueries({
                queryKey: ['features', 'features', feature.id]
            });
            queryClient.invalidateQueries({
                queryKey: ['features'],
                exact: false
            });

            setMessage('Feature feature updated successfully!');
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to save feature feature');
            console.error('Error saving feature feature:', error);
            setError(error.message);
        } finally {
            setIsSavingProgression(false);
        }
    };

    const handleEditProgression = (feature: FeatureWithRelations) => {
        setEditingProgression(feature);
        setPreSelectedFeature(null);
        setIsProgressionDialogOpen(true);
    };

    const handleRemoveProgression = async (progressionId: number) => {
        try {
            if (id === 'new') {
                // Remove from unsaved features
                setUnsavedProgressions(prev => prev.filter(p => p.id !== progressionId));
                setMessage('Feature feature removed');
                return;
            }

            // Delete feature by updating with empty array for that feature
            const feature = (featWithProgressions?.features || []).find(p => p.id === progressionId);
            if (feature) {
                const remainingProgressions = (featWithProgressions?.features || [])
                    .filter(p => p.id !== progressionId && p.id === feature.id)
                    .map(p => ({
                        ...p,
                        // FeatureWithRelations is now the unified Feature model, no need to add feature property
                        entities: p.entities?.map(e => ({
                            ...e,
                            conditions: e.conditions?.map(c => ({
                                ...c
                            }))
                        }))
                    }));
                await FeatureSystemApi.updateFeatures(
                    { features: remainingProgressions },
                    { id: feature.id }
                );
            }
            // Refetch feat to update features
            const refetchedFeat = await FeatQueryHooks.getFeatById(parseInt(id || '0'));
            if (refetchedFeat) {
                setFeat(refetchedFeat);
            }
            queryClient.invalidateQueries({
                queryKey: ['feats'],
                exact: false
            });
            setMessage('Feature feature removed successfully!');
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to remove feature feature');
            setError(error.message);
        }
    };

    const handleAddFeature = async (feature: { id: number; name: string; description: string; slug: string }) => {
        if (id === 'new') {
            // For new feats, just open the dialog to add a feature
            setPreSelectedFeature({
                id: feature.id,
                name: feature.name,
                description: feature.description,
                slug: feature.slug,
                summary: null,
                displayInCharacterSheet: true,
                prerequisites: [],
                sourceType: FeatureSourceType.Template,
                level: 1
            });
            setEditingProgression(null);
            setIsProgressionDialogOpen(true);
            return;
        }

        const featIdNum = parseInt(id || '0');
        if (!featIdNum) {
            setError('Cannot add feature: feat ID is required');
            return;
        }

        try {
            const newProgression: FeatureWithRelations = {
                id: feature.id,
                name: feature.name,
                description: feature.description,
                slug: feature.slug,
                summary: null,
                displayInCharacterSheet: true,
                prerequisites: [],
                featId: featIdNum,
                sourceType: FeatureSourceType.Feat,
                level: 1,
                entities: []
            };

            // Get existing features for this feature and add the new one
            const existingProgressions = await FeatureSystemApi.getFeatures(undefined, { id: feature.id });
            const updatedProgressions = [...existingProgressions, newProgression].map(p => ({
                ...p,
                // FeatureWithRelations is now the unified Feature model, no need to add feature property
                entities: p.entities?.map(e => ({
                    ...e,
                    conditions: e.conditions?.map(c => ({
                        ...c
                    }))
                }))
            }));
            await FeatureSystemApi.updateFeatures(
                { features: updatedProgressions },
                { id: feature.id }
            );

            // Refetch feat to update features
            const refetchedFeat = await FeatQueryHooks.getFeatById(featIdNum);
            if (refetchedFeat) {
                setFeat(refetchedFeat);
            }

            queryClient.invalidateQueries({
                queryKey: ['feats'],
                exact: false
            });
            setMessage('Feature added successfully!');
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to add feature');
            setError(error.message);
        }
    };

    const HandleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Prevent form submission if we're saving a feature or dialog is open
        if (isSavingProgression || isProgressionDialogOpen) {
            return;
        }

        // Additional check: if the event originated from within a dialog, block it
        const target = e.target as HTMLElement;
        const dialogElement = target.closest('[role="dialog"]') || target.closest('[data-dialog]') || document.querySelector('[role="dialog"]:not([hidden])');
        if (dialogElement && dialogElement.contains(target)) {
            return;
        }

        setMessage('');
        setError(null);

        // Validate the entire form
        if (!form.validation.validateForm(formData)) {
            return;
        }

        try {
            if (id === 'new') {
                setIsCreating(true);
                // Prepare features for creation (remove temporary IDs and clean up)
                const progressionsToCreate = unsavedProgressions.map(p => {
                    // FeatureWithRelations is now the unified Feature model, no need to remove feature property
                    const { id: _id, featId: _featId, ...progressionData } = p;
                    return {
                        ...progressionData,
                        entities: progressionData.entities?.map(e => {
                            const { id: _eId, featureId: _fId, ...entityData } = e;
                            return {
                                ...entityData,
                                conditions: entityData.conditions?.map(c => {
                                    const { id: _cId, featureEntityId: _feId, ...conditionData } = c;
                                    return conditionData;
                                })
                            };
                        })
                    };
                });

                const createData: CreateFeatRequest = {
                    ...formData,
                    features: progressionsToCreate.length > 0 ? progressionsToCreate : undefined
                } as CreateFeatRequest;

                const result = await createFeatMutation.mutateAsync({ requestData: createData });
                const newFeat = { id: result.id };
                setMessage('Feat created successfully!');
                // Clear unsaved features
                setUnsavedProgressions([]);

                // Invalidate feat-related queries
                await queryClient.invalidateQueries({
                    queryKey: FeatQueryHooks.getFeatByIdQueryKey(parseInt(newFeat.id, 10))
                });
                await queryClient.invalidateQueries({
                    queryKey: ['feats'],
                    exact: false
                });
                await queryClient.invalidateQueries({
                    queryKey: ['feats-cache'],
                    exact: false
                });

                // Navigate based on where user came from
                setTimeout(() => {
                    if (fromListParams) {
                        // User came from the list page, go back to list with params
                        navigate(`/feats${fromListParams}`, { state: { refresh: true } });
                    } else {
                        // User came from detail page or direct URL, go to detail page
                        navigate(`/feats/${newFeat.id}`, { state: { refresh: true } });
                    }
                }, 1500);
            } else {
                await updateFeatMutation.mutateAsync({
                    requestData: formData as UpdateFeatRequest,
                    pathParams: { id: parseInt(id) }
                });
                setMessage('Feat updated successfully!');

                // Invalidate feat-related queries
                await queryClient.invalidateQueries({
                    queryKey: FeatQueryHooks.getFeatByIdQueryKey(parseInt(id))
                });
                await queryClient.invalidateQueries({
                    queryKey: ['feats'],
                    exact: false
                });
                await queryClient.invalidateQueries({
                    queryKey: ['feats-cache'],
                    exact: false
                });

                // Navigate based on where user came from
                setTimeout(() => {
                    if (fromListParams) {
                        // User came from the list page, go back to list with params
                        navigate(`/feats${fromListParams}`, { state: { refresh: true } });
                    } else {
                        // User came from detail page or direct URL, stay on detail page
                        navigate(`/feats/${id}`, { state: { refresh: true } });
                    }
                }, 1500);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save feat');
        } finally {
            setIsCreating(false);
        }
    };

    if (isLoadingFeat && id !== 'new') {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    if (featError && id !== 'new') {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-red-500 mb-4">Error loading feat: {featError.message}</p>
                <button
                    onClick={() => navigate('/feats')}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Back to Feats
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">
                    {id === 'new' ? 'Create New Feat' : 'Edit Feat'}
                </h1>
            </div>

            {message && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md dark:bg-green-900/20 dark:border-green-800">
                    <p className="text-green-700 dark:text-green-300">{message}</p>
                </div>
            )}

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800">
                    <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
            )}

            <ValidatedForm
                onSubmit={HandleSubmit}
                validationState={form.validation.validationState}
                isLoading={isCreating || updateFeatMutation.isPending || createFeatMutation.isPending}
                formData={formData}
                setFormData={setFormData}
                validation={form.validation}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <ValidatedInput
                            field="name"
                            label="Feat Name"
                            type="text"
                            componentExtraClassName='flex items-center gap-2'
                            required
                            placeholder="e.g., Power Attack, Weapon Focus"
                            data-1p-ignore
                        />
                        <CustomSelect
                            label="Feat Type"
                            required
                            placeholder="Select feat type"
                            componentExtraClassName='flex items-center gap-2'
                            itemTextExtraClassName='w-24'
                            value={formData.typeId}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, typeId: value as number }))}
                            options={FEAT_TYPE_LIST}
                        />
                    </div>

                    <div className="space-y-4">
                        <CustomSelect
                            label="Edition"
                            required
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-32"
                            itemExtraClassName="w-32"
                            itemTextExtraClassName="w-32"
                            value={formData.editionId}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, editionId: value as number }))}
                            options={EDITION_LIST}
                            useAbbreviation={true}
                            placeholder="Select edition"
                        />
                        <div className="flex flex-col gap-2">
                            <CustomCheckbox
                                label="Repeatable"
                                checked={formData.repeatable as boolean}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, repeatable: checked }))}
                            />
                            <CustomCheckbox
                                label="Fighter Bonus Feat"
                                checked={formData.fighterBonus as boolean}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, fighterBonus: checked }))}
                            />
                            <CustomCheckbox
                                label="Uses Sub-ID"
                                checked={formData.useSubId as boolean}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, useSubId: checked }))}
                            />
                        </div>
                    </div>
                </div>

                {/* Feature Features Management */}
                <div className="mt-8">
                    <FeaturesManager
                        state={{
                            features: id === 'new' ? unsavedProgressions : (featWithProgressions?.features || []),
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
                                if (id === 'new') {
                                    setUnsavedProgressions(update.payload.features);
                                }
                            }
                        }}
                        contextType={FeatureSourceType.Feat}
                        contextId={id === 'new' ? 0 : parseInt(id || '0')}
                        parentType="feat"
                        title="Feature Features"
                        emptyMessage="No feature features. Click 'Add Feature' to add one."
                    />
                </div>

                {/* Source References */}
                <div className="mt-8">
                    <SourceEditor
                        sources={formData.sourceBookInfo || []}
                        onSourcesChange={(sources) => setFormData(prev => ({ ...prev, sourceBookInfo: sources }))}
                        sourceType={SourceType.Classes}
                        editionId={formData.editionId as EditionId}
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 mt-8">
                    <button
                        type="button"
                        onClick={() => navigate('/feats')}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        disabled={isCreating || updateFeatMutation.isPending || createFeatMutation.isPending}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isCreating || updateFeatMutation.isPending || createFeatMutation.isPending || form.validation.validationState.hasErrors}
                    >
                        {isCreating || updateFeatMutation.isPending || createFeatMutation.isPending ? 'Saving...' : id === 'new' ? 'Create Feat' : 'Update Feat'}
                    </button>
                </div>
            </ValidatedForm>

            {/* Feature Feature Edit Dialog */}
            {isProgressionDialogOpen && (
                <FeatureEditForm
                    isOpen={isProgressionDialogOpen}
                    onClose={() => {
                        setIsProgressionDialogOpen(false);
                        setEditingProgression(null);
                        setPreSelectedFeature(null);
                    }}
                    featureId={
                        editingProgression?.id
                            ? editingProgression.id
                            : preSelectedFeature?.id
                                ? preSelectedFeature.id
                                : 'new'
                    }
                    onSave={(feature: Feature, features: FeatureWithRelations[]) => {
                        const featureWithRelations = features[0] || feature as FeatureWithRelations;
                        handleSaveProgression(featureWithRelations);
                    }}
                    mode="modal"
                    context={
                        id && id !== 'new'
                            ? {
                                  sourceType: FeatureSourceType.Feat,
                                  parentId: parseInt(id),
                                  parentType: 'feat'
                              }
                            : undefined
                    }
                />
            )}
        </div>
    );
}
