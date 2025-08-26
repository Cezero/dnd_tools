import type {
    VisibilityState,
    ColumnFiltersState,
    SortingState,
    ColumnSizingState,
    PaginationState,
} from '@tanstack/react-table';
import { useEffect, useState } from 'react';

export type TableConfig = {
    columnVisibility: VisibilityState;
    columnFilters: ColumnFiltersState;
    sorting: SortingState;
    columnSizing: ColumnSizingState;
    columnOrder: string[];
    pagination: PaginationState;
};

export function usePersistentTableState(
    storageKey: string,
    defaultColumnOrder: string[],
    defaultPageSize: number = 20
) {
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
    const [columnOrder, setColumnOrder] = useState<string[]>(defaultColumnOrder);
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: defaultPageSize,
    });
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                const parsed: Partial<TableConfig> = JSON.parse(saved);
                if (parsed.columnVisibility) setColumnVisibility(parsed.columnVisibility);
                if (parsed.columnFilters) {
                    setColumnFilters(parsed.columnFilters);
                }
                if (parsed.sorting) setSorting(parsed.sorting);
                if (parsed.columnSizing) setColumnSizing(parsed.columnSizing);
                if (parsed.columnOrder && parsed.columnOrder.some(id => id === null || id === '')) {
                    throw new Error('Corrupted column order');
                }
                if (parsed.columnOrder) setColumnOrder(parsed.columnOrder);
                if (parsed.pagination) {
                    // Only restore pagination if it's valid
                    if (typeof parsed.pagination.pageSize === 'number' && parsed.pagination.pageSize > 0) {
                        setPagination(parsed.pagination);
                    }
                }
            } catch (e) {
                console.warn(`Invalid table config in localStorage for key "${storageKey}"`, e);
                localStorage.removeItem(storageKey);
                setColumnOrder(defaultColumnOrder);
                setPagination({
                    pageIndex: 0,
                    pageSize: defaultPageSize,
                });
            }
        }
        setIsLoaded(true);
    }, [storageKey, defaultColumnOrder, defaultPageSize]);

    // Save to localStorage when any piece changes (but only after initial load)
    useEffect(() => {
        if (!isLoaded) {
            return;
        }

        const config: TableConfig = {
            columnVisibility,
            columnFilters,
            sorting,
            columnSizing,
            columnOrder,
            pagination,
        };
        localStorage.setItem(storageKey, JSON.stringify(config));
    }, [columnVisibility, columnFilters, sorting, columnSizing, columnOrder, pagination, storageKey, isLoaded]);

    // Optional reset helper
    const resetTableState = () => {
        localStorage.removeItem(storageKey);
        setColumnVisibility({});
        setColumnFilters([]);
        setSorting([]);
        setColumnSizing({});
        setColumnOrder(defaultColumnOrder);
        setPagination({
            pageIndex: 0,
            pageSize: defaultPageSize,
        });
    };

    return {
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
        resetTableState,
    };
}
