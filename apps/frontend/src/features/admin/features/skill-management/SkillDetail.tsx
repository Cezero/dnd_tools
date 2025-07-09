import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { SkillService } from '@/features/admin/features/skill-management/SkillService';
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
                const data = await SkillService.getSkillById(undefined, { id: parseInt(id!) });
                setSkill(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to initialize or fetch skill:', error);
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
    if (!skill) return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    Skill not found
                </div>
            </div>
        </div>
    );

    return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold">{skill.name}</h1>
                            <h1 className="text-1xl font-bold">({ABILITY_MAP[skill.abilityId]?.abbreviation})</h1>
                        </div>
                        <div className="text-right">
                            <p><strong>Trained Only:</strong> {skill.trainedOnly ? 'Yes' : 'No'}</p>
                            <p><strong>Armor Check Penalty:</strong> {skill.affectedByArmor ? 'Yes' : 'No'}</p>
                        </div>
                    </div>
                    <div>
                        <div className="w-full mb-2">
                            <ProcessMarkdown markdown={skill.description} id='description' />
                        </div>
                        <div className="flex items-start mb-2">
                            <div className="font-bold w-30">
                                Check:
                            </div>
                            <div className="w-4/5">
                                <ProcessMarkdown markdown={skill.checkDescription} id='check' />
                            </div>
                        </div>
                        <div className="flex items-start mb-2">
                            <div className="font-bold w-30">
                                Action:
                            </div>
                            <div className="w-4/5">
                                <ProcessMarkdown markdown={skill.actionDescription} id='action' />
                            </div>
                        </div>
                        {skill.retryDescription && (
                            <div className="flex items-start mb-2">
                                <div className="w-30 flex items-center gap-2">
                                    <div className="font-bold">
                                        Try Again:
                                    </div>
                                    <div>
                                        {SKILL_RETRY_TYPE_MAP[skill.retryTypeId]}
                                    </div>
                                </div>
                                <div className="w-4/5">
                                    <ProcessMarkdown markdown={skill.retryDescription} id='retry' />
                                </div>
                            </div>)}
                        <div className="flex items-start mb-2">
                            <div className="font-bold w-30">
                                Special:
                            </div>
                            <div className="w-4/5">
                                <ProcessMarkdown markdown={skill.specialNotes} id='special' />
                            </div>
                        </div>
                        {skill.synergyNotes && (
                            <div className="flex items-start mb-2">
                                <div className="font-bold w-30">
                                    Synergy:
                                </div>
                                <div className="w-4/5">
                                    <ProcessMarkdown markdown={skill.synergyNotes} id='synergy' />
                                </div>
                            </div>)}
                        {skill.untrainedNotes && (
                            <div className="flex items-start mb-2">
                                <div className="font-bold w-30">
                                    Untrained:
                                </div>
                                <div className="w-4/5">
                                    <ProcessMarkdown markdown={skill.untrainedNotes} id='untrained' />
                                </div>
                            </div>)}
                        {skill.restrictionNotes && (
                            <div className="flex items-start mb-2">
                                <div className="font-bold w-30">
                                    Restriction:
                                </div>
                                <div className="w-4/5">
                                    <ProcessMarkdown markdown={skill.restrictionNotes} id='restriction' />
                                </div>
                            </div>)}
                    </div>
                    <div className="mt-4 text-right">
                        <button type="button" onClick={() => navigate(`/admin/skills${fromListParams ? `?${fromListParams}` : ''}`)} className="inline-block px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 border dark:border-gray-500">Back to List</button>
                        {isAdmin && (
                            <Link to={`/admin/skills/${id}/edit`} state={{ fromListParams: fromListParams }} className="ml-4 inline-block px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 border dark:border-gray-500">Edit Skill</Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 