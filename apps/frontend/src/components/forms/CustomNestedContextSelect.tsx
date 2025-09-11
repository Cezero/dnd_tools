import { ContextMenu } from '@base-ui-components/react/context-menu';
import { ChevronUpDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import React, { useState, useRef, useMemo } from 'react';

export interface NestedSelectOption {
    value: string;
    label: string;
    children?: NestedSelectOption[];
    disabled?: boolean;
}

export interface CustomNestedContextSelectProps {
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

export function CustomNestedContextSelect({
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
}: CustomNestedContextSelectProps): React.JSX.Element {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);

    const handleTriggerClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            // Simulate a right-click event to get proper positioning
            const rightClickEvent = new MouseEvent('contextmenu', {
                bubbles: true,
                cancelable: true,
                clientX: e.clientX,
                clientY: e.clientY,
                button: 2
            });
            triggerRef.current?.dispatchEvent(rightClickEvent);
        }
    };

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

    const handleOptionClick = React.useCallback((optionValue: string) => {
        onValueChange(optionValue);
        setIsOpen(false);
    }, [onValueChange]);

    const renderNestedOptions = React.useCallback((opts: NestedSelectOption[], level = 0): React.ReactNode => {
        return opts.map((option) => {
            if (option.children && option.children.length > 0) {
                // Render as a submenu
                return (
                    <ContextMenu.SubmenuRoot key={option.value}>
                        <ContextMenu.SubmenuTrigger className={`px-2 py-1 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center focus:outline-none ${itemExtraClassName}`}>
                            <div className="flex items-center w-full">
                                <div className="w-4 h-4 flex items-center justify-center">
                                    {/* Reserved space for icon */}
                                </div>
                                <span className={`ml-1 ${itemTextExtraClassName}`}>{option.label}</span>
                                <ChevronRightIcon className="w-4 h-4 ml-auto" />
                            </div>
                        </ContextMenu.SubmenuTrigger>
                        <ContextMenu.Portal>
                            <ContextMenu.Positioner
                                alignOffset={-4}
                                sideOffset={-4}
                            >
                                <ContextMenu.Popup className={`bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg py-1 min-w-[160px] ${popupExtraClassName}`}>
                                    {renderNestedOptions(option.children, level + 1)}
                                </ContextMenu.Popup>
                            </ContextMenu.Positioner>
                        </ContextMenu.Portal>
                    </ContextMenu.SubmenuRoot>
                );
            } else {
                // Render as a regular item
                return (
                    <ContextMenu.Item
                        key={option.value}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleOptionClick(option.value);
                        }}
                        disabled={option.disabled}
                        className={`px-2 py-1 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center focus:outline-none ${itemExtraClassName}`}
                    >
                        <div className="flex items-center w-full">
                            <div className="w-4 h-4 flex items-center justify-center">
                                {/* Reserved space for checkmark */}
                            </div>
                            <span className={`ml-1 ${itemTextExtraClassName}`}>{option.label}</span>
                        </div>
                    </ContextMenu.Item>
                );
            }
        });
    }, [handleOptionClick, itemExtraClassName, itemTextExtraClassName, popupExtraClassName]);

    const renderedOptions = useMemo(() => {
        return renderNestedOptions(options);
    }, [options, renderNestedOptions]);

    return (
        <div className={`${componentExtraClassName}`}>
            {label && (
                <label className={`block font-medium ${labelExtraClassName}`}>
                    {label}{required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <ContextMenu.Root
                open={isOpen}
                onOpenChange={setIsOpen}
            >
                <ContextMenu.Trigger
                    ref={triggerRef}
                    onClick={handleTriggerClick}
                    className={`${triggerExtraClassName} flex items-center justify-between gap-1 cursor-default rounded-md bg-white shadow-sm ring-1 ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:ring-gray-600 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <span className="text-left">{renderDisplayValue(value)}</span>
                    {icon}
                </ContextMenu.Trigger>
                <ContextMenu.Portal>
                    <ContextMenu.Positioner>
                        <ContextMenu.Popup className={`bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg py-1 min-w-[160px] ${popupExtraClassName}`}>
                            {renderedOptions}
                        </ContextMenu.Popup>
                    </ContextMenu.Positioner>
                </ContextMenu.Portal>
            </ContextMenu.Root>
        </div>
    );
}
