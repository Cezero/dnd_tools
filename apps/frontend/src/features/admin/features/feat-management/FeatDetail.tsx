import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { UseAuth } from '@/components/auth/AuthProvider';
import { FetchFeatById } from '@/features/admin/features/feat-management/FeatService';
import { FEAT_TYPES, FEAT_BENEFIT_TYPES, FEAT_PREREQUISITE_TYPES } from '@shared/static-data';

export function FeatDetail() {
    const { id } = useParams();
    const [feat, setFeat] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = UseAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const Initialize = async () => {
            try {
                const data = await FetchFeatById(id);
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
                        <h1 className="text-2xl font-bold">{feat.feat_name}</h1>
                        <div className="text-right">
                            <p><strong>Type:</strong> {FEAT_TYPES[feat.feat_type]?.name || feat.feat_type}</p>
                            <p><strong>Multi-Times:</strong> {feat.feat_multi_times ? 'Yes' : 'No'}</p>
                        </div>
                    </div>
                    <div className="mt-3 p-2 w-full rounded bg-gray-50 dark:bg-gray-700 prose dark:prose-invert">
                        <h3 className="text-lg font-bold">Description:</h3>
                        <ProcessMarkdown markdown={feat.feat_description} />
                    </div>
                    {feat.feat_benefit && (
                        <div className="mt-3 p-2 w-full rounded bg-gray-50 dark:bg-gray-700 prose dark:prose-invert">
                            <h3 className="text-lg font-bold">Benefit:</h3>
                            <ProcessMarkdown markdown={feat.feat_benefit} />
                        </div>
                    )}
                    {feat.feat_normal && (
                        <div className="mt-3 p-2 w-full rounded bg-gray-50 dark:bg-gray-700 prose dark:prose-invert">
                            <h3 className="text-lg font-bold">Normal:</h3>
                            <ProcessMarkdown markdown={feat.feat_normal} />
                        </div>
                    )}
                    {feat.feat_special && (
                        <div className="mt-3 p-2 w-full rounded bg-gray-50 dark:bg-gray-700 prose dark:prose-invert">
                            <h3 className="text-lg font-bold">Special:</h3>
                            <ProcessMarkdown markdown={feat.feat_special} />
                        </div>
                    )}
                    {feat.feat_prereq && (
                        <div className="mt-3 p-2 w-full rounded bg-gray-50 dark:bg-gray-700 prose dark:prose-invert">
                            <h3 className="text-lg font-bold">Prerequisite:</h3>
                            <ProcessMarkdown markdown={feat.feat_prereq} />
                        </div>
                    )}

                    {feat.benefits && feat.benefits.length > 0 && (
                        <div className="mt-3">
                            <h3 className="text-lg font-bold mb-2">Benefits</h3>
                            <div className="space-y-2">
                                {feat.benefits.map(benefit => (
                                    <div key={benefit.benefit_id} className="rounded border p-2 dark:border-gray-700">
                                        <p><strong>Type:</strong> {FEAT_BENEFIT_TYPES[benefit.benefit_type]?.name || benefit.benefit_type}</p>
                                        {benefit.benefit_type_id && <p><strong>Type ID:</strong> {benefit.benefit_type_id}</p>}
                                        {benefit.benefit_amount && <p><strong>Amount:</strong> {benefit.benefit_amount}</p>}
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
                                    <div key={prereq.prereq_id} className="rounded border p-2 dark:border-gray-700">
                                        <p><strong>Type:</strong> {FEAT_PREREQUISITE_TYPES[prereq.prereq_type]?.name || prereq.prereq_type}</p>
                                        {prereq.prereq_type_id && <p><strong>Type ID:</strong> {prereq.prereq_type_id}</p>}
                                        {prereq.prereq_amount && <p><strong>Amount:</strong> {prereq.prereq_amount}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-4 text-right">
                        <button type="button" onClick={() => navigate(`/admin/feats${fromListParams ? `?${fromListParams}` : ''}`)} className="inline-block px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 border dark:border-gray-500">Back to List</button>
                        {user && user.is_admin && (
                            <Link to={`/admin/feats/${id}/edit`} state={{ fromListParams: fromListParams }} className="ml-4 inline-block px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 border dark:border-gray-500">Edit Feat</Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 