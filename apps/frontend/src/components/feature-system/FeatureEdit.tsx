import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';

import { useAuthAuto } from '@/components/auth';
import {
    ValidatedForm,
    ValidatedInput,
    ValidatedCustomSelect,
    useValidatedForm,
    useFormContext
} from '@/components/forms';
import { FeatureSystemService } from '@/services/FeatureSystemService';
import { CreateFeatureSchema, UpdateFeatureSchema, GetFeatureResponse } from '@shared/schema';
import { FEATURE_PRE_REQ_SELECT_LIST, FeaturePrerequisiteType , SKILL_SELECT_LIST } from '@shared/static-data';

type CreateFeatureFormData = z.infer<typeof CreateFeatureSchema>;
type UpdateFeatureFormData = z.infer<typeof UpdateFeatureSchema>;
type FeatureFormData = CreateFeatureFormData | UpdateFeatureFormData;

export function FeatureEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAdmin } = useAuthAuto();
    const [feature, setFeature] = useState<GetFeatureResponse | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fromListParams = location.state?.fromListParams || '';
    const fromPage = location.state?.fromPage || 'features'; // 'classes', 'races', or 'features'

    // Determine which schema to use based on whether we're creating or editing
    const schema = id === 'new' ? CreateFeatureSchema : UpdateFeatureSchema;

    // Initialize form data with default values
    const initialFormData: FeatureFormData = {
        name: '',
        slug: '',
        description: '',
        prerequisites: [],
    };

    const [formData, setFormData] = useState<FeatureFormData>(initialFormData);

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

    useEffect(() => {
        const fetchFeature = async () => {
            if (id === 'new') {
                setFeature(null);
                setFormData(initialFormData);
                return;
            }

            try {
                setIsLoading(true);
                // Convert to number before passing to API
                const fetchedFeature = await FeatureSystemService.getFeatureById(undefined, { id: parseInt(id) });
                setFeature(fetchedFeature);
                setFormData(fetchedFeature);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch feature');
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeature();
    }, [id]);

    const getBackLink = () => {
        switch (fromPage) {
            case 'classes':
                return fromListParams ? `/classes?${fromListParams}` : '/classes';
            case 'races':
                return fromListParams ? `/races?${fromListParams}` : '/races';
            default:
                // Default to classes if no specific source is provided
                return '/classes';
        }
    };

    const getBackText = () => {
        switch (fromPage) {
            case 'classes':
                return 'Back to Classes';
            case 'races':
                return 'Back to Races';
            default:
                return 'Back to Classes';
        }
    };

    const addPrerequisite = () => {
        const newPrerequisite = {
            type: FeaturePrerequisiteType.SkillRanks,
            skillId: null,
            minValue: 1,
        };
        setFormData(prev => ({
            ...prev,
            prerequisites: [...(prev.prerequisites || []), newPrerequisite]
        }));
    };

    const removePrerequisite = (index: number) => {
        setFormData(prev => ({
            ...prev,
            prerequisites: (prev.prerequisites || []).filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        // Check if form has validation errors
        const hasErrors = form.validation.validationState.hasErrors;

        if (hasErrors) {
            setError('Please fix validation errors before submitting');
            return;
        }

        try {
            setIsLoading(true);

            if (id === 'new') {
                await FeatureSystemService.createFeature(formData as CreateFeatureFormData);
                setMessage('Feature created successfully');
            } else {
                // Convert to number before passing to API
                await FeatureSystemService.updateFeature(formData as UpdateFeatureFormData, { id: parseInt(id) });
                setMessage('Feature updated successfully');
            }

            // Navigate back after a short delay
            setTimeout(() => {
                navigate(getBackLink());
            }, 1000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save feature');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAdmin) {
        return (
            <div className="p-4">
                <p>Access denied. Admin privileges required.</p>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">
                        {id === 'new' ? 'Create New Feature' : 'Edit Feature'}
                    </h1>
                    <button
                        onClick={() => navigate(getBackLink())}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        {getBackText()}
                    </button>
                </div>

                {message && (
                    <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        Error: {error}
                    </div>
                )}

                <ValidatedForm
                    onSubmit={handleSubmit}
                    validationState={form.validation.validationState}
                    isLoading={isLoading}
                    formData={formData}
                    setFormData={setFormData}
                    validation={form.validation}
                >
                    <div className="space-y-4">
                        <ValidatedInput
                            field="name"
                            label="Feature Name"
                            type="text"
                            placeholder="Enter feature name"
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-30"
                            required
                            data-1p-ignore="true"
                        />

                        <ValidatedInput
                            field="slug"
                            label="Feature Slug"
                            type="text"
                            placeholder="Enter feature slug (URL-friendly identifier)"
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-30"
                            required
                            disabled={id !== 'new'} // Can't change slug when editing
                        />

                        <ValidatedInput
                            field="description"
                            label="Description"
                            type="textarea"
                            labelExtraClassName="mb-2"
                            inputExtraClassName="w-full"
                            placeholder="Enter feature description (supports markdown)"
                            rows={8}
                            required
                        />

                        {/* Prerequisites Section */}
                        <div className="mt-6">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-medium">Prerequisites</h3>
                                <button
                                    type="button"
                                    onClick={addPrerequisite}
                                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                >
                                    Add Prerequisite
                                </button>
                            </div>
                            {formData.prerequisites && formData.prerequisites.length > 0 ? (
                                <div className="space-y-4 border p-4 rounded-md">
                                    {formData.prerequisites.map((prerequisite, index) => (
                                        <div key={index} className="relative p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                                            <button
                                                type="button"
                                                onClick={() => removePrerequisite(index)}
                                                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                                aria-label="Remove prerequisite"
                                            >
                                                ✕
                                            </button>
                                            <PrerequisiteDetailForm index={index} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-500 italic p-4 border rounded-md">
                                    No prerequisites added. Click "Add Prerequisite" to add one.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => navigate(getBackLink())}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                            disabled={isLoading || form.validation.validationState.hasErrors}
                        >
                            {isLoading ? 'Saving...' : (id === 'new' ? 'Create Feature' : 'Update Feature')}
                        </button>
                    </div>
                </ValidatedForm>
            </div>
        </div>
    );
}

interface PrerequisiteDetailFormProps {
    index: number;
}

function PrerequisiteDetailForm({ index }: PrerequisiteDetailFormProps) {
    const { formData, setFormData } = useFormContext();
    const prerequisites = formData.prerequisites as any[] || [];
    const prerequisite = prerequisites[index] || {};

    return (
        <div className="space-y-4">
            <div>
                <ValidatedCustomSelect
                    field={`prerequisites.${index}.type`}
                    label="Prerequisite Type"
                    required
                    options={FEATURE_PRE_REQ_SELECT_LIST}
                    placeholder="Select prerequisite type"
                    componentExtraClassName="flex items-center gap-2"
                    nested
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                {prerequisite.type === FeaturePrerequisiteType.SkillRanks && (
                    <div>
                        <ValidatedCustomSelect
                            field={`prerequisites.${index}.skillId`}
                            label="Skill"
                            required
                            options={SKILL_SELECT_LIST}
                            placeholder="Select skill"
                            componentExtraClassName="flex items-center gap-2"
                            nested
                        />
                    </div>
                )}

                <div>
                    <ValidatedInput
                        field={`prerequisites.${index}.minValue`}
                        label="Minimum Value"
                        type="number"
                        min={1}
                        required
                        componentExtraClassName="flex items-center gap-2"
                        inputExtraClassName="w-16"
                        nested
                    />
                </div>
            </div>
        </div>
    );
}
