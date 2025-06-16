import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { mdiCheck, mdiChevronDown } from '@mdi/js';
import Icon from '@mdi/react';

const MultiSelect = ({ selected, onChange, options, placeholder, displayKey, valueKey, className, open: isOpenProp, logicType, onLogicChange }) => {
    const handleInternalChange = (newSelected) => {
        if (newSelected.includes("__CLEAR_ALL__")) {
            onChange([]);
        } else {
            onChange(newSelected);
        }
    };

    const handleLogicChange = (newLogic) => {
        if (onLogicChange) {
            onLogicChange(newLogic);
        }
    };

    return (
        <Listbox value={selected} onChange={handleInternalChange} multiple>
            {({ open }) => {
                const controlledOpen = typeof isOpenProp === 'boolean' ? isOpenProp : open;
                return (
                    <div className={`relative mt-0 ${className || ''}`}>
                        <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-1 pl-2 pr-8 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                            <span className="block truncate">
                                {selected.length === 0
                                    ? placeholder
                                    : selected.map(value => options.find(option => option[valueKey] === value)?.[displayKey] || '').join(', ')}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                <Icon path={mdiChevronDown} size={0.8} className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </span>
                        </Listbox.Button>

                        <Transition
                            show={controlledOpen}
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <Listbox.Options
                                className="absolute z-10 mt-1 max-h-80 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-gray-700 dark:ring-gray-600"
                            >
                                {onLogicChange && (
                                    <div className="p-1 border-b border-gray-200 dark:border-gray-600 flex justify-around mb-1 sticky top-0 bg-white dark:bg-gray-700 z-20">
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleLogicChange('or'); }}
                                            className={`px-3 py-1 rounded-md text-sm ${logicType === 'or' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'}`}
                                        >
                                            OR
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleLogicChange('and'); }}
                                            className={`px-3 py-1 rounded-md text-sm ${logicType === 'and' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'}`}
                                        >
                                            AND
                                        </button>
                                    </div>
                                )}
                                <Listbox.Option
                                    key="clear-all"
                                    className={({ active }) =>
                                        `relative cursor-default select-none py-1 pl-5 pr-0 ${active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-300'}`
                                    }
                                    value="__CLEAR_ALL__"
                                >
                                    {({ active }) => (
                                        <span className={`block truncate ${active ? 'font-semibold' : 'font-normal'}`}>Clear All</span>
                                    )}
                                </Listbox.Option>
                                {options.map((option) => (
                                    <Listbox.Option
                                        key={option[valueKey]}
                                        className={({ active }) =>
                                            `relative cursor-default select-none py-1 pl-5 pr-0 ${active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-300'
                                            }`
                                        }
                                        value={option[valueKey]}
                                    >
                                        {({ selected, active }) => (
                                            <>
                                                <span className={`block truncate ${selected ? 'font-semibold text-blue-400' : 'font-normal'}`}>
                                                    {option[displayKey]}
                                                </span>

                                                {selected ? (
                                                    <span
                                                        className={`absolute inset-y-0 left-0 flex items-center pl-0 ${active ? 'text-white' : 'text-blue-400'
                                                            }`}
                                                    >
                                                        <Icon path={mdiCheck} size={0.7} aria-hidden="true" />
                                                    </span>
                                                ) : null}
                                            </>
                                        )}
                                    </Listbox.Option>
                                ))}
                            </Listbox.Options>
                        </Transition>
                    </div>
                );
            }}
        </Listbox>
    );
};

export default React.memo(MultiSelect); 