import type { FormattedCharacterResult } from '@/lib/formatters/types';
import type { CharacterWithAllDetailsResponse, DnDClass, Spell, FeatureWithRelations, ResolvedCharacterCompanionDraft, ResolvedSelectedFormDraft } from '@shared/schema';

import type { RevisedStatBlockLookups } from '../stat-block/types';
import type { CharacterDetailState, CharacterDetailStateUpdate, CharacterResolutionReturn } from '../types';

/**
 * Props for SkillsTab component
 */
export interface SkillsTabProps {
    character: CharacterWithAllDetailsResponse;
    formattedCharacter: FormattedCharacterResult;
    resolvedProgressions: FeatureWithRelations[];
    characterId: number;
}

/**
 * Props for EquipmentTab component
 */
export interface EquipmentTabProps {
    character: CharacterWithAllDetailsResponse;
    formattedCharacter: FormattedCharacterResult;
    resolvedProgressions: FeatureWithRelations[];
    characterId: number;
    items: import('@shared/schema').ItemWithDetails[];
    state: CharacterDetailState;
    updateState: (update: CharacterDetailStateUpdate) => void;
}

/**
 * Grouped item type for equipment display
 */
export type GroupedItem = {
    id: number; // Unique identifier: first characterItemId from the group
    baseItemId: number;
    location: number | null;
    totalQuantity: number;
    name: string;
    weight: number | null;
    isOwned: boolean;
    characterItemIds: number[];
    typeId: number;
};

/**
 * Props for OverviewTab component
 */
export interface OverviewTabProps {
    character: CharacterWithAllDetailsResponse;
    formattedCharacter: FormattedCharacterResult;
    resolvedProgressions: FeatureWithRelations[];
    characterId: number;
    state: CharacterDetailState;
    updateState: (update: CharacterDetailStateUpdate) => void;
}

/**
 * Props for SpellsTab component
 */
export interface SpellsTabProps {
    character: CharacterWithAllDetailsResponse;
    formattedCharacter: FormattedCharacterResult;
    resolvedProgressions: FeatureWithRelations[];
    characterId: number;
    classDetailsMap: Map<number, DnDClass>;
    state: CharacterDetailState;
    updateState: (update: CharacterDetailStateUpdate) => void;
    resolution: CharacterResolutionReturn;
}

/**
 * Spell entry type for spells tab display
 */
export type SpellEntry = {
    id: number;
    spell: Spell;
    level: number;
    domainName?: string | null;
    isDomain: boolean;
    classSpellLevel: number | null;
    isKnown: boolean;
    // Computed fields for display
    spellName: string;
    school: string;
    components: string;
    castingTime: string;
    range: string;
    duration: string;
    savingThrow: string;
    spellResistance: string;
    description: string;
    reference: string;
    // Computed field for grouping - domainName for domain spells, null for regular spells
    categoryGroup: string | null;
};

/**
 * Props for FeaturesTab component
 */
export interface FeaturesTabProps {
    character: CharacterWithAllDetailsResponse;
    formattedCharacter: FormattedCharacterResult;
    resolvedProgressions: FeatureWithRelations[];
    characterId: number;
}

/**
 * Props for the Animals & Pets viewer tab.
 */
export interface AnimalsPetsTabProps {
    resolvedCompanions: ResolvedCharacterCompanionDraft[];
    resolvedSelectedForms: ResolvedSelectedFormDraft[];
}

/**
 * Props for one companion or pet revised-stat-block card.
 */
export interface CompanionBlockProps {
    companion: ResolvedCharacterCompanionDraft;
    lookups: RevisedStatBlockLookups;
    monsterName?: string;
}
