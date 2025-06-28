import { useParams, Link, useLocation } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { UseAuth } from '@/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { ABILITY_MAP } from '@shared/static-data/AbilityData';
import { FetchSkillById } from '@/features/admin/features/skillMgmt/services/SkillService';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';

export function SkillDetail(): React.JSX.Element {
    const { id } = useParams();
    const [skill, setSkill] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const { user } = UseAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const Initialize = async (): Promise<void> => {
            try {
                const data = await FetchSkillById(id);
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
                            <h1 className="text-2xl font-bold">{skill.skill_name}</h1>
                            <h1 className="text-1xl font-bold">({ABILITY_MAP[skill.ability_id]?.abbr})</h1>
                        </div>
                        <div className="text-right">
                            <p><strong>Trained Only:</strong> {skill.trained_only ? 'Yes' : 'No'}</p>
                            <p><strong>Armor Check Penalty:</strong> {skill.skill_armor_check_penalty ? 'Yes' : 'No'}</p>
                        </div>
                    </div>
                    <div>
                        <div className="mt-3 p-2 w-full rounded bg-gray-50 dark:bg-gray-700 prose dark:prose-invert">
                            <ProcessMarkdown markdown={skill.skill_description} />
                        </div>
                        <div className="font-bold">
                            Check:
                        </div>
                        <div className="mt-0 p-2 w-full rounded bg-gray-50 dark:bg-gray-700 prose dark:prose-invert">
                            <ProcessMarkdown markdown={skill.skill_check} />
                        </div>
                        <div className="flex items-start mb-2">
                            <div className="font-bold w-30">
                                Action:
                            </div>
                            <div className="w-4/5">
                                <ProcessMarkdown markdown={skill.skill_action} />
                            </div>
                        </div>
                        {skill.skill_try_again_desc && (
                            <div className="flex items-start mb-2">
                                <div className="w-30 flex items-center gap-2">
                                    <div className="font-bold">
                                        Try Again:
                                    </div>
                                    <div>
                                        {skill.skill_try_again ? 'Yes' : 'No'}
                                    </div>
                                </div>
                                <div className="w-4/5">
                                    {skill.skill_try_again_desc}
                                </div>
                            </div>)}
                        <div className="flex items-start mb-2">
                            <div className="font-bold w-30">
                                Special:
                            </div>
                            <div className="w-4/5">
                                <ProcessMarkdown markdown={skill.skill_special} />
                            </div>
                        </div>
                        {skill.skill_synergy_desc && (
                            <div className="flex items-start mb-2">
                                <div className="font-bold w-30">
                                    Synergy:
                                </div>
                                <div className="w-4/5">
                                    <ProcessMarkdown markdown={skill.skill_synergy_desc} />
                                </div>
                            </div>)}
                        {skill.untrained_desc && (
                            <div className="flex items-start mb-2">
                                <div className="font-bold w-30">
                                    Untrained:
                                </div>
                                <div className="w-4/5">
                                    {skill.untrained_desc}
                                </div>
                            </div>)}
                    </div>
                    <div className="mt-4 text-right">
                        <button type="button" onClick={() => navigate(`/admin/skills${fromListParams ? `?${fromListParams}` : ''}`)} className="inline-block px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 border dark:border-gray-500">Back to List</button>
                        {user && user.is_admin && (
                            <Link to={`/admin/skills/${id}/edit`} state={{ fromListParams: fromListParams }} onClick={() => console.log('Navigating from SkillDetail to EditSkill with params:', fromListParams)} className="ml-4 inline-block px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 border dark:border-gray-500">Edit Skill</Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 