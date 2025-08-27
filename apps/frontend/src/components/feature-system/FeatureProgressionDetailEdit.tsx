import { Dialog } from '@base-ui-components/react/dialog';
import { ScrollArea } from '@base-ui-components/react/scroll-area';
import { TrashIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import type { ProficiencyFeat, ProficiencyItem } from '@/components/feature-system';
import { FeatureSystemApi, FeatureSystemService } from '@/components/feature-system';
import { ValidatedCustomSelect, ValidatedInput, ValidatedForm, useValidatedForm, useFormContext } from '@/components/forms';
import { FeatApi } from '@/features/feat/FeatApi';
import { ItemApi } from '@/features/item/ItemApi';
import { displayStrategyFactory } from '@/lib/formatters';
import {
    CreateFeatureProgressionSchema,
    CreateFeatureProgressionFormSchema,
    FeatureModifier,
    FeatureSpecialEffect,
    FeatureChoice,
    CreateFeatureProgressionRequest,
    CreateFeatureModifierRequest,
    CreateFeatureModifierConditionRequest,
    CreateFeatureFormulaParamsRequest,
    CreateFeatureSpecialEffectRequest,
    CreateFeatureChoiceRequest,
    FeaturePrerequisite,
    FeatQueryResponse,
    GetAllFeaturesResponse,
    FeatureModifierCondition,
    FeatureProgression,
    Feature
} from '@shared/schema';
import {
    MODIFIER_SELECT_LIST,
    FEATURE_BONUS_SELECT_LIST,
    FeatureSpecialEffectType,
    ModifierType,
    ModifierAppliesToType,
    FeaturePrerequisiteType,
    FeatureModifierConditionType,
    ABILITY_SELECT_LIST,
    FULL_SKILL_SELECT_LIST,
    SAVING_THROW_SELECT_LIST,
    RPG_DICE_SELECT_LIST,
    DAMAGE_TYPE_SELECT_LIST,
    USES_FREQUENCY_SELECT_LIST,
    MODIFIER_APPLIES_TO_SELECT_LIST,
    MODIFIER_APPLIES_TO_TYPES,
    MODIFIER_TYPE_COMPATIBILITY,
    FEATURE_MODIFIER_CONDITION_SELECT_LIST,
    ATTACK_TYPE_SELECT_LIST,
    FORMULA_SELECT_LIST,
    FORMULA_MAP,
    LANGUAGE_SELECT_LIST,
    SIZE_SELECT_LIST,
    SPELL_SCHOOL_SELECT_LIST,
    FEATURE_FEAT_CHOICE_FILTER_SELECT_LIST,
    FEATURE_FEAT_CHOICE_FILTER_TYPES,
    FEATURE_CHOICE_SELECT_LIST,
    FEATURE_CHOICE_BEHAVIOR_SELECT_LIST,
    FeatBenefitType,
    FormulaId,
    DisplayType,
    FeatureChoiceType,
    FeatureChoiceBehavior
} from '@shared/static-data';

import { ArrayPairEditor } from './ArrayPairEditor';

interface FeatureProgressionDetailEditProps {
    isOpen: boolean;
    onClose: () => void;
    progression: FeatureProgression | null;
    onSave: (progression: FeatureProgression) => void;
    preSelectedFeature?: Feature;
}

// Formula Preview Component
function FormulaPreview({
    item, // Can be either FeatureModifier or FeatureChoice
    progressionLevel,
    featureName
}: {
    item: FeatureModifier | FeatureChoice;
    progressionLevel: number;
    featureName?: string;
}) {
    const { formData: _formData } = useFormContext();

    // Determine if this is a choice by checking for choice-specific properties
    // Choices have 'behavior' property, modifiers don't
    const isChoice = 'behavior' in item;

    // Get formula ID from the appropriate source
    const formulaId = isChoice
        ? (item as FeatureChoice).formulaParams?.formulaId
        : (item as FeatureModifier).formulaParams?.formulaId;

    if (!formulaId) {
        return null;
    }

    const formula = FORMULA_MAP[formulaId];
    if (!formula) {
        return <p className="text-xs text-red-600 dark:text-red-400">Unknown formula</p>;
    }

    // Get the choice name for display
    let _choiceName = '';
    if (isChoice) {
        const choice = item as FeatureChoice;
        if (choice.feat?.name) {
            _choiceName = choice.feat.name;
        } else if (choice.featId && choice.filterType && FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType]) {
            _choiceName = FEATURE_FEAT_CHOICE_FILTER_TYPES[choice.filterType].name;
        } else if (choice.label) {
            _choiceName = choice.label;
        } else {
            _choiceName = 'Bonus Feat';
        }
    }

    try {
        // Create a mock progression for the display strategy to work with
        const mockProgression: FeatureProgression = {
            id: 0,
            sourceType: 1, // Class
            classId: 0,
            raceId: null,
            level: progressionLevel,
            featureId: 0,
            feature: {
                id: 0,
                name: featureName || 'Preview Feature',
                description: '',
                slug: 'preview-feature'
            },
            modifiers: isChoice ? [] : [item as FeatureModifier],
            choices: isChoice ? [item as FeatureChoice] : [],
            effects: []
        };

        // Use Display Strategy to properly orchestrate the 6-layer formatting process
        const editStrategy = displayStrategyFactory.createStrategy(DisplayType.Edit);
        const displayResult = editStrategy.formatProgression(
            mockProgression,
            {
                displayType: DisplayType.Edit,
                currentLevel: progressionLevel,
                showBreakdown: false
            }
        );

        // For modifiers, use the display strategy result
        const formattedValue = displayResult.formattedValue || 'No preview available';


        return (
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                <div className="font-medium mb-1">Formula Preview:</div>
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs">
                    {formattedValue}
                </div>
            </div>
        );
    } catch (_error) {
        return <p className="text-xs text-red-600 dark:text-red-400">Error generating preview</p>;
    }
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

        // Multi-section approach - remove progressionType
        modifiers: progression?.modifiers || [],
        choices: progression?.choices || [],
        effects: progression?.effects || [],
        // prerequisites removed - now at feature level
    });

    // State for loading feats for direct feat grants
    const [feats, setFeats] = useState<Array<{ id: number; name: string }>>([]);
    const [featsLoading, setFeatsLoading] = useState(false);

    // Load feats for direct feat grants
    const loadFeats = useCallback(async () => {
        if (feats.length > 0) return; // Already loaded
        setFeatsLoading(true);
        try {
            const response = await FeatApi.getFeats({});
            setFeats(response.results || []);
        } catch (error) {
            console.error('Failed to load feats:', error);
        } finally {
            setFeatsLoading(false);
        }
    }, [feats.length]);

    // Set up validation - use form schema for new features (featureId = 0), regular schema for existing features
    const schema = (formData.featureId === 0 || !formData.featureId) ? CreateFeatureProgressionFormSchema : CreateFeatureProgressionSchema;
    const form = useValidatedForm(schema, formData, setFormData, {
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

            // Multi-section approach - remove progressionType
            modifiers: (progression?.modifiers || []).map(modifier => ({
                ...modifier,
                formulaParams: modifier.formulaParams ? {
                    ...modifier.formulaParams,
                    // Only initialize arrays for CONDITIONAL_SCALING formula
                    thresholds: modifier.formulaParams.formulaId === 3 ? (modifier.formulaParams.thresholds || []) : null,
                    values: modifier.formulaParams.formulaId === 3 ? (modifier.formulaParams.values || []) : null,
                } : {
                    formulaId: null,
                    interval: 1,
                    formulaStartLevel: null,
                    abilityId: null,
                    thresholds: null,
                    values: null,
                }
            })),
            choices: progression?.choices || [],
            effects: progression?.effects || [],
            // prerequisites removed - now at feature level
        };

        console.log('Setting form data:', newFormData);
        console.log('Modifiers with formula params:', newFormData.modifiers?.map(m => ({
            formulaId: m.formulaParams?.formulaId,
            thresholds: m.formulaParams?.thresholds,
            values: m.formulaParams?.values,
            valueTypes: m.formulaParams?.values?.map(v => typeof v),
            rawValues: m.formulaParams?.values
        })));
        setFormData(newFormData);
    }, [progression, preSelectedFeature]);

    // Load feats when component mounts or when a feat modifier is added
    useEffect(() => {
        const modifiers = formData.modifiers as FeatureModifier[] || [];
        const hasFeatModifier = modifiers.some(mod => mod.appliesTo === ModifierAppliesToType.Feat);
        if (hasFeatModifier && feats.length === 0) {
            loadFeats();
        }
    }, [formData.modifiers, feats.length, loadFeats]);

    // Load feats when dialog opens to ensure they're available
    useEffect(() => {
        if (isOpen) {
            loadFeats();
        }
    }, [isOpen, loadFeats]);

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Create the submission data with proper type conversion
        const submissionData: CreateFeatureProgressionRequest = {
            sourceType: (formData as FeatureProgression).sourceType,
            classId: (formData as FeatureProgression).classId || null,
            raceId: (formData as FeatureProgression).raceId || null,
            level: (formData as FeatureProgression).level,
            featureId: (formData as FeatureProgression).featureId,

            modifiers: (formData.modifiers as FeatureModifier[] || []).map(modifier => {
                const { id: _id, featureProgressionId: _featureProgressionId, ...baseModifier } = modifier;

                // Handle conditions conversion
                let convertedConditions: CreateFeatureModifierConditionRequest[] | undefined;
                if (baseModifier.conditions) {
                    convertedConditions = baseModifier.conditions.map(condition => {
                        const { id: _conditionId, featureModifierId: _featureModifierId, ...cleanCondition } = condition;
                        return cleanCondition as CreateFeatureModifierConditionRequest;
                    });
                }

                // Handle formulaParams conversion
                let convertedFormulaParams: CreateFeatureFormulaParamsRequest | null = null;
                if (baseModifier.formulaParams && baseModifier.formulaParams.formulaId) {
                    const { id: _formulaId, ...cleanFormulaParams } = baseModifier.formulaParams;
                    convertedFormulaParams = cleanFormulaParams as CreateFeatureFormulaParamsRequest;
                }

                // Create the final modifier object
                const finalModifier: CreateFeatureModifierRequest = {
                    type: baseModifier.type,
                    value: baseModifier.value,
                    bonusType: baseModifier.bonusType,
                    appliesTo: baseModifier.appliesTo,
                    appliesToId: baseModifier.appliesToId,
                    conditions: convertedConditions,
                    formulaParams: convertedFormulaParams,
                };

                return finalModifier;
            }),

            effects: (formData.effects as FeatureSpecialEffect[] || []).map(effect => {
                const { id: _id, progressionId: _progressionId, feat: _feat, item: _item, ...cleanEffect } = effect;
                return cleanEffect as CreateFeatureSpecialEffectRequest;
            }),

            choices: (formData.choices as FeatureChoice[] || []).map(choice => {
                const { id: _id, progressionId: _progressionId, feat: _feat, feature: _feature, formulaParamsId: _formulaParamsId, ...baseChoice } = choice;

                // Handle formulaParams conversion
                let convertedFormulaParams: CreateFeatureFormulaParamsRequest | null = null;
                if (baseChoice.formulaParams && baseChoice.formulaParams.formulaId) {
                    const { id: _formulaId, ...cleanFormulaParams } = baseChoice.formulaParams;
                    convertedFormulaParams = cleanFormulaParams as CreateFeatureFormulaParamsRequest;
                }

                // Create the final choice object
                const finalChoice: CreateFeatureChoiceRequest = {
                    label: baseChoice.label,
                    pickCount: baseChoice.pickCount,
                    type: baseChoice.type,
                    behavior: baseChoice.behavior,
                    featId: baseChoice.featId,
                    featureId: baseChoice.featureId,
                    filterType: baseChoice.filterType,
                    formulaParams: convertedFormulaParams,
                };

                return finalChoice;
            }),
        };

        // Create the updated progression for display purposes
        const updatedProgression: FeatureProgression = {
            ...formData as FeatureProgression,
            // Include feature data for display
            feature: progression?.feature || preSelectedFeature ? {
                id: (formData as FeatureProgression).featureId,
                name: progression?.feature?.name || preSelectedFeature?.name || `Feature ${(formData as FeatureProgression).featureId}`,
                description: progression?.feature?.description || preSelectedFeature?.description || '',
                slug: progression?.feature?.slug || preSelectedFeature?.slug || `feature-${(formData as FeatureProgression).featureId}`,
            } : undefined,
            modifiers: formData.modifiers as FeatureModifier[] || [],
            effects: formData.effects as FeatureSpecialEffect[] || [],
            choices: formData.choices as FeatureChoice[] || [],
        };

        console.log('Submitting progression:', submissionData);
        console.log('Progression JSON:', JSON.stringify(submissionData, null, 2));

        // Validate against the schema directly
        try {
            // Use appropriate schema based on whether this is a new feature (featureId = 0) or existing feature
            const validationSchema = (submissionData.featureId === 0) ? CreateFeatureProgressionFormSchema : CreateFeatureProgressionSchema;
            const parsed = validationSchema.parse(submissionData);
            console.log('Schema validation passed:', parsed);
            onSave(updatedProgression);
            onClose();
        } catch (error) {
            console.error('Schema validation failed:', error);
        }
    };

    // Helper functions to manage multiple details
    const addModifier = () => {
        const newModifier: FeatureModifier = {
            id: 0, // Temporary ID for frontend
            featureProgressionId: 0, // Will be set on save
            type: ModifierType.Bonus,
            value: 0,
            formulaParamsId: null,
            bonusType: null,
            appliesTo: null,
            appliesToId: null,
            conditions: [],
            formulaParams: null, // Only created when formula is selected
        };
        setFormData(prev => ({
            ...prev,
            modifiers: [...(prev.modifiers as FeatureModifier[] || []), newModifier]
        }));
    };

    const removeModifier = (index: number) => {
        setFormData(prev => ({
            ...prev,
            modifiers: (prev.modifiers as FeatureModifier[] || []).filter((_, i) => i !== index)
        }));
    };

    const addEffect = () => {
        const newEffect: FeatureSpecialEffect = {
            id: 0, // Temporary ID for frontend
            progressionId: 0, // Will be set on save
            effectType: FeatureSpecialEffectType.Proficiency,
            key: null,
            value: null,
            numericValue: null,
            featId: null,
            itemId: null,
            feat: null,
            item: null,
        };
        setFormData(prev => ({
            ...prev,
            effects: [...(prev.effects as FeatureSpecialEffect[] || []), newEffect]
        }));
    };

    const removeEffect = (index: number) => {
        setFormData(prev => ({
            ...prev,
            effects: (prev.effects as FeatureSpecialEffect[] || []).filter((_, i) => i !== index)
        }));
    };

    const addChoice = () => {
        const newChoice: FeatureChoice = {
            id: 0, // Temporary ID for frontend
            progressionId: 0, // Will be set on save
            label: '',
            pickCount: 1,
            type: FeatureChoiceType.Feat,
            behavior: FeatureChoiceBehavior.Single,
            featId: null,
            featureId: null,
            filterType: null,
            formulaParamsId: null,
            feat: null,
            feature: null,
            formulaParams: null, // Only created when formula is selected
        };
        setFormData(prev => ({
            ...prev,
            choices: [...(prev.choices as FeatureChoice[] || []), newChoice]
        }));
    };

    const removeChoice = (index: number) => {
        setFormData(prev => ({
            ...prev,
            choices: (prev.choices as FeatureChoice[] || []).filter((_, i) => i !== index)
        }));
    };

    // Helper function to format prerequisites for display
    const formatPrerequisites = (prerequisites: FeaturePrerequisite[]) => {
        if (!prerequisites || prerequisites.length === 0) return 'None';

        return prerequisites.map((prereq, index) => {
            let text = '';

            switch (prereq.type) {
                case FeaturePrerequisiteType.SkillRanks: {
                    const skillName = FULL_SKILL_SELECT_LIST.find(s => s.value === prereq.skillId)?.label || 'Unknown Skill';
                    text = `${skillName} ${prereq.minValue} ranks`;
                    break;
                }
                case FeaturePrerequisiteType.AbilityScore: {
                    // For ability score prerequisites, the skillId field contains the ability ID
                    const abilityName = ABILITY_SELECT_LIST.find(ability => ability.value === prereq.skillId)?.label || 'Unknown Ability';
                    text = `${abilityName} ${prereq.minValue}+`;
                    break;
                }
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
        const modifiers = formData.modifiers as FeatureModifier[] || [];
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

    // Get current section states
    const hasModifiers = (formData.modifiers as FeatureModifier[] || []).length > 0;
    const hasEffects = (formData.effects as FeatureSpecialEffect[] || []).length > 0;
    const hasChoices = (formData.choices as FeatureChoice[] || []).length > 0;

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
                                Level {Number(formData.level) || 1} - {preSelectedFeature?.name || progression?.feature?.name || 'Feature'}
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
                                            <strong>Multi-Section Feature Progression:</strong> Select which components this progression provides. A single progression can include modifiers, special effects, and choices simultaneously.
                                        </p>
                                    </div>
                                );
                            })()}
                            {/* Feature Prerequisites Display */}
                            {((progression?.feature as Feature)?.prerequisites?.length > 0 || (preSelectedFeature as Feature)?.prerequisites?.length > 0) && (
                                <div className="mt-2 inline-block p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-md">
                                    <p className="text-xs text-slate-700 dark:text-slate-300">
                                        <strong>Feature Prerequisites:</strong> {formatPrerequisites((progression?.feature as Feature)?.prerequisites || (preSelectedFeature as Feature)?.prerequisites || [])}
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
                                            </div>

                                            {/* Multi-Section Approach */}
                                            <div className="space-y-6">
                                                {/* Section Selection */}
                                                <div className="border border-gray-200 dark:border-gray-600 rounded-md p-4 bg-gray-50 dark:bg-gray-700/20">
                                                    <h3 className="text-lg font-medium mb-3">Progression Components</h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                                        Select which components this feature progression provides:
                                                    </p>
                                                    <div className="flex flex-wrap gap-4">
                                                        <label className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={hasModifiers}
                                                                onChange={(e) => {
                                                                    if (e.target.checked && !hasModifiers) {
                                                                        addModifier();
                                                                    } else if (!e.target.checked && hasModifiers) {
                                                                        setFormData(prev => ({ ...prev, modifiers: [] }));
                                                                    }
                                                                }}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                            />
                                                            <span className="text-sm font-medium">Modifiers</span>
                                                            <span className="text-xs text-gray-500">({(formData.modifiers as FeatureModifier[] || []).length})</span>
                                                        </label>
                                                        <label className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={hasEffects}
                                                                onChange={(e) => {
                                                                    if (e.target.checked && !hasEffects) {
                                                                        addEffect();
                                                                    } else if (!e.target.checked && hasEffects) {
                                                                        setFormData(prev => ({ ...prev, effects: [] }));
                                                                    }
                                                                }}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                            />
                                                            <span className="text-sm font-medium">Special Effects</span>
                                                            <span className="text-xs text-gray-500">({(formData.effects as FeatureSpecialEffect[] || []).length})</span>
                                                        </label>
                                                        <label className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={hasChoices}
                                                                onChange={(e) => {
                                                                    if (e.target.checked && !hasChoices) {
                                                                        addChoice();
                                                                    } else if (!e.target.checked && hasChoices) {
                                                                        setFormData(prev => ({ ...prev, choices: [] }));
                                                                    }
                                                                }}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                            />
                                                            <span className="text-sm font-medium">Choices</span>
                                                            <span className="text-xs text-gray-500">({(formData.choices as FeatureChoice[] || []).length})</span>
                                                        </label>
                                                    </div>
                                                </div>

                                                {/* Modifiers Section */}
                                                {hasModifiers && (
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

                                                        {(formData.modifiers as FeatureModifier[] || []).length === 0 ? (
                                                            <p className="text-gray-500 text-sm">No modifiers added</p>
                                                        ) : (
                                                            <div className="space-y-3">
                                                                {(formData.modifiers as FeatureModifier[] || []).map((modifier, index) => (
                                                                    <div key={index} className="border border-gray-200 rounded-md p-3 dark:border-gray-600">
                                                                        <div className="flex justify-between items-center mb-3">
                                                                            <div className="flex-1">
                                                                                <ModifierDetailForm
                                                                                    index={index}
                                                                                    feats={feats}
                                                                                    featsLoading={featsLoading}
                                                                                    preSelectedFeature={preSelectedFeature}
                                                                                    progression={progression}
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

                                                {/* Effects Section */}
                                                {hasEffects && (
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

                                                        {(formData.effects as FeatureSpecialEffect[] || []).length === 0 ? (
                                                            <p className="text-gray-500 text-sm">No effects added</p>
                                                        ) : (
                                                            <div className="space-y-3">
                                                                {(formData.effects as FeatureSpecialEffect[] || []).map((effect, index) => (
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

                                                {/* Choices Section */}
                                                {hasChoices && (
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

                                                        {(formData.choices as FeatureChoice[] || []).length === 0 ? (
                                                            <p className="text-gray-500 text-sm">No choices added</p>
                                                        ) : (
                                                            <div className="space-y-3">
                                                                {(formData.choices as FeatureChoice[] || []).map((choice, index) => (
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
                                                                            preSelectedFeature={preSelectedFeature}
                                                                            progression={progression}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Prerequisites Section removed - now at feature level */}
                                            </div>
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
                                        handleSubmit(e as React.FormEvent);
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
    feats: Array<{ id: number; name: string }>;
    featsLoading: boolean;
    preSelectedFeature?: { id: number; name: string; description: string; slug: string };
    progression?: FeatureProgression | null;
}

function ModifierDetailForm({ index, feats, featsLoading, preSelectedFeature, progression }: ModifierDetailFormProps) {
    const { formData, setFormData } = useFormContext();
    const modifiers = useMemo(() =>
        formData.modifiers as FeatureModifier[] || [],
        [formData.modifiers]
    );
    const modifier = modifiers[index];


    const [showConditional, setShowConditional] = useState(false);
    const [showConditions, setShowConditions] = useState(false);
    const prevAppliesToRef = useRef<number | null>(null);

    // Update modifier with feat data when a feat is selected
    useEffect(() => {
        if (modifier.appliesTo === ModifierAppliesToType.Feat && modifier.appliesToId) {
            const selectedFeat = feats.find(feat => feat.id === modifier.appliesToId);
            if (selectedFeat) {
                console.log('Setting feat data for modifier:', selectedFeat);
                // Note: feat property doesn't exist in FeatureModifierInQueryResponse schema
                // The feat data is handled through appliesToId only
            }
        }
    }, [modifier.appliesTo, modifier.appliesToId, feats, index, setFormData]);

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
            case ModifierAppliesToType.Ability:
                return [
                    { value: -1, label: 'Any Ability' },
                    ...ABILITY_SELECT_LIST
                ];
            case ModifierAppliesToType.Skill:
                return [
                    { value: -1, label: 'Any Skill' },
                    ...FULL_SKILL_SELECT_LIST
                ];
            case ModifierAppliesToType.SavingThrow:
                return [
                    { value: -1, label: 'Any Saving Throw' },
                    ...SAVING_THROW_SELECT_LIST
                ];
            case ModifierAppliesToType.HitDice:
                return RPG_DICE_SELECT_LIST;
            case ModifierAppliesToType.Damage:
                // For Quantity modifiers, show dice types; for others, show damage types
                return modifier.type === ModifierType.Quantity ? RPG_DICE_SELECT_LIST : DAMAGE_TYPE_SELECT_LIST;
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

            case ModifierAppliesToType.Feat:
                // For direct feat grants, we need to load feats from the service
                if (featsLoading) {
                    return [
                        { value: null, label: 'Loading feats...' }
                    ];
                }
                return [
                    { value: null, label: 'Select a feat...' },
                    ...feats.map(feat => ({ value: feat.id, label: feat.name }))
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
                    modifiers: (prev.modifiers as FeatureModifier[] || []).map((mod, i) =>
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
                        modifiers: (prev.modifiers as FeatureModifier[] || []).map((mod, i) =>
                            i === index ? { ...mod, appliesTo: null, appliesToId: null } : mod
                        )
                    }));
                }
            }
        }
    }, [modifier.type, index, modifiers, shouldShowAppliesTo, setFormData]);

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
                modifiers: (prev.modifiers as FeatureModifier[] || []).map((mod, i) =>
                    i === index ? { ...mod, appliesToId: null } : mod
                )
            }));
        }
        prevAppliesToRef.current = currentAppliesTo;
    }, [modifier.appliesTo, index, setFormData]);

    // Initialize arrays when formula changes to CONDITIONAL_SCALING
    useEffect(() => {
        const currentFormulaId = modifier.formulaParams?.formulaId;
        if (currentFormulaId === 3) { // CONDITIONAL_SCALING
            // Initialize arrays if they don't exist
            if (!modifier.formulaParams?.thresholds || !modifier.formulaParams?.values) {
                setFormData(prev => ({
                    ...prev,
                    modifiers: (prev.modifiers as FeatureModifier[] || []).map((mod, i) =>
                        i === index ? {
                            ...mod,
                            formulaParams: {
                                ...mod.formulaParams,
                                thresholds: mod.formulaParams?.thresholds || [],
                                values: mod.formulaParams?.values || [],
                            }
                        } : mod
                    )
                }));
            }
        }
    }, [modifier.formulaParams?.formulaId, index, modifier.formulaParams?.thresholds, modifier.formulaParams?.values, setFormData]);



    // Helper functions for conditions
    const addCondition = () => {
        const newCondition = {
            conditionType: FeatureModifierConditionType.trigger,
            conditionValue: null,
        };
        setFormData(prev => ({
            ...prev,
            modifiers: (prev.modifiers as FeatureModifier[] || []).map((mod, i) =>
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
            modifiers: (prev.modifiers as FeatureModifier[] || []).map((mod, i) =>
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
                    {/* Show dice selection for damage replacement, numeric input for others */}
                    {modifier.type === ModifierType.Replacement && (modifier.appliesTo === ModifierAppliesToType.Damage || modifier.appliesTo === ModifierAppliesToType.UnarmedDamage) ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Damage Dice
                            </label>
                            <p className="text-xs text-gray-500 mb-2">
                                Use formula parameters for progression
                            </p>
                            <input
                                type="text"
                                value="Formula-based"
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                    ) : (
                        <ValidatedInput
                            field={`modifiers.${index}.value`}
                            label="Value"
                            type="number"
                            required
                            componentExtraClassName="flex items-center gap-2"
                            inputExtraClassName="w-20"
                            nested
                        />
                    )}
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
                                label={(() => {
                                    if (modifier.appliesTo === ModifierAppliesToType.Damage && modifier.type === ModifierType.Quantity) {
                                        return 'Dice';
                                    }
                                    return modifier.appliesTo !== null && modifier.appliesTo !== undefined ? MODIFIER_APPLIES_TO_TYPES[modifier.appliesTo]?.name || 'Target' : 'Target';
                                })()}
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
                            case FormulaId.LINEAR_SCALING: // LINEAR_SCALING
                            case FormulaId.EVERY_N_LEVELS: // EVERY_N_LEVELS
                            case FormulaId.DICE_SCALING: // DICE_SCALING
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

                            case FormulaId.ABILITY_BASED:
                                return (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <ValidatedCustomSelect
                                                field={`modifiers.${index}.formulaParams.abilityId`}
                                                label="Ability"
                                                options={ABILITY_SELECT_LIST}
                                                placeholder="Select ability"
                                                componentExtraClassName="flex items-center gap-2"
                                                nested
                                            />
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                            Base value will use the modifier's "Value" field above
                                        </div>
                                    </div>
                                );

                            case FormulaId.ABILITY_MODIFIER:
                                return (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <ValidatedCustomSelect
                                                field={`modifiers.${index}.formulaParams.abilityId`}
                                                label="Ability"
                                                options={ABILITY_SELECT_LIST}
                                                placeholder="Select ability"
                                                componentExtraClassName="flex items-center gap-2"
                                                nested
                                            />
                                        </div>
                                    </div>
                                );

                            case FormulaId.LEVEL_TIMES_ABILITY:
                                return (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <ValidatedCustomSelect
                                                field={`modifiers.${index}.formulaParams.abilityId`}
                                                label="Ability"
                                                options={ABILITY_SELECT_LIST}
                                                placeholder="Select ability"
                                                componentExtraClassName="flex items-center gap-2"
                                                nested
                                            />
                                        </div>
                                    </div>
                                );

                            case FormulaId.LEVEL_TIMES_VALUE: // LEVEL_TIMES_VALUE
                                return (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                            No parameters needed. Base value will use the modifier's "Value" field above.
                                        </div>
                                    </div>
                                );

                            case FormulaId.VALUE_PLUS_LEVEL: // VALUE_PLUS_LEVEL
                                return (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                            No parameters needed. Fixed value will use the modifier's "Value" field above.
                                        </div>
                                    </div>
                                );

                            case FormulaId.LEVEL_PLUS_ABILITY:
                                return (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <ValidatedCustomSelect
                                                field={`modifiers.${index}.formulaParams.abilityId`}
                                                label="Ability"
                                                options={ABILITY_SELECT_LIST}
                                                placeholder="Select ability"
                                                componentExtraClassName="flex items-center gap-2"
                                                nested
                                            />
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                            Formula will calculate: level + ability modifier
                                        </div>
                                    </div>
                                );

                            case FormulaId.CONDITIONAL_SCALING:
                                return (
                                    <div className="grid grid-cols-1 gap-3">
                                        <ArrayPairEditor
                                            thresholds={modifier.formulaParams?.thresholds || []}
                                            values={modifier.formulaParams?.values || []}
                                            onThresholdsChange={(thresholds) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    modifiers: (prev.modifiers as FeatureModifier[] || []).map((mod, i) =>
                                                        i === index ? {
                                                            ...mod,
                                                            formulaParams: {
                                                                ...mod.formulaParams,
                                                                thresholds
                                                            }
                                                        } : mod
                                                    )
                                                }));
                                            }}
                                            onValuesChange={(values) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    modifiers: (prev.modifiers as FeatureModifier[] || []).map((mod, i) =>
                                                        i === index ? {
                                                            ...mod,
                                                            formulaParams: {
                                                                ...mod.formulaParams,
                                                                values
                                                            }
                                                        } : mod
                                                    )
                                                }));
                                            }}
                                            thresholdPlaceholder="e.g., 4"
                                            valuePlaceholder="e.g., -2"
                                        />
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
                    <FormulaPreview
                        item={modifier}
                        progressionLevel={Number(formData.level) || 1}
                        featureName={preSelectedFeature?.name || progression?.feature?.name}
                    />
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
                            onChange={(e) => {
                                setShowConditional(e.target.checked);
                                // Clear conditional fields when checkbox is unchecked
                                if (!e.target.checked) {
                                    // Note: appliesIfChoiceKey and appliesIfChoiceValue are not in the schema
                                    // These fields are handled through other mechanisms
                                }
                            }}
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
                            onChange={(e) => {
                                setShowConditions(e.target.checked);
                                // Clear conditions when checkbox is unchecked
                                if (!e.target.checked) {
                                    setFormData(prev => ({
                                        ...prev,
                                        modifiers: (prev.modifiers as FeatureModifier[] || []).map((mod, i) =>
                                            i === index ? { ...mod, conditions: [] } : mod
                                        )
                                    }));
                                }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`conditions-${index}`} className="text-sm font-medium">
                            Conditions
                        </label>
                    </div>
                </div>
            </div>

            {/* Conditional fields - removed as these properties don't exist in the schema */}
            {showConditional && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="text-sm text-gray-500">
                        Conditional fields are not supported in the current schema
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
                            {(modifier.conditions || []).map((condition: FeatureModifierCondition, conditionIndex: number) => (
                                <div key={conditionIndex} className="flex items-center gap-2 p-2 border border-gray-200 rounded dark:border-gray-600">
                                    <ValidatedCustomSelect
                                        field={`modifiers.${index}.conditions.${conditionIndex}.conditionType`}
                                        label=""
                                        options={FEATURE_MODIFIER_CONDITION_SELECT_LIST}
                                        placeholder="Condition type"
                                        componentExtraClassName="flex-1"
                                        nested
                                    />
                                    {condition.conditionType === FeatureModifierConditionType.character_size ? (
                                        <ValidatedCustomSelect
                                            field={`modifiers.${index}.conditions.${conditionIndex}.conditionValue`}
                                            label=""
                                            options={SIZE_SELECT_LIST}
                                            placeholder="Select size"
                                            componentExtraClassName="flex-1"
                                            nested
                                        />
                                    ) : condition.conditionType === FeatureModifierConditionType.attack_type ? (
                                        <ValidatedCustomSelect
                                            field={`modifiers.${index}.conditions.${conditionIndex}.conditionValue`}
                                            label=""
                                            options={ATTACK_TYPE_SELECT_LIST}
                                            placeholder="Select attack type"
                                            componentExtraClassName="flex-1"
                                            nested
                                        />
                                    ) : condition.conditionType === FeatureModifierConditionType.spell_school ? (
                                        <ValidatedCustomSelect
                                            field={`modifiers.${index}.conditions.${conditionIndex}.conditionValue`}
                                            label=""
                                            options={SPELL_SCHOOL_SELECT_LIST}
                                            placeholder="Select spell school"
                                            componentExtraClassName="flex-1"
                                            nested
                                        />
                                    ) : (
                                        <ValidatedInput
                                            field={`modifiers.${index}.conditions.${conditionIndex}.conditionValue`}
                                            label=""
                                            type="text"
                                            placeholder="Condition value"
                                            componentExtraClassName="flex-1"
                                            nested
                                        />
                                    )}
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
    const { formData, setFormData: _setFormData } = useFormContext();
    const effects = formData.effects as FeatureSpecialEffect[] || [];
    const effect = effects[index] || null;

    // State for proficiency-specific data
    const [proficiencyFeats, setProficiencyFeats] = useState<ProficiencyFeat[]>([]);
    const [proficiencyItems, setProficiencyItems] = useState<ProficiencyItem[]>([]);
    const [loadingFeats, setLoadingFeats] = useState(false);
    const [loadingItems, setLoadingItems] = useState(false);

    // State for weapon familiarity-specific data
    const [exoticWeapons, setExoticWeapons] = useState<ProficiencyItem[]>([]);
    const [loadingExoticWeapons, setLoadingExoticWeapons] = useState(false);

    const effectTypeOptions = Object.entries(FeatureSpecialEffectType).map(([key, value]) => ({
        value: value,
        label: key
    }));

    const isProficiencyEffect = effect.effectType === FeatureSpecialEffectType.Proficiency;
    const isWeaponFamiliarityEffect = effect.effectType === FeatureSpecialEffectType.WeaponFamiliarity;

    const loadProficiencyFeats = useCallback(async () => {
        setLoadingFeats(true);
        try {
            const response = await FeatApi.featQuery({ queryType: 'proficiency' });
            const proficiencyFeats = response.results
                .filter(feat => feat.benefits?.some(benefit =>
                    benefit.typeId === FeatBenefitType.PROFICIENCY
                ))
                .map(feat => ({
                    id: feat.id,
                    name: feat.name,
                    proficiencyTypeId: feat.benefits.find(b => b.typeId === FeatBenefitType.PROFICIENCY)?.referenceId
                }));
            setProficiencyFeats(proficiencyFeats);
        } catch (error) {
            console.error('Failed to load proficiency feats:', error);
        } finally {
            setLoadingFeats(false);
        }
    }, []);

    const loadProficiencyItems = useCallback(async (featId: number) => {
        const feat = proficiencyFeats.find(f => f.id === featId);
        if (!feat?.proficiencyTypeId) return;

        setLoadingItems(true);
        try {
            // Use the existing ClassProficiencyService method for proper filtering
            const items = await FeatureSystemService.getItemsByProficiencyType(feat.proficiencyTypeId);

            // Sort items alphabetically by name
            const sortedItems = items.sort((a, b) => a.name.localeCompare(b.name));

            setProficiencyItems(sortedItems);
        } catch (error) {
            console.error('Failed to load proficiency items:', error);
        } finally {
            setLoadingItems(false);
        }
    }, [proficiencyFeats]);

    const loadExoticWeapons = useCallback(async () => {
        setLoadingExoticWeapons(true);
        try {
            const response = await ItemApi.itemQuery({
                queryType: 'byCategory',
                typeId: 1, // ITEM_TYPE_ENUM.WEAPON
                category: 3 // WEAPON_CATEGORY_ENUM.EXOTIC
            });

            const exoticWeaponItems = response.results
                .map(item => ({
                    id: item.id,
                    name: item.name,
                    typeId: item.typeId,
                    weapon: item.weapon
                }))
                .sort((a, b) => a.name.localeCompare(b.name));

            setExoticWeapons(exoticWeaponItems);
        } catch (error) {
            console.error('Failed to load exotic weapons:', error);
        } finally {
            setLoadingExoticWeapons(false);
        }
    }, []);

    // Load proficiency feats when component mounts or effect type changes
    useEffect(() => {
        if (isProficiencyEffect && proficiencyFeats.length === 0) {
            loadProficiencyFeats();
        }
    }, [isProficiencyEffect, proficiencyFeats.length, loadProficiencyFeats]);

    // Load items when feat is selected
    useEffect(() => {
        if (isProficiencyEffect && effect.featId) {
            loadProficiencyItems(effect.featId);
        } else if (isProficiencyEffect && !effect.featId) {
            // Clear items when no feat is selected
            setProficiencyItems([]);
        }
    }, [isProficiencyEffect, effect.featId, loadProficiencyItems]);

    // Load exotic weapons when weapon familiarity is selected
    useEffect(() => {
        if (isWeaponFamiliarityEffect && exoticWeapons.length === 0) {
            loadExoticWeapons();
        }
    }, [isWeaponFamiliarityEffect, exoticWeapons.length, loadExoticWeapons]);



    return (
        <div className="space-y-4">
            {/* Effect Type Selection */}
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

            {/* Dynamic Fields Based on Effect Type */}
            {isProficiencyEffect ? (
                // Proficiency-specific fields
                <div className="space-y-4">
                    <div>
                        <ValidatedCustomSelect
                            field={`effects.${index}.featId`}
                            label="Proficiency Feat"
                            required
                            options={[
                                { value: null, label: 'Select a proficiency feat...' },
                                ...proficiencyFeats.map(feat => ({
                                    value: feat.id,
                                    label: feat.name
                                }))
                            ]}
                            placeholder="Select feat"
                            componentExtraClassName="flex items-center gap-2"
                            nested
                            disabled={loadingFeats}
                        />
                    </div>

                    {effect.featId && (
                        <div>
                            <ValidatedCustomSelect
                                field={`effects.${index}.itemId`}
                                label="Specific Item (Optional)"
                                options={[
                                    { value: -1, label: 'All items of this type' },
                                    ...proficiencyItems.map(item => ({
                                        value: item.id,
                                        label: item.name
                                    }))
                                ]}
                                placeholder="Select item"
                                componentExtraClassName="flex items-center gap-2"
                                nested
                                disabled={loadingItems}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Select -1 for all items of this proficiency type, or choose a specific item
                            </p>
                        </div>
                    )}
                </div>
            ) : isWeaponFamiliarityEffect ? (
                // Weapon familiarity-specific fields
                <div className="space-y-4">
                    <div>
                        <ValidatedCustomSelect
                            field={`effects.${index}.numericValue`}
                            label="Weapon"
                            required
                            options={exoticWeapons.map(weapon => ({
                                value: weapon.id,
                                label: weapon.name
                            }))}
                            placeholder="Select exotic weapon..."
                            componentExtraClassName="flex items-center gap-2"
                            nested
                            disabled={loadingExoticWeapons}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Select an exotic weapon that this race can treat as a martial weapon
                        </p>
                    </div>
                </div>
            ) : (
                // Generic fields for other effect types
                <>
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
                </>
            )}
        </div>
    );
}

// Choice Detail Form Component
interface ChoiceDetailFormProps {
    index: number;
    preSelectedFeature?: { id: number; name: string; description: string; slug: string };
    progression?: FeatureProgression | null;
}

function ChoiceDetailForm({ index, preSelectedFeature, progression }: ChoiceDetailFormProps) {
    const { formData, setFormData } = useFormContext();
    const choices = formData.choices as FeatureChoice[] || [];
    const choice = choices[index] || null;
    const [availableFeats, setAvailableFeats] = useState<Array<{ id: number; name: string }>>([]);
    const [availableFeatures, setAvailableFeatures] = useState<Array<{ id: number; name: string }>>([]);

    // Ensure formulaParams is properly initialized
    useEffect(() => {
        if (choice && !choice.formulaParams) {
            setFormData(prev => ({
                ...prev,
                choices: (prev.choices as FeatureChoice[] || []).map((c, i) =>
                    i === index ? {
                        ...c,
                        formulaParams: {
                            formulaId: null,
                            interval: 1,
                            formulaStartLevel: null,
                            abilityId: null,
                            thresholds: null,
                            values: null,
                        }
                    } : c
                )
            }));
        }
    }, [choice, index, setFormData]);

    // Initialize arrays when formula changes to CONDITIONAL_SCALING
    useEffect(() => {
        const currentFormulaId = choice.formulaParams?.formulaId;
        if (currentFormulaId === 3) { // CONDITIONAL_SCALING
            // Initialize arrays if they don't exist
            if (!choice.formulaParams?.thresholds || !choice.formulaParams?.values) {
                setFormData(prev => ({
                    ...prev,
                    choices: (prev.choices as FeatureChoice[] || []).map((c, i) =>
                        i === index ? {
                            ...c,
                            formulaParams: {
                                ...c.formulaParams,
                                thresholds: c.formulaParams?.thresholds || [],
                                values: c.formulaParams?.values || [],
                            }
                        } : c
                    )
                }));
            }
        }
    }, [choice.formulaParams?.formulaId, index, choice.formulaParams?.thresholds, choice.formulaParams?.values, setFormData]);

    const choiceTypeOptions = FEATURE_CHOICE_SELECT_LIST;
    const choiceBehaviorOptions = FEATURE_CHOICE_BEHAVIOR_SELECT_LIST;

    // REMOVED: appliesToTypeOptions and getAppliesToOptions - no longer needed after removing redundant fields

    const isFeatChoice = choice.type === 0; // FeatureChoiceType.Feat
    const isFeatureChoice = choice.type === 1; // FeatureChoiceType.Feature
    const isCreatureTypeChoice = choice.type === 2; // FeatureChoiceType.CreatureType

    // Load available feats for specific feat selection
    useEffect(() => {
        const loadFeats = async () => {
            try {
                const featResponse = await FeatApi.featQuery({ queryType: 'all' });
                const feats = featResponse.results.map((feat: FeatQueryResponse['results'][0]) => ({ id: Number(feat.id), name: feat.name }));
                console.log('Loaded feats for choice selection:', feats.length, feats.slice(0, 3));
                setAvailableFeats(feats);
            } catch (error) {
                console.error('Failed to load feats:', error);
            }
        };

        if (isFeatChoice) {
            loadFeats();
        }
    }, [isFeatChoice]);

    // Load available features for specific feature selection
    useEffect(() => {
        const loadFeatures = async () => {
            try {
                const featureResponse = await FeatureSystemApi.getFeatures({});
                const features = featureResponse.results.map((feature: GetAllFeaturesResponse['results'][0]) => ({ id: Number(feature.id), name: feature.name }));
                console.log('Loaded features for choice selection:', features.length, features.slice(0, 3));
                setAvailableFeatures(features);
            } catch (error) {
                console.error('Failed to load features:', error);
            }
        };

        if (isFeatureChoice) {
            loadFeatures();
        }
    }, [isFeatureChoice]);



    return (
        <div className="space-y-3">
            {/* Main choice fields in a compact grid */}
            <div className="grid grid-cols-[1fr_1fr_1.5fr] gap-3">
                <div>
                    <ValidatedCustomSelect
                        field={`choices.${index}.type`}
                        label="Type"
                        required
                        options={choiceTypeOptions}
                        placeholder="Select type"
                        componentExtraClassName="flex items-center gap-2"
                        nested
                    />
                </div>
                <div>
                    <ValidatedCustomSelect
                        field={`choices.${index}.formulaParams.formulaId`}
                        label="Formula"
                        options={FORMULA_SELECT_LIST}
                        placeholder="Select"
                        componentExtraClassName="flex items-center gap-2"
                        nested
                    />
                </div>
                <div>
                    <ValidatedInput
                        field={`choices.${index}.label`}
                        label="Label"
                        type="text"
                        required
                        placeholder="e.g., Bonus Feat"
                        componentExtraClassName="flex items-center gap-2"
                        nested
                    />
                </div>
            </div>

            {/* Behavior and Pick Count fields */}
            <div className="grid grid-cols-[1fr_auto] gap-3">
                <div>
                    <ValidatedCustomSelect
                        field={`choices.${index}.behavior`}
                        label="Behavior"
                        required
                        options={choiceBehaviorOptions}
                        placeholder="Select behavior"
                        componentExtraClassName="flex items-center gap-2"
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
                        inputExtraClassName="w-12"
                        nested
                    />
                </div>
            </div>

            {/* Feat-specific fields - Filter Type and Specific Feat side by side */}
            {isFeatChoice && (
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <ValidatedCustomSelect
                            field={`choices.${index}.filterType`}
                            label="Feat Filter Type"
                            options={FEATURE_FEAT_CHOICE_FILTER_SELECT_LIST}
                            placeholder="Select filter type"
                            componentExtraClassName="flex items-center gap-2"
                            nested
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Filter available feats
                        </p>
                    </div>
                    <div>
                        <ValidatedCustomSelect
                            field={`choices.${index}.featId`}
                            label="Specific Feat (Optional)"
                            options={availableFeats.map(feat => ({ value: feat.id, label: feat.name }))}
                            placeholder="Select specific feat"
                            componentExtraClassName="flex items-center gap-2"
                            nested
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Leave empty for filtered choice
                        </p>
                    </div>
                </div>
            )}

            {/* Feature-specific field */}
            {isFeatureChoice && (
                <div className="grid grid-cols-1 gap-3">
                    <div>
                        <ValidatedCustomSelect
                            field={`choices.${index}.featureId`}
                            label="Specific Feature (Optional)"
                            options={availableFeatures.map(feature => ({ value: feature.id, label: feature.name }))}
                            placeholder="Select specific feature"
                            componentExtraClassName="flex items-center gap-2"
                            nested
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Leave empty for filtered choice
                        </p>
                    </div>
                </div>
            )}

            {/* Choice Approach Guidance */}
            {isFeatChoice && (
                <div className="border border-blue-200 rounded-md p-3 bg-blue-50 dark:bg-blue-900/20">
                    <h4 className="text-sm font-medium mb-2 text-blue-800 dark:text-blue-200">
                        Choice Selection Approach
                    </h4>
                    <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                        <p><strong>Specific Choice:</strong> Use "Specific Feat" above for predefined options (e.g., "Improved Grapple or Stunning Fist")</p>
                        <p><strong>Filtered Choice:</strong> Use "Feat Filter Type" to restrict available feats (e.g., "Fighter Bonus" for fighter bonus feats)</p>
                    </div>
                </div>
            )}

            {/* Creature type choice guidance */}
            {isCreatureTypeChoice && (
                <div className="border border-blue-200 rounded-md p-3 bg-blue-50 dark:bg-blue-900/20">
                    <h4 className="text-sm font-medium mb-2 text-blue-800 dark:text-blue-200">
                        Creature Type Choice
                    </h4>
                    <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                        <p><strong>Choice Behavior:</strong> Use "Single" for choosing a creature type, "Allocation" for distributing bonuses</p>
                        <p><strong>Character Sheet:</strong> The character editor will provide the actual creature type selection options</p>
                        <p><strong>Example:</strong> Favored Enemy uses "Single" to choose creature types, "Allocation" to distribute +2 bonuses</p>
                    </div>
                </div>
            )}

            {/* Formula Parameters Section - only show if formula is selected */}
            {choice.formulaParams?.formulaId && (
                <div className="border border-gray-200 rounded-md p-3 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/20">
                    <h4 className="text-sm font-medium mb-3">Formula Parameters</h4>
                    {(() => {
                        const formulaId = choice.formulaParams?.formulaId;
                        const formula = FORMULA_MAP[formulaId];

                        if (!formula) {
                            return <p className="text-xs text-red-600 dark:text-red-400">Unknown formula</p>;
                        }

                        // Render different parameter inputs based on formula type
                        switch (formulaId) {
                            case FormulaId.LINEAR_SCALING:
                            case FormulaId.EVERY_N_LEVELS:
                            case FormulaId.DICE_SCALING:
                                return (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <ValidatedInput
                                                field={`choices.${index}.formulaParams.interval`}
                                                label="Interval"
                                                type="number"
                                                min={1}
                                                placeholder="e.g., 2 for every 2 levels"
                                                componentExtraClassName="flex items-center gap-2"
                                                nested
                                            />
                                        </div>
                                        <div>
                                            <ValidatedInput
                                                field={`choices.${index}.formulaParams.formulaStartLevel`}
                                                label="Formula Start Level (Optional)"
                                                type="number"
                                                min={1}
                                                max={20}
                                                placeholder="e.g., 2 for Fighter bonus feats"
                                                componentExtraClassName="flex items-center gap-2"
                                                nested
                                            />
                                        </div>
                                    </div>
                                );

                            case FormulaId.ABILITY_BASED:
                                return (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <ValidatedCustomSelect
                                                field={`choices.${index}.formulaParams.abilityId`}
                                                label="Ability"
                                                options={ABILITY_SELECT_LIST}
                                                placeholder="Select ability"
                                                componentExtraClassName="flex items-center gap-2"
                                                nested
                                            />
                                        </div>
                                    </div>
                                );

                            case FormulaId.ABILITY_MODIFIER:
                                return (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <ValidatedCustomSelect
                                                field={`choices.${index}.formulaParams.abilityId`}
                                                label="Ability"
                                                options={ABILITY_SELECT_LIST}
                                                placeholder="Select ability"
                                                componentExtraClassName="flex items-center gap-2"
                                                nested
                                            />
                                        </div>
                                    </div>
                                );

                            case FormulaId.LEVEL_TIMES_ABILITY:
                                return (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <ValidatedCustomSelect
                                                field={`choices.${index}.formulaParams.abilityId`}
                                                label="Ability"
                                                options={ABILITY_SELECT_LIST}
                                                placeholder="Select ability"
                                                componentExtraClassName="flex items-center gap-2"
                                                nested
                                            />
                                        </div>
                                    </div>
                                );

                            case FormulaId.LEVEL_TIMES_VALUE:
                            case FormulaId.VALUE_PLUS_LEVEL:
                            case FormulaId.LEVEL_PLUS_ABILITY:
                                return (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                            No additional parameters needed for this formula type.
                                        </div>
                                    </div>
                                );

                            case FormulaId.CONDITIONAL_SCALING:
                                return (
                                    <div className="grid grid-cols-1 gap-3">
                                        <ArrayPairEditor
                                            thresholds={choice.formulaParams?.thresholds || []}
                                            values={choice.formulaParams?.values || []}
                                            onThresholdsChange={(thresholds) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    choices: (prev.choices as FeatureChoice[] || []).map((c, i) =>
                                                        i === index ? {
                                                            ...c,
                                                            formulaParams: {
                                                                ...c.formulaParams,
                                                                thresholds
                                                            }
                                                        } : c
                                                    )
                                                }));
                                            }}
                                            onValuesChange={(values) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    choices: (prev.choices as FeatureChoice[] || []).map((c, i) =>
                                                        i === index ? {
                                                            ...c,
                                                            formulaParams: {
                                                                ...c.formulaParams,
                                                                values
                                                            }
                                                        } : c
                                                    )
                                                }));
                                            }}
                                            thresholdPlaceholder="e.g., 4"
                                            valuePlaceholder="e.g., -2"
                                        />
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
                    <FormulaPreview
                        item={choice}
                        progressionLevel={Number(formData.level) || 1}
                        featureName={preSelectedFeature?.name || progression?.feature?.name}
                    />
                </div>
            )}
        </div>
    );
}
