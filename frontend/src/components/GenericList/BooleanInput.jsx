import React, { useState, useRef, useEffect } from 'react';
import Icon from '@mdi/react';
import { mdiCheck } from '@mdi/js';

/**
 * A boolean input component for GenericList, similar to MultiSelect but with hardcoded 'True' and 'False' options.
 * @param {object} props - The component props.
 * @param {boolean|null} props.value - The currently selected boolean value (true, false, or null for no selection).
 * @param {function} props.onToggle - Callback function when the value changes.
 * @param {boolean} props.open - Whether the dropdown is open.
 * @param {function} props.onOpenChange - Callback function to change the open state of the dropdown.
 * @param {string} props.className - Additional CSS classes for styling.
 */
const BooleanInput = ({ value, onToggle, open, onOpenChange, className, appendClassName }) => {
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onOpenChange(false);
            }
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [open, onOpenChange]);

    const handleOptionClick = (optionValue) => {
        onToggle(optionValue === value ? null : optionValue);
    };

    const handleClearAll = () => {
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
                            <span className={`block truncate ${value === null ? 'font-semibold text-blue-500 dark:text-blue-300' : 'font-normal'}`} onClick={handleClearAll}>- Clear All -</span>
                        </div>
                        {options.map((option) => (
                            <div
                                key={String(option.value)}
                                className={`relative block pl-5 pr-4 py-0.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 cursor-pointer ${value === option.value ? 'font-semibold text-blue-500 dark:text-blue-300' : 'font-normal'}`}
                                onClick={() => handleOptionClick(option.value)}
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

export default BooleanInput;
