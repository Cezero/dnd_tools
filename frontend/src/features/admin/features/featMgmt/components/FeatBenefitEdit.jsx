import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { PROFICIENCY_TYPE_LIST } from 'shared-data/src/itemData';
import { SAVING_THROW_LIST } from 'shared-data/src/abilityData';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/24/solid';
import { FEAT_BENEFIT_TYPE_LIST, FEAT_BENEFIT_TYPES, FEAT_BENEFIT_TYPE_BY_ID } from 'shared-data/src/featData';
import LookupService from '@/services/LookupService';

export default function FeatBenefitEdit({ isOpen, onClose, onSave, initialBenefitData }) {
    const [benefit, setBenefit] = useState(initialBenefitData);
    const [benefit_type_name, setBenefitTypeName] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lookupsInitialized, setLookupsInitialized] = useState(false);
    const [skills, setSkills] = useState([]);


    useEffect(() => {
        const initializeLookups = async () => {
            try {
                await LookupService.initialize();
                setSkills(LookupService.getAll('skills'));
                setLookupsInitialized(true);
                console.log('[FeatBenefitEdit] Lookups initialized. Skills:', LookupService.getAll('skills'));
            } catch (error) {
                console.error('[FeatBenefitEdit] Failed to initialize lookup service:', error);
            }
        };
        initializeLookups();
    }, []);

    useEffect(() => {
        console.log('[FeatBenefitEdit] useEffect initialBenefitData/benefit.benefit_id triggered');
        console.log('[FeatBenefitEdit] initialBenefitData:', initialBenefitData);
        console.log('[FeatBenefitEdit] Current benefit state before potential update in useEffect:', benefit);

        if (initialBenefitData && initialBenefitData.benefit_id !== undefined && initialBenefitData.benefit_id !== null) {
            if (benefit.benefit_id === 'new' || initialBenefitData.benefit_id !== benefit.benefit_id) {
                console.log('[FeatBenefitEdit] Setting benefit from initialBenefitData in useEffect', initialBenefitData);
                setBenefit(initialBenefitData);
                if (initialBenefitData.benefit_type) {
                    setBenefitTypeName(FEAT_BENEFIT_TYPE_BY_ID[initialBenefitData.benefit_type].name);
                }
                setIsLoading(false);
            } else if (isLoading) {
                console.log('[FeatBenefitEdit] Same benefit, marking isLoading false in useEffect');
                setIsLoading(false);
            }
        } else {
            console.log('[FeatBenefitEdit] No initialBenefitData or new benefit. Current isLoading in useEffect:', isLoading);
            if (isLoading) {
                setIsLoading(false);
            }
        }
    }, [initialBenefitData, benefit.benefit_id, isLoading]);

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        console.log('[FeatBenefitEdit] handleChange called. Name:', name, 'Value:', value);
        setBenefit(prevBenefit => {
            const newState = {
                ...prevBenefit,
                [name]: type === 'checkbox' ? checked : (name === 'benefit_type' ? parseInt(value) : value)
            };
            console.log('[FeatBenefitEdit] handleChange: New state after update:', newState);
            return newState;
        });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        try {
            const payload = {
                feat_id: benefit.feat_id,
                benefit_type: benefit.benefit_type,
                benefit_type_id: benefit.benefit_type_id,
                benefit_amount: benefit.benefit_amount,
            };

            let result;
            if (benefit.benefit_id === 'new') {
                result = { ...payload, benefit_id: Date.now() };
                setMessage('Feat benefit created successfully!');
            } else {
                result = payload;
                setMessage('Feat benefit updated successfully!');
            }
            onSave(result);
            onClose();

        } catch (err) {
            setError(err);
            setMessage(`Error: ${err.message || err}`);
        }
    };

    const getDynamicOptions = useCallback((dyn_benefit_type) => {
        console.log('[FeatBenefitEdit] getDynamicOptions called. dyn_benefit_type:', dyn_benefit_type);
        switch (dyn_benefit_type) {
            case FEAT_BENEFIT_TYPES.SKILL.id:
                return skills.map(skill => ({ id: skill.skill_id, name: skill.skill_name }));
            case FEAT_BENEFIT_TYPES.PROFICIENCY.id:
                return PROFICIENCY_TYPE_LIST;
            case FEAT_BENEFIT_TYPES.SAVE.id:
                return SAVING_THROW_LIST;
            default:
                return [];
        }
    }, [skills]);

    if (isLoading || !lookupsInitialized) return <div className="p-4 bg-white dark:bg-[#121212]">Loading feat benefit for editing...</div>;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-visible rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-800">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                                >
                                    {benefit.benefit_id === 'new' ? 'Create New Feat Benefit' : `Edit Feat Benefit`}
                                </Dialog.Title>
                                {message && <div className="mb-4 p-2 rounded text-green-700 bg-green-100 dark:bg-green-800 dark:text-green-200">{message}</div>}
                                {error && <div className="mb-4 p-2 rounded text-red-700 bg-red-100 dark:bg-red-800 dark:text-red-200">Error: {error.message || String(error)}</div>}

                                <form onSubmit={handleSubmit} className="mt-4">
                                    <input type="hidden" name="feat_id" value={benefit.feat_id || ''} />

                                    <div className="mb-4">
                                        <label htmlFor="benefit_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Benefit Type:</label>
                                        <Listbox
                                            value={benefit.benefit_type}
                                            onChange={(selectedId) => {
                                                console.log('[FeatBenefitEdit] Listbox benefit_type onChange. Selected ID:', selectedId);
                                                setBenefit(prevBenefit => {
                                                    const newState = {
                                                        ...prevBenefit,
                                                        benefit_type: selectedId,
                                                    };
                                                    setBenefitTypeName((selectedId ? FEAT_BENEFIT_TYPE_BY_ID[selectedId].name : ''));
                                                    console.log('[FeatBenefitEdit] Listbox benefit_type: New state after update:', newState);
                                                    return newState;
                                                });
                                            }}
                                        >
                                            {({ open }) => (
                                                <div className="relative mt-1">
                                                    <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600">
                                                        <span className="block truncate">{benefit_type_name ? benefit_type_name : 'Set Benefit Type'}</span>
                                                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                        </span>
                                                    </ListboxButton>
                                                    <Transition
                                                        show={open}
                                                        leave="transition ease-in duration-100"
                                                        leaveFrom="opacity-100"
                                                        leaveTo="opacity-0"
                                                    >
                                                        <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto scrollbar-thin rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-gray-800 dark:text-gray-100">
                                                            <ListboxOption
                                                                className={({ focus }) =>
                                                                    `relative cursor-default select-none py-2 pl-3 pr-9 ${focus ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-100'}`
                                                                }
                                                                value={null}
                                                            >
                                                                {({ selected, focus }) => (
                                                                    <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                                        Select a benefit type
                                                                    </span>
                                                                )}
                                                            </ListboxOption>
                                                            {FEAT_BENEFIT_TYPE_LIST.map(type => (
                                                                <ListboxOption
                                                                    key={type.id}
                                                                    className={({ focus }) =>
                                                                        `relative cursor-default select-none py-2 pl-3 pr-9 ${focus ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-100'}`
                                                                    }
                                                                    value={type.id}
                                                                >
                                                                    {({ selected, focus }) => (
                                                                        <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                                            {type.name}
                                                                        </span>
                                                                    )}
                                                                </ListboxOption>
                                                            ))}
                                                        </ListboxOptions>
                                                    </Transition>
                                                </div>
                                            )}
                                        </Listbox>
                                    </div>
                                    {benefit.benefit_type && (
                                        <div className="mb-4">
                                            <label htmlFor="benefit_type_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{benefit_type_name} ID:</label>
                                            <Listbox
                                                value={benefit.benefit_type_id}
                                                onChange={(selectedId) => {
                                                    console.log('[FeatBenefitEdit] Listbox benefit_type_id onChange. Selected ID:', selectedId);
                                                    setBenefit(prevBenefit => {
                                                        const newState = {
                                                            ...prevBenefit,
                                                            benefit_type_id: selectedId
                                                        };
                                                        console.log('[FeatBenefitEdit] Listbox benefit_type_id: New state after update:', newState);
                                                        return newState;
                                                    });
                                                }}
                                            >
                                                {({ open }) => (
                                                    <div className="relative mt-1">
                                                        <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600">
                                                            <span className="block truncate">
                                                                {benefit.benefit_type_id
                                                                    ? getDynamicOptions(benefit.benefit_type).find(option => option.id === benefit.benefit_type_id)?.name || 'Select an item'
                                                                    : (benefit.benefit_type && benefit_type_name
                                                                        ? `Select a ${benefit_type_name}`
                                                                        : 'Select an item')}
                                                            </span>
                                                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                            </span>
                                                        </ListboxButton>
                                                        <Transition
                                                            show={open}
                                                            leave="transition ease-in duration-100"
                                                            leaveFrom="opacity-100"
                                                            leaveTo="opacity-0"
                                                        >
                                                            <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto scrollbar-thin rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-gray-800 dark:text-gray-100">
                                                                <ListboxOption
                                                                    className={({ focus }) =>
                                                                        `relative cursor-default select-none py-2 pl-3 pr-9 ${focus ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-100'}`
                                                                    }
                                                                    value={null}
                                                                >
                                                                    {({ selected, focus }) => (
                                                                        <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                                            Select an item
                                                                        </span>
                                                                    )}
                                                                </ListboxOption>
                                                                {getDynamicOptions(benefit.benefit_type).map(option => (
                                                                    <ListboxOption
                                                                        key={option.id}
                                                                        className={({ focus }) =>
                                                                            `relative cursor-default select-none py-2 pl-3 pr-9 ${focus ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-100'}`
                                                                        }
                                                                        value={option.id}
                                                                    >
                                                                        {({ selected, focus }) => (
                                                                            <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                                                {option.name}
                                                                            </span>
                                                                        )}
                                                                    </ListboxOption>
                                                                ))}
                                                            </ListboxOptions>
                                                        </Transition>
                                                    </div>
                                                )}
                                            </Listbox>
                                        </div>
                                    )}
                                    <div className="mb-4">
                                        <label htmlFor="benefit_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Benefit Amount:</label>
                                        <input
                                            type="text"
                                            id="benefit_amount"
                                            name="benefit_amount"
                                            value={benefit.benefit_amount || ''}
                                            onChange={handleChange}
                                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                                        />
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-md border border-transparent bg-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200 mr-2"
                                            onClick={onClose}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                        >
                                            {benefit.benefit_id === 'new' ? 'Create Benefit' : 'Update Benefit'}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
} 