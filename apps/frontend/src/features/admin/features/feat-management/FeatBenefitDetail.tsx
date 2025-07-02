import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { UseAuth } from '@/components/auth/AuthProvider';
import { FetchFeatBenefitById } from '@/features/admin/features/feat-management/FeatBenefitService';
import { FEAT_BENEFIT_TYPES } from '@shared/static-data';

export function FeatBenefitDetail() {
    const { id } = useParams();
    const [benefit, setBenefit] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = UseAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const Initialize = async () => {
            try {
                const data = await FetchFeatBenefitById(id);
                setBenefit(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to fetch feat benefit:', error);
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
    if (!benefit) return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    Feat Benefit not found
                </div>
            </div>
        </div>
    );

    return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    <div className="flex justify-between items-start mb-2">
                        <h1 className="text-2xl font-bold">Feat Benefit: {benefit.benefit_id}</h1>
                        <div className="text-right">
                            <p><strong>Feat ID:</strong> {benefit.feat_id}</p>
                            <p><strong>Benefit Type:</strong> {FEAT_BENEFIT_TYPES[benefit.benefit_type]?.name || benefit.benefit_type}</p>
                            {benefit.benefit_type_id && <p><strong>Benefit Type ID:</strong> {benefit.benefit_type_id}</p>}
                            {benefit.benefit_amount && <p><strong>Benefit Amount:</strong> {benefit.benefit_amount}</p>}
                        </div>
                    </div>
                    <div className="mt-4 text-right">
                        <button type="button" onClick={() => navigate(`/admin/feats/benefits${fromListParams ? `?${fromListParams}` : ''}`)} className="inline-block px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 border dark:border-gray-500">Back to List</button>
                        {user && user.is_admin && (
                            <Link to={`/admin/feats/benefits/${id}/edit`} state={{ fromListParams: fromListParams }} className="ml-4 inline-block px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 border dark:border-gray-500">Edit Benefit</Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 