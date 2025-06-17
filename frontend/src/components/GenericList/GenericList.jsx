import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Icon from '@mdi/react';
import { mdiFilterOutline, mdiSortAscending, mdiSortDescending, mdiCog, mdiFilter } from '@mdi/js';
import { ColumnConfigModal, useColumnConfig } from '@/components/GenericList/ColumnConfig';

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
}) {
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [searchParams, setSearchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(true);

    const page = parseInt(searchParams.get('page') || '1');
    const [limit, setLimit] = useState(parseInt(searchParams.get('limit') || '20'));
    const [sortKey, setSortKey] = useState(searchParams.get('sort') || '');
    const [sortOrder, setSortOrder] = useState(searchParams.get('order') || 'asc');

    // Initialize filters directly from search params
    const initialFilters = {};
    for (const key in filterOptions) {
        const paramValue = searchParams.get(key);
        const filterType = columnDefinitions[key]?.filterType;
        if (filterType === 'multi-select') {
            const values = paramValue
                ? paramValue.split(',')
                    .filter(val => val !== '')
                    .map(val => {
                        const num = Number(val);
                        return isNaN(num) ? val : num;
                    })
                : [];
            const logic = searchParams.get(`${key}_logic`) || 'or';
            initialFilters[key] = { values, logic };
        } else {
            initialFilters[key] = paramValue || '';
        }
    }
    const [filters, setFilters] = useState(initialFilters);

    const [displayFilter, setDisplayFilter] = useState(''); // Which filter is currently open
    const [activeMultiSelectFilterId, setActiveMultiSelectFilterId] = useState(null); // For controlled multi-select open state
    const [visibleColumns, setVisibleColumns] = useColumnConfig(storageKey, defaultColumns, columnDefinitions, requiredColumnId);
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    const thRefs = useRef({});
    const lastClickedElement = useRef(null);

    useEffect(() => {
        const currentSearchParams = new URLSearchParams(searchParams.toString());
        setIsLoading(true);
        fetchData(currentSearchParams)
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
    }, [searchParams, fetchData]);

    // New useEffect to sync filters state with URL search params
    useEffect(() => {
        const newParams = new URLSearchParams();
        newParams.set('page', page.toString());
        newParams.set('limit', limit.toString());
        if (sortKey) newParams.set('sort', sortKey);
        if (sortOrder) newParams.set('order', sortOrder);

        for (const key in filters) {
            const filterType = columnDefinitions[key]?.filterType;
            if (filterType === 'multi-select') {
                if (filters[key]?.values && filters[key].values.length > 0) {
                    newParams.set(key, filters[key].values.join(','));
                    if (filters[key]?.logic) {
                        newParams.set(`${key}_logic`, filters[key].logic);
                    }
                }
            } else if (filters[key] !== '') {
                newParams.set(key, filters[key]);
            }
        }
        console.log('[useEffect - filters changed] Setting URLSearchParams:', newParams.toString());
        setSearchParams(newParams);
    }, [filters, page, limit, sortKey, sortOrder, setSearchParams, columnDefinitions]);

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
            } else {
                newFilters[filterKey] = value;
            }
            console.log(`[handleFilterChange] Setting filters for ${filterKey}:`, newFilters[filterKey]);
            return newFilters; // Only return the newFilters state
        });

        // Optionally, close single-select dropdowns immediately
        const filterType = columnDefinitions[filterKey]?.filterType;
        if (filterType === 'select') {
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
            setDisplayFilter(''); // Close the filter
        } else { // Filter is opening
            if (filterType === 'multi-select') {
                setActiveMultiSelectFilterId(columnId);
            }
            setDisplayFilter(columnId);
        }
    }, [displayFilter, columnDefinitions]);

    const handleSort = (key) => {
        if (sortKey === key) {
            if (sortOrder === 'asc') {
                setSortOrder('desc');
                setSearchParams(prev => {
                    prev.set('order', 'desc');
                    return prev;
                });
            } else if (sortOrder === 'desc') {
                setSortKey('');
                setSortOrder('asc');
                setSearchParams(prev => {
                    prev.delete('sort');
                    prev.set('order', 'asc');
                    return prev;
                });
            }
        } else {
            setSortKey(key);
            setSortOrder('asc');
            setSearchParams(prev => {
                prev.set('sort', key);
                prev.set('order', 'asc');
                return prev;
            });
        }
    };

    const handleLimitChange = (e) => {
        const newLimit = parseInt(e.target.value);
        setLimit(newLimit);

        const newTotalPages = Math.ceil(total / newLimit);
        const newPage = Math.min(page, newTotalPages || 1);

        const newParams = new URLSearchParams();
        newParams.set('page', newPage.toString());
        newParams.set('limit', newLimit.toString());
        if (sortKey) newParams.set('sort', sortKey);
        if (sortOrder) newParams.set('order', sortOrder);
        for (const key in filters) {
            const filterType = columnDefinitions[key]?.filterType;
            if (filterType === 'multi-select') {
                if (filters[key]?.values && filters[key].values.length > 0) {
                    newParams.set(key, filters[key].values.join(','));
                    if (filters[key]?.logic) {
                        newParams.set(`${key}_logic`, filters[key].logic);
                    }
                }
            } else if (filters[key] !== '') { // For single-selects/inputs, check if value is non-empty
                newParams.set(key, filters[key]);
            }
        }
        setSearchParams(newParams);
    };

    const handlePageChange = (newPage) => {
        const newParams = new URLSearchParams();
        newParams.set('page', newPage.toString());
        newParams.set('limit', limit.toString());
        if (sortKey) newParams.set('sort', sortKey);
        if (sortOrder) newParams.set('order', sortOrder);
        for (const key in filters) {
            const filterType = columnDefinitions[key]?.filterType;
            if (filterType === 'multi-select') {
                if (filters[key]?.values && filters[key].values.length > 0) {
                    newParams.set(key, filters[key].values.join(','));
                    if (filters[key]?.logic) {
                        newParams.set(`${key}_logic`, filters[key].logic);
                    }
                }
            } else if (filters[key] !== '') { // For single-selects/inputs, check if value is non-empty
                newParams.set(key, filters[key]);
            }
        }
        setSearchParams(newParams);
    };

    const renderColumnHeader = (columnId, isLastColumn) => {
        const column = columnDefinitions[columnId];
        if (!column) return null;

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
                className={`border-b p-1 text-left text-md border-gray-600 dark:border-gray-700 dark:bg-gray-900 ${column.sortable ? 'cursor-pointer' : ''}`}
                title={column.sortable ? (
                    sortKey === columnId ? (
                        sortOrder === 'asc' ? `Sort descending by ${column.label}` : `Clear sort for ${column.label}`
                    ) : `Sort ascending by ${column.label}`
                ) : undefined}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        {column.label}
                        {column.filterable && (
                            <button onClick={(e) => { e.stopPropagation(); toggleFilter(columnId); }} className="ml-2" title={`Filter by ${column.label}`}>
                                <Icon path={isFiltered ? mdiFilter : mdiFilterOutline} size={0.7} />
                            </button>
                        )}
                        {column.sortable && sortKey === columnId && (
                            <span className="ml-1">
                                {sortOrder === 'asc' ? (
                                    <Icon path={mdiSortAscending} size={0.7} />
                                ) : (
                                    <Icon path={mdiSortDescending} size={0.7} />
                                )}
                            </span>
                        )}
                    </div>
                    {isLastColumn && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsConfigOpen(true); }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors ml-2"
                            title="Configure columns"
                        >
                            <Icon path={mdiCog} size={0.7} />
                        </button>
                    )}
                </div>
                {displayFilter === columnId && column.filterable && filterOptions[columnId] && (
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
                        ...filterOptions[columnId].props,
                    })
                )}
            </th>
        );
    };

    if (isLoading) {
        return <div className="p-4 bg-white dark:bg-[#121212] min-h-screen">Loading...</div>;
    }

    return (
        <div className="p-4 bg-white dark:bg-[#121212] min-h-screen">
            <div className="relative">
                <table className="w-full border-collapse border border-solid border-gray-600">
                    <thead>
                        <tr>
                            {visibleColumns.map((columnId, index) =>
                                renderColumnHeader(columnId, index === visibleColumns.length - 1)
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(item => (
                            <tr key={item[idKey]} className="hover:bg-gray-100 dark:hover:bg-gray-800 odd:bg-gray-500 even:bg-white dark:odd:bg-[#141e2d] dark:even:bg-[#121212]">
                                {visibleColumns.map(columnId => (
                                    <td
                                        key={columnId}
                                        className={`p-1 border border-dotted border-gray-600 text-md ${columnId === requiredColumnId && detailPagePath ? 'cursor-pointer' : ''}`}
                                        onClick={columnId === requiredColumnId && detailPagePath ? (e) => {
                                            if (e.target === lastClickedElement.current) {
                                                e.stopPropagation(); // Prevent navigation
                                                lastClickedElement.current = null; // Reset for next time
                                                return;
                                            }
                                            navigate(detailPagePath.replace(':id', item[idKey]), { state: { fromListParams: searchParams.toString() } });
                                        } : undefined}
                                        title={columnId === requiredColumnId && detailPagePath ? `View ${requiredColumnId.replace(/_/g, ' ')} details` : undefined}
                                    >
                                        {renderCell(item, columnId)}
                                    </td>
                                ))}
                            </tr>
                        ))}
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
                            onChange={handleLimitChange}
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
                        onClick={() => handlePageChange(1)}
                        disabled={page === 1}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        First
                    </button>
                    <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="px-3 py-1">
                        Page {page} of {Math.ceil(total / limit)}
                    </span>
                    <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= Math.ceil(total / limit)}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Next
                    </button>
                    <button
                        onClick={() => handlePageChange(Math.ceil(total / limit))}
                        disabled={page >= Math.ceil(total / limit)}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Last
                    </button>
                </div>
            </div>
            <ColumnConfigModal
                isOpen={isConfigOpen}
                onClose={() => setIsConfigOpen(false)}
                visibleColumns={visibleColumns}
                setVisibleColumns={setVisibleColumns}
                columnDefinitions={columnDefinitions}
                requiredColumnId={requiredColumnId}
            />
        </div>
    );
}

export default GenericList; 