import { Dialog } from '@base-ui-components/react/dialog';
import { ScrollArea } from '@base-ui-components/react/scroll-area';
import { TrashIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import { FeatureProgressionDetailEdit, FeatureProficiencyDialog } from '@/components/feature-system';
import {
    ValidatedForm,
    ValidatedInput,
    useValidatedForm,
    CustomSelect,
    CustomCheckbox
} from '@/components/forms';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { formatClassProficiencies, formatProgression } from '@/lib/Formatters';
import {
    CreateClassSchema,
    UpdateClassSchema,
    CreateClassRequest,
    UpdateClassRequest,
    FeatureProgressionWithRelations
} from '@shared/schema';
import {
    RPG_DICE_SELECT_LIST,
    ABILITY_SELECT_LIST,
    EDITION_SELECT_LIST_FULL,
    BAB_PROGRESSION_SELECT_LIST,
    SAVE_PROGRESSION_SELECT_LIST,
    FeatureModifierType,
    FeatureSpecialEffectType,
    FeatureAppliesToType,
    SpecialFeatureId,
    SKILL_MAP,
    SKILL_SELECT_LIST,
} from '@shared/static-data';

import { ClassFeatureAssoc } from './ClassFeatureAssoc';
import { ClassService } from './ClassService';
import { ClassProficiencyService } from './ClassProficiencyService';

// Type definitions for the form state
type ClassFormData = CreateClassRequest | UpdateClassRequest;



// Helper functions to extract skills and proficiencies from feature progressions
function getClassSkills(progressions: FeatureProgressionWithRelations[]): number[] {
    return progressions
        .filter(prog => prog.featureId === SpecialFeatureId.ClassSkill && prog.appliesToType === FeatureAppliesToType.Skill)
        .flatMap(prog =>
            prog.modifiers
                ?.filter(mod => mod.modifierType === FeatureModifierType.Skill && mod.appliesTo)
                .map(mod => mod.appliesTo as number) || []
        )
        .filter(id => id > 0);
}

function getClassProficiencies(
    progressions: FeatureProgressionWithRelations[]
): Array<{ featId: number; itemId: number; featName: string; itemName?: string }> {
    return progressions
        .filter(prog => prog.featureId === SpecialFeatureId.ClassProficiency)
        .flatMap(prog =>
            prog.effects
                ?.filter(effect => effect.effectType === FeatureSpecialEffectType.Proficiency)
                .map(effect => ({
                    featId: effect.featId || 0,
                    itemId: effect.itemId || -1,
                    featName: effect.feat?.name || `Feat ${effect.featId}`,
                    itemName: effect.itemId === -1 ? undefined : (effect.item?.name || `Item ${effect.itemId}`)
                })) || []
        )
        .filter(prof => prof.featId > 0);
}

export default function ClassEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [cls, setCls] = useState<ClassFormData | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFeatureAssocOpen, setIsFeatureAssocOpen] = useState(false);
    const [isProficiencyDialogOpen, setIsProficiencyDialogOpen] = useState(false);
    const [featureProgressions, setFeatureProgressions] = useState<FeatureProgressionWithRelations[]>([]);
    const [isProgressionDialogOpen, setIsProgressionDialogOpen] = useState(false);
    const [editingProgression, setEditingProgression] = useState<FeatureProgressionWithRelations | null>(null);
    const [preSelectedFeature, setPreSelectedFeature] = useState<{ id: number; name: string; description: string; slug: string } | undefined>(undefined);

    // Determine which schema to use based on whether we're creating or editing
    const schema = id === 'new' ? CreateClassSchema : UpdateClassSchema;

    /**
     * Handles adding a class skill via the feature system.
     */
    const handleAddSkill = useCallback((skillId: number) => {
        setFeatureProgressions(prev => {
            // Check if class skills progression already exists
            let classSkillsProgression = prev.find(fp =>
                fp.featureId === SpecialFeatureId.ClassSkill && fp.appliesToType === FeatureAppliesToType.Skill
            );

            if (!classSkillsProgression) {
                // Create the main class skills progression if it doesn't exist
                classSkillsProgression = {
                    id: Date.now() + Math.random(), // Temporary ID for frontend state
                    featureId: SpecialFeatureId.ClassSkill,
                    sourceType: 1, // 1 for Class
                    classId: parseInt(id || '0'),
                    raceId: null,
                    level: 1, // Class skills are level 1 features
                    appliesToType: FeatureAppliesToType.Skill,
                    appliesTo: null, // No specific skill, this is the container progression
                    feature: {
                        id: SpecialFeatureId.ClassSkill,
                        slug: 'class-skill',
                        name: 'Class Skill',
                        description: 'Class skill feature',
                    },
                    modifiers: [],
                    choices: [],
                    effects: [],
                };
                prev = [...prev, classSkillsProgression];
            }

            // Check if this specific skill is already added
            const existingSkillModifier = classSkillsProgression.modifiers?.find(m =>
                m.modifierType === FeatureModifierType.Skill && m.appliesTo === skillId
            );

            if (existingSkillModifier) {
                // Skill already exists, don't add duplicate
                return prev;
            }

            // Add the skill as a modifier to the existing progression
            const newModifier = {
                id: Date.now() + Math.random(), // Temporary ID
                featureProgressionId: classSkillsProgression.id,
                modifierType: FeatureModifierType.Skill,
                value: 1, // Class skill modifier value
                bonusType: null, // Optional bonus type
                appliesTo: skillId,
                appliesIfChoiceKey: null,
                appliesIfChoiceValue: null,
            };

            // Create a new array with the updated progression
            return prev.map(p => {
                if (p.id === classSkillsProgression.id) {
                    return {
                        ...p,
                        modifiers: [...(p.modifiers || []), newModifier]
                    };
                }
                return p;
            });
        });
    }, [id]);

    /**
     * Handles removing a class skill via the feature system.
     */
    const handleRemoveSkill = useCallback((skillId: number) => {
        setFeatureProgressions(prev => {
            const updatedProgressions = prev.map(prog => {
                if (prog.featureId === SpecialFeatureId.ClassSkill && prog.appliesToType === FeatureAppliesToType.Skill) {
                    // Remove the specific skill modifier
                    const updatedModifiers = prog.modifiers?.filter(mod =>
                        !(mod.modifierType === FeatureModifierType.Skill && mod.appliesTo === skillId)
                    ) || [];

                    return {
                        ...prog,
                        modifiers: updatedModifiers
                    };
                }
                return prog;
            });

            // Remove the progression entirely if it has no modifiers left
            return updatedProgressions.filter(prog =>
                !(prog.featureId === SpecialFeatureId.ClassSkill && prog.appliesToType === FeatureAppliesToType.Skill) ||
                (prog.modifiers && prog.modifiers.length > 0)
            );
        });
    }, []);

    /**
     * Handles adding a proficiency via the feature system.
     */
    const handleAddProficiency = useCallback(async (featId: number, itemId: number) => {
        try {
            // Get the proficiency display info to get proper names
            const profInfo = await ClassProficiencyService.getProficiencyDisplay([{ featId, itemId }]);
            const { featName, itemName } = profInfo[0];

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
                        appliesToType: null,
                        appliesTo: null,
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
        setFeatureProgressions(prev => {
            const updatedProgressions = prev.map(prog => {
                if (prog.featureId === SpecialFeatureId.ClassProficiency) {
                    // Remove the specific proficiency effect
                    const updatedEffects = prog.effects?.filter(effect =>
                        !(effect.effectType === FeatureSpecialEffectType.Proficiency &&
                            effect.featId === featId &&
                            effect.itemId === itemId)
                    ) || [];

                    return {
                        ...prog,
                        effects: updatedEffects
                    };
                }
                return prog;
            });

            // Remove the progression entirely if it has no effects left
            return updatedProgressions.filter(prog =>
                !(prog.featureId === SpecialFeatureId.ClassProficiency) ||
                (prog.effects && prog.effects.length > 0)
            );
        });
    }, []);



    // Initialize form data with default values
    const initialFormData: ClassFormData = {
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
    };

    const [formData, setFormData] = useState<ClassFormData>(initialFormData);

    /**
     * Handles adding a feature progression to the class.
     */
    const handleAddProgression = useCallback((progression: FeatureProgressionWithRelations) => {
        console.log('handleAddProgression called with:', progression);
        setFeatureProgressions(prev => {
            // Ensure the progression has feature information for display
            const progressionWithFeature = {
                ...progression,
                feature: progression.feature || {
                    id: progression.featureId,
                    name: preSelectedFeature?.name || `Feature ${progression.featureId}`,
                    description: preSelectedFeature?.description || '',
                    slug: preSelectedFeature?.slug || `feature-${progression.featureId}`,
                }
            };

            console.log('Adding progression with feature:', progressionWithFeature);
            // Always add as a new progression - allow multiple progressions per feature/level
            return [...prev, progressionWithFeature];
        });
    }, [preSelectedFeature]);

    /**
     * Handles the removal of a feature progression from the class.
     */
    const handleRemoveProgression = useCallback((progressionId: number) => {
        setFeatureProgressions(prev => prev.filter(p => p.id !== progressionId));
    }, []);

    /**
     * Handles updating a feature progression.
     */
    const handleUpdateProgression = useCallback((oldProgression: FeatureProgressionWithRelations, updatedProgression: FeatureProgressionWithRelations) => {
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
    const handleOpenProgressionDialog = useCallback(() => {
        setEditingProgression(null);
        setIsProgressionDialogOpen(true);
    }, []);

    /**
     * Opens the progression dialog for editing an existing progression.
     */
    const handleEditProgression = useCallback((progression: FeatureProgressionWithRelations) => {
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
                const fetchedClass = await ClassService.getClassById(undefined, { id: parseInt(id) });
                setCls(fetchedClass);
                setFormData(fetchedClass);

                // Load feature progressions from the class data
                if (fetchedClass.features) {
                    setFeatureProgressions(fetchedClass.features);
                } else {
                    setFeatureProgressions([]);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch class');
            } finally {
                setIsLoading(false);
            }
        };

        fetchClass();
    }, [id]);

    // Handle new feature from association dialog
    useEffect(() => {
        if (location.state?.newFeature) {
            const newFeature = location.state.newFeature;
            // Add the new feature progression to the list
            const newProgression: FeatureProgressionWithRelations = {
                id: Date.now(), // Temporary ID for frontend
                sourceType: 1, // 1 for Class
                classId: parseInt(id),
                raceId: null,
                level: 1, // Default to level 1
                featureId: newFeature.featureId,
                appliesToType: null,
                appliesTo: null,
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
    }, [location.state, id, navigate]);



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

            // Prepare the complete class data including feature progressions
            const classData = {
                ...formData,
                features: featureProgressions.map(prog => {
                    const { id: _, ...progressionData } = prog;
                    return {
                        ...progressionData,
                        // Remove temporary IDs from related entities
                        modifiers: prog.modifiers?.map(mod => {
                            const { id: _, featureProgressionId: __, ...modData } = mod;
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
                const newClass = await ClassService.createClass(classData as CreateClassRequest);
                setMessage('Class created successfully!');
                setTimeout(() => navigate(`/classes/${newClass.id}`), 1500);
            } else {
                await ClassService.updateClass(classData as UpdateClassRequest, { id: parseInt(id) });
                setMessage('Class updated successfully!');
                navigate(`/classes/${id}`, { state: { fromListParams: location.state?.fromListParams, refresh: true } });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save class');
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
    const progressionsByFeature = featureProgressions.reduce((acc, progression) => {
        const featureId = progression.featureId;
        if (!acc[featureId]) {
            acc[featureId] = {
                feature: progression.feature,
                progressions: []
            };
        }
        acc[featureId].progressions.push(progression);
        return acc;
    }, {} as Record<number, { feature: any; progressions: FeatureProgressionWithRelations[] }>);

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex flex-col gap-2">
                        <ValidatedInput
                            field="name"
                            label="Class Name"
                            type="text"
                            required
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-2/7"
                            inputExtraClassName="w-5/7"
                            placeholder="e.g., Wizard, Fighter, Cleric"
                            data-1p-ignore
                        />
                        <ValidatedInput
                            field="abbreviation"
                            label="Abbreviation"
                            type="text"
                            required
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-2/7"
                            inputExtraClassName="w-5/7"
                            placeholder="e.g., Wiz, Ftr, Clr"
                        />

                        <CustomSelect
                            label="Hit Die"
                            required
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-2/7"
                            itemExtraClassName="w-24"
                            itemTextExtraClassName="w-16"
                            value={formData.hitDie}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, hitDie: value as number }))}
                            options={RPG_DICE_SELECT_LIST.map(die => ({ value: die.value, label: die.label }))}
                            placeholder="Select hit die"
                        />
                        <ValidatedInput
                            field="skillPoints"
                            label="Skill Point Base"
                            type="number"
                            min={0}
                            max={10}
                            step={1}
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-2/7"
                        />
                    </div>
                    <div className="flex justify-end">
                        <div className="flex flex-col gap-2">
                            <CustomSelect
                                label="Edition"
                                required
                                componentExtraClassName="flex items-center gap-2"
                                labelExtraClassName="w-16"
                                itemExtraClassName="w-24"
                                itemTextExtraClassName="w-16"
                                value={formData.editionId}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, editionId: value as number }))}
                                options={EDITION_SELECT_LIST_FULL}
                                placeholder="Select edition"
                            />
                            <CustomCheckbox
                                label="Prestige Class"
                                checked={formData.isPrestige as boolean}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPrestige: checked }))}
                            />
                            <CustomCheckbox
                                label="Visible in Lists"
                                checked={formData.isVisible as boolean}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVisible: checked }))}
                            />
                            <CustomCheckbox
                                label="Can Cast Spells"
                                checked={formData.canCastSpells as boolean}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, canCastSpells: checked }))}
                            />
                            {formData.canCastSpells && (
                                <CustomSelect
                                    label="Casting Ability"
                                    value={formData.castingAbilityId}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, castingAbilityId: value as number | null }))}
                                    options={ABILITY_SELECT_LIST.map(ability => ({ value: ability.value, label: ability.label }))}
                                    placeholder="Select casting ability"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Progression Types Section */}
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Progression Types</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <CustomSelect
                                label="Base Attack Bonus"
                                required
                                componentExtraClassName="flex items-center gap-2"
                                labelExtraClassName="w-32"
                                itemExtraClassName="w-24"
                                itemTextExtraClassName="w-16"
                                value={formData.babProgression}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, babProgression: value as 0 | 1 | 2 }))}
                                options={BAB_PROGRESSION_SELECT_LIST}
                                placeholder="Select BAB progression"
                            />
                            <CustomSelect
                                label="Fortitude Save"
                                required
                                componentExtraClassName="flex items-center gap-2"
                                labelExtraClassName="w-32"
                                itemExtraClassName="w-24"
                                itemTextExtraClassName="w-16"
                                value={formData.fortProgression}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, fortProgression: value as 0 | 2 }))}
                                options={SAVE_PROGRESSION_SELECT_LIST}
                                placeholder="Select Fort progression"
                            />
                        </div>
                        <div className="space-y-4">
                            <CustomSelect
                                label="Reflex Save"
                                required
                                componentExtraClassName="flex items-center gap-2"
                                labelExtraClassName="w-32"
                                itemExtraClassName="w-24"
                                itemTextExtraClassName="w-16"
                                value={formData.refProgression}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, refProgression: value as 0 | 2 }))}
                                options={SAVE_PROGRESSION_SELECT_LIST}
                                placeholder="Select Ref progression"
                            />
                            <CustomSelect
                                label="Will Save"
                                required
                                componentExtraClassName="flex items-center gap-2"
                                labelExtraClassName="w-32"
                                itemExtraClassName="w-24"
                                itemTextExtraClassName="w-16"
                                value={formData.willProgression}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, willProgression: value as 0 | 2 }))}
                                options={SAVE_PROGRESSION_SELECT_LIST}
                                placeholder="Select Will progression"
                            />
                        </div>
                    </div>
                </div>

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

                {/* Class Skills Section */}
                <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Class Skills</h3>
                    <div className="flex flex-wrap gap-2 mb-2 p-2 border rounded dark:border-gray-600 min-h-[40px]">
                        {(() => {
                            const classSkills = getClassSkills(featureProgressions);
                            return classSkills.length > 0 ? (
                                classSkills.map((skillId, index) => (
                                    <span key={skillId} className="group relative text-sm pt-1 pb-1 pl-0 pr-0 cursor-pointer">
                                        {SKILL_MAP[skillId]?.name || 'Unknown Skill'}
                                        {index < classSkills.length - 1 && ','}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSkill(skillId)}
                                            className="absolute inset-0 flex items-center justify-center text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Remove Skill"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </span>
                                ))
                            ) : (
                                <span className="text-gray-500 dark:text-gray-400">No skills added.</span>
                            );
                        })()}
                        <CustomSelect
                            key={`skill-select-${Date.now()}`}
                            label=""
                            value={null}
                            componentExtraClassName="flex items-center gap-1 text-sm"
                            itemExtraClassName="w-48 text-sm leading-4 py-0.75"
                            itemTextExtraClassName="w-48"
                            onValueChange={(value) => {
                                if (value) {
                                    handleAddSkill(value as number);
                                }
                            }}
                            options={SKILL_SELECT_LIST
                                .filter(skill => !getClassSkills(featureProgressions).includes(skill.value))}
                            placeholder="Add"
                        />
                    </div>
                </div>

                {/* Class Proficiencies Section */}
                <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Class Proficiencies</h3>
                    <div className="flex flex-wrap gap-2 mb-2 p-2 border rounded dark:border-gray-600 min-h-[40px]">
                        {(() => {
                            const classProficiencies = getClassProficiencies(featureProgressions);
                            return classProficiencies.length > 0 ? (
                                classProficiencies.map((proficiency, index) => {
                                    // Use the formatter to get the proper display name
                                    const formattedName = formatClassProficiencies([proficiency]);
                                    return (
                                        <span key={`${proficiency.featId}-${proficiency.itemId}`} className="group relative text-sm pt-1 pb-1 pl-0 pr-0 cursor-pointer">
                                            {formattedName}
                                            {index < classProficiencies.length - 1 && ','}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveProficiency(proficiency.featId, proficiency.itemId)}
                                                className="absolute inset-0 flex items-center justify-center text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Remove Proficiency"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </span>
                                    );
                                })
                            ) : (
                                <span className="text-gray-500 dark:text-gray-400">No proficiencies added.</span>
                            );
                        })()}
                        <button
                            type="button"
                            onClick={() => setIsProficiencyDialogOpen(true)}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Add
                        </button>
                    </div>
                </div>

                {/* Class Features Section */}
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Class Features</h3>
                        <button
                            type="button"
                            onClick={() => setIsFeatureAssocOpen(true)}
                            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                        >
                            Add Features
                        </button>
                    </div>

                    {(() => {
                        // Filter out special features (class skills and proficiencies) from the features display
                        const filteredProgressions = featureProgressions.filter(prog =>
                            prog.featureId !== SpecialFeatureId.ClassSkill &&
                            prog.featureId !== SpecialFeatureId.ClassProficiency
                        );

                        // Group filtered progressions by feature for display
                        const progressionsByFeature = filteredProgressions.reduce((acc, progression) => {
                            const featureId = progression.featureId;
                            if (!acc[featureId]) {
                                acc[featureId] = {
                                    feature: progression.feature,
                                    progressions: []
                                };
                            }
                            acc[featureId].progressions.push(progression);
                            return acc;
                        }, {} as Record<number, { feature: any; progressions: FeatureProgressionWithRelations[] }>);

                        return Object.keys(progressionsByFeature).length > 0 ? (
                            <div className="space-y-4">
                                {Object.values(progressionsByFeature).map(({ feature, progressions }) => (
                                    <div key={feature?.id || 'unknown'} className="border border-gray-200 rounded-md dark:border-gray-600">
                                        <div className="p-3 bg-gray-50 dark:bg-gray-700">
                                            <div className="font-medium">{feature?.name || `Feature ${feature?.id || 'Unknown'}`}</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">{feature?.slug || `feature-${feature?.id || 'unknown'}`}</div>
                                        </div>

                                        {/* Feature Progressions */}
                                        <div className="p-3">
                                            <div className="flex flex-wrap gap-2 items-center mb-2">
                                                {progressions.map((progression, progIndex) => (
                                                    <div key={progIndex} className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditProgression(progression)}
                                                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                                            title="Edit progression details"
                                                        >
                                                            Level {progression.level}{(() => {
                                                                const formatted = formatProgression(progression);
                                                                const details = [];
                                                                if (formatted.value) details.push(formatted.value);
                                                                if (formatted.note) details.push(formatted.note);
                                                                return details.length > 0 ? ` (${details.join(', ')})` : '';
                                                            })()}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveProgression(progression.id)}
                                                            className="text-red-500 hover:text-red-700"
                                                            title="Remove Progression"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingProgression(null);
                                                        setPreSelectedFeature(feature);
                                                        setIsProgressionDialogOpen(true);
                                                    }}
                                                    className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                                >
                                                    Add Progression
                                                </button>
                                            </div>


                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-gray-500 text-center py-4 border border-dashed border-gray-300 rounded-md dark:border-gray-600">
                                No features associated with this class
                            </div>
                        );
                    })()}
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
                        const newProgressions: FeatureProgressionWithRelations[] = selectedFeatures
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

            {/* Feature Proficiency Dialog */}
            <FeatureProficiencyDialog
                isOpen={isProficiencyDialogOpen}
                onClose={() => setIsProficiencyDialogOpen(false)}
                onAddProficiency={handleAddProficiency}
                existingProficiencies={getClassProficiencies(featureProgressions)}
                title="Add Class Proficiency"
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
