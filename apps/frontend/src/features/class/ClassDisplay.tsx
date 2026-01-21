import { useQueryClient } from '@tanstack/react-query';
import pluralize from 'pluralize';
import React, { useMemo } from 'react';

import { EntityLink } from '@/components/entity-link';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { generateClassProgression } from '@/lib/ClassProgression';
import { ClassProgressionTable } from '@/lib/ClassProgressionTable';
import { extractClassMechanics } from '@/lib/feature-extraction/classMechanicsExtractor';
import { displayStrategyFactory } from '@/lib/formatters';
import { usePrecacheFeatureEntities } from '@/lib/formatters/hooks/usePrecacheFeatureEntities';
import { useCacheFunctions, getSourceDisplay } from '@/services/cache';
import { DnDClass } from '@shared/schema';
import {
    DisplayType,
    RPG_DICE,
    EDITION_MAP,
    ABILITY_MAP,
    CASTING_TYPE_MAP,
    EntityAppliesToType,
    EntityType,
    FeatureSourceType,
} from '@shared/static-data';

interface ClassDisplayProps {
    cls: DnDClass;
    showHeader?: boolean;
    showActions?: boolean;
    onBack?: () => void;
    onEdit?: () => void;
    isAdmin?: boolean;
    fromListParams?: string;
    lockStatus?: { locked: boolean; lockedBy?: number };
    currentUserId?: number;
}

export function ClassDisplay({
    cls,
    showHeader = true,
    showActions = false,
    onBack,
    onEdit,
    isAdmin = false,
    fromListParams: _fromListParams = '',
    lockStatus,
    currentUserId
}: ClassDisplayProps): React.JSX.Element {
    const queryClient = useQueryClient();
    const { getSpellNameFromCache } = useCacheFunctions();

    // Precache all entities referenced in feature features
    usePrecacheFeatureEntities(cls?.features);

    // Extract mechanics from feature features
    const mechanics = useMemo(() => {
        if (cls.features && cls.features.length > 0) {
            const classId = (cls as { id?: number }).id;
            return extractClassMechanics(cls.features, classId);
        }
        // Return null values if no features
        return {
            hitDie: null,
            skillPoints: null,
            babProgression: null,
            fortProgression: null,
            refProgression: null,
            willProgression: null,
        };
    }, [cls]);

    // Extract casting ability and type from feature features
    const castingInfo = useMemo(() => {
        if (!cls.features) {
            return { castingAbilityId: null, castingType: null };
        }
        const classId = (cls as { id?: number }).id;
        // Find level 1 class feature
        const classLevel1Progression = cls.features.find(
            p => p.sourceType === FeatureSourceType.Class &&
                (classId ? (p as { classes?: Array<{ classId: number }> }).classes?.some(c => c.classId === classId) : true) &&
                p.level === 1
        );
        if (classLevel1Progression?.entities) {
            const castingAbilityEntity = classLevel1Progression.entities.find(
                e => e.appliesTo === EntityAppliesToType.CastingAbility
            );
            const castingTypeEntity = classLevel1Progression.entities.find(
                e => e.appliesTo === EntityAppliesToType.CastingType
            );
            return {
                castingAbilityId: castingAbilityEntity?.appliesToId ?? null,
                castingType: castingTypeEntity?.appliesToId ?? null,
            };
        }
        return { castingAbilityId: null, castingType: null };
    }, [cls]);

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
                                <p><strong>Hit Die:</strong> {RPG_DICE[mechanics.hitDie ?? 0]?.name}</p>
                                <p><strong>Skill Points:</strong> {mechanics.skillPoints ?? 0}</p>
                                <p><strong>Casting Ability:</strong> {castingInfo.castingAbilityId ? ABILITY_MAP[castingInfo.castingAbilityId]?.name || 'None' : 'None'}</p>
                                <p><strong>Casting Type:</strong> {castingInfo.castingType ? CASTING_TYPE_MAP[castingInfo.castingType]?.name || 'Unknown' : 'None'}</p>
                            </div>
                            <div className="text-right">
                                <p><strong>Edition:</strong> {EDITION_MAP[cls.editionId]?.abbreviation}</p>
                                {cls.sourceBookInfo && cls.sourceBookInfo.length > 0 && (
                                    <p><strong>Source:</strong> {getSourceDisplay(cls.sourceBookInfo, true)}</p>
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
                        <h3 className="text-lg font-semibold mb-2">Class Feature</h3>
                        {(() => {
                            const classId = (cls as { id?: number }).id;
                            const progressionConfig = {
                                features: cls.features || [],
                                classId,
                                spellcastingProgression: cls.spellcastingProgression !== null ? cls.spellcastingProgression : undefined,
                                spellsKnownProgression: cls.spellsKnownProgression !== null ? cls.spellsKnownProgression : undefined,
                            };
                            const feature = generateClassProgression(progressionConfig);
                            return (
                                <ClassProgressionTable
                                    feature={feature}
                                    className="mt-2"
                                />
                            );
                        })()}
                    </div>

                    {/* Class Skills Section */}
                    {(() => {
                        const classSkillProgressions = cls.features?.filter(feature =>
                            feature.sourceType === FeatureSourceType.Class &&
                            feature.entities?.some(e => e.type === EntityType.Base && e.appliesTo === EntityAppliesToType.Skill)
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
                        // Find all proficiency features (should be only one, but be defensive)
                        const proficiencyProgressions = cls.features?.filter(feature =>
                            feature.sourceType === FeatureSourceType.Class &&
                            feature.entities?.some(e => e.type === EntityType.Base && e.appliesTo === EntityAppliesToType.Proficiency)
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


                    {/* Class Features Section */}
                    {(() => {
                        // Filter out features that contain skills and proficiencies
                        const actualFeatures = cls.features?.filter(feature => {
                            // Check if this feature contains class skills
                            const hasClassSkills = feature.sourceType === FeatureSourceType.Class &&
                                feature.entities?.some(e => e.type === EntityType.Base && e.appliesTo === EntityAppliesToType.Skill);

                            // Check if this feature contains proficiencies
                            const hasProficiencies = feature.sourceType === FeatureSourceType.Class &&
                                feature.entities?.some(e => e.type === EntityType.Base && e.appliesTo === EntityAppliesToType.Proficiency);

                            // Exclude features with skills or proficiencies
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
                                                        const feature = actualFeatures.find(f => f.id === item.featureId);
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
                                                                        <ProcessMarkdown markdown={feature.description || ''} id={`feature-${feature.id}`}
                                                                            userVars={{
                                                                                classname: cls.name.toLowerCase(),
                                                                                classplural: pluralize(cls.name),
                                                                                classplurallower: pluralize(cls.name).toLowerCase(),
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        // Show just the feature name for subsequent occurrences
                                                                        <strong>{feature.name}</strong>
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
                                <>
                                    <button
                                        type="button"
                                        onClick={onEdit}
                                        disabled={lockStatus?.locked && lockStatus.lockedBy !== currentUserId}
                                        className="ml-4 inline-block px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 border dark:border-gray-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        title={lockStatus?.locked && lockStatus.lockedBy !== currentUserId
                                            ? `Currently locked by User ${lockStatus.lockedBy}`
                                            : 'Edit class'}
                                    >
                                        Edit Class
                                    </button>
                                    {lockStatus?.locked && lockStatus.lockedBy !== currentUserId && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 ml-4">
                                            Currently locked by User {lockStatus.lockedBy}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 
