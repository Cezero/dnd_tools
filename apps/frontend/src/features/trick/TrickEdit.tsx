import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import {
    ValidatedForm,
    ValidatedInput,
    useValidatedForm,
    SourceEditor
} from '@/components/forms';
import { CustomSelect } from '@/components/forms/FormComponents';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { TrickQueryHooks } from '@/services/query/TrickQueryHooks';
import { CreateTrickRequest, UpdateTrickRequest, UpdateTrickSchema, CreateTrickSchema } from '@shared/schema';
import { EDITION_LIST } from '@shared/static-data';

// Type definitions for the form state
type TrickFormData = CreateTrickRequest | UpdateTrickRequest;

export function TrickEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Use imperative API for data fetching and mutations
    const [trick, setTrick] = useState<unknown | null>(null);
    const [isLoadingTrick, setIsLoadingTrick] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [trickError, setTrickError] = useState<Error | null>(null);

    const isNew = id === 'new';
    const fromListParams = location.state?.fromListParams || '';

    // Form validation
    const form = useValidatedForm<TrickFormData>({
        schema: isNew ? CreateTrickSchema : UpdateTrickSchema,
        defaultValues: {
            name: '',
            description: null,
            editionId: 1,
            isVisible: true,
            sourceBookInfo: [],
        },
    });

    // Load existing trick if editing
    useEffect(() => {
        if (!isNew && id) {
            setIsLoadingTrick(true);
            TrickQueryHooks.getTrickById(parseInt(id))
                .then((data) => {
                    setTrick(data);
                    if (data) {
                        form.reset({
                            name: data.name,
                            description: data.description || null,
                            editionId: data.editionId,
                            isVisible: data.isVisible,
                            sourceBookInfo: (data as { sourceBookInfo?: Array<{ sourceBookId: number; pageNumber?: number | null }> }).sourceBookInfo || [],
                        });
                    }
                })
                .catch((err) => {
                    setTrickError(err);
                    console.error('Error loading trick:', err);
                })
                .finally(() => {
                    setIsLoadingTrick(false);
                });
        }
    }, [id, isNew, form]);

    const handleSubmit = useCallback(async (data: TrickFormData) => {
        setError(null);
        setMessage('');

        try {
            if (isNew) {
                setIsCreating(true);
                await TrickQueryHooks.createTrick(data);
                setMessage('Trick created successfully!');
                setTimeout(() => {
                    navigate(`/tricks${fromListParams}`);
                }, 1000);
            } else if (id) {
                setIsUpdating(true);
                await TrickQueryHooks.updateTrick(parseInt(id), data);
                setMessage('Trick updated successfully!');
                setTimeout(() => {
                    navigate(`/tricks/${id}${fromListParams}`);
                }, 1000);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);
            console.error('Error saving trick:', err);
        } finally {
            setIsCreating(false);
            setIsUpdating(false);
        }
    }, [isNew, id, navigate, fromListParams]);

    if (isLoadingTrick) {
        return <div className="p-4">Loading...</div>;
    }

    if (trickError) {
        return <div className="p-4 text-red-500">Error loading trick: {trickError.message}</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">{isNew ? 'Create Trick' : 'Edit Trick'}</h1>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            {message && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                    {message}
                </div>
            )}

            <ValidatedForm form={form} onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <ValidatedInput
                        form={form}
                        name="name"
                        label="Name"
                        placeholder="Enter trick name"
                    />

                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <MarkdownEditor
                            value={form.watch('description') || ''}
                            onChange={(value) => form.setValue('description', value || null)}
                        />
                    </div>

                    <CustomSelect
                        label="Edition"
                        value={form.watch('editionId')?.toString() || '1'}
                        onChange={(value) => form.setValue('editionId', parseInt(value))}
                        options={EDITION_LIST.map(edition => ({
                            value: edition.id.toString(),
                            label: edition.name
                        }))}
                    />

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="isVisible"
                            checked={form.watch('isVisible') ?? true}
                            onChange={(e) => form.setValue('isVisible', e.target.checked)}
                            className="mr-2"
                        />
                        <label htmlFor="isVisible" className="text-sm font-medium">
                            Visible
                        </label>
                    </div>

                    <SourceEditor
                        value={form.watch('sourceBookInfo') || []}
                        onChange={(value) => form.setValue('sourceBookInfo', value)}
                    />

                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={isCreating || isUpdating}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                        >
                            {isCreating || isUpdating ? 'Saving...' : isNew ? 'Create' : 'Update'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(`/tricks${fromListParams}`)}
                            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </ValidatedForm>
        </div>
    );
}

