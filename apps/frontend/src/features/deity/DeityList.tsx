import React, { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list';
import { DEITY_COLUMNS } from '@/features/deity/DeityColumns';
import { DeityQueryHooks } from '@/services/query/DeityQueryHooks';
import { DeityInQueryResponse } from '@shared/schema';

import { routes } from './DeityConfig';

export function DeityList(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading: isAuthLoading, isAdmin } = useAuthAuto();

    const HandleNewDeityClick = (): void => {
        navigate('/deities/new/edit', { state: { fromListParams: location.search } });
    };

    const dataFetcher = useCallback(async () => {
        return await DeityQueryHooks.getDeities();
    }, []);

    if (isAuthLoading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Deities</h1>
            {isAdmin && (
                <div className="mb-4 flex justify-end">
                    <button
                        onClick={HandleNewDeityClick}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        New Deity
                    </button>
                </div>
            )}
            <GenericList<DeityInQueryResponse>
                storageKey="deities-list"
                columns={DEITY_COLUMNS}
                dataFetcher={dataFetcher}
                itemDesc="deity"
                routes={routes}
                deleteServiceFunction={(id) => DeityQueryHooks.deleteDeity(Number(id))}
            />
        </div>
    );
}
