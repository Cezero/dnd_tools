import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '@/services/api';
import lookupService from '@/services/LookupService';
import { SIZE_LIST } from 'shared-data/src/commonData';
import { LANGUAGE_LIST, LANGUAGE_MAP, ATTRIBUTE_LIST, ATTRIBUTE_MAP } from 'shared-data/src/commonData';
import { fetchRaceById } from '@/features/admin/features/raceMgmt/services/raceService';
import ProcessMarkdown from '@/components/markdown/ProcessMarkdown';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import { TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { ChevronUpDownIcon } from '@heroicons/react/24/solid';
import MarkdownEditor from '@/components/markdown/MarkdownEditor';
import RaceTraitAssoc from '@/features/admin/features/raceMgmt/components/RaceTraitAssoc';
import pluralize from 'pluralize';

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
    const [isAddTraitModalOpen, setIsAddTraitModalOpen] = useState(false);
    const fromListParams = location.state?.fromListParams || '';

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
                        favored_class_id: -1,
                        languages: [],
                        attribute_adjustments: ATTRIBUTE_LIST.map(attr => ({ attribute_id: attr.id, attribute_adjustment: 0 })),
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
                        attribute_adjustments: data.attribute_adjustments || ATTRIBUTE_LIST.map(attr => ({ attribute_id: attr.id, attribute_adjustment: 0 })),
                        traits: data.traits || [],
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

    /**
     * Handles adding a language to the race, distinguishing between automatic and bonus languages.
     * If the language already exists in the race's language list, it updates the existing entry;
     * otherwise, it adds a new entry. The `automatic` flag determines if the language is acquired
     * automatically by the race or as a bonus.
     *
     * @param {number} languageId - The ID of the language to add.
     * @param {boolean} isAutomatic - True if the language is automatic, false for bonus language.
     * @returns {void}
     */
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

    /**
     * Handles the removal of a language from the race's language list.
     * It filters out the language with the specified `languageId` from the `languages` array
     * in the race state, effectively removing it from both automatic and bonus language lists.
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
     * Handles changes to an attribute adjustment for the race.
     * It updates the `attribute_adjustments` array in the race state.
     * If an adjustment for the given `attributeId` already exists, it updates its value;
     * otherwise, it adds a new adjustment entry.
     * The `value` is parsed as an integer, defaulting to 0 if invalid.
     *
     * @param {number} attributeId - The ID of the attribute to adjust.
     * @param {string} value - The new value for the attribute adjustment, as a string.
     * @returns {void}
     */
    const handleAttributeChange = useCallback((attributeId, value) => {
        setRace(prevRace => {
            const existingIndex = prevRace.attribute_adjustments.findIndex(adj => adj.attribute_id === attributeId);
            const newAdjustment = { attribute_id: attributeId, attribute_adjustment: parseInt(value) || 0 };

            if (existingIndex !== -1) {
                const updatedAdjustments = [...prevRace.attribute_adjustments];
                updatedAdjustments[existingIndex] = newAdjustment;
                return { ...prevRace, attribute_adjustments: updatedAdjustments };
            } else {
                return { ...prevRace, attribute_adjustments: [...prevRace.attribute_adjustments, newAdjustment] };
            }
        });
    }, []);

    /**
     * Handles changes to form input fields and updates the race state accordingly.
     * It supports text inputs, number inputs, and checkboxes, converting values to the appropriate type.
     *
     * @param {Object} e - The event object from the input change.
     * @param {Object} e.target - The target element of the event.
     * @param {string} e.target.name - The name attribute of the input element, used as the key in the race state.
     * @param {string|boolean} e.target.value - The new value of the input element.
     * @param {string} e.target.type - The type of the input element (e.g., 'text', 'checkbox').
     * @param {boolean} e.target.checked - The checked state of a checkbox, if applicable.
     * @returns {void}
     */
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setRace(prevRace => ({
            ...prevRace,
            [name]: type === 'checkbox' ? checked : (name === 'edition_id' ? parseInt(value) : value)
        }));
    };

    /**
     * Handles adding or updating race traits. It processes an array of selected trait objects,
     * ensuring that existing `trait_value`s are preserved if `value_flag` is true for that trait,
     * and setting `trait_value` to an empty string for new traits where `value_flag` is true.
     * After processing, it updates the race state with the modified traits and closes the modal.
     *
     * @param {Array<Object>} selectedTraitObjects - An array of trait objects selected from the trait association modal.
     * @param {number} selectedTraitObjects[].trait_slug - The ID of the trait.
     * @param {string} selectedTraitObjects[].trait_name - The name of the trait.
     * @param {string} selectedTraitObjects[].trait_description - The description of the trait.
     * @param {number} selectedTraitObjects[].value_flag - A flag indicating if the trait has an associated value (1 for true, 0 for false).
     * @returns {void}
     */
    const handleAddOrUpdateTrait = useCallback((selectedTraitObjects) => {
        setRace(prevRace => {
            // Create a map of existing traits for quick lookup by trait_slug
            const existingTraitsMap = new Map(prevRace.traits.map(t => [t.trait_slug, t]));

            const updatedTraits = selectedTraitObjects.map(selectedTrait => {
                const existingTrait = existingTraitsMap.get(selectedTrait.trait_slug);
                return {
                    ...selectedTrait,
                    // Preserve trait_value if it was previously set for this trait and value_flag is 1
                    trait_value: existingTrait && existingTrait.value_flag === 1 ? existingTrait.trait_value : (selectedTrait.value_flag === 1 ? '' : ''),
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
     * @param {number} traitId - The ID of the trait to be removed.
     * @returns {Promise<void>} A promise that resolves once the trait is removed from the state.
     */
    const handleDeleteTrait = useCallback(async (traitId) => {
        if (window.confirm('Are you sure you want to remove this trait from the race?')) {
            setRace(prevRace => ({
                ...prevRace,
                traits: prevRace.traits.filter(trait => trait.trait_slug !== traitId)
            }));
            setMessage('Trait removed successfully from race!');
        }
    }, []);

    /**
     * Handles the click event for editing a race trait.
     * Navigates the user to the dedicated edit page for the selected trait, using its `trait_slug`.
     *
     * @param {Object} trait - The trait object to be edited.
     * @param {number} trait.trait_slug - The ID of the trait to navigate to.
     * @returns {void}
     */
    const handleEditTraitClick = useCallback((trait) => {
        // When editing a trait, navigate to its edit page directly.
        navigate(`/admin/races/traits/${trait.trait_slug}/edit`);
    }, [navigate]);

    /**
     * Handles the form submission for creating or updating a race.
     * Prevents the default form submission behavior, clears any existing messages or errors,
     * and constructs the payload based on the current race state. It filters out attribute
     * adjustments with a value of 0 and maps trait objects to include only `trait_slug` and
     * `trait_value`.
     * It then calls the appropriate API endpoint (`POST` for new races, `PUT` for existing) and
     * navigates to the admin races list on success, or sets an error message on failure.
     *
     * @param {Event} e - The form submission event.
     * @returns {Promise<void>} A promise that resolves once the race is successfully created or updated.
     */
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
                favored_class_id: race.favored_class_id === -1 ? -1 : (race.favored_class_id ? parseInt(race.favored_class_id) : 0),
                languages: race.languages.map(lang => ({
                    language_id: lang.language_id,
                    automatic: lang.automatic,
                })),
            };
            const filteredAttributeAdjustments = race.attribute_adjustments.filter(adj => adj.attribute_adjustment !== 0);
            if (filteredAttributeAdjustments.length > 0) {
                payload.attribute_adjustments = filteredAttributeAdjustments;
            }
            if (race.traits && race.traits.length > 0) {
                payload.traits = race.traits.map(trait => ({
                    trait_slug: trait.trait_slug,
                    trait_value: trait.trait_value,
                }));
            }

            if (id === 'new') {
                await api('/races', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
                setMessage('Race created successfully!');
                navigate(`/admin/races/${id}`, { state: { fromListParams: fromListParams, refresh: true } });
            } else {
                await api(`/races/${id}`, {
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

    const automaticLanguages = race?.languages.filter(lang => lang.automatic === 1) || [];
    const bonusLanguages = race?.languages.filter(lang => lang.automatic === 0) || [];

    if (isLoading) return <div className="p-4 bg-white dark:bg-[#121212]">Loading race for editing...</div>;
    if (error) return <div className="p-4 bg-white dark:bg-[#121212] dark:text-red-500">Error: {error.message}</div>;
    if (!race && id !== 'new') return <div className="p-4 bg-white dark:bg-[#121212]">Race not found.</div>;

    return (
        <div className="p-4 bg-white dark:bg-[#121212] scrollbar-track-gray-300 scrollbar-thumb-gray-400 dark:scrollbar-track-gray-700 dark:scrollbar-thumb-gray-500">
            <h1 className="text-2xl font-bold mb-4">{id === 'new' ? 'Create New Race' : `Edit Race: ${race.race_name}`}</h1>
            {message && <div className="mb-4 p-2 rounded text-green-700 bg-green-100 dark:bg-green-800 dark:text-green-200">{message}</div>}
            {error && <div className="mb-4 p-2 rounded text-red-700 bg-red-100 dark:bg-red-800 dark:text-red-200">Error: {error.message || String(error)}</div>}
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                        <label htmlFor="race_name" className="block text-lg font-medium w-30">Race Name:</label>
                        <input type="text" id="race_name" name="race_name" value={race.race_name || ''} onChange={handleChange} className="mt-1 block w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                        <div className="flex items-center gap-2 pr-2">
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
                            <label htmlFor="display" className="ml-2 text-lg font-medium">Display</label>
                            <input type="checkbox" id="display" name="display" checked={race.display} onChange={handleChange} className="form-checkbox h-5 w-5 text-blue-600 rounded dark:bg-gray-700 dark:border-gray-600 accent-blue-600 checked:bg-blue-600 dark:checked:bg-blue-600" />
                        </div>
                    </div>
                    <div className="md:col-span-2 mb-0">
                        <MarkdownEditor
                            id="race_description"
                            name="race_description"
                            label="Race Description"
                            value={race.race_description || ''}
                            onChange={(newValue) => handleChange({ target: { name: 'race_description', value: newValue } })}
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
                                                <ListboxOptions className="absolute scrollbar-thin z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-gray-800 dark:text-gray-100">
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
                            <div className="flex items-center gap-2">
                                <label htmlFor="race_speed" className="block text-lg font-medium">Speed:</label>
                                <input type="number" id="race_speed" name="race_speed" value={race.race_speed || ''} onChange={handleChange} className="mt-1 block w-20 p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label htmlFor="favored_class_id" className="block text-lg font-medium">Favored Class:</label>
                                <Listbox
                                    value={race.favored_class_id || null}
                                    onChange={(selectedId) => handleChange({ target: { name: 'favored_class_id', value: selectedId } })}
                                >
                                    {({ open }) => (
                                        <div className="relative mt-1">
                                            <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600">
                                                <span className="block truncate">{filteredClasses.find(c => c.class_id === race.favored_class_id)?.class_name || (race.favored_class_id === -1 ? 'Any' : 'Select a favored class')}</span>
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
                                                        className={({ active }) =>
                                                            `relative cursor-default select-none py-2 pl-3 pr-9 ${active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-100'}`
                                                        }
                                                        value={-1}
                                                    >
                                                        {({ selected, active }) => (
                                                            <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                                Any
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
                        </div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-medium">Attribute Adjustments:</h3>
                            <div className="p-2 border rounded dark:border-gray-600">
                                <div className="grid grid-cols-3 gap-2">
                                    {ATTRIBUTE_LIST.map(attribute => (
                                        <div key={attribute.id} className="flex items-center gap-2">
                                            <label htmlFor={`attr-${attribute.id}`} className="text-sm font-medium w-20">{attribute.name}:</label>
                                            <input
                                                type="text"
                                                id={`attr-${attribute.id}`}
                                                name={`attribute_${attribute.id}`}
                                                value={`${(race.attribute_adjustments.find(adj => adj.attribute_id === attribute.id)?.attribute_adjustment || 0) > 0 ? '+' : ''}${(race.attribute_adjustments.find(adj => adj.attribute_id === attribute.id)?.attribute_adjustment || 0)}`}
                                                onChange={(e) => handleAttributeChange(attribute.id, e.target.value)}
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
                                {automaticLanguages.length === 0 && <span className="text-gray-500 dark:text-gray-400">No automatic languages added.</span>}
                                {automaticLanguages.map((lang, index) => (
                                    <span key={lang.language_id} className="group relative text-sm pt-1 pb-1 pl-0 pr-0 cursor-pointer">
                                        {LANGUAGE_MAP[lang.language_id]?.name || 'Unknown Language'}
                                        {index < automaticLanguages.length - 1 && ','}
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
                    </div>
                </div>
                <div className="md:col-span-2">
                    <h3 className="text-lg font-medium mb-2">Race Traits</h3>
                    {race.traits && race.traits.length > 0 ? (
                        <div className="space-y-2 border p-3 rounded dark:border-gray-600 mb-2">
                            {race.traits.map(trait => (
                                <div key={trait.trait_slug} className="rounded border p-2 dark:border-gray-700 grid grid-cols-[2fr_0.1fr] gap-2 items-center">
                                    <div className="w-full">
                                        <ProcessMarkdown markdown={trait.trait_description} userVars={{ traitname: trait.trait_name, raceplural: pluralize(race.race_name), raceplurallower: pluralize(race.race_name).toLowerCase(), value: trait.trait_value }} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {trait.value_flag === 1 && (
                                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                                                <span>Value:</span>
                                                <input
                                                    type="text"
                                                    value={trait.trait_value || ''}
                                                    onChange={(e) => {
                                                        const newValue = e.target.value;
                                                        setRace(prevRace => ({
                                                            ...prevRace,
                                                            traits: prevRace.traits.map(t =>
                                                                t.trait_slug === trait.trait_slug ? { ...t, trait_value: newValue } : t
                                                            )
                                                        }));
                                                    }}
                                                    className="w-20 p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                                />
                                            </div>
                                        )}
                                        <button type="button" onClick={() => handleDeleteTrait(trait.trait_slug)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600">
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
                initialSelectedTraitIds={race.traits.map(t => t.trait_slug)}
                raceId={id}
            />
        </div>
    );
}