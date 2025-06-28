import React, { useRef, useEffect } from 'react';
import Icon from '@mdi/react';
import { mdiCheck } from '@mdi/js';

interface BooleanInputProps {
    value?: boolean | number | null;
    onToggle: (value: boolean | number | null) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    className?: string;
    appendClassName?: string;
}

/**
 * A boolean input component for GenericList, similar to MultiSelect but with hardcoded 'True' and 'False' options.
 */
export const BooleanInput = ({
    value,
    onToggle,
    open,
    onOpenChange,
    className = '',
    appendClassName = ''
}: BooleanInputProps): React.JSX.Element => {
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

    const HandleOptionClick = (optionValue: number): void => {
        onToggle(optionValue === value ? null : optionValue);
    };

    const HandleClearAll = (): void => {
        onToggle(null);
    };

    const options = [
        { display: 'True', value: 1 },
        { display: 'False', value: 0 },
    ];

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
                            className={`relative block pl-6 pr-4 py-0.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 cursor-pointer ${value === null ? 'font-semibold text-blue-500 dark:text-blue-300' : 'font-normal'} flex justify-between items-center`}
                        >
                            <span className={`block truncate ${value === null ? 'font-semibold text-blue-500 dark:text-blue-300' : 'font-normal'}`} onClick={HandleClearAll}>- Clear All -</span>
                        </div>
                        {options.map((option) => (
                            <div
                                key={String(option.value)}
                                className={`relative block pl-5 pr-4 py-0.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 cursor-pointer ${value === option.value ? 'font-semibold text-blue-500 dark:text-blue-300' : 'font-normal'}`}
                                onClick={() => HandleOptionClick(option.value)}
                            >
                                <span className={`block truncate ${value === option.value ? 'text-blue-500 dark:text-blue-300' : ''}`}>
                                    {option.display}
                                </span>
                                {value === option.value && (
                                    <span
                                        className="absolute inset-y-0 left-0 flex items-center pl-0 text-blue-500 dark:text-blue-300"
                                    >
                                        <Icon path={mdiCheck} size={0.7} aria-hidden="true" />
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