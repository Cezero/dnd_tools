import React, { useState, useRef, useEffect } from 'react';
import Icon from '@mdi/react';
import { mdiCheck, mdiSetAll, mdiSetNone } from '@mdi/js';

const MultiSelect = ({ options, displayKey, valueKey, selected, onChange, placeholder, className, open, onOpenChange, logicType, onLogicChange }) => {
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
        const newSelected = selected.includes(optionValue)
            ? selected.filter(item => item !== optionValue)
            : [...selected, optionValue];
        onChange(newSelected);
    };

    const handleClearAll = () => {
        onChange([]);
    };

    const handleLogicButtonClick = (logic) => {
        if (onLogicChange) {
            onLogicChange(logic);
        }
    };

    return (
        <div
            className={`absolute mt-2 ${className} z-50 ` +
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
                            <span className={`block truncate ${selected.length === 0 ? 'font-semibold text-blue-500 dark:text-blue-300' : 'font-normal'}`} onClick={handleClearAll}>- Clear All -</span>
                            {onLogicChange && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleLogicButtonClick(logicType === 'or' ? 'and' : 'or'); }}
                                    className={`px-2 py-1 rounded-md text-sm flex items-center justify-center`}
                                    title={`Has ${logicType === 'or' ? 'any' : 'all'} selected ${displayKey}`}
                                >
                                    <Icon path={logicType === 'or' ? mdiSetNone : mdiSetAll} size={0.7} className="mr-1" />
                                </button>
                            )}
                        </div>
                        {options.map((option) => (
                            <div
                                key={option[valueKey]}
                                className={`relative block pl-5 pr-4 py-0.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 cursor-pointer ${selected.includes(option[valueKey]) ? 'font-semibold text-blue-500 dark:text-blue-300' : 'font-normal'}`}
                                onClick={() => handleOptionClick(option[valueKey])}
                            >
                                <span className={`block truncate ${selected.includes(option[valueKey]) ? 'text-blue-500 dark:text-blue-300' : ''}`}>
                                    {option[displayKey]}
                                </span>
                                {selected.includes(option[valueKey]) && (
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

export default MultiSelect; 