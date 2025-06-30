import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Api } from '@/services/Api';
import { SIZE_LIST, SIZE_MAP, LANGUAGE_LIST, LANGUAGE_MAP, EDITION_LIST, EDITION_MAP, GetBaseClassesByEdition, CLASS_MAP, ABILITY_LIST } from '@shared/static-data';
import { FetchRaceById } from '@/features/admin/features/raceMgmt/RaceService';
import { ProcessMarkdown } from '@/components/Markdown/ProcessMarkdown';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import { TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { ChevronUpDownIcon } from '@heroicons/react/24/solid';
import { MarkdownEditor } from '@/components/Markdown/MarkdownEditor';
import { RaceTraitAssoc } from '@/features/admin/features/raceMgmt/components/RaceTraitAssoc';
import pluralize from 'pluralize';

export function RaceEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [race, setRace] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [isAddTraitModalOpen, setIsAddTraitModalOpen] = useState(false);
    const [focusedAbilityId, setFocusedabilityId] = useState(null);
    const [editingAbilityValue, setEditingabilityValue] = useState('');
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const FetchRace = async () => {
            try {
                if (id === 'new') {
                    setRace({
                        name: '',
                        edition_id: null,
                        display: true,
                        desc: '',
                        size_id: 5, // Default to Medium
                        speed: 30, // Default to 30
                        favored_class_id: -1,
                        languages: [],
                        adjustments: ABILITY_LIST.map(attr => ({ ability_id: attr.id, adjustment: 0 })),
                    });
                } else {
                    const data = await FetchRaceById(id);
                    setRace({
                        name: data.name,
                        edition_id: data.edition_id,
                        display: data.display === 1,
                        desc: data.desc,
                        size_id: data.size_id,
                        speed: data.speed,
                        favored_class_id: data.favored_class_id,
                        languages: data.languages || [],
                        adjustments: data.adjustments || ABILITY_LIST.map(attr => ({ ability_id: attr.id, adjustment: 0 })),
                        traits: data.traits || [],
                    });
                }
            } catch (err) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        FetchRace();
    }, [id]);

    /**
     * Handles adding a language to the race, distinguishing between is_automatic and bonus languages.
     * If the language already exists in the race's language list, it updates the existing entry;
     * otherwise, it adds a new entry. The `is_automatic` flag determines if the language is acquired
     * is_automatically by the race or as a bonus.
     *
     * @param {number} languageId - The ID of the language to add.
     * @param {boolean} isAutomatic - True if the language is is_automatic, false for bonus language.
     * @returns {void}
     */
    const handleAddLanguage = useCallback((languageId, isAutomatic) => {
        setRace(prevRace => {
            const newLanguageEntry = { language_id: languageId, is_automatic: isAutomatic ? 1 : 0 };
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

    /**
     * Handles the removal of a language from the race's language list.
     * It filters out the language with the specified `languageId` from the `languages` array
     * in the race state, effectively removing it from both is_automatic and bonus language lists.
     *
     * @param {number} languageId - The ID of the language to remove.
     * @returns {void}
     */
    const handleRemoveLanguage = useCallback((languageId) => {
        setRace(prevRace => ({
            ...prevRace,
            languages: prevRace.languages.filter(lang => lang.language_id !== languageId)
        }));
    }, []);

    /**
     * Handles changes to an ability adjustment for the race.
     * It updates the `adjustments` array in the race state.
     * If an adjustment for the given `abilityId` already exists, it updates its value;
     * otherwise, it adds a new adjustment entry.
     * The `value` is parsed as an integer, defaulting to 0 if invalid.
     *
     * @param {number} abilityId - The ID of the ability to adjust.
     * @param {string} value - The new value for the ability adjustment, as a string.
     * @returns {void}
     */
    const handleabilityChange = useCallback((abilityId, parsedValue) => {
        setRace(prevRace => {
            const existingIndex = prevRace.adjustments.findIndex(adj => adj.ability_id === abilityId);
            const newAdjustment = { ability_id: abilityId, adjustment: parsedValue };

            if (existingIndex !== -1) {
                const updatedAdjustments = [...prevRace.adjustments];
                updatedAdjustments[existingIndex] = newAdjustment;
                return { ...prevRace, adjustments: updatedAdjustments };
            } else {
                return { ...prevRace, adjustments: [...prevRace.adjustments, newAdjustment] };
            }
        });
    }, []);

    /**
     * Handles changes to form input fields and updates the race state accordingly.
     * It supports text inputs, number inputs, and checkboxes, converting values to the appropriate type.
     *
     * @param {Object} e - The event object from the input change.
     * @param {Object} e.target - The target element of the event.
     * @param {string} e.target.name - The name ability of the input element, used as the key in the race state.
     * @param {string|boolean} e.target.value - The new value of the input element.
     * @param {string} e.target.type - The type of the input element (e.g., 'text', 'checkbox').
     * @param {boolean} e.target.checked - The checked state of a checkbox, if applicable.
     * @returns {void}
     */
    const HandleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setRace(prevRace => ({
            ...prevRace,
            [name]: type === 'checkbox' ? checked : (name === 'edition_id' ? parseInt(value) : value)
        }));
    };

    /**
     * Handles adding or updating race traits. It processes an array of selected trait objects,
     * ensuring that existing `value`s are preserved if `has_value` is true for that trait,
     * and setting `value` to an empty string for new traits where `has_value` is true.
     * After processing, it updates the race state with the modified traits and closes the modal.
     *
     * @param {Array<Object>} selectedTraitObjects - An array of trait objects selected from the trait association modal.
     * @param {number} selectedTraitObjects[].slug - The ID of the trait.
     * @param {string} selectedTraitObjects[].name - The name of the trait.
     * @param {string} selectedTraitObjects[].desc - The description of the trait.
     * @param {number} selectedTraitObjects[].has_value - A flag indicating if the trait has an associated value (1 for true, 0 for false).
     * @returns {void}
     */
    const handleAddOrUpdateTrait = useCallback((selectedTraitObjects) => {
        setRace(prevRace => {
            // Create a map of existing traits for quick lookup by slug
            const existingTraitsMap = new Map(prevRace.traits.map(t => [t.trat_slug, t]));

            const updatedTraits = selectedTraitObjects.map(selectedTrait => {
                const existingTrait = existingTraitsMap.get(selectedTrait.slug);
                return {
                    ...selectedTrait,
                    // Preserve value if it was previously set for this trait and has_value is 1
                    value: existingTrait && existingTrait.has_value === 1 ? existingTrait.value : (selectedTrait.has_value === 1 ? '' : ''),
                };
            });
            return { ...prevRace, traits: updatedTraits };
        });
        setIsAddTraitModalOpen(false);
    }, []);

    useEffect(() => {
        if (location.state?.newTrait) {
            handleAddOrUpdateTrait([location.state.newTrait]); // Wrap newTrait in an array
            setIsAddTraitModalOpen(true); // Re-open the modal
            // Clear the state to prevent re-adding the trait on subsequent renders
            // navigate(location.pathname, { replace: true, state: {} }); // This line might be causing the issue
        }
    }, [location.state, handleAddOrUpdateTrait, navigate, location.pathname]);

    /**
     * Handles the deletion of a race trait from the current race.
     * Displays a confirmation dialog to the user before proceeding with the deletion.
     * If confirmed, it filters the `traits` array in the race state to remove the specified trait
     * and sets a success message. This operation only removes the trait from the race object
     * in the local state; it does not interact with the backend API for deletion.
     *
     * @param {number} traitSlug - The ID of the trait to be removed.
     * @returns {Promise<void>} A promise that resolves once the trait is removed from the state.
     */
    const handleDeleteTrait = useCallback(async (traitSlug) => {
        if (window.confirm('Are you sure you want to remove this trait from the race?')) {
            setRace(prevRace => ({
                ...prevRace,
                traits: prevRace.traits.filter(trait => trait.slug !== traitSlug)
            }));
            setMessage('Trait removed successfully from race!');
        }
    }, []);

    /**
     * Handles the form submission for creating or updating a race.
     * Prevents the default form submission behavior, clears any existing messages or errors,
     * and constructs the payload based on the current race state. It filters out ability
     * adjustments with a value of 0 and maps trait objects to include only `slug` and
     * `value`.
     * It then calls the appropriate API endpoint (`POST` for new races, `PUT` for existing) and
     * navigates to the admin races list on success, or sets an error message on failure.
     *
     * @param {Event} e - The form submission event.
     * @returns {Promise<void>} A promise that resolves once the race is successfully created or updated.
     */
    const HandleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        try {
            const payload = {
                name: race.name,
                edition_id: race.edition_id ? parseInt(race.edition_id) : 0,
                display: race.display ? 1 : 0,
                desc: race.desc,
                size_id: race.size_id ? parseInt(race.size_id) : 5,
                speed: race.speed ? parseInt(race.speed) : 30,
                favored_class_id: race.favored_class_id === -1 ? -1 : (race.favored_class_id ? parseInt(race.favored_class_id) : 0),
                languages: race.languages
            };
            const filteredAbilityAdjustments = race.adjustments.filter(adj => adj.adjustment !== 0);
            if (filteredAbilityAdjustments.length > 0) {
                payload.adjustments = filteredAbilityAdjustments;
            }
            if (race.traits && race.traits.length > 0) {
                payload.traits = race.traits;
            }

            if (id === 'new') {
                const response = await Api('/races', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
                setMessage('Race created successfully!');
                navigate(`/admin/races/${response.id}`, { state: { fromListParams: fromListParams, refresh: true } });
            } else {
                await Api(`/races/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });
                setMessage('Race updated successfully!');
                navigate(`/admin/races/${id}`, { state: { fromListParams: fromListParams, refresh: true } });
            }
        } catch (err) {
            setError(err);
            setMessage(`Error updating race: ${err.message || err}`);
        }
    };

    const is_automaticLanguages = race?.languages.filter(lang => lang.is_automatic === 1) || [];
    const bonusLanguages = race?.languages.filter(lang => lang.is_automatic === 0) || [];

    if (isLoading) return <div className="p-4 bg-white dark:bg-[#121212]">Loading race for editing...</div>;
    if (error) return <div className="p-4 bg-white dark:bg-[#121212] dark:text-red-500">Error: {error.message}</div>;
    if (!race && id !== 'new') return <div className="p-4 bg-white dark:bg-[#121212]">Race not found.</div>;

    return (
        <div className="p-4 bg-white dark:bg-[#121212] scrollbar-track-gray-300 scrollbar-thumb-gray-400 dark:scrollbar-track-gray-700 dark:scrollbar-thumb-gray-500">
            <h1 className="text-2xl font-bold mb-4">{id === 'new' ? 'Create New Race' : `Edit Race: ${race.name}`}</h1>
            {message && <div className="mb-4 p-2 rounded text-green-700 bg-green-100 dark:bg-green-800 dark:text-green-200">{message}</div>}
            {error && <div className="mb-4 p-2 rounded text-red-700 bg-red-100 dark:bg-red-800 dark:text-red-200">Error: {error.message || String(error)}</div>}
            <form onSubmit={HandleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                        <label htmlFor="name" className="block text-lg font-medium w-30">Race Name:</label>
                        <input type="text" id="name" name="name" value={race.name || ''} onChange={HandleChange} className="mt-1 block w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                        <div className="flex items-center gap-2 pr-2">
                            <label htmlFor="edition_id" className="block text-lg font-medium">Edition:</label>
                            <Listbox
                                value={race.edition_id || ''}
                                onChange={(selectedId) => HandleChange({ target: { name: 'edition_id', value: selectedId } })}
                            >
                                {({ open }) => (
                                    <div className="relative mt-1">
                                        <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600">
                                            <span className="block truncate">{EDITION_MAP[race.edition_id]?.abbr || 'Select an edition'}</span>
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
                                                    {({ selected }) => (
                                                        <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                            Select an edition
                                                        </span>
                                                    )}
                                                </ListboxOption>
                                                {EDITION_LIST.map(edition => (
                                                    <ListboxOption
                                                        key={edition.id}
                                                        className={({ focus }) =>
                                                            `relative cursor-default select-none py-2 pl-3 pr-9 ${focus ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-100'}`
                                                        }
                                                        value={edition.id}
                                                    >
                                                        {({ selected }) => (
                                                            <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                                {edition.abbr}
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
                            <label htmlFor="display" className="ml-2 text-lg font-medium">Display</label>
                            <input type="checkbox" id="display" name="display" checked={race.display} onChange={HandleChange} className="form-checkbox h-5 w-5 text-blue-600 rounded dark:bg-gray-700 dark:border-gray-600 accent-blue-600 checked:bg-blue-600 dark:checked:bg-blue-600" />
                        </div>
                    </div>
                    <div className="md:col-span-2 mb-0">
                        <MarkdownEditor
                            id="desc"
                            name="desc"
                            label="Race Description"
                            value={race.desc || ''}
                            onChange={(newValue) => HandleChange({ target: { name: 'desc', value: newValue } })}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-0">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <label htmlFor="size_id" className="block text-lg font-medium">Size:</label>
                                <Listbox
                                    value={race.size_id || ''}
                                    onChange={(selectedId) => HandleChange({ target: { name: 'size_id', value: selectedId } })}
                                >
                                    {({ open }) => (
                                        <div className="relative mt-1">
                                            <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600">
                                                <span className="block truncate">{SIZE_MAP[race.size_id]?.name || 'Select a size'}</span>
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
                                                <ListboxOptions className="absolute scrollbar-thin z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-gray-800 dark:text-gray-100">
                                                    <ListboxOption
                                                        className={({ focus }) =>
                                                            `relative cursor-default select-none py-2 pl-3 pr-9 ${focus ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-100'}`
                                                        }
                                                        value={null}
                                                    >
                                                        {({ selected }) => (
                                                            <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                                Select a size
                                                            </span>
                                                        )}
                                                    </ListboxOption>
                                                    {SIZE_LIST.map(size => (
                                                        <ListboxOption
                                                            key={size.id}
                                                            className={({ focus }) =>
                                                                `relative cursor-default select-none py-2 pl-3 pr-9 ${focus ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-100'}`
                                                            }
                                                            value={size.id}
                                                        >
                                                            {({ selected }) => (
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
                            <div className="flex items-center gap-2">
                                <label htmlFor="speed" className="block text-lg font-medium">Speed:</label>
                                <input type="number" id="speed" name="speed" value={race.speed || ''} onChange={HandleChange} className="mt-1 block w-20 p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label htmlFor="favored_class_id" className="block text-lg font-medium">Favored Class:</label>
                                <Listbox
                                    value={race.favored_class_id || null}
                                    onChange={(selectedId) => HandleChange({ target: { name: 'favored_class_id', value: selectedId } })}
                                >
                                    {({ open }) => (
                                        <div className="relative mt-1">
                                            <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600">
                                                <span className="block truncate">{CLASS_MAP[race.favored_class_id]?.name || (race.favored_class_id === -1 ? 'Any' : 'Select a favored class')}</span>
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
                                                <ListboxOptions className="absolute scrollbar-thin z-10 mt-1 max-h-60 w-30 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-gray-800 dark:text-gray-100">
                                                    <ListboxOption
                                                        className={({ focus }) =>
                                                            `relative cursor-default select-none py-2 pl-3 pr-9 ${focus ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-100'}`
                                                        }
                                                        value={-1}
                                                    >
                                                        {({ selected }) => (
                                                            <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                                Any
                                                            </span>
                                                        )}
                                                    </ListboxOption>
                                                    {GetBaseClassesByEdition(race.edition_id).map(cls => (
                                                        <ListboxOption
                                                            key={cls.class_id}
                                                            className={({ focus }) =>
                                                                `relative cursor-default select-none py-2 pl-3 pr-9 ${focus ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-100'}`
                                                            }
                                                            value={cls.id}
                                                        >
                                                            {({ selected }) => (
                                                                <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                                    {cls.name}
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
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-medium">Ability Adjustments:</h3>
                            <div className="p-2 border rounded dark:border-gray-600">
                                <div className="grid grid-cols-3 gap-2">
                                    {ABILITY_LIST.map(ability => (
                                        <div key={ability.id} className="flex items-center gap-2">
                                            <label htmlFor={`attr-${ability.id}`} className="text-sm font-medium w-20">{ability.name}:</label>
                                            <input
                                                type="text"
                                                id={`attr-${ability.id}`}
                                                name={`ability_${ability.id}`}
                                                value={focusedAbilityId === ability.id ? editingAbilityValue : (() => {
                                                    const adjustment = race.adjustments.find(adj => adj.ability_id === ability.id)?.adjustment || 0;
                                                    return adjustment > 0 ? `+${adjustment}` : adjustment;
                                                })()}
                                                onChange={(e) => setEditingabilityValue(e.target.value)}
                                                onFocus={() => {
                                                    setFocusedabilityId(ability.id);
                                                    const currentAdjustment = race.adjustments.find(adj => adj.ability_id === ability.id)?.adjustment || 0;
                                                    setEditingabilityValue(String(currentAdjustment));
                                                }}
                                                onBlur={() => {
                                                    const parsedValue = editingAbilityValue === '' || editingAbilityValue === '-' ? 0 : parseInt(editingAbilityValue) || 0;
                                                    handleabilityChange(ability.id, parsedValue);
                                                    setFocusedabilityId(null);
                                                    setEditingabilityValue('');
                                                }}
                                                className="mt-1 block w-10 p-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="mt-0">
                            <h3 className="text-lg font-medium mb-2">Automatic Languages:</h3>
                            <div className="flex flex-wrap gap-2 mb-2 p-2 pl-3 border rounded dark:border-gray-600 min-h-[40px]">
                                {is_automaticLanguages.length === 0 && <span className="text-gray-500 dark:text-gray-400">No is_automatic languages added.</span>}
                                {is_automaticLanguages.map((lang, index) => (
                                    <span key={lang.language_id} className="group relative text-sm pt-1 pb-1 pl-0 pr-0 cursor-pointer">
                                        {LANGUAGE_MAP[lang.language_id]?.name || 'Unknown Language'}
                                        {index < is_automaticLanguages.length - 1 && ','}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveLanguage(lang.language_id)}
                                            className="absolute inset-0 flex items-center justify-center text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
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
                                        <div className="relative w-48 pl-1">
                                            <ListboxButton className="relative cursor-default rounded-md bg-white p-1 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600">
                                                <span className="block truncate"><UserPlusIcon className="h-5 w-5" /></span>
                                            </ListboxButton>
                                            <Transition
                                                show={open}
                                                leave="transition ease-in duration-100"
                                                leaveFrom="opacity-100"
                                                leaveTo="opacity-0"
                                            >
                                                <ListboxOptions className="absolute scrollbar-thin z-10 mt-1 max-h-60 overflow-auto rounded-md bg-white text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-gray-800 dark:text-gray-100">
                                                    {LANGUAGE_LIST
                                                        .filter(lang => !race.languages.some(rl => rl.language_id === lang.id))
                                                        .map(lang => (
                                                            <ListboxOption
                                                                key={lang.id}
                                                                className={({ focus }) =>
                                                                    `relative cursor-default select-none pl-2 pr-2 py-0.5 ${focus ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-100'}`
                                                                }
                                                                value={lang.id}
                                                            >
                                                                {({ selected }) => (
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
                            <div className="flex flex-wrap gap-2 mb-2 p-2 pl-3 border rounded dark:border-gray-600 min-h-[40px]">
                                {bonusLanguages.length === 0 && <span className="text-gray-500 dark:text-gray-400">No bonus languages added.</span>}
                                {bonusLanguages.map((lang, index) => (
                                    <span key={lang.language_id} className="group relative text-sm pt-1 pb-1 pl-0 pr-0 cursor-pointer">
                                        {LANGUAGE_MAP[lang.language_id]?.name || 'Unknown Language'}
                                        {index < bonusLanguages.length - 1 && ','}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveLanguage(lang.language_id)}
                                            className="absolute inset-0 flex items-center justify-center text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
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
                                        <div className="relative w-48 pl-1">
                                            <ListboxButton className="relative cursor-default rounded-md bg-white p-1 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600">
                                                <span className="block truncate"><UserPlusIcon className="h-5 w-5" /></span>
                                            </ListboxButton>
                                            <Transition
                                                show={open}
                                                leave="transition ease-in duration-100"
                                                leaveFrom="opacity-100"
                                                leaveTo="opacity-0"
                                            >
                                                <ListboxOptions className="absolute scrollbar-thin z-50 mt-1 max-h-60 overflow-auto rounded-md bg-white text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-gray-800 dark:text-gray-100">
                                                    {LANGUAGE_LIST
                                                        .filter(lang => !race.languages.some(rl => rl.language_id === lang.id))
                                                        .map(lang => (
                                                            <ListboxOption
                                                                key={lang.id}
                                                                className={({ focus }) =>
                                                                    `relative cursor-default select-none pl-2 pr-2 py-0.5 ${focus ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-100'}`
                                                                }
                                                                value={lang.id}
                                                            >
                                                                {({ selected }) => (
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
                    </div>
                </div>
                <div className="md:col-span-2">
                    <h3 className="text-lg font-medium mb-2">Race Traits</h3>
                    {race.traits && race.traits.length > 0 ? (
                        <div className="space-y-2 border p-3 rounded dark:border-gray-600 mb-2">
                            {race.traits.map(trait => (
                                <div key={trait.slug} className="rounded border p-2 dark:border-gray-700 grid grid-cols-[2fr_0.1fr] gap-2 items-center">
                                    <div className="w-full">
                                        <ProcessMarkdown markdown={trait.desc} userVars={{
                                            traitname: trait.name,
                                            racename: race.name,
                                            racenamelower: race.name.toLowerCase(),
                                            raceplural: pluralize(race.name),
                                            raceplurallower: pluralize(race.name).toLowerCase(),
                                            value: trait.value
                                        }} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {trait.has_value === 1 && (
                                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                                                <span>Value:</span>
                                                <input
                                                    type="text"
                                                    value={trait.value || ''}
                                                    onChange={(e) => {
                                                        const newValue = e.target.value;
                                                        setRace(prevRace => ({
                                                            ...prevRace,
                                                            traits: prevRace.traits.map(t =>
                                                                t.slug === trait.slug ? { ...t, value: newValue } : t
                                                            )
                                                        }));
                                                    }}
                                                    className="w-20 p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                                />
                                            </div>
                                        )}
                                        <button type="button" onClick={() => handleDeleteTrait(trait.slug)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600">
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-gray-500 dark:text-gray-400 mb-2">No traits added yet.</div>
                    )}

                    <button
                        type="button"
                        onClick={() => setIsAddTraitModalOpen(true)}
                        className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 text-white"
                    >
                        Add Trait
                    </button>
                </div>
                <div className="flex mt-4 gap-2 justify-end">
                    <button type="submit" className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-white">Save</button>
                    <button type="button" onClick={() => {
                        navigate(-1);
                    }} className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200">Cancel</button>
                </div>
            </form>
            <RaceTraitAssoc
                isOpen={isAddTraitModalOpen}
                onClose={() => {
                    setIsAddTraitModalOpen(false);
                }}
                onSave={handleAddOrUpdateTrait}
                initialSelectedTraitIds={race.traits?.map(t => t.slug) || []}
                raceId={parseInt(id)}
            />
        </div>
    );
}