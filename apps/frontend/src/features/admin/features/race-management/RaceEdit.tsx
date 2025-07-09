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
import { RaceService } from '@/features/admin/features/race-management/RaceService';
import { RaceTraitAssoc } from '@/features/admin/features/race-management/RaceTraitAssoc';
import { UpdateRaceSchema, GetRaceResponseSchema } from '@shared/schema';
import { LANGUAGE_MAP, GetBaseClassesByEdition, ABILITY_LIST, EDITION_SELECT_LIST_FULL, SIZE_SELECT_LIST, LANGUAGE_SELECT_LIST } from '@shared/static-data';
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
    const [isAddTraitModalOpen, setIsAddTraitModalOpen] = useState(false);
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
        languages: [],
        abilityAdjustments: ABILITY_LIST.map(attr => ({ abilityId: attr.id, value: 0 })),
        traits: [],
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
     * Handles adding a language to the race, distinguishing between automatic and bonus languages.
     */
    const handleAddLanguage = useCallback((languageId: number, isAutomatic: boolean) => {
        setRace(prev => {
            const newLanguageEntry = { languageId, isAutomatic };
            const existingIndex = prev.languages?.findIndex(lang => lang.languageId === languageId) ?? -1;

            if (existingIndex !== -1) {
                const updatedLanguages = [...(prev.languages || [])];
                updatedLanguages[existingIndex] = newLanguageEntry;
                return { ...prev, languages: updatedLanguages };
            } else {
                return { ...prev, languages: [...(prev.languages || []), newLanguageEntry] };
            }
        });
    }, []);

    /**
     * Handles the removal of a language from the race's language list.
     */
    const handleRemoveLanguage = useCallback((languageId: number) => {
        setRace(prev => ({
            ...prev,
            languages: prev.languages?.filter(lang => lang.languageId !== languageId) || []
        }));
    }, []);

    /**
     * Handles changes to an ability adjustment for the race.
     */
    const handleAbilityChange = useCallback((abilityId: number, parsedValue: number) => {
        setRace(prev => {
            const existingIndex = prev.abilityAdjustments?.findIndex(adj => adj.abilityId === abilityId) ?? -1;
            const newAdjustment = { abilityId, value: parsedValue };

            if (existingIndex !== -1) {
                const updatedAdjustments = [...(prev.abilityAdjustments || [])];
                updatedAdjustments[existingIndex] = newAdjustment;
                return { ...prev, abilityAdjustments: updatedAdjustments };
            } else {
                return { ...prev, abilityAdjustments: [...(prev.abilityAdjustments || []), newAdjustment] };
            }
        });
    }, []);

    /**
     * Handles adding or updating race traits.
     */
    const handleAddOrUpdateTrait = useCallback((selectedTraitObjects: Array<{ slug: string; name: string; description: string; hasValue: boolean; value: string }>) => {
        setRace(prev => {
            // Create a map of existing traits for quick lookup by slug
            const existingTraitsMap = new Map(prev.traits?.map(t => [t.traitSlug, t]) || []);

            const updatedTraits = selectedTraitObjects.map(selectedTrait => {
                const existingTrait = existingTraitsMap.get(selectedTrait.slug);
                return {
                    traitSlug: selectedTrait.slug,
                    trait: {
                        slug: selectedTrait.slug,
                        name: selectedTrait.name,
                        description: selectedTrait.description,
                        hasValue: selectedTrait.hasValue,
                    },
                    // Preserve value if it was previously set for this trait and hasValue is true
                    value: existingTrait && existingTrait.trait?.hasValue ? existingTrait.value : (selectedTrait.hasValue ? 0 : 0),
                };
            });
            return { ...prev, traits: updatedTraits };
        });
        setIsAddTraitModalOpen(false);
    }, []);

    useEffect(() => {
        if (location.state?.newTrait) {
            handleAddOrUpdateTrait([location.state.newTrait]);
            setIsAddTraitModalOpen(true);
        }
    }, [location.state, handleAddOrUpdateTrait]);

    /**
     * Handles the deletion of a race trait from the current race.
     */
    const handleDeleteTrait = useCallback(async (traitId: string) => {
        if (window.confirm('Are you sure you want to remove this trait from the race?')) {
            setRace(prev => ({
                ...prev,
                traits: prev.traits?.filter(trait => trait.traitSlug !== traitId) || []
            }));
            setMessage('Trait removed successfully from race!');
        }
    }, []);

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
                setTimeout(() => navigate(`/admin/races/${newRace.id}`, { state: { fromListParams: fromListParams, refresh: true } }), 1500);
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
                    onClick={() => navigate('/admin/races')}
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

    const automaticLanguages = formData.languages?.filter(lang => lang.isAutomatic) || [];
    const bonusLanguages = formData.languages?.filter(lang => !lang.isAutomatic) || [];

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
                                            const adjustment = formData.abilityAdjustments?.find(adj => adj.abilityId === ability.id)?.value || 0;
                                            return adjustment > 0 ? `+${adjustment}` : adjustment;
                                        })()}
                                        onChange={(e) => setEditingAbilityValue(e.target.value)}
                                        onFocus={() => {
                                            setFocusedAbilityId(ability.id);
                                            const currentAdjustment = formData.abilityAdjustments?.find(adj => adj.abilityId === ability.id)?.value || 0;
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
                                        {LANGUAGE_MAP[lang.languageId]?.name || 'Unknown Language'}
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
                                        .filter(lang => !formData.languages?.some(rl => rl.languageId === lang.value))}
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
                                        {LANGUAGE_MAP[lang.languageId]?.name || 'Unknown Language'}
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
                                        .filter(lang => !formData.languages?.some(rl => rl.languageId === lang.value))}
                                    placeholder="Add"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Race Traits */}
                <div className="mt-4">
                    <h2 className="text-xl font-semibold mb-2">Traits</h2>
                    {formData.traits && formData.traits.length > 0 ? (
                        <div className="space-y-2 border p-2 rounded dark:border-gray-600 mb-2">
                            {formData.traits.map((trait, index) => (
                                <div key={index} className="rounded border p-2 dark:border-gray-700 grid grid-cols-[130px_1fr_auto] gap-2 items-center">
                                    <div>
                                        <h3 className="text-lg font-medium mb-2">{trait.trait?.slug}</h3>
                                    </div>
                                    <div className="w-full">
                                        <ProcessMarkdown
                                            markdown={trait.trait?.description || ''}
                                            id={`trait-${trait.traitSlug}-description`}
                                            userVars={{
                                                racename: formData.name,
                                                racenamelower: formData.name.toLowerCase(),
                                                raceplural: pluralize(formData.name),
                                                raceplurallower: pluralize(formData.name).toLowerCase(),
                                                value: trait.value
                                            }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {trait.trait?.hasValue && (
                                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                                                <span>Value:</span>
                                                <input
                                                    type="text"
                                                    value={trait.value || ''}
                                                    onChange={(e) => {
                                                        const newValue = e.target.value;
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            traits: prev.traits?.map(t =>
                                                                t.traitSlug === trait.traitSlug ? { ...t, value: parseInt(newValue) } : t
                                                            ) || []
                                                        }));
                                                    }}
                                                    className="w-20 p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                                />
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteTrait(trait.traitSlug)}
                                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-gray-500 dark:text-gray-400 mb-4">No traits added yet.</div>
                    )}

                    <button
                        type="button"
                        onClick={() => setIsAddTraitModalOpen(true)}
                        className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 text-white"
                    >
                        Add Trait
                    </button>
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
                        {isLoading ? 'Saving...' : id === 'new' ? 'Create Race' : 'Update Race'}
                    </button>
                </div>
            </ValidatedForm>

            <RaceTraitAssoc
                isOpen={isAddTraitModalOpen}
                onClose={() => {
                    setIsAddTraitModalOpen(false);
                }}
                onSave={handleAddOrUpdateTrait}
                initialSelectedTraitIds={formData.traits?.map(t => t.traitSlug) || []}
                raceId={parseInt(id)}
            />
        </div>
    );
}