import React, { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list/GenericList';
import { ReferenceTableApi } from '@/features/admin/features/reference-table-management/ReferenceTableApi';
import { REFERENCE_TABLE_COLUMNS } from '@/features/admin/features/reference-table-management/ReferenceTableColumns';
import { ReferenceTableSummary } from '@shared/schema';

import { routes } from './ReferenceTableConfig';

export function ReferenceTablesList(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading: isAuthLoading } = useAuthAuto();

    const HandleNewTableClick = (): void => {
        navigate('/admin/referencetables/new/edit', { state: { fromListParams: location.search } });
    };

    const dataFetcher = useCallback(async () => {
        return await ReferenceTableApi.getReferenceTables({});
    }, []);

    if (isAuthLoading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Reference Tables</h1>
            <div className="mb-4 flex justify-end">
                <button
                    onClick={HandleNewTableClick}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    New Table
                </button>
            </div>
            <GenericList<ReferenceTableSummary>
                storageKey="reference-tables-list"
                columns={REFERENCE_TABLE_COLUMNS}
                dataFetcher={dataFetcher}
                itemDesc="reference table"
                routes={routes}
                deleteServiceFunction={(slug) => ReferenceTableApi.deleteReferenceTable({ slug: String(slug) })}
                basePath="/admin"
            />
        </div>
    );
}
