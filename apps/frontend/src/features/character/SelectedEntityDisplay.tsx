import React, { useState, useEffect } from 'react';

import { DomainDisplay } from '@/features/domain/DomainDisplay';
import { DomainQueryHooks } from '@/services/query/DomainQueryHooks';
import { FeatQueryHooks } from '@/services/query/FeatQueryHooks';
import { FeatureQueryHooks } from '@/services/query/FeatureQueryHooks';
import { SpellQueryHooks } from '@/services/query/SpellQueryHooks';
import { EntityAppliesToType } from '@shared/static-data';

interface SelectedEntityDisplayProps {
    choiceType: EntityAppliesToType;
    selectedValue: number;
    showHeader?: boolean;
}

export function SelectedEntityDisplay({
    choiceType,
    selectedValue,
    showHeader = false
}: SelectedEntityDisplayProps): React.JSX.Element | null {
    // Handle different entity types
    switch (choiceType) {
        case EntityAppliesToType.Domain:
            return <DomainDisplayWrapper domainId={selectedValue} showHeader={showHeader} />;

        case EntityAppliesToType.Feat:
            return <FeatDisplayWrapper featId={selectedValue} showHeader={showHeader} />;

        case EntityAppliesToType.Spell:
            return <SpellDisplayWrapper spellId={selectedValue} showHeader={showHeader} />;

        case EntityAppliesToType.Feature:
            return <FeatureDisplayWrapper featureId={selectedValue} showHeader={showHeader} />;

        default:
            return null;
    }
}

// Domain Display Wrapper
function DomainDisplayWrapper({ domainId, showHeader }: { domainId: number; showHeader: boolean }): React.JSX.Element | null {
    const [domain, setDomain] = useState<unknown | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchDomain = async () => {
            if (!domainId) return;

            try {
                setIsLoading(true);
                setError(null);
                const domainData = await DomainQueryHooks.getDomainById(domainId);
                setDomain(domainData);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to fetch domain'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchDomain();
    }, [domainId]);

    if (isLoading) {
        return (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    if (error || !domain) {
        return (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <p className="text-red-600 dark:text-red-400">Error loading domain details</p>
            </div>
        );
    }

    return (
        <DomainDisplay
            domain={domain}
            showHeader={showHeader}
            showActions={false}
        />
    );
}

// Feat Display Wrapper
function FeatDisplayWrapper({ featId, showHeader }: { featId: number; showHeader: boolean }): React.JSX.Element | null {
    const [feat, setFeat] = useState<unknown | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchFeat = async () => {
            if (!featId) return;

            try {
                setIsLoading(true);
                setError(null);
                const featData = await FeatQueryHooks.getFeatById(featId);
                setFeat(featData);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to fetch feat'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeat();
    }, [featId]);

    if (isLoading) {
        return (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    if (error || !feat) {
        return (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <p className="text-red-600 dark:text-red-400">Error loading feat details</p>
            </div>
        );
    }

    return (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">{(feat as any).name}</h4>
            {(feat as any).description && (
                <p className="text-blue-600 dark:text-blue-300 text-sm">{(feat as any).description}</p>
            )}
        </div>
    );
}

// Spell Display Wrapper
function SpellDisplayWrapper({ spellId, showHeader }: { spellId: number; showHeader: boolean }): React.JSX.Element | null {
    const [spell, setSpell] = useState<unknown | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchSpell = async () => {
            if (!spellId) return;

            try {
                setIsLoading(true);
                setError(null);
                const spellData = await SpellQueryHooks.getSpellById(spellId);
                setSpell(spellData);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to fetch spell'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchSpell();
    }, [spellId]);

    if (isLoading) {
        return (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    if (error || !spell) {
        return (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <p className="text-red-600 dark:text-red-400">Error loading spell details</p>
            </div>
        );
    }

    return (
        <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
            <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">{(spell as any).name}</h4>
            {(spell as any).summary && (
                <p className="text-purple-600 dark:text-purple-300 text-sm">{(spell as any).summary}</p>
            )}
        </div>
    );
}

// Feature Display Wrapper
function FeatureDisplayWrapper({ featureId, showHeader }: { featureId: number; showHeader: boolean }): React.JSX.Element | null {
    const [feature, setFeature] = useState<unknown | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchFeature = async () => {
            if (!featureId) return;

            try {
                setIsLoading(true);
                setError(null);
                const featureData = await FeatureQueryHooks.getFeatureById(featureId);
                setFeature(featureData);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to fetch feature'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeature();
    }, [featureId]);

    if (isLoading) {
        return (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    if (error || !feature) {
        return (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <p className="text-red-600 dark:text-red-400">Error loading feature details</p>
            </div>
        );
    }

    return (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">{(feature as any).name}</h4>
            {(feature as any).description && (
                <p className="text-green-600 dark:text-green-300 text-sm">{(feature as any).description}</p>
            )}
        </div>
    );
}
