import { Dialog } from '@base-ui-components/react/dialog';
import { ScrollArea } from '@base-ui-components/react/scroll-area';
import { useQueryClient } from '@tanstack/react-query';
import { isEqual } from 'lodash';
import React, { useEffect, useState, useRef, useMemo, useCallback, createContext, useContext } from 'react';

import { useAuthAuto } from '@/components/auth';
import {
    ValidatedForm,
    ValidatedInput,
    ValidatedCustomSelect,
    ValidatedCustomCheckbox,
    useValidatedForm,
    useFormContext
} from '@/components/forms';
import { FeatQueryHooks } from '@/features/feat/FeatQueryHooks';
import { useCacheFunctions } from '@/services/cache';
import { CacheQueryHooks } from '@/services/query/CacheQueryHooks';
import { CreateFeatureRequestSchema, UpdateFeatureSchema, FeatureWithRelations, FeaturePrerequisite, Feature, FeatureEntity, GetAllFeatsWithFeatureInfoResponse, CreateFeatureEntityConditionRequest } from '@shared/schema';
import { FEATURE_PRE_REQ_LIST, FeaturePrerequisiteType, FeatureSourceType, ABILITY_LIST, FEATURE_SOURCE_LIST, EntityType } from '@shared/static-data';

import { useFeatureResolution } from '../useFeatureResolution';
import type { FeatureEditFormProps, PrerequisiteDetailFormProps } from './types';
import { EntityDetailForm } from '../FeatureDetailEdit/EntityDetailForm';
import { EntitySectionRenderer } from '../FeatureDetailEdit/EntitySectionRenderer';
import type { EntityTypeConfig } from '../FeatureDetailEdit/types';
import { useEntityManagement } from '../FeatureDetailEdit/useEntityManagement';
import { useGroupingState } from '../FeatureDetailEdit/useGroupingState';
import { FeatureQueryHooks } from '../FeatureQueryHooks';

// Context for syncing nested fields to state
interface FeatureEditSyncContextType {
    syncNestedFieldToState: (fieldPath: string, value: unknown) => Promise<void>;
}

const FeatureEditSyncContext = createContext<FeatureEditSyncContextType | null>(null);

export function useFeatureEditSync() {
    const context = useContext(FeatureEditSyncContext);
    if (!context) {
        // Return a no-op function if not in FeatureEditForm context
        return { syncNestedFieldToState: async () => { } };
    }
    return context;
}

export function FeatureEditForm({
    featureId = 0,
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
    // Convert string numbers to numbers, use 0 for new features
    // CRITICAL: Only use resolution when isOpen is true and featureId is valid
    // Invalid featureIds (0, negative, null, undefined) should be treated as 0 or null
    const resolutionFeatureId: number | null = useMemo(() => {
        if (!isOpen) {
            // Don't initialize resolution when modal is closed
            return null;
        }

        if (typeof featureId === 'number') {
            // Only allow positive integers, use 0 for new
            return featureId > 0 ? featureId : 0;
        }


        if (typeof featureId === 'string') {
            const parsed = parseInt(featureId, 10);
            // Only allow positive integers, use 0 for new
            return !isNaN(parsed) && parsed > 0 ? parsed : 0;
        }

        // For null, undefined, or any other invalid value, treat as 0 (new)
        return 0;
    }, [featureId, isOpen]);

    // Only call useFeatureResolution when we have a valid featureId and modal is open
    const resolution = useFeatureResolution(resolutionFeatureId);

    // For backwards compatibility, keep numericFeatureId for other uses
    const numericFeatureId = typeof resolutionFeatureId === 'number' ? resolutionFeatureId : null;

    const hasInitializedRef = useRef(false);
    const previousFeatureIdRef = useRef<number | string | null | undefined>(featureId);

    const schema = (featureId === 0 || !featureId) ? CreateFeatureRequestSchema : UpdateFeatureSchema;

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
            // For BOTH new and existing features, state is managed by useFeatureResolution
            // Wait for resolution to load, then sync formData with state from Redis
            // This ensures we load existing state if the page was refreshed
            if (resolution.state) {
                // Update formData whenever resolution.state is available (for this featureId)
                // Only update if we haven't initialized yet for this featureId
                if (!hasInitializedRef.current) {
                    // Apply context overrides if provided (for new features)
                    let stateToUse = resolution.state;
                    if (context && (featureId === 0 || !featureId)) {
                        stateToUse = {
                            ...resolution.state,
                            sourceType: context.sourceType,
                            ...(context.parentType === 'class' && { classes: [{ featureId: 0, classId: context.parentId }] }),
                            ...(context.parentType === 'race' && { races: [{ featureId: 0, raceId: context.parentId }] }),
                            ...(context.parentType === 'domain' && { domainId: context.parentId }),
                            ...(context.parentType === 'feat' && { featId: context.parentId }),
                        };
                    }

                    setFormData(stateToUse);
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

    // Cleanup: Cancel editing when modal closes (for new features)
    // Note: useGenericResolution already handles cleanup on unmount, but we need to handle modal close
    useEffect(() => {
        // Only cleanup for new features when modal closes
        if (mode === 'modal' && !isOpen && resolutionFeatureId === 0 && resolution.state) {
            resolution.cancel().catch((err) => {
                console.error('Error canceling feature editing on modal close:', err);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, isOpen, resolutionFeatureId, resolution.state]);

    /**
     * Transforms formulaParams for state update by ensuring all required fields are present.
     * 
     * The state schema (FeatureFormulaParamsSchema) requires:
     * - id: positive integer (generate temporary if missing)
     * - thresholds: array or null (not undefined)
     * - values: array or null (not undefined)
     * - All other fields as defined in the schema
     */
    const transformFormulaParams = useCallback((formulaParams: typeof formData.entities[0]['formulaParams']) => {
        if (!formulaParams) {
            return null;
        }

        // Generate temporary ID if missing (backend will assign real ID on save)
        const tempId = formulaParams.id && formulaParams.id > 0
            ? formulaParams.id
            : Date.now();

        // Ensure all required nullable fields are null instead of undefined
        return {
            ...formulaParams,
            id: tempId,
            thresholds: formulaParams.thresholds ?? null,
            values: formulaParams.values ?? null,
        };

        // formData is only used for type inference, not runtime dependency
    }, []);

    // Track previous formData to detect changes and sync to Redis state
    const previousFormDataRef = useRef<FeatureWithRelations | null>(null);
    const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isSyncingRef = useRef(false);
    const isUpdatingFormDataRef = useRef(false); // Flag to prevent blur handlers during formData updates
    const isSyncingNestedFieldRef = useRef(false); // Flag to prevent bulk sync when syncing nested fields

    // Refs for text input fields to add onBlur handlers
    const nameInputRef = useRef<HTMLInputElement>(null);
    const slugInputRef = useRef<HTMLInputElement>(null);
    const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
    const summaryInputRef = useRef<HTMLTextAreaElement>(null);
    const levelInputRef = useRef<HTMLInputElement>(null);

    /**
     * Syncs a single field to Redis state on blur.
     * This is called when a text input field loses focus.
     */
    /**
     * Syncs a nested field (e.g., entities.0.type or entities.0.formulaParams.formulaId) to state.
     * Uses the new path-based updateValue system - much simpler!
     */
    const syncNestedFieldToState = useCallback(async (fieldPath: string, value: unknown) => {
        if (!isOpen || !resolutionFeatureId || !hasInitializedRef.current || isSyncingRef.current) {
            return;
        }

        // For new features, ensure state exists before syncing
        if (resolutionFeatureId === 0 && !resolution.state) {
            return;
        }

        // Skip syncing appliesTo if it's null (was cleared due to type incompatibility)
        const pathParts = fieldPath.split('.');
        if (pathParts.length >= 3 && pathParts[pathParts.length - 1] === 'appliesTo' && value === null) {
            return; // Don't sync null appliesTo - user will select a new value later
        }

        if (isSyncingRef.current) {
            return;
        }

        isSyncingRef.current = true;
        isSyncingNestedFieldRef.current = true; // Set flag to prevent bulk sync
        try {
            console.log(`[FeatureEditForm] Syncing nested field ${fieldPath} to state`);
            await resolution.updateValue(fieldPath, value);
            // Update previousFormDataRef to match current formData to prevent bulk sync from triggering
            // This is needed because setFormData was called before syncNestedFieldToState,
            // which will trigger the useEffect, but we don't want the bulk sync to run
            previousFormDataRef.current = formData;
        } catch (error) {
            console.error(`[FeatureEditForm] Error syncing nested field ${fieldPath} to state:`, error);
        } finally {
            isSyncingRef.current = false;
            // Clear the flag after a short delay to allow React to process the state update
            setTimeout(() => {
                isSyncingNestedFieldRef.current = false;
            }, 100);
        }
    }, [isOpen, resolutionFeatureId, hasInitializedRef, resolution, formData]);

    /**
     * Syncs a single top-level field to Redis state on blur.
     * Uses the new path-based updateValue system.
     */
    const syncFieldToState = useCallback(async (field: string, value: unknown) => {
        if (!isOpen || !resolutionFeatureId || !hasInitializedRef.current || isSyncingRef.current) {
            return;
        }

        // For new features, ensure state exists before syncing
        if (resolutionFeatureId === 0 && !resolution.state) {
            return;
        }

        // Skip if value hasn't changed from current state
        const currentState = resolution.state;
        if (!currentState) {
            return;
        }

        // Check if the value actually changed
        const currentValue = (currentState as Record<string, unknown>)[field];
        if (currentValue === value) {
            return;
        }

        if (isSyncingRef.current) {
            return;
        }

        isSyncingRef.current = true;
        try {
            console.log(`[FeatureEditForm] Syncing field ${field} to state`);
            await resolution.updateValue(field, value);
        } catch (error) {
            console.error(`[FeatureEditForm] Error syncing field ${field} to state:`, error);
        } finally {
            isSyncingRef.current = false;
        }
    }, [isOpen, resolutionFeatureId, hasInitializedRef, resolution]);

    // Sync formData changes to Redis state in real-time
    useEffect(() => {
        // Don't sync if:
        // - Modal is closed
        // - Resolution not initialized
        // - Still initializing (hasInitializedRef is false)
        // - Currently syncing (to avoid loops)
        // - No resolution state yet (for new features, need to ensure state exists)
        if (!isOpen || !resolutionFeatureId || !hasInitializedRef.current || isSyncingRef.current) {
            return;
        }

        // For new features, ensure state exists before syncing
        // If state doesn't exist yet, we need to start editing first to create the state
        if (resolutionFeatureId === 0 && !resolution.state) {
            // Don't return - allow the sync to proceed, it will create the state if needed
            // The syncEntitiesToState function will handle the case where state doesn't exist
        }

        const previousFormData = previousFormDataRef.current;

        // Skip if this is the initial load (previousFormData is null)
        if (!previousFormData) {
            previousFormDataRef.current = formData;
            return;
        }

        // Skip if we're currently syncing (prevents re-triggering during sync)
        if (isSyncingRef.current) {
            return;
        }

        // Skip bulk sync if we're currently syncing a nested field
        // Nested field updates (via syncNestedFieldToState) handle their own syncing,
        // so we don't need to run the bulk entity sync
        if (isSyncingNestedFieldRef.current) {
            // Still update previousFormDataRef to prevent false positives on next run
            previousFormDataRef.current = formData;
            return;
        }

        // Skip if formData hasn't actually changed
        // Compare entities and prerequisites separately to avoid false positives from object references
        const entitiesChanged = !isEqual(formData.entities || [], previousFormData.entities || []);
        const prerequisitesChanged = !isEqual(formData.prerequisites || [], previousFormData.prerequisites || []);

        // Only proceed if entities or prerequisites actually changed
        if (!entitiesChanged && !prerequisitesChanged) {
            return;
        }

        // Sync function for entity changes (immediate, no debounce)
        const syncEntitiesToState = async () => {
            if (isSyncingRef.current) {
                return;
            }

            isSyncingRef.current = true;
            let finalUpdatedState: FeatureWithRelations | null = null;
            const justAddedEntityIds = new Set<number>(); // Track entities just added in this sync
            try {
                let currentState = resolution.state;
                // For new features, ensure state exists before syncing
                // If state doesn't exist, we need to refresh to get it (startEditing should have created it)
                if (!currentState && resolutionFeatureId === 0) {
                    console.log('[FeatureEditForm] State not found for new feature, refreshing state');
                    // Refresh state - startEditing should have created it
                    await resolution.refreshState();
                    // Try to get state again after refresh
                    currentState = resolution.state;
                    if (!currentState) {
                        console.warn('[FeatureEditForm] Cannot sync entities: resolution.state is still null after refresh - state may not have been initialized');
                        previousFormDataRef.current = formData;
                        return;
                    }
                } else if (!currentState) {
                    console.warn('[FeatureEditForm] Cannot sync entities: resolution.state is null');
                    previousFormDataRef.current = formData;
                    return;
                }

                // Use a map to track entity IDs by their identifying properties (type, appliesTo, appliesToId)
                // This helps us match entities even when IDs change (e.g., after adding)
                const getEntityKey = (e: FeatureEntity) =>
                    `${e.type}-${e.appliesTo}-${e.appliesToId ?? 'null'}`;

                // Ensure currentState has entities array (may be empty for new features)
                const currentEntities: FeatureEntity[] = currentState.entities || [];
                const currentEntityIds = new Set(currentEntities.map(e => e.id));

                // Build maps for entity matching
                const currentEntityMap = new Map<string, FeatureEntity>(
                    currentEntities.map(e => [getEntityKey(e), e])
                );
                const formEntities: FeatureEntity[] = formData.entities || [];
                const formEntityMap = new Map<string, FeatureEntity>(
                    formEntities.map(e => [getEntityKey(e), e])
                );

                // Remove entities that are no longer in formData (by key, not just ID)
                // This prevents removing entities that were just added but have different IDs
                let updatedState = currentState;
                for (const [key, currentEntity] of currentEntityMap) {
                    if (!formEntityMap.has(key)) {
                        console.log(`[FeatureEditForm] Syncing entity removal: ${currentEntity.id} (key: ${key})`);
                        // Get current entities array and filter out the entity to remove
                        const currentEntities = (updatedState?.entities || []) as Array<Record<string, unknown>>;
                        const filteredEntities = currentEntities.filter(e => e.id !== currentEntity.id);
                        // Set the filtered array using path-based update
                        // updateValue() already calls refreshState() internally, so we don't need to call it again
                        await resolution.updateValue('entities', filteredEntities);

                        // CRITICAL FIX: Update previousFormDataRef AFTER updateValue to prevent infinite loop
                        // updateValue() internally calls refreshState(), which updates resolution.state.
                        // We need to update previousFormDataRef AFTER the state is updated so it matches
                        // the current formData (with the entity removed).
                        previousFormDataRef.current = {
                            ...formData,
                            entities: (formData.entities || []).filter(e => e.id !== currentEntity.id)
                        };
                        // State is refreshed by updateValue(), but React state updates are async, so we need to wait a bit
                        // or use the state directly. Since updateValue awaits refreshState, the state should be updated.
                        // However, React's setState is async, so we might need to get the state after a microtask.
                        await new Promise(resolve => setTimeout(resolve, 0)); // Allow React to process state update
                        updatedState = resolution.state;
                        if (!updatedState) {
                            console.warn('[FeatureEditForm] State is null after entity removal');
                            break;
                        }
                        // Refresh maps after removal
                        currentEntityMap.clear();
                        (updatedState.entities || []).forEach(e => currentEntityMap.set(getEntityKey(e), e));
                        currentEntityIds.clear();
                        (updatedState.entities || []).forEach(e => currentEntityIds.add(e.id));
                    }
                }

                // Add/update entities
                for (const entity of formData.entities || []) {
                    const entityId = entity.id;
                    const isNewEntity = !entityId || entityId === 0 || !currentEntityIds.has(entityId);

                    if (isNewEntity) {
                        console.log(`[FeatureEditForm] Syncing entity addition: type ${entity.type}, appliesTo ${entity.appliesTo}`);
                        // Create new entity - keep id as 0 (will be assigned by backend on save)
                        // Do NOT assign temporary IDs - they should stay as 0 until saved to database
                        const entityPayload = {
                            id: 0,
                            featureId: currentState?.id || 0,
                            type: entity.type,
                            appliesTo: entity.appliesTo,
                            appliesToId: entity.appliesToId,
                            appliesToSubId: entity.appliesToSubId,
                            value: entity.value,
                            bonusType: entity.bonusType,
                            formulaParams: transformFormulaParams(entity.formulaParams),
                            groupingId: entity.groupingId || 0,
                            displayInDetail: entity.displayInDetail || false,
                            filterType: entity.filterType,
                            conditions: (entity.conditions?.map(condition => {
                                const { id: _, featureEntityId: __, ...conditionData } = condition;
                                return conditionData;
                            }) ?? []) as CreateFeatureEntityConditionRequest[],
                        };
                        // Get current entities array and append new entity
                        // For new features, updatedState might be null initially, so use currentState
                        const stateToUse = updatedState || currentState;
                        const currentEntitiesArray = (stateToUse?.entities || []) as Array<Record<string, unknown>>;
                        const updatedEntities = [...currentEntitiesArray, entityPayload];
                        // Set the updated array using path-based update

                        // updateValue() already calls refreshState() internally, so we don't need to call it again
                        await resolution.updateValue('entities', updatedEntities);

                        // CRITICAL FIX: Update previousFormDataRef AFTER updateValue to prevent infinite loop
                        // updateValue() internally calls refreshState(), which updates resolution.state.
                        // We need to update previousFormDataRef AFTER the state is updated so it matches
                        // the current formData (which still has id: 0 for the new entity).
                        // The entity ID should remain 0 until saved to the database.
                        previousFormDataRef.current = {
                            ...formData,
                            entities: formData.entities || []
                        };
                        // State is refreshed by updateValue(), but React state updates are async, so we need to wait a bit
                        // or use the state directly. Since updateValue awaits refreshState, the state should be updated.
                        // However, React's setState is async, so we might need to get the state after a microtask.
                        await new Promise(resolve => setTimeout(resolve, 0)); // Allow React to process state update
                        updatedState = resolution.state;
                        if (!updatedState) {
                            console.warn('[FeatureEditForm] State is null after entity addition - this should not happen');
                            // Still update previousFormDataRef to prevent re-syncing
                            previousFormDataRef.current = formData;
                            break;
                        }
                        // Update currentEntityIds after adding
                        currentEntityIds.clear();
                        (updatedState.entities || []).forEach(e => currentEntityIds.add(e.id));

                        // Entity IDs should remain 0 until saved to database
                        // No need to update formData with new IDs - they stay as 0
                        finalUpdatedState = updatedState;
                    }
                    // Note: Entity field updates are handled individually on blur, not via bulk comparison
                    // This prevents infinite loops from comparing entire entity objects
                }

                // Update previousFormDataRef after successful sync (only if not already updated above)
                // Use updatedState entities (with temporary IDs) instead of formData to prevent re-syncing
                // Only update if we have a finalUpdatedState and it's different from what we already set
                if (finalUpdatedState) {
                    // Merge formData with the updated entities from backend to create the "expected" state
                    // This represents what formData should be after syncing
                    // Use the current formData (which may have been updated with new IDs) merged with backend entities
                    const currentFormData = formDataRef.current; // Use ref to get latest formData
                    const expectedFormData = {
                        ...currentFormData,
                        entities: finalUpdatedState.entities || currentFormData.entities
                    };
                    // Update previousFormDataRef with the expected state
                    previousFormDataRef.current = expectedFormData;
                } else {
                    // If no sync happened, just update with current formData to prevent false positives
                    previousFormDataRef.current = formData;
                }
            } catch (error) {
                console.error('[FeatureEditForm] Error syncing entity changes to state:', error);
                // Don't update previousFormDataRef on error so we can retry
            } finally {
                isSyncingRef.current = false;
            }
        };

        // Sync function for prerequisite changes (immediate, no debounce)
        const syncPrerequisitesToState = async () => {
            if (isSyncingRef.current) {
                return;
            }

            isSyncingRef.current = true;
            try {
                const currentState = resolution.state;
                if (!currentState) {
                    console.warn('[FeatureEditForm] Cannot sync prerequisites: resolution.state is null');
                    previousFormDataRef.current = formData;
                    return;
                }

                const currentPrereqIds = new Set<number>((currentState.prerequisites || []).map(p => p.id));
                const formPrereqIds = new Set<number>((formData.prerequisites || []).map(p => p.id));

                // Remove prerequisites that are no longer in formData
                let currentStateForPrereqs = currentState;
                for (const prereqId of currentPrereqIds) {
                    if (!formPrereqIds.has(prereqId)) {
                        console.log(`[FeatureEditForm] Syncing prerequisite removal: ${prereqId}`);
                        // Get current prerequisites array and filter out the prerequisite to remove
                        const currentPrereqs = (currentStateForPrereqs?.prerequisites || []) as Array<Record<string, unknown>>;
                        const filteredPrereqs = currentPrereqs.filter(p => p.id !== prereqId);
                        // Set the filtered array using path-based update
                        await resolution.updateValue('prerequisites', filteredPrereqs);
                        // Refresh state to get updated prerequisites
                        await resolution.refreshState();
                        currentStateForPrereqs = resolution.state;
                        if (!currentStateForPrereqs) {
                            console.warn('[FeatureEditForm] State is null after prerequisite removal');
                            break;
                        }
                    }
                }

                // Add/update prerequisites
                for (const prereq of formData.prerequisites || []) {
                    if (!currentPrereqIds.has(prereq.id)) {
                        // New prerequisite
                        console.log(`[FeatureEditForm] Syncing prerequisite addition: type ${prereq.type}`);
                        // Create new prerequisite with temporary ID (will be replaced by backend on save)
                        const tempId = Date.now();
                        const prereqPayload = {
                            id: tempId,
                            featureId: currentStateForPrereqs?.id || 0,
                            type: prereq.type,
                            appliesToId: prereq.appliesToId,
                            minValue: prereq.minValue,
                        };
                        // Get current prerequisites array and append new prerequisite
                        const currentPrereqs = (currentStateForPrereqs?.prerequisites || []) as Array<Record<string, unknown>>;
                        const updatedPrereqs = [...currentPrereqs, prereqPayload];
                        // Set the updated array using path-based update
                        await resolution.updateValue('prerequisites', updatedPrereqs);
                        // Refresh state to get updated prerequisites
                        await resolution.refreshState();
                        currentStateForPrereqs = resolution.state;
                        if (!currentStateForPrereqs) {
                            console.warn('[FeatureEditForm] State is null after prerequisite addition');
                            break;
                        }
                    }
                    // Note: Prerequisite field updates are handled individually on blur, not via bulk comparison
                    // This prevents infinite loops from comparing entire prerequisite objects
                }

                // Update previousFormDataRef after successful sync
                previousFormDataRef.current = formData;
            } catch (error) {
                console.error('[FeatureEditForm] Error syncing prerequisite changes to state:', error);
                // Don't update previousFormDataRef on error so we can retry
            } finally {
                isSyncingRef.current = false;
            }
        };

        // Handle different types of changes
        if (entitiesChanged) {
            // Sync entity changes immediately (no debounce)
            syncEntitiesToState();
        } else if (prerequisitesChanged) {
            // Sync prerequisite changes immediately (no debounce)
            syncPrerequisitesToState();
        } else {
            // No changes detected, update ref
            // Note: Field changes are synced on blur, not here
            previousFormDataRef.current = formData;
        }

        // Cleanup timeout on unmount
        return () => {
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }
        };
        // CRITICAL FIX: Remove resolution.state from dependency array to prevent infinite loop
        // resolution.state changes when we call updateValue() (which calls refreshState()),
        // but we don't want that to trigger the sync again. We only want to sync when formData changes.
        // We still check resolution.state inside the effect for the initial load check.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData, isOpen, resolutionFeatureId, transformFormulaParams]);

    // Sync select/checkbox fields immediately on change (no typing issue, so no need to wait for blur)
    useEffect(() => {
        if (!isOpen || !resolutionFeatureId || !hasInitializedRef.current || isSyncingRef.current) {
            return;
        }

        if (resolutionFeatureId === 0 && !resolution.state) {
            return;
        }

        const currentState = resolution.state;
        if (!currentState) {
            return;
        }

        // Fields that should sync immediately on change (selects, checkboxes, etc.)
        const immediateSyncFields: Array<{ field: string; value: unknown }> = [];

        if (formData.sourceType !== currentState.sourceType) {
            immediateSyncFields.push({ field: 'sourceType', value: formData.sourceType });
        }
        if (formData.displayInCharacterSheet !== currentState.displayInCharacterSheet) {
            immediateSyncFields.push({ field: 'displayInCharacterSheet', value: formData.displayInCharacterSheet });
        }
        if (formData.domainId !== currentState.domainId) {
            immediateSyncFields.push({ field: 'domainId', value: formData.domainId });
        }
        if (formData.featId !== currentState.featId) {
            immediateSyncFields.push({ field: 'featId', value: formData.featId });
        }
        if (formData.companionId !== currentState.companionId) {
            immediateSyncFields.push({ field: 'companionId', value: formData.companionId });
        }
        if (formData.editionId !== currentState.editionId) {
            immediateSyncFields.push({ field: 'editionId', value: formData.editionId });
        }

        if (immediateSyncFields.length > 0) {
            (async () => {
                if (isSyncingRef.current) {
                    return;
                }

                isSyncingRef.current = true;
                try {
                    for (const fieldUpdate of immediateSyncFields) {
                        console.log(`[FeatureEditForm] Syncing field ${fieldUpdate.field} to state immediately`);
                        await resolution.updateValue(fieldUpdate.field, fieldUpdate.value);
                    }
                } catch (error) {
                    console.error('[FeatureEditForm] Error syncing immediate fields to state:', error);
                } finally {
                    isSyncingRef.current = false;
                }
            })();
        }
    }, [
        formData.sourceType,
        formData.displayInCharacterSheet,
        formData.domainId,
        formData.featId,
        formData.companionId,
        formData.editionId,
        isOpen,
        resolutionFeatureId,
        hasInitializedRef,
        resolution.state,
        resolution
    ]);

    // Add onBlur handlers to text input fields
    // Use a ref to access current formData in handlers without causing re-renders
    const formDataRef = useRef(formData);
    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);

    useEffect(() => {
        // Generic blur handler factory
        const createBlurHandler = (field: string, inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>) => {
            return (e: FocusEvent) => {
                console.log(`[FeatureEditForm] Blur handler fired for field: ${field}`, {
                    isUpdatingFormData: isUpdatingFormDataRef.current,
                    relatedTarget: e.relatedTarget,
                    currentField: inputRef.current
                });

                // Skip if we're currently updating formData (prevents blur during re-renders)
                if (isUpdatingFormDataRef.current) {
                    console.log(`[FeatureEditForm] Skipping sync for ${field}: isUpdatingFormData is true`);
                    return;
                }

                // Always sync on blur, regardless of where focus is moving
                // This ensures Redis state stays in sync as the user edits
                const currentFormData = formDataRef.current;
                const fieldValue = currentFormData[field as keyof FeatureWithRelations];
                console.log(`[FeatureEditForm] Calling syncFieldToState for ${field} with value:`, fieldValue);
                form.validation.validateField(field, fieldValue, currentFormData);
                syncFieldToState(field, fieldValue);
            };
        };

        const handleNameBlur = createBlurHandler('name', nameInputRef);
        const handleSlugBlur = createBlurHandler('slug', slugInputRef);
        const handleDescriptionBlur = createBlurHandler('description', descriptionInputRef);
        const handleSummaryBlur = createBlurHandler('summary', summaryInputRef);
        const handleLevelBlur = createBlurHandler('level', levelInputRef);

        // Get refs - they may not be populated immediately, so we check them
        const nameInput = nameInputRef.current;
        const slugInput = slugInputRef.current;
        const descriptionInput = descriptionInputRef.current;
        const summaryInput = summaryInputRef.current;
        const levelInput = levelInputRef.current;

        // Attach listeners if refs are available
        if (nameInput) {
            nameInput.addEventListener('blur', handleNameBlur);
        }
        if (slugInput) {
            slugInput.addEventListener('blur', handleSlugBlur);
        }
        if (descriptionInput) {
            descriptionInput.addEventListener('blur', handleDescriptionBlur);
        }
        if (summaryInput) {
            summaryInput.addEventListener('blur', handleSummaryBlur);
        }
        if (levelInput) {
            levelInput.addEventListener('blur', handleLevelBlur);
        }

        return () => {
            // Cleanup - use current refs at cleanup time
            const nameInputCleanup = nameInputRef.current;
            const slugInputCleanup = slugInputRef.current;
            const descriptionInputCleanup = descriptionInputRef.current;
            const summaryInputCleanup = summaryInputRef.current;
            const levelInputCleanup = levelInputRef.current;

            if (nameInputCleanup) {
                nameInputCleanup.removeEventListener('blur', handleNameBlur);
            }
            if (slugInputCleanup) {
                slugInputCleanup.removeEventListener('blur', handleSlugBlur);
            }
            if (descriptionInputCleanup) {
                descriptionInputCleanup.removeEventListener('blur', handleDescriptionBlur);
            }
            if (summaryInputCleanup) {
                summaryInputCleanup.removeEventListener('blur', handleSummaryBlur);
            }
            if (levelInputCleanup) {
                levelInputCleanup.removeEventListener('blur', handleLevelBlur);
            }
        };
    }, [form, syncFieldToState, isOpen, hasInitializedRef]); // Add isOpen and hasInitializedRef so effect re-runs when form opens/initializes

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

            if (featureId === 0 || !featureId) {
                // For new features, state should already be up-to-date from real-time sync
                if (!resolution.state) {
                    throw new Error('Feature state not loaded');
                }

                // Save state to database (creates feature and returns new featureId)
                // State should already be up-to-date from real-time sync, so we just persist it
                console.log(`[FeatureEditForm] Saving feature state to database`);
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

                if (onSave) {
                    onSave(newFeatureId);
                }

                if (mode === 'modal' && onClose) {
                    setTimeout(() => {
                        onClose();
                    }, 500);
                }
            } else if (numericFeatureId && resolution.state) {
                // For existing features, state should already be up-to-date from real-time sync
                if (!resolution.state) {
                    throw new Error('Feature state not loaded');
                }

                // Save state to database (returns featureId)
                // State should already be up-to-date from real-time sync, so we just persist it
                console.log(`[FeatureEditForm] Saving feature state to database`);
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

                // Note: State is deleted after save, so we don't refresh it here.
                // The feature query cache invalidation above will refresh the UI from the database.
                if (onSave) {
                    onSave(savedFeatureId);
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
            // Check if this is a validation error with field paths
            if (err instanceof Error && 'validationErrors' in err) {
                const validationErrors = (err as { validationErrors?: Array<{ path: string; message: string; code: string }> }).validationErrors;
                if (validationErrors && Array.isArray(validationErrors)) {
                    // Format validation errors for display
                    const errorMessages = validationErrors.map(err => `${err.path}: ${err.message}`).join(', ');
                    setError(`Validation errors: ${errorMessages}`);
                    // TODO: Highlight invalid form fields using error paths
                    console.error('Validation errors saving feature:', validationErrors);
                } else {
                    setError(err.message || 'Failed to save feature');
                }
            } else {
                setError(err instanceof Error ? err.message : 'Failed to save feature');
            }
            console.error('Error saving feature:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = async () => {
        // Cancel feature editing if active (for both existing and new features)
        if (resolutionFeatureId && resolution.state) {
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
                        {(featureId === 0 || !featureId) ? 'Create New Feature' : 'Edit Feature'}
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

            <FeatureEditSyncContext.Provider value={{ syncNestedFieldToState }}>
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
                                                ref={nameInputRef}
                                                field="name"
                                                label="Feature Name"
                                                type="text"
                                                componentExtraClassName="flex items-center gap-2"
                                                labelExtraClassName="w-30"
                                                inputExtraClassName="w-auto"
                                                required
                                                placeholder="Enter feature name"
                                            />

                                            <ValidatedInput
                                                ref={slugInputRef}
                                                field="slug"
                                                label="Feature Slug"
                                                type="text"
                                                componentExtraClassName="flex items-center gap-2"
                                                labelExtraClassName="w-30"
                                                inputExtraClassName="w-auto"
                                                required
                                                placeholder="Enter feature slug (URL-friendly identifier)"
                                                disabled={featureId !== 0 && featureId !== undefined}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <ValidatedInput
                                            ref={descriptionInputRef}
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
                                            ref={summaryInputRef}
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
                                            ref={levelInputRef}
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
                            {isLoading ? 'Saving...' : ((featureId === 0 || !featureId) ? 'Create Feature' : 'Update Feature')}
                        </button>
                    </div>
                </ValidatedForm>
            </FeatureEditSyncContext.Provider>
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
                                    {(featureId === 0 || !featureId) ? 'Create New Feature' : 'Edit Feature'}
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
    const { syncNestedFieldToState } = useFeatureEditSync();
    const prerequisites = formData.prerequisites as FeaturePrerequisite[] || [];
    const prerequisite = prerequisites[index] || { type: undefined };

    const { getSkillSelectFull } = useCacheFunctions();

    const { data: featsResponse } = FeatQueryHooks.useGetFeats();
    const featOptions = (featsResponse as GetAllFeatsWithFeatureInfoResponse | undefined)?.results || [];

    const { data: classesCacheData } = CacheQueryHooks.useClassesCache();
    const classOptions = classesCacheData?.results || [];

    const showMinValue = prerequisite.type !== FeaturePrerequisiteType.Feat && prerequisite.type !== FeaturePrerequisiteType.Proficiency;

    // Add blur handlers for prerequisite fields
    useEffect(() => {
        const fieldPaths = [
            `prerequisites.${index}.type`,
            `prerequisites.${index}.appliesToId`,
            `prerequisites.${index}.minValue`
        ];

        const cleanupFunctions: Array<() => void> = [];

        const createBlurHandler = (fieldPath: string) => {
            return async (e: FocusEvent) => {
                const target = e.target as HTMLInputElement | HTMLSelectElement;
                if (!target) return;

                let value: unknown = target.value;
                if (target.type === 'number') {
                    value = target.value === '' ? null : Number(target.value);
                }

                await syncNestedFieldToState(fieldPath, value);
            };
        };

        // Attach blur handlers to number inputs
        const numberFields = [`prerequisites.${index}.minValue`];
        numberFields.forEach(fieldPath => {
            const element = document.querySelector(`input[name="${fieldPath}"]`) as HTMLInputElement | null;
            if (element) {
                const handler = createBlurHandler(fieldPath);
                element.addEventListener('blur', handler);
                cleanupFunctions.push(() => element.removeEventListener('blur', handler));
            }
        });

        return () => {
            cleanupFunctions.forEach(cleanup => cleanup());
        };
    }, [index, syncNestedFieldToState]);

    // Watch formData changes for select fields (ValidatedCustomSelect uses buttons, no blur events)
    const prevPrereqRef = useRef<FeaturePrerequisite | { type: undefined }>(prerequisite);
    useEffect(() => {
        if (!prevPrereqRef.current) {
            prevPrereqRef.current = prerequisite;
            return;
        }

        const prev = prevPrereqRef.current;

        // Sync individual fields when they change
        if (prev.type !== prerequisite.type) {
            syncNestedFieldToState(`prerequisites.${index}.type`, prerequisite.type);
        }
        const prevAppliesToId = 'appliesToId' in prev ? prev.appliesToId : undefined;
        const currentAppliesToId = 'appliesToId' in prerequisite ? prerequisite.appliesToId : undefined;
        if (prevAppliesToId !== currentAppliesToId) {
            syncNestedFieldToState(`prerequisites.${index}.appliesToId`, currentAppliesToId);
        }

        prevPrereqRef.current = prerequisite;
    }, [prerequisite, index, syncNestedFieldToState]);

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
