import { useQueryClient } from '@tanstack/react-query';
import React, { useState, useEffect } from 'react';
import { z } from 'zod';

import { DomainDisplay } from '@/features/domain/DomainDisplay';
import { FeatureDisplay } from '@/components/feature-system/FeatureDisplay';
import { DomainQueryHooks } from '@/services/query/DomainQueryHooks';
import { FeatQueryHooks } from '@/services/query/FeatQueryHooks';
import { FeatureQueryHooks } from '@/services/query/FeatureQueryHooks';
import { SpellQueryHooks } from '@/services/query/SpellQueryHooks';
import { CompanionQueryHooks } from '@/services/query/CompanionQueryHooks';
import type { Domain, GetSpellResponse, GetFeatureResponse, GetCompanionResponse, FeatureProgression } from '@shared/schema';
import { FeatSchema } from '@shared/schema';
import { EntityAppliesToType, COMPANION_TYPE_MAP, SpecialFeatureId, FeatureSourceType } from '@shared/static-data';

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

        case EntityAppliesToType.AnimalCompanion:
            return <CompanionDisplayWrapper companionId={selectedValue} choiceType={EntityAppliesToType.AnimalCompanion} showHeader={showHeader} />;

        case EntityAppliesToType.Familiar:
            return <CompanionDisplayWrapper companionId={selectedValue} choiceType={EntityAppliesToType.Familiar} showHeader={showHeader} />;

        default:
            return null;
    }
}

// Domain Display Wrapper
function DomainDisplayWrapper({ domainId, showHeader }: { domainId: number; showHeader: boolean }): React.JSX.Element | null {
    const queryClient = useQueryClient();
    const [domain, setDomain] = useState<Domain | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchDomain = async () => {
            if (!domainId) return;

            try {
                setIsLoading(true);
                setError(null);
                const domainData = await queryClient.fetchQuery({
                    queryKey: DomainQueryHooks.getDomainByIdQueryKey(domainId),
                    queryFn: () => DomainQueryHooks.getDomainByIdQueryFn({ pathParams: { id: domainId } }),
                    staleTime: 5 * 60 * 1000, // 5 minutes
                    gcTime: 10 * 60 * 1000, // 10 minutes
                });
                setDomain(domainData);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to fetch domain'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchDomain();
    }, [domainId, queryClient]);

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
function FeatDisplayWrapper({ featId, showHeader: _showHeader }: { featId: number; showHeader: boolean }): React.JSX.Element | null {
    const queryClient = useQueryClient();
    const [feat, setFeat] = useState<z.infer<typeof FeatSchema> | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchFeat = async () => {
            if (!featId) return;

            try {
                setIsLoading(true);
                setError(null);
                const featData = await queryClient.fetchQuery({
                    queryKey: FeatQueryHooks.getFeatByIdQueryKey(featId),
                    queryFn: () => FeatQueryHooks.getFeatByIdQueryFn({ pathParams: { id: featId } }),
                    staleTime: 5 * 60 * 1000, // 5 minutes
                    gcTime: 10 * 60 * 1000, // 10 minutes
                });
                setFeat(featData);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to fetch feat'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeat();
    }, [featId, queryClient]);

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
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">{feat.name}</h4>
            {feat.description && (
                <p className="text-blue-600 dark:text-blue-300 text-sm">{feat.description}</p>
            )}
        </div>
    );
}

// Spell Display Wrapper
function SpellDisplayWrapper({ spellId, showHeader: _showHeader }: { spellId: number; showHeader: boolean }): React.JSX.Element | null {
    const queryClient = useQueryClient();
    const [spell, setSpell] = useState<GetSpellResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchSpell = async () => {
            if (!spellId) return;

            try {
                setIsLoading(true);
                setError(null);
                const spellData = await queryClient.fetchQuery({
                    queryKey: SpellQueryHooks.getSpellByIdQueryKey(spellId),
                    queryFn: () => SpellQueryHooks.getSpellByIdQueryFn({ pathParams: { id: spellId } }),
                    staleTime: 5 * 60 * 1000, // 5 minutes
                    gcTime: 10 * 60 * 1000, // 10 minutes
                });
                setSpell(spellData);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to fetch spell'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchSpell();
    }, [spellId, queryClient]);

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
            <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">{spell.name}</h4>
            {spell.summary && (
                <p className="text-purple-600 dark:text-purple-300 text-sm">{spell.summary}</p>
            )}
        </div>
    );
}

// Feature Display Wrapper
function FeatureDisplayWrapper({ featureId, showHeader: _showHeader }: { featureId: number; showHeader: boolean }): React.JSX.Element | null {
    const queryClient = useQueryClient();
    const [feature, setFeature] = useState<GetFeatureResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchFeature = async () => {
            if (!featureId) return;

            try {
                setIsLoading(true);
                setError(null);
                // FeatureQueryHooks doesn't expose query key/fn, so construct them manually
                // based on the pattern from useGetFeatureById
                const queryKey = ['features', 'item', featureId];
                const queryFn = async () => {
                    const result = await FeatureQueryHooks.getFeatureById(featureId);
                    return result;
                };
                const featureData = await queryClient.fetchQuery({
                    queryKey,
                    queryFn,
                    staleTime: 5 * 60 * 1000, // 5 minutes
                    gcTime: 10 * 60 * 1000, // 10 minutes
                });
                setFeature(featureData);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to fetch feature'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeature();
    }, [featureId, queryClient]);

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
            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">{feature.name}</h4>
            {feature.description && (
                <p className="text-green-600 dark:text-green-300 text-sm">{feature.description}</p>
            )}
        </div>
    );
}

// Companion Display Wrapper
function CompanionDisplayWrapper({ companionId, choiceType, showHeader: _showHeader }: { companionId: number; choiceType: EntityAppliesToType.Familiar | EntityAppliesToType.AnimalCompanion; showHeader: boolean }): React.JSX.Element | null {
    const queryClient = useQueryClient();
    const [companion, setCompanion] = useState<GetCompanionResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchCompanion = async () => {
            if (!companionId) return;

            try {
                setIsLoading(true);
                setError(null);
                const companionData = await queryClient.fetchQuery({
                    queryKey: CompanionQueryHooks.getCompanionByIdQueryKey(companionId),
                    queryFn: () => CompanionQueryHooks.getCompanionByIdQueryFn({ pathParams: { id: companionId } }),
                    staleTime: 5 * 60 * 1000, // 5 minutes
                    gcTime: 10 * 60 * 1000, // 10 minutes
                });
                setCompanion(companionData);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to fetch companion'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchCompanion();
    }, [companionId, queryClient]);

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

    if (error || !companion) {
        return (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <p className="text-red-600 dark:text-red-400">Error loading companion details</p>
            </div>
        );
    }

    const companionName = companion.monster?.name || `Companion ${companion.id}`;
    const companionTypeName = COMPANION_TYPE_MAP[companion.type]?.name || (choiceType === EntityAppliesToType.Familiar ? 'Familiar' : 'Animal Companion');
    
    // Find the companion benefit progression from the companion's features
    const benefitProgression = companion.features?.find(
        p => p.featureId === SpecialFeatureId.CompanionBenefit && p.sourceType === FeatureSourceType.Companion
    ) || null;

    return (
        <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg">
            <h4 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-2">{companionTypeName}</h4>
            <p className="text-indigo-600 dark:text-indigo-300 mb-2">{companionName}</p>
            {choiceType === EntityAppliesToType.Familiar && benefitProgression && benefitProgression.entities && benefitProgression.entities.length > 0 && (
                <div className="mt-3">
                    <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200 mb-2">Benefits:</p>
                    <FeatureDisplay
                        feature={benefitProgression.feature}
                        progressions={[benefitProgression]}
                        showAddProgressionButton={false}
                    />
                </div>
            )}
        </div>
    );
}
