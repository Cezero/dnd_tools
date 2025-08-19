import React, { useState, useEffect } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { CustomSelect } from '@/components/forms';
import { renderCellValue } from '@/components/generic-list/columnUtils';
import { SkillService } from '@/features/skill/SkillService';
import { ClassSkillService } from '@/features/class/ClassSkillService';
import {
    ModifierAppliesToType,
    ModifierType,
    FeatureAppliesToType,
    SpecialFeatureId,
    SKILL_MAP,
    SKILL_SELECT_LIST,
    ABILITY_MAP,
} from '@shared/static-data';
import type { ClassTabProps } from './types';
import type { GetSkillResponse, FeatureProgressionWithRelations } from '@shared/schema';



export function SkillsTab({
    formData,
    setFormData,
    validation,
    isLoading = false,
    featureProgressions = [],
    setFeatureProgressions
}: ClassTabProps): React.JSX.Element {
    const [skillDetails, setSkillDetails] = useState<Record<number, GetSkillResponse>>({});
    const [loadingSkills, setLoadingSkills] = useState<Set<number>>(new Set());

    // Load skill details for class skills
    useEffect(() => {
        const classSkills = ClassSkillService.getClassSkills(featureProgressions as FeatureProgressionWithRelations[]);
        const skillsToLoad = classSkills.filter(skillId => !skillDetails[skillId] && !loadingSkills.has(skillId));

        if (skillsToLoad.length > 0) {
            setLoadingSkills(prev => new Set([...prev, ...skillsToLoad]));

            Promise.all(
                skillsToLoad.map(async (skillId) => {
                    try {
                        const skill = await SkillService.getSkillById(undefined, { id: skillId });
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

    const handleAddSkill = (skillId: number) => {
        if (!setFeatureProgressions) return;
        ClassSkillService.addSkill(
            featureProgressions as FeatureProgressionWithRelations[],
            setFeatureProgressions,
            skillId,
            (formData as { id?: number }).id || 0
        );
    };

    const handleRemoveSkill = (skillId: number) => {
        if (!setFeatureProgressions) return;
        ClassSkillService.removeSkill(
            featureProgressions as FeatureProgressionWithRelations[],
            setFeatureProgressions,
            skillId
        );

        // Remove skill details from state
        setSkillDetails(prev => {
            const newDetails = { ...prev };
            delete newDetails[skillId];
            return newDetails;
        });
    };

    const classSkills = ClassSkillService.getClassSkills(featureProgressions as FeatureProgressionWithRelations[]);

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
                                handleAddSkill(value as number);
                            }
                        }}
                        options={SKILL_SELECT_LIST
                            .filter(skill => !classSkills.includes(skill.value))}
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

                            // Format the header: "Skill Name (Attribute; Trained only)"
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
                                            onClick={() => handleRemoveSkill(skillId)}
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
