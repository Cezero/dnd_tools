import React from 'react';

import type { FormattedCharacterResult } from '@/lib/formatters';
import type { FeatureWithRelations, CharacterWithAllDetailsResponse, CharacterAdvancementWithDetailsResponse, Race, DnDClass, FeatureEntity, CharacterAbilityScoreResponse, CharacterFeatureChoice, CharacterDisallowedSource, FeatWithFeatureInfo, FeatInQueryResponse, PendingChoice, SkillBonus, ClassSpellSelection, ItemWithDetails } from '@shared/schema';
import { PROFICIENCY_TYPE_ENUM, ResolutionStepType, CoreComponent, SpellSlotType } from '@shared/static-data';

import { useCharacterResolution } from './useCharacterResolution';

// ============================================================================
// Tab Configuration Types
// ============================================================================

/**
 * Configuration for a tab in the character editor.
 * 
 * Frontend-specific type for React tab component configuration.
 * Used by CharacterEdit and CharacterDetail components to define available tabs.
 */
export interface TabConfig {
    /** Unique identifier for the tab */
    id: string;
    /** Display label shown in the tab bar */
    label: string;
    /** Icon component to display alongside the label */
    icon: React.ComponentType<{ className?: string }>;
    /** React component to render when tab is active */
    component: React.ComponentType;
}

// ============================================================================
// Ability Tab Types
// ============================================================================

/**
 * Represents a bonus applied to an ability score from a specific source.
 * 
 * Frontend-specific type for tracking ability bonuses in the UI.
 * Used during character editing to display and manage ability score modifications.
 */
export interface AbilityBonus {
    /** The ability ID (1=STR, 2=DEX, etc.) */
    abilityId: number;
    /** The bonus value (positive or negative) */
    bonus: number;
    /** Description of where this bonus comes from (e.g., "Racial", "Enhancement") */
    source: string;
}

/**
 * UI state for the Abilities/Race tab during character editing.
 * 
 * Frontend-specific type for managing ability score and race selection state.
 */
export interface AbilityTabState {
    /** Current ability scores from the database */
    abilityScores: CharacterAbilityScoreResponse[];
    /** Selected race ID */
    raceId: number | null;
    /** Computed ability bonuses from race and other sources */
    abilityBonuses: AbilityBonus[];
}

/** Partial update type for AbilityTabState */
export type AbilityTabUpdates = Partial<AbilityTabState>;

// ============================================================================
// Class Tab Types
// ============================================================================

/**
 * UI state for the Class tab during character editing.
 * 
 * Frontend-specific type for managing class selection and configuration.
 * Includes gestalt support and edition-specific settings.
 */
export interface ClassTabState {
    /** Primary class ID */
    classId: number | null;
    /** Secondary class ID (for gestalt characters) */
    secondaryClassId: number | null;
    /** Whether this is a gestalt character (dual-class feature) */
    isGestalt: boolean;
    /** Character level */
    level: number;
    /** Edition ID for ruleset selection */
    editionId: number;
    /** Whether to allow variant class features */
    allowVariantClasses: boolean;
    /** Whether to ignore level adjustment from race/template */
    ignoreLevelAdjustment: boolean;
    /** Source books that are disallowed for this character */
    disallowedSources: CharacterDisallowedSource[];
}

/** Partial update type for ClassTabState */
export type ClassTabUpdates = Partial<ClassTabState>;

// ============================================================================
// Skill Tab Types
// ============================================================================

/**
 * Represents skill rank allocation for a character.
 * 
 * Frontend-specific type for tracking skill point spending in the UI.
 * This differs from AdvancementSkill in @shared/schema which includes
 * advancementId for database persistence. SkillRank is used for in-memory
 * UI state during character editing before saving.
 * 
 * @see AdvancementSkill - Database schema type in @shared/schema/character.ts
 */
export interface SkillRank {
    /** The skill ID */
    skillId: number;
    /** Subtype ID for skills like Craft, Knowledge, Perform (null for non-subtyped skills) */
    skillSubId: number | null;
    /** Custom subtype name for user-defined subtypes */
    customSubtype: string | null;
    /** Number of skill points spent on this skill */
    pointsSpent: number;
}

// SkillBonus is imported from @shared/schema (character.ts)

/**
 * UI state for the Skills tab during character editing.
 * 
 * Frontend-specific type for managing skill allocation and display.
 */
export interface SkillTabState {
    /** Current skill rank allocations */
    skillRanks: SkillRank[];
    /** Skills that are class skills for this character */
    classSkills: Array<{ skillId: number; skillSubId: number | null }>;
    /** Skill bonuses from features, feats, and other sources */
    skillBonuses: SkillBonus[];
    /** Maximum ranks allowed in class skills (level + 3) */
    maxClassSkillRanks: number;
    /** Maximum ranks allowed in cross-class skills ((level + 3) / 2) */
    maxCrossClassSkillRanks: number;
    /** Remaining skill points to allocate */
    skillPointsAvailable: number;
}

/** Partial update type for SkillTabState */
export type SkillTabUpdates = Partial<SkillTabState>;

// ============================================================================
// Choice Tab Types
// ============================================================================
// PendingChoice is imported from @shared/schema (character.ts)

/**
 * UI state for the Choices tab during character editing.
 * 
 * Frontend-specific type for managing feature choices and pending selections.
 */
export interface ChoiceTabState {
    /** Choices that have been made and saved */
    featureChoices: CharacterFeatureChoice[];
    /** Choices that still need to be made */
    pendingChoices: PendingChoice[];
}

/** Partial update type for ChoiceTabState */
export type ChoiceTabUpdates = Partial<ChoiceTabState>;

// ============================================================================
// Feat Tab Types
// ============================================================================

/**
 * UI state for the Feats tab during character editing.
 * 
 * Frontend-specific type for managing feat selection and tracking.
 */
export interface FeatTabState {
    /** Feat IDs that the user has selected */
    selectedFeats: number[];
    /** Feat IDs that are automatically granted by class/race features */
    grantedFeats: number[];
    /** Number of feat slots available for selection */
    availableFeatsCount: number;
}

/** Partial update type for FeatTabState */
export type FeatTabUpdates = Partial<FeatTabState>;

// ============================================================================
// Description Tab Types
// ============================================================================

/**
 * UI state for the Description tab during character editing.
 * 
 * Frontend-specific type for managing character biographical information.
 */
export interface DescriptionTabState {
    /** Character name */
    name: string;
    /** Alignment ID */
    alignmentId: number | null;
    /** Character age in years */
    age: number | null;
    /** Character height in inches */
    height: number | null;
    /** Character weight (stored as string for flexibility) */
    weight: string | null;
    /** Eye color description */
    eyes: string | null;
    /** Hair color/style description */
    hair: string | null;
    /** Gender description */
    gender: string | null;
    /** Additional notes about the character */
    notes: string | null;
}

/** Partial update type for DescriptionTabState */
export type DescriptionTabUpdates = Partial<DescriptionTabState>;

// ============================================================================
// Equipment Tab Types
// ============================================================================

/**
 * Field Naming Convention for Equipment/Items:
 * 
 * - `id`: The unique identifier for a character item instance (database primary key or temporary ID)
 *   - Used for: filtering, tracking, membership checks, instance operations
 *   - Example: Multiple instances of "Longsword" have different `id` values
 * 
 * - `baseItemId`: The ID that references the base item definition in the items table
 *   - Used for: finding item details, grouping, tooltips, creating new items
 *   - Example: All "Longsword" instances share the same `baseItemId`
 * 
 * This distinction allows:
 * - Multiple instances of the same item with different locations/quantities
 * - Aggregation of items by baseItemId for display
 * - Proper lookup of item properties (weight, cost, etc.) from the items table
 */

/**
 * Represents an equipment item in the character's inventory.
 * 
 * Frontend-specific type for tracking equipment during character editing.
 * This is a simplified version for UI state; the database schema uses CharacterItem.
 * 
 * @see CharacterItem - Database schema type in @shared/schema/character.ts
 */
export interface EquipmentItem {
    /** Unique identifier for this equipment entry */
    id: number;
    /** ID of the base item from the items table (references item definition) */
    baseItemId: number | null;
    /** Cost in gold pieces (for refund calculations) */
    costInGp: number | null;
    /** Number of this item owned */
    quantity: number;
    /** Location enum value (null/0 = Owned, other values = specific equipment slots) */
    location: number | null;
    /** Additional notes about this item */
    notes: string | null;
}

/**
 * Represents the character's currency holdings.
 * 
 * Frontend-specific type for tracking money during character editing.
 * Maps to the platinum/gold/silver/copper fields in the Character schema.
 */
export interface Money {
    /** Platinum pieces (1 pp = 10 gp) */
    platinum: number;
    /** Gold pieces (base currency) */
    gold: number;
    /** Silver pieces (1 gp = 10 sp) */
    silver: number;
    /** Copper pieces (1 sp = 10 cp) */
    copper: number;
}

// ============================================================================
// Combat Tab Types
// ============================================================================

/**
 * Represents an attack configuration for the character.
 * 
 * Frontend-specific type for managing attack definitions in the UI.
 * Maps to CharacterAttackDefinition in the database schema.
 * 
 * @see CharacterAttackDefinition - Database schema type in @shared/schema/character.ts
 */
export interface AttackDefinition {
    /** Unique identifier for this attack definition */
    id: number;
    /** Attack slot number (1-7) for ordering attacks */
    attackSlot: number | null;
    /** Character item ID for the main hand weapon */
    mainHandCharacterItemId: number | null;
    /** Character item ID for the off-hand weapon/shield */
    offHandCharacterItemId: number | null;
}

/**
 * UI state for the Equipment tab during character editing.
 * 
 * Frontend-specific type for managing inventory and currency.
 */
export interface EquipmentTabState {
    /** List of equipment items */
    items: EquipmentItem[];
    /** Currency holdings */
    money: Money;
}

/** Partial update type for EquipmentTabState */
export type EquipmentTabUpdates = Partial<EquipmentTabState>;

// ============================================================================
// Configuration Tab Types (merged into ClassTabState)
// ============================================================================
// ConfigurationTabState has been merged into ClassTabState to eliminate redundancy

// ============================================================================
// Feature Resolution Types
// ============================================================================

/**
 * Input state for the feature resolution system.
 * 
 * Frontend-specific type that aggregates all inputs needed to resolve
 * character features. Used by useFeatureResolution hooks to compute
 * derived character data.
 */
export interface FeatureResolutionState {
    /** Choices that have been made for feature entities */
    featureChoices: CharacterFeatureChoice[];
    /** Selected race ID */
    raceId: number | null;
    /** Primary class ID */
    classId: number | null;
    /** Secondary class ID (for gestalt) */
    secondaryClassId: number | null;
    /** Character level */
    level: number;
    /** Edition ID for ruleset */
    editionId: number;
    /** Whether variant class features are allowed */
    allowVariantClasses: boolean;
    /** Whether this is a gestalt character */
    isGestalt: boolean;
    /** Whether to ignore level adjustment */
    ignoreLevelAdjustment: boolean;
    /** Disallowed source books */
    disallowedSources: CharacterDisallowedSource[];
}

// ============================================================================
// Analog Skill Types
// ============================================================================

/**
 * Input state for analog skill calculations.
 * 
 * Frontend-specific type for computing analog skills (skills that scale
 * with class levels rather than skill points, like Bardic Knowledge).
 */
export interface AnalogSkillState {
    /** Primary class ID */
    classId: number | null;
    /** Secondary class ID (for gestalt) */
    secondaryClassId: number | null;
    /** Whether this is a gestalt character */
    isGestalt: boolean;
    /** Character level */
    level: number;
    /** Current ability scores */
    abilityScores: Array<{
        abilityId: number;
        value: number;
    }>;
}

/**
 * Computed information about an analog skill.
 * 
 * Frontend-specific type for displaying analog skill details.
 */
export interface AnalogSkillInfo {
    /** The skill ID */
    skillId: number;
    /** Display name of the skill */
    skillName: string;
    /** Associated ability ID */
    abilityId: number;
    /** Display name of the associated ability */
    abilityName: string;
    /** Total levels in classes that grant this analog skill */
    classLevels: number;
    /** Modifier from the associated ability */
    abilityModifier: number;
    /** Total skill bonus */
    total: number;
    /** Names of classes that grant this analog skill */
    grantedByClasses: string[];
}

// ============================================================================
// Cascading Resolution Types
// ============================================================================

/**
 * Result of cascading feature resolution.
 * 
 * Frontend-specific type for tracking the full resolution chain when
 * features grant other features (e.g., a feat that grants bonus feats).
 */
export interface CascadingResolutionResult {
    /** All resolved feature features */
    resolvedProgressions: FeatureWithRelations[];
    /** Warning messages from resolution */
    warnings: string[];
    /** Error messages from resolution */
    errors: string[];
    /** Chain of resolution steps for debugging/display */
    resolutionChain: ResolutionStep[];
}

/**
 * A single step in the feature resolution chain.
 * 
 * Frontend-specific type for tracking resolution order and debugging.
 * Uses ResolutionStepType from @shared/static-data for step classification.
 * 
 * @see ResolutionStepType - Step type enum in @shared/static-data/CommonData.ts
 */
export interface ResolutionStep {
    /** Step number in the resolution chain */
    step: number;
    /** Human-readable description of what was resolved */
    description: string;
    /** Source of this resolution step (class name, feat name, etc.) */
    source: string;
    /** Level at which this resolution occurred */
    level: number;
    /** Type of resolution step */
    type: typeof ResolutionStepType[keyof typeof ResolutionStepType];
    /** Additional details about the resolution */
    details?: unknown;
}

// ============================================================================
// Feature Resolution Types
// ============================================================================

/**
 * Map of user choices keyed by appliesTo type.
 * 
 * Frontend-specific type for tracking user selections during feature resolution.
 */
export interface UserChoices {
    /** Maps EntityAppliesToType values to arrays of selected IDs */
    [appliesToType: number]: number[];
}

/**
 * Represents a proficiency granted by a feature.
 * 
 * Frontend-specific type for tracking proficiencies from features.
 * Uses PROFICIENCY_TYPE_ENUM from @shared/static-data for type classification.
 * 
 * @see PROFICIENCY_TYPE_ENUM - Proficiency type enum in @shared/static-data/ItemData.ts
 */
export interface GrantedProficiency {
    /** Proficiency type (SimpleWeapon, MartialWeapon, LightArmor, etc.) */
    type: keyof typeof PROFICIENCY_TYPE_ENUM;
    /** ID of the specific proficiency (weapon ID, armor ID, etc.) */
    id: number;
    /** Source of this proficiency (class name, feat name, etc.) */
    source: string;
}

/**
 * Context for feature resolution operations.
 * 
 * Frontend-specific type that provides all necessary context for resolving
 * character features, including character data, class/race details, and options.
 */
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

export interface ResolutionResult {
    resolvedProgressions: FeatureWithRelations[];
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
// Gestalt Feature Display Types
// ============================================================================
export interface GestaltProgressionDisplayProps {
    primaryClass: DnDClass;
    secondaryClass: DnDClass;
    /** Features resolved from primaryClass.featureIds (e.g. via ClassApi.getClassFeatures) */
    primaryFeatures?: FeatureWithRelations[];
    /** Features resolved from secondaryClass.featureIds (e.g. via ClassApi.getClassFeatures) */
    secondaryFeatures?: FeatureWithRelations[];
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
    resolvedProgressions: FeatureWithRelations[];
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
    resolvedProgressions: FeatureWithRelations[];
    isLoadingResolution: boolean;
    resolutionError: string | null;

    // Derived Data (computed from resolvedProgressions)
    classSkills: Array<{ skillId: number; skillSubId: number | null }>;
    skillBonuses: SkillBonus[];
    pendingChoices: PendingChoice[];
    grantedFeats: number[];
    availableFeatsCount: number;

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

    // Spells Tab UI State
    spellsKnown: Array<{ spellId: number; isFreeGrant: boolean }>;

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
    SET_SELECTED_BONUS_LANGUAGES = 36,
    SET_SPELLS_KNOWN = 37
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
            resolvedProgressions: FeatureWithRelations[];
            classSkills: Array<{ skillId: number; skillSubId: number | null }>;
            skillBonuses: SkillBonus[];
            pendingChoices: PendingChoice[];
            grantedFeats: number[];
            availableFeatsCount: number;
        }
    }
    | { type: CharacterEditStateUpdateType.SET_RESOLUTION_LOADING; payload: { isLoading: boolean } }
    | { type: CharacterEditStateUpdateType.SET_RESOLUTION_ERROR; payload: { error: string | null } }
    | { type: CharacterEditStateUpdateType.SET_CURRENT_ADVANCEMENT_ID; payload: { currentAdvancementId: number | null } }
    | { type: CharacterEditStateUpdateType.SET_ATTACK_DEFINITIONS; payload: { attackDefinitions: AttackDefinition[] } }
    | { type: CharacterEditStateUpdateType.SET_SELECTED_BONUS_LANGUAGES; payload: { selectedBonusLanguages: number[] } }
    | { type: CharacterEditStateUpdateType.SET_SPELLS_KNOWN; payload: { spellsKnown: Array<{ spellId: number; isFreeGrant: boolean }> } };

/**
 * Props interface for tab components using the centralized state system.
 */
export interface TabComponentProps {
    state: CharacterEditState;
    updateState: (update: CharacterEditStateUpdate) => void;
    resolvedData: {
        features: FeatureWithRelations[];
        classSkills: Array<{ skillId: number; skillSubId: number | null }>;
        skillBonuses: SkillBonus[];
        pendingChoices: PendingChoice[];
        grantedFeats: FeatureEntity[];
        /** Count of feat slots/choices available to the character. Answers "How many feats can you select?" */
        availableFeatsCount: number;
        availableFighterBonusFeats: number;
        /** List of feats the character qualifies for, filtered by prerequisites, proficiencies, owned feats, etc. Answers "Which feats can you select from?" */
        qualifiedFeats: FeatInQueryResponse[];
        spellSelection?: Record<string, ClassSpellSelection>;
    };
    isLoading: boolean;
    triggerFeatureResolution: () => Promise<void>;
    handleSkillRankUpdate?: (skillId: number, skillSubId: number | null, customSubtype: string | null, pointsSpent: number) => Promise<void>;
    formattedCharacter?: FormattedCharacterResult | null;
    // Shared data fetched in CharacterEdit and passed to all tabs
    sharedData: {
        allFeats: FeatWithFeatureInfo[];
        isLoadingFeats: boolean;
        featsMap: Map<number, FeatWithFeatureInfo>;
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
 * Source types for tracking where pooled Features originate.
 * 
 * Frontend-specific enum for runtime tracking of feature sources.
 * This is distinct from FeatureSourceType in @shared/static-data which
 * represents database source types. This enum tracks runtime pooling sources
 * including SecondaryClass for gestalt character support.
 * 
 * Note: Values intentionally differ from FeatureSourceType to avoid confusion
 * and because this enum serves a different purpose (UI pooling vs. database storage).
 * 
 * @see FeatureSourceType - Database source type enum in @shared/static-data/FeatureData.ts
 */
export enum FeatureSourceType {
    /** Feature from racial features */
    Race = 1,
    /** Feature from primary class features */
    Class = 2,
    /** Feature from secondary class (gestalt only) */
    SecondaryClass = 3,
    /** Feature from feat-granted features */
    Feat = 4,
    /** Feature from domain-granted features */
    Domain = 5,
    /** Feature from spell-granted features */
    Spell = 6,
    /** Feature from other feature grants */
    Feature = 7,
    /** Feature from user choices */
    Choice = 8
}

/**
 * A FeatureWithRelations with source tracking for UI pooling.
 * 
 * Frontend-specific type that extends FeatureWithRelations with metadata
 * about where the feature came from. Used for grouping and displaying
 * features by source in the character editor.
 */
export interface PooledFeature extends FeatureWithRelations {
    /** The type of source that provided this feature */
    poolSourceType: FeatureSourceType;
    /** The ID of the source (raceId, classId, domainId, etc.) */
    sourceId: number;
    /** For choices, which choice index this represents */
    choiceIndex?: number;
}

// ============================================================================
// Character Detail State Types
// ============================================================================

/**
 * Centralized state for CharacterDetail component.
 * 
 * Follows the same pattern as CharacterEditState - all editable fields
 * are tracked in centralized state, and CharacterDetail component uses
 * useEffect hooks to sync changes to the backend.
 */
export interface CharacterDetailState {
    characterId: number | null;

    // OverviewTab state
    wounds: number;

    // EquipmentTab state
    money: {
        platinum: number;
        gold: number;
        silver: number;
        copper: number;
    };
    // Items array - tracks character items (similar to equipment in CharacterEdit)
    items: Array<{
        id: number; // Database ID for existing items, temporary ID (negative) for new items
        baseItemId: number | null;
        quantity: number;
        location: number | null;
        name: string;
    }>;

    // DescriptionTab state
    notes: string | null;

    // SpellsTab state
    // Spell preparations array - tracks prepared spells (similar to equipment in CharacterEdit)
    spellPreparations: Array<{
        id: number | null; // Database ID for existing, null for new preparations
        classId: number;
        spellId: number;
        spellLevel: number;
        quantity: number;
        timesCast?: number; // Track cast status
        slotType?: SpellSlotType; // SpellSlotType enum value
        featId?: number | null;
    }>;
}

/**
 * Enum for CharacterDetail state update types.
 * 
 * Similar to CharacterEditStateUpdateType, defines all possible
 * state update operations for CharacterDetail.
 */
export enum CharacterDetailStateUpdateType {
    SET_CHARACTER_ID = 'SET_CHARACTER_ID',
    SET_WOUNDS = 'SET_WOUNDS',
    SET_MONEY = 'SET_MONEY',
    SET_ITEMS = 'SET_ITEMS',
    ADD_ITEM = 'ADD_ITEM',
    REMOVE_ITEM = 'REMOVE_ITEM',
    UPDATE_ITEM = 'UPDATE_ITEM',
    SET_NOTES = 'SET_NOTES',
    SET_SPELL_PREPARATIONS = 'SET_SPELL_PREPARATIONS',
    ADD_SPELL_PREPARATION = 'ADD_SPELL_PREPARATION',
    UPDATE_SPELL_PREPARATION = 'UPDATE_SPELL_PREPARATION',
    REMOVE_SPELL_PREPARATION = 'REMOVE_SPELL_PREPARATION',
    CAST_SPELL = 'CAST_SPELL',
    UNCAST_SPELL = 'UNCAST_SPELL',
}

/**
 * Update action type for CharacterDetail state.
 * 
 * Discriminated union type that ensures type safety for state updates.
 */
export type CharacterDetailStateUpdate =
    | { type: CharacterDetailStateUpdateType.SET_CHARACTER_ID; payload: { characterId: number | null } }
    | { type: CharacterDetailStateUpdateType.SET_WOUNDS; payload: { wounds: number } }
    | { type: CharacterDetailStateUpdateType.SET_MONEY; payload: { money: { platinum?: number; gold?: number; silver?: number; copper?: number } } }
    | { type: CharacterDetailStateUpdateType.SET_ITEMS; payload: { items: CharacterDetailState['items'] } }
    | { type: CharacterDetailStateUpdateType.ADD_ITEM; payload: { item: CharacterDetailState['items'][0] } }
    | { type: CharacterDetailStateUpdateType.REMOVE_ITEM; payload: { id: number } }
    | { type: CharacterDetailStateUpdateType.UPDATE_ITEM; payload: { item: CharacterDetailState['items'][0] } }
    | { type: CharacterDetailStateUpdateType.SET_NOTES; payload: { notes: string | null } }
    | { type: CharacterDetailStateUpdateType.SET_SPELL_PREPARATIONS; payload: { spellPreparations: CharacterDetailState['spellPreparations'] } }
    | { type: CharacterDetailStateUpdateType.ADD_SPELL_PREPARATION; payload: { spellPreparation: CharacterDetailState['spellPreparations'][0] } }
    | { type: CharacterDetailStateUpdateType.UPDATE_SPELL_PREPARATION; payload: { spellPreparation: CharacterDetailState['spellPreparations'][0] } }
    | { type: CharacterDetailStateUpdateType.REMOVE_SPELL_PREPARATION; payload: { spellPreparationId: number } }
    | { type: CharacterDetailStateUpdateType.CAST_SPELL; payload: { classId: number; spellId: number } }
    | { type: CharacterDetailStateUpdateType.UNCAST_SPELL; payload: { classId: number; spellId: number } };

// ============================================================================
// Character Resolution Types
// ============================================================================

/**
 * Return type for useCharacterResolution hook
 */
export type CharacterResolutionReturn = ReturnType<typeof useCharacterResolution>;

/**
 * Props for the DescriptionTab component.
 * 
 * Frontend-specific type for the DescriptionTab component props.
 * Used by CharacterDetail to pass data to the DescriptionTab component.
 */
export interface DescriptionTabProps {
    character: CharacterWithAllDetailsResponse;
    formattedCharacter: FormattedCharacterResult;
    resolvedProgressions: FeatureWithRelations[];
    characterId: number;
    state: CharacterDetailState;
    updateState: (update: CharacterDetailStateUpdate) => void;
}

// ============================================================================
// Equipment Utility Types
// ============================================================================

/**
 * Represents an item that has been aggregated by baseItemId and location.
 * 
 * Frontend-specific type for UI display of aggregated equipment items.
 * Used by equipment utility functions to group items with the same baseItemId and location.
 */
export interface AggregatedItem<T extends ItemWithDetails = ItemWithDetails> {
    /** The item details */
    item: T;
    /** Total quantity of the aggregated item */
    quantity: number;
    /** Array of equipment item IDs that were aggregated */
    equipmentItemIds: number[];
    /** The first equipment item ID (used for reference) */
    firstEquipmentItemId: number;
    /** The location where the item is stored */
    location: number | null;
}

/**
 * Represents an equipment item with minimal required fields.
 * 
 * Frontend-specific type for equipment utility functions that work with
 * equipment items from various sources (state, API responses, etc.).
 */
export interface EquipmentItemBase {
    /** The equipment item ID */
    id: number;
    /** The base item ID (references the item definition) */
    baseItemId: number | null;
    /** The quantity of the item */
    quantity?: number | null;
    /** The location where the item is stored */
    location?: number | null;
}

// ============================================================================
// Spellcasting Utility Types
// ============================================================================

/**
 * Represents a spellcasting class with its level.
 * 
 * Frontend-specific type for UI display of spellcasting classes.
 * Used by spellcasting utility functions to provide class information with level tracking.
 */
export interface SpellcastingClassInfo {
    /** The class ID */
    classId: number;
    /** The class details */
    class: DnDClass;
    /** The class level (total levels in this class) */
    level: number;
}
