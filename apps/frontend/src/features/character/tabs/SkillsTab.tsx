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
    skillId: number;
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

    // Check if a skill is a special skill that supports subtypes
    const isSpecialSkill = (skillId: number): boolean => {
        return skillId === 6 || skillId === 32 || skillId === 33; // Craft, Perform, Profession
    };

    // Check if a skill is Speak Language (special handling)
    const isSpeakLanguage = (skillId: number): boolean => {
        return skillId === 34; // Speak Language skill ID
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
            const isClassSkill = isSkillClassSkill(skill.id);

            if (isSpecialSkill(skill.id)) {
                // Handle special skills with subtypes
                const subtypes = character.skillSubtypes?.[skill.id] || [];
                subtypes.forEach(subtype => {
                    if (isClassSkill) {
                        totalSpent += subtype.ranks;
                    } else {
                        totalSpent += subtype.ranks * 2;
                    }
                });
            } else {
                // Handle regular skills
                const ranks = character.skills[skill.id] || 0;
                if (isClassSkill) {
                    // Class skills cost 1 point per rank
                    totalSpent += ranks;
                } else {
                    // Cross-class skills cost 2 points per rank
                    totalSpent += ranks * 2;
                }
            }
        });

        return totalSpent;
    }, [character.skills, character.skillSubtypes, character.class, selectedClassDetails]);

    // Calculate remaining skill points
    const skillPointsRemaining = useMemo(() => {
        return skillPointsAvailable - skillPointsSpent;
    }, [skillPointsAvailable, skillPointsSpent]);

    // Get maximum ranks allowed for a skill
    const getMaxRanks = (skillId: number): number => {
        // Speak Language has no max rank limit
        if (isSpeakLanguage(skillId)) {
            return Infinity;
        }

        const isClassSkill = isSkillClassSkill(skillId);
        if (isClassSkill) {
            return character.level + 3;
        } else {
            return Math.floor((character.level + 3) / 2);
        }
    };

    // Handle skill rank change
    const handleSkillChange = (skillId: number, newRanks: number, subtypeIndex?: number) => {
        const skill = SKILL_LIST.find(s => s.id === skillId);
        if (!skill) return;

        const maxRanks = getMaxRanks(skillId);

        // Validate maximum ranks
        if (newRanks > maxRanks) {
            newRanks = maxRanks;
        }

        // Validate minimum ranks
        if (newRanks < 0) {
            newRanks = 0;
        }

        if (isSpecialSkill(skillId)) {
            // Handle special skills with subtypes
            const subtypes = character.skillSubtypes?.[skillId] || [];

            if (subtypeIndex !== undefined) {
                // Update existing subtype
                const currentSubtype = subtypes[subtypeIndex];
                if (!currentSubtype) return;

                const isClassSkill = isSkillClassSkill(skillId);
                const currentCost = isClassSkill ? currentSubtype.ranks : currentSubtype.ranks * 2;
                const newCost = isClassSkill ? newRanks : newRanks * 2;
                const costDifference = newCost - currentCost;

                // Check if we have enough skill points
                const remainingPoints = skillPointsAvailable - skillPointsSpent;
                if (costDifference > remainingPoints) {
                    return; // Don't update if not enough points
                }

                const newSubtypes = [...subtypes];
                newSubtypes[subtypeIndex] = { ...currentSubtype, ranks: newRanks };

                const newSkillSubtypes = { ...character.skillSubtypes, [skillId]: newSubtypes };
                onUpdate({ skillSubtypes: newSkillSubtypes });
            }
        } else {
            // Handle regular skills
            const currentRanks = character.skills[skillId] || 0;
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
        }
    };

    // Handle skill increment/decrement
    const handleSkillIncrement = (skillId: number, increment: boolean, subtypeIndex?: number) => {
        const skill = SKILL_LIST.find(s => s.id === skillId);
        if (!skill) return;

        const isClassSkill = isSkillClassSkill(skillId);
        const maxRanks = getMaxRanks(skillId);
        const step = isClassSkill ? 1.0 : 0.5;

        if (isSpecialSkill(skillId)) {
            // Handle special skills with subtypes
            const subtypes = character.skillSubtypes?.[skillId] || [];

            if (subtypeIndex !== undefined) {
                const currentSubtype = subtypes[subtypeIndex];
                if (!currentSubtype) return;

                const currentValue = currentSubtype.ranks;
                const newValue = increment
                    ? Math.min(maxRanks, currentValue + step)
                    : Math.max(0, currentValue - step);

                handleSkillChange(skillId, newValue, subtypeIndex);
            }
        } else {
            // Handle regular skills
            const currentValue = character.skills[skillId] || 0;
            const newValue = increment
                ? Math.min(maxRanks, currentValue + step)
                : Math.max(0, currentValue - step);

            handleSkillChange(skillId, newValue);
        }
    };

    // Add new subtype for special skills
    const addSubtype = (skillId: number) => {
        const subtypes = character.skillSubtypes?.[skillId] || [];
        const newSubtypes = [...subtypes, { ranks: 0, subtype: '' }];
        const newSkillSubtypes = { ...character.skillSubtypes, [skillId]: newSubtypes };
        onUpdate({ skillSubtypes: newSkillSubtypes });
    };

    // Remove subtype for special skills
    const removeSubtype = (skillId: number, subtypeIndex: number) => {
        const subtypes = character.skillSubtypes?.[skillId] || [];
        const newSubtypes = subtypes.filter((_, index) => index !== subtypeIndex);
        const newSkillSubtypes = { ...character.skillSubtypes, [skillId]: newSubtypes };
        onUpdate({ skillSubtypes: newSkillSubtypes });
    };

    // Update subtype name
    const updateSubtypeName = (skillId: number, subtypeIndex: number, newName: string) => {
        const currentSubtypes = character.skillSubtypes?.[skillId] || [];

        if (subtypeIndex >= currentSubtypes.length) {
            // Adding a new subtype
            const newSubtypes = [...currentSubtypes, { ranks: 0, subtype: newName }];
            const newSkillSubtypes = { ...character.skillSubtypes, [skillId]: newSubtypes };
            onUpdate({ skillSubtypes: newSkillSubtypes });
        } else {
            // Updating existing subtype
            const newSubtypes = [...currentSubtypes];
            newSubtypes[subtypeIndex] = { ...newSubtypes[subtypeIndex], subtype: newName };

            // Remove empty subtypes (ranks = 0 and empty name)
            const filteredSubtypes = newSubtypes.filter(subtype => subtype.ranks > 0 || subtype.subtype !== '');

            const newSkillSubtypes = { ...character.skillSubtypes, [skillId]: filteredSubtypes };
            onUpdate({ skillSubtypes: newSkillSubtypes });
        }
    };

    // Get special skill name
    const getSpecialSkillName = (skillId: number): string => {
        switch (skillId) {
            case 6: return 'Craft';
            case 32: return 'Perform';
            case 33: return 'Profession';
            default: return '';
        }
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
    const getSkillTotal = (skillId: number, subtypeIndex?: number): number | null => {
        const skill = SKILL_LIST.find(s => s.id === skillId);
        if (!skill) return 0;

        let ranks = 0;
        if (isSpecialSkill(skillId)) {
            // Handle special skills with subtypes
            const subtypes = character.skillSubtypes?.[skillId] || [];
            if (subtypeIndex !== undefined) {
                const subtype = subtypes[subtypeIndex];
                ranks = subtype?.ranks || 0;
            }
        } else {
            // Handle regular skills
            ranks = character.skills[skillId] || 0;
        }

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

    // Calculate total skill points spent across all skills and subtypes
    const calculateTotalSkillPointsSpent = (): number => {
        let totalSpent = 0;

        // Add points from regular skills
        Object.entries(character.skills).forEach(([skillIdStr, ranks]) => {
            const skillId = parseInt(skillIdStr);
            if (isSpeakLanguage(skillId)) {
                // Speak Language always costs 1 point per rank
                totalSpent += ranks;
            } else {
                const isClassSkill = isSkillClassSkill(skillId);
                const costPerRank = isClassSkill ? 1 : 2;
                totalSpent += ranks * costPerRank;
            }
        });

        // Add points from skill subtypes
        Object.entries(character.skillSubtypes || {}).forEach(([skillIdStr, subtypes]) => {
            const skillId = parseInt(skillIdStr);
            const isClassSkill = isSkillClassSkill(skillId);
            const costPerRank = isClassSkill ? 1 : 2;

            subtypes.forEach(subtype => {
                totalSpent += subtype.ranks * costPerRank;
            });
        });

        return totalSpent;
    };

    // Generate the formula display for skill points calculation
    const getSkillPointsFormula = (): string => {
        if (!character.class || !selectedClassDetails) return '';

        const intelligenceScore = character.abilities[4] ?? 10; // Intelligence is ability ID 4
        const intModifier = GetAbilityModifier(intelligenceScore);
        const classSkillPoints = selectedClassDetails.skillPoints;
        const isHuman = character.race && selectedRaceDetails?.name?.toLowerCase() === 'human';
        const className = selectedClassDetails.name;

        const raceStr = !isHuman ? '' : character.level === 1 ? 'Human: 4 + (' : 'Human: 1 + ';
        const multiplierStr = character.level === 1 ? '× 4' : '';
        const closeParenthesis = character.level === 1 && isHuman ? ')' : '';
        return `${raceStr}(${className}: ${classSkillPoints} ${intModifier < 0 ? '-' : '+'} INT: ${intModifier}) ${multiplierStr}${closeParenthesis}`;
    };

    // SkillRow component - takes skillId and optional subtype index for special skills
    const SkillRow = ({ skillId, subTypeIndex }: {
        skillId: number;
        subTypeIndex?: number;
    }) => {
        const skill = SKILL_LIST.find(s => s.id === skillId);
        if (!skill) return <></>;

        const isClassSkill = isSkillClassSkill(skillId);
        const maxRanks = getMaxRanks(skillId);
        const isSpecial = isSpecialSkill(skillId);

        // For special skills, get the subtypes and current subtype data
        const subtypes = character.skillSubtypes?.[skillId] || [];
        const currentSubtype = subTypeIndex !== undefined ? subtypes[subTypeIndex] : null;
        const ranks = currentSubtype ? currentSubtype.ranks : (character.skills[skillId] || 0);
        const total = getSkillTotal(skillId, subTypeIndex);

        const [editingSubtype, setEditingSubtype] = React.useState(false);
        const [editValue, setEditValue] = React.useState('');
        const [inputPosition, setInputPosition] = React.useState({ x: 0, y: 0, width: 0 });
        const inputRef = React.useRef<HTMLInputElement>(null);
        const skillNameRef = React.useRef<HTMLDivElement>(null);

        // For special skills, show the base name with subtype if provided
        const getSkillName = () => {
            if (!isSpecial) return skill.name;

            // Show base skill name with subtype if provided
            if (currentSubtype) {
                return `${skill.name} (${currentSubtype.subtype || 'unnamed'})`;
            }

            return skill.name;
        };

        const skillName = getSkillName();

        const handleSubtypeClick = () => {
            if (!isSpecial || !skillNameRef.current) return;

            // Calculate position of the skill name element
            const rect = skillNameRef.current.getBoundingClientRect();
            setInputPosition({
                x: rect.left,
                y: rect.top,
                width: rect.width
            });

            setEditingSubtype(true);
            setEditValue(currentSubtype?.subtype || ''); // Pre-fill with existing subtype name if editing
        };

        const handleSubtypeSave = () => {
            if (!isSpecial) return;

            const currentSubtypes = character.skillSubtypes?.[skillId] || [];

            if (subTypeIndex !== undefined) {
                // Updating existing subtype
                const newSubtypes = [...currentSubtypes];
                newSubtypes[subTypeIndex] = { ...newSubtypes[subTypeIndex], subtype: editValue };

                // Remove subtypes with empty names and 0 ranks
                const filteredSubtypes = newSubtypes.filter(subtype =>
                    subtype.subtype !== '' || subtype.ranks > 0
                );

                const newSkillSubtypes = { ...character.skillSubtypes, [skillId]: filteredSubtypes };
                onUpdate({ skillSubtypes: newSkillSubtypes });
            } else {
                // Adding new subtype - only add if name is not empty
                if (editValue.trim() !== '') {
                    const newSubtypes = [...currentSubtypes, { ranks: 0, subtype: editValue }];
                    const newSkillSubtypes = { ...character.skillSubtypes, [skillId]: newSubtypes };
                    onUpdate({ skillSubtypes: newSkillSubtypes });
                }
            }

            setEditingSubtype(false);
            setEditValue('');
        };

        const handleSubtypeCancel = () => {
            setEditingSubtype(false);
            setEditValue('');
        };

        const handleSkillChange = (newRanks: number) => {
            // Constrain to max ranks for this skill
            const constrainedRanks = Math.min(Math.max(0, newRanks), maxRanks);

            // Calculate current total skill points spent
            const currentSkillPointsSpent = calculateTotalSkillPointsSpent();

            // Calculate skill points for this change
            const currentRanks = subTypeIndex !== undefined
                ? (character.skillSubtypes?.[skillId]?.[subTypeIndex]?.ranks || 0)
                : (character.skills[skillId] || 0);

            const rankDifference = constrainedRanks - currentRanks;
            const skillPointsForChange = isSpeakLanguage(skillId)
                ? rankDifference
                : rankDifference * (isClassSkill ? 1 : 2);

            // Check if this change would exceed available skill points
            if (currentSkillPointsSpent + skillPointsForChange > skillPointsAvailable) {
                return; // Don't allow the change
            }

            if (subTypeIndex !== undefined) {
                // Update subtype ranks
                const currentSubtypes = character.skillSubtypes?.[skillId] || [];
                const newSubtypes = [...currentSubtypes];
                newSubtypes[subTypeIndex] = { ...newSubtypes[subTypeIndex], ranks: constrainedRanks };

                // Remove subtypes with empty names and 0 ranks
                const filteredSubtypes = newSubtypes.filter(subtype =>
                    subtype.subtype !== '' || subtype.ranks > 0
                );

                const newSkillSubtypes = { ...character.skillSubtypes, [skillId]: filteredSubtypes };
                onUpdate({ skillSubtypes: newSkillSubtypes });
            } else if (isSpecial) {
                // For special skills, adding ranks to base skill creates a new subtype
                const currentSubtypes = character.skillSubtypes?.[skillId] || [];
                const newSubtypes = [...currentSubtypes, { ranks: constrainedRanks, subtype: 'unnamed' }];
                const newSkillSubtypes = { ...character.skillSubtypes, [skillId]: newSubtypes };
                onUpdate({ skillSubtypes: newSkillSubtypes });
            } else {
                // Update base skill ranks for regular skills
                onUpdate({
                    skills: {
                        ...character.skills,
                        [skillId]: constrainedRanks
                    }
                });
            }
        };

        const handleSkillIncrement = (increment: boolean) => {
            const incrementAmount = isClassSkill ? 1.0 : 0.5;
            const newRanks = increment ? ranks + incrementAmount : ranks - incrementAmount;
            handleSkillChange(Math.max(0, newRanks));
        };

        React.useEffect(() => {
            if (editingSubtype && inputRef.current) {
                inputRef.current.focus();
            }
        }, [editingSubtype]);

        return (
            <>
                <div
                    className={`grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 px-3 py-2 items-center border-b border-gray-200 dark:border-gray-700 ${isClassSkill
                        ? 'bg-blue-100 dark:bg-blue-900/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                >
                    <div className="flex items-center">
                        <div
                            ref={skillNameRef}
                            onClick={isSpecial ? handleSubtypeClick : undefined}
                            className={`text-sm font-medium ${isSpecial ? 'hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer' : ''}`}
                            title={isSpecial ? 'Click to modify subtype' : undefined}
                        >
                            {skillName}
                        </div>
                        {isClassSkill && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                                C
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-[48px_16px]">
                        <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={maxRanks}
                            value={ranks}
                            onChange={(e) => handleSkillChange(parseFloat(e.target.value) || 0)}
                            className={`w-12 py-1 text-sm border rounded text-center bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isClassSkill
                                ? 'border-blue-300 dark:border-blue-600'
                                : 'border-gray-300 dark:border-gray-600'
                                }`}
                        />
                        <div className="flex flex-col justify-center gap-1.5">
                            <button
                                type="button"
                                className="w-4 h-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white text-xs flex items-center justify-center rounded-t"
                                onClick={() => handleSkillIncrement(true)}
                            >
                                <ChevronUpIcon className="h-3 w-3" />
                            </button>
                            <button
                                type="button"
                                className="w-4 h-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white text-xs flex items-center justify-center rounded-b"
                                onClick={() => handleSkillIncrement(false)}
                            >
                                <ChevronDownIcon className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                    <div className="text-sm">
                        {skill.abilityId === 0 ? '' : `${ABILITY_MAP[skill.abilityId]?.abbreviation} ${GetAbilityModifierString(character.abilities[skill.abilityId] ?? 10)}`}
                    </div>
                    <div className={`w-12 text-sm font-medium rounded px-2 py-1 text-center ${total === null ? '' : 'border border-gray-300 dark:border-gray-600'}`}>
                        {total === null ? '' : (
                            <span className={total > 0 ? 'text-green-600 dark:text-green-400' : total < 0 ? 'text-red-600 dark:text-red-400' : ''}>
                                {total >= 0 ? `+${total}` : total.toString()}
                            </span>
                        )}
                    </div>
                </div>

                {/* Floating input for subtype editing */}
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
            </>
        );
    };

    // Generate skill rows for a given skill
    const generateSkillRows = (skill: typeof SKILL_LIST[0]) => {
        const isSpecial = isSpecialSkill(skill.id);

        if (isSpecial) {
            const subtypes = character.skillSubtypes?.[skill.id] || [];
            const rows = [];

            // Add existing subtypes as separate rows
            subtypes.forEach((subtype, index) => {
                rows.push(
                    <SkillRow key={`${skill.id}-${index}`} skillId={skill.id} subTypeIndex={index} />
                );
            });

            // Add base skill row (always shown for special skills)
            rows.push(
                <SkillRow key={`${skill.id}-base`} skillId={skill.id} />
            );

            return rows;
        } else {
            return [
                <SkillRow key={skill.id} skillId={skill.id} />
            ];
        }
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
    const hasPrerequisites = character.race && character.class && character.level === 1 && selectedClassDetails;

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
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
                                            {character.level + 3}
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">(1 pt./rank)</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">Cross-class Skills Max Ranks:</span>
                                        <div className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 font-medium">
                                            {Math.floor((character.level + 3) / 2)}
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
                                    {SKILL_LIST.slice(0, Math.ceil(SKILL_LIST.length / 3)).flatMap(skill => generateSkillRows(skill))}
                                </div>
                            </div>

                            {/* Second Column */}
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                {generateColumnHeaders()}
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {SKILL_LIST.slice(Math.ceil(SKILL_LIST.length / 3), Math.ceil(SKILL_LIST.length * 2 / 3)).flatMap(skill => generateSkillRows(skill))}
                                </div>
                            </div>

                            {/* Third Column */}
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden md:col-span-2 xl:col-span-1">
                                {generateColumnHeaders()}
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {SKILL_LIST.slice(Math.ceil(SKILL_LIST.length * 2 / 3)).flatMap(skill => generateSkillRows(skill))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 
