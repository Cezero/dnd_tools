import React, { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GenericList from '@/components/GenericList/GenericList';
import { fetchReferenceTables, deleteReferenceTable } from '@/services/referenceTableService';
import Icon from '@mdi/react';
import { mdiPencil, mdiDelete } from '@mdi/js';

function ReferenceTablesPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const storageKey = 'admin-reference-tables-list';
    const defaultColumns = ['name', 'rowCount', 'columnCount', 'actions'];
    const columnDefinitions = {
        name: { id: 'name', label: 'Table Name', sortable: true },
        rowCount: { id: 'rowCount', label: '# Rows', sortable: false },
        columnCount: { id: 'columnCount', label: '# Columns', sortable: false },
        actions: { id: 'actions', label: 'Actions', sortable: false },
    };

    const fetchData = useCallback(async (searchParams) => {
        try {
            const result = await fetchReferenceTables(searchParams);
            return { data: result.results, total: result.total };
        } catch (error) {
            console.error('Failed to fetch reference tables:', error);
            return { data: [], total: 0 };
        }
    }, []);

    const handleDelete = useCallback(async (id, name) => {
        if (window.confirm(`Are you sure you want to delete the reference table "${name}"?`)) {
            try {
                await deleteReferenceTable(id);
                alert(`Reference table "${name}" deleted successfully.`);
                setSearchParams(prev => {
                    const newParams = new URLSearchParams(prev);
                    newParams.set('_t', Date.now().toString());
                    return newParams;
                });
            } catch (error) {
                console.error(`Failed to delete reference table ${name}:`, error);
                alert(`Failed to delete reference table: ${name}`);
            }
        }
    }, [setSearchParams]);

    const renderCell = (item, columnId) => {
        switch (columnId) {
            case 'name':
                return (
                    <button
                        onClick={() => navigate(`/admin/reference-tables/${item.id}`)}
                        className="text-blue-600 hover:underline"
                    >
                        {item.name}
                    </button>
                );
            case 'rowCount':
                return item.row_count || 'N/A';
            case 'columnCount':
                return item.column_count || 'N/A';
            case 'actions':
                return (
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => navigate(`/admin/reference-tables/${item.id}/edit`)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Edit Table"
                        >
                            <Icon path={mdiPencil} size={0.8} />
                        </button>
                        <button
                            onClick={() => handleDelete(item.id, item.name)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Table"
                        >
                            <Icon path={mdiDelete} size={0.8} />
                        </button>
                    </div>
                );
            default:
                return item[columnId];
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Reference Tables Management</h1>

            <div className="flex justify-end mb-4">
                <button
                    onClick={() => navigate('/admin/reference-tables/new')}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Create New Table
                </button>
            </div>

            <GenericList
                storageKey={storageKey}
                defaultColumns={defaultColumns}
                columnDefinitions={columnDefinitions}
                fetchData={fetchData}
                renderCell={renderCell}
                navigate={navigate}
                detailPagePath="/admin/reference-tables/:id"
                idKey="id"
                requiredColumnId="name"
            />
        </div>
    );
}

export default ReferenceTablesPage; 