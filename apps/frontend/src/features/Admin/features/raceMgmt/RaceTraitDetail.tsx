import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { ProcessMarkdown } from '@/components/Markdown/ProcessMarkdown';
import { UseAuth } from '@/components/auth/AuthProvider';
import { FetchRaceTraitBySlug } from '@/features/admin/features/raceMgmt/services/RaceTraitService';

export function RaceTraitDetail() {
    const { slug } = useParams();
    const [trait, setTrait] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = UseAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const Initialize = async () => {
            try {
                const data = await FetchRaceTraitBySlug(slug);
                setTrait(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to fetch race trait:', error);
                setIsLoading(false);
            }
        };
        Initialize();
    }, [slug]);

    const innerCellContentClasses = "p-3 bg-white dark:bg-gray-700 dark:border-gray-500 rounded-lg border w-full";
    const outerContainerClasses = "w-4/5 mx-auto border-2 border-gray-400 dark:border-gray-500 rounded-lg shadow-lg p-1";

    if (isLoading) return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    Loading...
                </div>
            </div>
        </div>
    );
    if (!trait) return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    Race Trait not found
                </div>
            </div>
        </div>
    );

    return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    <div className="flex justify-between items-start mb-2">
                        <h1 className="text-2xl font-bold">{trait.name} ({trait.slug})</h1>
                        <div className="text-right">
                            <p><strong>Has Value:</strong> {trait.has_value ? 'Yes' : 'No'}</p>
                        </div>
                    </div>
                    <div className="mt-3 p-2 w-full rounded bg-gray-50 dark:bg-gray-700 prose dark:prose-invert">
                        <ProcessMarkdown markdown={trait.desc} />
                    </div>
                    <div className="mt-4 text-right">
                        <button type="button" onClick={() => navigate(`/admin/races${fromListParams ? `?${fromListParams}` : ''}`)} className="inline-block px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 border dark:border-gray-500">Back to List</button>
                        {user && user.is_admin && (
                            <Link to={`/admin/races/traits/${slug}/edit`} state={{ fromListParams: fromListParams }} className="ml-4 inline-block px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 border dark:border-gray-500">Edit Trait</Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 