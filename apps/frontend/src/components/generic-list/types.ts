import React from 'react';
import { z } from 'zod';
import type { SelectOption } from '@shared/static-data';

// Filter value discriminated union
export type FilterValue =
    | { type: 'input'; value: string }
    | { type: 'single-select'; value: string | number | null }
    | { type: 'multi-select'; value: { values: string[]; logic: 'or' | 'and' } }
    | { type: 'boolean'; value: boolean | null };

// Filter state interface
export interface FilterState {
    [key: string]: FilterValue;
}

// Data item interface
export interface DataItem {
    [key: string]: string | number | boolean | null | undefined;
    id: string | number;
}

// Base filter component props that all filter types share
export interface BaseFilterComponentProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    dynamic?: boolean;
    dynamicFilterDelay?: number;
    multiColumn?: string[];
    appendClassName?: string;
    id?: string;
    className?: string;
}

// Input filter component props
export interface InputFilterComponentProps extends BaseFilterComponentProps {
    selected?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
}

// Boolean filter component props
export interface BooleanFilterComponentProps extends BaseFilterComponentProps {
    value?: boolean | null;
    onToggle: (value: boolean) => void;
}

// Single select filter component props
export interface SingleSelectFilterComponentProps extends BaseFilterComponentProps {
    options: SelectOption[];
    displayKey?: string;
    valueKey?: string;
    selected?: string | number | null;
    onChange: (value: string | number | null) => void;
    placeholder?: string;
}

// Multi select filter component props
export interface MultiSelectFilterComponentProps extends BaseFilterComponentProps {
    options: SelectOption[];
    displayKey?: string;
    valueKey?: string;
    selected: (string | number)[];
    onChange: (values: (string | number)[]) => void;
    logicType?: 'or' | 'and';
    onLogicChange?: (logic: 'or' | 'and') => void;
}

// Filter type enum - determines which component to use
export type FilterType = 'text-input' | 'single-select' | 'boolean' | 'multi-select';

// Filter configuration for different filter types
export type FilterConfig =
    | {
        type: 'text-input';
        props?: Partial<InputFilterComponentProps>;
    }
    | {
        type: 'boolean';
        props?: Partial<BooleanFilterComponentProps>;
    }
    | {
        type: 'single-select';
        props: Partial<SingleSelectFilterComponentProps> & {
            options: SelectOption[];
            displayKey?: string;
            valueKey?: string;
        };
    }
    | {
        type: 'multi-select';
        props: Partial<MultiSelectFilterComponentProps> & {
            options: SelectOption[];
            displayKey?: string;
            valueKey?: string;
        };
    };

// Column definition interface - now includes filter configuration
export interface ColumnDefinition {
    label: string;
    sortable?: boolean; // Defaults to false
    alwaysVisible?: boolean;
    dynamicFilter?: boolean;
    multiColumn?: string[];
    paramName?: string;
    filterLabel?: string;
    isDefault?: boolean; // Defaults to false
    isRequired?: boolean; // Defaults to false - whether this column is required for navigation
    // Filter configuration - presence makes column filterable, type determines filter type
    filterConfig?: FilterConfig;
}

// GenericList props interface - simplified to use column definitions only
export interface GenericListProps<T = DataItem> {
    // Configuration props
    storageKey: string;
    columnDefinitions: Record<string, ColumnDefinition>;
    querySchema: z.ZodSchema<unknown>;
    serviceFunction: (queryParams: unknown) => Promise<{ results: T[]; total: number }>;
    renderCell: (item: T, columnId: string, isLastVisibleColumn?: boolean) => React.ReactNode;

    // Routing props
    detailPagePath?: string;
    itemDesc?: string;
    dynamicFilterDelay?: number;
    initialLimit?: number;
    isColumnConfigurable?: boolean;

    // Option selector props
    isOptionSelector?: boolean;
    selectedIds?: (string | number)[];
    onSelectedIdsChange?: (ids: (string | number)[]) => void;
    editHandler?: (item: T) => void;
    deleteHandler?: (item: T) => void;
}

// Column config hook return type
export interface UseColumnConfigReturn {
    visibleColumns: string[];
    setVisibleColumns: React.Dispatch<React.SetStateAction<string[]>>;
}

// Column config modal props
export interface ColumnConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    visibleColumns: string[];
    setVisibleColumns: React.Dispatch<React.SetStateAction<string[]>>;
    columnDefinitions: Record<string, ColumnDefinition>;
}

// Prop interfaces for the actual filter components
export interface MultiSelectProps {
    options: SelectOption[];
    displayKey: string;
    valueKey: string;
    selected: (string | number)[];
    onChange: (values: (string | number)[]) => void;
    className?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    logicType?: 'or' | 'and';
    onLogicChange?: (logic: 'or' | 'and') => void;
    appendClassName?: string;
}

export interface SingleSelectProps {
    options: SelectOption[];
    displayKey: string;
    valueKey: string;
    selected?: string | number | null;
    onChange: (value: string | number | null) => void;
    placeholder?: string;
    className?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appendClassName?: string;
}

export interface TextInputProps {
    onChange: (value: string) => void;
    className?: string;
    selected?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    dynamic?: boolean;
    dynamicFilterDelay?: number;
    placeholder?: string;
    type?: string;
    appendClassName?: string;
}

export interface BooleanInputProps {
    value?: boolean | number | null;
    onToggle: (value: boolean | number | null) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    className?: string;
    appendClassName?: string;
}
