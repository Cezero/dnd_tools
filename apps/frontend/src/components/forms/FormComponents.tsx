import React, { useState, useRef, useEffect } from 'react';
import { Select } from '@base-ui-components/react/select';
import { Checkbox } from '@base-ui-components/react/checkbox';
import { CheckIcon, ChevronRightIcon, ChevronUpDownIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { PlusCircleIcon as PlusCircleIconSolid } from '@heroicons/react/24/solid';

export interface SelectOption<T = string | number> {
    value: T;
    label: string;
}

export interface CustomSelectMultiProps<T = string | number> {
    value?: T | null;
    onValueChange?: (value: T) => void;

    selectedValues?: T[];
    onSelectedValuesChange?: (values: T[]) => void;
    logicType?: 'or' | 'and';
    onLogicChange?: (logic: 'or' | 'and') => void;

    options: SelectOption<T>[];
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
    labelExtraClassName?: string;
}

export function CustomSelectMulti<T = string | number>({
    value,
    onValueChange,

    selectedValues = [],
    onSelectedValuesChange,
    logicType = 'or',
    onLogicChange,

    options,
    placeholder = 'Select an option',
    label,
    required = false,
    disabled = false,
    componentExtraClassName = '',
    triggerExtraClassName = '',
    popupExtraClassName = '',
    itemExtraClassName = '',
    itemTextExtraClassName = '',
    icon = <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />,
    labelExtraClassName = '',
}: CustomSelectMultiProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const toggleValue = (val: T) => {
        if (!onSelectedValuesChange) return;
        if (selectedValues.includes(val)) {
            onSelectedValuesChange(selectedValues.filter((v) => v !== val));
        } else {
            onSelectedValuesChange([...selectedValues, val]);
        }
    };

    const getLabel = (val: T) => options.find((opt) => opt.value === val)?.label || '';

    const renderDisplayValue = () => {
        if (!selectedValues.length) return placeholder;
        return selectedValues.map(getLabel).join(logicType === 'and' ? ' and ' : ' or ');
    };

    return (
        <div className={`${componentExtraClassName}`} ref={dropdownRef}>
            {label && (
                <label className={`block font-medium ${labelExtraClassName}`}>
                    {label}{required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`text-left flex justify-between items-center gap-2 pl-2 pr-3 py-2 rounded-md bg-white shadow-sm ring-1 ring-gray-300 dark:bg-gray-700 dark:ring-gray-600 ${triggerExtraClassName}`}
                    disabled={disabled}
                >
                    <span>{renderDisplayValue()}</span>
                    {icon}
                </button>
                {isOpen && (
                    <div
                        className={`absolute z-60 top-0 left-0 max-h-60 overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 ${popupExtraClassName}`}
                    >
                        <>
                            {onLogicChange && (
                                <div className="px-2 py-1 gap-2 flex items-center text-sm text-gray-500">
                                    Logic:
                                    <button
                                        type="button"
                                        className="flex items-center gap-1 text-blue-600 hover:underline"
                                        onClick={() => onLogicChange(logicType === 'or' ? 'and' : 'or')}
                                    >
                                        {logicType === 'or' ? <PlusCircleIcon className="h-4 w-4" /> : <PlusCircleIconSolid className="h-4 w-4" />}
                                        {logicType.toUpperCase()}
                                    </button>
                                </div>
                            )}
                            {options.map((opt) => {
                                const selected = selectedValues.includes(opt.value);
                                return (
                                    <div
                                        key={String(opt.value)}
                                        className={`px-2 flex items-center gap-1 cursor-pointer hover:bg-blue-600 hover:text-white ${itemExtraClassName}`}
                                        onClick={() => toggleValue(opt.value)}
                                    >
                                        {selected && (
                                            <>
                                                <ChevronRightIcon className="h-4 w-4 text-blue-500" />
                                                <span className={`${itemTextExtraClassName} text-blue-500`}>{opt.label}</span>
                                            </>
                                        ) || (
                                                <>
                                                    <div className="h-4 w-4"></div>
                                                    <span className={`${itemTextExtraClassName}`}>{opt.label}</span>
                                                </>
                                            )}
                                    </div>
                                );
                            })}
                        </>
                    </div>
                )}
            </div>
        </div>
    );
}

export interface CustomSelectProps<T = string | number> {
    value?: T | null;
    onValueChange: (value: T) => void;
    options: SelectOption<T>[];
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
    displayValue?: (value: T | null) => string;
    labelExtraClassName?: string;
}

export function CustomSelect<T = string | number>({
    value,
    onValueChange,
    options,
    placeholder = "Select an option",
    label,
    required = false,
    disabled = false,
    componentExtraClassName = "",
    triggerExtraClassName = "",
    popupExtraClassName = "",
    itemExtraClassName = "",
    itemTextExtraClassName = "",
    icon = <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />,
    displayValue,
    labelExtraClassName = ""
}: CustomSelectProps<T>) {
    const defaultDisplayValue = (value: T | null) => {
        if (value === null || value === undefined) return placeholder;
        const option = options.find(opt => opt.value === value);
        return option?.label || placeholder;
    };

    const renderDisplayValue = displayValue || defaultDisplayValue;

    return (
        <div className={`${componentExtraClassName}`}>
            {label && (
                <label className={`block font-medium ${labelExtraClassName}`}>
                    {label}{required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <Select.Root
                value={value}
                onValueChange={onValueChange}
                items={options}
                disabled={disabled}
            >
                <Select.Trigger className={triggerExtraClassName + " flex items-center justify-between gap-1 pl-2 pr-1 py-2 cursor-default rounded-md bg-white shadow-sm ring-1 ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:ring-gray-600"}>
                    <Select.Value>
                        {(value) => renderDisplayValue(value)}
                    </Select.Value>
                    <Select.Icon>
                        {icon}
                    </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                    <Select.Positioner>
                        <Select.Popup className={`${popupExtraClassName} absolute z-60 pt-1 pb-1 pr-1 max-h-60 overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800`}>
                            {options.map((option) => (
                                <Select.Item
                                    key={String(option.value)}
                                    value={option.value}
                                    className={`${itemExtraClassName} flex items-center justify-end gap-1 text-left select-none cursor-default pl-1 pr-2 hover:bg-blue-600 data-[highlighted]:bg-blue-600 data-[selected]:text-blue-400`}
                                >
                                    <Select.ItemIndicator>
                                        <ChevronRightIcon className="h-4 w-4" />
                                    </Select.ItemIndicator>
                                    <Select.ItemText className={itemTextExtraClassName}>
                                        {option.label}
                                    </Select.ItemText>
                                </Select.Item>
                            ))}
                        </Select.Popup>
                    </Select.Positioner>
                </Select.Portal>
            </Select.Root>
        </div>
    );
}

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

export function CustomCheckbox({
    checked = false,
    onCheckedChange,
    label,
    disabled = false,
    componentExtraClassName = "",
    checkboxClassName = `
        h-5 w-5 rounded border border-gray-300 bg-white 
        focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
        disabled:opacity-50 disabled:cursor-not-allowed 
        data-checked:bg-blue-600 data-checked:border-blue-600 
        dark:bg-gray-700 dark:border-gray-600 
        dark:focus:ring-blue-500 
        dark:data-checked:bg-blue-600 dark:data-checked:border-blue-600
    `.replace(/\s+/g, ' ').trim(),
    labelClassName = "font-medium",
    required = false,
    id,
    labelPosition = 'right'
}: CustomCheckboxProps) {
    const checkboxId = id || `checkbox-${Math.random().toString(36).slice(2, 11)}`;

    return (
        <div className={`flex items-center gap-2 ${componentExtraClassName}`}>
            {label && labelPosition === 'left' && (
                <label htmlFor={checkboxId} className={labelClassName}>
                    {label}{required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <Checkbox.Root
                id={checkboxId}
                checked={checked}
                onCheckedChange={onCheckedChange}
                disabled={disabled}
                className={checkboxClassName}
            >
                <Checkbox.Indicator>
                    <CheckIcon />
                </Checkbox.Indicator>
            </Checkbox.Root>
            {label && labelPosition === 'right' && (
                <label htmlFor={checkboxId} className={labelClassName}>
                    {label}{required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
        </div>
    );
}
