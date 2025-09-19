import { TrashIcon } from '@heroicons/react/24/outline';
import React from 'react';

import { renderCellValue } from '@/components/generic-list/columnUtils';
import { displayStrategyFactory } from '@/lib/formatters';
import { FeaturePrerequisite, FeatureProgression } from '@shared/schema';
import { DisplayType, FeaturePrerequisiteType, ABILITY_MAP, SKILL_MAP } from '@shared/static-data';

import { FeatureDisplayProps } from './types';

export function FeatureDisplay({
    feature,
    progressions,
    onEditProgression,
    onRemoveProgression,
    onAddProgression,
    showAddProgressionButton = true,
    className = ''
}: FeatureDisplayProps): React.JSX.Element {
    // Helper function to format prerequisites for display
    const formatPrerequisites = (prerequisites: FeaturePrerequisite[]) => {
        if (!prerequisites || prerequisites.length === 0) return 'None';

        return prerequisites.map((prereq, index) => {
            let text = '';

            switch (prereq.type) {
                case FeaturePrerequisiteType.SkillRanks: {
                    const skillName = prereq.appliesToId ? SKILL_MAP[prereq.appliesToId]?.name || 'Unknown Skill' : 'Skill';
                    text = `${skillName} ${prereq.minValue} ranks`;
                    break;
                }
                case FeaturePrerequisiteType.AbilityScore: {
                    const abilityName = prereq.appliesToId ? ABILITY_MAP[prereq.appliesToId]?.abbreviation || 'Unknown' : 'Ability';
                    text = `${abilityName} ${prereq.minValue}+`;
                    break;
                }
                case FeaturePrerequisiteType.CharacterLevel:
                    text = `Character Level ${prereq.minValue}+`;
                    break;
                case FeaturePrerequisiteType.ClassLevel:
                    text = `Class Level ${prereq.minValue}+`;
                    break;
                case FeaturePrerequisiteType.BaseAttackBonus:
                    text = `BAB ${prereq.minValue}+`;
                    break;
                case FeaturePrerequisiteType.Other:
                    text = `Other Requirement: ${prereq.minValue}`;
                    break;
                default:
                    text = `Requirement: ${prereq.minValue}`;
            }

            return index === prerequisites.length - 1 ? text : text + ', ';
        }).join('');
    };

    const handleEditProgression = (progression: FeatureProgression) => {
        onEditProgression?.(progression);
    };

    const handleRemoveProgression = (progressionId: number) => {
        onRemoveProgression?.(progressionId);
    };

    const handleAddProgression = () => {
        onAddProgression?.(feature);
    };

    return (
        <div className={`border border-gray-200 rounded-md dark:border-gray-600 ${className}`}>
            <div className="p-3 bg-gray-50 dark:bg-gray-700">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="text-lg font-medium">
                            {feature?.name || `Feature ${feature?.id || 'Unknown'}`}
                            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                                ({feature?.slug || `feature-${feature?.id || 'unknown'}`})
                            </span>
                        </div>
                    </div>
                    {/* Show prerequisites if they exist */}
                    {feature.prerequisites && feature.prerequisites.length > 0 && (
                        <div className="ml-4 p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-md flex-shrink-0">
                            <p className="text-xs text-slate-700 dark:text-slate-300">
                                <strong>Prerequisites:</strong> {formatPrerequisites(feature.prerequisites)}
                            </p>
                        </div>
                    )}
                </div>
                {/* Show feature description */}
                {feature?.description && (
                    <div className="mt-2">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                            {renderCellValue(
                                feature.description,
                                { truncate: 300, isMarkdown: true },
                                `feature-${feature?.id || 'unknown'}-description`
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Feature Progressions */}
            <div className="p-2">
                <div className="flex flex-wrap gap-2 items-start">
                    {/* Use display strategy for ALL progressions */}
                    {progressions.map((progression, progIndex) => (
                        <div key={progIndex} className="flex items-start gap-1">
                            <button
                                type="button"
                                onClick={() => handleEditProgression(progression)}
                                className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-left"
                                title="Edit progression details"
                            >
                                {(() => {
                                    const strategy = displayStrategyFactory.createStrategy(DisplayType.Edit);
                                    const result = strategy.format(progression);
                                    return result.formattedValue || 'No preview';
                                })()}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleRemoveProgression(progression.id)}
                                className="text-red-500 hover:text-red-700"
                                title="Remove Progression"
                            >
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                    {showAddProgressionButton && (
                        <button
                            type="button"
                            onClick={handleAddProgression}
                            className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Add Progression
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
