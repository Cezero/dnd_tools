import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import { EntityLink } from '@/components/entity-link';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { CollapsibleSection } from '@/components/widgets/CollapsibleSection';
import { hasSubtypes, usesCustomSubtype, getSkillSubtypes } from '@/lib/skill-utils';
import { getSkillNameFromCache, useCacheFunctions, getSourceDisplay } from '@/services/cache';
import {
    EDITION_MAP,
    SIZE_MAP,
    MONSTER_TYPE_LIST,
    MONSTER_SUBTYPE_LIST,
    MonsterSpecialAbilityTypeId,
    MonsterSpellTypeId,
} from '@shared/static-data';

import type { MonsterDisplayContentProps } from './types';

// Helper function to get skill name including subtypes
function getSkillNameWithSubtype(skillId: number, skillSubId?: number | null, notes?: string | null): string {
    const skillName = getSkillNameFromCache(skillId);
    if (!skillName) {
        return 'Unknown Skill';
    }

    // Check if this skill uses skillSubId (Craft, Knowledge)
    if (hasSubtypes(skillId) && skillSubId !== null && skillSubId !== undefined) {
        if (skillSubId === -1) {
            return `${skillName} (All)`;
        } else {
            const subtypes = getSkillSubtypes(skillId);
            const subtype = subtypes.find(s => s.id === skillSubId);
            if (subtype) {
                return `${skillName} (${subtype.name})`;
            }
        }
    }

    // Check if this skill uses customSubtype (Perform, Profession) - stored in notes
    if (usesCustomSubtype(skillId) && notes) {
        return `${skillName} (${notes})`;
    }

    return skillName;
}

export function MonsterDisplayContent({ monster, showHeader = false }: MonsterDisplayContentProps): React.JSX.Element | null {
    const { getFeatSummaryById, getSpellSummaryById } = useCacheFunctions();
    const [spellNames, setSpellNames] = useState<Record<number, string>>({});
    const spellsRef = useRef<string>('');
    const [expandedExtraTypes, setExpandedExtraTypes] = useState<Set<number>>(new Set());
    const extraTypesInitializedRef = useRef(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true);
    const [isCombatExpanded, setIsCombatExpanded] = useState(true);

    // Resolve spell names
    useEffect(() => {
        if (!monster?.spells) return;

        const spellsKey = JSON.stringify(monster.spells.map(s => ({ id: s.id, spellId: s.spellId })));
        if (spellsRef.current === spellsKey) return;

        spellsRef.current = spellsKey;
        const resolveSpellNames = async () => {
            const names: Record<number, string> = {};
            for (const spell of monster.spells || []) {
                if (!names[spell.spellId]) {
                    try {
                        const spellData = getSpellSummaryById(spell.spellId);
                        names[spell.spellId] = spellData?.name || `Unknown Spell (${spell.spellId})`;
                    } catch {
                        names[spell.spellId] = `Unknown Spell (${spell.spellId})`;
                    }
                }
            }
            setSpellNames(names);
        };
        resolveSpellNames();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [monster?.spells]);

    // Initialize expanded extra description types
    useEffect(() => {
        if (!monster || extraTypesInitializedRef.current) return;

        const allExtraDescriptions: Array<{ id: number }> = [];
        if (monster.hierarchyData) {
            monster.hierarchyData.forEach((hierarchyEntry) => {
                if (hierarchyEntry.extraDescriptions) {
                    hierarchyEntry.extraDescriptions.forEach((extra) => {
                        if (extra.description) {
                            allExtraDescriptions.push({ id: extra.id });
                        }
                    });
                }
            });
        }
        if (monster.extraDescriptions) {
            monster.extraDescriptions.forEach((extra) => {
                if (extra.description) {
                    allExtraDescriptions.push({ id: extra.id });
                }
            });
        }

        if (allExtraDescriptions.length > 0) {
            const allIds = new Set(allExtraDescriptions.map(e => e.id));
            setExpandedExtraTypes(allIds);
            extraTypesInitializedRef.current = true;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [monster?.extraDescriptions, monster?.hierarchyData]);

    // Format skills for display as JSX with links
    const skillsDisplay = useMemo(() => {
        if (!monster?.skills || monster.skills.length === 0) return null;

        return monster.skills.map((skill, index) => {
            const skillName = getSkillNameWithSubtype(skill.skillId, skill.skillSubId, skill.notes);
            const ranksDisplay = skill.ranks !== null && skill.ranks !== undefined
                ? ` ${skill.ranks >= 0 ? '+' : ''}${skill.ranks}`
                : '';

            return (
                <React.Fragment key={skill.id}>
                    <Link to={`/skills/${skill.skillId}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                        {skillName}
                    </Link>
                    {ranksDisplay}
                    {index < monster.skills.length - 1 && ', '}
                </React.Fragment>
            );
        });
    }, [monster?.skills]);

    // Format feats for display as JSX with links (async resolution)
    const [featsDisplay, setFeatsDisplay] = React.useState<React.ReactNode | null>(null);
    const featsRef = React.useRef<string>('');

    React.useEffect(() => {
        if (!monster?.feats || monster.feats.length === 0) {
            setFeatsDisplay(null);
            featsRef.current = '';
            return;
        }

        // Create a stable key from the feats array to prevent unnecessary re-runs
        const featsKey = JSON.stringify(monster.feats.map(f => ({ id: f.id, featId: f.featId, notes: f.notes })));

        // Only resolve if the feats have actually changed
        if (featsRef.current === featsKey) {
            return;
        }

        featsRef.current = featsKey;

        const resolveFeats = async () => {
            const featElements = await Promise.all(
                monster.feats.map(async (feat, index) => {
                    const featData = getFeatSummaryById(feat.featId);
                    const featName = featData?.name || `Feat ${feat.featId}`;
                    const displayName = feat.notes ? `${featName} (${feat.notes})` : featName;

                    return (
                        <React.Fragment key={feat.id}>
                            <Link to={`/feats/${feat.featId}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                                {displayName}
                            </Link>
                            {index < monster.feats.length - 1 && ', '}
                        </React.Fragment>
                    );
                })
            );
            setFeatsDisplay(featElements);
        };

        resolveFeats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [monster?.feats]);

    if (!monster) {
        return null;
    }

    return (
        <>
            {showHeader && (
                <div className="flex justify-between items-start mb-1">
                    <h1 className="text-2xl font-bold">{monster.name}</h1>
                    <div className="text-right space-y-0.25">
                        <p><strong>Edition:</strong> {EDITION_MAP[monster.editionId]?.abbreviation}</p>
                        {monster.sourceBookInfo && monster.sourceBookInfo.length > 0 && (
                            <p><strong>Source:</strong> {getSourceDisplay(monster.sourceBookInfo, true)}</p>
                        )}
                    </div>
                </div>
            )}

            {/* Statblock Fields */}
            <div className="mb-4 space-y-0.25">
                {/* Size, Type, and Subtypes */}
                {(() => {
                    const sizeName = monster.sizeId ? SIZE_MAP[monster.sizeId]?.name || '' : '';
                    const typeNames = monster.types && monster.types.length > 0
                        ? monster.types.map(t => MONSTER_TYPE_LIST.find(type => type.id === t.typeId)?.name || '').join(', ')
                        : '';
                    const subtypeNames = monster.subtypes && monster.subtypes.length > 0
                        ? monster.subtypes.map(s => MONSTER_SUBTYPE_LIST.find(subtype => subtype.id === s.subtypeId)?.name || '').join(', ')
                        : '';

                    if (sizeName || typeNames) {
                        const parts: string[] = [];
                        if (sizeName) parts.push(sizeName);
                        if (typeNames) parts.push(typeNames);
                        if (subtypeNames) parts.push(`(${subtypeNames})`);
                        return <p>{parts.join(' ')}</p>;
                    }
                    return null;
                })()}

                {/* Hit Dice */}
                {monster.hitDiceQty !== null && (
                    <p><strong>Hit Dice:</strong> {monster.hitDiceQty}{monster.hitDiceType ? `d${monster.hitDiceType}` : ''}{monster.bonusHP ? `+${monster.bonusHP}` : ''}{monster.averageHP !== null ? ` (${monster.averageHP} hp)` : ''}</p>
                )}

                {/* Initiative */}
                {monster.initiative !== null && (
                    <p><strong>Initiative:</strong> {monster.initiative >= 0 ? '+' : ''}{monster.initiative}</p>
                )}

                {/* Speed */}
                {monster.baseSpeed !== null && (
                    <p><strong>Speed:</strong> {monster.baseSpeed} ft.</p>
                )}

                {/* Armor Class */}
                {monster.armorClass !== null && (
                    <p><strong>Armor Class:</strong> {monster.armorClass}{monster.touchAC !== null || monster.flatFootedAC !== null ? ' (' : ''}{monster.touchAC !== null ? `touch ${monster.touchAC}` : ''}{monster.touchAC !== null && monster.flatFootedAC !== null ? ', ' : ''}{monster.flatFootedAC !== null ? `flat-footed ${monster.flatFootedAC}` : ''}{monster.touchAC !== null || monster.flatFootedAC !== null ? ')' : ''}</p>
                )}

                {/* Base Attack/Grapple */}
                {monster.baseAttack !== null && (
                    <p><strong>Base Attack/Grapple:</strong> {monster.baseAttack >= 0 ? '+' : ''}{monster.baseAttack}{monster.grapple !== null ? `/${monster.grapple >= 0 ? '+' : ''}${monster.grapple}` : ''}</p>
                )}

                {/* Attack */}
                {monster.attack && (
                    <p><strong>Attack:</strong> <span className="inline [&_.prose-custom]:inline [&_.prose-custom_p]:inline [&_.prose-custom_p]:my-0"><ProcessMarkdown id="attack" markdown={monster.attack} /></span></p>
                )}

                {/* Full Attack */}
                {monster.fullAttack && (
                    <p><strong>Full Attack:</strong> <span className="inline [&_.prose-custom]:inline [&_.prose-custom_p]:inline [&_.prose-custom_p]:my-0"><ProcessMarkdown id="full-attack" markdown={monster.fullAttack} /></span></p>
                )}

                {/* Space/Reach */}
                {(monster.space !== null || monster.reach !== null) && (
                    <p><strong>Space/Reach:</strong> {monster.space !== null ? `${monster.space} ft.` : ''}{monster.space !== null && monster.reach !== null ? '/' : ''}{monster.reach !== null ? `${monster.reach} ft.` : ''}{monster.optionalReach !== null ? ` (${monster.optionalReach} ft.${monster.optionalReachDescription ? ` ${monster.optionalReachDescription}` : ''} with ${monster.optionalReachDescription || 'tentacle'})` : ''}</p>
                )}

                {/* Special Attacks */}
                {monster.specialAttacks && (
                    <p><strong>Special Attacks:</strong> {monster.specialAttacks}</p>
                )}

                {/* Special Qualities */}
                {monster.specialQualities && (
                    <p><strong>Special Qualities:</strong> {monster.specialQualities}</p>
                )}

                {/* Saves */}
                {(monster.fortSave !== null || monster.refSave !== null || monster.willSave !== null) && (
                    <p><strong>Saves:</strong> {monster.fortSave !== null ? `Fort ${monster.fortSave >= 0 ? '+' : ''}${monster.fortSave}` : ''}{monster.fortSave !== null && (monster.refSave !== null || monster.willSave !== null) ? ', ' : ''}{monster.refSave !== null ? `Ref ${monster.refSave >= 0 ? '+' : ''}${monster.refSave}` : ''}{monster.refSave !== null && monster.willSave !== null ? ', ' : ''}{monster.willSave !== null ? `Will ${monster.willSave >= 0 ? '+' : ''}${monster.willSave}` : ''}</p>
                )}

                {/* Abilities */}
                {(monster.strength !== null || monster.dexterity !== null || monster.constitution !== null ||
                    monster.intelligence !== null || monster.wisdom !== null || monster.charisma !== null) && (
                        <p><strong>Abilities:</strong> {monster.strength !== null ? `Str ${monster.strength}` : ''}{monster.strength !== null && (monster.dexterity !== null || monster.constitution !== null || monster.intelligence !== null || monster.wisdom !== null || monster.charisma !== null) ? ', ' : ''}{monster.dexterity !== null ? `Dex ${monster.dexterity}` : ''}{monster.dexterity !== null && (monster.constitution !== null || monster.intelligence !== null || monster.wisdom !== null || monster.charisma !== null) ? ', ' : ''}{monster.constitution !== null ? `Con ${monster.constitution}` : ''}{monster.constitution !== null && (monster.intelligence !== null || monster.wisdom !== null || monster.charisma !== null) ? ', ' : ''}{monster.intelligence !== null ? `Int ${monster.intelligence}` : ''}{monster.intelligence !== null && (monster.wisdom !== null || monster.charisma !== null) ? ', ' : ''}{monster.wisdom !== null ? `Wis ${monster.wisdom}` : ''}{monster.wisdom !== null && monster.charisma !== null ? ', ' : ''}{monster.charisma !== null ? `Cha ${monster.charisma}` : ''}</p>
                    )}

                {/* Skills */}
                {skillsDisplay && (
                    <p><strong>Skills:</strong> {skillsDisplay}</p>
                )}

                {/* Feats */}
                {featsDisplay && (
                    <p><strong>Feats:</strong> {featsDisplay}</p>
                )}

                {/* Environment - TODO: Add if available */}

                {/* Organization */}
                {monster.organization && (
                    <p><strong>Organization:</strong> <span className="inline [&_.prose-custom]:inline [&_.prose-custom_p]:inline [&_.prose-custom_p]:my-0"><ProcessMarkdown id="organization" markdown={monster.organization} /></span></p>
                )}

                {/* Challenge Rating */}
                {monster.challengeRating && (
                    <p><strong>Challenge Rating:</strong> {monster.challengeRating}</p>
                )}

                {/* Treasure */}
                {monster.treasure && (
                    <p><strong>Treasure:</strong> {monster.treasure}</p>
                )}

                {/* Alignment */}
                {monster.alignment && (
                    <p><strong>Alignment:</strong> {monster.alignment}</p>
                )}

                {/* Advancement */}
                {monster.advancement && (
                    <p><strong>Advancement:</strong> {monster.advancement}</p>
                )}

                {/* Level Adjustment */}
                {monster.levelAdjustment && (
                    <p><strong>Level Adjustment:</strong> {monster.levelAdjustment}</p>
                )}
            </div>

            {/* Flavor Text - Show parent's if current doesn't have one */}
            {(() => {
                const displayFlavorText = monster.flavorText ||
                    (monster.hierarchyData && monster.hierarchyData.length > 0
                        ? monster.hierarchyData[monster.hierarchyData.length - 1]?.flavorText
                        : null);
                return displayFlavorText ? (
                    <div className="mb-4 italic prose-custom">
                        <ProcessMarkdown id="flavor-text" markdown={displayFlavorText} />
                    </div>
                ) : null;
            })()}

            {/* Description - Show first parent as regular if variant doesn't have one, otherwise show parents in collapsible */}
            {(() => {
                const hasCurrentDescription = !!monster.description;
                const hierarchyDescriptions = monster.hierarchyData?.filter(h => h.description) || [];

                if (!hasCurrentDescription && hierarchyDescriptions.length === 0) return null;
                if (hasCurrentDescription && hierarchyDescriptions.length === 0 && !monster.description) return null;

                // If variant doesn't have description, find closest parent (most recent) with one
                let closestParentIndex = -1;
                if (!hasCurrentDescription && hierarchyDescriptions.length > 0) {
                    // Find the last parent (closest to variant) that has a description
                    for (let i = (monster.hierarchyData?.length || 0) - 1; i >= 0; i--) {
                        if (monster.hierarchyData?.[i]?.description) {
                            closestParentIndex = i;
                            break;
                        }
                    }
                }

                return (
                    <div className="mb-4">
                        {monster.hierarchyData && monster.hierarchyData.map((hierarchyEntry, index) => {
                            if (!hierarchyEntry.description) return null;

                            // If variant doesn't have description and this is the closest parent with one, show as regular
                            if (!hasCurrentDescription && index === closestParentIndex) {
                                return (
                                    <div key={`hierarchy-${hierarchyEntry.id}-description`} className="prose-custom">
                                        <ProcessMarkdown id={`hierarchy-${hierarchyEntry.id}-description`} markdown={hierarchyEntry.description} />
                                    </div>
                                );
                            }

                            // Show other parents in collapsible (either if variant has its own, or if this is not the closest parent)
                            return (
                                <CollapsibleSection
                                    key={`hierarchy-${hierarchyEntry.id}-description`}
                                    isExpanded={isDescriptionExpanded}
                                    onToggle={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                    tooltipText={isDescriptionExpanded ? 'Collapse parent description' : 'Expand parent description'}
                                >
                                    <ProcessMarkdown id={`hierarchy-${hierarchyEntry.id}-description`} markdown={hierarchyEntry.description} />
                                </CollapsibleSection>
                            );
                        })}
                        {monster.description && (
                            <div className="prose-custom">
                                <ProcessMarkdown id="description" markdown={monster.description} />
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Combat - Show first parent as regular if variant doesn't have one, otherwise show parents in collapsible */}
            {(() => {
                const hasCurrentCombat = !!monster.combatDescription;
                const hierarchyCombat = monster.hierarchyData?.filter(h => h.combatDescription) || [];

                if (!hasCurrentCombat && hierarchyCombat.length === 0) return null;
                if (hasCurrentCombat && hierarchyCombat.length === 0 && !monster.combatDescription) return null;

                // If variant doesn't have combat description, find closest parent (most recent) with one
                let closestParentIndex = -1;
                if (!hasCurrentCombat && hierarchyCombat.length > 0) {
                    // Find the last parent (closest to variant) that has a combat description
                    for (let i = (monster.hierarchyData?.length || 0) - 1; i >= 0; i--) {
                        if (monster.hierarchyData?.[i]?.combatDescription) {
                            closestParentIndex = i;
                            break;
                        }
                    }
                }

                return (
                    <div className="mb-4">
                        <h2 className="text-xl font-semibold mb-2">Combat</h2>
                        {monster.hierarchyData && monster.hierarchyData.map((hierarchyEntry, index) => {
                            if (!hierarchyEntry.combatDescription) return null;

                            // If variant doesn't have combat description and this is the closest parent with one, show as regular
                            if (!hasCurrentCombat && index === closestParentIndex) {
                                return (
                                    <div key={`hierarchy-${hierarchyEntry.id}-combat`} className="prose-custom">
                                        <ProcessMarkdown id={`hierarchy-${hierarchyEntry.id}-combat`} markdown={hierarchyEntry.combatDescription} />
                                    </div>
                                );
                            }

                            // Show other parents in collapsible (either if variant has its own, or if this is not the closest parent)
                            return (
                                <CollapsibleSection
                                    key={`hierarchy-${hierarchyEntry.id}-combat`}
                                    isExpanded={isCombatExpanded}
                                    onToggle={() => setIsCombatExpanded(!isCombatExpanded)}
                                    tooltipText={isCombatExpanded ? 'Collapse parent description' : 'Expand parent description'}
                                >
                                    <ProcessMarkdown id={`hierarchy-${hierarchyEntry.id}-combat`} markdown={hierarchyEntry.combatDescription} />
                                </CollapsibleSection>
                            );
                        })}
                        {monster.combatDescription && (
                            <div className="prose-custom">
                                <ProcessMarkdown id="combat-description" markdown={monster.combatDescription} />
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Special Abilities - Show all parent abilities then current abilities */}
            {(() => {
                // Collect all special abilities from hierarchy and current monster
                type SpecialAbilityItem = {
                    abilityId: number;
                    ability: {
                        id: number;
                        name: string;
                        description: string | null;
                        abilityType: number;
                        effectiveCasterLevel: number | null;
                        saveAbility: number | null;
                    };
                    hierarchyEntryId?: number;
                };
                const allSpecialAbilities: SpecialAbilityItem[] = [];

                // Add hierarchy abilities
                if (monster.hierarchyData) {
                    monster.hierarchyData.forEach((hierarchyEntry) => {
                        if (hierarchyEntry.specialAbilities) {
                            hierarchyEntry.specialAbilities.forEach((sa) => {
                                if (sa.ability) {
                                    allSpecialAbilities.push({
                                        abilityId: sa.abilityId,
                                        ability: {
                                            id: sa.ability.id,
                                            name: sa.ability.name,
                                            description: sa.ability.description ?? null,
                                            abilityType: sa.ability.abilityType,
                                            effectiveCasterLevel: sa.ability.effectiveCasterLevel ?? null,
                                            saveAbility: sa.ability.saveAbility ?? null,
                                        },
                                        hierarchyEntryId: hierarchyEntry.id
                                    });
                                }
                            });
                        }
                    });
                }

                // Add current monster abilities
                if (monster.specialAbilities) {
                    monster.specialAbilities.forEach((sa) => {
                        if (sa.ability) {
                            allSpecialAbilities.push({
                                abilityId: sa.abilityId,
                                ability: {
                                    id: sa.ability.id,
                                    name: sa.ability.name,
                                    description: sa.ability.description ?? null,
                                    abilityType: sa.ability.abilityType,
                                    effectiveCasterLevel: sa.ability.effectiveCasterLevel ?? null,
                                    saveAbility: sa.ability.saveAbility ?? null,
                                }
                            });
                        }
                    });
                }

                if (allSpecialAbilities.length === 0) return null;

                return (
                    <div className="mb-4">
                        {allSpecialAbilities.map((sa) => {
                            // Get abbreviation based on ability type
                            let abilityTypeAbbr = '';
                            if (sa.ability.abilityType === MonsterSpecialAbilityTypeId.SpellLike) {
                                abilityTypeAbbr = 'Sp';
                            } else if (sa.ability.abilityType === MonsterSpecialAbilityTypeId.Supernatural) {
                                abilityTypeAbbr = 'Su';
                            } else if (sa.ability.abilityType === MonsterSpecialAbilityTypeId.Extraordinary) {
                                abilityTypeAbbr = 'Ex';
                            }

                            // Combine ability name, type, and description into a single markdown string
                            const abilityName = sa.ability.name;
                            const abilityType = abilityTypeAbbr ? ` (${abilityTypeAbbr})` : '';
                            const description = sa.ability.description || '';
                            const combinedMarkdown = `**${abilityName}${abilityType}**: ${description}`;

                            return (
                                <div key={sa.hierarchyEntryId ? `hierarchy-${sa.hierarchyEntryId}-special-ability-${sa.abilityId}` : `special-ability-${sa.abilityId}`} className="mb-3 prose-custom">
                                    <ProcessMarkdown id={sa.hierarchyEntryId ? `hierarchy-${sa.hierarchyEntryId}-special-ability-${sa.abilityId}` : `special-ability-${sa.abilityId}`} markdown={combinedMarkdown} />
                                </div>
                            );
                        })}
                    </div>
                );
            })()}

            {/* Prepared Spells */}
            {(() => {
                if (!monster.spells || monster.spells.length === 0) return null;

                const preparedSpells = monster.spells.filter(s => s.spellType === MonsterSpellTypeId.Prepared);
                if (preparedSpells.length === 0) return null;

                // Group spells by level
                const spellsByLevel: Record<number, typeof preparedSpells> = {};
                preparedSpells.forEach(spell => {
                    if (spell.level !== null && spell.level !== undefined) {
                        if (!spellsByLevel[spell.level]) {
                            spellsByLevel[spell.level] = [];
                        }
                        spellsByLevel[spell.level].push(spell);
                    }
                });

                // Format spell slots
                const spellSlots = monster.preparedSpellSlots
                    ?.sort((a, b) => a.spellLevel - b.spellLevel)
                    .map(s => s.numSlots)
                    .join('/') || '';

                // Get save DC (use first spell's saveDC if available)
                const saveDC = preparedSpells.find(s => s.saveDC)?.saveDC;

                const levelKeys = Object.keys(spellsByLevel).map(level => parseInt(level)).sort((a, b) => a - b);

                return (
                    <div className="mb-4">
                        <div className="prose-custom">
                            <strong>Typical Wizard Spells Prepared</strong>
                            {spellSlots && (
                                <span> ({spellSlots}{saveDC ? `; save DC ${saveDC} + spell level` : ''})</span>
                            )}
                            {': '}
                            {levelKeys.map((level, levelIdx) => {
                                const levelSpells = spellsByLevel[level];
                                const levelLabel = level === 0 ? '0' : level === 1 ? '1st' : level === 2 ? '2nd' : level === 3 ? '3rd' : `${level}th`;

                                return (
                                    <span key={level}>
                                        {levelLabel}- {levelSpells.map((spell, idx) => {
                                            const spellName = (spellNames[spell.spellId] || `Loading...`).toLowerCase();
                                            const quantity = spell.quantity && spell.quantity > 1 ? ` (${spell.quantity})` : '';
                                            const notes = spell.notes ? ` (${spell.notes})` : '';

                                            return (
                                                <React.Fragment key={spell.id}>
                                                    {idx > 0 && ', '}
                                                    <EntityLink
                                                        entityType="spell"
                                                        entityId={spell.spellId}
                                                        href={`/spells/${spell.spellId}`}
                                                        className="entity-link"
                                                    >
                                                        {spellName}
                                                    </EntityLink>
                                                    {quantity}
                                                    {notes}
                                                </React.Fragment>
                                            );
                                        })}
                                        {levelIdx < levelKeys.length - 1 && '; '}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                );
            })()}

            {/* Extra Descriptions - Show all parent extra descriptions then current, each in its own collapsible section */}
            {(() => {
                // Collect all extra descriptions from hierarchy and current monster
                const allExtraDescriptions: Array<{ id: number; type: number; description: string; hierarchyEntryId?: number }> = [];

                // Add hierarchy extra descriptions
                if (monster.hierarchyData) {
                    monster.hierarchyData.forEach((hierarchyEntry) => {
                        if (hierarchyEntry.extraDescriptions) {
                            hierarchyEntry.extraDescriptions.forEach((extra) => {
                                if (extra.description) {
                                    allExtraDescriptions.push({ id: extra.id, type: extra.type, description: extra.description, hierarchyEntryId: hierarchyEntry.id });
                                }
                            });
                        }
                    });
                }

                // Add current monster extra descriptions
                if (monster.extraDescriptions) {
                    monster.extraDescriptions.forEach((extra) => {
                        if (extra.description) {
                            allExtraDescriptions.push({ id: extra.id, type: extra.type, description: extra.description });
                        }
                    });
                }

                if (allExtraDescriptions.length === 0) return null;

                return (
                    <div className="mb-4">
                        {allExtraDescriptions.map((extra) => {
                            const extraKey = extra.hierarchyEntryId ? `hierarchy-${extra.hierarchyEntryId}-extra-${extra.id}` : `extra-${extra.id}`;
                            const isExpanded = expandedExtraTypes.has(extra.id);
                            const toggleExpanded = () => {
                                setExpandedExtraTypes(prev => {
                                    const next = new Set(prev);
                                    if (next.has(extra.id)) {
                                        next.delete(extra.id);
                                    } else {
                                        next.add(extra.id);
                                    }
                                    return next;
                                });
                            };

                            // Extract title from markdown (format: "### Title\n\ncontent")
                            let title = '';
                            let contentWithoutTitle = extra.description;
                            if (extra.description) {
                                const lines = extra.description.split('\n');
                                const firstLine = lines[0] || '';
                                if (firstLine.startsWith('### ')) {
                                    title = firstLine.substring(4).trim();
                                    // Remove the title line and the following empty line if present
                                    contentWithoutTitle = lines.slice(1).join('\n').replace(/^\n+/, '');
                                }
                            }

                            return (
                                <CollapsibleSection
                                    key={extraKey}
                                    title={title}
                                    isExpanded={isExpanded}
                                    onToggle={toggleExpanded}
                                    showTitleWhenCollapsed={true}
                                >
                                    <div className="prose-custom">
                                        <ProcessMarkdown id={extraKey} markdown={contentWithoutTitle} />
                                    </div>
                                </CollapsibleSection>
                            );
                        })}
                    </div>
                );
            })()}
        </>
    );
}
