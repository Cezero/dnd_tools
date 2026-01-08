import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import {
    ValidatedForm,
    ValidatedInput,
    useValidatedForm,
    SourceEditor
} from '@/components/forms';
import { CustomCheckbox, CustomSelect } from '@/components/forms/FormComponents';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { useCacheFunctions } from '@/services/cache';
import { FeatQueryHooks } from '@/services/query/FeatQueryHooks';
import { CreateFeatRequest, UpdateFeatRequest, UpdateFeatSchema, FeatBenefitMap, FeatPrerequisiteMap, BaseFeatSchema } from '@shared/schema';
import { FEAT_BENEFIT_TYPE_BY_ID, FEAT_TYPE_LIST, FeatBenefitType, EDITION_LIST, SourceType, EditionId } from '@shared/static-data';

import { FeatBenefitEdit } from './FeatBenefitEdit';
import { FeatPrereqEdit } from './FeatPrereqEdit';
import { FeatOptions, getPrereqDisplayText, formatFeatBenefit } from './FeatUtil';

// Type definitions for the form state
type FeatFormData = CreateFeatRequest | UpdateFeatRequest;
type FeatBenefitFormData = FeatBenefitMap;
type FeatPrerequisiteFormData = FeatPrerequisiteMap;

export function FeatEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Use imperative API for data fetching and mutations
    const [feat, setFeat] = useState<unknown | null>(null);
    const [isLoadingFeat, setIsLoadingFeat] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [featError, setFeatError] = useState<Error | null>(null);

    // Get cache functions
    const { getFeatNameById, getFeatureNameById } = useCacheFunctions();

    // Get query client for cache invalidation
    const queryClient = useQueryClient();

    // Use the mutation hook for proper cache invalidation
    const updateFeatMutation = FeatQueryHooks.useUpdateFeat();
    const [isAddBenefitModalOpen, setIsAddBenefitModalOpen] = useState(false);
    const [isAddPrereqModalOpen, setIsAddPrereqModalOpen] = useState(false);
    const [editingBenefit, setEditingBenefit] = useState<FeatBenefitFormData | null>(null);
    const [editingPrereq, setEditingPrereq] = useState<FeatPrerequisiteFormData | null>(null);
    const [prereqDisplayTexts, setPrereqDisplayTexts] = useState<Record<number, string>>({});

    const fromListParams = location.state?.fromListParams || '';

    // Determine which schema to use based on whether we're creating or editing
    const schema = id === 'new' ? BaseFeatSchema : UpdateFeatSchema;

    // Initialize form data with default values
    const initialFormData: FeatFormData = useMemo(() => ({
        name: '',
        typeId: 1,
        editionId: 1,
        description: '',
        benefit: '',
        summary: '',
        normalEffect: '',
        specialEffect: '',
        prerequisites: '',
        repeatable: false,
        fighterBonus: false,
        useSubId: false,
        benefits: [],
        prereqs: [],
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
                    description: fetchedFeat.description || '',
                    benefit: fetchedFeat.benefit || '',
                    summary: fetchedFeat.summary || '',
                    normalEffect: fetchedFeat.normalEffect || '',
                    specialEffect: fetchedFeat.specialEffect || '',
                    prerequisites: fetchedFeat.prerequisites || '',
                    repeatable: fetchedFeat.repeatable ?? false,
                    fighterBonus: fetchedFeat.fighterBonus ?? false,
                    useSubId: fetchedFeat.useSubId ?? false,
                    benefits: fetchedFeat.benefits || [],
                    prereqs: fetchedFeat.prereqs || [],
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

    // Load prerequisite display texts
    useEffect(() => {
        let isCancelled = false;

        const loadPrereqTexts = async () => {
            if (formData.prereqs && formData.prereqs.length > 0) {
                const texts: Record<number, string> = {};
                for (let i = 0; i < formData.prereqs.length; i++) {
                    if (isCancelled) break;

                    const prereq = formData.prereqs[i];
                    try {
                        texts[i] = await getPrereqDisplayText(prereq, getFeatNameById, getFeatureNameById);
                    } catch (error) {
                        console.error('Error loading prerequisite text:', error);
                        texts[i] = `Prerequisite ${i + 1}`;
                    }
                }

                if (!isCancelled) {
                    setPrereqDisplayTexts(texts);
                }
            } else {
                if (!isCancelled) {
                    setPrereqDisplayTexts({});
                }
            }
        };

        loadPrereqTexts();

        return () => {
            isCancelled = true;
        };
    }, [formData.prereqs]);

    const HandleAddBenefitClick = useCallback(() => {
        setEditingBenefit({
            index: formData.benefits?.length || 0,
            typeId: null,
            referenceId: null,
            amount: null
        });
        setIsAddBenefitModalOpen(true);
    }, [formData.benefits]);

    const HandleEditBenefitClick = useCallback((benefit: FeatBenefitFormData) => {
        setEditingBenefit(benefit);
        setIsAddBenefitModalOpen(true);
    }, []);

    const HandleSaveBenefit = useCallback((savedBenefit: FeatBenefitFormData) => {
        setFormData(prev => {
            const updatedBenefits = [...(prev.benefits || [])];
            updatedBenefits[savedBenefit.index] = savedBenefit;
            return { ...prev, benefits: updatedBenefits };
        });
        setIsAddBenefitModalOpen(false);
        setEditingBenefit(null);
    }, []);

    const HandleDeleteBenefit = useCallback(async (benefitIndex: number) => {
        if (window.confirm('Are you sure you want to remove this benefit from the feat?')) {
            setFormData(prev => {
                const filteredBenefits = prev.benefits?.filter((_, index) => index !== benefitIndex) || [];
                // Re-index the remaining benefits
                const reindexedBenefits = filteredBenefits.map((benefit, newIndex) => ({
                    ...benefit,
                    index: newIndex
                }));
                return {
                    ...prev,
                    benefits: reindexedBenefits
                };
            });
        }
    }, []);

    const HandleAddPrereqClick = useCallback(() => {
        setEditingPrereq({
            index: formData.prereqs?.length || 0,
            typeId: null,
            referenceId: null,
            amount: null,
        });
        setIsAddPrereqModalOpen(true);
    }, [formData.prereqs]);

    const HandleEditPrereqClick = useCallback((prereq: FeatPrerequisiteFormData) => {
        setEditingPrereq(prereq);
        setIsAddPrereqModalOpen(true);
    }, []);

    const HandleSavePrereq = useCallback((savedPrereq: FeatPrerequisiteFormData) => {
        setFormData(prev => {
            const updatedPrereqs = [...(prev.prereqs || [])];
            updatedPrereqs[savedPrereq.index] = savedPrereq;
            return { ...prev, prereqs: updatedPrereqs };
        });
        setIsAddPrereqModalOpen(false);
        setEditingPrereq(null);
    }, []);

    const HandleDeletePrereq = useCallback(async (prereqIndex: number) => {
        if (window.confirm('Are you sure you want to remove this prerequisite from the feat?')) {
            setFormData(prev => {
                const filteredPrereqs = prev.prereqs?.filter((_, index) => index !== prereqIndex) || [];
                // Re-index the remaining prerequisites
                const reindexedPrereqs = filteredPrereqs.map((prereq, newIndex) => ({
                    ...prereq,
                    index: newIndex
                }));
                return {
                    ...prev,
                    prereqs: reindexedPrereqs
                };
            });
        }
    }, []);

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
                <div className="space-y-2">
                    <MarkdownEditor
                        id="description"
                        value={formData.description || ''}
                        onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                    />
                    {form.validation.getError('description') && (
                        <span className="text-red-500 text-sm">{form.validation.getError('description')}</span>
                    )}

                    <MarkdownEditor
                        id="benefit"
                        label="Benefit"
                        value={formData.benefit || ''}
                        onChange={(value) => setFormData(prev => ({ ...prev, benefit: value }))}
                    />
                    {form.validation.getError('benefit') && (
                        <span className="text-red-500 text-sm">{form.validation.getError('benefit')}</span>
                    )}

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
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 border p-3 rounded dark:border-gray-600">
                        {formData.benefits && formData.benefits.length > 0 ? (
                            <>
                                {
                                    formData.benefits.map((benefit, index) => (
                                        <div key={index} className="flex gap-2 items-center rounded border p-2 dark:border-gray-700">
                                            <button
                                                type="button"
                                                onClick={() => HandleEditBenefitClick(benefit)}
                                                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-600"
                                            >
                                                {formatFeatBenefit(benefit)}
                                            </button>
                                            <button
                                                type="button"
                                                title="Delete Benefit"
                                                onClick={() => HandleDeleteBenefit(index)}
                                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ))
                                }
                            </>
                        ) : (
                            <div className="border p-2 rounded dark:border-gray-600">No benefits added yet.</div>
                        )}
                        <button
                            type="button"
                            title="Add Benefit"
                            onClick={HandleAddBenefitClick}
                            className="text-green-500 hover:text-green-700"
                        >
                            <PlusIcon className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="space-y-2">
                        <MarkdownEditor
                            id="normalEffect"
                            label="Normal"
                            value={formData.normalEffect || ''}
                            onChange={(value) => setFormData(prev => ({ ...prev, normalEffect: value }))}
                        />
                        {form.validation.getError('normalEffect') && (
                            <span className="text-red-500 text-sm">{form.validation.getError('normalEffect')}</span>
                        )}
                    </div>
                    <div className="space-y-2">
                        <MarkdownEditor
                            id="specialEffect"
                            label="Special"
                            value={formData.specialEffect || ''}
                            onChange={(value) => setFormData(prev => ({ ...prev, specialEffect: value }))}
                        />
                        {form.validation.getError('specialEffect') && (
                            <span className="text-red-500 text-sm">{form.validation.getError('specialEffect')}</span>
                        )}
                    </div>
                    <div className="space-y-2">
                        <MarkdownEditor
                            id="prerequisites"
                            label="Prerequisites"
                            value={formData.prerequisites || ''}
                            onChange={(value) => setFormData(prev => ({ ...prev, prerequisites: value }))}
                        />
                        {form.validation.getError('prerequisites') && (
                            <span className="text-red-500 text-sm">{form.validation.getError('prerequisites')}</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 border p-3 rounded dark:border-gray-600">
                    {formData.prereqs && formData.prereqs.length > 0 ? (
                        <div className="flex items-center gap-2">
                            {formData.prereqs.map((prereq, index) => (
                                <div key={index} className="flex gap-2 items-center rounded border p-2 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={() => HandleEditPrereqClick(prereq)}
                                        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-600"
                                    >
                                        {prereqDisplayTexts[index] || 'Loading...'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => HandleDeletePrereq(index)}
                                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="border p-2 rounded dark:border-gray-600">No prerequisites added yet.</div>
                    )}

                    <button
                        type="button"
                        onClick={HandleAddPrereqClick}
                        className="text-green-500 hover:text-green-700"
                    >
                        <PlusIcon className="h-5 w-5" />
                    </button>
                </div>

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

            {editingBenefit && (
                <FeatBenefitEdit
                    isOpen={isAddBenefitModalOpen}
                    onClose={() => {
                        setIsAddBenefitModalOpen(false);
                        setEditingBenefit(null);
                    }}
                    onSave={HandleSaveBenefit}
                    initialBenefitData={editingBenefit}
                    featId={parseInt(id || '0')}
                />
            )}

            {editingPrereq && (
                <FeatPrereqEdit
                    isOpen={isAddPrereqModalOpen}
                    onClose={() => {
                        setIsAddPrereqModalOpen(false);
                        setEditingPrereq(null);
                    }}
                    onSave={HandleSavePrereq}
                    initialPrereqData={editingPrereq}
                />
            )}

        </div>
    );
}
