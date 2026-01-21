import React from 'react';

import { ValueTooltip } from '@/components/character-detail/ValueTooltip';
import { DiceButton } from '@/components/dice-box';
import { CharacterDetailStateUpdateType } from '@/features/character/types';
import { extractDiceType } from '@/lib/DiceUtils';
import { extractRaceMechanics } from '@/lib/feature-extraction/raceMechanicsExtractor';
import { getRaceNameFromCache, useCacheFunctions } from '@/services/cache';
import { AbilityId, ABILITY_MAP, ALIGNMENT_MAP, SavingThrowId, SAVING_THROW_MAP, SIZE_MAP } from '@shared/static-data';

import type { OverviewTabProps } from './types';

/**
 * OverviewTab displays comprehensive character overview including:
 * - Character name, race, class, level
 * - HP, Wounds, Nonlethal Damage, AC, Speed (wounds/nonlethal editable)
 * - Saves (with dice links)
 * - All 6 abilities with scores and modifiers (dice links on modifiers)
 * - Initiative (with dice link)
 * - Attack list (with dice links for attack rolls and damage)
 * 
 * **Sync Pattern**: This tab follows the standardized state → useEffect → API + refreshState pattern.
 * - Updates state via `updateState()` when wounds change
 * - CharacterDetail component automatically syncs state changes to backend
 * - Do NOT call APIs directly - use `updateState()` instead
 * 
 * @see CharacterDetail component for sync pattern documentation
 */
export function OverviewTab({ character, formattedCharacter, state, updateState, resolvedProgressions }: OverviewTabProps): React.JSX.Element {
    const cacheFunctions = useCacheFunctions();

    // Use wounds from centralized state
    const wounds = state.wounds;

    // Calculate total character level from class levels
    const totalLevel = formattedCharacter.classLevels.reduce((sum, cl) => sum + cl.level, 0);

    // Get race name from cache
    const raceName = character.raceId ? getRaceNameFromCache(character.raceId) : null;

    // Extract sizeId from resolved features
    const raceMechanics = character.raceId && resolvedProgressions
        ? extractRaceMechanics(resolvedProgressions, character.raceId)
        : { sizeId: null };
    const sizeName = raceMechanics.sizeId ? SIZE_MAP[raceMechanics.sizeId]?.abbreviation : null;

    // Get alignment abbreviation
    const alignmentAbbr = character.alignmentId ? ALIGNMENT_MAP[character.alignmentId]?.abbreviation : null;

    // Use classLevelString from character which already has abbreviations (e.g., "Ftr 1/Wiz 1")
    // Fallback to building from formattedCharacter if not available
    const classLevelDisplay = (character as { classLevelString?: string }).classLevelString ||
        formattedCharacter.classLevels
            .map(cl => `${cl.className} ${cl.level}`)
            .join('/');

    // Convert height from inches to feet + inches
    const formatHeight = (inches: number | null): string | null => {
        if (!inches) return null;
        const feet = Math.floor(inches / 12);
        const remainingInches = inches % 12;
        return `${feet}'${remainingInches > 0 ? ` ${remainingInches}"` : ''}`;
    };

    // Get deity name
    const deityName = character.deityId ? cacheFunctions.getDeityNameFromCache(character.deityId) : null;

    // Parse HP to number for calculations
    const maxHP = parseInt(formattedCharacter.hitPoints || '0', 10) || 0;
    const currentHP = maxHP - wounds; // Allow negative values
    const halfHP = maxHP / 2;
    const quarterHP = maxHP / 4;

    // Determine color based on HP thresholds
    const getHPColor = (): string => {
        if (currentHP < 0) {
            return 'text-red-800 dark:text-red-500'; // Darker red for dying
        } else if (currentHP === 0) {
            return 'text-red-600 dark:text-red-400'; // Lighter red for disabled
        } else if (currentHP <= quarterHP) {
            return 'text-orange-600 dark:text-orange-400';
        } else if (currentHP <= halfHP) {
            return 'text-yellow-600 dark:text-yellow-400';
        } else {
            return 'text-green-600 dark:text-green-400';
        }
    };

    // Handle wounds change - update state, CharacterDetail will sync automatically
    const handleWoundsChange = (newWounds: number) => {
        if (newWounds < 0) return;
        updateState({
            type: CharacterDetailStateUpdateType.SET_WOUNDS,
            payload: { wounds: newWounds }
        });
    };

    // Parse modifier strings to numbers for dice notation
    const parseModifier = (modString: string): number => {
        // Remove + sign and parse
        const cleaned = modString.replace(/^\+/, '');
        return parseInt(cleaned, 10) || 0;
    };

    // Format modifier for display
    const formatModifier = (mod: number): string => {
        return mod >= 0 ? `+${mod}` : `${mod}`;
    };

    // Calculate melee and ranged attack bonuses (similar to PDF service)
    const attackBabString = formattedCharacter.baseAttackBonus;
    const attackFirstBab = parseInt(attackBabString.split('/')[0].replace(/[^-\d]/g, ''), 10) || 0;
    const strAbility = formattedCharacter.abilities.find(a => a.abilityId === AbilityId.Strength);
    const dexAbility = formattedCharacter.abilities.find(a => a.abilityId === AbilityId.Dexterity);
    const attackStrMod = strAbility ? parseModifier(strAbility.modifier) : 0;
    const attackDexMod = dexAbility ? parseModifier(dexAbility.modifier) : 0;
    const attackSizeMod = raceMechanics.sizeId ? (SIZE_MAP[raceMechanics.sizeId]?.sizeModifier ?? 0) : 0;
    const meleeMisc = 0; // Misc bonus not calculated yet (would need to check features)
    const rangedMisc = 0; // Misc bonus not calculated yet (would need to check features)

    const meleeTotal = attackFirstBab + attackStrMod + attackSizeMod + meleeMisc;
    const rangedTotal = attackFirstBab + attackDexMod + attackSizeMod + rangedMisc;

    // Ability order matching the standard D&D order
    const abilityOrder = [
        AbilityId.Strength,
        AbilityId.Dexterity,
        AbilityId.Constitution,
        AbilityId.Intelligence,
        AbilityId.Wisdom,
        AbilityId.Charisma,
    ];

    return (
        <div className="space-y-6">
            {/* Character Information - Full Width */}
            <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {raceName && (
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Race:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{raceName}</span>
                        </div>
                    )}
                    {classLevelDisplay && (
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Class/Level:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{classLevelDisplay}</span>
                        </div>
                    )}
                    <div>
                        <span className="text-gray-600 dark:text-gray-400">Character Level:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">{totalLevel}</span>
                    </div>
                    {sizeName && (
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Size:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{sizeName}</span>
                        </div>
                    )}
                    {alignmentAbbr && (
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Alignment:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{alignmentAbbr}</span>
                        </div>
                    )}
                    {deityName && (
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Deity:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{deityName}</span>
                        </div>
                    )}
                    {character.age && (
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Age:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{character.age}</span>
                        </div>
                    )}
                    {character.height && formatHeight(character.height) && (
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Height:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{formatHeight(character.height)}</span>
                        </div>
                    )}
                    {character.weight && (
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Weight:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{character.weight} lbs</span>
                        </div>
                    )}
                    {character.eyes && (
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Eyes:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{character.eyes}</span>
                        </div>
                    )}
                    {character.hair && (
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Hair:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{character.hair}</span>
                        </div>
                    )}
                    {character.gender && (
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Gender:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{character.gender}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">

                    {/* Abilities - Single Column */}
                    <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
                        <div className="space-y-2">
                            {abilityOrder.map((abilityId) => {
                                const ability = formattedCharacter.abilities.find(a => a.abilityId === abilityId);
                                if (!ability) return null;

                                const abilityData = ABILITY_MAP[abilityId];
                                if (!abilityData) return null;

                                const modifierNum = parseModifier(ability.modifier);
                                const modifierNotation = modifierNum >= 0 ? `+${modifierNum}` : `${modifierNum}`;

                                return (
                                    <div key={abilityId} className="grid grid-cols-[30px_25px_35px_30px] gap-2 items-center">
                                        <span className="text-gray-600 dark:text-gray-400 w-12">{abilityData.abbreviation}:</span>
                                        <span className="text-gray-900 dark:text-white text-right">{ability.score}</span>
                                        <div className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-right">
                                            <span className="text-gray-900 dark:text-white">{ability.modifier}</span>
                                        </div>
                                        <DiceButton
                                            diceType="d20"
                                            rollNotation={`1d20${modifierNotation}`}
                                            className="w-5 h-5"
                                            group={`${abilityData.name} Check`}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Saving Throws */}
                    <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
                        <div className="space-y-2">
                            {formattedCharacter.savingThrows && (
                                <>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-gray-600 dark:text-gray-400 w-20">{SAVING_THROW_MAP[SavingThrowId.Fortitude].abbreviation}:</span>
                                        <ValueTooltip breakdown={formattedCharacter.savingThrows.fortitude.breakdown}>
                                            <span className="text-gray-900 dark:text-white">
                                                {formattedCharacter.savingThrows.fortitude.total}
                                            </span>
                                        </ValueTooltip>
                                        <DiceButton
                                            diceType="d20"
                                            rollNotation={`1d20${formattedCharacter.savingThrows.fortitude.total.startsWith('+') ? '' : '+'}${formattedCharacter.savingThrows.fortitude.total}`}
                                            className="w-5 h-5 ml-1"
                                            group="Fort Saving Throw"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-gray-600 dark:text-gray-400 w-20">{SAVING_THROW_MAP[SavingThrowId.Reflex].abbreviation}:</span>
                                        <ValueTooltip breakdown={formattedCharacter.savingThrows.reflex.breakdown}>
                                            <span className="text-gray-900 dark:text-white">
                                                {formattedCharacter.savingThrows.reflex.total}
                                            </span>
                                        </ValueTooltip>
                                        <DiceButton
                                            diceType="d20"
                                            rollNotation={`1d20${formattedCharacter.savingThrows.reflex.total.startsWith('+') ? '' : '+'}${formattedCharacter.savingThrows.reflex.total}`}
                                            className="w-5 h-5 ml-1"
                                            group="Reflex Saving Throw"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-gray-600 dark:text-gray-400 w-20">{SAVING_THROW_MAP[SavingThrowId.Will].abbreviation}:</span>
                                        <ValueTooltip breakdown={formattedCharacter.savingThrows.will.breakdown}>
                                            <span className="text-gray-900 dark:text-white">
                                                {formattedCharacter.savingThrows.will.total}
                                            </span>
                                        </ValueTooltip>
                                        <DiceButton
                                            diceType="d20"
                                            rollNotation={`1d20${formattedCharacter.savingThrows.will.total.startsWith('+') ? '' : '+'}${formattedCharacter.savingThrows.will.total}`}
                                            className="w-5 h-5 ml-1"
                                            group="Will Saving Throw"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                    {/* HP with Wounds */}
                    <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
                        <div className="space-y-2">
                            <div className="flex items-center space-x-4">
                                <span className="text-gray-600 dark:text-gray-400">HP:</span>
                                <span className="text-gray-900 dark:text-white">{maxHP}</span>
                                <span className="text-gray-600 dark:text-gray-400 ml-4">Wounds:</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={wounds}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value, 10) || 0;
                                        handleWoundsChange(value);
                                    }}
                                    className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                                <span className="text-gray-600 dark:text-gray-400 ml-4">Current HP:</span>
                                <span className={`font-semibold ${getHPColor()}`}>
                                    {currentHP}{currentHP === 0 ? ' (disabled)' : currentHP < 0 ? ' (dying)' : ''}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* AC */}
                    <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-600 dark:text-gray-400">AC:</span>
                            <ValueTooltip breakdown={formattedCharacter.armorClass?.breakdown}>
                                <span className="text-gray-900 dark:text-white">
                                    {formattedCharacter.armorClass?.total || '0'}
                                </span>
                            </ValueTooltip>
                            <span className="text-gray-600 dark:text-gray-400 ml-4">Touch:</span>
                            <ValueTooltip breakdown={formattedCharacter.armorClass?.breakdown}>
                                <span className="text-gray-900 dark:text-white">
                                    {formattedCharacter.armorClass?.touchAC || '0'}
                                </span>
                            </ValueTooltip>
                            <span className="text-gray-600 dark:text-gray-400 ml-4">Flat-Footed:</span>
                            <ValueTooltip breakdown={formattedCharacter.armorClass?.breakdown}>
                                <span className="text-gray-900 dark:text-white">
                                    {formattedCharacter.armorClass?.flatFootedAC || '0'}
                                </span>
                            </ValueTooltip>
                        </div>
                    </div>

                    {/* Speed */}
                    <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                            <span className="text-gray-600 dark:text-gray-400">Speed:</span>
                            <span className="text-gray-900 dark:text-white">
                                {formattedCharacter.speed || '-'}
                            </span>
                        </div>
                    </div>

                    {/* Initiative */}
                    <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                            <span className="text-gray-600 dark:text-gray-400">Initiative:</span>
                            <ValueTooltip breakdown={formattedCharacter.initiative?.breakdown}>
                                <span className="text-gray-900 dark:text-white">
                                    {formattedCharacter.initiative?.total || '0'}
                                </span>
                            </ValueTooltip>
                            <DiceButton
                                diceType="d20"
                                rollNotation={`1d20${formattedCharacter.initiative?.total.startsWith('+') ? '' : '+'}${formattedCharacter.initiative?.total || '0'}`}
                                className="w-5 h-5 ml-1"
                                group="Initiative Check"
                            />
                        </div>
                    </div>

                    {/* Grapple, Melee, Ranged */}
                    <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center space-x-6">
                            <div className="flex items-center space-x-2">
                                <span className="text-gray-600 dark:text-gray-400">Grapple:</span>
                                <ValueTooltip breakdown={formattedCharacter.grapple?.breakdown}>
                                    <span className="text-gray-900 dark:text-white">
                                        {formattedCharacter.grapple?.total || '0'}
                                    </span>
                                </ValueTooltip>
                                <DiceButton
                                    diceType="d20"
                                    rollNotation={`1d20${formattedCharacter.grapple?.total.startsWith('+') ? '' : '+'}${formattedCharacter.grapple?.total || '0'}`}
                                    className="w-5 h-5 ml-1"
                                    group="Grapple Check"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-gray-600 dark:text-gray-400">Melee:</span>
                                <span className="text-gray-900 dark:text-white">
                                    {formatModifier(meleeTotal)}
                                </span>
                                <DiceButton
                                    diceType="d20"
                                    rollNotation={`1d20${formatModifier(meleeTotal)}`}
                                    className="w-5 h-5 ml-1"
                                    group="Melee Attack"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-gray-600 dark:text-gray-400">Ranged:</span>
                                <span className="text-gray-900 dark:text-white">
                                    {formatModifier(rangedTotal)}
                                </span>
                                <DiceButton
                                    diceType="d20"
                                    rollNotation={`1d20${formatModifier(rangedTotal)}`}
                                    className="w-5 h-5 ml-1"
                                    group="Ranged Attack"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attacks - Full Width */}
                {formattedCharacter.attacks && formattedCharacter.attacks.length > 0 ? (
                    <div className="col-span-2 border border-gray-300 dark:border-gray-700 rounded-lg p-4">
                        <div className="space-y-2">
                            {formattedCharacter.attacks.map((attack, index) => {
                                const attackBonusNum = parseModifier(attack.attackBonus);
                                const attackNotation = attackBonusNum >= 0 ? `+${attackBonusNum}` : `${attackBonusNum}`;

                                return (
                                    <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0">
                                        <div className="font-medium text-gray-900 dark:text-white mb-1">{attack.weaponName}</div>
                                        <div className="grid grid-cols-[30px_20px_25px_42px_100px_30px_40px_50px] gap-x-3 gap-y-1 items-center text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Attack:</span>
                                            <ValueTooltip breakdown={attack.attackBreakdown}>
                                                <span className="text-gray-900 dark:text-white text-right">{attack.attackBonus}</span>
                                            </ValueTooltip>
                                            <DiceButton
                                                diceType="d20"
                                                rollNotation={`1d20${attackNotation}`}
                                                className="w-5 h-5"
                                                group={`${attack.weaponName} Attack`}
                                            />
                                            <span className="text-gray-600 dark:text-gray-400">Damage:</span>
                                            <div className="flex items-center gap-1">
                                                <ValueTooltip breakdown={attack.damageBreakdown}>
                                                    <span className="text-gray-900 dark:text-white">{attack.damage}</span>
                                                </ValueTooltip>
                                                {attack.type && (
                                                    <span className="text-gray-500 dark:text-gray-400 text-xs">({attack.type})</span>
                                                )}
                                            </div>
                                            {attack.damage ? (
                                                <DiceButton
                                                    diceType={extractDiceType(attack.damage) as 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100'}
                                                    rollNotation={attack.damage}
                                                    className="w-5 h-5"
                                                    group={`${attack.weaponName} Damage`}
                                                />
                                            ) : (
                                                <span></span>
                                            )}
                                            {attack.critical && (
                                                <>
                                                    <span className="text-gray-600 dark:text-gray-400">Critical:</span>
                                                    <span className="text-gray-900 dark:text-white">{attack.critical}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
