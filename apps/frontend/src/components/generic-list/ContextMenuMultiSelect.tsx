import React from 'react';
import { ContextMenu } from '@base-ui-components/react/context-menu';
import { CheckIcon } from '@heroicons/react/24/outline';

interface ContextMenuMultiSelectProps {
    options: Array<{ value: number | string; label: string }>;
    selected: (number | string)[];
    onValueChange: (values: (number | string)[]) => void;
    logicType?: 'or' | 'and';
    onLogicChange?: (logic: 'or' | 'and') => void;
}

export const ContextMenuMultiSelect: React.FC<ContextMenuMultiSelectProps> = ({
    options,
    selected,
    onValueChange,
    logicType = 'or',
    onLogicChange
}) => {
    const handleCheckedChange = (value: number | string, checked: boolean) => {
        if (checked) {
            const newValues = [...selected, value];
            onValueChange(newValues);
        } else {
            const newValues = selected.filter(item => item !== value);
            onValueChange(newValues);
        }
    };

    const handleClearAll = () => {
        onValueChange([]);
    };

    const handleLogicChange = () => {
        if (onLogicChange) {
            const newLogicType = logicType === 'or' ? 'and' : 'or';
            onLogicChange(newLogicType);
        }
    };

    return (
        <div>
            {/* Clear All and Logic Toggle */}
            <ContextMenu.Item
                onClick={handleClearAll}
                className="px-2 py-1 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center justify-between"
            >
                <div className="flex items-center w-full">
                    <div className="w-4 h-4 flex items-center justify-center">
                        {/* Reserved space for icon */}
                    </div>
                    <span className="ml-1 flex-1">
                        - Clear All -
                    </span>
                    {onLogicChange && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleLogicChange();
                            }}
                            className="px-2 py-1 rounded-md text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                            title={`Has ${logicType === 'or' ? 'any' : 'all'} selected`}
                        >
                            {logicType === 'or' ? 'OR' : 'AND'}
                        </button>
                    )}
                </div>
            </ContextMenu.Item>

            {/* Options */}
            {options.map((option) => (
                <ContextMenu.Item
                    key={String(option.value)}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const isCurrentlySelected = selected.includes(option.value);
                        handleCheckedChange(option.value, !isCurrentlySelected);
                    }}
                    className={`px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center ${selected.includes(option.value) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}`}
                >
                    <div className="flex items-center w-full">
                        <div className="w-4 h-4 flex items-center justify-center">
                            {selected.includes(option.value) && <CheckIcon className="w-4 h-4" />}
                        </div>
                        <span className="ml-1">{option.label}</span>
                    </div>
                </ContextMenu.Item>
            ))}
        </div>
    );
}; 
