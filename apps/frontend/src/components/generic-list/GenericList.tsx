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
import React, { useEffect, useMemo, useRef, useState } from 'react';
import pluralize from 'pluralize';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
    type ColumnDef,
    type PaginationState,
} from '@tanstack/react-table';
import type { GenericListProps } from './types';
import { PAGE_LIMITS } from './types';
import { usePersistentTableState } from './usePersistantTableState';
import { ColumnHeaderContextMenu } from './ColumnHeaderContextMenu';
import { FloatingTextInput } from './FloatingTextInput';

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
            className="relative"
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
}: GenericListProps<T>) {
    const [data, setData] = useState<T[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

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

    const columnDefs = useMemo<ColumnDef<T>[]>(() => [...columns], [columns]);
    const defaultColumnOrder = columnDefs.map(col => {
        if ('id' in col && col.id) return col.id;
        if ('accessorKey' in col && col.accessorKey) return String(col.accessorKey);
        console.warn('Missing id/accessorKey in column:', col);
        return ''; // fallback to empty string if really broken
    }).filter(Boolean); // remove blanks

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
    } = usePersistentTableState(storageKey, defaultColumnOrder);

    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: initialLimit,
    });

    const handleSortingChange = (updater: any) => {
        // Simply pass through the sorting change
        const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
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
    const handleFilterChange = (columnId: string, value: any) => {
        // Handle text input toggle
        if (value && value.type === 'toggle_text_input') {
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
        } else {
            // Add or update filter
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

    const table = useReactTable({
        data,
        columns,
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

        serviceFunction().then(({ results, total }) => {
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
                                            <tr><td colSpan={columns.length}>No {pluralize(itemDesc, 2)} found.</td></tr>
                                        ) : (
                                            table.getRowModel().rows.map(row => (
                                                <tr key={row.id} className="hover:bg-gray-100 dark:hover:bg-gray-800 odd:bg-gray-500 even:bg-white dark:odd:bg-[#141e2d] dark:even:bg-[#121212]">
                                                    {row.getVisibleCells().map(cell => (
                                                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                                    ))}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </SortableContext>
                        </DndContext>

                        <div className="flex justify-between mt-4">
                            <div>
                                Showing {start}–{end} of {filteredTotal}
                            </div>
                            <div className="flex gap-2 items-center">
                                <select
                                    value={pagination.pageSize}
                                    onChange={(e) => {
                                        const newPageSize = Number(e.target.value);
                                        table.setPageSize(newPageSize);
                                        setPagination(prev => ({
                                            ...prev,
                                            pageSize: newPageSize,
                                            pageIndex: 0 // Reset to first page when changing page size
                                        }));
                                    }}
                                    className="px-2 py-1 border rounded bg-white dark:bg-gray-800"
                                    title="Select number of items per page"
                                >
                                    {PAGE_LIMITS.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => table.setPageIndex(0)}
                                    disabled={!table.getCanPreviousPage()}
                                    className="px-2 py-1 border rounded disabled:opacity-50"
                                >
                                    First
                                </button>
                                <button
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
                                    onClick={() => table.nextPage()}
                                    disabled={!table.getCanNextPage()}
                                    className="px-2 py-1 border rounded disabled:opacity-50"
                                >
                                    Next &gt;
                                </button>
                                <button
                                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                    disabled={!table.getCanNextPage()}
                                    className="px-2 py-1 border rounded disabled:opacity-50"
                                >
                                    Last
                                </button>
                            </div>

                        </div>
                    </>
                )}
            </div>
        </>
    );
}
