import { Dialog } from '@base-ui-components/react/dialog';
import { ScrollArea } from '@base-ui-components/react/scroll-area';
import { TrashIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect, useRef } from 'react';

import { ValidatedCustomSelect, ValidatedInput, ValidatedForm, useValidatedForm, useFormContext } from '@/components/forms';
import { PROGRESSION_FORMATTERS } from '@/lib/Formatters';
import { FormulaCalculator } from '@/lib/formulaCalculator';
import { CreateFeatureProgressionRequest, CreateFeatureProgressionSchema, FeatureModifierInQueryResponse, FeatureProgressionWithRelations } from '@shared/schema';
import {
    MODIFIER_SELECT_LIST,
    FEATURE_BONUS_SELECT_LIST,
    FeatureSpecialEffectType,
    ModifierType,
    ModifierAppliesToType,
    FeaturePrerequisiteType,
    FeatureModifierConditionType,
    ABILITY_SELECT_LIST,
    SKILL_SELECT_LIST,
    SAVING_THROW_SELECT_LIST,
    RPG_DICE_SELECT_LIST,
    DAMAGE_TYPE_SELECT_LIST,
    USES_FREQUENCY_SELECT_LIST,
    MODIFIER_APPLIES_TO_SELECT_LIST,
    MODIFIER_APPLIES_TO_TYPES,
    MODIFIER_TYPE_COMPATIBILITY,
    FEATURE_MODIFIER_CONDITION_SELECT_LIST,
    FORMULA_SELECT_LIST,
    FORMULA_MAP,
    LANGUAGE_SELECT_LIST
} from '@shared/static-data';

interface FeatureProgressionDetailEditProps {
    isOpen: boolean;
    onClose: () => void;
    progression: FeatureProgressionWithRelations | null;
    onSave: (progression: FeatureProgressionWithRelations) => void;
    preSelectedFeature?: { id: number; name: string; description: string; slug: string };
}

// Formula Preview Component
function FormulaPreview({ modifier, progressionLevel }: { modifier: any; progressionLevel: number }) {
    const formulaId = modifier.formulaParams?.formulaId;
    if (!formulaId) {
        return null;
    }

    const formula = FORMULA_MAP[formulaId];
    if (!formula) {
        return <p className="text-xs text-red-600 dark:text-red-400">Unknown formula</p>;
    }

    const formatter = PROGRESSION_FORMATTERS[modifier.appliesTo];
    if (!formatter) {
        return <p className="text-xs text-red-600 dark:text-red-400">No formatter for modifier type</p>;
    }

    // Generate progression values for levels 1-20
    const progressionValues: Array<{ level: number; value: number }> = [];
    for (let level = 1; level <= 20; level++) {
        const context = { level, progressionLevel };
        const value = FormulaCalculator.calculateModifierValue(modifier, context);
        if (value > 0) { // Only include levels where the feature is active
            progressionValues.push({ level, value });
        }
    }

    // Find transition points where the value changes
    const transitionPoints: Array<{ level: number; value: number }> = [];
    let lastValue = 0;

    for (const { level, value } of progressionValues) {
        if (value !== lastValue) {
            transitionPoints.push({ level, value });
            lastValue = value;
        }
    }

    if (transitionPoints.length === 0) {
        return <p className="text-xs text-gray-600 dark:text-gray-400">No progression values found</p>;
    }

    // Format the progression pattern
    const patternParts = transitionPoints.map(({ level, value }) => {
        // Don't pass character context to show formula structure instead of calculated values
        const formattedValue = formatter.value(value, modifier.appliesToId, modifier.bonusType, undefined, modifier);
        return `Level ${level} (${formattedValue})`;
    });

    return (
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            <div className="font-medium mb-1">Formula Preview:</div>
            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs">
                {patternParts.join(', ')}
            </div>
        </div>
    );
}

export function FeatureProgressionDetailEdit({
    isOpen,
    onClose,
    progression,
    onSave,
    preSelectedFeature
}: FeatureProgressionDetailEditProps) {
    const [formData, setFormData] = useState<Record<string, unknown>>({
        id: progression?.id,
        sourceType: progression?.sourceType || 1, // 1 for Class
        classId: progression?.classId || 0,
        raceId: progression?.raceId || null,
        level: progression?.level || 1,
        featureId: progression?.featureId || 0,

        // Determine the type based on existing data
        progressionType: progression?.modifiers?.length ? 'modifier' :
            progression?.effects?.length ? 'effect' :
                progression?.choices?.length ? 'choice' : 'modifier',

        modifiers: progression?.modifiers || [],
        choices: progression?.choices || [],
        effects: progression?.effects || [],
        // prerequisites removed - now at feature level
    });

    // Set up validation
    const form = useValidatedForm(CreateFeatureProgressionSchema, formData, setFormData, {
        validateOnChange: false,
        validateOnBlur: false
    });

    // Update form data when progression or preSelectedFeature changes
    useEffect(() => {
        const newFormData = {
            id: progression?.id,
            sourceType: progression?.sourceType || 1, // 1 for Class
            classId: progression?.classId || 0,
            raceId: progression?.raceId || null,
            level: progression?.level || 1,
            featureId: progression?.featureId || preSelectedFeature?.id || 0,

            // Determine the type based on existing data
            progressionType: progression?.modifiers?.length ? 'modifier' :
                progression?.effects?.length ? 'effect' :
                    progression?.choices?.length ? 'choice' : 'modifier',

            modifiers: progression?.modifiers || [],
            choices: progression?.choices || [],
            effects: progression?.effects || [],
            // prerequisites removed - now at feature level
        };

        console.log('Setting form data:', newFormData);
        setFormData(newFormData);
    }, [progression, preSelectedFeature]);

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Create the updated progression with all details
        const updatedProgression: FeatureProgressionWithRelations = {
            ...formData as FeatureProgressionWithRelations,
            // Ensure required fields are present
            appliesToType: (formData as FeatureProgressionWithRelations).appliesToType ?? null,
            appliesTo: (formData as FeatureProgressionWithRelations).appliesTo ?? null,

            // Include feature data for display
            feature: progression?.feature || preSelectedFeature ? {
                id: (formData as FeatureProgressionWithRelations).featureId,
                name: progression?.feature?.name || preSelectedFeature?.name || `Feature ${(formData as FeatureProgressionWithRelations).featureId}`,
                description: progression?.feature?.description || preSelectedFeature?.description || '',
                slug: progression?.feature?.slug || preSelectedFeature?.slug || `feature-${(formData as FeatureProgressionWithRelations).featureId}`,
            } : undefined,

            modifiers: (formData.modifiers as FeatureModifierInQueryResponse[] || []).map(modifier => {
                // Remove id and featureProgressionId for bulk creation schema
                //const { id, featureProgressionId, ...cleanModifier } = modifier;

                // Ensure formulaParams has the correct structure
                if (modifier.formulaParams && modifier.formulaParams.formulaId) {
                    // Create a proper formulaParams structure
                    modifier.formulaParams = {
                        id: 1, // Temporary ID for frontend state
                        formulaId: modifier.formulaParams.formulaId,
                        interval: modifier.formulaParams.interval || 1,
                        formulaStartLevel: modifier.formulaParams.formulaStartLevel || null,
                        attributeId: modifier.formulaParams.attributeId || null,
                    };
                    // Set formulaParamsId to indicate this is a formula-based modifier
                    modifier.formulaParamsId = 1; // Temporary ID for frontend state
                }

                return modifier;
            }),
            effects: (formData.effects as any[] || []).map(effect => {
                // Remove id and progressionId for bulk creation schema
                const { id, progressionId, ...cleanEffect } = effect;
                return cleanEffect;
            }),
            choices: (formData.choices as any[] || []).map(choice => {
                // Remove id and progressionId for bulk creation schema
                const { id, progressionId, ...cleanChoice } = choice;
                return cleanChoice;
            }),
            // prerequisites removed - now at feature level
        };

        console.log('Submitting progression:', updatedProgression);
        console.log('Progression JSON:', JSON.stringify(updatedProgression, null, 2));

        // Validate against the schema directly
        try {
            const parsed = CreateFeatureProgressionSchema.parse(updatedProgression);
            console.log('Schema validation passed:', parsed);
            onSave(updatedProgression);
            onClose();
        } catch (error) {
            console.error('Schema validation failed:', error);
        }
    };

    // Helper functions to manage multiple details
    const addModifier = () => {
        const newModifier = {
            type: 0, // ModifierType.Bonus
            value: 0,
            formulaParamsId: null, // Initialize formulaParamsId as null
            bonusType: null,
            appliesTo: null,
            appliesToId: null,
            appliesIfChoiceKey: null,
            appliesIfChoiceValue: null,
            conditions: [],
        };
        setFormData(prev => ({
            ...prev,
            modifiers: [...(prev.modifiers as any[] || []), newModifier]
        }));
    };

    const removeModifier = (index: number) => {
        setFormData(prev => ({
            ...prev,
            modifiers: (prev.modifiers as any[] || []).filter((_, i) => i !== index)
        }));
    };

    const addEffect = () => {
        const newEffect = {
            effectType: 0,
            key: null,
            value: null,
            numericValue: null,
        };
        setFormData(prev => ({
            ...prev,
            effects: [...(prev.effects as any[] || []), newEffect]
        }));
    };

    const removeEffect = (index: number) => {
        setFormData(prev => ({
            ...prev,
            effects: (prev.effects as any[] || []).filter((_, i) => i !== index)
        }));
    };

    const addChoice = () => {
        const newChoice = {
            label: '',
            pickCount: 1,
            choiceType: 'Feat' as const,
            choiceBehavior: 'Single' as const,
            featId: null,
            chosenFeatureId: null,
        };
        setFormData(prev => ({
            ...prev,
            choices: [...(prev.choices as any[] || []), newChoice]
        }));
    };

    const removeChoice = (index: number) => {
        setFormData(prev => ({
            ...prev,
            choices: (prev.choices as any[] || []).filter((_, i) => i !== index)
        }));
    };

    // Helper function to format prerequisites for display
    const formatPrerequisites = (prerequisites: any[]) => {
        if (!prerequisites || prerequisites.length === 0) return 'None';

        return prerequisites.map((prereq, index) => {
            let text = '';

            switch (prereq.type) {
                case FeaturePrerequisiteType.SkillRanks:
                    const skillName = SKILL_SELECT_LIST.find(s => s.value === prereq.skillId)?.label || 'Unknown Skill';
                    text = `${skillName} ${prereq.minValue} ranks`;
                    break;
                case FeaturePrerequisiteType.AbilityScore:
                    const abilityName = ABILITY_SELECT_LIST.find(ability => ability.value === prereq.abilityId)?.label || 'Unknown Ability';
                    text = `${abilityName} ${prereq.minValue}+`;
                    break;
                case FeaturePrerequisiteType.CharacterLevel:
                    text = `Character Level ${prereq.minValue}+`;
                    break;
                case FeaturePrerequisiteType.ClassLevel:
                    text = `Class Level ${prereq.minValue}+`;
                    break;
                case FeaturePrerequisiteType.BaseAttackBonus:
                    text = `BAB ${prereq.minValue}+`;
                    break;
                case FeaturePrerequisiteType.Other:
                    text = `Other Requirement: ${prereq.minValue}`;
                    break;
                default:
                    text = `Requirement: ${prereq.minValue}`;
            }

            return index === prerequisites.length - 1 ? text : text + ', ';
        }).join('');
    };

    // Helper function to get selected formula description
    const getSelectedFormulaDescription = () => {
        const modifiers = formData.modifiers as any[] || [];
        const formulaModifiers = modifiers.filter(mod =>
            mod.formulaParams?.formulaId !== null && mod.formulaParams?.formulaId !== undefined
        );

        if (formulaModifiers.length === 0) {
            return null;
        }

        // Get the first formula description (if multiple, we'll show the first one)
        const firstFormulaModifier = formulaModifiers[0];
        const formula = FORMULA_MAP[firstFormulaModifier.formulaParams.formulaId];

        return formula?.description || null;
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Backdrop className="fixed inset-0 bg-black bg-opacity-25 z-40" />
            <Dialog.Portal>
                <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-2">
                    <div className="w-full max-w-4xl max-h-[90vh] transform rounded-2xl bg-white dark:bg-gray-800 flex flex-col shadow-xl transition-all">
                        {/* Fixed Header */}
                        <div className="p-6 border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
                            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {progression ? 'Edit' : 'Add'} {preSelectedFeature?.name || progression?.feature?.name || 'Feature'} Progression
                            </Dialog.Title>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Level {formData.level as number} - {preSelectedFeature?.name || progression?.feature?.name || 'Feature'}
                            </p>
                            {(() => {
                                const formulaDescription = getSelectedFormulaDescription();
                                if (formulaDescription) {
                                    return (
                                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                                <strong>Selected Formula:</strong> {formulaDescription}
                                            </p>
                                        </div>
                                    );
                                }
                                return (
                                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/20 rounded-md">
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            <strong>Formula System:</strong> Select a formula from the dropdown to automatically calculate values based on character level and parameters.
                                        </p>
                                    </div>
                                );
                            })()}
                            {/* Feature Prerequisites Display - Using any to avoid type errors with prerequisites */}
                            {((progression?.feature as any)?.prerequisites?.length > 0 || (preSelectedFeature as any)?.prerequisites?.length > 0) && (
                                <div className="mt-2 inline-block p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-md">
                                    <p className="text-xs text-slate-700 dark:text-slate-300">
                                        <strong>Feature Prerequisites:</strong> {formatPrerequisites((progression?.feature as any)?.prerequisites || (preSelectedFeature as any)?.prerequisites || [])}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Scrollable Content */}
                        <div className="overflow-visible">
                            <ScrollArea.Root>
                                <ScrollArea.Viewport>
                                    <ScrollArea.Content className="max-h-[calc(80vh-10rem)]">
                                        <ValidatedForm
                                            onSubmit={handleSubmit}
                                            formData={formData}
                                            setFormData={setFormData}
                                            validation={form.validation}
                                            className="space-y-6 p-6"
                                        >
                                            <div className="space-y-4">
                                                <ValidatedInput
                                                    field="level"
                                                    label="Level"
                                                    type="number"
                                                    min={1}
                                                    max={20}
                                                    required
                                                    componentExtraClassName="flex items-center gap-2"
                                                />

                                                <ValidatedCustomSelect
                                                    field="progressionType"
                                                    label="Progression Type"
                                                    required
                                                    options={[
                                                        { value: 'modifier', label: 'Modifier' },
                                                        { value: 'effect', label: 'Special Effect' },
                                                        { value: 'choice', label: 'Choice' }
                                                    ]}
                                                    placeholder="Select progression type"
                                                    componentExtraClassName="flex items-center gap-2"
                                                />
                                            </div>

                                            {/* Conditional rendering based on progression type */}
                                            {(formData.progressionType as string) === 'modifier' && (
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <h3 className="text-lg font-medium">Modifiers</h3>
                                                        <button
                                                            type="button"
                                                            onClick={addModifier}
                                                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                                                        >
                                                            Add Modifier
                                                        </button>
                                                    </div>

                                                    {(formData.modifiers as any[] || []).length === 0 ? (
                                                        <p className="text-gray-500 text-sm">No modifiers added</p>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {(formData.modifiers as any[] || []).map((modifier, index) => (
                                                                <div key={index} className="border border-gray-200 rounded-md p-3 dark:border-gray-600">
                                                                    <div className="flex justify-between items-center mb-3">
                                                                        <div className="flex-1">
                                                                            <ModifierDetailForm
                                                                                index={index}
                                                                            />
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeModifier(index)}
                                                                            className="text-red-500 hover:text-red-700 ml-3 flex-shrink-0"
                                                                            title="Remove Modifier"
                                                                        >
                                                                            <TrashIcon className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {(formData.progressionType as string) === 'effect' && (
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <h3 className="text-lg font-medium">Special Effects</h3>
                                                        <button
                                                            type="button"
                                                            onClick={addEffect}
                                                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                                                        >
                                                            Add Effect
                                                        </button>
                                                    </div>

                                                    {(formData.effects as any[] || []).length === 0 ? (
                                                        <p className="text-gray-500 text-sm">No effects added</p>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {(formData.effects as any[] || []).map((effect, index) => (
                                                                <div key={index} className="border border-gray-200 rounded-md p-3 dark:border-gray-600">
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <span className="text-sm font-medium">Effect {index + 1}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeEffect(index)}
                                                                            className="text-red-500 hover:text-red-700 text-sm"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                    <EffectDetailForm
                                                                        index={index}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {(formData.progressionType as string) === 'choice' && (
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <h3 className="text-lg font-medium">Choices</h3>
                                                        <button
                                                            type="button"
                                                            onClick={addChoice}
                                                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                                                        >
                                                            Add Choice
                                                        </button>
                                                    </div>

                                                    {(formData.choices as any[] || []).length === 0 ? (
                                                        <p className="text-gray-500 text-sm">No choices added</p>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {(formData.choices as any[] || []).map((choice, index) => (
                                                                <div key={index} className="border border-gray-200 rounded-md p-3 dark:border-gray-600">
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <span className="text-sm font-medium">Choice {index + 1}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeChoice(index)}
                                                                            className="text-red-500 hover:text-red-700 text-sm"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                    <ChoiceDetailForm
                                                                        index={index}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Prerequisites Section removed - now at feature level */}
                                        </ValidatedForm>
                                    </ScrollArea.Content>
                                </ScrollArea.Viewport>
                                <ScrollArea.Scrollbar orientation="vertical" className="Scrollbar">
                                    <ScrollArea.Thumb className="Thumb" />
                                </ScrollArea.Scrollbar>
                            </ScrollArea.Root>
                        </div>

                        {/* Fixed Footer with Cancel and Add/Update Buttons */}
                        <div className="p-6 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex-shrink-0">
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        console.log('Button clicked, validation state:', form.validation.validationState);
                                        console.log('Has errors:', form.validation.validationState.hasErrors);
                                        if (form.validation.validationState.hasErrors) {
                                            console.log('Validation errors:', form.validation.validationState.errors);
                                        }
                                        handleSubmit(e as any);
                                    }}
                                    className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={form.validation.validationState.hasErrors}
                                >
                                    {progression ? 'Update' : 'Add'} Progression
                                </button>
                            </div>
                        </div>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

// Modifier Detail Form Component
interface ModifierDetailFormProps {
    index: number;
}

function ModifierDetailForm({ index }: ModifierDetailFormProps) {
    const { formData, setFormData } = useFormContext();
    const modifiers = formData.modifiers as any[] || [];
    const modifier = modifiers[index] || {};
    const [showConditional, setShowConditional] = useState(false);
    const [showConditions, setShowConditions] = useState(false);
    const prevAppliesToRef = useRef<number | null>(null);

    // Helper function to get the appropriate appliesTo options based on modifierType
    const getAppliesToOptions = (modifierType: number | null) => {
        if (modifierType === null || modifierType === undefined) return MODIFIER_APPLIES_TO_SELECT_LIST;

        const compatibleTypes = MODIFIER_TYPE_COMPATIBILITY[modifierType as ModifierType] || [];
        return MODIFIER_APPLIES_TO_SELECT_LIST.filter(option =>
            (compatibleTypes as number[]).includes(option.value as number)
        );
    };

    const getAppliesToIdOptions = (appliesTo: number | null) => {
        if (appliesTo === null || appliesTo === undefined) return [];

        switch (appliesTo) {
            case ModifierAppliesToType.Attribute:
                return [
                    { value: -1, label: 'Any Attribute' },
                    ...ABILITY_SELECT_LIST
                ];
            case ModifierAppliesToType.Skill:
                return [
                    { value: -1, label: 'Any Skill' },
                    ...SKILL_SELECT_LIST
                ];
            case ModifierAppliesToType.SavingThrow:
                return [
                    { value: -1, label: 'Any Saving Throw' },
                    ...SAVING_THROW_SELECT_LIST
                ];
            case ModifierAppliesToType.HitDice:
                return RPG_DICE_SELECT_LIST;
            case ModifierAppliesToType.Damage:
                return DAMAGE_TYPE_SELECT_LIST;
            case ModifierAppliesToType.DamageReduction:
                return DAMAGE_TYPE_SELECT_LIST;
            case ModifierAppliesToType.AC:
                // AC modifiers use bonusType instead of appliesToId
                return [];
            case ModifierAppliesToType.Uses:
                return USES_FREQUENCY_SELECT_LIST;
            case ModifierAppliesToType.BonusLanguage:
            case ModifierAppliesToType.AutomaticLanguage:
                return [
                    { value: -1, label: 'Any Language' },
                    ...LANGUAGE_SELECT_LIST
                ];
            case ModifierAppliesToType.MovementSpeed:
            case ModifierAppliesToType.Attack:
            case ModifierAppliesToType.Initiative:
            case ModifierAppliesToType.Other:
                // These types typically don't need specific IDs, but we can provide common options
                return [
                    { value: null, label: 'Any/All' },
                    { value: 1, label: 'Specific Target 1' },
                    { value: 2, label: 'Specific Target 2' }
                ];
            default:
                return [];
        }
    };



    // Check if this modifier type should show the appliesTo field
    // Most modifier types benefit from specifying what they apply to
    const shouldShowAppliesTo = true; // Always show appliesTo for flexibility

    // Clear appliesTo when modifierType changes to an incompatible type
    useEffect(() => {
        const currentModifier = modifiers[index];
        if (currentModifier && currentModifier.type !== undefined && currentModifier.appliesTo !== null) {
            if (!shouldShowAppliesTo) {
                // Clear the appliesTo value if it's not valid for the current type
                setFormData(prev => ({
                    ...prev,
                    modifiers: (prev.modifiers as any[] || []).map((mod, i) =>
                        i === index ? { ...mod, appliesTo: null, appliesToId: null } : mod
                    )
                }));
            } else {
                // Check if the appliesTo value is valid for the current modifierType
                const compatibleTypes = MODIFIER_TYPE_COMPATIBILITY[currentModifier.type as ModifierType] || [];
                const isValid = (compatibleTypes as number[]).includes(currentModifier.appliesTo as number);
                if (!isValid) {
                    // Clear the appliesTo value if it's not valid for the current type
                    setFormData(prev => ({
                        ...prev,
                        modifiers: (prev.modifiers as any[] || []).map((mod, i) =>
                            i === index ? { ...mod, appliesTo: null, appliesToId: null } : mod
                        )
                    }));
                }
            }
        }
    }, [modifier.type, index, modifiers, shouldShowAppliesTo]);

    // Clear appliesToId when appliesTo changes (but not during initial load)
    useEffect(() => {
        const currentAppliesTo = modifier.appliesTo;
        const prevAppliesTo = prevAppliesToRef.current;

        // Only clear appliesToId if:
        // 1. We have a previous value (not initial load)
        // 2. The current value is different from the previous value
        // 3. The current value is not undefined/null (which would be initial state)
        if (prevAppliesTo !== null &&
            prevAppliesTo !== undefined &&
            currentAppliesTo !== prevAppliesTo &&
            currentAppliesTo !== undefined &&
            currentAppliesTo !== null) {
            // Clear appliesToId when appliesTo changes to ensure the dropdown updates properly
            setFormData(prev => ({
                ...prev,
                modifiers: (prev.modifiers as any[] || []).map((mod, i) =>
                    i === index ? { ...mod, appliesToId: null } : mod
                )
            }));
        }
        prevAppliesToRef.current = currentAppliesTo;
    }, [modifier.appliesTo, index]);

    // Helper functions for conditions
    const addCondition = () => {
        const newCondition = {
            conditionType: FeatureModifierConditionType.trigger,
            conditionValue: '',
        };
        setFormData(prev => ({
            ...prev,
            modifiers: (prev.modifiers as any[] || []).map((mod, i) =>
                i === index ? {
                    ...mod,
                    conditions: [...(mod.conditions || []), newCondition]
                } : mod
            )
        }));
    };

    const removeCondition = (conditionIndex: number) => {
        setFormData(prev => ({
            ...prev,
            modifiers: (prev.modifiers as any[] || []).map((mod, i) =>
                i === index ? {
                    ...mod,
                    conditions: (mod.conditions || []).filter((_, ci) => ci !== conditionIndex)
                } : mod
            )
        }));
    };

    return (
        <div className="space-y-3">
            {/* Main modifier fields in a compact grid */}
            <div className="grid grid-cols-[1fr_1fr_1.5fr_1.5fr] gap-3">
                <div>
                    <ValidatedCustomSelect
                        field={`modifiers.${index}.type`}
                        label="Type"
                        required
                        options={MODIFIER_SELECT_LIST}
                        placeholder="Select type"
                        componentExtraClassName="flex items-center gap-2"
                        nested
                    />
                </div>
                <div>
                    <ValidatedInput
                        field={`modifiers.${index}.value`}
                        label="Value"
                        type="number"
                        required
                        componentExtraClassName="flex items-center gap-2"
                        inputExtraClassName="w-20"
                        nested
                    />
                </div>
                <div>
                    <ValidatedCustomSelect
                        field={`modifiers.${index}.formulaParams.formulaId`}
                        label="Formula"
                        options={FORMULA_SELECT_LIST}
                        placeholder="Select"
                        componentExtraClassName="flex items-center gap-2"
                        nested
                    />
                </div>
                {shouldShowAppliesTo && (
                    <div>
                        <ValidatedCustomSelect
                            key={`appliesTo-${index}-${modifier.type}`}
                            field={`modifiers.${index}.appliesTo`}
                            label="Applies To"
                            options={getAppliesToOptions(modifier.type)}
                            placeholder="Select"
                            componentExtraClassName="flex items-center gap-2"
                            nested
                        />
                    </div>
                )}
            </div>

            {/* Applies To ID field (if needed) */}
            {shouldShowAppliesTo && (() => {
                const appliesToIdOptions = getAppliesToIdOptions(modifier.appliesTo);
                return appliesToIdOptions.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                        <div>
                            <ValidatedCustomSelect
                                key={`appliesToId-${index}-${modifier.appliesTo}`}
                                field={`modifiers.${index}.appliesToId`}
                                label={modifier.appliesTo !== null && modifier.appliesTo !== undefined ? MODIFIER_APPLIES_TO_TYPES[modifier.appliesTo]?.name || 'Target' : 'Target'}
                                options={appliesToIdOptions}
                                placeholder="Select"
                                componentExtraClassName="flex items-center gap-2"
                                nested
                            />
                        </div>
                    </div>
                ) : null;
            })()}

            {/* Formula Parameters Section */}
            {modifier.formulaParams?.formulaId && (
                <div className="border border-gray-200 rounded-md p-3 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/20">
                    <h4 className="text-sm font-medium mb-3">Formula Parameters</h4>
                    {(() => {
                        const formulaId = modifier.formulaParams?.formulaId;
                        const formula = FORMULA_MAP[formulaId];

                        if (!formula) {
                            return <p className="text-xs text-red-600 dark:text-red-400">Unknown formula</p>;
                        }

                        // Render different parameter inputs based on formula type
                        switch (formulaId) {
                            case 1: // LINEAR_SCALING
                            case 2: // EVERY_N_LEVELS
                            case 5: // DICE_SCALING
                                return (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <ValidatedInput
                                                field={`modifiers.${index}.formulaParams.interval`}
                                                label="Interval"
                                                type="number"
                                                min={1}
                                                placeholder="e.g., 3 for every 3 levels"
                                                componentExtraClassName="flex items-center gap-2"
                                                nested
                                            />
                                        </div>
                                        <div>
                                            <ValidatedInput
                                                field={`modifiers.${index}.formulaParams.formulaStartLevel`}
                                                label="Formula Start Level (Optional)"
                                                type="number"
                                                min={1}
                                                max={20}
                                                placeholder="e.g., 8 for Bard Inspire Courage"
                                                componentExtraClassName="flex items-center gap-2"
                                                nested
                                            />
                                        </div>
                                    </div>
                                );

                            case 6: // ATTRIBUTE_BASED
                                return (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <ValidatedCustomSelect
                                                field={`modifiers.${index}.formulaParams.attributeId`}
                                                label="Attribute"
                                                options={ABILITY_SELECT_LIST}
                                                placeholder="Select attribute"
                                                componentExtraClassName="flex items-center gap-2"
                                                nested
                                            />
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                            Base value will use the modifier's "Value" field above
                                        </div>
                                    </div>
                                );

                            case 7: // ATTRIBUTE_MODIFIER
                                return (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <ValidatedCustomSelect
                                                field={`modifiers.${index}.formulaParams.attributeId`}
                                                label="Attribute"
                                                options={ABILITY_SELECT_LIST}
                                                placeholder="Select attribute"
                                                componentExtraClassName="flex items-center gap-2"
                                                nested
                                            />
                                        </div>
                                    </div>
                                );

                            case 8: // LEVEL_TIMES_ATTRIBUTE
                                return (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <ValidatedCustomSelect
                                                field={`modifiers.${index}.formulaParams.attributeId`}
                                                label="Attribute"
                                                options={ABILITY_SELECT_LIST}
                                                placeholder="Select attribute"
                                                componentExtraClassName="flex items-center gap-2"
                                                nested
                                            />
                                        </div>
                                    </div>
                                );

                            case 3: // CONDITIONAL_SCALING
                                return (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                Conditional scaling parameters are configured separately.
                                            </p>
                                        </div>
                                    </div>
                                );

                            default:
                                return (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                No parameters needed for this formula type.
                                            </p>
                                        </div>
                                    </div>
                                );
                        }
                    })()}
                    <FormulaPreview modifier={modifier} progressionLevel={formData.level as number} />
                </div>
            )}

            {/* Optional fields in a second row */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <ValidatedCustomSelect
                        field={`modifiers.${index}.bonusType`}
                        label="Bonus Type"
                        options={FEATURE_BONUS_SELECT_LIST}
                        placeholder="Select"
                        componentExtraClassName="flex items-center gap-2"
                        nested
                    />
                </div>

                <div className="flex items-center gap-4">
                    {/* Conditional checkbox */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id={`conditional-${index}`}
                            checked={showConditional}
                            onChange={(e) => setShowConditional(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`conditional-${index}`} className="text-sm font-medium">
                            Conditional
                        </label>
                    </div>
                    {/* Runtime Conditions checkbox */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id={`conditions-${index}`}
                            checked={showConditions}
                            onChange={(e) => setShowConditions(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`conditions-${index}`} className="text-sm font-medium">
                            Conditions
                        </label>
                    </div>
                </div>
            </div>

            {/* Conditional fields */}
            {showConditional && (
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <ValidatedInput
                            field={`modifiers.${index}.appliesIfChoiceKey`}
                            label="Choice Key"
                            type="text"
                            placeholder="e.g., favored_enemy_1"
                            componentExtraClassName="flex items-center gap-2"
                            nested
                        />
                    </div>
                    <div>
                        <ValidatedInput
                            field={`modifiers.${index}.appliesIfChoiceValue`}
                            label="Choice Value"
                            type="text"
                            placeholder="e.g., humanoid, dragon"
                            componentExtraClassName="flex items-center gap-2"
                            nested
                        />
                    </div>
                </div>
            )}

            {/* Conditions */}
            {showConditions && (
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Conditions</span>
                        <button
                            type="button"
                            onClick={addCondition}
                            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                        >
                            Add Condition
                        </button>
                    </div>

                    {(modifier.conditions || []).length === 0 ? (
                        <p className="text-gray-500 text-sm">No conditions added</p>
                    ) : (
                        <div className="space-y-2">
                            {(modifier.conditions || []).map((condition: any, conditionIndex: number) => (
                                <div key={conditionIndex} className="flex items-center gap-2 p-2 border border-gray-200 rounded dark:border-gray-600">
                                    <ValidatedCustomSelect
                                        field={`modifiers.${index}.conditions.${conditionIndex}.conditionType`}
                                        label=""
                                        options={FEATURE_MODIFIER_CONDITION_SELECT_LIST}
                                        placeholder="Condition type"
                                        componentExtraClassName="flex-1"
                                        nested
                                    />
                                    <ValidatedInput
                                        field={`modifiers.${index}.conditions.${conditionIndex}.conditionValue`}
                                        label=""
                                        type="text"
                                        placeholder="Condition value"
                                        componentExtraClassName="flex-1"
                                        nested
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeCondition(conditionIndex)}
                                        className="text-red-500 hover:text-red-700 text-sm px-2"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Effect Detail Form Component
interface EffectDetailFormProps {
    index: number;
}

function EffectDetailForm({ index }: EffectDetailFormProps) {
    const { formData, setFormData } = useFormContext();
    const effects = formData.effects as any[] || [];
    const effect = effects[index] || {};

    const effectTypeOptions = Object.entries(FeatureSpecialEffectType).map(([key, value]) => ({
        value: value,
        label: key
    }));

    return (
        <div className="space-y-4">
            <div>
                <ValidatedCustomSelect
                    field={`effects.${index}.effectType`}
                    label="Effect Type"
                    required
                    options={effectTypeOptions}
                    placeholder="Select effect type"
                    nested
                />
            </div>

            <div>
                <ValidatedInput
                    field={`effects.${index}.key`}
                    label="Key"
                    type="text"
                    required
                    componentExtraClassName="flex items-center gap-2"
                    nested
                />
            </div>

            <div>
                <ValidatedInput
                    field={`effects.${index}.value`}
                    label="Value"
                    type="text"
                    componentExtraClassName="flex items-center gap-2"
                    nested
                />
            </div>

            <div>
                <ValidatedInput
                    field={`effects.${index}.numericValue`}
                    label="Numeric Value (Optional)"
                    type="number"
                    componentExtraClassName="flex items-center gap-2"
                    nested
                />
            </div>
        </div>
    );
}

// Choice Detail Form Component
interface ChoiceDetailFormProps {
    index: number;
}

function ChoiceDetailForm({ index }: ChoiceDetailFormProps) {
    const { formData, setFormData } = useFormContext();
    const choices = formData.choices as any[] || [];
    const choice = choices[index] || {};

    const choiceTypeOptions = [
        { value: 'Feat', label: 'Feat' },
        { value: 'Feature', label: 'Class Feature' }
    ];

    const choiceBehaviorOptions = [
        { value: 'Single', label: 'Single Choice' },
        { value: 'Multiple', label: 'Multiple Choices' },
        { value: 'Allocation', label: 'Allocation (e.g., +2 to specific favored enemy)' }
    ];

    return (
        <div className="space-y-4">
            <div>
                <ValidatedCustomSelect
                    field={`choices.${index}.choiceType`}
                    label="Choice Type"
                    required
                    options={choiceTypeOptions}
                    placeholder="Select choice type"
                    nested
                />
            </div>

            <div>
                <ValidatedInput
                    field={`choices.${index}.label`}
                    label="Label"
                    type="text"
                    required
                    placeholder="e.g., Choose a favored enemy"
                    componentExtraClassName="flex items-center gap-2"
                    nested
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <ValidatedCustomSelect
                        field={`choices.${index}.choiceBehavior`}
                        label="Choice Behavior"
                        required
                        options={choiceBehaviorOptions}
                        placeholder="Select behavior"
                        nested
                    />
                </div>
                <div>
                    <ValidatedInput
                        field={`choices.${index}.pickCount`}
                        label="Pick Count"
                        type="number"
                        min={1}
                        required
                        componentExtraClassName="flex items-center gap-2"
                        nested
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <ValidatedInput
                        field={`choices.${index}.featId`}
                        label="Feat ID (Optional)"
                        type="number"
                        componentExtraClassName="flex items-center gap-2"
                        nested
                    />
                </div>
                <div>
                    <ValidatedInput
                        field={`choices.${index}.chosenFeatureId`}
                        label="Chosen Feature ID (Optional)"
                        type="number"
                        componentExtraClassName="flex items-center gap-2"
                        nested
                    />
                </div>
            </div>
        </div>
    );
}
