import React, { useEffect, useState } from 'react';

import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { FeatService } from '@/features/feat/FeatService';
import { generateClassProgression } from '@/lib/ClassProgression';
import { ClassProgressionTable } from '@/lib/ClassProgressionTable';
import { formatterOrchestrator, formatClassProficiencies, formatPrerequisites } from '@/lib/formatters';
import { GetClassResponse, FormatterMetadata } from '@shared/schema';
import {
    RPG_DICE,
    EDITION_MAP,
    ABILITY_MAP,
    SKILL_MAP,
    ModifierAppliesToType,
    SpecialFeatureId,
    FeatureSpecialEffectType
} from '@shared/static-data';

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
    fromListParams: _fromListParams = ''
}: ClassDisplayProps): React.JSX.Element {
    const [feats, setFeats] = useState<Array<{ id: number; name: string }>>([]);
    const [featsLoaded, setFeatsLoaded] = useState(false);

    // Extract FormatterMetadata from the class data
    const extractFormatterMetadata = (): FormatterMetadata => {
        const featNames: Array<{ id: number; name: string }> = [];
        const featureNames: Array<{ id: number; name: string }> = [];
        const itemNames: Array<{ id: number; name: string }> = [];

        // Extract feat names from nested choice data
        cls.features?.forEach(progression => {
            progression.choices?.forEach(choice => {
                if (choice.feat && choice.featId) {
                    featNames.push({
                        id: choice.featId,
                        name: choice.feat.name
                    });
                }
            });
        });

        // Extract feature names from nested choice data
        cls.features?.forEach(progression => {
            progression.choices?.forEach(choice => {
                if (choice.feature && choice.featureId) {
                    featureNames.push({
                        id: choice.featureId,
                        name: choice.feature.name
                    });
                }
            });
        });

        // Remove duplicates
        const uniqueFeatNames = Array.from(
            new Map(featNames.map(item => [item.id, item])).values()
        );
        const uniqueFeatureNames = Array.from(
            new Map(featureNames.map(item => [item.id, item])).values()
        );

        return {
            featNames: uniqueFeatNames.length > 0 ? uniqueFeatNames : undefined,
            featureNames: uniqueFeatureNames.length > 0 ? uniqueFeatureNames : undefined,
            itemNames: itemNames.length > 0 ? itemNames : undefined
        };
    };

    // Load feats if we have feat modifiers
    useEffect(() => {
        const loadFeatsIfNeeded = async () => {
            if (featsLoaded) return;

            const hasFeatModifiers = cls.features?.some(progression =>
                progression.modifiers?.some(modifier =>
                    modifier.appliesTo === ModifierAppliesToType.Feat
                )
            );

            if (hasFeatModifiers) {
                try {
                    const response = await FeatService.getFeats({});
                    setFeats(response.results || []);
                } catch (error) {
                    console.error('Failed to load feats:', error);
                } finally {
                    setFeatsLoaded(true);
                }
            } else {
                setFeatsLoaded(true);
            }
        };

        loadFeatsIfNeeded();
    }, [cls.features, featsLoaded]);

    // Enhance modifiers with feat data
    const enhancedFeatures = cls.features?.map(progression => ({
        ...progression,
        modifiers: progression.modifiers?.map(modifier => {
            if (modifier.appliesTo === ModifierAppliesToType.Feat && modifier.appliesToId) {
                const feat = feats.find(f => f.id === modifier.appliesToId);
                return feat ? { ...modifier, feat } : modifier;
            }
            return modifier;
        })
    })) || [];

    // Get FormatterMetadata for this class
    const formatterMetadata = extractFormatterMetadata();

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
                                <p><strong>Casting Type:</strong> {cls.castingType || 'None'}</p>
                            </div>
                            <div className="text-right">
                                <p><strong>Edition:</strong> {EDITION_MAP[cls.editionId]?.abbreviation}</p>
                                <p><strong>Display:</strong> {cls.isVisible ? 'Yes' : 'No'}</p>
                                <p><strong>Prestige Class:</strong> {cls.isPrestige ? 'Yes' : 'No'}</p>
                                <p><strong>Caster:</strong> {cls.canCastSpells ? 'Yes' : 'No'}</p>
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
                        const classSkills = enhancedFeatures
                            ?.filter(progression =>
                                progression.featureId === SpecialFeatureId.ClassSkill
                            )
                            .flatMap(progression =>
                                progression.modifiers
                                    ?.filter(modifier =>
                                        modifier.appliesTo === ModifierAppliesToType.Skill && modifier.appliesToId
                                    )
                                    .map(modifier => ({
                                        skillId: modifier.appliesToId,
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
                                                {SKILL_MAP[skill.skillId]?.name || 'Unknown Skill'}
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
                        const classProficiencies = enhancedFeatures
                            ?.filter(progression =>
                                progression.featureId === SpecialFeatureId.ClassProficiency
                            )
                            .flatMap(progression =>
                                progression.effects
                                    ?.filter(effect => effect.effectType === FeatureSpecialEffectType.Proficiency)
                                    .map(effect => ({
                                        featId: effect.featId || 0,
                                        itemId: effect.itemId || -1,
                                        featName: effect.feat?.name || `Feat ${effect.featId}`,
                                        itemName: effect.itemId === -1 ? undefined : (effect.item?.name || `Item ${effect.itemId}`)
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
                        const actualFeatures = enhancedFeatures?.filter(progression => {
                            // Check if this progression contains class skills
                            const hasClassSkills = progression.featureId === SpecialFeatureId.ClassSkill;

                            // Check if this progression contains proficiencies
                            const hasProficiencies = progression.featureId === SpecialFeatureId.ClassProficiency;

                            // Exclude progressions with skills or proficiencies
                            return !hasClassSkills && !hasProficiencies;
                        }) || [];

                        if (actualFeatures.length > 0) {
                            // Get the level-indexed map from the orchestrator (this handles formula expansion)
                            const levelMap = formatterOrchestrator.formatProgressionsForDetailDisplay(actualFeatures, undefined, formatterMetadata);

                            // Track which features we've already shown descriptions for
                            const shownFeatureDescriptions = new Set<number>();

                            return (
                                <div className="mt-4">
                                    <h3 className="text-lg font-semibold mb-2">Class Features</h3>
                                    <div className="space-y-4">
                                        {/* Sort levels and render each group */}
                                        {Array.from(levelMap.keys())
                                            .sort((a, b) => a - b)
                                            .map(level => {
                                                const levelEntries = levelMap.get(level)!;

                                                return (
                                                    <div key={level} className="border border-gray-200 dark:border-gray-600 rounded-md p-3">
                                                        <h4 className="text-md font-medium mb-2">Level {level}</h4>
                                                        <div className="space-y-2">
                                                            {levelEntries.map((entry, index) => {
                                                                const feature = entry.feature;
                                                                const isFirstOccurrence = feature?.id && !shownFeatureDescriptions.has(feature.id);

                                                                // Mark this feature as shown if it's the first occurrence
                                                                if (isFirstOccurrence && feature?.id) {
                                                                    shownFeatureDescriptions.add(feature.id);
                                                                }

                                                                return (
                                                                    <div key={`entry-${index}`} className="p-2">
                                                                        {/* Show feature description only on first occurrence */}
                                                                        {isFirstOccurrence && feature?.description && (
                                                                            <div>
                                                                                <ProcessMarkdown
                                                                                    markdown={feature.description}
                                                                                    id={`${cls.name.toLowerCase()}-feature-${feature.id}`}
                                                                                    userVars={{
                                                                                        classname: cls.name.toLowerCase()
                                                                                    }}
                                                                                />
                                                                                {/* Show prerequisites if they exist */}
                                                                                {(feature as { prerequisites?: unknown[] }).prerequisites && (feature as { prerequisites?: unknown[] }).prerequisites!.length > 0 && (
                                                                                    <div className="mt-2 inline-block p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-md">
                                                                                        <p className="text-xs text-slate-700 dark:text-slate-300">
                                                                                            <strong>Prerequisites:</strong> {formatPrerequisites((feature as { prerequisites?: unknown[] }).prerequisites!)}
                                                                                        </p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        {/* Show formatted entry */}
                                                                        <div className={`mt-2 space-y-1 ${isFirstOccurrence ? 'ml-4' : ''}`}>
                                                                            <div className="text-sm">
                                                                                {!isFirstOccurrence && <span className="font-medium">{feature?.name || `Feature ${feature?.id}`}:</span>} {entry.formattedValue}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
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
