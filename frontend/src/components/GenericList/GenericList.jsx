import React, { useState, useEffect, useRef } from 'react';
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
        initialFilters[key] = searchParams.get(key) || '';
    }
    const [filters, setFilters] = useState(initialFilters);

    const [displayFilter, setDisplayFilter] = useState(''); // Which filter is currently open
    const [visibleColumns, setVisibleColumns] = useColumnConfig(storageKey, defaultColumns, columnDefinitions, requiredColumnId);
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    const thRefs = useRef({});
    const lastClickedElement = useRef(null);

    useEffect(() => {
        const params = new URLSearchParams({
            page,
            limit,
            sort: sortKey,
            order: sortOrder,
        });

        // Add all generic filters to params
        for (const key in filters) {
            if (filters[key]) {
                params.set(key, filters[key]);
            }
        }

        setIsLoading(true);
        fetchData(params)
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
    }, [page, limit, sortKey, sortOrder, filters, fetchData]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (displayFilter && thRefs.current[displayFilter] && !thRefs.current[displayFilter].contains(event.target)) {
                setDisplayFilter('');
                lastClickedElement.current = event.target; // Store the element that closed the filter
            }
        };

        document.addEventListener('mousedown', handleClickOutside, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside, true);
        };
    }, [displayFilter]);

    const handleFilterChange = (filterKey, value) => {
        setFilters(prev => ({
            ...prev,
            [filterKey]: value
        }));
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (value) {
                newParams.set(filterKey, value);
            } else {
                newParams.delete(filterKey);
            }
            // Ensure current page, limit, sort, order are preserved
            newParams.set('page', '1'); // Reset to first page on filter change
            return newParams;
        });
        // Optionally, close filter dropdown after selection if it's a select
        if (filterOptions[filterKey]?.type === 'select') {
            setDisplayFilter('');
        }
    };

    const toggleFilter = (columnId) => {
        setDisplayFilter(displayFilter === columnId ? '' : columnId);
    };

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
        setSearchParams({ page: newPage, limit: newLimit, sort: sortKey, order: sortOrder, ...filters });
    };

    const handlePageChange = (newPage) => {
        setSearchParams({ page: newPage, limit, sort: sortKey, order: sortOrder, ...filters });
    };

    const renderColumnHeader = (columnId, isLastColumn) => {
        const column = columnDefinitions[columnId];
        if (!column) return null;

        const isFiltered = !!filters[columnId]; // Check if a filter is applied to this column

        return (
            <th
                key={columnId}
                ref={el => (thRefs.current[columnId] = el)}
                onClick={() => {
                    if (displayFilter !== columnId && column.sortable) {
                        handleSort(columnId);
                    }
                }}
                className={`border-b p-1 text-left text-md border-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-white ${column.sortable ? 'cursor-pointer' : ''}`}
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
                    <div className="absolute mt-2 p-1 bg-opacity-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg" onClick={(e) => e.stopPropagation()}>
                        {React.createElement(filterOptions[columnId].component, {
                            value: filters[columnId],
                            onChange: (e) => handleFilterChange(columnId, e.target.value),
                            ...filterOptions[columnId].props,
                            className: "p-1 border rounded w-full dark:bg-gray-800 text-sm" // Apply common styles here
                        })}
                    </div>
                )}
            </th>
        );
    };

    if (isLoading) {
        return <div className="p-4 bg-white text-black dark:bg-[#121212] dark:text-white min-h-screen">Loading...</div>;
    }

    return (
        <div className="p-4 bg-white text-black dark:bg-[#121212] dark:text-white min-h-screen">
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