import React, { useEffect, useState, useCallback } from 'react';
import { fetchReferenceTableContent, getReferenceTableById } from '@/services/referenceTableService';

function ReferenceTableDisplay({ id }) {
    const [tableName, setTableName] = useState('');
    const [tableHtml, setTableHtml] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const generateHtmlTable = useCallback((data) => {
        if (!data || data.length === 0) {
            return '';
        }

        const allKeys = Object.keys(data[0]);
        const contentColumnKeys = allKeys.filter(key => key !== 'id' && key !== 'row_index' && key !== 'label');

        if (contentColumnKeys.length === 0) {
            return ''; // No displayable columns
        }

        const rows = data.map(item => {
            const rowCells = contentColumnKeys.map(key => {
                const value = item[key];
                return `<td>${value !== undefined && value !== null ? String(value) : ''}</td>`;
            }).join('');
            return `<tr>${rowCells}</tr>`;
        }).join('');

        return `<table>${rows}</table>`;

    }, []);

    const fetchData = useCallback(async (searchParams) => {
        try {
            setLoading(true);
            const tableData = await fetchReferenceTableContent(id, searchParams);
            const tableInfo = await getReferenceTableById(id);
            setTableName(tableInfo.name);
            setTableHtml(generateHtmlTable(tableData));
            setError(null);
        } catch (err) {
            console.error('Failed to fetch table content:', err);
            setError('Failed to load table content.');
        } finally {
            setLoading(false);
        }
    }, [id, generateHtmlTable]);

    useEffect(() => {
        if (id) {
            fetchData({});
        }
    }, [id, fetchData]);

    if (loading && !tableName) {
        return <div>Loading table content...</div>;
    }

    if (error) {
        return <div className="text-red-500">Error: {error}</div>;
    }

    if (!tableName) {
        return <div>Table not found or invalid ID.</div>;
    }

    return (
        <div className="overflow-x-auto">
            {/* Optionally display table name if needed here, or let the parent handle it */}
            {tableHtml ? (
                <div dangerouslySetInnerHTML={{ __html: tableHtml }} />
            ) : (
                <p>No data available for this table.</p>
            )}
        </div>
    );
}

export default ReferenceTableDisplay; 