import React, { useState, useEffect, useRef } from 'react';
import Icon from '@mdi/react';
import { mdiCloseCircleOutline } from '@mdi/js';

const Input = ({ onChange, className, selected, open, onOpenChange, dynamic = false, multiColumn = false, dynamicFilterDelay = 500, placeholder = 'Filter ...', type = 'text', appendClassName }) => {
    const [inputValue, setInputValue] = useState(selected || '');
    const inputRef = useRef(null);
    const debounceTimeoutRef = useRef(null);

    useEffect(() => {
        setInputValue(selected || '');
    }, [selected]);

    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);

    const handleInternalChange = (event) => {
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

    const handleApplyFilter = () => {
        if (!dynamic) {
            if (onChange && inputValue !== selected) {
                onChange(inputValue);
            }
        }
        if (onOpenChange) {
            onOpenChange(false);
        }
    };

    const handleClearInput = () => {
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

    const handleKeyDown = (event) => {
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
        <div className={`${appendClassName} ${className}` + " p-1 bg-opacity-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg"} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center relative">
                <input
                    ref={inputRef}
                    value={inputValue}
                    onChange={handleInternalChange}
                    onBlur={handleApplyFilter}
                    onKeyDown={handleKeyDown}
                    className={`w-full pr-7 px-2 py-1 text-left border rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-normal ${className}`}
                    placeholder={placeholder}
                    type={type}
                />
                {inputValue && (
                    <button
                        onClick={handleClearInput}
                        onMouseDown={(e) => e.preventDefault()}
                        className="absolute inset-y-0 right-0 pr-1 flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        title="Clear filter"
                    >
                        <Icon path={mdiCloseCircleOutline} size={0.8} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default Input; 