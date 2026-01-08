import { useParams, useLocation, useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { DetailPage } from '@/components/common/DetailPage';
import { TrickDisplay } from '@/features/trick/TrickDisplay';
import { TrickQueryHooks } from '@/services/query/TrickQueryHooks';

export function TrickDetail() {
    const { id } = useParams();
    const { isAdmin } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    // Use TanStack Query hook
    const { data: trick, isLoading } = TrickQueryHooks.useGetTrickById({
        pathParams: { id: parseInt(id!) },
        enabled: !!id
    });

    if (isLoading) return (
        <div className="pt-8">
            <div className="w-4/5 mx-auto border-2 border-gray-400 dark:border-gray-600 rounded-lg shadow-lg p-1">
                <div className="p-3 bg-content border-content rounded-lg border w-full">
                    Loading...
                </div>
            </div>
        </div>
    );

    if (!trick) return (
        <div className="pt-8">
            <div className="w-4/5 mx-auto border-2 border-gray-400 dark:border-gray-600 rounded-lg shadow-lg p-1">
                <div className="p-3 bg-content border-content rounded-lg border w-full">
                    Trick not found
                </div>
            </div>
        </div>
    );

    return (
        <DetailPage
            title={trick.name}
            onBack={() => navigate(`/tricks${fromListParams}`)}
            onEdit={isAdmin ? () => navigate(`/tricks/${id}/edit`, { state: { fromListParams } }) : undefined}
            onDelete={isAdmin ? async () => {
                if (window.confirm('Are you sure you want to delete this trick?')) {
                    await TrickQueryHooks.deleteTrick(parseInt(id!));
                    navigate(`/tricks${fromListParams}`);
                }
            } : undefined}
        >
            <TrickDisplay trick={trick} />
        </DetailPage>
    );
}

