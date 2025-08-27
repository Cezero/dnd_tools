import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { FeatureProgressionDetailEdit } from '@/components/feature-system';
import { FeatureSystemApi } from '@/components/feature-system/FeatureSystemApi';
import {
    ValidatedForm,
    ValidatedInput,
    ValidatedCustomSelect,
    useValidatedForm,
    useFormContext
} from '@/components/forms';
import { FeatApi } from '@/features/feat/FeatApi';
import { displayStrategyFactory } from '@/lib/formatters';
import { CreateFeatureRequest, CreateFeatureSchema, UpdateFeatureRequest, UpdateFeatureSchema, GetFeatureResponse, FeatureProgression, FeaturePrerequisite } from '@shared/schema';
import { DisplayType, FEATURE_PRE_REQ_SELECT_LIST, FeaturePrerequisiteType, FULL_SKILL_SELECT_LIST, FeatureSourceType, ModifierAppliesToType } from '@shared/static-data';

type FeatureFormData = CreateFeatureRequest | UpdateFeatureRequest;

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

    // FeatureProgression management state
    const [featureProgressions, setFeatureProgressions] = useState<FeatureProgression[]>([]);
    const [isProgressionDialogOpen, setIsProgressionDialogOpen] = useState(false);
    const [editingProgression, setEditingProgression] = useState<FeatureProgression | null>(null);
    const [feats, setFeats] = useState<Array<{ id: number; name: string }>>([]);

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
            // Early return for new feature or invalid id
            if (id === 'new' || !id) {
                setFeature(null);
                setFormData({
                    name: '',
                    slug: '',
                    description: '',
                    prerequisites: [],
                });
                return;
            }

            // Additional safety check to ensure id is a valid number
            const numericId = parseInt(id);
            if (isNaN(numericId)) {
                setFeature(null);
                setFormData({
                    name: '',
                    slug: '',
                    description: '',
                    prerequisites: [],
                });
                return;
            }

            try {
                setIsLoading(true);
                const fetchedFeature = await FeatureSystemApi.getFeatureById(undefined, { id: numericId });
                setFeature(fetchedFeature);
                setFormData(fetchedFeature);

                // Load feature progressions for this feature
                const progressions = await FeatureSystemApi.getFeatureProgressions(undefined, { id: numericId });
                setFeatureProgressions(progressions);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch feature');
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeature();
    }, [id]);

    // Load feats if we have feat modifiers
    useEffect(() => {
        const loadFeatsIfNeeded = async () => {
            const hasFeatModifiers = featureProgressions.some(progression =>
                progression.modifiers?.some(modifier =>
                    modifier.appliesTo === ModifierAppliesToType.Feat
                )
            );

            if (hasFeatModifiers && feats.length === 0) {
                try {
                    const response = await FeatApi.getFeats({});
                    setFeats(response.results || []);
                } catch (error) {
                    console.error('Failed to load feats:', error);
                }
            }
        };

        loadFeatsIfNeeded();
    }, [featureProgressions, feats.length]);

    const handleBack = () => {
        const backLink = getBackLink();
        navigate(backLink);
    };

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

    // FeatureProgression management handlers
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
                const result = await FeatureSystemApi.createFeature(formData as CreateFeatureRequest);
                setMessage('Feature created successfully');

                // Save FeatureProgressions after feature creation
                if (featureProgressions.length > 0) {
                    const featureId = parseInt(result.id);
                    // Remove temporary IDs from related entities and set the real featureId
                    const progressionsForBackend = featureProgressions.map(progression => {
                        const { id: _, ...progressionData } = progression;
                        return {
                            ...progressionData,
                            featureId: featureId,
                            // Remove temporary IDs from related entities
                            modifiers: progression.modifiers?.map(mod => {
                                const { id: _, featureProgressionId: __, ...modData } = mod;
                                return modData;
                            }) || [],
                            choices: progression.choices?.map(choice => {
                                const { id: _, progressionId: __, ...choiceData } = choice;
                                return choiceData;
                            }) || [],
                            effects: progression.effects?.map(effect => {
                                const { id: _, progressionId: __, ...effectData } = effect;
                                return effectData;
                            }) || [],
                        };
                    });
                    await FeatureSystemApi.updateFeatureProgressions({ progressions: progressionsForBackend }, { id: featureId });
                }
            } else {
                // Additional safety check to ensure id is a valid number
                const numericId = parseInt(id);
                if (isNaN(numericId)) {
                    throw new Error('Invalid feature ID');
                }
                await FeatureSystemApi.updateFeature(formData as UpdateFeatureRequest, { id: numericId });
                setMessage('Feature updated successfully');

                // Save FeatureProgressions after feature update
                if (featureProgressions.length > 0) {
                    // Remove temporary IDs from related entities
                    const progressionsForBackend = featureProgressions.map(progression => {
                        const { id: _, ...progressionData } = progression;
                        return {
                            ...progressionData,
                            // Remove temporary IDs from related entities
                            modifiers: progression.modifiers?.map(mod => {
                                const { id: _, featureProgressionId: __, ...modData } = mod;
                                return modData;
                            }) || [],
                            choices: progression.choices?.map(choice => {
                                const { id: _, progressionId: __, ...choiceData } = choice;
                                return choiceData;
                            }) || [],
                            effects: progression.effects?.map(effect => {
                                const { id: _, progressionId: __, ...effectData } = effect;
                                return effectData;
                            }) || [],
                        };
                    });
                    await FeatureSystemApi.updateFeatureProgressions({ progressions: progressionsForBackend }, { id: numericId });
                }
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
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-red-500 mb-4">Access denied. Admin privileges required.</p>
                <button
                    onClick={handleBack}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    {getBackText()}
                </button>
            </div>
        );
    }

    if (isLoading && !formData) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    if (error && !formData) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={handleBack}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    {getBackText()}
                </button>
            </div>
        );
    }

    if (!formData) {
        return <div>No feature data available</div>;
    }

    // Enhance feature progressions with feat data
    const enhancedFeatureProgressions = featureProgressions.map(progression => ({
        ...progression,
        modifiers: progression.modifiers?.map(modifier => {
            if (modifier.appliesTo === ModifierAppliesToType.Feat && modifier.appliesToId) {
                const feat = feats.find(f => f.id === modifier.appliesToId);
                if (feat) {
                    return { ...modifier, feat };
                }
                return modifier;
            }
            return modifier;
        })
    }));

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">
                    {id === 'new' ? 'Create New Feature' : 'Edit Feature'}
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
                            disabled={id !== 'new'} // Can't change slug when editing existing features
                        />
                    </div>
                </div>

                {/* Description */}
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

                {/* Prerequisites Section */}
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

                {/* Feature Progressions Section */}
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-semibold">Feature Progressions</h2>
                        <button
                            type="button"
                            onClick={handleOpenProgressionDialog}
                            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={id === 'new' && (!formData.name || !formData.slug)}
                            title={id === 'new' && (!formData.name || !formData.slug) ? 'Please fill in feature name and slug first' : ''}
                        >
                            Add Progression
                        </button>
                    </div>
                    {featureProgressions.length > 0 ? (
                        <div className="space-y-4 border p-4 rounded-md dark:border-gray-600">
                            {enhancedFeatureProgressions.map((progression) => (
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
                                        {progression.modifiers && progression.modifiers.length > 0 && (
                                            <div>
                                                <h4 className="font-medium">Modifiers:</h4>
                                                <ul className="text-sm text-gray-600 dark:text-gray-400">
                                                    {progression.modifiers.map((modifier, index) => {
                                                        const strategy = displayStrategyFactory.createStrategy(DisplayType.Edit);
                                                        const formatter = strategy.formatProgression({ ...progression, modifiers: [modifier] });
                                                        return (
                                                            <li key={index}>
                                                                {formatter.formattedValue}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        )}
                                        {progression.choices && progression.choices.length > 0 && (
                                            <div>
                                                <h4 className="font-medium">Choices:</h4>
                                                <ul className="text-sm text-gray-600 dark:text-gray-400">
                                                    {progression.choices.map((choice, index) => (
                                                        <li key={index}>
                                                            {choice.label}: {choice.type} ({choice.behavior})
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {progression.effects && progression.effects.length > 0 && (
                                            <div>
                                                <h4 className="font-medium">Effects:</h4>
                                                <ul className="text-sm text-gray-600 dark:text-gray-400">
                                                    {progression.effects.map((effect, index) => (
                                                        <li key={index}>
                                                            {effect.effectType}: {effect.key} = {effect.value}
                                                        </li>
                                                    ))}
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
                        onClick={handleBack}
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
                        {isLoading ? 'Saving...' : (id === 'new' ? 'Create Feature' : 'Update Feature')}
                    </button>
                </div>
            </ValidatedForm>

            {/* Feature Progression Dialog */}
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
                        handleAddProgression(progression);
                    }
                    setIsProgressionDialogOpen(false);
                    setEditingProgression(null);
                }}
                preSelectedFeature={feature ? {
                    id: feature.id,
                    name: feature.name,
                    description: feature.description,
                    slug: feature.slug
                } : id === 'new' ? {
                    id: 0, // Will be set by the backend when feature is created
                    name: formData.name || 'New Feature',
                    description: formData.description || '',
                    slug: formData.slug || 'new-feature'
                } : undefined}
            />
        </div>
    );
}

interface PrerequisiteDetailFormProps {
    index: number;
}

function PrerequisiteDetailForm({ index }: PrerequisiteDetailFormProps) {
    const { formData, setFormData: _setFormData } = useFormContext();
    const prerequisites = formData.prerequisites as FeaturePrerequisite[] || [];
    const prerequisite = prerequisites[index] || { type: undefined };

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
                            options={FULL_SKILL_SELECT_LIST}
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
