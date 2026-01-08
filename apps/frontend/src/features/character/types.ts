import React from 'react';

import type { FeatureProgression, CharacterWithAllDetailsResponse, CharacterAdvancementWithDetailsResponse, Race, DnDClass, FeatureEntity, CharacterAbilityScoreResponse, CharacterFeatureChoice, CharacterDisallowedSource, Feat, FeatInQueryResponse } from '@shared/schema';
import { EntityAppliesToType, PROFICIENCY_TYPE_ENUM, ResolutionStepType, CoreComponent } from '@shared/static-data';
import type { FormattedCharacterResult } from '@/lib/formatters';

// ============================================================================
// Tab Configuration Types
// ============================================================================
export interface TabConfig {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    component: React.ComponentType;
}

// ============================================================================
// Ability Tab Types
// ============================================================================
export interface AbilityBonus {
    abilityId: number;
    bonus: number;
    source: string;
}

export interface AbilityTabState {
    abilityScores: CharacterAbilityScoreResponse[];
    raceId: number | null;
    abilityBonuses: AbilityBonus[];
}

export type AbilityTabUpdates = Partial<AbilityTabState>;

// ============================================================================
// Class Tab Types
// ============================================================================
export interface ClassTabState {
    classId: number | null;
    secondaryClassId: number | null;
    isGestalt: boolean;
    level: number;
    editionId: number;
    allowVariantClasses: boolean;
    ignoreLevelAdjustment: boolean;
    disallowedSources: CharacterDisallowedSource[];
}

export type ClassTabUpdates = Partial<ClassTabState>;

// ============================================================================
// Skill Tab Types
// ============================================================================
export interface SkillRank {
    skillId: number;
    skillSubId: number | null;
    customSubtype: string | null;
    pointsSpent: number;
}

export interface SkillBonus {
    skillId: number;
    skillSubId: number | null;
    bonus: number;
    source: string;
}

export interface SkillTabState {
    skillRanks: SkillRank[];
    classSkills: Array<{ skillId: number; skillSubId: number | null }>;
    skillBonuses: SkillBonus[];
    maxClassSkillRanks: number;
    maxCrossClassSkillRanks: number;
    skillPointsAvailable: number;
}

export type SkillTabUpdates = Partial<SkillTabState>;

// ============================================================================
// Choice Tab Types
// ============================================================================
export interface PendingChoice {
    id: string;
    type: EntityAppliesToType;
    name: string;
    description: string;
    source: string;
    level: number;
    required: boolean;
    maxSelections: number;
    minSelections: number;
    options: Array<{
        id: string;
        name: string;
        description: string;
        value: number;
    }>;
}

export interface ChoiceTabState {
    featureChoices: CharacterFeatureChoice[];
    pendingChoices: PendingChoice[];
}

export type ChoiceTabUpdates = Partial<ChoiceTabState>;

// ============================================================================
// Feat Tab Types
// ============================================================================
export interface FeatTabState {
    selectedFeats: number[];
    grantedFeats: number[];
    availableFeats: number;
}

export type FeatTabUpdates = Partial<FeatTabState>;

// ============================================================================
// Description Tab Types
// ============================================================================
export interface DescriptionTabState {
    name: string;
    alignmentId: number | null;
    age: number | null;
    height: number | null;
    weight: string | null;
    eyes: string | null;
    hair: string | null;
    gender: string | null;
    notes: string | null;
}

export type DescriptionTabUpdates = Partial<DescriptionTabState>;

// ============================================================================
// Equipment Tab Types
// ============================================================================
export interface EquipmentItem {
    id: number;
    itemId: number | null; // ID of the purchased item (for refunds)
    costInGp: number | null; // Cost in gold pieces (for refunds)
    quantity: number;
    location: number | null; // Location enum value (null/0 = Owned, other values = specific locations)
    notes: string | null;
}

export interface Money {
    platinum: number;
    gold: number;
    silver: number;
    copper: number;
}

// ============================================================================
// Combat Tab Types
// ============================================================================
export interface AttackDefinition {
    id: number;
    attackSlot: number | null;
    mainHandCharacterItemId: number | null;
    offHandCharacterItemId: number | null;
}

export interface EquipmentTabState {
    items: EquipmentItem[];
    money: Money;
}

export type EquipmentTabUpdates = Partial<EquipmentTabState>;

// ============================================================================
// Configuration Tab Types (merged into ClassTabState)
// ============================================================================
// ConfigurationTabState has been merged into ClassTabState to eliminate redundancy

// ============================================================================
// Feature Resolution Types
// ============================================================================
export interface FeatureResolutionState {
    featureChoices: CharacterFeatureChoice[];
    raceId: number | null;
    classId: number | null;
    secondaryClassId: number | null;
    level: number;
    editionId: number;
    allowVariantClasses: boolean;
    isGestalt: boolean;
    ignoreLevelAdjustment: boolean;
    disallowedSources: CharacterDisallowedSource[];
}

// ============================================================================
// Analog Skill Types
// ============================================================================
export interface AnalogSkillState {
    classId: number | null;
    secondaryClassId: number | null;
    isGestalt: boolean;
    level: number;
    abilityScores: Array<{
        abilityId: number;
        value: number;
    }>;
}

export interface AnalogSkillInfo {
    skillId: number;
    skillName: string;
    abilityId: number;
    abilityName: string;
    classLevels: number; // Total levels in classes that grant this skill
    abilityModifier: number;
    total: number;
    grantedByClasses: string[]; // Names of classes that grant this skill
}

// ============================================================================
// Cascading Resolution Types
// ============================================================================
export interface CascadingResolutionResult {
    resolvedProgressions: FeatureProgression[];
    warnings: string[];
    errors: string[];
    resolutionChain: ResolutionStep[];
}

export interface ResolutionStep {
    step: number;
    description: string;
    source: string;
    level: number;
    type: typeof ResolutionStepType[keyof typeof ResolutionStepType];
    details?: unknown;
}

// ============================================================================
// Feature Resolution Types
// ============================================================================
export interface UserChoices {
    [appliesToType: number]: number[]; // Generic: appliesTo type -> array of selected IDs
}

export interface GrantedProficiency {
    type: keyof typeof PROFICIENCY_TYPE_ENUM;
    id: number;
    source: string;
}

export interface ResolutionContext {
    character: CharacterWithAllDetailsResponse;
    targetLevel: number;
    advancement: CharacterAdvancementWithDetailsResponse;

    // Source details
    raceDetails?: Race;
    classDetails?: DnDClass;
    secondaryClassDetails?: DnDClass; // For gestalt
    effectiveClassDetails?: DnDClass; // Merged gestalt class (if applicable)

    // Gestalt configuration
    isGestalt: boolean;

    // User choices (if already made)
    userChoices?: UserChoices;

    // Resolution options
    includePendingChoices: boolean;
    resolveCascading: boolean;
    maxResolutionDepth: number; // Prevent infinite loops
}

export interface ChoiceOption {
    id: string;
    name: string;
    description: string;
    value: number; // ID of the choice (domainId, featId, etc.)
    prerequisites?: string[];
}

export interface ResolutionResult {
    resolvedProgressions: FeatureProgression[];
    pendingChoices: PendingChoice[];
    warnings: string[];
    errors: string[];
}

// ============================================================================
// Choice Presentation Types
// ============================================================================
export interface ChoicePresentationProps {
    choice: PendingChoice;
    onSelectionChange: (choiceId: string, selectedValues: number[]) => void;
    selectedValues?: number[];
}

// ============================================================================
// Feature Entity Processing Types
// ============================================================================
export interface EntityProcessingResult {
    grants: FeatureEntity[]; // The entities that grant features
    warnings?: string[];
    errors?: string[];
}

// ============================================================================
// Feature Resolution Service Types
// ============================================================================
export interface ResolveFeatureParams {
    classId: number | null;
    secondaryClassId: number | null;
    level: number;
    raceDetails: Race | null;
    classDetails: DnDClass | null;
    secondaryClassDetails: DnDClass | null;
    featureChoices: CharacterFeatureChoice[];
    abilityScores: Array<{
        abilityId: number;
        value: number;
    }>;
}

export interface ResolvedFeatures {
    abilityBonuses: Array<{
        abilityId: number;
        bonus: number;
        source: string;
    }>;
    classSkills: Array<{
        skillId: number;
        skillSubId: number | null;
    }>;
    skillBonuses: Array<{
        skillId: number;
        skillSubId: number | null;
        bonus: number;
        source: string;
    }>;
    pendingChoices: Array<PendingChoice>;
}

// ============================================================================
// Gestalt Progression Display Types
// ============================================================================
export interface GestaltProgressionDisplayProps {
    primaryClass: DnDClass;
    secondaryClass: DnDClass;
    showHeader?: boolean;
}

// ============================================================================
// Pending Choices List Types
// ============================================================================
export interface PendingChoicesListProps {
    choices: PendingChoice[];
    featureChoices: CharacterFeatureChoice[];
    onChoicesResolved: (resolvedChoices: Record<string, number[]>) => void;
    domainCache?: Record<number, CoreComponent>;
    getDomainData?: (domainId: number) => Promise<CoreComponent>;
}

// ============================================================================
// Feature Resolution Hook Types
// ============================================================================
export interface UseFeatureResolutionProps {
    character: CharacterWithAllDetailsResponse;
    raceDetails?: Race | null;
    classDetails?: DnDClass | null;
    secondaryClassDetails?: DnDClass | null;
    userChoices?: UserChoices;
}

export interface FeatureResolutionReturn {
    resolvedProgressions: FeatureProgression[];
    isLoading: boolean;
    error: string | null;
    isClassSkill: (skillId: number, skillSubId?: number | null) => boolean;
    getGrantedFeats: () => number[];
    getGrantedProficiencies: () => Array<{ type: string; id: number; source: string }>;
    getPendingChoices: () => Promise<PendingChoice[]>;
    calculateSkillTotal: (skillId: number, skillSubId: number | null, baseTotal: number) => number;
}

export interface UseFeatureResolutionFromFormProps {
    formState: FeatureResolutionState;
    raceDetails?: Race | null;
    classDetails?: DnDClass | null;
    secondaryClassDetails?: DnDClass | null;
}

export interface UseResolvedFeaturesProps {
    character: CharacterWithAllDetailsResponse;
    targetLevel: number;
    advancement: CharacterAdvancementWithDetailsResponse;
    raceDetails?: Race | null;
    classDetails?: DnDClass | null;
    secondaryClassDetails?: DnDClass | null;
    userChoices?: UserChoices;
}

// ============================================================================
// Centralized Character Edit State Types
// ============================================================================

/**
 * Centralized state for CharacterEdit component that eliminates per-tab state management
 * and provides a single source of truth for all character data.
 */
export interface CharacterEditState {
    // ============================================================================
    // RAW INPUTS (FeatureResolution System Inputs)
    // ============================================================================

    // Core Character Identity
    characterId: number | null;
    name: string;
    level: number;
    currentAdvancementId: number | null;

    // Race & Abilities (AbilityTab inputs)
    raceId: number | null;
    abilityScores: CharacterAbilityScoreResponse[];
    abilityBonuses: AbilityBonus[];

    // Class & Configuration (ClassTab + ConfigurationTab inputs)
    classId: number | null;
    secondaryClassId: number | null;
    isGestalt: boolean;
    editionId: number | null;
    allowVariantClasses: boolean;
    ignoreLevelAdjustment: boolean;
    disallowedSources: CharacterDisallowedSource[];

    // User Choices (ChoicesTab inputs)
    featureChoices: CharacterFeatureChoice[];

    // ============================================================================
    // RESOLVED OUTPUTS (FeatureResolution System Outputs)
    // ============================================================================

    // Core Resolution Results
    resolvedProgressions: FeatureProgression[];
    isLoadingResolution: boolean;
    resolutionError: string | null;

    // Derived Data (computed from resolvedProgressions)
    classSkills: Array<{ skillId: number; skillSubId: number | null }>;
    skillBonuses: SkillBonus[];
    pendingChoices: PendingChoice[];
    grantedFeats: number[];
    availableFeats: number;

    // ============================================================================
    // UI STATE (Tab-specific data not affecting FeatureResolution)
    // ============================================================================

    // Skills Tab UI State
    skillRanks: SkillRank[];
    skillPointsAvailable: number;
    maxClassSkillRanks: number;
    maxCrossClassSkillRanks: number;

    // Feats Tab UI State
    selectedFeats: number[];
    featSubIds: Record<number, number | null>; // Map of featId -> featSubId (for feats with useSubId)

    // Description Tab UI State
    alignmentId: number | null;
    age: number | null;
    height: number | null;
    weight: string | null;
    eyes: string | null;
    hair: string | null;
    gender: string | null;
    notes: string | null;
    selectedBonusLanguages: number[];

    // Equipment Tab UI State
    equipment: EquipmentItem[];
    money: Money;

    // Combat Tab UI State
    attackDefinitions: AttackDefinition[];
}

/**
 * Granular update types for performance optimization.
 * Each update type targets specific state properties to minimize re-renders.
 */
export enum CharacterEditStateUpdateType {
    SET_CHARACTER_ID = 0,
    SET_NAME = 1,
    SET_LEVEL = 2,
    SET_RACE = 3,
    SET_ABILITY_SCORES = 4,
    SET_ABILITY_BONUSES = 5,
    SET_CLASS = 6,
    SET_SECONDARY_CLASS = 7,
    SET_IS_GESTALT = 8,
    SET_EDITION = 9,
    SET_ALLOW_VARIANT_CLASSES = 10,
    SET_IGNORE_LEVEL_ADJUSTMENT = 11,
    SET_DISALLOWED_SOURCES = 12,
    SET_FEATURE_CHOICES = 13,
    SET_SKILL_RANKS = 14,
    SET_SKILL_POINTS_AVAILABLE = 15,
    SET_MAX_CLASS_SKILL_RANKS = 16,
    SET_MAX_CROSS_CLASS_SKILL_RANKS = 17,
    SET_SELECTED_FEATS = 18,
    SET_FEAT_SUB_IDS = 19,
    SET_ALIGNMENT = 20,
    SET_AGE = 22,
    SET_HEIGHT = 23,
    SET_WEIGHT = 24,
    SET_EYES = 25,
    SET_HAIR = 26,
    SET_GENDER = 27,
    SET_NOTES = 28,
    SET_EQUIPMENT = 29,
    SET_MONEY = 30,
    SET_RESOLVED_DATA = 31,
    SET_RESOLUTION_LOADING = 32,
    SET_RESOLUTION_ERROR = 33,
    SET_CURRENT_ADVANCEMENT_ID = 34,
    SET_ATTACK_DEFINITIONS = 35,
    SET_SELECTED_BONUS_LANGUAGES = 36
}

export type CharacterEditStateUpdate =
    | { type: CharacterEditStateUpdateType.SET_CHARACTER_ID; payload: { characterId: number | null } }
    | { type: CharacterEditStateUpdateType.SET_NAME; payload: { name: string } }
    | { type: CharacterEditStateUpdateType.SET_LEVEL; payload: { level: number } }
    | { type: CharacterEditStateUpdateType.SET_RACE; payload: { raceId: number | null } }
    | { type: CharacterEditStateUpdateType.SET_ABILITY_SCORES; payload: { abilityScores: CharacterAbilityScoreResponse[] } }
    | { type: CharacterEditStateUpdateType.SET_ABILITY_BONUSES; payload: { abilityBonuses: AbilityBonus[] } }
    | { type: CharacterEditStateUpdateType.SET_CLASS; payload: { classId: number | null } }
    | { type: CharacterEditStateUpdateType.SET_SECONDARY_CLASS; payload: { secondaryClassId: number | null } }
    | { type: CharacterEditStateUpdateType.SET_IS_GESTALT; payload: { isGestalt: boolean } }
    | { type: CharacterEditStateUpdateType.SET_EDITION; payload: { editionId: number | null } }
    | { type: CharacterEditStateUpdateType.SET_ALLOW_VARIANT_CLASSES; payload: { allowVariantClasses: boolean } }
    | { type: CharacterEditStateUpdateType.SET_IGNORE_LEVEL_ADJUSTMENT; payload: { ignoreLevelAdjustment: boolean } }
    | { type: CharacterEditStateUpdateType.SET_DISALLOWED_SOURCES; payload: { disallowedSources: CharacterDisallowedSource[] } }
    | { type: CharacterEditStateUpdateType.SET_FEATURE_CHOICES; payload: { featureChoices: CharacterFeatureChoice[] } }
    | { type: CharacterEditStateUpdateType.SET_SKILL_RANKS; payload: { skillRanks: SkillRank[] } }
    | { type: CharacterEditStateUpdateType.SET_SKILL_POINTS_AVAILABLE; payload: { skillPointsAvailable: number } }
    | { type: CharacterEditStateUpdateType.SET_MAX_CLASS_SKILL_RANKS; payload: { maxClassSkillRanks: number } }
    | { type: CharacterEditStateUpdateType.SET_MAX_CROSS_CLASS_SKILL_RANKS; payload: { maxCrossClassSkillRanks: number } }
    | { type: CharacterEditStateUpdateType.SET_SELECTED_FEATS; payload: { selectedFeats: number[] } }
    | { type: CharacterEditStateUpdateType.SET_FEAT_SUB_IDS; payload: { featSubIds: Record<number, number | null> } }
    | { type: CharacterEditStateUpdateType.SET_ALIGNMENT; payload: { alignmentId: number | null } }
    | { type: CharacterEditStateUpdateType.SET_AGE; payload: { age: number | null } }
    | { type: CharacterEditStateUpdateType.SET_HEIGHT; payload: { height: number | null } }
    | { type: CharacterEditStateUpdateType.SET_WEIGHT; payload: { weight: string | null } }
    | { type: CharacterEditStateUpdateType.SET_EYES; payload: { eyes: string | null } }
    | { type: CharacterEditStateUpdateType.SET_HAIR; payload: { hair: string | null } }
    | { type: CharacterEditStateUpdateType.SET_GENDER; payload: { gender: string | null } }
    | { type: CharacterEditStateUpdateType.SET_NOTES; payload: { notes: string | null } }
    | { type: CharacterEditStateUpdateType.SET_EQUIPMENT; payload: { equipment: EquipmentItem[] } }
    | { type: CharacterEditStateUpdateType.SET_MONEY; payload: { money: Money } }
    | {
        type: CharacterEditStateUpdateType.SET_RESOLVED_DATA; payload: {
            resolvedProgressions: FeatureProgression[];
            classSkills: Array<{ skillId: number; skillSubId: number | null }>;
            skillBonuses: SkillBonus[];
            pendingChoices: PendingChoice[];
            grantedFeats: number[];
            availableFeats: number;
        }
    }
    | { type: CharacterEditStateUpdateType.SET_RESOLUTION_LOADING; payload: { isLoading: boolean } }
    | { type: CharacterEditStateUpdateType.SET_RESOLUTION_ERROR; payload: { error: string | null } }
    | { type: CharacterEditStateUpdateType.SET_CURRENT_ADVANCEMENT_ID; payload: { currentAdvancementId: number | null } }
    | { type: CharacterEditStateUpdateType.SET_ATTACK_DEFINITIONS; payload: { attackDefinitions: AttackDefinition[] } }
    | { type: CharacterEditStateUpdateType.SET_SELECTED_BONUS_LANGUAGES; payload: { selectedBonusLanguages: number[] } };

/**
 * Props interface for tab components using the centralized state system.
 */
export interface TabComponentProps {
    state: CharacterEditState;
    updateState: (update: CharacterEditStateUpdate) => void;
    resolvedData: {
        progressions: FeatureProgression[];
        classSkills: Array<{ skillId: number; skillSubId: number | null }>;
        skillBonuses: SkillBonus[];
        pendingChoices: PendingChoice[];
        grantedFeats: FeatureEntity[];
        availableFeats: number;
        availableFighterBonusFeats: number;
    };
    isLoading: boolean;
    triggerFeatureResolution: () => Promise<void>;
    handleChoiceSelection?: (choiceType: number, selectedId: number, features: FeatureProgression[]) => Promise<void>;
    handleSkillRankUpdate?: (skillId: number, skillSubId: number | null, customSubtype: string | null, pointsSpent: number) => Promise<void>;
    formattedCharacter?: FormattedCharacterResult | null;
    // Shared data fetched in CharacterEdit and passed to all tabs
    sharedData: {
        allFeats: FeatInQueryResponse[];
        isLoadingFeats: boolean;
        featsMap: Map<number, Feat>;
        isLoadingFullFeats: boolean;
        primaryClass: DnDClass | null;
        secondaryClass: DnDClass | null;
        race: Race | null;
        isLoadingClasses: boolean;
        isLoadingRace: boolean;
        classDetailsMap: Map<number, DnDClass>;
    };
    // Character data for prerequisite checking
    character: CharacterWithAllDetailsResponse | null;
    // Callback to refetch character data (e.g., after attack definition changes)
    refetchCharacter?: () => Promise<void>;
}

/**
 * Source types for tracking where FeatureProgressions come from
 */
export enum FeatureProgressionSourceType {
    Race = 1,
    Class = 2,
    SecondaryClass = 3,
    Feat = 4,
    Domain = 5,
    Spell = 6,
    Feature = 7,
    Choice = 8
}

/**
 * A FeatureProgression with source tracking
 */
export interface PooledFeatureProgression extends FeatureProgression {
    poolSourceType: FeatureProgressionSourceType;
    sourceId: number; // The ID of the source (raceId, classId, domainId, etc.)
    choiceIndex?: number; // For choices, which choice this represents
}

