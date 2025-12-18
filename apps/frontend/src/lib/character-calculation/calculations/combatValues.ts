import type {
    CharacterWithAllDetailsResponse,
    FeatureProgression,
    ItemWithDetails,
    CharacterItem,
} from '@shared/schema';
import { AbilityId, GetAbilityModifier, SIZE_MAP, WEAPON_TYPE_ENUM, ABILITY_MAP } from '@shared/static-data';
import { resolveFeatBenefits, resolveFeatFormulaModifications } from '../core/featBenefitResolver';
import { resolveFeatureBonuses } from '../core/featureBonusResolver';
import { resolveItemBonuses, extractWeaponProperties } from '../core/itemBonusResolver';
import { applyAbilityModification } from '../core/formulaModifier';
import { buildBreakdownString, createBreakdownComponent } from '../utils/breakdownBuilder';
import { getMonkUnarmedDamage } from '../../attack-calculation/monk-damage';
import {
    isProficientWithWeapon,
    getCharacterBAB,
    getCharacterSizeId,
    getAbilityModifier as getCharacterAbilityModifier,
} from '../../attack-calculation/utils';
import type { CombatCalculationContext, CalculationResult } from '../types';
import { FeatBenefitType, EntityAppliesToType } from '@shared/static-data';

/**
 * Breakdown map for combat values
 */
export interface CombatValuesBreakdownMap {
    bab: { value: number; source: string | null; sourceType: 'base' | null; sourceId?: number };
    ability: { value: number; source: string | null; sourceType: 'ability' | 'formula_modification' | null; sourceId?: number };
    proficiency: { value: number; source: string | null; sourceType: 'penalty' | null; sourceId?: number };
    penalty: { value: number; source: string | null; sourceType: 'penalty' | null; sourceId?: number };
    feat: { value: number; source: string | null; sourceType: 'feat' | null; sourceId?: number };
    feature: { value: number; source: string | null; sourceType: 'feature' | null; sourceId?: number };
    item: { value: number; source: string | null; sourceType: 'item' | null; sourceId?: number };
}

/**
 * Combat values result
 */
export interface CombatValuesResult extends CalculationResult<CombatValuesBreakdownMap> {
    damage: string;
    critical: string;
    range: string | null;
    weaponName: string;
    isDualWield?: boolean;
    offHandResult?: CombatValuesResult;
    nonlethalAttackBonus?: number; // For unarmed strikes: nonlethal attack bonus (if different from lethal)
}

/**
 * Get combat values (enhanced attack calculation)
 */
export function getCombatValues(
    character: CharacterWithAllDetailsResponse,
    resolvedProgressions: FeatureProgression[],
    context: CombatCalculationContext,
    classDetailsMap: Map<number, { babProgression?: string | number }>
): CombatValuesResult {
    const { attackType, mainHandItem, offHandItem } = context;

    // Handle unarmed strike
    if (attackType === 'unarmed') {
        return calculateUnarmedStrike(character, resolvedProgressions, classDetailsMap);
    }

    // Handle dual-wield (requires both items)
    if (attackType === 'dual-wield') {
        if (!mainHandItem || !offHandItem) {
            throw new Error('Dual-wield requires both main hand and off hand items');
        }
        return calculateDualWieldAttack(
            character,
            resolvedProgressions,
            context,
            classDetailsMap
        );
    }

    // Handle ranged
    if (attackType === 'ranged') {
        if (!mainHandItem) {
            throw new Error('Ranged attack requires a main hand item');
        }
        return calculateRangedAttack(character, resolvedProgressions, mainHandItem, classDetailsMap);
    }

    // Handle main hand (single weapon) - default case
    if (!mainHandItem) {
        throw new Error('Main hand attack requires a main hand item');
    }
    return calculateMainHandAttack(character, resolvedProgressions, mainHandItem, classDetailsMap);
}

/**
 * Calculate unarmed strike
 */
function calculateUnarmedStrike(
    character: CharacterWithAllDetailsResponse,
    resolvedProgressions: FeatureProgression[],
    classDetailsMap: Map<number, { babProgression?: string | number }>
): CombatValuesResult {
    const bab = getCharacterBAB(character, classDetailsMap);
    const strMod = getCharacterAbilityModifier(character, AbilityId.Strength);
    const characterLevel = character.advancements.length;
    const characterSizeId = getCharacterSizeId(character);

    // Check for Improved Unarmed Strike feat benefit
    // This benefit type grants a bonus that offsets the -4 penalty for lethal damage
    // Similar to Two-Weapon Fighting: base penalty (-4) + feat bonus (+4) = net 0
    const unarmedLethalBenefits = resolveFeatBenefits(
        character,
        FeatBenefitType.UNARMED_LETHAL_DAMAGE,
        { attackType: 'unarmed' }
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
    // Remove "nonlethal" from damage - it's clear from attack bonus which type is being used
    const damage = `${damageDice}${strMod >= 0 ? '+' : ''}${strMod}`;

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

/**
 * Calculate main hand attack (single weapon)
 */
function calculateMainHandAttack(
    character: CharacterWithAllDetailsResponse,
    resolvedProgressions: FeatureProgression[],
    item: ItemWithDetails | CharacterItem,
    classDetailsMap: Map<number, { babProgression?: string | number }>
): CombatValuesResult {
    if (!item.weapon) {
        throw new Error('Item is not a weapon');
    }

    const bab = getCharacterBAB(character, classDetailsMap);
    const isProficient = isProficientWithWeapon(resolvedProgressions, item.weapon, item.id);
    const isTwoHanded = item.weapon.type === WEAPON_TYPE_ENUM.TwoHandedMeleeWeapon;

    // Extract weapon properties
    const weaponProps = extractWeaponProperties(item);
    const itemBonuses = resolveItemBonuses(item);

    // Get base ability modifier (STR for melee)
    let baseAbilityId = AbilityId.Strength;
    let abilityMod = getCharacterAbilityModifier(character, baseAbilityId);

    // Check for formula modifications (Weapon Finesse)
    const formulaModifications = resolveFeatFormulaModifications(character, {
        weaponType: weaponProps.weaponType,
        itemId: weaponProps.itemId,
    });
    const modifiedAbilityId = applyAbilityModification(
        baseAbilityId,
        formulaModifications,
        {
            weaponType: weaponProps.weaponType,
            itemId: weaponProps.itemId,
        }
    );

    // If ability was modified, get the new modifier
    if (modifiedAbilityId !== baseAbilityId) {
        abilityMod = getCharacterAbilityModifier(character, modifiedAbilityId);
    }

    // Get feat benefits (Weapon Focus, etc.)
    const featBenefits = resolveFeatBenefits(character, FeatBenefitType.ATTACK_BONUS, {
        itemId: weaponProps.itemId,
        weaponType: weaponProps.weaponType,
    });
    const featBonus = featBenefits.reduce((sum, b) => sum + b.amount, 0);

    // Get feature bonuses
    const featureBonuses = resolveFeatureBonuses(
        resolvedProgressions,
        EntityAppliesToType.Attack,
        character,
        character.advancements.length,
        { itemId: weaponProps.itemId }
    );
    const featureBonus = featureBonuses.reduce((sum, b) => sum + b.value, 0);

    // Calculate attack bonus
    let attackBonus = bab + abilityMod + itemBonuses.attack + featBonus + featureBonus;
    if (!isProficient) {
        attackBonus -= 4;
    }

    // Calculate damage
    const baseDamage = item.weapon.damageMedium?.split('/')[0] || '1d4';
    let damageMod = abilityMod;
    if (isTwoHanded) {
        damageMod = Math.floor(abilityMod * 1.5);
    }

    // Get damage bonuses from feats
    const damageFeatBenefits = resolveFeatBenefits(character, FeatBenefitType.DAMAGE_BONUS, {
        itemId: weaponProps.itemId,
    });
    const damageFeatBonus = damageFeatBenefits.reduce((sum, b) => sum + b.amount, 0);

    const damage = `${baseDamage}${damageMod >= 0 ? '+' : ''}${damageMod}${damageFeatBonus > 0 ? ` + ${damageFeatBonus}` : ''}`;

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
        penalty: createBreakdownComponent(0, null, null),
        feat: createBreakdownComponent(
            featBonus,
            featBonus > 0 ? `Feat: ${featBenefits.map(b => b.source.name).join(', ')}` : null,
            featBonus > 0 ? 'feat' : null,
            featBenefits[0]?.source.id
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
            item.id
        ),
    };

    const breakdownString = buildBreakdownString(breakdown);

    return {
        value: attackBonus,
        breakdownString: `Attack: ${breakdownString}`,
        breakdown,
        damage,
        critical: item.weapon.critical || '20/x2',
        range: item.weapon.range || null,
        weaponName: 'name' in item ? item.name : 'Weapon',
    };
}

/**
 * Calculate ranged attack
 */
function calculateRangedAttack(
    character: CharacterWithAllDetailsResponse,
    resolvedProgressions: FeatureProgression[],
    item: ItemWithDetails | CharacterItem,
    classDetailsMap: Map<number, { babProgression?: string | number }>
): CombatValuesResult {
    if (!item.weapon) {
        throw new Error('Item is not a weapon');
    }

    const bab = getCharacterBAB(character, classDetailsMap);
    const dexMod = getCharacterAbilityModifier(character, AbilityId.Dexterity);
    const isProficient = isProficientWithWeapon(resolvedProgressions, item.weapon, item.id);

    // Extract weapon properties
    const weaponProps = extractWeaponProperties(item);
    const itemBonuses = resolveItemBonuses(item);

    // Get feat benefits
    const featBenefits = resolveFeatBenefits(character, FeatBenefitType.ATTACK_BONUS, {
        itemId: weaponProps.itemId,
        weaponType: weaponProps.weaponType,
    });
    const featBonus = featBenefits.reduce((sum, b) => sum + b.amount, 0);

    // Get feature bonuses
    const featureBonuses = resolveFeatureBonuses(
        resolvedProgressions,
        EntityAppliesToType.Attack,
        character,
        character.advancements.length,
        { itemId: weaponProps.itemId }
    );
    const featureBonus = featureBonuses.reduce((sum, b) => sum + b.value, 0);

    // Calculate attack bonus
    let attackBonus = bab + dexMod + itemBonuses.attack + featBonus + featureBonus;
    if (!isProficient) {
        attackBonus -= 4;
    }

    // Damage: weapon damage only (no ability modifier for ranged)
    const baseDamage = item.weapon.damageMedium || '1d4';
    const damage = baseDamage;

    // Build breakdown
    const breakdown: CombatValuesBreakdownMap = {
        bab: createBreakdownComponent(bab, 'BAB', 'base'),
        ability: createBreakdownComponent(dexMod, 'Dex modifier', 'ability', AbilityId.Dexterity),
        proficiency: createBreakdownComponent(
            isProficient ? 0 : -4,
            isProficient ? null : 'non-proficient',
            isProficient ? null : 'penalty'
        ),
        penalty: createBreakdownComponent(0, null, null),
        feat: createBreakdownComponent(
            featBonus,
            featBonus > 0 ? `Feat: ${featBenefits.map(b => b.source.name).join(', ')}` : null,
            featBonus > 0 ? 'feat' : null,
            featBenefits[0]?.source.id
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
            item.id
        ),
    };

    const breakdownString = buildBreakdownString(breakdown);

    return {
        value: attackBonus,
        breakdownString: `Attack: ${breakdownString}`,
        breakdown,
        damage,
        critical: item.weapon.critical || '20/x2',
        range: item.weapon.range || null,
        weaponName: 'name' in item ? item.name : 'Weapon',
    };
}

/**
 * Calculate dual-wield attack
 */
function calculateDualWieldAttack(
    character: CharacterWithAllDetailsResponse,
    resolvedProgressions: FeatureProgression[],
    context: CombatCalculationContext,
    classDetailsMap: Map<number, { babProgression?: string | number }>
): CombatValuesResult {
    const { mainHandItem, offHandItem, attackType } = context;

    if (!mainHandItem || !offHandItem || !mainHandItem.weapon || !offHandItem.weapon) {
        throw new Error('Both items must be weapons');
    }

    const isOffHand = attackType === 'off-hand';
    const currentItem = isOffHand ? offHandItem : mainHandItem;
    const otherItem = isOffHand ? mainHandItem : offHandItem;

    const bab = getCharacterBAB(character, classDetailsMap);
    const strMod = getCharacterAbilityModifier(character, AbilityId.Strength);
    const isProficient = isProficientWithWeapon(resolvedProgressions, currentItem.weapon, currentItem.id);
    const isOffHandLight = otherItem.weapon.type === WEAPON_TYPE_ENUM.LightMeleeWeapon;

    // Extract weapon properties
    const weaponProps = extractWeaponProperties(currentItem);
    const itemBonuses = resolveItemBonuses(currentItem);

    // Base penalties for dual-wield
    const basePenalty = isOffHand ? -10 : -6;

    // Get Two-Weapon Fighting feat benefits
    const twfBenefits = resolveFeatBenefits(character, FeatBenefitType.ATTACK_BONUS, {
        attackType: 'dual-wield',
        isOffHand,
    });
    const twfBonus = twfBenefits
        .filter(b => b.source.name === 'Two-Weapon Fighting')
        .reduce((sum, b) => sum + b.amount, 0);

    // Light weapon bonus: +2 each (only if off-hand is light and dual-wielding)
    const lightWeaponBonus = isOffHandLight && attackType === 'dual-wield' ? 2 : 0;

    // Get other feat benefits (Weapon Focus, etc.)
    const otherFeatBenefits = resolveFeatBenefits(character, FeatBenefitType.ATTACK_BONUS, {
        itemId: weaponProps.itemId,
        weaponType: weaponProps.weaponType,
    }).filter(b => b.source.name !== 'Two-Weapon Fighting');
    const otherFeatBonus = otherFeatBenefits.reduce((sum, b) => sum + b.amount, 0);

    // Get feature bonuses
    const featureBonuses = resolveFeatureBonuses(
        resolvedProgressions,
        EntityAppliesToType.Attack,
        character,
        character.advancements.length,
        { itemId: weaponProps.itemId }
    );
    const featureBonus = featureBonuses.reduce((sum, b) => sum + b.value, 0);

    // Calculate total attack bonus
    let attackBonus = bab + strMod + basePenalty + twfBonus + lightWeaponBonus + itemBonuses.attack + otherFeatBonus + featureBonus;
    if (!isProficient) {
        attackBonus -= 4;
    }

    // Calculate damage
    const baseDamage = currentItem.weapon.damageMedium?.split('/')[0] || '1d4';
    let damageMod = strMod;
    if (isOffHand) {
        damageMod = Math.floor(strMod / 2);
    } else if (otherItem.weapon.type === WEAPON_TYPE_ENUM.TwoHandedMeleeWeapon) {
        damageMod = Math.floor(strMod * 1.5);
    }
    const damage = `${baseDamage} + ${damageMod >= 0 ? '+' : ''}${damageMod}`;

    // Build breakdown
    const breakdown: CombatValuesBreakdownMap = {
        bab: createBreakdownComponent(bab, 'BAB', 'base'),
        ability: createBreakdownComponent(strMod, 'Str modifier', 'ability', AbilityId.Strength),
        proficiency: createBreakdownComponent(
            isProficient ? 0 : -4,
            isProficient ? null : 'non-proficient',
            isProficient ? null : 'penalty'
        ),
        penalty: createBreakdownComponent(basePenalty, 'two-weapon penalty', 'penalty'),
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
            currentItem.id
        ),
    };

    const breakdownString = buildBreakdownString(breakdown);

    const result: CombatValuesResult = {
        value: attackBonus,
        breakdownString: `Attack: ${breakdownString}`,
        breakdown,
        damage,
        critical: currentItem.weapon.critical || '20/x2',
        range: currentItem.weapon.range || null,
        weaponName: 'name' in currentItem ? currentItem.name : 'Weapon',
    };

    // If calculating main hand, also calculate off-hand
    if (attackType === 'dual-wield' || attackType === 'main-hand') {
        const offHandContext: CombatCalculationContext = {
            ...context,
            attackType: 'off-hand',
        };
        result.offHandResult = calculateDualWieldAttack(
            character,
            resolvedProgressions,
            offHandContext,
            classDetailsMap
        );
        result.isDualWield = true;
    }

    return result;
}

// Use the imported getAbilityModifier from attack-calculation/utils

