import { useParams, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/authProvider';
import { useNavigate } from 'react-router-dom';
import lookupService from '@/services/LookupService';
import { RPG_DICE } from 'shared-data/src/commonData';
import { fetchClassById } from '@/features/admin/features/classMgmt/services/classService';

export default function ClassDetail() {
    const { id } = useParams();
    const [cls, setCls] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const initialize = async () => {
            try {
                await lookupService.initialize();
                const data = await fetchClassById(id);
                setCls(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to initialize or fetch class:', error);
                setIsLoading(false);
            }
        };
        initialize();
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
                        <h1 className="text-2xl font-bold">{cls.class_name}</h1>
                        <div className="text-right">
                            <p><strong>Edition:</strong> {lookupService.getById('editions', cls.edition_id)?.edition_abbrev}</p>
                            <p><strong>Display:</strong> {cls.display ? 'Yes' : 'No'}</p>
                            
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p><strong>Abbreviation:</strong> {cls.class_abbr}</p>
                            <p><strong>Prestige Class:</strong> {cls.is_prestige_class ? 'Yes' : 'No'}</p>
                            <p><strong>Caster:</strong> {cls.caster ? 'Yes' : 'No'}</p>
                            <p><strong>Hit Die:</strong> {RPG_DICE[cls.hit_die]?.name}</p>
                        </div>
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