import { filterFns, type Row } from '@tanstack/react-table';

// Type for the filter value that can be passed to filter functions
// This matches the @tanstack/react-table filter function signature
type TableFilterValue = string | number | boolean | (string | number)[] | { values: (string | number)[]; logicType?: 'and' | 'or' } | null | undefined;

// Type for our custom filter structure that wraps the table filter value
interface CustomFilterValue {
    id: string;
    value?: TableFilterValue;
    type?: 'toggle_text_input';
}

// Generic filter function for arrays of objects with a specific ID field
// Also handles single values by treating them as single-element arrays
export const createArrayIdFilter = (idField: string) => {
    const filterFn = (row: Row<unknown>, columnId: string, filterValue: TableFilterValue | CustomFilterValue) => {
        const value = row.getValue(columnId);

        // Handle null/undefined values
        if (!value) {
            return false;
        }

        // Extract the IDs - handle both single values and arrays
        let ids: (string | number)[];
        if (Array.isArray(value)) {
            // If it's an array of objects, extract the IDs
            ids = value.map((item: Record<string, unknown>) => item[idField] as string | number);
        } else {
            // If it's a single value, treat it as a single-element array
            ids = [value as string | number];
        }

        // Handle the custom filter structure used by GenericList
        // filterValue can be either a direct value or an object with { id, value }
        let actualFilterValue = filterValue;
        if (filterValue && typeof filterValue === 'object' && 'value' in filterValue) {
            actualFilterValue = (filterValue as CustomFilterValue).value;
        }

        // Handle multi-select structure with values and logicType
        if (actualFilterValue && typeof actualFilterValue === 'object' && 'values' in actualFilterValue) {
            const { values, logicType = 'or' } = actualFilterValue as { values: (string | number)[]; logicType?: 'and' | 'or' };

            if (!Array.isArray(values) || values.length === 0) {
                return false;
            }

            if (logicType === 'and') {
                // For AND logic, ALL filter values must match
                return values.every((filterId: string | number) => ids.includes(filterId));
            } else {
                // For OR logic (default), ANY filter value must match
                return values.some((filterId: string | number) => ids.includes(filterId));
            }
        }

        // Handle array of filter values (multi-select without logicType)
        if (Array.isArray(actualFilterValue)) {
            // For multi-select, check if ANY of the filter values match ANY of the row's IDs
            // This implements OR logic for the filter values
            return actualFilterValue.some((filterId: string | number) => ids.includes(filterId));
        }

        // Handle single filter value
        if (actualFilterValue !== null && actualFilterValue !== undefined) {
            return ids.includes(actualFilterValue as string | number);
        }

        return false;
    };

    // Add autoRemove behavior - remove filter if no values are selected
    filterFn.autoRemove = (val: TableFilterValue | CustomFilterValue) => {
        if (val && typeof val === 'object' && 'values' in val) {
            return !val.values || val.values.length === 0;
        }
        return !val;
    };

    return filterFn;
};

// Generic exact match filter
export const createEqualsFilter = () => {
    const filterFn = (row: Row<unknown>, columnId: string, filterValue: TableFilterValue | CustomFilterValue) => {
        const value = row.getValue(columnId);

        // Handle the custom filter structure
        let actualFilterValue = filterValue;
        if (filterValue && typeof filterValue === 'object' && 'value' in filterValue) {
            actualFilterValue = (filterValue as CustomFilterValue).value;
        }

        return value === actualFilterValue;
    };

    // Add autoRemove behavior - remove filter if value is falsy
    filterFn.autoRemove = (val: TableFilterValue | CustomFilterValue) => !val;

    return filterFn;
};

// Generic case-insensitive contains filter
export const createContainsFilter = () => {
    const filterFn = (row: Row<unknown>, columnId: string, filterValue: TableFilterValue | CustomFilterValue) => {
        const value = row.getValue(columnId);

        // Handle the custom filter structure
        let actualFilterValue = filterValue;
        if (filterValue && typeof filterValue === 'object' && 'value' in filterValue) {
            actualFilterValue = (filterValue as CustomFilterValue).value;
        }

        // Handle string values (from text input)
        if (typeof actualFilterValue === 'string') {
            if (!value || !actualFilterValue.trim()) return true;
            return String(value).toLowerCase().includes(actualFilterValue.toLowerCase());
        }

        // Handle other types
        if (!value || !actualFilterValue) return true;
        return String(value).toLowerCase().includes(String(actualFilterValue).toLowerCase());
    };

    // Add autoRemove behavior - remove filter if value is empty or whitespace
    filterFn.autoRemove = (val: TableFilterValue | CustomFilterValue) => !val || (typeof val === 'string' && !val.trim());

    // Add resolveFilterValue to normalize the input
    filterFn.resolveFilterValue = (val: TableFilterValue | CustomFilterValue) => {
        if (typeof val === 'string') {
            return val.toLowerCase().trim();
        }
        return val;
    };

    return filterFn;
};

// Extend the default filterFns with our generic ones
export const extendedFilterFns = {
    ...filterFns,
    createArrayIdFilter,
    createEqualsFilter,
    createContainsFilter,
}; 
