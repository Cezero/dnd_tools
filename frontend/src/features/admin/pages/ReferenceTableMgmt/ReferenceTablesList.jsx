import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchReferenceTables } from '@/services/referenceTableService';
import GenericList from '@/components/GenericList/GenericList';

const ReferenceTablesList = () => {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const getTables = async () => {
            try {
                setLoading(true);
                const response = await fetchReferenceTables();
                setTables(response.results);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };
        getTables();
    }, []);

    const handleNewTableClick = () => {
        navigate('/admin/reference-tables/new/edit');
    };

    if (loading) {
        return <div className="text-center">Loading reference tables...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500">Error: {error.message}</div>;
    }

    const columns = [
        { key: 'name', header: 'Name' },
        { key: 'description', header: 'Description' },
        { key: 'row_count', header: 'Rows' },
        { key: 'column_count', header: 'Columns' },
    ];

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Reference Tables</h1>
            <div className="mb-4">
                <button
                    onClick={handleNewTableClick}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    New Table
                </button>
            </div>
            {tables.length === 0 ? (
                <p>No reference tables found.</p>
            ) : (
                <GenericList
                    items={tables}
                    columns={columns}
                    itemKey="id"
                    onRowClick={(item) => navigate(`/admin/reference-tables/${item.id}/edit`)}
                />
            )}
        </div>
    );
};

export default ReferenceTablesList;
