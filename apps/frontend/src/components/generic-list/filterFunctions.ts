import { filterFns } from '@tanstack/react-table';

// Generic filter function for arrays of objects with a specific ID field
// Also handles single values by treating them as single-element arrays
export const createArrayIdFilter = (idField: string) => (row: any, columnId: string, filterValue: any) => {
    const value = row.getValue(columnId);

    // Handle null/undefined values
    if (!value) {
        return false;
    }

    // Extract the IDs - handle both single values and arrays
    let ids: any[];
    if (Array.isArray(value)) {
        // If it's an array of objects, extract the IDs
        ids = value.map((item: any) => item[idField]);
    } else {
        // If it's a single value, treat it as a single-element array
        ids = [value];
    }

    // Handle the custom filter structure used by GenericList
    // filterValue can be either a direct value or an object with { id, value }
    let actualFilterValue = filterValue;
    if (filterValue && typeof filterValue === 'object' && 'value' in filterValue) {
        actualFilterValue = filterValue.value;
    }

    // Handle multi-select structure with values and logicType
    if (actualFilterValue && typeof actualFilterValue === 'object' && 'values' in actualFilterValue) {
        const { values, logicType = 'or' } = actualFilterValue;

        if (!Array.isArray(values) || values.length === 0) {
            return false;
        }

        if (logicType === 'and') {
            // For AND logic, ALL filter values must match
            return values.every((filterId: any) => ids.includes(filterId));
        } else {
            // For OR logic (default), ANY filter value must match
            return values.some((filterId: any) => ids.includes(filterId));
        }
    }

    // Handle array of filter values (multi-select without logicType)
    if (Array.isArray(actualFilterValue)) {
        // For multi-select, check if ANY of the filter values match ANY of the row's IDs
        // This implements OR logic for the filter values
        return actualFilterValue.some((filterId: any) => ids.includes(filterId));
    }

    // Handle single filter value
    return ids.includes(actualFilterValue);
};

// Generic exact match filter
export const createEqualsFilter = () => (row: any, columnId: string, filterValue: any) => {
    const value = row.getValue(columnId);

    // Handle the custom filter structure
    let actualFilterValue = filterValue;
    if (filterValue && typeof filterValue === 'object' && 'value' in filterValue) {
        actualFilterValue = filterValue.value;
    }

    return value === actualFilterValue;
};

// Generic case-insensitive contains filter
export const createContainsFilter = () => (row: any, columnId: string, filterValue: any) => {
    const value = row.getValue(columnId);

    // Handle the custom filter structure
    let actualFilterValue = filterValue;
    if (filterValue && typeof filterValue === 'object' && 'value' in filterValue) {
        actualFilterValue = filterValue.value;
    }

    // Handle string values (from text input)
    if (typeof actualFilterValue === 'string') {
        if (!value || !actualFilterValue.trim()) return true;
        return value.toLowerCase().includes(actualFilterValue.toLowerCase());
    }

    // Handle other types
    if (!value || !actualFilterValue) return true;
    return value.toLowerCase().includes(String(actualFilterValue).toLowerCase());
};

// Extend the default filterFns with our generic ones
export const extendedFilterFns = {
    ...filterFns,
    createArrayIdFilter,
    createEqualsFilter,
    createContainsFilter,
}; 
