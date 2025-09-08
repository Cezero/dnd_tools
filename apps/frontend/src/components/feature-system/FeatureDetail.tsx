import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { FeatureSystemApi } from '@/components/feature-system/FeatureSystemApi';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { displayStrategyFactory } from '@/lib/formatters';
import { GetFeatureResponse, FeatureProgression } from '@shared/schema';
import { DisplayType, FeatureSourceType } from '@shared/static-data';

export function FeatureDetail() {
    const { id } = useParams();
    const [feature, setFeature] = useState<GetFeatureResponse | null>(null);
    const [featureProgressions, setFeatureProgressions] = useState<FeatureProgression[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { isAdmin } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';
    const fromPage = location.state?.fromPage || 'features'; // 'classes', 'races', or 'features'

    useEffect(() => {
        const Initialize = async () => {
            try {
                // Pass the string ID directly - Zod schema will transform it to number
                const data = await FeatureSystemApi.getFeatureById(undefined, { id: parseInt(id!) });
                setFeature(data);

                // Load feature progressions for this feature
                const progressions = await FeatureSystemApi.getFeatureProgressions(undefined, { id: parseInt(id!) });
                setFeatureProgressions(progressions);

                setIsLoading(false);
            } catch (error) {
                console.error('Failed to initialize or fetch feature:', error);
                setIsLoading(false);
            }
        };
        Initialize();
    }, [id, location.state]);

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

    const getBackText = () => {
        switch (fromPage) {
            case 'classes':
                return 'Back to Classes';
            case 'races':
                return 'Back to Races';
            default:
                return 'Back to Features';
        }
    };

    if (isLoading) return (
        <div className="pt-8">
            <div className="w-4/5 mx-auto border-2 border-gray-400 dark:border-gray-600 rounded-lg shadow-lg p-1">
                <div className="p-3 bg-content border-content rounded-lg border w-full">
                    Loading...
                </div>
            </div>
        </div>
    );

    if (!feature) return (
        <div className="pt-8">
            <div className="w-4/5 mx-auto border-2 border-gray-400 dark:border-gray-600 rounded-lg shadow-lg p-1">
                <div className="p-3 bg-content border-content rounded-lg border w-full">
                    <p>Feature not found.</p>
                    <Link to={getBackLink()} className="text-blue-500 hover:text-blue-700">
                        {getBackText()}
                    </Link>
                </div>
            </div>
        </div>
    );

    return (
        <div className="pt-8">
            <div className="w-4/5 mx-auto border-2 border-gray-400 dark:border-gray-600 rounded-lg shadow-lg p-1">
                <div className="p-3 bg-content border-content rounded-lg border w-full">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-2xl font-bold mb-2">{feature.name}</h1>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Slug: {feature.slug}</p>
                        </div>
                        {isAdmin && (
                            <div className="flex space-x-2">
                                <button
                                    onClick={handleEdit}
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={handleBack}
                                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                >
                                    {getBackText()}
                                </button>
                            </div>
                        )}
                    </div>

                    {feature.description && (
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold mb-2">Description</h2>
                            <ProcessMarkdown
                                markdown={feature.description}
                                id={`feature-${feature.slug}-description`}
                            />
                        </div>
                    )}

                    {/* Feature Progressions */}
                    {featureProgressions.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold mb-2">Progressions</h2>
                            <div className="space-y-4">
                                {featureProgressions.map((progression) => (
                                    <div key={progression.id} className="border border-gray-200 rounded-md dark:border-gray-600 p-4">
                                        <div className="mb-2">
                                            <h3 className="text-lg font-medium">
                                                Level {progression.level}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Source Type: {Object.keys(FeatureSourceType).find(key => FeatureSourceType[key as keyof typeof FeatureSourceType] === progression.sourceType) || `Unknown (${progression.sourceType})`}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            {progression.entities && progression.entities.length > 0 && (
                                                <div>
                                                    <h4 className="font-medium">Entities:</h4>
                                                    <ul className="text-sm text-gray-600 dark:text-gray-400">
                                                        {progression.entities.map((entity, index) => {
                                                            const strategy = displayStrategyFactory.createStrategy(DisplayType.Detail);
                                                            const formatter = strategy.format({ ...progression, entities: [entity] });
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

                    {fromListParams && (
                        <div className="mt-4">
                            <Link
                                to={getBackLink()}
                                className="text-blue-500 hover:text-blue-700"
                            >
                                ← {getBackText()}
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 
