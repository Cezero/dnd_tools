import { TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import pluralize from 'pluralize';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';

import {
    ValidatedForm,
    ValidatedInput,
    ValidatedCheckbox,
    ValidatedListbox,
    useValidatedForm
} from '@/components/forms';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { RaceService } from '@/features/admin/features/race-management/RaceService';
import { RaceTraitAssoc } from '@/features/admin/features/race-management/RaceTraitAssoc';
import { CreateRaceSchema, UpdateRaceSchema, RaceWithTraitsSchema } from '@shared/schema';
import { SIZE_LIST, LANGUAGE_LIST, LANGUAGE_MAP, EDITION_LIST, GetBaseClassesByEdition, ABILITY_LIST } from '@shared/static-data';

type RaceWithTraitsResponse = z.infer<typeof RaceWithTraitsSchema>;

// Type definitions for the form state
type CreateRaceFormData = z.infer<typeof CreateRaceSchema>;
type UpdateRaceFormData = z.infer<typeof UpdateRaceSchema>;
type RaceFormData = CreateRaceFormData | UpdateRaceFormData;

export function RaceEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [race, setRace] = useState<RaceWithTraitsResponse | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAddTraitModalOpen, setIsAddTraitModalOpen] = useState(false);
    const [focusedAbilityId, setFocusedAbilityId] = useState<number | null>(null);
    const [editingAbilityValue, setEditingAbilityValue] = useState('');
    const fromListParams = location.state?.fromListParams || '';

    // Determine which schema to use based on whether we're creating or editing
    const schema = id === 'new' ? CreateRaceSchema : UpdateRaceSchema;

    // Initialize form data with default values
    const initialFormData: RaceWithTraitsResponse = {
        id: id === 'new' ? 0 : parseInt(id),
        name: '',
        editionId: 1,
        isVisible: true,
        description: '',
        sizeId: 5, // Default to Medium
        speed: 30, // Default to 30
        favoredClassId: -1,
        languages: [],
        adjustments: ABILITY_LIST.map(attr => ({ abilityId: attr.id, value: 0 })),
        traits: [],
    };

    const [formData, setFormData] = useState<RaceWithTraitsResponse>(initialFormData as RaceWithTraitsResponse);

    // Use the validated form hook
    const { validation, createFieldProps, createCheckboxProps } = useValidatedForm(
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
                setFormData(fetchedRace as RaceWithTraitsResponse);
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
        setFormData(prev => {
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
        setFormData(prev => ({
            ...prev,
            languages: prev.languages?.filter(lang => lang.languageId !== languageId) || []
        }));
    }, []);

    /**
     * Handles changes to an ability adjustment for the race.
     */
    const handleAbilityChange = useCallback((abilityId: number, parsedValue: number) => {
        setFormData(prev => {
            const existingIndex = prev.adjustments?.findIndex(adj => adj.abilityId === abilityId) ?? -1;
            const newAdjustment = { abilityId, value: parsedValue };

            if (existingIndex !== -1) {
                const updatedAdjustments = [...(prev.adjustments || [])];
                updatedAdjustments[existingIndex] = newAdjustment;
                return { ...prev, adjustments: updatedAdjustments };
            } else {
                return { ...prev, adjustments: [...(prev.adjustments || []), newAdjustment] };
            }
        });
    }, []);

    /**
     * Handles adding or updating race traits.
     */
    const handleAddOrUpdateTrait = useCallback((selectedTraitObjects: Array<{ slug: string; name: string; description: string; hasValue: boolean; value: string }>) => {
        setFormData(prev => {
            // Create a map of existing traits for quick lookup by slug
            const existingTraitsMap = new Map(prev.traits?.map(t => [t.traitId, t]) || []);

            const updatedTraits = selectedTraitObjects.map(selectedTrait => {
                const existingTrait = existingTraitsMap.get(selectedTrait.slug);
                return {
                    traitId: selectedTrait.slug,
                    trait: {
                        slug: selectedTrait.slug,
                        name: selectedTrait.name,
                        description: selectedTrait.description,
                        hasValue: selectedTrait.hasValue,
                    },
                    // Preserve value if it was previously set for this trait and hasValue is true
                    value: existingTrait && existingTrait.trait?.hasValue ? existingTrait.value : (selectedTrait.hasValue ? '' : ''),
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
            setFormData(prev => ({
                ...prev,
                traits: prev.traits?.filter(trait => trait.traitId !== traitId) || []
            }));
            setMessage('Trait removed successfully from race!');
        }
    }, []);

    const HandleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        // Validate the entire form
        if (!validation.validateForm(formData)) {
            return;
        }

        try {
            setIsLoading(true);
            if (id === 'new') {
                const newRace = await RaceService.createRace(formData as z.infer<typeof CreateRaceSchema>);
                setMessage('Race created successfully!');
                setTimeout(() => navigate(`/admin/races/${newRace.id}`, { state: { fromListParams: fromListParams, refresh: true } }), 1500);
            } else {
                await RaceService.updateRace(formData as z.infer<typeof UpdateRaceSchema>, { id: parseInt(id) });
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

    // Create field props for each form field
    const nameProps = createFieldProps('name');
    const speedProps = createFieldProps('speed');
    const descriptionProps = createFieldProps('description');

    const isVisibleProps = createCheckboxProps('isVisible');

    // Create listbox props for edition
    const editionListboxProps = {
        value: formData.editionId,
        onChange: (value: string | number | null) => {
            const numValue = value as number;
            setFormData(prev => ({ ...prev, editionId: numValue }));
            validation.validateField('editionId', numValue);
        },
        error: validation.getError('editionId'),
        hasError: validation.hasError('editionId')
    };

    // Create listbox props for size
    const sizeListboxProps = {
        value: formData.sizeId,
        onChange: (value: string | number | null) => {
            const numValue = value as number;
            setFormData(prev => ({ ...prev, sizeId: numValue }));
            validation.validateField('sizeId', numValue);
        },
        error: validation.getError('sizeId'),
        hasError: validation.hasError('sizeId')
    };

    // Create listbox props for favored class
    const favoredClassListboxProps = {
        value: formData.favoredClassId,
        onChange: (value: string | number | null) => {
            const numValue = value as number;
            setFormData(prev => ({ ...prev, favoredClassId: numValue }));
            validation.validateField('favoredClassId', numValue);
        },
        error: validation.getError('favoredClassId'),
        hasError: validation.hasError('favoredClassId')
    };

    const automaticLanguages = formData.languages?.filter(lang => lang.isAutomatic) || [];
    const bonusLanguages = formData.languages?.filter(lang => !lang.isAutomatic) || [];

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">
                    {id === 'new' ? 'Create New Race' : 'Edit Race'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    {id === 'new' ? 'Create a new race' : 'Modify race details'}
                </p>
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
                validationState={validation.validationState}
                isLoading={isLoading}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Basic Information</h2>

                        <ValidatedInput
                            name="name"
                            label="Race Name"
                            type="text"
                            required
                            placeholder="e.g., Human, Elf, Dwarf"
                            {...nameProps}
                        />

                        <ValidatedListbox
                            name="editionId"
                            label="Edition"
                            value={formData.editionId}
                            onChange={(value) => setFormData(prev => ({ ...prev, editionId: value as number }))}
                            options={EDITION_LIST.map(edition => ({ value: edition.id, label: edition.abbreviation }))}
                            required
                            {...editionListboxProps}
                        />

                        <ValidatedCheckbox
                            name="isVisible"
                            label="Visible to Players"
                            {...isVisibleProps}
                        />
                    </div>

                    {/* Physical Properties */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Physical Properties</h2>

                        <ValidatedListbox
                            name="sizeId"
                            label="Size"
                            value={formData.sizeId}
                            onChange={(value) => setFormData(prev => ({ ...prev, sizeId: value as number }))}
                            options={SIZE_LIST.map(size => ({ value: size.id, label: size.name }))}
                            required
                            {...sizeListboxProps}
                        />

                        <ValidatedInput
                            name="speed"
                            label="Speed"
                            type="number"
                            min={0}
                            max={1000}
                            step={5}
                            {...speedProps}
                        />

                        <ValidatedListbox
                            name="favoredClassId"
                            label="Favored Class"
                            value={formData.favoredClassId}
                            onChange={(value) => setFormData(prev => ({ ...prev, favoredClassId: value as number }))}
                            options={[
                                { value: -1, label: 'Any' },
                                ...GetBaseClassesByEdition(formData.editionId).map(cls => ({ value: cls.id, label: cls.name }))
                            ]}
                            {...favoredClassListboxProps}
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-4">Description</h2>
                    <div className="space-y-2">
                        <label htmlFor="description" className="block font-medium">
                            Race Description
                        </label>
                        <MarkdownEditor
                            value={formData.description || ''}
                            onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                        />
                        {validation.getError('description') && (
                            <span className="text-red-500 text-sm">{validation.getError('description')}</span>
                        )}
                    </div>
                </div>

                {/* Ability Adjustments */}
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-4">Ability Adjustments</h2>
                    <div className="grid grid-cols-3 gap-4">
                        {ABILITY_LIST.map(ability => (
                            <div key={ability.id} className="flex items-center gap-2">
                                <label htmlFor={`ability-${ability.id}`} className="text-sm font-medium w-20">
                                    {ability.name}:
                                </label>
                                <input
                                    type="text"
                                    id={`ability-${ability.id}`}
                                    value={focusedAbilityId === ability.id ? editingAbilityValue : (() => {
                                        const adjustment = formData.adjustments?.find(adj => adj.abilityId === ability.id)?.value || 0;
                                        return adjustment > 0 ? `+${adjustment}` : adjustment;
                                    })()}
                                    onChange={(e) => setEditingAbilityValue(e.target.value)}
                                    onFocus={() => {
                                        setFocusedAbilityId(ability.id);
                                        const currentAdjustment = formData.adjustments?.find(adj => adj.abilityId === ability.id)?.value || 0;
                                        setEditingAbilityValue(String(currentAdjustment));
                                    }}
                                    onBlur={() => {
                                        const parsedValue = editingAbilityValue === '' || editingAbilityValue === '-' ? 0 : parseInt(editingAbilityValue) || 0;
                                        handleAbilityChange(ability.id, parsedValue);
                                        setFocusedAbilityId(null);
                                        setEditingAbilityValue('');
                                    }}
                                    className="w-16 p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Languages */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Automatic Languages */}
                    <div>
                        <h3 className="text-lg font-medium mb-2">Automatic Languages</h3>
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
                            <ValidatedListbox
                                name="automaticLanguage"
                                label=""
                                value={null}
                                onChange={(value) => {
                                    if (value) {
                                        handleAddLanguage(value as number, true);
                                    }
                                }}
                                options={LANGUAGE_LIST
                                    .filter(lang => !formData.languages?.some(rl => rl.languageId === lang.id))
                                    .map(lang => ({ value: lang.id, label: lang.name }))}
                                placeholder="Add automatic language"
                            />
                        </div>
                    </div>

                    {/* Bonus Languages */}
                    <div>
                        <h3 className="text-lg font-medium mb-2">Bonus Languages</h3>
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
                            <ValidatedListbox
                                name="bonusLanguage"
                                label=""
                                value={null}
                                onChange={(value) => {
                                    if (value) {
                                        handleAddLanguage(value as number, false);
                                    }
                                }}
                                options={LANGUAGE_LIST
                                    .filter(lang => !formData.languages?.some(rl => rl.languageId === lang.id))
                                    .map(lang => ({ value: lang.id, label: lang.name }))}
                                placeholder="Add bonus language"
                            />
                        </div>
                    </div>
                </div>

                {/* Race Traits */}
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-4">Race Traits</h2>
                    {formData.traits && formData.traits.length > 0 ? (
                        <div className="space-y-2 border p-3 rounded dark:border-gray-600 mb-4">
                            {formData.traits.map((trait, index) => (
                                <div key={index} className="rounded border p-2 dark:border-gray-700 grid grid-cols-[2fr_0.1fr] gap-2 items-center">
                                    <div className="w-full">
                                        <MarkdownEditor
                                            value={trait.trait?.description || ''}
                                            onChange={(value) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    traits: prev.traits?.map(t =>
                                                        t.traitId === trait.traitId ? { ...t, trait: { ...t.trait, description: value } } : t
                                                    ) || []
                                                }));
                                            }}
                                            userVars={{
                                                traitname: trait.trait?.name || '',
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
                                                                t.traitId === trait.traitId ? { ...t, value: newValue } : t
                                                            ) || []
                                                        }));
                                                    }}
                                                    className="w-20 p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                                />
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteTrait(trait.traitId)}
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
                        disabled={isLoading || validation.validationState.hasErrors}
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
                initialSelectedTraitIds={formData.traits?.map(t => t.traitId) || []}
                raceId={parseInt(id)}
            />
        </div>
    );
}