import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list/GenericList';
import { createIdDeleteServiceFunction } from '@/components/generic-list/types';
import { DomainApi } from '@/features/domain/DomainApi';
import { DOMAIN_COLUMNS } from '@/features/domain/DomainColumns';
import { DomainSummary } from '@shared/schema';

import { routes } from './DomainConfig';

export function DomainList(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading: isAuthLoading, isAdmin } = useAuthAuto();

    const HandleNewDomainClick = (): void => {
        navigate('/domains/new/edit', { state: { fromListParams: location.search } });
    };

    if (isAuthLoading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Domains</h1>
            {isAdmin && (
                <div className="mb-4 flex justify-end">
                    <button
                        onClick={HandleNewDomainClick}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        New Domain
                    </button>
                </div>
            )}
            <GenericList<DomainSummary>
                storageKey="domains-list"
                columns={DOMAIN_COLUMNS}
                serviceFunction={() => DomainApi.getDomains({})}
                itemDesc="domain"
                routes={routes}
                deleteServiceFunction={createIdDeleteServiceFunction(DomainApi.deleteDomain)}
            />
        </div>
    );
}
