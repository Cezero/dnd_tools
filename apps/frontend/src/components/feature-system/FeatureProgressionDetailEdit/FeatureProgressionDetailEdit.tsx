import { Dialog } from '@base-ui-components/react/dialog';
import { ScrollArea } from '@base-ui-components/react/scroll-area';
import React, { useState, useEffect, useCallback } from 'react';

import { ValidatedInput, ValidatedForm } from '@/components/forms';
import { FeatApi } from '@/features/feat/FeatApi';
import type { FeatureProgression, Feature, FeaturePrerequisite, FeatureModifier, FeatureChoice } from '@shared/schema';
import { FeaturePrerequisiteType, ModifierAppliesToType, FeatureType, FEATURE_TYPES } from '@shared/static-data';
import type { CoreComponent } from '@shared/static-data';

// Import our refactored components and hooks
import { ChoiceDetailForm } from './ChoiceDetailForm';
import { EntitySectionRenderer } from './EntitySectionRenderer';
import { transformFormDataForSubmission, transformProgressionForDisplay } from './formDataTransformers';
import { ModifierDetailForm } from './ModifierDetailForm';
import { SectionSelector } from './SectionSelector';
import type { EntityTypeConfig, GroupingState } from './types';
import { useEntityManagement } from './useEntityManagement';
import { useFeatureProgressionForm } from './useFeatureProgressionForm';
import { useGroupingState } from './useGroupingState';

interface FeatureProgressionDetailEditProps {
    isOpen: boolean;
    onClose: () => void;
    progression: FeatureProgression | null;
    onSave: (progression: FeatureProgression) => void;
    preSelectedFeature?: Feature;
}

export function FeatureProgressionDetailEdit({
    isOpen,
    onClose,
    progression,
    onSave,
    preSelectedFeature
}: FeatureProgressionDetailEditProps) {
    // Use our custom hooks
    const {
        formData,
        setFormData,
        form,
        hasModifiers,
        hasChoices,
        getSelectedFormulaDescription,
        schema
    } = useFeatureProgressionForm(progression, preSelectedFeature);

    const {
        groupingState,
        setGroupingState,
        updateEntityGrouping
    } = useGroupingState(progression);

    const {
        addModifier,
        removeModifier,
        addChoice,
        removeChoice,
        toggleModifiers,
        toggleChoices
    } = useEntityManagement(formData, setFormData, groupingState, setGroupingState);

    // State for loading feats for direct feat grants
    const [feats, setFeats] = useState<CoreComponent[]>([]);
    const [featsLoading, setFeatsLoading] = useState(false);

    // Hover state for group/ungroup buttons
    const [hoveredIndex, setHoveredIndex] = useState<string | null>(null);
    const [hoveredEntityType, setHoveredEntityType] = useState<FeatureType | null>(null);

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

    // Load feats when component mounts or when a feat modifier is added
    useEffect(() => {
        const modifiers = formData.modifiers as FeatureModifier[] || [];
        const hasFeatModifier = modifiers.some(mod => mod.appliesTo === ModifierAppliesToType.Feat);
        if (hasFeatModifier && feats.length === 0) {
            loadFeats();
        }
    }, [formData, feats.length, loadFeats]);

    // Load feats when dialog opens to ensure they're available
    useEffect(() => {
        if (isOpen) {
            loadFeats();
        }
    }, [isOpen, loadFeats]);

    // Grouping handlers
    const handleGroup = useCallback((entityType: FeatureType, index: number) => {
        const key = FEATURE_TYPES[entityType].name;
        const entities = formData[key] || [];
        const currentEntity = entities[index];
        const nextEntity = entities[index + 1];

        if (!nextEntity) return; // No next entity to group with

        const currentGroupingId = currentEntity.groupingId || 0;
        const nextGroupingId = nextEntity.groupingId || 0;

        // Determine target grouping ID
        let targetGroupingId: number;
        if (currentGroupingId === 0 && nextGroupingId === 0) {
            // Both ungrouped - create new group
            targetGroupingId = Math.max(...Array.from(groupingState[entityType].values()), 0) + 1;
        } else if (currentGroupingId > 0 && nextGroupingId === 0) {
            // Current grouped, next ungrouped - add to current group
            targetGroupingId = currentGroupingId;
        } else if (currentGroupingId === 0 && nextGroupingId > 0) {
            // Current ungrouped, next grouped - add to next group
            targetGroupingId = nextGroupingId;
        } else {
            // Both grouped - merge using minimum ID
            targetGroupingId = Math.min(currentGroupingId, nextGroupingId);
        }

        // Update entities and grouping state
        setFormData(prev => {
            const updatedEntities = [...(prev[key] || [])];
            updatedEntities[index] = { ...updatedEntities[index], groupingId: targetGroupingId };
            updatedEntities[index + 1] = { ...updatedEntities[index + 1], groupingId: targetGroupingId };
            return { ...prev, [key]: updatedEntities };
        });

        updateEntityGrouping(entityType, index, targetGroupingId);
        updateEntityGrouping(entityType, index + 1, targetGroupingId);
    }, [formData, groupingState, setFormData, updateEntityGrouping]);

    const handleUngroup = useCallback((entityType: FeatureType, index: number) => {
        const key = FEATURE_TYPES[entityType].name;

        setFormData(prev => {
            const entities = [...(prev[key] || [])];
            entities[index] = { ...entities[index], groupingId: 0 };
            return { ...prev, [key]: entities };
        });

        updateEntityGrouping(entityType, index, 0);
    }, [setFormData, updateEntityGrouping]);

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Create the submission data with proper type conversion
        const submissionData = transformFormDataForSubmission(formData);

        // Create the updated progression for display purposes
        const updatedProgression = transformProgressionForDisplay(formData, progression, preSelectedFeature);

        // Validate against the schema directly
        try {
            const parsed = schema.parse(submissionData);
            onSave(updatedProgression as FeatureProgression);
            onClose();
        } catch (error) {
            console.error('Schema validation failed:', error);
        }
    };

    // Entity type configuration for reusable rendering
    const entityTypes: EntityTypeConfig[] = [
        {
            key: FeatureType.Modifier,
            label: 'Modifiers',
            formComponent: ModifierDetailForm,
            addFunction: addModifier,
            removeFunction: removeModifier,
            hasFeature: hasModifiers
        },
        {
            key: FeatureType.Choice,
            label: 'Choices',
            formComponent: ChoiceDetailForm,
            addFunction: addChoice,
            removeFunction: removeChoice,
            hasFeature: hasChoices
        }
    ];

    // Helper function to format prerequisites for display
    const formatPrerequisites = (prerequisites: FeaturePrerequisite[]) => {
        if (!prerequisites || prerequisites.length === 0) return 'None';

        return prerequisites.map((prereq, index) => {
            let text = '';

            switch (prereq.type) {
                case FeaturePrerequisiteType.SkillRanks:
                    text = `Skill ${prereq.minValue} ranks`;
                    break;
                case FeaturePrerequisiteType.AbilityScore:
                    text = `Ability ${prereq.minValue}+`;
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
                                                <SectionSelector
                                                    hasModifiers={hasModifiers}
                                                    hasChoices={hasChoices}
                                                    modifierCount={(formData.modifiers as FeatureModifier[] || []).length}
                                                    choiceCount={(formData.choices as FeatureChoice[] || []).length}
                                                    onModifierToggle={toggleModifiers}
                                                    onChoiceToggle={toggleChoices}
                                                />

                                                {/* Entity Sections - Rendered using reusable loop */}
                                                {entityTypes.map(config => config.hasFeature && (
                                                    <div key={config.key} className="space-y-4">
                                                        <div className="flex justify-between items-center">
                                                            <h3 className="text-lg font-medium">{config.label}</h3>
                                                            <button
                                                                type="button"
                                                                onClick={config.addFunction}
                                                                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                                                            >
                                                                Add {config.label.slice(0, -1)}
                                                            </button>
                                                        </div>

                                                        {(formData[FEATURE_TYPES[config.key].name] || []).length === 0 ? (
                                                            <p className="text-gray-500 text-sm">No {config.label.toLowerCase()} added</p>
                                                        ) : (
                                                            <div>
                                                                <EntitySectionRenderer
                                                                    config={config}
                                                                    formData={formData}
                                                                    groupingState={groupingState}
                                                                    hoveredIndex={hoveredIndex}
                                                                    hoveredEntityType={hoveredEntityType}
                                                                    onGroup={handleGroup}
                                                                    onUngroup={handleUngroup}
                                                                    setHoveredIndex={setHoveredIndex}
                                                                    setHoveredEntityType={setHoveredEntityType}
                                                                    feats={feats}
                                                                    featsLoading={featsLoading}
                                                                    preSelectedFeature={preSelectedFeature}
                                                                    progression={progression}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
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
