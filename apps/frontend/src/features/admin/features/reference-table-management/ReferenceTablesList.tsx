import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list/GenericList';
import { COLUMN_DEFINITIONS } from '@/features/admin/features/reference-table-management/ReferenceTableConfig';
import { ReferenceTableService } from '@/features/admin/features/reference-table-management/ReferenceTableService';
import { ReferenceTableQuerySchema, ReferenceTableSummary } from '@shared/schema';

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

    const RenderCell = (item: ReferenceTableSummary, columnId: string): React.ReactNode => {
        const column = COLUMN_DEFINITIONS[columnId];
        if (!column) return null;

        let cellContent: React.ReactNode = String(item[columnId] || '');

        if (columnId === 'name') {
            cellContent = (
                <a
                    onClick={() => navigate(`/admin/referencetables/${item.slug}`)}
                    className="text-blue-600 hover:underline cursor-pointer"
                >
                    {item.name}
                </a>
            );
        } else if (columnId === 'slug') {
            cellContent = item.slug;
        } else if (columnId === 'description') {
            cellContent = item.description || '';
        } else if (columnId === 'rows') {
            cellContent = item.rows || 0;
        } else if (columnId === 'columns') {
            cellContent = item.columns || 0;
        }

        return cellContent;
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
            <GenericList<any>
                storageKey="reference-tables-list"
                columnDefinitions={COLUMN_DEFINITIONS}
                querySchema={ReferenceTableQuerySchema}
                serviceFunction={ReferenceTableService.getReferenceTables}
                renderCell={RenderCell}
                detailPagePath="/admin/referencetables/:slug"
                itemDesc="reference table"
                editHandler={(item) => navigate(`/admin/referencetables/${item.slug}/edit`)}
                deleteHandler={(item) => HandleDeleteTable(item.slug)}
            />
        </div>
    );
}
