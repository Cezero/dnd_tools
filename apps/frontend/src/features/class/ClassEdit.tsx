import {
    DocumentTextIcon,
    ShieldCheckIcon,
    AcademicCapIcon,
    SparklesIcon,
    BeakerIcon
} from '@heroicons/react/24/outline';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';


import { FeatureProgressionDetailEdit } from '@/components/feature-system';
import {
    ValidatedForm,
    useValidatedForm,
} from '@/components/forms';
import { FeatApi } from '@/features/feat/FeatApi';
import {
    CreateClassSchema,
    UpdateClassSchema,
    CreateClassRequest,
    UpdateClassRequest,
    FeatureProgression,
    SpellcastingProgressionWithSlots
} from '@shared/schema';
import {
    FeatureSpecialEffectType,
    SpecialFeatureId,
    ModifierAppliesToType,
} from '@shared/static-data';

import { ClassApi } from './ClassApi';
import { ClassFeatureAssoc } from './ClassFeatureAssoc';
import { ClassProficiencyService } from './ClassProficiencyService';
import { ClassSkillService } from './ClassSkillService';
import {
    BasicInfoTab,
    SkillsTab,
    ProficienciesTab,
    FeaturesTab,
    SpellcastingTab,
    DescriptionTab,
    type TabConfig,
    type ClassFormData
} from './tabs';

export default function ClassEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [cls, setCls] = useState<ClassFormData | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('basic');
    const [isFeatureAssocOpen, setIsFeatureAssocOpen] = useState(false);

    const [featureProgressions, setFeatureProgressions] = useState<FeatureProgression[]>([]);
    const [spellcastingProgression, setSpellcastingProgression] = useState<SpellcastingProgressionWithSlots[]>([]);
    const [spellsKnownProgression, setSpellsKnownProgression] = useState<SpellcastingProgressionWithSlots[]>([]);
    const [isProgressionDialogOpen, setIsProgressionDialogOpen] = useState(false);
    const [editingProgression, setEditingProgression] = useState<FeatureProgression | null>(null);
    const [preSelectedFeature, setPreSelectedFeature] = useState<{ id: number; name: string; description: string; slug: string } | undefined>(undefined);
    const [feats, setFeats] = useState<Array<{ id: number; name: string }>>([]);
    const [_featsLoaded, setFeatsLoaded] = useState(false);

    // Ref to track if we've already processed the newFeature
    const processedNewFeatureRef = useRef<boolean>(false);
    // Ref to track current preSelectedFeature
    const preSelectedFeatureRef = useRef<{ id: number; name: string; description: string; slug: string } | undefined>(undefined);

    // Update ref when preSelectedFeature changes
    useEffect(() => {
        preSelectedFeatureRef.current = preSelectedFeature;
    }, [preSelectedFeature]);

    // Determine which schema to use based on whether we're creating or editing
    const schema = id === 'new' ? CreateClassSchema : UpdateClassSchema;

    /**
     * Handles adding a class skill via the feature system.
     */
    const handleAddSkill = useCallback((skillId: number) => {
        ClassSkillService.addSkill(featureProgressions, setFeatureProgressions, skillId, parseInt(id || '0'));
    }, [featureProgressions, setFeatureProgressions, id]);

    /**
     * Handles removing a class skill via the feature system.
     */
    const handleRemoveSkill = useCallback((skillId: number) => {
        ClassSkillService.removeSkill(featureProgressions, setFeatureProgressions, skillId);
    }, [featureProgressions, setFeatureProgressions]);

    /**
     * Handles adding a proficiency via the feature system.
     */
    const handleAddProficiency = useCallback(async (featId: number, itemId: number, featName: string, itemName: string) => {
        try {
            setFeatureProgressions(prev => {
                // Check if class proficiency progression already exists
                let classProficiencyProgression = prev.find(fp =>
                    fp.featureId === SpecialFeatureId.ClassProficiency
                );

                if (!classProficiencyProgression) {
                    // Create the main class proficiency progression if it doesn't exist
                    classProficiencyProgression = {
                        id: Date.now() + Math.random(),
                        featureId: SpecialFeatureId.ClassProficiency,
                        sourceType: 1, // 1 for Class
                        classId: parseInt(id || '0'),
                        raceId: null,
                        level: 1,
                        feature: {
                            id: SpecialFeatureId.ClassProficiency,
                            slug: 'class-proficiency',
                            name: 'Class Proficiency',
                            description: 'Class proficiency feature',
                        },
                        modifiers: [],
                        choices: [],
                        effects: [],
                    };
                    prev = [...prev, classProficiencyProgression];
                }

                // Check if this specific proficiency already exists
                const existingProficiency = classProficiencyProgression.effects?.find(e =>
                    e.effectType === FeatureSpecialEffectType.Proficiency &&
                    e.featId === featId &&
                    e.itemId === itemId
                );

                if (existingProficiency) {
                    return prev;
                }

                // Add the proficiency as a special effect
                const newEffect = {
                    id: Date.now() + Math.random(),
                    progressionId: classProficiencyProgression.id,
                    effectType: FeatureSpecialEffectType.Proficiency,
                    key: null,
                    value: null,
                    numericValue: null,
                    featId: featId,
                    itemId: itemId,
                    feat: {
                        id: featId,
                        name: featName,
                        description: null,
                        typeId: 1,
                        benefit: null,
                        normalEffect: null,
                        specialEffect: null,
                        prerequisites: null,
                        repeatable: null,
                        fighterBonus: null
                    },
                    item: itemId !== -1 ? {
                        id: itemId,
                        name: itemName,
                        description: null,
                        typeId: 1,
                        cost: null,
                        weight: null,
                        quantity: null
                    } : null
                };

                // Create a new array with the updated progression
                return prev.map(p => {
                    if (p.id === classProficiencyProgression.id) {
                        return {
                            ...p,
                            effects: [...(p.effects || []), newEffect]
                        };
                    }
                    return p;
                });
            });
        } catch (error) {
            console.error('Failed to add proficiency:', error);
        }
    }, [id]);

    /**
     * Handles removing a proficiency via the feature system.
     */
    const handleRemoveProficiency = useCallback((featId: number, itemId: number) => {
        ClassProficiencyService.removeProficiency(featureProgressions, setFeatureProgressions, featId, itemId);
    }, [featureProgressions, setFeatureProgressions]);

    // Initialize form data with default values
    const initialFormData = useMemo((): ClassFormData => ({
        name: '',
        abbreviation: '',
        editionId: 1,
        isPrestige: false,
        isVisible: true,
        canCastSpells: false,
        hitDie: 1,
        skillPoints: 0,
        description: '',
        castingAbilityId: null,
        babProgression: 2, // poor
        fortProgression: 2, // poor
        refProgression: 2, // poor
        willProgression: 2, // poor
        spellcastingProgression: [],
        ...(id !== 'new' && { id: parseInt(id) })
    }), [id]);

    const [formData, setFormData] = useState<ClassFormData>(initialFormData);

    // Tab configuration - must be after formData declaration
    const tabs: TabConfig[] = [
        { id: 'basic', label: 'Basic Info', icon: DocumentTextIcon, component: BasicInfoTab },
        ...(formData.canCastSpells ? [{ id: 'spells', label: 'Spellcasting', icon: BeakerIcon, component: SpellcastingTab }] : []),
        { id: 'skills', label: 'Skills', icon: ShieldCheckIcon, component: SkillsTab },
        { id: 'proficiencies', label: 'Proficiencies', icon: AcademicCapIcon, component: ProficienciesTab },
        { id: 'features', label: 'Features', icon: SparklesIcon, component: FeaturesTab },
        { id: 'description', label: 'Description', icon: DocumentTextIcon, component: DescriptionTab }
    ];

    const CurrentTabComponent = tabs.find(tab => tab.id === activeTab)?.component;

    /**
     * Handles adding a feature progression to the class.
     */
    const handleAddProgression = useCallback((progression: FeatureProgression) => {
        console.log('handleAddProgression called with:', progression);
        setFeatureProgressions(prev => {
            // The progression should now include feature data from FeatureProgressionDetailEdit
            // But provide fallback in case it doesn't
            const progressionWithFeature = {
                ...progression,
                feature: progression.feature || {
                    id: progression.featureId,
                    name: preSelectedFeatureRef.current?.name || `Feature ${progression.featureId}`,
                    description: preSelectedFeatureRef.current?.description || '',
                    slug: preSelectedFeatureRef.current?.slug || `feature-${progression.featureId}`,
                }
            };

            console.log('Adding progression with feature:', progressionWithFeature);
            // Always add as a new progression - allow multiple progressions per feature/level
            return [...prev, progressionWithFeature];
        });
    }, []); // Remove preSelectedFeature dependency to prevent infinite re-renders

    /**
     * Handles adding a feature to the class by creating a default level 1 progression.
     */
    const handleAddFeature = useCallback((feature: { id: number; name: string; description: string; slug: string }) => {
        console.log('handleAddFeature called with:', feature);
        const defaultProgression: FeatureProgression = {
            id: Date.now() + Math.random(), // Temporary ID for frontend
            sourceType: 1, // 1 for Class
            classId: parseInt(id || '0'),
            raceId: null,
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

        setFeatureProgressions(prev => [...prev, defaultProgression]);
    }, [id]);

    /**
     * Handles the removal of a feature progression from the class.
     */
    const handleRemoveProgression = useCallback((progressionId: number) => {
        setFeatureProgressions(prev => prev.filter(p => p.id !== progressionId));
    }, []);

    /**
     * Handles updating a feature progression.
     */
    const handleUpdateProgression = useCallback((oldProgression: FeatureProgression, updatedProgression: FeatureProgression) => {
        setFeatureProgressions(prev => {
            const progressionIndex = prev.findIndex(p => p.id === oldProgression.id);

            if (progressionIndex === -1) {
                // If we can't find the old progression, just add the new one
                return [...prev, updatedProgression];
            }

            const newFeatureProgressions = [...prev];
            newFeatureProgressions[progressionIndex] = updatedProgression;

            return newFeatureProgressions;
        });
    }, []);

    /**
     * Opens the progression dialog for adding a new progression.
     */
    const _handleOpenProgressionDialog = useCallback(() => {
        setEditingProgression(null);
        setIsProgressionDialogOpen(true);
    }, []);

    /**
     * Opens the progression dialog for editing an existing progression.
     */
    const handleEditProgression = useCallback((progression: FeatureProgression) => {
        setEditingProgression(progression);
        setIsProgressionDialogOpen(true);
    }, []);

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
        const fetchClass = async () => {
            if (id === 'new') {
                setCls(initialFormData);
                return;
            }

            try {
                setIsLoading(true);
                const fetchedClass = await ClassApi.getClassById(undefined, { id: parseInt(id) });
                setCls(fetchedClass);
                setFormData(fetchedClass);

                // Load feature progressions from the class data
                if (fetchedClass.features) {
                    setFeatureProgressions(fetchedClass.features);
                } else {
                    setFeatureProgressions([]);
                }

                // Load spellcasting progression from the class data
                if (fetchedClass.spellcastingProgression) {
                    setSpellcastingProgression(fetchedClass.spellcastingProgression);
                } else {
                    setSpellcastingProgression([]);
                }

                // Load spells known progression from the class data
                if (fetchedClass.spellsKnownProgression) {
                    setSpellsKnownProgression(fetchedClass.spellsKnownProgression);
                } else {
                    setSpellsKnownProgression([]);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch class');
            } finally {
                setIsLoading(false);
            }
        };

        fetchClass();
    }, [id, initialFormData]);

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
                } finally {
                    setFeatsLoaded(true);
                }
            } else if (!hasFeatModifiers) {
                setFeatsLoaded(true);
            }
        };

        loadFeatsIfNeeded();
    }, [featureProgressions, feats.length]);

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



    // Handle new feature from association dialog
    useEffect(() => {
        if (location.state?.newFeature && !processedNewFeatureRef.current) {
            const newFeature = location.state.newFeature;
            processedNewFeatureRef.current = true;

            // Add the new feature progression to the list
            const newProgression: FeatureProgression = {
                id: Date.now(), // Temporary ID for frontend
                sourceType: 1, // 1 for Class
                classId: parseInt(id),
                raceId: null,
                level: 1, // Default to level 1
                featureId: newFeature.featureId,
                feature: {
                    id: newFeature.featureId,
                    name: newFeature.name,
                    description: newFeature.description,
                    slug: newFeature.slug,
                },
                modifiers: [],
                choices: [],
                effects: [],
            };
            setFeatureProgressions(prev => [...prev, newProgression]);
            // Clear the state
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state?.newFeature, id, navigate, location.pathname]);

    const HandleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        // Validate the entire form
        if (!form.validation.validateForm(formData)) {
            setError('Please fix the validation errors before submitting');
            console.log('Form validation failed:', form.validation.validationState);
            return;
        }

        try {
            setIsLoading(true);

            // Prepare the complete class data including feature progressions and spellcasting progression
            const classData = {
                ...formData,
                features: featureProgressions.map(prog => {
                    const { id: _, ...progressionData } = prog;
                    return {
                        ...progressionData,
                        // Remove temporary IDs from related entities
                        modifiers: prog.modifiers?.map(mod => {
                            const { id: _, featureProgressionId: __, ...modData } = mod;
                            // Ensure formulaParams is properly structured for backend
                            if (modData.formulaParams && modData.formulaParams.formulaId) {
                                // Keep the formulaParams data but remove any temporary IDs
                                const formulaParamsData = { ...modData.formulaParams };
                                delete (formulaParamsData as { id?: unknown }).id; // Remove id if it exists
                                modData.formulaParams = formulaParamsData;
                                // Remove formulaParamsId as it will be set by the backend
                                delete modData.formulaParamsId;
                            } else if (modData.formulaParamsId) {
                                // If we have formulaParamsId but no formulaParams, this is an error
                                console.error('Modifier has formulaParamsId but no formulaParams:', modData);
                            }
                            // Preserve feat data for feat modifiers
                            if (modData.appliesTo === ModifierAppliesToType.Feat) {
                                // Keep the feat data for display purposes
                                // The backend will use appliesToId to link to the actual feat
                            }
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
                }),
                spellcastingProgression: spellcastingProgression.map(prog => {
                    const { id: _, classId: __, ...progressionData } = prog;
                    return {
                        ...progressionData,
                        slots: prog.slots?.map(slot => {
                            const { id: _, progressionId: __, ...slotData } = slot;
                            return slotData;
                        }) || []
                    };
                }),
                spellsKnownProgression: spellsKnownProgression.map(prog => {
                    const { id: _, classId: __, ...progressionData } = prog;
                    return {
                        ...progressionData,
                        slots: prog.slots?.map(slot => {
                            const { id: _, progressionId: __, ...slotData } = slot;
                            return slotData;
                        }) || []
                    };
                })
            };

            console.log('Submitting class data:', JSON.stringify(classData, null, 2));

            if (id === 'new') {
                const newClass = await ClassApi.createClass(classData as CreateClassRequest);
                setMessage('Class created successfully!');
                setTimeout(() => navigate(`/classes/${newClass.id}`), 1500);
            } else {
                console.log('Updating class:', classData);
                await ClassApi.updateClass(classData as UpdateClassRequest, { id: parseInt(id) });
                setMessage('Class updated successfully!');
                navigate(`/classes/${id}`, { state: { fromListParams: location.state?.fromListParams, refresh: true } });
            }
        } catch (err) {
            console.error('Error saving class:', err);
            console.error('Error details:', {
                name: err instanceof Error ? err.name : 'Unknown',
                message: err instanceof Error ? err.message : 'Unknown error',
                stack: err instanceof Error ? err.stack : 'No stack trace'
            });

            // Try to extract more detailed error information
            let errorMessage = 'Failed to save class';
            if (err instanceof Error) {
                errorMessage = err.message;
            } else if (typeof err === 'object' && err !== null) {
                // Try to extract error details from response
                const errorObj = err as { response?: { data?: { error?: string } }; message?: string };
                if (errorObj.response?.data?.error) {
                    errorMessage = errorObj.response.data.error;
                } else if (errorObj.message) {
                    errorMessage = errorObj.message;
                }
            }

            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !cls) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    if (error && !cls) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={() => navigate('/classes')}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Back to Classes
                </button>
            </div>
        );
    }

    if (!cls) {
        return <div>No class data available</div>;
    }

    // Group progressions by feature for display
    const progressionsByFeature = enhancedFeatureProgressions.reduce((acc, progression) => {
        const featureId = progression.featureId;
        if (!acc[featureId]) {
            acc[featureId] = {
                feature: progression.feature,
                progressions: []
            };
        }
        acc[featureId].progressions.push(progression);
        return acc;
    }, {} as Record<number, { feature: { id: number; name: string; description: string; slug: string }; progressions: FeatureProgression[] }>);

    return (
        <div className="w-4/5 mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">
                    {id === 'new' ? 'Create New Class' : 'Edit Class'}
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
                                featureProgressions={enhancedFeatureProgressions}
                                setFeatureProgressions={setFeatureProgressions}
                                spellcastingProgression={spellcastingProgression}
                                setSpellcastingProgression={setSpellcastingProgression}
                                spellsKnownProgression={spellsKnownProgression}
                                setSpellsKnownProgression={setSpellsKnownProgression}
                                isFeatureAssocOpen={isFeatureAssocOpen}
                                setIsFeatureAssocOpen={setIsFeatureAssocOpen}
                                isProgressionDialogOpen={isProgressionDialogOpen}
                                setIsProgressionDialogOpen={setIsProgressionDialogOpen}
                                editingProgression={editingProgression}
                                setEditingProgression={setEditingProgression}
                                preSelectedFeature={preSelectedFeature}
                                setPreSelectedFeature={setPreSelectedFeature}
                                onRemoveProgression={handleRemoveProgression}
                                onAddFeature={handleAddFeature}
                                onEditProgression={handleEditProgression}
                                onAddSkill={handleAddSkill}
                                onRemoveSkill={handleRemoveSkill}
                                onAddProficiency={handleAddProficiency}
                                onRemoveProficiency={handleRemoveProficiency}
                                classId={id !== 'new' ? parseInt(id) : undefined}
                            />
                        )}
                    </div>
                </div>

                <div className="flex justify-end space-x-4 mt-8">
                    <button
                        type="button"
                        onClick={() => navigate('/classes')}
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
                        {isLoading ? 'Saving...' : id === 'new' ? 'Create Class' : 'Update Class'}
                    </button>
                </div>
            </ValidatedForm>

            {/* Class Feature Association Dialog */}
            <ClassFeatureAssoc
                isOpen={isFeatureAssocOpen}
                onClose={() => setIsFeatureAssocOpen(false)}
                onSave={(selectedFeatures) => {
                    console.log('[ClassEdit] selectedFeatures received', selectedFeatures);

                    setFeatureProgressions(prev => {
                        // Get current non-special feature IDs
                        const currentFeatureIds = prev
                            .filter(p => p.featureId !== SpecialFeatureId.ClassSkill && p.featureId !== SpecialFeatureId.ClassProficiency)
                            .map(p => p.featureId);

                        // Get selected feature IDs
                        const selectedFeatureIds = selectedFeatures.map(sf => sf.featureId);

                        // Find features to remove (deselected)
                        const featuresToRemove = currentFeatureIds.filter(id => !selectedFeatureIds.includes(id));

                        // Find features to add (newly selected)
                        const featuresToAdd = selectedFeatureIds.filter(id => !currentFeatureIds.includes(id));

                        console.log('[ClassEdit] Features to remove:', featuresToRemove);
                        console.log('[ClassEdit] Features to add:', featuresToAdd);

                        // Remove deselected features (but keep special features)
                        let updated = prev.filter(p =>
                            p.featureId === SpecialFeatureId.ClassSkill ||
                            p.featureId === SpecialFeatureId.ClassProficiency ||
                            !featuresToRemove.includes(p.featureId)
                        );

                        // Add newly selected features
                        const newProgressions: FeatureProgression[] = selectedFeatures
                            .filter(feature => featuresToAdd.includes(feature.featureId))
                            .map(feature => ({
                                id: Date.now() + Math.random(), // Temporary ID for frontend
                                sourceType: 1, // 1 for Class
                                classId: parseInt(id),
                                raceId: null,
                                level: feature.level,
                                featureId: feature.featureId,
                                appliesToType: null,
                                appliesTo: null,
                                feature: {
                                    id: feature.featureId,
                                    name: feature.name,
                                    description: feature.description,
                                    slug: feature.slug,
                                },
                                modifiers: [],
                                choices: [],
                                effects: [],
                            }));

                        return [...updated, ...newProgressions];
                    });
                    setIsFeatureAssocOpen(false);
                }}
                initialSelectedFeatureIds={Object.keys(progressionsByFeature)
                    .map(id => parseInt(id))
                    .filter(featureId =>
                        featureId !== SpecialFeatureId.ClassSkill &&
                        featureId !== SpecialFeatureId.ClassProficiency
                    )}
                classId={id !== 'new' ? parseInt(id) : undefined}
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
                    console.log('FeatureProgressionDetailEdit onSave called with:', progression);
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
