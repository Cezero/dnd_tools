import React from 'react';

import { type ValidationState, useZodValidation } from '@/lib/hooks/useZodValidation';
import type { SourceMap } from '@shared/schema';
import { CoreComponent, SourceType, EditionId } from '@shared/static-data';

/**
 * Props for SourceEditor component
 */
export interface SourceEditorProps {
    sources: SourceMap[];
    onSourcesChange: (sources: SourceMap[]) => void;
    sourceType: SourceType;
    editionId?: EditionId;
    className?: string;
}

/**
 * Props for ValidatedInput component
 */
export interface ValidatedInputProps {
    field: string;
    label: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'textarea';
    required?: boolean;
    placeholder?: string;
    componentExtraClassName?: string;
    labelExtraClassName?: string;
    inputExtraClassName?: string;
    disabled?: boolean;
    min?: number;
    max?: number;
    step?: number;
    rows?: number;
    nested?: boolean;
}

/**
 * Props for ValidatedCustomCheckbox component
 */
export interface ValidatedCustomCheckboxProps {
    field: string;
    label?: string;
    required?: boolean;
    componentExtraClassName?: string;
    checkboxClassName?: string;
    labelClassName?: string;
    disabled?: boolean;
    id?: string;
    labelPosition?: 'left' | 'right';
    nested?: boolean;
}

/**
 * Props for ValidatedCustomSelect component
 */
export interface ValidatedCustomSelectProps<T extends CoreComponent> {
    field: string;
    options: T[];
    label?: string;
    required?: boolean;
    placeholder?: string;
    disabled?: boolean;
    componentExtraClassName?: string;
    triggerExtraClassName?: string;
    popupExtraClassName?: string;
    itemExtraClassName?: string;
    itemTextExtraClassName?: string;
    icon?: React.ReactNode;
    displayValue?: (value: number | null) => string;
    labelExtraClassName?: string;
    nested?: boolean;
}

/**
 * Props for ValidatedForm component
 */
export interface ValidatedFormProps {
    children: React.ReactNode;
    onSubmit: (e: React.FormEvent) => void;
    validationState?: ValidationState;
    isLoading?: boolean;
    className?: string;
    formData: Record<string, unknown>;
    setFormData: (data: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>)) => void;
    validation: ReturnType<typeof useZodValidation>;
}

/**
 * Props for CustomSelect component
 */
export interface CustomSelectProps<C extends CoreComponent> {
    value?: number | null;
    onValueChange: (value: number) => void;
    options: C[];
    useAbbreviation?: boolean;
    placeholder?: string;
    label?: string;
    required?: boolean;
    disabled?: boolean;
    getOptionDisabled?: (option: C) => boolean;
    componentExtraClassName?: string;
    triggerExtraClassName?: string;
    popupExtraClassName?: string;
    itemExtraClassName?: string;
    itemTextExtraClassName?: string;
    icon?: React.ReactNode;
    displayValue?: (value: number | null) => string;
    labelExtraClassName?: string;
}

/**
 * Props for CustomCheckbox component
 */
export interface CustomCheckboxProps {
    checked?: boolean;
    onCheckedChange: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
    componentExtraClassName?: string;
    checkboxClassName?: string;
    labelClassName?: string;
    required?: boolean;
    id?: string;
    labelPosition?: 'left' | 'right';
}

/**
 * Option type for nested select components
 */
export interface NestedSelectOption<C extends CoreComponent> {
    id: number;
    name: string;
    abbreviation?: string;
    children?: NestedSelectOption<C>[];
    disabled?: boolean;
}

/**
 * Props for CustomNestedSelect component
 */
export interface CustomNestedSelectProps<C extends CoreComponent> {
    value: number | null;
    onValueChange: (value: number | null) => void;
    options: NestedSelectOption<C>[];
    useAbbreviation?: boolean;
    placeholder?: string;
    label?: string;
    required?: boolean;
    disabled?: boolean;
    componentExtraClassName?: string;
    triggerExtraClassName?: string;
    popupExtraClassName?: string;
    itemExtraClassName?: string;
    itemTextExtraClassName?: string;
    icon?: React.ReactNode;
    displayValue?: (value: number | null) => string;
    labelExtraClassName?: string;
}

/**
 * Props for CustomNestedContextSelect component
 */
export interface CustomNestedContextSelectProps<C extends CoreComponent> {
    value: number | null;
    onValueChange: (value: number | null) => void;
    options: NestedSelectOption<C>[];
    useAbbreviation?: boolean;
    placeholder?: string;
    label?: string;
    required?: boolean;
    disabled?: boolean;
    componentExtraClassName?: string;
    triggerExtraClassName?: string;
    popupExtraClassName?: string;
    itemExtraClassName?: string;
    itemTextExtraClassName?: string;
    icon?: React.ReactNode;
    displayValue?: (value: number | null) => string;
    labelExtraClassName?: string;
}

/**
 * Type for searchable items in GenericSearchInput
 */
export type SearchableItem = {
    id: number;
    name: string;
    [key: string]: unknown; // Allow additional properties
};

/**
 * Props for SpellSearchInput component
 */
export interface SpellSearchInputProps {
    value: number | null;
    onValueChange: (spellId: number | null) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    componentExtraClassName?: string;
    labelExtraClassName?: string;
    spellList?: (SearchableItem & { editionId: number; baseLevel?: number })[];
    customOptions?: (SearchableItem & { editionId: number; baseLevel?: number })[];
    filter?: (spell: SearchableItem & { editionId: number; baseLevel?: number }) => boolean;
}

/**
 * Props for MonsterSearchInput component
 */
export interface MonsterSearchInputProps {
    value: number | null;
    onValueChange: (monsterId: number | null) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    componentExtraClassName?: string;
    labelExtraClassName?: string;
    monsterList?: (SearchableItem & { typeIds?: number[] })[];
    customOptions?: (SearchableItem & { typeIds?: number[] })[];
    filter?: (monster: SearchableItem & { typeIds?: number[] }) => boolean;
}
