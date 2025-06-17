import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import referenceTableService from '@/services/referenceTableService';
import { Icon } from '@mdi/react';
import { mdiTableColumnRemove, mdiTableRowRemove, mdiTableColumnPlusAfter, mdiTableRowPlusAfter, mdiTableColumnPlusBefore, mdiTableRowPlusBefore } from '@mdi/js';

export default function ReferenceTableEditor() {
    const { id } = useParams();
    const [data, setData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTable() {
            if (id === 'new') {
                const defaultData = Array.from({ length: 3 }, () => ({ col1: '', col2: '', col3: '' }));
                setData(defaultData);
                setColumns([
                    { accessorKey: 'col1', header: 'Column 1' },
                    { accessorKey: 'col2', header: 'Column 2' },
                    { accessorKey: 'col3', header: 'Column 3' }
                ]);
                setLoading(false);
            } else {
                const response = await referenceTableService.fetchReferenceTableRaw(id);
                const { rows, headers } = response.data;
                const colDefs = headers.map((header, i) => ({
                    accessorKey: `col${i}`,
                    header,
                }));
                const rowData = rows.map(row => Object.fromEntries(row.map((cell, i) => [`col${i}`, cell])));
                setColumns(colDefs);
                setData(rowData);
                setLoading(false);
            }
        }
        fetchTable();
    }, [id]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    const handleChange = (rowIndex, columnId, value) => {
        setData(old => old.map((row, i) => (i === rowIndex ? { ...row, [columnId]: value } : row)));
    };

    const handleHeaderChange = (columnId, value) => {
        setColumns(old =>
            old.map(col => (col.accessorKey === columnId ? { ...col, header: value, isAuto: false } : col))
        );
    };

    const addRowAfter = (index) => {
        const newRow = Object.fromEntries(columns.map(col => [col.accessorKey, '']));
        setData([...data.slice(0, index + 1), newRow, ...data.slice(index + 1)]);
    };

    const addRowBefore = (index) => {
        const newRow = Object.fromEntries(columns.map(col => [col.accessorKey, '']));
        setData([...data.slice(0, index), newRow, ...data.slice(index)]);
    };

    const deleteRow = index => {
        setData(data.filter((_, i) => i !== index));
    };

    const addColumnAt = (insertIndex) => {
        const newColumns = [...columns];
        newColumns.splice(insertIndex, 0, { accessorKey: 'TEMP_KEY', header: '', isAuto: true });
      
        // Reindex columns to col0, col1, ...
        const rekeyedColumns = newColumns.map((col, i) => ({
            ...col,
            accessorKey: `col${i}`,
            header: col.isAuto ? `Column ${i + 1}` : col.header,
        }));
      
        // Update each row with the new column and remap keys
        const updatedData = data.map(row => {
            const newRow = {};
            let colIdx = 0;
            for (let i = 0; i < rekeyedColumns.length; i++) {
                if (i === insertIndex) {
                    newRow[`col${i}`] = ''; // Insert empty cell
                } else {
                    const oldKey = `col${colIdx}`;
                    newRow[`col${i}`] = row[oldKey] ?? '';
                    colIdx++;
                }
            }
            return newRow;
        });
      
        setColumns(rekeyedColumns);
        setData(updatedData);
    };
      
    const addColumnAfter = (index) => {
        addColumnAt(index + 1);
    };

    const addColumnBefore = (index) => {
        addColumnAt(index);
    };

    const deleteColumn = (columnId) => {
        const colIndex = columns.findIndex(c => c.accessorKey === columnId);
        if (colIndex === -1) return;
      
        const newColumns = columns.filter(c => c.accessorKey !== columnId);
        const rekeyedColumns = newColumns.map((col, i) => ({
            ...col,
            accessorKey: `col${i}`,
        }));
      
        const updatedData = data.map(row => {
            const newRow = {};
            let colIdx = 0;
            for (let i = 0; i < columns.length; i++) {
                const key = `col${i}`;
                if (key === columnId) continue;
                newRow[`col${colIdx}`] = row[key];
                colIdx++;
            }
            return newRow;
        });
      
        setColumns(rekeyedColumns);
        setData(updatedData);
    };
      

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-4 space-y-4">
            <table className="table-auto border border-gray-300 dark:border-gray-700 w-full">
                <thead>
                    <tr>
                        {columns.map((col, colIndex) => (
                            <th key={col.accessorKey} className="border p-2 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 relative">
                                <input
                                    type="text"
                                    value={col.header}
                                    onChange={e => handleHeaderChange(col.accessorKey, e.target.value)}
                                    className="bg-transparent w-full border-none text-sm focus:outline-none"
                                />                                
                                <div className="absolute top-0 left-0 right-3/4 h-4 group">
                                    <button
                                        onClick={() => addColumnBefore(colIndex)}
                                        className="absolute -translate-y-full left-0 -translate-x-1/2 transform bg-gray-200 dark:bg-gray-800 rounded border dark:border-gray-700 size-7 flex items-center justify-center text-green-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto"
                                        title="Add column before"
                                    >
                                        <Icon path={mdiTableColumnPlusBefore} size={0.7} />
                                    </button>
                                </div>
                                <div className="absolute top-0 left-3/4 right-0 h-4 group">
                                    <button
                                        onClick={() => addColumnAfter(colIndex)}
                                        className="absolute -translate-y-full right-0 translate-x-1/2 transform bg-gray-200 dark:bg-gray-800 rounded border dark:border-gray-700 size-7 flex items-center justify-center text-green-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto"
                                        title="Add column after"
                                    >
                                        <Icon path={mdiTableColumnPlusAfter} size={0.7} />
                                    </button>
                                </div>
                                <div
                                    className="absolute top-0 left-1/4 right-1/4 h-4 group"
                                >
                                    <button
                                        onClick={() => deleteColumn(col.accessorKey)}
                                        className="absolute -translate-y-full left-1/2 -translate-x-1/2 transform bg-gray-200 dark:bg-gray-800 rounded border dark:border-gray-700 size-7 flex items-center justify-center text-red-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete column"
                                    >
                                        <Icon path={mdiTableColumnRemove} size={0.7} />
                                    </button>
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {columns.map((col, colIndex) => (
                                <td key={col.accessorKey} className="border p-2 relative dark:border-gray-700">
                                    <input
                                        type="text"
                                        value={row[col.accessorKey] ?? ''}
                                        onChange={e => handleChange(rowIndex, col.accessorKey, e.target.value)}
                                        className="w-full bg-transparent border-none focus:outline-none"
                                    />
                                    {colIndex === columns.length - 1 && (
                                        <div className="absolute top-0 bottom-3/4 right-0 w-4 group">
                                            <button
                                                onClick={() => addRowBefore(rowIndex)}
                                                className="absolute -translate-y-1/2 translate-x-1/2 transform bg-gray-200 dark:bg-gray-800 rounded border dark:border-gray-700 size-7 flex items-center justify-center text-green-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto"
                                                title="Add row before"
                                            >
                                                <Icon path={mdiTableRowPlusBefore} size={0.7} />
                                            </button>
                                        </div>
                                    )}
                                    {colIndex === columns.length - 1 && (
                                        <div className="absolute top-3/4 bottom-0 right-0 w-4 group">
                                            <button
                                                onClick={() => addRowAfter(rowIndex)}
                                                className="absolute translate-x-1/2 transform bg-gray-200 dark:bg-gray-800 rounded border dark:border-gray-700 size-7 flex items-center justify-center text-green-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto"
                                                title="Add row after"
                                            >
                                                <Icon path={mdiTableRowPlusAfter} size={0.7} />
                                            </button>
                                        </div>
                                    )}
                                    {colIndex === columns.length - 1 && (
                                        <div className="absolute right-0 top-1/4 bottom-1/4 w-4 group">
                                            <button
                                                onClick={() => deleteRow(rowIndex)}
                                                className="absolute translate-x-1/2 top-1/2 -translate-y-1/2 transform border dark:bg-gray-800 dark:border-gray-700 rounded size-7 flex items-center justify-center text-red-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Delete row"
                                            >
                                                <Icon path={mdiTableRowRemove} size={0.7} />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
