import {
    DocumentTextIcon,
    UserIcon,
    AcademicCapIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import { FeatureProgressionDetailEdit } from '@/components/feature-system';
import {
    ValidatedForm,
    useValidatedForm
} from '@/components/forms';
import { UpdateRaceSchema, BaseRaceSchema, FeatureProgression, FeatureModifier, FeatureChoice, FeatureSpecialEffect, CreateRaceRequest, UpdateRaceRequest } from '@shared/schema';
import { ModifierAppliesToType, SpecialFeatureId, ModifierType, FeatureSourceType } from '@shared/static-data';

import { RaceApi } from './RaceApi';
import { RaceFeatureAssoc } from './RaceFeatureAssoc';
import {
    BasicInfoTab,
    AbilitiesTab,
    LanguagesTab,
    FeaturesTab,
    DescriptionTab,
    type RaceTabProps,
    type RaceFormData
} from './tabs';

// Tab configuration interface
interface TabConfig {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    component: React.ComponentType<RaceTabProps>;
}

export function RaceEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('basic');
    const [isFeatureAssocOpen, setIsFeatureAssocOpen] = useState(false);
    const [isProgressionDialogOpen, setIsProgressionDialogOpen] = useState(false);
    const [editingProgression, setEditingProgression] = useState<FeatureProgression | null>(null);
    const [preSelectedFeature, setPreSelectedFeature] = useState<{ id: number; name: string; description: string; slug: string } | undefined>(undefined);
    const [featureProgressions, setFeatureProgressions] = useState<FeatureProgression[]>([]);
    const fromListParams = location.state?.fromListParams || '';

    // Determine which schema to use based on whether we're creating or editing
    const schema = id === 'new' ? BaseRaceSchema : UpdateRaceSchema;

    // Initialize form data with default values
    const initialFormData: RaceFormData = useMemo(() => ({
        name: '',
        editionId: 1,
        isVisible: true,
        description: '',
        sizeId: 5, // Default to Medium
        speed: 30, // Default to 30
        favoredClassId: -1,
    }), []);

    const [formData, setFormData] = useState<RaceFormData>(initialFormData);

    // Tab configuration
    const tabs: TabConfig[] = [
        { id: 'basic', label: 'Basic Info', icon: DocumentTextIcon, component: BasicInfoTab },
        { id: 'abilities', label: 'Abilities', icon: UserIcon, component: AbilitiesTab },
        { id: 'languages', label: 'Languages', icon: AcademicCapIcon, component: LanguagesTab },
        { id: 'features', label: 'Features', icon: SparklesIcon, component: FeaturesTab },
        { id: 'description', label: 'Description', icon: DocumentTextIcon, component: DescriptionTab }
    ];

    const CurrentTabComponent = tabs.find(tab => tab.id === activeTab)?.component;

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
                setFormData(initialFormData);
                return;
            }

            try {
                setIsLoading(true);
                const fetchedRace = await RaceApi.getRaceById(undefined, { id: parseInt(id) });
                setFormData(fetchedRace);

                // Load feature progressions from the race data
                if (fetchedRace.features) {
                    setFeatureProgressions(fetchedRace.features);
                } else {
                    setFeatureProgressions([]);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch race');
            } finally {
                setIsLoading(false);
            }
        };

        fetchRace();
    }, [id, initialFormData]);

    /**
     * Handles adding or updating race features.
     */
    const handleAddOrUpdateFeature = useCallback((selectedFeatureObjects: Array<{ featureId: number; slug: string; name: string; description: string; level: number }>) => {
        setFeatureProgressions(prev => {
            // Create a map of existing features for quick lookup by featureId
            const existingFeaturesMap = new Map<number, { modifiers?: FeatureModifier[]; choices?: FeatureChoice[]; effects?: FeatureSpecialEffect[] }>();
            prev.forEach(f => existingFeaturesMap.set(f.featureId, f));

            const updatedFeatures = selectedFeatureObjects.map(selectedFeature => {
                const existingFeature = existingFeaturesMap.get(selectedFeature.featureId);
                return {
                    id: Date.now() + Math.random(), // Temporary ID for frontend
                    raceId: parseInt(id || '0'),
                    classId: null,
                    level: selectedFeature.level,
                    featureId: selectedFeature.featureId,
                    sourceType: FeatureSourceType.Race,
                    feature: {
                        id: selectedFeature.featureId,
                        name: selectedFeature.name,
                        description: selectedFeature.description,
                        slug: selectedFeature.slug,
                    },
                    modifiers: existingFeature?.modifiers || [],
                    choices: existingFeature?.choices || [],
                    effects: existingFeature?.effects || [],
                };
            });
            return updatedFeatures;
        });
        setIsFeatureAssocOpen(false);
    }, [id]);

    useEffect(() => {
        if (location.state?.newFeature) {
            handleAddOrUpdateFeature([location.state.newFeature]);
            setIsFeatureAssocOpen(true);
        }
    }, [location.state, handleAddOrUpdateFeature]);

    /**
     * Handles the deletion of a race feature from the current race.
     */
    const _handleDeleteFeature = useCallback(async (featureId: number) => {
        if (window.confirm('Are you sure you want to remove this feature from the race?')) {
            setFeatureProgressions(prev => prev.filter(feature => feature.featureId !== featureId));
            setMessage('Feature removed successfully from race!');
        }
    }, []);

    /**
     * Handles adding a language to the race via the feature system using FeatureModifier approach.
     */
    const handleAddLanguage = useCallback((languageId: number, isAutomatic: boolean) => {
        setFeatureProgressions(prev => {
            const featureId = isAutomatic ?
                SpecialFeatureId.AutomaticLanguage :
                SpecialFeatureId.BonusLanguage;

            // Check if this language is already added
            const existingLanguageModifier = prev.some(fp =>
                fp.featureId === featureId &&
                fp.modifiers?.some(mod =>
                    mod.appliesTo === (isAutomatic ? ModifierAppliesToType.AutomaticLanguage : ModifierAppliesToType.BonusLanguage) &&
                    mod.appliesToId === languageId
                )
            );

            if (existingLanguageModifier) {
                // Language already exists, don't add it again
                return prev;
            }

            // Find existing language progression or create new one
            let languageProgression = prev.find(fp =>
                fp.featureId === featureId
            );

            if (!languageProgression) {
                // Create new language progression
                languageProgression = {
                    id: Date.now() + Math.random(),
                    raceId: parseInt(id || '0'),
                    level: 1,
                    classId: null,
                    featureId: featureId,
                    // REMOVED: appliesTo and appliesToType - redundant fields removed from schema
                    sourceType: FeatureSourceType.Race,
                    feature: {
                        id: featureId,
                        name: isAutomatic ? 'Automatic Language' : 'Bonus Language',
                        description: isAutomatic ? 'Automatic language feature' : 'Bonus language feature',
                        slug: isAutomatic ? 'automatic-language' : 'bonus-language',
                    },
                    modifiers: [],
                    choices: [],
                    effects: []
                };
            }

            // Add language modifier
            const languageModifier = {
                id: Date.now() + Math.random(),
                progressionId: languageProgression.id,
                type: ModifierType.Other,
                value: 0,
                bonusType: null,
                appliesTo: isAutomatic ? ModifierAppliesToType.AutomaticLanguage : ModifierAppliesToType.BonusLanguage,
                appliesToId: languageId,
                formulaParamsId: null,
                appliesIfChoiceKey: null,
                appliesIfChoiceValue: null,
                conditions: []
            };

            // Update the existing progression or add a new one
            const updatedProgressions = prev.map(fp => {
                if (fp.featureId === featureId) {
                    return {
                        ...fp,
                        modifiers: [...(fp.modifiers || []), languageModifier]
                    };
                }
                return fp;
            });

            // If no existing progression was found, add the new one with the language modifier
            if (!prev.some(fp => fp.featureId === featureId)) {
                languageProgression.modifiers = [languageModifier];
                updatedProgressions.push(languageProgression);
            }

            return updatedProgressions;
        });
    }, [id]);

    /**
     * Handles adding a feature to the race.
     */
    const handleAddFeature = useCallback((feature: { id: number; name: string; description: string; slug: string }) => {
        const newProgression: FeatureProgression = {
            id: Date.now() + Math.random(), // Temporary ID for frontend
            sourceType: FeatureSourceType.Race,
            classId: null,
            raceId: parseInt(id || '0'),
            level: 1, // Default to level 1
            featureId: feature.id,
            feature: {
                id: feature.id,
                name: feature.name,
                description: feature.description,
                slug: feature.slug,
            },
            modifiers: [],
            choices: [],
            effects: [],
        };

        setFeatureProgressions(prev => [...prev, newProgression]);
    }, [id]);

    /**
     * Handles removing a feature progression from the race.
     */
    const handleRemoveProgression = useCallback((progressionId: number) => {
        setFeatureProgressions(prev => prev.filter(p => p.id !== progressionId));
    }, []);

    /**
     * Handles updating an existing feature progression.
     */
    const handleUpdateProgression = useCallback((oldProgression: FeatureProgression, updatedProgression: FeatureProgression) => {
        setFeatureProgressions(prev => prev.map(p =>
            p.id === oldProgression.id ? updatedProgression : p
        ));
    }, []);

    /**
     * Handles adding a new feature progression.
     */
    const handleAddProgression = useCallback((progression: FeatureProgression) => {
        setFeatureProgressions(prev => [...prev, progression]);
    }, []);

    /**
     * Handles editing a feature progression.
     */
    const handleEditProgression = useCallback((progression: FeatureProgression) => {
        setEditingProgression(progression);
        setIsProgressionDialogOpen(true);
    }, []);

    /**
     * Handles the removal of a language from the race using FeatureModifier approach.
     */
    const handleRemoveLanguage = useCallback((languageId: number) => {
        setFeatureProgressions(prev => {
            // Remove the language modifier from both automatic and bonus language progressions
            const updatedProgressions = prev.map(fp => {
                if (fp.featureId === SpecialFeatureId.AutomaticLanguage || fp.featureId === SpecialFeatureId.BonusLanguage) {
                    return {
                        ...fp,
                        modifiers: fp.modifiers?.filter(mod =>
                            !((mod.appliesTo === ModifierAppliesToType.AutomaticLanguage || mod.appliesTo === ModifierAppliesToType.BonusLanguage) && mod.appliesToId === languageId)
                        ) || []
                    };
                }
                return fp;
            });

            // Remove empty language progressions
            const filteredProgressions = updatedProgressions.filter(fp => {
                if (fp.featureId === SpecialFeatureId.AutomaticLanguage || fp.featureId === SpecialFeatureId.BonusLanguage) {
                    return fp.modifiers && fp.modifiers.length > 0;
                }
                return true;
            });

            return filteredProgressions;
        });
    }, []);

    /**
     * Handles changes to an ability adjustment for the race via the feature system.
     */
    const handleAbilityChange = useCallback((abilityId: number, parsedValue: number) => {
        setFeatureProgressions(prev => {
            // Find existing ability adjustment feature (any ability adjustment feature)
            const existingAbilityFeature = prev.find(fp =>
                fp.featureId === SpecialFeatureId.AbilityAdjustment
            );

            if (existingAbilityFeature) {
                // Check if this specific ability already has a modifier
                const existingModifier = existingAbilityFeature.modifiers?.find(m =>
                    m.appliesTo === ModifierAppliesToType.Ability && m.appliesToId === abilityId
                );

                if (existingModifier) {
                    // Update existing modifier
                    const updatedFeatures = prev.map(fp =>
                        fp.featureId === SpecialFeatureId.AbilityAdjustment
                            ? {
                                ...fp,
                                modifiers: fp.modifiers?.map(m =>
                                    m.appliesTo === ModifierAppliesToType.Ability && m.appliesToId === abilityId
                                        ? { ...m, value: parsedValue }
                                        : m
                                ) || []
                            }
                            : fp
                    );
                    return updatedFeatures;
                } else if (parsedValue !== 0) {
                    // Add new modifier to existing ability adjustment feature
                    const updatedFeatures = prev.map(fp =>
                        fp.featureId === SpecialFeatureId.AbilityAdjustment
                            ? {
                                ...fp,
                                modifiers: [...(fp.modifiers || []), {
                                    id: Date.now() + Math.random(),
                                    progressionId: fp.id,
                                    type: ModifierType.Bonus,
                                    value: parsedValue,
                                    bonusType: null,
                                    appliesTo: ModifierAppliesToType.Ability,
                                    appliesToId: abilityId,
                                    formulaParamsId: null,
                                    appliesIfChoiceKey: null,
                                    appliesIfChoiceValue: null,
                                    conditions: []
                                }]
                            }
                            : fp
                    );
                    return updatedFeatures;
                } else {
                    // Remove modifier if value is 0
                    const updatedFeatures = prev.map(fp =>
                        fp.featureId === SpecialFeatureId.AbilityAdjustment
                            ? {
                                ...fp,
                                modifiers: fp.modifiers?.filter(m =>
                                    !(m.appliesTo === ModifierAppliesToType.Ability && m.appliesToId === abilityId)
                                ) || []
                            }
                            : fp
                    );
                    return updatedFeatures;
                }
            } else if (parsedValue !== 0) {
                // Create new ability adjustment feature with this modifier
                const newAbilityFeature = {
                    id: Date.now() + Math.random(),
                    raceId: parseInt(id || '0'),
                    classId: null,
                    level: 1,
                    featureId: SpecialFeatureId.AbilityAdjustment,
                    // REMOVED: appliesTo and appliesToType - redundant fields removed from schema
                    sourceType: FeatureSourceType.Race,
                    feature: {
                        id: SpecialFeatureId.AbilityAdjustment,
                        slug: 'ability-adjustment',
                        name: 'Ability Adjustment',
                        description: 'Racial ability score adjustments',
                    },
                    modifiers: [{
                        id: Date.now() + Math.random(),
                        progressionId: 0,
                        type: ModifierType.Bonus,
                        value: parsedValue,
                        bonusType: null,
                        appliesTo: ModifierAppliesToType.Ability,
                        appliesToId: abilityId,
                        formulaParamsId: null,
                        appliesIfChoiceKey: null,
                        appliesIfChoiceValue: null,
                        conditions: []
                    }],
                    choices: [],
                    effects: [],
                };
                return [...prev, newAbilityFeature];
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

            // Prepare the complete race data including feature progressions
            const raceData = {
                ...formData,
                features: featureProgressions.map(prog => {
                    const { id: _, ...progressionData } = prog;
                    return {
                        ...progressionData,
                        // Remove temporary IDs from related entities
                        modifiers: prog.modifiers?.map(mod => {
                            const { id: _, progressionId: __, ...modData } = mod;
                            return modData;
                        }) || [],
                        choices: prog.choices?.map(choice => {
                            const { id: _, progressionId: __, ...choiceData } = choice;
                            return choiceData;
                        }) || [],
                        effects: prog.effects?.map(effect => {
                            const { id: _, progressionId: __, ...effectData } = effect;
                            return effectData;
                        }) || [],
                    };
                })
            };

            if (id === 'new') {
                const newRace = await RaceApi.createRace(raceData as CreateRaceRequest);
                setMessage('Race created successfully!');
                setTimeout(() => navigate(`/races/${newRace.id}`, { state: { fromListParams: fromListParams, refresh: true } }), 1500);
            } else {
                await RaceApi.updateRace(raceData as UpdateRaceRequest, { id: parseInt(id) });
                setMessage('Race updated successfully!');
                setTimeout(() => navigate(`/races/${id}`, { state: { fromListParams: fromListParams, refresh: true } }), 1500);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save race');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !formData) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    if (error && !formData) {
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

    if (!formData) {
        return <div>No race data available</div>;
    }



    return (
        <div className="w-4/5 mx-auto p-6">
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
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                    {/* Tab Navigation */}
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex space-x-8 px-6">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="bg-white dark:bg-gray-800">
                        {CurrentTabComponent && (
                            <CurrentTabComponent
                                formData={formData}
                                setFormData={setFormData}
                                validation={form.validation}
                                isLoading={isLoading}
                                featureProgressions={featureProgressions}
                                setFeatureProgressions={setFeatureProgressions}
                                isFeatureAssocOpen={isFeatureAssocOpen}
                                setIsFeatureAssocOpen={setIsFeatureAssocOpen}
                                onAddLanguage={handleAddLanguage}
                                onRemoveLanguage={handleRemoveLanguage}
                                onAbilityChange={handleAbilityChange}
                                onAddFeature={handleAddFeature}
                                onRemoveProgression={handleRemoveProgression}
                                onEditProgression={handleEditProgression}
                                raceId={id !== 'new' ? parseInt(id) : undefined}
                            />
                        )}
                    </div>
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
                isOpen={isFeatureAssocOpen}
                onClose={() => {
                    setIsFeatureAssocOpen(false);
                }}
                onSave={handleAddOrUpdateFeature}
                initialSelectedFeatureIds={featureProgressions.map(f => f.featureId.toString())}
                raceId={parseInt(id)}
            />

            {/* Feature Progression Dialog */}
            <FeatureProgressionDetailEdit
                isOpen={isProgressionDialogOpen}
                onClose={() => {
                    setIsProgressionDialogOpen(false);
                    setPreSelectedFeature(undefined);
                }}
                progression={editingProgression}
                onSave={(progression) => {
                    if (editingProgression) {
                        handleUpdateProgression(editingProgression, progression);
                    } else {
                        handleAddProgression(progression);
                    }
                    setIsProgressionDialogOpen(false);
                    setPreSelectedFeature(undefined);
                }}
                preSelectedFeature={preSelectedFeature}
            />
        </div>
    );
}
