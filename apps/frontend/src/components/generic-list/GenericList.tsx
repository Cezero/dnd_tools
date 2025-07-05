import { FunnelIcon as FunnelIconOutline, Cog6ToothIcon as Cog6ToothIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { FunnelIcon as FunnelIconSolid, TrashIcon, ChevronDoubleUpIcon, ChevronDoubleDownIcon } from '@heroicons/react/24/solid';
import pluralize from 'pluralize';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { BooleanInput } from './BooleanInput';
import { ColumnConfigModal, UseColumnConfig } from './ColumnConfig';
import { MultiSelect } from './MultiSelect';
import { SingleSelect } from './SingleSelect';
import { TextInput } from './TextInput';
import type {
    FilterValue,
    FilterState,
    DataItem,
    GenericListProps,
    ColumnDefinition,
    FilterConfig,
    InputFilterComponentProps,
    BooleanFilterComponentProps,
    SingleSelectFilterComponentProps,
    MultiSelectFilterComponentProps
} from './types';

// Type guards for filter values
function isInputFilter(value: unknown): value is { type: 'input'; value: string } {
    return typeof value === 'object' && value !== null && 'type' in value && value.type === 'input';
}

function isMultiSelectFilter(value: unknown): value is { type: 'multi-select'; value: { values: string[]; logic: 'or' | 'and' } } {
    return typeof value === 'object' && value !== null && 'type' in value && value.type === 'multi-select';
}

function isBooleanFilter(value: unknown): value is { type: 'boolean'; value: boolean | null } {
    return typeof value === 'object' && value !== null && 'type' in value && value.type === 'boolean';
}

export function GenericList<T = DataItem>({
    // Configuration props
    storageKey,
    columnDefinitions,
    querySchema,
    serviceFunction,
    renderCell,

    // Routing props
    detailPagePath,
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

    // Helper function to check if a column has filter configuration
    const hasFilterConfig = (column: ColumnDefinition): column is ColumnDefinition & { filterConfig: FilterConfig } => {
        return column.filterConfig !== undefined;
    };

    const [filters, setFilters] = useState<FilterState>(() => {
        const storedFilterValues = getStoredValue('filterValues', {}) as Record<string, unknown>;
        const currentFilters: FilterState = {};

        for (const key in columnDefinitions) {
            const column = columnDefinitions[key];
            const storedValue = storedFilterValues[key];

            // Only create filters for columns that have filterConfig
            if (!hasFilterConfig(column)) {
                continue;
            }

            const filterType = column.filterConfig!.type;

            if (filterType === 'multi-select') {
                // Handle multi-select with values array and logic
                if (storedValue && typeof storedValue === 'object' && 'values' in storedValue) {
                    const multiSelectValue = storedValue as { values: string[]; logic?: string };
                    currentFilters[key] = {
                        type: 'multi-select',
                        value: {
                            values: multiSelectValue.values || [],
                            logic: (multiSelectValue.logic === 'and' ? 'and' : 'or') as 'or' | 'and'
                        }
                    };
                } else {
                    // Default value
                    currentFilters[key] = {
                        type: 'multi-select',
                        value: { values: [], logic: 'or' }
                    };
                }
            } else if (filterType === 'boolean') {
                // Handle boolean values
                currentFilters[key] = {
                    type: 'boolean',
                    value: storedValue !== undefined ? storedValue as boolean : null
                };
            } else if (filterType === 'text-input') {
                // Handle input string values
                currentFilters[key] = {
                    type: 'input',
                    value: storedValue !== undefined ? storedValue as string : ''
                };
            } else if (filterType === 'single-select') {
                // Handle single-select values
                currentFilters[key] = {
                    type: 'input',
                    value: storedValue !== undefined ? storedValue as string : ''
                };
            }
        }

        return currentFilters;
    });

    const [displayFilter, setDisplayFilter] = useState<string>('');

    // Derive default columns from column definitions
    const defaultColumns = useMemo(() => {
        return Object.entries(columnDefinitions)
            .filter(([_, column]) => column.isDefault === true) // Only include columns where isDefault is explicitly true
            .map(([columnId, _]) => columnId);
    }, [columnDefinitions]);

    // Derive required column ID from column definitions
    const requiredColumnId = useMemo(() => {
        const requiredColumn = Object.entries(columnDefinitions).find(([_, column]) => column.isRequired === true);
        return requiredColumn ? requiredColumn[0] : '';
    }, [columnDefinitions]);

    const { visibleColumns, setVisibleColumns } = UseColumnConfig(storageKey, defaultColumns, columnDefinitions);
    const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);

    const thRefs = useRef<Record<string, HTMLTableCellElement | null>>({});
    const lastClickedElement = useRef<EventTarget | null>(null);

    // Helper function to render filter components from column definition
    const renderFilterComponent = (columnId: string, column: ColumnDefinition): React.ReactNode => {
        if (!hasFilterConfig(column)) {
            return null;
        }

        const baseProps = {
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
        };

        switch (column.filterConfig.type) {
            case 'text-input': {
                const props: InputFilterComponentProps = {
                    ...baseProps,
                    ...column.filterConfig.props,
                    selected: getFilterValueForComponent(columnId, 'input') as string,
                    onChange: (value: string) => handleFilterChange(columnId, value),
                };
                return React.createElement(TextInput, { key: columnId, ...props });
            }
            case 'boolean': {
                const props: BooleanFilterComponentProps = {
                    ...baseProps,
                    ...column.filterConfig.props,
                    value: getFilterValueForComponent(columnId, 'boolean') as boolean | null,
                    onToggle: (value: boolean | null) => handleFilterChange(columnId, value),
                };
                return React.createElement(BooleanInput, { key: columnId, ...props });
            }
            case 'single-select': {
                const props: SingleSelectFilterComponentProps = {
                    ...baseProps,
                    ...column.filterConfig.props,
                    displayKey: column.filterConfig.props.displayKey || 'label',
                    valueKey: column.filterConfig.props.valueKey || 'value',
                    selected: getFilterValueForComponent(columnId, 'single-select') as string | number | null,
                    onChange: (value: string | number | null) => handleFilterChange(columnId, value),
                };
                return React.createElement(SingleSelect, { key: columnId, ...props });
            }
            case 'multi-select': {
                const props: MultiSelectFilterComponentProps = {
                    ...baseProps,
                    ...column.filterConfig.props,
                    displayKey: column.filterConfig.props.displayKey || 'label',
                    valueKey: column.filterConfig.props.valueKey || 'value',
                    selected: getFilterValueForComponent(columnId, 'multi-select') as (string | number)[],
                    onChange: (values: (string | number)[]) => handleFilterChange(columnId, values),
                    logicType: (filters[columnId] as FilterValue) && isMultiSelectFilter(filters[columnId]) ? filters[columnId].value.logic : 'or',
                    onLogicChange: (newLogic: 'or' | 'and') => handleLogicChange(columnId, newLogic),
                };
                return React.createElement(MultiSelect, { key: columnId, ...props });
            }
            default:
                return null;
        }
    };

    // Modify visibleColumns if in option selector mode
    const adjustedVisibleColumns = useMemo(() => {
        if (isOptionSelector) {
            return ['__selector_column__', ...visibleColumns];
        }
        return visibleColumns;
    }, [isOptionSelector, visibleColumns]);

    // Helper function to get filter value for component props
    const getFilterValueForComponent = (filterKey: string, filterType?: string): string | boolean | string[] | string | number | null => {
        const filterValue = filters[filterKey];
        if (!filterValue) return '';

        if (filterType === 'multi-select' && isMultiSelectFilter(filterValue)) {
            return filterValue.value.values;
        }
        if (filterType === 'boolean' && isBooleanFilter(filterValue)) {
            return filterValue.value;
        }
        if (filterType === 'text-input' && isInputFilter(filterValue)) {
            return filterValue.value;
        }
        if (filterType === 'single-select' && isInputFilter(filterValue)) {
            // For single-select, we store as string but need to return as string | number | null
            return filterValue.value || null;
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
        if (isInputFilter(filterValue)) {
            return filterValue.value !== '';
        }
        return false;
    };

    // Helper function to parse detailPagePath and extract parameter name
    const getPathParameter = useCallback((path: string): string => {
        const match = path.match(/:([^/]+)/);
        return match ? match[1] : 'id'; // Default to 'id' if no parameter found
    }, []);

    // Get the actual key to use for the item
    const getItemKey = useCallback((item: T): string | number => {
        const key = detailPagePath ? getPathParameter(detailPagePath) : 'id';
        return item[key] as string | number;
    }, [detailPagePath, getPathParameter]);

    // useEffect for data fetching, now depends on local state variables
    useEffect(() => {
        const currentParams = new URLSearchParams();
        currentParams.set('page', page.toString());
        currentParams.set('limit', limit.toString());
        if (sortKey) currentParams.set('sort', sortKey);
        if (sortOrder) currentParams.set('order', sortOrder);

        for (const key in filters) {
            const column = columnDefinitions[key];
            const paramName = column?.paramName || key;
            const multiColumns = column?.multiColumn;
            const filterValue = filters[key];

            if (!hasFilterConfig(column)) {
                continue;
            }

            const filterType = column.filterConfig!.type;

            if (filterType === 'text-input' && isInputFilter(filterValue)) {
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
            }
        }
        setIsLoading(true);

        // Parse the URLSearchParams using the provided query schema
        const queryObject = Object.fromEntries(currentParams.entries());
        const queryParams = querySchema.parse(queryObject);

        serviceFunction(queryParams)
            .then(result => {
                setData(result.results);
                setTotal(result.total);
            })
            .catch(error => {
                console.error('Error fetching list data:', error);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [page, limit, sortKey, sortOrder, filters, querySchema, serviceFunction, columnDefinitions]);

    // New useEffect to sync state to localStorage
    useEffect(() => {
        setStoredValue('page', page);
        setStoredValue('limit', limit);
        setStoredValue('sortKey', sortKey);
        setStoredValue('sortOrder', sortOrder);

        // Extract and store only filter values, not the entire filter objects
        const filterValues: Record<string, unknown> = {};
        for (const key in filters) {
            const filter = filters[key];
            if (isInputFilter(filter)) {
                filterValues[key] = filter.value;
            } else if (isBooleanFilter(filter)) {
                filterValues[key] = filter.value;
            } else if (isMultiSelectFilter(filter)) {
                filterValues[key] = {
                    values: filter.value.values,
                    logic: filter.value.logic
                };
            }
        }
        setStoredValue('filterValues', filterValues);
    }, [page, limit, sortKey, sortOrder, filters, setStoredValue]);

    useEffect(() => {
        const HandleClickOutside = (event: MouseEvent): void => {
            if (displayFilter && thRefs.current[displayFilter] && !thRefs.current[displayFilter]?.contains(event.target as Node)) {
                // If the closed filter was a multi-select, clear its active state
                const column = columnDefinitions[displayFilter];
                if (hasFilterConfig(column) && column.filterConfig!.type === 'multi-select') {
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

    const handleFilterChange = useCallback((filterKey: string, value: string | boolean | string[] | (string | number)[] | string | number | null): void => {
        setFilters(prev => {
            const newFilters = { ...prev };
            const column = columnDefinitions[filterKey];

            if (!hasFilterConfig(column)) {
                return newFilters;
            }

            const filterType = column.filterConfig!.type;

            if (filterType === 'multi-select') {
                // Convert to string array for storage
                const stringValues = Array.isArray(value) ? value.map(v => String(v)) : [];
                newFilters[filterKey] = {
                    type: 'multi-select',
                    value: { values: stringValues, logic: 'or' }
                };
            } else if (filterType === 'boolean') {
                newFilters[filterKey] = {
                    type: 'boolean',
                    value: value as boolean | null
                };
            } else if (filterType === 'single-select') {
                // Convert to string for storage
                const stringValue = value !== null ? String(value) : '';
                newFilters[filterKey] = {
                    type: 'input',
                    value: stringValue
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
        const column = columnDefinitions[filterKey];
        if (hasFilterConfig(column) && column.filterConfig!.type === 'boolean') {
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

        return (
            <th
                key={columnId}
                ref={(el: HTMLTableCellElement | null) => { thRefs.current[columnId] = el; }}
                onClick={() => {
                    if (displayFilter !== columnId && column.sortable === true) {
                        HandleSort(columnId);
                    }
                }}
                className={`relative border-b p-1 text-left text-md border-gray-600 dark:border-gray-700 dark:bg-gray-900 ${column.sortable === true ? 'cursor-pointer' : ''}`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div
                            title={column.sortable === true ? (
                                sortKey === columnId ? (
                                    sortOrder === 'asc' ? `Sort descending by ${column.label}` : `Clear sort for ${column.label}`
                                ) : `Sort ascending by ${column.label}`
                            ) : undefined}
                        >
                            {column.label}
                        </div>
                        {hasFilterConfig(column) && !column.alwaysVisible && (
                            <button onClick={(e) => { e.stopPropagation(); setDisplayFilter(columnId); }} className="ml-2" title={`Filter by ${column.label}`}>
                                {isFiltered ? <FunnelIconSolid className="w-4 h-4 text-blue-600" /> : <FunnelIconOutline className="w-4 h-4 text-gray-500" />}
                            </button>
                        )}
                        {column.sortable === true && sortKey === columnId && (
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
                {displayFilter === columnId && hasFilterConfig(column) && !column.alwaysVisible && renderFilterComponent(columnId, column)}
            </th>
        );
    };

    // Helper function to replace path parameter with actual value
    const replacePathParameter = useCallback((path: string, item: T): string => {
        const paramName = getPathParameter(path);
        const value = getItemKey(item);
        return path.replace(`:${paramName}`, String(value));
    }, [getPathParameter, getItemKey]);

    if (isLoading) {
        return <div className="p-4 bg-white dark:bg-[#121212]">Loading...</div>;
    }

    return (
        <div className="p-4 bg-white dark:bg-[#121212]">
            <div className="relative">
                {/* Always visible filters */}
                {Object.entries(columnDefinitions).map(([columnId, column]) => {
                    if (hasFilterConfig(column) && column.filterConfig.type === 'text-input' && column.alwaysVisible) {
                        const props: InputFilterComponentProps = {
                            id: `always-visible-filter-${columnId}`,
                            selected: getFilterValueForComponent(columnId, 'input') as string,
                            onChange: (value: string) => handleFilterChange(columnId, value),
                            dynamic: column.dynamicFilter,
                            dynamicFilterDelay: dynamicFilterDelay,
                            ...column.filterConfig.props,
                        };

                        return (
                            <div key={columnId} className="mb-2 flex items-center">
                                <label htmlFor={`always-visible-filter-${columnId}`} className="mr-2 font-semibold dark:text-white">{column.filterLabel || column.label}:</label>
                                {React.createElement(TextInput, props)}
                            </div>
                        );
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
                                <tr key={String(getItemKey(item))} className="hover:bg-gray-100 dark:hover:bg-gray-800 odd:bg-gray-500 even:bg-white dark:odd:bg-[#141e2d] dark:even:bg-[#121212]">
                                    {adjustedVisibleColumns.map((columnId, colIndex) => {
                                        const isLastVisibleColumn = colIndex === adjustedVisibleColumns.length - 1;

                                        // Handle selector column
                                        if (columnId === '__selector_column__') {
                                            const itemId = getItemKey(item) as string | number;
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
                                                    navigate(replacePathParameter(detailPagePath, item));
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
                />
            )}
        </div>
    );
}