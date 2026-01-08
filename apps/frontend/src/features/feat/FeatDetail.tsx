import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { DetailPage } from '@/components/common/DetailPage';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { displayStrategyFactory } from '@/lib/formatters';
import { ClassQueryHooks } from '@/services/query/ClassQueryHooks';
import { FeatQueryHooks } from '@/services/query/FeatQueryHooks';
import type { FeatureProgression, Feat, FeatQueryResponse } from '@shared/schema';
import { FEAT_TYPES, EDITION_MAP, FeatureSourceType, DisplayType, FeaturePrerequisiteType } from '@shared/static-data';
import { GetSourceDisplay } from '@shared/utils';

import { formatFeatureEntity } from './FeatUtil';

export function FeatDetail() {
    const { id } = useParams();
    const featId = id ? parseInt(id) : null;
    const [prereqDisplayTexts, setPrereqDisplayTexts] = useState<string[]>([]);
    const { isAdmin } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';
    const queryClient = useQueryClient();

    // Fetch feat metadata
    const { data: feat, isLoading: featLoading, error: _error } = FeatQueryHooks.useGetFeatById({
        pathParams: { id: featId! },
        enabled: !!featId
    });

    // Extract feature data from feat.featureProgressions (backend includes it)
    const featWithProgressions = feat as (typeof feat & { featureProgressions?: FeatureProgression[] }) | undefined;
    const featProgression = featWithProgressions?.featureProgressions?.find((p: FeatureProgression) =>
        p.sourceType === FeatureSourceType.Feat && p.featId === featId
    ) || featWithProgressions?.featureProgressions?.[0] || null;

    const feature = featProgression?.feature || null;

    // Format prerequisites using the display strategy system (Phase 6)
    useEffect(() => {
        if (!featProgression || !feature?.prerequisites || feature.prerequisites.length === 0) {
            setPrereqDisplayTexts([]);
            return;
        }

        const formatPrerequisites = async () => {
            try {
                // Prefetch prerequisite feats that aren't in cache
                const featPrereqIds = feature.prerequisites
                    .filter(prereq => prereq.type === FeaturePrerequisiteType.Feat)
                    .map(prereq => prereq.appliesToId)
                    .filter((id): id is number => id !== null && id !== undefined);

                // Prefetch prerequisite classes that aren't in cache (for ClassLevel prerequisites)
                const classPrereqIds = feature.prerequisites
                    .filter(prereq => prereq.type === FeaturePrerequisiteType.ClassLevel && prereq.appliesToId && prereq.appliesToId !== -1)
                    .map(prereq => prereq.appliesToId)
                    .filter((id): id is number => id !== null && id !== undefined);

                // Prefetch any prerequisite feats that aren't in cache
                const featPrefetchPromises = featPrereqIds.map(async (featId) => {
                    const cachedFeat = queryClient.getQueryData<Feat>(['feats', 'item', featId]);
                    const fullFeatsData = queryClient.getQueryData<FeatQueryResponse>(['feats', 'full']);
                    const isInFullCache = fullFeatsData?.results?.some(f => f.id === featId);

                    if (!cachedFeat && !isInFullCache) {
                        // Prefetch the prerequisite feat using the query hook's query function
                        try {
                            await queryClient.fetchQuery({
                                queryKey: ['feats', 'item', featId],
                                queryFn: () => FeatQueryHooks.getFeatByIdQueryFn({ pathParams: { id: featId } }),
                                staleTime: 5 * 60 * 1000,
                                gcTime: 10 * 60 * 1000,
                            });
                        } catch (error) {
                            // Silently fail - we'll just show the ID if the fetch fails
                            console.warn(`Failed to prefetch feat ${featId}:`, error);
                        }
                    }
                });

                // Prefetch any prerequisite classes that aren't in cache
                const classPrefetchPromises = classPrereqIds.map(async (classId) => {
                    const cachedClass = queryClient.getQueryData(['classes', 'item', classId]);
                    const classesCacheData = queryClient.getQueryData<{ results?: Array<{ id: number }> }>(['classes-cache']);
                    const isInCache = cachedClass || classesCacheData?.results?.some(c => c.id === classId);

                    if (!isInCache) {
                        // Prefetch the prerequisite class using the query hook's query function
                        try {
                            await queryClient.fetchQuery({
                                queryKey: ['classes', 'item', classId],
                                queryFn: () => ClassQueryHooks.getClassByIdQueryFn({ pathParams: { id: classId } }),
                                staleTime: 5 * 60 * 1000,
                                gcTime: 10 * 60 * 1000,
                            });
                        } catch (error) {
                            // Silently fail - we'll just show the ID if the fetch fails
                            console.warn(`Failed to prefetch class ${classId}:`, error);
                        }
                    }
                });

                // Wait for all prefetches to complete
                await Promise.all([...featPrefetchPromises, ...classPrefetchPromises]);

                // Use display strategy to format the progression (includes prerequisite formatting in Phase 6)
                const strategy = displayStrategyFactory.createStrategy(DisplayType.Detail);
                const displayResult = strategy.format(featProgression, { queryClient });

                // Get formatted prerequisites from the display result
                setPrereqDisplayTexts(displayResult.formattedPrerequisites || []);
            } catch (error) {
                console.error('Error formatting prerequisites:', error);
                setPrereqDisplayTexts([]);
            }
        };

        formatPrerequisites();
    }, [featProgression, feature?.prerequisites, queryClient]);

    const handleBack = () => {
        navigate(`/feats${fromListParams ? `?${fromListParams}` : ''}`);
    };

    const handleEdit = () => {
        navigate(`/feats/${id}/edit`, { state: { fromListParams: fromListParams } });
    };

    const isLoading = featLoading;

    if (isLoading) {
        return (
            <DetailPage
                isLoading={true}
                item={null}
                itemName="Feat"
                isAdmin={isAdmin}
                onBack={handleBack}
                onEdit={handleEdit}
            >
                <div>Loading...</div>
            </DetailPage>
        );
    }

    if (_error || !feat) {
        return (
            <DetailPage
                isLoading={false}
                item={null}
                itemName="Feat"
                isAdmin={isAdmin}
                onBack={handleBack}
                onEdit={handleEdit}
            >
                <div>Error loading feat or feat not found.</div>
            </DetailPage>
        );
    }

    // Use feature name if available, otherwise fall back to feat name
    const displayName = feature?.name || feat.name;
    const description = feature?.description || feat.description || '';
    const summary = feature?.summary || feat.summary;
    const entities = featProgression?.entities || [];

    return (
        <DetailPage
            isLoading={false}
            item={feat}
            itemName="Feat"
            isAdmin={isAdmin}
            onBack={handleBack}
            onEdit={handleEdit}
        >
            <div className="space-y-2">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h1 className="text-2xl font-bold">{displayName}</h1>
                        <div className="mt-2">
                            <p><strong>Type:</strong> {FEAT_TYPES[feat.typeId]?.name || feat.typeId}</p>
                            <p><strong>Multi-Times:</strong> {feat.repeatable ? 'Yes' : 'No'}</p>
                            <p><strong>Uses Sub-ID:</strong> {feat.useSubId ? 'Yes' : 'No'}</p>
                            {feat.fighterBonus && <p><strong>Fighter Bonus Feat</strong></p>}
                        </div>
                    </div>
                    <div className="text-right">
                        <p><strong>Edition:</strong> {EDITION_MAP[feat.editionId]?.abbreviation}</p>
                        {feat.sourceBookInfo && feat.sourceBookInfo.length > 0 && (
                            <p><strong>Source:</strong> {GetSourceDisplay(feat.sourceBookInfo, true)}</p>
                        )}
                    </div>
                </div>
                <div>
                    <ProcessMarkdown markdown={description} id='description' />
                </div>
                {summary && (
                    <div>
                        <h3 className="text-lg font-semibold">Summary</h3>
                        <ProcessMarkdown markdown={summary} id='summary' />
                    </div>
                )}
                {entities.length > 0 && featProgression && (
                    <div>
                        <h3 className="text-lg font-semibold">Benefits</h3>
                        <div className="flex flex-wrap items-center gap-2">
                            {entities.map((entity, index) => {
                                // Use the proper formatter to get skill names instead of IDs
                                const displayText = formatFeatureEntity(entity, featProgression);

                                return (
                                    <div key={index} className="rounded border p-1 dark:border-gray-500">
                                        {displayText || `Entity ${index + 1}`}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                {prereqDisplayTexts.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold">Prerequisites</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            {prereqDisplayTexts.map((text, index) => (
                                <div key={index} className="rounded border p-1 dark:border-gray-500">
                                    {text}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </DetailPage>
    );
} 
