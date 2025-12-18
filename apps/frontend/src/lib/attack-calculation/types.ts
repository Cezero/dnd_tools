import type { AttackDefinition } from '@/features/character/types';
import type { CalculatedCharacterStats } from '@/features/character/characterStatsCalculator';
import type {
    CharacterWithAllDetailsResponse,
    CharacterItem,
    DnDClass,
    ItemWithDetails,
    FeatureProgression,
} from '@shared/schema';

export interface AttackCalculationInput {
    attackDefinition: AttackDefinition;
    character: CharacterWithAllDetailsResponse;
    characterItems: CharacterItem[];
    items: ItemWithDetails[];
    classDetailsMap: Map<number, DnDClass>;
    resolvedProgressions: FeatureProgression[];
    stats: CalculatedCharacterStats;
}

export interface AttackCalculationResult {
    weaponName: string;
    totalAttackBonus: number;
    damage: string;
    critical: string;
    range: string | null;
    weight: string | null;
    type: string;
    size: string | null;
    specialProperties: string | null;
    isDualWield?: boolean;
    offHandResult?: AttackCalculationResult;
}

export interface ProficiencyResult {
    weaponCategories: number[];
    armorCategories: number[];
    itemIds: number[];
}

