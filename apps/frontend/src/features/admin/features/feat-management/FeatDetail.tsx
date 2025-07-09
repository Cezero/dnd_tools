import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { FeatService } from '@/features/admin/features/feat-management/FeatService';
import { GetFeatResponse } from '@shared/schema';
import { FEAT_TYPES, FEAT_BENEFIT_TYPE_BY_ID, FEAT_PREREQ_BY_ID, FeatBenefitType } from '@shared/static-data';
import { FeatOptions, getPrereqDisplayText } from './FeatUtil';

export function FeatDetail() {
    const { id } = useParams();
    const [feat, setFeat] = useState<GetFeatResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [prereqDisplayTexts, setPrereqDisplayTexts] = useState<Record<number, string>>({});
    const { isAdmin } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const Initialize = async () => {
            try {
                const data = await FeatService.getFeatById(undefined, { id: parseInt(id!) });
                setFeat(data);

                // Load prerequisite display texts
                if (data.prereqs && data.prereqs.length > 0) {
                    const texts: Record<number, string> = {};
                    for (let i = 0; i < data.prereqs.length; i++) {
                        const prereq = data.prereqs[i];
                        texts[i] = await getPrereqDisplayText(prereq);
                    }
                    setPrereqDisplayTexts(texts);
                }

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
                    <div className="space-y-2">
                        <div className="flex justify-between items-start mb-2">
                            <h1 className="text-2xl font-bold">{feat.name}</h1>
                            <div className="text-right">
                                <p><strong>Type:</strong> {FEAT_TYPES[feat.typeId]?.name || feat.typeId}</p>
                                <p><strong>Multi-Times:</strong> {feat.repeatable ? 'Yes' : 'No'}</p>
                                {feat.fighterBonus && <p><strong>Fighter Bonus Feat</strong></p>}
                            </div>
                        </div>
                        <div>
                            <ProcessMarkdown markdown={feat.description || ''} id='description' />
                        </div>
                        {feat.benefit && (
                            <div>
                                <h3 className="text-lg font-semibold">Benefit</h3>
                                <ProcessMarkdown markdown={feat.benefit} id='benefit' />
                            </div>
                        )}
                        {feat.benefits && feat.benefits.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2">
                                    {feat.benefits.map((benefit, index) => (
                                        <div key={index} className="rounded border p-1 dark:border-gray-500">
                                            {FEAT_BENEFIT_TYPE_BY_ID[benefit.typeId]}: {FeatOptions(benefit.typeId).find(option => option.value === benefit.referenceId)?.label || ''} {benefit.typeId !== FeatBenefitType.PROFICIENCY && benefit.amount && benefit.amount > 0 ? `+${benefit.amount}` : benefit.typeId !== FeatBenefitType.PROFICIENCY && benefit.amount ? `${benefit.amount}` : ''}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {feat.normalEffect && (
                            <div>
                                <h3 className="text-lg font-semibold">Normal</h3>
                                <ProcessMarkdown markdown={feat.normalEffect} id='normal' />
                            </div>
                        )}
                        {feat.specialEffect && (
                            <div>
                                <h3 className="text-lg font-semibold">Special</h3>
                                <ProcessMarkdown markdown={feat.specialEffect} id='special' />
                            </div>
                        )}
                        {feat.prereqs && feat.prereqs.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold">Prerequisite</h3>
                                {feat.prerequisites && (
                                    <ProcessMarkdown markdown={feat.prerequisites} id='prerequisites' />
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                    {feat.prereqs.map((prereq, index) => (
                                        <div key={index} className="rounded border p-1 dark:border-gray-500">
                                            {prereqDisplayTexts[index] || 'Loading...'}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
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