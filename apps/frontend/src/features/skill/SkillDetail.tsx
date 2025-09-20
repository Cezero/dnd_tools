import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { DetailPage } from '@/components/common/DetailPage';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { SkillApi } from '@/features/skill/SkillApi';
import { GetSkillResponse } from '@shared/schema';
import { ABILITY_MAP, SKILL_RETRY_TYPE_MAP } from '@shared/static-data';

export function SkillDetail(): React.JSX.Element {
    const { id } = useParams();
    const [skill, setSkill] = useState<GetSkillResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const { isAdmin } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const Initialize = async (): Promise<void> => {
            try {
                const data = await SkillApi.getSkillById(undefined, { id: parseInt(id!) });
                setSkill(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to initialize or fetch skill:', error);
                setIsLoading(false);
            }
        };
        Initialize();
    }, [id, location.state]);

    const handleBack = () => {
        navigate(`/skills${fromListParams ? `?${fromListParams}` : ''}`);
    };

    const handleEdit = () => {
        navigate(`/skills/${id}/edit`, { state: { fromListParams: fromListParams } });
    };

    return (
        <DetailPage
            isLoading={isLoading}
            item={skill}
            itemName="Skill"
            isAdmin={isAdmin}
            onBack={handleBack}
            onEdit={handleEdit}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">{skill!.name}</h1>
                    <h1 className="text-1xl font-bold">({ABILITY_MAP[skill!.abilityId]?.abbreviation})</h1>
                </div>
                <div className="text-right">
                    <p><strong>Trained Only:</strong> {skill!.trainedOnly ? 'Yes' : 'No'}</p>
                    <p><strong>Armor Check Penalty:</strong> {skill!.affectedByArmor ? 'Yes' : 'No'}</p>
                    <p><strong>Analog:</strong> {skill!.isAnalog ? 'Yes' : 'No'}</p>
                </div>
            </div>
            <div>
                <div className="w-full mb-2">
                    <ProcessMarkdown markdown={skill!.description} id='description' />
                </div>
                <div className="flex items-start mb-2">
                    <div className="font-bold w-30">
                        Check:
                    </div>
                    <div className="w-4/5">
                        <ProcessMarkdown markdown={skill!.checkDescription} id='check' />
                    </div>
                </div>
                <div className="flex items-start mb-2">
                    <div className="font-bold w-30">
                        Action:
                    </div>
                    <div className="w-4/5">
                        <ProcessMarkdown markdown={skill!.actionDescription} id='action' />
                    </div>
                </div>
                {skill!.retryDescription && (
                    <div className="flex items-start mb-2">
                        <div className="w-30 flex items-center gap-2">
                            <div className="font-bold">
                                Try Again:
                            </div>
                            <div>
                                {SKILL_RETRY_TYPE_MAP[skill!.retryTypeId]}
                            </div>
                        </div>
                        <div className="w-4/5">
                            <ProcessMarkdown markdown={skill!.retryDescription} id='retry' />
                        </div>
                    </div>)}
                <div className="flex items-start mb-2">
                    <div className="font-bold w-30">
                        Special:
                    </div>
                    <div className="w-4/5">
                        <ProcessMarkdown markdown={skill!.specialNotes} id='special' />
                    </div>
                </div>
                {skill!.synergyNotes && (
                    <div className="flex items-start mb-2">
                        <div className="font-bold w-30">
                            Synergy:
                        </div>
                        <div className="w-4/5">
                            <ProcessMarkdown markdown={skill!.synergyNotes} id='synergy' />
                        </div>
                    </div>)}
                {skill!.untrainedNotes && (
                    <div className="flex items-start mb-2">
                        <div className="font-bold w-30">
                            Untrained:
                        </div>
                        <div className="w-4/5">
                            <ProcessMarkdown markdown={skill!.untrainedNotes} id='untrained' />
                        </div>
                    </div>)}
                {skill!.restrictionNotes && (
                    <div className="flex items-start mb-2">
                        <div className="font-bold w-30">
                            Restriction:
                        </div>
                        <div className="w-4/5">
                            <ProcessMarkdown markdown={skill!.restrictionNotes} id='restriction' />
                        </div>
                    </div>)}
            </div>
        </DetailPage>
    );
} 
