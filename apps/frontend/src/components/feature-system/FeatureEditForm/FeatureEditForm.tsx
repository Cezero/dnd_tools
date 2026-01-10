import { Dialog } from '@base-ui-components/react/dialog';
import { ScrollArea } from '@base-ui-components/react/scroll-area';
import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState, useRef } from 'react';

import { useAuthAuto } from '@/components/auth';
import { FeatureProgressionDetailEdit } from '@/components/feature-system';
import { FeatureSystemApi } from '@/components/feature-system/FeatureSystemApi';
import {
    ValidatedForm,
    ValidatedInput,
    ValidatedCustomSelect,
    ValidatedCustomCheckbox,
    useValidatedForm,
    useFormContext
} from '@/components/forms';
import { displayStrategyFactory } from '@/lib/formatters';
import { CacheQueryHooks } from '@/services/query/CacheQueryHooks';
import { ClassQueryHooks } from '@/services/query/ClassQueryHooks';
import { FeatQueryHooks } from '@/services/query/FeatQueryHooks';
import { RaceQueryHooks } from '@/services/query/RaceQueryHooks';
import { CreateFeatureRequest, CreateFeatureSchema, UpdateFeatureRequest, UpdateFeatureSchema, GetFeatureResponse, FeatureProgression, FeaturePrerequisite, Feature } from '@shared/schema';
import { DisplayType, FEATURE_PRE_REQ_LIST, FeaturePrerequisiteType, SKILL_LIST, FeatureSourceType, ABILITY_LIST } from '@shared/static-data';

import { FeatureEditFormProps } from './types';

type FeatureFormData = CreateFeatureRequest | UpdateFeatureRequest;

export function FeatureEditForm({
    featureId = 'new',
    isOpen = true,
    onClose,
    onSave,
    onCancel,
    mode = 'embedded',
    context,
    initialProgressions = [],
    showHeader = true
}: FeatureEditFormProps): React.JSX.Element {
    const { isAdmin } = useAuthAuto();
    const queryClient = useQueryClient();
    const [feature, setFeature] = useState<GetFeatureResponse | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [featureProgressions, setFeatureProgressions] = useState<FeatureProgression[]>([]);
    const [isProgressionDialogOpen, setIsProgressionDialogOpen] = useState(false);
    const [editingProgression, setEditingProgression] = useState<FeatureProgression | null>(null);
    const hasInitializedRef = useRef(false);
    const previousFeatureIdRef = useRef<number | 'new' | string | undefined>(featureId);
    const initialProgressionsRef = useRef(initialProgressions);
    
    // Update ref when initialProgressions changes, but only use it on first initialization
    useEffect(() => {
        initialProgressionsRef.current = initialProgressions;
    }, [initialProgressions]);

    const schema = featureId === 'new' ? CreateFeatureSchema : UpdateFeatureSchema;

    const initialFormData: FeatureFormData = {
        name: '',
        slug: '',
        description: '',
        summary: null,
        displayInCharacterSheet: true,
        prerequisites: [],
        ...(featureId !== 'new' && typeof featureId === 'number' && { id: featureId })
    };

    const [formData, setFormData] = useState<FeatureFormData>(initialFormData);

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
        // Reset initialization flag when featureId changes or modal closes
        if (previousFeatureIdRef.current !== featureId || (mode === 'modal' && !isOpen)) {
            hasInitializedRef.current = false;
            previousFeatureIdRef.current = featureId;
        }

        // Don't fetch if modal is closed
        if (mode === 'modal' && !isOpen) {
            return;
        }

        // Don't fetch if we've already initialized for this featureId
        if (hasInitializedRef.current && previousFeatureIdRef.current === featureId) {
            return;
        }

        const fetchFeature = async () => {
            if (featureId === 'new' || !featureId || typeof featureId === 'string') {
                setFeature(null);
                setFormData({
                    name: '',
                    slug: '',
                    description: '',
                    summary: null,
                    displayInCharacterSheet: true,
                    prerequisites: [],
                });
                // Only set initial progressions if we haven't initialized yet
                if (!hasInitializedRef.current && initialProgressionsRef.current.length > 0) {
                    setFeatureProgressions(initialProgressionsRef.current);
                } else if (!hasInitializedRef.current) {
                    setFeatureProgressions([]);
                }
                hasInitializedRef.current = true;
                return;
            }

            const numericId = featureId;
            if (isNaN(numericId)) {
                setFeature(null);
                setFormData({
                    name: '',
                    slug: '',
                    description: '',
                    summary: null,
                    displayInCharacterSheet: true,
                    prerequisites: [],
                });
                if (!hasInitializedRef.current && initialProgressionsRef.current.length > 0) {
                    setFeatureProgressions(initialProgressionsRef.current);
                } else if (!hasInitializedRef.current) {
                    setFeatureProgressions([]);
                }
                hasInitializedRef.current = true;
                return;
            }

            try {
                setIsLoading(true);
                const fetchedFeature = await FeatureSystemApi.getFeatureById(undefined, { id: numericId });
                setFeature(fetchedFeature);
                setFormData(fetchedFeature);

                const progressions = await FeatureSystemApi.getFeatureProgressions(undefined, { id: numericId });
                setFeatureProgressions(progressions);
                hasInitializedRef.current = true;
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch feature');
                hasInitializedRef.current = true;
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeature();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [featureId, mode, isOpen]);

    const addPrerequisite = () => {
        const newPrerequisite = {
            type: FeaturePrerequisiteType.SkillRanks,
            appliesToId: null,
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

    const handleAddProgression = (progression: FeatureProgression) => {
        setFeatureProgressions(prev => [...prev, progression]);
    };

    const handleUpdateProgression = (oldProgression: FeatureProgression, updatedProgression: FeatureProgression) => {
        setFeatureProgressions(prev => {
            const progressionIndex = prev.findIndex(p => p.id === oldProgression.id);
            if (progressionIndex === -1) {
                return [...prev, updatedProgression];
            }
            const newFeatureProgressions = [...prev];
            newFeatureProgressions[progressionIndex] = updatedProgression;
            return newFeatureProgressions;
        });
    };

    const handleRemoveProgression = (progressionId: number) => {
        setFeatureProgressions(prev => prev.filter(p => p.id !== progressionId));
    };

    const handleEditProgression = (progression: FeatureProgression) => {
        setEditingProgression(progression);
        setIsProgressionDialogOpen(true);
    };

    const handleOpenProgressionDialog = () => {
        setEditingProgression(null);
        setIsProgressionDialogOpen(true);
    };

    const createProgressionWithContext = (baseProgression: Partial<FeatureProgression>): FeatureProgression => {
        if (!context) {
            return {
                id: Date.now() + Math.random(),
                sourceType: FeatureSourceType.None,
                level: 1,
                featureId: feature?.id || 0,
                classId: null,
                raceId: null,
                domainId: null,
                featId: null,
                variantOverrideId: null,
                entities: [],
                ...baseProgression
            } as FeatureProgression;
        }

        const progression: FeatureProgression = {
            id: Date.now() + Math.random(),
            sourceType: context.sourceType,
            level: 1,
            featureId: feature?.id || 0,
            classId: null,
            raceId: null,
            domainId: null,
            featId: null,
            variantOverrideId: null,
            entities: [],
            ...baseProgression
        } as FeatureProgression;

        switch (context.parentType) {
            case 'class':
                progression.classId = context.parentId;
                break;
            case 'race':
                progression.raceId = context.parentId;
                break;
            case 'domain':
                progression.domainId = context.parentId;
                break;
            case 'feat':
                progression.featId = context.parentId;
                break;
        }

        return progression;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        if (form.validation.validationState.hasErrors) {
            setError('Please fix validation errors before submitting');
            return;
        }

        try {
            setIsLoading(true);

            let createdFeatureId: string | null = null;
            let savedFeature: Feature;

            if (featureId === 'new' || typeof featureId === 'string') {
                const result = await FeatureSystemApi.createFeature(formData as CreateFeatureRequest);
                setMessage('Feature created successfully');
                createdFeatureId = result.id;
                savedFeature = {
                    id: parseInt(result.id),
                    name: formData.name,
                    slug: formData.slug,
                    description: formData.description,
                    summary: formData.summary,
                    displayInCharacterSheet: formData.displayInCharacterSheet ?? true,
                    prerequisites: formData.prerequisites || []
                } as Feature;

                await queryClient.invalidateQueries({
                    queryKey: ['features'],
                    exact: false
                });

                if (featureProgressions.length > 0) {
                    const featureIdNum = parseInt(result.id);
                    const progressionsForBackend = featureProgressions.map(progression => {
                        const isTemporaryId = progression.id > 1000000000000;
                        const progressionData = isTemporaryId
                            ? (() => { const { id: _, ...data } = progression; return data; })()
                            : progression;

                        return {
                            ...progressionData,
                            featureId: featureIdNum,
                            entities: progression.entities?.map(entity => {
                                const { id: _, progressionId: __, feature: _feature, item: _item, domain: _domain, ...entityData } = entity;
                                return entityData;
                            }) || [],
                        };
                    });
                    await FeatureSystemApi.updateFeatureProgressions({ progressions: progressionsForBackend }, { id: featureIdNum });
                }
            } else {
                const numericId = featureId;
                await FeatureSystemApi.updateFeature(formData as UpdateFeatureRequest, { id: numericId });
                setMessage('Feature updated successfully');
                savedFeature = {
                    id: numericId,
                    name: formData.name,
                    slug: formData.slug,
                    description: formData.description,
                    summary: formData.summary,
                    displayInCharacterSheet: formData.displayInCharacterSheet ?? true,
                    prerequisites: formData.prerequisites || []
                } as Feature;

                await queryClient.invalidateQueries({
                    queryKey: ['features', 'item', numericId]
                });
                await queryClient.invalidateQueries({
                    queryKey: ['features', 'progressions', numericId]
                });
                await queryClient.invalidateQueries({
                    queryKey: ['features'],
                    exact: false
                });

                if (context?.parentType === 'class' && context.parentId) {
                    await queryClient.invalidateQueries({
                        queryKey: ClassQueryHooks.getClassByIdQueryKey(context.parentId)
                    });
                    await queryClient.invalidateQueries({
                        queryKey: ['classes'],
                        exact: false
                    });
                }
                if (context?.parentType === 'race' && context.parentId) {
                    await queryClient.invalidateQueries({
                        queryKey: RaceQueryHooks.getRaceByIdQueryKey(context.parentId)
                    });
                    await queryClient.invalidateQueries({
                        queryKey: ['races'],
                        exact: false
                    });
                }

                if (featureProgressions.length > 0) {
                    const progressionsForBackend = featureProgressions.map(progression => {
                        const isTemporaryId = progression.id > 1000000000000;
                        const progressionData = isTemporaryId
                            ? (() => { const { id: _, ...data } = progression; return data; })()
                            : progression;

                        return {
                            ...progressionData,
                            entities: progression.entities?.map(entity => {
                                const { id: _, progressionId: __, feature: _feature, item: _item, domain: _domain, ...entityData } = entity;
                                return entityData;
                            }) || [],
                        };
                    });
                    await FeatureSystemApi.updateFeatureProgressions({ progressions: progressionsForBackend }, { id: numericId });
                }
            }

            if (onSave) {
                onSave(savedFeature, featureProgressions);
            }

            if (mode === 'modal' && onClose) {
                setTimeout(() => {
                    onClose();
                }, 500);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save feature');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else if (onClose) {
            onClose();
        }
    };

    if (!isAdmin) {
        const errorContent = (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-red-500 mb-4">Access denied. Admin privileges required.</p>
                <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Close
                </button>
            </div>
        );

        if (mode === 'modal') {
            return (
                <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
                    <Dialog.Backdrop className="fixed inset-0 bg-black bg-opacity-25 z-40" />
                    <Dialog.Portal>
                        <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-2">
                            <div className="w-full max-w-4xl max-h-[90vh] transform rounded-2xl bg-white dark:bg-gray-800 flex flex-col shadow-xl">
                                {errorContent}
                            </div>
                        </Dialog.Popup>
                    </Dialog.Portal>
                </Dialog.Root>
            );
        }
        return errorContent;
    }

    if (isLoading && !formData) {
        const loadingContent = <div className="flex justify-center items-center h-64">Loading...</div>;
        if (mode === 'modal') {
            return (
                <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
                    <Dialog.Backdrop className="fixed inset-0 bg-black bg-opacity-25 z-40" />
                    <Dialog.Portal>
                        <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-2">
                            <div className="w-full max-w-4xl max-h-[90vh] transform rounded-2xl bg-white dark:bg-gray-800 flex flex-col shadow-xl">
                                {loadingContent}
                            </div>
                        </Dialog.Popup>
                    </Dialog.Portal>
                </Dialog.Root>
            );
        }
        return loadingContent;
    }

    if (error && !formData) {
        const errorContent = (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Close
                </button>
            </div>
        );
        if (mode === 'modal') {
            return (
                <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
                    <Dialog.Backdrop className="fixed inset-0 bg-black bg-opacity-25 z-40" />
                    <Dialog.Portal>
                        <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-2">
                            <div className="w-full max-w-4xl max-h-[90vh] transform rounded-2xl bg-white dark:bg-gray-800 flex flex-col shadow-xl">
                                {errorContent}
                            </div>
                        </Dialog.Popup>
                    </Dialog.Portal>
                </Dialog.Root>
            );
        }
        return errorContent;
    }

    if (!formData) {
        return <div>No feature data available</div>;
    }

    const formContent = (
        <>
            {showHeader && (
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">
                        {featureId === 'new' || typeof featureId === 'string' ? 'Create New Feature' : 'Edit Feature'}
                    </h1>
                </div>
            )}

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
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2 w-full">
                        <ValidatedInput
                            field="name"
                            label="Feature Name"
                            type="text"
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-30"
                            inputExtraClassName="w-auto"
                            required
                            placeholder="Enter feature name"
                            data-1p-ignore="true"
                        />

                        <ValidatedInput
                            field="slug"
                            label="Feature Slug"
                            type="text"
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-30"
                            inputExtraClassName="w-auto"
                            required
                            placeholder="Enter feature slug (URL-friendly identifier)"
                            disabled={featureId !== 'new' && typeof featureId === 'number'}
                        />
                    </div>
                </div>

                <div className="mt-6">
                    <div className="space-y-2">
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
                </div>

                <div className="mt-6">
                    <div className="space-y-2">
                        <ValidatedInput
                            field="summary"
                            label="Summary (for PDF character sheets)"
                            type="textarea"
                            labelExtraClassName="mb-2"
                            inputExtraClassName="w-full"
                            placeholder="Enter brief summary for character sheets (plain text, no markdown). Can contain template placeholders like {{feature.wild-shape.entities.uses.formattedValue}}"
                            rows={4}
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            This summary will be displayed on PDF character sheets. Keep it concise and avoid markdown formatting. You can use template placeholders like {`{{feature.wild-shape.entities.uses.formattedValue}}`} for dynamic content.
                        </p>
                    </div>
                </div>

                <div className="mt-6">
                    <div className="space-y-2">
                        <ValidatedCustomCheckbox
                            field="displayInCharacterSheet"
                            label="Display in Character Sheet"
                            componentExtraClassName="flex items-center gap-2"
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            When unchecked, this feature will be hidden from PDF character sheet output. Useful for features like "ex-clerics" that should not appear on character sheets.
                        </p>
                    </div>
                </div>

                <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-semibold">Prerequisites</h2>
                        <button
                            type="button"
                            onClick={addPrerequisite}
                            className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 text-white"
                        >
                            Add Prerequisite
                        </button>
                    </div>
                    {formData.prerequisites && formData.prerequisites.length > 0 ? (
                        <div className="space-y-4 border p-4 rounded-md dark:border-gray-600">
                            {formData.prerequisites.map((prerequisite, index) => (
                                <div key={index} className="relative p-4 border rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={() => removePrerequisite(index)}
                                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600"
                                        aria-label="Remove prerequisite"
                                    >
                                        ✕
                                    </button>
                                    <PrerequisiteDetailForm index={index} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-gray-500 dark:text-gray-400 italic p-4 border rounded-md dark:border-gray-600">
                            No prerequisites added. Click "Add Prerequisite" to add one.
                        </div>
                    )}
                </div>

                <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-semibold">Feature Progressions</h2>
                        <button
                            type="button"
                            onClick={handleOpenProgressionDialog}
                            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={(featureId === 'new' || typeof featureId === 'string') && (!formData.name || !formData.slug)}
                            title={(featureId === 'new' || typeof featureId === 'string') && (!formData.name || !formData.slug) ? 'Please fill in feature name and slug first' : ''}
                        >
                            Add Progression
                        </button>
                    </div>
                    {featureProgressions.length > 0 ? (
                        <div className="space-y-4 border p-4 rounded-md dark:border-gray-600">
                            {featureProgressions.map((progression) => (
                                <div key={progression.id} className="relative p-4 border rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveProgression(progression.id)}
                                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600"
                                        aria-label="Remove progression"
                                    >
                                        ✕
                                    </button>
                                    <div className="mb-2">
                                        <h3 className="text-lg font-medium">
                                            {progression.feature?.name || `Feature ${progression.featureId}`}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Level: {progression.level} | Source Type: {Object.keys(FeatureSourceType).find(key => FeatureSourceType[key as keyof typeof FeatureSourceType] === progression.sourceType) || `Unknown (${progression.sourceType})`}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        {progression.entities && progression.entities.length > 0 && (
                                            <div>
                                                <h4 className="font-medium">Entities:</h4>
                                                <ul className="text-sm text-gray-600 dark:text-gray-400">
                                                    {progression.entities.map((entity, index) => {
                                                        const strategy = displayStrategyFactory.createStrategy(DisplayType.Edit);
                                                        const result = strategy.format({ ...progression, entities: [entity] });
                                                        return (
                                                            <li key={index}>
                                                                {result.formattedValue || 'No preview'}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleEditProgression(progression)}
                                        className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                                    >
                                        Edit Progression
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-gray-500 dark:text-gray-400 italic p-4 border rounded-md dark:border-gray-600">
                            No progressions added. Click "Add Progression" to add one.
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-4 mt-8">
                    <button
                        type="button"
                        onClick={handleCancel}
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
                        {isLoading ? 'Saving...' : (featureId === 'new' || typeof featureId === 'string' ? 'Create Feature' : 'Update Feature')}
                    </button>
                </div>
            </ValidatedForm>

            <FeatureProgressionDetailEdit
                isOpen={isProgressionDialogOpen}
                onClose={() => {
                    setIsProgressionDialogOpen(false);
                    setEditingProgression(null);
                }}
                progression={editingProgression}
                onSave={(progression) => {
                    if (editingProgression) {
                        handleUpdateProgression(editingProgression, progression);
                    } else {
                        const progressionWithContext = createProgressionWithContext(progression);
                        handleAddProgression(progressionWithContext);
                    }
                    setIsProgressionDialogOpen(false);
                    setEditingProgression(null);
                }}
                preSelectedFeature={feature ? {
                    id: feature.id,
                    name: feature.name,
                    description: feature.description,
                    slug: feature.slug,
                    displayInCharacterSheet: feature.displayInCharacterSheet
                } : (featureId === 'new' || typeof featureId === 'string') ? {
                    id: 0,
                    name: formData.name || 'New Feature',
                    description: formData.description || '',
                    slug: formData.slug || 'new-feature',
                    displayInCharacterSheet: formData.displayInCharacterSheet ?? true
                } : undefined}
                showSourceTypeSelector={!context}
            />
        </>
    );

    if (mode === 'modal') {
        return (
            <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
                <Dialog.Backdrop className="fixed inset-0 bg-black bg-opacity-25 z-40" />
                <Dialog.Portal>
                    <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-2">
                        <div className="w-full max-w-4xl max-h-[90vh] transform rounded-2xl bg-white dark:bg-gray-800 flex flex-col shadow-xl">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
                                <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    {featureId === 'new' || typeof featureId === 'string' ? 'Create New Feature' : 'Edit Feature'}
                                </Dialog.Title>
                            </div>
                            <ScrollArea.Root className="flex-1 overflow-hidden">
                                <ScrollArea.Viewport>
                                    <ScrollArea.Content className="max-h-[calc(90vh-10rem)]">
                                        <div className="p-6">
                                            {formContent}
                                        </div>
                                    </ScrollArea.Content>
                                </ScrollArea.Viewport>
                                <ScrollArea.Scrollbar orientation="vertical" className="Scrollbar">
                                    <ScrollArea.Thumb className="Thumb" />
                                </ScrollArea.Scrollbar>
                            </ScrollArea.Root>
                        </div>
                    </Dialog.Popup>
                </Dialog.Portal>
            </Dialog.Root>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            {formContent}
        </div>
    );
}

interface PrerequisiteDetailFormProps {
    index: number;
}

function PrerequisiteDetailForm({ index }: PrerequisiteDetailFormProps) {
    const { formData } = useFormContext();
    const prerequisites = formData.prerequisites as FeaturePrerequisite[] || [];
    const prerequisite = prerequisites[index] || { type: undefined };

    const { data: featsResponse } = FeatQueryHooks.useGetFeats({});
    const featOptions = featsResponse?.results || [];

    const { data: classesCacheData } = CacheQueryHooks.useClassesCache();
    const classOptions = classesCacheData?.results || [];

    const showMinValue = prerequisite.type !== FeaturePrerequisiteType.Feat;

    return (
        <div className="space-y-4">
            <div>
                <ValidatedCustomSelect
                    field={`prerequisites.${index}.type`}
                    label="Prerequisite Type"
                    required
                    options={FEATURE_PRE_REQ_LIST}
                    placeholder="Select prerequisite type"
                    componentExtraClassName="flex items-center gap-2"
                    nested
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                {prerequisite.type === FeaturePrerequisiteType.SkillRanks && (
                    <div>
                        <ValidatedCustomSelect
                            field={`prerequisites.${index}.appliesToId`}
                            label="Skill"
                            required
                            options={SKILL_LIST}
                            placeholder="Select skill"
                            componentExtraClassName="flex items-center gap-2"
                            nested
                        />
                    </div>
                )}

                {prerequisite.type === FeaturePrerequisiteType.AbilityScore && (
                    <div>
                        <ValidatedCustomSelect
                            field={`prerequisites.${index}.appliesToId`}
                            label="Ability Score"
                            required
                            options={ABILITY_LIST}
                            placeholder="Select ability score"
                            componentExtraClassName="flex items-center gap-2"
                            nested
                        />
                    </div>
                )}

                {prerequisite.type === FeaturePrerequisiteType.Feat && (
                    <div>
                        <ValidatedCustomSelect
                            field={`prerequisites.${index}.appliesToId`}
                            label="Feat"
                            required
                            options={featOptions}
                            placeholder="Select feat"
                            componentExtraClassName="flex items-center gap-2"
                            nested
                        />
                    </div>
                )}

                {prerequisite.type === FeaturePrerequisiteType.ClassLevel && (
                    <div>
                        <ValidatedCustomSelect
                            field={`prerequisites.${index}.appliesToId`}
                            label="Class"
                            required
                            options={classOptions}
                            placeholder="Select class"
                            componentExtraClassName="flex items-center gap-2"
                            nested
                        />
                    </div>
                )}

                {showMinValue && (
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
                )}
            </div>
        </div>
    );
}
