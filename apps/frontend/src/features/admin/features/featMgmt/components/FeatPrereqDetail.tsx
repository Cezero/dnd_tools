import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { UseAuth } from '@/auth/AuthProvider';
import { FetchFeatPrereqById } from '@/features/admin/features/featMgmt/services/FeatPrereqService';
import { FEAT_PREREQUISITE_TYPES } from '@shared/static-data';

export function FeatPrereqDetail() {
    const { id } = useParams();
    const [prereq, setPrereq] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = UseAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const Initialize = async () => {
            try {
                const data = await FetchFeatPrereqById(id);
                setPrereq(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to fetch feat prerequisite:', error);
                setIsLoading(false);
            }
        };
        Initialize();
    }, [id]);

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
    if (!prereq) return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    Feat Prerequisite not found
                </div>
            </div>
        </div>
    );

    return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    <div className="flex justify-between items-start mb-2">
                        <h1 className="text-2xl font-bold">Feat Prerequisite: {prereq.prereq_id}</h1>
                        <div className="text-right">
                            <p><strong>Feat ID:</strong> {prereq.feat_id}</p>
                            <p><strong>Prerequisite Type:</strong> {FEAT_PREREQUISITE_TYPES[prereq.prereq_type]?.name || prereq.prereq_type}</p>
                            {prereq.prereq_type_id && <p><strong>Prerequisite Type ID:</strong> {prereq.prereq_type_id}</p>}
                            {prereq.prereq_amount && <p><strong>Prerequisite Amount:</strong> {prereq.prereq_amount}</p>}
                        </div>
                    </div>
                    <div className="mt-4 text-right">
                        <button type="button" onClick={() => navigate(`/admin/feats/prereqs${fromListParams ? `?${fromListParams}` : ''}`)} className="inline-block px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 border dark:border-gray-500">Back to List</button>
                        {user && user.is_admin && (
                            <Link to={`/admin/feats/prereqs/${id}/edit`} state={{ fromListParams: fromListParams }} className="ml-4 inline-block px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 border dark:border-gray-500">Edit Prerequisite</Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 