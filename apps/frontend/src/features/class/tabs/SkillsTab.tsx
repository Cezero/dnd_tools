import { TrashIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect } from 'react';

import { CustomSelect } from '@/components/forms';
import { renderCellValue } from '@/components/generic-list/columnUtils';
import { ClassSkillService } from '@/features/class/ClassSkillService';
import { SkillApi } from '@/features/skill/SkillApi';
import type { GetSkillResponse, FeatureProgression } from '@shared/schema';
import {
    SKILL_MAP,
    SKILL_SELECT_LIST,
    ABILITY_MAP,
} from '@shared/static-data';

import type { ClassTabProps } from './types';

export function SkillsTab({
    formData: _formData,
    setFormData: _setFormData,
    validation: _validation,
    isLoading: _isLoading = false,
    featureProgressions = [],
    onAddSkill,
    onRemoveSkill
}: ClassTabProps): React.JSX.Element {
    const [skillDetails, setSkillDetails] = useState<Record<number, GetSkillResponse>>({});
    const [loadingSkills, setLoadingSkills] = useState<Set<number>>(new Set());

    // Load skill details for class skills
    useEffect(() => {
        const classSkills = ClassSkillService.getClassSkills(featureProgressions as FeatureProgression[]);
        const skillsToLoad = classSkills.filter(skillId => !skillDetails[skillId] && !loadingSkills.has(skillId));

        if (skillsToLoad.length > 0) {
            setLoadingSkills(prev => new Set([...prev, ...skillsToLoad]));

            Promise.all(
                skillsToLoad.map(async (skillId) => {
                    try {
                        const skill = await SkillApi.getSkillById(undefined, { id: skillId });
                        return { skillId, skill };
                    } catch (error) {
                        console.error(`Failed to load skill ${skillId}:`, error);
                        return { skillId, skill: null };
                    }
                })
            ).then((results) => {
                const newSkillDetails = { ...skillDetails };
                results.forEach(({ skillId, skill }) => {
                    if (skill) {
                        newSkillDetails[skillId] = skill;
                    }
                });
                setSkillDetails(newSkillDetails);
                setLoadingSkills(prev => {
                    const newSet = new Set(prev);
                    skillsToLoad.forEach(id => newSet.delete(id));
                    return newSet;
                });
            });
        }
    }, [featureProgressions, skillDetails, loadingSkills]);

    const classSkills = ClassSkillService.getClassSkills(featureProgressions as FeatureProgression[]);

    // Filter out skills that are already added as class skills
    const availableSkills = SKILL_SELECT_LIST.filter(skill => !classSkills.includes(skill.value));

    return (
        <div className="p-6 space-y-6">
            <div>
                {/* Add Skill Section */}
                <div className="mb-6">
                    <CustomSelect
                        value={null}
                        componentExtraClassName="flex items-center gap-2"
                        itemExtraClassName="w-64"
                        itemTextExtraClassName="w-64"
                        onValueChange={(value) => {
                            if (value) {
                                onAddSkill(value as number);
                            }
                        }}
                        options={availableSkills}
                        placeholder="Select a skill to add"
                    />
                </div>

                {/* Skills Grid */}
                {classSkills.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {classSkills.map((skillId) => {
                            const skill = SKILL_MAP[skillId];
                            const skillDetail = skillDetails[skillId];
                            const isLoading = loadingSkills.has(skillId);

                            if (!skill) return null;

                            // Format the header: "Skill Name (Ability; Trained only)"
                            const abilityAbbr = ABILITY_MAP[skill.abilityId]?.abbreviation || 'Unknown';
                            const headerText = skill.trainedOnly
                                ? `${skill.name} (${abilityAbbr}; Trained only)`
                                : `${skill.name} (${abilityAbbr})`;

                            return (
                                <div key={skillId} className="border border-gray-200 rounded-lg p-3 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-medium text-base flex-1">{headerText}</h4>
                                        <button
                                            type="button"
                                            onClick={() => onRemoveSkill(skillId)}
                                            className="text-red-500 hover:text-red-700 p-1 ml-2 flex-shrink-0"
                                            title="Remove Skill"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div>
                                        {isLoading ? (
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                Loading skill details...
                                            </div>
                                        ) : skillDetail?.description ? (
                                            <div className="text-sm">
                                                {renderCellValue(
                                                    skillDetail.description,
                                                    { truncate: 130, isMarkdown: true },
                                                    `skill-${skillId}-description`
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                                                No description available
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-6 border border-dashed border-gray-300 rounded-md dark:border-gray-600">
                        <p className="text-gray-500 dark:text-gray-400">
                            No class skills added yet. Use the dropdown above to add skills.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
