import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import {
    ValidatedForm,
    ValidatedInput,
    useValidatedForm,
    SourceEditor,
} from '@/components/forms';
import { CustomSelect } from '@/components/forms/FormComponents';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { TrickQueryHooks } from '@/services/query/TrickQueryHooks';
import {
    CreateTrickPurposeRequest,
    UpdateTrickPurposeRequest,
    CreateTrickPurposeSchema,
    UpdateTrickPurposeSchema,
    Trick,
    TrickPurposeTrickInput,
} from '@shared/schema';
import { EDITION_LIST, SourceType, EditionId } from '@shared/static-data';

import { TrickPurposeQueryHooks } from './TrickPurposeQueryHooks';

type TrickPurposeFormData = CreateTrickPurposeRequest | UpdateTrickPurposeRequest;

/**
 * Create or edit a Handle Animal purpose package, including its trick list.
 */
export function TrickPurposeEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [loadError, setLoadError] = useState<Error | null>(null);
    const [tricks, setTricks] = useState<Trick[]>([]);

    const isNew = id === 'new';
    const fromListParams = location.state?.fromListParams || '';
    const schema = isNew ? CreateTrickPurposeSchema : UpdateTrickPurposeSchema;

    const initialFormData: TrickPurposeFormData = useMemo(() => ({
        name: '',
        description: null,
        dc: 15,
        trainingWeeks: 3,
        editionId: 5,
        isVisible: true,
        replacesPurposeId: null,
        tricks: [],
        sourceBookInfo: [],
    }), []);

    const [formData, setFormData] = useState<TrickPurposeFormData>(initialFormData);

    const form = useValidatedForm(
        schema,
        formData,
        setFormData,
        {
            validateOnChange: true,
            validateOnBlur: true,
            debounceMs: 300,
        }
    );

    const { data: purposesData } = TrickPurposeQueryHooks.useGetTrickPurposes();

    useEffect(() => {
        TrickQueryHooks.getTricks()
            .then((response) => {
                setTricks(response.results);
            })
            .catch((err) => {
                console.error('Error loading tricks:', err);
            });
    }, []);

    useEffect(() => {
        if (isNew || !id) {
            return;
        }

        setIsLoading(true);
        TrickPurposeQueryHooks.getTrickPurposeById(parseInt(id, 10))
            .then((data) => {
                setFormData({
                    name: data.name,
                    description: data.description ?? null,
                    dc: data.dc,
                    trainingWeeks: data.trainingWeeks,
                    editionId: data.editionId,
                    isVisible: data.isVisible,
                    replacesPurposeId: data.replacesPurposeId ?? null,
                    tricks: (data.tricks ?? []).map((row) => ({
                        trickId: row.trickId,
                        timesTrained: row.timesTrained,
                    })),
                    sourceBookInfo: data.sourceBookInfo ?? [],
                });
            })
            .catch((err) => {
                setLoadError(err instanceof Error ? err : new Error('Failed to load purpose'));
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [id, isNew]);

    const purposeOptions = useMemo(() => {
        const currentId = !isNew && id ? parseInt(id, 10) : null;
        const noneOption = { id: 0, name: 'None' };
        const others = (purposesData?.results ?? [])
            .filter((purpose) => purpose.id !== currentId)
            .map((purpose) => ({ id: purpose.id, name: purpose.name }));
        return [noneOption, ...others];
    }, [purposesData?.results, id, isNew]);

    const selectedTrickIds = new Set((formData.tricks ?? []).map((row) => row.trickId));

    const toggleTrick = (trickId: number) => {
        const current = formData.tricks ?? [];
        const exists = current.find((row) => row.trickId === trickId);
        const next: TrickPurposeTrickInput[] = exists
            ? current.filter((row) => row.trickId !== trickId)
            : [...current, { trickId, timesTrained: 1 }];
        setFormData({ ...formData, tricks: next });
    };

    const setTimesTrained = (trickId: number, timesTrained: number) => {
        const current = formData.tricks ?? [];
        setFormData({
            ...formData,
            tricks: current.map((row) => (
                row.trickId === trickId ? { ...row, timesTrained } : row
            )),
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage('');

        if (!form.validation.validateForm(formData)) {
            return;
        }

        const payload: TrickPurposeFormData = {
            ...formData,
            replacesPurposeId: formData.replacesPurposeId && formData.replacesPurposeId > 0
                ? formData.replacesPurposeId
                : null,
        };

        try {
            setIsSaving(true);
            if (isNew) {
                await TrickPurposeQueryHooks.createTrickPurpose(payload as CreateTrickPurposeRequest);
                setMessage('Purpose created successfully!');
                setTimeout(() => {
                    navigate(`/trick-purposes${fromListParams}`);
                }, 1000);
            } else if (id) {
                await TrickPurposeQueryHooks.updateTrickPurpose(parseInt(id, 10), payload as UpdateTrickPurposeRequest);
                setMessage('Purpose updated successfully!');
                setTimeout(() => {
                    navigate(`/trick-purposes/${id}${fromListParams}`);
                }, 1000);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-4">Loading...</div>;
    }

    if (loadError) {
        return <div className="p-4 text-red-500">Error loading purpose: {loadError.message}</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">{isNew ? 'Create Trick Purpose' : 'Edit Trick Purpose'}</h1>

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

            <ValidatedForm
                onSubmit={handleSubmit}
                validationState={form.validation.validationState}
                isLoading={isSaving}
                formData={formData}
                setFormData={setFormData}
                validation={form.validation}
            >
                <div className="space-y-4">
                    <ValidatedInput
                        field="name"
                        label="Name"
                        placeholder="Enter purpose name"
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <MarkdownEditor
                            value={(formData.description as string) || ''}
                            onChange={(value) => setFormData({ ...formData, description: value || null })}
                        />
                    </div>

                    <ValidatedInput
                        field="dc"
                        label="DC"
                        type="number"
                        placeholder="Training DC"
                        required
                    />

                    <ValidatedInput
                        field="trainingWeeks"
                        label="Training Weeks"
                        type="number"
                        required
                    />

                    <CustomSelect
                        label="Edition"
                        value={formData.editionId ?? 5}
                        onValueChange={(value) => setFormData({ ...formData, editionId: value })}
                        options={EDITION_LIST}
                    />

                    <CustomSelect
                        label="Replaces Purpose"
                        value={formData.replacesPurposeId ?? 0}
                        onValueChange={(value) => setFormData({
                            ...formData,
                            replacesPurposeId: value > 0 ? value : null,
                        })}
                        options={purposeOptions}
                    />

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="isVisible"
                            checked={formData.isVisible ?? true}
                            onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                            className="mr-2"
                        />
                        <label htmlFor="isVisible" className="text-sm font-medium">
                            Visible
                        </label>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold mb-2">Package Tricks</h2>
                        <div className="space-y-2 border border-gray-200 dark:border-gray-600 rounded p-3">
                            {tricks.map((trick) => {
                                const selected = selectedTrickIds.has(trick.id);
                                const row = (formData.tricks ?? []).find((entry) => entry.trickId === trick.id);
                                return (
                                    <div key={trick.id} className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id={`purpose-trick-${trick.id}`}
                                            checked={selected}
                                            onChange={() => toggleTrick(trick.id)}
                                        />
                                        <label htmlFor={`purpose-trick-${trick.id}`} className="flex-1">
                                            {trick.name} (DC {trick.dc})
                                        </label>
                                        {selected && trick.maxTimesTrainable > 1 && (
                                            <input
                                                type="number"
                                                min={1}
                                                max={trick.maxTimesTrainable}
                                                value={row?.timesTrained ?? 1}
                                                onChange={(e) => setTimesTrained(trick.id, parseInt(e.target.value, 10) || 1)}
                                                className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <SourceEditor
                        sources={formData.sourceBookInfo || []}
                        onSourcesChange={(sources) => setFormData({ ...formData, sourceBookInfo: sources })}
                        sourceType={SourceType.Core}
                        editionId={formData.editionId as EditionId}
                    />

                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : isNew ? 'Create' : 'Update'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(`/trick-purposes${fromListParams}`)}
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
