/**
 * All tab-related prop interfaces
 */

import type { Race, RaceSummary, DnDClass, CharacterAbilityScoreResponse, CharacterFeatureChoice } from '@shared/schema';

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
