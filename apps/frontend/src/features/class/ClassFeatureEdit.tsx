import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';

import {
    ValidatedForm,
    ValidatedInput,
    useValidatedForm
} from '@/components/forms';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { ClassFeatureService } from './ClassFeatureService';
import {
    CreateClassFeatureSchema,
    UpdateClassFeatureSchema,
    ClassFeatureWithRelationsSchema
} from '@shared/schema';
import { ClassFeatureModifiersSection } from './ClassFeatureModifiersSection';
import { ClassFeatureEffectsSection } from './ClassFeatureEffectsSection';
import { ClassFeatureChoicesSection } from './ClassFeatureChoicesSection';

type ClassFeatureFormData = z.infer<typeof CreateClassFeatureSchema> | z.infer<typeof UpdateClassFeatureSchema>;

export function ClassFeatureEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [feature, setFeature] = useState<ClassFeatureFormData | null>(null);
    const [featureWithRelations, setFeatureWithRelations] = useState<z.infer<typeof ClassFeatureWithRelationsSchema> | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const isNew = id === 'new';
    const schema = isNew ? CreateClassFeatureSchema : UpdateClassFeatureSchema;

    const initialFormData: ClassFeatureFormData = {
        slug: '',
        name: '',
        description: '',
    };

    const [formData, setFormData] = useState<ClassFeatureFormData>(initialFormData);

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
            if (isNew) {
                setFeature(initialFormData);
                return;
            }

            try {
                setIsLoading(true);
                const fetchedFeature = await ClassFeatureService.getClassFeatureById(undefined, { id: parseInt(id!) });
                setFeature(fetchedFeature);
                setFormData(fetchedFeature);

                // Fetch rich data with relationships
                try {
                    const richFeature = await ClassFeatureService.getClassFeatureWithRelations(undefined, { id: parseInt(id!) });
                    setFeatureWithRelations(richFeature);
                } catch (relationError) {
                    console.warn('Failed to fetch feature relationships:', relationError);
                    // Continue without relationships for now
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch class feature');
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeature();
    }, [id, isNew, initialFormData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        if (!form.validation.validateForm(formData)) {
            return;
        }

        try {
            setIsLoading(true);
            if (isNew) {
                const newFeature = await ClassFeatureService.createClassFeature(formData as z.infer<typeof CreateClassFeatureSchema>);
                setMessage('Class feature created successfully!');
                if (location.state?.from === 'ClassFeatureAssoc' && location.state?.classId) {
                    navigate(`/classes/${location.state.classId}/edit`, { state: { newFeature: newFeature } });
                } else {
                    navigate('/classes');
                }
            } else {
                await ClassFeatureService.updateClassFeature(formData as z.infer<typeof UpdateClassFeatureSchema>, { id: parseInt(id!) });
                setMessage('Class feature updated successfully!');
                navigate('/classes');
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
                    onClick={() => navigate('/classes')}
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
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">
                    {isNew ? 'Create New Class Feature' : 'Edit Class Feature'}
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
                onSubmit={handleSubmit}
                validationState={form.validation.validationState}
                isLoading={isLoading}
                formData={formData}
                setFormData={setFormData}
                validation={form.validation}
            >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Basic Information</h2>

                        <ValidatedInput
                            field="slug"
                            label="Feature Slug"
                            type="text"
                            required
                            placeholder="e.g., spellcasting, weapon-proficiency"
                            disabled={!isNew}
                        />

                        <ValidatedInput
                            field="name"
                            label="Feature Name"
                            type="text"
                            required
                            placeholder="e.g., Spellcasting, Weapon Proficiency"
                        />

                        <div className="space-y-2">
                            <label className="block font-medium">Description</label>
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

                    {/* Relationships Management */}
                    {!isNew && featureWithRelations && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold">Feature Details</h2>

                            <ClassFeatureModifiersSection
                                featureId={parseInt(id!)}
                                modifiers={featureWithRelations.modifiers || []}
                                onModifiersChange={(modifiers) => {
                                    setFeatureWithRelations(prev => prev ? { ...prev, modifiers } : null);
                                }}
                            />

                            <ClassFeatureEffectsSection
                                featureId={parseInt(id!)}
                                effects={featureWithRelations.progressions?.[0]?.effects || []}
                                onEffectsChange={(effects) => {
                                    setFeatureWithRelations(prev => {
                                        if (!prev || !prev.progressions?.[0]) return prev;
                                        return {
                                            ...prev,
                                            progressions: [
                                                {
                                                    ...prev.progressions[0],
                                                    effects
                                                }
                                            ]
                                        };
                                    });
                                }}
                            />

                            <ClassFeatureChoicesSection
                                featureId={parseInt(id!)}
                                choices={featureWithRelations.progressions?.[0]?.choices || []}
                                onChoicesChange={(choices) => {
                                    setFeatureWithRelations(prev => {
                                        if (!prev || !prev.progressions?.[0]) return prev;
                                        return {
                                            ...prev,
                                            progressions: [
                                                {
                                                    ...prev.progressions[0],
                                                    choices
                                                }
                                            ]
                                        };
                                    });
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 mt-8">
                    <button
                        type="button"
                        onClick={() => navigate('/classes')}
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
                        {isLoading ? 'Saving...' : isNew ? 'Create Feature' : 'Update Feature'}
                    </button>
                </div>
            </ValidatedForm>
        </div>
    );
} 
