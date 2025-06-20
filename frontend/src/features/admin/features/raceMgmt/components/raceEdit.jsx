import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '@/services/api';
import lookupService from '@/services/LookupService';
import { SIZE_LIST } from 'shared-data/src/commonData';
import { LANGUAGE_LIST, LANGUAGE_MAP } from 'shared-data/src/commonData';
import { fetchRaceById } from '@/features/admin/features/raceMgmt/services/raceService';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import {TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { ChevronUpDownIcon } from '@heroicons/react/24/solid';

export default function RaceEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [race, setRace] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [editions, setEditions] = useState([]);
    const [sizes, setSizes] = useState([]);
    const [classes, setClasses] = useState([]);
    const [allLanguages, setAllLanguages] = useState([]);

    const filteredClasses = React.useMemo(() => {
        if (!classes || !race?.edition_id) {
            return [];
        }
        return classes.filter(cls => cls.edition_id === race.edition_id && cls.is_prestige_class === 0);
    }, [classes, race?.edition_id]);

    useEffect(() => {
        const fetchRaceAndLookups = async () => {
            try {
                await lookupService.initialize();
                const allEditions = lookupService.getAll('editions');
                setEditions(allEditions);
                const allClasses = lookupService.getAll('classes');
                setClasses(allClasses);
                setSizes(SIZE_LIST);
                setAllLanguages(LANGUAGE_LIST);

                if (id === 'new') {
                    setRace({
                        race_name: '',
                        edition_id: null,
                        display: true,
                        race_description: '',
                        size_id: 5, // Default to Medium
                        race_speed: 30, // Default to 30
                        favored_class_id: null,
                        languages: [],
                    });
                } else {
                    const data = await fetchRaceById(id);
                    setRace({
                        race_name: data.race_name,
                        edition_id: data.edition_id,
                        display: data.display === 1,
                        race_description: data.race_description,
                        size_id: data.size_id,
                        race_speed: data.race_speed,
                        favored_class_id: data.favored_class_id,
                        languages: data.languages || [],
                    });
                }
            } catch (err) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRaceAndLookups();
    }, [id]);

    const handleAddLanguage = useCallback((languageId, isAutomatic) => {
        setRace(prevRace => {
            const newLanguageEntry = { language_id: languageId, automatic: isAutomatic ? 1 : 0 };
            const existingIndex = prevRace.languages.findIndex(lang => lang.language_id === languageId);

            if (existingIndex !== -1) {
                const updatedLanguages = [...prevRace.languages];
                updatedLanguages[existingIndex] = newLanguageEntry;
                return { ...prevRace, languages: updatedLanguages };
            } else {
                return { ...prevRace, languages: [...prevRace.languages, newLanguageEntry] };
            }
        });
    }, []);

    const handleRemoveLanguage = useCallback((languageId) => {
        setRace(prevRace => ({
            ...prevRace,
            languages: prevRace.languages.filter(lang => lang.language_id !== languageId)
        }));
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setRace(prevRace => ({
            ...prevRace,
            [name]: type === 'checkbox' ? checked : (name === 'edition_id' ? parseInt(value) : value)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        try {
            const payload = {
                name: race.race_name,
                edition_id: race.edition_id ? parseInt(race.edition_id) : 0,
                display: race.display ? 1 : 0,
                race_description: race.race_description,
                size_id: race.size_id ? parseInt(race.size_id) : 5,
                race_speed: race.race_speed ? parseInt(race.race_speed) : 30,
                favored_class_id: race.favored_class_id ? parseInt(race.favored_class_id) : 0,
                languages: race.languages.map(lang => ({
                    language_id: lang.language_id,
                    automatic: lang.automatic,
                })),
            };

            if (id === 'new') {
                await api('/races', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
                setMessage('Race created successfully!');
                navigate(-1);
            } else {
                await api(`/races/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });
                setMessage('Race updated successfully!');
                navigate(-1);
            }
        } catch (err) {
            setError(err);
            setMessage(`Error updating race: ${err.message || err}`);
        }
    };

    const automaticLanguages = race?.languages.filter(lang => lang.automatic === 1) || [];
    const bonusLanguages = race?.languages.filter(lang => lang.automatic === 0) || [];

    if (isLoading) return <div className="p-4 bg-white dark:bg-[#121212]">Loading race for editing...</div>;
    if (error) return <div className="p-4 bg-white dark:bg-[#121212] dark:text-red-500">Error: {error.message}</div>;
    if (!race && id !== 'new') return <div className="p-4 bg-white dark:bg-[#121212]">Race not found.</div>;

    return (
        <div className="p-4 bg-white dark:bg-[#121212]">
            <h1 className="text-2xl font-bold mb-4">{id === 'new' ? 'Create New Race' : `Edit Race: ${race.race_name}`}</h1>
            {message && <div className="mb-4 p-2 rounded text-green-700 bg-green-100 dark:bg-green-800 dark:text-green-200">{message}</div>}
            {error && <div className="mb-4 p-2 rounded text-red-700 bg-red-100 dark:bg-red-800 dark:text-red-200">Error: {error.message || String(error)}</div>}
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="race_name" className="block text-lg font-medium">Race Name:</label>
                        <input type="text" id="race_name" name="race_name" value={race.race_name || ''} onChange={handleChange} className="mt-1 block w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label htmlFor="edition_id" className="block text-lg font-medium">Edition:</label>
                        <Listbox
                            value={race.edition_id || ''}
                            onChange={(selectedId) => handleChange({ target: { name: 'edition_id', value: selectedId } })}
                        >
                            {({ open }) => (
                                <div className="relative mt-1">
                                    <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600">
                                        <span className="block truncate">{editions.find(e => e.edition_id === race.edition_id)?.edition_abbrev || 'Select an edition'}</span>
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
                                        <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-gray-800 dark:text-gray-100">
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
                    <div>
                        <label htmlFor="race_description" className="block text-lg font-medium">Race Description:</label>
                        <textarea id="race_description" name="race_description" value={race.race_description || ''} onChange={handleChange} className="mt-1 block w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 h-32"></textarea>
                    </div>
                    <div>
                        <label htmlFor="size_id" className="block text-lg font-medium">Size:</label>
                        <Listbox
                            value={race.size_id || ''}
                            onChange={(selectedId) => handleChange({ target: { name: 'size_id', value: selectedId } })}
                        >
                            {({ open }) => (
                                <div className="relative mt-1">
                                    <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600">
                                        <span className="block truncate">{sizes.find(s => s.id === race.size_id)?.name || 'Select a size'}</span>
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
                                        <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-gray-800 dark:text-gray-100">
                                            <ListboxOption
                                                className={({ active }) =>
                                                    `relative cursor-default select-none py-2 pl-3 pr-9 ${active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-100'}`
                                                }
                                                value={null}
                                            >
                                                {({ selected, active }) => (
                                                    <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                        Select a size
                                                    </span>
                                                )}
                                            </ListboxOption>
                                            {sizes.map(size => (
                                                <ListboxOption
                                                    key={size.id}
                                                    className={({ active }) =>
                                                        `relative cursor-default select-none py-2 pl-3 pr-9 ${active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-100'}`
                                                    }
                                                    value={size.id}
                                                >
                                                    {({ selected, active }) => (
                                                        <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                            {size.name}
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
                    <div>
                        <label htmlFor="race_speed" className="block text-lg font-medium">Speed:</label>
                        <input type="number" id="race_speed" name="race_speed" value={race.race_speed || ''} onChange={handleChange} className="mt-1 block w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label htmlFor="favored_class_id" className="block text-lg font-medium">Favored Class:</label>
                        <Listbox
                            value={race.favored_class_id || null}
                            onChange={(selectedId) => handleChange({ target: { name: 'favored_class_id', value: selectedId } })}
                        >
                            {({ open }) => (
                                <div className="relative mt-1">
                                    <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600">
                                        <span className="block truncate">{filteredClasses.find(c => c.class_id === race.favored_class_id)?.class_name || 'Select a favored class'}</span>
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
                                        <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-gray-800 dark:text-gray-100">
                                            <ListboxOption
                                                className={({ active }) =>
                                                    `relative cursor-default select-none py-2 pl-3 pr-9 ${active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-100'}`
                                                }
                                                value={null}
                                            >
                                                {({ selected, active }) => (
                                                    <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                        Select a favored class
                                                    </span>
                                                )}
                                            </ListboxOption>
                                            {filteredClasses.map(cls => (
                                                <ListboxOption
                                                    key={cls.class_id}
                                                    className={({ active }) =>
                                                        `relative cursor-default select-none py-2 pl-3 pr-9 ${active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-100'}`
                                                    }
                                                    value={cls.class_id}
                                                >
                                                    {({ selected, active }) => (
                                                        <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                            {cls.class_name}
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
                    <div className="flex items-center">
                        <input type="checkbox" id="display" name="display" checked={race.display} onChange={handleChange} className="form-checkbox h-5 w-5 text-blue-600 rounded dark:bg-gray-700 dark:border-gray-600 accent-blue-600 checked:bg-blue-600 dark:checked:bg-blue-600" />
                        <label htmlFor="display" className="ml-2 text-lg font-medium">Display</label>
                    </div>
                </div>
                <div className="mt-4">
                    <h3 className="text-lg font-medium mb-2">Automatic Languages:</h3>
                    <div className="flex flex-wrap gap-2 mb-2 p-2 border rounded dark:border-gray-600 min-h-[40px]">
                        {automaticLanguages.length === 0 && <span className="text-gray-500 dark:text-gray-400">No automatic languages added.</span>}
                        {automaticLanguages.map(lang => (
                            <span key={lang.language_id} className="group relative bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-200 cursor-pointer">
                                {LANGUAGE_MAP[lang.language_id]?.name || 'Unknown Language'}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveLanguage(lang.language_id)}
                                    className="absolute inset-0 flex items-center justify-center bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remove Language"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </span>
                        ))}
                        <Listbox
                            value={null}
                            onChange={(selectedId) => {
                                if (selectedId) {
                                    handleAddLanguage(selectedId, true);
                                }
                            }}
                        >
                            {({ open }) => (
                                <div className="relative w-48">
                                    <ListboxButton className="relative cursor-default rounded-md bg-white p-1 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600">
                                        <span className="block truncate"><UserPlusIcon className="h-5 w-5" /></span>
                                    </ListboxButton>
                                    <Transition
                                        show={open}
                                        leave="transition ease-in duration-100"
                                        leaveFrom="opacity-100"
                                        leaveTo="opacity-0"
                                    >
                                        <ListboxOptions className="absolute z-10 mt-1 max-h-60 overflow-auto rounded-md bg-white text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-gray-800 dark:text-gray-100">
                                            {allLanguages
                                                .filter(lang => !race.languages.some(rl => rl.language_id === lang.id))
                                                .map(lang => (
                                                    <ListboxOption
                                                        key={lang.id}
                                                        className={({ active }) =>
                                                            `relative cursor-default select-none pl-2 pr-2 py-0.5 ${active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-100'}`
                                                        }
                                                        value={lang.id}
                                                    >
                                                        {({ selected, active }) => (
                                                            <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                                {lang.name}
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
                <div className="mt-4">
                    <h3 className="text-lg font-medium mb-2">Bonus Languages:</h3>
                    <div className="flex flex-wrap gap-2 mb-2 p-2 border rounded dark:border-gray-600 min-h-[40px]">
                        {bonusLanguages.length === 0 && <span className="text-gray-500 dark:text-gray-400">No bonus languages added.</span>}
                        {bonusLanguages.map(lang => (
                            <span key={lang.language_id} className="group relative bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-200 cursor-pointer">
                                {LANGUAGE_MAP[lang.language_id]?.name || 'Unknown Language'}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveLanguage(lang.language_id)}
                                    className="absolute inset-0 flex items-center justify-center bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remove Language"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </span>
                        ))}
                        <Listbox
                            value={null}
                            onChange={(selectedId) => {
                                if (selectedId) {
                                    handleAddLanguage(selectedId, false);
                                }
                            }}
                        >
                            {({ open }) => (
                                <div className="relative w-48">
                                    <ListboxButton className="relative cursor-default rounded-md bg-white p-1 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600">
                                        <span className="block truncate"><UserPlusIcon className="h-5 w-5" /></span>
                                    </ListboxButton>
                                    <Transition
                                        show={open}
                                        leave="transition ease-in duration-100"
                                        leaveFrom="opacity-100"
                                        leaveTo="opacity-0"
                                    >
                                        <ListboxOptions className="absolute z-10 mt-1 max-h-60 overflow-auto rounded-md bg-white text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-gray-800 dark:text-gray-100">
                                            {allLanguages
                                                .filter(lang => !race.languages.some(rl => rl.language_id === lang.id))
                                                .map(lang => (
                                                    <ListboxOption
                                                        key={lang.id}
                                                        className={({ active }) =>
                                                            `relative cursor-default select-none pl-2 pr-2 py-0.5 ${active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-100'}`
                                                        }
                                                        value={lang.id}
                                                    >
                                                        {({ selected, active }) => (
                                                            <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                                {lang.name}
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
                <div className="flex mt-4 gap-2">
                    <button type="submit" className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-white">Save Changes</button>
                    <button type="button" onClick={() => {
                        navigate(-1);
                    }} className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200">Cancel</button>
                </div>
            </form>
        </div>
    );
}