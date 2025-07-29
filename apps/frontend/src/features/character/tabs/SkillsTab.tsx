import React, { useMemo } from 'react';
import { ValidatedInput } from '@/components/forms/ValidatedForm';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import {
    SKILL_LIST,
    CLASS_MAP,
    ABILITY_MAP,
    GetAbilityModifier,
    GetAbilityModifierString
} from '@shared/static-data';
import type { RaceInQueryResponse, GetRaceResponse, GetClassResponse } from '@shared/schema';
import type { CharacterData } from '../types';

interface SkillRowProps {
    skill: typeof SKILL_LIST[0];
    character: CharacterData;
    isClassSkill: boolean;
    ranks: number;
    total: number | null;
    maxRanks: number;
    onSkillChange: (skillId: number, newRanks: number) => void;
    onSkillIncrement: (skillId: number, increment: boolean) => void;
}

function SkillRow({
    skill,
    character,
    isClassSkill,
    ranks,
    total,
    maxRanks,
    onSkillChange,
    onSkillIncrement
}: SkillRowProps): React.JSX.Element {
    return (
        <tr
            className={`${isClassSkill
                ? 'bg-blue-50 dark:bg-blue-900/10'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
        >
            <td className="px-3 py-2 whitespace-nowrap">
                <div className="flex items-center">
                    <span className="text-sm font-medium">
                        {skill.name}
                    </span>
                    {isClassSkill && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                            C
                        </span>
                    )}
                </div>
            </td>
            <td className="px-3 py-2 whitespace-nowrap">
                <div className="grid grid-cols-[48px_16px]">
                    <input
                        type="number"
                        step="0.5"
                        min="0"
                        max={maxRanks}
                        value={ranks}
                        onChange={(e) => onSkillChange(skill.id, parseFloat(e.target.value) || 0)}
                        className={`w-12 py-1 text-sm border rounded text-center bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isClassSkill
                            ? 'border-blue-300 dark:border-blue-600'
                            : 'border-gray-300 dark:border-gray-600'
                            }`}
                    />
                    <div className="flex flex-col justify-center gap-1.5">
                        <button
                            type="button"
                            className="w-4 h-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white text-xs flex items-center justify-center rounded-t"
                            onClick={() => onSkillIncrement(skill.id, true)}
                        >
                            <ChevronUpIcon className="h-3 w-3" />
                        </button>
                        <button
                            type="button"
                            className="w-4 h-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white text-xs flex items-center justify-center rounded-b"
                            onClick={() => onSkillIncrement(skill.id, false)}
                        >
                            <ChevronDownIcon className="h-3 w-3" />
                        </button>
                    </div>
                </div>
            </td>
            <td className="px-3 py-2 whitespace-nowrap text-sm">
                {skill.abilityId === 0 ? '' : `${ABILITY_MAP[skill.abilityId]?.abbreviation} ${GetAbilityModifierString(character.abilities[skill.abilityId] ?? 10)}`}
            </td>
            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium border border-gray-300 dark:border-gray-600 rounded">
                {total === null ? '' : (total >= 0 ? `+${total}` : total.toString())}
            </td>
        </tr>
    );
}

interface SkillsTabProps {
    character: CharacterData;
    onUpdate: (data: Partial<CharacterData>) => void;
    races?: RaceInQueryResponse[];
    selectedRaceDetails?: GetRaceResponse | null;
    selectedClassDetails?: GetClassResponse | null;
}

export function SkillsTab({
    character,
    onUpdate,
    races = [],
    selectedRaceDetails,
    selectedClassDetails
}: SkillsTabProps): React.JSX.Element {

    // Check if a skill is a class skill
    const isSkillClassSkill = (skillId: number): boolean => {
        if (!character.class || !selectedClassDetails) return false;

        // Check if the skill is in the class's skill list
        return selectedClassDetails.skills?.some(classSkill => classSkill.skillId === skillId) || false;
    };

    // Calculate skill points available
    const skillPointsAvailable = useMemo(() => {
        if (!character.class || character.level !== 1 || !selectedClassDetails) return 0;

        // Get intelligence modifier - default to 10 if not set
        const intelligenceScore = character.abilities[4] ?? 10; // Intelligence is ability ID 4
        const intModifier = GetAbilityModifier(intelligenceScore);

        // Base calculation: (class skill points + int modifier) * 4
        let basePoints = (selectedClassDetails.skillPoints + intModifier) * 4;

        // Minimum of 4 skill points even with negative intelligence
        basePoints = Math.max(4, basePoints);

        // Human bonus: +4 skill points at first level
        if (character.race && selectedRaceDetails?.name?.toLowerCase() === 'human') {
            basePoints += 4;
        }

        return basePoints;
    }, [character.class, character.level, character.abilities, character.race, selectedRaceDetails, selectedClassDetails]);

    // Calculate skill points spent
    const skillPointsSpent = useMemo(() => {
        let totalSpent = 0;

        SKILL_LIST.forEach(skill => {
            const ranks = character.skills[skill.id] || 0;
            const isClassSkill = isSkillClassSkill(skill.id);

            if (isClassSkill) {
                // Class skills cost 1 point per rank
                totalSpent += ranks;
            } else {
                // Cross-class skills cost 2 points per rank
                totalSpent += ranks * 2;
            }
        });

        return totalSpent;
    }, [character.skills, character.class, selectedClassDetails]);

    // Calculate remaining skill points
    const skillPointsRemaining = useMemo(() => {
        return skillPointsAvailable - skillPointsSpent;
    }, [skillPointsAvailable, skillPointsSpent]);

    // Get maximum ranks allowed for a skill
    const getMaxRanks = (skillId: number): number => {
        const isClassSkill = isSkillClassSkill(skillId);
        if (isClassSkill) {
            return character.level + 3;
        } else {
            return Math.floor((character.level + 3) / 2);
        }
    };

    // Handle skill rank change
    const handleSkillChange = (skillId: number, newRanks: number) => {
        const skill = SKILL_LIST.find(s => s.id === skillId);
        if (!skill) return;

        const currentRanks = character.skills[skillId] || 0;
        const maxRanks = getMaxRanks(skillId);

        // Validate maximum ranks
        if (newRanks > maxRanks) {
            newRanks = maxRanks;
        }

        // Validate minimum ranks
        if (newRanks < 0) {
            newRanks = 0;
        }

        // Calculate cost difference
        const isClassSkill = isSkillClassSkill(skillId);
        const currentCost = isClassSkill ? currentRanks : currentRanks * 2;
        const newCost = isClassSkill ? newRanks : newRanks * 2;
        const costDifference = newCost - currentCost;

        // Check if we have enough skill points
        const remainingPoints = skillPointsAvailable - skillPointsSpent;
        if (costDifference > remainingPoints) {
            return; // Don't update if not enough points
        }

        const newSkills = { ...character.skills, [skillId]: newRanks };
        onUpdate({ skills: newSkills });
    };

    // Handle skill increment/decrement
    const handleSkillIncrement = (skillId: number, increment: boolean) => {
        const skill = SKILL_LIST.find(s => s.id === skillId);
        if (!skill) return;

        const currentValue = character.skills[skillId] || 0;
        const isClassSkill = isSkillClassSkill(skillId);
        const maxRanks = getMaxRanks(skillId);

        const step = isClassSkill ? 1.0 : 0.5;
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

        const abilityScore = character.abilities[skill.abilityId] ?? 10;
        return GetAbilityModifier(abilityScore);
    };

    // Get total skill bonus (ranks + ability modifier)
    const getSkillTotal = (skillId: number): number | null => {
        const ranks = character.skills[skillId] || 0;
        const skill = SKILL_LIST.find(s => s.id === skillId);
        if (!skill) return ranks;

        const abilityModifier = getSkillAbilityModifier(skillId);

        // Special case: skills with abilityId 0 (like Speak Language) have no total
        if (skill.abilityId === 0) return null;

        return Math.floor(ranks) + (abilityModifier ?? 0);
    };

    // Format skill ranks display (handle half ranks)
    const formatSkillRanks = (ranks: number): string => {
        if (ranks === Math.floor(ranks)) {
            return ranks.toString();
        }
        return ranks.toFixed(1);
    };

    // Check if prerequisites are met
    const hasPrerequisites = character.race && character.class && character.level === 1 && selectedClassDetails;

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Skills
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
                                    {!character.race && <li>Select a race</li>}
                                    {!character.class && <li>Select a class</li>}
                                    {character.level !== 1 && <li>Character must be level 1</li>}
                                    {character.class && !selectedClassDetails && <li>Loading class details...</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Skills Table */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                {!hasPrerequisites ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">
                            Please select a race and class to configure skills.
                        </p>
                    </div>
                ) : (
                    <div>
                        {/* Skill Points and Rules Summary */}
                        <div className="mb-4">
                            {/* Points and Max Ranks Row */}
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-6">
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
                                <div className="flex items-center gap-6 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">Class Skills Max Ranks:</span>
                                        <div className="px-3 py-1 border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium">
                                            {character.level + 3}
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">(1 pt./rank)</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">Cross-class Skills Max Ranks:</span>
                                        <div className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium">
                                            {Math.floor((character.level + 3) / 2)}
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">(2 pts./rank, half-ranks allowed)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Skills Tables - Two Columns */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Skill Name
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Ranks
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Ability
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {SKILL_LIST.slice(0, Math.ceil(SKILL_LIST.length / 2)).map(skill => {
                                            const isClassSkill = isSkillClassSkill(skill.id);
                                            const ranks = character.skills[skill.id] || 0;
                                            const total = getSkillTotal(skill.id);
                                            const maxRanks = getMaxRanks(skill.id);

                                            return (
                                                <SkillRow
                                                    key={skill.id}
                                                    skill={skill}
                                                    character={character}
                                                    isClassSkill={isClassSkill}
                                                    ranks={ranks}
                                                    total={total}
                                                    maxRanks={maxRanks}
                                                    onSkillChange={handleSkillChange}
                                                    onSkillIncrement={handleSkillIncrement}
                                                />
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Right Column */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Skill Name
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Ranks
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Ability
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {SKILL_LIST.slice(Math.ceil(SKILL_LIST.length / 2)).map(skill => {
                                            const isClassSkill = isSkillClassSkill(skill.id);
                                            const ranks = character.skills[skill.id] || 0;
                                            const total = getSkillTotal(skill.id);
                                            const maxRanks = getMaxRanks(skill.id);

                                            return (
                                                <SkillRow
                                                    key={skill.id}
                                                    skill={skill}
                                                    character={character}
                                                    isClassSkill={isClassSkill}
                                                    ranks={ranks}
                                                    total={total}
                                                    maxRanks={maxRanks}
                                                    onSkillChange={handleSkillChange}
                                                    onSkillIncrement={handleSkillIncrement}
                                                />
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 
