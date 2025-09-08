import pluralize from 'pluralize';
import React, { useState, useEffect } from 'react';

import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { FeatApi } from '@/features/feat/FeatApi';
import { displayStrategyFactory } from '@/lib/formatters';
import { LanguageService } from '@/lib/LanguageService';
import { Race, FeatQueryResponse } from '@shared/schema';
import { DisplayType, SIZE_MAP, LANGUAGE_MAP, EDITION_MAP, ABILITY_MAP, CLASS_MAP, EntityAppliesToType, ABILITY_LIST, SpecialFeatureId } from '@shared/static-data';

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
    // Inner cell styling (the inner border, padding, background, text colors)
    const innerCellContentClasses = "p-3 bg-content border-content rounded-lg border w-full";

    // Outer container styling (width, centering, outer border, shadow)
    const outerContainerClasses = "w-4/5 mx-auto border-2 border-gray-400 dark:border-gray-600 rounded-lg shadow-lg p-1";

    return (
        <div className={showHeader ? "pt-8" : ""}>
            <div className={showHeader ? outerContainerClasses : ""}>
                <div className={showHeader ? innerCellContentClasses : ""}>
                    {showHeader && (
                        <div className="flex justify-between items-start mb-2">
                            <h1 className="text-2xl font-bold">{race.name}</h1>
                            <div className="text-right">
                                <p><strong>Edition:</strong> {EDITION_MAP[race.editionId]?.abbreviation}</p>
                                <p><strong>Display:</strong> {race.isVisible ? 'Yes' : 'No'}</p>
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p><strong>Size:</strong> {SIZE_MAP[race.sizeId]?.name}</p>
                            <p><strong>Speed:</strong> {race.speed}</p>
                            <p><strong>Favored Class:</strong> {race.favoredClassId === -1 ? 'Any' : CLASS_MAP[race.favoredClassId]?.name}</p>
                        </div>
                        <div>
                            <p><strong>Languages:</strong> {
                                (() => {
                                    const automaticLanguages = LanguageService.getAutomaticLanguages(race.features || []);
                                    return automaticLanguages.length > 0
                                        ? automaticLanguages.map(langId => LANGUAGE_MAP[langId]?.name).join(', ')
                                        : 'None';
                                })()
                            }</p>
                            <p><strong>Bonus Languages:</strong> {
                                (() => {
                                    const bonusLanguages = LanguageService.getBonusLanguages(race.features || []);
                                    return bonusLanguages.length > 0
                                        ? bonusLanguages.map(langId => LANGUAGE_MAP[langId]?.name).join(', ')
                                        : 'None';
                                })()
                            }</p>
                            <p><strong>Ability Adjustments:</strong> {
                                (() => {
                                    const abilityFeatures = race.features?.filter(fp =>
                                        fp.featureId === SpecialFeatureId.AbilityAdjustment &&
                                        fp.entities?.some(e => e.appliesTo === EntityAppliesToType.Ability)
                                    ) || [];

                                    const adjustments: Array<{ abilityId: number; value: number }> = [];

                                    // Collect all ability adjustments with their actual ability IDs
                                    for (const ability of ABILITY_LIST) {
                                        const abilityFeature = abilityFeatures.find(fp =>
                                            fp.featureId === SpecialFeatureId.AbilityAdjustment &&
                                            fp.entities?.some(e => e.appliesTo === EntityAppliesToType.Ability && e.appliesToId === ability.id)
                                        );
                                        const abilityEntity = abilityFeature?.entities?.find(e =>
                                            e.appliesTo === EntityAppliesToType.Ability && e.appliesToId === ability.id
                                        );
                                        if (abilityEntity && abilityEntity.value !== 0) {
                                            adjustments.push({
                                                abilityId: ability.id,
                                                value: abilityEntity.value
                                            });
                                        }
                                    }

                                    return adjustments.length > 0
                                        ? adjustments.map(adj => `${ABILITY_MAP[adj.abilityId]?.abbreviation} ${adj.value > 0 ? '+' : ''}${adj.value}`).join(', ')
                                        : 'None';
                                })()
                            }</p>
                        </div>
                    </div>
                    <div className="mt-3 p-2 w-full prose-custom">
                        <ProcessMarkdown id='description' markdown={race.description || ''} />
                    </div>
                    {race.features && race.features.filter(fp =>
                        fp.featureId !== SpecialFeatureId.AutomaticLanguage &&
                        fp.featureId !== SpecialFeatureId.BonusLanguage &&
                        fp.featureId !== SpecialFeatureId.AbilityAdjustment
                    ).length > 0 && (
                            <div className="mt-3">
                                <h3 className="text-lg font-bold mb-2">{race.name} Racial Features</h3>
                                <div className="space-y-2">
                                    {race.features.filter(fp =>
                                        fp.featureId !== SpecialFeatureId.AutomaticLanguage &&
                                        fp.featureId !== SpecialFeatureId.BonusLanguage &&
                                        fp.featureId !== SpecialFeatureId.AbilityAdjustment
                                    ).map((featureProg, index) => (
                                        <div key={index} className="gap-2 items-start">
                                            <div className="w-full prose-custom">
                                                {featureProg.feature?.description && (
                                                    <div className="mt-2">
                                                        <ProcessMarkdown id={`feature-${featureProg.id}`} markdown={featureProg.feature.description} userVars={{
                                                            racename: race.name,
                                                            racenamelower: race.name.toLowerCase(),
                                                            raceplural: pluralize(race.name),
                                                            raceplurallower: pluralize(race.name).toLowerCase(),
                                                        }} />
                                                    </div>
                                                )}
                                                {(() => {
                                                    const hasDetails = featureProg.entities && featureProg.entities.length > 0;

                                                    if (hasDetails) {
                                                        const strategy = displayStrategyFactory.createStrategy(DisplayType.Detail);
                                                        const result = strategy.format(featureProg, undefined);
                                                        const formattedEntries = result.levelEntries.find(entry => entry.level === featureProg.level)?.items || [];

                                                        if (formattedEntries.length > 0) {
                                                            return (
                                                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                                    <strong>Details:</strong> {formattedEntries.join(', ')}
                                                                </div>
                                                            );
                                                        }
                                                    }
                                                    return null;
                                                })()}
                                                {featureProg.entities && featureProg.entities.length > 0 && (
                                                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                        <strong>Entities:</strong> {featureProg.entities.length} entity(ies)
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
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
