import type { SelectOption } from '@shared/static-data';
import { ColumnDef } from '@tanstack/react-table';

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

export interface GenericListProps<T> {
    storageKey?: string;
    columns: ColumnDef<T, any>[];
    serviceFunction: () => Promise<{ results: T[]; total: number }>;
    itemDesc?: string;
    initialLimit?: number;
}

export interface GenericListColumnMeta {
    required?: boolean;
    filterType?: FilterType;
    options?: SelectOption[];
    placeholder?: string;
}
