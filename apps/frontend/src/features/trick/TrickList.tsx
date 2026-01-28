import React, { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list';
import { TRICK_COLUMNS } from '@/features/trick/TrickColumns';
import { TrickQueryHooks } from '@/services/query/TrickQueryHooks';
import { Trick } from '@shared/schema';

import { routes } from './TrickConfig';

export function TrickList(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading: isAuthLoading, isAdmin } = useAuthAuto();

    const HandleNewTrickClick = (): void => {
        navigate('/tricks/new/edit', { state: { fromListParams: location.search } });
    };

    const dataFetcher = useCallback(async () => {
        return await TrickQueryHooks.getTricks();
    }, []);

    if (isAuthLoading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Tricks</h1>
            {isAdmin && (
                <div className="mb-4 flex justify-end">
                    <button
                        onClick={HandleNewTrickClick}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        New Trick
                    </button>
                </div>
            )}
            <GenericList<Trick>
                storageKey="tricks-list"
                columns={TRICK_COLUMNS}
                dataFetcher={dataFetcher}
                itemDesc="trick"
                routes={routes}
                deleteServiceFunction={(id) => TrickQueryHooks.deleteTrick(Number(id))}
            />
        </div>
    );
}

