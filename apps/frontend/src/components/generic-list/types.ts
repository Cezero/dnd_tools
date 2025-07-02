import React from 'react';

// Column definition interface
export interface ColumnDefinition {
    label: string;
    sortable?: boolean;
    filterable?: boolean;
    filterType?: 'input' | 'select' | 'multi-select' | 'boolean';
    alwaysVisible?: boolean;
    dynamicFilter?: boolean;
    multiColumn?: string[];
    paramName?: string;
    filterLabel?: string;
}

// Filter value discriminated union
export type FilterValue =
    | { type: 'input'; value: string }
    | { type: 'select'; value: string | number | null }
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

// Filter component props
export interface FilterComponentProps {
    selected?: string | boolean | string[];
    onChange: (value: string | boolean | string[]) => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    logicType?: string;
    onLogicChange?: (logic: string) => void;
    value?: boolean;
    onToggle?: (value: boolean) => void;
    dynamic?: boolean;
    dynamicFilterDelay?: number;
    multiColumn?: string[];
    appendClassName?: string;
    id?: string;
}

// Filter option interface
export interface FilterOption {
    component: React.ComponentType<FilterComponentProps>;
    props?: Partial<FilterComponentProps>;
}

// GenericList props interface
export interface GenericListProps<T = DataItem> {
    // Configuration props
    storageKey: string;
    defaultColumns: string[];
    columnDefinitions: Record<string, ColumnDefinition>;
    requiredColumnId: string;
    fetchData: (params: URLSearchParams) => Promise<{ data: T[]; total: number }>;
    renderCell: (item: T, columnId: string, isLastVisibleColumn?: boolean) => React.ReactNode;
    filterOptions?: Record<string, FilterOption>;

    // Routing props
    detailPagePath?: string;
    idKey?: string;
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
    requiredColumnId: string;
}

// MultiSelect option interface
export interface MultiSelectOption {
    [key: string]: string | number;
}

// MultiSelect props interface
export interface MultiSelectProps {
    options: MultiSelectOption[];
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

// SingleSelect option interface
export interface SingleSelectOption {
    [key: string]: string | number;
}

// SingleSelect props interface
export interface SingleSelectProps {
    options: SingleSelectOption[];
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

// BooleanInput props interface
export interface BooleanInputProps {
    value?: boolean | number | null;
    onToggle: (value: boolean | number | null) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    className?: string;
    appendClassName?: string;
}

// TextInput props interface
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