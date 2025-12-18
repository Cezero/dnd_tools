import type {
    CharacterWithAllDetailsResponse,
    FeatureProgression,
} from '@shared/schema';
import type { CalculationServiceInput, CombatCalculationContext, CalculationContext } from '../types';
import { getAbilityScore, getAbilityModifierWithBonuses } from '../calculations/abilityScore';
import { getAC, getTouchAC, getFlatFootedAC } from '../calculations/armorClass';
import { getInitiative } from '../calculations/initiative';
import { getSpeed } from '../calculations/speed';
import { getSavingThrow } from '../calculations/savingThrows';
import { getCombatValues } from '../calculations/combatValues';

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
        resolvedProgressions: FeatureProgression[]
    ): number {
        return getTouchAC(character, resolvedProgressions);
    }

    /**
     * Get flat-footed AC
     */
    static getFlatFootedAC(
        character: CharacterWithAllDetailsResponse,
        resolvedProgressions: FeatureProgression[]
    ): number {
        return getFlatFootedAC(character, resolvedProgressions);
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
        resolvedProgressions: FeatureProgression[]
    ) {
        return getSpeed(character, resolvedProgressions);
    }

    /**
     * Get saving throw modifier
     */
    static getSavingThrow(
        character: CharacterWithAllDetailsResponse,
        saveType: number,
        resolvedProgressions: FeatureProgression[],
        classDetailsMap: Map<number, { saveProgression?: string }>
    ) {
        return getSavingThrow(character, saveType, resolvedProgressions, classDetailsMap);
    }

    /**
     * Get combat values (attack bonus, damage, etc.)
     */
    static getCombatValues(
        character: CharacterWithAllDetailsResponse,
        resolvedProgressions: FeatureProgression[],
        context: CombatCalculationContext,
        classDetailsMap: Map<number, { babProgression?: string | number }>
    ) {
        return getCombatValues(character, resolvedProgressions, context, classDetailsMap);
    }
}

