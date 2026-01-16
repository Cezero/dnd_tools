/**
 * All tab-related prop interfaces
 */

import type { Race, RaceSummary, DnDClass, CharacterAbilityScoreResponse, CharacterFeatureChoice, CharacterSpellSelectionEntry } from '@shared/schema';

// ============================================================================
// Abilities Race Tab Props
// ============================================================================

export interface AbilitiesRaceTabProps {
    abilityState: import('../types').AbilityTabState;
    onUpdate: (data: import('../types').AbilityTabUpdates) => void;
    races?: RaceSummary[];
    selectedRaceDetails?: Race | null;
}

// ============================================================================
// Class Tab Props
// ============================================================================

export interface ClassTabProps {
    classState: import('../types').ClassTabState;
    onUpdate: (updates: import('../types').ClassTabUpdates) => void;
    selectedClassDetails?: DnDClass | null;
    onClassDetailsChange: (classDetails: DnDClass | null) => void;
    onSecondaryClassDetailsChange?: (classDetails: DnDClass | null) => void;
}

// ============================================================================
// Skills Tab Props
// ============================================================================

export interface SkillsTabProps {
    skillState: import('../types').SkillTabState;
    abilityScores: CharacterAbilityScoreResponse[];
    level: number;
    onUpdate: (updates: import('../types').SkillTabUpdates) => void;
    selectedRaceDetails?: Race | null;
    selectedClassDetails?: DnDClass | null;
}

// ============================================================================
// Choices Tab Props
// ============================================================================

export interface ChoicesTabProps {
    choiceState: import('../types').ChoiceTabState;
    onUpdate: (updates: { featureChoices: CharacterFeatureChoice[] }) => void;
    selectedRaceDetails?: Race | null;
    selectedClassDetails?: DnDClass | null;
    selectedSecondaryClassDetails?: DnDClass | null;
    editionId?: number;
}

// ============================================================================
// Feats Tab Props
// ============================================================================

export interface FeatsTabProps {
    featState: import('../types').FeatTabState;
    onUpdate: (updates: import('../types').FeatTabUpdates) => void;
    races?: RaceSummary[];
    selectedRaceDetails?: Race | null;
    selectedClassDetails?: DnDClass | null;
}

// ============================================================================
// Description Tab Props
// ============================================================================

export interface DescriptionTabProps {
    descriptionState: import('../types').DescriptionTabState;
    onUpdate: (updates: import('../types').DescriptionTabUpdates) => void;
    races?: RaceSummary[];
    selectedRaceDetails?: Race | null;
}

// ============================================================================
// Equipment Tab Props
// ============================================================================

export interface EquipmentTabProps {
    equipmentState: import('../types').EquipmentTabState;
    onUpdate: (updates: import('../types').EquipmentTabUpdates) => void;
}

// ============================================================================
// Configuration Tab Props
// ============================================================================

export interface ConfigurationTabProps {
    classState: import('../types').ClassTabState;
    onUpdate: (updates: import('../types').ClassTabUpdates) => void;
}

// ============================================================================
// Spell Selection Tab Types
// ============================================================================

/**
 * Extended spell selection entry with additional display fields
 */
export type SpellSelectionEntry = CharacterSpellSelectionEntry & {
    level: number; // Spell level from SpellLevelMap for grouping
    domainName?: string | null; // Domain name if this is a domain spell
};

// ============================================================================
// Description Tab Types
// ============================================================================

/**
 * Age table data based on D&D 3.5e rules
 * Table 6-4: Random Starting Ages
 */
export interface AgeTableEntry {
    adulthood: number;
    category1: { dice: number; sides: number }; // Barbarian, Rogue, Sorcerer
    category2: { dice: number; sides: number }; // Bard, Fighter, Paladin, Ranger
    category3: { dice: number; sides: number }; // Cleric, Druid, Monk, Wizard
}

/**
 * Height and Weight table data based on D&D 3.5e rules
 * Table 6-6: Random Height and Weight
 */
export interface HeightWeightEntry {
    baseHeightInches: number; // Base height in total inches
    heightModifier: { dice: number; sides: number };
    baseWeight: number; // Base weight in pounds
    weightModifier: { dice: number; sides: number } | null; // null means "× 1 lb"
}

// ============================================================================
// Combat Tab Types
// ============================================================================

/**
 * Calculated attack display type for combat tab
 */
export interface CalculatedAttackDisplay {
    attackDefinition: import('../types').AttackDefinition;
    weaponName: string;
    totalAttackBonus: number | string; // Can be number or "X / Y nonlethal" string
    damage: string;
    critical: string;
    range: string | null;
    weight: string | null;
    type: string;
    size: string | null;
    specialProperties: string | null;
    uniqueKey: string; // Unique identifier for React keys
}
