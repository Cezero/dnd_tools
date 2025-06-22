import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Icon from '@mdi/react';
import { mdiFilterOutline, mdiSortAscending, mdiSortDescending, mdiCog, mdiFilter, mdiPlaylistEdit, mdiTrashCan } from '@mdi/js';
import { ColumnConfigModal, useColumnConfig } from '@/components/GenericList/ColumnConfig';
import pluralize from 'pluralize';

function GenericList({
    // Configuration props
    storageKey,
    defaultColumns,
    columnDefinitions,
    requiredColumnId,
    fetchData, // Function to fetch data
    renderCell, // Function to render cell content
    // Optional: Filter options and their respective render functions
    filterOptions = {}, // { filterKey: { component: FilterComponent, props: { ... } } }
    headerActions, // Optional: Additional actions in the header row

    // Routing props
    navigate,
    detailPagePath, // e.g., '/spells/:id'
    idKey, // e.g., 'spell_id'
    refreshTrigger, // New prop for triggering data refresh
    itemDesc = 'items', // New prop for the description of the items being listed (e.g., 'spells', 'characters')
    dynamicFilterDelay = 500, // New prop for dynamic filtering delay
    initialLimit = 25, // Default initial limit
    isColumnConfigurable = true, // New prop to toggle column configurability

    // Option selector props
    isOptionSelector = false, // New prop to enable option selector mode
    selectedIds = [], // Array of currently selected IDs (controlled by parent)
    onSelectedIdsChange, // Callback to update selected IDs in the parent
    editHandler, // New prop: Function to call for edit action (item) => void
    deleteHandler, // New prop: Function to call for delete action (item) => void
}) {
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Internal state for selected IDs when in option selector mode
    const [internalSelectedIds, setInternalSelectedIds] = useState(selectedIds);

    // Call onSelectedIdsChange when internalSelectedIds changes
    useEffect(() => {
        if (isOptionSelector && onSelectedIdsChange) {
            onSelectedIdsChange(internalSelectedIds);
        }
    }, [internalSelectedIds, isOptionSelector, onSelectedIdsChange]);

    const getStoredValue = useCallback((key, defaultValue) => {
        try {
            const stored = localStorage.getItem(`${storageKey}-${key}`);
            const parsed = stored ? JSON.parse(stored) : defaultValue;
            return parsed;
        } catch (error) {
            console.error('Error reading from localStorage', error);
            return defaultValue;
        }
    }, [storageKey]);

    const setStoredValue = useCallback((key, value) => {
        try {
            localStorage.setItem(`${storageKey}-${key}`, JSON.stringify(value));
        } catch (error) {
            console.error('Error writing to localStorage', error);
        }
    }, [storageKey]);

    const [page, setPage] = useState(() => getStoredValue('page', 1));
    const [limit, setLimit] = useState(() => getStoredValue('limit', initialLimit));
    const [sortKey, setSortKey] = useState(() => getStoredValue('sortKey', ''));
    const [sortOrder, setSortOrder] = useState(() => getStoredValue('sortOrder', 'asc'));

    // Initialize filters directly from localStorage
    const getInitialFilters = () => {
        const storedFilters = getStoredValue('filters', {});
        const currentFilters = { ...storedFilters };

        for (const key in columnDefinitions) {
            const column = columnDefinitions[key];
            const filterType = column?.filterType;

            if (!(key in currentFilters)) {
                if (filterType === 'multi-select') {
                    currentFilters[key] = { values: [], logic: 'or' };
                } else if (filterType === 'boolean') {
                    currentFilters[key] = null;
                } else {
                    currentFilters[key] = '';
                }
            }

            if (storedFilters[key] !== undefined) {
                if (filterType === 'input' && column.multiColumn) {
                    currentFilters[key] = storedFilters[key];
                } else if (filterType === 'multi-select') {
                    currentFilters[key] = {
                        values: storedFilters[key]?.values || [],
                        logic: storedFilters[key]?.logic || 'or'
                    };
                } else if (filterType === 'boolean') {
                    currentFilters[key] = storedFilters[key] !== undefined ? storedFilters[key] : null;
                } else {
                    currentFilters[key] = storedFilters[key] !== undefined ? storedFilters[key] : '';
                }
            }
        }

        for (const key in currentFilters) {
            if (!columnDefinitions[key] && !['_mclist', '_mcfilter'].includes(key)) {
                delete currentFilters[key];
            }
        }

        return currentFilters;
    };

    const [filters, setFilters] = useState(() => {
        const initial = getInitialFilters();
        return initial;
    });

    const [displayFilter, setDisplayFilter] = useState(''); // Which filter is currently open

    const [activeMultiSelectFilterId, setActiveMultiSelectFilterId] = useState(null); // For controlled multi-select open state
    const [visibleColumns, setVisibleColumns] = useColumnConfig(storageKey, defaultColumns, columnDefinitions, requiredColumnId);
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    const thRefs = useRef({});
    const lastClickedElement = useRef(null);

    // Modify visibleColumns if in option selector mode
    const adjustedVisibleColumns = useMemo(() => {
        if (isOptionSelector) {
            return ['__selector_column__', ...visibleColumns];
        }
        return visibleColumns;
    }, [isOptionSelector, visibleColumns]);

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

            if (filterType === 'input' && multiColumns && filters[key] !== '') {
                currentParams.set('mclist', multiColumns.join(','));
                currentParams.set('mcfilter', filters[key]);
            } else if (filterType === 'multi-select') {
                if (filters[key]?.values && filters[key].values.length > 0) {
                    currentParams.set(paramName, filters[key].values.join(','));
                    if (filters[key]?.logic) {
                        currentParams.set(`${paramName}_logic`, filters[key].logic);
                    }
                }
            } else if (filterType === 'boolean') {
                if (filters[key] !== null) {
                    currentParams.set(paramName, String(filters[key]));
                }
            } else if (filters[key] !== '') {
                currentParams.set(paramName, filters[key]);
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
        const handleClickOutside = (event) => {
            if (displayFilter && thRefs.current[displayFilter] && !thRefs.current[displayFilter].contains(event.target)) {
                // If the closed filter was a multi-select, clear its active state
                const filterType = columnDefinitions[displayFilter]?.filterType;
                if (filterType === 'multi-select') {
                    setActiveMultiSelectFilterId(null);
                }
                setDisplayFilter('');
                lastClickedElement.current = event.target;
            }
        };

        document.addEventListener('mousedown', handleClickOutside, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside, true);
        };
    }, [displayFilter, columnDefinitions]);

    const handleFilterChange = useCallback((filterKey, value) => {
        setFilters(prev => {
            const newFilters = { ...prev };
            const filterType = columnDefinitions[filterKey]?.filterType;
            if (filterType === 'multi-select') {
                newFilters[filterKey] = { ...newFilters[filterKey], values: value };
            } else if (filterType === 'boolean') {
                newFilters[filterKey] = value;
            } else {
                newFilters[filterKey] = value;
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
    }, [columnDefinitions]); // Removed 'setSearchParams' and 'filters' from dependency array

    const handleLogicChange = useCallback((filterKey, newLogic) => {
        setFilters(prev => {
            const newFilters = {
                ...prev,
                [filterKey]: { ...prev[filterKey], logic: newLogic }
            };
            return newFilters; // Only return the newFilters state
        });
    }, []); // Removed 'setSearchParams' and 'filters' from dependency array

    const toggleFilter = useCallback((columnId) => {
        const filterType = columnDefinitions[columnId]?.filterType;
        if (displayFilter === columnId) { // Filter is closing
            if (filterType === 'multi-select') {
                setActiveMultiSelectFilterId(null);
            }
            setDisplayFilter('');
        } else { // Filter is opening
            if (filterType === 'multi-select') {
                setActiveMultiSelectFilterId(columnId);
            } else if (filterType === 'boolean') {
                // Boolean filters don't have an active state similar to multi-select
            }
            setDisplayFilter(columnId);
        }
    }, [displayFilter, columnDefinitions]);

    const handleSort = (key) => {
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

    const handleLimitChange = (e) => {
        const newLimit = parseInt(e.target.value);
        setLimit(newLimit);
        setPage(Math.min(page, Math.ceil(total / newLimit) || 1));
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const renderColumnHeader = (columnId, isLastColumn) => {
        const column = columnDefinitions[columnId];
        if (!column) {
            // If it's the selector column, return an empty header
            if (columnId === '__selector_column__') {
                return <th key={columnId} className="relative border-b p-1 text-left text-md border-gray-600 dark:border-gray-700 dark:bg-gray-900"></th>;
            }
            return null;
        }

        // Check if a filter is applied to this column
        let isFiltered = false;
        const filterType = column.filterType;
        if (filterType === 'multi-select') {
            isFiltered = filters[columnId] && filters[columnId].values.length > 0;
        } else {
            isFiltered = !!filters[columnId];
        }

        return (
            <th
                key={columnId}
                ref={el => (thRefs.current[columnId] = el)}
                onClick={() => {
                    if (displayFilter !== columnId && column.sortable) {
                        handleSort(columnId);
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
                            <button onClick={(e) => { e.stopPropagation(); toggleFilter(columnId); }} className="ml-2" title={`Filter by ${column.label}`}>
                                <Icon path={isFiltered ? mdiFilter : mdiFilterOutline} size={0.7} />
                            </button>
                        )}
                        {column.sortable && sortKey === columnId && (
                            <span className="ml-1"
                                title={sortKey === columnId ? (
                                    sortOrder === 'asc' ? `Sort descending by ${column.label}` : `Clear sort for ${column.label}`
                                ) : `Sort ascending by ${column.label}`}
                            >
                                {sortOrder === 'asc' ? (
                                    <Icon path={mdiSortAscending} size={0.7} />
                                ) : (
                                    <Icon path={mdiSortDescending} size={0.7} />
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
                            <Icon path={mdiCog} size={0.7} />
                        </button>
                    )}
                </div>
                {displayFilter === columnId && column.filterable && !column.alwaysVisible && filterOptions[columnId] && (
                    React.createElement(filterOptions[columnId].component, {
                        key: columnId,
                        selected: filterType === 'multi-select' ? filters[columnId]?.values : filters[columnId],
                        onChange: (value) => handleFilterChange(columnId, value),
                        open: displayFilter === columnId,
                        onOpenChange: (newOpenState) => {
                            if (newOpenState) {
                                setDisplayFilter(columnId);
                            } else {
                                setDisplayFilter('');
                            }
                        },
                        ...(filterType === 'multi-select' && {
                            logicType: filters[columnId]?.logic,
                            onLogicChange: (newLogic) => handleLogicChange(columnId, newLogic),
                        }),
                        ...(filterType === 'boolean' && {
                            value: filters[columnId],
                            onToggle: (value) => handleFilterChange(columnId, value),
                        }),
                        dynamic: column.dynamicFilter,
                        dynamicFilterDelay: dynamicFilterDelay,
                        multiColumn: column.multiColumn,
                        appendClassName: 'absolute top-0 left-0 z-50',
                        ...filterOptions[columnId].props,
                    })
                )}
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
                                        selected: filters[columnId],
                                        onChange: (value) => handleFilterChange(columnId, value),
                                        dynamic: column.dynamicFilter,
                                        dynamicFilterDelay: dynamicFilterDelay,
                                        // onOpenChange is not relevant for always visible filters
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
                                renderColumnHeader(columnId, index === adjustedVisibleColumns.length - 1)
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
                                <tr key={item[idKey]} className="hover:bg-gray-100 dark:hover:bg-gray-800 odd:bg-gray-500 even:bg-white dark:odd:bg-[#141e2d] dark:even:bg-[#121212]">
                                    {adjustedVisibleColumns.map((columnId, colIndex) => {
                                        const isLastVisibleColumn = colIndex === adjustedVisibleColumns.length - 1;

                                        // Handle selector column
                                        if (columnId === '__selector_column__') {
                                            const isChecked = internalSelectedIds.includes(item[idKey]);
                                            const handleCheckboxChange = (e) => {
                                                e.stopPropagation(); // Prevent row click navigation
                                                setInternalSelectedIds(prev => {
                                                    if (e.target.checked) {
                                                        return [...prev, item[idKey]];
                                                    } else {
                                                        return prev.filter(id => id !== item[idKey]);
                                                    }
                                                });
                                            };

                                            return (
                                                <td key={columnId} className="p-1 border border-dotted border-gray-600 text-md">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={handleCheckboxChange}
                                                        className="h-4 w-4 accent-blue-600 dark:bg-gray-700 dark:accent-gray-400 dark:border-gray-600 focus:ring-0 focus:ring-offset-0"
                                                    />
                                                </td>
                                            );
                                        }

                                        return (
                                            <td
                                                key={columnId}
                                                className={`p-1 border border-dotted border-gray-600 text-md ${columnId === requiredColumnId && detailPagePath ? 'cursor-pointer' : ''}`}
                                                onClick={columnId === requiredColumnId && detailPagePath ? (e) => {
                                                    if (e.target === lastClickedElement.current) {
                                                        e.stopPropagation(); // Prevent navigation
                                                        lastClickedElement.current = null; // Reset for next time
                                                        return;
                                                    }
                                                    navigate(detailPagePath.replace(':id', item[idKey]));
                                                } : undefined}
                                                title={columnId === requiredColumnId && detailPagePath ? `View ${itemDesc} details` : undefined}
                                            >
                                                <div className="flex justify-between items-center w-full">
                                                    <span>{renderCell(item, columnId, isLastVisibleColumn)}</span>
                                                    {isLastVisibleColumn && (editHandler || deleteHandler) && (
                                                        <div className="flex items-center">
                                                            {editHandler && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); editHandler(item); }}
                                                                    className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 mr-2"
                                                                    title={`Edit ${itemDesc}`}
                                                                >
                                                                    <Icon path={mdiPlaylistEdit} size={0.7} />
                                                                </button>
                                                            )}
                                                            {deleteHandler && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); deleteHandler(item); }}
                                                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-600"
                                                                    title={`Delete ${itemDesc}`}
                                                                >
                                                                    <Icon path={mdiTrashCan} size={0.7} />
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
                            onChange={(e) => { e.stopPropagation(); e.preventDefault(); handleLimitChange(e); }}
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
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); handlePageChange(1); }}
                        disabled={page === 1}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        First
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); handlePageChange(page - 1); }}
                        disabled={page === 1}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="px-3 py-1">
                        Page {page} of {Math.ceil(total / limit)}
                    </span>
                    <button
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); handlePageChange(page + 1); }}
                        disabled={page >= Math.ceil(total / limit)}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Next
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); handlePageChange(Math.ceil(total / limit)); }}
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

export default GenericList; 