import { FunnelIcon as FunnelIconOutline, Cog6ToothIcon as Cog6ToothIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { FunnelIcon as FunnelIconSolid, TrashIcon, ChevronDoubleUpIcon, ChevronDoubleDownIcon } from '@heroicons/react/24/solid';
import pluralize from 'pluralize';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { BooleanInput } from '../src/components/generic-list/BooleanInput';
import { ColumnConfigModal, UseColumnConfig } from '../src/components/generic-list/ColumnConfig';
import { MultiSelect } from '../src/components/generic-list/MultiSelect';
import { SingleSelect } from '../src/components/generic-list/SingleSelect';
import { TextInput } from '../src/components/generic-list/TextInput';
import type {
    DataItem,
    GenericListProps,
    ColumnDefinition,
    FilterConfig,
    TextInputFilterComponentProps,
    BooleanFilterComponentProps,
    SingleSelectFilterComponentProps,
    MultiSelectFilterComponentProps,
    FilterState,
    FilterValue,
    MultiSelectValue,
    LocalStorage
} from '../src/components/generic-list/types';
import { FilterType, PAGE_LIMITS } from '../src/components/generic-list/types';
import { CustomSelect } from '@/components/forms/FormComponents';

// Helper functions to determine default values
const getDefaultFilterValue = (column: ColumnDefinition & { filterConfig: FilterConfig }): FilterValue => {
    switch (column.filterConfig.type) {
        case FilterType.MULTI_SELECT:
            return { values: [], logic: 'or' };
        case FilterType.TEXT_INPUT:
            return '';
        default:
            return null;
    }
};

const isPopulatedFilterValue = (value: FilterValue): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value !== '';
    if (typeof value === 'number') return true; // Non-null numbers are considered populated
    if (typeof value === 'boolean') return true; // Boolean values are considered populated
    if (typeof value === 'object' && 'values' in value) {
        return (value as MultiSelectValue).values.length > 0;
    }
    return false;
};

const multiSelectValueEqual = (value: MultiSelectValue, defaultValue: MultiSelectValue): boolean => {
    if (value.logic !== defaultValue.logic) return false;
    if (value.values.length !== defaultValue.values.length) return false;
    return value.values.every((value, index) => value === defaultValue.values[index]);
};

const isDefaultValue = (value: FilterValue, defaultValue: FilterValue): boolean => {
    if (!isPopulatedFilterValue(value)) return true;

    if (typeof value === 'object' && typeof defaultValue === 'object') {
        return multiSelectValueEqual(value as MultiSelectValue, defaultValue as MultiSelectValue);
    }

    return value === defaultValue;
};

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
    initialLimit = 20,
    isColumnConfigurable = true,

    // Option selector props
    isOptionSelector = false,
    selectedIds = [],
    onSelectedIdsChange,
    editHandler,
    deleteHandler,

    // Refresh trigger
    refreshTrigger = 0,
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

    // Helper function to check if a column has filter configuration
    const hasFilterConfig = (column: ColumnDefinition): column is ColumnDefinition & { filterConfig: FilterConfig } => {
        return column.filterConfig !== undefined;
    };

    const [filterSettings, setFilterSettings] = useState<LocalStorage>(() => {
        const stored = localStorage.getItem(storageKey);
        const parsed = stored ? JSON.parse(stored) as LocalStorage : {};

        parsed.page = parsed.page || 1;
        parsed.limit = parsed.limit || initialLimit;
        parsed.sortKey = parsed.sortKey || '';
        parsed.sortOrder = parsed.sortOrder || 'asc';

        for (const [key, column] of Object.entries(columnDefinitions)) {
            if (!hasFilterConfig(column)) continue;

            parsed.filterValues[key] = parsed.filterValues[key] || getDefaultFilterValue(column);
        }

        return parsed;
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
            case FilterType.TEXT_INPUT: {
                const props: TextInputFilterComponentProps = {
                    ...baseProps,
                    ...column.filterConfig.props,
                    selected: getTextInputValue(columnId),
                    onChange: (value: string) => handleTextInputFilterChange(columnId, value),
                };
                return React.createElement(TextInput, props);
            }
            case FilterType.BOOLEAN: {
                const props: BooleanFilterComponentProps = {
                    ...baseProps,
                    ...column.filterConfig.props,
                    value: getBooleanValue(columnId),
                    onToggle: (value: boolean | null) => handleBooleanFilterChange(columnId, value),
                };
                return React.createElement(BooleanInput, props);
            }
            case FilterType.SINGLE_SELECT: {
                const props: SingleSelectFilterComponentProps = {
                    ...baseProps,
                    ...column.filterConfig.props,
                    selected: getSingleSelectValue(columnId),
                    onChange: (value: number | null) => handleSingleSelectFilterChange(columnId, value),
                };
                return React.createElement(SingleSelect, props);
            }
            case FilterType.MULTI_SELECT: {
                const props: MultiSelectFilterComponentProps = {
                    ...baseProps,
                    ...column.filterConfig.props,
                    selected: getMultiSelectValue(columnId),
                    onChange: (values: number[]) => handleMultiSelectFilterChange(columnId, values),
                    logicType: (filterSettings.filterValues[columnId] as MultiSelectValue) ? (filterSettings.filterValues[columnId] as MultiSelectValue).logic : 'or',
                    onLogicChange: (newLogic: 'or' | 'and') => handleLogicChange(columnId, newLogic),
                };
                return React.createElement(MultiSelect, props);
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

    const getMultiSelectValue = (filterKey: string): number[] => {
        const filterValue = filterSettings.filterValues[filterKey];
        if (!filterValue) return [];
        return (filterValue as MultiSelectValue).values;
    };
    const getBooleanValue = (filterKey: string): boolean | null => {
        const filterValue = filterSettings.filterValues[filterKey];
        if (!filterValue) return null;
        return filterValue as boolean | null;
    };
    const getTextInputValue = (filterKey: string): string => {
        const filterValue = filterSettings.filterValues[filterKey];
        if (!filterValue) return '';
        return filterValue as string;
    };
    const getSingleSelectValue = (filterKey: string): number | null => {
        const filterValue = filterSettings.filterValues[filterKey];
        if (!filterValue) return null;
        return filterValue as number | null;
    };

    // Helper function to check if a filter is applied
    const isFilterApplied = (filterKey: string): boolean => {
        const filterValue = filterSettings.filterValues[filterKey];
        if (!filterValue) return false;
        return isPopulatedFilterValue(filterValue);
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
        setIsLoading(true);

        const output: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(filterSettings.filterValues)) {
            if (value === null || value === undefined) continue;

            // If value is an object with `values: []`, skip it
            if (typeof value === 'object' && Array.isArray(value.values) && value.values.length === 0) {
                continue;
            }

            output[key] = value;
        }
        output.page = filterSettings.page;
        output.limit = filterSettings.limit;
        output.sort = filterSettings.sortKey;
        output.order = filterSettings.sortOrder;
        const queryParams = querySchema.parse(output);
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
    }, [filterSettings, querySchema, serviceFunction, columnDefinitions, refreshTrigger]);

    useEffect(() => {
        const stored = localStorage.getItem(storageKey);
        const parsed = stored ? JSON.parse(stored) as LocalStorage : {};

        const tmpStorage: LocalStorage = {};
        if (filterSettings.page !== 1 && filterSettings.page !== parsed.page) {
            tmpStorage.page = filterSettings.page;
        }
        if (filterSettings.limit !== initialLimit && filterSettings.limit !== parsed.limit) {
            tmpStorage.limit = filterSettings.limit;
        }
        if (filterSettings.sortKey !== '' && filterSettings.sortKey !== parsed.sortKey) {
            tmpStorage.sortKey = filterSettings.sortKey;
        }
        if (filterSettings.sortOrder !== 'asc' && filterSettings.sortOrder !== parsed.sortOrder) {
            tmpStorage.sortOrder = filterSettings.sortOrder;
        }

        for (const [key, filter] of Object.entries(filterSettings.filterValues)) {
            const column = columnDefinitions[key];
            if (!hasFilterConfig(column)) continue;

            if (isPopulatedFilterValue(filter) && !isDefaultValue(filter, getDefaultFilterValue(column)) && filter !== parsed.filterValues[key]) {
                tmpStorage.filterValues[key] = filter;
            }
        }
        localStorage.setItem(storageKey, JSON.stringify(tmpStorage));
    }, [filterSettings]);

    useEffect(() => {
        const HandleClickOutside = (event: MouseEvent): void => {
            if (displayFilter && thRefs.current[displayFilter] && !thRefs.current[displayFilter]?.contains(event.target as Node)) {
                // If the closed filter was a multi-select, clear its active state
                const column = columnDefinitions[displayFilter];
                if (hasFilterConfig(column) && column.filterConfig!.type === FilterType.MULTI_SELECT) {
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

    const handleTextInputFilterChange = useCallback((filterKey: string, value: string): void => {
        setFilters(prev => {
            const newFilters = { ...prev };
            newFilters[filterKey] = value;
            return newFilters;
        });
        setPage(1);
    }, [columnDefinitions]);

    const handleSingleSelectFilterChange = useCallback((filterKey: string, value: number | null): void => {
        setFilters(prev => {
            const newFilters = { ...prev };
            newFilters[filterKey] = value;
            return newFilters;
        });
        setPage(1);
    }, [columnDefinitions]);

    const handleMultiSelectFilterChange = useCallback((filterKey: string, value: number[]): void => {
        setFilters(prev => {
            const newFilters = { ...prev };
            const currentFilter = prev[filterKey] as MultiSelectValue;
            newFilters[filterKey] = {
                values: value,
                logic: currentFilter.logic
            };
            return newFilters;
        });
        setPage(1);
    }, [columnDefinitions]);

    const handleBooleanFilterChange = useCallback((filterKey: string, value: boolean | null): void => {
        setFilters(prev => {
            const newFilters = { ...prev };
            newFilters[filterKey] = value;
            return newFilters;
        });
        setPage(1);
    }, [columnDefinitions]);

    const handleLogicChange = useCallback((filterKey: string, newLogic: string): void => {
        setFilters(prev => {
            const newFilters = { ...prev };
            const currentFilter = prev[filterKey] as MultiSelectValue;

            newFilters[filterKey] = {
                values: currentFilter.values,
                logic: (newLogic === 'and' ? 'and' : 'or') as 'or' | 'and'
            };

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

    const HandleLimitChange = (value: number): void => {
        const newLimit = value;
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
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <div className="relative">
                {/* Always visible filters */}
                {Object.entries(columnDefinitions).map(([columnId, column]) => {
                    if (hasFilterConfig(column) && column.filterConfig.type === FilterType.TEXT_INPUT && column.alwaysVisible) {
                        const props: TextInputFilterComponentProps = {
                            id: `always-visible-filter-${columnId}`,
                            selected: getTextInputValue(columnId),
                            onChange: (value: string) => handleTextInputFilterChange(columnId, value),
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
                    <CustomSelect options={PAGE_LIMITS} value={limit} onValueChange={(value: number) => HandleLimitChange(value)} />
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
