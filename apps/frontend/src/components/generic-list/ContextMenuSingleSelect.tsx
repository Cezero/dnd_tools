import { ContextMenu } from '@base-ui-components/react/context-menu';
import { CheckIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { CoreComponent } from '@shared/static-data';

interface ContextMenuSingleSelectProps {
    options: CoreComponent[];
    selected: number | string | null;
    onValueChange: (value: number | string | null) => void;
    useAbbreviation?: boolean;
}

export const ContextMenuSingleSelect: React.FC<ContextMenuSingleSelectProps> = ({
    options,
    selected,
    onValueChange,
    useAbbreviation = false,
}) => {
    const handleValueChange = (value: number | string) => {
        // Toggle behavior: if clicking the same value, clear it
        if (selected === value) {
            onValueChange(null);
        } else {
            onValueChange(value);
        }
    };

    return (
        <div>
            {options.map((option) => {
                const displayText = useAbbreviation && option.abbreviation ? option.abbreviation : option.name;
                return (
                    <ContextMenu.Item
                        key={String(option.id)}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleValueChange(option.id);
                        }}
                        className={`px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center ${selected === option.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}`}
                    >
                        <div className="flex items-center w-full">
                            <div className="w-4 h-4 flex items-center justify-center">
                                {selected === option.id && <CheckIcon className="w-4 h-4" />}
                            </div>
                            <span className="ml-1">{displayText}</span>
                        </div>
                    </ContextMenu.Item>
                );
            })}
        </div>
    );
}; 
