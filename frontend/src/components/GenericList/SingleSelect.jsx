import React, { useRef, useEffect } from 'react';

const SingleSelect = ({ options, displayKey, valueKey, selected, onChange, placeholder, className, open, onOpenChange, appendClassName }) => {
    const dropdownRef = useRef(null);

    const selectedItem = options.find(option => option[valueKey] === selected);
    const displayValue = selectedItem ? selectedItem[displayKey] : (selected === '' ? placeholder : selected);

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
        onChange(optionValue);
        onOpenChange(false);
    };

    return (
        <div
            className={`${appendClassName} ${className}` +
                (open
                    ? ' p-1 bg-opacity-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg'
                    : '')
            }
            ref={dropdownRef}
            onClick={(e) => e.stopPropagation()}
        >
            {open && (
                <div className="w-full">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        <div
                            className={`block px-4 py-0.5 text-sm font-normal text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 cursor-pointer ${selected === ''
                                ? 'font-semibold text-blue-500 dark:text-blue-300'
                                : ''
                                }`}
                            onClick={() => handleOptionClick('')}
                        >
                            {placeholder}
                        </div>
                        {options.map((option) => (
                            <div
                                key={option[valueKey]}
                                className={`block px-4 py-0.5 text-sm font-normal text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 cursor-pointer ${selected === option[valueKey]
                                    ? 'font-semibold text-blue-500 dark:text-blue-300'
                                    : ''
                                    }`}
                                onClick={() => handleOptionClick(option[valueKey])}
                            >
                                {option[displayKey]}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SingleSelect; 