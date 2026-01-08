import { useQueryClient } from '@tanstack/react-query';
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import {
    ValidatedForm,
    ValidatedInput,
    useValidatedForm,
    SourceEditor
} from '@/components/forms';
import { CustomCheckbox, CustomSelect } from '@/components/forms/FormComponents';
import { FeatQueryHooks } from '@/services/query/FeatQueryHooks';
import { CreateFeatRequest, UpdateFeatRequest, UpdateFeatSchema, BaseFeatSchema, Feat, FeatureProgression } from '@shared/schema';
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

    // Get query client for cache invalidation
    const queryClient = useQueryClient();

    // Use the mutation hook for proper cache invalidation
    const updateFeatMutation = FeatQueryHooks.useUpdateFeat();

    const fromListParams = location.state?.fromListParams || '';

    // Determine which schema to use based on whether we're creating or editing
    const schema = id === 'new' ? BaseFeatSchema : UpdateFeatSchema;

    // Initialize form data with default values (only feat-specific metadata)
    const initialFormData: FeatFormData = useMemo(() => ({
        name: '',
        typeId: 1,
        editionId: 1,
        summary: '',
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
                    summary: fetchedFeat.summary || '',
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

    // Get the associated feature ID from feat progressions
    const featWithProgressions = feat as (typeof feat & { featureProgressions?: FeatureProgression[] }) | undefined;
    const featProgression = featWithProgressions?.featureProgressions?.find((p: FeatureProgression) =>
        p.sourceType === FeatureSourceType.Feat && p.featId === parseInt(id || '0')
    ) || featWithProgressions?.featureProgressions?.[0] || null;
    const featureId = featProgression?.featureId || featProgression?.feature?.id;

    const handleEditFeature = () => {
        if (featureId) {
            navigate(`/features/${featureId}/edit`, {
                state: {
                    fromPage: 'feats',
                    fromListParams: fromListParams,
                    parentType: 'feat',
                    parentId: parseInt(id || '0')
                }
            });
        }
    };

    const HandleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        // Validate the entire form
        if (!form.validation.validateForm(formData)) {
            return;
        }

        try {
            if (id === 'new') {
                setIsCreating(true);
                const newFeat = await FeatQueryHooks.createFeat(formData as CreateFeatRequest);
                setMessage('Feat created successfully!');

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
                isLoading={isCreating || updateFeatMutation.isPending}
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

                {/* Summary field (still in Feat for backward compatibility, but also in Feature) */}
                <div className="mt-6">
                    <div className="space-y-2">
                        <ValidatedInput
                            field="summary"
                            label="Summary (for PDF character sheets)"
                            type="textarea"
                            labelExtraClassName="mb-2"
                            inputExtraClassName="w-full"
                            placeholder="Enter brief summary for character sheets (plain text, no markdown)"
                            rows={4}
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            This summary will be displayed on PDF character sheets. Keep it concise and avoid markdown formatting.
                            Note: This is also stored in the associated Feature for consistency.
                        </p>
                    </div>
                </div>

                {/* Link to edit associated Feature */}
                {id !== 'new' && featureId && (
                    <div className="mt-6 p-4 border rounded-md dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20">
                        <h3 className="text-lg font-semibold mb-2">Feature Information</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Benefits, prerequisites, and descriptive text (description, benefit, normal effect, special effect) are now managed through the Feature system.
                        </p>
                        <button
                            type="button"
                            onClick={handleEditFeature}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                            Edit Associated Feature
                        </button>
                    </div>
                )}

                {/* Source References */}
                <div className="mt-8">
                    <SourceEditor
                        sources={formData.sourceBookInfo || []}
                        onSourcesChange={(sources) => setFormData(prev => ({ ...prev, sourceBookInfo: sources }))}
                        sourceType={SourceType.Core}
                        editionId={formData.editionId as EditionId}
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 mt-8">
                    <button
                        type="button"
                        onClick={() => navigate('/feats')}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        disabled={isCreating || updateFeatMutation.isPending}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isCreating || updateFeatMutation.isPending || form.validation.validationState.hasErrors}
                    >
                        {isCreating || updateFeatMutation.isPending ? 'Saving...' : id === 'new' ? 'Create Feat' : 'Update Feat'}
                    </button>
                </div>
            </ValidatedForm>


        </div>
    );
}
