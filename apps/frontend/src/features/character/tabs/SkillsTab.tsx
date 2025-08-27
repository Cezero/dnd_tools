import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import React, { useMemo, useCallback } from 'react';

import { AnalogSkillService } from '@/features/character/AnalogSkillService';
import type { RaceSummary, Race, DnDClass, CharacterWithAllDetailsResponse, CharacterAdvancementWithDetailsResponse } from '@shared/schema';
import {
    SKILL_LIST,
    ABILITY_MAP,
    GetAbilityModifier,
    GetAbilityModifierString
} from '@shared/static-data';

interface SkillsTabProps {
    character: CharacterWithAllDetailsResponse;
    onUpdate: (data: Partial<CharacterWithAllDetailsResponse>) => void;
    races?: RaceSummary[];
    selectedRaceDetails?: Race | null;
    selectedClassDetails?: DnDClass | null;
    targetAdvancement?: CharacterAdvancementWithDetailsResponse;
    onAdvancementUpdate?: (advancement: CharacterAdvancementWithDetailsResponse) => void;
}

export function SkillsTab({
    character,
    onUpdate,
    selectedRaceDetails,
    selectedClassDetails,
    targetAdvancement,
    onAdvancementUpdate
}: SkillsTabProps): React.JSX.Element {

    // Use target advancement if provided, otherwise use the first advancement (for new characters)
    const advancement = targetAdvancement || character.advancements[0];
    const isNewCharacter = !targetAdvancement; // If no target advancement, we're creating a new character

    // Check if a skill is a class skill
    const isSkillClassSkill = useCallback((skillId: number): boolean => {
        if (!advancement?.classId || !selectedClassDetails) return false;

        // Check if the skill is in the class's skill list
        return selectedClassDetails.skills?.some(classSkill => classSkill.skillId === skillId) || false;
    }, [advancement?.classId, selectedClassDetails]);

    // Get ability score
    const getAbilityScore = useCallback((abilityId: number): number => {
        const abilityScore = character.abilityScores.find(attr => attr.abilityId === abilityId);
        return abilityScore?.value ?? 10; // Default to 10 if not set
    }, [character.abilityScores]);

    // Get skill ranks from advancement
    const getSkillRanks = (skillId: number): number => {
        const skillEntry = advancement?.skills.find(skill => skill.skillId === skillId);
        return skillEntry?.pointsSpent || 0;
    };

    // Calculate skill points available
    const skillPointsAvailable = useMemo(() => {
        if (!advancement?.classId || !selectedClassDetails) return 0;

        // Get intelligence modifier - default to 10 if not set
        const intelligenceScore = getAbilityScore(4); // Intelligence is ability ID 4
        const intModifier = GetAbilityModifier(intelligenceScore);

        // For new characters (level 1), use the standard formula
        if (isNewCharacter) {
            // Base calculation: (class skill points + int modifier) * 4
            let basePoints = (selectedClassDetails.skillPoints + intModifier) * 4;

            // Minimum of 4 skill points even with negative intelligence
            basePoints = Math.max(4, basePoints);

            // Human bonus: +4 skill points at first level
            if (character.raceId && selectedRaceDetails?.name?.toLowerCase() === 'human') {
                basePoints += 4;
            }

            return basePoints;
        } else {
            // For leveling up, use the standard formula: (class skill points + int modifier)
            let basePoints = selectedClassDetails.skillPoints + intModifier;

            // Minimum of 1 skill point even with negative intelligence
            basePoints = Math.max(1, basePoints);

            // Human bonus: +1 skill point per level
            if (character.raceId && selectedRaceDetails?.name?.toLowerCase() === 'human') {
                basePoints += 1;
            }

            return basePoints;
        }
    }, [advancement?.classId, selectedClassDetails, character.raceId, selectedRaceDetails, isNewCharacter, getAbilityScore]);

    // Calculate skill points spent
    const skillPointsSpent = useMemo(() => {
        if (!advancement?.skills) return 0;

        let totalSpent = 0;

        advancement.skills.forEach(skillEntry => {
            const isClassSkill = isSkillClassSkill(skillEntry.skillId);
            const pointsSpent = skillEntry.pointsSpent;

            if (isClassSkill) {
                // Class skills cost 1 point per rank
                totalSpent += pointsSpent;
            } else {
                // Cross-class skills cost 2 points per rank
                totalSpent += pointsSpent * 2;
            }
        });

        return totalSpent;
    }, [advancement?.skills, isSkillClassSkill]);

    // Calculate remaining skill points
    const skillPointsRemaining = useMemo(() => {
        return skillPointsAvailable - skillPointsSpent;
    }, [skillPointsAvailable, skillPointsSpent]);

    // Get maximum ranks allowed for a skill
    const getMaxRanks = (skillId: number): number => {
        // Speak Language has no max rank limit
        if (skillId === 38) { // Speak Language skill ID
            return Infinity;
        }

        const isClassSkill = isSkillClassSkill(skillId);
        const characterLevel = character.advancements.length;

        if (isClassSkill) {
            return characterLevel + 3;
        } else {
            return Math.floor((characterLevel + 3) / 2);
        }
    };

    // Handle skill rank change
    const handleSkillChange = (skillId: number, newRanks: number) => {
        const skill = SKILL_LIST.find(s => s.id === skillId);
        if (!skill || !advancement) return;

        const maxRanks = getMaxRanks(skillId);

        // Validate maximum ranks
        if (newRanks > maxRanks) {
            newRanks = maxRanks;
        }

        // Validate minimum ranks
        if (newRanks < 0) {
            newRanks = 0;
        }

        // Calculate points needed
        const isClassSkill = isSkillClassSkill(skillId);
        const pointsNeeded = isClassSkill ? newRanks : newRanks * 2;

        // Check if we have enough skill points
        const currentPoints = getSkillRanks(skillId);
        const currentCost = isClassSkill ? currentPoints : currentPoints * 2;
        const costDifference = pointsNeeded - currentCost;

        if (costDifference > skillPointsRemaining) {
            return; // Don't update if not enough points
        }

        // Update the advancement's skills
        const updatedSkills = [...(advancement.skills || [])];
        const existingIndex = updatedSkills.findIndex(s => s.skillId === skillId);

        if (existingIndex >= 0) {
            if (newRanks === 0) {
                // Remove skill if ranks are 0
                updatedSkills.splice(existingIndex, 1);
            } else {
                // Update existing skill
                updatedSkills[existingIndex] = {
                    ...updatedSkills[existingIndex],
                    pointsSpent: newRanks
                };
            }
        } else if (newRanks > 0) {
            // Add new skill
            updatedSkills.push({
                advancementId: advancement.id,
                skillId: skillId,
                pointsSpent: newRanks
            });
        }

        // Update the advancement
        const updatedAdvancement = {
            ...advancement,
            skills: updatedSkills
        };

        if (onAdvancementUpdate) {
            // For leveling up, use the callback
            onAdvancementUpdate(updatedAdvancement);
        } else {
            // For new character creation, update the character
            onUpdate({
                advancements: [
                    updatedAdvancement
                ]
            });
        }
    };

    // Handle skill increment/decrement
    const handleSkillIncrement = (skillId: number, increment: boolean) => {
        const skill = SKILL_LIST.find(s => s.id === skillId);
        if (!skill) return;

        const isClassSkill = isSkillClassSkill(skillId);
        const maxRanks = getMaxRanks(skillId);
        const step = isClassSkill ? 1.0 : 0.5;

        const currentValue = getSkillRanks(skillId);
        const newValue = increment
            ? Math.min(maxRanks, currentValue + step)
            : Math.max(0, currentValue - step);

        handleSkillChange(skillId, newValue);
    };

    // Get ability modifier for a skill
    const getSkillAbilityModifier = (skillId: number): number | null => {
        const skill = SKILL_LIST.find(s => s.id === skillId);
        if (!skill) return null;

        // Special case: skills with abilityId 0 (like Speak Language) have no ability modifier
        if (skill.abilityId === 0) return null;

        const abilityScore = getAbilityScore(skill.abilityId);
        return GetAbilityModifier(abilityScore);
    };

    // Get total skill bonus (ranks + ability modifier)
    const getSkillTotal = (skillId: number): number | null => {
        const skill = SKILL_LIST.find(s => s.id === skillId);
        if (!skill) return 0;

        // Check if this is an analog skill
        if (AnalogSkillService.isAnalogSkill(skillId)) {
            return AnalogSkillService.calculateAnalogSkillTotal(character, skillId);
        }

        const ranks = getSkillRanks(skillId);
        const abilityModifier = getSkillAbilityModifier(skillId);

        // Special case: skills with abilityId 0 (like Speak Language) have no total
        if (skill.abilityId === 0) return null;

        return Math.floor(ranks) + (abilityModifier ?? 0);
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
        return SKILL_LIST.filter(skill => !AnalogSkillService.isAnalogSkill(skill.id));
    };

    // Get analog skills for display
    const getAnalogSkills = () => {
        return AnalogSkillService.getCharacterAnalogSkills(character);
    };

    // Generate the formula display for skill points calculation
    const getSkillPointsFormula = (): string => {
        if (!advancement?.classId || !selectedClassDetails) return '';

        const intelligenceScore = getAbilityScore(4); // Intelligence is ability ID 4
        const intModifier = GetAbilityModifier(intelligenceScore);
        const classSkillPoints = selectedClassDetails.skillPoints;
        const isHuman = character.raceId && selectedRaceDetails?.name?.toLowerCase() === 'human';
        const className = selectedClassDetails.name;

        if (isNewCharacter) {
            const raceStr = !isHuman ? '' : 'Human: 4 + (';
            const multiplierStr = '× 4';
            const closeParenthesis = isHuman ? ')' : '';
            return `${raceStr}(${className}: ${classSkillPoints} ${intModifier < 0 ? '-' : '+'} INT: ${intModifier}) ${multiplierStr}${closeParenthesis}`;
        } else {
            const raceStr = !isHuman ? '' : 'Human: 1 + ';
            return `${raceStr}(${className}: ${classSkillPoints} ${intModifier < 0 ? '-' : '+'} INT: ${intModifier})`;
        }
    };

    // SkillRow component
    const SkillRow = ({ skillId }: { skillId: number }) => {
        const skill = SKILL_LIST.find(s => s.id === skillId);
        if (!skill) return <></>;

        const isAnalogSkill = AnalogSkillService.isAnalogSkill(skillId);
        const isClassSkill = isSkillClassSkill(skillId);
        const maxRanks = getMaxRanks(skillId);
        const ranks = getSkillRanks(skillId);
        const total = getSkillTotal(skillId);

        // For analog skills, get additional info


        return (
            <div
                className={`grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 px-3 py-2 items-center border-b border-gray-200 dark:border-gray-700 ${isAnalogSkill
                    ? 'bg-purple-100 dark:bg-purple-900/30'
                    : isClassSkill
                        ? 'bg-blue-100 dark:bg-blue-900/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
            >
                <div className="flex items-center">
                    <div className="text-sm font-medium">
                        {skill.name}
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
                <div className="grid grid-cols-[48px_16px]">
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
                                value={ranks}
                                onChange={(e) => handleSkillChange(skillId, parseFloat(e.target.value) || 0)}
                                className={`w-12 py-1 text-sm border rounded text-center bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isClassSkill
                                    ? 'border-blue-300 dark:border-blue-600'
                                    : 'border-gray-300 dark:border-gray-600'
                                    }`}
                            />
                            <div className="flex flex-col justify-center gap-1.5">
                                <button
                                    type="button"
                                    className="w-4 h-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white text-xs flex items-center justify-center rounded-t"
                                    onClick={() => handleSkillIncrement(skillId, true)}
                                >
                                    <ChevronUpIcon className="h-3 w-3" />
                                </button>
                                <button
                                    type="button"
                                    className="w-4 h-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white text-xs flex items-center justify-center rounded-b"
                                    onClick={() => handleSkillIncrement(skillId, false)}
                                >
                                    <ChevronDownIcon className="h-3 w-3" />
                                </button>
                            </div>
                        </>
                    )}
                </div>
                <div className="text-sm">
                    {skill.abilityId === 0 ? '' : `${ABILITY_MAP[skill.abilityId]?.abbreviation} ${GetAbilityModifierString(getAbilityScore(skill.abilityId))}`}
                </div>
                <div className={`w-12 text-sm font-medium rounded px-2 py-1 text-center ${total === null ? '' : 'border border-gray-300 dark:border-gray-600'}`}>
                    {total === null ? '' : (
                        <span className={total > 0 ? 'text-green-600 dark:text-green-400' : total < 0 ? 'text-red-600 dark:text-red-400' : ''}>
                            {total >= 0 ? `+${total}` : total.toString()}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    // Generate column headers
    const generateColumnHeaders = () => (
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 px-3 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
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
                Total
            </div>
        </div>
    );

    // Check if prerequisites are met
    const hasPrerequisites = character.raceId && advancement?.classId && selectedClassDetails;

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
                Skills {!isNewCharacter && `(Level ${advancement?.level})`}
            </h2>

            {/* Prerequisites Check */}
            {!hasPrerequisites && (
                <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg shadow-sm p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                Prerequisites Required
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                                <ul className="list-disc list-inside space-y-1">
                                    {!character.raceId && <li>Select a race</li>}
                                    {!advancement?.classId && <li>Select a class</li>}
                                    {advancement?.classId && !selectedClassDetails && <li>Loading class details...</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Skills Table */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-2">
                {!hasPrerequisites ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">
                            Please select a race and class to configure skills.
                        </p>
                    </div>
                ) : (
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

                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                            {getSkillPointsFormula()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">Class Skills Max Ranks:</span>
                                        <div className="px-3 py-1 border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-700 font-medium">
                                            {character.advancements.length + 3}
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">(1 pt./rank)</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">Cross-class Skills Max Ranks:</span>
                                        <div className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 font-medium">
                                            {Math.floor((character.advancements.length + 3) / 2)}
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">(2 pts./rank, half-ranks allowed)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Skills Tables - Responsive Columns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {/* First Column */}
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                {generateColumnHeaders()}
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {getAllocatableSkills().slice(0, Math.ceil(getAllocatableSkills().length / 3)).map(skill => (
                                        <SkillRow key={skill.id} skillId={skill.id} />
                                    ))}
                                </div>
                            </div>

                            {/* Second Column */}
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                {generateColumnHeaders()}
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {getAllocatableSkills().slice(Math.ceil(getAllocatableSkills().length / 3), Math.ceil(getAllocatableSkills().length * 2 / 3)).map(skill => (
                                        <SkillRow key={skill.id} skillId={skill.id} />
                                    ))}
                                </div>
                            </div>

                            {/* Third Column */}
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden md:col-span-2 xl:col-span-1">
                                {generateColumnHeaders()}
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {getAllocatableSkills().slice(Math.ceil(getAllocatableSkills().length * 2 / 3)).map(skill => (
                                        <SkillRow key={skill.id} skillId={skill.id} />
                                    ))}
                                </div>
                            </div>
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
                                            <SkillRow key={analogSkill.skillId} skillId={analogSkill.skillId} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
} 
