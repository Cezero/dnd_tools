import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { UseAuth } from '@/components/auth/AuthProvider';
import { RPG_DICE, EDITION_MAP, ABILITY_MAP } from '@shared/static-data';
import { FetchClassById } from '@/features/admin/features/class-management/ClassService';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';

export function ClassDetail() {
    const { id } = useParams();
    const [cls, setCls] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = UseAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const Initialize = async () => {
            try {
                const data = await FetchClassById(id);
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
                            <p><strong>Hit Die:</strong> {RPG_DICE[cls.hit_die]?.name}</p>
                            <p><strong>Skill Points:</strong> {cls.skill_points}</p>
                            <p><strong>Casting Ability:</strong> {ABILITY_MAP[cls.cast_ability]?.name || 'None'}</p>
                        </div>
                        <div className="text-right">
                            <p><strong>Edition:</strong> {EDITION_MAP[cls.edition_id]?.abbr}</p>
                            <p><strong>Display:</strong> {cls.display ? 'Yes' : 'No'}</p>
                            <p><strong>Prestige Class:</strong> {cls.is_prestige ? 'Yes' : 'No'}</p>
                            <p><strong>Caster:</strong> {cls.can_cast ? 'Yes' : 'No'}</p>
                        </div>
                    </div>
                    <div className="mt-3 p-2 w-full rounded bg-gray-50 dark:bg-gray-700 prose dark:prose-invert">
                        <ProcessMarkdown markdown={cls.desc} />
                    </div>
                    <div className="mt-4 text-right">
                        <button type="button" onClick={() => navigate(`/admin/classes${fromListParams ? `?${fromListParams}` : ''}`)} className="inline-block px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 border dark:border-gray-500">Back to List</button>
                        {user && user.is_admin && (
                            <Link to={`/admin/classes/${id}/edit`} state={{ fromListParams: fromListParams }} onClick={() => console.log('Navigating from ClassDetail to EditClass with params:', fromListParams)} className="ml-4 inline-block px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 border dark:border-gray-500">Edit Class</Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}