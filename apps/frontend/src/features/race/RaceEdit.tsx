import { TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import pluralize from 'pluralize';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';

import {
    ValidatedForm,
    ValidatedInput,
    useValidatedForm
} from '@/components/forms';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { RaceService } from './RaceService';
import { RaceFeatureAssoc } from './RaceFeatureAssoc';
import { UpdateRaceSchema, GetRaceResponseSchema, FeatureProgressionWithRelationsSchema } from '@shared/schema';
import { EDITION_SELECT_LIST_FULL, SIZE_SELECT_LIST, ABILITY_LIST, LANGUAGE_SELECT_LIST, FeatureModifierType, FeatureAppliesToType } from '@shared/static-data';
import { CustomCheckbox, CustomSelect } from '@/components/forms/FormComponents';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';

// Type definitions for the form state
type CreateRaceFormData = z.infer<typeof GetRaceResponseSchema>;
type UpdateRaceFormData = z.infer<typeof UpdateRaceSchema>;
type RaceFormData = CreateRaceFormData | UpdateRaceFormData;

export function RaceEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [race, setRace] = useState<RaceFormData | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAddFeatureModalOpen, setIsAddFeatureModalOpen] = useState(false);
    const [focusedAbilityId, setFocusedAbilityId] = useState<number | null>(null);
    const [editingAbilityValue, setEditingAbilityValue] = useState('');
    const fromListParams = location.state?.fromListParams || '';

    // Determine which schema to use based on whether we're creating or editing
    const schema = id === 'new' ? GetRaceResponseSchema : UpdateRaceSchema;

    // Initialize form data with default values
    const initialFormData: RaceFormData = {
        name: '',
        editionId: 1,
        isVisible: true,
        description: '',
        sizeId: 5, // Default to Medium
        speed: 30, // Default to 30
        favoredClassId: -1,
        featureProgression: [],
    };

    const [formData, setFormData] = useState<RaceFormData>(initialFormData);

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
        const fetchRace = async () => {
            if (id === 'new') {
                setRace(initialFormData);
                return;
            }

            try {
                setIsLoading(true);
                const fetchedRace = await RaceService.getRaceById(undefined, { id: parseInt(id) });
                setRace(fetchedRace);
                setFormData(fetchedRace);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch race');
            } finally {
                setIsLoading(false);
            }
        };

        fetchRace();
    }, [id]);

    /**
     * Handles adding or updating race features.
     */
    const handleAddOrUpdateFeature = useCallback((selectedFeatureObjects: Array<{ featureId: number; slug: string; name: string; description: string; level: number }>) => {
        setRace(prev => {
            // Create a map of existing features for quick lookup by slug
            const existingFeaturesMap = new Map(prev.featureProgression?.map(f => [f.feature?.slug, f]) || []);

            const updatedFeatures = selectedFeatureObjects.map(selectedFeature => {
                const existingFeature = existingFeaturesMap.get(selectedFeature.slug);
                return {
                    id: existingFeature?.id || 0, // Will be set by backend
                    featureId: selectedFeature.featureId,
                    sourceType: 0, // 0 for Race
                    sourceId: parseInt(id || '0'),
                    level: selectedFeature.level,
                    feature: {
                        id: selectedFeature.featureId,
                        slug: selectedFeature.slug,
                        name: selectedFeature.name,
                        description: selectedFeature.description,
                    },
                    modifiers: existingFeature?.modifiers || [],
                    choices: existingFeature?.choices || [],
                    effects: existingFeature?.effects || [],
                };
            });
            return { ...prev, featureProgression: updatedFeatures };
        });
        setIsAddFeatureModalOpen(false);
    }, [id]);

    useEffect(() => {
        if (location.state?.newFeature) {
            handleAddOrUpdateFeature([location.state.newFeature]);
            setIsAddFeatureModalOpen(true);
        }
    }, [location.state, handleAddOrUpdateFeature]);

    /**
     * Handles the deletion of a race feature from the current race.
     */
    const handleDeleteFeature = useCallback(async (featureSlug: string) => {
        if (window.confirm('Are you sure you want to remove this feature from the race?')) {
            setRace(prev => ({
                ...prev,
                featureProgression: prev.featureProgression?.filter(feature => feature.feature?.slug !== featureSlug) || []
            }));
            setMessage('Feature removed successfully from race!');
        }
    }, []);

    /**
     * Handles adding a language to the race via the feature system.
     */
    const handleAddLanguage = useCallback((languageId: number, isAutomatic: boolean) => {
        setRace(prev => {
            // Create a new feature progression for the language
            const newLanguageFeature = {
                id: 0, // Will be set by backend
                featureId: 0, // Will be set by backend when feature is created
                sourceType: 0, // 0 for Race
                sourceId: parseInt(id || '0'),
                level: isAutomatic ? 1 : 2, // Level 1 for automatic, Level 2 for bonus
                feature: {
                    id: 0,
                    slug: `language-${languageId}`,
                    name: `Language ${languageId}`,
                    description: `Language feature for ${languageId}`,
                },
                modifiers: [],
                choices: [{
                    id: 0,
                    featureProgressionId: 0,
                    choiceType: 0, // TODO: Define appropriate choice type
                    label: `Language ${languageId}`,
                    pickCount: 1,
                    appliesToType: FeatureAppliesToType.Language,
                    appliesTo: languageId,
                }],
                effects: [],
            };

            // Check if language already exists
            const existingLanguage = prev.featureProgression?.find(fp =>
                fp.choices?.some(c => c.appliesToType === FeatureAppliesToType.Language && c.appliesTo === languageId)
            );

            if (existingLanguage) {
                // Update existing language feature
                const updatedFeatures = prev.featureProgression?.map(fp =>
                    fp.choices?.some(c => c.appliesToType === FeatureAppliesToType.Language && c.appliesTo === languageId)
                        ? { ...fp, level: isAutomatic ? 1 : 2 }
                        : fp
                ) || [];
                return { ...prev, featureProgression: updatedFeatures };
            } else {
                // Add new language feature
                return {
                    ...prev,
                    featureProgression: [...(prev.featureProgression || []), newLanguageFeature]
                };
            }
        });
    }, [id]);

    /**
     * Handles the removal of a language from the race.
     */
    const handleRemoveLanguage = useCallback((languageId: number) => {
        setRace(prev => ({
            ...prev,
            featureProgression: prev.featureProgression?.filter(fp =>
                !fp.choices?.some(c => c.appliesToType === FeatureAppliesToType.Language && c.appliesTo === languageId)
            ) || []
        }));
    }, []);

    /**
     * Handles changes to an ability adjustment for the race via the feature system.
     */
    const handleAbilityChange = useCallback((abilityId: number, parsedValue: number) => {
        setRace(prev => {
            // Find existing ability adjustment feature
            const existingAbilityFeature = prev.featureProgression?.find(fp =>
                fp.modifiers?.some(m => m.modifierType === FeatureModifierType.FlatBonus && m.appliesTo === abilityId)
            );

            if (existingAbilityFeature) {
                // Update existing ability adjustment
                const updatedFeatures = prev.featureProgression?.map(fp =>
                    fp.modifiers?.some(m => m.modifierType === FeatureModifierType.FlatBonus && m.appliesTo === abilityId)
                        ? {
                            ...fp,
                            modifiers: fp.modifiers?.map(m =>
                                m.modifierType === FeatureModifierType.FlatBonus && m.appliesTo === abilityId
                                    ? { ...m, value: parsedValue }
                                    : m
                            ) || []
                        }
                        : fp
                ) || [];
                return { ...prev, featureProgression: updatedFeatures };
            } else if (parsedValue !== 0) {
                // Create new ability adjustment feature
                const newAbilityFeature = {
                    id: 0,
                    featureId: 0,
                    sourceType: 0, // 0 for Race
                    sourceId: parseInt(id || '0'),
                    level: 1,
                    feature: {
                        id: 0,
                        slug: `ability-adjustment-${abilityId}`,
                        name: `Ability Adjustment ${abilityId}`,
                        description: `Ability adjustment feature for ${abilityId}`,
                    },
                    modifiers: [{
                        id: 0,
                        featureProgressionId: 0,
                        modifierType: FeatureModifierType.FlatBonus,
                        value: parsedValue,
                        appliesTo: abilityId,
                        appliesIfChoiceKey: null,
                        appliesIfChoiceValue: null,
                    }],
                    choices: [],
                    effects: [],
                };
                return {
                    ...prev,
                    featureProgression: [...(prev.featureProgression || []), newAbilityFeature]
                };
            }
            return prev;
        });
    }, [id]);

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
            if (id === 'new') {
                const newRace = await RaceService.createRace(race as z.infer<typeof GetRaceResponseSchema>);
                setMessage('Race created successfully!');
                setTimeout(() => navigate(`/races/${newRace.id}`, { state: { fromListParams: fromListParams, refresh: true } }), 1500);
            } else {
                await RaceService.updateRace(race as z.infer<typeof UpdateRaceSchema>, { id: parseInt(id) });
                setMessage('Race updated successfully!');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save race');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !race) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    if (error && !race) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={() => navigate('/races')}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Back to Races
                </button>
            </div>
        );
    }

    if (!race) {
        return <div>No race data available</div>;
    }

    // Helper functions to extract languages and ability adjustments from feature progression
    const getLanguages = () => {
        const languageFeatures = formData.featureProgression?.filter(fp =>
            fp.choices?.some(c => c.appliesToType === FeatureAppliesToType.Language)
        ) || [];

        return languageFeatures.map(fp => {
            const languageChoice = fp.choices?.find(c => c.appliesToType === FeatureAppliesToType.Language);
            return {
                languageId: languageChoice?.appliesTo || 0,
                isAutomatic: fp.level === 1 // Level 1 features are automatic languages
            };
        });
    };

    const getAbilityAdjustments = () => {
        const abilityFeatures = formData.featureProgression?.filter(fp =>
            fp.modifiers?.some(m => m.modifierType === FeatureModifierType.FlatBonus)
        ) || [];

        return ABILITY_LIST.map(ability => {
            const abilityFeature = abilityFeatures.find(fp =>
                fp.modifiers?.some(m => m.modifierType === FeatureModifierType.FlatBonus && m.appliesTo === ability.id)
            );
            const abilityModifier = abilityFeature?.modifiers?.find(m => m.modifierType === FeatureModifierType.FlatBonus && m.appliesTo === ability.id);
            return {
                abilityId: ability.id,
                value: abilityModifier?.value || 0
            };
        });
    };

    const automaticLanguages = getLanguages().filter(lang => lang.isAutomatic);
    const bonusLanguages = getLanguages().filter(lang => !lang.isAutomatic);

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">
                    {id === 'new' ? 'Create New Race' : 'Edit Race'}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 w-full">
                        <ValidatedInput
                            field="name"
                            label="Name"
                            type="text"
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-30"
                            inputExtraClassName="w-auto"
                            required
                            placeholder="e.g., Human, Elf, Dwarf"
                            data-1p-ignore
                        />
                        <div className="flex items-center gap-4 w-full">
                            <CustomSelect
                                label="Size"
                                value={formData.sizeId}
                                options={SIZE_SELECT_LIST}
                                required
                                componentExtraClassName="flex items-center gap-2"
                                labelExtraClassName="w-30"
                                itemExtraClassName="w-auto"
                                itemTextExtraClassName="w-16"
                                onValueChange={(value) => setFormData(prev => ({ ...prev, sizeId: value as number }))}
                                placeholder="Select size"
                            />
                            <ValidatedInput
                                field="speed"
                                label="Speed"
                                componentExtraClassName="flex items-center gap-2"
                                labelExtraClassName="w-30"
                                inputExtraClassName="w-auto"
                                type="number"
                                min={0}
                                max={60}
                                step={5}
                            />
                        </div>
                        <CustomSelect
                            label="Favored Class"
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-30"
                            itemExtraClassName="w-full"
                            itemTextExtraClassName="w-24"
                            value={formData.favoredClassId}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, favoredClassId: value as number }))}
                            options={[
                                { value: -1, label: 'Any' },
                                ...GetBaseClassesByEdition(formData.editionId)
                            ]}
                            placeholder="Select favored class"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex flex-col justify-end">
                            <CustomSelect
                                label="Edition"
                                required
                                componentExtraClassName="flex items-center gap-2"
                                labelExtraClassName="w-2/7"
                                itemExtraClassName="w-24"
                                itemTextExtraClassName="w-16"
                                value={formData.editionId}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, editionId: value as number }))}
                                options={EDITION_SELECT_LIST_FULL}
                                placeholder="Select edition"
                            />
                            <CustomCheckbox
                                label="Visible in Lists"
                                checked={formData.isVisible as boolean}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVisible: checked }))}
                            />
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="mt-6">
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

                {/* Ability Adjustments and Languages */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Ability Adjustments</h3>
                        <div className="grid grid-cols-3 gap-2 border rounded p-2 dark:border-gray-600">
                            {ABILITY_LIST.map(ability => (
                                <div key={ability.id} className="flex items-center gap-2">
                                    <label htmlFor={`ability-${ability.id}`} className="text-sm font-medium w-20">
                                        {ability.name}:
                                    </label>
                                    <input
                                        type="text"
                                        id={`ability-${ability.id}`}
                                        value={focusedAbilityId === ability.id ? editingAbilityValue : (() => {
                                            const adjustment = getAbilityAdjustments().find(adj => adj.abilityId === ability.id)?.value || 0;
                                            return adjustment > 0 ? `+${adjustment}` : adjustment;
                                        })()}
                                        onChange={(e) => setEditingAbilityValue(e.target.value)}
                                        onFocus={() => {
                                            setFocusedAbilityId(ability.id);
                                            const currentAdjustment = getAbilityAdjustments().find(adj => adj.abilityId === ability.id)?.value || 0;
                                            setEditingAbilityValue(String(currentAdjustment));
                                        }}
                                        onBlur={() => {
                                            const parsedValue = editingAbilityValue === '' || editingAbilityValue === '-' ? 0 : parseInt(editingAbilityValue) || 0;
                                            handleAbilityChange(ability.id, parsedValue);
                                            setFocusedAbilityId(null);
                                            setEditingAbilityValue('');
                                        }}
                                        className="w-10 p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Automatic Languages</h3>
                            <div className="flex flex-wrap gap-2 mb-2 p-2 border rounded dark:border-gray-600 min-h-[40px]">
                                {automaticLanguages.length === 0 && <span className="text-gray-500 dark:text-gray-400">No automatic languages added.</span>}
                                {automaticLanguages.map((lang, index) => (
                                    <span key={lang.languageId} className="group relative text-sm pt-1 pb-1 pl-0 pr-0 cursor-pointer">
                                        {LANGUAGE_SELECT_LIST.find(l => l.value === lang.languageId)?.label || 'Unknown Language'}
                                        {index < automaticLanguages.length - 1 && ','}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveLanguage(lang.languageId)}
                                            className="absolute inset-0 flex items-center justify-center text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Remove Language"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </span>
                                ))}
                                <CustomSelect
                                    label=""
                                    value={null}
                                    componentExtraClassName="flex items-center gap-1 text-sm"
                                    itemExtraClassName="w-24 text-sm"
                                    itemTextExtraClassName="w-16"
                                    onValueChange={(value) => {
                                        if (value) {
                                            handleAddLanguage(value as number, true);
                                        }
                                    }}
                                    options={LANGUAGE_SELECT_LIST
                                        .filter(lang => !getLanguages().some(rl => rl.languageId === lang.value))}
                                    placeholder="Add"
                                />
                            </div>
                        </div>

                        {/* Bonus Languages */}
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Bonus Languages</h3>
                            <div className="flex flex-wrap gap-2 mb-2 p-2 border rounded dark:border-gray-600 min-h-[40px]">
                                {bonusLanguages.length === 0 && <span className="text-gray-500 dark:text-gray-400">No bonus languages added.</span>}
                                {bonusLanguages.map((lang, index) => (
                                    <span key={lang.languageId} className="group relative text-sm pt-1 pb-1 pl-0 pr-0 cursor-pointer">
                                        {LANGUAGE_SELECT_LIST.find(l => l.value === lang.languageId)?.label || 'Unknown Language'}
                                        {index < bonusLanguages.length - 1 && ','}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveLanguage(lang.languageId)}
                                            className="absolute inset-0 flex items-center justify-center text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Remove Language"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </span>
                                ))}
                                <CustomSelect
                                    label=""
                                    value={null}
                                    componentExtraClassName="flex items-center gap-1 text-sm"
                                    itemExtraClassName="w-24 text-sm"
                                    itemTextExtraClassName="w-16"
                                    onValueChange={(value) => {
                                        if (value) {
                                            handleAddLanguage(value as number, false);
                                        }
                                    }}
                                    options={LANGUAGE_SELECT_LIST
                                        .filter(lang => !getLanguages().some(rl => rl.languageId === lang.value))}
                                    placeholder="Add"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Race Features */}
                <div className="mt-4">
                    <h2 className="text-xl font-semibold mb-2">Features</h2>
                    {formData.featureProgression && formData.featureProgression.length > 0 ? (
                        <div className="space-y-2 border p-2 rounded dark:border-gray-600 mb-2">
                            {formData.featureProgression.map((featureProg, index) => (
                                <div key={index} className="rounded border p-2 dark:border-gray-700 grid grid-cols-[130px_1fr_auto] gap-2 items-center">
                                    <div>
                                        <h3 className="text-lg font-medium mb-2">{featureProg.feature?.name || featureProg.feature?.slug}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Level: {featureProg.level}</p>
                                    </div>
                                    <div className="w-full">
                                        <ProcessMarkdown
                                            markdown={featureProg.feature?.description || ''}
                                            id={`feature-${featureProg.feature?.slug}-description`}
                                            userVars={{
                                                racename: formData.name,
                                                racenamelower: formData.name.toLowerCase(),
                                                raceplural: pluralize(formData.name),
                                                raceplurallower: pluralize(formData.name).toLowerCase(),
                                            }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteFeature(featureProg.feature?.slug || '')}
                                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-gray-500 dark:text-gray-400 mb-4">No features added yet.</div>
                    )}

                    <button
                        type="button"
                        onClick={() => setIsAddFeatureModalOpen(true)}
                        className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 text-white"
                    >
                        Add Feature
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 mt-8">
                    <button
                        type="button"
                        onClick={() => navigate('/races')}
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
                        {isLoading ? 'Saving...' : id === 'new' ? 'Create Race' : 'Update Race'}
                    </button>
                </div>
            </ValidatedForm>

            <RaceFeatureAssoc
                isOpen={isAddFeatureModalOpen}
                onClose={() => {
                    setIsAddFeatureModalOpen(false);
                }}
                onSave={handleAddOrUpdateFeature}
                initialSelectedFeatureIds={formData.featureProgression?.map(f => f.feature?.slug || '') || []}
                raceId={parseInt(id)}
            />
        </div>
    );
}
