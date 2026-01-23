import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { DetailPage } from '@/components/common/DetailPage';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { displayStrategyFactory } from '@/lib/formatters';
import { usePrecacheFeatureEntities } from '@/lib/formatters/hooks/usePrecacheFeatureEntities';
import { getSourceDisplay } from '@/services/cache';
import type { FeatureWithRelations } from '@shared/schema';
import { FEAT_TYPES, EDITION_MAP, FeatureSourceType, DisplayType } from '@shared/static-data';

import { FeatQueryHooks } from './FeatQueryHooks';
import { formatFeatureEntity } from './FeatUtil';

export function FeatDetail() {
    const { id } = useParams();
    const featId = id ? parseInt(id) : null;
    const [prereqDisplayTexts, setPrereqDisplayTexts] = useState<string[]>([]);
    const { isAdmin } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    // Fetch feat metadata
    const { data: feat, isLoading: featLoading, error: _error } = FeatQueryHooks.useGetFeatById({
        pathParams: { id: featId! },
        enabled: !!featId
    });

    // Extract feature data from feat.features (backend includes it)
    const featWithProgressions = feat as (typeof feat & { features?: FeatureWithRelations[] }) | undefined;
    const featProgression = featWithProgressions?.features?.find((p: FeatureWithRelations) =>
        p.sourceType === FeatureSourceType.Feat && p.featId === featId
    ) || featWithProgressions?.features?.[0] || null;

    const feature = featProgression || null;

    // Precache all entities referenced in feature features (including prerequisites)
    const featProgressions = featProgression ? [featProgression] : [];
    const { isComplete: entitiesPrecached } = usePrecacheFeatureEntities(featProgressions);

    // Format prerequisites using the display strategy system (Phase 6)
    useEffect(() => {
        if (!featProgression || !feature?.prerequisites || feature.prerequisites.length === 0 || !entitiesPrecached) {
            if (!featProgression || !feature?.prerequisites || feature.prerequisites.length === 0) {
                setPrereqDisplayTexts([]);
            }
            return;
        }

        const formatPrerequisites = async () => {
            try {
                // Use display strategy to format the feature (includes prerequisite formatting in Phase 6)
                const strategy = displayStrategyFactory.createStrategy(DisplayType.Detail);
                const displayResult = strategy.format(featProgression);

                // Get formatted prerequisites from the display result
                setPrereqDisplayTexts(displayResult.formattedPrerequisites || []);
            } catch (error) {
                console.error('Error formatting prerequisites:', error);
                setPrereqDisplayTexts([]);
            }
        };

        formatPrerequisites();
    }, [featProgression, feature?.prerequisites, entitiesPrecached]);

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
    const description = feature?.description || '';
    const summary = feature?.summary;
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
                            <p><strong>Source:</strong> {getSourceDisplay(feat.sourceBookInfo, true)}</p>
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
