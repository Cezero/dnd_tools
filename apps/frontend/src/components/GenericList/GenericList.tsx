import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FunnelIcon as FunnelIconOutline, Cog6ToothIcon as Cog6ToothIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { FunnelIcon as FunnelIconSolid, TrashIcon, ChevronDoubleUpIcon, ChevronDoubleDownIcon } from '@heroicons/react/24/solid';
import { ColumnConfigModal, UseColumnConfig } from './ColumnConfig';
import pluralize from 'pluralize';
import { useNavigate } from 'react-router-dom';
import type {
    ColumnDefinition,
    FilterValue,
    FilterState,
    DataItem,
    FilterComponentProps,
    FilterOption,
    GenericListProps
} from './types';

// Type guards for filter values
function isInputFilter(value: unknown): value is { type: 'input'; value: string } {
    return typeof value === 'object' && value !== null && 'type' in value && value.type === 'input';
}

function isSelectFilter(value: unknown): value is { type: 'select'; value: string | number | null } {
    return typeof value === 'object' && value !== null && 'type' in value && value.type === 'select';
}

function isMultiSelectFilter(value: unknown): value is { type: 'multi-select'; value: { values: string[]; logic: 'or' | 'and' } } {
    return typeof value === 'object' && value !== null && 'type' in value && value.type === 'multi-select';
}

function isBooleanFilter(value: unknown): value is { type: 'boolean'; value: boolean | null } {
    return typeof value === 'object' && value !== null && 'type' in value && value.type === 'boolean';
}

// Legacy type guard for backward compatibility with existing stored data
function isLegacyMultiSelectFilter(value: unknown): value is { values: string[]; logic: string } {
    return typeof value === 'object' && value !== null && 'values' in value && 'logic' in value && !('type' in value);
}

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every(item => typeof item === 'string');
}

export function GenericList<T = DataItem>({
    // Configuration props
    storageKey,
    defaultColumns,
    columnDefinitions,
    requiredColumnId,
    fetchData,
    renderCell,
    filterOptions = {},

    // Routing props
    detailPagePath,
    idKey = 'id',
    itemDesc = 'items',
    dynamicFilterDelay = 500,
    initialLimit = 25,
    isColumnConfigurable = true,

    // Option selector props
    isOptionSelector = false,
    selectedIds = [],
    onSelectedIdsChange,
    editHandler,
    deleteHandler,
}: GenericListProps<T>): React.JSX.Element {
    const [data, setData] = useState<T[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    // Internal state for selected IDs when in option selector mode
    const [internalSelectedIds, setInternalSelectedIds] = useState<(string | number)[]>(selectedIds);

    // Call onSelectedIdsChange when internalSelectedIds changes
    useEffect(() => {
        if (isOptionSelector && onSelectedIdsChange) {
            onSelectedIdsChange(internalSelectedIds);
        }
    }, [internalSelectedIds, isOptionSelector, onSelectedIdsChange]);

    const getStoredValue = useCallback((key: string, defaultValue: string | number | boolean | object): string | number | boolean | object => {
        try {
            const stored = localStorage.getItem(`${storageKey}-${key}`);
            const parsed = stored ? JSON.parse(stored) : defaultValue;
            return parsed;
        } catch (error) {
            console.error('Error reading from localStorage', error);
            return defaultValue;
        }
    }, [storageKey]);

    const setStoredValue = useCallback((key: string, value: string | number | boolean | object): void => {
        try {
            localStorage.setItem(`${storageKey}-${key}`, JSON.stringify(value));
        } catch (error) {
            console.error('Error writing to localStorage', error);
        }
    }, [storageKey]);

    const [page, setPage] = useState<number>(() => getStoredValue('page', 1) as number);
    const [limit, setLimit] = useState<number>(() => getStoredValue('limit', initialLimit) as number);
    const [sortKey, setSortKey] = useState<string>(() => getStoredValue('sortKey', '') as string);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // Initialize filters with proper type conversion from legacy format
    const GetInitialFilters = (): FilterState => {
        const storedFilters = getStoredValue('filters', {}) as Record<string, unknown>;
        const currentFilters: FilterState = {};

        for (const key in columnDefinitions) {
            const column = columnDefinitions[key];
            const filterType = column?.filterType;
            const storedValue = storedFilters[key];

            if (filterType === 'multi-select') {
                if (storedValue && isLegacyMultiSelectFilter(storedValue)) {
                    // Convert legacy format to new format
                    currentFilters[key] = {
                        type: 'multi-select',
                        value: {
                            values: storedValue.values || [],
                            logic: (storedValue.logic === 'and' ? 'and' : 'or') as 'or' | 'and'
                        }
                    };
                } else if (storedValue && isMultiSelectFilter(storedValue)) {
                    // Already in new format
                    currentFilters[key] = storedValue;
                } else {
                    // Default value
                    currentFilters[key] = {
                        type: 'multi-select',
                        value: { values: [], logic: 'or' }
                    };
                }
            } else if (filterType === 'boolean') {
                if (storedValue !== undefined) {
                    currentFilters[key] = {
                        type: 'boolean',
                        value: storedValue as boolean
                    };
                } else {
                    currentFilters[key] = {
                        type: 'boolean',
                        value: null
                    };
                }
            } else if (filterType === 'select') {
                if (storedValue !== undefined) {
                    currentFilters[key] = {
                        type: 'select',
                        value: storedValue as string | number | null
                    };
                } else {
                    currentFilters[key] = {
                        type: 'select',
                        value: null
                    };
                }
            } else if (filterType === 'input') {
                currentFilters[key] = {
                    type: 'input',
                    value: storedValue !== undefined ? storedValue as string : ''
                };
            }
        }

        // Clean up any filters that don't correspond to column definitions
        for (const key in currentFilters) {
            if (!columnDefinitions[key] && !['_mclist', '_mcfilter'].includes(key)) {
                delete currentFilters[key];
            }
        }

        return currentFilters;
    };

    const [filters, setFilters] = useState<FilterState>(() => {
        const initial = GetInitialFilters();
        return initial;
    });

    const [displayFilter, setDisplayFilter] = useState<string>('');

    const { visibleColumns, setVisibleColumns } = UseColumnConfig(storageKey, defaultColumns, columnDefinitions, requiredColumnId);
    const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);

    const thRefs = useRef<Record<string, HTMLTableCellElement | null>>({});
    const lastClickedElement = useRef<EventTarget | null>(null);

    // Modify visibleColumns if in option selector mode
    const adjustedVisibleColumns = useMemo(() => {
        if (isOptionSelector) {
            return ['__selector_column__', ...visibleColumns];
        }
        return visibleColumns;
    }, [isOptionSelector, visibleColumns]);

    // Helper function to get filter value for component props
    const getFilterValueForComponent = (filterKey: string, filterType?: string): string | boolean | string[] => {
        const filterValue = filters[filterKey];
        if (!filterValue) return '';

        if (filterType === 'multi-select' && isMultiSelectFilter(filterValue)) {
            return filterValue.value.values;
        }
        if (filterType === 'boolean' && isBooleanFilter(filterValue)) {
            return filterValue.value;
        }
        if (filterType === 'select' && isSelectFilter(filterValue)) {
            return filterValue.value as string;
        }
        if (filterType === 'input' && isInputFilter(filterValue)) {
            return filterValue.value;
        }
        return '';
    };

    // Helper function to check if a filter is applied
    const isFilterApplied = (filterKey: string): boolean => {
        const filterValue = filters[filterKey];
        if (!filterValue) return false;

        if (isMultiSelectFilter(filterValue)) {
            return filterValue.value.values.length > 0;
        }
        if (isBooleanFilter(filterValue)) {
            return filterValue.value !== null;
        }
        if (isSelectFilter(filterValue)) {
            return filterValue.value !== null;
        }
        if (isInputFilter(filterValue)) {
            return filterValue.value !== '';
        }
        return false;
    };

    // useEffect for data fetching, now depends on local state variables
    useEffect(() => {
        const currentParams = new URLSearchParams();
        currentParams.set('page', page.toString());
        currentParams.set('limit', limit.toString());
        if (sortKey) currentParams.set('sort', sortKey);
        if (sortOrder) currentParams.set('order', sortOrder);

        for (const key in filters) {
            const column = columnDefinitions[key];
            const filterType = column?.filterType;
            const paramName = column?.paramName || key;
            const multiColumns = column?.multiColumn;
            const filterValue = filters[key];

            if (filterType === 'input' && isInputFilter(filterValue)) {
                if (multiColumns && filterValue.value !== '') {
                    currentParams.set('mclist', multiColumns.join(','));
                    currentParams.set('mcfilter', filterValue.value);
                } else if (filterValue.value !== '') {
                    currentParams.set(paramName, filterValue.value);
                }
            } else if (filterType === 'multi-select' && isMultiSelectFilter(filterValue)) {
                if (filterValue.value.values.length > 0) {
                    currentParams.set(paramName, filterValue.value.values.join(','));
                    currentParams.set(`${paramName}_logic`, filterValue.value.logic);
                }
            } else if (filterType === 'boolean' && isBooleanFilter(filterValue)) {
                if (filterValue.value !== null) {
                    currentParams.set(paramName, String(filterValue.value));
                }
            } else if (filterType === 'select' && isSelectFilter(filterValue)) {
                if (filterValue.value !== null) {
                    currentParams.set(paramName, String(filterValue.value));
                }
            }
        }

        setIsLoading(true);
        fetchData(currentParams)
            .then(result => {
                setData(result.data);
                setTotal(result.total);
            })
            .catch(error => {
                console.error('Error fetching list data:', error);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [page, limit, sortKey, sortOrder, filters, fetchData, columnDefinitions]);

    // New useEffect to sync state to localStorage
    useEffect(() => {
        setStoredValue('page', page);
        setStoredValue('limit', limit);
        setStoredValue('sortKey', sortKey);
        setStoredValue('sortOrder', sortOrder);
        setStoredValue('filters', filters);
    }, [page, limit, sortKey, sortOrder, filters, setStoredValue]);

    useEffect(() => {
        const HandleClickOutside = (event: MouseEvent): void => {
            if (displayFilter && thRefs.current[displayFilter] && !thRefs.current[displayFilter]?.contains(event.target as Node)) {
                // If the closed filter was a multi-select, clear its active state
                const filterType = columnDefinitions[displayFilter]?.filterType;
                if (filterType === 'multi-select') {
                    setDisplayFilter('');
                }
                lastClickedElement.current = event.target;
            }
        };

        document.addEventListener('mousedown', HandleClickOutside, true);
        return () => {
            document.removeEventListener('mousedown', HandleClickOutside, true);
        };
    }, [displayFilter, columnDefinitions]);

    const handleFilterChange = useCallback((filterKey: string, value: string | boolean | string[]): void => {
        setFilters(prev => {
            const newFilters = { ...prev };
            const filterType = columnDefinitions[filterKey]?.filterType;

            if (filterType === 'multi-select') {
                newFilters[filterKey] = {
                    type: 'multi-select',
                    value: { values: value as string[], logic: 'or' }
                };
            } else if (filterType === 'boolean') {
                newFilters[filterKey] = {
                    type: 'boolean',
                    value: value as boolean
                };
            } else if (filterType === 'select') {
                newFilters[filterKey] = {
                    type: 'select',
                    value: value as string | number | null
                };
            } else {
                newFilters[filterKey] = {
                    type: 'input',
                    value: value as string
                };
            }
            return newFilters;
        });

        // Reset pagination to page 1 when filters change
        setPage(1);

        // Optionally, close single-select dropdowns immediately
        const filterType = columnDefinitions[filterKey]?.filterType;
        if (filterType === 'select' || filterType === 'boolean') {
            setDisplayFilter('');
        }
    }, [columnDefinitions]);

    const handleLogicChange = useCallback((filterKey: string, newLogic: string): void => {
        setFilters(prev => {
            const newFilters = { ...prev };
            const currentFilter = prev[filterKey];

            if (isMultiSelectFilter(currentFilter)) {
                newFilters[filterKey] = {
                    type: 'multi-select',
                    value: {
                        ...currentFilter.value,
                        logic: (newLogic === 'and' ? 'and' : 'or') as 'or' | 'and'
                    }
                };
            }
            return newFilters;
        });
    }, []);

    const HandleSort = (key: string): void => {
        if (sortKey === key) {
            if (sortOrder === 'asc') {
                setSortOrder('desc');
            } else if (sortOrder === 'desc') {
                setSortKey('');
                setSortOrder('asc');
            }
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };

    const HandleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
        const newLimit = parseInt(e.target.value);
        setLimit(newLimit);
        setPage(Math.min(page, Math.ceil(total / newLimit) || 1));
    };

    const HandlePageChange = (newPage: number): void => {
        setPage(newPage);
    };

    const RenderColumnHeader = (columnId: string, isLastColumn: boolean): React.ReactNode => {
        const column = columnDefinitions[columnId];
        if (!column) {
            // If it's the selector column, return an empty header
            if (columnId === '__selector_column__') {
                return <th key={columnId} className="relative border-b p-1 text-left text-md border-gray-600 dark:border-gray-700 dark:bg-gray-900"></th>;
            }
            return null;
        }

        // Check if a filter is applied to this column
        const isFiltered = isFilterApplied(columnId);
        const filterType = column.filterType;

        return (
            <th
                key={columnId}
                ref={(el: HTMLTableCellElement | null) => { thRefs.current[columnId] = el; }}
                onClick={() => {
                    if (displayFilter !== columnId && column.sortable) {
                        HandleSort(columnId);
                    }
                }}
                className={`relative border-b p-1 text-left text-md border-gray-600 dark:border-gray-700 dark:bg-gray-900 ${column.sortable ? 'cursor-pointer' : ''}`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div
                            title={column.sortable ? (
                                sortKey === columnId ? (
                                    sortOrder === 'asc' ? `Sort descending by ${column.label}` : `Clear sort for ${column.label}`
                                ) : `Sort ascending by ${column.label}`
                            ) : undefined}
                        >
                            {column.label}
                        </div>
                        {column.filterable && !column.alwaysVisible && (
                            <button onClick={(e) => { e.stopPropagation(); setDisplayFilter(columnId); }} className="ml-2" title={`Filter by ${column.label}`}>
                                {isFiltered ? <FunnelIconSolid className="w-4 h-4 text-blue-600" /> : <FunnelIconOutline className="w-4 h-4 text-gray-500" />}
                            </button>
                        )}
                        {column.sortable && sortKey === columnId && (
                            <span className="ml-1"
                                title={sortKey === columnId ? (
                                    sortOrder === 'asc' ? `Sort descending by ${column.label}` : `Clear sort for ${column.label}`
                                ) : `Sort ascending by ${column.label}`}
                            >
                                {sortOrder === 'asc' ? (
                                    <ChevronDoubleUpIcon className="w-4 h-4" />
                                ) : (
                                    <ChevronDoubleDownIcon className="w-4 h-4" />
                                )}
                            </span>
                        )}
                    </div>
                    {isLastColumn && isColumnConfigurable && !isOptionSelector && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsConfigOpen(true); }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors ml-2"
                            title="Configure columns"
                        >
                            <Cog6ToothIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
                {displayFilter === columnId && column.filterable && !column.alwaysVisible && filterOptions[columnId] && (() => {
                    const filterType = column.filterType;
                    const componentProps: FilterComponentProps = {
                        selected: getFilterValueForComponent(columnId, filterType),
                        onChange: (value: string | boolean | string[]) => handleFilterChange(columnId, value),
                        open: displayFilter === columnId,
                        onOpenChange: (newOpenState: boolean) => {
                            if (newOpenState) {
                                setDisplayFilter(columnId);
                            } else {
                                setDisplayFilter('');
                            }
                        },
                        dynamic: column.dynamicFilter,
                        dynamicFilterDelay: dynamicFilterDelay,
                        multiColumn: column.multiColumn,
                        appendClassName: 'absolute top-0 left-0 z-50',
                        ...filterOptions[columnId].props,
                    };

                    if (filterType === 'multi-select') {
                        componentProps.logicType = (filters[columnId] as FilterValue) && isMultiSelectFilter(filters[columnId]) ? filters[columnId].value.logic : 'or';
                        componentProps.onLogicChange = (newLogic: string) => handleLogicChange(columnId, newLogic);
                    }

                    if (filterType === 'boolean') {
                        componentProps.value = (filters[columnId] as FilterValue) && isBooleanFilter(filters[columnId]) ? filters[columnId].value : null;
                        componentProps.onToggle = (value: boolean) => handleFilterChange(columnId, value);
                    }

                    return React.createElement(filterOptions[columnId].component, { key: columnId, ...componentProps });
                })()}
            </th>
        );
    };

    if (isLoading) {
        return <div className="p-4 bg-white dark:bg-[#121212]">Loading...</div>;
    }

    return (
        <div className="p-4 bg-white dark:bg-[#121212]">
            <div className="relative">
                {/* Always visible filters */}
                {Object.entries(columnDefinitions).map(([columnId, column]) => {
                    if (column.filterType === 'input' && column.alwaysVisible) {
                        const FilterComponent = filterOptions[columnId]?.component;
                        if (FilterComponent) {
                            return (
                                <div key={columnId} className="mb-2 flex items-center">
                                    <label htmlFor={`always-visible-filter-${columnId}`} className="mr-2 font-semibold dark:text-white">{column.filterLabel || column.label}:</label>
                                    {React.createElement(FilterComponent, {
                                        id: `always-visible-filter-${columnId}`,
                                        selected: getFilterValueForComponent(columnId, column.filterType),
                                        onChange: (value: string | boolean | string[]) => handleFilterChange(columnId, value),
                                        dynamic: column.dynamicFilter,
                                        dynamicFilterDelay: dynamicFilterDelay,
                                        ...filterOptions[columnId].props,
                                    })}
                                </div>
                            );
                        }
                    }
                    return null;
                })}
                <table className="w-full border-collapse border border-solid border-gray-600">
                    <thead>
                        <tr>
                            {adjustedVisibleColumns.map((columnId, index) =>
                                RenderColumnHeader(columnId, index === adjustedVisibleColumns.length - 1)
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {data === undefined || data.length === 0 ? (
                            <tr>
                                <td colSpan={adjustedVisibleColumns.length} className="p-4 text-center text-gray-500 dark:text-gray-400">
                                    No {pluralize(itemDesc, 2)} match the current filters.
                                </td>
                            </tr>
                        ) : (
                            data.map(item => (
                                <tr key={String(item[idKey])} className="hover:bg-gray-100 dark:hover:bg-gray-800 odd:bg-gray-500 even:bg-white dark:odd:bg-[#141e2d] dark:even:bg-[#121212]">
                                    {adjustedVisibleColumns.map((columnId, colIndex) => {
                                        const isLastVisibleColumn = colIndex === adjustedVisibleColumns.length - 1;

                                        // Handle selector column
                                        if (columnId === '__selector_column__') {
                                            const itemId = item[idKey] as string | number;
                                            const isChecked = internalSelectedIds.includes(itemId);
                                            const HandleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                                                e.stopPropagation();
                                                setInternalSelectedIds(prev => {
                                                    if (e.target.checked) {
                                                        return [...prev, itemId];
                                                    } else {
                                                        return prev.filter(id => id !== itemId);
                                                    }
                                                });
                                            };

                                            return (
                                                <td key={columnId} className="p-1 border border-dotted border-gray-600 text-md">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={HandleCheckboxChange}
                                                        className="h-4 w-4 accent-blue-600 dark:bg-gray-700 dark:accent-gray-400 dark:border-gray-600 focus:ring-0 focus:ring-offset-0"
                                                    />
                                                </td>
                                            );
                                        }

                                        return (
                                            <td
                                                key={columnId}
                                                className={`p-1 border border-dotted border-gray-600 text-md ${columnId === requiredColumnId && detailPagePath ? 'cursor-pointer' : ''}`}
                                                onClick={columnId === requiredColumnId && detailPagePath ? (e: React.MouseEvent) => {
                                                    if (e.target === lastClickedElement.current) {
                                                        e.stopPropagation();
                                                        lastClickedElement.current = null;
                                                        return;
                                                    }
                                                    navigate(detailPagePath.replace(':id', String(item[idKey])));
                                                } : undefined}
                                                title={columnId === requiredColumnId && detailPagePath ? `View ${itemDesc} details` : undefined}
                                            >
                                                <div className="flex justify-between items-center w-full">
                                                    <span>{renderCell(item, columnId, isLastVisibleColumn)}</span>
                                                    {isLastVisibleColumn && (editHandler || deleteHandler) && (
                                                        <div className="flex items-center">
                                                            {editHandler && (
                                                                <button
                                                                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); editHandler(item); }}
                                                                    className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 mr-2"
                                                                    title={`Edit ${itemDesc}`}
                                                                >
                                                                    <PencilSquareIcon className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            {deleteHandler && (
                                                                <button
                                                                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); deleteHandler(item); }}
                                                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-600"
                                                                    title={`Delete ${itemDesc}`}
                                                                >
                                                                    <TrashIcon className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 flex justify-between items-center">
                <div>
                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} items
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center gap-2">
                        <label htmlFor="limit-select" className="text-sm">Show:</label>
                        <select
                            id="limit-select"
                            value={limit}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { e.stopPropagation(); e.preventDefault(); HandleLimitChange(e); }}
                            className="p-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                        >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                            <option value="200">200</option>
                        </select>
                    </div>
                    <button
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); HandlePageChange(1); }}
                        disabled={page === 1}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        First
                    </button>
                    <button
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); HandlePageChange(page - 1); }}
                        disabled={page === 1}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="px-3 py-1">
                        Page {page} of {Math.ceil(total / limit)}
                    </span>
                    <button
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); HandlePageChange(page + 1); }}
                        disabled={page >= Math.ceil(total / limit)}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Next
                    </button>
                    <button
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); HandlePageChange(Math.ceil(total / limit)); }}
                        disabled={page >= Math.ceil(total / limit)}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Last
                    </button>
                </div>
            </div>
            {isColumnConfigurable && (
                <ColumnConfigModal
                    isOpen={isConfigOpen}
                    onClose={() => setIsConfigOpen(false)}
                    visibleColumns={visibleColumns}
                    setVisibleColumns={setVisibleColumns}
                    columnDefinitions={columnDefinitions}
                    requiredColumnId={requiredColumnId}
                />
            )}
        </div>
    );
}