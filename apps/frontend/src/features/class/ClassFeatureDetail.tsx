import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { ClassFeatureService } from './ClassFeatureService';
import { GetClassFeatureResponse } from '@shared/schema';

export function ClassFeatureDetail() {
    const { slug } = useParams();
    const [feature, setFeature] = useState<GetClassFeatureResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { isAdmin } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const Initialize = async () => {
            try {
                const data = await ClassFeatureService.getClassFeatureBySlug(undefined, { slug: slug! });
                setFeature(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to initialize or fetch class feature:', error);
                setIsLoading(false);
            }
        };
        Initialize();
    }, [slug, location.state]);

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
                    Class feature not found
                </div>
            </div>
        </div>
    );

    return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h1 className="text-2xl font-bold mb-2">{feature.name || feature.slug}</h1>
                            {feature.name && feature.name !== feature.slug && (
                                <p className="text-gray-600 dark:text-gray-400 text-sm">Slug: {feature.slug}</p>
                            )}
                        </div>
                    </div>
                    <div className="mt-3 p-2 w-full prose dark:prose-invert">
                        <ProcessMarkdown markdown={feature.description || ''} id='description' />
                    </div>
                    <div className="mt-4 text-right">
                        <button type="button" onClick={() => navigate(`/admin/classes${fromListParams ? `?${fromListParams}` : ''}`)} className="inline-block px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 border dark:border-gray-500">Back to List</button>
                        {isAdmin && (
                            <Link to={`/admin/classes/features/${slug}/edit`} state={{ fromListParams: fromListParams }} className="ml-4 inline-block px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 border dark:border-gray-500">Edit Feature</Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 
