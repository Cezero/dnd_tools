import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { DetailPage } from '@/components/common/DetailPage';
import { FeatureSystemApi } from '@/components/feature-system/FeatureSystemApi';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { displayStrategyFactory } from '@/lib/formatters';
import { GetFeatureResponse, FeatureWithRelations } from '@shared/schema';
import { DisplayType, FeatureSourceType } from '@shared/static-data';

import { FeatureQueryHooks } from './FeatureQueryHooks';

export function FeatureDetail() {
    const { id } = useParams();
    const { isAdmin, user } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';
    const fromPage = location.state?.fromPage || 'features'; // 'classes', 'races', or 'features'

    const featureId = id ? parseInt(id) : null;

    // Fetch feature data using TanStack Query (from database)
    const { data: feature, isLoading: isLoadingFeature, error: featureError } = useQuery({
        queryKey: FeatureQueryHooks.getFeatureByIdQueryKey(featureId!),
        queryFn: () => FeatureQueryHooks.getFeatureById(featureId!),
        enabled: !!featureId,
    });

    // Fetch feature progressions using TanStack Query (from database)
    const { data: features, isLoading: isLoadingProgressions } = useQuery({
        queryKey: FeatureQueryHooks.getFeatureProgressionsQueryKey(featureId!),
        queryFn: () => FeatureQueryHooks.getFeatureProgressions(featureId!),
        enabled: !!featureId,
    });

    // Fetch lock status (only for admin users)
    const { data: lockStatus } = useQuery({
        queryKey: ['feature', 'lock-status', featureId],
        queryFn: () => FeatureSystemApi.getFeatureLockStatus({ id: featureId! }),
        enabled: !!featureId && isAdmin,
    });

    const isLoading = isLoadingFeature || isLoadingProgressions;

    const handleBack = () => {
        const backLink = getBackLink();
        navigate(backLink);
    };

    const handleEdit = () => {
        navigate(`/features/${id}/edit`, { state: { fromListParams: fromListParams, fromPage: fromPage } });
    };

    const getBackLink = () => {
        switch (fromPage) {
            case 'classes':
                return fromListParams ? `/classes?${fromListParams}` : '/classes';
            case 'races':
                return fromListParams ? `/races?${fromListParams}` : '/races';
            default:
                return fromListParams ? `/features?${fromListParams}` : '/features';
        }
    };

    if (isLoading) {
        return (
            <DetailPage
                isLoading={true}
                item={null}
                itemName="Feature"
                isAdmin={isAdmin}
                onBack={handleBack}
                onEdit={handleEdit}
            >
                <div>Loading...</div>
            </DetailPage>
        );
    }

    if (featureError || !feature) {
        return (
            <DetailPage
                isLoading={false}
                item={null}
                itemName="Feature"
                isAdmin={isAdmin}
                onBack={handleBack}
                onEdit={handleEdit}
            >
                <div>{featureError ? 'Error loading feature' : 'Feature not found'}</div>
            </DetailPage>
        );
    }

    return (
        <DetailPage
            isLoading={false}
            item={feature}
            itemName="Feature"
            isAdmin={isAdmin}
            onBack={handleBack}
            onEdit={handleEdit}
            lockStatus={lockStatus}
            currentUserId={user?.id}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h1 className="text-2xl font-bold mb-2">{feature.name}</h1>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Slug: {feature.slug}</p>
                </div>
            </div>

            {feature.summary && (
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">Summary</h2>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{feature.summary}</p>
                </div>
            )}

            {feature.description && (
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">Description</h2>
                    <ProcessMarkdown
                        markdown={feature.description}
                        id={`feature-${feature.slug}-description`}
                    />
                </div>
            )}

            {/* Feature Features */}
            {features && features.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">Features</h2>
                    <div className="space-y-4">
                        {features.map((feature) => (
                            <div key={feature.id} className="border border-gray-200 rounded-md dark:border-gray-600 p-4">
                                <div className="mb-2">
                                    <h3 className="text-lg font-medium">
                                        Level {feature.level}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Source Type: {Object.keys(FeatureSourceType).find(key => FeatureSourceType[key as keyof typeof FeatureSourceType] === feature.sourceType) || `Unknown (${feature.sourceType})`}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    {feature.entities && feature.entities.length > 0 && (
                                        <div>
                                            <h4 className="font-medium">Entities:</h4>
                                            <ul className="text-sm text-gray-600 dark:text-gray-400">
                                                {feature.entities.map((entity, index) => {
                                                    const strategy = displayStrategyFactory.createStrategy(DisplayType.Detail);
                                                    const formatter = strategy.format({ ...feature, entities: [entity] });
                                                    return (
                                                        <li key={index}>
                                                            {formatter.levelEntries[0]?.items[0]?.formattedValue || 'No preview'}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </DetailPage>
    );
} 
