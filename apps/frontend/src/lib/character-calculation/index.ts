// Main service
export { CharacterCalculationService } from './core/calculationService';

// Types
export type {
    CalculationResult,
    BreakdownComponent,
    BreakdownMap,
    CombatCalculationContext,
    CalculationContext,
    FormulaModification,
    FeatBenefit,
    FeatureBonus,
    ItemBonus,
} from './types';

// Calculation functions
export { getAbilityScore, getAbilityModifierWithBonuses } from './calculations/abilityScore';
export { getAC, getTouchAC, getFlatFootedAC } from './calculations/armorClass';
export { getInitiative } from './calculations/initiative';
export { getSpeed } from './calculations/speed';
export { getSavingThrow, SaveType } from './calculations/savingThrows';
export { getCombatValues } from './calculations/combatValues';
export type { CombatValuesResult, DamageComponents } from './calculations/combatValues';

// Breakdown types
export type { AbilityScoreBreakdownMap } from './calculations/abilityScore';
export type { ACBreakdownMap } from './calculations/armorClass';
export type { InitiativeBreakdownMap } from './calculations/initiative';
export type { SpeedBreakdownMap } from './calculations/speed';
export type { SavingThrowBreakdownMap } from './calculations/savingThrows';
export type { CombatValuesBreakdownMap } from './calculations/combatValues';

// Utilities
export { buildBreakdownString, createBreakdownComponent } from './utils/breakdownBuilder';
export { applyFeatureFormula, getFormulaDisplayString } from './utils/formulaApplier';
export {
    isOffHandWeapon,
    isUnarmedWeapon,
    isRangedWeapon,
    canUseTwoHanded,
} from './utils/weaponHelpers';

