import { ContextMenu } from '@base-ui-components/react/context-menu';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import React, { useRef, useEffect, useState } from 'react';

import { CoreComponent, FilterType } from '@shared/static-data';

import { ContextMenuMultiSelect } from './ContextMenuMultiSelect';
import { ContextMenuSingleSelect } from './ContextMenuSingleSelect';
import { FilterConfig, FilterValue } from './types';

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
    const [_textValue, _setTextValue] = useState(currentFilter?.value || '');
    const _inputRef = useRef<HTMLInputElement>(null);
    const selectedValuesRef = useRef<(string | number)[]>([]);
    const [resolvedOptions, setResolvedOptions] = useState<CoreComponent[]>([]);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);

    // Update ref when currentFilter changes
    useEffect(() => {
        if (currentFilter?.value && typeof currentFilter.value === 'object' && 'values' in currentFilter.value) {
            selectedValuesRef.current = currentFilter.value.values;
        }
    }, [currentFilter?.value]);

    // Resolve async options
    useEffect(() => {
        const resolveOptions = async () => {
            const { options } = filterConfig;
            if (!options) {
                setResolvedOptions([]);
                return;
            }

            if (typeof options === 'function') {
                try {
                    setIsLoadingOptions(true);
                    const result = options(columnFilters);
                    if (result instanceof Promise) {
                        const resolved = await result;
                        setResolvedOptions(resolved);
                    } else {
                        setResolvedOptions(result);
                    }
                } catch (error) {
                    console.warn('Failed to resolve filter options:', error);
                    setResolvedOptions([]);
                } finally {
                    setIsLoadingOptions(false);
                }
            } else if (Array.isArray(options)) {
                setResolvedOptions(options);
            } else {
                setResolvedOptions([]);
            }
        };
        resolveOptions();
    }, [filterConfig, columnFilters]);

    if (!filterConfig || !filterConfig.filterType) {
        return (
            <div className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400">
                No filter options available
            </div>
        );
    }

    const { filterType } = filterConfig;

    if (isLoadingOptions) {
        return (
            <div className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400">
                Loading options...
            </div>
        );
    }

    switch (filterType) {
        case FilterType.SINGLE_SELECT: {
            if (!resolvedOptions || resolvedOptions.length === 0) {
                return (
                    <div className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400">
                        No options available
                    </div>
                );
            }
            return (
                <ContextMenuSingleSelect
                    options={resolvedOptions}
                    selected={typeof currentFilter?.value === 'string' || typeof currentFilter?.value === 'number' ? currentFilter.value : null}
                    onValueChange={(value) => {
                        if (value === null) {
                            onFilterChange(null);
                        } else {
                            onFilterChange({ id: columnId, value });
                        }
                    }}
                />
            );
        }

        case FilterType.MULTI_SELECT: {
            if (!resolvedOptions || resolvedOptions.length === 0) {
                return (
                    <div className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400">
                        No options available
                    </div>
                );
            }
            const selectedValues = currentFilter?.value && typeof currentFilter.value === 'object' && 'values' in currentFilter.value
                ? currentFilter.value.values
                : [];
            const currentLogicType = currentFilter?.value && typeof currentFilter.value === 'object' && 'logicType' in currentFilter.value
                ? currentFilter.value.logicType || 'or'
                : 'or';

            return (
                <ContextMenuMultiSelect
                    options={resolvedOptions}
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
        }

        case FilterType.TEXT_INPUT: {
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
        }

        default: {
            return (
                <div className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400">
                    Unknown filter type
                </div>
            );
        }
    }
}; 
