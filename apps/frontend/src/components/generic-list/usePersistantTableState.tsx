import { useEffect, useState } from 'react';
import type {
    VisibilityState,
    ColumnFiltersState,
    SortingState,
    ColumnSizingState,
} from '@tanstack/react-table';

export type TableConfig = {
    columnVisibility: VisibilityState;
    columnFilters: ColumnFiltersState;
    sorting: SortingState;
    columnSizing: ColumnSizingState;
    columnOrder: string[];
};

export function usePersistentTableState(storageKey: string, defaultColumnOrder: string[]) {
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
    const [columnOrder, setColumnOrder] = useState<string[]>(defaultColumnOrder);
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
            } catch (e) {
                console.warn(`Invalid table config in localStorage for key "${storageKey}"`, e);
                localStorage.removeItem(storageKey);
                setColumnOrder(defaultColumnOrder);
            }
        }
        setIsLoaded(true);
    }, [storageKey]);

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
        };
        localStorage.setItem(storageKey, JSON.stringify(config));
    }, [columnVisibility, columnFilters, sorting, columnSizing, columnOrder, storageKey, isLoaded]);

    // Optional reset helper
    const resetTableState = () => {
        localStorage.removeItem(storageKey);
        setColumnVisibility({});
        setColumnFilters([]);
        setSorting([]);
        setColumnSizing({});
        setColumnOrder(defaultColumnOrder);
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
        resetTableState,
    };
}
