import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { DetailPage } from '@/components/common/DetailPage';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { FeatApi } from '@/features/feat/FeatApi';
import { Feat } from '@shared/schema';
import { FEAT_TYPES, FEAT_BENEFIT_TYPE_BY_ID, FeatBenefitType } from '@shared/static-data';

import { FeatOptions, getPrereqDisplayText } from './FeatUtil';

export function FeatDetail() {
    const { id } = useParams();
    const [feat, setFeat] = useState<Feat | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [prereqDisplayTexts, setPrereqDisplayTexts] = useState<Record<number, string>>({});
    const { isAdmin } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const Initialize = async () => {
            try {
                const data = await FeatApi.getFeatById(undefined, { id: parseInt(id!) });
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

    const handleBack = () => {
        navigate(`/feats${fromListParams ? `?${fromListParams}` : ''}`);
    };

    const handleEdit = () => {
        navigate(`/feats/${id}/edit`, { state: { fromListParams: fromListParams } });
    };

    return (
        <DetailPage
            isLoading={isLoading}
            item={feat}
            itemName="Feat"
            isAdmin={isAdmin}
            onBack={handleBack}
            onEdit={handleEdit}
        >
            <div className="space-y-2">
                <div className="flex justify-between items-start mb-2">
                    <h1 className="text-2xl font-bold">{feat!.name}</h1>
                    <div className="text-right">
                        <p><strong>Type:</strong> {FEAT_TYPES[feat!.typeId]?.name || feat!.typeId}</p>
                        <p><strong>Multi-Times:</strong> {feat!.repeatable ? 'Yes' : 'No'}</p>
                        {feat!.fighterBonus && <p><strong>Fighter Bonus Feat</strong></p>}
                    </div>
                </div>
                <div>
                    <ProcessMarkdown markdown={feat!.description || ''} id='description' />
                </div>
                {feat!.benefit && (
                    <div>
                        <h3 className="text-lg font-semibold">Benefit</h3>
                        <ProcessMarkdown markdown={feat!.benefit} id='benefit' />
                    </div>
                )}
                {feat!.benefits && feat!.benefits.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2">
                            {feat!.benefits.map((benefit, index) => (
                                <div key={index} className="rounded border p-1 dark:border-gray-500">
                                    {FEAT_BENEFIT_TYPE_BY_ID[benefit.typeId]}: {FeatOptions(benefit.typeId).find(option => option.value === benefit.referenceId)?.label || ''} {benefit.typeId !== FeatBenefitType.PROFICIENCY && benefit.amount && benefit.amount > 0 ? `+${benefit.amount}` : benefit.typeId !== FeatBenefitType.PROFICIENCY && benefit.amount ? `${benefit.amount}` : ''}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {feat!.normalEffect && (
                    <div>
                        <h3 className="text-lg font-semibold">Normal</h3>
                        <ProcessMarkdown markdown={feat!.normalEffect} id='normal' />
                    </div>
                )}
                {feat!.specialEffect && (
                    <div>
                        <h3 className="text-lg font-semibold">Special</h3>
                        <ProcessMarkdown markdown={feat!.specialEffect} id='special' />
                    </div>
                )}
                {feat!.prereqs && feat!.prereqs.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold">Prerequisite</h3>
                        {feat!.prerequisites && (
                            <ProcessMarkdown markdown={feat!.prerequisites} id='prerequisites' />
                        )}
                        <div className="flex items-center gap-2 mt-2">
                            {feat!.prereqs.map((prereq, index) => (
                                <div key={index} className="rounded border p-1 dark:border-gray-500">
                                    {prereqDisplayTexts[index] || 'Loading...'}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </DetailPage>
    );
} 
