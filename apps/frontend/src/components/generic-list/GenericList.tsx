import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
    Cell,
    type ColumnDef,

    type SortingState
} from '@tanstack/react-table';
import pluralize from 'pluralize';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { CustomSelect } from '@/components/forms/FormComponents';
import { PAGE_LIMITS } from '@shared/static-data';

import { ColumnHeaderContextMenu } from './ColumnHeaderContextMenu';
import { createCellRenderer } from './columnUtils';
import { FloatingTextInput } from './FloatingTextInput';
import type { GenericListProps, GenericListColumnMeta, DataItem } from './types';
import { usePersistentTableState } from './usePersistantTableState';

function SortableHeaderCell({ header, allColumns, onToggleVisibility, onSort, columnFilters, handleFilterChange, handleClearFilter, onRestoreHiddenColumn }) {
    const { attributes, listeners, setNodeRef, transition, transform } =
        useSortable({ id: header.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    const handleResize = header.getResizeHandler();

    return (
        <th
            ref={setNodeRef}
            style={{ ...style, width: header.getSize() }}
            className="relative px-2"
            data-column-id={header.id}
        >
            <ColumnHeaderContextMenu
                header={header}
                allColumns={allColumns}
                onToggleVisibility={onToggleVisibility}
                onSort={onSort}
                columnFilters={columnFilters}
                handleFilterChange={handleFilterChange}
                handleClearFilter={handleClearFilter}
                onRestoreHiddenColumn={onRestoreHiddenColumn}
                dragAttributes={attributes}
                dragListeners={listeners}
            />
            {header.column.getCanResize() && (
                <div
                    onMouseDown={e => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleResize?.(e);
                    }}
                    onTouchStart={e => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleResize?.(e);
                    }}
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize select-none"
                />
            )}
        </th>
    );
}

export function GenericList<T>({
    storageKey,
    columns,
    serviceFunction,
    itemDesc = 'items',
    initialLimit = 20,
    routes,
    functions,
    deleteServiceFunction,
    basePath = '',
    isOptionSelector = false,
    selectedIds = [],
    onSelectedIdsChange,
}: GenericListProps<T>) {
    const [data, setData] = useState<T[]>([]);
    const [_total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { isAdmin } = useAuthAuto();

    // Internal state for selected IDs when in option selector mode
    const [internalSelectedIds, setInternalSelectedIds] = useState<(string | number)[]>(selectedIds);

    // Store the current callback and state in refs to avoid dependency issues
    const onSelectedIdsChangeRef = useRef(onSelectedIdsChange);
    const internalSelectedIdsRef = useRef(internalSelectedIds);
    const serviceFunctionRef = useRef(serviceFunction);
    const selectedIdsRef = useRef(selectedIds);
    onSelectedIdsChangeRef.current = onSelectedIdsChange;
    internalSelectedIdsRef.current = internalSelectedIds;
    serviceFunctionRef.current = serviceFunction;
    selectedIdsRef.current = selectedIds;

    // Sync internal state with prop changes
    useEffect(() => {
        // Only update if the arrays are actually different
        const currentSelectedIds = selectedIdsRef.current;
        const currentInternalIds = internalSelectedIdsRef.current;

        if (currentSelectedIds.length !== currentInternalIds.length ||
            currentSelectedIds.some((id, index) => id !== currentInternalIds[index])) {
            setInternalSelectedIds(currentSelectedIds);
        }
    }, [selectedIds]);

    // Create a stable callback for updating selected IDs
    const handleInternalSelectedIdsChange = useCallback((newSelectedIds: (string | number)[]) => {
        setInternalSelectedIds(newSelectedIds);
        if (isOptionSelector && onSelectedIdsChangeRef.current) {
            onSelectedIdsChangeRef.current(newSelectedIds);
        }
    }, [isOptionSelector]);

    // State for floating text input
    const [textInputState, setTextInputState] = useState<{
        isVisible: boolean;
        columnId: string | null;
        position: { x: number; y: number; width: number };
    }>({
        isVisible: false,
        columnId: null,
        position: { x: 0, y: 0, width: 0 }
    });

    // Process columns to add automatic cell renderers for truncation and markdown
    const processedColumns = useMemo<ColumnDef<T>[]>(() => {
        return columns.map(column => {
            const meta = column.meta as GenericListColumnMeta;

            // If column has truncate or isMarkdown meta properties, add enhanced cell renderer
            if (meta?.truncate || meta?.isMarkdown) {
                const getMarkdownId = meta?.isMarkdown ? (row: T) => {
                    const dataItem = row as DataItem;
                    const id = dataItem.id || dataItem.slug;
                    const columnKey = 'accessorKey' in column && column.accessorKey ? String(column.accessorKey) : column.id;
                    return `${columnKey}-${id}-description`;
                } : undefined;

                return {
                    ...column,
                    cell: createCellRenderer<T>(meta, getMarkdownId)
                };
            }

            return column;
        });
    }, [columns]);

    const columnDefs = useMemo<ColumnDef<T>[]>(() => [...processedColumns], [processedColumns]);
    const defaultColumnOrder = useMemo(() => {
        return columnDefs.map(col => {
            if ('id' in col && col.id) return col.id;
            if ('accessorKey' in col && col.accessorKey) return String(col.accessorKey);
            console.warn('Missing id/accessorKey in column:', col);
            return ''; // fallback to empty string if really broken
        }).filter(Boolean); // remove blanks
    }, [columnDefs]);

    // Create a stable selection cell component
    const SelectionCell = useCallback(({ row }: { row: { original: T } }) => {
        const dataItem = row.original as DataItem;
        const itemId = dataItem.id || dataItem.slug;
        // Fix: Ensure itemId is string or number, not boolean
        const safeItemId = typeof itemId === 'boolean' ? String(itemId) : itemId;
        const isChecked = internalSelectedIdsRef.current.includes(safeItemId);

        return (
            <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => {
                    e.stopPropagation();
                    const newSelectedIds = e.target.checked
                        ? [...internalSelectedIdsRef.current, safeItemId]
                        : internalSelectedIdsRef.current.filter(id => id !== safeItemId);
                    handleInternalSelectedIdsChange(newSelectedIds);
                }}
                className="h-4 w-4 accent-blue-600 dark:bg-gray-700 dark:accent-gray-400 dark:border-gray-600 focus:ring-0 focus:ring-offset-0"
            />
        );
    }, [handleInternalSelectedIdsChange]);

    // Create selection column definition - make it stable to avoid re-renders
    const selectionColumn: ColumnDef<T> = useMemo(() => ({
        id: '__selector__',
        header: () => null,
        cell: ({ row }) => <SelectionCell row={row} />,
        size: 40,
        enableSorting: false,
        enableColumnFilter: false,
    }), [SelectionCell]);

    // Combine columns with selection column if needed
    const finalColumns = useMemo(() => {
        if (isOptionSelector) {
            return [selectionColumn, ...columnDefs];
        }
        return columnDefs;
    }, [isOptionSelector, selectionColumn, columnDefs]);

    // Add selector column to column order if in option selector mode
    const adjustedColumnOrder = useMemo(() => {
        if (isOptionSelector) {
            return ['__selector__', ...defaultColumnOrder];
        }
        return defaultColumnOrder;
    }, [isOptionSelector, defaultColumnOrder]);

    const {
        columnVisibility,
        setColumnVisibility,
        columnFilters,
        setColumnFilters,
        sorting,
        setSorting,
        columnSizing,
        setColumnSizing,
        columnOrder,
        setColumnOrder,
        pagination,
        setPagination,
    } = usePersistentTableState(storageKey, adjustedColumnOrder, initialLimit);

    const handleSortingChange = (updater: (sorting: SortingState) => SortingState) => {
        // Simply pass through the sorting change
        const newSorting = updater(sorting);
        setSorting(newSorting);
    };

    const onSort = (columnId: string, direction: 'asc' | 'desc') => {
        // Check if this is the same sort that's already active
        const currentSort = sorting.find(s => s.id === columnId);
        const isCurrentlySorted = currentSort &&
            ((direction === 'asc' && !currentSort.desc) ||
                (direction === 'desc' && currentSort.desc));

        if (isCurrentlySorted) {
            // If clicking the same sort direction, clear sorting
            setSorting([]);
        } else {
            // Otherwise, set the new sort direction
            const newSort = { id: columnId, desc: direction === 'desc' };
            setSorting([newSort]);
        }
    };

    // Toggle visibility handler
    const onToggleVisibility = (columnId: string) => {
        setColumnVisibility(old => {
            // If the column is undefined in the state, it's visible by default
            // If it's explicitly false, it's hidden
            // If it's explicitly true, it's visible
            const currentVisibility = old[columnId] ?? true; // undefined means visible
            return {
                ...old,
                [columnId]: !currentVisibility,
            };
        });
    };

    // Restore hidden column handler
    const onRestoreHiddenColumn = (hiddenColumnId: string, positionAfterColumnId: string) => {
        // First, make the hidden column visible
        setColumnVisibility(old => ({
            ...old,
            [hiddenColumnId]: true,
        }));

        // Then, reposition it to the right of the specified column
        setColumnOrder(oldOrder => {
            const currentIndex = oldOrder.indexOf(hiddenColumnId);
            const targetIndex = oldOrder.indexOf(positionAfterColumnId);

            if (currentIndex === -1) {
                // Column not in order, add it after the target column
                const newOrder = [...oldOrder];
                newOrder.splice(targetIndex + 1, 0, hiddenColumnId);
                return newOrder;
            } else if (currentIndex !== targetIndex + 1) {
                // Column exists but not in the right position, move it
                const newOrder = [...oldOrder];
                newOrder.splice(currentIndex, 1);
                newOrder.splice(targetIndex + 1, 0, hiddenColumnId);
                return newOrder;
            }

            return oldOrder;
        });
    };

    // Filter handlers
    const handleFilterChange = (columnId: string, value: { id: string; value: string } | { type: 'toggle_text_input' } | null) => {
        // Handle text input toggle
        if (value && 'type' in value && value.type === 'toggle_text_input') {
            const headerElement = document.querySelector(`[data-column-id="${columnId}"]`);
            if (headerElement) {
                const rect = headerElement.getBoundingClientRect();
                setTextInputState({
                    isVisible: true,
                    columnId,
                    position: {
                        x: rect.left,
                        y: rect.bottom + 5,
                        width: rect.width
                    }
                });
            }
            return;
        }

        if (value === null) {
            // Remove filter
            setColumnFilters(prev => prev.filter(f => f.id !== columnId));
        } else if ('id' in value && 'value' in value) {
            // Add or update filter - only handle proper filter objects
            setColumnFilters(prev => {
                const existing = prev.find(f => f.id === columnId);
                if (existing) {
                    return prev.map(f => f.id === columnId ? value : f);
                } else {
                    return [...prev, value];
                }
            });
        }
    };

    const handleClearFilter = (columnId: string) => {
        setColumnFilters(prev => prev.filter(f => f.id !== columnId));
    };

    // Handle text input value changes
    const handleTextInputValueChange = (columnId: string, value: string) => {
        if (value.trim() === '') {
            setColumnFilters(prev => {
                const newFilters = prev.filter(f => f.id !== columnId);
                return newFilters;
            });
        } else {
            setColumnFilters(prev => {
                const existing = prev.find(f => f.id === columnId);
                let newFilters;
                if (existing) {
                    newFilters = prev.map(f => f.id === columnId ? { id: columnId, value: value.trim() } : f);
                } else {
                    newFilters = [...prev, { id: columnId, value: value.trim() }];
                }
                return newFilters;
            });
        }
    };

    // Handle text input close
    const handleTextInputClose = () => {
        setTextInputState(prev => ({ ...prev, isVisible: false }));
    };
    const sensors = useSensors(useSensor(PointerSensor));

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = columnOrder.indexOf(String(active.id));
        const newIndex = columnOrder.indexOf(String(over.id));

        if (oldIndex !== -1 && newIndex !== -1) {
            const newOrder = arrayMove(columnOrder, oldIndex, newIndex);
            setColumnOrder(newOrder);
        }
    };

    // Helper function to find route by type
    const findRouteByType = (routeType: 'detail' | 'edit' | 'delete') => {
        return routes?.find(route => route.routeType === routeType);
    };

    // Navigation cell renderer for detail links
    const renderDetailCell = (item: T, cell: Cell<T, unknown>) => {
        const cellValue = String(cell.getValue());

        // If functions are provided, use the detail function
        if (functions?.detail) {
            return (
                <a
                    onClick={() => functions.detail!(item)}
                    className="text-blue-600 hover:underline cursor-pointer"
                >
                    {cellValue}
                </a>
            );
        }

        // Fall back to route-based navigation
        const detailRoute = findRouteByType('detail');
        if (!detailRoute) return cellValue;

        // Handle both id and slug identifiers
        const dataItem = item as DataItem;
        const itemId = dataItem.id || dataItem.slug;
        if (!itemId) return cellValue;

        // Extract the route path from the detail route (e.g., 'spells/:id' -> 'spells')
        const routePath = detailRoute.path.split('/:')[0];
        const detailPath = `${basePath}/${routePath}/${itemId}`;

        return (
            <a
                onClick={() => navigate(detailPath)}
                className="text-blue-600 hover:underline cursor-pointer"
            >
                {cellValue}
            </a>
        );
    };

    // Render action icons for edit/delete
    const renderActionIcons = (item: T) => {
        const actions = [];

        // If functions are provided, use them
        if (functions) {
            if (functions.edit) {
                actions.push(
                    <a
                        key="edit"
                        onClick={() => functions.edit!(item)}
                        className="text-blue-600 hover:text-blue-800 cursor-pointer ml-2"
                        title="Edit"
                    >
                        <PencilIcon className="h-4 w-4" />
                    </a>
                );
            }

            if (functions.delete) {
                actions.push(
                    <a
                        key="delete"
                        onClick={async () => {
                            if (window.confirm(`Are you sure you want to delete this ${itemDesc}?`)) {
                                try {
                                    await functions.delete!(item);
                                    // Refresh the data after successful deletion
                                    const { results, total } = await serviceFunction();
                                    setData(results);
                                    setTotal(total);
                                } catch (error) {
                                    console.error(`Failed to delete ${itemDesc}:`, error);
                                    alert(`Failed to delete ${itemDesc}.`);
                                }
                            }
                        }}
                        className="text-red-600 hover:text-red-800 cursor-pointer ml-2"
                        title="Delete"
                    >
                        <TrashIcon className="h-4 w-4" />
                    </a>
                );
            }

            return actions.length > 0 ? (
                <div className="flex items-center">{actions}</div>
            ) : null;
        }

        // Fall back to route-based actions
        const editRoute = findRouteByType('edit');

        // Handle both id and slug identifiers
        const dataItem = item as DataItem;
        const itemId = dataItem.id || dataItem.slug;
        // Fix: Ensure itemId is string or number for delete function
        const safeItemId = typeof itemId === 'boolean' ? String(itemId) : itemId;
        if (!safeItemId) return null;

        if (editRoute && (!editRoute.requireAdmin || isAdmin)) {
            // Extract the route path from the edit route (e.g., 'spells/:id/edit' -> 'spells')
            const routePath = editRoute.path.split('/:')[0];
            const editPath = `${basePath}/${routePath}/${safeItemId}/edit`;

            actions.push(
                <a
                    key="edit"
                    onClick={() => navigate(editPath)}
                    className="text-blue-600 hover:text-blue-800 cursor-pointer ml-2"
                    title="Edit"
                >
                    <PencilIcon className="h-4 w-4" />
                </a>
            );
        }

        if (deleteServiceFunction && (!editRoute?.requireAdmin || isAdmin)) {
            actions.push(
                <a
                    key="delete"
                    onClick={async () => {
                        if (window.confirm(`Are you sure you want to delete this ${itemDesc}?`)) {
                            try {
                                await deleteServiceFunction(safeItemId);
                                // Refresh the data after successful deletion
                                const { results, total } = await serviceFunction();
                                setData(results);
                                setTotal(total);
                            } catch (error) {
                                console.error(`Failed to delete ${itemDesc}:`, error);
                                alert(`Failed to delete ${itemDesc}.`);
                            }
                        }
                    }}
                    className="text-red-600 hover:text-red-800 cursor-pointer ml-2"
                    title="Delete"
                >
                    <TrashIcon className="h-4 w-4" />
                </a>
            );
        }

        return actions.length > 0 ? (
            <div className="flex items-center">{actions}</div>
        ) : null;
    };

    const table = useReactTable({
        data,
        columns: finalColumns,
        state: {
            sorting,
            columnFilters,
            pagination,
            columnVisibility,
            columnSizing,
            columnOrder,
        },
        manualPagination: false,
        manualSorting: false,
        manualFiltering: false,
        enableColumnResizing: true,
        columnResizeMode: 'onChange',
        onPaginationChange: setPagination,
        onSortingChange: handleSortingChange,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onColumnSizingChange: setColumnSizing,
        onColumnOrderChange: setColumnOrder,
        getPaginationRowModel: getPaginationRowModel(),
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel()
    });

    useEffect(() => {
        setIsLoading(true);

        serviceFunctionRef.current().then(({ results, total }) => {
            setData(results);
            setTotal(total);
        }).catch(console.error).finally(() => setIsLoading(false));
    }, []);

    const paginatedRows = table.getPaginationRowModel().rows;
    const filteredRows = table.getFilteredRowModel().rows;

    const start = filteredRows.length === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
    const end = start + paginatedRows.length - 1;
    const filteredTotal = filteredRows.length;

    return (
        <>
            <div className="p-4">
                {isLoading ? <div>Loading...</div> : (
                    <>
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            {textInputState.isVisible && textInputState.columnId && (
                                <FloatingTextInput
                                    columnId={textInputState.columnId}
                                    isVisible={textInputState.isVisible}
                                    position={textInputState.position}
                                    currentValue={String(columnFilters.find(f => f.id === textInputState.columnId)?.value || '')}
                                    onValueChange={handleTextInputValueChange}
                                    onClose={handleTextInputClose}
                                />
                            )}
                            <SortableContext
                                items={table.getVisibleLeafColumns().map(col => col.id)}
                                strategy={horizontalListSortingStrategy}
                            >
                                <table className="table-fixed w-full border-collapse border border-solid border-gray-600">
                                    <thead>
                                        {table.getHeaderGroups().map(headerGroup => (
                                            <tr key={headerGroup.id}>
                                                {headerGroup.headers.map(header => (
                                                    <SortableHeaderCell key={header.id} header={header} allColumns={table.getAllColumns()} onToggleVisibility={onToggleVisibility} onSort={onSort} columnFilters={columnFilters} handleFilterChange={handleFilterChange} handleClearFilter={handleClearFilter} onRestoreHiddenColumn={onRestoreHiddenColumn} />
                                                ))}
                                            </tr>
                                        ))}
                                    </thead>
                                    <tbody>
                                        {table.getRowModel().rows.length === 0 ? (
                                            <tr>
                                                <td colSpan={finalColumns.length} className="text-center py-8">
                                                    <div className="text-lg font-medium text-gray-600 dark:text-gray-400">
                                                        No {pluralize(itemDesc, 2)} found.
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            table.getRowModel().rows.map(row => (
                                                <tr key={row.id} className="hover:bg-gray-100 dark:hover:bg-gray-800 odd:bg-gray-500 even:bg-white dark:odd:bg-[#141e2d] dark:even:bg-[#121212]">
                                                    {row.getVisibleCells().map((cell, cellIndex) => {
                                                        const cellValue = flexRender(cell.column.columnDef.cell, cell.getContext());
                                                        const isRequiredColumn = (cell.column.columnDef.meta as GenericListColumnMeta)?.required === true;
                                                        const isLastVisibleCell = cellIndex === row.getVisibleCells().length - 1;

                                                        let finalCellValue = cellValue;

                                                        // Apply detail navigation to required column
                                                        if (isRequiredColumn && (routes || functions?.detail)) {
                                                            finalCellValue = renderDetailCell(row.original, cell);
                                                        }

                                                        // Add action icons to the last visible cell (but not in option selector mode)
                                                        const actionIcons = isLastVisibleCell && !isOptionSelector ? renderActionIcons(row.original) : null;

                                                        if (actionIcons) {
                                                            finalCellValue = (
                                                                <div className="flex items-center justify-between">
                                                                    <span>{finalCellValue}</span>
                                                                    {actionIcons}
                                                                </div>
                                                            );
                                                        }

                                                        return <td key={cell.id} className="px-2">{finalCellValue}</td>;
                                                    })}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </SortableContext>
                        </DndContext>

                        {filteredTotal > 0 && (
                            <div className="flex justify-between mt-4">
                                <div>
                                    Showing {start}–{end} of {filteredTotal}
                                </div>
                                <div className="flex gap-2 items-center">
                                    <CustomSelect
                                        options={PAGE_LIMITS}
                                        value={pagination.pageSize}
                                        onValueChange={(newPageSize) => {
                                            table.setPageSize(newPageSize);
                                            setPagination({
                                                pageSize: newPageSize,
                                                pageIndex: 0 // Reset to first page when changing page size
                                            });
                                        }}
                                        triggerExtraClassName="px-2 py-1 border rounded bg-white dark:bg-gray-800"
                                        placeholder="Select number of items per page"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => table.setPageIndex(0)}
                                        disabled={!table.getCanPreviousPage()}
                                        className="px-2 py-1 border rounded disabled:opacity-50"
                                    >
                                        First
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => table.previousPage()}
                                        disabled={!table.getCanPreviousPage()}
                                        className="px-2 py-1 border rounded disabled:opacity-50"
                                    >
                                        &lt; Prev
                                    </button>

                                    <span className="px-2">
                                        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => table.nextPage()}
                                        disabled={!table.getCanNextPage()}
                                        className="px-2 py-1 border rounded disabled:opacity-50"
                                    >
                                        Next &gt;
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                        disabled={!table.getCanNextPage()}
                                        className="px-2 py-1 border rounded disabled:opacity-50"
                                    >
                                        Last
                                    </button>
                                </div>

                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}

