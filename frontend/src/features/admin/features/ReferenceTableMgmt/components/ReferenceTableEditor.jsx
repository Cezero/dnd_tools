import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import referenceTableService from '@/services/referenceTableService';
import { Icon } from '@mdi/react';
import { mdiTableColumnRemove, mdiTableRowRemove, mdiTableColumnPlusAfter, mdiTableRowPlusAfter, mdiTableColumnPlusBefore, mdiTableRowPlusBefore } from '@mdi/js';

export default function ReferenceTableEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tableName, setTableName] = useState('');
    const [tableDescription, setTableDescription] = useState('');
    const [tableId, setTableId] = useState(id);

    // Refs for focus management
    const tableNameInputRef = useRef(null);
    const tableDescriptionRef = useRef(null);
    const headerInputRefs = useRef(new Map());
    const dataCellRefs = useRef(new Map());
    const cancelButtonRef = useRef(null);
    const saveButtonRef = useRef(null);

    const getCellRef = (rowIndex, colIndex) => {
        const key = `${rowIndex}-${colIndex}`;
        if (!dataCellRefs.current.has(key)) {
            dataCellRefs.current.set(key, React.createRef());
        }
        return dataCellRefs.current.get(key);
    };

    const getHeaderRef = (colIndex) => {
        const key = `header-${colIndex}`;
        if (!headerInputRefs.current.has(key)) {
            headerInputRefs.current.set(key, React.createRef());
        }
        return headerInputRefs.current.get(key);
    };

    const handleKeyDown = (e, type, rowIndex = -1, colIndex = -1) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const numColumns = columns.length;
            const numRows = data.length;

            if (!e.shiftKey) { // Tab (forward navigation)
                if (type === 'tableName') {
                    tableDescriptionRef.current.focus();
                } else if (type === 'tableDescription') {
                    if (numColumns > 0) {
                        getHeaderRef(0).current.focus();
                    }
                } else if (type === 'header') {
                    if (colIndex < numColumns - 1) {
                        getHeaderRef(colIndex + 1).current.focus();
                    } else if (numRows > 0) {
                        getCellRef(0, 0).current.focus();
                    } else {
                        cancelButtonRef.current.focus(); // If no rows, go to cancel button
                    }
                } else if (type === 'cell') {
                    if (colIndex < numColumns - 1) {
                        getCellRef(rowIndex, colIndex + 1).current.focus();
                    } else if (rowIndex < numRows - 1) {
                        getCellRef(rowIndex + 1, 0).current.focus();
                    } else {
                        cancelButtonRef.current.focus();
                    }
                } else if (type === 'cancelButton') {
                    saveButtonRef.current.focus();
                } else if (type === 'saveButton') {
                    tableNameInputRef.current.focus();
                }
            } else { // Shift + Tab (backward navigation)
                if (type === 'tableName') {
                    saveButtonRef.current.focus();
                } else if (type === 'tableDescription') {
                    tableNameInputRef.current.focus();
                } else if (type === 'header') {
                    if (colIndex > 0) {
                        getHeaderRef(colIndex - 1).current.focus();
                    } else {
                        tableDescriptionRef.current.focus();
                    }
                } else if (type === 'cell') {
                    if (colIndex > 0) {
                        getCellRef(rowIndex, colIndex - 1).current.focus();
                    } else if (rowIndex > 0) {
                        getCellRef(rowIndex - 1, numColumns - 1).current.focus();
                    } else {
                        getHeaderRef(numColumns - 1).current.focus();
                    }
                } else if (type === 'cancelButton') {
                    if (numRows > 0 && numColumns > 0) {
                        getCellRef(numRows - 1, numColumns - 1).current.focus();
                    } else if (numColumns > 0) {
                        getHeaderRef(numColumns - 1).current.focus();
                    } else {
                        tableDescriptionRef.current.focus();
                    }
                } else if (type === 'saveButton') {
                    cancelButtonRef.current.focus();
                }
            }
        }
    };

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
                setTableName('New Table');
                setTableDescription('');
                setLoading(false);
            } else {
                const rawResponse = await referenceTableService.getReferenceTableRaw(id);
                const { table, headers, rows } = rawResponse;
                setTableName(table.name);
                setTableDescription(table.description ?? '');

                const colDefs = headers.map(({ column_index, header }) => ({
                    accessorKey: `col${column_index}`,
                    header: header,
                }));

                // Create a mapping from column_id to column_index
                const columnIdToIndexMap = new Map(headers.map(h => [h.id, h.column_index]));

                const rowData = rows.map(row => {
                    const newRow = {};
                    row.cells.forEach(cell => {
                        const columnIndex = columnIdToIndexMap.get(cell.column_id);
                        if (columnIndex !== undefined) {
                            newRow[`col${columnIndex}`] = {
                                value: cell.value,
                                colSpan: cell.col_span || 1,
                                rowSpan: cell.row_span || 1
                            };
                        }
                    });
                    return newRow;
                });
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
        setData(old => old.map((row, i) => (i === rowIndex ? { ...row, [columnId]: { ...row[columnId], value: value } } : row)));
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

    const handleSave = async () => {
        const tableData = {
            name: tableName,
            description: tableDescription,
            headers: columns.map(col => col.header),
            rows: (() => {
                const rowsToSave = [];
                const occupiedCellsForSave = new Set(); // Stores 'rowIndex-colIndex'

                data.forEach((row, rowIndex) => {
                    const currentRowCells = [];
                    columns.forEach((col, colIndex) => {
                        if (occupiedCellsForSave.has(`${rowIndex}-${colIndex}`)) {
                            return; // Skip this cell as it's part of a span
                        }

                        const cellData = row[col.accessorKey] || { value: '', colSpan: 1, rowSpan: 1 };
                        const colSpan = cellData.colSpan || 1;
                        const rowSpan = cellData.rowSpan || 1;

                        // Mark all cells covered by this span as occupied
                        for (let r = 0; r < rowSpan; r++) {
                            for (let c = 0; c < colSpan; c++) {
                                occupiedCellsForSave.add(`${rowIndex + r}-${colIndex + c}`);
                            }
                        }

                        // Add this cell's data to the current row, including its original column_index
                        currentRowCells.push({
                            column_index: colIndex,
                            value: cellData.value ?? '',
                            col_span: colSpan,
                            row_span: rowSpan
                        });
                    });
                    rowsToSave.push(currentRowCells);
                });
                return rowsToSave;
            })()
        };

        try {
            if (tableId === 'new') {
                const response = await referenceTableService.createReferenceTable(tableData);
                setTableId(response.id); // Update tableId with the new ID
                navigate('/admin/reference-tables');
            } else {
                await referenceTableService.updateReferenceTable(tableId, tableData);
                navigate('/admin/reference-tables');
            }
        } catch (error) {
            console.error('Error saving table:', error);
            // Optionally, show an error message to the user
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-4">
            <div className="mb-4">
                <label htmlFor="tableName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Table Name</label>
                <input
                    type="text"
                    id="tableName"
                    ref={tableNameInputRef}
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'tableName')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border dark:border-gray-700"
                />
            </div>
            <div className="mb-8">
                <label htmlFor="tableDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                    id="tableDescription"
                    ref={tableDescriptionRef}
                    value={tableDescription}
                    onChange={(e) => setTableDescription(e.target.value)}
                    rows="3"
                    onKeyDown={(e) => handleKeyDown(e, 'tableDescription')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border dark:border-gray-700"
                ></textarea>
            </div>
            <table className="table-auto border border-gray-300 dark:border-gray-700 w-full">
                <thead>
                    <tr>
                        {columns.map((col, colIndex) => (
                            <th key={col.accessorKey} className="border p-2 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 relative">
                                <input
                                    type="text"
                                    ref={getHeaderRef(colIndex)}
                                    value={col.header}
                                    onChange={e => handleHeaderChange(col.accessorKey, e.target.value)}
                                    className="bg-transparent w-full border-none text-sm focus:outline-none"
                                    onKeyDown={(e) => handleKeyDown(e, 'header', -1, colIndex)}
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
                    {(() => {
                        const occupiedCells = new Set(); // Stores 'rowIndex-colIndex' strings
                        return data.map((row, rowIndex) => {
                            return (
                                <tr key={rowIndex}>
                                    {columns.map((col, colIndex) => {
                                        if (occupiedCells.has(`${rowIndex}-${colIndex}`)) {
                                            return null; // Skip rendering this cell
                                        }

                                        const cellData = row[col.accessorKey] || { value: '', colSpan: 1, rowSpan: 1 };
                                        const colSpan = cellData.colSpan || 1;
                                        const rowSpan = cellData.rowSpan || 1;

                                        // Mark all cells covered by this span as occupied
                                        for (let r = 0; r < rowSpan; r++) {
                                            for (let c = 0; c < colSpan; c++) {
                                                occupiedCells.add(`${rowIndex + r}-${colIndex + c}`);
                                            }
                                        }

                                        return (
                                            <td
                                                key={col.accessorKey}
                                                className="border p-2 relative dark:border-gray-700"
                                                colSpan={colSpan}
                                                rowSpan={rowSpan}
                                            >
                                                <input
                                                    type="text"
                                                    ref={getCellRef(rowIndex, colIndex)}
                                                    value={cellData.value ?? ''}
                                                    onChange={e => handleChange(rowIndex, col.accessorKey, e.target.value)}
                                                    className="w-full bg-transparent border-none focus:outline-none"
                                                    onKeyDown={(e) => handleKeyDown(e, 'cell', rowIndex, colIndex)}
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
                                        );
                                    })}
                                </tr>
                            );
                        });
                    })()}
                </tbody>
            </table>
            <div className="mt-4 flex justify-end space-x-2">
                <button
                    onClick={() => navigate('/admin/reference-tables')}
                    ref={cancelButtonRef}
                    onKeyDown={(e) => handleKeyDown(e, 'cancelButton')}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    ref={saveButtonRef}
                    onKeyDown={(e) => handleKeyDown(e, 'saveButton')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    Save
                </button>
            </div>
        </div>
    );
}
