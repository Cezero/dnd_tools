import { useParams, useLocation, useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { DetailPage } from '@/components/common/DetailPage';

import { TrickPurposeDisplay } from './TrickPurposeDisplay';
import { TrickPurposeQueryHooks } from './TrickPurposeQueryHooks';

/**
 * Admin detail page for a Handle Animal purpose package.
 */
export function TrickPurposeDetail() {
    const { id } = useParams();
    const { isAdmin } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    const { data: purpose, isLoading } = TrickPurposeQueryHooks.useGetTrickPurposeById(
        { pathParams: { id: parseInt(id ?? '0', 10) } },
        { enabled: !!id }
    );

    const handleBack = () => {
        navigate(`/trick-purposes${fromListParams}`);
    };

    const handleEdit = () => {
        navigate(`/trick-purposes/${id}/edit`, { state: { fromListParams } });
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this trick purpose?')) {
            await TrickPurposeQueryHooks.deleteTrickPurpose(parseInt(id!, 10));
            navigate(`/trick-purposes${fromListParams}`);
        }
    };

    return (
        <DetailPage
            isLoading={isLoading}
            item={purpose}
            itemName="Trick Purpose"
            isAdmin={isAdmin}
            onBack={handleBack}
            onEdit={handleEdit}
        >
            {purpose && (
                <>
                    <TrickPurposeDisplay purpose={purpose} />
                    {isAdmin && (
                        <div className="mt-4 text-right">
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="inline-block px-4 py-2 bg-red-600 rounded hover:bg-red-700 border dark:border-gray-500"
                            >
                                Delete Purpose
                            </button>
                        </div>
                    )}
                </>
            )}
        </DetailPage>
    );
}
