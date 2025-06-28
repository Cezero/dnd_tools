import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FetchReferenceTables, DeleteReferenceTable } from '@/features/admin/features/ReferenceTableMgmt/services/ReferenceTableService';
import { COLUMN_DEFINITIONS, DEFAULT_COLUMNS } from '@/features/admin/features/ReferenceTableMgmt/config/ReferenceTableConfig';
import { GenericList } from '@/components/GenericList/GenericList';
import { TextInput } from '@/components/GenericList/TextInput';

export const ReferenceTablesList = (): React.JSX.Element => {
    const navigate = useNavigate();
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

    const HandleNewTableClick = (): void => {
        navigate('/admin/referencetables/new/edit');
    };


    const HandleDeleteTable = async (id: number): Promise<void> => {
        if (window.confirm('Are you sure you want to delete this table?')) {
            try {
                await DeleteReferenceTable(id);
                setRefreshTrigger(prev => prev + 1);
            } catch (error) {
                console.error('Failed to delete table:', error);
                alert('Failed to delete table.');
            }
        }
    };

    const RenderCell = (item: any, columnId: string): React.ReactNode => {
        const column = COLUMN_DEFINITIONS[columnId];
        if (!column) return null;

        return item[columnId];
    };

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
            <GenericList
                storageKey="reference-tables-list"
                defaultColumns={DEFAULT_COLUMNS}
                requiredColumnId="name"
                columnDefinitions={COLUMN_DEFINITIONS}
                fetchData={FetchReferenceTables}
                renderCell={RenderCell}
                detailPagePath="/admin/referencetables/:id"
                idKey="id"
                refreshTrigger={refreshTrigger}
                itemDesc="reference table"
                editHandler={(item: any) => navigate(`/admin/referencetables/${item.id}/edit`)}
                deleteHandler={(item: any) => HandleDeleteTable(item.id)}
                filterOptions={{
                    name: { component: TextInput },
                    slug: { component: TextInput },
                }}
            />
        </div>
    );
};
