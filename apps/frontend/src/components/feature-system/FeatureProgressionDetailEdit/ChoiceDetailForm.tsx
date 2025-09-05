import React, { useState, useEffect } from 'react';

import { FeatureSystemApi } from '@/components/feature-system';
import { useFormContext, ValidatedCustomSelect, ValidatedInput } from '@/components/forms';
import { FeatApi } from '@/features/feat/FeatApi';
import type { FeatureChoice, FeatQueryResponse, GetAllFeaturesResponse } from '@shared/schema';
import {
    FEATURE_CHOICE_SELECT_LIST,
    FEATURE_CHOICE_BEHAVIOR_SELECT_LIST,
    FEATURE_FEAT_CHOICE_FILTER_SELECT_LIST,
    FORMULA_SELECT_LIST,
    FeatureChoiceType,
    FeatureType
} from '@shared/static-data';
import type { CoreComponent } from '@shared/static-data';

import { FormulaManager } from './FormulaManager';
import type { ChoiceDetailFormProps } from './types';

export function ChoiceDetailForm({ index, preSelectedFeature, progression }: ChoiceDetailFormProps) {
    const { formData, setFormData } = useFormContext();
    const choices = formData.choices as FeatureChoice[] || [];
    const choice = choices[index] || null;
    const [availableFeats, setAvailableFeats] = useState<CoreComponent[]>([]);
    const [availableFeatures, setAvailableFeatures] = useState<CoreComponent[]>([]);

    const choiceTypeOptions = FEATURE_CHOICE_SELECT_LIST;
    const choiceBehaviorOptions = FEATURE_CHOICE_BEHAVIOR_SELECT_LIST;
    const isFeatChoice = choice.type === FeatureChoiceType.Feat;
    const isFeatureChoice = choice.type === FeatureChoiceType.Feature;
    const isCreatureTypeChoice = choice.type === FeatureChoiceType.CreatureType;

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
            <FormulaManager
                entity={choice}
                index={index}
                entityType={FeatureType.Choice}
                formData={formData}
                setFormData={setFormData}
                preSelectedFeature={preSelectedFeature}
                progression={progression}
            />

        </div>
    );
}
