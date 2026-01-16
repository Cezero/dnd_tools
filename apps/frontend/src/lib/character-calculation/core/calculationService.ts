import type {
    CharacterWithAllDetailsResponse,
    FeatureProgression,
    DnDClass,
} from '@shared/schema';

import { getAbilityScore, getAbilityModifierWithBonuses } from '../calculations/abilityScore';
import { getAC, getTouchAC, getFlatFootedAC } from '../calculations/armorClass';
import type { CombatValuesResult } from '../calculations/combatValues';
import { getCombatValues } from '../calculations/combatValues';
import { getInitiative } from '../calculations/initiative';
import { getSavingThrow } from '../calculations/savingThrows';
import { getSpeed } from '../calculations/speed';
import type { CombatCalculationContext } from '../types';

/**
 * Main character calculation service
 */
export class CharacterCalculationService {
    /**
     * Get ability score with all bonuses
     */
    static getAbilityScore(
        character: CharacterWithAllDetailsResponse,
        abilityId: number,
        resolvedProgressions: FeatureProgression[]
    ) {
        return getAbilityScore(character, abilityId, resolvedProgressions);
    }

    /**
     * Get ability modifier with all bonuses
     */
    static getAbilityModifier(
        character: CharacterWithAllDetailsResponse,
        abilityId: number,
        resolvedProgressions: FeatureProgression[]
    ): number {
        return getAbilityModifierWithBonuses(character, abilityId, resolvedProgressions);
    }

    /**
     * Get armor class
     */
    static getAC(
        character: CharacterWithAllDetailsResponse,
        resolvedProgressions: FeatureProgression[],
        items?: Array<{ id: number; armor?: { bonus: number | null }; weapon?: unknown }>
    ) {
        return getAC(character, resolvedProgressions, items);
    }

    /**
     * Get touch AC
     */
    static getTouchAC(
        character: CharacterWithAllDetailsResponse,
        resolvedProgressions: FeatureProgression[],
        items?: Array<{ id: number; armor?: { bonus: number | null; category?: number }; weapon?: unknown }>
    ): number {
        return getTouchAC(character, resolvedProgressions, items);
    }

    /**
     * Get flat-footed AC
     */
    static getFlatFootedAC(
        character: CharacterWithAllDetailsResponse,
        resolvedProgressions: FeatureProgression[],
        items?: Array<{ id: number; armor?: { bonus: number | null; category?: number }; weapon?: unknown }>
    ): number {
        return getFlatFootedAC(character, resolvedProgressions, items);
    }

    /**
     * Get initiative modifier
     */
    static getInitiative(
        character: CharacterWithAllDetailsResponse,
        resolvedProgressions: FeatureProgression[]
    ) {
        return getInitiative(character, resolvedProgressions);
    }

    /**
     * Get movement speed
     */
    static getSpeed(
        character: CharacterWithAllDetailsResponse,
        resolvedProgressions: FeatureProgression[],
        race: import('@shared/schema').Race | null
    ) {
        return getSpeed(character, resolvedProgressions, race);
    }

    /**
     * Get saving throw modifier
     */
    static getSavingThrow(
        character: CharacterWithAllDetailsResponse,
        saveType: number,
        resolvedProgressions: FeatureProgression[],
        classDetailsMap: Map<number, DnDClass>
    ) {
        return getSavingThrow(character, saveType, resolvedProgressions, classDetailsMap);
    }

    /**
     * Get combat values (attack bonus, damage, etc.)
     * Returns an array: [mainHandResult] for single weapons, [mainHandResult, offHandResult] for dual-wield
     */
    static getCombatValues(
        character: CharacterWithAllDetailsResponse,
        resolvedProgressions: FeatureProgression[],
        context: CombatCalculationContext,
        classDetailsMap: Map<number, DnDClass>
    ): CombatValuesResult[] {
        return getCombatValues(character, resolvedProgressions, context, classDetailsMap);
    }
}

