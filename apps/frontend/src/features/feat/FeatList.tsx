import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list/GenericList';
import { createIdDeleteServiceFunction } from '@/components/generic-list/types';
import { FeatApi } from '@/features/feat/FeatApi';
import { FEAT_COLUMNS } from '@/features/feat/FeatColumns';
import { FeatInQueryResponse } from '@shared/schema';

import { routes } from './FeatConfig';

export function FeatList(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading: isAuthLoading, isAdmin } = useAuthAuto();

    const HandleNewFeatClick = (): void => {
        navigate('/feats/new/edit', { state: { fromListParams: location.search } });
    };

    if (isAuthLoading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Feats</h1>
            {isAdmin && (
                <div className="mb-4 flex justify-end">
                    <button
                        onClick={HandleNewFeatClick}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        New Feat
                    </button>
                </div>
            )}
            <GenericList<FeatInQueryResponse>
                storageKey="feats-list"
                columns={FEAT_COLUMNS}
                serviceFunction={() => FeatApi.getFeats({})}
                itemDesc="feat"
                routes={routes}
                deleteServiceFunction={createIdDeleteServiceFunction(FeatApi.deleteFeat)}
            />
        </div>
    );
} 
