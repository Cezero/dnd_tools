import { ContextMenu } from '@base-ui-components/react/context-menu';
import { Input } from '@base-ui-components/react/input';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import React, { useRef, useEffect, useState } from 'react';

import { ContextMenuMultiSelect } from './ContextMenuMultiSelect';
import { ContextMenuSingleSelect } from './ContextMenuSingleSelect';
import { FilterType , FilterConfig, FilterValue } from './types';

interface FilterSubmenuProps {
    columnId: string;
    filterConfig: FilterConfig; // Column meta containing filterType and options
    currentFilter: FilterValue; // Current filter value from columnFilters
    onFilterChange: (value: FilterValue) => void;
    columnFilters?: FilterValue[]; // All current column filters for dynamic options
}

export const FilterSubmenu: React.FC<FilterSubmenuProps> = ({
    columnId,
    filterConfig,
    currentFilter,
    onFilterChange,
    columnFilters = []
}) => {
    const [textValue, setTextValue] = useState(currentFilter?.value || '');
    const inputRef = useRef<HTMLInputElement>(null);



    if (!filterConfig || !filterConfig.filterType) {
        return (
            <div className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400">
                No filter options available
            </div>
        );
    }

    const { filterType, options } = filterConfig;

    // Handle dynamic options function
    const getOptions = () => {
        if (typeof options === 'function') {
            return options(columnFilters);
        }
        return options;
    };

    switch (filterType) {
        case FilterType.SINGLE_SELECT:
            const singleSelectOptions = getOptions();
            if (!singleSelectOptions) {
                return (
                    <div className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400">
                        No options available
                    </div>
                );
            }
            return (
                <ContextMenuSingleSelect
                    options={singleSelectOptions}
                    selected={currentFilter?.value || null}
                    onValueChange={(value) => {
                        if (value === null) {
                            onFilterChange(null);
                        } else {
                            onFilterChange({ id: columnId, value });
                        }
                    }}
                />
            );

        case FilterType.MULTI_SELECT:
            const multiSelectOptions = getOptions();
            if (!multiSelectOptions) {
                return (
                    <div className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400">
                        No options available
                    </div>
                );
            }
            const selectedValues = currentFilter?.value?.values || [];
            const currentLogicType = currentFilter?.value?.logicType || 'or';
            const selectedValuesRef = useRef(selectedValues);

            // Update ref when selectedValues changes
            useEffect(() => {
                selectedValuesRef.current = selectedValues;
            }, [selectedValues]);

            return (
                <ContextMenuMultiSelect
                    options={multiSelectOptions}
                    selected={selectedValues}
                    onValueChange={(values) => {
                        if (values.length === 0) {
                            onFilterChange(null);
                        } else {
                            const filterValue = {
                                id: columnId,
                                value: {
                                    values,
                                    logicType: currentLogicType
                                }
                            };
                            onFilterChange(filterValue);
                        }
                    }}
                    logicType={currentLogicType}
                    onLogicChange={(logicType) => {
                        if (selectedValuesRef.current.length > 0) {
                            const filterValue = {
                                id: columnId,
                                value: {
                                    values: selectedValuesRef.current,
                                    logicType
                                }
                            };
                            onFilterChange(filterValue);
                        }
                    }}
                />
            );

        case FilterType.TEXT_INPUT:
            return (
                <ContextMenu.Item
                    className="px-2 py-1 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Trigger the text input visibility toggle
                        onFilterChange({ id: columnId, type: 'toggle_text_input' });
                    }}
                >
                    <div className="flex items-center w-full">
                        <div className="w-4 h-4 flex items-center justify-center">
                            <MagnifyingGlassIcon className="w-4 h-4" />
                        </div>
                        <span className="ml-1">Text Filter</span>
                    </div>
                </ContextMenu.Item>
            );

        default:
            return (
                <div className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400">
                    Unknown filter type
                </div>
            );
    }
}; 
