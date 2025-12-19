import type {
    CharacterWithAllDetailsResponse,
    CharacterItem,
    ItemWithDetails,
    FeatureProgression,
    CharacterFeatureChoice,
} from '@shared/schema';
import type { FeatBenefitType } from '@shared/static-data';

/**
 * Simplified context for combat calculations
 */
export interface CombatCalculationContext {
    mainHandItem?: ItemWithDetails | CharacterItem;
    offHandItem?: ItemWithDetails | CharacterItem;
}

/**
 * Context for non-combat calculations
 */
export interface CalculationContext {
    skillId?: number;
    saveType?: number;
    abilityId?: number;
}

/**
 * Formula modification types
 */
export type FormulaModificationType = 'ability_replacement' | 'ability_addition' | 'formula_override';

/**
 * Formula modification condition
 */
export interface FormulaCondition {
    type: string;
    value: unknown;
}

/**
 * Formula modification that changes how calculations work
 */
export interface FormulaModification {
    type: FormulaModificationType;
    context?: {
        weaponType?: number[];
        itemIds?: number[];
        weaponCategories?: number[];
        conditions?: FormulaCondition[];
    };
    parameters: {
        // For ability_replacement (Weapon Finesse)
        fromAbility?: number;
        toAbility?: number;
        // For ability_addition (Monk AC)
        additionalAbility?: number;
        // For formula_override
        formulaId?: number;
        formulaParams?: Record<string, unknown>;
    };
    source: {
        type: 'feat' | 'feature';
        id: number;
        name: string;
    };
}

/**
 * Breakdown component source types
 */
export type BreakdownSourceType =
    | 'base'
    | 'ability'
    | 'feat'
    | 'feature'
    | 'item'
    | 'advancement'
    | 'formula_modification'
    | 'penalty'
    | null;

/**
 * Individual breakdown component
 */
export interface BreakdownComponent {
    value: number;
    source: string | null;
    sourceType: BreakdownSourceType;
    sourceId?: number;
    context?: {
        itemId?: number;
        weaponType?: number;
        abilityId?: number;
    };
}

/**
 * Base breakdown map interface
 */
export interface BreakdownMap {
    [key: string]: BreakdownComponent;
}

/**
 * Calculation result with breakdown
 */
export interface CalculationResult<T extends BreakdownMap = BreakdownMap> {
    value: number;
    breakdownString: string;
    breakdown: T;
    formulaModifications?: FormulaModification[];
}

/**
 * Feat benefit with source information
 */
export interface FeatBenefit {
    amount: number;
    source: {
        type: 'feat';
        id: number;
        name: string;
    };
    context?: {
        itemId?: number;
        attackType?: string;
    };
}

/**
 * Feature bonus with source information
 */
export interface FeatureBonus {
    value: number;
    source: {
        type: 'feature';
        id: number;
        name: string;
    };
    context?: {
        itemId?: number;
        abilityId?: number;
    };
}

/**
 * Item bonus information
 */
export interface ItemBonus {
    attack: number;
    damage: number;
    critical?: string;
}

/**
 * Context for resolving feat benefits
 */
export interface FeatBenefitContext {
    itemId?: number;
    weaponType?: number;
    isDualWield?: boolean;
    isOffHand?: boolean;
    isLightWeapon?: boolean;
    isUnarmed?: boolean;
    isRanged?: boolean;
}

/**
 * Input for calculation service
 */
export interface CalculationServiceInput {
    character: CharacterWithAllDetailsResponse;
    resolvedProgressions: FeatureProgression[];
    items?: ItemWithDetails[];
    classDetailsMap?: Map<number, unknown>;
    context?: CombatCalculationContext | CalculationContext;
}

