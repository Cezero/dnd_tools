import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchReferenceTables, deleteReferenceTable } from '@/services/referenceTableService';
import GenericList from '@/components/GenericList/GenericList';
import Icon from '@mdi/react';
import { mdiTrashCan, mdiPlaylistEdit } from '@mdi/js';
import { COLUMN_DEFINITIONS, DEFAULT_COLUMNS } from '@/features/admin/features/ReferenceTableMgmt/config/ReferenceTableConfig';

const ReferenceTablesList = () => {
    const navigate = useNavigate();
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleNewTableClick = () => {
        navigate('/admin/reference-tables/new/edit');
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

        if (isLastVisibleColumn) {
            return (
                <div className="flex justify-between items-center w-full">
                    <span>{item[columnId]}</span>
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate(`/admin/reference-tables/${item.id}/edit`)}
                            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 mr-2"
                            title="Edit Table"
                        >
                            <Icon path={mdiPlaylistEdit} size={0.7} />
                        </button>
                        <button
                            onClick={() => handleDeleteTable(item.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-600"
                            title="Delete Table"
                        >
                            <Icon path={mdiTrashCan} size={0.7} />
                        </button>
                    </div>
                </div>
            );
        }

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
                detailPagePath="/admin/reference-tables/:id"
                idKey="id"
                navigate={navigate}
                refreshTrigger={refreshTrigger}
                itemDesc="reference table"
            />
        </div>
    );
};

export default ReferenceTablesList;
