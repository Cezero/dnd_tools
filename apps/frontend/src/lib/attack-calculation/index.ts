// Re-export types
export type { ProficiencyResult } from './types';

// Re-export public functions
export { extractProficiencies } from './proficiencies';
export { getMonkUnarmedDamage } from './monk-damage';

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

