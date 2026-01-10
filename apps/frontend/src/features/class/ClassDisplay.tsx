import { useQueryClient } from '@tanstack/react-query';
import pluralize from 'pluralize';
import React from 'react';

import { EntityLink } from '@/components/entity-link';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { generateClassProgression } from '@/lib/ClassProgression';
import { ClassProgressionTable } from '@/lib/ClassProgressionTable';
import { displayStrategyFactory } from '@/lib/formatters';
import { usePrecacheFeatureEntities } from '@/lib/formatters/hooks/usePrecacheFeatureEntities';
import { useCacheFunctions } from '@/services/cache';
import { DnDClass, ClassVariant } from '@shared/schema';
import {
    DisplayType,
    RPG_DICE,
    EDITION_MAP,
    ABILITY_MAP,
    SpecialFeatureId,
    CASTING_TYPE_MAP,
} from '@shared/static-data';
import { GetSourceDisplay } from '@shared/utils';

interface ClassDisplayProps {
    cls: DnDClass;
    variantData?: ClassVariant | null;
    showHeader?: boolean;
    showActions?: boolean;
    onBack?: () => void;
    onEdit?: () => void;
    isAdmin?: boolean;
    fromListParams?: string;
}

export function ClassDisplay({
    cls,
    variantData,
    showHeader = true,
    showActions = false,
    onBack,
    onEdit,
    isAdmin = false,
    fromListParams: _fromListParams = ''
}: ClassDisplayProps): React.JSX.Element {
    const queryClient = useQueryClient();
    const { getSpellNameFromCache } = useCacheFunctions();

    // Precache all entities referenced in feature progressions
    usePrecacheFeatureEntities(cls?.features);

    if (!cls) {
        return <div>Error: Class not found</div>;
    }

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
                                <p><strong>Casting Type:</strong> {cls.castingType ? CASTING_TYPE_MAP[cls.castingType]?.name || 'Unknown' : 'None'}</p>
                            </div>
                            <div className="text-right">
                                <p><strong>Edition:</strong> {EDITION_MAP[cls.editionId]?.abbreviation}</p>
                                {cls.sourceBookInfo && cls.sourceBookInfo.length > 0 && (
                                    <p><strong>Source:</strong> {GetSourceDisplay(cls.sourceBookInfo, true)}</p>
                                )}
                                <p><strong>Display:</strong> {cls.isVisible ? 'Yes' : 'No'}</p>
                                <p><strong>Prestige Class:</strong> {cls.isPrestige ? 'Yes' : 'No'}</p>
                                <p><strong>Caster:</strong> {cls.canCastSpells ? 'Yes' : 'No'}</p>
                                {cls.canCastSpells && (
                                    <p><strong>Divine Caster:</strong> {cls.isDivine ? 'Yes' : 'No'}</p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="mt-3 p-2 w-full prose-custom">
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
                                spellsKnownProgression: cls.spellsKnownProgression !== null ? cls.spellsKnownProgression : undefined,
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
                        const classSkillProgressions = cls.features?.filter(progression =>
                            progression.featureId === SpecialFeatureId.ClassSkill
                        ) || [];

                        if (classSkillProgressions.length > 0) {
                            // Use display strategy to format class skills
                            const strategy = displayStrategyFactory.createStrategy(DisplayType.Detail);
                            const result = strategy.format(classSkillProgressions, undefined, true);
                            return (
                                <div className="mt-4">
                                    <h3 className="text-lg font-semibold mb-2">Class Skills</h3>
                                    <div className="flex flex-wrap gap-2 p-2 border border-gray-200 dark:border-gray-600 rounded-md">
                                        <span className="text-sm">
                                            {result.levelEntries[0]?.items.length > 0 ? result.levelEntries[0].items[0].formattedValue : result.levelEntries[0]?.description}
                                        </span>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })()}

                    {/* Class Proficiencies Section */}
                    {(() => {
                        // Find all proficiency progressions (should be only one, but be defensive)
                        const proficiencyProgressions = cls.features?.filter(progression =>
                            progression.featureId === SpecialFeatureId.ClassProficiency
                        ) || [];

                        if (proficiencyProgressions.length > 0) {
                            // Use display strategy to format proficiencies
                            const strategy = displayStrategyFactory.createStrategy(DisplayType.Detail);
                            const result = strategy.format(proficiencyProgressions, undefined, false);
                            return (
                                <div className="mt-4">
                                    <h3 className="text-lg font-semibold mb-2">Class Proficiencies</h3>
                                    <div className="flex flex-wrap gap-2 p-2 border border-gray-200 dark:border-gray-600 rounded-md">
                                        <span className="text-sm">
                                            {result.levelEntries[0]?.items.length > 0 ? result.levelEntries[0].items[0].formattedValue : result.levelEntries[0]?.description}
                                        </span>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })()}

                    {/* Added Spells Section (for variant classes) */}
                    {variantData?.spellOverrides && variantData.spellOverrides.length > 0 && (() => {
                        // Group spell overrides by level
                        const addedSpells = variantData.spellOverrides.filter(override => override.level > 0);
                        const removedSpells = variantData.spellOverrides.filter(override => override.level === -1);

                        // Group added spells by level
                        const addedByLevel = addedSpells.reduce((acc, override) => {
                            if (!acc[override.level]) {
                                acc[override.level] = [];
                            }
                            acc[override.level].push(override.spellId);
                            return acc;
                        }, {} as Record<number, number[]>);

                        // Group removed spells by level (they're all level -1, but we'll show them as "removed")
                        const removedSpellIds = removedSpells.map(override => override.spellId);

                        return (
                            <>
                                {Object.keys(addedByLevel).length > 0 && (
                                    <div className="mt-4">
                                        <h3 className="text-lg font-semibold mb-2">Added Spells</h3>
                                        <div className="flex flex-wrap gap-2 p-2 border border-gray-200 dark:border-gray-600 rounded-md">
                                            <span className="text-sm">
                                                {Object.entries(addedByLevel)
                                                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                                    .map(([level, spellIds], levelIndex) => {
                                                        const levelText = level === '1' ? '1st' : level === '2' ? '2nd' : level === '3' ? '3rd' : `${level}th`;
                                                        const spellNames = (spellIds as number[]).map(id => {
                                                            const spellName = getSpellNameFromCache(id) || `Unknown Spell (${id})`;
                                                            return (
                                                                <EntityLink key={id} entityType="spell" entityId={id} href={`/spells/${id}`}>
                                                                    {spellName}
                                                                </EntityLink>
                                                            );
                                                        });
                                                        return (
                                                            <span key={level}>
                                                                {levelText} - {spellNames.map((link, index) => (
                                                                    <React.Fragment key={index}>
                                                                        {link}
                                                                        {index < spellNames.length - 1 && ', '}
                                                                    </React.Fragment>
                                                                ))}
                                                                {levelIndex < Object.entries(addedByLevel).length - 1 && '; '}
                                                            </span>
                                                        );
                                                    })}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {removedSpellIds.length > 0 && (
                                    <div className="mt-4">
                                        <h3 className="text-lg font-semibold mb-2">Removed Spells</h3>
                                        <div className="flex flex-wrap gap-2 p-2 border border-gray-200 dark:border-gray-600 rounded-md">
                                            <span className="text-sm">
                                                {removedSpellIds.map((id, index) => {
                                                    const spellName = getSpellNameFromCache(id) || `Unknown Spell (${id})`;
                                                    return (
                                                        <React.Fragment key={id}>
                                                            <EntityLink entityType="spell" entityId={id} href={`/spells/${id}`}>
                                                                {spellName}
                                                            </EntityLink>
                                                            {index < removedSpellIds.length - 1 && ', '}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </>
                        );
                    })()}

                    {/* Class Features Section */}
                    {(() => {
                        // Filter out progressions that contain skills and proficiencies
                        const actualFeatures = cls.features?.filter(progression => {
                            // Check if this progression contains class skills
                            const hasClassSkills = progression.featureId === SpecialFeatureId.ClassSkill;

                            // Check if this progression contains proficiencies
                            const hasProficiencies = progression.featureId === SpecialFeatureId.ClassProficiency;

                            // Exclude progressions with skills or proficiencies
                            return !hasClassSkills && !hasProficiencies;
                        }) || [];

                        if (actualFeatures.length > 0) {
                            // Use display strategy to format features
                            const strategy = displayStrategyFactory.createStrategy(DisplayType.Detail);
                            const result = strategy.format(actualFeatures);

                            return (
                                <div className="mt-4">
                                    <h3 className="text-lg font-semibold mb-2">Class Features</h3>
                                    <div className="space-y-4">
                                        {/* Render level entries */}
                                        {result.levelEntries.map((levelEntry) => (
                                            <div key={levelEntry.level} className="border border-gray-200 dark:border-gray-600 rounded-md p-3">
                                                <h4 className="text-md font-medium mb-2">Level {levelEntry.level}</h4>
                                                <div className="space-y-2">
                                                    {levelEntry.items?.map((item, index) => {
                                                        // Find the corresponding feature for this item
                                                        const feature = actualFeatures.find(f => f.featureId === item.featureId);
                                                        if (!feature) {
                                                            return null;
                                                        }

                                                        // Determine whether to show description or name
                                                        const shouldShowDescription = item.descriptionLevel === levelEntry.level;
                                                        return (
                                                            <div key={`item-${index}`} className="p-2">
                                                                <div className="text-sm">
                                                                    {shouldShowDescription ? (
                                                                        // Show full description for first occurrence
                                                                        <ProcessMarkdown markdown={feature.feature.description} id={`feature-${feature.featureId}`}
                                                                            userVars={{
                                                                                classname: cls.name.toLowerCase(),
                                                                                classplural: pluralize(cls.name),
                                                                                classplurallower: pluralize(cls.name).toLowerCase(),
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        // Show just the feature name for subsequent occurrences
                                                                        <strong>{feature.feature.name}</strong>
                                                                    )}
                                                                    {item.formattedValue && (
                                                                        <span className="ml-2">{item.formattedValue}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
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
