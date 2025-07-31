import React from 'react';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { ClassProgressionTable } from '@/lib/ClassProgressionTable';
import { generateClassProgression } from '@/lib/ClassProgression';
import { GetClassResponse } from '@shared/schema';
import { RPG_DICE, EDITION_MAP, ABILITY_MAP, _SKILL_MAP } from '@shared/static-data';
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
                                spellProgression: cls.spellProgression !== null ? cls.spellProgression : undefined,
                                spellsKnown: cls.spellsKnown !== null ? cls.spellsKnown : undefined,
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
                    {cls.skills && cls.skills.length > 0 && (
                        <div className="mt-4">
                            <h3 className="text-lg font-semibold mb-2">Class Skills</h3>
                            <div className="flex flex-wrap gap-2 p-2 border border-gray-200 dark:border-gray-600 rounded-md">
                                {cls.skills.map((skill, index) => (
                                    <span key={skill.skillId} className="text-sm">
                                        {_SKILL_MAP[skill.skillId]?.name || 'Unknown Skill'}
                                        {index < cls.skills!.length - 1 && ','}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Class Proficiencies Section */}
                    {cls.proficiencies && cls.proficiencies.length > 0 && (
                        <div className="mt-4">
                            <h3 className="text-lg font-semibold mb-2">Class Proficiencies</h3>
                            <div className="flex flex-wrap gap-2 p-2 border border-gray-200 dark:border-gray-600 rounded-md">
                                {formatClassProficiencies(cls.proficiencies)}
                            </div>
                        </div>
                    )}

                    {/* Class Features Section */}
                    {cls.features && cls.features.length > 0 && (
                        <div className="mt-4">
                            <h3 className="text-lg font-semibold mb-2">Class Features</h3>
                            <div className="space-y-4">
                                {(() => {
                                    // Group features by level
                                    const groupedFeatures = cls.features.reduce((acc, feature) => {
                                        const level = feature.level;
                                        if (!acc[level]) {
                                            acc[level] = { features: [], progressions: [] };
                                        }
                                        acc[level].features.push(feature);
                                        return acc;
                                    }, {} as Record<number, { features: typeof cls.features, progressions: any[] }>);

                                    // Add progressions to their respective levels, but suppress if feature is first granted at same level
                                    if (cls.featureProgression && cls.featureProgression.length > 0) {
                                        cls.featureProgression.forEach(progression => {
                                            const level = progression.level;
                                            if (!groupedFeatures[level]) {
                                                groupedFeatures[level] = { features: [], progressions: [] };
                                            }

                                            // Check if this feature is first granted at this level
                                            const featureFirstGrantedAtLevel = cls.features?.some(feature =>
                                                feature.featureSlug === progression.featureSlug && feature.level === level
                                            );

                                            // Only add progression if feature is not first granted at this level
                                            if (!featureFirstGrantedAtLevel) {
                                                groupedFeatures[level].progressions.push(progression);
                                            }
                                        });
                                    }

                                    // Sort levels and render each group
                                    return Object.keys(groupedFeatures)
                                        .sort((a, b) => parseInt(a) - parseInt(b))
                                        .map(level => (
                                            <div key={level} className="border border-gray-200 dark:border-gray-600 rounded-md p-3">
                                                <h4 className="text-md font-medium mb-2">Level {level}</h4>
                                                <div className="space-y-2">
                                                    {/* Features */}
                                                    {groupedFeatures[parseInt(level)].features.map((feature, index) => (
                                                        <div key={`feature-${index}`} className="p-2">
                                                            <ProcessMarkdown
                                                                markdown={feature.description}
                                                                id={`${cls.name.toLowerCase()}-feature-${level}-${index}`}
                                                                userVars={{
                                                                    classname: cls.name.toLowerCase()
                                                                }}
                                                            />
                                                        </div>
                                                    ))}
                                                    {/* Progressions */}
                                                    {groupedFeatures[parseInt(level)].progressions.map((progression, index) => {
                                                        const formatted = formatProgression(progression);
                                                        return (
                                                            <div key={`progression-${index}`} className="p-2">
                                                                <span className="font-semibold">{formatted.label}</span>
                                                                {formatted.value && ` ${formatted.value}`}
                                                                {formatted.note && ` (${formatted.note})`}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ));
                                })()}
                            </div>
                        </div>
                    )}

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
