import React from 'react';

import { getAllCharacterFeats, type CharacterFeat } from '@/lib/character-calculation/core/featAccessor';
import { getQueryClient } from '@/lib/formatters/utils/queryClientAccessor';
import { getClassNameFromCache, getFeatSummaryById, getRaceSummaryById } from '@/services/cache';
import { FeatQueryHooks } from '@/services/query/FeatQueryHooks';
import type { Feat, FeatureProgression } from '@shared/schema';
import { EntityAppliesToType, EntityType, FeatureSourceType, LANGUAGE_MAP, SpecialFeatureId } from '@shared/static-data';

import type { FeaturesTabProps } from './types';

/**
 * FeaturesTab displays race/class features, feats, proficiencies, and languages.
 * Follows the same filtering and display logic as characterPdfService.ts
 */
export function FeaturesTab({ character, formattedCharacter, resolvedProgressions }: FeaturesTabProps): React.JSX.Element {
    // Calculate class levels per class for multi-class support
    const classLevelCounts = React.useMemo(() => {
        const counts = new Map<number, number>();
        for (const advancement of character.advancements) {
            const currentLevel = counts.get(advancement.classId) ?? 0;
            counts.set(advancement.classId, currentLevel + 1);

            if (advancement.secondaryClassId) {
                const secondaryLevel = counts.get(advancement.secondaryClassId) ?? 0;
                counts.set(advancement.secondaryClassId, secondaryLevel + 1);
            }
        }
        return counts;
    }, [character.advancements]);

    // Get race features (filtered and deduplicated)
    const raceFeatures = React.useMemo(() => {
        const raceFeatureMap = new Map<number, FeatureProgression>();

        for (const progression of resolvedProgressions) {
            if (
                progression.sourceType === FeatureSourceType.Race &&
                progression.featureId !== SpecialFeatureId.ClassProficiency &&
                progression.featureId !== SpecialFeatureId.ClassSkill &&
                progression.featureId !== SpecialFeatureId.AutomaticLanguage &&
                progression.featureId !== SpecialFeatureId.BonusLanguage &&
                progression.featureId !== SpecialFeatureId.AbilityAdjustment &&
                progression.level <= character.advancements.length &&
                !raceFeatureMap.has(progression.featureId)
            ) {
                raceFeatureMap.set(progression.featureId, progression);
            }
        }

        return Array.from(raceFeatureMap.values());
    }, [resolvedProgressions, character.advancements.length]);

    // Get class features (grouped by class, filtered and deduplicated)
    const classFeaturesByClass = React.useMemo(() => {
        const classFeaturesMap = new Map<number, Map<number, FeatureProgression>>();

        for (const progression of resolvedProgressions) {
            if (
                progression.sourceType === FeatureSourceType.Class &&
                progression.featureId !== SpecialFeatureId.ClassProficiency &&
                progression.featureId !== SpecialFeatureId.ClassSkill &&
                progression.featureId !== SpecialFeatureId.AutomaticLanguage &&
                progression.featureId !== SpecialFeatureId.BonusLanguage &&
                progression.featureId !== SpecialFeatureId.AbilityAdjustment &&
                progression.feature &&
                progression.classes && progression.classes.length > 0
            ) {
                // Process each class linked to this progression
                for (const classLink of progression.classes) {
                    const linkedClassId = classLink.classId;
                    // Check if feature is active at the specific class level (not total character level)
                    if (progression.level <= (classLevelCounts.get(linkedClassId) ?? 0)) {
                        if (!classFeaturesMap.has(linkedClassId)) {
                            classFeaturesMap.set(linkedClassId, new Map());
                        }
                        const classFeatures = classFeaturesMap.get(linkedClassId)!;
                        if (!classFeatures.has(progression.featureId)) {
                            classFeatures.set(progression.featureId, progression);
                        }
                    }
                }
            }
        }

        return classFeaturesMap;
    }, [resolvedProgressions, classLevelCounts]);

    // Get all character feats for categorization
    const allCharacterFeats = React.useMemo(() => {
        return getAllCharacterFeats(character, resolvedProgressions);
    }, [character, resolvedProgressions]);

    // Filter out proficiencies and categorize feats
    const processedFeats = React.useMemo(() => {
        // Filter out proficiencies
        const nonProficiencyFeats = formattedCharacter.feats?.filter(feat => {
            for (const progression of resolvedProgressions) {
                if (!progression.entities) continue;
                for (const entity of progression.entities) {
                    if (entity.type === EntityType.Other &&
                        entity.appliesTo === EntityAppliesToType.Proficiency &&
                        entity.appliesToId === feat.featId) {
                        return false; // This is a proficiency, not a feat
                    }
                }
            }
            return true; // This is a real feat
        }) || [];

        // Categorize feats
        const featSourceMap = new Map<number, CharacterFeat>();
        for (const characterFeat of allCharacterFeats) {
            if (!featSourceMap.has(characterFeat.featId)) {
                featSourceMap.set(characterFeat.featId, characterFeat);
            }
        }

        // Get auto-granted feats
        const autoGrantedFeats = new Map<number, { featId: number; level: number; sourceFeature: string; progressionId: number }>();
        for (const progression of resolvedProgressions) {
            if (!progression.entities) continue;
            for (const entity of progression.entities) {
                if (entity.appliesTo === EntityAppliesToType.Feat && entity.appliesToId) {
                    if (entity.type !== EntityType.Choice && !featSourceMap.has(entity.appliesToId)) {
                        const isInFormattedFeats = formattedCharacter.feats?.some(f => f.featId === entity.appliesToId);
                        if (isInFormattedFeats) {
                            autoGrantedFeats.set(entity.appliesToId, {
                                featId: entity.appliesToId,
                                level: progression.level,
                                sourceFeature: progression.feature?.name || 'Feature',
                                progressionId: progression.id
                            });
                        }
                    }
                }
            }
        }

        // Categorize feats
        type FeatCategory = {
            header: string;
            feats: Array<{ feat: typeof nonProficiencyFeats[0]; characterFeat?: CharacterFeat; sourceFeature?: string }>;
        };

        const featCategoriesMap = new Map<string, FeatCategory>();
        const regularFeats: FeatCategory = { header: 'Regular Feats', feats: [] };

        for (const feat of nonProficiencyFeats) {
            const characterFeat = featSourceMap.get(feat.featId);
            const autoGranted = autoGrantedFeats.get(feat.featId);

            if (autoGranted) {
                const progression = resolvedProgressions.find(p => p.id === autoGranted.progressionId);
                let featureName = autoGranted.sourceFeature;
                if (progression?.sourceType === FeatureSourceType.Race) {
                    const raceData = character.raceId ? getRaceSummaryById(character.raceId) : null;
                    const raceName = raceData?.name || 'Race';
                    featureName = `${raceName} ${featureName}`;
                } else if (progression?.sourceType === FeatureSourceType.Class && progression.classes && progression.classes.length > 0) {
                    const firstClassId = progression.classes[0].classId;
                    const className = getClassNameFromCache(firstClassId) || 'Class';
                    featureName = `${className} Granted`;
                }

                const header = featureName;
                if (!featCategoriesMap.has(header)) {
                    featCategoriesMap.set(header, { header, feats: [] });
                }
                featCategoriesMap.get(header)!.feats.push({ feat, sourceFeature: autoGranted.sourceFeature });
            } else if (characterFeat?.source === 'choice' && characterFeat.sourceFeature) {
                const progression = resolvedProgressions.find(p => p.id === characterFeat.sourceFeature?.progressionId);
                let featureName = characterFeat.sourceFeature.featureName;
                if (progression?.sourceType === FeatureSourceType.Race) {
                    const raceData = character.raceId ? getRaceSummaryById(character.raceId) : null;
                    const raceName = raceData?.name || 'Race';
                    featureName = `${raceName} ${featureName}`;
                } else if (progression?.sourceType === FeatureSourceType.Class && progression.classes && progression.classes.length > 0) {
                    const firstClassId = progression.classes[0].classId;
                    const className = getClassNameFromCache(firstClassId) || 'Class';
                    featureName = `${className} ${featureName}`;
                }

                const header = featureName;
                if (!featCategoriesMap.has(header)) {
                    featCategoriesMap.set(header, { header, feats: [] });
                }
                featCategoriesMap.get(header)!.feats.push({ feat, characterFeat });
            } else {
                regularFeats.feats.push({ feat, characterFeat });
            }
        }

        return {
            categories: [
                ...Array.from(featCategoriesMap.values()),
                regularFeats
            ].filter(cat => cat.feats.length > 0)
        };
    }, [formattedCharacter.feats, resolvedProgressions, allCharacterFeats, character.raceId]);

    // Get languages from character.characterLanguages
    const languages = React.useMemo(() => {
        if (!character.characterLanguages || character.characterLanguages.length === 0) return [];
        return character.characterLanguages
            .map(cl => LANGUAGE_MAP[cl.languageId as keyof typeof LANGUAGE_MAP]?.name)
            .filter((name): name is string => Boolean(name))
            .sort();
    }, [character.characterLanguages]);

    // Pre-fetch all feats to get their full details with featureProgressions
    const [featDetailsMap, setFeatDetailsMap] = React.useState<Map<number, Feat | null>>(new Map());

    React.useEffect(() => {
        const queryClient = getQueryClient();

        if (processedFeats.categories.length > 0) {
            // Get all unique feat IDs
            const featIds = new Set<number>();
            for (const category of processedFeats.categories) {
                for (const { feat } of category.feats) {
                    featIds.add(feat.featId);
                }
            }

            // Fetch all feats using queryClient.fetchQuery to ensure we get full data
            const fetchPromises = Array.from(featIds).map(async (featId) => {
                const featQueryKey = FeatQueryHooks.getFeatByIdQueryKey(featId);

                try {
                    const fullFeat = await queryClient.fetchQuery<Feat>({
                        queryKey: featQueryKey,
                        queryFn: () => FeatQueryHooks.getFeatById(featId),
                        staleTime: 5 * 60 * 1000, // 5 minutes
                    });
                    return { featId, feat: fullFeat };
                } catch {
                    return { featId, feat: null };
                }
            });

            Promise.all(fetchPromises).then(results => {
                const newMap = new Map<number, Feat | null>();
                for (const { featId, feat } of results) {
                    newMap.set(featId, feat);
                }
                setFeatDetailsMap(newMap);
            });
        }
    }, [processedFeats.categories]);

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Features & Feats</h2>

            {/* Race Features Section */}
            {raceFeatures.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        {character.raceId ? (getRaceSummaryById(character.raceId)?.name || 'Race') : 'Race'} Features
                    </h3>
                    <div className="space-y-2">
                        {raceFeatures.map((progression) => {
                            const featureName = progression.feature?.name || '';
                            const summary = progression.feature?.summary || '';
                            if (!featureName && !summary) return null;

                            return (
                                <div
                                    key={progression.id}
                                    className="py-2 border-b border-gray-200 dark:border-gray-700"
                                >
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                        {featureName}
                                    </div>
                                    {summary && (
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            {summary}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Class Features Section */}
            {Array.from(classFeaturesByClass.entries()).map(([classId, classFeatures]) => {
                const className = getClassNameFromCache(classId) || 'Class';
                const features = Array.from(classFeatures.values());

                if (features.length === 0) return null;

                return (
                    <div key={classId} className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                            {className} Features
                        </h3>
                        <div className="space-y-2">
                            {features.map((progression) => {
                                const featureName = progression.feature?.name || '';
                                const summary = progression.feature?.summary || '';
                                if (!featureName && !summary) return null;

                                return (
                                    <div
                                        key={progression.id}
                                        className="py-2 border-b border-gray-200 dark:border-gray-700"
                                    >
                                        <div className="font-semibold text-gray-900 dark:text-white">
                                            {featureName}
                                        </div>
                                        {summary && (
                                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {summary}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* Feats Section */}
            {processedFeats.categories.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Feats</h3>
                    <div className="space-y-4">
                        {processedFeats.categories.map((category) => (
                            <div key={category.header} className="space-y-2">
                                {category.header !== 'Regular Feats' && (
                                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        {category.header}
                                    </h4>
                                )}
                                <div className={category.header !== 'Regular Feats' ? 'pl-4' : ''}>
                                    {category.feats.map(({ feat }) => {
                                        // Get full feat data using getFeatById
                                        const fullFeat = featDetailsMap.get(feat.featId);

                                        // Get feat name from fullFeat if available, otherwise try cache, then formattedCharacter
                                        const featName = fullFeat?.name
                                            || getFeatSummaryById(feat.featId)?.name
                                            || feat.featName
                                            || `Feat ${feat.featId}`;

                                        // Get feat summary from the associated Feature via featureProgressions
                                        // The feat summary is stored in the Feature table, not the Feat table
                                        let featSummary: string | null = null;

                                        if (fullFeat) {
                                            // Type assertion: fullFeat is Feat which has optional featureProgressions
                                            const featWithProgressions = fullFeat as Feat & { featureProgressions?: FeatureProgression[] };
                                            if (featWithProgressions.featureProgressions && featWithProgressions.featureProgressions.length > 0) {
                                                // Use the first feature progression's feature summary
                                                const firstProgression = featWithProgressions.featureProgressions[0];
                                                if (firstProgression?.feature?.summary) {
                                                    featSummary = firstProgression.feature.summary;
                                                }
                                            }
                                        }

                                        // Fallback: try to find it in resolvedProgressions
                                        if (!featSummary) {
                                            const featProgression = resolvedProgressions.find(
                                                p => p.featId === feat.featId && p.feature
                                            );
                                            if (featProgression?.feature?.summary) {
                                                featSummary = featProgression.feature.summary;
                                            }
                                        }

                                        return (
                                            <div
                                                key={`${feat.featId}-${feat.level}`}
                                                className="py-2 border-b border-gray-200 dark:border-gray-700"
                                            >
                                                <div className="font-semibold text-gray-900 dark:text-white">
                                                    {featName}
                                                </div>
                                                {featSummary && (
                                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                        {featSummary}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Proficiencies Section */}
            {formattedCharacter.proficiencies && formattedCharacter.proficiencies.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Proficiencies</h3>
                    <div className="space-y-2">
                        <div className="text-gray-900 dark:text-white">
                            {formattedCharacter.proficiencies
                                .map(p => p.formattedValue)
                                .filter(Boolean)
                                .join(', ')}
                        </div>
                    </div>
                </div>
            )}

            {/* Languages Section */}
            {languages.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Languages</h3>
                    <div className="space-y-2">
                        <div className="text-gray-900 dark:text-white">
                            {languages.join(', ')}
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {raceFeatures.length === 0 &&
                classFeaturesByClass.size === 0 &&
                processedFeats.categories.length === 0 &&
                (!formattedCharacter.proficiencies || formattedCharacter.proficiencies.length === 0) &&
                languages.length === 0 && (
                    <p className="text-gray-600 dark:text-gray-400">No features, feats, proficiencies, or languages found.</p>
                )}
        </div>
    );
}
