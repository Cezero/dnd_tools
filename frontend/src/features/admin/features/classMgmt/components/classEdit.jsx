import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '@/services/api';
import lookupService from '@/services/LookupService';
import { fetchClassById } from '@/features/admin/features/classMgmt/services/classService';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/24/solid';
import { RPG_DICE } from 'shared-data/src/commonData';

export default function ClassEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [cls, setCls] = useState(null); // Using 'cls' to avoid conflict with 'class' keyword
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [editions, setEditions] = useState([]);
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const fetchClassAndLookups = async () => {
            try {
                await lookupService.initialize();
                const allEditions = lookupService.getAll('editions');
                setEditions(allEditions);

                if (id === 'new') {
                    setCls({
                        class_name: '',
                        class_abbr: '',
                        edition_id: null,
                        is_prestige_class: false,
                        display: true,
                        caster: false,
                        hit_die: 1,
                    });
                } else {
                    const data = await fetchClassById(id);
                    setCls({
                        class_name: data.class_name,
                        class_abbr: data.class_abbr,
                        edition_id: data.edition_id,
                        is_prestige_class: data.is_prestige_class === 1,
                        display: data.display === 1,
                        caster: data.caster === 1,
                        hit_die: data.hit_die,
                    });
                }
            } catch (err) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchClassAndLookups();
    }, [id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setCls(prevCls => ({
            ...prevCls,
            [name]: type === 'checkbox' ? checked : (name === 'edition_id' || name === 'hit_die' ? parseInt(value) : value)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        try {
            const payload = {
                class_name: cls.class_name,
                class_abbr: cls.class_abbr,
                edition_id: cls.edition_id ? parseInt(cls.edition_id) : null,
                is_prestige_class: cls.is_prestige_class ? 1 : 0,
                display: cls.display ? 1 : 0,
                caster: cls.caster ? 1 : 0,
                hit_die: cls.hit_die ? parseInt(cls.hit_die) : 1,
            };

            if (id === 'new') {
                const response = await api('/classes', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
                setMessage('Class created successfully!');
                navigate(`/admin/classes/${response.id}`, { state: { fromListParams: fromListParams, refresh: true } });
            } else {
                await api(`/classes/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });
                setMessage('Class updated successfully!');
                navigate(`/admin/classes/${id}`, { state: { fromListParams: fromListParams, refresh: true } });
            }
        } catch (err) {
            setError(err);
            setMessage(`Error updating class: ${err.message || err}`);
        }
    };

    if (isLoading) return <div className="p-4 bg-white dark:bg-[#121212]">Loading class for editing...</div>;
    if (error) return <div className="p-4 bg-white dark:bg-[#121212] dark:text-red-500">Error: {error.message}</div>;
    if (!cls && id !== 'new') return <div className="p-4 bg-white dark:bg-[#121212]">Class not found.</div>;

    return (
        <div className="p-4 bg-white dark:bg-[#121212] scrollbar-track-gray-300 scrollbar-thumb-gray-400 dark:scrollbar-track-gray-700 dark:scrollbar-thumb-gray-500">
            <h1 className="text-2xl font-bold mb-4">{id === 'new' ? 'Create New Class' : `Edit Class: ${cls.class_name}`}</h1>
            {message && <div className="mb-4 p-2 rounded text-green-700 bg-green-100 dark:bg-green-800 dark:text-green-200">{message}</div>}
            {error && <div className="mb-4 p-2 rounded text-red-700 bg-red-100 dark:bg-red-800 dark:text-red-200">Error: {error.message || String(error)}</div>}
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                        <label htmlFor="class_name" className="block text-lg font-medium w-30">Class Name:</label>
                        <input type="text" id="class_name" name="class_name" value={cls.class_name || ''} onChange={handleChange} className="mt-1 block w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="class_abbr" className="block text-lg font-medium w-30">Abbreviation:</label>
                        <input type="text" id="class_abbr" name="class_abbr" value={cls.class_abbr || ''} onChange={handleChange} className="mt-1 block w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                        <div className="flex items-center gap-2 pr-2">
                            <label htmlFor="edition_id" className="block text-lg font-medium">Edition:</label>
                            <Listbox
                                value={cls.edition_id || ''}
                                onChange={(selectedId) => handleChange({ target: { name: 'edition_id', value: selectedId } })}
                            >
                                {({ open }) => (
                                    <div className="relative mt-1">
                                        <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600">
                                            <span className="block truncate">{editions.find(e => e.edition_id === cls.edition_id)?.edition_abbrev || 'Select an edition'}</span>
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
                                                    className={({ active }) =>
                                                        `relative cursor-default select-none py-2 pl-3 pr-9 ${active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-100'}`
                                                    }
                                                    value={null}
                                                >
                                                    {({ selected, active }) => (
                                                        <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                            Select an edition
                                                        </span>
                                                    )}
                                                </ListboxOption>
                                                {editions.map(edition => (
                                                    <ListboxOption
                                                        key={edition.edition_id}
                                                        className={({ active }) =>
                                                            `relative cursor-default select-none py-2 pl-3 pr-9 ${active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-100'}`
                                                        }
                                                        value={edition.edition_id}
                                                    >
                                                        {({ selected, active }) => (
                                                            <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                                {edition.edition_abbrev}
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
                        <div className="flex items-center gap-2">
                            <label htmlFor="is_prestige_class" className="ml-2 text-lg font-medium">Prestige Class</label>
                            <input type="checkbox" id="is_prestige_class" name="is_prestige_class" checked={cls.is_prestige_class} onChange={handleChange} className="form-checkbox h-5 w-5 text-blue-600 rounded dark:bg-gray-700 dark:border-gray-600 accent-blue-600 checked:bg-blue-600 dark:checked:bg-blue-600" />
                        </div>
                        <div className="flex items-center gap-2">
                            <label htmlFor="caster" className="ml-2 text-lg font-medium">Caster</label>
                            <input type="checkbox" id="caster" name="caster" checked={cls.caster} onChange={handleChange} className="form-checkbox h-5 w-5 text-blue-600 rounded dark:bg-gray-700 dark:border-gray-600 accent-blue-600 checked:bg-blue-600 dark:checked:bg-blue-600" />
                        </div>
                        <div className="flex items-center gap-2">
                            <label htmlFor="display" className="ml-2 text-lg font-medium">Display</label>
                            <input type="checkbox" id="display" name="display" checked={cls.display} onChange={handleChange} className="form-checkbox h-5 w-5 text-blue-600 rounded dark:bg-gray-700 dark:border-gray-600 accent-blue-600 checked:bg-blue-600 dark:checked:bg-blue-600" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="hit_die" className="block text-lg font-medium w-30">Hit Die:</label>
                        <Listbox
                            value={cls.hit_die || ''}
                            onChange={(selectedId) => handleChange({ target: { name: 'hit_die', value: selectedId } })}
                        >
                            {({ open }) => (
                                <div className="relative mt-1">
                                    <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600">
                                        <span className="block truncate">{RPG_DICE[cls.hit_die]?.name || 'Select a hit die'}</span>
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
                                                className={({ active }) =>
                                                    `relative cursor-default select-none py-2 pl-3 pr-9 ${active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-100'}`
                                                }
                                                value={null}
                                            >
                                                {({ selected, active }) => (
                                                    <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                        Select a hit die
                                                    </span>
                                                )}
                                            </ListboxOption>
                                            {Object.keys(RPG_DICE).map(dieKey => (
                                                <ListboxOption
                                                    key={dieKey}
                                                    className={({ active }) =>
                                                        `relative cursor-default select-none py-2 pl-3 pr-9 ${active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-100'}`
                                                    }
                                                    value={parseInt(dieKey)}
                                                >
                                                    {({ selected, active }) => (
                                                        <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                            {RPG_DICE[dieKey].name}
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
                </div>
                <div className="flex mt-4 gap-2 justify-end">
                    <button type="submit" className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-white">Save</button>
                    <button type="button" onClick={() => {
                        navigate(-1);
                    }} className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200">Cancel</button>
                </div>
            </form>
        </div>
    );
}