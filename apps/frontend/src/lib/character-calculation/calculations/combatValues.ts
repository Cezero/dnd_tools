import type {
    CharacterWithAllDetailsResponse,
    FeatureProgression,
    ItemWithDetails,
    CharacterItem,
    DnDClass,
    Feat,
} from '@shared/schema';
import { AbilityId, WEAPON_TYPE_ENUM, ABILITY_MAP, FeatBenefitType, EntityAppliesToType } from '@shared/static-data';

import { getAbilityModifierWithBonuses } from './abilityScore';
import { getMonkUnarmedDamage } from '../../attack-calculation/monk-damage';
import {
    isProficientWithWeapon,
    getCharacterBAB,
    getCharacterSizeId,
} from '../../attack-calculation/utils';
import { resolveFeatBenefits, resolveFeatFormulaModifications } from '../core/featBenefitResolver';
import { resolveFeatureBonuses } from '../core/featureBonusResolver';
import { applyAbilityModification } from '../core/formulaModifier';
import { resolveItemBonuses, extractWeaponProperties } from '../core/itemBonusResolver';
import type { CombatCalculationContext, CalculationResult, BreakdownMap, BreakdownComponent } from '../types';
import { buildBreakdownString, createBreakdownComponent } from '../utils/breakdownBuilder';
import {
    isOffHandWeapon,
    isUnarmedWeapon,
    isRangedWeapon,
    canUseTwoHanded,
} from '../utils/weaponHelpers';

/**
 * Type guard to check if item has weapon property
 */
function hasWeapon(item: ItemWithDetails | CharacterItem): item is ItemWithDetails {
    return 'weapon' in item && item.weapon !== null && item.weapon !== undefined;
}

/**
 * Breakdown map for combat values
 */
export interface CombatValuesBreakdownMap extends BreakdownMap {
    bab: BreakdownComponent;
    ability: BreakdownComponent;
    proficiency: BreakdownComponent;
    penalty: BreakdownComponent;
    feat: BreakdownComponent;
    feature: BreakdownComponent;
    item: BreakdownComponent;
}

/**
 * Damage components for formatting
 */
export interface DamageComponents {
    baseDamage: string; // e.g., "1d8" or "1d3"
    abilityModifier: number; // Strength or Dexterity modifier
    featBonus: number; // Bonus from feats
}

/**
 * Combat values result
 */
export interface CombatValuesResult extends CalculationResult<CombatValuesBreakdownMap> {
    damage: DamageComponents;
    critical: string;
    range: string | null;
    weaponName: string;
    nonlethalAttackBonus?: number; // For unarmed strikes: nonlethal attack bonus (if different from lethal)
}

/**
 * Get combat values (enhanced attack calculation)
 * Returns an array: [mainHandResult] for single weapons, [mainHandResult, offHandResult] for dual-wield
 */
export function getCombatValues(
    character: CharacterWithAllDetailsResponse,
    resolvedProgressions: FeatureProgression[],
    context: CombatCalculationContext,
    classDetailsMap: Map<number, DnDClass>,
    featsMap?: Map<number, Feat>
): CombatValuesResult[] {
    const { mainHandItem, offHandItem } = context;

    // Handle unarmed strike (no items or unarmed weapon in main hand)
    if (!mainHandItem || isUnarmedWeapon(mainHandItem)) {
        return [calculateSingleWeaponAttack(
            character,
            resolvedProgressions,
            mainHandItem,
            null,
            false,
            classDetailsMap,
            featsMap
        )];
    }

    // Handle dual-wield (off-hand item is a weapon)
    if (isOffHandWeapon(offHandItem)) {
        if (!mainHandItem) {
            throw new Error('Dual-wield requires both main hand and off hand items');
        }
        const mainHandResult = calculateSingleWeaponAttack(
            character,
            resolvedProgressions,
            mainHandItem,
            offHandItem,
            false,
            classDetailsMap,
            featsMap
        );
        const offHandResult = calculateSingleWeaponAttack(
            character,
            resolvedProgressions,
            offHandItem,
            mainHandItem,
            true,
            classDetailsMap,
            featsMap
        );
        return [mainHandResult, offHandResult];
    }

    // Handle single weapon attack (main-hand only)
    if (!mainHandItem) {
        throw new Error('Attack requires a main hand item');
    }
    return [calculateSingleWeaponAttack(
        character,
        resolvedProgressions,
        mainHandItem,
        offHandItem,
        false,
        classDetailsMap,
        featsMap
    )];
}

/**
 * Unified function to calculate a single weapon attack
 * Handles unarmed, melee, ranged, dual-wield main-hand, and dual-wield off-hand
 */
function calculateSingleWeaponAttack(
    character: CharacterWithAllDetailsResponse,
    resolvedProgressions: FeatureProgression[],
    weaponItem: ItemWithDetails | CharacterItem | null,
    otherItem: ItemWithDetails | CharacterItem | null | undefined,
    isOffHand: boolean,
    classDetailsMap: Map<number, DnDClass>,
    featsMap?: Map<number, Feat>
): CombatValuesResult {
    const bab = getCharacterBAB(character, classDetailsMap);
    const characterLevel = character.advancements.length;

    // Handle unarmed strike (no weapon item or unarmed weapon)
    if (!weaponItem || isUnarmedWeapon(weaponItem)) {
        return calculateUnarmedStrike(character, resolvedProgressions, classDetailsMap, featsMap);
    }

    // Must have weapon property for weapon attacks
    if (!hasWeapon(weaponItem)) {
        throw new Error('Item is not a weapon');
    }

    const isProficient = isProficientWithWeapon(resolvedProgressions, weaponItem.weapon, weaponItem.id);
    const isRanged = isRangedWeapon(weaponItem);
    const isDualWield = isOffHandWeapon(otherItem);
    const isTwoHanded = canUseTwoHanded(weaponItem, otherItem);

    // Extract weapon properties
    const weaponProps = extractWeaponProperties(weaponItem);
    const itemBonuses = resolveItemBonuses(weaponItem);

    // Determine ability modifier (using adjusted score with racial modifiers)
    let baseAbilityId = isRanged ? AbilityId.Dexterity : AbilityId.Strength;
    let abilityMod = getAbilityModifierWithBonuses(character, baseAbilityId, resolvedProgressions, featsMap);

    // Check for formula modifications (Weapon Finesse)
    const formulaModifications = resolveFeatFormulaModifications(
        character,
        {
            weaponType: weaponProps.weaponType,
            itemId: weaponProps.itemId,
        },
        featsMap,
        resolvedProgressions
    );
    const modifiedAbilityId = applyAbilityModification(
        baseAbilityId,
        formulaModifications,
        {
            weaponType: weaponProps.weaponType,
            itemId: weaponProps.itemId,
        }
    );

    // If ability was modified, get the new modifier (using adjusted score with racial modifiers)
    if (modifiedAbilityId !== baseAbilityId) {
        abilityMod = getAbilityModifierWithBonuses(character, modifiedAbilityId, resolvedProgressions, featsMap);
    }

    // Calculate attack bonus penalties and bonuses
    let attackPenalty = 0;

    // Unarmed lethal penalty (-4) - handled in calculateUnarmedStrike, skip here

    // Dual-wield penalties
    if (isDualWield) {
        if (isOffHand) {
            attackPenalty = -10; // Off-hand penalty
        } else {
            attackPenalty = -6; // Main-hand penalty
        }
    }

    // Get Two-Weapon Fighting benefits (main hand or off hand)
    const twfBenefitType = isOffHand ? FeatBenefitType.TWO_WEAPON_OFF_HAND : FeatBenefitType.TWO_WEAPON_MAIN_HAND;
    const twfBenefits = resolveFeatBenefits(
        character,
        twfBenefitType,
        {
            itemId: weaponProps.itemId,
            weaponType: weaponProps.weaponType,
            isDualWield,
            isOffHand,
            isLightWeapon: otherItem && hasWeapon(otherItem) && otherItem.weapon.type === WEAPON_TYPE_ENUM.LightMeleeWeapon,
        },
        featsMap,
        resolvedProgressions
    );
    const twfBonus = twfBenefits.reduce((sum, b) => sum + b.amount, 0);

    // Get other attack bonus feat benefits
    const otherFeatBenefits = resolveFeatBenefits(
        character,
        FeatBenefitType.ATTACK_BONUS,
        {
            itemId: weaponProps.itemId,
            weaponType: weaponProps.weaponType,
            isDualWield,
            isOffHand,
            isLightWeapon: otherItem && hasWeapon(otherItem) && otherItem.weapon.type === WEAPON_TYPE_ENUM.LightMeleeWeapon,
        },
        featsMap,
        resolvedProgressions
    );
    const otherFeatBonus = otherFeatBenefits.reduce((sum, b) => sum + b.amount, 0);

    // Light weapon bonus: +2 each (only if off-hand is light and dual-wielding)
    // For main-hand: check if otherItem (off-hand) is light
    // For off-hand: check if weaponItem (off-hand) is light
    let lightWeaponBonus = 0;
    if (isDualWield) {
        if (isOffHand) {
            // Off-hand: bonus if this weapon (off-hand) is light
            if (weaponItem.weapon.type === WEAPON_TYPE_ENUM.LightMeleeWeapon) {
                lightWeaponBonus = 2;
            }
        } else {
            // Main-hand: bonus if otherItem (off-hand) is light
            if (otherItem && hasWeapon(otherItem) && otherItem.weapon.type === WEAPON_TYPE_ENUM.LightMeleeWeapon) {
                lightWeaponBonus = 2;
            }
        }
    }

    // Get feature bonuses
    const featureBonuses = resolveFeatureBonuses(
        resolvedProgressions,
        EntityAppliesToType.Attack,
        character,
        characterLevel,
        { itemId: weaponProps.itemId }
    );
    const featureBonus = featureBonuses.reduce((sum, b) => sum + b.value, 0);

    // Calculate attack bonus
    let attackBonus = bab + abilityMod + attackPenalty + twfBonus + lightWeaponBonus + itemBonuses.attack + otherFeatBonus + featureBonus;
    if (!isProficient) {
        attackBonus -= 4;
    }

    // Calculate damage
    const baseDamage = weaponItem.weapon.damageMedium?.split('/')[0] || '1d4';
    let damageMod = 0;

    if (isRanged) {
        // Ranged: no ability modifier
        damageMod = 0;
    } else if (isOffHand) {
        // Off-hand: 0.5x STR
        damageMod = Math.floor(abilityMod / 2);
    } else if (isTwoHanded) {
        // Two-handed: 1.5x STR
        damageMod = Math.floor(abilityMod * 1.5);
    } else {
        // Normal: 1x STR
        damageMod = abilityMod;
    }

    // Get damage bonuses from feats
    const damageFeatBenefits = resolveFeatBenefits(
        character,
        FeatBenefitType.DAMAGE_BONUS,
        {
            itemId: weaponProps.itemId,
        },
        featsMap,
        resolvedProgressions
    );
    const damageFeatBonus = damageFeatBenefits.reduce((sum, b) => sum + b.amount, 0);

    // Return damage components for formatting by display strategy
    const damage: DamageComponents = {
        baseDamage,
        abilityModifier: damageMod,
        featBonus: damageFeatBonus
    };

    // Build breakdown
    const abilitySource = modifiedAbilityId !== baseAbilityId
        ? `${ABILITY_MAP[modifiedAbilityId]?.abbreviation ?? 'DEX'} modifier: Weapon Finesse`
        : `${ABILITY_MAP[baseAbilityId]?.abbreviation ?? 'STR'} modifier`;

    const breakdown: CombatValuesBreakdownMap = {
        bab: createBreakdownComponent(bab, 'BAB', 'base'),
        ability: createBreakdownComponent(
            abilityMod,
            abilitySource,
            modifiedAbilityId !== baseAbilityId ? 'formula_modification' : 'ability',
            modifiedAbilityId !== baseAbilityId ? formulaModifications[0]?.source.id : baseAbilityId
        ),
        proficiency: createBreakdownComponent(
            isProficient ? 0 : -4,
            isProficient ? null : 'non-proficient',
            isProficient ? null : 'penalty'
        ),
        penalty: createBreakdownComponent(
            attackPenalty,
            attackPenalty < 0 ? (isOffHand ? 'two-weapon off-hand penalty' : 'two-weapon main-hand penalty') : null,
            attackPenalty < 0 ? 'penalty' : null
        ),
        feat: createBreakdownComponent(
            twfBonus + lightWeaponBonus + otherFeatBonus,
            [
                twfBonus > 0 ? `Two-Weapon Fighting (+${twfBonus})` : null,
                lightWeaponBonus > 0 ? `light weapon (+${lightWeaponBonus})` : null,
                otherFeatBonus > 0 ? `Feat: ${otherFeatBenefits.map(b => b.source.name).join(', ')}` : null,
            ]
                .filter(Boolean)
                .join(', ') || null,
            twfBonus + lightWeaponBonus + otherFeatBonus > 0 ? 'feat' : null,
            twfBenefits[0]?.source.id ?? otherFeatBenefits[0]?.source.id
        ),
        feature: createBreakdownComponent(
            featureBonus,
            featureBonus > 0 ? `Feature: ${featureBonuses.map(b => b.source.name).join(', ')}` : null,
            featureBonus > 0 ? 'feature' : null,
            featureBonuses[0]?.source.id
        ),
        item: createBreakdownComponent(
            itemBonuses.attack,
            itemBonuses.attack > 0 ? 'Masterwork' : null,
            itemBonuses.attack > 0 ? 'item' : null,
            weaponItem.id
        ),
    };

    const breakdownString = buildBreakdownString(breakdown);

    return {
        value: attackBonus,
        breakdownString: `Attack: ${breakdownString}`,
        breakdown,
        damage,
        critical: weaponItem.weapon.critical || '20/x2',
        range: weaponItem.weapon.range || null,
        weaponName: 'name' in weaponItem ? weaponItem.name : 'Weapon',
    };
}

/**
 * Calculate unarmed strike (helper function for calculateSingleWeaponAttack)
 */
function calculateUnarmedStrike(
    character: CharacterWithAllDetailsResponse,
    resolvedProgressions: FeatureProgression[],
    classDetailsMap: Map<number, DnDClass>,
    featsMap?: Map<number, Feat>
): CombatValuesResult {
    const bab = getCharacterBAB(character, classDetailsMap);
    const strMod = getAbilityModifierWithBonuses(character, AbilityId.Strength, resolvedProgressions, featsMap);
    const characterLevel = character.advancements.length;
    const characterSizeId = getCharacterSizeId(character);

    // Check for Improved Unarmed Strike feat benefit
    // This benefit type grants a bonus that offsets the -4 penalty for lethal damage
    // Similar to Two-Weapon Fighting: base penalty (-4) + feat bonus (+4) = net 0
    const unarmedLethalBenefits = resolveFeatBenefits(
        character,
        FeatBenefitType.UNARMED_LETHAL_DAMAGE,
        { isUnarmed: true },
        featsMap,
        resolvedProgressions
    );
    const unarmedLethalBonus = unarmedLethalBenefits.reduce((sum, b) => sum + b.amount, 0);

    // Get monk damage
    const monkDamage = getMonkUnarmedDamage(resolvedProgressions, characterLevel, characterSizeId);
    const isMonkCharacter = monkDamage !== null;

    // Get damage dice
    let damageDice = '1d3';
    if (isMonkCharacter && monkDamage) {
        damageDice = monkDamage;
    }

    // Attack bonus calculation
    // All characters are proficient with unarmed strikes (no proficiency penalty)
    // Nonlethal: BAB + STR (no penalty)
    // Lethal: BAB + STR - 4 (penalty) + feat bonus (if Improved Unarmed Strike)
    const nonlethalAttackBonus = bab + strMod; // No penalty for nonlethal
    const lethalPenalty = -4; // Base penalty for lethal damage
    const lethalAttackBonus = nonlethalAttackBonus + lethalPenalty + unarmedLethalBonus; // Penalty + feat bonus

    // Use lethal as the primary value (default assumption)
    const attackBonus = lethalAttackBonus;

    // Build breakdown for lethal attack (default)
    // Note: All characters are proficient with unarmed strikes, so no proficiency penalty
    const breakdown: CombatValuesBreakdownMap = {
        bab: createBreakdownComponent(bab, 'BAB', 'base'),
        ability: createBreakdownComponent(strMod, 'Str modifier', 'ability', AbilityId.Strength),
        proficiency: createBreakdownComponent(0, 'proficient', null), // All characters are proficient
        penalty: createBreakdownComponent(
            lethalPenalty,
            'lethal damage penalty',
            'penalty'
        ),
        feat: createBreakdownComponent(
            unarmedLethalBonus,
            unarmedLethalBonus > 0 ? unarmedLethalBenefits.map(b => b.source.name).join(', ') : null,
            unarmedLethalBonus > 0 ? 'feat' : null,
            unarmedLethalBonus > 0 ? unarmedLethalBenefits[0]?.source.id : undefined
        ),
        feature: createBreakdownComponent(0, null, null),
        item: createBreakdownComponent(0, null, null),
    };

    const breakdownString = buildBreakdownString(breakdown);
    // Return damage components for formatting by display strategy
    const damage: DamageComponents = {
        baseDamage: damageDice,
        abilityModifier: strMod,
        featBonus: 0
    };

    return {
        value: attackBonus,
        breakdownString: `Attack: ${breakdownString}`,
        breakdown,
        damage,
        critical: '20/x2',
        range: null,
        weaponName: 'Unarmed Strike',
        // Include nonlethal bonus if different from lethal
        nonlethalAttackBonus: nonlethalAttackBonus !== lethalAttackBonus ? nonlethalAttackBonus : undefined,
    };
}

