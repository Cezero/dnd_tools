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

import { FeatureProgressionDetailEdit } from '@/components/feature-system';
import { FeatureSystemApi } from '@/components/feature-system/FeatureSystemApi';
import {
    ValidatedForm,
    useValidatedForm,
} from '@/components/forms';
import { ClassQueryHooks } from '@/services/query/ClassQueryHooks';
import {
    CreateClassSchema,
    UpdateClassSchema,
    CreateClassRequest,
    FeatureProgression,
    FeatureEntity,
} from '@shared/schema';
import {
    EntityType,
    SpecialFeatureId,
    EntityAppliesToType,
    FeatureSourceType,
    ClassUpdateType,
} from '@shared/static-data';

import { ClassApi } from './ClassApi';
import { ClassFeatureAssoc } from './ClassFeatureAssoc';
import { ClassProficiencyService } from './ClassProficiencyService';
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
    const classId = id !== 'new' ? parseInt(id) : null;
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
     * Helper function to create a feature progression.
     * 
     * **Backend-Managed IDs Pattern**: The backend now handles all ID generation.
     * For new progressions, we set id to null and let the backend generate IDs.
     * 
     * @param baseProgression - Partial progression data to merge with defaults
     * @returns A complete FeatureProgression with id: null for new items
     */
    const createFeatureProgression = useCallback((baseProgression: Partial<FeatureProgression>): FeatureProgression => {
        return {
            id: null, // Backend will generate ID
            sourceType: FeatureSourceType.Class,
            classId: classId || 0,
            raceId: null,
            domainId: null, // Set domainId to null for class-based progressions
            level: 1, // Default to level 1
            ...baseProgression,
        } as FeatureProgression;
    }, [classId]);

    // Ref to track if we've already processed the newFeature
    const processedNewFeatureRef = useRef<boolean>(false);
    // Ref to track current preSelectedFeature
    const preSelectedFeatureRef = useRef<FeatureProgression['feature'] | undefined>(undefined);

    // Update ref when preSelectedFeature changes
    useEffect(() => {
        preSelectedFeatureRef.current = state.preSelectedFeature;
    }, [state.preSelectedFeature]);

    // Track previous values to avoid unnecessary updates and infinite loops
    const prevStateRef = useRef<typeof resolution.classState>(null);

    /**
     * Initialize state from session when classState becomes available.
     * This happens after the session is initialized or resumed.
     */
    useEffect(() => {
        if (!resolution.classState) {
            return;
        }

        // Only update if the state has actually changed (avoid infinite loops)
        const currentState = resolution.classState;
        if (prevStateRef.current && isEqual(prevStateRef.current, currentState)) {
            return;
        }
        prevStateRef.current = currentState;

        // Populate state from session
        const sessionState = resolution.classState!;
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
        updateState({ type: ClassEditStateUpdateType.SET_FEATURE_PROGRESSIONS, payload: { featureProgressions: sessionState.featureProgressions } });
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
    }, [resolution.classState, updateState, classId, resolution]);

    // Determine which schema to use based on whether we're creating or editing
    const schema = useMemo(() => {
        return id === 'new' ? CreateClassSchema : UpdateClassSchema;
    }, [id]);

    /**
     * Handles adding a class skill via the feature system.
     */
    const handleAddSkill = useCallback((skillId: number) => {
        ClassSkillService.addSkill(state.featureProgressions, (progressions) => {
            updateState({ type: ClassEditStateUpdateType.SET_FEATURE_PROGRESSIONS, payload: { featureProgressions: progressions } });
        }, skillId, classId || 0);
    }, [state.featureProgressions, updateState, classId]);

    /**
     * Handles removing a class skill via the feature system.
     */
    const handleRemoveSkill = useCallback((skillId: number) => {
        ClassSkillService.removeSkill(state.featureProgressions, (progressions) => {
            updateState({ type: ClassEditStateUpdateType.SET_FEATURE_PROGRESSIONS, payload: { featureProgressions: progressions } });
        }, skillId);
    }, [state.featureProgressions, updateState]);

    /**
     * Handles adding a proficiency via the feature system.
     */
    const handleAddProficiency = useCallback(async (featId: number, itemId: number) => {
        try {
            const prev = state.featureProgressions;
            // Check if class proficiency progression already exists
            let classProficiencyProgression = prev.find(fp =>
                fp.featureId === SpecialFeatureId.ClassProficiency
            );

            let updatedProgressions = prev;
            if (!classProficiencyProgression) {
                // Create the main class proficiency progression if it doesn't exist
                classProficiencyProgression = createFeatureProgression({
                    featureId: SpecialFeatureId.ClassProficiency,
                    feature: {
                        id: SpecialFeatureId.ClassProficiency,
                        slug: 'class-proficiency',
                        name: 'Class Proficiency',
                        description: 'Class proficiency feature',
                        displayInCharacterSheet: true,
                    },
                    entities: []
                });
                updatedProgressions = [...prev, classProficiencyProgression];
            }

            // Check if this specific proficiency already exists
            const existingProficiency = classProficiencyProgression.entities?.find(e =>
                e.appliesTo === EntityAppliesToType.Proficiency &&
                e.appliesToId === featId &&
                e.appliesToSubId === itemId
            );

            if (existingProficiency) {
                return;
            }

            // Add the proficiency as an entity
            // Note: featId parameter is actually the proficiency type ID (from ProficiencyFeat.proficiencyTypeId)
            const newEntity: FeatureEntity = {
                id: null, // Backend will generate ID
                progressionId: classProficiencyProgression.id || 0,
                type: EntityType.Other,
                value: 0,
                appliesTo: EntityAppliesToType.Proficiency,
                appliesToId: featId, // This is actually the proficiency type ID
                appliesToSubId: itemId,
                bonusType: null,
                filterType: null,
                groupingId: 1, // Group all class proficiencies together as one feature
                displayInDetail: true,
            };

            // Create a new array with the updated progression
            const finalProgressions = updatedProgressions.map(p => {
                if (p.id === classProficiencyProgression.id) {
                    return {
                        ...p,
                        entities: [...(p.entities || []), newEntity]
                    };
                }
                return p;
            });

            updateState({ type: ClassEditStateUpdateType.SET_FEATURE_PROGRESSIONS, payload: { featureProgressions: finalProgressions } });
        } catch (error) {
            console.error('Failed to add proficiency:', error);
        }
    }, [state.featureProgressions, createFeatureProgression, updateState]);

    /**
     * Handles removing a proficiency via the feature system.
     */
    const handleRemoveProficiency = useCallback((featId: number, itemId: number) => {
        ClassProficiencyService.removeProficiency(state.featureProgressions, (progressions) => {
            updateState({ type: ClassEditStateUpdateType.SET_FEATURE_PROGRESSIONS, payload: { featureProgressions: progressions } });
        }, featId, itemId);
    }, [state.featureProgressions, updateState]);

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
        ...(id !== 'new' && state.classId ? { id: state.classId } : {})
    }), [state, id]);

    // Wrapper for setFormData that updates state instead
    // This allows form validation to work while tabs use state directly
    const setFormData = useCallback((data: ClassFormData | ((prev: ClassFormData) => ClassFormData)) => {
        const newData = typeof data === 'function' ? data(formData) : data;

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
    }, [formData, state, updateState]);

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

    /**
     * Handles adding a feature progression to the class.
     */
    const handleAddProgression = useCallback((progression: FeatureProgression) => {
        // The progression should now include feature data from FeatureProgressionDetailEdit
        // But provide fallback in case it doesn't
        const progressionWithFeature = {
            ...progression,
            feature: progression.feature || (preSelectedFeatureRef.current ? {
                id: preSelectedFeatureRef.current.id,
                name: preSelectedFeatureRef.current.name,
                description: preSelectedFeatureRef.current.description || '',
                slug: preSelectedFeatureRef.current.slug,
                displayInCharacterSheet: true,
            } : {
                id: progression.featureId,
                name: `Feature ${progression.featureId}`,
                description: '',
                slug: `feature-${progression.featureId}`,
                displayInCharacterSheet: true,
            })
        };

        // Always add as a new progression - allow multiple progressions per feature/level
        updateState({ type: ClassEditStateUpdateType.ADD_FEATURE_PROGRESSION, payload: { progression: progressionWithFeature } });
    }, [updateState]);

    /**
     * Handles adding a feature to the class by creating a default level 1 progression.
     */
    const handleAddFeature = useCallback(async (feature: { id: number; name: string; description: string; slug: string }) => {
        try {
            // Fetch the feature's existing progressions to copy entities
            const existingProgressions = await FeatureSystemApi.getFeatureProgressions(undefined, { id: feature.id });

            // Find the first progression with entities to copy, or use empty entities
            const sourceProgression = existingProgressions.find(p => p.entities && p.entities.length > 0);
            const entitiesToCopy = sourceProgression?.entities || [];

            const defaultProgression: FeatureProgression = createFeatureProgression({
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
            });

            updateState({ type: ClassEditStateUpdateType.ADD_FEATURE_PROGRESSION, payload: { progression: defaultProgression } });
        } catch (error) {
            console.error('Failed to fetch feature progressions:', error);
            // Fallback to creating progression without entities
            const defaultProgression: FeatureProgression = createFeatureProgression({
                featureId: feature.id,
                feature: {
                    id: feature.id,
                    name: feature.name,
                    description: feature.description,
                    slug: feature.slug,
                    displayInCharacterSheet: true,
                },
                entities: [],
            });
            updateState({ type: ClassEditStateUpdateType.ADD_FEATURE_PROGRESSION, payload: { progression: defaultProgression } });
        }
    }, [createFeatureProgression, updateState]);

    /**
     * Handles the removal of a feature progression from the class.
     */
    const handleRemoveProgression = useCallback((progressionId: number) => {
        updateState({ type: ClassEditStateUpdateType.REMOVE_FEATURE_PROGRESSION, payload: { progressionId } });
    }, [updateState]);

    /**
     * Handles updating a feature progression.
     */
    const handleUpdateProgression = useCallback((oldProgression: FeatureProgression, updatedProgression: FeatureProgression) => {
        if (oldProgression.id) {
            updateState({ type: ClassEditStateUpdateType.UPDATE_FEATURE_PROGRESSION, payload: { progressionId: oldProgression.id, progression: updatedProgression } });
        } else {
            // If no ID, just add as new
            updateState({ type: ClassEditStateUpdateType.ADD_FEATURE_PROGRESSION, payload: { progression: updatedProgression } });
        }
    }, [updateState]);

    /**
     * Opens the progression dialog for editing an existing progression.
     */
    const handleEditProgression = useCallback((progression: FeatureProgression) => {
        updateState({ type: ClassEditStateUpdateType.SET_EDITING_PROGRESSION, payload: { editingProgression: progression } });
        updateState({ type: ClassEditStateUpdateType.SET_IS_PROGRESSION_DIALOG_OPEN, payload: { isProgressionDialogOpen: true } });
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
        if (id === 'new') {
            setCls(formData);
        }
    }, [id, formData, setFormData]);

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
    }>({});

    /**
     * Sync class field changes to backend session.
     * 
     * Automatically syncs class field changes to the resolution session.
     * Watches class fields for changes.
     */
    useEffect(() => {
        const { sessionId, applyUpdate } = resolution;

        // Only sync if session is initialized and we have a class ID
        if (!classId || !sessionId) {
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
            };
            return;
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

        // Apply all field updates
        fieldsToSync.forEach(({ field, value }) => {
            applyUpdate({
                type: ClassUpdateType.UpdateClassField,
                payload: { field, value }
            }).catch(error => {
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
        };
    }, [classId, resolution, state.name, state.abbreviation, state.editionId, state.isPrestige, state.isVisible, state.canCastSpells, state.spellsKnown, state.isDivine, state.description]);

    // Track previous progressions to detect changes
    const prevProgressionsRef = useRef<FeatureProgression[]>([]);
    const prevSpellcastingRef = useRef<typeof state.spellcastingProgression | null>(null);
    const prevSpellsKnownRef = useRef<typeof state.spellsKnownProgression | null>(null);

    /**
     * Sync feature progressions to backend session.
     * 
     * Detects ADD/UPDATE/REMOVE operations by comparing previous and current progressions.
     */
    useEffect(() => {
        const { sessionId, applyUpdate } = resolution;

        if (!classId || !sessionId) {
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
                    type: ClassUpdateType.RemoveProgression,
                    payload: { progressionId: progression.id }
                }).catch(error => {
                    console.error('Failed to sync progression removal:', error);
                });
            }
        });

        // Detect added progressions
        // This includes:
        // 1. New progressions with null ID
        // 2. Progressions that got IDs assigned by backend (were null, now have ID) - match by featureId/level
        // 3. Progressions with IDs that weren't in previous list
        const addedProgressions = currentProgressions.filter(curr => {
            // If it has an ID, check if it was in previous list
            if (curr.id) {
                const wasInPrevious = prevProgressions.some(prev => prev.id === curr.id);
                if (wasInPrevious) return false; // Already exists, not new

                // Check if this was a null-ID progression that got an ID assigned
                // Match by featureId and level
                const wasNullIdProgression = prevProgressions.some(prev =>
                    !prev.id && prev.featureId === curr.featureId && prev.level === curr.level
                );
                if (wasNullIdProgression) {
                    // This progression got an ID assigned - don't add again, it will be handled by update
                    return false;
                }

                // New progression with ID
                return true;
            }

            // New progression without ID - check if we already have a matching null-ID progression
            const hasMatchingNullId = prevProgressions.some(prev =>
                !prev.id && prev.featureId === curr.featureId && prev.level === curr.level
            );
            if (hasMatchingNullId) {
                // This is the same progression, just hasn't gotten an ID yet
                return false;
            }

            // Brand new progression
            return true;
        });

        addedProgressions.forEach(progression => {
            applyUpdate({
                type: ClassUpdateType.AddProgression,
                payload: { progression }
            }).catch(error => {
                console.error('Failed to sync progression addition:', error);
            });
        });

        // Detect updated progressions
        // This includes:
        // 1. Progressions with IDs that changed
        // 2. Progressions that got IDs assigned (were null, now have ID) - match by featureId/level
        currentProgressions.forEach(current => {
            let previous: FeatureProgression | undefined;

            if (current.id) {
                // Progression with ID - find by ID
                previous = prevProgressions.find(p => p.id === current.id);

                // Also check if this was a null-ID progression that got an ID
                if (!previous) {
                    previous = prevProgressions.find(p =>
                        !p.id && p.featureId === current.featureId && p.level === current.level
                    );
                }
            } else {
                // Progression without ID - find by featureId and level
                previous = prevProgressions.find(p =>
                    !p.id && p.featureId === current.featureId && p.level === current.level
                );
            }

            if (previous) {
                // Compare objects to detect changes (excluding entities for now)
                const prevWithoutEntities = { ...previous, entities: undefined };
                const currWithoutEntities = { ...current, entities: undefined };

                const changes: Partial<FeatureProgression> = {};
                let hasChanges = false;

                if (!isEqual(prevWithoutEntities, currWithoutEntities)) {
                    if (previous.level !== current.level) {
                        changes.level = current.level;
                        hasChanges = true;
                    }
                    if (previous.featureId !== current.featureId) {
                        changes.featureId = current.featureId;
                        hasChanges = true;
                    }
                    if (previous.editionId !== current.editionId) {
                        changes.editionId = current.editionId;
                        hasChanges = true;
                    }
                    if (previous.domainId !== current.domainId) {
                        changes.domainId = current.domainId;
                        hasChanges = true;
                    }
                    if (previous.featId !== current.featId) {
                        changes.featId = current.featId;
                        hasChanges = true;
                    }
                    if (previous.companionId !== current.companionId) {
                        changes.companionId = current.companionId;
                        hasChanges = true;
                    }
                    if (previous.sourceType !== current.sourceType) {
                        changes.sourceType = current.sourceType;
                        hasChanges = true;
                    }
                }

                // Check entity changes separately (more complex diff)
                if (!isEqual(previous.entities || [], current.entities || [])) {
                    // For now, sync entire entities array. Could be optimized to detect individual entity changes.
                    changes.entities = current.entities;
                    hasChanges = true;
                }

                // Check display conditions
                if (!isEqual(previous.displayConditions || [], current.displayConditions || [])) {
                    changes.displayConditions = current.displayConditions;
                    hasChanges = true;
                }

                if (hasChanges) {
                    applyUpdate({
                        type: ClassUpdateType.UpdateProgression,
                        payload: { progressionId: current.id, progression: changes }
                    }).catch(error => {
                        console.error('Failed to sync progression update:', error);
                    });
                }
            }
        });

        // Update ref for next comparison
        prevProgressionsRef.current = [...currentProgressions];
    }, [classId, resolution, state.featureProgressions]);

    /**
     * Sync spellcasting progression to backend session.
     */
    useEffect(() => {
        if (!classId || !resolution.sessionId) {
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

        resolution.applyUpdate({
            type: ClassUpdateType.SetSpellcastingProgression,
            payload: { progression: state.spellcastingProgression }
        }).catch(error => {
            console.error('Failed to sync spellcasting progression:', error);
        });

        prevSpellcastingRef.current = currentSpellcasting;
    }, [classId, resolution.sessionId, resolution.applyUpdate, state.spellcastingProgression, resolution]);

    /**
     * Sync spells known progression to backend session.
     */
    useEffect(() => {
        if (!classId || !resolution.sessionId) {
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

        resolution.applyUpdate({
            type: ClassUpdateType.SetSpellsKnownProgression,
            payload: { progression: state.spellsKnownProgression }
        }).catch(error => {
            console.error('Failed to sync spells known progression:', error);
        });

        prevSpellsKnownRef.current = currentSpellsKnown;
    }, [classId, resolution.sessionId, resolution.applyUpdate, state.spellsKnownProgression, resolution]);

    // Handle new feature from association dialog
    useEffect(() => {
        if (location.state?.newFeature && !processedNewFeatureRef.current) {
            const newFeature = location.state.newFeature;
            processedNewFeatureRef.current = true;

            // Add the new feature progression to the list
            const newProgression: FeatureProgression = createFeatureProgression({
                featureId: newFeature.featureId,
                feature: {
                    id: newFeature.featureId,
                    name: newFeature.name,
                    description: newFeature.description || '',
                    slug: newFeature.slug,
                    displayInCharacterSheet: true,
                    summary: null,
                },
                entities: [],
            });
            updateState({ type: ClassEditStateUpdateType.ADD_FEATURE_PROGRESSION, payload: { progression: newProgression } });
            // Clear the state
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state?.newFeature, navigate, location.pathname, createFeatureProgression, updateState]);

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
                    features: state.featureProgressions.map(prog => {
                        const { classes: _classes, races: _races, ...progressionData } = prog;
                        return {
                            ...progressionData,
                            entities: prog.entities?.map(entity => {
                                const { progressionId: __, ...entityData } = entity;
                                if (entityData.formulaParams && entityData.formulaParams.formulaId) {
                                    const formulaParamsData = { ...entityData.formulaParams };
                                    delete (formulaParamsData as { id?: unknown }).id;
                                    entityData.formulaParams = formulaParamsData;
                                    delete entityData.formulaParamsId;
                                } else {
                                    delete entityData.formulaParams;
                                    delete entityData.formulaParamsId;
                                }
                                return entityData;
                            }) || [],
                        };
                    }),
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
                if (!resolution.sessionId) {
                    setError('Session not initialized. Please wait for the session to load.');
                    return;
                }

                await resolution.saveSession();
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
            console.error('Error details:', {
                name: err instanceof Error ? err.name : 'Unknown',
                message: err instanceof Error ? err.message : 'Unknown error',
                stack: err instanceof Error ? err.stack : 'No stack trace'
            });

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
        } finally {
            setIsSaving(false);
        }
    };

    // Show loading state while session is initializing (for existing classes)
    if (id !== 'new' && resolution.isLoading && !resolution.classState) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    // Show error state
    const displayError = resolution.error || error;
    if (displayError && !resolution.classState && id !== 'new') {
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
    if (id === 'new' && !cls) {
        setCls(formData);
    }

    // Group progressions by feature for display
    const progressionsByFeature = state.featureProgressions.reduce((acc, progression) => {
        const featureId = progression.featureId;
        if (!acc[featureId]) {
            acc[featureId] = {
                feature: progression.feature ? {
                    id: progression.feature.id,
                    name: progression.feature.name,
                    description: progression.feature.description || '',
                    slug: progression.feature.slug
                } : {
                    id: featureId,
                    name: `Feature ${featureId}`,
                    description: '',
                    slug: `feature-${featureId}`
                },
                progressions: []
            };
        }
        acc[featureId].progressions.push(progression);
        return acc;
    }, {} as Record<number, { feature: { id: number; name: string; description: string; slug: string }; progressions: FeatureProgression[] }>);

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
                                formData={formData}
                                setFormData={setFormData}
                                validation={form.validation}
                                isLoading={isLoading}
                                featureProgressions={state.featureProgressions}
                                setFeatureProgressions={(progressions) => updateState({ type: ClassEditStateUpdateType.SET_FEATURE_PROGRESSIONS, payload: { featureProgressions: progressions } })}
                                spellcastingProgression={state.spellcastingProgression}
                                setSpellcastingProgression={(progression) => updateState({ type: ClassEditStateUpdateType.SET_SPELLCASTING_PROGRESSION, payload: { progression } })}
                                spellsKnownProgression={state.spellsKnownProgression}
                                setSpellsKnownProgression={(progression) => updateState({ type: ClassEditStateUpdateType.SET_SPELLS_KNOWN_PROGRESSION, payload: { progression } })}
                                isFeatureAssocOpen={state.isFeatureAssocOpen}
                                setIsFeatureAssocOpen={(open) => updateState({ type: ClassEditStateUpdateType.SET_IS_FEATURE_ASSOC_OPEN, payload: { isFeatureAssocOpen: open } })}
                                isProgressionDialogOpen={state.isProgressionDialogOpen}
                                setIsProgressionDialogOpen={(open) => updateState({ type: ClassEditStateUpdateType.SET_IS_PROGRESSION_DIALOG_OPEN, payload: { isProgressionDialogOpen: open } })}
                                editingProgression={state.editingProgression}
                                setEditingProgression={(progression) => updateState({ type: ClassEditStateUpdateType.SET_EDITING_PROGRESSION, payload: { editingProgression: progression } })}
                                preSelectedFeature={state.preSelectedFeature}
                                setPreSelectedFeature={(feature) => updateState({ type: ClassEditStateUpdateType.SET_PRE_SELECTED_FEATURE, payload: { preSelectedFeature: feature } })}
                                onRemoveProgression={handleRemoveProgression}
                                onAddFeature={handleAddFeature}
                                onEditProgression={handleEditProgression}
                                onAddSkill={handleAddSkill}
                                onRemoveSkill={handleRemoveSkill}
                                onAddProficiency={handleAddProficiency}
                                onRemoveProficiency={handleRemoveProficiency}
                                classId={id !== 'new' ? parseInt(id) : undefined}
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
                        {isLoading ? 'Saving...' : id === 'new' ? 'Create Class' : 'Update Class'}
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
                initialSelectedFeatureIds={Object.keys(progressionsByFeature)
                    .map(id => parseInt(id))
                    .filter(featureId =>
                        featureId !== SpecialFeatureId.ClassSkill &&
                        featureId !== SpecialFeatureId.ClassProficiency
                    )}
                classId={id !== 'new' ? parseInt(id) : undefined}
            />

            {/* Feature Progression Dialog */}
            <FeatureProgressionDetailEdit
                isOpen={state.isProgressionDialogOpen}
                onClose={() => {
                    updateState({ type: ClassEditStateUpdateType.SET_IS_PROGRESSION_DIALOG_OPEN, payload: { isProgressionDialogOpen: false } });
                    updateState({ type: ClassEditStateUpdateType.SET_PRE_SELECTED_FEATURE, payload: { preSelectedFeature: undefined } });
                }}
                progression={state.editingProgression}
                onSave={(progression) => {
                    if (state.editingProgression) {
                        handleUpdateProgression(state.editingProgression, progression);
                    } else {
                        handleAddProgression(progression);
                    }
                    updateState({ type: ClassEditStateUpdateType.SET_IS_PROGRESSION_DIALOG_OPEN, payload: { isProgressionDialogOpen: false } });
                    updateState({ type: ClassEditStateUpdateType.SET_PRE_SELECTED_FEATURE, payload: { preSelectedFeature: undefined } });
                }}
                preSelectedFeature={state.preSelectedFeature}
                showSourceTypeSelector={false}
                editionId={formData.editionId}
            />
        </div>
    );
}
