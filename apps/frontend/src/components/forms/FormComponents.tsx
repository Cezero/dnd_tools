import React from 'react';
import { Select } from '@base-ui-components/react/select';
import { Checkbox } from '@base-ui-components/react/checkbox';
import { ChevronUpDownIcon, ChevronRightIcon, CheckIcon } from '@heroicons/react/24/outline';

/**
 * CustomSelect Component Usage Examples:
 * 
 * // Basic usage with string values
 * <CustomSelect
 *   label="Choose a color"
 *   value={selectedColor}
 *   onValueChange={setSelectedColor}
 *   options={[
 *     { value: 'red', label: 'Red' },
 *     { value: 'blue', label: 'Blue' },
 *     { value: 'green', label: 'Green' }
 *   ]}
 * />
 * 
 * // With number values and custom placeholder
 * <CustomSelect<number>
 *   label="Select Level"
 *   required
 *   value={selectedLevel}
 *   onValueChange={setSelectedLevel}
 *   options={[...Array(10).keys()].map(level => ({ 
 *     value: level, 
 *     label: `Level ${level}` 
 *   }))}
 *   placeholder="Choose a level"
 * />
 * 
 * // With custom styling
 * <CustomSelect
 *   label="Custom Style"
 *   value={selectedValue}
 *   onValueChange={setSelectedValue}
 *   options={options}
 *   triggerClassName="custom-trigger-class"
 *   popupClassName="custom-popup-class"
 *   itemClassName="custom-item-class"
 * />
 * 
 * CustomCheckbox Component Usage Examples:
 * 
 * // Basic usage
 * <CustomCheckbox
 *   label="Enable notifications"
 *   checked={notificationsEnabled}
 *   onCheckedChange={setNotificationsEnabled}
 * />
 * 
 * // With custom styling
 * <CustomCheckbox
 *   label="Custom Style"
 *   checked={isChecked}
 *   onCheckedChange={setIsChecked}
 *   className="custom-container-class"
 *   checkboxClassName="custom-checkbox-class"
 *   labelClassName="custom-label-class"
 * />
 * 
 * // With disabled state
 * <CustomCheckbox
 *   label="Disabled option"
 *   checked={isChecked}
 *   onCheckedChange={setIsChecked}
 *   disabled={true}
 * />
 */

export interface SelectOption<T = string | number> {
    value: T;
    label: string;
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
                <Select.Trigger className={triggerExtraClassName + " flex items-center gap-1 pl-2 pr-1 py-2 cursor-default rounded-md bg-white shadow-sm ring-1 ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:ring-gray-600"}>
                    <Select.Value>
                        {(value) => renderDisplayValue(value)}
                    </Select.Value>
                    <Select.Icon>
                        {icon}
                    </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                    <Select.Positioner>
                        <Select.Popup className={`${popupExtraClassName} absolute z-10 pt-1 pb-1 pr-1 max-h-60 overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800`}>
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
    id
}: CustomCheckboxProps) {
    const checkboxId = id || `checkbox-${Math.random().toString(36).slice(2, 11)}`;

    return (
        <div className={`flex items-center gap-2 ${componentExtraClassName}`}>
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
            {label && (
                <label htmlFor={checkboxId} className={labelClassName}>
                    {label}{required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
        </div>
    );
}
