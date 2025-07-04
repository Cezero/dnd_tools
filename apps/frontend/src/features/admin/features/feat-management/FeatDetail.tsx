import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { FeatService } from '@/features/admin/features/feat-management/FeatService';
import { FeatResponse } from '@shared/schema';
import { FEAT_TYPES, FEAT_BENEFIT_TYPES, FEAT_PREREQUISITE_TYPES } from '@shared/static-data';

export function FeatDetail() {
    const { id } = useParams();
    const [feat, setFeat] = useState<FeatResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { isAdmin } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const Initialize = async () => {
            try {
                const data = await FeatService.getFeatById(undefined, { id: parseInt(id!) });
                setFeat(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to initialize or fetch feat:', error);
                setIsLoading(false);
            }
        };
        Initialize();
    }, [id, location.state]);

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
    if (!feat) return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    Feat not found
                </div>
            </div>
        </div>
    );

    return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    <div className="flex justify-between items-start mb-2">
                        <h1 className="text-2xl font-bold">{feat.name}</h1>
                        <div className="text-right">
                            <p><strong>Type:</strong> {FEAT_TYPES[feat.typeId]?.name || feat.typeId}</p>
                            <p><strong>Multi-Times:</strong> {feat.repeatable ? 'Yes' : 'No'}</p>
                        </div>
                    </div>
                    <div className="mt-3 p-2 w-full rounded bg-gray-50 dark:bg-gray-700 prose dark:prose-invert">
                        <h3 className="text-lg font-bold">Description:</h3>
                        <ProcessMarkdown markdown={feat.description || ''} />
                    </div>
                    {feat.benefit && (
                        <div className="mt-3 p-2 w-full rounded bg-gray-50 dark:bg-gray-700 prose dark:prose-invert">
                            <h3 className="text-lg font-bold">Benefit:</h3>
                            <ProcessMarkdown markdown={feat.benefit} />
                        </div>
                    )}
                    {feat.normalEffect && (
                        <div className="mt-3 p-2 w-full rounded bg-gray-50 dark:bg-gray-700 prose dark:prose-invert">
                            <h3 className="text-lg font-bold">Normal:</h3>
                            <ProcessMarkdown markdown={feat.normalEffect} />
                        </div>
                    )}
                    {feat.specialEffect && (
                        <div className="mt-3 p-2 w-full rounded bg-gray-50 dark:bg-gray-700 prose dark:prose-invert">
                            <h3 className="text-lg font-bold">Special:</h3>
                            <ProcessMarkdown markdown={feat.specialEffect} />
                        </div>
                    )}
                    {feat.prerequisites && (
                        <div className="mt-3 p-2 w-full rounded bg-gray-50 dark:bg-gray-700 prose dark:prose-invert">
                            <h3 className="text-lg font-bold">Prerequisite:</h3>
                            <ProcessMarkdown markdown={feat.prerequisites} />
                        </div>
                    )}

                    {feat.benefits && feat.benefits.length > 0 && (
                        <div className="mt-3">
                            <h3 className="text-lg font-bold mb-2">Benefits</h3>
                            <div className="space-y-2">
                                {feat.benefits.map(benefit => (
                                    <div key={benefit.index} className="rounded border p-2 dark:border-gray-700">
                                        <p><strong>Type:</strong> {FEAT_BENEFIT_TYPES[benefit.typeId]?.name || benefit.typeId}</p>
                                        {benefit.referenceId && <p><strong>Reference ID:</strong> {benefit.referenceId}</p>}
                                        {benefit.amount && <p><strong>Amount:</strong> {benefit.amount}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {feat.prereqs && feat.prereqs.length > 0 && (
                        <div className="mt-3">
                            <h3 className="text-lg font-bold mb-2">Prerequisites</h3>
                            <div className="space-y-2">
                                {feat.prereqs.map(prereq => (
                                    <div key={prereq.index} className="rounded border p-2 dark:border-gray-700">
                                        <p><strong>Type:</strong> {FEAT_PREREQUISITE_TYPES[prereq.typeId]?.name || prereq.typeId}</p>
                                        {prereq.referenceId && <p><strong>Reference ID:</strong> {prereq.referenceId}</p>}
                                        {prereq.amount && <p><strong>Amount:</strong> {prereq.amount}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-4 text-right">
                        <button type="button" onClick={() => navigate(`/admin/feats${fromListParams ? `?${fromListParams}` : ''}`)} className="inline-block px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 border dark:border-gray-500">Back to List</button>
                        {isAdmin && (
                            <Link to={`/admin/feats/${id}/edit`} state={{ fromListParams: fromListParams }} className="ml-4 inline-block px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 border dark:border-gray-500">Edit Feat</Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 