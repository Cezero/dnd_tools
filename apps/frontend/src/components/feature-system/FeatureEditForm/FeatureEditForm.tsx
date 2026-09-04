import { Dialog } from '@base-ui-components/react/dialog';
import { ScrollArea } from '@base-ui-components/react/scroll-area';
import { useQueryClient } from '@tanstack/react-query';
import { isEqual } from 'lodash';
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';

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
import { CreateFeatureRequestSchema, UpdateFeatureSchema, FeatureWithRelations, FeaturePrerequisite, FeatureEntity, GetAllFeatsWithFeatureInfoResponse } from '@shared/schema';
import { DraftAction, FEATURE_PRE_REQ_LIST, FeaturePrerequisiteType, FeatureSourceType, ABILITY_LIST, FEATURE_SOURCE_LIST, EntityType } from '@shared/static-data';

import { useFeatureResolution } from '../useFeatureResolution';
import type { FeatureEditFormProps, PrerequisiteDetailFormProps } from './types';
import { EntityDetailForm } from '../FeatureDetailEdit/EntityDetailForm';
import { EntitySectionRenderer } from '../FeatureDetailEdit/EntitySectionRenderer';
import type { EntityTypeConfig } from '../FeatureDetailEdit/types';
import { useEntityManagement } from '../FeatureDetailEdit/useEntityManagement';
import { useGroupingState } from '../FeatureDetailEdit/useGroupingState';
import { FeatureQueryHooks } from '../FeatureQueryHooks';

/**
 * Builds draft path updates for a prerequisite row so Redis matches the form.
 * New rows must already have a minted draft id from DraftAction.Add.
 */
function getPrerequisiteDraftUpdates(
    nextPrereq: FeaturePrerequisite,
    prevPrereq?: FeaturePrerequisite
): Array<{ path: string; value: string | number | boolean | null }> {
    if (typeof nextPrereq.id !== 'number' || nextPrereq.id === 0) {
        return [];
    }
    const basePath = `prerequisites.byId.${nextPrereq.id}`;
    const updates: Array<{ path: string; value: string | number | boolean | null }> = [];
    if (!prevPrereq || !isEqual(prevPrereq.type, nextPrereq.type)) {
        updates.push({ path: `${basePath}.type`, value: nextPrereq.type });
    }
    if (!prevPrereq || !isEqual(prevPrereq.appliesToId, nextPrereq.appliesToId)) {
        updates.push({ path: `${basePath}.appliesToId`, value: nextPrereq.appliesToId ?? null });
    }
    if (!prevPrereq || !isEqual(prevPrereq.minValue, nextPrereq.minValue)) {
        updates.push({ path: `${basePath}.minValue`, value: nextPrereq.minValue });
    }
    return updates;
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
            // Allow minted negative draft IDs, 0 for new, or positive IDs for existing
            return Number.isInteger(featureId) ? featureId : 0;
        }


        if (typeof featureId === 'string') {
            const parsed = parseInt(featureId, 10);
            // Allow minted negative draft IDs, 0 for new, or positive IDs for existing
            return !isNaN(parsed) ? parsed : 0;
        }

        // For null, undefined, or any other invalid value, treat as 0 (new)
        return 0;
    }, [featureId, isOpen]);

    // Only call useFeatureResolution when we have a valid featureId and modal is open
    const resolution = useFeatureResolution(resolutionFeatureId);

    // For backwards compatibility, keep numericFeatureId for other uses
    const numericFeatureId = typeof resolutionFeatureId === 'number' && resolutionFeatureId > 0 ? resolutionFeatureId : null;

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
            if (
                resolutionFeatureId !== null &&
                resolutionFeatureId <= 0 &&
                !hasInitializedRef.current &&
                !resolution.isLoading &&
                !resolution.error
            ) {
                // New feature draft: initialize from defaults/context and allow syncing immediately.
                setFormData(initialFormData);
                hasInitializedRef.current = true;
                return;
            }

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

    }, [featureId, mode, isOpen, context, resolutionFeatureId, resolution.state, resolution.error, resolution.isLoading, initialFormData]);

    // Cleanup: Cancel editing when modal closes (for new features)
    // Note: useGenericResolution already handles cleanup on unmount, but we need to handle modal close
    useEffect(() => {
        // Only cleanup for new features when modal closes
        if (mode === 'modal' && !isOpen && resolutionFeatureId !== null && resolutionFeatureId <= 0) {
            resolution.cancel().catch((err) => {
                console.error('Error canceling feature editing on modal close:', err);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, isOpen, resolutionFeatureId]);

    // Track previous formData to detect changes and sync to Redis state
    const previousFormDataRef = useRef<FeatureWithRelations | null>(null);

    // Refs for text input fields to add onBlur handlers
    const nameInputRef = useRef<HTMLInputElement>(null);
    const slugInputRef = useRef<HTMLInputElement>(null);
    const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
    const summaryInputRef = useRef<HTMLTextAreaElement>(null);
    const levelInputRef = useRef<HTMLInputElement>(null);

    const draftUpdateQueueRef = useRef<Promise<void>>(Promise.resolve());

    const enqueueDraftUpdate = useCallback((fn: () => Promise<void>) => {
        draftUpdateQueueRef.current = draftUpdateQueueRef.current
            .then(fn)
            .catch((err) => {
                console.error('[FeatureEditForm] Draft update failed:', err);
            });
        return draftUpdateQueueRef.current;
    }, []);

    /**
     * Pushes current formData to the draft (Redis) so the backend has the latest state.
     * Must be awaited before save() so that formulaParams (e.g. maxValue) and other fields are persisted.
     */
    const syncFormDataToDraft = useCallback(
        async (data: FeatureWithRelations, prevData: FeatureWithRelations | null): Promise<void> => {
            if (resolutionFeatureId === null) return;
            const prev = prevData;
            if (!prev) return;

            const topLevelFields: Array<{ field: keyof FeatureWithRelations; value: unknown }> = [
                { field: 'name', value: data.name },
                { field: 'slug', value: data.slug },
                { field: 'description', value: data.description },
                { field: 'summary', value: data.summary },
                { field: 'level', value: data.level },
                { field: 'sourceType', value: data.sourceType },
                { field: 'displayInCharacterSheet', value: data.displayInCharacterSheet },
                { field: 'domainId', value: data.domainId },
                { field: 'featId', value: data.featId },
                { field: 'companionId', value: data.companionId },
                { field: 'editionId', value: data.editionId },
            ];
            for (const { field, value } of topLevelFields) {
                const prevVal = (prev as Record<string, unknown>)[field as string];
                if (!isEqual(prevVal, value)) {
                    await resolution.updateValue(field as string, value);
                }
            }

            const prevEntities = (prev.entities || []) as FeatureEntity[];
            const nextEntities = (data.entities || []) as FeatureEntity[];
            const prevById = new Map<number, FeatureEntity>();
            for (const e of prevEntities) {
                if (typeof e.id === 'number' && e.id !== 0) prevById.set(e.id, e);
            }
            const nextIds = new Set<number>();
            for (const e of nextEntities) {
                if (typeof e.id === 'number' && e.id !== 0) nextIds.add(e.id);
            }
            for (const [id] of prevById) {
                if (!nextIds.has(id)) {
                    await resolution.updateValue(`entities.byId.${id}`, id, DraftAction.Remove);
                }
            }

            for (const e of nextEntities) {
                if (typeof e.id !== 'number' || e.id === 0) continue;
                const prevEntity = prevById.get(e.id);
                if (!prevEntity) continue;
                const basePath = `entities.byId.${e.id}`;
                const updates: Array<{ path: string; value: unknown }> = [];
                if (!isEqual(prevEntity.type, e.type)) updates.push({ path: `${basePath}.type`, value: e.type });
                if (!isEqual(prevEntity.appliesTo, e.appliesTo)) updates.push({ path: `${basePath}.appliesTo`, value: e.appliesTo });
                if (!isEqual(prevEntity.appliesToId, e.appliesToId)) updates.push({ path: `${basePath}.appliesToId`, value: e.appliesToId });
                if (!isEqual(prevEntity.appliesToSubId, e.appliesToSubId)) updates.push({ path: `${basePath}.appliesToSubId`, value: e.appliesToSubId });
                if (!isEqual(prevEntity.value, e.value)) updates.push({ path: `${basePath}.value`, value: e.value });
                if (!isEqual(prevEntity.bonusType, e.bonusType)) updates.push({ path: `${basePath}.bonusType`, value: e.bonusType });
                if (!isEqual(prevEntity.displayInDetail, e.displayInDetail)) updates.push({ path: `${basePath}.displayInDetail`, value: e.displayInDetail });
                if (!isEqual(prevEntity.showFullProgression, e.showFullProgression)) updates.push({ path: `${basePath}.showFullProgression`, value: e.showFullProgression });
                if (!isEqual(prevEntity.filterType, e.filterType)) updates.push({ path: `${basePath}.filterType`, value: e.filterType });
                const prevFp = prevEntity.formulaParams ?? null;
                const nextFp = e.formulaParams ?? null;
                if (!isEqual(prevFp?.formulaId, nextFp?.formulaId)) updates.push({ path: `${basePath}.formulaParams.formulaId`, value: nextFp?.formulaId ?? null });
                if (!isEqual(prevFp?.formulaStartLevel, nextFp?.formulaStartLevel)) updates.push({ path: `${basePath}.formulaParams.formulaStartLevel`, value: nextFp?.formulaStartLevel ?? null });
                if (!isEqual(prevFp?.interval, nextFp?.interval)) updates.push({ path: `${basePath}.formulaParams.interval`, value: nextFp?.interval ?? null });
                if (!isEqual(prevFp?.abilityId, nextFp?.abilityId)) updates.push({ path: `${basePath}.formulaParams.abilityId`, value: nextFp?.abilityId ?? null });
                if (!isEqual(prevFp?.baseValue, nextFp?.baseValue)) updates.push({ path: `${basePath}.formulaParams.baseValue`, value: nextFp?.baseValue ?? null });
                if (!isEqual(prevFp?.startingValue, nextFp?.startingValue)) updates.push({ path: `${basePath}.formulaParams.startingValue`, value: nextFp?.startingValue ?? null });
                if (!isEqual(prevFp?.maxValue, nextFp?.maxValue)) updates.push({ path: `${basePath}.formulaParams.maxValue`, value: nextFp?.maxValue ?? null });
                if (!isEqual(prevFp?.divisor, nextFp?.divisor)) updates.push({ path: `${basePath}.formulaParams.divisor`, value: nextFp?.divisor ?? null });
                if (!isEqual(prevFp?.includeProgressionLevel, nextFp?.includeProgressionLevel)) updates.push({ path: `${basePath}.formulaParams.includeProgressionLevel`, value: nextFp?.includeProgressionLevel ?? null });
                if (!isEqual(prevFp?.featureLevelZero, nextFp?.featureLevelZero)) updates.push({ path: `${basePath}.formulaParams.featureLevelZero`, value: nextFp?.featureLevelZero ?? null });
                if (!isEqual(prevFp?.valuesRepresent, nextFp?.valuesRepresent)) updates.push({ path: `${basePath}.formulaParams.valuesRepresent`, value: nextFp?.valuesRepresent ?? null });
                if (!isEqual(prevFp?.cumulative, nextFp?.cumulative)) updates.push({ path: `${basePath}.formulaParams.cumulative`, value: nextFp?.cumulative ?? null });
                const prevThresholds = prevFp?.thresholds ?? [];
                const nextThresholds = nextFp?.thresholds ?? [];
                const maxThresholdLength = Math.max(prevThresholds.length, nextThresholds.length);
                for (let i = 0; i < maxThresholdLength; i += 1) {
                    const prevValue = prevThresholds[i] ?? null;
                    const nextValue = nextThresholds[i] ?? null;
                    if (!isEqual(prevValue, nextValue)) {
                        updates.push({
                            path: `${basePath}.formulaParams.thresholds.${i}`,
                            value: nextValue,
                        });
                    }
                }
                const prevValues = prevFp?.values ?? [];
                const nextValues = nextFp?.values ?? [];
                const maxValuesLength = Math.max(prevValues.length, nextValues.length);
                for (let i = 0; i < maxValuesLength; i += 1) {
                    const prevValue = prevValues[i] ?? null;
                    const nextValue = nextValues[i] ?? null;
                    if (!isEqual(prevValue, nextValue)) {
                        updates.push({
                            path: `${basePath}.formulaParams.values.${i}`,
                            value: nextValue,
                        });
                    }
                }
                for (const u of updates) {
                    await resolution.updateValue(u.path, u.value);
                }
            }

            const prevPrereqs = (prev.prerequisites || []) as FeaturePrerequisite[];
            const nextPrereqs = (data.prerequisites || []) as FeaturePrerequisite[];
            const prevPrereqById = new Map<number, FeaturePrerequisite>();
            for (const p of prevPrereqs) {
                if (typeof p.id === 'number' && p.id !== 0) prevPrereqById.set(p.id, p);
            }
            const nextPrereqIds = new Set(nextPrereqs.map(p => p.id).filter((id): id is number => typeof id === 'number' && id !== 0));
            for (const [prevId] of prevPrereqById) {
                if (!nextPrereqIds.has(prevId)) {
                    await resolution.updateValue(`prerequisites.byId.${prevId}`, prevId, DraftAction.Remove);
                }
            }

            for (let idx = 0; idx < nextPrereqs.length; idx += 1) {
                const p = nextPrereqs[idx];
                let prereqToSync = p;
                if (p.id === 0 || p.id === null || p.id === undefined) {
                    const addResp = await resolution.updateValue('prerequisites', 0, DraftAction.Add);
                    const newId = addResp.id;
                    if (typeof newId !== 'number') {
                        throw new Error('FeatureEditForm: DraftAction.Add for prerequisites did not return an id');
                    }
                    prereqToSync = { ...p, id: newId };
                    setFormData((prevState) => {
                        const updatedPrereqs = (prevState.prerequisites || []).map((pr, i) =>
                            i === idx ? { ...pr, id: newId } : pr
                        );
                        const nextState = { ...prevState, prerequisites: updatedPrereqs };
                        previousFormDataRef.current = nextState;
                        return nextState;
                    });
                }
                const prevPrereq = typeof prereqToSync.id === 'number' ? prevPrereqById.get(prereqToSync.id) : undefined;
                for (const u of getPrerequisiteDraftUpdates(prereqToSync, prevPrereq)) {
                    await resolution.updateValue(u.path, u.value);
                }
            }
        },
        [resolution, resolutionFeatureId]
    );

    const commitDraftField = useCallback((field: string, value: unknown) => {
        if (!isOpen || resolutionFeatureId === null || !hasInitializedRef.current) {
            return;
        }
        void enqueueDraftUpdate(async () => {
            await resolution.updateValue(field, value);
        });
    }, [enqueueDraftUpdate, isOpen, resolution, resolutionFeatureId]);

    useEffect(() => {
        if (!isOpen || resolutionFeatureId === null || !hasInitializedRef.current) {
            return;
        }

        const prev = previousFormDataRef.current;
        if (!prev) {
            previousFormDataRef.current = formData;
            return;
        }

        if (isEqual(prev, formData)) {
            return;
        }

        void enqueueDraftUpdate(async () => {
            // Top-level discrete fields (avoid text fields which are committed on blur)
            const topLevelFields: Array<{ field: keyof FeatureWithRelations; value: unknown }> = [
                { field: 'sourceType', value: formData.sourceType },
                { field: 'displayInCharacterSheet', value: formData.displayInCharacterSheet },
                { field: 'domainId', value: formData.domainId },
                { field: 'featId', value: formData.featId },
                { field: 'companionId', value: formData.companionId },
                { field: 'editionId', value: formData.editionId },
            ];

            for (const { field, value } of topLevelFields) {
                const prevVal = (prev as Record<string, unknown>)[field as string];
                if (!isEqual(prevVal, value)) {
                    await resolution.updateValue(field as string, value);
                }
            }

            // Entities: add/remove
            const prevEntities = (prev.entities || []) as FeatureEntity[];
            const nextEntities = (formData.entities || []) as FeatureEntity[];

            const prevById = new Map<number, FeatureEntity>();
            for (const e of prevEntities) {
                if (typeof e.id === 'number' && e.id !== 0) prevById.set(e.id, e);
            }

            const nextIds = new Set<number>();
            for (const e of nextEntities) {
                if (typeof e.id === 'number' && e.id !== 0) nextIds.add(e.id);
            }

            for (const [id] of prevById) {
                if (!nextIds.has(id)) {
                    await resolution.updateValue(`entities.byId.${id}`, id, DraftAction.Remove);
                }
            }

            for (let idx = 0; idx < nextEntities.length; idx += 1) {
                const e = nextEntities[idx];
                if (e.id === 0 || e.id === null || e.id === undefined) {
                    const addResp = await resolution.updateValue('entities', 0, DraftAction.Add);
                    const newId = addResp.id;
                    if (typeof newId !== 'number') {
                        throw new Error('FeatureEditForm: DraftAction.Add for entities did not return an id');
                    }

                    setFormData((prevState) => {
                        const updatedEntities = (prevState.entities || []).map((ent, i) =>
                            i === idx ? { ...ent, id: newId } : ent
                        );
                        const nextState = { ...prevState, entities: updatedEntities };
                        previousFormDataRef.current = nextState;
                        return nextState;
                    });
                }
            }

            // Entities: field updates (selector paths)
            for (const e of nextEntities) {
                if (typeof e.id !== 'number' || e.id === 0) continue;
                const prevEntity = prevById.get(e.id);
                if (!prevEntity) continue;

                const basePath = `entities.byId.${e.id}`;
                const updates: Array<{ path: string; value: unknown }> = [];

                if (!isEqual(prevEntity.type, e.type)) updates.push({ path: `${basePath}.type`, value: e.type });
                if (!isEqual(prevEntity.appliesTo, e.appliesTo)) updates.push({ path: `${basePath}.appliesTo`, value: e.appliesTo });
                if (!isEqual(prevEntity.appliesToId, e.appliesToId)) updates.push({ path: `${basePath}.appliesToId`, value: e.appliesToId });
                if (!isEqual(prevEntity.appliesToSubId, e.appliesToSubId)) updates.push({ path: `${basePath}.appliesToSubId`, value: e.appliesToSubId });
                if (!isEqual(prevEntity.value, e.value)) updates.push({ path: `${basePath}.value`, value: e.value });
                if (!isEqual(prevEntity.bonusType, e.bonusType)) updates.push({ path: `${basePath}.bonusType`, value: e.bonusType });
                if (!isEqual(prevEntity.displayInDetail, e.displayInDetail)) updates.push({ path: `${basePath}.displayInDetail`, value: e.displayInDetail });
                if (!isEqual(prevEntity.showFullProgression, e.showFullProgression)) updates.push({ path: `${basePath}.showFullProgression`, value: e.showFullProgression });
                if (!isEqual(prevEntity.filterType, e.filterType)) updates.push({ path: `${basePath}.filterType`, value: e.filterType });

                // Sync formulaParams as scalar fields (API only accepts string/number/boolean/null per path)
                const prevFp = prevEntity.formulaParams ?? null;
                const nextFp = e.formulaParams ?? null;
                if (!isEqual(prevFp?.formulaId, nextFp?.formulaId)) updates.push({ path: `${basePath}.formulaParams.formulaId`, value: nextFp?.formulaId ?? null });
                if (!isEqual(prevFp?.formulaStartLevel, nextFp?.formulaStartLevel)) updates.push({ path: `${basePath}.formulaParams.formulaStartLevel`, value: nextFp?.formulaStartLevel ?? null });
                if (!isEqual(prevFp?.interval, nextFp?.interval)) updates.push({ path: `${basePath}.formulaParams.interval`, value: nextFp?.interval ?? null });
                if (!isEqual(prevFp?.abilityId, nextFp?.abilityId)) updates.push({ path: `${basePath}.formulaParams.abilityId`, value: nextFp?.abilityId ?? null });
                if (!isEqual(prevFp?.baseValue, nextFp?.baseValue)) updates.push({ path: `${basePath}.formulaParams.baseValue`, value: nextFp?.baseValue ?? null });
                if (!isEqual(prevFp?.startingValue, nextFp?.startingValue)) updates.push({ path: `${basePath}.formulaParams.startingValue`, value: nextFp?.startingValue ?? null });
                if (!isEqual(prevFp?.maxValue, nextFp?.maxValue)) updates.push({ path: `${basePath}.formulaParams.maxValue`, value: nextFp?.maxValue ?? null });
                if (!isEqual(prevFp?.divisor, nextFp?.divisor)) updates.push({ path: `${basePath}.formulaParams.divisor`, value: nextFp?.divisor ?? null });
                if (!isEqual(prevFp?.includeProgressionLevel, nextFp?.includeProgressionLevel)) updates.push({ path: `${basePath}.formulaParams.includeProgressionLevel`, value: nextFp?.includeProgressionLevel ?? null });
                if (!isEqual(prevFp?.featureLevelZero, nextFp?.featureLevelZero)) updates.push({ path: `${basePath}.formulaParams.featureLevelZero`, value: nextFp?.featureLevelZero ?? null });
                if (!isEqual(prevFp?.valuesRepresent, nextFp?.valuesRepresent)) updates.push({ path: `${basePath}.formulaParams.valuesRepresent`, value: nextFp?.valuesRepresent ?? null });
                if (!isEqual(prevFp?.cumulative, nextFp?.cumulative)) updates.push({ path: `${basePath}.formulaParams.cumulative`, value: nextFp?.cumulative ?? null });
                const prevThresholds = prevFp?.thresholds ?? [];
                const nextThresholds = nextFp?.thresholds ?? [];
                const maxThresholdLength = Math.max(prevThresholds.length, nextThresholds.length);
                for (let i = 0; i < maxThresholdLength; i += 1) {
                    const prevValue = prevThresholds[i] ?? null;
                    const nextValue = nextThresholds[i] ?? null;
                    if (!isEqual(prevValue, nextValue)) {
                        updates.push({
                            path: `${basePath}.formulaParams.thresholds.${i}`,
                            value: nextValue,
                        });
                    }
                }
                const prevValues = prevFp?.values ?? [];
                const nextValues = nextFp?.values ?? [];
                const maxValuesLength = Math.max(prevValues.length, nextValues.length);
                for (let i = 0; i < maxValuesLength; i += 1) {
                    const prevValue = prevValues[i] ?? null;
                    const nextValue = nextValues[i] ?? null;
                    if (!isEqual(prevValue, nextValue)) {
                        updates.push({
                            path: `${basePath}.formulaParams.values.${i}`,
                            value: nextValue,
                        });
                    }
                }

                for (const u of updates) {
                    await resolution.updateValue(u.path, u.value);
                }
            }

            // Prerequisites: add/remove and field updates
            const prevPrereqs = (prev.prerequisites || []) as FeaturePrerequisite[];
            const nextPrereqs = (formData.prerequisites || []) as FeaturePrerequisite[];
            const prevPrereqById = new Map<number, FeaturePrerequisite>();
            for (const p of prevPrereqs) {
                if (typeof p.id === 'number' && p.id !== 0) prevPrereqById.set(p.id, p);
            }
            const nextPrereqIds = new Set(nextPrereqs.map(p => p.id).filter((id): id is number => typeof id === 'number' && id !== 0));

            for (const [prevId] of prevPrereqById) {
                if (!nextPrereqIds.has(prevId)) {
                    await resolution.updateValue(`prerequisites.byId.${prevId}`, prevId, DraftAction.Remove);
                }
            }

            for (let idx = 0; idx < nextPrereqs.length; idx += 1) {
                const p = nextPrereqs[idx];
                let prereqToSync = p;
                if (p.id === 0 || p.id === null || p.id === undefined) {
                    const addResp = await resolution.updateValue('prerequisites', 0, DraftAction.Add);
                    const newId = addResp.id;
                    if (typeof newId !== 'number') {
                        throw new Error('FeatureEditForm: DraftAction.Add for prerequisites did not return an id');
                    }

                    prereqToSync = { ...p, id: newId };
                    setFormData((prevState) => {
                        const updatedPrereqs = (prevState.prerequisites || []).map((pr, i) =>
                            i === idx ? { ...pr, id: newId } : pr
                        );
                        const nextState = { ...prevState, prerequisites: updatedPrereqs };
                        previousFormDataRef.current = nextState;
                        return nextState;
                    });
                }

                const prevPrereq = typeof prereqToSync.id === 'number' ? prevPrereqById.get(prereqToSync.id) : undefined;
                for (const u of getPrerequisiteDraftUpdates(prereqToSync, prevPrereq)) {
                    await resolution.updateValue(u.path, u.value);
                }
            }

            previousFormDataRef.current = formData;
        });
    }, [enqueueDraftUpdate, formData, isOpen, resolution, resolutionFeatureId]);

    // Note: text fields (name/slug/description/summary/level) are committed via explicit onBlur handlers
    // on the corresponding inputs (to avoid per-keystroke updates).

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

            // Wait for in-flight path updates, then flush the form against the initial Redis snapshot
            // so name/context/prerequisite fields that never committed still persist.
            await draftUpdateQueueRef.current;
            const prev = resolution.state ?? previousFormDataRef.current ?? null;
            if (prev) {
                await syncFormDataToDraft(formData, prev);
            }
            const savedFeatureId = await resolution.save();

            if (numericFeatureId) {
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
            } else {
                setMessage('Feature created successfully');

                // Invalidate feature caches
                await queryClient.invalidateQueries({
                    queryKey: FeatureQueryHooks.getFeatureByIdQueryKey(savedFeatureId)
                });
                await queryClient.invalidateQueries({
                    queryKey: ['features'],
                    exact: false
                });
            }

            if (onSave) {
                onSave(savedFeatureId);
            }

            if (mode === 'modal' && onClose) {
                setTimeout(() => {
                    // Do not pass draft state when closing after save; caller already updated from refetched feature
                    onClose();
                }, 500);
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
            onClose(resolution.state ?? null);
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
                <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose?.(resolution?.state ?? null)}>
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
                <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose?.(resolution?.state ?? null)}>
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
                <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose?.(resolution?.state ?? null)}>
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
                                            <div
                                                onBlurCapture={() => {
                                                    form.validation.validateField('name', formData.name, formData);
                                                    commitDraftField('name', formData.name);
                                                }}
                                            >
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
                                            </div>

                                            <div
                                                onBlurCapture={() => {
                                                    form.validation.validateField('slug', formData.slug, formData);
                                                    commitDraftField('slug', formData.slug);
                                                }}
                                            >
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
                                    </div>

                                    <div className="space-y-2">
                                        <div
                                            onBlurCapture={() => {
                                                form.validation.validateField('description', formData.description, formData);
                                                commitDraftField('description', formData.description);
                                            }}
                                        >
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
                                    </div>

                                    <div className="space-y-2">
                                        <div
                                            onBlurCapture={() => {
                                                form.validation.validateField('summary', formData.summary, formData);
                                                commitDraftField('summary', formData.summary);
                                            }}
                                        >
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
                                        </div>
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
                                        <div
                                            onBlurCapture={() => {
                                                form.validation.validateField('level', formData.level, formData);
                                                commitDraftField('level', formData.level);
                                            }}
                                        >
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
                                        </div>
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
        </>
    );

    if (mode === 'modal') {
        return (
            <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose?.(resolution?.state ?? null)}>
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
    const prerequisites = formData.prerequisites as FeaturePrerequisite[] || [];
    const prerequisite = prerequisites[index] || { type: undefined };

    const { getSkillSelectFull } = useCacheFunctions();

    const { data: featsResponse } = FeatQueryHooks.useGetFeats();
    const featOptions = (featsResponse as GetAllFeatsWithFeatureInfoResponse | undefined)?.results || [];

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
