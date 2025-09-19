import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { DomainApi } from '@/features/domain/DomainApi';
import { displayStrategyFactory } from '@/lib/formatters';
import { Domain } from '@shared/schema';
import { EDITION_MAP, GetSourceDisplay, DisplayType } from '@shared/static-data';

export function DomainDetail() {
    const { id } = useParams();
    const [domain, setDomain] = useState<Domain | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { isAdmin } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const Initialize = async () => {
            try {
                const data = await DomainApi.getDomainById(undefined, { id: parseInt(id!) });
                setDomain(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to initialize or fetch domain:', error);
                setIsLoading(false);
            }
        };
        Initialize();
    }, [id, location.state]);

    const innerCellContentClasses = "p-3 bg-content border-content rounded-lg border w-full";
    const outerContainerClasses = "w-4/5 mx-auto border-2 border-gray-400 dark:border-gray-600 rounded-lg shadow-lg p-1";

    if (isLoading) return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    Loading...
                </div>
            </div>
        </div>
    );
    if (!domain) return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    Domain not found
                </div>
            </div>
        </div>
    );

    return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    <div className="space-y-2">
                        <div className="flex justify-between items-start mb-2">
                            <h1 className="text-2xl font-bold">{domain.name}</h1>
                            <div className="text-right">
                                <p><strong>Edition:</strong> {EDITION_MAP[domain.editionId]?.abbreviation || domain.editionId}</p>
                                {domain.sourceBookInfo && domain.sourceBookInfo.length > 0 && (
                                    <p><strong>Source:</strong> {GetSourceDisplay(domain.sourceBookInfo, true)}</p>
                                )}
                            </div>
                        </div>

                        {/* Granted Powers Section */}
                        {domain.features && domain.features.length > 0 && (
                            <div className="mt-4">
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
                                                            const feature = actualFeatures.find(f => f.featureId === item.featureId);
                                                            if (!feature) {
                                                                return null;
                                                            }

                                                            return (
                                                                <div key={`item-${index}`}>
                                                                    <div className="text-sm">
                                                                        <ProcessMarkdown markdown={feature.feature?.description || ''} id={`feature-${feature.id}`} userVars={{
                                                                            domainname: domain.name,
                                                                            domainnamelower: domain.name.toLowerCase(),
                                                                        }} />
                                                                        {item.formattedValue && (
                                                                            <div className="mt-2 ml-2"><strong>{feature.feature?.name}:</strong><span className="ml-2">{item.formattedValue}</span></div>
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
                                    {domain.domainSpells.map((domainSpell, index) => (
                                        <div key={index}>
                                            <strong>{domainSpell.spellLevel}</strong> <Link
                                                to={`/spells/${domainSpell.spellId}`}
                                                className="entity-link"
                                            >
                                                {domainSpell.spellName}
                                            </Link>: {domainSpell.spellSummary || 'No description available.'}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {domain.deityDomains && domain.deityDomains.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold">Deities</h3>
                                <div className="flex items-center gap-2">
                                    {domain.deityDomains.map((deityDomain, index) => (
                                        <div key={index}>
                                            {deityDomain.name || 'Unknown Deity'}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="mt-4 text-right">
                        <button type="button" onClick={() => navigate(`/domains${fromListParams ? `?${fromListParams}` : ''}`)} className="inline-block px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 border dark:border-gray-500">Back to List</button>
                        {isAdmin && (
                            <Link to={`/domains/${id}/edit`} state={{ fromListParams: fromListParams }} className="ml-4 inline-block px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 border dark:border-gray-500">Edit Domain</Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
