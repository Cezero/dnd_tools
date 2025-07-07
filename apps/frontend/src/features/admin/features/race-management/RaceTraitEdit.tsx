import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';

import { Checkbox } from '@base-ui-components/react/checkbox';
import {
    ValidatedForm,
    ValidatedInput,
    useValidatedForm
} from '@/components/forms';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { RaceTraitService } from '@/features/admin/features/race-management/RaceTraitService';
import { CreateRaceTraitSchema, UpdateRaceTraitSchema } from '@shared/schema';
import { CustomCheckbox } from '@/components/forms/FormComponents';

// Type definitions for the form state
type CreateRaceTraitFormData = z.infer<typeof CreateRaceTraitSchema>;
type UpdateRaceTraitFormData = z.infer<typeof UpdateRaceTraitSchema>;
type RaceTraitFormData = CreateRaceTraitFormData | UpdateRaceTraitFormData;

export function RaceTraitEdit() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [trait, setTrait] = useState<RaceTraitFormData | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Determine which schema to use based on whether we're creating or editing
    const schema = slug === 'new' ? CreateRaceTraitSchema : UpdateRaceTraitSchema;

    // Initialize form data with default values
    const initialFormData: RaceTraitFormData = {
        slug: '',
        description: '',
        hasValue: false,
        ...(slug !== 'new' && { slug: slug })
    };

    const [formData, setFormData] = useState<RaceTraitFormData>(initialFormData);

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
        const fetchTrait = async () => {
            if (slug === 'new') {
                setTrait(initialFormData);
                return;
            }

            try {
                setIsLoading(true);
                const fetchedTrait = await RaceTraitService.getRaceTraitBySlug(undefined, { slug });
                setTrait(fetchedTrait);
                setFormData(fetchedTrait);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch race trait');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTrait();
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
                const newTrait = await RaceTraitService.createRaceTrait(formData as z.infer<typeof CreateRaceTraitSchema>);
                setMessage('Race trait created successfully!');
                if (location.state?.from === 'RaceTraitAssoc' && location.state?.raceId) {
                    navigate(`/admin/races/${location.state.raceId}/edit`, { state: { newTrait: newTrait } });
                } else {
                    navigate('/admin/races');
                }
            } else {
                await RaceTraitService.updateRaceTrait(formData as z.infer<typeof UpdateRaceTraitSchema>, { slug });
                setMessage('Race trait updated successfully!');
                navigate('/admin/races');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save race trait');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !trait) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    if (error && !trait) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={() => navigate('/admin/races')}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Back to Races
                </button>
            </div>
        );
    }

    if (!trait) {
        return <div>No race trait data available</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">
                    {slug === 'new' ? 'Create New Race Trait' : 'Edit Race Trait'}
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
                            label="Trait Slug"
                            type="text"
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-20"
                            inputExtraClassName="w-auto"
                            required
                            placeholder="e.g., darkvision, weapon-proficiency"
                            disabled={slug !== 'new'}
                        />
                        <CustomCheckbox
                            label="Has Associated Value"
                            checked={formData.hasValue as boolean}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasValue: checked }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <MarkdownEditor
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
                        onClick={() => navigate('/admin/races')}
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
                        {isLoading ? 'Saving...' : slug === 'new' ? 'Create Trait' : 'Update Trait'}
                    </button>
                </div>
            </ValidatedForm>
        </div>
    );
}
