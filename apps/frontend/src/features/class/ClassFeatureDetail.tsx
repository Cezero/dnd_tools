import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { ClassFeatureService } from './ClassFeatureService';
import { GetClassFeatureResponse } from '@shared/schema';

export function ClassFeatureDetail() {
    const { id } = useParams();
    const [feature, setFeature] = useState<GetClassFeatureResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { isAdmin } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const Initialize = async () => {
            try {
                const data = await ClassFeatureService.getClassFeatureById(undefined, { id: parseInt(id!) });
                setFeature(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to initialize or fetch class feature:', error);
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

    if (!feature) return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    <p>Class feature not found.</p>
                    <Link to="/classes" className="text-blue-500 hover:text-blue-700">
                        Back to Classes
                    </Link>
                </div>
            </div>
        </div>
    );

    return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-2xl font-bold mb-2">{feature.name}</h1>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Slug: {feature.slug}</p>
                        </div>
                        {isAdmin && (
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => navigate(`/classes/features/${feature.id}/edit`)}
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => navigate('/classes')}
                                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                >
                                    Back to Classes
                                </button>
                            </div>
                        )}
                    </div>

                    {feature.description && (
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold mb-2">Description</h2>
                            <ProcessMarkdown
                                content={feature.description}
                                id={`class-feature-${feature.slug}-description`}
                            />
                        </div>
                    )}

                    {fromListParams && (
                        <div className="mt-4">
                            <Link
                                to={`/classes?${fromListParams}`}
                                className="text-blue-500 hover:text-blue-700"
                            >
                                ← Back to Class List
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 
