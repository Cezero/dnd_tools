import pluralize from 'pluralize';
import React, { useEffect, useState, useMemo } from 'react';

import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { extractRaceMechanics } from '@/lib/feature-extraction/raceMechanicsExtractor';
import { displayStrategyFactory } from '@/lib/formatters';
import { usePrecacheFeatureEntities } from '@/lib/formatters/hooks/usePrecacheFeatureEntities';
import { useCacheFunctions, getSourceDisplay } from '@/services/cache';
import { Race } from '@shared/schema';
import { DisplayType, SIZE_MAP, EDITION_MAP, SpecialFeatureId } from '@shared/static-data';


interface RaceDisplayProps {
    race: Race;
    showHeader?: boolean;
    showActions?: boolean;
    onBack?: () => void;
    onEdit?: () => void;
    isAdmin?: boolean;
    fromListParams?: string;
}

export function RaceDisplay({
    race,
    showHeader = true,
    showActions = false,
    onBack,
    onEdit,
    isAdmin = false,
    fromListParams: _fromListParams = ''
}: RaceDisplayProps): React.JSX.Element {
    // Precache all entities referenced in feature progressions
    usePrecacheFeatureEntities(race?.features);

    // Extract mechanics from feature progressions
    const mechanics = useMemo(() => {
        if (race.features && race.features.length > 0) {
            const raceId = (race as { id?: number }).id;
            return extractRaceMechanics(race.features, raceId);
        }
        // Return null values if no features
        return {
            sizeId: null,
            speed: null,
            favoredClassId: null,
            levelAdjustment: null,
        };
    }, [race]);

    const { getClassSummaryById } = useCacheFunctions();
    const innerCellContentClasses = "p-3 bg-content border-content rounded-lg border w-full";
    const outerContainerClasses = "w-4/5 mx-auto border-2 border-gray-400 dark:border-gray-600 rounded-lg shadow-lg p-1";

    // Use state to store formatted results and only update when race actually changes
    const [formattedResults, setFormattedResults] = useState<{
        automaticLanguages: string[];
        bonusLanguages: string[];
        abilityAdjustments: string[];
        otherFeatures: Array<{ formattedValue?: string; descriptionLevel?: number; level?: number; feature: { id: number; featureId: number; feature?: { name?: string; description?: string } } }>;
    }>({ automaticLanguages: [], bonusLanguages: [], abilityAdjustments: [], otherFeatures: [] });

    // Only update formatted results when race actually changes
    useEffect(() => {
        if (!race?.features) {
            setFormattedResults({ automaticLanguages: [], bonusLanguages: [], abilityAdjustments: [], otherFeatures: [] });
            return;
        }

        const strategy = displayStrategyFactory.createStrategy(DisplayType.Detail);
        const formattedResult = strategy.format(race.features, undefined);

        // Extract language and ability adjustment data from the formatted result
        const automaticLanguages: string[] = [];
        const bonusLanguages: string[] = [];
        const abilityAdjustments: string[] = [];
        const otherFeatures: Array<{ formattedValue?: string; descriptionLevel?: number; level?: number; feature: { id: number; featureId: number; feature?: { name?: string; description?: string } } }> = [];

        for (const levelEntry of formattedResult.levelEntries) {
            for (const item of levelEntry.items || []) {
                // Find the corresponding feature to determine its type
                const feature = race.features?.find(f => f.featureId === item.featureId);
                if (!feature) continue;

                if (feature.featureId === SpecialFeatureId.AutomaticLanguage && item.formattedValue) {
                    automaticLanguages.push(item.formattedValue);
                } else if (feature.featureId === SpecialFeatureId.BonusLanguage && item.formattedValue) {
                    bonusLanguages.push(item.formattedValue);
                } else if (feature.featureId === SpecialFeatureId.AbilityAdjustment && item.formattedValue) {
                    abilityAdjustments.push(item.formattedValue);
                } else {
                    otherFeatures.push({ ...item, feature });
                }
            }
        }

        setFormattedResults({ automaticLanguages, bonusLanguages, abilityAdjustments, otherFeatures });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [race?.name, race?.features?.length]); // Only run when race name or feature count changes

    const { automaticLanguages, bonusLanguages, abilityAdjustments, otherFeatures } = formattedResults;

    // Helper function to parse language strings and extract labels
    const parseLanguageString = (languageString: string) => {
        // Check if the string contains a colon (indicating it has a label)
        const colonIndex = languageString.indexOf(':');
        if (colonIndex === -1) {
            // No label found, return as-is
            return { label: '', content: languageString };
        }

        const label = languageString.substring(0, colonIndex + 1); // Include the colon
        const content = languageString.substring(colonIndex + 1).trim(); // Remove leading space
        return { label, content };
    };

    // Helper function to render language display with parsed labels
    const renderLanguageDisplay = (languages: string[], fallbackText: string) => {
        if (!languages || languages.length === 0) {
            return fallbackText;
        }

        // Join all language strings and parse the combined result
        const combinedString = languages.join(', ');
        const { label, content } = parseLanguageString(combinedString);

        if (label) {
            return (
                <>
                    <strong>{label}</strong> {content}
                </>
            );
        }

        return combinedString;
    };

    if (!race) {
        return <div>Error: Race not found</div>;
    }

    return (
        <div className={showHeader ? "pt-8" : ""}>
            <div className={showHeader ? outerContainerClasses : ""}>
                <div className={showHeader ? innerCellContentClasses : ""}>
                    {showHeader && (
                        <div className="flex justify-between items-start mb-2">
                            <h1 className="text-2xl font-bold">{race.name}</h1>
                            <div className="text-right">
                                <p><strong>Edition:</strong> {EDITION_MAP[race.editionId]?.abbreviation}</p>
                                {race.sourceBookInfo && race.sourceBookInfo.length > 0 && (
                                    <p><strong>Source:</strong> {getSourceDisplay(race.sourceBookInfo, true)}</p>
                                )}
                                <p><strong>Display:</strong> {race.isVisible ? 'Yes' : 'No'}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p><strong>Size:</strong> {SIZE_MAP[mechanics.sizeId ?? 0]?.name}</p>
                            <p><strong>Speed:</strong> {mechanics.speed ?? 0}</p>
                            <p><strong>Level Adjustment:</strong> {mechanics.levelAdjustment && mechanics.levelAdjustment > 0 ? `+${mechanics.levelAdjustment}` : (mechanics.levelAdjustment || 0)}</p>
                            <p><strong>Favored Class:</strong> {mechanics.favoredClassId === -1 ? 'Any' : (getClassSummaryById(mechanics.favoredClassId ?? 0)?.name || 'Loading...')}</p>
                        </div>
                        <div>
                            <p>
                                {renderLanguageDisplay(automaticLanguages, 'None')}
                            </p>
                            <p>
                                {renderLanguageDisplay(bonusLanguages, 'None')}
                            </p>
                            <p><strong>Ability Adjustments:</strong> {
                                abilityAdjustments.length > 0 ? abilityAdjustments.join(', ') : 'None'
                            }</p>
                        </div>
                    </div>
                    <div className="mt-3 p-2 w-full prose-custom">
                        <ProcessMarkdown id='description' markdown={race.description || ''} />
                    </div>
                    {otherFeatures.length > 0 && (
                        <div className="mt-3">
                            <h3 className="text-lg font-bold mb-2">{race.name} Racial Features</h3>
                            <div className="space-y-4 border border-gray-200 dark:border-gray-600 rounded-md p-3">
                                {otherFeatures.map((item, index) => {
                                    // Determine whether to show description or name
                                    const shouldShowDescription = item.descriptionLevel === item.level;
                                    return (
                                        <div key={`feature-${index}`}>
                                            <div className="text-sm">
                                                {shouldShowDescription ? (
                                                    // Show full description for first occurrence
                                                    <ProcessMarkdown markdown={item.feature?.feature?.description || ''} id={`feature-${item.feature?.id}`} userVars={{
                                                        racename: race.name,
                                                        racenamelower: race.name.toLowerCase(),
                                                        raceplural: pluralize(race.name),
                                                        raceplurallower: pluralize(race.name).toLowerCase(),
                                                    }} />
                                                ) : (
                                                    // Show just the feature name for subsequent occurrences
                                                    <strong>{item.feature?.feature?.name}</strong>
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
                                    Edit Race
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
