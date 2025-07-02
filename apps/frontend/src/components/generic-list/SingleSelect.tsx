import React, { useRef, useEffect } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import type { SingleSelectProps } from './types';

export const SingleSelect = ({
    options,
    displayKey,
    valueKey,
    selected,
    onChange,
    placeholder = 'Select...',
    className = '',
    open,
    onOpenChange,
    appendClassName = ''
}: SingleSelectProps): React.JSX.Element => {
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

    const HandleOptionClick = (optionValue: string | number | null): void => {
        onChange(optionValue);
        onOpenChange(false);
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
                            className={`relative block pl-6 pr-4 py-0.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 cursor-pointer ${!selected ? 'font-semibold text-blue-500 dark:text-blue-300' : 'font-normal'} flex justify-between items-center`}
                            onClick={() => HandleOptionClick(null)}
                        >
                            <span className={`block truncate ${!selected ? 'font-semibold text-blue-500 dark:text-blue-300' : 'font-normal'}`}>{placeholder}</span>
                        </div>
                        {options.map((option) => (
                            <div
                                key={String(option[valueKey])}
                                className={`relative block pl-5 pr-4 py-0.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 cursor-pointer ${selected === option[valueKey] ? 'font-semibold text-blue-500 dark:text-blue-300' : 'font-normal'}`}
                                onClick={() => HandleOptionClick(option[valueKey])}
                            >
                                <span className={`block truncate ${selected === option[valueKey] ? 'text-blue-500 dark:text-blue-300' : ''}`}>
                                    {option[displayKey]}
                                </span>
                                {selected === option[valueKey] && (
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