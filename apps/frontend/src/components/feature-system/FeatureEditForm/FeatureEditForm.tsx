import { Dialog } from '@base-ui-components/react/dialog';
import { ScrollArea } from '@base-ui-components/react/scroll-area';
import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';

import { useAuthAuto } from '@/components/auth';
import { FeatureSystemApi } from '@/components/feature-system/FeatureSystemApi';
import { useFeatureResolution } from '@/lib/hooks/useFeatureResolution';
import { FeatureUpdateType } from '@shared/static-data';
import {
    ValidatedForm,
    ValidatedInput,
    ValidatedCustomSelect,
    ValidatedCustomCheckbox,
    useValidatedForm,
    useFormContext
} from '@/components/forms';
import { useCacheFunctions } from '@/services/cache';
import { CacheQueryHooks } from '@/services/query/CacheQueryHooks';
import { ClassQueryHooks } from '@/services/query/ClassQueryHooks';
import { FeatQueryHooks } from '@/services/query/FeatQueryHooks';
import { RaceQueryHooks } from '@/services/query/RaceQueryHooks';
import { FeatureQueryHooks } from '@/services/query/FeatureQueryHooks';
import { CreateFeatureRequestSchema, UpdateFeatureSchema, GetFeatureResponse, FeatureWithRelations, FeaturePrerequisite, Feature, CreateFeatureRequest } from '@shared/schema';
import { FEATURE_PRE_REQ_LIST, FeaturePrerequisiteType, FeatureSourceType, ABILITY_LIST, FEATURE_SOURCE_LIST } from '@shared/static-data';

import { EntitySectionRenderer } from '../FeatureDetailEdit/EntitySectionRenderer';
import { useEntityManagement } from '../FeatureDetailEdit/useEntityManagement';
import { useGroupingState } from '../FeatureDetailEdit/useGroupingState';
import { initializeFormData } from '../FeatureDetailEdit/formDataTransformers';
import type { EntityTypeConfig } from '../FeatureDetailEdit/types';
import { EntityDetailForm } from '../FeatureDetailEdit/EntityDetailForm';
import { EntityType } from '@shared/static-data';

import type { FeatureEditFormProps, PrerequisiteDetailFormProps } from './types';

export function FeatureEditForm({
    featureId = 'new',
    isOpen = true,
    onClose,
    onSave,
    onCancel,
    mode = 'embedded',
    context,
    showHeader = true
}: FeatureEditFormProps): React.JSX.Element {
    const { isAdmin } = useAuthAuto();
    const queryClient = useQueryClient();
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'basic' | 'entities' | 'prerequisites'>('basic');

    // Use feature resolution hook for state management
    // Convert string numbers to numbers, but keep 'new' as 'new'
    // CRITICAL: Only use resolution when isOpen is true and featureId is valid
    // Invalid featureIds (0, negative, null, undefined) should be treated as 'new' or null
    const resolutionFeatureId: number | 'new' | null = useMemo(() => {
        if (!isOpen) {
            // Don't initialize resolution when modal is closed
            return null;
        }

        if (typeof featureId === 'number') {
            // Only allow positive integers
            return featureId > 0 ? featureId : 'new';
        }

        if (featureId === 'new') {
            return 'new';
        }

        if (typeof featureId === 'string') {
            const parsed = parseInt(featureId, 10);
            // Only allow positive integers
            return !isNaN(parsed) && parsed > 0 ? parsed : 'new';
        }

        // For null, undefined, or any other invalid value, treat as 'new'
        return 'new';
    }, [featureId, isOpen]);

    // Only call useFeatureResolution when we have a valid featureId and modal is open
    const resolution = useFeatureResolution(resolutionFeatureId);

    // For backwards compatibility, keep numericFeatureId for other uses
    const numericFeatureId = typeof resolutionFeatureId === 'number' ? resolutionFeatureId : null;

    const hasInitializedRef = useRef(false);
    const previousFeatureIdRef = useRef<number | 'new' | string | undefined>(featureId);

    const schema = featureId === 'new' ? CreateFeatureRequestSchema : UpdateFeatureSchema;

    // Initialize form data with FeatureWithRelations structure
    const initialFormData: FeatureWithRelations = useMemo(() => {
        const baseData: FeatureWithRelations = {
            id: 0,
            slug: '',
            name: '',
            description: '',
            summary: null,
            displayInCharacterSheet: true,
            sourceType: context?.sourceType || FeatureSourceType.None,
            level: 1,
            domainId: null,
            featId: null,
            companionId: null,
            editionId: null,
            prerequisites: [],
            entities: [],
        };

        // Set context-based fields
        if (context) {
            switch (context.parentType) {
                case 'class':
                    baseData.classes = [{ featureId: 0, classId: context.parentId }];
                    break;
                case 'race':
                    baseData.races = [{ featureId: 0, raceId: context.parentId }];
                    break;
                case 'domain':
                    baseData.domainId = context.parentId;
                    break;
                case 'feat':
                    baseData.featId = context.parentId;
                    break;
            }
        }

        return baseData;
    }, [context]);

    const [formData, setFormData] = useState<FeatureWithRelations>(initialFormData);

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

    // Entity management hooks
    // For existing features, use state from resolution; for new features, use null
    const featureForGrouping = numericFeatureId && resolution.state ? resolution.state : null;
    const { groupingState, setGroupingState, updateEntityGrouping } = useGroupingState(featureForGrouping);
    const { addEntity, removeEntity } = useEntityManagement(formData, setFormData, groupingState, setGroupingState);

    // Get editionId for entity context (from context or formData)
    const editionId = useMemo(() => {
        return context?.editionId ?? formData.editionId ?? null;
    }, [context?.editionId, formData.editionId]);

    // Determine if sourceType should be shown (hidden when set from context)
    const showSourceTypeSelector = !context;

    useEffect(() => {
        // Reset initialization flag when featureId changes or modal closes
        if (previousFeatureIdRef.current !== featureId || (mode === 'modal' && !isOpen)) {
            hasInitializedRef.current = false;
            previousFeatureIdRef.current = featureId;
        }

        // Don't fetch if modal is closed
        if (mode === 'modal' && !isOpen) {
            return;
        }

        const fetchFeature = async () => {
            if (featureId === 'new' || !featureId || typeof featureId === 'string') {
                // Feature is new, no need to set feature
                const newFormData = initializeFormData(null);
                // Apply context if provided
                if (context) {
                    newFormData.sourceType = context.sourceType;
                    switch (context.parentType) {
                        case 'class':
                            newFormData.classes = [{ featureId: 0, classId: context.parentId }];
                            break;
                        case 'race':
                            newFormData.races = [{ featureId: 0, raceId: context.parentId }];
                            break;
                        case 'domain':
                            newFormData.domainId = context.parentId;
                            break;
                        case 'feat':
                            newFormData.featId = context.parentId;
                            break;
                    }
                }
                setFormData(newFormData);
                hasInitializedRef.current = true;
                return;
            }

            const numericId = featureId;
            if (isNaN(numericId)) {
                // Feature is new, no need to set feature
                const newFormData = initializeFormData(null);
                if (context) {
                    newFormData.sourceType = context.sourceType;
                }
                setFormData(newFormData);
                hasInitializedRef.current = true;
                return;
            }

            // For existing features, state is managed by useFeatureResolution
            // Wait for resolution to load, then sync formData with state
            if (resolution.state) {
                // Update formData whenever resolution.state is available (for this featureId)
                // Only update if we haven't initialized yet for this featureId
                if (!hasInitializedRef.current) {
                    setFormData(resolution.state);
                    hasInitializedRef.current = true;
                }
            } else if (resolution.error && !hasInitializedRef.current) {
                setError(resolution.error);
                hasInitializedRef.current = true;
            } else if (resolution.isLoading) {
                // Still loading, wait for resolution to complete
                // Don't set hasInitializedRef yet - will be set when state loads
                return;
            }
            // If state is null and not loading and no error, and we haven't initialized,
            // this might mean the feature doesn't exist - but we'll wait for resolution to complete
        };

        fetchFeature();

    }, [featureId, mode, isOpen, context, resolution.state, resolution.error, resolution.isLoading]);

    const addPrerequisite = () => {
        const newPrerequisite: FeaturePrerequisite = {
            id: 0,
            featureId: 0,
            type: FeaturePrerequisiteType.SkillRanks,
            appliesToId: null,
            minValue: 1,
        };
        setFormData(prev => ({
            ...prev,
            prerequisites: [...(prev.prerequisites || []), newPrerequisite]
        }));
    };

    const removePrerequisite = (index: number) => {
        setFormData(prev => ({
            ...prev,
            prerequisites: (prev.prerequisites || []).filter((_, i) => i !== index)
        }));
    };

    // Entity grouping handlers
    const [hoveredIndex, setHoveredIndex] = useState<string | null>(null);

    const handleGroup = useCallback((index: number) => {
        const entities = formData.entities || [];
        const currentEntity = entities[index];
        const nextEntity = entities[index + 1];

        if (!nextEntity) return;

        const currentGroupingId = currentEntity.groupingId || 0;
        const nextGroupingId = nextEntity.groupingId || 0;

        let targetGroupingId: number;
        if (currentGroupingId === 0 && nextGroupingId === 0) {
            const allGroupingIds = Object.values(groupingState).flatMap((map: Map<number, number>) => Array.from(map.values()));
            targetGroupingId = Math.max(...allGroupingIds, 0) + 1;
        } else if (currentGroupingId > 0 && nextGroupingId === 0) {
            targetGroupingId = currentGroupingId;
        } else if (currentGroupingId === 0 && nextGroupingId > 0) {
            targetGroupingId = nextGroupingId;
        } else {
            targetGroupingId = Math.min(currentGroupingId, nextGroupingId);
        }

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

            if (currentGroupingId === 0) {
                return prev;
            }

            const entitiesInGroup = entities.filter(entity => (entity.groupingId || 0) === currentGroupingId);

            if (entitiesInGroup.length === 2) {
                entities.forEach((entity, i) => {
                    if ((entity.groupingId || 0) === currentGroupingId) {
                        entities[i] = { ...entity, groupingId: 0 };
                        updateEntityGrouping(i, 0);
                    }
                });
            } else {
                entities[index] = { ...entities[index], groupingId: 0 };
                updateEntityGrouping(index, 0);
            }

            return { ...prev, entities };
        });
    }, [setFormData, updateEntityGrouping]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent event from bubbling to parent forms
        setMessage('');
        setError(null);

        if (form.validation.validationState.hasErrors) {
            setError('Please fix validation errors before submitting');
            return;
        }

        try {
            setIsLoading(true);

            if (featureId === 'new' || typeof featureId === 'string') {
                // For new features, use state system
                if (!resolution.state) {
                    throw new Error('Feature state not loaded');
                }

                const currentState = resolution.state;

                // Apply field updates
                const fieldUpdates: Array<{ field: string; value: unknown }> = [];

                if (formData.name !== currentState.name) {
                    fieldUpdates.push({ field: 'name', value: formData.name });
                }
                if (formData.slug !== currentState.slug) {
                    fieldUpdates.push({ field: 'slug', value: formData.slug });
                }
                if (formData.description !== currentState.description) {
                    fieldUpdates.push({ field: 'description', value: formData.description });
                }
                if (formData.summary !== currentState.summary) {
                    fieldUpdates.push({ field: 'summary', value: formData.summary });
                }
                if (formData.displayInCharacterSheet !== currentState.displayInCharacterSheet) {
                    fieldUpdates.push({ field: 'displayInCharacterSheet', value: formData.displayInCharacterSheet });
                }
                if (formData.sourceType !== currentState.sourceType) {
                    fieldUpdates.push({ field: 'sourceType', value: formData.sourceType });
                }
                if (formData.level !== currentState.level) {
                    fieldUpdates.push({ field: 'level', value: formData.level });
                }
                if (formData.domainId !== currentState.domainId) {
                    fieldUpdates.push({ field: 'domainId', value: formData.domainId });
                }
                if (formData.featId !== currentState.featId) {
                    fieldUpdates.push({ field: 'featId', value: formData.featId });
                }
                if (formData.companionId !== currentState.companionId) {
                    fieldUpdates.push({ field: 'companionId', value: formData.companionId });
                }
                if (formData.editionId !== currentState.editionId) {
                    fieldUpdates.push({ field: 'editionId', value: formData.editionId });
                }

                // Apply all field updates
                for (const fieldUpdate of fieldUpdates) {
                    await resolution.applyUpdate({
                        type: FeatureUpdateType.UpdateFeatureField,
                        payload: fieldUpdate
                    });
                }

                // Handle entity changes (same logic as existing features)
                const currentEntityIds = new Set((currentState.entities || []).map(e => e.id));
                const formEntityIds = new Set((formData.entities || []).map(e => e.id));

                // Remove entities that are no longer in formData
                for (const entityId of currentEntityIds) {
                    if (!formEntityIds.has(entityId)) {
                        await resolution.applyUpdate({
                            type: FeatureUpdateType.RemoveEntity,
                            payload: { entityId }
                        });
                    }
                }

                // Add/update entities
                for (const entity of formData.entities || []) {
                    if (!currentEntityIds.has(entity.id)) {
                        // New entity
                        await resolution.applyUpdate({
                            type: FeatureUpdateType.AddEntity,
                            payload: {
                                entity: {
                                    type: entity.type,
                                    appliesTo: entity.appliesTo,
                                    appliesToId: entity.appliesToId,
                                    appliesToSubId: entity.appliesToSubId,
                                    value: entity.value,
                                    bonusType: entity.bonusType,
                                    formulaParams: entity.formulaParams ? (() => {
                                        const { id: _, ...formulaData } = entity.formulaParams!;
                                        return formulaData;
                                    })() as any : null,
                                    groupingId: entity.groupingId || 0,
                                    displayInDetail: entity.displayInDetail || false,
                                    filterType: entity.filterType,
                                    conditions: entity.conditions?.map(condition => {
                                        const { id: _, featureEntityId: __, ...conditionData } = condition;
                                        return conditionData;
                                    }) as any || [],
                                }
                            }
                        });
                    } else {
                        // Updated entity - check if it changed
                        const currentEntity = currentState.entities?.find(e => e.id === entity.id);
                        if (currentEntity && JSON.stringify(currentEntity) !== JSON.stringify(entity)) {
                            await resolution.applyUpdate({
                                type: FeatureUpdateType.UpdateEntity,
                                payload: {
                                    entityId: entity.id,
                                    entity: {
                                        type: entity.type,
                                        appliesTo: entity.appliesTo,
                                        appliesToId: entity.appliesToId,
                                        appliesToSubId: entity.appliesToSubId,
                                        value: entity.value,
                                        bonusType: entity.bonusType,
                                        formulaParams: entity.formulaParams ? (() => {
                                            const { id: _, ...formulaData } = entity.formulaParams!;
                                            return formulaData;
                                        })() as any : null,
                                        groupingId: entity.groupingId || 0,
                                        displayInDetail: entity.displayInDetail || false,
                                        filterType: entity.filterType,
                                        conditions: entity.conditions?.map(condition => {
                                            const { id: _, featureEntityId: __, ...conditionData } = condition;
                                            return conditionData;
                                        }) as any || [],
                                    }
                                }
                            });
                        }
                    }
                }

                // Handle prerequisite changes
                const currentPrereqIds = new Set((currentState.prerequisites || []).map(p => p.id));
                const formPrereqIds = new Set((formData.prerequisites || []).map(p => p.id));

                // Remove prerequisites that are no longer in formData
                for (const prereqId of currentPrereqIds) {
                    if (!formPrereqIds.has(prereqId)) {
                        await resolution.applyUpdate({
                            type: FeatureUpdateType.RemovePrerequisite,
                            payload: { prerequisiteId: prereqId }
                        });
                    }
                }

                // Add/update prerequisites
                for (const prereq of formData.prerequisites || []) {
                    if (!currentPrereqIds.has(prereq.id)) {
                        // New prerequisite
                        await resolution.applyUpdate({
                            type: FeatureUpdateType.AddPrerequisite,
                            payload: {
                                prerequisite: {
                                    type: prereq.type,
                                    appliesToId: prereq.appliesToId,
                                    minValue: prereq.minValue,
                                }
                            }
                        });
                    } else {
                        // Updated prerequisite - check if it changed
                        const currentPrereq = currentState.prerequisites?.find(p => p.id === prereq.id);
                        if (currentPrereq && JSON.stringify(currentPrereq) !== JSON.stringify(prereq)) {
                            await resolution.applyUpdate({
                                type: FeatureUpdateType.UpdatePrerequisite,
                                payload: {
                                    prerequisiteId: prereq.id,
                                    prerequisite: {
                                        type: prereq.type,
                                        appliesToId: prereq.appliesToId,
                                        minValue: prereq.minValue,
                                    }
                                }
                            });
                        }
                    }
                }

                // Save state to database (creates feature and returns new featureId)
                const newFeatureId = await resolution.save();
                setMessage('Feature created successfully');

                // Invalidate feature caches
                await queryClient.invalidateQueries({
                    queryKey: FeatureQueryHooks.getFeatureByIdQueryKey(newFeatureId)
                });
                await queryClient.invalidateQueries({
                    queryKey: ['features'],
                    exact: false
                });

                // Refresh state to get latest from backend
                await resolution.refreshState();

                if (onSave && resolution.state) {
                    const savedFeature: Feature = {
                        id: newFeatureId,
                        name: resolution.state.name,
                        slug: resolution.state.slug,
                        description: resolution.state.description,
                        summary: resolution.state.summary,
                        displayInCharacterSheet: resolution.state.displayInCharacterSheet ?? true,
                        sourceType: resolution.state.sourceType,
                        level: resolution.state.level,
                        domainId: resolution.state.domainId,
                        featId: resolution.state.featId,
                        companionId: resolution.state.companionId,
                        editionId: resolution.state.editionId,
                        prerequisites: resolution.state.prerequisites || []
                    } as Feature;

                    onSave(savedFeature, [resolution.state], newFeatureId);
                }

                if (mode === 'modal' && onClose) {
                    setTimeout(() => {
                        onClose();
                    }, 500);
                }
            } else if (numericFeatureId && resolution.state) {
                // For existing features, use state system
                // Apply all changes as updates to the feature state

                // Compare formData with current state to determine what changed
                const currentState = resolution.state;
                if (!currentState) {
                    throw new Error('Feature state not loaded');
                }

                // Apply field updates
                const fieldUpdates: Array<{ field: string; value: unknown }> = [];

                if (formData.name !== currentState.name) {
                    fieldUpdates.push({ field: 'name', value: formData.name });
                }
                if (formData.slug !== currentState.slug) {
                    fieldUpdates.push({ field: 'slug', value: formData.slug });
                }
                if (formData.description !== currentState.description) {
                    fieldUpdates.push({ field: 'description', value: formData.description });
                }
                if (formData.summary !== currentState.summary) {
                    fieldUpdates.push({ field: 'summary', value: formData.summary });
                }
                if (formData.displayInCharacterSheet !== currentState.displayInCharacterSheet) {
                    fieldUpdates.push({ field: 'displayInCharacterSheet', value: formData.displayInCharacterSheet });
                }
                if (formData.sourceType !== currentState.sourceType) {
                    fieldUpdates.push({ field: 'sourceType', value: formData.sourceType });
                }
                if (formData.level !== currentState.level) {
                    fieldUpdates.push({ field: 'level', value: formData.level });
                }
                if (formData.domainId !== currentState.domainId) {
                    fieldUpdates.push({ field: 'domainId', value: formData.domainId });
                }
                if (formData.featId !== currentState.featId) {
                    fieldUpdates.push({ field: 'featId', value: formData.featId });
                }
                if (formData.companionId !== currentState.companionId) {
                    fieldUpdates.push({ field: 'companionId', value: formData.companionId });
                }
                if (formData.editionId !== currentState.editionId) {
                    fieldUpdates.push({ field: 'editionId', value: formData.editionId });
                }

                // Apply all field updates
                for (const fieldUpdate of fieldUpdates) {
                    await resolution.applyUpdate({
                        type: FeatureUpdateType.UpdateFeatureField,
                        payload: fieldUpdate
                    });
                }

                // Handle entity changes (add/update/remove)
                const currentEntityIds = new Set((currentState.entities || []).map(e => e.id));
                const formEntityIds = new Set((formData.entities || []).map(e => e.id));

                // Remove entities that are no longer in formData
                for (const entityId of currentEntityIds) {
                    if (!formEntityIds.has(entityId)) {
                        await resolution.applyUpdate({
                            type: FeatureUpdateType.RemoveEntity,
                            payload: { entityId }
                        });
                    }
                }

                // Add/update entities
                for (const entity of formData.entities || []) {
                    if (!currentEntityIds.has(entity.id)) {
                        // New entity
                        await resolution.applyUpdate({
                            type: FeatureUpdateType.AddEntity,
                            payload: {
                                entity: {
                                    type: entity.type,
                                    appliesTo: entity.appliesTo,
                                    appliesToId: entity.appliesToId,
                                    appliesToSubId: entity.appliesToSubId,
                                    value: entity.value,
                                    bonusType: entity.bonusType,
                                    formulaParams: entity.formulaParams ? (() => {
                                        const { id: _, ...formulaData } = entity.formulaParams!;
                                        return formulaData;
                                    })() as any : null,
                                    groupingId: entity.groupingId || 0,
                                    displayInDetail: entity.displayInDetail || false,
                                    filterType: entity.filterType,
                                    conditions: entity.conditions?.map(condition => {
                                        const { id: _, featureEntityId: __, ...conditionData } = condition;
                                        return conditionData;
                                    }) as any || [],
                                }
                            }
                        });
                    } else {
                        // Updated entity - check if it changed
                        const currentEntity = currentState.entities?.find(e => e.id === entity.id);
                        if (currentEntity && JSON.stringify(currentEntity) !== JSON.stringify(entity)) {
                            await resolution.applyUpdate({
                                type: FeatureUpdateType.UpdateEntity,
                                payload: {
                                    entityId: entity.id,
                                    entity: {
                                        type: entity.type,
                                        appliesTo: entity.appliesTo,
                                        appliesToId: entity.appliesToId,
                                        appliesToSubId: entity.appliesToSubId,
                                        value: entity.value,
                                        bonusType: entity.bonusType,
                                        formulaParams: entity.formulaParams ? (() => {
                                            const { id: _, ...formulaData } = entity.formulaParams!;
                                            return formulaData;
                                        })() as any : null,
                                        groupingId: entity.groupingId || 0,
                                        displayInDetail: entity.displayInDetail || false,
                                        filterType: entity.filterType,
                                        conditions: entity.conditions?.map(condition => {
                                            const { id: _, featureEntityId: __, ...conditionData } = condition;
                                            return conditionData;
                                        }) as any || [],
                                    }
                                }
                            });
                        }
                    }
                }

                // Handle prerequisite changes
                const currentPrereqIds = new Set((currentState.prerequisites || []).map(p => p.id));
                const formPrereqIds = new Set((formData.prerequisites || []).map(p => p.id));

                // Remove prerequisites that are no longer in formData
                for (const prereqId of currentPrereqIds) {
                    if (!formPrereqIds.has(prereqId)) {
                        await resolution.applyUpdate({
                            type: FeatureUpdateType.RemovePrerequisite,
                            payload: { prerequisiteId: prereqId }
                        });
                    }
                }

                // Add/update prerequisites
                for (const prereq of formData.prerequisites || []) {
                    if (!currentPrereqIds.has(prereq.id)) {
                        // New prerequisite
                        await resolution.applyUpdate({
                            type: FeatureUpdateType.AddPrerequisite,
                            payload: {
                                prerequisite: {
                                    type: prereq.type,
                                    appliesToId: prereq.appliesToId,
                                    minValue: prereq.minValue,
                                }
                            }
                        });
                    } else {
                        // Updated prerequisite - check if it changed
                        const currentPrereq = currentState.prerequisites?.find(p => p.id === prereq.id);
                        if (currentPrereq && JSON.stringify(currentPrereq) !== JSON.stringify(prereq)) {
                            await resolution.applyUpdate({
                                type: FeatureUpdateType.UpdatePrerequisite,
                                payload: {
                                    prerequisiteId: prereq.id,
                                    prerequisite: {
                                        type: prereq.type,
                                        appliesToId: prereq.appliesToId,
                                        minValue: prereq.minValue,
                                    }
                                }
                            });
                        }
                    }
                }

                // Save state to database (returns featureId)
                const savedFeatureId = await resolution.save();
                setMessage('Feature updated successfully');

                // Invalidate feature caches
                await queryClient.invalidateQueries({
                    queryKey: FeatureQueryHooks.getFeatureByIdQueryKey(numericFeatureId)
                });
                await queryClient.invalidateQueries({
                    queryKey: FeatureQueryHooks.getFeatureProgressionsQueryKey(numericFeatureId)
                });
                await queryClient.invalidateQueries({
                    queryKey: ['features'],
                    exact: false
                });

                // Refresh state to get latest from backend
                await resolution.refreshState();

                if (onSave && resolution.state) {
                    const savedFeature: Feature = {
                        id: savedFeatureId,
                        name: resolution.state.name,
                        slug: resolution.state.slug,
                        description: resolution.state.description,
                        summary: resolution.state.summary,
                        displayInCharacterSheet: resolution.state.displayInCharacterSheet ?? true,
                        sourceType: resolution.state.sourceType,
                        level: resolution.state.level,
                        domainId: resolution.state.domainId,
                        featId: resolution.state.featId,
                        companionId: resolution.state.companionId,
                        editionId: resolution.state.editionId,
                        prerequisites: resolution.state.prerequisites || []
                    } as Feature;
                    onSave(savedFeature, [resolution.state], savedFeatureId);
                }

                if (mode === 'modal' && onClose) {
                    setTimeout(() => {
                        onClose();
                    }, 500);
                }
            } else {
                throw new Error('Feature session not initialized');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save feature');
            console.error('Error saving feature:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = async () => {
        // Cancel feature editing if active
        if (numericFeatureId && resolution.state) {
            try {
                await resolution.cancel();
            } catch (err) {
                console.error('Error canceling feature editing:', err);
            }
        }

        if (onCancel) {
            onCancel();
        } else if (onClose) {
            onClose();
        }
    };

    if (!isAdmin) {
        const errorContent = (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-red-500 mb-4">Access denied. Admin privileges required.</p>
                <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Close
                </button>
            </div>
        );

        if (mode === 'modal') {
            return (
                <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
                    <Dialog.Backdrop className="fixed inset-0 bg-black bg-opacity-25 z-40" />
                    <Dialog.Portal>
                        <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-2">
                            <div className="w-full max-w-4xl max-h-[90vh] transform rounded-2xl bg-white dark:bg-gray-800 flex flex-col shadow-xl">
                                {errorContent}
                            </div>
                        </Dialog.Popup>
                    </Dialog.Portal>
                </Dialog.Root>
            );
        }
        return errorContent;
    }

    // Show loading state if resolution is loading or form is loading
    const isActuallyLoading = isLoading || (numericFeatureId && resolution.isLoading && !resolution.state);

    if (isActuallyLoading && !formData) {
        const loadingContent = <div className="flex justify-center items-center h-64">Loading...</div>;
        if (mode === 'modal') {
            return (
                <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
                    <Dialog.Backdrop className="fixed inset-0 bg-black bg-opacity-25 z-40" />
                    <Dialog.Portal>
                        <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-2">
                            <div className="w-full max-w-4xl max-h-[90vh] transform rounded-2xl bg-white dark:bg-gray-800 flex flex-col shadow-xl">
                                {loadingContent}
                            </div>
                        </Dialog.Popup>
                    </Dialog.Portal>
                </Dialog.Root>
            );
        }
        return loadingContent;
    }

    if (error && !formData) {
        const errorContent = (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Close
                </button>
            </div>
        );
        if (mode === 'modal') {
            return (
                <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
                    <Dialog.Backdrop className="fixed inset-0 bg-black bg-opacity-25 z-40" />
                    <Dialog.Portal>
                        <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-2">
                            <div className="w-full max-w-4xl max-h-[90vh] transform rounded-2xl bg-white dark:bg-gray-800 flex flex-col shadow-xl">
                                {errorContent}
                            </div>
                        </Dialog.Popup>
                    </Dialog.Portal>
                </Dialog.Root>
            );
        }
        return errorContent;
    }

    if (!formData) {
        return <div>No feature data available</div>;
    }

    // Entity type configuration for unified rendering
    const entityConfig: EntityTypeConfig = {
        key: EntityType.Bonus,
        label: 'Entities',
        formComponent: EntityDetailForm,
        addFunction: addEntity,
        removeFunction: removeEntity,
        hasFeature: (formData.entities || []).length > 0
    };

    const formContent = (
        <>
            {showHeader && mode !== 'modal' && (
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">
                        {featureId === 'new' || typeof featureId === 'string' ? 'Create New Feature' : 'Edit Feature'}
                    </h1>
                </div>
            )}

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
                onSubmit={handleSubmit}
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
                            <button
                                type="button"
                                onClick={() => setActiveTab('basic')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'basic'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                Basic Info
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('entities')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'entities'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                Entities
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('prerequisites')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'prerequisites'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                Prerequisites
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {/* Tab 1: Basic Info */}
                        {activeTab === 'basic' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2 w-full">
                                        <ValidatedInput
                                            field="name"
                                            label="Feature Name"
                                            type="text"
                                            componentExtraClassName="flex items-center gap-2"
                                            labelExtraClassName="w-30"
                                            inputExtraClassName="w-auto"
                                            required
                                            placeholder="Enter feature name"
                                            data-1p-ignore="true"
                                        />

                                        <ValidatedInput
                                            field="slug"
                                            label="Feature Slug"
                                            type="text"
                                            componentExtraClassName="flex items-center gap-2"
                                            labelExtraClassName="w-30"
                                            inputExtraClassName="w-auto"
                                            required
                                            placeholder="Enter feature slug (URL-friendly identifier)"
                                            disabled={featureId !== 'new' && typeof featureId === 'number'}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <ValidatedInput
                                        field="description"
                                        label="Description"
                                        type="textarea"
                                        labelExtraClassName="mb-2"
                                        inputExtraClassName="w-full"
                                        placeholder="Enter feature description (supports markdown)"
                                        rows={8}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <ValidatedInput
                                        field="summary"
                                        label="Summary (for PDF character sheets)"
                                        type="textarea"
                                        labelExtraClassName="mb-2"
                                        inputExtraClassName="w-full"
                                        placeholder="Enter brief summary for character sheets (plain text, no markdown). Can contain template placeholders like {{feature.wild-shape.entities.uses.formattedValue}}"
                                        rows={4}
                                    />
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        This summary will be displayed on PDF character sheets. Keep it concise and avoid markdown formatting. You can use template placeholders like {`{{feature.wild-shape.entities.uses.formattedValue}}`} for dynamic content.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <ValidatedCustomCheckbox
                                        field="displayInCharacterSheet"
                                        label="Display in Character Sheet"
                                        componentExtraClassName="flex items-center gap-2"
                                    />
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        When unchecked, this feature will be hidden from PDF character sheet output. Useful for features like "ex-clerics" that should not appear on character sheets.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Tab 2: Entities */}
                        {activeTab === 'entities' && (
                            <div className="space-y-6">
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
                                    {showSourceTypeSelector && (
                                        <ValidatedCustomSelect
                                            field="sourceType"
                                            label="Source Type"
                                            required
                                            options={FEATURE_SOURCE_LIST}
                                            placeholder="Select source type"
                                            componentExtraClassName="flex items-center gap-2"
                                        />
                                    )}
                                </div>

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

                                    {(formData.entities || []).length === 0 ? (
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
                                                preSelectedFeature={formData ? {
                                                    id: formData.id,
                                                    name: formData.name,
                                                    description: formData.description,
                                                    slug: formData.slug,
                                                    displayInCharacterSheet: formData.displayInCharacterSheet,
                                                    sourceType: FeatureSourceType.Template,
                                                    level: 1
                                                } : undefined}
                                                feature={formData}
                                                editionId={editionId}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tab 3: Prerequisites */}
                        {activeTab === 'prerequisites' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h2 className="text-xl font-semibold">Prerequisites</h2>
                                    <button
                                        type="button"
                                        onClick={addPrerequisite}
                                        className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 text-white"
                                    >
                                        Add Prerequisite
                                    </button>
                                </div>
                                {formData.prerequisites && formData.prerequisites.length > 0 ? (
                                    <div className="space-y-4 border p-4 rounded-md dark:border-gray-600">
                                        {formData.prerequisites.map((prerequisite, index) => (
                                            <div key={index} className="relative p-4 border rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                                                <button
                                                    type="button"
                                                    onClick={() => removePrerequisite(index)}
                                                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600"
                                                    aria-label="Remove prerequisite"
                                                >
                                                    ✕
                                                </button>
                                                <PrerequisiteDetailForm index={index} />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-gray-500 dark:text-gray-400 italic p-4 border rounded-md dark:border-gray-600">
                                        No prerequisites added. Click "Add Prerequisite" to add one.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end space-x-4 mt-8">
                    <button
                        type="button"
                        onClick={handleCancel}
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
                        {isLoading ? 'Saving...' : (featureId === 'new' || typeof featureId === 'string' ? 'Create Feature' : 'Update Feature')}
                    </button>
                </div>
            </ValidatedForm>
        </>
    );

    if (mode === 'modal') {
        return (
            <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
                <Dialog.Backdrop className="fixed inset-0 bg-black bg-opacity-25 z-40" />
                <Dialog.Portal>
                    <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-2">
                        <div className="w-full max-w-4xl h-[90vh] transform rounded-2xl bg-white dark:bg-gray-800 flex flex-col shadow-xl">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
                                <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    {featureId === 'new' || typeof featureId === 'string' ? 'Create New Feature' : 'Edit Feature'}
                                </Dialog.Title>
                            </div>
                            <ScrollArea.Root className="flex-1 overflow-hidden min-h-0">
                                <ScrollArea.Viewport className="h-full">
                                    <ScrollArea.Content>
                                        <div className="p-6">
                                            {formContent}
                                        </div>
                                    </ScrollArea.Content>
                                </ScrollArea.Viewport>
                                <ScrollArea.Scrollbar orientation="vertical" className="Scrollbar">
                                    <ScrollArea.Thumb className="Thumb" />
                                </ScrollArea.Scrollbar>
                            </ScrollArea.Root>
                        </div>
                    </Dialog.Popup>
                </Dialog.Portal>
            </Dialog.Root>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            {formContent}
        </div>
    );
}

function PrerequisiteDetailForm({ index }: PrerequisiteDetailFormProps) {
    const { formData } = useFormContext();
    const prerequisites = formData.prerequisites as FeaturePrerequisite[] || [];
    const prerequisite = prerequisites[index] || { type: undefined };

    const { getSkillSelectFull } = useCacheFunctions();

    const { data: featsResponse } = FeatQueryHooks.useGetFeats({});
    const featOptions = featsResponse?.results || [];

    const { data: classesCacheData } = CacheQueryHooks.useClassesCache();
    const classOptions = classesCacheData?.results || [];

    const showMinValue = prerequisite.type !== FeaturePrerequisiteType.Feat && prerequisite.type !== FeaturePrerequisiteType.Proficiency;

    return (
        <div className="space-y-4">
            <div>
                <ValidatedCustomSelect
                    field={`prerequisites.${index}.type`}
                    label="Prerequisite Type"
                    required
                    options={FEATURE_PRE_REQ_LIST}
                    placeholder="Select prerequisite type"
                    componentExtraClassName="flex items-center gap-2"
                    nested
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                {prerequisite.type === FeaturePrerequisiteType.SkillRanks && (
                    <div>
                        <ValidatedCustomSelect
                            field={`prerequisites.${index}.appliesToId`}
                            label="Skill"
                            required
                            options={getSkillSelectFull()}
                            placeholder="Select skill"
                            componentExtraClassName="flex items-center gap-2"
                            nested
                        />
                    </div>
                )}

                {prerequisite.type === FeaturePrerequisiteType.AbilityScore && (
                    <div>
                        <ValidatedCustomSelect
                            field={`prerequisites.${index}.appliesToId`}
                            label="Ability Score"
                            required
                            options={ABILITY_LIST}
                            placeholder="Select ability score"
                            componentExtraClassName="flex items-center gap-2"
                            nested
                        />
                    </div>
                )}

                {prerequisite.type === FeaturePrerequisiteType.Feat && (
                    <div>
                        <ValidatedCustomSelect
                            field={`prerequisites.${index}.appliesToId`}
                            label="Feat"
                            required
                            options={featOptions}
                            placeholder="Select feat"
                            componentExtraClassName="flex items-center gap-2"
                            nested
                        />
                    </div>
                )}

                {prerequisite.type === FeaturePrerequisiteType.ClassLevel && (
                    <div>
                        <ValidatedCustomSelect
                            field={`prerequisites.${index}.appliesToId`}
                            label="Class"
                            required
                            options={classOptions}
                            placeholder="Select class"
                            componentExtraClassName="flex items-center gap-2"
                            nested
                        />
                    </div>
                )}

                {showMinValue && (
                    <div>
                        <ValidatedInput
                            field={`prerequisites.${index}.minValue`}
                            label="Minimum Value"
                            type="number"
                            min={0}
                            required
                            componentExtraClassName="flex items-center gap-2"
                            inputExtraClassName="w-16"
                            nested
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
