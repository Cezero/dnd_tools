import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReactTable, getCoreRowModel } from '@tanstack/react-table';
import { GetReferenceTable, CreateReferenceTable, UpdateReferenceTable } from '@/features/admin/features/ReferenceTableMgmt/services/ReferenceTableService';
import { Icon } from '@mdi/react';
import {
    mdiTableColumnRemove,
    mdiTableRowRemove,
    mdiTableColumnPlusAfter,
    mdiTableRowPlusAfter,
    mdiTableColumnPlusBefore,
    mdiTableRowPlusBefore,
    mdiFormatAlignLeft,
    mdiFormatAlignCenter,
    mdiFormatAlignRight,
    mdiCallSplit,
    mdiBorderRight,
    mdiBorderBottom,
} from '@mdi/js';
import ReactDOM from 'react-dom';

export function ReferenceTableEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tableName, setTableName] = useState('');
    const [tableDescription, setTableDescription] = useState('');
    const [tableId, setTableId] = useState(id);
    const [tableSlug, setTableSlug] = useState('');

    // Refs for focus management
    const tableNameInputRef = useRef(null);
    const tableDescriptionRef = useRef(null);
    const headerInputRefs = useRef(new Map());
    const dataCellRefs = useRef(new Map());
    const cancelButtonRef = useRef(null);
    const saveButtonRef = useRef(null);
    const tableSlugInputRef = useRef(null);

    // State for context menu
    const [contextMenu, setContextMenu] = useState(null);
    const [cellContextMenuData, setCellContextMenuData] = useState(null);
    const [hoveredCell, setHoveredCell] = useState(null);

    const GetCellRef = (rowIndex, colIndex) => {
        const key = `${rowIndex}-${colIndex}`;
        if (!dataCellRefs.current.has(key)) {
            dataCellRefs.current.set(key, React.createRef());
        }
        return dataCellRefs.current.get(key);
    };

    const GetHeaderRef = (colIndex) => {
        const key = `header-${colIndex}`;
        if (!headerInputRefs.current.has(key)) {
            headerInputRefs.current.set(key, React.createRef());
        }
        return headerInputRefs.current.get(key);
    };

    const HandleKeyDown = (e, type, rowIndex = -1, colIndex = -1) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const numColumns = columns.length;
            const numRows = data.length;

            if (!e.shiftKey) { // Tab (forward navigation)
                if (type === 'tableName') {
                    tableSlugInputRef.current.focus();
                } else if (type === 'tableSlug') {
                    tableDescriptionRef.current.focus();
                } else if (type === 'tableDescription') {
                    if (numColumns > 0) {
                        GetHeaderRef(0).current.focus();
                    } else {
                        cancelButtonRef.current.focus();
                    }
                } else if (type === 'header') {
                    if (colIndex < numColumns - 1) {
                        GetHeaderRef(colIndex + 1).current.focus();
                    } else if (numRows > 0) {
                        GetCellRef(0, 0).current.focus();
                    } else {
                        cancelButtonRef.current.focus(); // If no rows, go to cancel button
                    }
                } else if (type === 'cell') {
                    const currentCellData = data[rowIndex]?.[columns[colIndex]?.accessorKey] || { value: '', colSpan: 1, rowSpan: 1 };
                    const currentCellColSpan = currentCellData.colSpan || 1;

                    let nextFocusRow = rowIndex;
                    let nextFocusCol = colIndex + currentCellColSpan;

                    // Try to find the next available cell in the current row
                    while (nextFocusCol < numColumns) {
                        const targetCellData = data[nextFocusRow]?.[columns[nextFocusCol]?.accessorKey] || { value: '', colSpan: 1, rowSpan: 1 };
                        if (!targetCellData.merged) {
                            GetCellRef(nextFocusRow, nextFocusCol).current.focus();
                            return; // Found and focused, exit
                        }
                        nextFocusCol += (targetCellData.colSpan || 1); // Skip over merged/spanned cells
                    }

                    // If no valid cell in current row, try the next row
                    nextFocusRow = rowIndex + 1;
                    nextFocusCol = 0; // Start from the beginning of the next row

                    while (nextFocusRow < numRows) {
                        while (nextFocusCol < numColumns) {
                            const targetCellData = data[nextFocusRow]?.[columns[nextFocusCol]?.accessorKey] || { value: '', colSpan: 1, rowSpan: 1 };
                            if (!targetCellData.merged) {
                                GetCellRef(nextFocusRow, nextFocusCol).current.focus();
                                return; // Found and focused, exit
                            }
                            nextFocusCol += (targetCellData.colSpan || 1); // Skip over merged/spanned cells
                        }
                        nextFocusRow += 1; // Move to the next row
                        nextFocusCol = 0; // Reset column for the new row
                    }

                    // If no valid cell found in any subsequent row, focus cancel button
                    cancelButtonRef.current.focus();

                } else if (type === 'cancelButton') {
                    saveButtonRef.current.focus();
                } else if (type === 'saveButton') {
                    tableNameInputRef.current.focus();
                }
            } else { // Shift + Tab (backward navigation)
                if (type === 'tableName') {
                    saveButtonRef.current.focus();
                } else if (type === 'tableSlug') {
                    tableNameInputRef.current.focus();
                } else if (type === 'tableDescription') {
                    tableSlugInputRef.current.focus();
                } else if (type === 'header') {
                    if (colIndex > 0) {
                        GetHeaderRef(colIndex - 1).current.focus();
                    } else {
                        tableDescriptionRef.current.focus();
                    }
                } else if (type === 'cell') {
                    let targetRow = rowIndex;
                    let targetCol = colIndex - 1;

                    // Search backward in the current row
                    while (targetCol >= 0) {
                        const cellData = data[targetRow]?.[columns[targetCol]?.accessorKey];
                        if (cellData && !cellData.merged) {
                            // Found a non-merged cell, focus it
                            GetCellRef(targetRow, targetCol).current.focus();
                            return;
                        }
                        targetCol--; // Move to the left
                    }

                    // If not found in current row, go to previous rows
                    targetRow--; // Move to the previous row
                    while (targetRow >= 0) {
                        targetCol = numColumns - 1; // Start from the end of the previous row
                        while (targetCol >= 0) {
                            const cellData = data[targetRow]?.[columns[targetCol]?.accessorKey];
                            if (cellData && !cellData.merged) {
                                // Found a non-merged cell, focus it
                                GetCellRef(targetRow, targetCol).current.focus();
                                return;
                            }
                            targetCol--; // Move to the left
                        }
                        targetRow--; // Move to the previous row
                    }

                    // If no valid cell found in any preceding row, focus last header or description
                    if (numColumns > 0) {
                        GetHeaderRef(numColumns - 1).current.focus();
                    } else {
                        tableDescriptionRef.current.focus();
                    }

                } else if (type === 'cancelButton') {
                    if (numRows > 0 && numColumns > 0) {
                        GetCellRef(numRows - 1, numColumns - 1).current.focus();
                    } else if (numColumns > 0) {
                        GetHeaderRef(numColumns - 1).current.focus();
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
        async function FetchTable() {
            if (id === 'new') {
                const defaultData = Array.from({ length: 3 }, () => ({ col1: '', col2: '', col3: '' }));
                setData(defaultData);
                setColumns([
                    { accessorKey: 'col1', header: 'Column 1', alignment: null },
                    { accessorKey: 'col2', header: 'Column 2', alignment: null },
                    { accessorKey: 'col3', header: 'Column 3', alignment: null }
                ]);
                setTableName('New Table');
                setTableDescription('');
                setTableSlug('');
                setLoading(false);
            } else {
                const { table, headers, rows } = await GetReferenceTable(id);
                setTableName(table.name);
                setTableDescription(table.description ?? '');
                setTableSlug(table.slug ?? '');

                const colDefs = headers.map(({ column_index, header, alignment }) => ({
                    accessorKey: `col${column_index}`,
                    header: header,
                    alignment: alignment,
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
        FetchTable();
    }, [id]);

    const Table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    const HandleChange = (rowIndex, columnId, value) => {
        setData(old => old.map((row, i) => (i === rowIndex ? { ...row, [columnId]: { ...row[columnId], value: value } } : row)));
    };

    const HandleHeaderChange = (columnId, property, value) => {
        setColumns(old =>
            old.map(col => (col.accessorKey === columnId ? { ...col, [property]: value, isAuto: false } : col))
        );
    };

    const AddRowAfter = (index) => {
        const newRow = Object.fromEntries(columns.map(col => [col.accessorKey, '']));
        setData([...data.slice(0, index + 1), newRow, ...data.slice(index + 1)]);
    };

    const AddRowBefore = (index) => {
        const newRow = Object.fromEntries(columns.map(col => [col.accessorKey, '']));
        setData([...data.slice(0, index), newRow, ...data.slice(index)]);
    };

    const DeleteRow = index => {
        setData(data.toSpliced(index, 1))
    };

    const AddColumnAt = (insertIndex) => {
        const newColumns = [...columns];
        newColumns.splice(insertIndex, 0, { accessorKey: 'TEMP_KEY', header: '', isAuto: true, alignment: null });

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

    const AddColumnAfter = (index) => {
        AddColumnAt(index + 1);
    };

    const AddColumnBefore = (index) => {
        AddColumnAt(index);
    };

    const DeleteColumn = (columnId) => {
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

    const HandleSave = async () => {
        const tableData = {
            name: tableName,
            description: tableDescription,
            headers: columns.map(col => ({
                header: col.header,
                alignment: col.alignment === 'left' ? null : col.alignment
            })),
            slug: tableSlug,
            rows: data.map((row) => {
                const currentRowCells = [];
                columns.forEach((col, colIndex) => {
                    const cellData = row[col.accessorKey];

                    // If the cell is marked as merged, it's consumed by another span, so do not save it as a standalone cell.
                    if (cellData && cellData.merged) {
                        return;
                    }

                    const colSpan = cellData?.colSpan || 1;
                    const rowSpan = cellData?.rowSpan || 1;

                    currentRowCells.push({
                        column_index: colIndex,
                        value: cellData?.value ?? '',
                        col_span: colSpan,
                        row_span: rowSpan
                    });
                });
                return currentRowCells;
            }).filter(rowCells => rowCells.length > 0) // Filter out any rows that became empty due to all cells being merged
        };

        try {
            if (tableId === 'new') {
                const response = await CreateReferenceTable(tableData);
                setTableId(response.id); // Update tableId with the new ID
                navigate('/admin/referencetables');
            } else {
                await UpdateReferenceTable(tableId, tableData);
                navigate('/admin/referencetables');
            }
        } catch (error) {
            console.error('Error saving table:', error);
            // Optionally, show an error message to the user
        }
    };

    const HandleContextMenu = (e, colIndex, rowIndex = -1) => {
        e.preventDefault();
        setContextMenu({
            columnId: columns[colIndex].accessorKey,
            x: e.clientX,
            y: e.clientY,
        });
        setCellContextMenuData({
            rowIndex,
            colIndex,
            isCell: rowIndex !== -1,
        });
    };

    const HandleAlignmentChange = (alignment) => {
        if (contextMenu) {
            HandleHeaderChange(contextMenu.columnId, 'alignment', alignment === 'left' ? null : alignment);
            setContextMenu(null); // Close the context menu
        }
    };

    const HandleSplitCell = () => {
        if (cellContextMenuData && cellContextMenuData.isCell) {
            const { rowIndex, colIndex } = cellContextMenuData;
            const columnId = columns[colIndex].accessorKey;

            setData(oldData => {
                const newData = [...oldData];
                const currentRow = { ...newData[rowIndex] };
                const currentCell = { ...currentRow[columnId] };

                if (currentCell.colSpan > 1) {
                    currentCell.colSpan -= 1;
                    currentRow[columnId] = currentCell;

                    const targetColIdxToRestore = colIndex + currentCell.colSpan; // Index of the cell to restore
                    const targetColumnAccessorKeyToRestore = columns[targetColIdxToRestore].accessorKey;
                    currentRow[targetColumnAccessorKeyToRestore] = { value: '', colSpan: 1, rowSpan: 1, merged: false };

                } else if (currentCell.rowSpan > 1) {
                    currentCell.rowSpan -= 1;
                    currentRow[columnId] = currentCell;

                    const targetRowIdxToRestore = rowIndex + currentCell.rowSpan; // Index of the row to restore
                    const targetColumnAccessorKeyToRestore = columns[colIndex].accessorKey; // Same column

                    // Ensure the target row exists before attempting to modify it
                    if (!newData[targetRowIdxToRestore]) {
                        // This case should ideally not happen if data is consistent, but adding a fallback
                        newData[targetRowIdxToRestore] = {};
                    }

                    newData[targetRowIdxToRestore] = {
                        ...newData[targetRowIdxToRestore],
                        [targetColumnAccessorKeyToRestore]: { value: '', colSpan: 1, rowSpan: 1, merged: false }
                    };
                }
                newData[rowIndex] = currentRow; // Update the modified row in newData
                return newData;
            });

            setContextMenu(null);
            setCellContextMenuData(null);
        }
    };

    const HandleMergeCellsRight = (rowIndex, colIndex) => {
        // Check if there's a cell to the right to merge with
        const currentCell = data[rowIndex]?.[columns[colIndex].accessorKey] || { value: '', colSpan: 1, rowSpan: 1 };
        const currentCellColSpan = currentCell.colSpan || 1;
        const targetColIdx = colIndex + currentCellColSpan; // Calculate the actual next column index based on current span

        if (targetColIdx < columns.length) {
            setData(old => old.map((row, rIdx) => {
                if (rIdx === rowIndex) {
                    const newRow = { ...row };
                    const targetColumnAccessorKey = columns[targetColIdx].accessorKey;
                    const targetCell = newRow[targetColumnAccessorKey] || { value: '', colSpan: 1, rowSpan: 1 };

                    // Only merge if the target cell is not already merged
                    if (!targetCell.merged) {
                        // Increase colSpan of current cell by the span of the target cell
                        currentCell.colSpan = currentCellColSpan + (targetCell.colSpan || 1);
                        newRow[columns[colIndex].accessorKey] = currentCell;

                        // Mark the target cell as consumed instead of deleting it
                        newRow[targetColumnAccessorKey] = { value: '', colSpan: 0, rowSpan: 0, merged: true };
                    }
                    return newRow;
                }
                return row;
            }));
        }
    };

    const HandleMergeCellsDown = (rowIndex, colIndex) => {
        // Check if there's a cell below to merge with
        const currentCell = data[rowIndex]?.[columns[colIndex].accessorKey] || { value: '', colSpan: 1, rowSpan: 1 };
        const currentCellRowSpan = currentCell.rowSpan || 1;
        const targetRowIdx = rowIndex + currentCellRowSpan; // Calculate the actual next row index based on current span

        if (targetRowIdx < data.length) {
            setData(old => {
                const newData = [...old];
                const targetColumnAccessorKey = columns[colIndex].accessorKey;
                const targetCell = newData[targetRowIdx]?.[targetColumnAccessorKey] || { value: '', colSpan: 1, rowSpan: 1 };

                // Only merge if the target cell is not already merged
                if (!targetCell.merged) {
                    // Increase rowSpan of current cell by the span of the target cell
                    currentCell.rowSpan = currentCellRowSpan + (targetCell.rowSpan || 1);
                    newData[rowIndex][columns[colIndex].accessorKey] = currentCell;

                    // Mark the target cell as consumed instead of deleting it
                    newData[targetRowIdx][columns[colIndex].accessorKey] = { value: '', colSpan: 0, rowSpan: 0, merged: true };
                }
                return newData;
            });
        }
    };

    // Close context menu if clicked outside
    useEffect(() => {
        const HandleClickOutside = (event) => {
            if (contextMenu && !event.target.closest('.context-menu')) {
                setContextMenu(null);
            }
        };
        document.addEventListener('mousedown', HandleClickOutside);
        return () => {
            document.removeEventListener('mousedown', HandleClickOutside);
        };
    }, [contextMenu]);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-4">
            {contextMenu && ReactDOM.createPortal(
                <div
                    className="context-menu absolute bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50 py-1 flex flex-row"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <button
                        className="block p-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 text-left"
                        onClick={() => HandleAlignmentChange('left')}
                        title="Align Left"
                    >
                        <Icon path={mdiFormatAlignLeft} size={0.7} className="text-gray-500 dark:text-gray-400" />
                    </button>
                    <button
                        className="block p-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 text-left"
                        onClick={() => HandleAlignmentChange('center')}
                        title="Align Center"
                    >
                        <Icon path={mdiFormatAlignCenter} size={0.7} className="text-gray-500 dark:text-gray-400" />
                    </button>
                    <button
                        className="block p-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 text-left"
                        onClick={() => HandleAlignmentChange('right')}
                        title="Align Right"
                    >
                        <Icon path={mdiFormatAlignRight} size={0.7} className="text-gray-500 dark:text-gray-400" />
                    </button>
                    {cellContextMenuData && cellContextMenuData.isCell && (
                        (() => {
                            const { rowIndex, colIndex } = cellContextMenuData;
                            const columnId = columns[colIndex].accessorKey;
                            const cellData = data[rowIndex]?.[columnId] || { value: '', colSpan: 1, rowSpan: 1 };
                            const canSplit = cellData.colSpan > 1 || cellData.rowSpan > 1;
                            return canSplit && (
                                <>
                                    <div className="border-l border-gray-300 dark:border-gray-600 mx-1"></div>
                                    <button
                                        className="block p-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 text-left"
                                        onClick={HandleSplitCell}
                                        title="Split Cell"
                                    >
                                        <Icon path={mdiCallSplit} size={0.7} className="text-gray-500 dark:text-gray-400" />
                                    </button>
                                </>
                            );
                        })()
                    )}
                </div>
                , document.getElementById('context-menu-root'))}
            <div className="mb-4">
                <label htmlFor="tableName" className="block font-medium text-gray-700 dark:text-gray-300">Table Name</label>
                <input
                    type="text"
                    id="tableName"
                    ref={tableNameInputRef}
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    onKeyDown={(e) => HandleKeyDown(e, 'tableName')}
                    className="mt-1 block p-1.5 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border dark:border-gray-700"
                />
            </div>
            <div className="mb-4">
                <label htmlFor="tableSlug" className="block font-medium text-gray-700 dark:text-gray-300">Slug</label>
                <input
                    type="text"
                    id="tableSlug"
                    ref={tableSlugInputRef}
                    value={tableSlug}
                    onChange={(e) => setTableSlug(e.target.value)}
                    onKeyDown={(e) => HandleKeyDown(e, 'tableSlug')}
                    className="mt-1 block p-1.5 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border dark:border-gray-700"
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
                    onKeyDown={(e) => HandleKeyDown(e, 'tableDescription')}
                    className="mt-1 block p-1.5 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border dark:border-gray-700"
                ></textarea>
            </div>
            <Table className="table-auto border border-gray-300 dark:border-gray-700 w-98/100">
                <thead>
                    <tr>
                        {columns.map((col, colIndex) => (
                            <th
                                key={col.accessorKey}
                                className="border p-2 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 relative"
                                onContextMenu={(e) => HandleContextMenu(e, colIndex)}
                            >
                                <input
                                    type="text"
                                    ref={GetHeaderRef(colIndex)}
                                    value={col.header}
                                    onChange={e => HandleHeaderChange(col.accessorKey, 'header', e.target.value)}
                                    className={`bg-transparent w-full border-none text-sm focus:outline-none text-${col.alignment || 'left'}`}
                                    onKeyDown={(e) => HandleKeyDown(e, 'header', -1, colIndex)}
                                />
                                <div className="absolute top-0 left-0 right-3/4 h-4 group">
                                    <button
                                        onClick={() => AddColumnBefore(colIndex)}
                                        className="absolute -translate-y-full left-0 -translate-x-1/2 transform bg-gray-200 dark:bg-gray-800 rounded border dark:border-gray-700 size-7 flex items-center justify-center text-green-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto"
                                        title="Add column before"
                                    >
                                        <Icon path={mdiTableColumnPlusBefore} size={0.7} />
                                    </button>
                                </div>
                                <div className="absolute top-0 left-3/4 right-0 h-4 group">
                                    <button
                                        onClick={() => AddColumnAfter(colIndex)}
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
                                        onClick={() => DeleteColumn(col.accessorKey)}
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
                                        const cellData = row[col.accessorKey] || { value: '', colSpan: 1, rowSpan: 1 };

                                        if (cellData.merged) {
                                            return null; // Skip rendering this cell if it's consumed by a span
                                        }

                                        if (occupiedCells.has(`${rowIndex}-${colIndex}`)) {
                                            return null; // Skip rendering this cell if it's already covered by a span from the left/top
                                        }

                                        // Original colSpan and rowSpan are used for rendering and occupiedCells calculation
                                        const colSpan = cellData.colSpan || 1;
                                        const rowSpan = cellData.rowSpan || 1;

                                        // Mark all cells covered by this span as occupied for rendering purposes
                                        for (let r = 0; r < rowSpan; r++) {
                                            for (let c = 0; c < colSpan; c++) {
                                                occupiedCells.add(`${rowIndex + r}-${colIndex + c}`);
                                            }
                                        }

                                        // Get current cell's colSpan and rowSpan for merge button logic
                                        const currentCellColSpan = cellData.colSpan || 1;
                                        const currentCellRowSpan = cellData.rowSpan || 1;

                                        return (
                                            <td
                                                key={col.accessorKey}
                                                className="border p-2 relative dark:border-gray-700"
                                                colSpan={colSpan}
                                                rowSpan={rowSpan}
                                                onContextMenu={(e) => HandleContextMenu(e, colIndex, rowIndex)}
                                                onMouseEnter={() => setHoveredCell({ rowIndex, colIndex })}
                                                onMouseLeave={() => setHoveredCell(null)}
                                            >
                                                <input
                                                    type="text"
                                                    ref={GetCellRef(rowIndex, colIndex)}
                                                    value={cellData.value ?? ''}
                                                    onChange={e => HandleChange(rowIndex, col.accessorKey, e.target.value)}
                                                    className={`w-full bg-transparent border-none focus:outline-none text-${col.alignment || 'left'}`}
                                                    onKeyDown={(e) => HandleKeyDown(e, 'cell', rowIndex, colIndex)}
                                                />
                                                {/* Merge Right Button */}
                                                {hoveredCell?.rowIndex === rowIndex &&
                                                    hoveredCell?.colIndex === colIndex &&
                                                    (colIndex + currentCellColSpan < columns.length) &&
                                                    (() => {
                                                        const targetColIdx = colIndex + currentCellColSpan;
                                                        const targetCellData = data[rowIndex]?.[columns[targetColIdx]?.accessorKey] || { value: '', colSpan: 1, rowSpan: 1 };
                                                        return !targetCellData.merged;
                                                    })() && (
                                                        <div className="absolute inset-y-0 right-0 w-4 flex items-center justify-center group">
                                                            <button
                                                                onClick={() => HandleMergeCellsRight(rowIndex, colIndex)}
                                                                className="bg-blue-500 text-white rounded-full size-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                title="Merge right"
                                                            >
                                                                <Icon path={mdiBorderRight} size={0.6} />
                                                            </button>
                                                        </div>
                                                    )}
                                                {/* Merge Down Button */}
                                                {hoveredCell?.rowIndex === rowIndex &&
                                                    hoveredCell?.colIndex === colIndex &&
                                                    (rowIndex + currentCellRowSpan < data.length) &&
                                                    (() => {
                                                        const targetRowIdx = rowIndex + currentCellRowSpan;
                                                        const targetCellData = data[targetRowIdx]?.[columns[colIndex]?.accessorKey] || { value: '', colSpan: 1, rowSpan: 1 };
                                                        return !targetCellData.merged;
                                                    })() && (
                                                        <div className="absolute inset-x-0 bottom-0 h-4 flex items-center justify-center group">
                                                            <button
                                                                onClick={() => HandleMergeCellsDown(rowIndex, colIndex)}
                                                                className="bg-blue-500 text-white rounded-full size-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                title="Merge down"
                                                            >
                                                                <Icon path={mdiBorderBottom} size={0.6} />
                                                            </button>
                                                        </div>
                                                    )}
                                                {colIndex === columns.length - 1 && (
                                                    <div className="absolute top-0 bottom-3/4 right-0 w-4 group">
                                                        <button
                                                            onClick={() => AddRowBefore(rowIndex)}
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
                                                            onClick={() => AddRowAfter(rowIndex)}
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
                                                            onClick={() => DeleteRow(rowIndex)}
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
            </Table>
            <div className="mt-4 flex justify-end space-x-2">
                <button
                    onClick={() => navigate('/admin/referencetables')}
                    ref={cancelButtonRef}
                    onKeyDown={(e) => HandleKeyDown(e, 'cancelButton')}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600"
                    title="Cancel changes and return to table list"
                >
                    Cancel
                </button>
                <button
                    onClick={HandleSave}
                    ref={saveButtonRef}
                    onKeyDown={(e) => HandleKeyDown(e, 'saveButton')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    title="Save table changes"
                >
                    Save
                </button>
            </div>
        </div>
    );
}
