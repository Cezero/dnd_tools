import { Dialog } from '@base-ui-components/react/dialog';
import { Menu } from '@base-ui-components/react/menu';
import {
    UserIcon, ShieldCheckIcon, AcademicCapIcon, SparklesIcon, DocumentTextIcon, BriefcaseIcon, CogIcon, ListBulletIcon, BoltIcon, Bars3Icon, HeartIcon
} from '@heroicons/react/24/outline';
import { useQueryClient } from '@tanstack/react-query';
import isEqual from 'lodash/isEqual';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { useLogPanel } from '@/components/log-panel';
import { useToast } from '@/components/toast/useToast';
import { useCharacterEditState } from '@/features/character';
import { CharacterEditStateUpdateType, type EquipmentItem, type SkillRank, type TabComponentProps, type TabConfig, type WealthDraftEntry } from '@/features/character/types';
import { ClassQueryHooks } from '@/features/class/ClassQueryHooks';
import { FeatQueryHooks } from '@/features/feat/FeatQueryHooks';
import { ItemQueryHooks } from '@/features/item/ItemQueryHooks';
import { RaceQueryHooks } from '@/features/race/RaceQueryHooks';
import { extractRaceMechanics } from '@/lib/feature-extraction/raceMechanicsExtractor';
import { displayStrategyFactory } from '@/lib/formatters';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useDraftSync } from '@/lib/hooks/useDraftSync';
import { LanguageService } from '@/lib/LanguageService';
import { hasNoMaxRanks } from '@/lib/skill-utils';
import { DraftApi } from '@/services/api/EntityApi';
import { UserSessionApi } from '@/services/api/UserSessionApi';
import type { Race, DnDClass, CharacterWithAllDetailsResponse, FeatWithFeatureInfo, ItemWithDetails, FeatureWithRelations } from '@shared/schema';
import { DraftAction as DraftActionEnum, DraftType, EditionId, DisplayType, EntityAppliesToType, EntityType } from '@shared/static-data';

import { generateCharacterPdf } from './characterPdfService';
import { CharacterQueryHooks } from './CharacterQueryHooks';
import { ensureDraftOnlyEditSession } from './ensureDraftOnlyEditSession';
import { AbilitiesRaceTab, AnimalsPetsTab, ChoicesTab, ClassTab, ConfigurationTab, DescriptionTab, EquipmentTab, FeatsTab, SkillsTab, CombatTab, SpellSelectionTab } from './tabs';
import { useAdvancementDraft } from './useAdvancementDraft';
import { useCharacterResolution } from './useCharacterResolution';
import { enqueueAdvancementDraftWrite, flushAdvancementCollectionsToDraft, syncFeatureChoicesToDraft } from './utils/advancementDraftSync';
import { syncAttackDefinitionsToDraft, syncCharacterItemsToDraft } from './utils/characterItemDraftSync';
import { enqueueCharacterDraftWrite, syncCompanionsToDraft } from './utils/companionDraftSync';
import { createStableDraftRowId } from './utils/draftKeyUtils';
import { mapEquipmentToCharacterItems } from './utils/equipmentUtils';
import { buildWealthFromMoney, isQuantityOnlyWealth, normalizeWealthRows, wealthToMoney } from './utils/moneyUtils';

let pendingCreateRoutePromise: Promise<void> | null = null;

/**
 * Main character editing component with tab-based interface.
 * 
 * **State Synchronization Pattern**:
 * 
 * This component implements the standardized state → useEffect → updateValue pattern for
 * synchronizing character state changes with the resolution session:
 * 
 * 1. **Tabs update state**: Tab components call `updateState()` to modify character state
 * 2. **CharacterEdit syncs automatically**: useEffect hooks watch state changes and automatically
 *    call `resolution.updateValue()` or API endpoints to sync changes
 * 3. **Resolution session updates**: Backend resolution session is updated, and resolved data
 *    flows back to tabs via `resolvedData` prop
 * 
 * **Note**: nested collections are synced via scalar-only draft updates:
 * - add/remove elements via `DraftAction.Add` / `DraftAction.Remove`
 * - update fields via `...byId.<id>.<field>` paths
 * 
 * **Benefits of this pattern**:
 * - Centralized sync logic: All sync happens in CharacterEdit, easier to maintain
 * - Tabs are simpler: Tabs don't need to know about resolution API
 * - Automatic sync: No risk of forgetting to sync - it's automatic
 * - React-idiomatic: Uses effects to react to state changes
 * - Consistent: All tabs work the same way
 * 
 * **useEffect Hooks**:
 * - Class changes: Watches `state.classId` and `state.secondaryClassId`
 * - Race changes: Watches `state.raceId`
 * - Config flags: Watches `state.isGestalt`, `allowVariantClasses`, `ignoreLevelAdjustment`, `maxHpAtFirstLevel`, `editionId`
 * - Skill ranks: Watches `state.skillRanks` array
 * - Feature choices: Watches `state.featureChoices` array
 * - Spells known: Watches `state.spellsKnown` array
 * - Feats: Watches `state.selectedFeats` + `state.featSubIds`
 * - Equipment: Watches `state.equipment` and writes `characterItems.byId`
 * - Attack definitions: Watches `state.attackDefinitions` and writes `attackDefinitions.byId`
 * 
 * **Why refs are used**: Refs track previous values to avoid syncing on initial mount and
 * to detect actual changes vs. initial state loading.
 * 
 * @see useCharacterResolution - For resolution session management
 * @see TabComponentProps - For tab component interface
 */
export function CharacterEdit(): React.JSX.Element {
    const { user, isLoading: isAuthLoading } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const { state, updateState } = useCharacterEditState();
    const queryClient = useQueryClient();
    const { id } = useParams<{ id: string }>();
    const isCreateMode = id === undefined;
    const isLevelUpFromView = useMemo(() => {
        const s = location.state;
        if (!s || typeof s !== 'object') {
            return false;
        }
        if (!('levelUp' in s)) {
            return false;
        }
        return (s as { levelUp?: unknown }).levelUp === true;
    }, [location.state]);
    const toastManager = useToast();
    const logPanel = useLogPanel();
    const [activeTab, setActiveTab] = useState<string>('abilities-race');
    const [isLoadingCharacter, setIsLoadingCharacter] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [nameModalOpen, setNameModalOpen] = useState(false);
    const [nameModalValue, setNameModalValue] = useState('');

    // Race data state
    const [_selectedRaceDetails, setSelectedRaceDetails] = useState<(Race & { id: number }) | null>(null);

    // Class data state
    const [_selectedClassDetails, setSelectedClassDetails] = useState<(DnDClass & { id: number }) | null>(null);
    const [_selectedSecondaryClassDetails, setSelectedSecondaryClassDetails] = useState<(DnDClass & { id: number }) | null>(null);

    // Character data for formatting
    const [characterData, setCharacterData] = useState<CharacterWithAllDetailsResponse | null>(null);
    const [items, setItems] = useState<ItemWithDetails[]>([]);
    const [classDetailsMap, setClassDetailsMap] = useState<Map<number, DnDClass>>(new Map());

    // Shared data for all tabs - feats, classes, race
    const [allFeats, setAllFeats] = useState<FeatWithFeatureInfo[]>([]);
    const [isLoadingFeats, setIsLoadingFeats] = useState(false);

    // Default edition only when none is set. Do not overwrite a loaded character's edition.
    useEffect(() => {
        if (isAuthLoading || !user || state.editionId) {
            return;
        }
        const userPreferredEdition = (user as { preferredEditionId?: number | null })?.preferredEditionId;
        updateState({
            type: CharacterEditStateUpdateType.SET_EDITION,
            payload: { editionId: userPreferredEdition ?? EditionId.DND_3_5E },
        });
    }, [user, isAuthLoading, state.editionId, updateState]);

    // Use imperative API for race, class, and secondary class details
    const [raceDetailsData, setRaceDetailsData] = useState<(Race & { features?: FeatureWithRelations[] }) | null>(null);
    const [classDetailsData, setClassDetailsData] = useState<(DnDClass & { features?: FeatureWithRelations[] }) | null>(null);
    const [secondaryClassDetailsData, setSecondaryClassDetailsData] = useState<(DnDClass & { features?: FeatureWithRelations[] }) | null>(null);
    const [advancementDraftStartContext, setAdvancementDraftStartContext] = useState<unknown>(undefined);

    /**
     * Draft-backed create route bootstrap.
     *
     * The `/characters/new/create` route is only a launcher. It either:
     * - resumes an existing draft-only character edit session (negative id) and navigates to `/characters/:id/edit`, or
     * - mints fresh Character+Advancement drafts and navigates to `/characters/:id/edit`.
     *
     * Refresh of `/characters/:id/edit` with a negative id re-runs startEditing
     * (see `ensureDraftOnlyEditSession`) so Redis is restored if the TTL expired.
     */
    useEffect(() => {
        const run = async (): Promise<void> => {
            if (!user || !isCreateMode) {
                return;
            }

            // Dedupe under React StrictMode double-mount in dev.
            if (pendingCreateRoutePromise) {
                await pendingCreateRoutePromise;
                return;
            }

            pendingCreateRoutePromise = (async () => {
                const session = await UserSessionApi.getMySession();
                const existingDraftCharacterId = session.editing.find(
                    (ref) => ref.draftType === DraftType.Character && typeof ref.id === 'number' && ref.id < 0
                )?.id;

                if (typeof existingDraftCharacterId === 'number' && existingDraftCharacterId < 0) {
                    navigate(`/characters/${existingDraftCharacterId}/edit`, { replace: true, state: location.state });
                    return;
                }

                const startCharacter = await DraftApi.startEditing(DraftType.Character, 0);
                if (!startCharacter.success || typeof startCharacter.id !== 'number') {
                    throw new Error('Failed to start character draft for create');
                }

                const draftCharacterId = startCharacter.id;

                const startAdvancement = await DraftApi.startEditing(DraftType.Advancement, 0, {
                    characterId: draftCharacterId,
                    level: 1,
                    mode: 'create',
                });
                if (!startAdvancement.success || typeof startAdvancement.id !== 'number') {
                    throw new Error('Failed to start advancement draft for create');
                }

                navigate(`/characters/${draftCharacterId}/edit`, { replace: true, state: location.state });
            })().finally(() => {
                pendingCreateRoutePromise = null;
            });

            await pendingCreateRoutePromise;
        };

        run().catch((error) => {
            console.error('Failed to bootstrap character create drafts:', error);
        });
    }, [isCreateMode, location.state, navigate, user]);

    // Character draft session (for mutable base character fields) + resolved-character topic subscription
    const characterDraft = useCharacterResolution(state.characterId || null);
    // Current advancement draft session (for class/skills/feats/choices edits)
    const advancementDraft = useAdvancementDraft(
        state.currentAdvancementId,
        {
            startEditingContext: state.currentAdvancementId === 0 ? advancementDraftStartContext : undefined,
            onResolvedDraftId: (resolvedDraftId) => {
                updateState({
                    type: CharacterEditStateUpdateType.SET_CURRENT_ADVANCEMENT_ID,
                    payload: { currentAdvancementId: resolvedDraftId },
                });
            },
        }
    );

    const startLevelUpDraft = useCallback(() => {
        if (!characterData || !state.characterId || state.characterId < 1) {
            return;
        }

        const currentMaxLevel = characterData.characterLevel ?? 1;
        const nextLevel = currentMaxLevel + 1;

        setAdvancementDraftStartContext({ characterId: state.characterId, level: nextLevel, mode: 'level-up' });
        updateState({ type: CharacterEditStateUpdateType.SET_LEVEL, payload: { level: nextLevel } });
        updateState({ type: CharacterEditStateUpdateType.SET_SKILL_RANKS, payload: { skillRanks: [] } });
        updateState({ type: CharacterEditStateUpdateType.SET_SELECTED_FEATS, payload: { selectedFeats: [] } });
        updateState({ type: CharacterEditStateUpdateType.SET_FEATURE_CHOICES, payload: { featureChoices: [] } });
        updateState({ type: CharacterEditStateUpdateType.SET_SPELLS_KNOWN, payload: { spellsKnown: [] } });
        updateState({ type: CharacterEditStateUpdateType.SET_CURRENT_ADVANCEMENT_ID, payload: { currentAdvancementId: 0 } });
    }, [characterData, state.characterId, updateState]);

    // If navigation requested a level-up session from view mode, initialize it once character data is loaded.
    useEffect(() => {
        if (!isLevelUpFromView) {
            return;
        }
        if (!characterData || !state.characterId || state.characterId < 1) {
            return;
        }

        const currentMaxLevel = characterData.characterLevel ?? 1;
        if (state.level === currentMaxLevel + 1 && state.currentAdvancementId === 0) {
            return;
        }

        startLevelUpDraft();
    }, [characterData, isLevelUpFromView, startLevelUpDraft, state.characterId, state.currentAdvancementId, state.level]);

    // Compute derived data from resolved character result
    const resolvedData = useMemo(() => {
        if (!characterDraft.resolvedCharacter) {
            return {
                features: [],
                classSkills: [],
                skillBonuses: [],
                pendingChoices: [],
                grantedFeats: [],
                availableFeatsCount: 0,
                availableFighterBonusFeats: 0,
                qualifiedFeats: [],
                spellSelection: undefined,
                resolvedCompanions: [],
                resolvedSelectedForms: [],
            };
        }

        return {
            features: characterDraft.resolvedCharacter.resolvedProgressions,
            classSkills: characterDraft.resolvedCharacter.classSkills.map((skill): { skillId: number; skillSubId: number | null } => ({ skillId: skill.skillId, skillSubId: skill.skillSubId ?? null })),
            skillBonuses: characterDraft.resolvedCharacter.skillBonuses.map((bonus): { skillId: number; skillSubId: number | null; bonus: number; source: string } => ({ skillId: bonus.skillId, skillSubId: bonus.skillSubId ?? null, bonus: bonus.bonus, source: bonus.source })),
            pendingChoices: characterDraft.resolvedCharacter.pendingChoices,
            grantedFeats: characterDraft.resolvedCharacter.grantedFeats.map(featId => ({
                id: 0,
                featureId: 0,
                type: EntityType.Bonus,
                appliesTo: EntityAppliesToType.Feat,
                appliesToId: featId,
                appliesToSubId: null,
                value: null,
                bonusType: null,
                formulaParamsId: null,
                groupingId: 0,
                displayInDetail: true,
                showFullProgression: false,
                filterType: null,
            })),
            availableFeatsCount: characterDraft.resolvedCharacter.availableFeatsCount,
            availableFighterBonusFeats: characterDraft.resolvedCharacter.availableFighterBonusFeats,
            qualifiedFeats: characterDraft.resolvedCharacter.qualifiedFeats || [],
            spellSelection: characterDraft.resolvedCharacter.spellSelection,
            resolvedCompanions: characterDraft.resolvedCharacter.resolvedCompanions ?? [],
            resolvedSelectedForms: characterDraft.resolvedCharacter.resolvedSelectedForms ?? [],
        };
    }, [characterDraft.resolvedCharacter]);

    const isResolving = characterDraft.isLoading;

    // Track previous values to avoid unnecessary updates and infinite loops
    // Note: Simple scalar and nullable scalar fields now use useDraftSync hook which manages refs internally
    const prevCharacterLanguagesRef = useRef<Array<{ languageId: number }> | null>(null);
    const hasInitializedLanguagesSyncRef = useRef(false);
    const prevAbilityScoresRef = useRef<Array<{ abilityId: number; value: number }> | null>(null);
    const prevDisallowedSourcesRef = useRef<typeof state.disallowedSources | null>(null);
    const prevSkillRanksRef = useRef<typeof state.skillRanks | null>(null);
    const prevFeatureChoicesRef = useRef<typeof state.featureChoices | null>(null);
    const prevCompanionsRef = useRef<typeof state.companions | null>(null);
    const prevEquipmentRef = useRef<typeof state.equipment | null>(null);
    const prevAttackDefinitionsRef = useRef<typeof state.attackDefinitions | null>(null);
    const hydratedCharacterIdRef = useRef<number | null>(null);
    const prevSpellsKnownRef = useRef<typeof state.spellsKnown | null>(null);
    const prevSelectedFeatsRef = useRef<{ selectedFeats: number[]; featSubIds: Record<number, number | null> } | null>(null);
    const describedWealthRef = useRef<WealthDraftEntry[]>([]);

    // Debounced values for text fields
    const debouncedName = useDebounce(state.name, 500);
    const debouncedEyes = useDebounce(state.eyes, 500);
    const debouncedHair = useDebounce(state.hair, 500);
    const debouncedGender = useDebounce(state.gender, 500);
    const debouncedWeight = useDebounce(state.weight, 500);
    const debouncedNotes = useDebounce(state.notes, 500);
    const debouncedAge = useDebounce(state.age, 300);
    const debouncedHeight = useDebounce(state.height, 300);

    // Note: useDraftSync hook manages its own initialization refs internally
    // Reset initialization flag for languages sync when characterId changes
    useEffect(() => {
        hasInitializedLanguagesSyncRef.current = false;
        prevDisallowedSourcesRef.current = null;
        prevEquipmentRef.current = null;
        prevAttackDefinitionsRef.current = null;
    }, [state.characterId]);

    /**
     * Sync character name to character draft (debounced).
     *
     * Name is required for draft-based create/save.
     */
    useDraftSync({
        value: debouncedName,
        draft: characterDraft,
        path: 'name',
        characterId: state.characterId,
        debounceMs: 0, // Already debounced
        errorMessage: 'Failed to sync name to character draft',
    });

    /**
     * Sync alignment to character draft (immediate - select field).
     */
    useDraftSync({
        value: state.alignmentId,
        draft: characterDraft,
        path: 'alignmentId',
        characterId: state.characterId,
        errorMessage: 'Failed to sync alignmentId to character draft',
    });

    /**
     * Sync age to character draft (debounced).
     */
    useDraftSync({
        value: debouncedAge,
        draft: characterDraft,
        path: 'age',
        characterId: state.characterId,
        debounceMs: 0, // Already debounced
        errorMessage: 'Failed to sync age to character draft',
    });

    /**
     * Sync height to character draft (debounced).
     */
    useDraftSync({
        value: debouncedHeight,
        draft: characterDraft,
        path: 'height',
        characterId: state.characterId,
        debounceMs: 0, // Already debounced
        errorMessage: 'Failed to sync height to character draft',
    });

    /**
     * Sync weight to character draft (debounced).
     */
    useDraftSync({
        value: debouncedWeight,
        draft: characterDraft,
        path: 'weight',
        characterId: state.characterId,
        debounceMs: 0, // Already debounced
        errorMessage: 'Failed to sync weight to character draft',
    });

    /**
     * Sync eyes to character draft (debounced).
     */
    useDraftSync({
        value: debouncedEyes,
        draft: characterDraft,
        path: 'eyes',
        characterId: state.characterId,
        debounceMs: 0, // Already debounced
        errorMessage: 'Failed to sync eyes to character draft',
    });

    /**
     * Sync hair to character draft (debounced).
     */
    useDraftSync({
        value: debouncedHair,
        draft: characterDraft,
        path: 'hair',
        characterId: state.characterId,
        debounceMs: 0, // Already debounced
        errorMessage: 'Failed to sync hair to character draft',
    });

    /**
     * Sync gender to character draft (debounced).
     */
    useDraftSync({
        value: debouncedGender,
        draft: characterDraft,
        path: 'gender',
        characterId: state.characterId,
        debounceMs: 0, // Already debounced
        errorMessage: 'Failed to sync gender to character draft',
    });

    /**
     * Sync notes to character draft (debounced).
     */
    useDraftSync({
        value: debouncedNotes,
        draft: characterDraft,
        path: 'notes',
        characterId: state.characterId,
        debounceMs: 0, // Already debounced
        errorMessage: 'Failed to sync notes to character draft',
    });

    /**
     * Sync character languages to character draft.
     *
     * Combines automatic languages (from features), selected bonus languages, and skill-based languages
     * into the characterLanguages array in the draft.
     */
    useEffect(() => {
        if (!state.characterId) {
            return;
        }

        // Calculate all languages
        const allLanguages: number[] = [];

        // Add automatic languages from resolved features
        if (resolvedData.features && resolvedData.features.length > 0) {
            const automaticLanguages = LanguageService.getAutomaticLanguages(resolvedData.features);
            allLanguages.push(...automaticLanguages);
        }

        // Add selected bonus languages
        allLanguages.push(...state.selectedBonusLanguages);

        // Add skill-based languages from skill ranks (skills with no max rank limit, e.g., Speak Language)
        const skillBasedLanguages = state.skillRanks
            .filter(skill => hasNoMaxRanks(skill.skillId))
            .map(skill => {
                if (skill.skillSubId !== null && skill.skillSubId !== undefined) {
                    return skill.skillSubId;
                }
                if (skill.customSubtype) {
                    const parsed = parseInt(skill.customSubtype, 10);
                    return isNaN(parsed) ? null : parsed;
                }
                return null;
            })
            .filter((id): id is number => id !== null);
        allLanguages.push(...skillBasedLanguages);

        // Remove duplicates and sort for stable comparison
        const uniqueLanguages = Array.from(new Set(allLanguages)).sort((a, b) => a - b);
        const currentLanguages = uniqueLanguages.map(languageId => ({ languageId }));

        // Initialize ref on first run - set to empty array so all languages are detected as "new"
        if (!hasInitializedLanguagesSyncRef.current) {
            hasInitializedLanguagesSyncRef.current = true;
            prevCharacterLanguagesRef.current = [];
        }

        // Check if languages changed (compare the full array since automatic/skill-based can change too)
        if (!isEqual(prevCharacterLanguagesRef.current, currentLanguages)) {
            // Scalar-only updates: diff by languageId.
            const prev = new Set<number>(
                (prevCharacterLanguagesRef.current || []).map((lang) => lang.languageId)
            );
            const next = new Set<number>(currentLanguages.map((lang) => lang.languageId));

            // Add new languages
            for (const languageId of next) {
                if (!prev.has(languageId)) {
                    characterDraft
                        .updateValue(`characterLanguages.byId.${languageId}.languageId`, languageId)
                        .catch((error) => {
                            console.error('Failed to add character language to character draft:', error);
                        });
                }
            }
            // Remove languages that are no longer present
            for (const languageId of prev) {
                if (!next.has(languageId)) {
                    characterDraft
                        .updateValue(`characterLanguages.byId.${languageId}`, null, DraftActionEnum.Remove)
                        .catch((error) => {
                            console.error('Failed to remove character language from character draft:', error);
                        });
                }
            }
        }
        prevCharacterLanguagesRef.current = currentLanguages;
    }, [characterDraft.updateValue, state.characterId, state.selectedBonusLanguages, state.skillRanks, resolvedData.features]);

    /**
     * Sync ability scores to character draft.
     *
     * This is critical for create workflow so resolution and save both operate on draft state.
     */
    useEffect(() => {
        if (!state.characterId || state.characterId === 0) {
            return;
        }

        const current = state.abilityScores.map((a) => ({ abilityId: a.abilityId, value: a.value }));
        if (prevAbilityScoresRef.current === null) {
            prevAbilityScoresRef.current = current;
            return;
        }

        if (!isEqual(prevAbilityScoresRef.current, current)) {
            // Scalar-only updates: upsert by abilityId selector and update value.
            for (const abilityScore of state.abilityScores) {
                characterDraft
                    .updateValue(`abilityScores.byId.${abilityScore.abilityId}.value`, abilityScore.value)
                    .catch((error) => {
                        console.error('Failed to sync abilityScore to character draft:', error);
                    });
            }
            prevAbilityScoresRef.current = current;
        }
    }, [characterDraft.updateValue, state.abilityScores, state.characterId]);

    /**
     * Sync disallowed sources to character draft.
     */
    useEffect(() => {
        if (!state.characterId || state.characterId === 0) {
            return;
        }

        const current = state.disallowedSources;
        if (prevDisallowedSourcesRef.current === null) {
            prevDisallowedSourcesRef.current = current;
            // Init skip would drop sources chosen before characterId was set (Eberron, etc.).
            for (const source of current) {
                characterDraft
                    .updateValue(`disallowedSources.byId.${source.sourceBookId}.sourceBookId`, source.sourceBookId)
                    .catch((error) => {
                        console.error('Failed to add disallowed source to character draft:', error);
                    });
            }
            return;
        }

        if (!isEqual(prevDisallowedSourcesRef.current, current)) {
            // Scalar-only updates: diff by sourceBookId.
            const prev = new Set<number>(
                prevDisallowedSourcesRef.current.map((s) => s.sourceBookId)
            );
            const next = new Set<number>(state.disallowedSources.map((s) => s.sourceBookId));

            for (const sourceBookId of next) {
                if (!prev.has(sourceBookId)) {
                    characterDraft
                        .updateValue(`disallowedSources.byId.${sourceBookId}.sourceBookId`, sourceBookId)
                        .catch((error) => {
                            console.error('Failed to add disallowed source to character draft:', error);
                        });
                }
            }
            for (const sourceBookId of prev) {
                if (!next.has(sourceBookId)) {
                    characterDraft
                        .updateValue(`disallowedSources.byId.${sourceBookId}`, null, DraftActionEnum.Remove)
                        .catch((error) => {
                            console.error('Failed to remove disallowed source from character draft:', error);
                        });
                }
            }
            prevDisallowedSourcesRef.current = current;
        }
    }, [characterDraft.updateValue, state.disallowedSources, state.characterId]);

    /**
     * Sync class changes to resolution session.
     * 
     * Automatically syncs primary and secondary class changes to the resolution session.
     * Watches `state.classId` and `state.secondaryClassId` for changes.
     * Uses updateValue for path-based field updates.
     * 
     * @see CharacterEdit component JSDoc for overall sync pattern documentation
     */
    useDraftSync({
        value: state.classId,
        draft: advancementDraft,
        path: 'classId',
        characterId: state.characterId,
        draftId: advancementDraft.draftId,
        useBooleanInitRef: true, // Use boolean ref instead of null sentinel
        errorMessage: 'Failed to sync class change to resolution session',
    });

    useDraftSync({
        value: state.secondaryClassId,
        draft: advancementDraft,
        path: 'secondaryClassId',
        characterId: state.characterId,
        draftId: advancementDraft.draftId,
        useBooleanInitRef: true, // Use boolean ref instead of null sentinel
        errorMessage: 'Failed to sync secondary class change to resolution session',
    });

    /**
     * Sync race changes to resolution session.
     * 
     * Automatically syncs race changes to the resolution session.
     * Watches `state.raceId` for changes.
     * Uses updateValue for path-based field updates.
     * 
     * @see CharacterEdit component JSDoc for overall sync pattern documentation
     */
    useDraftSync({
        value: state.raceId,
        draft: characterDraft,
        path: 'raceId',
        characterId: state.characterId,
        useBooleanInitRef: true, // Use boolean ref instead of null sentinel
        errorMessage: 'Failed to sync race change to resolution session',
    });

    /**
     * Sync configuration flags to the character draft.
     *
     * These live on CharacterConfig in MySQL. Save reads Redis, not React state,
     * so they must be written here or they persist as the create-state defaults.
     */
    useDraftSync({
        value: state.isGestalt,
        draft: characterDraft,
        path: 'isGestalt',
        characterId: state.characterId,
        errorMessage: 'Failed to sync isGestalt to character draft',
    });

    useDraftSync({
        value: state.allowVariantClasses,
        draft: characterDraft,
        path: 'allowVariantClasses',
        characterId: state.characterId,
        errorMessage: 'Failed to sync allowVariantClasses to character draft',
    });

    useDraftSync({
        value: state.ignoreLevelAdjustment,
        draft: characterDraft,
        path: 'ignoreLevelAdjustment',
        characterId: state.characterId,
        errorMessage: 'Failed to sync ignoreLevelAdjustment to character draft',
    });

    useDraftSync({
        value: state.editionId,
        draft: characterDraft,
        path: 'editionId',
        characterId: state.characterId,
        errorMessage: 'Failed to sync editionId to character draft',
    });

    useDraftSync({
        value: state.maxHpAtFirstLevel,
        draft: characterDraft,
        path: 'maxHpAtFirstLevel',
        characterId: state.characterId,
        errorMessage: 'Failed to sync maxHpAtFirstLevel to character draft',
    });

    /**
     * Sync editor money (coins and valuable counts) to draft `wealth`.
     * Described rows (pending individual treasure) are preserved from load.
     */
    useDraftSync({
        value: state.money,
        draft: characterDraft,
        path: 'wealth',
        characterId: state.characterId,
        transformValue: (money) => buildWealthFromMoney(
            state.characterId ?? 0,
            money,
            describedWealthRef.current
        ),
        errorMessage: 'Failed to sync money to character draft',
    });

    /**
     * Sync companions as sequential scalar byId updates.
     * The draft update API rejects arrays, so useDraftSync(path: 'companions') never persisted.
     */
    useEffect(() => {
        if (!state.characterId) {
            return;
        }
        if (prevCompanionsRef.current === null) {
            prevCompanionsRef.current = [];
            if (state.companions.length === 0) {
                return;
            }
        }
        if (isEqual(prevCompanionsRef.current, state.companions)) {
            return;
        }
        const previous = prevCompanionsRef.current;
        const next = state.companions;
        const characterId = state.characterId;
        const writer = { updateValue: characterDraft.updateValue };
        enqueueCharacterDraftWrite(characterId, async () => {
            await syncCompanionsToDraft(writer, previous, next);
            prevCompanionsRef.current = next;
        }).catch((error) => {
            console.error('Failed to sync companions to character draft:', error);
        });
    }, [state.characterId, state.companions, characterDraft.updateValue]);

    /**
     * Sync equipment to draft characterItems.
     * Save reads Redis, not React state — without this, possessions never persist.
     */
    useEffect(() => {
        if (!state.characterId) {
            return;
        }
        if (prevEquipmentRef.current === null) {
            prevEquipmentRef.current = state.equipment;
            return;
        }
        if (isEqual(prevEquipmentRef.current, state.equipment)) {
            return;
        }
        const previous = prevEquipmentRef.current;
        const next = state.equipment;
        const characterId = state.characterId;
        const writer = { updateValue: characterDraft.updateValue };
        enqueueCharacterDraftWrite(characterId, async () => {
            await syncCharacterItemsToDraft(writer, characterId, previous, next);
            prevEquipmentRef.current = next;
        }).catch((error) => {
            console.error('Failed to sync equipment to character draft:', error);
        });
    }, [state.characterId, state.equipment, characterDraft.updateValue]);

    /**
     * Sync attack definitions to the character draft so Save can remap item IDs.
     */
    useEffect(() => {
        if (!state.characterId) {
            return;
        }
        if (prevAttackDefinitionsRef.current === null) {
            prevAttackDefinitionsRef.current = state.attackDefinitions;
            return;
        }
        if (isEqual(prevAttackDefinitionsRef.current, state.attackDefinitions)) {
            return;
        }
        const previous = prevAttackDefinitionsRef.current;
        const next = state.attackDefinitions;
        const characterId = state.characterId;
        const writer = { updateValue: characterDraft.updateValue };
        enqueueCharacterDraftWrite(characterId, async () => {
            await syncAttackDefinitionsToDraft(writer, characterId, previous, next);
            prevAttackDefinitionsRef.current = next;
        }).catch((error) => {
            console.error('Failed to sync attack definitions to character draft:', error);
        });
    }, [state.characterId, state.attackDefinitions, characterDraft.updateValue]);

    useDraftSync({
        value: state.selectedForms,
        draft: characterDraft,
        path: 'selectedForms',
        characterId: state.characterId,
        errorMessage: 'Failed to sync selected forms to character draft',
    });

    /**
     * Sync skill rank changes to resolution session.
     * 
     * This useEffect hook automatically syncs skill rank changes to the resolution session
     * when the skillRanks array in state changes. It follows the standardized pattern where
     * tabs update state and CharacterEdit automatically handles the sync.
     * 
     * **Pattern**: State → useEffect → updateValue
     * - Tab updates state.skillRanks via updateState()
     * - This useEffect detects the change
     * - Automatically calls resolution.updateValue() with the entire skillRanks array
     * - Backend handles diffing and updates
     * 
     * **Why refs are used**: The prevSkillRanksRef tracks the previous array state to avoid
     * syncing on initial mount and to detect actual changes.
     * 
     * @see CharacterEdit component JSDoc for overall sync pattern documentation
     */
    useEffect(() => {
        // Only sync if session is initialized and we have a character ID
        if (!state.characterId || !advancementDraft.draftId) {
            return;
        }

        // Initialize ref on first session availability (don't send update on initial sync)
        if (prevSkillRanksRef.current === null) {
            prevSkillRanksRef.current = state.skillRanks;
            return;
        }

        // Check if skill ranks changed; apply scalar-only diffs to advancement draft.
        if (!isEqual(prevSkillRanksRef.current, state.skillRanks)) {
            const prev: SkillRank[] = prevSkillRanksRef.current;

            const prevIds = new Set<number>(
                prev.map((sr) =>
                    createStableDraftRowId(`skill:${sr.skillId}:${sr.skillSubId ?? 0}:${sr.customSubtype ?? ''}`)
                )
            );
            const nextIds = new Set<number>(
                state.skillRanks.map((sr) =>
                    createStableDraftRowId(`skill:${sr.skillId}:${sr.skillSubId ?? 0}:${sr.customSubtype ?? ''}`)
                )
            );

            for (const sr of state.skillRanks) {
                const rowId = createStableDraftRowId(`skill:${sr.skillId}:${sr.skillSubId ?? 0}:${sr.customSubtype ?? ''}`);
                advancementDraft.updateValue(`skills.byId.${rowId}.skillId`, sr.skillId).catch(() => undefined);
                advancementDraft.updateValue(`skills.byId.${rowId}.skillSubId`, sr.skillSubId ?? null).catch(() => undefined);
                advancementDraft.updateValue(`skills.byId.${rowId}.customSubtype`, sr.customSubtype ?? null).catch(() => undefined);
                advancementDraft.updateValue(`skills.byId.${rowId}.pointsSpent`, sr.pointsSpent).catch((error) => {
                    console.error('Failed to sync skill rank to advancement draft:', error);
                });
            }

            for (const rowId of prevIds) {
                if (!nextIds.has(rowId)) {
                    advancementDraft.updateValue(`skills.byId.${rowId}`, null, DraftActionEnum.Remove).catch((error) => {
                        console.error('Failed to remove skill rank from advancement draft:', error);
                    });
                }
            }
        }
        prevSkillRanksRef.current = state.skillRanks;
    }, [state.characterId, state.skillRanks, advancementDraft.draftId, advancementDraft.updateValue]);

    /**
     * Sync feature choices to the advancement draft.
     *
     * Writes are queued and applied as sequential byId scalars. Parallel updateValue
     * calls race on the Redis document and drop new rows (animal companion, domains).
     * A choice made before draftId exists is still flushed on the first ready run.
     */
    useEffect(() => {
        // Only sync if session is initialized and we have a character ID
        if (!state.characterId || !advancementDraft.draftId) {
            return;
        }

        // First run: treat previous as empty so a choice made before draftId was ready still syncs.
        if (prevFeatureChoicesRef.current === null) {
            prevFeatureChoicesRef.current = [];
            if (state.featureChoices.length === 0) {
                return;
            }
        }

        if (isEqual(prevFeatureChoicesRef.current, state.featureChoices)) {
            return;
        }

        const previous = prevFeatureChoicesRef.current;
        const next = state.featureChoices;
        const characterId = state.characterId;
        const draftId = advancementDraft.draftId;
        const writer = { updateValue: advancementDraft.updateValue };

        enqueueAdvancementDraftWrite(draftId, async () => {
            await syncFeatureChoicesToDraft(writer, previous, next, characterId, draftId);
            prevFeatureChoicesRef.current = next;
        }).catch((error) => {
            console.error('Failed to sync feature choice to advancement draft:', error);
        });
    }, [state.characterId, state.featureChoices, advancementDraft.draftId, advancementDraft.updateValue]);

    /**
     * Sync spellsKnown changes to backend.
     * 
     * Automatically syncs spellsKnown array changes to the backend and refreshes resolution state.
     * Watches `state.spellsKnown` for changes. Sends full array to backend sync endpoint.
     * 
     * **Pattern**: State → useEffect → API + refreshState (same as spellPreparations in CharacterDetail)
     * - Tab updates state.spellsKnown via updateState()
     * - This useEffect detects the change using lodash/isEqual
     * - Automatically calls CharacterQueryHooks.syncSpellsKnown() with full array
     * - Backend handles diffing and updates database
     * - Refreshes resolution state after sync
     * 
     * @see CharacterDetail component for spellPreparations sync pattern
     * @see CharacterEdit component JSDoc for overall sync pattern documentation
     */
    useEffect(() => {
        if (!state.characterId || !advancementDraft.draftId) {
            return;
        }

        if (prevSpellsKnownRef.current === null) {
            prevSpellsKnownRef.current = state.spellsKnown;
            return;
        }

        if (!isEqual(state.spellsKnown, prevSpellsKnownRef.current)) {
            const prev = prevSpellsKnownRef.current;

            const prevIds = new Set<number>(
                prev.map((s) => createStableDraftRowId(`spell:${s.spellId}:${s.isFreeGrant ? 1 : 0}`))
            );
            const nextIds = new Set<number>(
                state.spellsKnown.map((s) => createStableDraftRowId(`spell:${s.spellId}:${s.isFreeGrant ? 1 : 0}`))
            );

            for (const s of state.spellsKnown) {
                const rowId = createStableDraftRowId(`spell:${s.spellId}:${s.isFreeGrant ? 1 : 0}`);
                advancementDraft.updateValue(`spellsKnown.byId.${rowId}.spellId`, s.spellId).catch(() => undefined);
                advancementDraft.updateValue(`spellsKnown.byId.${rowId}.isFreeGrant`, s.isFreeGrant === true).catch((error) => {
                    console.error('Failed to sync spellsKnown to advancement draft:', error);
                });
            }

            for (const rowId of prevIds) {
                if (!nextIds.has(rowId)) {
                    advancementDraft.updateValue(`spellsKnown.byId.${rowId}`, null, DraftActionEnum.Remove).catch((error) => {
                        console.error('Failed to remove spell from advancement draft:', error);
                    });
                }
            }

            prevSpellsKnownRef.current = state.spellsKnown;
        }
    }, [advancementDraft.draftId, advancementDraft.updateValue, state.characterId, state.spellsKnown]);

    useEffect(() => {
        if (!state.characterId || !advancementDraft.draftId) {
            return;
        }

        const current = {
            selectedFeats: state.selectedFeats,
            featSubIds: state.featSubIds,
        };

        if (prevSelectedFeatsRef.current === null) {
            prevSelectedFeatsRef.current = current;
            return;
        }

        if (!isEqual(prevSelectedFeatsRef.current, current)) {
            const prevParsed = prevSelectedFeatsRef.current;

            const prevIds = new Set<number>(
                prevParsed.selectedFeats.map((featId) =>
                    createStableDraftRowId(`feat:${featId}:${prevParsed.featSubIds[featId] ?? 0}`)
                )
            );
            const nextIds = new Set<number>(
                state.selectedFeats.map((featId) =>
                    createStableDraftRowId(`feat:${featId}:${state.featSubIds[featId] ?? 0}`)
                )
            );

            for (const featId of state.selectedFeats) {
                const featSubId = state.featSubIds[featId] ?? null;
                const rowId = createStableDraftRowId(`feat:${featId}:${featSubId ?? 0}`);
                advancementDraft.updateValue(`feats.byId.${rowId}.featId`, featId).catch(() => undefined);
                advancementDraft.updateValue(`feats.byId.${rowId}.featSubId`, featSubId).catch((error) => {
                    console.error('Failed to sync feat to advancement draft:', error);
                });
            }

            for (const rowId of prevIds) {
                if (!nextIds.has(rowId)) {
                    advancementDraft.updateValue(`feats.byId.${rowId}`, null, DraftActionEnum.Remove).catch((error) => {
                        console.error('Failed to remove feat from advancement draft:', error);
                    });
                }
            }

            prevSelectedFeatsRef.current = current;
        }
    }, [advancementDraft.draftId, advancementDraft.updateValue, state.characterId, state.featSubIds, state.selectedFeats]);

    // Handle skill rank update - sync to backend resolution API
    const handleSkillRankUpdate = useCallback(
        async (skillId: number, skillSubId: number | null, customSubtype: string | null, pointsSpent: number) => {
            // Update state only; the useEffect sync handles draft updates with scalar-only paths.
            const existingIndex = state.skillRanks.findIndex(
                (sr) => sr.skillId === skillId && sr.skillSubId === skillSubId && sr.customSubtype === customSubtype
            );

            const updatedSkillRanks = [...state.skillRanks];
            if (existingIndex >= 0) {
                updatedSkillRanks[existingIndex] = { skillId, skillSubId, customSubtype, pointsSpent };
            } else {
                updatedSkillRanks.push({ skillId, skillSubId, customSubtype, pointsSpent });
            }

            updateState({
                type: CharacterEditStateUpdateType.SET_SKILL_RANKS,
                payload: { skillRanks: updatedSkillRanks },
            });
        },
        [state.skillRanks, updateState]
    );

    // Trigger feature resolution (no-op since useCharacterResolution handles it automatically)
    const triggerFeatureResolution = useCallback(async () => {
        // Resolution happens automatically when session updates
        // This is kept for compatibility with tabs that call it
    }, []);

    const [primaryClassData, setPrimaryClassData] = useState<DnDClass | null>(null);
    const [secondaryClassData, setSecondaryClassData] = useState<DnDClass | null>(null);
    const [raceData, setRaceData] = useState<Race | null>(null);
    const [isLoadingPrimaryClass, setIsLoadingPrimaryClass] = useState(false);
    const [isLoadingSecondaryClassData, setIsLoadingSecondaryClassData] = useState(false);
    const [isLoadingRaceData, setIsLoadingRaceData] = useState(false);

    // TODO: Add domain queries back when we implement domain choice handling
    // For now, we'll skip domain queries to avoid the 404 errors

    // Fetch all feats (with benefits and prereqs) on component mount
    // Use TanStack Query to leverage caching and prevent infinite loops
    useEffect(() => {
        let isMounted = true;
        const fetchFeats = async () => {
            try {
                setIsLoadingFeats(true);
                // Use queryClient.fetchQuery to leverage TanStack Query cache
                const featResponse = await queryClient.fetchQuery({
                    queryKey: FeatQueryHooks.getFeatsQueryKey(),
                    queryFn: FeatQueryHooks.getFeatsQueryFn,
                    staleTime: 5 * 60 * 1000, // 5 minutes
                    gcTime: 10 * 60 * 1000, // 10 minutes
                });
                // getFeats returns GetAllFeatsWithFeatureInfoResponse which has results: FeatWithFeatureInfo[]
                if (isMounted && featResponse?.results) {
                    setAllFeats(featResponse.results);
                } else if (isMounted) {
                    setAllFeats([]);
                }
            } catch (error) {
                console.error('Failed to fetch feats:', error);
                if (isMounted) {
                    setAllFeats([]);
                }
            } finally {
                if (isMounted) {
                    setIsLoadingFeats(false);
                }
            }
        };
        fetchFeats();
        return () => {
            isMounted = false;
        };
    }, [queryClient]);

    // Helper function to extract choices from character advancements

    // Fetch race details when raceId changes
    useEffect(() => {
        const fetchRaceDetails = async () => {
            if (!state.raceId) {
                setRaceDetailsData(null);
                setSelectedRaceDetails(null);
                setRaceData(null);
                return;
            }

            try {
                setIsLoadingRaceData(true);
                // Use queryClient.fetchQuery to leverage TanStack Query cache
                const raceData = await queryClient.fetchQuery({
                    queryKey: RaceQueryHooks.getRaceByIdQueryKey(state.raceId),
                    queryFn: () => RaceQueryHooks.getRaceById(state.raceId),
                    staleTime: 5 * 60 * 1000, // 5 minutes
                    gcTime: 10 * 60 * 1000, // 10 minutes
                });
                setRaceDetailsData(raceData);
                setSelectedRaceDetails({ ...raceData, id: state.raceId });
                setRaceData(raceData);
            } catch (error) {
                console.error('Failed to fetch race details:', error);
                setRaceDetailsData(null);
                setSelectedRaceDetails(null);
                setRaceData(null);
            } finally {
                setIsLoadingRaceData(false);
            }
        };
        fetchRaceDetails();
    }, [state.raceId, queryClient]);

    // Fetch class details when classId changes
    useEffect(() => {
        const fetchClassDetails = async () => {
            if (!state.classId) {
                setClassDetailsData(null);
                setSelectedClassDetails(null);
                setPrimaryClassData(null);
                return;
            }

            try {
                setIsLoadingPrimaryClass(true);
                // Use queryClient.fetchQuery to leverage TanStack Query cache
                const classData = await queryClient.fetchQuery({
                    queryKey: ClassQueryHooks.getClassByIdQueryKey(state.classId),
                    queryFn: () => ClassQueryHooks.getClassById(state.classId),
                    staleTime: 5 * 60 * 1000, // 5 minutes
                    gcTime: 10 * 60 * 1000, // 10 minutes
                });
                setClassDetailsData(classData);
                setSelectedClassDetails({ ...classData, id: state.classId });
                setPrimaryClassData(classData);
            } catch (error) {
                console.error('Failed to fetch class details:', error);
                setClassDetailsData(null);
                setSelectedClassDetails(null);
                setPrimaryClassData(null);
            } finally {
                setIsLoadingPrimaryClass(false);
            }
        };
        fetchClassDetails();
    }, [state.classId, queryClient]);

    // Fetch secondary class details when secondaryClassId changes
    useEffect(() => {
        const fetchSecondaryClassDetails = async () => {
            if (!state.secondaryClassId) {
                setSecondaryClassDetailsData(null);
                setSelectedSecondaryClassDetails(null);
                setSecondaryClassData(null);
                return;
            }

            try {
                setIsLoadingSecondaryClassData(true);
                // Use queryClient.fetchQuery to leverage TanStack Query cache
                const classData = await queryClient.fetchQuery({
                    queryKey: ClassQueryHooks.getClassByIdQueryKey(state.secondaryClassId),
                    queryFn: () => ClassQueryHooks.getClassById(state.secondaryClassId),
                    staleTime: 5 * 60 * 1000, // 5 minutes
                    gcTime: 10 * 60 * 1000, // 10 minutes
                });
                setSecondaryClassDetailsData(classData);
                setSelectedSecondaryClassDetails({ ...classData, id: state.secondaryClassId });
                setSecondaryClassData(classData);
            } catch (error) {
                console.error('Failed to fetch secondary class details:', error);
                setSecondaryClassDetailsData(null);
                setSelectedSecondaryClassDetails(null);
                setSecondaryClassData(null);
            } finally {
                setIsLoadingSecondaryClassData(false);
            }
        };
        fetchSecondaryClassDetails();
    }, [state.secondaryClassId, queryClient]);

    // Feature resolution is handled by useCharacterResolution hook with backend API

    // TODO: Add domain management back when we implement domain choice handling

    // Load character when ID is present in URL - use TanStack Query cache
    useEffect(() => {
        const loadCharacter = async () => {
            if (!id || !user) return;

            const characterId = parseInt(id, 10);
            if (isNaN(characterId)) return;

            try {
                // Do not re-hydrate from a later MySQL snapshot; Redis is the session.
                if (hydratedCharacterIdRef.current === characterId) {
                    return;
                }

                setIsLoadingCharacter(true);

                // Draft-only URLs are not in MySQL. Re-run startEditing so Redis + session
                // exist after refresh, deploy, or TTL expiry — same setup as “new character”.

                if (characterId < 0) {
                    const draftSession = await ensureDraftOnlyEditSession(characterId);
                    updateState({
                        type: CharacterEditStateUpdateType.SET_CHARACTER_ID,
                        payload: { characterId: draftSession.characterId },
                    });
                    updateState({
                        type: CharacterEditStateUpdateType.SET_CURRENT_ADVANCEMENT_ID,
                        payload: { currentAdvancementId: draftSession.advancementDraftId },
                    });
                    await queryClient.invalidateQueries({
                        queryKey: CharacterQueryHooks.getCharacterWithAllDetailsQueryKey(characterId),
                    });
                }

                const detailsQueryKey = CharacterQueryHooks.getCharacterWithAllDetailsQueryKey(characterId);
                const fetchCharacterDetails = async (): Promise<CharacterWithAllDetailsResponse> => {
                    return queryClient.fetchQuery({
                        queryKey: detailsQueryKey,
                        queryFn: () => CharacterQueryHooks.getCharacterWithAllDetailsQueryFn({ pathParams: { id: characterId } }),
                        staleTime: 0,
                        gcTime: 10 * 60 * 1000,
                    }) as Promise<CharacterWithAllDetailsResponse>;
                };

                let character = await fetchCharacterDetails();

                // Acquire edit locks before hydrating so GET overlays Redis session state.
                if (characterId > 0) {
                    const characterStart = await DraftApi.startEditing(DraftType.Character, characterId);
                    if (!characterStart.success) {
                        throw new Error('Failed to start character draft');
                    }
                    const advancement = character.advancements.reduce((best, adv) => {
                        if (!best) {
                            return adv;
                        }
                        if (adv.level !== best.level) {
                            return adv.level > best.level ? adv : best;
                        }
                        const bestVersion = best.version ?? 0;
                        const nextVersion = adv.version ?? 0;
                        return nextVersion >= bestVersion ? adv : best;
                    }, character.advancements[0] ?? null);
                    if (advancement) {
                        const advancementStart = await DraftApi.startEditing(DraftType.Advancement, advancement.id);
                        if (!advancementStart.success) {
                            throw new Error('Failed to start advancement draft');
                        }
                    }
                    queryClient.removeQueries({ queryKey: detailsQueryKey });
                    character = await fetchCharacterDetails();
                }
                setCharacterData(character);

                // Determine current advancement (highest level, then highest version)
                const advancement = character.advancements.reduce((best, adv) => {
                    if (!best) {
                        return adv;
                    }
                    if (adv.level !== best.level) {
                        return adv.level > best.level ? adv : best;
                    }
                    const bestVersion = best.version ?? 0;
                    const nextVersion = adv.version ?? 0;
                    return nextVersion >= bestVersion ? adv : best;
                }, character.advancements[0] ?? null);
                const currentLevel = advancement?.level ?? 1;

                // Update character basic info
                updateState({ type: CharacterEditStateUpdateType.SET_CHARACTER_ID, payload: { characterId: character.id } });
                updateState({ type: CharacterEditStateUpdateType.SET_NAME, payload: { name: character.name } });
                updateState({ type: CharacterEditStateUpdateType.SET_LEVEL, payload: { level: currentLevel } });
                updateState({ type: CharacterEditStateUpdateType.SET_RACE, payload: { raceId: character.raceId } });
                updateState({ type: CharacterEditStateUpdateType.SET_ALIGNMENT, payload: { alignmentId: character.alignmentId } });
                updateState({ type: CharacterEditStateUpdateType.SET_AGE, payload: { age: character.age } });
                updateState({ type: CharacterEditStateUpdateType.SET_HEIGHT, payload: { height: character.height } });
                updateState({ type: CharacterEditStateUpdateType.SET_WEIGHT, payload: { weight: character.weight?.toString() || null } });
                updateState({ type: CharacterEditStateUpdateType.SET_EYES, payload: { eyes: character.eyes } });
                updateState({ type: CharacterEditStateUpdateType.SET_HAIR, payload: { hair: character.hair } });
                updateState({ type: CharacterEditStateUpdateType.SET_GENDER, payload: { gender: character.gender } });
                updateState({ type: CharacterEditStateUpdateType.SET_NOTES, payload: { notes: character.notes } });

                // Update configuration
                if (character.editionId) {
                    updateState({ type: CharacterEditStateUpdateType.SET_EDITION, payload: { editionId: character.editionId } });
                }
                updateState({
                    type: CharacterEditStateUpdateType.SET_ALLOW_VARIANT_CLASSES,
                    payload: { allowVariantClasses: character.config?.allowVariantClasses ?? false },
                });
                updateState({
                    type: CharacterEditStateUpdateType.SET_IS_GESTALT,
                    payload: { isGestalt: character.config?.isGestalt ?? false },
                });
                updateState({
                    type: CharacterEditStateUpdateType.SET_IGNORE_LEVEL_ADJUSTMENT,
                    payload: { ignoreLevelAdjustment: character.config?.ignoreLevelAdjustment ?? false },
                });
                updateState({
                    type: CharacterEditStateUpdateType.SET_MAX_HP_AT_FIRST_LEVEL,
                    payload: { maxHpAtFirstLevel: character.config?.maxHpAtFirstLevel ?? false },
                });
                updateState({
                    type: CharacterEditStateUpdateType.SET_DISALLOWED_SOURCES,
                    payload: { disallowedSources: character.disallowedSources ?? [] },
                });

                // Load ability scores
                updateState({ type: CharacterEditStateUpdateType.SET_ABILITY_SCORES, payload: { abilityScores: character.abilityScores } });

                // Load money (quantity-only wealth rows, including valuables)
                const wealth = normalizeWealthRows(character.wealth ?? []);
                describedWealthRef.current = wealth.filter((entry) => !isQuantityOnlyWealth(entry));
                updateState({
                    type: CharacterEditStateUpdateType.SET_MONEY,
                    payload: { money: wealthToMoney(wealth) },
                });

                // Load equipment
                // Only load items that have a valid baseItemId (purchased items)
                // Items without baseItemId would be filtered out on save anyway
                if (character.characterItems) {
                    const equipment: EquipmentItem[] = character.characterItems
                        .filter(item => item.baseItemId !== null && item.baseItemId !== undefined)
                        .map((item) => ({
                            id: item.id,
                            baseItemId: item.baseItemId!,
                            costInGp: null, // Cost not stored in CharacterItem, would need to fetch from baseItem
                            quantity: item.quantity ?? 1,
                            location: item.location ?? null,
                            notes: item.name,
                        }));
                    updateState({ type: CharacterEditStateUpdateType.SET_EQUIPMENT, payload: { equipment } });
                }

                // Load attack definitions
                if (character.attackDefinitions) {
                    updateState({
                        type: CharacterEditStateUpdateType.SET_ATTACK_DEFINITIONS,
                        payload: {
                            attackDefinitions: character.attackDefinitions.map(def => ({
                                id: def.id,
                                attackSlot: def.attackSlot ?? null,
                                mainHandCharacterItemId: def.mainHandCharacterItemId ?? null,
                                offHandCharacterItemId: def.offHandCharacterItemId ?? null,
                                wieldTwoHanded: def.wieldTwoHanded ?? false,
                            }))
                        },
                    });
                }

                updateState({
                    type: CharacterEditStateUpdateType.SET_COMPANIONS,
                    payload: { companions: character.companions ?? [] },
                });
                updateState({
                    type: CharacterEditStateUpdateType.SET_SELECTED_FORMS,
                    payload: { selectedForms: character.selectedForms ?? [] },
                });

                // Load advancement data if it exists
                if (advancement) {
                    updateState({ type: CharacterEditStateUpdateType.SET_CURRENT_ADVANCEMENT_ID, payload: { currentAdvancementId: advancement.id } });
                    updateState({
                        type: CharacterEditStateUpdateType.SET_CLASS,
                        payload: { classId: advancement.classId > 0 ? advancement.classId : null },
                    });
                    updateState({
                        type: CharacterEditStateUpdateType.SET_SECONDARY_CLASS,
                        payload: { secondaryClassId: (advancement.secondaryClassId ?? 0) > 0 ? advancement.secondaryClassId : null },
                    });

                    // Load skill ranks
                    const skillRanks: SkillRank[] = advancement.skills.map(skill => ({
                        skillId: skill.skillId,
                        skillSubId: skill.skillSubId,
                        customSubtype: skill.customSubtype || null,
                        pointsSpent: skill.pointsSpent
                    }));
                    updateState({ type: CharacterEditStateUpdateType.SET_SKILL_RANKS, payload: { skillRanks } });

                    // Load feat selections
                    const selectedFeats = advancement.feats.map(feat => feat.featId);
                    const featSubIds: Record<number, number | null> = {};
                    advancement.feats.forEach(feat => {
                        if (feat.featSubId !== null && feat.featSubId !== undefined) {
                            featSubIds[feat.featId] = feat.featSubId;
                        }
                    });
                    updateState({ type: CharacterEditStateUpdateType.SET_SELECTED_FEATS, payload: { selectedFeats } });
                    updateState({ type: CharacterEditStateUpdateType.SET_FEAT_SUB_IDS, payload: { featSubIds } });

                    // Load spellsKnown
                    const spellsKnown = advancement.spellsKnown?.map(s => ({
                        spellId: s.spellId,
                        isFreeGrant: s.isFreeGrant ?? false
                    })) || [];
                    updateState({ type: CharacterEditStateUpdateType.SET_SPELLS_KNOWN, payload: { spellsKnown } });

                    // Load feature choices
                    updateState({ type: CharacterEditStateUpdateType.SET_FEATURE_CHOICES, payload: { featureChoices: advancement.featureChoices } });
                } else {
                    // No advancement for current level
                    updateState({ type: CharacterEditStateUpdateType.SET_CURRENT_ADVANCEMENT_ID, payload: { currentAdvancementId: null } });
                }

                hydratedCharacterIdRef.current = characterId;

                // Languages will be loaded and separated in a useEffect when resolvedData is available
            } catch (error) {
                console.error('Failed to load character:', error);
            } finally {
                setIsLoadingCharacter(false);
            }
        };

        loadCharacter();
    }, [id, user, updateState, queryClient]);

    const _handleClassDetailsChange = (classDetails: (DnDClass & { id: number }) | null) => {
        setSelectedClassDetails(classDetails);
    };

    const _handleSecondaryClassDetailsChange = (classDetails: (DnDClass & { id: number }) | null) => {
        setSelectedSecondaryClassDetails(classDetails);
    };

    // Save handler
    const handleSave = async (nameToUse?: string): Promise<void> => {
        const characterName = nameToUse || state.name.trim();

        if (!characterName) {
            setNameModalOpen(true);
            setNameModalValue('');
            return;
        }

        try {
            setIsSaving(true);

            if (!user?.id) {
                throw new Error('User not authenticated');
            }

            // Ensure name is persisted into the character draft (required for draft-based create save).
            if (characterName !== state.name) {
                updateState({ type: CharacterEditStateUpdateType.SET_NAME, payload: { name: characterName } });
            }
            if (state.characterId && state.characterId !== 0) {
                await characterDraft.updateValue('name', characterName);
            }

            // Validate required fields and show user-friendly errors
            const missingFields: string[] = [];
            if (!state.raceId) {
                missingFields.push('Race');
            }
            if (!state.editionId) {
                missingFields.push('Edition');
            }

            if (missingFields.length > 0) {
                const errorMessage = `Please complete the following required fields before saving: ${missingFields.join(', ')}`;
                toastManager?.add({
                    title: 'Missing Required Fields',
                    description: errorMessage,
                    type: 'error',
                });
                logPanel.addLogEntry({
                    message: errorMessage,
                    type: 'error',
                    source: 'character-editor',
                });
                setIsSaving(false);
                return; // Return early to prevent duplicate error toast and API call
            }

            // Calculate all languages to save
            const allLanguages: number[] = [];

            // Add automatic languages from feature features (any source)
            if (resolvedData.features && resolvedData.features.length > 0) {
                const automaticLanguages = LanguageService.getAutomaticLanguages(resolvedData.features);
                allLanguages.push(...automaticLanguages);
            }

            // Add selected bonus languages
            allLanguages.push(...state.selectedBonusLanguages);

            // Add skill-based languages from skill ranks (skills with no max rank limit, e.g., Speak Language)
            const skillBasedLanguages = state.skillRanks
                .filter(skill => hasNoMaxRanks(skill.skillId))
                .map(skill => {
                    if (skill.skillSubId !== null && skill.skillSubId !== undefined) {
                        return skill.skillSubId;
                    }
                    if (skill.customSubtype) {
                        const parsed = parseInt(skill.customSubtype, 10);
                        return isNaN(parsed) ? null : parsed;
                    }
                    return null;
                })
                .filter((id): id is number => id !== null);
            allLanguages.push(...skillBasedLanguages);

            // Remove duplicates
            const uniqueLanguages = Array.from(new Set(allLanguages));

            const isPersistedCharacter = state.characterId !== null && state.characterId > 0;
            const isDraftOnlyCharacter = state.characterId !== null && state.characterId < 0;

            if (state.characterId && state.characterId !== 0) {
                await characterDraft.updateValue('editionId', state.editionId);
                await characterDraft.updateValue('isGestalt', state.isGestalt);
                await characterDraft.updateValue('allowVariantClasses', state.allowVariantClasses);
                await characterDraft.updateValue('ignoreLevelAdjustment', state.ignoreLevelAdjustment);
                await characterDraft.updateValue('maxHpAtFirstLevel', state.maxHpAtFirstLevel);
                // Setting exclusions fire many path updates; await them so save does not
                // persist a partial Redis list (Wade kept 4 of 9 Eberron books).
                for (const source of state.disallowedSources) {
                    await characterDraft.updateValue(
                        `disallowedSources.byId.${source.sourceBookId}.sourceBookId`,
                        source.sourceBookId
                    );
                }
            }

            // Build the complete character object with nested data (legacy save endpoint).
            const saveData = {
                userId: user.id,
                name: characterName,
                raceId: state.raceId,
                alignmentId: state.alignmentId ?? null,
                deityId: null,
                age: state.age,
                height: state.height,
                weight: state.weight ? (() => {
                    const parsed = parseInt(state.weight, 10);
                    return isNaN(parsed) ? null : parsed;
                })() : null,
                eyes: state.eyes,
                hair: state.hair,
                gender: state.gender,
                notes: state.notes,
                editionId: state.editionId,
                allowVariantClasses: state.allowVariantClasses,
                isGestalt: state.isGestalt,
                ignoreLevelAdjustment: state.ignoreLevelAdjustment,
                maxHpAtFirstLevel: state.maxHpAtFirstLevel,
                // Include money
                platinum: state.money.platinum,
                gold: state.money.gold,
                silver: state.money.silver,
                copper: state.money.copper,
                // NOTE: abilityScores + advancement are persisted via draft saves for existing characters.
                // For create (draft-only), we include them in the create endpoint payload.
                ...(isDraftOnlyCharacter
                    ? {
                        abilityScores: state.abilityScores.length > 0 ? state.abilityScores.map(score => ({
                            abilityId: score.abilityId,
                            value: score.value,
                        })) : undefined,
                        advancement: state.classId ? {
                            level: state.level,
                            classId: state.classId,
                            secondaryClassId: state.secondaryClassId ?? null,
                            hitPoints: 8, // Default hit points, can be calculated later
                            abilityId: null,
                            notes: null,
                            skills: state.skillRanks.map(skill => ({
                                skillId: skill.skillId,
                                skillSubId: skill.skillSubId ?? null,
                                pointsSpent: skill.pointsSpent,
                                customSubtype: skill.customSubtype ?? null,
                            })),
                            feats: state.selectedFeats.map(featId => ({
                                featId,
                                featSubId: state.featSubIds[featId] ?? null,
                            })),
                            spellsKnown: state.spellsKnown.map(s => ({
                                spellId: s.spellId,
                                isFreeGrant: s.isFreeGrant
                            })),
                            featureChoices: state.featureChoices.length > 0 ? state.featureChoices.map(choice => ({
                                featureId: choice.featureId,
                                featureEntityId: choice.featureEntityId,
                                appliesToId: choice.appliesToId,
                                appliesToSubId: choice.appliesToSubId ?? null,
                                choiceIndex: choice.choiceIndex ?? null,
                            })) : undefined,
                        } : undefined,
                    }
                    : {}),
                // Include equipment (only items with baseItemId, which are purchased items)
                // Send individual items to preserve location per instance
                // Only send if there are items to avoid accidentally deleting all equipment
                equipment: (() => {
                    const equipmentItems = state.equipment
                        .filter(item => item.baseItemId !== null)
                        .map(item => ({
                            name: item.notes || 'Unknown Item',
                            quantity: item.quantity || 1,
                            location: item.location ?? null,
                            baseItemId: item.baseItemId!,
                        }));
                    // Return undefined if empty to preserve existing equipment
                    return equipmentItems.length > 0 ? equipmentItems : undefined;
                })(),
                // Include attack definitions
                attackDefinitions: state.attackDefinitions.map(def => ({
                    attackSlot: def.attackSlot ?? null,
                    mainHandCharacterItemId: def.mainHandCharacterItemId,
                    offHandCharacterItemId: def.offHandCharacterItemId,
                    wieldTwoHanded: def.wieldTwoHanded,
                })),
                // Include character languages
                characterLanguages: uniqueLanguages.length > 0 ? uniqueLanguages.map(languageId => ({
                    languageId
                })) : undefined,
            };

            // Flush advancement collections into Redis before save. Parallel byId
            // updates race and drop rows (Wade's Druid animal companion never landed).
            if (state.characterId && advancementDraft.draftId) {
                await flushAdvancementCollectionsToDraft({
                    writer: { updateValue: advancementDraft.updateValue },
                    draftId: advancementDraft.draftId,
                    characterId: state.characterId,
                    featureChoices: state.featureChoices,
                    previousFeatureChoices: prevFeatureChoicesRef.current ?? [],
                    skillRanks: state.skillRanks,
                    selectedFeats: state.selectedFeats,
                    featSubIds: state.featSubIds,
                    spellsKnown: state.spellsKnown,
                });
                prevFeatureChoicesRef.current = state.featureChoices;
            }

            if (state.characterId) {
                await enqueueCharacterDraftWrite(state.characterId, async () => {
                    const writer = { updateValue: characterDraft.updateValue };
                    await syncCompanionsToDraft(
                        writer,
                        prevCompanionsRef.current ?? [],
                        state.companions
                    );
                    prevCompanionsRef.current = state.companions;
                    await syncCharacterItemsToDraft(
                        writer,
                        state.characterId,
                        prevEquipmentRef.current ?? [],
                        state.equipment
                    );
                    prevEquipmentRef.current = state.equipment;
                    await syncAttackDefinitionsToDraft(
                        writer,
                        state.characterId,
                        prevAttackDefinitionsRef.current ?? [],
                        state.attackDefinitions
                    );
                    prevAttackDefinitionsRef.current = state.attackDefinitions;
                });
            }

            // Persist drafts for existing characters (character core + current advancement).
            if (isPersistedCharacter) {
                await characterDraft.save();
                if (!advancementDraft.draftId) {
                    throw new Error('Cannot save: advancement draft is not ready');
                }
                const savedAdvancementId = await advancementDraft.save();
                updateState({
                    type: CharacterEditStateUpdateType.SET_CURRENT_ADVANCEMENT_ID,
                    payload: { currentAdvancementId: savedAdvancementId },
                });
            }

            if (isDraftOnlyCharacter) {
                const saveResult = await DraftApi.save(
                    DraftType.Character,
                    state.characterId!,
                    {
                        advancementDraftId: state.currentAdvancementId,
                    }
                );

                if (!saveResult.success) {
                    // ValidationErrorResponse is handled by DraftApi callers elsewhere; keep it simple here.
                    throw new Error('Failed to save character drafts');
                }

                const createdId = (saveResult as { id?: number }).id;
                if (typeof createdId !== 'number') {
                    throw new Error('Character save did not return a persisted id');
                }

                await queryClient.invalidateQueries({ queryKey: ['characters'] });
                navigate(`/characters/${createdId}`);
                return;
            }

            const successMessage = `Character "${characterName}" saved successfully`;
            toastManager?.add({
                title: 'Character Saved',
                description: successMessage,
                type: 'success',
            });
            logPanel.addLogEntry({
                message: successMessage,
                type: 'success',
                source: 'character-editor',
            });

            // Drop cached details/resolve before leaving the editor. Navigating first
            // left the 5-minute cache in place, so view and the next edit showed pre-save data.
            await queryClient.invalidateQueries({ queryKey: ['characters'] });
            if (state.characterId) {
                const detailsKey = CharacterQueryHooks.getCharacterWithAllDetailsQueryKey(state.characterId);
                const resolvedKey = CharacterQueryHooks.getCharacterResolvedQueryKey(state.characterId);
                await queryClient.invalidateQueries({ queryKey: detailsKey });
                await queryClient.invalidateQueries({ queryKey: resolvedKey });
                queryClient.removeQueries({ queryKey: detailsKey });
                queryClient.removeQueries({ queryKey: resolvedKey });
            }

            if (isPersistedCharacter) {
                navigate(`/characters/${state.characterId}`);
                return;
            }

            if (state.characterId) {
                await queryClient.invalidateQueries({ queryKey: ['characters', 'item', state.characterId] });
                await queryClient.invalidateQueries({ queryKey: ['characters', 'details', state.characterId] });

                // Reload character data to get updated featureChoices from the database
                // This ensures the UI reflects what was actually saved
                try {
                    const updatedCharacter = await queryClient.fetchQuery({
                        queryKey: CharacterQueryHooks.getCharacterWithAllDetailsQueryKey(state.characterId),
                        queryFn: () => CharacterQueryHooks.getCharacterWithAllDetailsQueryFn({ pathParams: { id: state.characterId } }),
                        staleTime: 5 * 60 * 1000,
                        gcTime: 10 * 60 * 1000,
                    }) as CharacterWithAllDetailsResponse;

                    setCharacterData(updatedCharacter);

                    // Reload advancement data including featureChoices from the updated character
                    const currentLevel = state.level || 1;
                    const advancement = updatedCharacter.advancements.find(adv => adv.level === currentLevel);
                    if (advancement) {
                        // Update featureChoices from the database
                        updateState({
                            type: CharacterEditStateUpdateType.SET_FEATURE_CHOICES,
                            payload: { featureChoices: advancement.featureChoices || [] }
                        });

                        // Reload attack definitions to prevent them from being lost
                        if (updatedCharacter.attackDefinitions) {
                            updateState({
                                type: CharacterEditStateUpdateType.SET_ATTACK_DEFINITIONS,
                                payload: {
                                    attackDefinitions: updatedCharacter.attackDefinitions.map(def => ({
                                        id: def.id,
                                        attackSlot: def.attackSlot ?? null,
                                        mainHandCharacterItemId: def.mainHandCharacterItemId ?? null,
                                        offHandCharacterItemId: def.offHandCharacterItemId ?? null,
                                        wieldTwoHanded: def.wieldTwoHanded ?? false,
                                    }))
                                },
                            });
                        }

                        updateState({
                            type: CharacterEditStateUpdateType.SET_COMPANIONS,
                            payload: { companions: updatedCharacter.companions ?? [] },
                        });
                        updateState({
                            type: CharacterEditStateUpdateType.SET_SELECTED_FORMS,
                            payload: { selectedForms: updatedCharacter.selectedForms ?? [] },
                        });

                        // Resolution will be re-initialized when characterId changes
                        // No need to manually trigger resolution
                    }
                } catch (error) {
                    console.error('Failed to reload character after save:', error);
                }
            }
        } catch (error) {
            console.error('Failed to save character:', error);
            let errorMessage = 'Failed to save character';
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }

            toastManager?.add({
                title: 'Save Failed',
                description: errorMessage,
                type: 'error',
            });
            logPanel.addLogEntry({
                message: `Failed to save character: ${errorMessage}`,
                type: 'error',
                source: 'character-editor',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleNameModalSave = (): void => {
        const trimmedName = nameModalValue.trim();
        if (trimmedName) {
            setNameModalOpen(false);
            updateState({ type: CharacterEditStateUpdateType.SET_NAME, payload: { name: trimmedName } });
            handleSave(trimmedName);
        }
    };

    // Export handler
    const handleExport = async (): Promise<void> => {
        if (!state.characterId || state.characterId < 0) {
            toastManager?.add({
                title: 'Export Failed',
                description: 'Please save the character before exporting',
                type: 'error',
            });
            return;
        }

        try {
            setIsExporting(true);

            // Fetch character with all details - use TanStack Query cache
            const character = await queryClient.fetchQuery({
                queryKey: CharacterQueryHooks.getCharacterWithAllDetailsQueryKey(state.characterId),
                queryFn: () => CharacterQueryHooks.getCharacterWithAllDetailsQueryFn({ pathParams: { id: state.characterId } }),
                staleTime: 5 * 60 * 1000, // 5 minutes
                gcTime: 10 * 60 * 1000, // 10 minutes
            }) as CharacterWithAllDetailsResponse;

            if (!character) {
                throw new Error('Character not found');
            }

            // Build class details map
            const classDetailsMap = new Map<number, DnDClass>();

            // Get unique class IDs from advancements
            const classIds = new Set<number>();
            for (const advancement of character.advancements) {
                classIds.add(advancement.classId);
                if (advancement.secondaryClassId) {
                    classIds.add(advancement.secondaryClassId);
                }
            }

            // Fetch class details using TanStack Query cache
            for (const classId of classIds) {
                try {
                    const classData = await queryClient.fetchQuery({
                        queryKey: ClassQueryHooks.getClassByIdQueryKey(classId),
                        queryFn: () => ClassQueryHooks.getClassById(classId),
                        staleTime: 5 * 60 * 1000, // 5 minutes
                        gcTime: 10 * 60 * 1000, // 10 minutes
                    });
                    classDetailsMap.set(classId, classData);
                } catch (error) {
                    console.error(`Failed to fetch class ${classId}:`, error);
                }
            }

            // Generate PDF (pass queryClient, raceData, classSkills, and skillBonuses to use cache and backend data)
            await generateCharacterPdf(
                character,
                classDetailsMap,
                resolvedData.features,
                queryClient,
                raceData,
                resolvedData.classSkills.map(skill => ({ skillId: skill.skillId, skillSubId: skill.skillSubId ?? null })),
                resolvedData.skillBonuses.map(bonus => ({ skillId: bonus.skillId, skillSubId: bonus.skillSubId ?? null, bonus: bonus.bonus, source: bonus.source }))
            );

            toastManager?.add({
                title: 'Export Successful',
                description: 'Character sheet PDF has been downloaded',
                type: 'success',
            });
        } catch (error) {
            console.error('Failed to export character:', error);
            let errorMessage = 'Failed to export character';
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }

            toastManager?.add({
                title: 'Export Failed',
                description: errorMessage,
                type: 'error',
            });
        } finally {
            setIsExporting(false);
        }
    };

    // Fetch items for formatting using cache
    useEffect(() => {
        const fetchItems = async () => {
            try {
                const itemsResponse = await queryClient.fetchQuery({
                    queryKey: ItemQueryHooks.getAllItemsQueryKey(),
                    queryFn: () => ItemQueryHooks.getAllItemsQueryFn(),
                    staleTime: 5 * 60 * 1000, // 5 minutes
                    gcTime: 10 * 60 * 1000, // 10 minutes
                });
                if (itemsResponse?.results) {
                    setItems(itemsResponse.results);
                }
            } catch (error) {
                console.error('Failed to fetch items:', error);
            }
        };
        fetchItems();
    }, [queryClient]);

    // Fetch class details for formatting
    useEffect(() => {
        const fetchClassDetails = async () => {
            if (!characterData) return;

            const classIds = new Set<number>();
            for (const advancement of characterData.advancements) {
                if (advancement.classId > 0) {
                    classIds.add(advancement.classId);
                }
                if ((advancement.secondaryClassId ?? 0) > 0) {
                    classIds.add(advancement.secondaryClassId as number);
                }
            }

            const map = new Map<number, DnDClass>();
            const fetchPromises = Array.from(classIds).map(async (classId) => {
                try {
                    const classData = await queryClient.fetchQuery({
                        queryKey: ClassQueryHooks.getClassByIdQueryKey(classId),
                        queryFn: () => ClassQueryHooks.getClassById(classId),
                        staleTime: 5 * 60 * 1000, // 5 minutes
                        gcTime: 10 * 60 * 1000, // 10 minutes
                    });
                    map.set(classId, classData);
                } catch (error) {
                    console.error(`Failed to fetch class ${classId}:`, error);
                }
            });

            Promise.all(fetchPromises).then(() => {
                setClassDetailsMap(map);
            });
        };

        fetchClassDetails();
    }, [characterData, queryClient]);

    // Cache formatted character
    // Create a stable key for features to prevent unnecessary recalculations
    const progressionsKey = useMemo(() => {
        if (!resolvedData.features) return '';
        return resolvedData.features.map(p => p.id).sort((a, b) => a - b).join(',');
    }, [resolvedData.features]);

    // Create a stable key for skill ranks to ensure formattedCharacter recalculates when ranks change
    const skillRanksKey = useMemo(() => {
        return state.skillRanks.map(sr => `${sr.skillId}-${sr.skillSubId ?? 'null'}-${sr.customSubtype ?? 'null'}-${sr.pointsSpent}`).sort().join('|');
    }, [state.skillRanks]);

    const formattedCharacter = useMemo(() => {
        if (!characterData || !resolvedData.features || classDetailsMap.size === 0 || items.length === 0) {
            return null;
        }

        const characterSheetStrategy = displayStrategyFactory.createStrategy(DisplayType.CharacterSheet);
        if (!characterSheetStrategy.formatCharacter) {
            return null;
        }

        // Build character context for formatting
        const characterContext: import('@/lib/formatters/types').BaseCharacterInfo = {
            abilityScores: Object.fromEntries(
                characterData.abilityScores.map(a => [a.abilityId, a.value])
            ),
            classLevels: Object.fromEntries(
                Array.from(classDetailsMap.keys()).map(classId => {
                    const level = characterData.advancements.filter(a => a.classId === classId || a.secondaryClassId === classId).length;
                    return [classId, level];
                })
            ),
            raceId: characterData.raceId ?? undefined,
            sizeId: (() => {
                // Extract sizeId from resolved features
                if (characterData.raceId && resolvedData.features) {
                    const raceMechanics = extractRaceMechanics(resolvedData.features, characterData.raceId);
                    return raceMechanics.sizeId ?? undefined;
                }
                return undefined;
            })()
        };

        const editorCharacterItems = mapEquipmentToCharacterItems(
            state.equipment,
            state.characterId ?? characterData.id
        );
        const editorCharacter = {
            ...characterData,
            characterItems: editorCharacterItems,
            attackDefinitions: state.attackDefinitions.map((definition) => ({
                id: definition.id,
                characterId: state.characterId ?? characterData.id,
                attackSlot: definition.attackSlot,
                mainHandCharacterItemId: definition.mainHandCharacterItemId,
                offHandCharacterItemId: definition.offHandCharacterItemId,
                wieldTwoHanded: definition.wieldTwoHanded,
            })),
        };

        try {
            return characterSheetStrategy.formatCharacter(
                editorCharacter,
                resolvedData.features,
                items,
                editorCharacterItems,
                classDetailsMap,
                {
                    character: characterContext,
                    skillRanks: state.skillRanks,
                    classSkills: resolvedData.classSkills.map(skill => ({ skillId: skill.skillId, skillSubId: skill.skillSubId ?? null })),
                    skillBonuses: resolvedData.skillBonuses.map(bonus => ({ skillId: bonus.skillId, skillSubId: bonus.skillSubId ?? null, bonus: bonus.bonus, source: bonus.source }))
                },
                raceDetailsData ?? null
            );
        } catch (error) {
            console.error('Error formatting character:', error);
            return null;
        }
    }, [characterData, progressionsKey, classDetailsMap, items, raceDetailsData, queryClient, skillRanksKey, state.equipment, state.attackDefinitions, state.characterId]);

    // Separate bonus languages from characterLanguages when characterData is available
    useEffect(() => {
        if (!characterData?.characterLanguages || characterData.characterLanguages.length === 0) {
            // If no languages in database, clear selected bonus languages
            if (state.selectedBonusLanguages.length > 0) {
                updateState({
                    type: CharacterEditStateUpdateType.SET_SELECTED_BONUS_LANGUAGES,
                    payload: { selectedBonusLanguages: [] }
                });
            }
            return;
        }

        // Get all languages from character
        const allLanguageIds = characterData.characterLanguages.map(cl => cl.languageId);

        // Calculate automatic languages from all features (any source)
        // Use empty array if features aren't resolved yet - will update when they resolve
        const automaticLanguages = LanguageService.getAutomaticLanguages(resolvedData.features || []);

        // Get skill-based languages from skill ranks (skills with no max rank limit, e.g., Speak Language)
        const skillBasedLanguages = state.skillRanks
            .filter(skill => hasNoMaxRanks(skill.skillId))
            .map(skill => {
                if (skill.skillSubId !== null && skill.skillSubId !== undefined) {
                    return skill.skillSubId;
                }
                if (skill.customSubtype) {
                    const parsed = parseInt(skill.customSubtype, 10);
                    return isNaN(parsed) ? null : parsed;
                }
                return null;
            })
            .filter((id): id is number => id !== null);

        // Bonus languages are the remainder (not automatic, not skill-based)
        const bonusLanguages = allLanguageIds.filter(
            langId => !automaticLanguages.includes(langId) && !skillBasedLanguages.includes(langId)
        );

        // Only update if different to avoid infinite loops
        // Only sync FROM database TO state, not the other way around
        // Don't include state.selectedBonusLanguages in deps to avoid overwriting user selections
        const currentBonus = [...state.selectedBonusLanguages].sort().join(',');
        const newBonus = [...bonusLanguages].sort().join(',');
        if (currentBonus !== newBonus) {
            updateState({
                type: CharacterEditStateUpdateType.SET_SELECTED_BONUS_LANGUAGES,
                payload: { selectedBonusLanguages: bonusLanguages }
            });
        }
    }, [characterData?.characterLanguages, resolvedData.features, state.skillRanks, updateState]);

    // Tab configuration

    // Refetch character data (e.g., after attack definition changes)
    // Must be defined before early returns to avoid React Hook rules violation
    const refetchCharacter = useCallback(async () => {
        if (!state.characterId) return;

        try {
            // Invalidate the query to force a fresh fetch
            await queryClient.invalidateQueries({
                queryKey: CharacterQueryHooks.getCharacterWithAllDetailsQueryKey(state.characterId),
            });

            // Refetch the character data
            const updatedCharacter = await queryClient.fetchQuery({
                queryKey: CharacterQueryHooks.getCharacterWithAllDetailsQueryKey(state.characterId),
                queryFn: () => CharacterQueryHooks.getCharacterWithAllDetailsQueryFn({ pathParams: { id: state.characterId } }),
                staleTime: 5 * 60 * 1000,
                gcTime: 10 * 60 * 1000,
            }) as CharacterWithAllDetailsResponse;

            setCharacterData(updatedCharacter);

            // Update attack definitions in state
            if (updatedCharacter.attackDefinitions) {
                updateState({
                    type: CharacterEditStateUpdateType.SET_ATTACK_DEFINITIONS,
                    payload: {
                        attackDefinitions: updatedCharacter.attackDefinitions.map(def => ({
                            id: def.id,
                            attackSlot: def.attackSlot ?? null,
                            mainHandCharacterItemId: def.mainHandCharacterItemId ?? null,
                            offHandCharacterItemId: def.offHandCharacterItemId ?? null,
                            wieldTwoHanded: def.wieldTwoHanded ?? false,
                        }))
                    },
                });
            }
        } catch (error) {
            console.error('Error refetching character:', error);
        }
    }, [state.characterId, queryClient, updateState]);

    // Check if character has spellcasting classes
    const hasSpellcastingClasses = useMemo(() => {
        if (!characterData?.advancements) return false;
        return characterData.advancements.some(a => {
            const primaryClass = classDetailsMap.get(a.classId);
            const secondaryClass = a.secondaryClassId ? classDetailsMap.get(a.secondaryClassId) : null;
            return (primaryClass?.canCastSpells) || (secondaryClass?.canCastSpells);
        });
    }, [characterData?.advancements, classDetailsMap]);

    const tabs: TabConfig[] = useMemo(() => {
        const baseTabs: TabConfig[] = [
            { id: 'abilities-race', label: 'Abilities & Race', icon: UserIcon, component: AbilitiesRaceTab },
            { id: 'class', label: 'Class', icon: AcademicCapIcon, component: ClassTab },
            { id: 'skills', label: 'Skills', icon: ShieldCheckIcon, component: SkillsTab },
            { id: 'feats', label: 'Feats', icon: SparklesIcon, component: FeatsTab },
            { id: 'choices', label: 'Choices', icon: ListBulletIcon, component: ChoicesTab },
            { id: 'animals-pets', label: 'Animals & Pets', icon: HeartIcon, component: AnimalsPetsTab },
            { id: 'description', label: 'Description', icon: DocumentTextIcon, component: DescriptionTab },
            { id: 'equipment', label: 'Equipment', icon: BriefcaseIcon, component: EquipmentTab },
            { id: 'combat', label: 'Combat', icon: BoltIcon, component: CombatTab },
        ];

        // Add Spell Selection tab if character has spellcasting classes
        if (hasSpellcastingClasses) {
            baseTabs.push({ id: 'spell-selection', label: 'Spells', icon: SparklesIcon, component: SpellSelectionTab });
        }

        baseTabs.push({ id: 'configuration', label: 'Configuration', icon: CogIcon, component: ConfigurationTab });

        return baseTabs;
    }, [hasSpellcastingClasses]);

    const currentTab = tabs.find(tab => tab.id === activeTab);
    const CurrentTabComponent = currentTab?.component;

    if (!user || isLoadingCharacter) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Loading...
                    </h1>
                </div>
            </div>
        );
    }

    // Create tab props for the new centralized system
    const tabProps: TabComponentProps = {
        state,
        updateState,
        resolvedData,
        isLoading: isResolving,
        triggerFeatureResolution,
        handleSkillRankUpdate,
        formattedCharacter,
        sharedData: {
            allFeats,
            isLoadingFeats,
            primaryClass: primaryClassData,
            secondaryClass: secondaryClassData,
            race: raceData,
            isLoadingClasses: isLoadingPrimaryClass || isLoadingSecondaryClassData,
            isLoadingRace: isLoadingRaceData,
            classDetailsMap
        },
        character: characterData,
        refetchCharacter
    };

    return (
        <div className="max-w-7xl mx-auto py-6">
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                {/* Tab Navigation */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8 px-6 items-center justify-between">
                        <div className="flex space-x-8">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="ml-auto">
                            <Menu.Root>
                                <Menu.Trigger className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                    <Bars3Icon className="h-5 w-5" />
                                </Menu.Trigger>
                                <Menu.Portal>
                                    <Menu.Positioner className="outline-none" sideOffset={8}>
                                        <Menu.Popup className="min-w-[160px] origin-[var(--transform-origin)] rounded-md bg-white dark:bg-gray-800 py-1 text-gray-900 dark:text-gray-100 shadow-lg shadow-gray-200 dark:shadow-gray-900 outline outline-1 outline-gray-200 dark:outline-gray-700 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0">
                                            <Menu.Item
                                                onClick={() => {
                                                    startLevelUpDraft();
                                                }}
                                                disabled={isSaving || isLoadingCharacter || !characterData || !state.characterId || state.characterId < 1}
                                                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none"
                                            >
                                                Level Up
                                            </Menu.Item>
                                            <Menu.Item
                                                onClick={() => handleSave()}
                                                disabled={isSaving || isLoadingCharacter}
                                                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none"
                                            >
                                                {isSaving ? 'Saving...' : 'Save'}
                                            </Menu.Item>
                                            <Menu.Item
                                                onClick={() => handleExport()}
                                                disabled={isExporting || isLoadingCharacter || !state.characterId}
                                                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none"
                                                title={!state.characterId ? 'Save character before exporting' : 'Export character sheet as PDF'}
                                            >
                                                {isExporting ? 'Exporting...' : 'Export Character Sheet'}
                                            </Menu.Item>
                                        </Menu.Popup>
                                    </Menu.Positioner>
                                </Menu.Portal>
                            </Menu.Root>
                        </div>
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="bg-white dark:bg-gray-800">
                    {CurrentTabComponent && (
                        React.createElement(CurrentTabComponent as React.ComponentType<TabComponentProps>, tabProps)
                    )}
                </div>
            </div>

            {/* Name Prompt Modal */}
            <Dialog.Root open={nameModalOpen} onOpenChange={setNameModalOpen}>
                <Dialog.Backdrop className="fixed inset-0 bg-black opacity-20 transition-all duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 dark:opacity-70" />
                <Dialog.Portal>
                    <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="w-full max-w-md transform overflow-visible rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-800">
                            <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4">
                                Enter Character Name
                            </Dialog.Title>
                            <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                A character name is required to save.
                            </Dialog.Description>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleNameModalSave();
                                }}
                            >
                                <input
                                    type="text"
                                    value={nameModalValue}
                                    onChange={(e) => setNameModalValue(e.target.value)}
                                    placeholder="Character name"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    autoFocus
                                />
                                <div className="mt-4 flex justify-end space-x-2">
                                    <Dialog.Close className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors">
                                        Cancel
                                    </Dialog.Close>
                                    <button
                                        type="submit"
                                        disabled={!nameModalValue.trim()}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Save
                                    </button>
                                </div>
                            </form>
                        </div>
                    </Dialog.Popup>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
