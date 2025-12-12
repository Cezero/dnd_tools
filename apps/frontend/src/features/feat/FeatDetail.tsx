import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { DetailPage } from '@/components/common/DetailPage';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { useCacheFunctions } from '@/services/cache';
import { FeatQueryHooks } from '@/services/query/FeatQueryHooks';
import { FEAT_TYPES, FEAT_BENEFIT_TYPE_BY_ID, FeatBenefitType, EDITION_MAP } from '@shared/static-data';
import { GetSourceDisplay } from '@shared/utils';

import { FeatOptions, getPrereqDisplayText } from './FeatUtil';

export function FeatDetail() {
    const { id } = useParams();
    const [prereqDisplayTexts, setPrereqDisplayTexts] = useState<Record<number, string>>({});
    const { isAdmin } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';
    const { getFeatNameById, getFeatureNameById } = useCacheFunctions();

    // Use TanStack Query hook
    const { data: feat, isLoading, error: _error } = FeatQueryHooks.useGetFeatById({
        pathParams: { id: parseInt(id!) },
        enabled: !!id
    });

    // Load prerequisite display texts when feat data changes
    useEffect(() => {
        const loadPrereqTexts = async () => {
            if (feat?.prereqs && feat.prereqs.length > 0) {
                const texts: Record<number, string> = {};
                for (let i = 0; i < feat.prereqs.length; i++) {
                    const prereq = feat.prereqs[i];
                    try {
                        texts[i] = await getPrereqDisplayText(prereq, getFeatNameById, getFeatureNameById);
                    } catch (error) {
                        console.error('Error loading prerequisite text:', error);
                        texts[i] = `Prerequisite ${i + 1}`;
                    }
                }
                setPrereqDisplayTexts(texts);
            }
        };

        loadPrereqTexts();
    }, [feat, getFeatNameById]);

    const handleBack = () => {
        navigate(`/feats${fromListParams ? `?${fromListParams}` : ''}`);
    };

    const handleEdit = () => {
        navigate(`/feats/${id}/edit`, { state: { fromListParams: fromListParams } });
    };

    if (isLoading) {
        return (
            <DetailPage
                isLoading={true}
                item={null}
                itemName="Feat"
                isAdmin={isAdmin}
                onBack={handleBack}
                onEdit={handleEdit}
            >
                <div>Loading...</div>
            </DetailPage>
        );
    }

    if (_error || !feat) {
        return (
            <DetailPage
                isLoading={false}
                item={null}
                itemName="Feat"
                isAdmin={isAdmin}
                onBack={handleBack}
                onEdit={handleEdit}
            >
                <div>Error loading feat or feat not found.</div>
            </DetailPage>
        );
    }

    return (
        <DetailPage
            isLoading={false}
            item={feat}
            itemName="Feat"
            isAdmin={isAdmin}
            onBack={handleBack}
            onEdit={handleEdit}
        >
            <div className="space-y-2">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h1 className="text-2xl font-bold">{feat.name}</h1>
                        <div className="mt-2">
                            <p><strong>Type:</strong> {FEAT_TYPES[feat.typeId]?.name || feat.typeId}</p>
                            <p><strong>Multi-Times:</strong> {feat.repeatable ? 'Yes' : 'No'}</p>
                            <p><strong>Uses Sub-ID:</strong> {feat.useSubId ? 'Yes' : 'No'}</p>
                            {feat.fighterBonus && <p><strong>Fighter Bonus Feat</strong></p>}
                        </div>
                    </div>
                    <div className="text-right">
                        <p><strong>Edition:</strong> {EDITION_MAP[feat.editionId]?.abbreviation}</p>
                        {feat.sourceBookInfo && feat.sourceBookInfo.length > 0 && (
                            <p><strong>Source:</strong> {GetSourceDisplay(feat.sourceBookInfo, true)}</p>
                        )}
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
                                    {FEAT_BENEFIT_TYPE_BY_ID[benefit.typeId]}: {FeatOptions(benefit.typeId).find(option => option.id === benefit.referenceId)?.name || ''} {benefit.typeId !== FeatBenefitType.PROFICIENCY && benefit.amount && benefit.amount > 0 ? `+${benefit.amount}` : benefit.typeId !== FeatBenefitType.PROFICIENCY && benefit.amount ? `${benefit.amount}` : ''}
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
        </DetailPage>
    );
} 
