import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { DetailPage } from '@/components/common/DetailPage';
import { MonsterQueryHooks } from '@/services/query/MonsterQueryHooks';

import { MonsterDisplayContent } from './MonsterDisplayContent';

export function MonsterDetail(): React.JSX.Element {
    const { id } = useParams();
    const { isAdmin } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    const { data: monster, isLoading, error } = MonsterQueryHooks.useGetMonsterById(
        { pathParams: { id: parseInt(id!) } },
        { enabled: !!id }
    );

    const handleBack = () => {
        navigate(`/monsters${fromListParams ? `?${fromListParams}` : ''}`);
    };

    const handleEdit = () => {
        navigate(`/monsters/${id}/edit`, { state: { fromListParams: fromListParams } });
    };

    if (error) {
        return (
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-4">Error</h1>
                <p>Failed to load monster: {error.message}</p>
            </div>
        );
    }

    return (
        <DetailPage
            isLoading={isLoading}
            item={monster}
            itemName="Monster"
            isAdmin={isAdmin}
            onBack={handleBack}
            onEdit={handleEdit}
        >
            <MonsterDisplayContent monster={monster} showHeader={true} />
        </DetailPage>
    );
}

