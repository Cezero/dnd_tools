import React, { useMemo } from 'react';

import { ValueTooltip } from '@/components/character-detail/ValueTooltip';
import { DiceButton } from '@/components/dice-box';
import { displayStrategyFactory } from '@/lib/formatters';
import type { CharacterSheetDisplayResult, FormattedCharacterResult } from '@/lib/formatters/types';
import { hasSubtypes, getSkillSubtypes } from '@/lib/skill-utils';
import { isSkillTrainedOnly, useCacheFunctions } from '@/services/cache';
import { EntityType, EntityAppliesToType, DisplayType } from '@shared/static-data';

import type { SkillsTabProps } from './types';

/**
 * SkillsTab displays the character's skills list with modifiers and tooltips.
 */
export function SkillsTab({ formattedCharacter, resolvedProgressions, character }: SkillsTabProps): React.JSX.Element {
    const cacheFunctions = useCacheFunctions();
    // Parse modifier string to number for dice notation
    const parseModifier = (modString: string): number => {
        // Remove + sign and parse
        const cleaned = modString.replace(/^\+/, '');
        return parseInt(cleaned, 10) || 0;
    };

    // Parse ranks string to number
    const parseRanks = (ranksString: string): number => {
        const cleaned = ranksString.replace(/^\+/, '').trim();
        return parseFloat(cleaned) || 0;
    };

    // Format modifier for display
    const formatModifier = (mod: number): string => {
        return mod >= 0 ? `+${mod}` : `${mod}`;
    };

    // Build conditional modifiers map (similar to PDF service)
    type ConditionalModifier = {
        value: number; // Numeric modifier value (e.g., +2)
        conditionalText: string; // Text after the modifier (e.g., "when casting defensively")
    };

    const conditionalSkillModifiersMap = useMemo(() => {
        const map = new Map<string, ConditionalModifier>();
        const characterSheetStrategy = displayStrategyFactory.createStrategy(DisplayType.CharacterSheet);

        // Build character context for formatting
        const characterContext = {
            abilityScores: Object.fromEntries(
                character.abilityScores.map(a => [a.abilityId, a.value])
            ),
            classLevels: Object.fromEntries(
                character.advancements.reduce((acc, adv) => {
                    const currentLevel = acc.get(adv.classId) ?? 0;
                    acc.set(adv.classId, currentLevel + 1);
                    if (adv.secondaryClassId) {
                        const secondaryLevel = acc.get(adv.secondaryClassId) ?? 0;
                        acc.set(adv.secondaryClassId, secondaryLevel + 1);
                    }
                    return acc;
                }, new Map<number, number>()).entries()
            ),
            raceId: character.raceId ?? undefined,
        };

        for (const progression of resolvedProgressions) {
            if (!progression.entities) continue;

            for (const entity of progression.entities) {
                // Only include entities with conditions
                if (!entity.conditions || entity.conditions.length === 0) continue;

                // Only include bonuses (not proficiencies, choices, etc.)
                if (entity.type !== EntityType.Bonus) continue;

                // Only include entities that apply to skills
                if (entity.appliesTo !== EntityAppliesToType.Skill || !entity.appliesToId) continue;

                // Get the numeric value from the entity
                const modifierValue = typeof entity.value === 'number' ? entity.value : (typeof entity.value === 'string' ? parseFloat(entity.value) || 0 : 0);

                // Format this entity using the display strategy
                const displayResult = characterSheetStrategy.format([progression], {
                    character: characterContext
                });

                // Find the formatted entity in the result
                const sheetResult = displayResult as CharacterSheetDisplayResult;
                const formattedEntity = sheetResult.individualEntities?.find(e =>
                    e.entity?.id === entity.id
                );

                if (formattedEntity && formattedEntity.formattedValue) {
                    // Remove skill name prefix if present (format is "Skill Name: value")
                    let modifierText = formattedEntity.formattedValue;
                    const skillData = cacheFunctions.getSkillSummaryById(entity.appliesToId);
                    if (skillData) {
                        // Check for skill name with subtype
                        let skillNameWithSubtype = skillData.name;
                        const entitySubId = entity.appliesToSubId;
                        if (entitySubId !== null && entitySubId !== undefined && entitySubId !== -1) {
                            if (hasSubtypes(entity.appliesToId)) {
                                const subtypes = getSkillSubtypes(entity.appliesToId);
                                const subtype = subtypes.find(s => s.id === entitySubId);
                                if (subtype) {
                                    skillNameWithSubtype = `${skillData.name} (${subtype.name})`;
                                }
                            }
                        }

                        // Remove skill name prefix if present
                        const prefix = `${skillNameWithSubtype}: `;
                        if (modifierText.startsWith(prefix)) {
                            modifierText = modifierText.substring(prefix.length);
                        }
                    }

                    // Extract the conditional text (everything after the modifier value)
                    // Modifier text might be "+2 when casting defensively" or just "+2"
                    let conditionalText = '';
                    const modifierMatch = modifierText.match(/^([+-]?\d+)\s*(.*)$/);
                    if (modifierMatch) {
                        conditionalText = modifierMatch[2].trim();
                    }

                    // Store modifier with key: skillId_subId
                    // If subId is -1 (all subtypes), we'll check for it when looking up
                    const subIdKey = entity.appliesToSubId ?? 'null';
                    const mapKey = `${entity.appliesToId}_${subIdKey}`;
                    map.set(mapKey, {
                        value: modifierValue,
                        conditionalText
                    });
                }
            }
        }

        return map;
    }, [resolvedProgressions, character, cacheFunctions]);

    // Filter and process skills
    const processedSkills = React.useMemo(() => {
        if (!formattedCharacter.skills) return [];

        return formattedCharacter.skills
            .filter((skill) => {
                // Hide trained-only skills if character has no ranks
                if (isSkillTrainedOnly(skill.skillId)) {
                    const ranks = parseRanks(skill.ranks);
                    if (ranks === 0) {
                        return false; // Hide this skill
                    }
                }
                return true;
            })
            .map((skill) => {
                // Create a unique key that includes skillSubId if present
                const skillKey = skill.skillSubId
                    ? `${skill.skillId}-${skill.skillSubId}`
                    : `${skill.skillId}`;

                // skillName is already formatted with subtype by the formatter (e.g., "Knowledge (arcana)")
                // Only add customSubtype if it's not already in the name and it's a custom subtype skill
                let displayName = skill.skillName;
                if (skill.customSubtype && skill.customSubtype !== '__placeholder__' && !skill.skillName.includes('(')) {
                    // Only add customSubtype if the skillName doesn't already have parentheses (subtype)
                    displayName = `${skill.skillName} (${skill.customSubtype})`;
                }

                const modifierNum = parseModifier(skill.total);
                const modifierNotation = modifierNum >= 0 ? `+${modifierNum}` : `${modifierNum}`;

                // Find conditional modifier for this skill
                const skillSubId = skill.skillSubId ?? null;
                let conditionalModifier: ConditionalModifier | undefined;

                // Try exact match first
                const exactKey = `${skill.skillId}_${skillSubId ?? 'null'}`;
                conditionalModifier = conditionalSkillModifiersMap.get(exactKey);

                // If no exact match and skill has a subtype, check for "all subtypes" modifier
                if (!conditionalModifier && skillSubId !== null) {
                    const allSubtypesKey = `${skill.skillId}_-1`;
                    conditionalModifier = conditionalSkillModifiersMap.get(allSubtypesKey);
                }

                // If no match and skill has no subtype, check for modifiers without subtype specified
                if (!conditionalModifier && skillSubId === null) {
                    const noSubtypeKey = `${skill.skillId}_null`;
                    conditionalModifier = conditionalSkillModifiersMap.get(noSubtypeKey);
                }

                // Calculate conditional total if modifier exists
                let conditionalTotal: string | null = null;
                let conditionalText: string | null = null;
                if (conditionalModifier) {
                    const currentTotal = parseModifier(skill.total);
                    const newTotal = currentTotal + conditionalModifier.value;
                    conditionalTotal = formatModifier(newTotal);
                    conditionalText = conditionalModifier.conditionalText;
                }

                return {
                    skill,
                    skillKey,
                    displayName,
                    modifierNum,
                    modifierNotation,
                    conditionalTotal,
                    conditionalText,
                };
            })
            .sort((a, b) => a.displayName.localeCompare(b.displayName)); // Sort alphabetically
    }, [formattedCharacter.skills, conditionalSkillModifiersMap]);

    // Split skills into two columns (first half left, second half right)
    const midpoint = Math.ceil(processedSkills.length / 2);
    const leftColumnSkills = processedSkills.slice(0, midpoint);
    const rightColumnSkills = processedSkills.slice(midpoint);

    const renderSkillRow = (skillData: typeof processedSkills[0]) => {
        const conditionalModifierNum = skillData.conditionalTotal ? parseModifier(skillData.conditionalTotal) : null;
        const conditionalNotation = conditionalModifierNum !== null
            ? (conditionalModifierNum >= 0 ? `+${conditionalModifierNum}` : `${conditionalModifierNum}`)
            : null;

        return (
            <div key={skillData.skillKey} className="p-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <span className="text-gray-900 dark:text-white">{skillData.displayName}</span>
                    <div className="flex items-center space-x-2">
                        <ValueTooltip breakdown={skillData.skill.breakdown}>
                            <span className="text-gray-900 dark:text-white">
                                {skillData.skill.total}
                            </span>
                        </ValueTooltip>
                        <DiceButton
                            diceType="d20"
                            rollNotation={`1d20${skillData.modifierNotation}`}
                            className="w-5 h-5"
                            group={`${skillData.displayName} Check`}
                        />
                    </div>
                </div>
                {skillData.conditionalTotal && skillData.conditionalText && (
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {skillData.conditionalTotal} {skillData.conditionalText}
                        </span>
                        {conditionalNotation && (
                            <DiceButton
                                diceType="d20"
                                rollNotation={`1d20${conditionalNotation}`}
                                className="w-4 h-4"
                                group={`${skillData.displayName} Check (${skillData.conditionalText})`}
                            />
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Skills</h2>
            <div className="grid grid-cols-2 gap-x-4">
                <div className="space-y-0">
                    {leftColumnSkills.map(renderSkillRow)}
                </div>
                <div className="space-y-0">
                    {rightColumnSkills.map(renderSkillRow)}
                </div>
            </div>
        </div>
    );
}
