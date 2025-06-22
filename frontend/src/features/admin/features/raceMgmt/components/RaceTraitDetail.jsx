import { useParams, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ProcessMarkdown from '@/components/markdown/ProcessMarkdown';
import { useAuth } from '@/auth/authProvider';
import { useNavigate } from 'react-router-dom';
import { fetchRaceTraitById } from '@/features/admin/features/raceMgmt/services/raceTraitService';

export default function RaceTraitDetail() {
    const { id } = useParams();
    const [trait, setTrait] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const initialize = async () => {
            try {
                const data = await fetchRaceTraitById(id);
                setTrait(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to fetch race trait:', error);
                setIsLoading(false);
            }
        };
        initialize();
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
    if (!trait) return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    Race Trait not found
                </div>
            </div>
        </div>
    );

    return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    <div className="flex justify-between items-start mb-2">
                        <h1 className="text-2xl font-bold">{trait.trait_name}</h1>
                        <div className="text-right">
                            <p><strong>Has Value:</strong> {trait.value_flag ? 'Yes' : 'No'}</p>
                        </div>
                    </div>
                    <div className="mt-3 p-2 w-full rounded bg-gray-50 dark:bg-gray-700 prose dark:prose-invert">
                        <ProcessMarkdown markdown={trait.trait_description} />
                    </div>
                    <div className="mt-4 text-right">
                        <button type="button" onClick={() => navigate(`/admin/races${fromListParams ? `?${fromListParams}` : ''}`)} className="inline-block px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 border dark:border-gray-500">Back to List</button>
                        {user && user.is_admin && (
                            <Link to={`/admin/races/traits/${id}/edit`} state={{ fromListParams: fromListParams }} className="ml-4 inline-block px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 border dark:border-gray-500">Edit Trait</Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 