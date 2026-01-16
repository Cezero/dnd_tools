import { Dialog } from '@base-ui-components/react/dialog';
import { ScrollArea } from '@base-ui-components/react/scroll-area';
import React, { useState, useCallback, useMemo, useRef } from 'react';

import { ValidatedInput, ValidatedForm, ValidatedCustomSelect } from '@/components/forms';
import { displayStrategyFactory } from '@/lib/formatters';
import { useCacheFunctions } from '@/services/cache';
import type { FeatureProgression, Feature, FeatureEntity } from '@shared/schema';
import { EntityType, FEATURE_SOURCE_LIST, DisplayType, FeatureSourceType } from '@shared/static-data';

// Import our refactored components and hooks
import { EntityDetailForm } from './EntityDetailForm';
import { EntitySectionRenderer } from './EntitySectionRenderer';
import type { EntityTypeConfig, FeatureProgressionDetailEditProps } from './types';
import { useEntityManagement } from './useEntityManagement';
import { useFeatureProgressionForm } from './useFeatureProgressionForm';
import { useGroupingState } from './useGroupingState';


export function FeatureProgressionDetailEdit({
    isOpen,
    onClose,
    progression,
    onSave,
    preSelectedFeature,
    showSourceTypeSelector = true,
    editionId: providedEditionId
}: FeatureProgressionDetailEditProps) {
    const cacheFunctions = useCacheFunctions();
    const editionIdRef = useRef<number | null>(null);
    const progressionKeyRef = useRef<string>('');

    // Determine editionId: use provided, or get from cache based on progression source
    // Use refs to track changes and prevent infinite loops
    const editionId = useMemo(() => {
        if (providedEditionId) {
            if (editionIdRef.current !== providedEditionId) {
                editionIdRef.current = providedEditionId;
            }
            return providedEditionId;
        }

        // Create a stable key from progression properties
        const firstClassId = progression?.classes && progression.classes.length > 0 ? progression.classes[0].classId : '';
        const firstRaceId = progression?.races && progression.races.length > 0 ? progression.races[0].raceId : '';
        const progressionKey = progression
            ? `${progression.sourceType}-${firstClassId}-${firstRaceId}-${progression.featId ?? ''}-${progression.editionId ?? ''}`
            : '';

        // Only recalculate if the progression key actually changed
        if (progressionKey === progressionKeyRef.current && editionIdRef.current !== null) {
            return editionIdRef.current;
        }

        progressionKeyRef.current = progressionKey;

        // Try to get editionId from cache based on progression source
        let calculatedEditionId: number | null = null;
        if (progression) {
            if (progression.sourceType === FeatureSourceType.Class && progression.classes && progression.classes.length > 0) {
                const firstClassId = progression.classes[0].classId;
                const classData = cacheFunctions.getClassSummaryById(firstClassId);
                calculatedEditionId = classData?.editionId ?? null;
            } else if (progression.sourceType === FeatureSourceType.Race && progression.races && progression.races.length > 0) {
                const firstRaceId = progression.races[0].raceId;
                const raceData = cacheFunctions.getRaceSummaryById(firstRaceId);
                calculatedEditionId = raceData?.editionId ?? null;
            } else if (progression.sourceType === FeatureSourceType.Feat && progression.featId) {
                const featData = cacheFunctions.getFeatSummaryById(progression.featId);
                calculatedEditionId = featData?.editionId ?? null;
            } else if (progression.sourceType === FeatureSourceType.Edition && progression.editionId) {
                calculatedEditionId = progression.editionId;
            }
        }

        editionIdRef.current = calculatedEditionId;
        return calculatedEditionId;
        // cacheFunctions is stable (functions don't change), but the object reference does
        // We exclude it from deps to prevent infinite loops
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [providedEditionId, progression]);
    // Use our custom hooks
    const {
        formData,
        setFormData,
        form,
        hasEntities,
        getSelectedFormulaDescription,
        schema
    } = useFeatureProgressionForm(progression, preSelectedFeature);

    const {
        groupingState,
        setGroupingState,
        updateEntityGrouping
    } = useGroupingState(progression);

    const {
        addEntity,
        removeEntity
    } = useEntityManagement(formData, setFormData, groupingState, setGroupingState);

    // Feats are now passed as props from parent component

    // Hover state for group/ungroup buttons
    const [hoveredIndex, setHoveredIndex] = useState<string | null>(null);

    // Feats are now passed as props from parent component, no need to load them

    // Grouping handlers
    const handleGroup = useCallback((index: number) => {
        const entities = formData.entities || [];
        const currentEntity = entities[index];
        const nextEntity = entities[index + 1];

        if (!nextEntity) return; // No next entity to group with

        const currentGroupingId = currentEntity.groupingId || 0;
        const nextGroupingId = nextEntity.groupingId || 0;

        // Determine target grouping ID
        let targetGroupingId: number;
        if (currentGroupingId === 0 && nextGroupingId === 0) {
            // Both ungrouped - create new group
            const allGroupingIds = Object.values(groupingState).flatMap((map: Map<number, number>) => Array.from(map.values()));
            targetGroupingId = Math.max(...allGroupingIds, 0) + 1;
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
            const updatedEntities = [...(prev.entities || [])];
            updatedEntities[index] = { ...updatedEntities[index], groupingId: targetGroupingId };
            updatedEntities[index + 1] = { ...updatedEntities[index + 1], groupingId: targetGroupingId };
            return { ...prev, entities: updatedEntities };
        });

        updateEntityGrouping(index, targetGroupingId);
        updateEntityGrouping(index + 1, targetGroupingId);
    }, [formData, groupingState, setFormData, updateEntityGrouping]);

    const handleUngroup = useCallback((index: number) => {
        setFormData(prev => {
            const entities = [...(prev.entities || [])];
            const currentEntity = entities[index];
            const currentGroupingId = currentEntity.groupingId || 0;

            // If the entity is not grouped, nothing to do
            if (currentGroupingId === 0) {
                return prev;
            }

            // Count how many entities are in the same group
            const entitiesInGroup = entities.filter(entity => (entity.groupingId || 0) === currentGroupingId);

            // If there are only 2 entities in the group, ungroup both
            if (entitiesInGroup.length === 2) {
                entities.forEach((entity, i) => {
                    if ((entity.groupingId || 0) === currentGroupingId) {
                        entities[i] = { ...entity, groupingId: 0 };
                        updateEntityGrouping(i, 0);
                    }
                });
            } else {
                // If there are more than 2 entities, just ungroup the clicked one
                entities[index] = { ...entities[index], groupingId: 0 };
                updateEntityGrouping(index, 0);
            }

            return { ...prev, entities };
        });
    }, [setFormData, updateEntityGrouping]);

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent event from bubbling to parent forms

        // Check for malformed data - every FeatureProgression should have a featureId (0 is valid for new features)
        if (formData.featureId === null || formData.featureId === undefined) {
            console.error('Malformed FeatureProgression: missing featureId', {
                formData,
                progression,
                preSelectedFeature
            });
            // TODO: Show error UI to user instead of just logging
            return;
        }

        // Validate against the schema directly
        try {
            schema.parse(formData);
            onSave(formData as FeatureProgression);
            onClose();
        } catch (error) {
            console.error('Schema validation failed:', error);
            console.error('Data being validated:', JSON.stringify(formData, null, 2));
        }
    };

    // Entity type configuration for unified rendering
    const entityConfig: EntityTypeConfig = {
        key: EntityType.Bonus, // Default type, can be changed per entity
        label: 'Entities',
        formComponent: EntityDetailForm,
        addFunction: addEntity,
        removeFunction: removeEntity,
        hasFeature: hasEntities
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
                                            <strong>Multi-Section Feature Progression:</strong> Select which components this progression provides. A single progression can include entities, special effects, and other components simultaneously.
                                        </p>
                                    </div>
                                );
                            })()}
                            {/* Feature Prerequisites Display - use formatting system (Phase 6) */}
                            {((progression?.feature as Feature)?.prerequisites?.length > 0 || (preSelectedFeature as Feature)?.prerequisites?.length > 0) && (() => {
                                // Format prerequisites using the display strategy system
                                const featureForFormatting = (progression?.feature || preSelectedFeature) as Feature;
                                const progressionForFormatting: FeatureProgression = progression || {
                                    id: 0,
                                    sourceType: 0,
                                    level: formData.level || 1,
                                    featureId: featureForFormatting?.id || 0,
                                    feature: featureForFormatting
                                } as FeatureProgression;

                                const strategy = displayStrategyFactory.createStrategy(DisplayType.Detail);
                                const displayResult = strategy.format(progressionForFormatting);
                                const formattedPrereqs = displayResult.formattedPrerequisites || [];

                                return (
                                    <div className="mt-2 inline-block p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-md">
                                        <p className="text-xs text-slate-700 dark:text-slate-300">
                                            <strong>Feature Prerequisites:</strong> {formattedPrereqs.join(', ')}
                                        </p>
                                    </div>
                                );
                            })()}
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
                                                {showSourceTypeSelector ? (
                                                    <div className="grid grid-cols-2 gap-4">
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
                                                            field="sourceType"
                                                            label="Source Type"
                                                            required
                                                            options={FEATURE_SOURCE_LIST}
                                                            placeholder="Select source type"
                                                            componentExtraClassName="flex items-center gap-2"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div>
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
                                                )}
                                            </div>

                                            {/* Unified Entity Approach */}
                                            <div className="space-y-6">
                                                {/* Entity Section */}
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <h3 className="text-lg font-medium">Entities</h3>
                                                        <button
                                                            type="button"
                                                            onClick={entityConfig.addFunction}
                                                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                                                        >
                                                            Add Entity
                                                        </button>
                                                    </div>

                                                    {(formData.entities as FeatureEntity[] || []).length === 0 ? (
                                                        <p className="text-gray-500 text-sm">No entities added</p>
                                                    ) : (
                                                        <div>
                                                            <EntitySectionRenderer
                                                                config={entityConfig}
                                                                formData={formData}
                                                                hoveredIndex={hoveredIndex}
                                                                onGroup={handleGroup}
                                                                onUngroup={handleUngroup}
                                                                setHoveredIndex={setHoveredIndex}
                                                                preSelectedFeature={preSelectedFeature}
                                                                progression={progression}
                                                                editionId={editionId}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
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
                                        e.stopPropagation(); // Prevent event from bubbling
                                        if (form.validation.validationState.hasErrors) {
                                            console.log('Validation errors:', form.validation.validationState.errors);
                                            return;
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
