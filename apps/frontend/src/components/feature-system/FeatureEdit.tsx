import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';

import { useAuthAuto } from '@/components/auth';
import {
    ValidatedForm,
    ValidatedInput,
    useValidatedForm
} from '@/components/forms';
import { FeatureSystemService } from '@/services/FeatureSystemService';
import { CreateFeatureSchema, UpdateFeatureSchema, GetFeatureResponse } from '@shared/schema';

type CreateFeatureFormData = z.infer<typeof CreateFeatureSchema>;
type UpdateFeatureFormData = z.infer<typeof UpdateFeatureSchema>;
type FeatureFormData = CreateFeatureFormData | UpdateFeatureFormData;

export function FeatureEdit() {
    const { slug } = useParams();
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
    const schema = slug === 'new' ? CreateFeatureSchema : UpdateFeatureSchema;

    // Initialize form data with default values
    const initialFormData: FeatureFormData = {
        name: '',
        slug: '',
        description: '',
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
            if (slug === 'new') {
                setFeature(null);
                setFormData(initialFormData);
                return;
            }

            try {
                setIsLoading(true);
                const fetchedFeature = await FeatureSystemService.getFeatureBySlug(undefined, { slug });
                setFeature(fetchedFeature);
                setFormData(fetchedFeature);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch feature');
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeature();
    }, [slug]);

    const getBackLink = () => {
        switch (fromPage) {
            case 'classes':
                return fromListParams ? `/classes?${fromListParams}` : '/classes';
            case 'races':
                return fromListParams ? `/races?${fromListParams}` : '/races';
            default:
                return fromListParams ? `/features?${fromListParams}` : '/features';
        }
    };

    const getBackText = () => {
        switch (fromPage) {
            case 'classes':
                return 'Back to Classes';
            case 'races':
                return 'Back to Races';
            default:
                return 'Back to Features';
        }
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

            if (slug === 'new') {
                await FeatureSystemService.createFeature(formData as CreateFeatureFormData);
                setMessage('Feature created successfully');
            } else {
                await FeatureSystemService.updateFeature(formData as UpdateFeatureFormData, { slug });
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
                        {slug === 'new' ? 'Create New Feature' : 'Edit Feature'}
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
                            disabled={slug !== 'new'} // Can't change slug when editing
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
                            {isLoading ? 'Saving...' : (slug === 'new' ? 'Create Feature' : 'Update Feature')}
                        </button>
                    </div>
                </ValidatedForm>
            </div>
        </div>
    );
} 
