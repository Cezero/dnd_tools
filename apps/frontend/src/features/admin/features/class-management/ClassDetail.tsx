import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { ClassService } from '@/features/admin/features/class-management/ClassService';
import { ClassResponse } from '@shared/schema';
import { RPG_DICE, EDITION_MAP, ABILITY_MAP } from '@shared/static-data';

export default function ClassDetail() {
    const { id } = useParams();
    const [cls, setCls] = useState<ClassResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { isAdmin } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const Initialize = async () => {
            try {
                const data = await ClassService.getClassById(undefined, { id: parseInt(id!) });
                setCls(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to initialize or fetch class:', error);
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
    if (!cls) return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    Class not found
                </div>
            </div>
        </div>
    );

    return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h1 className="text-2xl font-bold mb-2">{cls.name}</h1>
                            <p><strong>Hit Die:</strong> {RPG_DICE[cls.hitDie]?.name}</p>
                            <p><strong>Skill Points:</strong> {cls.skillPoints}</p>
                            <p><strong>Casting Ability:</strong> {ABILITY_MAP[cls.castingAbilityId]?.name || 'None'}</p>
                        </div>
                        <div className="text-right">
                            <p><strong>Edition:</strong> {EDITION_MAP[cls.editionId]?.abbreviation}</p>
                            <p><strong>Display:</strong> {cls.isVisible ? 'Yes' : 'No'}</p>
                            <p><strong>Prestige Class:</strong> {cls.isPrestige ? 'Yes' : 'No'}</p>
                            <p><strong>Caster:</strong> {cls.canCastSpells ? 'Yes' : 'No'}</p>
                        </div>
                    </div>
                    <div className="mt-3 p-2 w-full rounded bg-gray-50 dark:bg-gray-700 prose dark:prose-invert">
                        <ProcessMarkdown markdown={cls.description || ''} />
                    </div>
                    <div className="mt-4 text-right">
                        <button type="button" onClick={() => navigate(`/admin/classes${fromListParams ? `?${fromListParams}` : ''}`)} className="inline-block px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 border dark:border-gray-500">Back to List</button>
                        {isAdmin && (
                            <Link to={`/admin/classes/${id}/edit`} state={{ fromListParams: fromListParams }} className="ml-4 inline-block px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 border dark:border-gray-500">Edit Class</Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}