import {
    DocumentTextIcon,
    UserIcon,
    AcademicCapIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import { useQueryClient } from '@tanstack/react-query';
import { isEqual } from 'lodash';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import { FeatureProgressionDetailEdit } from '@/components/feature-system';
import { FeatureSystemApi } from '@/components/feature-system/FeatureSystemApi';
import {
    ValidatedForm,
    useValidatedForm
} from '@/components/forms';
import { RaceQueryHooks } from '@/services/query/RaceQueryHooks';
import { UpdateRaceSchema, BaseRaceSchema, FeatureProgression, CreateRaceRequest, type RaceEditState } from '@shared/schema';
import type { SourceMap } from '@shared/schema';
import { EntityAppliesToType, SpecialFeatureId, EntityType, FeatureSourceType, RaceUpdateType } from '@shared/static-data';

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
import { RaceEditStateUpdateType, type RaceEditStateUpdate } from './types';
import { useRaceEditState } from './useRaceEditState';
import { useRaceResolution } from './useRaceResolution';

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
    const queryClient = useQueryClient();

    // Use centralized state management
    const raceId = id !== 'new' ? parseInt(id) : null;
    const resolution = useRaceResolution(raceId);
    const { state, updateState } = useRaceEditState();

    // UI-only state (not part of race edit state)
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [_race, setRace] = useState<RaceFormData | null>(null);
    const fromListParams = location.state?.fromListParams || '';

    // Combine loading states
    const isLoading = resolution.isLoading || isSaving;

    // Determine which schema to use based on whether we're creating or editing
    const schema = id === 'new' ? BaseRaceSchema : UpdateRaceSchema;

    // Tab configuration - use state instead of local activeTab
    const tabs: TabConfig[] = [
        { id: 'basic', label: 'Basic Info', icon: DocumentTextIcon, component: BasicInfoTab },
        { id: 'abilities', label: 'Abilities', icon: UserIcon, component: AbilitiesTab },
        { id: 'languages', label: 'Languages', icon: AcademicCapIcon, component: LanguagesTab },
        { id: 'features', label: 'Features', icon: SparklesIcon, component: FeaturesTab },
        { id: 'description', label: 'Description', icon: DocumentTextIcon, component: DescriptionTab }
    ];

    const CurrentTabComponent = tabs.find(tab => tab.id === state.activeTab)?.component;

    // Derive formData from state (single source of truth)
    // This is used for form validation only - tabs should use state directly
    const formData = useMemo((): RaceFormData => ({
        name: state.name,
        editionId: state.editionId,
        isVisible: state.isVisible,
        description: state.description,
        sourceBookInfo: state.sourceBookInfo,
        features: state.featureProgressions.length > 0 ? state.featureProgressions : null,
        ...(id !== 'new' && state.raceId ? { id: state.raceId } : {})
    }), [state, id]);

    // Wrapper for setFormData that updates state instead
    // This allows form validation to work while tabs use state directly
    const setFormData = useCallback((data: RaceFormData | ((prev: RaceFormData) => RaceFormData)) => {
        const newData = typeof data === 'function' ? data(formData) : data;

        // Update state via updateState for each field
        if (newData.name !== undefined && newData.name !== state.name) {
            updateState({ type: RaceEditStateUpdateType.SET_NAME, payload: { name: newData.name } });
        }
        if (newData.editionId !== undefined && newData.editionId !== state.editionId) {
            updateState({ type: RaceEditStateUpdateType.SET_EDITION_ID, payload: { editionId: newData.editionId } });
        }
        if (newData.isVisible !== undefined && newData.isVisible !== state.isVisible) {
            updateState({ type: RaceEditStateUpdateType.SET_IS_VISIBLE, payload: { isVisible: newData.isVisible } });
        }
        if (newData.description !== undefined && newData.description !== state.description) {
            updateState({ type: RaceEditStateUpdateType.SET_DESCRIPTION, payload: { description: newData.description } });
        }
        if (newData.sourceBookInfo !== undefined && !isEqual(newData.sourceBookInfo, state.sourceBookInfo)) {
            updateState({ type: RaceEditStateUpdateType.SET_SOURCE_BOOK_INFO, payload: { sourceBookInfo: newData.sourceBookInfo || null } });
        }
    }, [formData, state, updateState]);

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

    // Track previous backend state to detect actual changes
    const prevBackendStateRef = useRef<RaceEditState | null>(null);
    // Track the last state we sent to backend to detect our own updates
    const lastSentStateRef = useRef<Partial<RaceEditState> | null>(null);
    // Track pending update count to know when all updates are complete
    const pendingUpdatesRef = useRef(0);
    // Track the last processed backend state to avoid reprocessing
    const lastProcessedStateRef = useRef<RaceEditState | null>(null);

    // Sync backend session state to frontend state
    useEffect(() => {
        if (!resolution.raceState) {
            return;
        }

        const sessionState = resolution.raceState;

        // Skip if we've already processed this exact state object
        if (lastProcessedStateRef.current === sessionState) {
            return;
        }

        // Only sync if the backend state actually changed (avoid infinite loops)
        if (prevBackendStateRef.current && isEqual(prevBackendStateRef.current, sessionState)) {
            return;
        }

        // Check if this state matches what we just sent to backend (our own update)
        // We check if the fields we sent match the incoming state (allowing for partial matches during multi-field syncs)
        if (lastSentStateRef.current && pendingUpdatesRef.current > 0) {
            const sentState = lastSentStateRef.current;
            // Check if all sent fields match the incoming state
            const allSentFieldsMatch =
                (sentState.name === undefined || sessionState.name === sentState.name) &&
                (sentState.editionId === undefined || sessionState.editionId === sentState.editionId) &&
                (sentState.isVisible === undefined || sessionState.isVisible === sentState.isVisible) &&
                (sentState.description === undefined || sessionState.description === sentState.description) &&
                (sentState.sourceBookInfo === undefined || isEqual(sessionState.sourceBookInfo, sentState.sourceBookInfo));

            if (allSentFieldsMatch) {
                // This matches what we sent, so it's our own update - decrement counter and skip syncing
                pendingUpdatesRef.current = Math.max(0, pendingUpdatesRef.current - 1);
                prevBackendStateRef.current = sessionState;
                prevRaceFieldsRef.current = {
                    name: sessionState.name,
                    editionId: sessionState.editionId,
                    isVisible: sessionState.isVisible,
                    description: sessionState.description,
                    sourceBookInfo: sessionState.sourceBookInfo,
                };
                // Clear ref when all updates are complete
                if (pendingUpdatesRef.current === 0) {
                    lastSentStateRef.current = null;
                    // Clear the processing flag as well
                    isProcessingBackendSyncRef.current = false;
                }
                return;
            }
        }

        // Mark this state as processed
        lastProcessedStateRef.current = sessionState;

        // Set flag to prevent sync-to-backend during this sync
        isProcessingBackendSyncRef.current = true;

        // Update backend state ref FIRST to prevent sync-to-backend from triggering
        prevBackendStateRef.current = sessionState;
        prevRaceFieldsRef.current = {
            name: sessionState.name,
            editionId: sessionState.editionId,
            isVisible: sessionState.isVisible,
            description: sessionState.description,
            sourceBookInfo: sessionState.sourceBookInfo,
        };

        // Batch all state updates to minimize re-renders
        const updates: Array<{ type: RaceEditStateUpdateType; payload: unknown }> = [];

        if (sessionState.raceId !== state.raceId) {
            updates.push({ type: RaceEditStateUpdateType.SET_RACE_ID, payload: { raceId: sessionState.raceId } });
        }
        if (sessionState.name !== state.name) {
            updates.push({ type: RaceEditStateUpdateType.SET_NAME, payload: { name: sessionState.name } });
        }
        if (sessionState.editionId !== state.editionId) {
            updates.push({ type: RaceEditStateUpdateType.SET_EDITION_ID, payload: { editionId: sessionState.editionId } });
        }
        if (sessionState.isVisible !== state.isVisible) {
            updates.push({ type: RaceEditStateUpdateType.SET_IS_VISIBLE, payload: { isVisible: sessionState.isVisible } });
        }
        if (sessionState.description !== state.description) {
            updates.push({ type: RaceEditStateUpdateType.SET_DESCRIPTION, payload: { description: sessionState.description } });
        }
        if (!isEqual(sessionState.sourceBookInfo, state.sourceBookInfo)) {
            updates.push({ type: RaceEditStateUpdateType.SET_SOURCE_BOOK_INFO, payload: { sourceBookInfo: sessionState.sourceBookInfo } });
        }
        if (!isEqual(sessionState.featureProgressions, state.featureProgressions)) {
            updates.push({ type: RaceEditStateUpdateType.SET_FEATURE_PROGRESSIONS, payload: { featureProgressions: sessionState.featureProgressions } });
        }

        // Apply all updates (React will batch these automatically)
        if (updates.length > 0) {
            updates.forEach(update => {
                updateState(update as RaceEditStateUpdate);
            });
        }

        // Update race for legacy code compatibility (formData is now derived from state)
        setRace({
            name: sessionState.name,
            editionId: sessionState.editionId,
            isVisible: sessionState.isVisible,
            description: sessionState.description,
            sourceBookInfo: sessionState.sourceBookInfo,
            features: sessionState.featureProgressions.length > 0 ? sessionState.featureProgressions : null,
            ...(raceId && { id: raceId })
        });

        // Clear flag after state updates (use setTimeout to ensure it happens after all re-renders)
        // This ensures the sync-to-backend effect doesn't run during or immediately after this sync
        setTimeout(() => {
            isProcessingBackendSyncRef.current = false;
        }, 0);
    }, [resolution.raceState, updateState, raceId]);

    // Initialize session for existing races
    useEffect(() => {
        if (id !== 'new' && raceId && !resolution.isLoading && !resolution.raceState) {
            // Session will be initialized automatically by useRaceResolution
        }
    }, [id, raceId, resolution.isLoading, resolution.raceState]);

    // Initialize race for new races (used by some legacy code)
    // formData is derived from state, so race will update automatically when state changes
    useEffect(() => {
        if (id === 'new') {
            setRace(formData);
        }
    }, [id, formData, setFormData]);

    // Track previous state values to avoid unnecessary syncs
    const prevRaceFieldsRef = useRef<{
        name?: string;
        editionId?: number;
        isVisible?: boolean;
        description?: string | null;
        sourceBookInfo?: SourceMap[] | null;
    }>({});
    // Flag to prevent sync-to-backend during backend syncs
    const isProcessingBackendSyncRef = useRef(false);

    /**
     * Sync race field changes to backend session.
     * 
     * Automatically syncs race field changes to the resolution session.
     * Watches race fields for changes.
     * 
     * **Important**: This only syncs user-initiated changes, not changes from backend sync.
     */
    useEffect(() => {
        const { sessionId, applyUpdate } = resolution;

        // Only sync if session is initialized and we have a race ID
        if (!raceId || !sessionId) {
            return;
        }

        // Skip if we're currently processing a backend sync
        if (isProcessingBackendSyncRef.current) {
            return;
        }

        // Initialize refs on first session availability (don't send update on initial sync)
        if (prevRaceFieldsRef.current.name === undefined) {
            prevRaceFieldsRef.current = {
                name: state.name,
                editionId: state.editionId,
                isVisible: state.isVisible,
                description: state.description,
                sourceBookInfo: state.sourceBookInfo,
            };
            return;
        }

        // Don't sync if the current state matches the backend state (prevents loops)
        if (prevBackendStateRef.current) {
            const backendState = prevBackendStateRef.current;
            if (
                state.name === backendState.name &&
                state.editionId === backendState.editionId &&
                state.isVisible === backendState.isVisible &&
                state.description === backendState.description &&
                isEqual(state.sourceBookInfo, backendState.sourceBookInfo)
            ) {
                // State matches backend, no need to sync
                return;
            }
        }

        // Sync individual field changes
        const fieldsToSync: Array<{ field: string; value: unknown }> = [];

        if (state.name !== prevRaceFieldsRef.current.name) {
            fieldsToSync.push({ field: 'name', value: state.name });
        }
        if (state.editionId !== prevRaceFieldsRef.current.editionId) {
            fieldsToSync.push({ field: 'editionId', value: state.editionId });
        }
        if (state.isVisible !== prevRaceFieldsRef.current.isVisible) {
            fieldsToSync.push({ field: 'isVisible', value: state.isVisible });
        }
        if (state.description !== prevRaceFieldsRef.current.description) {
            fieldsToSync.push({ field: 'description', value: state.description });
        }
        if (!isEqual(state.sourceBookInfo, prevRaceFieldsRef.current.sourceBookInfo)) {
            fieldsToSync.push({ field: 'sourceBookInfo', value: state.sourceBookInfo });
        }

        // Only sync if there are actual changes
        if (fieldsToSync.length === 0) {
            return;
        }

        // Store the state we're about to send to detect our own updates
        lastSentStateRef.current = {
            name: state.name,
            editionId: state.editionId,
            isVisible: state.isVisible,
            description: state.description,
            sourceBookInfo: state.sourceBookInfo,
        };
        // Track how many updates we're sending
        pendingUpdatesRef.current = fieldsToSync.length;

        // Apply all field updates sequentially to avoid race conditions
        (async () => {
            try {
                for (const { field, value } of fieldsToSync) {
                    await applyUpdate({
                        type: RaceUpdateType.UpdateRaceField,
                        payload: { field, value }
                    });
                }
            } catch (error) {
                console.error('Failed to sync changes to session:', error);
                // Clear refs on error so we don't block future syncs
                pendingUpdatesRef.current = 0;
                lastSentStateRef.current = null;
            }
            // Note: We don't clear the refs here - they're cleared in the sync-from-backend effect
            // when it detects that the incoming state matches what we sent
        })();

        // Update refs
        prevRaceFieldsRef.current = {
            name: state.name,
            editionId: state.editionId,
            isVisible: state.isVisible,
            description: state.description,
            sourceBookInfo: state.sourceBookInfo,
        };
    }, [raceId, resolution.sessionId, resolution.applyUpdate, state.name, state.editionId, state.isVisible, state.description, state.sourceBookInfo]);

    // Track previous progressions to detect changes
    const prevProgressionsRef = useRef<FeatureProgression[]>([]);

    /**
     * Sync feature progressions to backend session.
     * 
     * Detects ADD/UPDATE/REMOVE operations by comparing previous and current progressions.
     */
    useEffect(() => {
        const { sessionId, applyUpdate } = resolution;

        if (!raceId || !sessionId) {
            return;
        }

        const prevProgressions = prevProgressionsRef.current;
        const currentProgressions = state.featureProgressions;

        // Initialize ref on first sync (don't send updates on initial load)
        if (prevProgressions.length === 0 && currentProgressions.length > 0) {
            prevProgressionsRef.current = [...currentProgressions];
            return;
        }

        // Detect removed progressions
        const removedProgressions = prevProgressions.filter(prev =>
            !currentProgressions.some(curr => curr.id === prev.id)
        );
        removedProgressions.forEach(progression => {
            if (progression.id) {
                applyUpdate({
                    type: RaceUpdateType.RemoveProgression,
                    payload: { progressionId: progression.id }
                }).catch(error => {
                    console.error('Failed to sync progression removal:', error);
                });
            }
        });

        // Detect added progressions
        const addedProgressions = currentProgressions.filter(curr => {
            if (curr.id) {
                const wasInPrevious = prevProgressions.some(prev => prev.id === curr.id);
                if (wasInPrevious) return false;
                // Check if this was a null-ID progression that got an ID assigned
                const wasNullIdProgression = prevProgressions.some(prev =>
                    !prev.id && prev.featureId === curr.featureId && prev.level === curr.level
                );
                if (wasNullIdProgression) return false; // Was updated, not added
            }
            // New progression (null ID or not in previous list)
            return !prevProgressions.some(prev =>
                !prev.id && !curr.id && prev.featureId === curr.featureId && prev.level === curr.level
            );
        });
        addedProgressions.forEach(progression => {
            applyUpdate({
                type: RaceUpdateType.AddProgression,
                payload: { progression }
            }).catch(error => {
                console.error('Failed to sync progression addition:', error);
            });
        });

        // Detect updated progressions (same ID, different content)
        currentProgressions.forEach(curr => {
            if (!curr.id) return; // Skip null-ID progressions (handled as adds)
            const prev = prevProgressions.find(p => p.id === curr.id);
            if (prev && !isEqual(prev, curr)) {
                applyUpdate({
                    type: RaceUpdateType.UpdateProgression,
                    payload: { progressionId: curr.id, progression: curr }
                }).catch(error => {
                    console.error('Failed to sync progression update:', error);
                });
            }
        });

        // Update ref
        prevProgressionsRef.current = [...currentProgressions];
    }, [raceId, resolution, state.featureProgressions]);

    useEffect(() => {
        if (location.state?.newFeature) {
            updateState({ type: RaceEditStateUpdateType.SET_IS_FEATURE_ASSOC_OPEN, payload: { isFeatureAssocOpen: true } });
        }
    }, [location.state, updateState]);

    /**
     * Handles the deletion of a race feature from the current race.
     */
    const _handleDeleteFeature = useCallback(async (featureId: number) => {
        if (window.confirm('Are you sure you want to remove this feature from the race?')) {
            const progressionsToRemove = state.featureProgressions.filter(feature => feature.featureId === featureId);
            progressionsToRemove.forEach(prog => {
                if (prog.id) {
                    updateState({ type: RaceEditStateUpdateType.REMOVE_FEATURE_PROGRESSION, payload: { progressionId: prog.id } });
                }
            });
            setMessage('Feature removed successfully from race!');
        }
    }, [state.featureProgressions, updateState]);

    /**
     * Handles adding a language to the race via the feature system using FeatureEntity approach.
     */
    const handleAddLanguage = useCallback((languageId: number, isAutomatic: boolean) => {
        const prev = state.featureProgressions;
        const featureId = isAutomatic ?
            SpecialFeatureId.AutomaticLanguage :
            SpecialFeatureId.BonusLanguage;

        // Check if this language is already added
        const existingLanguageEntity = prev.some(fp =>
            fp.featureId === featureId &&
            fp.entities?.some(entity =>
                entity.appliesTo === (isAutomatic ? EntityAppliesToType.AutomaticLanguage : EntityAppliesToType.BonusLanguage) &&
                entity.appliesToId === languageId
            )
        );

        if (existingLanguageEntity) {
            // Language already exists, don't add it again
            return;
        }

        // Find existing language progression or create new one
        let languageProgression = prev.find(fp =>
            fp.featureId === featureId
        );

        if (!languageProgression) {
            // Create new language progression
            languageProgression = {
                id: null, // Backend will generate ID
                level: 1,
                domainId: null, // Set domainId to null for race-based progressions
                featureId: featureId,
                sourceType: FeatureSourceType.Race,
                feature: {
                    id: featureId,
                    name: isAutomatic ? 'Automatic Language' : 'Bonus Language',
                    description: isAutomatic ? 'Automatic language feature' : 'Bonus language feature',
                    slug: isAutomatic ? 'automatic-language' : 'bonus-language',
                    displayInCharacterSheet: true,
                },
                entities: []
            };
        }

        // Add language modifier
        const languageEntity = {
            id: null, // Backend will generate ID
            progressionId: languageProgression.id,
            type: EntityType.Other,
            value: 0,
            appliesTo: isAutomatic ? EntityAppliesToType.AutomaticLanguage : EntityAppliesToType.BonusLanguage,
            appliesToId: languageId,
            appliesToSubId: null,
            bonusType: null,
            filterType: null,
            conditions: [],
            groupingId: 1, // Group all race languages together as one feature
            displayInDetail: true,
        };

        // Update the existing progression or add a new one
        const updatedProgressions = prev.map(fp => {
            if (fp.featureId === featureId) {
                return {
                    ...fp,
                    entities: [...(fp.entities || []), languageEntity]
                };
            }
            return fp;
        });

        // If no existing progression was found, add the new one with the language modifier
        if (!prev.some(fp => fp.featureId === featureId)) {
            languageProgression.entities = [languageEntity];
            updatedProgressions.push(languageProgression);
        }

        updateState({ type: RaceEditStateUpdateType.SET_FEATURE_PROGRESSIONS, payload: { featureProgressions: updatedProgressions } });
    }, [state.featureProgressions, updateState]);

    /**
     * Handles adding a feature to the race.
     * 
     * **Backend-Managed IDs Pattern**: The backend now handles all ID generation.
     * For new progressions, we set id to null and let the backend generate IDs.
     */
    const handleAddFeature = useCallback(async (feature: { id: number; name: string; description: string; slug: string }) => {
        try {
            // Fetch the feature's existing progressions to copy entities
            const existingProgressions = await FeatureSystemApi.getFeatureProgressions(undefined, { id: feature.id });

            // Find the first progression with entities to copy, or use empty entities
            const sourceProgression = existingProgressions.find(p => p.entities && p.entities.length > 0);
            const entitiesToCopy = sourceProgression?.entities || [];

            const newProgression: FeatureProgression = {
                id: null, // Backend will generate ID
                sourceType: FeatureSourceType.Race,
                domainId: null, // Set domainId to null for race-based progressions
                level: 1, // Default to level 1
                featureId: feature.id,
                feature: {
                    id: feature.id,
                    name: feature.name,
                    description: feature.description,
                    slug: feature.slug,
                    displayInCharacterSheet: sourceProgression?.feature?.displayInCharacterSheet ?? true,
                    prerequisites: sourceProgression?.feature?.prerequisites || []
                },
                entities: entitiesToCopy.map(entity => ({
                    ...entity,
                    id: null, // Backend will generate ID
                    progressionId: null // Will be set when progression is saved
                }))
            };

            updateState({ type: RaceEditStateUpdateType.ADD_FEATURE_PROGRESSION, payload: { progression: newProgression } });
        } catch (error) {
            console.error('Failed to fetch feature progressions:', error);
            // Fallback to creating progression without entities
            const newProgression: FeatureProgression = {
                id: null, // Backend will generate ID
                sourceType: FeatureSourceType.Race,
                domainId: null, // Set domainId to null for race-based progressions
                level: 1,
                featureId: feature.id,
                feature: {
                    id: feature.id,
                    name: feature.name,
                    description: feature.description,
                    slug: feature.slug,
                    displayInCharacterSheet: true,
                },
                entities: []
            };
            updateState({ type: RaceEditStateUpdateType.ADD_FEATURE_PROGRESSION, payload: { progression: newProgression } });
        }
    }, [updateState]);

    /**
     * Handles removing a feature progression from the race.
     */
    const handleRemoveProgression = useCallback((progressionId: number) => {
        updateState({ type: RaceEditStateUpdateType.REMOVE_FEATURE_PROGRESSION, payload: { progressionId } });
    }, [updateState]);

    /**
     * Handles updating an existing feature progression.
     */
    const handleUpdateProgression = useCallback((oldProgression: FeatureProgression, updatedProgression: FeatureProgression) => {
        if (oldProgression.id) {
            updateState({ type: RaceEditStateUpdateType.UPDATE_FEATURE_PROGRESSION, payload: { progressionId: oldProgression.id, progression: updatedProgression } });
        } else {
            // If no ID, just add as new
            updateState({ type: RaceEditStateUpdateType.ADD_FEATURE_PROGRESSION, payload: { progression: updatedProgression } });
        }
    }, [updateState]);

    /**
     * Handles adding a new feature progression.
     */
    const handleAddProgression = useCallback((progression: FeatureProgression) => {
        updateState({ type: RaceEditStateUpdateType.ADD_FEATURE_PROGRESSION, payload: { progression } });
    }, [updateState]);

    /**
     * Handles editing a feature progression.
     */
    const handleEditProgression = useCallback((progression: FeatureProgression) => {
        updateState({ type: RaceEditStateUpdateType.SET_EDITING_PROGRESSION, payload: { editingProgression: progression } });
        updateState({ type: RaceEditStateUpdateType.SET_IS_PROGRESSION_DIALOG_OPEN, payload: { isProgressionDialogOpen: true } });
    }, [updateState]);

    /**
     * Handles the removal of a language from the race using FeatureEntity approach.
     */
    const handleRemoveLanguage = useCallback((languageId: number) => {
        const prev = state.featureProgressions;
        // Remove the language modifier from both automatic and bonus language progressions
        const updatedProgressions = prev.map(fp => {
            if (fp.featureId === SpecialFeatureId.AutomaticLanguage || fp.featureId === SpecialFeatureId.BonusLanguage) {
                return {
                    ...fp,
                    entities: fp.entities?.filter(entity =>
                        !((entity.appliesTo === EntityAppliesToType.AutomaticLanguage || entity.appliesTo === EntityAppliesToType.BonusLanguage) && entity.appliesToId === languageId)
                    ) || []
                };
            }
            return fp;
        });

        // Remove empty language progressions
        const filteredProgressions = updatedProgressions.filter(fp => {
            if (fp.featureId === SpecialFeatureId.AutomaticLanguage || fp.featureId === SpecialFeatureId.BonusLanguage) {
                return fp.entities && fp.entities.length > 0;
            }
            return true;
        });

        updateState({ type: RaceEditStateUpdateType.SET_FEATURE_PROGRESSIONS, payload: { featureProgressions: filteredProgressions } });
    }, [state.featureProgressions, updateState]);

    /**
     * Handles changes to an ability adjustment for the race via the feature system.
     */
    const handleAbilityChange = useCallback((abilityId: number, parsedValue: number) => {
        const prev = state.featureProgressions;
        // Find existing ability adjustment feature (any ability adjustment feature)
        const existingAbilityFeature = prev.find(fp =>
            fp.featureId === SpecialFeatureId.AbilityAdjustment
        );

        let updatedFeatures: FeatureProgression[];

        if (existingAbilityFeature) {
            // Check if this specific ability already has a modifier
            const existingEntity = existingAbilityFeature.entities?.find(e =>
                e.appliesTo === EntityAppliesToType.Ability && e.appliesToId === abilityId
            );

            if (existingEntity) {
                // Update existing entity
                updatedFeatures = prev.map(fp =>
                    fp.featureId === SpecialFeatureId.AbilityAdjustment
                        ? {
                            ...fp,
                            entities: fp.entities?.map(e =>
                                e.appliesTo === EntityAppliesToType.Ability && e.appliesToId === abilityId
                                    ? { ...e, value: parsedValue }
                                    : e
                            ) || []
                        }
                        : fp
                );
            } else if (parsedValue !== 0) {
                // Add new entity to existing ability adjustment feature
                updatedFeatures = prev.map(fp =>
                    fp.featureId === SpecialFeatureId.AbilityAdjustment
                        ? {
                            ...fp,
                            entities: [...(fp.entities || []), {
                                id: null, // Backend will generate ID
                                progressionId: fp.id,
                                type: EntityType.Bonus,
                                value: parsedValue,
                                appliesTo: EntityAppliesToType.Ability,
                                appliesToId: abilityId,
                                appliesToSubId: null,
                                bonusType: null,
                                filterType: null,
                                conditions: [],
                                groupingId: 1, // Group all race ability adjustments together as one feature
                                displayInDetail: true,
                            }]
                        }
                        : fp
                );
            } else {
                // Remove modifier if value is 0
                updatedFeatures = prev.map(fp =>
                    fp.featureId === SpecialFeatureId.AbilityAdjustment
                        ? {
                            ...fp,
                            entities: fp.entities?.filter(e =>
                                !(e.appliesTo === EntityAppliesToType.Ability && e.appliesToId === abilityId)
                            ) || []
                        }
                        : fp
                );
            }
        } else if (parsedValue !== 0) {
            // Create new ability adjustment feature with this modifier
            // Backend-Managed IDs Pattern: Set id to null for new progression
            const newAbilityFeature: FeatureProgression = {
                id: null, // Backend will generate ID
                domainId: null, // Set domainId to null for race-based progressions
                level: 1,
                featureId: SpecialFeatureId.AbilityAdjustment,
                sourceType: FeatureSourceType.Race,
                feature: {
                    id: SpecialFeatureId.AbilityAdjustment,
                    slug: 'ability-adjustment',
                    name: 'Ability Adjustment',
                    description: 'Racial ability score adjustments',
                    displayInCharacterSheet: true,
                },
                entities: [{
                    id: null, // Backend will generate ID
                    progressionId: null,
                    type: EntityType.Bonus,
                    value: parsedValue,
                    appliesTo: EntityAppliesToType.Ability,
                    appliesToId: abilityId,
                    appliesToSubId: null,
                    bonusType: null,
                    filterType: null,
                    conditions: [],
                    groupingId: 1, // Group all race ability adjustments together as one feature
                    displayInDetail: true,
                }],
            };
            updatedFeatures = [...prev, newAbilityFeature];
        } else {
            // No change needed
            return;
        }

        updateState({ type: RaceEditStateUpdateType.SET_FEATURE_PROGRESSIONS, payload: { featureProgressions: updatedFeatures } });
    }, [state.featureProgressions, updateState]);

    const HandleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        // Validate the entire form
        if (!form.validation.validateForm(formData)) {
            setError('Please fix the validation errors before submitting');
            return;
        }

        try {
            setIsSaving(true);

            if (id === 'new') {
                // For new races, we need to create via the regular API first
                // Then we can use the session system for future edits
                const raceData: CreateRaceRequest = {
                    name: state.name,
                    editionId: state.editionId,
                    isVisible: state.isVisible,
                    description: state.description,
                    sourceBookInfo: state.sourceBookInfo,
                    features: state.featureProgressions.map(prog => {
                        const { classes: _classes, races: _races, ...progressionData } = prog;
                        return {
                            ...progressionData,
                            entities: prog.entities?.map(entity => {
                                const { progressionId: __, ...entityData } = entity;
                                return entityData;
                            }) || [],
                        };
                    })
                };

                const newRace = await RaceApi.createRace(raceData);
                setMessage('Race created successfully!');
                // Invalidate race caches
                await queryClient.invalidateQueries({
                    queryKey: ['races'],
                    exact: false
                });
                setTimeout(() => navigate(`/races/${newRace.id}`, { state: { fromListParams: fromListParams, refresh: true } }), 1500);
            } else {
                // For existing races, use session save
                if (!resolution.sessionId) {
                    setError('Session not initialized. Please wait for the session to load.');
                    return;
                }

                await resolution.saveSession();
                setMessage('Race updated successfully!');

                // Invalidate race caches
                const numericId = parseInt(id);
                await queryClient.invalidateQueries({
                    queryKey: RaceQueryHooks.getRaceByIdQueryKey(numericId)
                });
                await queryClient.invalidateQueries({
                    queryKey: ['races'],
                    exact: false
                });

                navigate(`/races/${id}`, { state: { fromListParams: fromListParams, refresh: true } });
            }
        } catch (err) {
            console.error('Error saving race:', err);
            console.error('Error details:', {
                name: err instanceof Error ? err.name : 'Unknown',
                message: err instanceof Error ? err.message : 'Unknown error',
                stack: err instanceof Error ? err.stack : 'No stack trace'
            });

            // Try to extract more detailed error information
            let errorMessage = 'Failed to save race';
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
            setIsSaving(false);
        }
    };

    // Show loading state while session is initializing (for existing races)
    if (id !== 'new' && resolution.isLoading && !resolution.raceState) {
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
                                        onClick={() => updateState({ type: RaceEditStateUpdateType.SET_ACTIVE_TAB, payload: { activeTab: tab.id } })}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${state.activeTab === tab.id
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
                                state={state}
                                updateState={updateState}
                                formData={formData}
                                setFormData={setFormData}
                                validation={form.validation}
                                isLoading={isLoading}
                                featureProgressions={state.featureProgressions}
                                setFeatureProgressions={(progressions) => updateState({ type: RaceEditStateUpdateType.SET_FEATURE_PROGRESSIONS, payload: { featureProgressions: progressions } })}
                                raceId={id !== 'new' ? parseInt(id) : undefined}
                                isFeatureAssocOpen={state.isFeatureAssocOpen}
                                setIsFeatureAssocOpen={(open) => updateState({ type: RaceEditStateUpdateType.SET_IS_FEATURE_ASSOC_OPEN, payload: { isFeatureAssocOpen: open } })}
                                onAddLanguage={handleAddLanguage}
                                onRemoveLanguage={handleRemoveLanguage}
                                onAbilityChange={handleAbilityChange}
                                onAddFeature={handleAddFeature}
                                onRemoveProgression={handleRemoveProgression}
                                onEditProgression={handleEditProgression}
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
                isOpen={state.isFeatureAssocOpen}
                onClose={() => {
                    updateState({ type: RaceEditStateUpdateType.SET_IS_FEATURE_ASSOC_OPEN, payload: { isFeatureAssocOpen: false } });
                }}
                onSave={() => { }}
                initialSelectedFeatureIds={state.featureProgressions.map(f => f.featureId.toString())}
                raceId={id !== 'new' ? parseInt(id) : 0}
            />

            {/* Feature Progression Dialog */}
            <FeatureProgressionDetailEdit
                isOpen={state.isProgressionDialogOpen}
                onClose={() => {
                    updateState({ type: RaceEditStateUpdateType.SET_IS_PROGRESSION_DIALOG_OPEN, payload: { isProgressionDialogOpen: false } });
                    updateState({ type: RaceEditStateUpdateType.SET_PRE_SELECTED_FEATURE, payload: { preSelectedFeature: undefined } });
                }}
                progression={state.editingProgression}
                onSave={(progression) => {
                    if (state.editingProgression) {
                        handleUpdateProgression(state.editingProgression, progression);
                    } else {
                        handleAddProgression(progression);
                    }
                    updateState({ type: RaceEditStateUpdateType.SET_IS_PROGRESSION_DIALOG_OPEN, payload: { isProgressionDialogOpen: false } });
                    updateState({ type: RaceEditStateUpdateType.SET_PRE_SELECTED_FEATURE, payload: { preSelectedFeature: undefined } });
                }}
                preSelectedFeature={state.preSelectedFeature}
                showSourceTypeSelector={false}
                editionId={state.editionId}
            />
        </div>
    );
}
