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

/**
 * Validates and fixes column order to ensure it matches the current column definitions
 * @param storedOrder - The column order from localStorage
 * @param validColumns - The current valid column IDs
 * @returns A valid column order array
 */
function validateAndFixColumnOrder(storedOrder: string[], validColumns: string[]): string[] {
    // If no stored order, return the default
    if (!storedOrder || storedOrder.length === 0) {
        return validColumns;
    }

    // Filter out invalid columns (columns that no longer exist)
    const validStoredColumns = storedOrder.filter(columnId => validColumns.includes(columnId));

    // Find missing columns (new columns that weren't in the stored order)
    const missingColumns = validColumns.filter(columnId => !storedOrder.includes(columnId));

    // Combine valid stored columns with missing columns
    const fixedOrder = [...validStoredColumns, ...missingColumns];

    // If the order is significantly different, log a warning
    if (validStoredColumns.length !== storedOrder.length || missingColumns.length > 0) {
        console.warn(`Column order validation fixed ${storedOrder.length - validStoredColumns.length} invalid columns and added ${missingColumns.length} missing columns for storage key`);
    }

    return fixedOrder;
}

/**
 * Validates and fixes column visibility state to remove references to non-existent columns
 * @param storedVisibility - The column visibility state from localStorage
 * @param validColumns - The current valid column IDs
 * @returns A valid column visibility state
 */
function validateAndFixColumnVisibility(storedVisibility: VisibilityState, validColumns: string[]): VisibilityState {
    const fixedVisibility: VisibilityState = {};
    let removedCount = 0;

    for (const [columnId, isVisible] of Object.entries(storedVisibility)) {
        if (validColumns.includes(columnId)) {
            fixedVisibility[columnId] = isVisible;
        } else {
            removedCount++;
        }
    }

    if (removedCount > 0) {
        console.warn(`Column visibility validation removed ${removedCount} invalid column references for storage key`);
    }

    return fixedVisibility;
}

/**
 * Validates and fixes column sizing state to remove references to non-existent columns
 * @param storedSizing - The column sizing state from localStorage
 * @param validColumns - The current valid column IDs
 * @returns A valid column sizing state
 */
function validateAndFixColumnSizing(storedSizing: ColumnSizingState, validColumns: string[]): ColumnSizingState {
    const fixedSizing: ColumnSizingState = {};
    let removedCount = 0;

    for (const [columnId, size] of Object.entries(storedSizing)) {
        if (validColumns.includes(columnId)) {
            fixedSizing[columnId] = size;
        } else {
            removedCount++;
        }
    }

    if (removedCount > 0) {
        console.warn(`Column sizing validation removed ${removedCount} invalid column references for storage key`);
    }

    return fixedSizing;
}

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

                // Validate and fix column visibility
                if (parsed.columnVisibility) {
                    const validatedVisibility = validateAndFixColumnVisibility(parsed.columnVisibility, defaultColumnOrder);
                    setColumnVisibility(validatedVisibility);
                }

                if (parsed.columnFilters) {
                    setColumnFilters(parsed.columnFilters);
                }
                if (parsed.sorting) setSorting(parsed.sorting);

                // Validate and fix column sizing
                if (parsed.columnSizing) {
                    const validatedSizing = validateAndFixColumnSizing(parsed.columnSizing, defaultColumnOrder);
                    setColumnSizing(validatedSizing);
                }

                if (parsed.columnOrder && parsed.columnOrder.some(id => id === null || id === '')) {
                    throw new Error('Corrupted column order');
                }
                if (parsed.columnOrder) {
                    // Validate and fix the column order against current column definitions
                    const validatedOrder = validateAndFixColumnOrder(parsed.columnOrder, defaultColumnOrder);
                    setColumnOrder(validatedOrder);
                }
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
