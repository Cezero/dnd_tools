import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import { useValidatedForm, ValidatedForm, ValidatedInput } from '@/components/forms';
import { MonsterQueryHooks } from '@/services/query/MonsterQueryHooks';
import { UpdateMonsterSchema, GetMonsterResponse, UpdateMonsterRequest } from '@shared/schema';

export function MonsterEdit(): React.JSX.Element {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    const [monster, setMonster] = useState<GetMonsterResponse | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState<UpdateMonsterRequest | null>(null);

    const form = useValidatedForm(
        UpdateMonsterSchema,
        formData || {},
        ((data: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>)) => {
            if (typeof data === 'function') {
                setFormData(prev => data(prev || {}) as UpdateMonsterRequest);
            } else {
                setFormData(data as UpdateMonsterRequest);
            }
        }) as (data: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>)) => void,
        {
            validateOnChange: true,
            validateOnBlur: true,
            debounceMs: 300,
        }
    );

    // Load monster data
    const { data: monsterData, isLoading: isLoadingMonster } = MonsterQueryHooks.useGetMonsterById(
        { pathParams: { id: parseInt(id!) } },
        { enabled: !!id }
    );

    useEffect(() => {
        if (monsterData) {
            setMonster(monsterData);
            setFormData(monsterData);
        }
    }, [monsterData]);

    const updateMonsterMutation = MonsterQueryHooks.useUpdateMonster();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage('');

        if (!formData || !form.validation.validateForm(formData) || !id) {
            setError('Please fix validation errors');
            return;
        }

        setIsLoading(true);
        try {
            await updateMonsterMutation.mutateAsync({
                requestData: formData as unknown,
                pathParams: { id: parseInt(id) },
            });
            setMessage('Monster updated successfully');
            setTimeout(() => {
                navigate(`/monsters/${id}${fromListParams ? `?${fromListParams}` : ''}`);
            }, 1000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update monster');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoadingMonster) {
        return <div className="p-4">Loading monster...</div>;
    }

    if (!monster) {
        return <div className="p-4">Monster not found</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Edit Monster: {monster.name}</h1>

            {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            {message && (
                <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 rounded">
                    {message}
                </div>
            )}

            <ValidatedForm
                onSubmit={handleSubmit}
                validationState={form.validation.validationState}
                isLoading={isLoading}
                formData={formData || {}}
                setFormData={setFormData as (data: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>)) => void}
                validation={form.validation}
            >
                {/* Basic Information */}
                <div className="border p-4 rounded">
                    <h2 className="text-xl font-semibold mb-3">Basic Information</h2>
                    <div className="space-y-3">
                        <ValidatedInput
                            field="name"
                            label="Name"
                            type="text"
                            required
                            componentExtraClassName="space-y-1"
                        />
                        {/* Add more basic fields as needed */}
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={isLoading || form.validation.validationState.hasErrors}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(`/monsters/${id}${fromListParams ? `?${fromListParams}` : ''}`)}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                        Cancel
                    </button>
                </div>
            </ValidatedForm>
        </div>
    );
}

