import { useParams, useLocation, useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { DetailPage } from '@/components/common/DetailPage';
import { DeityQueryHooks } from '@/services/query/DeityQueryHooks';

import { DeityDisplay } from './DeityDisplay';

export function DeityDetail() {
    const { id } = useParams();
    const { isAdmin } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    // Use TanStack Query hook
    const { data: deity, isLoading } = DeityQueryHooks.useGetDeityById({
        pathParams: { id: parseInt(id!) },
        enabled: !!id
    });

    const handleBack = () => {
        navigate(`/deities${fromListParams ? `?${fromListParams}` : ''}`);
    };

    const handleEdit = () => {
        navigate(`/deities/${id}/edit`, { state: { fromListParams: fromListParams } });
    };

    return (
        <DetailPage
            isLoading={isLoading}
            item={deity}
            itemName="Deity"
            isAdmin={isAdmin}
            onBack={handleBack}
            onEdit={handleEdit}
        >
            <DeityDisplay deity={deity!} showHeader={true} />
        </DetailPage>
    );
}
