import { ContextMenu } from '@base-ui-components/react/context-menu';
import { CheckIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { CoreComponent } from '@shared/static-data';

interface ContextMenuMultiSelectProps {
    options: CoreComponent[];
    selected: (number | string)[];
    onValueChange: (values: (number | string)[]) => void;
    logicType?: 'or' | 'and';
    onLogicChange?: (logic: 'or' | 'and') => void;
    useAbbreviation?: boolean;
}

export const ContextMenuMultiSelect: React.FC<ContextMenuMultiSelectProps> = ({
    options,
    selected,
    onValueChange,
    logicType = 'or',
    onLogicChange,
    useAbbreviation = false
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
            {options.map((option) => {
                const displayText = useAbbreviation && option.abbreviation ? option.abbreviation : option.name;
                return (
                    <ContextMenu.Item
                        key={String(option.id)}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const isCurrentlySelected = selected.includes(option.id);
                            handleCheckedChange(option.id, !isCurrentlySelected);
                        }}
                        className={`px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center ${selected.includes(option.id) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}`}
                    >
                        <div className="flex items-center w-full">
                            <div className="w-4 h-4 flex items-center justify-center">
                                {selected.includes(option.id) && <CheckIcon className="w-4 h-4" />}
                            </div>
                            <span className="ml-1">{displayText}</span>
                        </div>
                    </ContextMenu.Item>
                );
            })}
        </div>
    );
}; 
