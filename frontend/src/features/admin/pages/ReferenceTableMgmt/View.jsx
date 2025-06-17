import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MarkdownViewer from '@/components/MarkdownViewer/MarkdownViewer';
import { getReferenceTableById } from '@/services/referenceTableService';

function ReferenceTableContentPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tableName, setTableName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTableName = async () => {
            try {
                setLoading(true);
                const tableInfo = await getReferenceTableById(id);
                setTableName(tableInfo.name);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch table name:', err);
                setError('Failed to load table name.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchTableName();
        }
    }, [id]);

    if (loading) {
        return <div className="container mx-auto p-4">Loading table information...</div>;
    }

    if (error) {
        return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>;
    }

    if (!tableName) {
        return <div className="container mx-auto p-4">Table not found or invalid ID.</div>;
    }

    const markdownContent = `
# Viewing Table: ${tableName}

::reference-table-id-${id}::
`;

    return (
        <div className="container mx-auto p-4">
            <button
                onClick={() => navigate(-1)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mb-4"
            >
                Back to Reference Tables
            </button>
            <MarkdownViewer markdown={markdownContent} />
        </div>
    );
}

export default ReferenceTableContentPage; 