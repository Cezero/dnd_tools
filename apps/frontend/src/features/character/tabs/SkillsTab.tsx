import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';

import { CustomSelect } from '@/components/forms/FormComponents';
import { AnalogSkillService } from '@/features/character';
import type { SkillRank, TabComponentProps } from '@/features/character/types';
import { CharacterEditStateUpdateType } from '@/features/character/types';
import { ClassQueryHooks } from '@/features/class/ClassQueryHooks';
import { extractClassMechanics } from '@/lib/feature-extraction/classMechanicsExtractor';
import { buildFormulaParams } from '@/lib/formatters/formula-utils';
import type { FormattedSkill } from '@/lib/formatters/types';
import { hasSubtypes, usesCustomSubtype, hasNoMaxRanks, getSkillSubtypes, getSkillSubtypeName as getSkillSubtypeNameUtil } from '@/lib/skill-utils';
import { useCacheFunctions } from '@/services/cache';
import type { FeatureWithRelations } from '@shared/schema';
import {
    ABILITY_MAP,
    GetAbilityModifier,
    GetAbilityModifierString,
    AbilityId,
    EntityType,
    EntityAppliesToType,
    FORMULA_MAP,
    FeatureSourceType,
    DisplayType
} from '@shared/static-data';

/**
 * Skills tab component for managing character skill ranks.
 * 
 * **Sync Pattern**: This tab follows the standardized state → useEffect → updateValue pattern.
 * - Updates state via `updateState()` when skill ranks change
 * - CharacterEdit automatically syncs changes to resolution session via useEffect hooks using `updateValue()`
 * - Do NOT call `resolution.updateValue()` directly from this tab
 * 
 * @see CharacterEdit component for sync pattern documentation
 */
export function SkillsTab({
    state,
    updateState,
    resolvedData,
    isLoading: _isLoading,
    formattedCharacter,
    sharedData,
    handleSkillRankUpdate: _handleSkillRankUpdate
}: TabComponentProps): React.JSX.Element {
    const queryClient = useQueryClient();
    const { getClassNameFromCache, getRaceNameFromCache, getSkillSummaryById, getSkillSelectFull } = useCacheFunctions();

    // Use shared data instead of fetching
    const classDetails = useMemo(() => ({
        primary: sharedData.primaryClass || undefined,
        secondary: sharedData.secondaryClass || undefined
    }), [sharedData.primaryClass, sharedData.secondaryClass]);
    const raceDetails = sharedData.race;

    // Fetch class features (resolves featureIds) for skill points and formula display
    const { data: primaryClassFeatures = [] } = useQuery({
        queryKey: ClassQueryHooks.getClassFeaturesQueryKey(state.classId!),
        queryFn: () => ClassQueryHooks.getClassFeatures(state.classId!),
        enabled: !!state.classId && !!classDetails.primary,
    });
    const { data: secondaryClassFeatures = [] } = useQuery({
        queryKey: ClassQueryHooks.getClassFeaturesQueryKey(state.secondaryClassId!),
        queryFn: () => ClassQueryHooks.getClassFeatures(state.secondaryClassId!),
        enabled: !!state.secondaryClassId && !!classDetails.secondary,
    });

    // Extract data from centralized state
    const { skillRanks, abilityScores, level } = state;
    const { classSkills } = resolvedData;
    const isNewCharacter = level === 1; // If level is 1, we're creating a new character

    // Use formatted character skills from display strategy (includes breakdown and all bonuses)
    const formattedSkills = formattedCharacter?.skills || [];

    // Check if a skill is a class skill using formatted character data
    const isSkillClassSkill = useCallback((skillId: number, skillSubId?: number | null): boolean => {
        // Use formatted character data which has correctly calculated class skill status
        const formattedSkill = formattedSkills.find(skill =>
            skill.skillId === skillId &&
            (skill.skillSubId === skillSubId || (skill.skillSubId === null && skillSubId === null))
        );
        if (formattedSkill) {
            return formattedSkill.isClassSkill;
        }

        // Fallback to resolvedData.classSkills if formatted character doesn't have the skill
        return classSkills.some(skill =>
            skill.skillId === skillId &&
            (skill.skillSubId === skillSubId || skill.skillSubId === null)
        );
    }, [formattedSkills, classSkills]);

    // Get ability score
    const getAbilityScore = useCallback((abilityId: number): number => {
        const abilityScore = abilityScores.find(attr => attr.abilityId === abilityId);
        return abilityScore?.value ?? 10; // Default to 10 if not set
    }, [abilityScores]);

    // Get actual points spent for a skill (for internal calculations)
    const getSkillPointsSpent = (skillId: number, skillSubId?: number | null, customSubtype?: string | null): number => {
        const skillEntry = skillRanks.find(skill =>
            skill.skillId === skillId &&
            skill.skillSubId === skillSubId &&
            skill.customSubtype === customSubtype
        );
        return skillEntry?.pointsSpent || 0;
    };

    // Get skill ranks from formatted character (for display)
    const getSkillRanks = (skillId: number, skillSubId?: number | null, customSubtype?: string | null): number => {
        // Use formatted character data which has correctly calculated ranks
        const formattedSkill = getFormattedSkill(skillId, skillSubId || null, customSubtype || null);
        if (formattedSkill) {
            // Parse the ranks string (e.g., "4" -> 4, "2.5" -> 2.5)
            const ranksStr = formattedSkill.ranks.trim();
            if (ranksStr === '' || ranksStr === '-') return 0;
            const parsed = parseFloat(ranksStr);
            return isNaN(parsed) ? 0 : parsed;
        }

        // Fallback to manual calculation if not found in formatted character
        // (shouldn't happen, but keep for safety)
        const pointsSpent = getSkillPointsSpent(skillId, skillSubId, customSubtype);

        // For Craft/Knowledge skills without subtype, we can't determine class skill status yet
        // So just return the points spent as ranks (user will need to select subtype to get proper calculation)
        if (skillNeedsCustomSubtype(skillId) && !skillSubId && !customSubtype) {
            return pointsSpent; // Show raw points as ranks until subtype is selected
        }

        // Check if this is a class skill
        const isClassSkill = isSkillClassSkill(skillId, skillSubId);

        if (isClassSkill) {
            // Class skills: 1 point = 1 rank
            return pointsSpent;
        } else {
            // Cross-class skills: 2 points = 1 rank
            return pointsSpent * 0.5;
        }
    };

    // Get skill subtype name for display
    const getSkillSubtypeName = (skillId: number, skillSubId?: number | null, customSubtype?: string | null): string => {
        if (hasSubtypes(skillId) && skillSubId !== null && skillSubId !== undefined) {
            return getSkillSubtypeNameUtil(skillId, skillSubId);
        }
        if (usesCustomSubtype(skillId) && customSubtype && customSubtype !== '__placeholder__') {
            return customSubtype;
        }
        return '';
    };

    // Check if a skill needs custom subtypes
    const skillNeedsCustomSubtype = useCallback((skillId: number): boolean => {
        return hasSubtypes(skillId) || usesCustomSubtype(skillId);
    }, []);

    // Get all skill entries for a skill (including subtypes)
    const getSkillEntries = (skillId: number) => {
        return skillRanks.filter(skill => skill.skillId === skillId);
    };

    // Get source name from a feature feature
    const getProgressionSourceName = (feature: FeatureWithRelations): string => {
        // Check classes array for class features
        if (feature.classes && feature.classes.length > 0) {
            const firstClassId = feature.classes[0].classId;
            const className = sharedData.classDetailsMap.get(firstClassId)?.name || getClassNameFromCache(firstClassId);
            if (className) {
                return className;
            }
        }
        // Check races array for race features
        if (feature.races && feature.races.length > 0) {
            const firstRaceId = feature.races[0].raceId;
            if (state.raceId === firstRaceId) {
                const raceName = raceDetails?.name || (state.raceId ? getRaceNameFromCache(state.raceId) : undefined);
                if (raceName) {
                    return raceName;
                }
            }
        }
        // Fallback to source type name
        if (feature.sourceType === FeatureSourceType.Race) {
            return raceDetails?.name || (state.raceId ? getRaceNameFromCache(state.raceId) || 'Race' : 'Race');
        }
        if (feature.sourceType === FeatureSourceType.Class) {
            if (feature.classes && feature.classes.length > 0) {
                const firstClassId = feature.classes[0].classId;
                return sharedData.classDetailsMap.get(firstClassId)?.name || getClassNameFromCache(firstClassId) || 'Class';
            }
            return 'Class';
        }
        return 'Unknown Source';
    };

    // Calculate bonus skill points from feature features
    const getBonusSkillPoints = useMemo(() => {
        const bonusPoints: Array<{ source: string; value: number }> = [];

        for (const feature of resolvedData.features) {
            if (!feature.entities) continue;

            for (const entity of feature.entities) {
                // Check if this is a Choice entity for SkillPoints
                if (entity.type === EntityType.Choice && entity.appliesTo === EntityAppliesToType.SkillPoints) {
                    let value = 0;

                    if (entity.formulaParams) {
                        // Calculate value using formula
                        const formulaDef = FORMULA_MAP[entity.formulaParams.formulaId];
                        if (formulaDef) {
                            const mockCharacter = {
                                abilityScores: abilityScores.reduce((acc, score) => {
                                    acc[score.abilityId] = score.value;
                                    return acc;
                                }, {} as Record<number, number>),
                                classLevels: {} // Not needed for STATIC_EVERY_N_LEVELS
                            };
                            const mockContext = {
                                character: mockCharacter,
                                displayType: DisplayType.Edit,
                                currentLevel: level,
                                showBreakdown: false
                            };
                            const params = buildFormulaParams(
                                entity.formulaParams,
                                level,
                                feature.level,
                                mockContext,
                                entity.value || 0
                            );
                            const calculatedValue = formulaDef.calculate(params);
                            if (calculatedValue !== null && calculatedValue !== 0) {
                                value = calculatedValue;
                            }
                        }
                    } else if (entity.value) {
                        // Static value
                        value = entity.value;
                    }

                    if (value > 0) {
                        const sourceName = getProgressionSourceName(feature);
                        bonusPoints.push({ source: sourceName, value });
                    }
                }
            }
        }

        return bonusPoints;
    }, [resolvedData.features, level, abilityScores, raceDetails]);

    // Calculate total bonus skill points
    const totalBonusSkillPoints = useMemo(() => {
        return getBonusSkillPoints.reduce((sum, bonus) => sum + bonus.value, 0);
    }, [getBonusSkillPoints]);

    // Calculate skill points available
    const skillPointsAvailable = useMemo(() => {
        // If skillPointsAvailable is already set in state, use it
        if (state.skillPointsAvailable > 0) {
            return state.skillPointsAvailable;
        }

        // Calculate skill points based on class, Intelligence, and race
        const { classId, secondaryClassId, isGestalt, raceId } = state;

        // Get Intelligence modifier
        const intelligenceScore = getAbilityScore(AbilityId.Intelligence);
        const intelligenceModifier = GetAbilityModifier(intelligenceScore);

        // Get class skill points from feature features
        let classSkillPoints = 2; // Default for most classes

        if (classId) {
            if (isGestalt && secondaryClassId) {
                // For gestalt characters, use the higher of the two class skill points
                const primaryId = classDetails.primary ? (classDetails.primary as { id?: number }).id : undefined;
                const secondaryId = classDetails.secondary ? (classDetails.secondary as { id?: number }).id : undefined;
                const primaryMechanics = primaryClassFeatures.length > 0
                    ? extractClassMechanics(primaryClassFeatures, primaryId)
                    : { skillPoints: null };
                const secondaryMechanics = secondaryClassFeatures.length > 0
                    ? extractClassMechanics(secondaryClassFeatures, secondaryId)
                    : { skillPoints: null };
                const primarySkillPoints = primaryMechanics.skillPoints ?? 2;
                const secondarySkillPoints = secondaryMechanics.skillPoints ?? 2;
                classSkillPoints = Math.max(primarySkillPoints, secondarySkillPoints);
            } else {
                // For single class characters, use the primary class skill points
                const primaryId = classDetails.primary ? (classDetails.primary as { id?: number }).id : undefined;
                const primaryMechanics = primaryClassFeatures.length > 0
                    ? extractClassMechanics(primaryClassFeatures, primaryId)
                    : { skillPoints: null };
                classSkillPoints = primaryMechanics.skillPoints ?? 2;
            }
        }

        // Calculate total skill points
        let totalSkillPoints = 0;

        if (level === 1) {
            // 1st level: (class skill points + Intelligence modifier) × 4 + bonus skill points
            totalSkillPoints = (classSkillPoints + intelligenceModifier) * 4 + totalBonusSkillPoints;
        } else {
            // Additional levels: (class skill points + Intelligence modifier) × level + bonus skill points
            totalSkillPoints = (classSkillPoints + intelligenceModifier) * level + totalBonusSkillPoints;
        }

        // Ensure minimum of 1 skill point per level
        totalSkillPoints = Math.max(totalSkillPoints, level);

        return totalSkillPoints;
    }, [state, level, getAbilityScore, classDetails, totalBonusSkillPoints, primaryClassFeatures, secondaryClassFeatures]);

    // Calculate skill points spent
    const skillPointsSpent = useMemo(() => {
        let totalSpent = 0;

        skillRanks.forEach(skillEntry => {
            const pointsSpent = skillEntry.pointsSpent;

            // pointsSpent already represents the actual skill points spent
            totalSpent += pointsSpent;
        });

        return totalSpent;
    }, [skillRanks]);

    // Calculate remaining skill points
    const skillPointsRemaining = useMemo(() => {
        return skillPointsAvailable - skillPointsSpent;
    }, [skillPointsAvailable, skillPointsSpent]);

    // Get maximum ranks allowed for a skill
    const getMaxRanks = (skillId: number, skillSubId?: number | null): number => {
        // Skills with no max rank limit (e.g., Speak Language)
        if (hasNoMaxRanks(skillId)) {
            return Infinity;
        }

        // For skills with subtypes, check if the specific subtype is a class skill
        const isClassSkill = isSkillClassSkill(skillId, skillSubId);

        if (isClassSkill) {
            return state.maxClassSkillRanks;
        } else {
            return state.maxCrossClassSkillRanks;
        }
    };

    // Handle skill rank change
    const handleSkillChange = (skillId: number, newRanks: number, skillSubId?: number | null, customSubtype?: string | null, entryId?: string) => {
        const skill = getSkillSummaryById(skillId);
        if (!skill) return;

        const maxRanks = getMaxRanks(skillId, skillSubId);

        // Validate maximum ranks
        if (newRanks > maxRanks) {
            newRanks = maxRanks;
        }

        // Validate minimum ranks
        if (newRanks < 0) {
            newRanks = 0;
        }

        // For base entries (entryId === undefined), we should not update the base entry
        // Instead, we should create a new entry
        if (entryId === undefined && skillNeedsCustomSubtype(skillId) && newRanks > 0) {
            // This is a base entry with ranks - create a new entry
            const isClassSkill = isSkillClassSkill(skillId, skillSubId);
            const pointsNeeded = isClassSkill ? newRanks : newRanks * 2;

            // Check if we have enough skill points for custom skills too
            if (pointsNeeded > skillPointsRemaining) {
                return; // Don't create entry if not enough points
            }

            const newSkill: SkillRank = {
                skillId: skillId,
                skillSubId: skillSubId || null,
                customSubtype: customSubtype || null,
                pointsSpent: pointsNeeded
            };

            const updatedSkillRanks = [...skillRanks, newSkill];
            updateState({
                type: CharacterEditStateUpdateType.SET_SKILL_RANKS,
                payload: { skillRanks: updatedSkillRanks }
            });

            // Sync to backend resolution API happens automatically via CharacterEdit useEffect hook
            // No need to call handleSkillRankUpdate directly - just update state and sync happens automatically

            return; // Exit early since we've handled this case
        }

        // Calculate points needed using resolved features
        // Check if this is a class skill to determine the cost
        const isClassSkill = isSkillClassSkill(skillId, skillSubId);
        const pointsNeeded = isClassSkill ? newRanks : newRanks * 2;

        // Check if we have enough skill points
        const currentPointsSpent = getSkillPointsSpent(skillId, skillSubId, customSubtype);
        const costDifference = pointsNeeded - currentPointsSpent;

        if (costDifference > skillPointsRemaining) {
            return; // Don't update if not enough points
        }

        // Update the form state's skill ranks
        const updatedSkillRanks = [...skillRanks];
        let existingIndex = -1;

        if (entryId !== undefined) {
            // Find by matching criteria for existing entries
            existingIndex = updatedSkillRanks.findIndex(s =>
                s.skillId === skillId &&
                s.skillSubId === skillSubId &&
                s.customSubtype === customSubtype
            );
        } else {
            // Find by matching criteria for base entries
            existingIndex = updatedSkillRanks.findIndex(s =>
                s.skillId === skillId &&
                s.skillSubId === skillSubId &&
                s.customSubtype === customSubtype
            );
        }

        if (existingIndex >= 0) {
            if (newRanks === 0) {
                // Remove skill if ranks are 0
                updatedSkillRanks.splice(existingIndex, 1);
            } else {
                // Update existing skill
                updatedSkillRanks[existingIndex] = {
                    ...updatedSkillRanks[existingIndex],
                    pointsSpent: pointsNeeded
                };
            }
        } else if (newRanks > 0) {
            // Add new skill
            updatedSkillRanks.push({
                skillId: skillId,
                skillSubId: skillSubId || null,
                customSubtype: customSubtype || null,
                pointsSpent: pointsNeeded
            });
        }

        // Update the form state
        // Sync to backend resolution API happens automatically via CharacterEdit useEffect hook
        // No need to call handleSkillRankUpdate directly - just update state and sync happens automatically
        updateState({
            type: CharacterEditStateUpdateType.SET_SKILL_RANKS,
            payload: { skillRanks: updatedSkillRanks }
        });
    };

    // Handle skill increment/decrement
    const handleSkillIncrement = (skillId: number, increment: boolean, skillSubId?: number | null, customSubtype?: string | null, entryId?: string) => {
        const skill = getSkillSummaryById(skillId);
        if (!skill) return;

        const isClassSkill = isSkillClassSkill(skillId, skillSubId);
        const maxRanks = getMaxRanks(skillId, skillSubId);
        const step = isClassSkill ? 1.0 : 0.5;

        const currentValue = getSkillRanks(skillId, skillSubId, customSubtype);
        const newValue = increment
            ? Math.min(maxRanks, currentValue + step)
            : Math.max(0, currentValue - step);

        handleSkillChange(skillId, newValue, skillSubId, customSubtype, entryId);
    };

    // Get feature bonuses breakdown for a skill
    // Get formatted skill data from display strategy
    const getFormattedSkill = (skillId: number, skillSubId?: number | null, customSubtype?: string | null): FormattedSkill | null => {
        return formattedSkills.find(skill =>
            skill.skillId === skillId &&
            (skill.skillSubId === skillSubId || (skill.skillSubId === null && skillSubId === null)) &&
            (skill.customSubtype === customSubtype || (skill.customSubtype === null && customSubtype === null))
        ) || null;
    };

    // Get total skill bonus (ranks + ability modifier + feature bonuses) from formatted character
    const getSkillTotal = (skillId: number, skillSubId?: number | null, customSubtype?: string | null): number | null => {
        const skill = getSkillSummaryById(skillId);
        if (!skill) return 0;

        // Check if this is an analog skill
        if (AnalogSkillService.isAnalogSkill(skillId, queryClient)) {
            return null; // Analog skills are not supported in the new state model
        }

        // Special case: skills with abilityId 0 (like Speak Language) have no total
        if (skill.abilityId === 0) return null;

        // Get formatted skill from display strategy
        const formattedSkill = getFormattedSkill(skillId, skillSubId || null, customSubtype || null);
        if (!formattedSkill) {
            // Fallback to manual calculation if not found in formatted character
            const abilityScore = getAbilityScore(skill.abilityId);
            const abilityModifier = GetAbilityModifier(abilityScore);
            const ranks = getSkillRanks(skillId, skillSubId, customSubtype);
            return ranks + abilityModifier;
        }

        // Parse the formatted total (e.g., "+5" -> 5, "-2" -> -2)
        const totalStr = formattedSkill.total.trim();
        if (totalStr === '' || totalStr === '-') return null;
        const parsed = parseInt(totalStr.replace(/[^-\d]/g, ''), 10);
        return isNaN(parsed) ? null : parsed;
    };

    // Get misc bonus from formatted character breakdown
    const getMiscBonus = (skillId: number, skillSubId?: number | null, customSubtype?: string | null): number => {
        const formattedSkill = getFormattedSkill(skillId, skillSubId || null, customSubtype || null);
        if (!formattedSkill) return 0;

        // Parse the formatted misc bonus (e.g., "+3" -> 3, "-1" -> -1)
        const miscStr = formattedSkill.misc.trim();
        if (miscStr === '' || miscStr === '-') return 0;
        const parsed = parseInt(miscStr.replace(/[^-\d]/g, ''), 10);
        return isNaN(parsed) ? 0 : parsed;
    };

    // Get ability modifier string from formatted character
    const getAbilityModString = (skillId: number, skillSubId?: number | null, customSubtype?: string | null): string => {
        const formattedSkill = getFormattedSkill(skillId, skillSubId || null, customSubtype || null);
        if (formattedSkill) {
            return formattedSkill.abilityMod;
        }

        // Fallback to manual calculation
        const skill = getSkillSummaryById(skillId);
        if (!skill || skill.abilityId === 0) return '';
        const abilityScore = getAbilityScore(skill.abilityId);
        return `${ABILITY_MAP[skill.abilityId]?.abbreviation} ${GetAbilityModifierString(abilityScore)}`;
    };

    // Get breakdown components from formatted character
    const getBreakdownComponents = (skillId: number, skillSubId?: number | null, customSubtype?: string | null): Array<{ source: string; value: number }> => {
        const formattedSkill = getFormattedSkill(skillId, skillSubId || null, customSubtype || null);
        if (!formattedSkill || !formattedSkill.breakdown) return [];

        // Extract all breakdown components (they're already filtered to base type in the formatter)
        // Filter and convert: only include components with numeric values
        return formattedSkill.breakdown.components
            .filter(comp => typeof comp.value === 'number')
            .map(comp => ({
                source: comp.source,
                value: comp.value as number
            }));
    };

    // Format skill ranks display (handle half ranks)
    const _formatSkillRanks = (ranks: number): string => {
        if (ranks === Math.floor(ranks)) {
            return ranks.toString();
        }
        return ranks.toFixed(1);
    };

    // Get skills that can be allocated points (exclude analog skills)
    const getAllocatableSkills = () => {
        return getSkillSelectFull().filter(skill => !AnalogSkillService.isAnalogSkill(skill.id, queryClient));
    };

    // Generate skill rows for rendering (handles custom subtypes)
    const generateSkillRows = () => {
        const rows: Array<{ skillId: number; skillSubId?: number | null; customSubtype?: string | null; entryId?: string; key: string }> = [];

        getAllocatableSkills().forEach(skill => {
            if (skillNeedsCustomSubtype(skill.id)) {
                // For skills with custom subtypes, show existing entries first
                const skillEntries = getSkillEntries(skill.id);

                // Add a row for each existing entry
                skillEntries.forEach((entry, _index) => {
                    // Create a unique identifier based on the entry's data
                    const entryId = `${skill.id}-${entry.skillSubId || 'null'}-${entry.customSubtype || 'null'}-${entry.pointsSpent}`;

                    rows.push({
                        skillId: skill.id,
                        skillSubId: entry.skillSubId,
                        customSubtype: entry.customSubtype,
                        entryId: entryId,
                        key: `skill-${skill.id}-entry-${entryId}`
                    });
                });

                // Only show a base row if there are no existing entries with null subtype
                const hasBaseEntry = skillEntries.some(entry =>
                    entry.skillSubId === null && entry.customSubtype === null
                );

                if (!hasBaseEntry) {
                    rows.push({
                        skillId: skill.id,
                        skillSubId: null,
                        customSubtype: null,
                        entryId: undefined, // Base row has no entryId
                        key: `skill-${skill.id}-base`
                    });
                }
            } else {
                // For regular skills, show a single row
                rows.push({
                    skillId: skill.id,
                    skillSubId: null,
                    customSubtype: null,
                    entryId: undefined, // Regular skills have no entryId
                    key: `skill-${skill.id}`
                });
            }
        });

        return rows;
    };

    // Get analog skills for display
    const getAnalogSkills = () => {
        return []; // Analog skills are not supported in the new state model
    };

    // Generate the formula display for skill points calculation
    const getSkillPointsFormula = (): string => {
        const { classId, secondaryClassId, isGestalt, raceId } = state;

        // Check if we have the necessary data
        if (!classId || !classDetails.primary) return '';

        // Get Intelligence modifier
        const intelligenceScore = getAbilityScore(AbilityId.Intelligence);
        const intModifier = GetAbilityModifier(intelligenceScore);

        // Get class skill points from feature features (use primaryClassFeatures/secondaryClassFeatures from ClassQueryHooks.getClassFeatures)
        const primaryId = classDetails.primary ? (classDetails.primary as { id?: number }).id : undefined;
        const primaryMechanics = primaryClassFeatures.length > 0
            ? extractClassMechanics(primaryClassFeatures, primaryId)
            : { skillPoints: null };
        let classSkillPoints = primaryMechanics.skillPoints ?? 2;
        let className = classDetails.primary?.name || 'Unknown';

        // Handle gestalt characters
        if (isGestalt && secondaryClassId && classDetails.secondary) {
            const secondaryId = classDetails.secondary ? (classDetails.secondary as { id?: number }).id : undefined;
            const secondaryMechanics = secondaryClassFeatures.length > 0
                ? extractClassMechanics(secondaryClassFeatures, secondaryId)
                : { skillPoints: null };
            const primarySkillPoints = primaryMechanics.skillPoints ?? 2;
            const secondarySkillPoints = secondaryMechanics.skillPoints ?? 2;
            classSkillPoints = Math.max(primarySkillPoints, secondarySkillPoints);
            className = `${classDetails.primary?.name || 'Unknown'}/${classDetails.secondary.name}`;
        }

        // Build bonus skill points string
        const bonusParts: string[] = [];
        for (const bonus of getBonusSkillPoints) {
            bonusParts.push(`${bonus.source}: ${bonus.value}`);
        }
        const bonusStr = bonusParts.length > 0 ? bonusParts.join(' + ') + (isNewCharacter ? ' + (' : ' + ') : '';

        if (isNewCharacter) {
            const multiplierStr = '× 4';
            const closeParenthesis = bonusParts.length > 0 ? ')' : '';
            return `${bonusStr}(${className}: ${classSkillPoints} ${intModifier < 0 ? '-' : '+'} INT: ${intModifier}) ${multiplierStr}${closeParenthesis}`;
        } else {
            return `${bonusStr}(${className}: ${classSkillPoints} ${intModifier < 0 ? '-' : '+'} INT: ${intModifier})`;
        }
    };

    // SkillRow component for skills with custom subtypes
    const SkillRow = ({ skillId, skillSubId, customSubtype, entryId, _isBaseRow = false }: {
        skillId: number;
        skillSubId?: number | null;
        customSubtype?: string | null;
        entryId?: string;
        _isBaseRow?: boolean;
    }) => {
        // State for subtype editing - must be at the top
        const [editingSubtype, setEditingSubtype] = useState(false);
        const [editValue, setEditValue] = useState('');
        const [inputPosition, setInputPosition] = useState({ x: 0, y: 0, width: 0 });
        const [showSubtypeSelect, setShowSubtypeSelect] = useState(false);
        const inputRef = useRef<HTMLInputElement>(null);
        const skillNameRef = useRef<HTMLDivElement>(null);

        // Local state for rank input value while editing - initialize with current ranks
        const [localRankValue, setLocalRankValue] = useState<string>(() => {
            return getSkillRanks(skillId, skillSubId, customSubtype).toString();
        });
        const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

        // Update local value when ranks change externally (e.g., from chevron buttons)
        useEffect(() => {
            const newRanks = getSkillRanks(skillId, skillSubId, customSubtype);
            setLocalRankValue(newRanks.toString());
        }, [skillId, skillSubId, customSubtype]);

        // Focus input when editing starts
        React.useEffect(() => {
            if (editingSubtype && inputRef.current) {
                inputRef.current.focus();
            }
        }, [editingSubtype]);

        // Handle escape key and click outside for subtype selector
        React.useEffect(() => {
            const handleEscapeKey = (event: KeyboardEvent) => {
                if (event.key === 'Escape' && showSubtypeSelect) {
                    setShowSubtypeSelect(false);
                }
            };

            const handleClickOutside = (event: MouseEvent) => {
                if (showSubtypeSelect && skillNameRef.current) {
                    const target = event.target as Element;
                    const isClickInside = skillNameRef.current.contains(target);
                    const isClickOnSelector = target.closest('[data-subtype-selector]');

                    if (!isClickInside && !isClickOnSelector) {
                        setShowSubtypeSelect(false);
                    }
                }
            };

            if (showSubtypeSelect) {
                document.addEventListener('keydown', handleEscapeKey);
                document.addEventListener('mousedown', handleClickOutside);
            }

            return () => {
                document.removeEventListener('keydown', handleEscapeKey);
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, [showSubtypeSelect]);

        // Apply rank change (called on blur, enter, or after debounce)
        const applyRankChange = useCallback((value: string) => {
            const numValue = parseFloat(value) || 0;
            handleSkillChange(skillId, numValue, skillSubId, customSubtype, entryId);
        }, [skillId, skillSubId, customSubtype, entryId]);

        // Handle input change with debouncing
        const handleRankInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setLocalRankValue(value);

            // Clear existing timeout
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }

            // Set new timeout to apply change after 500ms of inactivity
            debounceTimeoutRef.current = setTimeout(() => {
                applyRankChange(value);
            }, 500);
        }, [applyRankChange]);

        // Handle blur - apply change immediately
        const handleRankInputBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
            // Clear timeout since we're applying immediately
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
                debounceTimeoutRef.current = null;
            }
            applyRankChange(e.target.value);
        }, [applyRankChange]);

        // Handle Enter key - apply change immediately
        const handleRankInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                // Clear timeout since we're applying immediately
                if (debounceTimeoutRef.current) {
                    clearTimeout(debounceTimeoutRef.current);
                    debounceTimeoutRef.current = null;
                }
                applyRankChange(e.currentTarget.value);
                e.currentTarget.blur();
            }
        }, [applyRankChange]);

        // Cleanup timeout on unmount
        useEffect(() => {
            return () => {
                if (debounceTimeoutRef.current) {
                    clearTimeout(debounceTimeoutRef.current);
                }
            };
        }, []);

        const skill = getSkillSummaryById(skillId);
        if (!skill) return <></>;

        const isAnalogSkill = AnalogSkillService.isAnalogSkill(skillId, queryClient);
        const formattedSkill = getFormattedSkill(skillId, skillSubId || null, customSubtype || null);
        // Use isClassSkill from formatted character if available, otherwise fallback to manual check
        const isClassSkill = formattedSkill?.isClassSkill ?? isSkillClassSkill(skillId, skillSubId);
        const maxRanks = getMaxRanks(skillId, skillSubId);
        const ranks = getSkillRanks(skillId, skillSubId, customSubtype);
        const total = getSkillTotal(skillId, skillSubId, customSubtype);
        const miscBonus = getMiscBonus(skillId, skillSubId, customSubtype);
        const breakdownComponents = getBreakdownComponents(skillId, skillSubId, customSubtype);

        // Get skill name with subtype - always build it to ensure subtypes are displayed correctly
        // This preserves the special display logic for placeholder and missing subtypes
        const skillName = getSkillSubtypeName(skillId, skillSubId, customSubtype);
        let displayName = skill.name;

        if (skillName) {
            displayName = `${skill.name} (${skillName})`;
        } else if (customSubtype === '__placeholder__') {
            // For placeholder custom subtypes, show (-) to indicate it needs editing
            displayName = `${skill.name} (-)`;
        } else if (skillNeedsCustomSubtype(skillId) && ranks > 0 && !skillSubId && !customSubtype) {
            // For Craft/Knowledge skills with ranks but no subtype, show () to indicate subtype needed
            displayName = `${skill.name} ()`;
        }

        // Handle subtype editing for Perform/Profession skills (text input)
        const handleSubtypeClick = () => {
            if (!skillNeedsCustomSubtype(skillId) || !skillNameRef.current) return;

            // Show text input for Perform/Profession skills (custom subtypes)
            if (usesCustomSubtype(skillId)) {
                // Calculate position of the skill name element
                const rect = skillNameRef.current.getBoundingClientRect();
                setInputPosition({
                    x: rect.left,
                    y: rect.top,
                    width: rect.width
                });

                setEditingSubtype(true);
                // If it's a placeholder, show empty string in input, otherwise show the actual value
                setEditValue(customSubtype === '__placeholder__' ? '' : (customSubtype || ''));
            } else if (hasSubtypes(skillId)) {
                // Show CustomSelect for Craft/Knowledge skills
                const rect = skillNameRef.current.getBoundingClientRect();
                setInputPosition({
                    x: rect.left,
                    y: rect.top,
                    width: rect.width
                });
                setShowSubtypeSelect(true);
            }
        };

        const handleSubtypeSave = () => {
            if (!skillNeedsCustomSubtype(skillId)) return;

            // If the user didn't enter anything and it was a placeholder, keep it as placeholder
            const finalValue = editValue.trim() === '' && customSubtype === '__placeholder__'
                ? '__placeholder__'
                : editValue.trim();

            // If we're editing an existing entry, update it rather than create a new one
            if (customSubtype !== null && ranks > 0) {
                // Update the existing entry with the new custom subtype
                const updatedSkillRanks = [...skillRanks];
                const existingIndex = updatedSkillRanks.findIndex(s =>
                    s.skillId === skillId &&
                    s.skillSubId === skillSubId &&
                    s.customSubtype === customSubtype
                );

                if (existingIndex >= 0) {
                    // Update the existing entry with the new custom subtype
                    updatedSkillRanks[existingIndex] = {
                        ...updatedSkillRanks[existingIndex],
                        customSubtype: finalValue
                    };

                    // Update the form state
                    updateState({
                        type: CharacterEditStateUpdateType.SET_SKILL_RANKS,
                        payload: { skillRanks: updatedSkillRanks }
                    });
                }
            } else {
                // For new entries or base rows, use the normal flow
                handleSkillChange(skillId, ranks, skillSubId, finalValue);
            }
            setEditingSubtype(false);
            setEditValue('');
        };

        const handleSubtypeCancel = () => {
            setEditingSubtype(false);
            setEditValue('');
        };

        // Handle Craft/Knowledge subtype selection
        const handleSubtypeSelect = (selectedId: number) => {
            // If we're editing an existing entry (has ranks), update it with the new subtype
            if (ranks > 0) {
                // Update the existing entry with the new subtype
                const updatedSkillRanks = [...skillRanks];
                let existingIndex = -1;

                if (entryId !== undefined) {
                    // Find by matching criteria for existing entries
                    existingIndex = updatedSkillRanks.findIndex(s =>
                        s.skillId === skillId &&
                        s.skillSubId === skillSubId &&
                        s.customSubtype === customSubtype
                    );
                } else {
                    // Find by matching criteria for base entries
                    existingIndex = updatedSkillRanks.findIndex(s =>
                        s.skillId === skillId &&
                        s.skillSubId === skillSubId &&
                        s.customSubtype === customSubtype
                    );
                }

                if (existingIndex >= 0) {
                    // Update the existing entry with the new subtype
                    updatedSkillRanks[existingIndex] = {
                        ...updatedSkillRanks[existingIndex],
                        skillSubId: selectedId
                    };

                    // Update the form state
                    updateState({
                        type: CharacterEditStateUpdateType.SET_SKILL_RANKS,
                        payload: { skillRanks: updatedSkillRanks }
                    });
                }
            } else {
                // For base rows (no ranks), create a new skill entry with the selected subtype
                const newSkill: SkillRank = {
                    skillId: skillId,
                    skillSubId: selectedId,
                    customSubtype: null,
                    pointsSpent: 0 // Start with 0 points spent
                };

                const updatedSkillRanks = [...skillRanks, newSkill];
                updateState({
                    type: CharacterEditStateUpdateType.SET_SKILL_RANKS,
                    payload: { skillRanks: updatedSkillRanks }
                });
            }
            setShowSubtypeSelect(false);
        };


        // Get subtype options for Craft/Knowledge skills
        const getSubtypeOptions = () => {
            if (hasSubtypes(skillId)) {
                const subtypes = getSkillSubtypes(skillId);
                return subtypes.map(subtype => {
                    const isClassSkill = isSkillClassSkill(skillId, subtype.id);
                    return {
                        id: subtype.id,
                        name: `${subtype.name}${isClassSkill ? ' (c)' : ''}`
                    };
                });
            }
            return [];
        };

        return (
            <>
                <div
                    className={`grid grid-cols-[2fr_1fr_.65fr_.6fr_.75fr] gap-2 px-3 py-2 items-center border-b border-gray-200 dark:border-gray-700 ${isAnalogSkill
                        ? 'bg-purple-100 dark:bg-purple-900/30'
                        : isClassSkill
                            ? 'bg-blue-100 dark:bg-blue-900/30'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                >
                    <div className="flex items-center">
                        <div
                            ref={skillNameRef}
                            onClick={skillNeedsCustomSubtype(skillId) ? handleSubtypeClick : undefined}
                            className={`text-sm font-medium ${skillNeedsCustomSubtype(skillId) ? 'hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer' : ''}`}
                            title={skillNeedsCustomSubtype(skillId) ? 'Click to modify subtype' : undefined}
                        >
                            {displayName}
                        </div>
                        {isAnalogSkill && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200">
                                A
                            </span>
                        )}
                        {isClassSkill && !isAnalogSkill && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                                C
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-[44px_10px]">
                        {isAnalogSkill ? (
                            <div className="w-12 py-1 text-sm border rounded text-center bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400">
                                -
                            </div>
                        ) : (
                            <>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    max={maxRanks}
                                    value={localRankValue}
                                    onChange={handleRankInputChange}
                                    onBlur={handleRankInputBlur}
                                    onKeyDown={handleRankInputKeyDown}
                                    className={`w-12 py-1 text-sm border rounded text-center bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isClassSkill
                                        ? 'border-blue-300 dark:border-blue-600'
                                        : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                />
                                <div className="flex flex-col justify-center gap-0.5">
                                    <button
                                        type="button"
                                        className="w-3 h-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white text-xs flex items-center justify-center rounded-t"
                                        onClick={() => handleSkillIncrement(skillId, true, skillSubId, customSubtype, entryId)}
                                    >
                                        <ChevronUpIcon className="h-2 w-2" />
                                    </button>
                                    <button
                                        type="button"
                                        className="w-3 h-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white text-xs flex items-center justify-center rounded-b"
                                        onClick={() => handleSkillIncrement(skillId, false, skillSubId, customSubtype, entryId)}
                                    >
                                        <ChevronDownIcon className="h-2 w-2" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="text-xs">
                        {getAbilityModString(skillId, skillSubId, customSubtype)}
                    </div>
                    <div className="text-xs text-center">
                        {miscBonus !== 0 ? (
                            <div
                                className="cursor-help"
                                title={breakdownComponents
                                    .filter(comp => comp.source === 'Misc Bonus')
                                    .map(comp => `${comp.source}: ${comp.value >= 0 ? '+' : ''}${comp.value}`)
                                    .join(', ')}
                            >
                                <span className={miscBonus > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                    {miscBonus >= 0 ? `+${miscBonus}` : miscBonus.toString()}
                                </span>
                            </div>
                        ) : (
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                    </div>
                    <div
                        className={`w-12 text-sm font-medium rounded px-2 py-1 text-center cursor-help ${total === null ? '' : 'border border-gray-300 dark:border-gray-600'}`}
                        title={total !== null ? (() => {
                            const breakdown = breakdownComponents.map(comp =>
                                `${comp.source}: ${comp.value >= 0 ? '+' : ''}${comp.value}`
                            );
                            return `${breakdown.join(', ')} = ${total >= 0 ? '+' : ''}${total}`;
                        })() : ''}
                    >
                        {total === null ? '' : (
                            <span className={total > 0 ? 'text-green-600 dark:text-green-400' : total < 0 ? 'text-red-600 dark:text-red-400' : ''}>
                                {total >= 0 ? `+${total}` : total.toString()}
                            </span>
                        )}
                    </div>
                </div>

                {/* Floating input for subtype editing (Perform/Profession) */}
                {editingSubtype && (
                    <div
                        className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg"
                        style={{
                            left: inputPosition.x,
                            top: inputPosition.y,
                            width: inputPosition.width,
                            minWidth: '200px'
                        }}
                    >
                        <div className="flex items-center relative p-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSubtypeSave();
                                    } else if (e.key === 'Escape') {
                                        handleSubtypeCancel();
                                    }
                                }}
                                onBlur={handleSubtypeSave}
                                placeholder="Enter subtype name..."
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                )}

                {/* Floating CustomSelect for Craft/Knowledge subtype selection */}
                {showSubtypeSelect && (
                    <div
                        data-subtype-selector
                        className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg"
                        style={{
                            left: inputPosition.x,
                            top: inputPosition.y,
                            width: inputPosition.width,
                            minWidth: '200px'
                        }}
                    >
                        <div className="p-2">
                            <CustomSelect
                                value={skillSubId || 0}
                                onValueChange={handleSubtypeSelect}
                                options={getSubtypeOptions()}
                                placeholder="Select subtype..."
                                componentExtraClassName="w-full"
                            />
                        </div>
                    </div>
                )}
            </>
        );
    };

    // Generate column headers
    const generateColumnHeaders = () => (
        <div className="grid grid-cols-[2fr_1fr_.65fr_.6fr_.75fr] gap-2 px-3 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Skill Name
            </div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Ranks
            </div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Ability
            </div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Mod
            </div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Total
            </div>
        </div>
    );

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
                Skills {!isNewCharacter && `(Level ${level})`}
            </h2>

            {/* Skills Table */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-2">
                <div>
                    {/* Skill Points and Rules Summary */}
                    <div className="p-2">
                        {/* Points and Max Ranks Row */}
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Spent:</span>
                                    <div className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 font-medium">
                                        {skillPointsSpent}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Remaining:</span>
                                    <div className={`px-3 py-1 border rounded font-medium ${skillPointsRemaining < 0
                                        ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                                        }`}>
                                        {skillPointsRemaining}
                                    </div>
                                </div>
                            </div>

                            {/* Skill Points Breakdown */}
                            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                                <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Skill Points Formula:</div>
                                <div className="text-gray-600 dark:text-gray-400">
                                    {getSkillPointsFormula()}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Class Skills Max Ranks:</span>
                                    <div className="px-3 py-1 border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-700 font-medium">
                                        {state.maxClassSkillRanks}
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">(1 pt./rank)</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Cross-class Skills Max Ranks:</span>
                                    <div className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 font-medium">
                                        {state.maxCrossClassSkillRanks}
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">(2 pts./rank, half-ranks allowed)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Skills Tables - Responsive Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {(() => {
                            const skillRows = generateSkillRows();
                            const rowsPerColumn = Math.ceil(skillRows.length / 3);

                            return (
                                <>
                                    {/* First Column */}
                                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                        {generateColumnHeaders()}
                                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {skillRows.slice(0, rowsPerColumn).map(row => (
                                                <SkillRow
                                                    key={row.key}
                                                    skillId={row.skillId}
                                                    skillSubId={row.skillSubId}
                                                    customSubtype={row.customSubtype}
                                                    entryId={row.entryId}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Second Column */}
                                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                        {generateColumnHeaders()}
                                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {skillRows.slice(rowsPerColumn, rowsPerColumn * 2).map(row => (
                                                <SkillRow
                                                    key={row.key}
                                                    skillId={row.skillId}
                                                    skillSubId={row.skillSubId}
                                                    customSubtype={row.customSubtype}
                                                    entryId={row.entryId}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Third Column */}
                                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden md:col-span-2 xl:col-span-1">
                                        {generateColumnHeaders()}
                                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {skillRows.slice(rowsPerColumn * 2).map(row => (
                                                <SkillRow
                                                    key={row.key}
                                                    skillId={row.skillId}
                                                    skillSubId={row.skillSubId}
                                                    customSubtype={row.customSubtype}
                                                    entryId={row.entryId}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>

                    {/* Analog Skills Section */}
                    {getAnalogSkills().length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-3 text-purple-800 dark:text-purple-200">
                                Feature-Linked Skills
                            </h3>
                            <div className="bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-lg overflow-hidden">
                                {generateColumnHeaders()}
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {getAnalogSkills().map(analogSkill => (
                                        <SkillRow
                                            key={analogSkill.skillId}
                                            skillId={analogSkill.skillId}
                                            skillSubId={null}
                                            customSubtype={null}
                                            entryId={undefined}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
