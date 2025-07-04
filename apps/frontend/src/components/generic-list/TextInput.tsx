import { XCircleIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect, useRef } from 'react';

import type { InputFilterComponentProps } from './types';

export const TextInput = ({
    onChange,
    className = '',
    selected,
    open,
    onOpenChange,
    dynamic = false,
    dynamicFilterDelay = 500,
    placeholder = 'Filter ...',
    type = 'text',
    appendClassName = ''
}: InputFilterComponentProps): React.JSX.Element => {
    const [inputValue, setInputValue] = useState<string>(selected || '');
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        setInputValue(selected || '');
    }, [selected]);

    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);

    const HandleInternalChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const value = event.target.value;
        setInputValue(value);
        if (dynamic) {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
            debounceTimeoutRef.current = setTimeout(() => {
                if (onChange) {
                    onChange(value);
                }
            }, dynamicFilterDelay);
        }
    };

    const HandleApplyFilter = (): void => {
        if (!dynamic) {
            if (onChange && inputValue !== selected) {
                onChange(inputValue);
            }
        }
        if (onOpenChange) {
            onOpenChange(false);
        }
    };

    const HandleClearInput = (): void => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        setInputValue('');
        if (onChange && selected !== '') {
            onChange('');
        }
        if (onOpenChange) {
            onOpenChange(false);
        }
    };

    const HandleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
            if (onChange) {
                onChange(inputValue);
            }
            if (onOpenChange) {
                onOpenChange(false);
            }
        }
    };

    return (
        <div className={`${appendClassName} ${className} p-1 bg-opacity-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center relative">
                <input
                    ref={inputRef}
                    value={inputValue}
                    onChange={HandleInternalChange}
                    onBlur={HandleApplyFilter}
                    onKeyDown={HandleKeyDown}
                    className={`w-full pr-7 px-2 py-1 text-left border rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-normal ${className}`}
                    placeholder={placeholder}
                    type={type}
                />
                {inputValue && (
                    <button
                        onClick={HandleClearInput}
                        onMouseDown={(e) => e.preventDefault()}
                        className="absolute inset-y-0 right-0 pr-1 flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        title="Clear filter"
                    >
                        <XCircleIcon className="mr-1" />
                    </button>
                )}
            </div>
        </div>
    );
}; 