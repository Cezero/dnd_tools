import React, { useState, useEffect } from 'react';
import Icon from '@mdi/react';
import { mdiCloseCircleOutline } from '@mdi/js';

const Input = ({ onChange, className, selected, open, onOpenChange, ...props }) => {
    const [inputValue, setInputValue] = useState(selected || '');

    useEffect(() => {
        setInputValue(selected || '');
    }, [selected]);

    const handleInternalChange = (event) => {
        setInputValue(event.target.value);
    };

    const handleApplyFilter = () => {
        if (onChange) {
            onChange(inputValue);
        }
        if (onOpenChange) {
            onOpenChange(false);
        }
    };

    const handleClearInput = () => {
        setInputValue('');
        if (onChange) {
            onChange('');
        }
        if (onOpenChange) {
            onOpenChange(false);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleApplyFilter();
        }
    };

    return (
        <div className="absolute mt-2 p-1 bg-opacity-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center relative">
                <input
                    value={inputValue}
                    onChange={handleInternalChange}
                    onBlur={handleApplyFilter}
                    onKeyDown={handleKeyDown}
                    className={`w-full pr-7 px-2 py-1 text-left border rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-normal ${className}`}
                    {...props}
                />
                {inputValue && (
                    <button
                        onClick={handleClearInput}
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