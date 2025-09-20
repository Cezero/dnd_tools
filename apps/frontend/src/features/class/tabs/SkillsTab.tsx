import { TrashIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect } from 'react';

import { getAppliesToSubIdSelectOptions } from '@/components/feature-system/FeatureProgressionDetailEdit/utils';
import { CustomNestedContextSelect, type NestedSelectOption } from '@/components/forms';
import { renderCellValue } from '@/components/generic-list/columnUtils';
import { ClassSkillService } from '@/features/class/ClassSkillService';
import { SkillApi } from '@/features/skill/SkillApi';
import { NumericIdMapping } from '@/lib/numeric-id-mapping';
import type { GetSkillResponse, FeatureProgression } from '@shared/schema';
import {
    SKILL_MAP,
    SKILL_LIST,
    ABILITY_MAP,
    SpecialFeatureId,
    EntityAppliesToType,
} from '@shared/static-data';

import type { ClassTabProps } from './types';

export function SkillsTab({
    formData: _formData,
    setFormData: _setFormData,
    validation: _validation,
    isLoading: _isLoading = false,
    featureProgressions = [],
    setFeatureProgressions,
    onAddSkill: _onAddSkill,
    onRemoveSkill: _onRemoveSkill,
    classId = 1
}: ClassTabProps): React.JSX.Element {
    const [skillDetails, setSkillDetails] = useState<Record<number, GetSkillResponse>>({});
    const [loadingSkills, setLoadingSkills] = useState<Set<number>>(new Set());

    // Load skill details for class skills
    useEffect(() => {
        const classSkills = ClassSkillService.getClassSkills(featureProgressions as FeatureProgression[]);

        // Use functional updates to avoid dependency issues
        setSkillDetails(prevSkillDetails => {
            setLoadingSkills(prevLoadingSkills => {
                const skillsToLoad = classSkills.filter(skillId =>
                    !prevSkillDetails[skillId] && !prevLoadingSkills.has(skillId)
                );

                if (skillsToLoad.length > 0) {
                    const newLoadingSkills = new Set([...prevLoadingSkills, ...skillsToLoad]);

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
                        setSkillDetails(prev => {
                            const newSkillDetails = { ...prev };
                            results.forEach(({ skillId, skill }) => {
                                if (skill) {
                                    newSkillDetails[skillId] = skill;
                                }
                            });
                            return newSkillDetails;
                        });
                        setLoadingSkills(prev => {
                            const newSet = new Set(prev);
                            skillsToLoad.forEach(id => newSet.delete(id));
                            return newSet;
                        });
                    });

                    return newLoadingSkills;
                }

                return prevLoadingSkills;
            });

            return prevSkillDetails;
        });
    }, [featureProgressions]);

    // Helper function to get existing subtypes for a skill
    const getExistingSubtypes = (skillId: number): number[] => {
        return featureProgressions
            .filter(prog => prog.featureId === SpecialFeatureId.ClassSkill)
            .flatMap(prog =>
                prog.entities
                    ?.filter(entity =>
                        entity.appliesTo === EntityAppliesToType.Skill &&
                        entity.appliesToId === skillId &&
                        entity.appliesToSubId !== null
                    )
                    .map(entity => entity.appliesToSubId!) || []
            );
    };

    // Helper function to check if a skill/subtype combination is already added
    const isSkillSubtypeAdded = (skillId: number, subtypeId: number | null): boolean => {
        return featureProgressions
            .filter(prog => prog.featureId === SpecialFeatureId.ClassSkill)
            .some(prog =>
                prog.entities?.some(entity =>
                    entity.appliesTo === EntityAppliesToType.Skill &&
                    entity.appliesToId === skillId &&
                    entity.appliesToSubId === subtypeId
                )
            );
    };

    // Create nested select options with proper nested structure
    const getNestedSkillOptions = (): NestedSelectOption[] => {
        const options: NestedSelectOption[] = [];

        // Get all skills that aren't fully added yet
        const availableSkills = SKILL_LIST.filter(skill => {
            const skillId = skill.id;
            const subtypes = getAppliesToSubIdSelectOptions(EntityAppliesToType.Skill, skillId);

            if (subtypes.length === 0) {
                // Regular skill - check if it's already added
                return !isSkillSubtypeAdded(skillId, null);
            } else {
                // Skill with subtypes - check if any subtypes are still available
                const existingSubtypes = getExistingSubtypes(skillId);
                return existingSubtypes.length < subtypes.length;
            }
        });

        availableSkills.forEach(skill => {
            const skillId = skill.id;
            const subtypes = getAppliesToSubIdSelectOptions(EntityAppliesToType.Skill, skillId);

            if (subtypes.length === 0) {
                // Regular skill - add directly
                options.push({
                    id: NumericIdMapping.getSkillId(skillId),
                    name: skill.name
                });
            } else {
                // Skill with subtypes - add as a nested group
                const availableSubtypes = subtypes.filter(subtype =>
                    !isSkillSubtypeAdded(skillId, subtype.value)
                );

                if (availableSubtypes.length > 0) {
                    options.push({
                        id: NumericIdMapping.getGroupId(skillId),
                        name: skill.name,
                        disabled: true, // Group header is not selectable
                        children: availableSubtypes.map(subtype => ({
                            id: NumericIdMapping.getSubtypeId(skillId, subtype.value),
                            name: subtype.label
                        }))
                    });
                }
            }
        });

        return options;
    };

    // Handle skill selection with numeric values
    const handleSkillSelect = (value: number | null) => {
        if (!value || !setFeatureProgressions) return;

        // Parse the numeric ID
        const parsed = NumericIdMapping.parseId(value);
        if (parsed && !parsed.isGroup) {
            ClassSkillService.addSkill(
                featureProgressions,
                setFeatureProgressions,
                parsed.skillId,
                classId,
                parsed.subtypeId
            );
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                {/* Add Skill Section */}
                <div className="mb-6">
                    <CustomNestedContextSelect
                        value={null}
                        onValueChange={handleSkillSelect}
                        options={getNestedSkillOptions()}
                        useAbbreviation={false}
                        placeholder="Select a skill to add"
                        componentExtraClassName="flex items-center gap-2"
                        itemExtraClassName="w-64"
                        itemTextExtraClassName="w-64"
                    />
                </div>

                {/* Skills Grid */}
                {(() => {
                    // Get all class skill entries (including subtypes) and sort them
                    const classSkillEntries = featureProgressions
                        .filter(prog => prog.featureId === SpecialFeatureId.ClassSkill)
                        .flatMap(prog =>
                            prog.entities
                                ?.filter(entity => entity.appliesTo === EntityAppliesToType.Skill && entity.appliesToId)
                                .map(entity => ({
                                    skillId: entity.appliesToId!,
                                    subtypeId: entity.appliesToSubId,
                                    entityId: entity.id
                                })) || []
                        )
                        .sort((a, b) => {
                            // Sort by skill name first, then by subtype
                            const skillA = SKILL_MAP[a.skillId];
                            const skillB = SKILL_MAP[b.skillId];

                            if (!skillA || !skillB) return 0;

                            const nameCompare = skillA.name.localeCompare(skillB.name);
                            if (nameCompare !== 0) return nameCompare;

                            // If same skill, sort by subtype
                            if (a.subtypeId === null && b.subtypeId === null) return 0;
                            if (a.subtypeId === null) return -1;
                            if (b.subtypeId === null) return 1;

                            // Get subtype names for comparison
                            const subtypesA = getAppliesToSubIdSelectOptions(EntityAppliesToType.Skill, a.skillId);
                            const subtypesB = getAppliesToSubIdSelectOptions(EntityAppliesToType.Skill, b.skillId);

                            const subtypeA = subtypesA.find(s => s.value === a.subtypeId);
                            const subtypeB = subtypesB.find(s => s.value === b.subtypeId);

                            if (!subtypeA || !subtypeB) return 0;

                            return subtypeA.label.localeCompare(subtypeB.label);
                        });

                    if (classSkillEntries.length > 0) {
                        return (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                {classSkillEntries.map((entry) => {
                                    const skill = SKILL_MAP[entry.skillId];
                                    const skillDetail = skillDetails[entry.skillId];
                                    const isLoading = loadingSkills.has(entry.skillId);

                                    if (!skill) return null;

                                    // Format the header with subtype information
                                    const abilityAbbr = ABILITY_MAP[skill.abilityId]?.abbreviation || 'Unknown';
                                    let skillName = skill.name;

                                    if (entry.subtypeId !== null) {
                                        if (entry.subtypeId === -1) {
                                            skillName += ' (All)';
                                        } else {
                                            // Get subtype name using the utility function
                                            const subtypeOptions = getAppliesToSubIdSelectOptions(EntityAppliesToType.Skill, entry.skillId);
                                            const subtype = subtypeOptions.find(opt => opt.value === entry.subtypeId);
                                            if (subtype) {
                                                skillName += ` (${subtype.label})`;
                                            }
                                        }
                                    }

                                    const headerText = skill.trainedOnly
                                        ? `${skillName} (${abilityAbbr}; Trained only)`
                                        : `${skillName} (${abilityAbbr})`;

                                    return (
                                        <div key={`${entry.skillId}-${entry.subtypeId || 'base'}`} className="border border-gray-200 rounded-lg p-3 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-medium text-base flex-1">{headerText}</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        // Remove the specific skill entry with subtype
                                                        if (setFeatureProgressions) {
                                                            const updatedProgressions = featureProgressions.map(prog => {
                                                                if (prog.featureId === SpecialFeatureId.ClassSkill) {
                                                                    return {
                                                                        ...prog,
                                                                        entities: prog.entities?.filter(entity =>
                                                                            !(entity.appliesTo === EntityAppliesToType.Skill &&
                                                                                entity.appliesToId === entry.skillId &&
                                                                                entity.appliesToSubId === entry.subtypeId)
                                                                        ) || []
                                                                    };
                                                                }
                                                                return prog;
                                                            });
                                                            setFeatureProgressions(updatedProgressions);
                                                        }
                                                    }}
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
                                                            `skill-${entry.skillId}-description`
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
                        );
                    } else {
                        return (
                            <div className="text-center py-6 border border-dashed border-gray-300 rounded-md dark:border-gray-600">
                                <p className="text-gray-500 dark:text-gray-400">
                                    No class skills added yet. Use the dropdown above to add skills.
                                </p>
                            </div>
                        );
                    }
                })()}
            </div>
        </div>
    );
}
