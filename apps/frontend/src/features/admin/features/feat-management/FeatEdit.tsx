import { TrashIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';

import {
    ValidatedForm,
    ValidatedInput,
    ValidatedCheckbox,
    ValidatedListbox,
    useValidatedForm
} from '@/components/forms';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { FeatBenefitEdit } from '@/features/admin/features/feat-management/FeatBenefitEdit';
import { FeatPrereqEdit } from '@/features/admin/features/feat-management/FeatPrereqEdit';
import { FeatService } from '@/features/admin/features/feat-management/FeatService';
import { FeatOptions } from '@/lib/FeatUtil';
import { CreateFeatSchema, FeatBenefitSchema, FeatPrerequisiteSchema, UpdateFeatSchema } from '@shared/schema';
import { FEAT_PREREQUISITE_TYPES, FEAT_TYPE_LIST, FEAT_BENEFIT_TYPE_BY_ID } from '@shared/static-data';



// Type definitions for the form state
type FeatFormData = z.infer<typeof CreateFeatSchema> | z.infer<typeof UpdateFeatSchema>;
type FeatBenefitFormData = z.infer<typeof FeatBenefitSchema>;
type FeatPrerequisiteFormData = z.infer<typeof FeatPrerequisiteSchema>;

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
    const { validation, createFieldProps, createCheckboxProps } = useValidatedForm(
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

    const HandleMarkdownChange = (name: keyof FeatFormData) => (content: string) => {
        setFormData(prev => ({ ...prev, [name]: content }));
    };

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
            setMessage('Benefit removed successfully from feat!');
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
            setMessage('Prerequisite removed successfully from feat!');
        }
    }, []);

    const HandleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        // Validate the entire form
        if (!validation.validateForm(formData)) {
            return;
        }

        try {
            setIsLoading(true);
            if (id === 'new') {
                const newFeat = await FeatService.createFeat(formData as z.infer<typeof CreateFeatSchema>);
                setMessage('Feat created successfully!');
                setTimeout(() => navigate(`/admin/feats/${newFeat.id}`, { state: { fromListParams: fromListParams, refresh: true } }), 1500);
            } else {
                await FeatService.updateFeat(formData as z.infer<typeof UpdateFeatSchema>, { id: parseInt(id) });
                setMessage('Feat updated successfully!');
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

    // Create field props for each form field
    const nameProps = {
        ...createFieldProps('name'),
        value: formData.name as string || ''
    };
    const descriptionProps = {
        ...createFieldProps('description'),
        value: formData.description as string || ''
    };
    const benefitProps = {
        ...createFieldProps('benefit'),
        value: formData.benefit as string || ''
    };
    const normalEffectProps = {
        ...createFieldProps('normalEffect'),
        value: formData.normalEffect as string || ''
    };
    const specialEffectProps = {
        ...createFieldProps('specialEffect'),
        value: formData.specialEffect as string || ''
    };
    const prerequisitesProps = {
        ...createFieldProps('prerequisites'),
        value: formData.prerequisites as string || ''
    };

    const repeatableProps = {
        ...createCheckboxProps('repeatable'),
        checked: formData.repeatable as boolean || false
    };
    const fighterBonusProps = {
        ...createCheckboxProps('fighterBonus'),
        checked: formData.fighterBonus as boolean || false
    };

    // Create listbox props for type
    const typeListboxProps = {
        value: formData.typeId,
        onChange: (value: string | number | null) => {
            const numValue = value as number;
            setFormData(prev => ({ ...prev, typeId: numValue }));
            validation.validateField('typeId', numValue);
        },
        error: validation.getError('typeId'),
        hasError: validation.hasError('typeId')
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">
                    {id === 'new' ? 'Create New Feat' : 'Edit Feat'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    {id === 'new' ? 'Create a new feat' : 'Modify feat details'}
                </p>
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
                validationState={validation.validationState}
                isLoading={isLoading}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Basic Information</h2>

                        <ValidatedInput
                            name="name"
                            label="Feat Name"
                            type="text"
                            required
                            placeholder="e.g., Power Attack, Weapon Focus"
                            {...nameProps}
                        />

                        <ValidatedListbox
                            name="typeId"
                            label="Feat Type"
                            value={formData.typeId}
                            onChange={(value) => setFormData(prev => ({ ...prev, typeId: value as number }))}
                            options={FEAT_TYPE_LIST.map(type => ({ value: type.id, label: type.name }))}
                            required
                            {...typeListboxProps}
                        />

                        <div className="space-y-2">
                            <ValidatedCheckbox
                                name="repeatable"
                                label="Can be taken multiple times"
                                {...repeatableProps}
                            />

                            <ValidatedCheckbox
                                name="fighterBonus"
                                label="Fighter Bonus Feat"
                                {...fighterBonusProps}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Description</h2>
                        <div className="space-y-2">
                            <label htmlFor="description" className="block font-medium">
                                Feat Description
                            </label>
                            <MarkdownEditor
                                value={formData.description || ''}
                                onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                            />
                            {validation.getError('description') && (
                                <span className="text-red-500 text-sm">{validation.getError('description')}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Benefit */}
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-4">Benefit</h2>
                    <div className="space-y-2">
                        <label htmlFor="benefit" className="block font-medium">
                            What the feat provides
                        </label>
                        <MarkdownEditor
                            value={formData.benefit || ''}
                            onChange={(value) => setFormData(prev => ({ ...prev, benefit: value }))}
                        />
                        {validation.getError('benefit') && (
                            <span className="text-red-500 text-sm">{validation.getError('benefit')}</span>
                        )}
                    </div>
                </div>

                {/* Benefits Section */}
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-4">Benefits</h2>
                    {formData.benefits && formData.benefits.length > 0 ? (
                        <div className="space-y-2 border p-3 rounded dark:border-gray-600 mb-4">
                            {formData.benefits.map((benefit, index) => (
                                <div key={index} className="rounded border p-2 dark:border-gray-700 grid grid-cols-[2fr_0.1fr] gap-2 items-center">
                                    <div className="flex items-center gap-2">
                                        <div>
                                            {FEAT_BENEFIT_TYPE_BY_ID[benefit.typeId]?.name}:
                                        </div>
                                        <div>
                                            {FeatOptions.get(benefit.typeId)[benefit.referenceId]?.name || ''}
                                        </div>
                                        <div>
                                            {(benefit.amount && benefit.amount > 0 ? `+${benefit.amount}` : `${benefit.amount}`) || ''}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => HandleDeleteBenefit(index)}
                                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => HandleEditBenefitClick(benefit)}
                                            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-600"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-gray-500 dark:text-gray-400 mb-4">No benefits added yet.</div>
                    )}

                    <button
                        type="button"
                        onClick={HandleAddBenefitClick}
                        className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 text-white"
                    >
                        Add Benefit
                    </button>
                </div>

                {/* Normal Effect */}
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-4">Normal</h2>
                    <div className="space-y-2">
                        <label htmlFor="normalEffect" className="block font-medium">
                            What characters without this feat can do
                        </label>
                        <MarkdownEditor
                            value={formData.normalEffect || ''}
                            onChange={(value) => setFormData(prev => ({ ...prev, normalEffect: value }))}
                        />
                        {validation.getError('normalEffect') && (
                            <span className="text-red-500 text-sm">{validation.getError('normalEffect')}</span>
                        )}
                    </div>
                </div>

                {/* Special Effect */}
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-4">Special</h2>
                    <div className="space-y-2">
                        <label htmlFor="specialEffect" className="block font-medium">
                            Special rules or exceptions
                        </label>
                        <MarkdownEditor
                            value={formData.specialEffect || ''}
                            onChange={(value) => setFormData(prev => ({ ...prev, specialEffect: value }))}
                        />
                        {validation.getError('specialEffect') && (
                            <span className="text-red-500 text-sm">{validation.getError('specialEffect')}</span>
                        )}
                    </div>
                </div>

                {/* Prerequisites */}
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-4">Prerequisites</h2>
                    <div className="space-y-2">
                        <label htmlFor="prerequisites" className="block font-medium">
                            Text description of prerequisites
                        </label>
                        <MarkdownEditor
                            value={formData.prerequisites || ''}
                            onChange={(value) => setFormData(prev => ({ ...prev, prerequisites: value }))}
                        />
                        {validation.getError('prerequisites') && (
                            <span className="text-red-500 text-sm">{validation.getError('prerequisites')}</span>
                        )}
                    </div>
                </div>

                {/* Prerequisites Section */}
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-4">Prerequisite Requirements</h2>
                    {formData.prereqs && formData.prereqs.length > 0 ? (
                        <div className="space-y-2 border p-3 rounded dark:border-gray-600 mb-4">
                            {formData.prereqs.map((prereq, index) => (
                                <div key={index} className="rounded border p-2 dark:border-gray-700 grid grid-cols-[2fr_0.1fr] gap-2 items-center">
                                    <div className="flex items-center gap-2">
                                        <div>
                                            {FEAT_PREREQUISITE_TYPES[prereq.typeId]?.name}:
                                        </div>
                                        <div>
                                            {prereq.referenceId || ''}
                                        </div>
                                        <div>
                                            {(prereq.amount && prereq.amount > 0 ? `${prereq.amount}` : `${prereq.amount}`) || ''}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => HandleDeletePrereq(index)}
                                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => HandleEditPrereqClick(prereq)}
                                            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-600"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-gray-500 dark:text-gray-400 mb-4">No prerequisites added yet.</div>
                    )}

                    <button
                        type="button"
                        onClick={HandleAddPrereqClick}
                        className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 text-white"
                    >
                        Add Prerequisite
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
                        disabled={isLoading || validation.validationState.hasErrors}
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