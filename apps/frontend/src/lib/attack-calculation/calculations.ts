import type { CharacterItem } from '@shared/schema';
import { AbilityId, SIZE_MAP } from '@shared/static-data';

import type { AttackCalculationInput, AttackCalculationResult } from './types';
import { hasFeat } from './feats';
import { getMonkUnarmedDamage } from './monk-damage';
import {
    getCharacterBAB,
    getAbilityModifier,
    getCharacterSizeId,
    formatDamageType,
    formatRange,
    isProficientWithWeapon,
    isTwoHandedWeapon,
    isLightWeapon,
} from './utils';

/**
 * Calculate unarmed strike attack
 */
export function calculateUnarmedStrike(input: AttackCalculationInput): AttackCalculationResult {
    const { character, resolvedProgressions, classDetailsMap } = input;

    const bab = getCharacterBAB(character, classDetailsMap);
    const strMod = getAbilityModifier(character, AbilityId.Strength);
    const characterLevel = character.advancements.length;
    // Get size from character - defaults to Medium if not available
    const characterSizeId = getCharacterSizeId(character);

    const hasImprovedUnarmedStrike = hasFeat(resolvedProgressions, character, 'Improved Unarmed Strike');

    // Check for monk damage - if found, character is a monk
    const monkDamage = getMonkUnarmedDamage(resolvedProgressions, characterLevel, characterSizeId);
    const isMonkCharacter = monkDamage !== null;

    // Get monk damage if applicable
    let damageDice = '1d3';
    if (isMonkCharacter && monkDamage) {
        damageDice = monkDamage;
    }

    // Attack bonus calculation
    // Base: BAB + STR
    // -4 penalty for lethal damage unless has Improved Unarmed Strike
    let attackBonus = bab + strMod;
    const lethalPenalty = hasImprovedUnarmedStrike ? 0 : -4;
    attackBonus += lethalPenalty;

    // Damage calculation
    const damage = `${damageDice} + ${strMod >= 0 ? '+' : ''}${strMod} nonlethal`;

    return {
        weaponName: 'Unarmed Strike',
        totalAttackBonus: attackBonus,
        damage,
        critical: '20/x2',
        range: null,
        weight: null,
        type: 'Bludgeoning',
        size: null,
        specialProperties: hasImprovedUnarmedStrike ? 'May deal lethal damage' : null,
    };
}

/**
 * Calculate main hand attack
 */
export function calculateMainHandAttack(
    input: AttackCalculationInput,
    characterItem: CharacterItem,
    item: AttackCalculationInput['items'][0]
): AttackCalculationResult {
    const { character, resolvedProgressions, classDetailsMap } = input;

    if (!item.weapon) {
        throw new Error('Item is not a weapon');
    }

    const bab = getCharacterBAB(character, classDetailsMap);
    const strMod = getAbilityModifier(character, AbilityId.Strength);
    const isProficient = isProficientWithWeapon(resolvedProgressions, item.weapon, item.id);
    const isTwoHanded = isTwoHandedWeapon(item.weapon);

    // Attack bonus: BAB + STR + (proficiency ? 0 : -4)
    let attackBonus = bab + strMod;
    if (!isProficient) {
        attackBonus -= 4;
    }

    // Damage calculation
    const baseDamage = item.weapon.damageMedium.split('/')[0] || '1d4';
    let damageMod = strMod;
    if (isTwoHanded) {
        // Two-handed: 1.5x STR (round down)
        damageMod = Math.floor(strMod * 1.5);
    }
    const damage = `${baseDamage}${damageMod >= 0 ? '+' : ''}${damageMod}`;

    return {
        weaponName: characterItem.name || item.name,
        totalAttackBonus: attackBonus,
        damage,
        critical: item.weapon.critical || '20/x2',
        range: formatRange(item.weapon.range),
        weight: item.weight ? `${item.weight.toString()} lb.` : null,
        type: formatDamageType(item.weapon.damageType),
        size: SIZE_MAP[(item.sizeId ?? 5) as keyof typeof SIZE_MAP]?.name ?? 'Medium',
        specialProperties: null,
    };
}

/**
 * Calculate ranged attack
 */
export function calculateRangedAttack(
    input: AttackCalculationInput,
    characterItem: CharacterItem,
    item: AttackCalculationInput['items'][0]
): AttackCalculationResult {
    const { character, resolvedProgressions, classDetailsMap } = input;

    if (!item.weapon) {
        throw new Error('Item is not a weapon');
    }

    const bab = getCharacterBAB(character, classDetailsMap);
    const dexMod = getAbilityModifier(character, AbilityId.Dexterity);
    const isProficient = isProficientWithWeapon(resolvedProgressions, item.weapon, item.id);

    // Attack bonus: BAB + DEX + (proficiency ? 0 : -4)
    let attackBonus = bab + dexMod;
    if (!isProficient) {
        attackBonus -= 4;
    }

    // Damage: weapon damage only (no ability modifier)
    const baseDamage = item.weapon.damageMedium || '1d4';
    const damage = baseDamage;

    return {
        weaponName: characterItem.name || item.name,
        totalAttackBonus: attackBonus,
        damage,
        critical: item.weapon.critical || '20/x2',
        range: formatRange(item.weapon.range),
        weight: item.weight ? `${item.weight.toString()} lb.` : null,
        type: formatDamageType(item.weapon.damageType),
        size: SIZE_MAP[(item.sizeId ?? 5) as keyof typeof SIZE_MAP]?.name ?? 'Medium',
        specialProperties: null,
    };
}

/**
 * Calculate dual wield attacks
 */
export function calculateDualWield(input: AttackCalculationInput): AttackCalculationResult {
    const { attackDefinition, characterItems, items, character, resolvedProgressions, classDetailsMap } = input;

    const mainHandItemId = attackDefinition.mainHandCharacterItemId;
    const offHandItemId = attackDefinition.offHandCharacterItemId;

    if (!mainHandItemId || !offHandItemId) {
        throw new Error('Dual wield requires both main hand and off hand items');
    }

    const mainHandCharacterItem = characterItems.find(ci => ci.id === mainHandItemId);
    const offHandCharacterItem = characterItems.find(ci => ci.id === offHandItemId);

    if (!mainHandCharacterItem || !offHandCharacterItem) {
        throw new Error('Character items not found');
    }

    const mainHandItem = items.find(i => i.id === mainHandCharacterItem.baseItemId);
    const offHandItem = items.find(i => i.id === offHandCharacterItem.baseItemId);

    if (!mainHandItem || !mainHandItem.weapon || !offHandItem || !offHandItem.weapon) {
        throw new Error('Item or weapon data not found');
    }

    const bab = getCharacterBAB(character, classDetailsMap);
    const strMod = getAbilityModifier(character, AbilityId.Strength);
    const mainHandProficient = isProficientWithWeapon(resolvedProgressions, mainHandItem.weapon, mainHandItem.id);
    const offHandProficient = isProficientWithWeapon(resolvedProgressions, offHandItem.weapon, offHandItem.id);
    const isOffHandLight = isLightWeapon(offHandItem.weapon);
    const hasTwoWeaponFighting = hasFeat(resolvedProgressions, character, 'Two-Weapon Fighting');

    // Calculate penalties
    let mainHandPenalty = -6;
    let offHandPenalty = -10;

    // Light offhand reduces both penalties by 2
    if (isOffHandLight) {
        mainHandPenalty += 2;
        offHandPenalty += 2;
    }

    // Two-Weapon Fighting feat reduces main hand by 2 and off hand by 6
    if (hasTwoWeaponFighting) {
        mainHandPenalty += 2;
        offHandPenalty += 6;
    }

    // Main hand attack bonus: BAB + STR + penalties + (proficiency ? 0 : -4)
    let mainHandAttackBonus = bab + strMod + mainHandPenalty;
    if (!mainHandProficient) {
        mainHandAttackBonus -= 4;
    }

    // Off hand attack bonus: BAB + STR + penalties + (proficiency ? 0 : -4)
    let offHandAttackBonus = bab + strMod + offHandPenalty;
    if (!offHandProficient) {
        offHandAttackBonus -= 4;
    }

    // Main hand damage: weapon damage + STR
    const mainHandBaseDamage = mainHandItem.weapon.damageMedium || '1d4';
    const mainHandDamage = `${mainHandBaseDamage} + ${strMod >= 0 ? '+' : ''}${strMod}`;

    // Off hand damage: weapon damage + 1/2 STR (round down)
    const offHandBaseDamage = offHandItem.weapon.damageMedium || '1d4';
    const offHandStrMod = Math.floor(strMod / 2);
    const offHandDamage = `${offHandBaseDamage} + ${offHandStrMod >= 0 ? '+' : ''}${offHandStrMod}`;

    const mainHandResult: AttackCalculationResult = {
        weaponName: mainHandCharacterItem.name || mainHandItem.name,
        totalAttackBonus: mainHandAttackBonus,
        damage: mainHandDamage,
        critical: mainHandItem.weapon.critical || '20/x2',
        range: formatRange(mainHandItem.weapon.range),
        weight: mainHandItem.weight ? `${mainHandItem.weight} lb.` : null,
        type: formatDamageType(mainHandItem.weapon.damageType),
        size: SIZE_MAP[(mainHandItem.sizeId ?? 5) as keyof typeof SIZE_MAP]?.name ?? 'Medium',
        specialProperties: null,
    };

    const offHandResult: AttackCalculationResult = {
        weaponName: offHandCharacterItem.name || offHandItem.name,
        totalAttackBonus: offHandAttackBonus,
        damage: offHandDamage,
        critical: offHandItem.weapon.critical || '20/x2',
        range: formatRange(offHandItem.weapon.range),
        weight: offHandItem.weight ? `${offHandItem.weight} lb.` : null,
        type: formatDamageType(offHandItem.weapon.damageType),
        size: SIZE_MAP[(offHandItem.sizeId ?? 5) as keyof typeof SIZE_MAP]?.name ?? 'Medium',
        specialProperties: null,
    };

    return {
        ...mainHandResult,
        isDualWield: true,
        offHandResult,
    };
}

