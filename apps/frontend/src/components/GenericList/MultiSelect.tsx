import React, { useRef, useEffect } from 'react';
import { CheckIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { PlusCircleIcon as PlusCircleIconSolid } from '@heroicons/react/24/solid';
import type { MultiSelectProps } from './types';

export const MultiSelect = ({
    options,
    displayKey,
    valueKey,
    selected,
    onChange,
    className = '',
    open,
    onOpenChange,
    logicType = 'or',
    onLogicChange,
    appendClassName = ''
}: MultiSelectProps): React.JSX.Element => {
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const HandleClickOutside = (event: MouseEvent): void => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onOpenChange(false);
            }
        };

        if (open) {
            document.addEventListener('mousedown', HandleClickOutside);
        } else {
            document.removeEventListener('mousedown', HandleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', HandleClickOutside);
        };
    }, [open, onOpenChange]);

    const HandleOptionClick = (optionValue: string | number): void => {
        const newSelected = selected.includes(optionValue)
            ? selected.filter(item => item !== optionValue)
            : [...selected, optionValue];
        onChange(newSelected);
    };

    const HandleClearAll = (): void => {
        onChange([]);
    };

    const HandleLogicButtonClick = (logic: 'or' | 'and'): void => {
        if (onLogicChange) {
            onLogicChange(logic);
        }
    };

    return (
        <div
            className={`${appendClassName} ${className} ` +
                (open
                    ? 'p-1 bg-opacity-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg'
                    : '')
            }
            ref={dropdownRef}
            onClick={(e) => e.stopPropagation()}
        >
            {open && (
                <div className="w-full">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        <div
                            className={`relative block pl-6 pr-4 py-0.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 cursor-pointer ${selected.length === 0 ? 'font-semibold text-blue-500 dark:text-blue-300' : 'font-normal'} flex justify-between items-center`}
                        >
                            <span className={`block truncate ${selected.length === 0 ? 'font-semibold text-blue-500 dark:text-blue-300' : 'font-normal'}`} onClick={HandleClearAll}>- Clear All -</span>
                            {onLogicChange && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); HandleLogicButtonClick(logicType === 'or' ? 'and' : 'or'); }}
                                    className={`px-2 py-1 rounded-md text-sm flex items-center justify-center`}
                                    title={`Has ${logicType === 'or' ? 'any' : 'all'} selected ${displayKey}`}
                                >
                                    {logicType === 'or' ? <PlusCircleIcon className="mr-1" /> : <PlusCircleIconSolid className="mr-1" />}
                                </button>
                            )}
                        </div>
                        {options.map((option) => (
                            <div
                                key={option[valueKey]}
                                className={`relative block pl-5 pr-4 py-0.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 cursor-pointer ${selected.includes(option[valueKey]) ? 'font-semibold text-blue-500 dark:text-blue-300' : 'font-normal'}`}
                                onClick={() => HandleOptionClick(option[valueKey])}
                            >
                                <span className={`block truncate ${selected.includes(option[valueKey]) ? 'text-blue-500 dark:text-blue-300' : ''}`}>
                                    {option[displayKey]}
                                </span>
                                {selected.includes(option[valueKey]) && (
                                    <span
                                        className="absolute inset-y-0 left-0 flex items-center pl-0 text-blue-500 dark:text-blue-300"
                                    >
                                        <CheckIcon className="mr-1" />
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}; 