import { Dialog } from '@base-ui-components/react/dialog';
import { Menu } from '@base-ui-components/react/menu';
import {
    UserIcon, ShieldCheckIcon, AcademicCapIcon, SparklesIcon, DocumentTextIcon, BriefcaseIcon, CogIcon, ListBulletIcon, BoltIcon, Bars3Icon
} from '@heroicons/react/24/outline';
import { useQueryClient } from '@tanstack/react-query';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { useLogPanel } from '@/components/log-panel';
import { useToast } from '@/components/toast/useToast';
import { useCharacterEditState } from '@/features/character';
import { CharacterApi } from '@/features/character/CharacterApi';
import { CharacterEditStateUpdateType, type EquipmentItem, type SkillRank, type TabConfig, type TabComponentProps } from '@/features/character/types';
import { displayStrategyFactory } from '@/lib/formatters';
import { LanguageService } from '@/lib/LanguageService';
import { CharacterQueryHooks } from '@/services/query/CharacterQueryHooks';
import { ClassQueryHooks } from '@/services/query/ClassQueryHooks';
import { FeatQueryHooks } from '@/services/query/FeatQueryHooks';
import { ItemQueryHooks } from '@/services/query/ItemQueryHooks';
import { RaceQueryHooks } from '@/services/query/RaceQueryHooks';
import type { Race, DnDClass, CharacterWithAllDetailsResponse, FeatInQueryResponse, Feat, ItemWithDetails, FeatureProgression } from '@shared/schema';
import { EditionId, Skill, DisplayType } from '@shared/static-data';

import { generateCharacterPdf } from './characterPdfService';
import { AbilitiesRaceTab, ChoicesTab, ClassTab, ConfigurationTab, DescriptionTab, EquipmentTab, FeatsTab, SkillsTab, CombatTab, SpellSelectionTab } from './tabs';
import { useCharacterResolution } from './useCharacterResolution';
import { CharacterResolutionApi, type CharacterUpdate } from '@/services/api/CharacterResolutionApi';
import { useCacheFunctions } from '@/services/cache';

export function CharacterEdit(): React.JSX.Element {
    const { user, isLoading: isAuthLoading } = useAuthAuto();
    const { state, updateState } = useCharacterEditState();
    const queryClient = useQueryClient();
    const { id } = useParams<{ id: string }>();
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
    const [allFeats, setAllFeats] = useState<FeatInQueryResponse[]>([]);
    const [isLoadingFeats, setIsLoadingFeats] = useState(false);
    const [featsMap, setFeatsMap] = useState<Map<number, Feat>>(new Map());
    const [isLoadingFullFeats, setIsLoadingFullFeats] = useState(false);

    // Initialize from user preferences
    useEffect(() => {
        if (!isAuthLoading && user) {
            const userPreferredEdition = (user as { preferredEditionId?: number | null })?.preferredEditionId;
            if (userPreferredEdition) {
                updateState({ type: CharacterEditStateUpdateType.SET_EDITION, payload: { editionId: userPreferredEdition } });
            } else {
                updateState({ type: CharacterEditStateUpdateType.SET_EDITION, payload: { editionId: EditionId.DND_3x } });
            }
        }
    }, [user, isAuthLoading, updateState]);

    // Use imperative API for race, class, and secondary class details
    const [raceDetailsData, setRaceDetailsData] = useState<(Race & { features?: FeatureProgression[] }) | null>(null);
    const [classDetailsData, setClassDetailsData] = useState<(DnDClass & { features?: FeatureProgression[] }) | null>(null);
    const [secondaryClassDetailsData, setSecondaryClassDetailsData] = useState<(DnDClass & { features?: FeatureProgression[] }) | null>(null);

    // Calculate class levels from characterData for filtering feat choices by class level
    const classLevels = useMemo(() => {
        if (!characterData?.advancements) return new Map<number, number>();
        const levels = new Map<number, number>();
        for (const advancement of characterData.advancements) {
            const currentLevel = levels.get(advancement.classId) ?? 0;
            levels.set(advancement.classId, currentLevel + 1);
            if (advancement.secondaryClassId) {
                const secondaryLevel = levels.get(advancement.secondaryClassId) ?? 0;
                levels.set(advancement.secondaryClassId, secondaryLevel + 1);
            }
        }
        return levels;
    }, [characterData?.advancements]);

    // Use new character resolution hook with backend session management
    const resolution = useCharacterResolution(state.characterId || null);

    // Compute derived data from resolved character result
    const resolvedData = useMemo(() => {
        if (!resolution.resolvedCharacter) {
            return {
                progressions: [],
                classSkills: [],
                skillBonuses: [],
                pendingChoices: [],
                grantedFeats: [],
                availableFeats: 0,
                availableFighterBonusFeats: 0
            };
        }

        return {
            progressions: resolution.resolvedCharacter.resolvedProgressions,
            classSkills: resolution.resolvedCharacter.classSkills.map((skill): { skillId: number; skillSubId: number | null } => ({ skillId: skill.skillId, skillSubId: skill.skillSubId ?? null })),
            skillBonuses: resolution.resolvedCharacter.skillBonuses.map((bonus): { skillId: number; skillSubId: number | null; bonus: number; source: string } => ({ skillId: bonus.skillId, skillSubId: bonus.skillSubId ?? null, bonus: bonus.bonus, source: bonus.source })),
            pendingChoices: resolution.resolvedCharacter.pendingChoices,
            grantedFeats: resolution.resolvedCharacter.grantedFeats.map(featId => ({
                id: 0,
                progressionId: 0,
                type: 0,
                appliesTo: 2, // EntityAppliesToType.Feat
                appliesToId: featId,
                appliesToSubId: null,
                value: null,
                bonusType: null,
                formulaParamsId: null,
                groupingId: 0,
                displayInDetail: true,
                filterType: null,
            })),
            availableFeats: resolution.resolvedCharacter.availableFeats,
            availableFighterBonusFeats: resolution.resolvedCharacter.availableFighterBonusFeats
        };
    }, [resolution.resolvedCharacter]);

    const isResolving = resolution.isLoading;
    const resolutionError = resolution.error;

    // Handle choice selection - apply update to resolution session
    const handleChoiceSelection = useCallback(async (choiceType: number, selectedId: number, _features: FeatureProgression[]) => {
        if (!state.characterId || !resolution.sessionId) {
            console.warn('Cannot save choice: session not initialized');
            return;
        }

        // Find the pending choice to get progressionId and featureEntityId
        const pendingChoice = resolvedData.pendingChoices.find(p =>
            p.type === choiceType && p.options.some(opt => opt.value === selectedId)
        );

        if (!pendingChoice) {
            console.warn(`Pending choice not found for type ${choiceType}, id ${selectedId}`);
            return;
        }

        // Extract progressionId and featureEntityId from pending choice ID
        const [progressionIdStr, featureEntityIdStr] = pendingChoice.id.split('-');
        const progressionId = parseInt(progressionIdStr, 10);
        const featureEntityId = parseInt(featureEntityIdStr, 10);

        if (isNaN(progressionId) || isNaN(featureEntityId)) {
            console.warn(`Invalid pending choice ID: ${pendingChoice.id}`);
            return;
        }

        // Apply update via resolution API
        try {
            const update: CharacterUpdate = {
                type: 'MAKE_CHOICE',
                payload: {
                    progressionId,
                    featureEntityId,
                    appliesToId: selectedId,
                    appliesToSubId: null
                }
            };

            await resolution.applyUpdate(update);
        } catch (error) {
            console.error('Failed to apply choice update:', error);
        }
    }, [state.characterId, resolution, resolvedData.pendingChoices]);

    // Handle skill rank update - sync to backend resolution API
    const handleSkillRankUpdate = useCallback(async (skillId: number, skillSubId: number | null, customSubtype: string | null, pointsSpent: number) => {
        if (!state.characterId || !resolution.sessionId) {
            console.warn('Cannot update skill rank: session not initialized');
            return;
        }

        try {
            const update: CharacterUpdate = {
                type: 'SET_SKILL_RANK',
                payload: {
                    skillId,
                    skillSubId,
                    customSubtype,
                    pointsSpent
                }
            };

            await resolution.applyUpdate(update);
        } catch (error) {
            console.error('Failed to apply skill rank update:', error);
        }
    }, [state.characterId, resolution.sessionId, resolution.applyUpdate]);

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

    // Fetch all feats on component mount (shared across tabs)
    // Use TanStack Query to leverage caching and prevent infinite loops
    useEffect(() => {
        let isMounted = true;
        const fetchAllFeats = async () => {
            try {
                setIsLoadingFeats(true);
                // Use queryClient.fetchQuery to leverage TanStack Query cache
                const featResponse = await queryClient.fetchQuery({
                    queryKey: FeatQueryHooks.getFeatsQueryKey(),
                    queryFn: FeatQueryHooks.getFeatsQueryFn,
                    staleTime: 5 * 60 * 1000, // 5 minutes
                    gcTime: 10 * 60 * 1000, // 10 minutes
                });
                // getFeats returns GetAllFeatsResponse which has results: FeatInQueryResponse[]
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
        fetchAllFeats();
        return () => {
            isMounted = false;
        };
    }, [queryClient]);

    // Fetch all full feats (with benefits and prereqs) on component mount
    // Use TanStack Query to leverage caching
    useEffect(() => {
        let isMounted = true;
        const fetchAllFullFeats = async () => {
            try {
                setIsLoadingFullFeats(true);
                // Use TanStack Query fetch method which handles caching automatically
                const fullFeatResponse = await FeatQueryHooks.getAllFeatsFull(
                    undefined,
                    {
                        staleTime: 5 * 60 * 1000, // 5 minutes
                        cacheTime: 10 * 60 * 1000, // 10 minutes
                    },
                    queryClient
                );
                // getAllFeatsFull returns FeatQueryResponse which has results: Feat[]
                if (isMounted && fullFeatResponse?.results) {
                    // Build a Map for fast lookup by feat ID
                    const map = new Map<number, Feat>();
                    for (const feat of fullFeatResponse.results) {
                        map.set(feat.id, feat);
                    }
                    console.log('[CharacterEdit] FeatsMap populated:', { size: map.size, hasFeat306: map.has(306) });
                    setFeatsMap(map);
                } else if (isMounted) {
                    setFeatsMap(new Map());
                }
            } catch (error) {
                console.error('Failed to fetch full feats:', error);
                if (isMounted) {
                    setFeatsMap(new Map());
                }
            } finally {
                if (isMounted) {
                    setIsLoadingFullFeats(false);
                }
            }
        };
        fetchAllFullFeats();
        return () => {
            isMounted = false;
        };
    }, [queryClient]);


    // Helper function to extract choices from character advancements
    const getCharacterFeatureChoices = useCallback((): Array<{ progressionId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }> | undefined => {
        if (!characterData?.advancements) return undefined;

        // Collect all feature choices from all advancements
        const choices: Array<{ progressionId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }> = [];
        for (const advancement of characterData.advancements) {
            if (advancement.featureChoices) {
                for (const choice of advancement.featureChoices) {
                    choices.push({
                        progressionId: choice.progressionId,
                        featureEntityId: choice.featureEntityId,
                        appliesToId: choice.appliesToId,
                        appliesToSubId: choice.appliesToSubId,
                    });
                }
            }
        }
        return choices.length > 0 ? choices : undefined;
    }, [characterData]);

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
                const choices = getCharacterFeatureChoices();
                // Use queryClient.fetchQuery to leverage TanStack Query cache
                const raceData = await queryClient.fetchQuery({
                    queryKey: [...RaceQueryHooks.getRaceByIdQueryKey(state.raceId), choices ? JSON.stringify(choices) : 'no-choices'],
                    queryFn: () => RaceQueryHooks.getRaceById(state.raceId, choices),
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
    }, [state.raceId, queryClient, getCharacterFeatureChoices]);

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
                const choices = getCharacterFeatureChoices();
                // Use queryClient.fetchQuery to leverage TanStack Query cache
                const classData = await queryClient.fetchQuery({
                    queryKey: [...ClassQueryHooks.getClassByIdQueryKey(state.classId), choices ? JSON.stringify(choices) : 'no-choices'],
                    queryFn: () => ClassQueryHooks.getClassById(state.classId, choices),
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
    }, [state.classId, queryClient, getCharacterFeatureChoices]);

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
                const choices = getCharacterFeatureChoices();
                // Use queryClient.fetchQuery to leverage TanStack Query cache
                const classData = await queryClient.fetchQuery({
                    queryKey: [...ClassQueryHooks.getClassByIdQueryKey(state.secondaryClassId), choices ? JSON.stringify(choices) : 'no-choices'],
                    queryFn: () => ClassQueryHooks.getClassById(state.secondaryClassId, choices),
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
    }, [state.secondaryClassId, queryClient, getCharacterFeatureChoices]);

    // Feature resolution is handled by useCharacterResolution hook with backend API

    // TODO: Add domain management back when we implement domain choice handling

    // Load character when ID is present in URL - use TanStack Query cache
    useEffect(() => {
        const loadCharacter = async () => {
            if (!id || !user) return;

            const characterId = parseInt(id, 10);
            if (isNaN(characterId)) return;

            try {
                setIsLoadingCharacter(true);
                const character = await queryClient.fetchQuery({
                    queryKey: CharacterQueryHooks.getCharacterWithAllDetailsQueryKey(characterId),
                    queryFn: () => CharacterQueryHooks.getCharacterWithAllDetailsQueryFn({ pathParams: { id: characterId } }),
                    staleTime: 5 * 60 * 1000, // 5 minutes
                    gcTime: 10 * 60 * 1000, // 10 minutes
                }) as CharacterWithAllDetailsResponse;
                setCharacterData(character);

                // Find advancement for current level (default level 1)
                const currentLevel = 1; // Default to level 1 for now
                const advancement = character.advancements.find(adv => adv.level === currentLevel);

                // Update character basic info
                updateState({ type: CharacterEditStateUpdateType.SET_CHARACTER_ID, payload: { characterId: character.id } });
                updateState({ type: CharacterEditStateUpdateType.SET_NAME, payload: { name: character.name } });
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
                updateState({ type: CharacterEditStateUpdateType.SET_ALLOW_VARIANT_CLASSES, payload: { allowVariantClasses: character.allowVariantClasses } });
                updateState({ type: CharacterEditStateUpdateType.SET_IS_GESTALT, payload: { isGestalt: character.isGestalt } });
                updateState({ type: CharacterEditStateUpdateType.SET_IGNORE_LEVEL_ADJUSTMENT, payload: { ignoreLevelAdjustment: character.ignoreLevelAdjustment } });

                // Load ability scores
                updateState({ type: CharacterEditStateUpdateType.SET_ABILITY_SCORES, payload: { abilityScores: character.abilityScores } });

                // Load money
                updateState({
                    type: CharacterEditStateUpdateType.SET_MONEY,
                    payload: {
                        money: {
                            platinum: character.platinum ?? 0,
                            gold: character.gold ?? 0,
                            silver: character.silver ?? 0,
                            copper: character.copper ?? 0,
                        },
                    },
                });

                // Load equipment
                // Only load items that have a valid baseItemId (purchased items)
                // Items without baseItemId would be filtered out on save anyway
                if (character.characterItems) {
                    const equipment: EquipmentItem[] = character.characterItems
                        .filter(item => item.baseItemId !== null && item.baseItemId !== undefined)
                        .map((item) => ({
                            id: item.id,
                            itemId: item.baseItemId!,
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
                            }))
                        },
                    });
                }

                // Load advancement data if it exists
                if (advancement) {
                    updateState({ type: CharacterEditStateUpdateType.SET_CURRENT_ADVANCEMENT_ID, payload: { currentAdvancementId: advancement.id } });
                    updateState({ type: CharacterEditStateUpdateType.SET_CLASS, payload: { classId: advancement.classId } });
                    if (advancement.secondaryClassId) {
                        updateState({ type: CharacterEditStateUpdateType.SET_SECONDARY_CLASS, payload: { secondaryClassId: advancement.secondaryClassId } });
                    }

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

                    // Load feature choices
                    updateState({ type: CharacterEditStateUpdateType.SET_FEATURE_CHOICES, payload: { featureChoices: advancement.featureChoices } });
                } else {
                    // No advancement for current level
                    updateState({ type: CharacterEditStateUpdateType.SET_CURRENT_ADVANCEMENT_ID, payload: { currentAdvancementId: null } });
                }

                // Languages will be loaded and separated in a useEffect when resolvedData is available
            } catch (error) {
                console.error('Failed to load character:', error);
            } finally {
                setIsLoadingCharacter(false);
            }
        };

        loadCharacter();
    }, [id, user, state.level, updateState, queryClient]);

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

            // Add automatic languages from feature progressions (any source)
            if (resolvedData.progressions && resolvedData.progressions.length > 0) {
                const automaticLanguages = LanguageService.getAutomaticLanguages(resolvedData.progressions);
                allLanguages.push(...automaticLanguages);
            }

            // Add selected bonus languages
            allLanguages.push(...state.selectedBonusLanguages);

            // Add skill-based languages from skill ranks
            const skillBasedLanguages = state.skillRanks
                .filter(skill => skill.skillId === Skill.SpeakLanguage)
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

            // Build the complete character object with nested data
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
                // Include money
                platinum: state.money.platinum,
                gold: state.money.gold,
                silver: state.money.silver,
                copper: state.money.copper,
                // Include ability scores if any exist
                abilityScores: state.abilityScores.length > 0 ? state.abilityScores.map(score => ({
                    abilityId: score.abilityId,
                    value: score.value,
                })) : undefined,
                // Include advancement if class is selected
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
                    // Include feature choices (choices made in ChoicesTab)
                    // Omit id, characterId, and advancementId as per CreateCharacterFeatureChoiceSchema
                    featureChoices: state.featureChoices.length > 0 ? state.featureChoices.map(choice => ({
                        progressionId: choice.progressionId,
                        featureEntityId: choice.featureEntityId,
                        appliesToId: choice.appliesToId,
                        appliesToSubId: choice.appliesToSubId ?? null,
                        choiceIndex: choice.choiceIndex ?? null,
                    })) : undefined,
                } : undefined,
                // Include equipment (only items with itemId, which are purchased items)
                // Send individual items to preserve location per instance
                // Only send if there are items to avoid accidentally deleting all equipment
                equipment: (() => {
                    const equipmentItems = state.equipment
                        .filter(item => item.itemId !== null)
                        .map(item => ({
                            name: item.notes || 'Unknown Item',
                            quantity: item.quantity || 1,
                            location: item.location ?? null,
                            baseItemId: item.itemId!,
                        }));
                    // Return undefined if empty to preserve existing equipment
                    return equipmentItems.length > 0 ? equipmentItems : undefined;
                })(),
                // Include attack definitions
                attackDefinitions: state.attackDefinitions.map(def => ({
                    attackSlot: def.attackSlot ?? null,
                    mainHandCharacterItemId: def.mainHandCharacterItemId,
                    offHandCharacterItemId: def.offHandCharacterItemId,
                })),
                // Include character languages
                characterLanguages: uniqueLanguages.length > 0 ? uniqueLanguages.map(languageId => ({
                    languageId
                })) : undefined,
            };

            // Debug: Log the save data to verify featureChoices are included
            // Save resolution session to database first (if session exists)
            if (state.characterId && resolution.sessionId) {
                try {
                    await resolution.saveSession();
                } catch (error) {
                    console.error('Failed to save resolution session:', error);
                    // Continue with regular save even if session save fails
                }
            }

            // Use unified save endpoint - backend handles all orchestration
            let result;
            if (state.characterId) {
                result = await CharacterApi.saveCharacter(saveData, { id: state.characterId });
            } else {
                result = await CharacterApi.createCharacterWithSave(saveData);
                const characterId = parseInt(result.id, 10);
                updateState({ type: CharacterEditStateUpdateType.SET_CHARACTER_ID, payload: { characterId } });
                updateState({ type: CharacterEditStateUpdateType.SET_NAME, payload: { name: characterName } });
            }

            // Show success notifications
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

            // Invalidate queries to ensure fresh data on next load
            await queryClient.invalidateQueries({ queryKey: ['characters'] });
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
                                    }))
                                },
                            });
                        }

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
            handleSave(trimmedName);
        }
    };

    // Export handler
    const handleExport = async (): Promise<void> => {
        if (!state.characterId) {
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

            // Extract choices from character advancements
            const choices: Array<{ progressionId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }> = [];
            for (const advancement of character.advancements) {
                if (advancement.featureChoices) {
                    for (const choice of advancement.featureChoices) {
                        choices.push({
                            progressionId: choice.progressionId,
                            featureEntityId: choice.featureEntityId,
                            appliesToId: choice.appliesToId,
                            appliesToSubId: choice.appliesToSubId,
                        });
                    }
                }
            }
            const featureChoices = choices.length > 0 ? choices : undefined;

            // Fetch class details using TanStack Query cache
            for (const classId of classIds) {
                try {
                    const classData = await queryClient.fetchQuery({
                        queryKey: [...ClassQueryHooks.getClassByIdQueryKey(classId), featureChoices ? JSON.stringify(featureChoices) : 'no-choices'],
                        queryFn: () => ClassQueryHooks.getClassById(classId, featureChoices),
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
                resolvedData.progressions,
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
                    queryKey: ItemQueryHooks.getItemsQueryKey(),
                    queryFn: () => ItemQueryHooks.getItemsQueryFn(),
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
                classIds.add(advancement.classId);
                if (advancement.secondaryClassId) {
                    classIds.add(advancement.secondaryClassId);
                }
            }

            // Extract choices from character advancements
            const choices: Array<{ progressionId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }> = [];
            if (characterData?.advancements) {
                for (const advancement of characterData.advancements) {
                    if (advancement.featureChoices) {
                        for (const choice of advancement.featureChoices) {
                            choices.push({
                                progressionId: choice.progressionId,
                                featureEntityId: choice.featureEntityId,
                                appliesToId: choice.appliesToId,
                                appliesToSubId: choice.appliesToSubId,
                            });
                        }
                    }
                }
            }
            const featureChoices = choices.length > 0 ? choices : undefined;

            const map = new Map<number, DnDClass>();
            const fetchPromises = Array.from(classIds).map(async (classId) => {
                try {
                    const classData = await queryClient.fetchQuery({
                        queryKey: [...ClassQueryHooks.getClassByIdQueryKey(classId), featureChoices ? JSON.stringify(featureChoices) : 'no-choices'],
                        queryFn: () => ClassQueryHooks.getClassById(classId, featureChoices),
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
    // Create a stable key for progressions to prevent unnecessary recalculations
    const progressionsKey = useMemo(() => {
        if (!resolvedData.progressions) return '';
        return resolvedData.progressions.map(p => p.id).sort((a, b) => a - b).join(',');
    }, [resolvedData.progressions]);

    // Create a stable key for skill ranks to ensure formattedCharacter recalculates when ranks change
    const skillRanksKey = useMemo(() => {
        return state.skillRanks.map(sr => `${sr.skillId}-${sr.skillSubId ?? 'null'}-${sr.customSubtype ?? 'null'}-${sr.pointsSpent}`).sort().join('|');
    }, [state.skillRanks]);

    const formattedCharacter = useMemo(() => {
        if (!characterData || !resolvedData.progressions || classDetailsMap.size === 0 || items.length === 0 || featsMap.size === 0) {
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
            sizeId: (characterData.race && 'sizeId' in characterData.race && typeof characterData.race.sizeId === 'number') ? characterData.race.sizeId : undefined
        };

        try {
            return characterSheetStrategy.formatCharacter(
                characterData,
                resolvedData.progressions,
                items,
                characterData.characterItems || [],
                classDetailsMap,
                {
                    character: characterContext,
                    featsMap,
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
    }, [characterData, progressionsKey, classDetailsMap, items, raceDetailsData, featsMap, skillRanksKey]);

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

        // Calculate automatic languages from all progressions (any source)
        // Use empty array if progressions aren't resolved yet - will update when they resolve
        const automaticLanguages = LanguageService.getAutomaticLanguages(resolvedData.progressions || []);

        // Get skill-based languages from skill ranks
        const skillBasedLanguages = state.skillRanks
            .filter(skill => skill.skillId === Skill.SpeakLanguage)
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
    }, [characterData?.characterLanguages, resolvedData.progressions, state.skillRanks, updateState]);

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
        handleChoiceSelection,
        handleSkillRankUpdate,
        formattedCharacter,
        sharedData: {
            allFeats,
            isLoadingFeats,
            featsMap,
            isLoadingFullFeats,
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
