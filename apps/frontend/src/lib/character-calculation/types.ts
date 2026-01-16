import type {
    CharacterWithAllDetailsResponse,
    CharacterItem,
    ItemWithDetails,
    FeatureProgression,
    CharacterFeatureChoice,
} from '@shared/schema';

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
 * Breakdown component source types for character-calculation system.
 * 
 * This type represents **WHAT** the source of a modifier or value is in character calculations.
 * It identifies the origin/category of a breakdown component (e.g., ability modifier, feat bonus, item bonus).
 * 
 * **Important Distinction:**
 * - This type (`BreakdownSourceType`) represents the **source** (WHAT)
 * - `CalculationMethodType` in the formatter system represents the **calculation method** (HOW)
 * 
 * **Values:**
 * - `'base'`: Base value (e.g., base AC of 10, base ability score)
 * - `'ability'`: Ability modifier (e.g., Dex modifier for AC, Str modifier for attack)
 * - `'feat'`: Bonus from a feat
 * - `'feature'`: Bonus from a class feature or racial feature
 * - `'item'`: Bonus from an equipped item
 * - `'advancement'`: Bonus from level advancement (e.g., ability score improvements)
 * - `'formula_modification'`: Modification from a formula (e.g., Monk AC bonus)
 * - `'penalty'`: Penalty applied to the calculation
 * - `null`: No specific source type
 * 
 * **Mapping to Formatter System:**
 * When converting from this source type to the formatter system's `CalculationMethodType`,
 * use the following mapping (see `characterSheetDisplayStrategy.ts`):
 * - `'ability'` → `CalculationMethodType.formula` (ability modifiers are used in formulas)
 * - `'feat'` → `CalculationMethodType.choice` (feats are player choices)
 * - `'feature'` → `CalculationMethodType.choice` (features are player choices)
 * - `'item'` → `CalculationMethodType.choice` (items are player choices)
 * - `'base'` → `CalculationMethodType.base` (base values)
 * - `'penalty'` → `CalculationMethodType.base` (penalties are base adjustments)
 * - `'formula_modification'` → `CalculationMethodType.formula` (formula modifications)
 * 
 * @see {@link CalculationMethodType} in `@shared/static-data` for the calculation method type system
 * @see {@link BreakdownComponent} for usage in breakdown components
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
 * Standard breakdown component for calculation transparency.
 * 
 * All calculation functions that return breakdowns must use this type for their breakdown components.
 * This provides a consistent structure for displaying how calculated values are derived from various sources
 * (base values, ability modifiers, feat bonuses, feature bonuses, items, etc.).
 * 
 * **Architecture Pattern:**
 * - All calculation breakdown maps must extend `BreakdownMap`
 * - All fields in breakdown maps must use `BreakdownComponent` (not custom inline types)
 * - Use `createBreakdownComponent()` from `breakdownBuilder.ts` to create components
 * - The formatting system consumes these breakdowns to display calculation details
 * 
 * **Source Types:**
 * - `'base'`: Base value (e.g., base AC of 10, base ability score)
 * - `'ability'`: Ability modifier (e.g., Dex modifier for AC, Str modifier for attack)
 * - `'feat'`: Bonus from a feat
 * - `'feature'`: Bonus from a class feature or racial feature
 * - `'item'`: Bonus from an equipped item
 * - `'advancement'`: Bonus from level advancement (e.g., ability score improvements)
 * - `'formula_modification'`: Modification from a formula (e.g., Monk AC bonus)
 * - `'penalty'`: Penalty applied to the calculation
 * - `null`: No specific source type
 * 
 * @see {@link BreakdownMap} for the base breakdown map interface
 * @see {@link createBreakdownComponent} for creating breakdown components
 * @see {@link CalculationResult} for how breakdowns are returned from calculations
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
 * Base breakdown map interface for calculation results.
 * 
 * All calculation breakdown maps must extend this interface to ensure compatibility
 * with breakdown utilities like `buildBreakdownString()` and the formatting system.
 * 
 * **Architecture Pattern:**
 * - Calculation functions return `CalculationResult<T>` where `T extends BreakdownMap`
 * - Breakdown maps define specific fields (e.g., `dexMod`, `feat`, `feature`) that use `BreakdownComponent`
 * - The index signature `[key: string]: BreakdownComponent` allows breakdown utilities to iterate over all fields
 * 
 * **Example:**
 * ```typescript
 * export interface InitiativeBreakdownMap extends BreakdownMap {
 *     dexMod: BreakdownComponent;
 *     feat: BreakdownComponent;
 *     feature: BreakdownComponent;
 *     item: BreakdownComponent;
 * }
 * ```
 * 
 * @see {@link BreakdownComponent} for the standard breakdown component structure
 * @see {@link CalculationResult} for how breakdown maps are used in calculation results
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
    abilityId?: number;
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

