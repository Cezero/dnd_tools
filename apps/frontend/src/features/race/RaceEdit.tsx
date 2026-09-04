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

import { FeatureEditForm } from '@/components/feature-system/FeatureEditForm';
import { FeatureQueryHooks } from '@/components/feature-system/FeatureQueryHooks';
import {
    ValidatedForm,
    useValidatedForm
} from '@/components/forms';
import { UpdateRaceSchema, BaseRaceSchema, FeatureWithRelations, CreateRaceRequest, type RaceEditState, SourceMap } from '@shared/schema';
import { DraftAction, FeatureSourceType } from '@shared/static-data';

import {
    persistRaceAbilityChange,
    persistRaceLanguageAdd,
    persistRaceLanguageRemove,
} from './raceConvenienceFeatures';
import { RaceFeatureAssoc } from './RaceFeatureAssoc';
import { RaceQueryHooks } from './RaceQueryHooks';
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
    // Handle both 'new' and '0' for new entities (backward compatibility)
    const raceId = (id !== 'new' && id !== '0') ? parseInt(id) : (id === '0' ? 0 : null);
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
    const schema = (id === 'new' || id === '0') ? BaseRaceSchema : UpdateRaceSchema;

    // Tab configuration - use state instead of local activeTab
    const tabs: TabConfig[] = [
        { id: 'basic', label: 'Basic Info', icon: DocumentTextIcon, component: BasicInfoTab },
        { id: 'abilities', label: 'Abilities', icon: UserIcon, component: AbilitiesTab },
        { id: 'languages', label: 'Languages', icon: AcademicCapIcon, component: LanguagesTab },
        { id: 'features', label: 'Features', icon: SparklesIcon, component: FeaturesTab },
        { id: 'description', label: 'Description', icon: DocumentTextIcon, component: DescriptionTab }
    ];

    const CurrentTabComponent = tabs.find(tab => tab.id === state.activeTab)?.component;

    // Load features using FeatureQueryHooks
    const [loadedFeatures, setLoadedFeatures] = useState<FeatureWithRelations[]>([]);
    const [isLoadingFeatures, setIsLoadingFeatures] = useState(false);
    const prevFeatureIdsRef = useRef<number[]>([]);

    useEffect(() => {
        // Only reload if featureIds actually changed
        const featureIdsChanged =
            prevFeatureIdsRef.current.length !== state.featureIds.length ||
            prevFeatureIdsRef.current.some((id, index) => id !== state.featureIds[index]);

        if (!featureIdsChanged && prevFeatureIdsRef.current.length > 0) {
            return;
        }

        const loadFeatures = async () => {
            if (state.featureIds.length === 0) {
                setLoadedFeatures([]);
                prevFeatureIdsRef.current = [];
                return;
            }

            setIsLoadingFeatures(true);
            try {
                const missingFeatureIds: number[] = [];

                const features = await Promise.all(
                    state.featureIds.map(async (featureId) => {
                        try {
                            return await FeatureQueryHooks.getFeatureById(featureId, queryClient);
                        } catch (error) {
                            // Handle missing features gracefully
                            const errorMessage = error instanceof Error ? error.message : String(error);
                            if (errorMessage.includes('not found') || errorMessage.includes('Not Found')) {
                                console.warn(`Feature ${featureId} not found, removing from race feature list`);
                                missingFeatureIds.push(featureId);
                                return null;
                            }
                            // Re-throw unexpected errors
                            throw error;
                        }
                    })
                );
                const validFeatures = features.filter((f): f is FeatureWithRelations => f !== null);
                const validFeatureIds = validFeatures.map(f => f.id);

                setLoadedFeatures(validFeatures);
                prevFeatureIdsRef.current = [...validFeatureIds];

                // Remove missing feature IDs from state if any were found
                if (missingFeatureIds.length > 0) {
                    const updatedFeatureIds = state.featureIds.filter(id => !missingFeatureIds.includes(id));
                    if (updatedFeatureIds.length !== state.featureIds.length) {
                        updateState({
                            type: RaceEditStateUpdateType.SET_FEATURE_IDS,
                            payload: { featureIds: updatedFeatureIds }
                        });
                    }
                }
            } catch (error) {
                console.error('Error loading features:', error);
            } finally {
                setIsLoadingFeatures(false);
            }
        };

        loadFeatures();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryClient, state.featureIds]);

    /**
     * Reloads linked features after an in-place entity update (featureIds unchanged).
     */
    const reloadLoadedFeatures = useCallback(async () => {
        if (state.featureIds.length === 0) {
            setLoadedFeatures([]);
            prevFeatureIdsRef.current = [];
            return;
        }

        const features = await Promise.all(
            state.featureIds.map(async (featureId) => {
                await queryClient.invalidateQueries({
                    queryKey: FeatureQueryHooks.getFeatureByIdQueryKey(featureId)
                });
                try {
                    return await FeatureQueryHooks.getFeatureById(featureId, queryClient);
                } catch (_error) {
                    return null;
                }
            })
        );
        const validFeatures = features.filter((feature): feature is FeatureWithRelations => feature !== null);
        setLoadedFeatures(validFeatures);
        prevFeatureIdsRef.current = validFeatures.map(feature => feature.id);
    }, [queryClient, state.featureIds]);

    // Derive formData from state (single source of truth)
    // This is used for form validation only - tabs should use state directly
    const formData = useMemo((): RaceFormData => ({
        name: state.name,
        editionId: state.editionId,
        isVisible: state.isVisible,
        description: state.description,
        sourceBookInfo: state.sourceBookInfo,
        // Features are managed independently, so formData doesn't need featureIds
        // The form validation will work without it
        ...((id !== 'new' && id !== '0') && state.raceId ? { id: state.raceId } : {})
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
        if (!isEqual(sessionState.featureIds, state.featureIds)) {
            updates.push({ type: RaceEditStateUpdateType.SET_FEATURE_IDS, payload: { featureIds: sessionState.featureIds } });
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
            // Features are managed independently via featureIds, not in formData
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
        if (id === 'new' || id === '0') {
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
     * Uses updateValue for path-based field updates.
     */
    useEffect(() => {
        // Only sync if race state is loaded and we have a race ID
        if (!raceId || !resolution.raceState) {
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
                    await resolution.updateValue(field, value);
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
    }, [raceId, resolution.raceState, resolution.updateValue, state.name, state.editionId, state.isVisible, state.description, state.sourceBookInfo]);

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
            // For race, we just unlink the feature
            updateState({ type: RaceEditStateUpdateType.UNLINK_FEATURE, payload: { featureId } });
            if (raceId && resolution.raceState) {
                await resolution.updateValue('featureIds', featureId, DraftAction.Remove);
            }
            setMessage('Feature removed successfully from race!');
        }
    }, [raceId, resolution.raceState, resolution.updateValue, updateState]);

    /**
     * Adds a language entity to the canonical Base automatic/bonus language feature.
     */
    const handleAddLanguage = useCallback(async (languageId: number, isAutomatic: boolean) => {
        try {
            const result = await persistRaceLanguageAdd(
                {
                    editionId: state.editionId,
                    features: loadedFeatures,
                    raceName: state.name,
                },
                languageId,
                isAutomatic
            );
            if (result.createdFeatureId) {
                updateState({ type: RaceEditStateUpdateType.LINK_FEATURE, payload: { featureId: result.createdFeatureId } });
                if (raceId && resolution.raceState) {
                    await resolution.updateValue('featureIds', result.createdFeatureId, DraftAction.Add);
                }
            }
            await queryClient.invalidateQueries({ queryKey: ['features'], exact: false });
            if (!result.createdFeatureId) {
                await reloadLoadedFeatures();
            }
        } catch (persistError) {
            setError(persistError instanceof Error ? persistError.message : 'Failed to add language');
        }
    }, [loadedFeatures, queryClient, raceId, reloadLoadedFeatures, resolution.raceState, resolution.updateValue, state.editionId, state.name, updateState]);

    /**
     * Handles adding a feature to the race.
     * 
     * **Backend-Managed IDs Pattern**: The backend now handles all ID generation.
     * For new features, we set id to null and let the backend generate IDs.
     */
    const handleAddFeature = useCallback(async (feature: { id: number; name: string; description: string; slug: string }) => {
        try {
            // Fetch the feature's existing features to copy entities
            const existingProgressions = await FeatureQueryHooks.getFeatureProgressions(feature.id);

            // Find the first feature with entities to copy, or use empty entities
            const sourceProgression = existingProgressions.find(p => p.entities && p.entities.length > 0);
            const entitiesToCopy = sourceProgression?.entities || [];

            const newProgression: FeatureWithRelations = {
                id: feature.id,
                sourceType: FeatureSourceType.Race,
                domainId: null, // Set domainId to null for race-based features
                level: 1, // Default to level 1
                name: feature.name,
                description: feature.description,
                slug: feature.slug,
                displayInCharacterSheet: sourceProgression?.displayInCharacterSheet ?? true,
                prerequisites: sourceProgression?.prerequisites || [],
                entities: entitiesToCopy.map(entity => ({
                    ...entity,
                    id: null, // Backend will generate ID
                    featureId: null // Will be set when feature is saved
                }))
            };

            updateState({ type: RaceEditStateUpdateType.LINK_FEATURE, payload: { featureId: newProgression.id } });
            if (raceId && resolution.raceState) {
                await resolution.updateValue('featureIds', newProgression.id, DraftAction.Add);
            }
        } catch (error) {
            console.error('Failed to fetch feature features:', error);
            // Fallback to creating feature without entities
            const newProgression: FeatureWithRelations = {
                id: feature.id,
                sourceType: FeatureSourceType.Race,
                domainId: null, // Set domainId to null for race-based features
                level: 1,
                name: feature.name,
                description: feature.description,
                slug: feature.slug,
                displayInCharacterSheet: true,
                entities: []
            };
            updateState({ type: RaceEditStateUpdateType.LINK_FEATURE, payload: { featureId: newProgression.id } });
            if (raceId && resolution.raceState) {
                await resolution.updateValue('featureIds', newProgression.id, DraftAction.Add);
            }
        }
    }, [raceId, resolution.raceState, resolution.updateValue, updateState]);

    // Handlers are already defined above - these duplicates should be removed

    /**
     * Handles editing a feature feature.
     */
    const handleEditProgression = useCallback((feature: FeatureWithRelations) => {
        updateState({ type: RaceEditStateUpdateType.SET_EDITING_FEATURE_ID, payload: { editingFeatureId: feature.id } });
    }, [updateState]);

    /**
     * Removes a language entity from the matching canonical Base language feature.
     */
    const handleRemoveLanguage = useCallback(async (languageId: number, isAutomatic: boolean) => {
        try {
            await persistRaceLanguageRemove(
                {
                    editionId: state.editionId,
                    features: loadedFeatures,
                    raceName: state.name,
                },
                languageId,
                isAutomatic
            );
            await queryClient.invalidateQueries({ queryKey: ['features'], exact: false });
            await reloadLoadedFeatures();
        } catch (persistError) {
            setError(persistError instanceof Error ? persistError.message : 'Failed to remove language');
        }
    }, [loadedFeatures, queryClient, reloadLoadedFeatures, state.editionId, state.name]);

    /**
     * Updates a Base ability-adjustment entity, creating the container when the first non-zero value is set.
     */
    const handleAbilityChange = useCallback(async (abilityId: number, parsedValue: number) => {
        try {
            const result = await persistRaceAbilityChange(
                {
                    editionId: state.editionId,
                    features: loadedFeatures,
                    raceName: state.name,
                },
                abilityId,
                parsedValue
            );
            if (result.createdFeatureId) {
                updateState({ type: RaceEditStateUpdateType.LINK_FEATURE, payload: { featureId: result.createdFeatureId } });
                if (raceId && resolution.raceState) {
                    await resolution.updateValue('featureIds', result.createdFeatureId, DraftAction.Add);
                }
            }
            await queryClient.invalidateQueries({ queryKey: ['features'], exact: false });
            if (!result.createdFeatureId) {
                await reloadLoadedFeatures();
            }
        } catch (persistError) {
            setError(persistError instanceof Error ? persistError.message : 'Failed to update ability adjustment');
        }
    }, [loadedFeatures, queryClient, raceId, reloadLoadedFeatures, resolution.raceState, resolution.updateValue, state.editionId, state.name, updateState]);


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

            if (id === 'new' || id === '0') {
                // For new races, we need to create via the regular API first
                // Then we can use the session system for future edits
                const raceData: CreateRaceRequest = {
                    name: state.name,
                    editionId: state.editionId,
                    isVisible: state.isVisible,
                    description: state.description,
                    sourceBookInfo: state.sourceBookInfo,
                    featureIds: state.featureIds
                };

                const newRace = await RaceQueryHooks.createRace(raceData);
                setMessage('Race created successfully!');
                // Invalidate race caches
                await queryClient.invalidateQueries({
                    queryKey: ['races'],
                    exact: false
                });
                setTimeout(() => navigate(`/races/${newRace.id}`, { state: { fromListParams: fromListParams, refresh: true } }), 1500);
            } else {
                // For existing races, use state save
                if (!resolution.raceState) {
                    setError('Race state not loaded. Please wait for the state to load.');
                    return;
                }

                await resolution.save();
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
    if ((id !== 'new' && id !== '0') && resolution.isLoading && !resolution.raceState) {
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
                    {(id === 'new' || id === '0') ? 'Create New Race' : 'Edit Race'}
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
                                validation={form.validation}
                                isLoading={isLoading}
                                features={loadedFeatures}
                                setFeatures={(features) => {
                                    // Update featureIds based on the features
                                    const updatedFeatureIds = features.map(f => f.id).filter((id): id is number => id !== null);
                                    updateState({ type: RaceEditStateUpdateType.SET_FEATURE_IDS, payload: { featureIds: updatedFeatureIds } });
                                }}
                                raceId={(id !== 'new' && id !== '0') ? parseInt(id) : undefined}
                                isFeatureAssocOpen={state.isFeatureAssocOpen}
                                setIsFeatureAssocOpen={(open) => updateState({ type: RaceEditStateUpdateType.SET_IS_FEATURE_ASSOC_OPEN, payload: { isFeatureAssocOpen: open } })}
                                onAddLanguage={handleAddLanguage}
                                onRemoveLanguage={handleRemoveLanguage}
                                onAbilityChange={handleAbilityChange}
                                onAddFeature={handleAddFeature}
                                onRemoveProgression={(featureId: number) => {
                                    updateState({ type: RaceEditStateUpdateType.UNLINK_FEATURE, payload: { featureId } });
                                }}
                                onLinkFeatureId={async (featureId) => {
                                    if (raceId && resolution.raceState) {
                                        await resolution.updateValue('featureIds', featureId, DraftAction.Add);
                                    }
                                }}
                                onUnlinkFeatureId={async (featureId) => {
                                    if (raceId && resolution.raceState) {
                                        await resolution.updateValue('featureIds', featureId, DraftAction.Remove);
                                    }
                                }}
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
                        {isLoading ? 'Saving...' : (id === 'new' || id === '0') ? 'Create Race' : 'Update Race'}
                    </button>
                </div>
            </ValidatedForm>

            <RaceFeatureAssoc
                isOpen={state.isFeatureAssocOpen}
                onClose={() => {
                    updateState({ type: RaceEditStateUpdateType.SET_IS_FEATURE_ASSOC_OPEN, payload: { isFeatureAssocOpen: false } });
                }}
                onSave={() => { }}
                initialSelectedFeatureIds={state.featureIds.map(id => String(id))}
                raceId={id !== 'new' ? parseInt(id) : 0}
            />

            {/* Feature Edit Dialog */}
            <FeatureEditForm
                isOpen={state.editingFeatureId !== null}
                onClose={() => {
                    updateState({ type: RaceEditStateUpdateType.SET_EDITING_FEATURE_ID, payload: { editingFeatureId: null } });
                }}
                featureId={
                    // Use 0 for new features
                    state.editingFeatureId !== null && state.editingFeatureId > 0
                        ? state.editingFeatureId
                        : state.preSelectedFeatureId !== undefined && state.preSelectedFeatureId > 0
                            ? state.preSelectedFeatureId
                            : 0
                }
                onSave={async (featureId: number) => {
                    // Ensure the featureId is in the race's feature list
                    // The feature was already saved via state system, we just need to track its ID
                    // The useEffect hook will automatically sync the link to the backend
                    if (!state.featureIds.includes(featureId)) {
                        // Add the feature ID to the race's feature list
                        updateState({ type: RaceEditStateUpdateType.LINK_FEATURE, payload: { featureId } });
                    }

                    // Force reload by resetting prevFeatureIdsRef to trigger useEffect reload
                    prevFeatureIdsRef.current = [];

                    // Refresh session state to get updated feature data from backend
                    if (state.editingFeatureId !== null && resolution.refreshState) {
                        await resolution.refreshState();
                    }

                    updateState({ type: RaceEditStateUpdateType.SET_EDITING_FEATURE_ID, payload: { editingFeatureId: null } });
                    updateState({ type: RaceEditStateUpdateType.SET_PRE_SELECTED_FEATURE_ID, payload: { preSelectedFeatureId: undefined } });
                }}
                mode="modal"
                context={
                    raceId
                        ? {
                            sourceType: FeatureSourceType.Race,
                            parentId: raceId,
                            parentType: 'race',
                            editionId: state.editionId ?? null
                        }
                        : undefined
                }
            />
        </div>
    );
}
