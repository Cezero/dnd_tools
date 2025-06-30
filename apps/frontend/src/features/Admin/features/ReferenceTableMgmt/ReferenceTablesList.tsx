import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FetchReferenceTables, DeleteReferenceTable } from '@/features/admin/features/ReferenceTableMgmt/ReferenceTableService';
import { COLUMN_DEFINITIONS, DEFAULT_COLUMNS } from '@/features/admin/features/ReferenceTableMgmt/ReferenceTableConfig';
import { GenericList } from '@/components/GenericList/GenericList';
import { TextInput } from '@/components/GenericList/TextInput';
import { Prisma } from '@shared/prisma-client';

// Use Prisma type for reference table items
type ReferenceTableItem = Prisma.ReferenceTableGetPayload<Record<string, never>>;

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

    const RenderCell = (item: ReferenceTableItem, columnId: string): React.ReactNode => {
        const column = COLUMN_DEFINITIONS[columnId];
        if (!column) return null;

        return String(item[columnId as keyof ReferenceTableItem] || '');
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
            <GenericList<ReferenceTableItem>
                storageKey="reference-tables-list"
                defaultColumns={DEFAULT_COLUMNS}
                requiredColumnId="name"
                columnDefinitions={COLUMN_DEFINITIONS}
                fetchData={FetchReferenceTables}
                renderCell={RenderCell}
                detailPagePath="/admin/referencetables/:id"
                idKey="slug"
                refreshTrigger={refreshTrigger}
                itemDesc="reference table"
                editHandler={(item: ReferenceTableItem) => navigate(`/admin/referencetables/${item.slug}/edit`)}
                deleteHandler={(item: ReferenceTableItem) => HandleDeleteTable(parseInt(item.slug))}
                filterOptions={{
                    name: { component: TextInput, props: { placeholder: 'Filter by name...' } },
                    slug: { component: TextInput, props: { placeholder: 'Filter by slug...' } },
                }}
            />
        </div>
    );
};
