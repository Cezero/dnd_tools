import {
    DocumentTextIcon,
    ShieldCheckIcon,
    AcademicCapIcon,
    SparklesIcon,
    BeakerIcon
} from '@heroicons/react/24/outline';
import { useQueryClient } from '@tanstack/react-query';
import { isEqual } from 'lodash';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import { FeatureEditForm } from '@/components/feature-system/FeatureEditForm';
import { FeatureQueryHooks } from '@/components/feature-system/FeatureQueryHooks';
import {
    ValidatedForm,
    useValidatedForm,
} from '@/components/forms';
import {
    CreateClassSchema,
    UpdateClassSchema,
    CreateClassRequest,
    Feature,
    FeatureWithRelations,
    FeatureEntity,
    SpellcastingProgressionWithSlots,
    SourceMap,
} from '@shared/schema';
import {
    DraftAction,
    EntityType,
    EntityAppliesToType,
    FeatureSourceType,
} from '@shared/static-data';

import { ClassApi } from './ClassApi';
import { ClassFeatureAssoc } from './ClassFeatureAssoc';
import { ClassProficiencyService } from './ClassProficiencyService';
import { ClassQueryHooks } from './ClassQueryHooks';
import { ClassSkillService } from './ClassSkillService';
import {
    BasicInfoTab,
    SkillsTab,
    ProficienciesTab,
    FeaturesTab,
    SpellcastingTab,
    DescriptionTab,
    type TabConfig,
    type ClassFormData
} from './tabs';
import { ClassEditStateUpdateType } from './types';
import { useClassEditState } from './useClassEditState';
import { useClassResolution } from './useClassResolution';

export default function ClassEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();

    // Use centralized state management
    // Handle both 'new' and '0' for new entities (backward compatibility)
    const classId = (id !== 'new' && id !== '0') ? parseInt(id) : (id === '0' ? 0 : null);
    const resolution = useClassResolution(classId);
    const { state, updateState } = useClassEditState();

    // UI-only state (not part of class edit state)
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [cls, setCls] = useState<ClassFormData | null>(null);

    // Combine loading states
    const isLoading = resolution.isLoading || isSaving;

    /**
     * Helper function to create a feature feature.
     * 
     * **Backend-Managed IDs Pattern**: The backend now handles all ID generation.
     * For new features, we set id to null and let the backend generate IDs.
     * 
     * @param baseProgression - Partial feature data to merge with defaults
     * @returns A complete FeatureWithRelations with id: null for new items
     */
    const createFeature = useCallback((baseProgression: Partial<FeatureWithRelations>): FeatureWithRelations => {
        return {
            id: null, // Backend will generate ID
            slug: baseProgression.slug || '',
            name: baseProgression.name || '',
            description: baseProgression.description || '',
            displayInCharacterSheet: baseProgression.displayInCharacterSheet ?? true,
            sourceType: baseProgression.sourceType ?? FeatureSourceType.Class,
            domainId: baseProgression.domainId ?? null,
            featId: baseProgression.featId ?? null,
            companionId: baseProgression.companionId ?? null,
            editionId: baseProgression.editionId ?? null,
            level: baseProgression.level ?? 1,
            ...baseProgression,
        } as FeatureWithRelations;
    }, []);

    // Ref to track if we've already processed the newFeature
    const processedNewFeatureRef = useRef<boolean>(false);
    // Ref to track current preSelectedFeature
    const preSelectedFeatureRef = useRef<FeatureWithRelations | undefined>(undefined);
    // Ref to track latest formData to avoid dependency issues in setFormData
    const formDataRef = useRef<ClassFormData | null>(null);

    // Update ref when preSelectedFeatureId changes
    useEffect(() => {
        // preSelectedFeatureRef is no longer used since we use preSelectedFeatureId
    }, [state.preSelectedFeatureId]);

    // Track previous values to avoid unnecessary updates and infinite loops
    const prevStateRef = useRef<typeof resolution.classState>(null);
    const prevSpellcastingRef = useRef<SpellcastingProgressionWithSlots[] | null>(null);
    const prevSpellsKnownRef = useRef<SpellcastingProgressionWithSlots[] | null>(null);

    // Track if we're currently initializing to prevent sync effects from running
    const isInitializingRef = useRef(false);

    // Ref to store last memoized classState for reference stability
    const lastMemoizedClassStateRef = useRef<typeof resolution.classState>(null);

    // Memoize classState to prevent unnecessary effect re-runs when reference changes but data is the same
    // This stabilizes the reference so the effect only runs when data actually changes
    const memoizedClassState = useMemo(() => {
        if (!resolution.classState) {
            lastMemoizedClassStateRef.current = null;
            return null;
        }
        // If data hasn't changed, return previous memoized value to maintain reference stability
        if (lastMemoizedClassStateRef.current && isEqual(lastMemoizedClassStateRef.current, resolution.classState)) {
            return lastMemoizedClassStateRef.current;
        }
        // Data has changed, update ref and return new value
        lastMemoizedClassStateRef.current = resolution.classState;
        return resolution.classState;
    }, [resolution.classState]);

    /**
     * Initialize state from session when classState becomes available.
     * Only initializes if the session state data has actually changed (deep comparison).
     */
    useEffect(() => {
        if (!memoizedClassState) {
            return;
        }

        const sessionState = memoizedClassState;

        // Check if current state already matches session state - if so, skip initialization
        const stateMatches =
            state.classId === sessionState.classId &&
            state.name === sessionState.name &&
            state.abbreviation === sessionState.abbreviation &&
            state.editionId === sessionState.editionId &&
            state.isPrestige === sessionState.isPrestige &&
            state.isVisible === sessionState.isVisible &&
            state.canCastSpells === sessionState.canCastSpells &&
            state.spellsKnown === sessionState.spellsKnown &&
            state.isDivine === sessionState.isDivine &&
            state.description === sessionState.description &&
            isEqual(state.sourceBookInfo, sessionState.sourceBookInfo) &&
            isEqual(state.featureIds, sessionState.featureIds) &&
            isEqual(state.spellcastingProgression, sessionState.spellcastingProgression) &&
            isEqual(state.spellsKnownProgression, sessionState.spellsKnownProgression);

        // Use deep equality to check if session state data has actually changed
        // This prevents re-initialization when updateValue returns a new object with same data
        if (prevStateRef.current && isEqual(prevStateRef.current, sessionState)) {
            return;
        }

        if (stateMatches) {
            // State already matches, update prevStateRef and return
            prevStateRef.current = sessionState;
            return;
        }

        // Set flag to prevent sync effects from running during initialization
        isInitializingRef.current = true;

        // Populate state from session
        updateState({ type: ClassEditStateUpdateType.SET_CLASS_ID, payload: { classId: sessionState.classId } });
        updateState({ type: ClassEditStateUpdateType.SET_NAME, payload: { name: sessionState.name } });
        updateState({ type: ClassEditStateUpdateType.SET_ABBREVIATION, payload: { abbreviation: sessionState.abbreviation } });
        updateState({ type: ClassEditStateUpdateType.SET_EDITION_ID, payload: { editionId: sessionState.editionId } });
        updateState({ type: ClassEditStateUpdateType.SET_IS_PRESTIGE, payload: { isPrestige: sessionState.isPrestige } });
        updateState({ type: ClassEditStateUpdateType.SET_IS_VISIBLE, payload: { isVisible: sessionState.isVisible } });
        updateState({ type: ClassEditStateUpdateType.SET_CAN_CAST_SPELLS, payload: { canCastSpells: sessionState.canCastSpells } });
        updateState({ type: ClassEditStateUpdateType.SET_SPELLS_KNOWN, payload: { spellsKnown: sessionState.spellsKnown } });
        updateState({ type: ClassEditStateUpdateType.SET_IS_DIVINE, payload: { isDivine: sessionState.isDivine } });
        updateState({ type: ClassEditStateUpdateType.SET_DESCRIPTION, payload: { description: sessionState.description } });
        updateState({ type: ClassEditStateUpdateType.SET_SOURCE_BOOK_INFO, payload: { sourceBookInfo: sessionState.sourceBookInfo ?? null } });
        updateState({ type: ClassEditStateUpdateType.SET_FEATURE_IDS, payload: { featureIds: sessionState.featureIds } });
        updateState({ type: ClassEditStateUpdateType.SET_SPELLCASTING_PROGRESSION, payload: { progression: sessionState.spellcastingProgression } });
        updateState({ type: ClassEditStateUpdateType.SET_SPELLS_KNOWN_PROGRESSION, payload: { progression: sessionState.spellsKnownProgression } });

        // Update cls for legacy code compatibility (formData is now derived from state)
        setCls({
            name: sessionState.name,
            abbreviation: sessionState.abbreviation,
            editionId: sessionState.editionId,
            isPrestige: sessionState.isPrestige,
            isVisible: sessionState.isVisible,
            canCastSpells: sessionState.canCastSpells,
            isDivine: sessionState.isDivine,
            description: sessionState.description || '',
            spellcastingProgression: sessionState.spellcastingProgression,
            ...(classId && { id: classId })
        });

        // Update prevStateRef AFTER initialization completes to prevent re-triggering
        prevStateRef.current = sessionState;

        // Clear initialization flag after a brief delay to allow state updates to complete
        // Use setTimeout to ensure this happens after all state updates are applied
        setTimeout(() => {
            isInitializingRef.current = false;
        }, 0);

        // Update prev refs to match session state so sync effects don't detect changes
        prevClassFieldsRef.current = {
            name: sessionState.name,
            abbreviation: sessionState.abbreviation,
            editionId: sessionState.editionId,
            isPrestige: sessionState.isPrestige,
            isVisible: sessionState.isVisible,
            canCastSpells: sessionState.canCastSpells,
            spellsKnown: sessionState.spellsKnown,
            isDivine: sessionState.isDivine,
            description: sessionState.description,
            sourceBookInfo: sessionState.sourceBookInfo,
        };
        prevSpellcastingRef.current = sessionState.spellcastingProgression;
        prevSpellsKnownRef.current = sessionState.spellsKnownProgression;
    }, [memoizedClassState, updateState, classId]);

    // Load features using FeatureQueryHooks
    // Declare early so it can be used in callbacks
    const [loadedFeatures, setLoadedFeatures] = useState<FeatureWithRelations[]>([]);
    const [isLoadingFeatures, setIsLoadingFeatures] = useState(false);
    const prevFeatureIdsRef = useRef<number[]>([]);

    // Determine which schema to use based on whether we're creating or editing
    const schema = useMemo(() => {
        return id === 'new' ? CreateClassSchema : UpdateClassSchema;
    }, [id]);

    /**
     * Handles adding a class skill via the feature system.
     */
    const handleAddSkill = useCallback((skillId: number) => {
        ClassSkillService.addSkill(loadedFeatures, (features) => {
            // Update featureIds based on the updated features
            const updatedFeatureIds = features.map(f => f.id).filter((id): id is number => id !== null);
            updateState({ type: ClassEditStateUpdateType.SET_FEATURE_IDS, payload: { featureIds: updatedFeatureIds } });
        }, skillId, classId || 0);
    }, [loadedFeatures, updateState, classId]);

    /**
     * Handles removing a class skill via the feature system.
     */
    const handleRemoveSkill = useCallback((skillId: number) => {
        ClassSkillService.removeSkill(loadedFeatures, (features) => {
            // Update featureIds based on the updated features
            const updatedFeatureIds = features.map(f => f.id).filter((id): id is number => id !== null);
            updateState({ type: ClassEditStateUpdateType.SET_FEATURE_IDS, payload: { featureIds: updatedFeatureIds } });
        }, skillId);
    }, [loadedFeatures, updateState]);

    /**
     * Handles adding a proficiency via the feature system.
     */
    const handleAddProficiency = useCallback(async (featId: number, itemId: number) => {
        try {
            // Check if class proficiency feature already exists (class source with Base proficiency entities)
            let classProficiencyFeature = loadedFeatures.find(fp =>
                fp.sourceType === FeatureSourceType.Class &&
                fp.classes?.some(c => c.classId === ((id !== 'new' && id !== '0') ? parseInt(id) : 0)) &&
                fp.entities?.some(e => e.type === EntityType.Base && e.appliesTo === EntityAppliesToType.Proficiency)
            );

            if (!classProficiencyFeature) {
                // Create the main class proficiency feature if it doesn't exist
                // This needs to be done via the feature state system
                // For now, we'll need to create it via API and then link it
                // TODO: Implement proficiency feature creation via feature state system
                console.warn('Class proficiency feature creation not yet implemented via feature state system');
                return;
            }

            // Check if this specific proficiency already exists
            const existingProficiency = classProficiencyFeature.entities?.find(e =>
                e.appliesTo === EntityAppliesToType.Proficiency &&
                e.appliesToId === featId &&
                e.appliesToSubId === itemId
            );

            if (existingProficiency) {
                return;
            }

            // Add the proficiency as an entity via feature state system
            // This requires editing the feature state, which should be done via FeatureEditForm
            // For now, we'll need to update the feature state directly
            // TODO: Implement proficiency entity addition via feature state system
            console.warn('Proficiency entity addition not yet implemented via feature state system');
        } catch (error) {
            console.error('Failed to add proficiency:', error);
        }
    }, [loadedFeatures, id]);

    /**
     * Handles removing a proficiency via the feature system.
     */
    const handleRemoveProficiency = useCallback((featId: number, itemId: number) => {
        ClassProficiencyService.removeProficiency(loadedFeatures, (features) => {
            // Update featureIds based on the updated features
            const updatedFeatureIds = features.map(f => f.id).filter((id): id is number => id !== null);
            updateState({ type: ClassEditStateUpdateType.SET_FEATURE_IDS, payload: { featureIds: updatedFeatureIds } });
        }, featId, itemId);
    }, [loadedFeatures, updateState]);

    // Derive formData from state (single source of truth)
    // This is used for form validation only - tabs should use state directly
    const formData = useMemo((): ClassFormData => ({
        name: state.name,
        abbreviation: state.abbreviation,
        editionId: state.editionId,
        isPrestige: state.isPrestige,
        isVisible: state.isVisible,
        canCastSpells: state.canCastSpells,
        isDivine: state.isDivine,
        description: state.description || '',
        spellcastingProgression: state.spellcastingProgression,
        spellsKnownProgression: state.spellsKnownProgression,
        ...((id !== 'new' && id !== '0') && state.classId ? { id: state.classId } : {})
    }), [state, id]);

    // Update formData ref whenever formData changes
    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);

    // Wrapper for setFormData that updates state instead
    // This allows form validation to work while tabs use state directly
    const setFormData = useCallback((data: ClassFormData | ((prev: ClassFormData) => ClassFormData)) => {
        const newData = typeof data === 'function' ? data(formDataRef.current || formData) : data;

        // Update state via updateState for each field
        if (newData.name !== undefined && newData.name !== state.name) {
            updateState({ type: ClassEditStateUpdateType.SET_NAME, payload: { name: newData.name } });
        }
        if (newData.abbreviation !== undefined && newData.abbreviation !== state.abbreviation) {
            updateState({ type: ClassEditStateUpdateType.SET_ABBREVIATION, payload: { abbreviation: newData.abbreviation } });
        }
        if (newData.editionId !== undefined && newData.editionId !== state.editionId) {
            updateState({ type: ClassEditStateUpdateType.SET_EDITION_ID, payload: { editionId: newData.editionId } });
        }
        if (newData.isPrestige !== undefined && newData.isPrestige !== state.isPrestige) {
            updateState({ type: ClassEditStateUpdateType.SET_IS_PRESTIGE, payload: { isPrestige: newData.isPrestige } });
        }
        if (newData.isVisible !== undefined && newData.isVisible !== state.isVisible) {
            updateState({ type: ClassEditStateUpdateType.SET_IS_VISIBLE, payload: { isVisible: newData.isVisible } });
        }
        if (newData.canCastSpells !== undefined && newData.canCastSpells !== state.canCastSpells) {
            updateState({ type: ClassEditStateUpdateType.SET_CAN_CAST_SPELLS, payload: { canCastSpells: newData.canCastSpells } });
        }
        if (newData.spellsKnown !== undefined && newData.spellsKnown !== state.spellsKnown) {
            updateState({ type: ClassEditStateUpdateType.SET_SPELLS_KNOWN, payload: { spellsKnown: newData.spellsKnown } });
        }
        if (newData.isDivine !== undefined && newData.isDivine !== state.isDivine) {
            updateState({ type: ClassEditStateUpdateType.SET_IS_DIVINE, payload: { isDivine: newData.isDivine } });
        }
        if (newData.description !== undefined && newData.description !== state.description) {
            updateState({ type: ClassEditStateUpdateType.SET_DESCRIPTION, payload: { description: newData.description || null } });
        }
        // Note: spellcastingProgression and spellsKnownProgression are synced via dedicated useEffect hooks
        // and have different types in formData (CreateSpellcastingProgressionRequest[]) vs state (SpellcastingProgressionWithSlots[])
        // so we don't sync them here
    }, [state, updateState]);

    // Tab configuration - use state instead of formData
    const tabs: TabConfig[] = [
        { id: 'basic', label: 'Basic Info', icon: DocumentTextIcon, component: BasicInfoTab },
        ...(state.canCastSpells ? [{ id: 'spells', label: 'Spellcasting', icon: BeakerIcon, component: SpellcastingTab }] : []),
        { id: 'skills', label: 'Skills', icon: ShieldCheckIcon, component: SkillsTab },
        { id: 'proficiencies', label: 'Proficiencies', icon: AcademicCapIcon, component: ProficienciesTab },
        { id: 'features', label: 'Features', icon: SparklesIcon, component: FeaturesTab },
        { id: 'description', label: 'Description', icon: DocumentTextIcon, component: DescriptionTab }
    ];

    const CurrentTabComponent = tabs.find(tab => tab.id === state.activeTab)?.component;

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
                                console.warn(`Feature ${featureId} not found, removing from class feature list`);
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
                            type: ClassEditStateUpdateType.SET_FEATURE_IDS,
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
     * Handles linking a feature to the class.
     * Features are now managed independently via the feature state system.
     */
    const handleAddProgression = useCallback(async (feature: FeatureWithRelations) => {
        // Load feature data (no session needed for linking)
        // Note: We don't check if loaded because we're just linking, not editing
        await FeatureQueryHooks.getFeatureById(feature.id, queryClient);

        // Link feature to class (updates FeatureClassMap)
        updateState({ type: ClassEditStateUpdateType.LINK_FEATURE, payload: { featureId: feature.id } });

        // Sync feature link to backend draft
        if (resolution.classState && classId) {
            await resolution.updateValue('featureIds', feature.id, DraftAction.Add);
        }
    }, [updateState, resolution, classId, queryClient, state.featureIds]);

    /**
     * Handles adding a feature to the class by creating a default level 1 feature.
     */
    const handleAddFeature = useCallback(async (feature: { id: number; name: string; description: string; slug: string }) => {
        try {
            // Fetch the feature's existing features to copy entities
            const existingProgressions = await FeatureQueryHooks.getFeatureProgressions(feature.id);

            // Find the first feature with entities to copy, or use empty entities
            const sourceProgression = existingProgressions.find(p => p.entities && p.entities.length > 0);
            const entitiesToCopy = sourceProgression?.entities || [];

            const defaultProgression: FeatureWithRelations = createFeature({
                id: feature.id,
                name: feature.name,
                description: feature.description,
                slug: feature.slug,
                displayInCharacterSheet: sourceProgression?.displayInCharacterSheet ?? true,
                prerequisites: sourceProgression?.prerequisites || [],
                entities: entitiesToCopy.map(entity => ({
                    ...entity,
                    id: null, // Backend will generate ID
                    // featureId will be set when feature is saved (FeatureEntity.featureId references Feature.id)
                }))
            });

            // Link feature to class
            updateState({ type: ClassEditStateUpdateType.LINK_FEATURE, payload: { featureId: feature.id } });

            // Sync feature link to backend draft
            if (resolution.classState && classId) {
                await resolution.updateValue('featureIds', feature.id, DraftAction.Add);
            }
        } catch (error) {
            console.error('Failed to link feature:', error);
        }
    }, [updateState, resolution, classId, state.featureIds, createFeature]);

    /**
     * Handles unlinking a feature from the class.
     * Features are now managed independently via the feature state system.
     */
    const handleRemoveProgression = useCallback(async (featureId: number) => {
        // Unlink feature from class (updates FeatureClassMap)
        updateState({ type: ClassEditStateUpdateType.UNLINK_FEATURE, payload: { featureId } });

        // Sync feature unlink to backend draft
        if (resolution.classState && classId) {
            await resolution.updateValue('featureIds', featureId, DraftAction.Remove);
        }
    }, [updateState, resolution, classId, state.featureIds]);

    /**
     * Handles updating a feature.
     * Features are now managed independently via the feature state system.
     * This handler is called when FeatureEditForm saves a feature.
     * The feature state is already updated by FeatureEditForm, so we just need to
     * ensure the feature is linked to the class if it isn't already.
     */
    const handleUpdateProgression = useCallback(async (oldProgression: FeatureWithRelations, updatedProgression: FeatureWithRelations) => {
        // Feature state is already updated by FeatureEditForm via the state system
        // Just ensure it's linked to the class
        if (!state.featureIds.includes(updatedProgression.id)) {
            updateState({ type: ClassEditStateUpdateType.LINK_FEATURE, payload: { featureId: updatedProgression.id } });

            if (resolution.classState && classId) {
                await resolution.updateValue('featureIds', updatedProgression.id, DraftAction.Add);
            }
        }
    }, [updateState, state.featureIds, resolution, classId]);

    /**
     * Opens the feature dialog for editing an existing feature.
     */
    const handleEditProgression = useCallback((feature: FeatureWithRelations) => {
        updateState({ type: ClassEditStateUpdateType.SET_EDITING_FEATURE_ID, payload: { editingFeatureId: feature.id } });
    }, [updateState]);

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

    // Initialize cls for new classes (used by some legacy code)
    // formData is derived from state, so cls will update automatically when state changes
    useEffect(() => {
        if (id === 'new' || id === '0') {
            setCls(formData);
        }
    }, [id, formData]);

    // Track previous state values to avoid unnecessary syncs
    const prevClassFieldsRef = useRef<{
        name?: string;
        abbreviation?: string;
        editionId?: number;
        isPrestige?: boolean;
        isVisible?: boolean;
        canCastSpells?: boolean;
        spellsKnown?: boolean;
        isDivine?: boolean;
        description?: string | null;
        sourceBookInfo?: SourceMap[] | null;
    }>({});

    // Use refs to access resolution values to avoid dependency on changing references
    const resolutionRef = useRef(resolution);
    useEffect(() => {
        resolutionRef.current = resolution;
    }, [resolution]);

    /**
     * Sync class field changes to backend session.
     * 
     * Automatically syncs class field changes to the resolution session.
     * Watches class fields for changes.
     * Uses updateValue for path-based field updates.
     */
    useEffect(() => {
        // Only sync if class state is loaded and we have a class ID
        if (!classId || !resolutionRef.current.classState) {
            return;
        }

        // Early return if state fields haven't changed (prevents unnecessary re-runs)
        const stateFieldsChanged =
            state.name !== prevClassFieldsRef.current.name ||
            state.abbreviation !== prevClassFieldsRef.current.abbreviation ||
            state.editionId !== prevClassFieldsRef.current.editionId ||
            state.isPrestige !== prevClassFieldsRef.current.isPrestige ||
            state.isVisible !== prevClassFieldsRef.current.isVisible ||
            state.canCastSpells !== prevClassFieldsRef.current.canCastSpells ||
            state.spellsKnown !== prevClassFieldsRef.current.spellsKnown ||
            state.isDivine !== prevClassFieldsRef.current.isDivine ||
            state.description !== prevClassFieldsRef.current.description ||
            !isEqual(state.sourceBookInfo, prevClassFieldsRef.current.sourceBookInfo);

        // If nothing has changed, skip this run entirely
        if (!stateFieldsChanged) {
            return;
        }

        // Don't sync during initialization to prevent loops
        if (isInitializingRef.current) {
            return;
        }

        // Initialize refs on first session availability (don't send update on initial sync)
        if (prevClassFieldsRef.current.name === undefined) {
            prevClassFieldsRef.current = {
                name: state.name,
                abbreviation: state.abbreviation,
                editionId: state.editionId,
                isPrestige: state.isPrestige,
                isVisible: state.isVisible,
                canCastSpells: state.canCastSpells,
                spellsKnown: state.spellsKnown,
                isDivine: state.isDivine,
                description: state.description,
                sourceBookInfo: state.sourceBookInfo,
            };
            return;
        }

        // Don't sync if current state matches session state (prevents loop during initialization)
        if (resolutionRef.current.classState) {
            const sessionState = resolutionRef.current.classState;
            const stateMatchesSession =
                state.name === sessionState.name &&
                state.abbreviation === sessionState.abbreviation &&
                state.editionId === sessionState.editionId &&
                state.isPrestige === sessionState.isPrestige &&
                state.isVisible === sessionState.isVisible &&
                state.canCastSpells === sessionState.canCastSpells &&
                state.spellsKnown === sessionState.spellsKnown &&
                state.isDivine === sessionState.isDivine &&
                state.description === sessionState.description &&
                isEqual(state.sourceBookInfo, sessionState.sourceBookInfo);

            if (stateMatchesSession) {
                // Update prev refs to match current state
                prevClassFieldsRef.current = {
                    name: state.name,
                    abbreviation: state.abbreviation,
                    editionId: state.editionId,
                    isPrestige: state.isPrestige,
                    isVisible: state.isVisible,
                    canCastSpells: state.canCastSpells,
                    spellsKnown: state.spellsKnown,
                    isDivine: state.isDivine,
                    description: state.description,
                    sourceBookInfo: state.sourceBookInfo,
                };
                return;
            }
        }

        // Sync individual field changes
        const fieldsToSync: Array<{ field: string; value: unknown }> = [];

        if (state.name !== prevClassFieldsRef.current.name) {
            fieldsToSync.push({ field: 'name', value: state.name });
        }
        if (state.abbreviation !== prevClassFieldsRef.current.abbreviation) {
            fieldsToSync.push({ field: 'abbreviation', value: state.abbreviation });
        }
        if (state.editionId !== prevClassFieldsRef.current.editionId) {
            fieldsToSync.push({ field: 'editionId', value: state.editionId });
        }
        if (state.isPrestige !== prevClassFieldsRef.current.isPrestige) {
            fieldsToSync.push({ field: 'isPrestige', value: state.isPrestige });
        }
        if (state.isVisible !== prevClassFieldsRef.current.isVisible) {
            fieldsToSync.push({ field: 'isVisible', value: state.isVisible });
        }
        if (state.canCastSpells !== prevClassFieldsRef.current.canCastSpells) {
            fieldsToSync.push({ field: 'canCastSpells', value: state.canCastSpells });
        }
        if (state.spellsKnown !== prevClassFieldsRef.current.spellsKnown) {
            fieldsToSync.push({ field: 'spellsKnown', value: state.spellsKnown });
        }
        if (state.isDivine !== prevClassFieldsRef.current.isDivine) {
            fieldsToSync.push({ field: 'isDivine', value: state.isDivine });
        }
        if (state.description !== prevClassFieldsRef.current.description) {
            fieldsToSync.push({ field: 'description', value: state.description });
        }
        if (!isEqual(state.sourceBookInfo, prevClassFieldsRef.current.sourceBookInfo)) {
            fieldsToSync.push({ field: 'sourceBookInfo', value: state.sourceBookInfo });
        }

        // Apply all field updates using updateValue
        fieldsToSync.forEach(({ field, value }) => {
            resolutionRef.current.updateValue(field, value).catch(error => {
                console.error(`Failed to sync ${field} change to session:`, error);
            });
        });

        // Update refs
        prevClassFieldsRef.current = {
            name: state.name,
            abbreviation: state.abbreviation,
            editionId: state.editionId,
            isPrestige: state.isPrestige,
            isVisible: state.isVisible,
            canCastSpells: state.canCastSpells,
            spellsKnown: state.spellsKnown,
            isDivine: state.isDivine,
            description: state.description,
            sourceBookInfo: state.sourceBookInfo,
        };
    }, [classId, state.name, state.abbreviation, state.editionId, state.isPrestige, state.isVisible, state.canCastSpells, state.spellsKnown, state.isDivine, state.description, state.sourceBookInfo]);

    /**
     * Sync spellcasting feature to backend session.
     * Uses updateValue for path-based field updates.
     */
    useEffect(() => {
        if (!classId || !resolutionRef.current.classState) {
            return;
        }

        // Don't sync during initialization to prevent loops
        if (isInitializingRef.current) {
            return;
        }

        // Don't sync if current state matches session state (prevents loop during initialization)
        if (resolutionRef.current.classState && isEqual(state.spellcastingProgression, resolutionRef.current.classState.spellcastingProgression)) {
            prevSpellcastingRef.current = state.spellcastingProgression;
            return;
        }

        const currentSpellcasting = state.spellcastingProgression;
        if (prevSpellcastingRef.current && isEqual(prevSpellcastingRef.current, currentSpellcasting)) {
            return;
        }

        if (!prevSpellcastingRef.current) {
            prevSpellcastingRef.current = currentSpellcasting;
            return;
        }

        resolutionRef.current.updateValue('spellcastingProgression', state.spellcastingProgression || []).catch(error => {
            console.error('Failed to sync spellcasting progression:', error);
        });

        prevSpellcastingRef.current = currentSpellcasting;
    }, [classId, state.spellcastingProgression]);

    /**
     * Sync spells known feature to backend session.
     * Uses updateValue for path-based field updates.
     */
    useEffect(() => {
        if (!classId || !resolutionRef.current.classState) {
            return;
        }

        // Don't sync during initialization to prevent loops
        if (isInitializingRef.current) {
            return;
        }

        // Don't sync if current state matches session state (prevents loop during initialization)
        if (resolutionRef.current.classState && isEqual(state.spellsKnownProgression, resolutionRef.current.classState.spellsKnownProgression)) {
            prevSpellsKnownRef.current = state.spellsKnownProgression;
            return;
        }

        const currentSpellsKnown = state.spellsKnownProgression;
        if (prevSpellsKnownRef.current && isEqual(prevSpellsKnownRef.current, currentSpellsKnown)) {
            return;
        }

        if (!prevSpellsKnownRef.current) {
            prevSpellsKnownRef.current = currentSpellsKnown;
            return;
        }

        resolutionRef.current.updateValue('spellsKnownProgression', state.spellsKnownProgression).catch(error => {
            console.error('Failed to sync spells known progression:', error);
        });

        prevSpellsKnownRef.current = currentSpellsKnown;
    }, [classId, state.spellsKnownProgression]);

    // Handle new feature from association dialog
    useEffect(() => {
        if (location.state?.newFeature && !processedNewFeatureRef.current) {
            const newFeature = location.state.newFeature;
            processedNewFeatureRef.current = true;

            // Add the new feature feature to the list
            const newProgression: FeatureWithRelations = createFeature({
                id: newFeature.featureId,
                name: newFeature.name,
                description: newFeature.description || '',
                slug: newFeature.slug,
                displayInCharacterSheet: true,
                summary: null,
                entities: [],
            });
            // Link the new feature to the class
            if (newProgression.id) {
                updateState({ type: ClassEditStateUpdateType.LINK_FEATURE, payload: { featureId: newProgression.id } });
            }
            // Clear the state
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state?.newFeature, navigate, location.pathname, createFeature, updateState]);

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
                // For new classes, we need to create via the regular API first
                // Then we can use the session system for future edits
                const classData: CreateClassRequest = {
                    name: state.name,
                    abbreviation: state.abbreviation,
                    editionId: state.editionId,
                    isPrestige: state.isPrestige,
                    isVisible: state.isVisible,
                    canCastSpells: state.canCastSpells,
                    spellsKnown: state.spellsKnown,
                    isDivine: state.isDivine,
                    description: state.description || '',
                    featureIds: state.featureIds,
                    spellcastingProgression: state.spellcastingProgression.map(prog => {
                        const { id: _, classId: __, ...progressionData } = prog;
                        return {
                            ...progressionData,
                            slots: prog.slots?.map(slot => {
                                const { id: _, progressionId: __, ...slotData } = slot;
                                return slotData;
                            }) || []
                        };
                    }),
                    spellsKnownProgression: state.spellsKnownProgression.map(prog => {
                        const { id: _, classId: __, ...progressionData } = prog;
                        return {
                            ...progressionData,
                            slots: prog.slots?.map(slot => {
                                const { id: _, progressionId: __, ...slotData } = slot;
                                return slotData;
                            }) || []
                        };
                    })
                };

                const newClass = await ClassApi.createClass(classData);
                setMessage('Class created successfully!');
                // Invalidate class caches
                await queryClient.invalidateQueries({
                    queryKey: ['classes'],
                    exact: false
                });
                setTimeout(() => navigate(`/classes/${newClass.id}`), 1500);
            } else {
                // For existing classes, use session save
                if (!resolution.classState) {
                    setError('Class state not loaded. Please wait for the state to load.');
                    return;
                }

                await resolution.save();
                setMessage('Class updated successfully!');

                // Invalidate class caches
                const numericId = parseInt(id);
                await queryClient.invalidateQueries({
                    queryKey: ClassQueryHooks.getClassByIdQueryKey(numericId)
                });
                await queryClient.invalidateQueries({
                    queryKey: ['classes'],
                    exact: false
                });

                navigate(`/classes/${id}`, { state: { fromListParams: location.state?.fromListParams, refresh: true } });
            }
        } catch (err) {
            console.error('Error saving class:', err);

            // Check if this is a validation error with field paths
            if (err instanceof Error && 'validationErrors' in err) {
                const validationErrors = (err as { validationErrors?: Array<{ path: string; message: string; code: string }> }).validationErrors;
                if (validationErrors && Array.isArray(validationErrors)) {
                    // Format validation errors for display
                    const errorMessages = validationErrors.map(err => `${err.path}: ${err.message}`).join(', ');
                    setError(`Validation errors: ${errorMessages}`);
                    // TODO: Highlight invalid form fields using error paths
                    console.error('Validation errors saving class:', validationErrors);
                } else {
                    setError(err.message || 'Failed to save class');
                }
            } else {
                // Try to extract more detailed error information
                let errorMessage = 'Failed to save class';
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
            }
        } finally {
            setIsSaving(false);
        }
    };

    // Show loading state while session is initializing (for existing classes)
    if ((id !== 'new' && id !== '0') && resolution.isLoading && !resolution.classState) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    // Show error state
    const displayError = resolution.error || error;
    if (displayError && !resolution.classState && (id !== 'new' && id !== '0')) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-red-500 mb-4">{displayError}</p>
                <button
                    onClick={() => navigate('/classes')}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Back to Classes
                </button>
            </div>
        );
    }

    // For new classes, ensure we have initial form data
    if ((id === 'new' || id === '0') && !cls) {
        setCls(formData);
    }

    // Group features by feature for display (using loadedFeatures)
    const featuresByFeature = loadedFeatures.reduce((acc, feature) => {
        const featureId = feature.id;
        if (!acc[featureId]) {
            acc[featureId] = {
                feature: {
                    id: feature.id,
                    name: feature.name,
                    description: feature.description || '',
                    slug: feature.slug
                },
                features: []
            };
        }
        acc[featureId].features.push(feature);
        return acc;
    }, {} as Record<number, { feature: { id: number; name: string; description: string; slug: string }; features: FeatureWithRelations[] }>);

    return (
        <div className="w-4/5 mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">
                    {id === 'new'
                        ? 'Create New Class'
                        : 'Edit Class'
                    }
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
                                        onClick={() => updateState({ type: ClassEditStateUpdateType.SET_ACTIVE_TAB, payload: { activeTab: tab.id } })}
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
                                    updateState({ type: ClassEditStateUpdateType.SET_FEATURE_IDS, payload: { featureIds: updatedFeatureIds } });
                                }}
                                spellcastingProgression={state.spellcastingProgression}
                                setSpellcastingProgression={(progression) => updateState({ type: ClassEditStateUpdateType.SET_SPELLCASTING_PROGRESSION, payload: { progression } })}
                                spellsKnownProgression={state.spellsKnownProgression}
                                setSpellsKnownProgression={(progression) => updateState({ type: ClassEditStateUpdateType.SET_SPELLS_KNOWN_PROGRESSION, payload: { progression } })}
                                isFeatureAssocOpen={state.isFeatureAssocOpen}
                                setIsFeatureAssocOpen={(open) => updateState({ type: ClassEditStateUpdateType.SET_IS_FEATURE_ASSOC_OPEN, payload: { isFeatureAssocOpen: open } })}
                                // editingFeatureId and preSelectedFeatureId are handled internally by FeaturesManager
                                onRemoveProgression={handleRemoveProgression}
                                onAddFeature={handleAddFeature}
                                onEditProgression={handleEditProgression}
                                onLinkFeatureId={async (featureId) => {
                                    if (resolution.classState && classId) {
                                        await resolution.updateValue('featureIds', featureId, DraftAction.Add);
                                    }
                                }}
                                onUnlinkFeatureId={async (featureId) => {
                                    if (resolution.classState && classId) {
                                        await resolution.updateValue('featureIds', featureId, DraftAction.Remove);
                                    }
                                }}
                                onAddSkill={handleAddSkill}
                                onRemoveSkill={handleRemoveSkill}
                                onAddProficiency={handleAddProficiency}
                                onRemoveProficiency={handleRemoveProficiency}
                                classId={(id !== 'new' && id !== '0') ? parseInt(id) : undefined}
                            />
                        )}
                    </div>
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
                        {isLoading ? 'Saving...' : (id === 'new' || id === '0') ? 'Create Class' : 'Update Class'}
                    </button>
                </div>
            </ValidatedForm>

            {/* Class Feature Association Dialog */}
            <ClassFeatureAssoc
                isOpen={state.isFeatureAssocOpen}
                onClose={() => updateState({ type: ClassEditStateUpdateType.SET_IS_FEATURE_ASSOC_OPEN, payload: { isFeatureAssocOpen: false } })}
                onSave={(_selectedFeatures) => {
                    // The FeaturesManager component handles the change detection logic
                    // This onSave handler is not used - the actual logic is in FeaturesManager.tsx
                    console.warn('ClassEdit onSave handler called but not used - change detection handled by FeaturesManager');
                    updateState({ type: ClassEditStateUpdateType.SET_IS_FEATURE_ASSOC_OPEN, payload: { isFeatureAssocOpen: false } });
                }}
                initialSelectedFeatureIds={state.featureIds.filter(featureId => {
                    // Filter out class skills and proficiencies (identified by Base entities)
                    const feature = loadedFeatures.find(f => f.id === featureId);
                    if (!feature) return true;
                    const hasClassSkills = feature.sourceType === FeatureSourceType.Class &&
                        feature.entities?.some(e => e.type === EntityType.Base && e.appliesTo === EntityAppliesToType.Skill);
                    const hasProficiencies = feature.sourceType === FeatureSourceType.Class &&
                        feature.entities?.some(e => e.type === EntityType.Base && e.appliesTo === EntityAppliesToType.Proficiency);
                    return !hasClassSkills && !hasProficiencies;
                })}
                classId={id !== 'new' ? parseInt(id) : undefined}
            />

            {/* Feature Edit Dialog */}
            <FeatureEditForm
                isOpen={!!state.editingFeatureId || !!state.preSelectedFeatureId}
                onClose={() => {
                    updateState({ type: ClassEditStateUpdateType.SET_EDITING_FEATURE_ID, payload: { editingFeatureId: null } });
                    updateState({ type: ClassEditStateUpdateType.SET_PRE_SELECTED_FEATURE_ID, payload: { preSelectedFeatureId: undefined } });
                }}
                featureId={
                    // Use 0 for new features
                    state.editingFeatureId && state.editingFeatureId > 0
                        ? state.editingFeatureId
                        : state.preSelectedFeatureId && state.preSelectedFeatureId > 0
                            ? state.preSelectedFeatureId
                            : 0
                }
                onSave={async (featureId: number) => {
                    // Ensure the featureId is in the class's feature list
                    // The feature was already saved via state system, we just need to track its ID
                    // The useEffect hook will automatically sync the link to the backend
                    const currentFeatureIds = state.featureIds || [];
                    if (!currentFeatureIds.includes(featureId)) {
                        // Add the feature ID to the class's feature list
                        updateState({
                            type: ClassEditStateUpdateType.LINK_FEATURE,
                            payload: { featureId }
                        });
                    }

                    // Refresh session state to get updated feature data from backend
                    if (state.editingFeatureId && resolution.refreshState) {
                        await resolution.refreshState();
                    }

                    updateState({ type: ClassEditStateUpdateType.SET_EDITING_FEATURE_ID, payload: { editingFeatureId: null } });
                    updateState({ type: ClassEditStateUpdateType.SET_PRE_SELECTED_FEATURE_ID, payload: { preSelectedFeatureId: undefined } });
                }}
                mode="modal"
                context={
                    classId
                        ? {
                            sourceType: FeatureSourceType.Class,
                            parentId: classId,
                            parentType: 'class',
                            editionId: state.editionId ?? null
                        }
                        : undefined
                }
            />
        </div>
    );
}
