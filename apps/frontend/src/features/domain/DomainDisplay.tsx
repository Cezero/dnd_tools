import React from 'react';
import { Link } from 'react-router-dom';

import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { displayStrategyFactory } from '@/lib/formatters';
import { usePrecacheFeatureEntities } from '@/lib/formatters/hooks/usePrecacheFeatureEntities';
import { useCacheFunctions , getSourceDisplay } from '@/services/cache';
import { Domain } from '@shared/schema';
import { EDITION_MAP, DisplayType } from '@shared/static-data';

interface DomainDisplayProps {
    domain: Domain;
    showHeader?: boolean;
    showActions?: boolean;
    onBack?: () => void;
    onEdit?: () => void;
    isAdmin?: boolean;
    fromListParams?: string;
}

export function DomainDisplay({
    domain,
    showHeader = true,
    showActions = false,
    onBack,
    onEdit,
    isAdmin = false,
    fromListParams: _fromListParams = ''
}: DomainDisplayProps): React.JSX.Element {
    const { getSpellNameFromCache, getSpellSummaryFromCache, getDeityNameFromCache } = useCacheFunctions();
    // Precache all entities referenced in feature features
    usePrecacheFeatureEntities(domain?.features);

    const innerCellContentClasses = showHeader ? "p-3 bg-content border-content rounded-lg border w-full" : "";
    const outerContainerClasses = showHeader ? "w-4/5 mx-auto border-2 border-gray-400 dark:border-gray-600 rounded-lg shadow-lg p-1" : "";

    if (!domain) {
        return <div>Error: Domain not found</div>;
    }

    return (
        <div className={showHeader ? "pt-8" : ""}>
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    <div className="space-y-2">
                        {showHeader && (
                            <div className="flex justify-between items-start mb-6">
                                <h1 className="text-2xl font-bold">{domain.name}</h1>
                                <div className="text-right">
                                    <p><strong>Edition:</strong> {EDITION_MAP[domain.editionId]?.abbreviation || domain.editionId}</p>
                                    {domain.sourceBookInfo && domain.sourceBookInfo.length > 0 && (
                                        <p><strong>Source:</strong> {getSourceDisplay(domain.sourceBookInfo, true)}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Granted Powers Section */}
                        {domain.features && domain.features.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Granted Powers</h3>
                                {(() => {
                                    const actualFeatures = domain.features;

                                    if (actualFeatures.length > 0) {
                                        // Use display strategy to format features
                                        const strategy = displayStrategyFactory.createStrategy(DisplayType.Detail);
                                        const result = strategy.format(actualFeatures, undefined);

                                        return (
                                            <div className="space-y-2">
                                                {result.levelEntries.map((levelEntry) => (
                                                    <div key={levelEntry.level} className="space-y-2">
                                                        {levelEntry.items?.map((item, index) => {
                                                            // Find the corresponding feature for this item
                                                            const feature = actualFeatures.find(f => f.id === item.featureId);
                                                            if (!feature) {
                                                                return null;
                                                            }

                                                            return (
                                                                <div key={`item-${index}`}>
                                                                    <div className="text-sm">
                                                                        <ProcessMarkdown markdown={feature.description || ''} id={`feature-${feature.id}`} userVars={{
                                                                            domainname: domain.name,
                                                                            domainnamelower: domain.name.toLowerCase(),
                                                                        }} />
                                                                        {item.formattedValue && (
                                                                            <div className="mt-2 ml-2"><strong>{feature.name}:</strong><span className="ml-2">{item.formattedValue}</span></div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        )}

                        {domain.domainSpells && domain.domainSpells.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold">Domain Spells</h3>
                                <div className="space-y-1">
                                    {domain.domainSpells.map((domainSpell, index) => {
                                        const spellName = getSpellNameFromCache(domainSpell.spellId) || `Spell ${domainSpell.spellId}`;
                                        const spellSummary = getSpellSummaryFromCache(domainSpell.spellId);
                                        return (
                                            <div key={index}>
                                                <strong>{domainSpell.spellLevel}</strong> <Link
                                                    to={`/spells/${domainSpell.spellId}`}
                                                    className="entity-link"
                                                >
                                                    {spellName}
                                                </Link>: {spellSummary || 'No description available.'}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {domain.deityIds && domain.deityIds.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2">
                                    <strong className="text-lg font-semibold">Deities:</strong>
                                    {domain.deityIds.map((deityId, index) => (
                                        <div key={index}>
                                            {getDeityNameFromCache(deityId) || `Deity ${deityId}`}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    {showActions && (
                        <div className="mt-4 text-right">
                            {onBack && (
                                <button type="button" onClick={onBack} className="inline-block px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 border dark:border-gray-500">Back to List</button>
                            )}
                            {isAdmin && onEdit && (
                                <button type="button" onClick={onEdit} className="ml-4 inline-block px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 border dark:border-gray-500">Edit Domain</button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
