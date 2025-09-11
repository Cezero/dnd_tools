import { Select } from '@base-ui-components/react/select';
import { ChevronUpDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import React from 'react';

export interface NestedSelectOption {
    value: string;
    label: string;
    children?: NestedSelectOption[];
    disabled?: boolean;
}

export interface CustomNestedSelectProps {
    value: string | null;
    onValueChange: (value: string | null) => void;
    options: NestedSelectOption[];
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
    displayValue?: (value: string | null) => string;
    labelExtraClassName?: string;
}

export function CustomNestedSelect({
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
}: CustomNestedSelectProps): React.JSX.Element {
    const defaultDisplayValue = (value: string | null) => {
        if (value === null || value === undefined) return placeholder;

        // Find the option in the nested structure
        const findOption = (opts: NestedSelectOption[], targetValue: string): NestedSelectOption | null => {
            for (const opt of opts) {
                if (opt.value === targetValue) return opt;
                if (opt.children) {
                    const found = findOption(opt.children, targetValue);
                    if (found) return found;
                }
            }
            return null;
        };

        const option = findOption(options, value);
        return option?.label || placeholder;
    };

    const renderDisplayValue = displayValue || defaultDisplayValue;

    if (triggerExtraClassName === "") {
        triggerExtraClassName = "pl-2 pr-1 py-1";
    }

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
                disabled={disabled}
            >
                <Select.Trigger className={triggerExtraClassName + " flex items-center justify-between gap-1 cursor-default rounded-md bg-white shadow-sm ring-1 ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:ring-gray-600"}>
                    <Select.Value>
                        {(value) => renderDisplayValue(value)}
                    </Select.Value>
                    <Select.Icon>
                        {icon}
                    </Select.Icon>
                </Select.Trigger>
                <Select.Positioner>
                    <Select.Popup className={`${popupExtraClassName} absolute pt-1 pb-1 pr-1 max-h-60 overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800`}>
                        {options.map((option) => {
                            if (option.children && option.children.length > 0) {
                                // Render as a group
                                return (
                                    <Select.Group key={option.value}>
                                        <Select.GroupLabel className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            {option.label}
                                        </Select.GroupLabel>
                                        {option.children.map((child) => (
                                            <Select.Item
                                                key={child.value}
                                                value={child.value}
                                                disabled={child.disabled}
                                                className={`${itemExtraClassName} flex items-center justify-end gap-1 text-left select-none cursor-default pl-3 pr-2 hover:bg-blue-600 data-[highlighted]:bg-blue-600 data-[selected]:text-blue-400`}
                                            >
                                                <Select.ItemIndicator>
                                                    <ChevronRightIcon className="h-4 w-4" />
                                                </Select.ItemIndicator>
                                                <Select.ItemText className={itemTextExtraClassName}>
                                                    {child.label}
                                                </Select.ItemText>
                                            </Select.Item>
                                        ))}
                                    </Select.Group>
                                );
                            } else {
                                // Render as a regular item
                                return (
                                    <Select.Item
                                        key={option.value}
                                        value={option.value}
                                        disabled={option.disabled}
                                        className={`${itemExtraClassName} flex items-center justify-end gap-1 text-left select-none cursor-default pl-1 pr-2 hover:bg-blue-600 data-[highlighted]:bg-blue-600 data-[selected]:text-blue-400`}
                                    >
                                        <Select.ItemIndicator>
                                            <ChevronRightIcon className="h-4 w-4" />
                                        </Select.ItemIndicator>
                                        <Select.ItemText className={itemTextExtraClassName}>
                                            {option.label}
                                        </Select.ItemText>
                                    </Select.Item>
                                );
                            }
                        })}
                    </Select.Popup>
                </Select.Positioner>
            </Select.Root>
        </div>
    );
}
