import { ColumnDef } from '@tanstack/react-table';

import type { RouteConfig } from '@/types';
import type { SelectOption, FilterType } from '@shared/static-data';

// Filter value types
export interface FilterMultiValue {
    values: (string | number)[];
    logicType: 'and' | 'or';
}

export interface FilterValue {
    id: string;
    value?: string | number | boolean | FilterMultiValue | null;
    type?: 'toggle_text_input';
}

export interface FilterConfig {
    filterType?: FilterType;
    options?: SelectOption[] | ((columnFilters: FilterValue[]) => SelectOption[]);
    placeholder?: string;
    required?: boolean;
    truncate?: number;
    isMarkdown?: boolean;
}

// Data item interface
export interface DataItem {
    [key: string]: string | number | boolean | null | undefined;
    id: string | number;
}

// Generic delete service function type
export type DeleteServiceFunction = (id: number | string) => Promise<void>;

// Utility functions to create delete service functions
export const createDeleteServiceFunction = (
    serviceMethod: (params: undefined, idParams: Record<string, number | string>) => Promise<unknown>,
    idParamName: 'id' | 'slug' = 'id'
): DeleteServiceFunction => {
    return async (id: number | string) => {
        const params = idParamName === 'id'
            ? { [idParamName]: Number(id) }
            : { [idParamName]: String(id) };
        await serviceMethod(undefined, params);
    };
};

export const createIdDeleteServiceFunction = (
    serviceMethod: (params: undefined, idParams: { id: number }) => Promise<unknown>
): DeleteServiceFunction => {
    return createDeleteServiceFunction(serviceMethod, 'id');
};

export const createSlugDeleteServiceFunction = (
    serviceMethod: (params: undefined, slugParams: { slug: string }) => Promise<unknown>
): DeleteServiceFunction => {
    return createDeleteServiceFunction(serviceMethod, 'slug');
};

// Generic function types for actions
export type DetailFunction<T> = (item: T) => void;
export type EditFunction<T> = (item: T) => void;
export type DeleteFunction<T> = (item: T) => Promise<void>;

// Functions object for GenericList
export interface GenericListFunctions<T> {
    detail?: DetailFunction<T>;
    edit?: EditFunction<T>;
    delete?: DeleteFunction<T>;
}

export interface GenericListProps<T> {
    storageKey?: string;
    columns: ColumnDef<T, unknown>[];
    serviceFunction: () => Promise<{ results: T[]; total: number }>;
    itemDesc?: string;
    initialLimit?: number;
    routes?: RouteConfig[];
    functions?: GenericListFunctions<T>; // NEW: Callback functions for actions
    deleteServiceFunction?: DeleteServiceFunction;
    basePath?: string; // Optional base path prefix for navigation links (e.g., '/admin')

    // Selection props
    isOptionSelector?: boolean;
    selectedIds?: (string | number)[];
    onSelectedIdsChange?: (selectedIds: (string | number)[]) => void;
}

export interface GenericListColumnMeta {
    required?: boolean;
    filterType?: FilterType;
    options?: SelectOption[];
    placeholder?: string;
    truncate?: number; // Number of characters to truncate to
    isMarkdown?: boolean; // Whether to wrap content in ProcessMarkdown
}
