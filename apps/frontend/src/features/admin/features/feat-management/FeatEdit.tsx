import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';

import {
    ValidatedForm,
    ValidatedInput,
    useValidatedForm
} from '@/components/forms';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { FeatBenefitEdit } from '@/features/admin/features/feat-management/FeatBenefitEdit';
import { FeatPrereqEdit } from '@/features/admin/features/feat-management/FeatPrereqEdit';
import { FeatService } from '@/features/admin/features/feat-management/FeatService';
import { FeatOptions, getPrereqDisplayText } from '@/features/admin/features/feat-management/FeatUtil';
import { CreateFeatSchema, FeatBenefitMapSchema, FeatPrerequisiteMapSchema, UpdateFeatSchema, GetFeatResponseSchema } from '@shared/schema';
import { FEAT_PREREQUISITE_TYPES, FEAT_BENEFIT_TYPE_BY_ID, FEAT_TYPE_SELECT_LIST, FeatBenefitType } from '@shared/static-data';
import { CustomCheckbox, CustomSelect } from '@/components/forms/FormComponents';

// Type definitions for the form state
type FeatFormData = z.infer<typeof CreateFeatSchema> | z.infer<typeof UpdateFeatSchema>;
type FeatBenefitFormData = z.infer<typeof FeatBenefitMapSchema>;
type FeatPrerequisiteFormData = z.infer<typeof FeatPrerequisiteMapSchema>;

export function FeatEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [feat, setFeat] = useState<FeatFormData | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAddBenefitModalOpen, setIsAddBenefitModalOpen] = useState(false);
    const [isAddPrereqModalOpen, setIsAddPrereqModalOpen] = useState(false);
    const [editingBenefit, setEditingBenefit] = useState<FeatBenefitFormData | null>(null);
    const [editingPrereq, setEditingPrereq] = useState<FeatPrerequisiteFormData | null>(null);
    const [prereqDisplayTexts, setPrereqDisplayTexts] = useState<Record<number, string>>({});

    const fromListParams = location.state?.fromListParams || '';

    // Determine which schema to use based on whether we're creating or editing
    const schema = id === 'new' ? CreateFeatSchema : UpdateFeatSchema;

    // Initialize form data with default values
    const initialFormData: FeatFormData = {
        name: '',
        typeId: 1,
        description: '',
        benefit: '',
        normalEffect: '',
        specialEffect: '',
        prerequisites: '',
        repeatable: false,
        fighterBonus: false,
        benefits: [],
        prereqs: [],
        ...(id !== 'new' && { id: parseInt(id) })
    };

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
    useEffect(() => {
        const fetchFeat = async () => {
            if (id === 'new') {
                setFeat(initialFormData);
                return;
            }

            try {
                setIsLoading(true);
                const fetchedFeat = await FeatService.getFeatById(undefined, { id: parseInt(id) });
                setFeat(fetchedFeat);
                setFormData(fetchedFeat);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch feat');
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeat();
    }, [id]);

    // Load prerequisite display texts
    useEffect(() => {
        const loadPrereqTexts = async () => {
            if (formData.prereqs && formData.prereqs.length > 0) {
                const texts: Record<number, string> = {};
                for (let i = 0; i < formData.prereqs.length; i++) {
                    const prereq = formData.prereqs[i];
                    texts[i] = await getPrereqDisplayText(prereq);
                }
                setPrereqDisplayTexts(texts);
            }
        };
        loadPrereqTexts();
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
            setFormData(prev => ({
                ...prev,
                benefits: prev.benefits?.filter((_, index) => index !== benefitIndex) || []
            }));
        }
    }, []);

    const HandleAddPrereqClick = useCallback(() => {
        setEditingPrereq({
            index: formData.prereqs?.length || 0,
            typeId: null,
            referenceId: null,
            amount: null
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
            setFormData(prev => ({
                ...prev,
                prereqs: prev.prereqs?.filter((_, index) => index !== prereqIndex) || []
            }));
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
            setIsLoading(true);
            if (id === 'new') {
                const newFeat = await FeatService.createFeat(formData as z.infer<typeof CreateFeatSchema>);
                setMessage('Feat created successfully!');

                // Navigate based on where user came from
                setTimeout(() => {
                    if (fromListParams) {
                        // User came from the list page, go back to list with params
                        navigate(`/admin/feats${fromListParams}`, { state: { refresh: true } });
                    } else {
                        // User came from detail page or direct URL, go to detail page
                        navigate(`/admin/feats/${newFeat.id}`, { state: { refresh: true } });
                    }
                }, 1500);
            } else {
                await FeatService.updateFeat(formData as z.infer<typeof UpdateFeatSchema>, { id: parseInt(id) });
                setMessage('Feat updated successfully!');

                // Navigate based on where user came from
                setTimeout(() => {
                    if (fromListParams) {
                        // User came from the list page, go back to list with params
                        navigate(`/admin/feats${fromListParams}`, { state: { refresh: true } });
                    } else {
                        // User came from detail page or direct URL, stay on detail page
                        navigate(`/admin/feats/${id}`, { state: { refresh: true } });
                    }
                }, 1500);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save feat');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !feat) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    if (error && !feat) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={() => navigate('/admin/feats')}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Back to Feats
                </button>
            </div>
        );
    }

    if (!feat) {
        return <div>No feat data available</div>;
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
                isLoading={isLoading}
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
                            options={FEAT_TYPE_SELECT_LIST}
                        />
                    </div>

                    <div className="flex justify-end">
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
                                                {FEAT_BENEFIT_TYPE_BY_ID[benefit.typeId]}: {FeatOptions(benefit.typeId).find(option => option.value === benefit.referenceId)?.label || ''} {benefit.typeId !== FeatBenefitType.PROFICIENCY && benefit.amount && benefit.amount > 0 ? `+${benefit.amount}` : benefit.typeId !== FeatBenefitType.PROFICIENCY && benefit.amount ? `${benefit.amount}` : ''}
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

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 mt-8">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/feats')}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading || form.validation.validationState.hasErrors}
                    >
                        {isLoading ? 'Saving...' : id === 'new' ? 'Create Feat' : 'Update Feat'}
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