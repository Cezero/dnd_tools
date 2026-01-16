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

    const handleBack = () => {
        navigate(`/tricks${fromListParams}`);
    };

    const handleEdit = () => {
        navigate(`/tricks/${id}/edit`, { state: { fromListParams } });
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this trick?')) {
            await TrickQueryHooks.deleteTrick(parseInt(id!));
            navigate(`/tricks${fromListParams}`);
        }
    };

    return (
        <DetailPage
            isLoading={isLoading}
            item={trick}
            itemName="Trick"
            isAdmin={isAdmin}
            onBack={handleBack}
            onEdit={handleEdit}
        >
            {trick && (
                <>
                    <TrickDisplay trick={trick} />
                    {isAdmin && (
                        <div className="mt-4 text-right">
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="inline-block px-4 py-2 bg-red-600 rounded hover:bg-red-700 border dark:border-gray-500"
                            >
                                Delete Trick
                            </button>
                        </div>
                    )}
                </>
            )}
        </DetailPage>
    );
}

