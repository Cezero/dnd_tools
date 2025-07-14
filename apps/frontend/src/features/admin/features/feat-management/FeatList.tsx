import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list/GenericList';
import { FEAT_COLUMNS } from '@/features/admin/features/feat-management/FeatColumns';
import { FeatService } from '@/features/admin/features/feat-management/FeatService';
import { FeatInQueryResponse } from '@shared/schema';
import { routes } from './FeatConfig';

export function FeatList(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading: isAuthLoading } = useAuthAuto();
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

    const HandleNewFeatClick = (): void => {
        navigate('/admin/feats/new/edit', { state: { fromListParams: location.search } });
    };

    const HandleDeleteFeat = async (id: number): Promise<void> => {
        if (window.confirm('Are you sure you want to delete this feat?')) {
            try {
                await FeatService.deleteFeat(undefined, { id });
                setRefreshTrigger(prev => prev + 1);
            } catch (error) {
                console.error('Failed to delete feat:', error);
                alert('Failed to delete feat.');
            }
        }
    };

    if (isAuthLoading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Feats</h1>
            <div className="mb-4 flex justify-end">
                <button
                    onClick={HandleNewFeatClick}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    New Feat
                </button>
            </div>
            <GenericList<FeatInQueryResponse>
                storageKey="feats-list"
                columns={FEAT_COLUMNS}
                serviceFunction={() => FeatService.getFeats({})}
                itemDesc="feat"
                routes={routes}
            />
        </div>
    );
} 
