import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';

import {
    ValidatedForm,
    ValidatedInput,
    useValidatedForm
} from '@/components/forms';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { ClassFeatureService } from '@/features/admin/features/class-management/ClassFeatureService';
import { CreateClassFeatureSchema, UpdateClassFeatureSchema } from '@shared/schema';

type ClassFeatureFormData = z.infer<typeof CreateClassFeatureSchema> | z.infer<typeof UpdateClassFeatureSchema>;

export function ClassFeatureEdit() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [feature, setFeature] = useState<ClassFeatureFormData | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Determine which schema to use based on whether we're creating or editing
    const schema = slug === 'new' ? CreateClassFeatureSchema : UpdateClassFeatureSchema;

    // Initialize form data with default values
    const initialFormData: ClassFeatureFormData = {
        slug: '',
        description: '',
        ...(slug !== 'new' && { slug: slug })
    };

    const [formData, setFormData] = useState<ClassFeatureFormData>(initialFormData);

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
            if (slug === 'new') {
                setFeature(initialFormData);
                return;
            }

            try {
                setIsLoading(true);
                const fetchedFeature = await ClassFeatureService.getClassFeatureBySlug(undefined, { slug });
                setFeature(fetchedFeature);
                setFormData(fetchedFeature);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch class feature');
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeature();
    }, [slug]);

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
            if (slug === 'new') {
                const newFeature = await ClassFeatureService.createClassFeature(formData as z.infer<typeof CreateClassFeatureSchema>);
                setMessage('Class feature created successfully!');
                if (location.state?.from === 'ClassFeatureAssoc' && location.state?.classId) {
                    navigate(`/admin/classes/${location.state.classId}/edit`, { state: { newFeature: newFeature } });
                } else {
                    navigate('/admin/classes');
                }
            } else {
                await ClassFeatureService.updateClassFeature(formData as z.infer<typeof UpdateClassFeatureSchema>, { slug });
                setMessage('Class feature updated successfully!');
                navigate('/admin/classes');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save class feature');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !feature) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    if (error && !feature) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={() => navigate('/admin/classes')}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Back to Classes
                </button>
            </div>
        );
    }

    if (!feature) {
        return <div>No class feature data available</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">
                    {slug === 'new' ? 'Create New Class Feature' : 'Edit Class Feature'}
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
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <ValidatedInput
                            field="slug"
                            label="Feature Slug"
                            type="text"
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-20"
                            inputExtraClassName="w-auto"
                            required
                            placeholder="e.g., spellcasting, weapon-proficiency"
                            disabled={slug !== 'new'}
                        />
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
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 mt-8">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/classes')}
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
                        {isLoading ? 'Saving...' : slug === 'new' ? 'Create Feature' : 'Update Feature'}
                    </button>
                </div>
            </ValidatedForm>
        </div>
    );
} 