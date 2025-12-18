// Re-export types
export type { AttackCalculationInput, AttackCalculationResult, ProficiencyResult } from './types';

// Re-export public functions
export { extractProficiencies } from './proficiencies';
export { hasFeat } from './feats';
export { getMonkUnarmedDamage } from './monk-damage';

// Re-export main calculation function
export { calculateAttackStats } from './main';

// Re-export utility functions (for internal use or advanced scenarios)
export {
    isProficientWithWeapon,
    isMonk,
    isLightWeapon,
    isTwoHandedWeapon,
    getCharacterBAB,
    getAbilityModifier,
    getCharacterSizeId,
    formatDamageType,
    formatRange,
} from './utils';

