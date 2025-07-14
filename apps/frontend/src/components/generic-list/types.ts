import type { SelectOption } from '@shared/static-data';
import { ColumnDef } from '@tanstack/react-table';
import type { RouteConfig, RouteType } from '@/types';

export const PAGE_LIMITS: SelectOption[] = [
    { value: 10, label: '10' },
    { value: 20, label: '20' },
    { value: 40, label: '40' },
    { value: 80, label: '80' },
    { value: 160, label: '160' }
];

export enum FilterType {
    TEXT_INPUT = 'text-input',
    SINGLE_SELECT = 'single-select',
    MULTI_SELECT = 'multi-select',
    BOOLEAN = 'boolean'
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
    serviceMethod: (params: any, idParams: any) => Promise<any>,
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
    serviceMethod: (params: any, idParams: { id: number }) => Promise<any>
): DeleteServiceFunction => {
    return createDeleteServiceFunction(serviceMethod, 'id');
};

export const createSlugDeleteServiceFunction = (
    serviceMethod: (params: any, slugParams: { slug: string }) => Promise<any>
): DeleteServiceFunction => {
    return createDeleteServiceFunction(serviceMethod, 'slug');
};

export interface GenericListProps<T> {
    storageKey?: string;
    columns: ColumnDef<T, any>[];
    serviceFunction: () => Promise<{ results: T[]; total: number }>;
    itemDesc?: string;
    initialLimit?: number;
    routes?: RouteConfig[];
    deleteServiceFunction?: DeleteServiceFunction;
}

export interface GenericListColumnMeta {
    required?: boolean;
    filterType?: FilterType;
    options?: SelectOption[];
    placeholder?: string;
}
