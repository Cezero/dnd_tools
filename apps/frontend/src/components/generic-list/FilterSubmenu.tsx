import React, { useRef, useEffect, useState } from 'react';
import { ContextMenu } from '@base-ui-components/react/context-menu';
import { Input } from '@base-ui-components/react/input';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { FilterType } from './types';
import { ContextMenuSingleSelect } from './ContextMenuSingleSelect';
import { ContextMenuMultiSelect } from './ContextMenuMultiSelect';

interface FilterSubmenuProps {
    columnId: string;
    filterConfig: any; // Column meta containing filterType and options
    currentFilter: any; // Current filter value from columnFilters
    onFilterChange: (value: any) => void;
}

export const FilterSubmenu: React.FC<FilterSubmenuProps> = ({
    columnId,
    filterConfig,
    currentFilter,
    onFilterChange
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

    switch (filterType) {
        case FilterType.SINGLE_SELECT:
            if (!options) {
                return (
                    <div className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400">
                        No options available
                    </div>
                );
            }
            return (
                <ContextMenuSingleSelect
                    options={options}
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
            if (!options) {
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
                    options={options}
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
