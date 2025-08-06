import React from 'react';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { ClassProgressionTable } from '@/lib/ClassProgressionTable';
import { generateClassProgression } from '@/lib/ClassProgression';
import { GetClassResponse } from '@shared/schema';
import { RPG_DICE, EDITION_MAP, ABILITY_MAP, _SKILL_MAP, FeatureModifierType, FeatureAppliesToType } from '@shared/static-data';
import { formatClassProficiencies, formatProgression } from '@/lib/Formatters';

interface ClassDisplayProps {
    cls: GetClassResponse;
    showHeader?: boolean;
    showActions?: boolean;
    onBack?: () => void;
    onEdit?: () => void;
    isAdmin?: boolean;
    fromListParams?: string;
}

export function ClassDisplay({
    cls,
    showHeader = true,
    showActions = false,
    onBack,
    onEdit,
    isAdmin = false,
    fromListParams = ''
}: ClassDisplayProps): React.JSX.Element {
    return (
        <div className={showHeader ? "pt-8" : ""}>
            <div className={showHeader ? "w-4/5 mx-auto border-2 border-gray-400 dark:border-gray-600 rounded-lg shadow-lg p-1" : ""}>
                <div className={showHeader ? "p-3 bg-content border-content rounded-lg border w-full" : ""}>
                    {showHeader && (
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h1 className="text-2xl font-bold mb-2">{cls.name}</h1>
                                <p><strong>Hit Die:</strong> {RPG_DICE[cls.hitDie]?.name}</p>
                                <p><strong>Skill Points:</strong> {cls.skillPoints}</p>
                                <p><strong>Casting Ability:</strong> {ABILITY_MAP[cls.castingAbilityId]?.name || 'None'}</p>
                            </div>
                            <div className="text-right">
                                <p><strong>Edition:</strong> {EDITION_MAP[cls.editionId]?.abbreviation}</p>
                                <p><strong>Display:</strong> {cls.isVisible ? 'Yes' : 'No'}</p>
                                <p><strong>Prestige Class:</strong> {cls.isPrestige ? 'Yes' : 'No'}</p>
                                <p><strong>Caster:</strong> {cls.canCastSpells ? 'Yes' : 'No'}</p>
                            </div>
                        </div>
                    )}

                    <div className="mt-3 p-2 w-full prose dark:prose-invert">
                        <ProcessMarkdown markdown={cls.description || ''} id={`${cls.name.toLowerCase()}-class-description`} />
                    </div>

                    <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-2">Class Progression</h3>
                        {(() => {
                            const progressionConfig = {
                                babProgression: cls.babProgression,
                                fortProgression: cls.fortProgression,
                                refProgression: cls.refProgression,
                                willProgression: cls.willProgression,
                                spellcastingProgression: cls.spellcastingProgression !== null ? cls.spellcastingProgression : undefined,
                            };
                            const progression = generateClassProgression(progressionConfig);
                            return (
                                <ClassProgressionTable
                                    progression={progression}
                                    className="mt-2"
                                />
                            );
                        })()}
                    </div>

                    {/* Class Skills Section */}
                    {(() => {
                        const classSkills = cls.features?.flatMap(progression =>
                            progression.modifiers?.filter(modifier =>
                                modifier.modifierType === FeatureModifierType.ClassSkill
                            ).map(modifier => ({
                                skillId: progression.appliesTo,
                                modifier: modifier
                            })) || []
                        ) || [];

                        if (classSkills.length > 0) {
                            return (
                                <div className="mt-4">
                                    <h3 className="text-lg font-semibold mb-2">Class Skills</h3>
                                    <div className="flex flex-wrap gap-2 p-2 border border-gray-200 dark:border-gray-600 rounded-md">
                                        {classSkills.map((skill, index) => (
                                            <span key={skill.skillId} className="text-sm">
                                                {_SKILL_MAP[skill.skillId]?.name || 'Unknown Skill'}
                                                {index < classSkills.length - 1 && ','}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })()}

                    {/* Class Proficiencies Section */}
                    {(() => {
                        // Extract proficiencies in the same format as ClassEdit.tsx
                        const classProficiencies = cls.features?.flatMap(progression =>
                            progression.choices?.filter(choice =>
                                choice.choiceType === 'Feat' && progression.appliesToType === FeatureAppliesToType.Item
                            ).map(choice => ({
                                featId: choice.featId || 0,
                                itemId: progression.appliesTo || 0,
                                featName: choice.feat?.name || `Feat ${choice.featId}`, // Use actual feat name if available
                                itemName: undefined // We don't have item names in display mode
                            })) || []
                        ) || [];

                        if (classProficiencies.length > 0) {
                            const formattedProficiencies = formatClassProficiencies(classProficiencies);
                            return (
                                <div className="mt-4">
                                    <h3 className="text-lg font-semibold mb-2">Class Proficiencies</h3>
                                    <div className="flex flex-wrap gap-2 p-2 border border-gray-200 dark:border-gray-600 rounded-md">
                                        <span className="text-sm">
                                            {formattedProficiencies}
                                        </span>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })()}

                    {/* Class Features Section */}
                    {(() => {
                        // Filter out progressions that contain skills and proficiencies
                        const actualFeatures = cls.features?.filter(progression => {
                            // Check if this progression contains class skills
                            const hasClassSkills = progression.modifiers?.some(modifier =>
                                modifier.modifierType === FeatureModifierType.ClassSkill
                            );

                            // Check if this progression contains proficiencies
                            const hasProficiencies = progression.choices?.some(choice =>
                                choice.choiceType === 'Feat' && progression.appliesToType === FeatureAppliesToType.Item
                            );

                            // Exclude progressions with skills or proficiencies
                            return !hasClassSkills && !hasProficiencies;
                        }) || [];

                        if (actualFeatures.length > 0) {
                            return (
                                <div className="mt-4">
                                    <h3 className="text-lg font-semibold mb-2">Class Features</h3>
                                    <div className="space-y-4">
                                        {(() => {
                                            // Group features by level first
                                            const groupedByLevel = actualFeatures.reduce((acc, progression) => {
                                                const level = progression.level;
                                                if (!acc[level]) {
                                                    acc[level] = [];
                                                }
                                                acc[level].push(progression);
                                                return acc;
                                            }, {} as Record<number, typeof actualFeatures>);

                                            // Track which features we've already shown descriptions for
                                            const shownFeatureDescriptions = new Set<number>();

                                            // Sort levels and render each group
                                            return Object.keys(groupedByLevel)
                                                .sort((a, b) => parseInt(a) - parseInt(b))
                                                .map(level => (
                                                    <div key={level} className="border border-gray-200 dark:border-gray-600 rounded-md p-3">
                                                        <h4 className="text-md font-medium mb-2">Level {level}</h4>
                                                        <div className="space-y-2">
                                                            {/* Features */}
                                                            {groupedByLevel[parseInt(level)].map((progression, index) => {
                                                                const feature = progression.feature;
                                                                const isFirstOccurrence = !shownFeatureDescriptions.has(feature?.id || 0);

                                                                // Mark this feature as shown if it's the first occurrence
                                                                if (isFirstOccurrence && feature?.id) {
                                                                    shownFeatureDescriptions.add(feature.id);
                                                                }

                                                                return (
                                                                    <div key={`feature-${index}`} className="p-2">
                                                                        {/* Show feature description only on first occurrence */}
                                                                        {isFirstOccurrence && feature?.description && (
                                                                            <ProcessMarkdown
                                                                                markdown={feature.description}
                                                                                id={`${cls.name.toLowerCase()}-feature-${feature.id}`}
                                                                                userVars={{
                                                                                    classname: cls.name.toLowerCase()
                                                                                }}
                                                                            />
                                                                        )}

                                                                        {/* Show progression details only if there are modifiers, effects, or choices */}
                                                                        {(() => {
                                                                            const hasDetails = (progression.modifiers && progression.modifiers.length > 0) ||
                                                                                (progression.effects && progression.effects.length > 0) ||
                                                                                (progression.choices && progression.choices.length > 0);

                                                                            if (hasDetails) {
                                                                                const formatted = formatProgression(progression);
                                                                                return (
                                                                                    <div className="mt-2 space-y-1">
                                                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                                                            <span className="font-medium">{formatted.label}</span>
                                                                                            {formatted.value && <span> {formatted.value}</span>}
                                                                                            {formatted.note && <span> ({formatted.note})</span>}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            }
                                                                            return null;
                                                                        })()}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ));
                                        })()}
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })()}

                    {/* Actions */}
                    {showActions && (
                        <div className="mt-4 text-right">
                            {onBack && (
                                <button
                                    type="button"
                                    onClick={onBack}
                                    className="inline-block px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 border dark:border-gray-500"
                                >
                                    Back to List
                                </button>
                            )}
                            {isAdmin && onEdit && (
                                <button
                                    type="button"
                                    onClick={onEdit}
                                    className="ml-4 inline-block px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 border dark:border-gray-500"
                                >
                                    Edit Class
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 
