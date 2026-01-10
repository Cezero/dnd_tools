import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { FeatureDisplay } from '@/components/feature-system/FeatureDisplay';
import { CompanionQueryHooks } from '@/services/query/CompanionQueryHooks';
import { COMPANION_TYPE_MAP } from '@shared/static-data';
import { SpecialFeatureId, FeatureSourceType } from '@shared/static-data';

export function CompanionDetail() {
    const { id } = useParams();
    const { isAdmin } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    const companionId = id ? parseInt(id, 10) : undefined;
    const isValidId = companionId !== undefined && !isNaN(companionId);
    const { data: companion, isLoading } = CompanionQueryHooks.useGetCompanionById({
        pathParams: { id: isValidId ? companionId! : 0 },
        enabled: isValidId
    });

    // Get companion benefit progression from companion.features
    const benefitProgression = companion?.features?.find(
        p => p.featureId === SpecialFeatureId.CompanionBenefit && p.sourceType === FeatureSourceType.Companion
    ) || null;

    if (isLoading) return (
        <div className="pt-8">
            <div className="w-4/5 mx-auto border-2 border-gray-400 dark:border-gray-600 rounded-lg shadow-lg p-1">
                <div className="p-3 bg-content border-content rounded-lg border w-full">
                    Loading...
                </div>
            </div>
        </div>
    );

    if (!companion) return (
        <div className="pt-8">
            <div className="w-4/5 mx-auto border-2 border-gray-400 dark:border-gray-600 rounded-lg shadow-lg p-1">
                <div className="p-3 bg-content border-content rounded-lg border w-full">
                    Companion not found
                </div>
            </div>
        </div>
    );

    const companionTypeName = COMPANION_TYPE_MAP[companion.type]?.name || `Type ${companion.type}`;
    const monsterName = companion.monster?.name || 'Unknown Monster';

    return (
        <div className="pt-8">
            <div className="w-4/5 mx-auto border-2 border-gray-400 dark:border-gray-600 rounded-lg shadow-lg p-1">
                <div className="p-3 bg-content border-content rounded-lg border w-full">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-bold">{monsterName}</h1>
                        {isAdmin && (
                            <button
                                onClick={() => navigate(`/companions/${id}/edit`, { state: { fromListParams } })}
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Edit
                            </button>
                        )}
                    </div>
                    <div className="mb-4">
                        <button
                            onClick={() => navigate(`/companions${fromListParams ? `?${fromListParams}` : ''}`)}
                            className="text-blue-500 hover:text-blue-700"
                        >
                            ← Back to List
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <strong>Type:</strong> {companionTypeName}
                        </div>
                        {companion.monster && (
                            <div>
                                <strong>Monster:</strong>{' '}
                                <Link
                                    to={`/monsters/${companion.monsterId}`}
                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    {companion.monster.name}
                                </Link>
                            </div>
                        )}
                        {companion.minLevel && (
                            <div>
                                <strong>Minimum Level:</strong> {companion.minLevel}
                            </div>
                        )}
                        {benefitProgression && benefitProgression.entities && benefitProgression.entities.length > 0 ? (
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Benefits</h3>
                                <FeatureDisplay
                                    feature={benefitProgression.feature}
                                    progressions={[benefitProgression]}
                                    showAddProgressionButton={false}
                                />
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
