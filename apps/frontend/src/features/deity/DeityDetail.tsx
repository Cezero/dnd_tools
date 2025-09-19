import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { DetailPage } from '@/components/common/DetailPage';
import { DeityApi } from '@/features/deity/DeityApi';
import { Deity } from '@shared/schema';

import { DeityDisplay } from './DeityDisplay';

export function DeityDetail() {
    const { id } = useParams();
    const [deity, setDeity] = useState<Deity | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { isAdmin } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const Initialize = async () => {
            try {
                const data = await DeityApi.getDeityById(undefined, { id: parseInt(id!) });
                setDeity(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to initialize or fetch deity:', error);
                setIsLoading(false);
            }
        };
        Initialize();
    }, [id, location.state]);

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
            <DeityDisplay deity={deity!} showHeader={true} showActions={false} />
        </DetailPage>
    );
}
