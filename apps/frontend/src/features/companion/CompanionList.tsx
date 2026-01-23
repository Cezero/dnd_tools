import React, { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list';
import { createIdDeleteServiceFunction } from '@/components/generic-list/types';
import { useCompanionColumns } from '@/features/companion/CompanionColumns';
import { CompanionWithRelations } from '@shared/schema';

import { routes } from './CompanionConfig';
import { CompanionQueryHooks } from './CompanionQueryHooks';

export function CompanionList(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading: isAuthLoading, isAdmin } = useAuthAuto();
    const columns = useCompanionColumns();

    const HandleNewCompanionClick = (): void => {
        navigate('/companions/new/edit', { state: { fromListParams: location.search } });
    };

    const dataFetcher = useCallback(async () => {
        return await CompanionQueryHooks.getCompanions();
    }, []);

    if (isAuthLoading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Companions</h1>
            {isAdmin && (
                <div className="mb-4 flex justify-end">
                    <button
                        onClick={HandleNewCompanionClick}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        New Companion
                    </button>
                </div>
            )}
            <GenericList<CompanionWithRelations>
                storageKey="companions-list"
                columns={columns}
                dataFetcher={dataFetcher}
                itemDesc="companion"
                routes={routes}
                deleteServiceFunction={createIdDeleteServiceFunction((_, { id }) => CompanionQueryHooks.deleteCompanion(id))}
            />
        </div>
    );
}

