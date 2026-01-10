import { useQueryClient } from '@tanstack/react-query';
import { TrashIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect } from 'react';

import { getAppliesToSubIdSelectOptions } from '@/components/feature-system/FeatureProgressionDetailEdit/utils';
import { CustomNestedContextSelect, type NestedSelectOption } from '@/components/forms';
import { renderCellValue } from '@/components/generic-list/columnUtils';
import { ClassSkillService } from '@/features/class/ClassSkillService';
import { NumericIdMapping } from '@/lib/numeric-id-mapping';
import { SkillQueryHooks } from '@/services/query/SkillQueryHooks';
import { getSkillNameFromCache } from '@/services/cache/IdMapHelpers';
import { CacheQueryHooks } from '@/services/query/CacheQueryHooks';
import type { GetSkillResponse, FeatureProgression } from '@shared/schema';
import {
    SKILL_LIST,
    ABILITY_MAP,
    SpecialFeatureId,
    EntityAppliesToType,
    type SkillDetail,
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
    const queryClient = useQueryClient();
    const [skillDetails, setSkillDetails] = useState<Record<number, GetSkillResponse>>({});
    const [loadingSkills, setLoadingSkills] = useState<Set<number>>(new Set());

    // Get class skills to determine which skills need to be loaded
    const classSkills = ClassSkillService.getClassSkills(featureProgressions as FeatureProgression[]);

    // Get all skills and filter for the ones we need
    const { data: allSkills, isLoading: isLoadingAllSkills } = SkillQueryHooks.useGetSkills({});

    // Update skill details when all skills are loaded
    useEffect(() => {
        if (allSkills?.results) {
            const newSkillDetails: Record<number, GetSkillResponse> = {};

            classSkills.forEach(skillId => {
                const skill = allSkills.results.find(s => s.id === skillId);
                if (skill) {
                    newSkillDetails[skillId] = skill;
                }
            });

            setSkillDetails(prev => ({ ...prev, ...newSkillDetails }));
        }

        // Set loading state
        if (isLoadingAllSkills) {
            setLoadingSkills(new Set(classSkills));
        } else {
            setLoadingSkills(new Set());
        }
    }, [allSkills, isLoadingAllSkills, classSkills]);

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
    const getNestedSkillOptions = (): NestedSelectOption<SkillDetail>[] => {
        const options: NestedSelectOption<SkillDetail>[] = [];

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
                    !isSkillSubtypeAdded(skillId, subtype.id)
                );

                if (availableSubtypes.length > 0) {
                    options.push({
                        id: NumericIdMapping.getGroupId(skillId),
                        name: skill.name,
                        disabled: true, // Group header is not selectable
                        children: availableSubtypes.map(subtype => ({
                            id: NumericIdMapping.getSubtypeId(skillId, subtype.id),
                            name: subtype.name
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
                            const skillAName = getSkillNameFromCache(queryClient, a.skillId) || '';
                            const skillBName = getSkillNameFromCache(queryClient, b.skillId) || '';

                            if (!skillAName || !skillBName) return 0;

                            const nameCompare = skillAName.localeCompare(skillBName);
                            if (nameCompare !== 0) return nameCompare;

                            // If same skill, sort by subtype
                            if (a.subtypeId === null && b.subtypeId === null) return 0;
                            if (a.subtypeId === null) return -1;
                            if (b.subtypeId === null) return 1;

                            // Get subtype names for comparison
                            const subtypesA = getAppliesToSubIdSelectOptions(EntityAppliesToType.Skill, a.skillId);
                            const subtypesB = getAppliesToSubIdSelectOptions(EntityAppliesToType.Skill, b.skillId);

                            const subtypeA = subtypesA.find(s => s.id === a.subtypeId);
                            const subtypeB = subtypesB.find(s => s.id === b.subtypeId);

                            if (!subtypeA || !subtypeB) return 0;

                            return subtypeA.name.localeCompare(subtypeB.name);
                        });

                    if (classSkillEntries.length > 0) {
                        return (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                {classSkillEntries.map((entry) => {
                                    const skillName = getSkillNameFromCache(queryClient, entry.skillId);
                                    const skillDetail = skillDetails[entry.skillId];
                                    const isLoading = loadingSkills.has(entry.skillId);

                                    if (!skillName) return null;

                                    // Format the header with subtype information
                                    const abilityAbbr = skillDetail?.abilityId ? ABILITY_MAP[skillDetail.abilityId]?.abbreviation || 'Unknown' : 'Unknown';
                                    let formattedSkillName = skillName;

                                    if (entry.subtypeId !== null) {
                                        if (entry.subtypeId === -1) {
                                            formattedSkillName += ' (All)';
                                        } else {
                                            // Get subtype name using the utility function
                                            const subtypeOptions = getAppliesToSubIdSelectOptions(EntityAppliesToType.Skill, entry.skillId);
                                            const subtype = subtypeOptions.find(opt => opt.id === entry.subtypeId);
                                            if (subtype) {
                                                formattedSkillName += ` (${subtype.name})`;
                                            }
                                        }
                                    }

                                    const headerText = skillDetail?.trainedOnly
                                        ? `${formattedSkillName} (${abilityAbbr}; Trained only)`
                                        : `${formattedSkillName} (${abilityAbbr})`;

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
