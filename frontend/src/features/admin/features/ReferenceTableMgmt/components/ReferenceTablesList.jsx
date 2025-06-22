import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@mdi/react';
import { mdiTrashCan, mdiPlaylistEdit } from '@mdi/js';
import { fetchReferenceTables, deleteReferenceTable } from '@/features/admin/features/ReferenceTableMgmt/services/referenceTableService';
import { COLUMN_DEFINITIONS, DEFAULT_COLUMNS } from '@/features/admin/features/ReferenceTableMgmt/config/ReferenceTableConfig';
import GenericList from '@/components/GenericList/GenericList';
import Input from '@/components/GenericList/Input';

const ReferenceTablesList = () => {
    const navigate = useNavigate();
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleNewTableClick = () => {
        navigate('/admin/referencetables/new/edit');
    };


    const handleDeleteTable = async (id) => {
        if (window.confirm('Are you sure you want to delete this table?')) {
            try {
                await deleteReferenceTable(id);
                setRefreshTrigger(prev => prev + 1);
            } catch (error) {
                console.error('Failed to delete table:', error);
                alert('Failed to delete table.');
            }
        }
    };

    const renderCell = (item, columnId, isLastVisibleColumn) => {
        const column = COLUMN_DEFINITIONS[columnId];
        if (!column) return null;

        return item[columnId];
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Reference Tables</h1>
            <div className="mb-4 flex justify-end">
                <button
                    onClick={handleNewTableClick}
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
                fetchData={fetchReferenceTables}
                renderCell={renderCell}
                detailPagePath="/admin/referencetables/:id"
                idKey="id"
                refreshTrigger={refreshTrigger}
                itemDesc="reference table"
                editHandler={(item) => navigate(`/admin/referencetables/${item.id}/edit`)}
                deleteHandler={(item) => handleDeleteTable(item.id)}
                filterOptions={{
                    name: { component: Input },
                    slug: { component: Input },
                }}
            />
        </div>
    );
};

export default ReferenceTablesList;
