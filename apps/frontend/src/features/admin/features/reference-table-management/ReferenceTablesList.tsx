import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list/GenericList';
import { REFERENCE_TABLE_COLUMNS } from '@/features/admin/features/reference-table-management/ReferenceTableColumns';
import { ReferenceTableService } from '@/features/admin/features/reference-table-management/ReferenceTableService';
import { ReferenceTableSummary } from '@shared/schema';
import { routes } from './ReferenceTableConfig';

export function ReferenceTablesList(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading: isAuthLoading } = useAuthAuto();
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

    const HandleNewTableClick = (): void => {
        navigate('/admin/referencetables/new/edit', { state: { fromListParams: location.search } });
    };

    const HandleDeleteTable = async (slug: string): Promise<void> => {
        if (window.confirm('Are you sure you want to delete this reference table?')) {
            try {
                await ReferenceTableService.deleteReferenceTable(undefined, { slug });
                setRefreshTrigger(prev => prev + 1);
            } catch (error) {
                console.error('Failed to delete reference table:', error);
                alert('Failed to delete reference table.');
            }
        }
    };

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
                serviceFunction={() => ReferenceTableService.getReferenceTables({ sort: 'name', order: 'asc' })}
                itemDesc="reference table"
                routes={routes}
            />
        </div>
    );
}
