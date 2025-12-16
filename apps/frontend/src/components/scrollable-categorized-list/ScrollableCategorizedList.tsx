import { ScrollArea } from '@base-ui-components/react/scroll-area';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
    type ColumnFiltersState,
} from '@tanstack/react-table';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';


import { getFieldValue, groupItemsByFields, type ScrollableCategorizedListProps, type GroupingConfig } from './types';

/**
 * Format a category label using column definition
 */
function formatCategoryLabel<T>(
    value: unknown,
    fieldPath: string,
    columns: ColumnDef<T, unknown>[]
): string {
    // Find column that matches this field path
    const column = columns.find(col => {
        if ('accessorKey' in col && col.accessorKey === fieldPath) {
            return true;
        }
        return false;
    });

    if (column && column.cell) {
        // Create a mock row and getValue function
        // For nested paths, we need to create a nested object
        const pathParts = fieldPath.split('.');
        let mockData: Record<string, unknown> = {};
        let current = mockData;
        for (let i = 0; i < pathParts.length - 1; i++) {
            current[pathParts[i]] = {};
            current = current[pathParts[i]] as Record<string, unknown>;
        }
        current[pathParts[pathParts.length - 1]] = value;

        const mockRow = { original: mockData as T };
        const getValue = () => value;
        try {
            if (typeof column.cell === 'function') {
                const rendered = column.cell({
                    row: mockRow,
                    getValue,
                    column,
                    cell: {} as { getValue: () => unknown },
                    renderValue: getValue
                } as Parameters<typeof column.cell>[0]);
                if (typeof rendered === 'string') {
                    // Return the formatted string if it's not empty
                    if (rendered.trim()) {
                        return rendered;
                    }
                }
                // If it's a React element, try to extract text or fall back to value
                if (React.isValidElement(rendered)) {
                    // For React elements, we can't easily extract text in this context
                    // The cell formatter should return a string for category labels
                    // Fall through to fallback
                }
            }
        } catch {
            // If cell renderer fails, fall back to value
        }
    }

    // Fall back to string representation
    if (value === null || value === undefined) {
        return 'Unknown';
    }
    return String(value);
}

/**
 * Recursively render grouped items with collapsible categories
 */
function renderCategoryGroup<T>(
    groupMap: Map<unknown, unknown>,
    level: number,
    groupingFields: string[],
    currentFieldIndex: number,
    columns: ColumnDef<T, unknown>[],
    allColumnsForFormatting: ColumnDef<T, unknown>[],
    actionButtonLabel: string,
    onAction: (item: T) => void,
    isActionDisabled: ((item: T) => boolean) | undefined,
    collapsedCategories: Set<string>,
    toggleCategory: (path: string) => void,
    categoryPath: string,
    table: ReturnType<typeof useReactTable<T>>,
    processedItems: Set<T>,
    groupingConfig?: GroupingConfig<T>
): React.ReactNode[] {
    const result: React.ReactNode[] = [];

    if (currentFieldIndex >= groupingFields.length) {
        // This should be an array of items
        const items = Array.from(groupMap.values()) as T[];
        return items.map((item, index) => {
            if (processedItems.has(item)) {
                return null;
            }
            processedItems.add(item);
            const isDisabled = isActionDisabled ? isActionDisabled(item) : false;
            const row = table.getRowModel().rows.find(r => r.original === item);

            if (!row) {
                return null;
            }

            return (
                <tr
                    key={`item-${index}-${(item as { id?: number | string }).id || index}`}
                    className={`hover:bg-gray-100 dark:hover:bg-gray-800 odd:bg-gray-500 even:bg-white dark:odd:bg-[#141e2d] dark:even:bg-[#121212] ${isDisabled ? 'opacity-50' : ''}`}
                >
                    {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-1">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                    ))}
                    <td className="px-1 text-center">
                        <button
                            onClick={() => onAction(item)}
                            disabled={isDisabled}
                            className={`px-2 py-1 border rounded disabled:opacity-50 ${isDisabled
                                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                        >
                            {actionButtonLabel}
                        </button>
                    </td>
                </tr>
            );
        }).filter(Boolean) as React.ReactNode[];
    }

    const currentField = groupingFields[currentFieldIndex];
    let entries = Array.from(groupMap.entries());

    // Sort entries if sorting function is provided
    if (groupingConfig?.sortGroupKeys) {
        entries = groupingConfig.sortGroupKeys(entries, currentField, groupingFields, currentFieldIndex);
    }

    // Helper to get a sample item from a group (Map or Array)
    const getSampleItem = (groupValue: unknown): T | null => {
        if (Array.isArray(groupValue) && groupValue.length > 0) {
            return groupValue[0] as T;
        }
        if (groupValue instanceof Map) {
            // Get first item from nested structure
            for (const nestedValue of groupValue.values()) {
                const item = getSampleItem(nestedValue);
                if (item) return item;
            }
        }
        return null;
    };

    for (const [key, value] of entries) {
        const categoryValue = key === '_null' ? null : key;

        // Determine which field was actually used for this grouping
        // Use custom logic if provided, otherwise use current field
        const sampleItem = getSampleItem(value);
        const effectiveField = groupingConfig?.getEffectiveFieldForFormatting
            ? groupingConfig.getEffectiveFieldForFormatting(
                currentField,
                categoryValue,
                sampleItem,
                groupingFields,
                currentFieldIndex
            )
            : currentField;

        const categoryLabel = formatCategoryLabel(categoryValue, effectiveField, allColumnsForFormatting);
        const fullPath = categoryPath ? `${categoryPath}/${String(categoryValue)}` : String(categoryValue);
        const isCollapsed = collapsedCategories.has(fullPath);

        result.push(
            <React.Fragment key={fullPath}>
                <tr className="bg-gray-200 dark:bg-gray-700">
                    <td
                        colSpan={table.getVisibleLeafColumns().length + 1}
                        className="px-1 py-1 font-semibold cursor-pointer"
                        onClick={() => toggleCategory(fullPath)}
                    >
                        <div className="flex items-center space-x-2" style={{ paddingLeft: `${level * 1.5}rem` }}>
                            {isCollapsed ? (
                                <ChevronRightIcon className="h-4 w-4" />
                            ) : (
                                <ChevronDownIcon className="h-4 w-4" />
                            )}
                            <span>{categoryLabel}</span>
                        </div>
                    </td>
                </tr>
                {!isCollapsed && value instanceof Map && (
                    <>
                        {renderCategoryGroup(
                            value as Map<unknown, unknown>,
                            level + 1,
                            groupingFields,
                            currentFieldIndex + 1,
                            columns,
                            allColumnsForFormatting,
                            actionButtonLabel,
                            onAction,
                            isActionDisabled,
                            collapsedCategories,
                            toggleCategory,
                            fullPath,
                            table,
                            processedItems,
                            groupingConfig
                        )}
                    </>
                )}
                {!isCollapsed && Array.isArray(value) && (
                    <>
                        {(value as T[]).map((item, index) => {
                            if (processedItems.has(item)) {
                                return null;
                            }
                            processedItems.add(item);
                            const isDisabled = isActionDisabled ? isActionDisabled(item) : false;
                            const row = table.getRowModel().rows.find(r => r.original === item);

                            if (!row) {
                                return null;
                            }

                            return (
                                <tr
                                    key={`item-${index}-${(item as { id?: number | string }).id || index}`}
                                    className={`hover:bg-gray-100 dark:hover:bg-gray-800 odd:bg-gray-500 even:bg-white dark:odd:bg-[#141e2d] dark:even:bg-[#121212] ${isDisabled ? 'opacity-50' : ''}`}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="px-2">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                    <td className="px-2 text-center">
                                        <button
                                            onClick={() => onAction(item)}
                                            disabled={isDisabled}
                                            className={`px-2 py-1 border rounded disabled:opacity-50 ${isDisabled
                                                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                                }`}
                                        >
                                            {actionButtonLabel}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </>
                )}
            </React.Fragment>
        );
    }

    return result;
}

export function ScrollableCategorizedList<T extends { id?: number | string }>({
    queryHook,
    dataFetcher,
    serviceFunction,
    groupingFields,
    groupingConfig,
    columns,
    actionButtonLabel,
    onAction,
    isActionDisabled,
    allowMultiple: _allowMultiple = true,
    itemFilter,
    searchPlaceholder = 'Search by name...',
    storageKey,
    itemDesc = 'items',
    maxHeight = 'auto',
}: ScrollableCategorizedListProps<T>): React.JSX.Element {
    const [data, setData] = useState<T[]>([]);
    const [_total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const [calculatedHeight, setCalculatedHeight] = useState<number | undefined>(undefined);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

    // Use queryHook if provided
    const queryResult = queryHook ? queryHook({}) : null;

    // Imperative data fetching
    const fetchData = useCallback(async () => {
        if (dataFetcher) {
            try {
                setIsLoading(true);
                setError(null);
                const result = await dataFetcher();
                setData(result.results);
                setTotal(result.total);
            } catch (err) {
                setError(err as Error);
            } finally {
                setIsLoading(false);
            }
        } else if (serviceFunction) {
            try {
                setIsLoading(true);
                setError(null);
                const result = await serviceFunction();
                setData(result.results);
                setTotal(result.total);
            } catch (err) {
                setError(err as Error);
            } finally {
                setIsLoading(false);
            }
        }
    }, [dataFetcher, serviceFunction]);

    // Fetch data on mount and when dataFetcher/serviceFunction changes
    useEffect(() => {
        if (dataFetcher || serviceFunction) {
            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataFetcher, serviceFunction]);

    // Handle queryResult data when using queryHook
    useEffect(() => {
        if (queryResult) {
            if (queryResult.data) {
                setData(queryResult.data.results);
                setTotal(queryResult.data.total);
            }
            setIsLoading(queryResult.isLoading);
            if (queryResult.error) {
                setError(queryResult.error);
            }
        }
    }, [queryResult]);

    // Check if an item is enabled (using itemFilter if provided)
    const isItemEnabled = useCallback((item: T): boolean => {
        if (itemFilter?.isItemEnabled) {
            return itemFilter.isItemEnabled(item);
        }
        // Default: all items are enabled
        return true;
    }, [itemFilter]);

    // Combine item filter check with existing isActionDisabled
    const combinedIsActionDisabled = useCallback((item: T): boolean => {
        // Check item filter first
        if (!isItemEnabled(item)) {
            return true;
        }
        // Then check custom disabled logic
        if (isActionDisabled) {
            return isActionDisabled(item);
        }
        return false;
    }, [isItemEnabled, isActionDisabled]);

    // Load collapsed categories from localStorage
    useEffect(() => {
        if (storageKey) {
            const saved = localStorage.getItem(`${storageKey}-collapsed`);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved) as string[];
                    setCollapsedCategories(new Set(parsed));
                } catch {
                    // Ignore parse errors
                }
            }
        }
    }, [storageKey]);

    // Save collapsed categories to localStorage
    const toggleCategory = useCallback((path: string) => {
        setCollapsedCategories(prev => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            if (storageKey) {
                localStorage.setItem(`${storageKey}-collapsed`, JSON.stringify(Array.from(next)));
            }
            return next;
        });
    }, [storageKey]);

    // Add search filter to columnFilters
    useEffect(() => {
        const nameColumn = columns.find(col =>
            ('accessorKey' in col && col.accessorKey === 'name') ||
            ('id' in col && col.id === 'name')
        );

        if (nameColumn) {
            const nameColumnId = String(('id' in nameColumn && nameColumn.id) || ('accessorKey' in nameColumn && nameColumn.accessorKey) || 'name');
            setColumnFilters(prev => {
                const filtered = prev.filter(f => f.id !== nameColumnId);
                if (searchQuery.trim()) {
                    return [...filtered, { id: nameColumnId, value: searchQuery }];
                }
                return filtered;
            });
        }
    }, [searchQuery, columns]);

    // Process columns - filter out hidden columns for display but keep them for formatting
    const processedColumns = useMemo<ColumnDef<T, unknown>[]>(() => {
        return columns.filter(col => {
            // Keep columns that don't have meta.hidden or have meta.hidden === false
            return !('meta' in col && col.meta && typeof col.meta === 'object' && 'hidden' in col.meta && col.meta.hidden === true);
        });
    }, [columns]);

    // Keep all columns (including hidden) for formatting category labels
    const allColumnsForFormatting = useMemo<ColumnDef<T, unknown>[]>(() => {
        return columns;
    }, [columns]);

    // Create table instance
    const table = useReactTable({
        data,
        columns: processedColumns,
        state: {
            sorting,
            columnFilters,
        },
        manualPagination: false,
        manualSorting: false,
        manualFiltering: false,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    // Calculate height from parent if maxHeight is 'auto'
    useEffect(() => {
        if (maxHeight === 'auto' && containerRef.current) {
            const updateHeight = () => {
                if (containerRef.current) {
                    // The parent is the h-[500px] div, but the padding is on the grandparent (p-6)
                    const parent = containerRef.current.parentElement;
                    const grandparent = parent?.parentElement;
                    const containerHeight = containerRef.current.clientHeight;
                    const parentClientHeight = parent ? parent.clientHeight : containerHeight;

                    // The parent has h-[500px] but is inside a grandparent with p-6 padding
                    // The parent's clientHeight is 500px, but the grandparent's bottom padding
                    // reduces the actual available visual space, causing clipping
                    let availableContainerHeight = parentClientHeight;
                    if (grandparent) {
                        const grandparentPaddingBottom = parseFloat(window.getComputedStyle(grandparent).paddingBottom) || 0;
                        // Subtract the grandparent's bottom padding from available height
                        // to prevent the table from being clipped
                        availableContainerHeight = parentClientHeight - grandparentPaddingBottom;
                    }

                    // Get actual search div height (including padding, excluding margin)
                    // The margin-bottom (mb-4 = 16px) is handled by flexbox spacing
                    const searchHeight = searchRef.current ?
                        searchRef.current.offsetHeight : 0;
                    // Calculate available height for the table container
                    // This should be availableContainerHeight - searchHeight (margin is handled by flex)
                    const availableHeight = availableContainerHeight - searchHeight;
                    setCalculatedHeight(Math.max(200, availableHeight)); // Minimum 200px
                }
            };

            // Use requestAnimationFrame to ensure DOM is ready
            const timeoutId = setTimeout(() => {
                updateHeight();
            }, 0);

            // Watch for container and parent size changes
            const resizeObserver = new ResizeObserver(() => {
                updateHeight();
            });
            if (containerRef.current) {
                resizeObserver.observe(containerRef.current);
            }
            const parent = containerRef.current?.parentElement;
            if (parent) {
                resizeObserver.observe(parent);
            }

            // Also watch for window resize
            window.addEventListener('resize', updateHeight);

            return () => {
                clearTimeout(timeoutId);
                resizeObserver.disconnect();
                window.removeEventListener('resize', updateHeight);
            };
        }
    }, [maxHeight]);

    // Determine the actual height to use
    const actualMaxHeight = useMemo(() => {
        if (maxHeight === 'auto') {
            return calculatedHeight;
        }
        return maxHeight;
    }, [maxHeight, calculatedHeight]);

    // Group items
    const filteredData = table.getFilteredRowModel().rows.map(row => row.original);
    const groupedData = useMemo(() => {
        return groupItemsByFields(filteredData, groupingFields, groupingConfig);
    }, [filteredData, groupingFields, groupingConfig]);

    // Handle errors
    const currentError = error || queryResult?.error;
    if (currentError) {
        return (
            <div className="p-4">
                <div className="text-red-600">
                    <h3 className="text-lg font-semibold mb-2">Error Loading {itemDesc}</h3>
                    <p className="mb-4">{currentError.message}</p>
                    {(queryResult?.refetch || dataFetcher || serviceFunction) && (
                        <button
                            onClick={async () => {
                                try {
                                    if (queryResult?.refetch) {
                                        const result = await queryResult.refetch();
                                        if (result.data) {
                                            setData(result.data.results);
                                            setTotal(result.data.total);
                                        }
                                    } else if (dataFetcher || serviceFunction) {
                                        await fetchData();
                                    }
                                } catch (error) {
                                    console.error('Failed to retry:', error);
                                }
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Retry
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Track processed items to avoid duplicates
    const processedItems = new Set<T>();

    return (
        <div ref={containerRef} className="h-full flex flex-col overflow-hidden">
            {/* Search input */}
            <div ref={searchRef} className="mb-4 flex-shrink-0">
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {isLoading ? (
                <div className="text-center py-8 flex-1 flex items-center justify-center">
                    <div className="text-lg font-medium text-gray-600 dark:text-gray-400">Loading...</div>
                </div>
            ) : filteredData.length === 0 ? (
                <div className="text-center py-8 flex-1 flex items-center justify-center">
                    <div className="text-lg font-medium text-gray-600 dark:text-gray-400">
                        No {itemDesc} found.
                    </div>
                </div>
            ) : (
                <div
                    className="border border-solid border-gray-600 flex flex-col flex-1 min-h-0"
                    style={actualMaxHeight ? {
                        height: `${actualMaxHeight}px`,
                        maxHeight: `${actualMaxHeight}px`,
                        minHeight: `${actualMaxHeight}px`
                    } : undefined}
                >
                    {/* Fixed header */}
                    <div className="flex-shrink-0 bg-gray-200 dark:bg-gray-700 border-b border-solid border-gray-600">
                        <table className="table-fixed w-full border-collapse">
                            <colgroup>
                                {table.getVisibleLeafColumns().map(column => (
                                    <col key={column.id} style={{ width: column.getSize() }} />
                                ))}
                                <col style={{ width: '80px' }} />
                            </colgroup>
                            <thead>
                                {table.getHeaderGroups().map(headerGroup => (
                                    <tr key={headerGroup.id}>
                                        {table.getVisibleLeafColumns().map(column => {
                                            const header = headerGroup.headers.find(h => h.id === column.id);
                                            if (!header) return null;
                                            return (
                                                <th
                                                    key={header.id}
                                                    className="px-1 bg-gray-200 dark:bg-gray-700"
                                                >
                                                    <div
                                                        className="flex items-center space-x-2 cursor-pointer select-none"
                                                        onClick={header.column.getToggleSortingHandler()}
                                                    >
                                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                                        {{
                                                            asc: ' ↑',
                                                            desc: ' ↓',
                                                        }[header.column.getIsSorted() as string] ?? null}
                                                    </div>
                                                </th>
                                            );
                                        })}
                                        <th className="px-1 bg-gray-200 dark:bg-gray-700 text-center">Action</th>
                                    </tr>
                                ))}
                            </thead>
                        </table>
                    </div>

                    {/* Scrollable body */}
                    <ScrollArea.Root className="flex-1 min-h-0">
                        <ScrollArea.Viewport className="h-full">
                            <ScrollArea.Content className="p-0">
                                <table className="table-fixed w-full border-collapse border border-solid border-gray-600">
                                    <colgroup>
                                        {table.getVisibleLeafColumns().map(column => (
                                            <col key={column.id} style={{ width: column.getSize() }} />
                                        ))}
                                        <col style={{ width: '80px' }} />
                                    </colgroup>
                                    <tbody>
                                        {renderCategoryGroup(
                                            groupedData,
                                            0,
                                            groupingFields,
                                            0,
                                            processedColumns,
                                            allColumnsForFormatting,
                                            actionButtonLabel,
                                            onAction,
                                            combinedIsActionDisabled,
                                            collapsedCategories,
                                            toggleCategory,
                                            '',
                                            table,
                                            processedItems,
                                            groupingConfig
                                        )}
                                    </tbody>
                                </table>
                            </ScrollArea.Content>
                        </ScrollArea.Viewport>
                        <ScrollArea.Scrollbar orientation="vertical" className="Scrollbar">
                            <ScrollArea.Thumb className="Thumb" />
                        </ScrollArea.Scrollbar>
                    </ScrollArea.Root>
                </div>
            )}
        </div>
    );
}

