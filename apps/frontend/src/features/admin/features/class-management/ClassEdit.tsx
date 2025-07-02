import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Api } from '@/services/Api';
import { FetchClassById } from '@/features/admin/features/class-management/ClassService';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/24/solid';
import { RPG_DICE, EDITION_LIST, EDITION_MAP, ABILITY_MAP } from '@shared/static-data';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';

export function ClassEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [cls, setCls] = useState(null); // Using 'cls' to avoid conflict with 'class' keyword
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const FetchClassAndLookups = async () => {
            try {
                if (id === 'new') {
                    setCls({
                        name: '',
                        abbr: '',
                        edition_id: null,
                        is_prestige: false,
                        display: true,
                        can_cast: false,
                        hit_die: 1,
                        skill_points: 0,
                        cast_ability: null,
                        desc: ''
                    });
                } else {
                    const data = await FetchClassById(id);
                    setCls({
                        name: data.name,
                        abbr: data.abbr,
                        edition_id: data.edition_id,
                        is_prestige: data.is_prestige === 1,
                        display: data.display === 1,
                        can_cast: data.can_cast === 1,
                        hit_die: data.hit_die,
                        skill_points: data.skill_points || 0,
                        cast_ability: data.cast_ability || null,
                        desc: data.desc || ''
                    });
                }
            } catch (err) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        FetchClassAndLookups();
    }, [id]);

    const HandleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setCls(prevCls => ({
            ...prevCls,
            [name]: type === 'checkbox' ? checked : (name === 'edition_id' || name === 'hit_die' || name === 'skill_points' || name === 'cast_ability' ? parseInt(value) : value)
        }));
    };

    const HandleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        try {
            const payload = {
                name: cls.name,
                abbr: cls.abbr,
                edition_id: cls.edition_id ? parseInt(cls.edition_id) : null,
                is_prestige: cls.is_prestige ? 1 : 0,
                display: cls.display ? 1 : 0,
                can_cast: cls.can_cast ? 1 : 0,
                hit_die: cls.hit_die ? parseInt(cls.hit_die) : 1,
                skill_points: cls.skill_points,
                cast_ability: cls.cast_ability,
                desc: cls.desc
            };

            if (id === 'new') {
                const response = await Api('/classes', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
                setMessage('Class created successfully!');
                navigate(`/admin/classes/${response.id}`, { state: { fromListParams: fromListParams, refresh: true } });
            } else {
                await Api(`/classes/${id}`, {
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
            <h1 className="text-2xl font-bold mb-4">{id === 'new' ? 'Create New Class' : `Edit Class: ${cls.name}`}</h1>
            {message && <div className="mb-4 p-2 rounded text-green-700 bg-green-100 dark:bg-green-800 dark:text-green-200">{message}</div>}
            {error && <div className="mb-4 p-2 rounded text-red-700 bg-red-100 dark:bg-red-800 dark:text-red-200">Error: {error.message || String(error)}</div>}
            <form onSubmit={HandleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                            <label htmlFor="name" className="block font-medium">Class Name:</label>
                            <input type="text" id="name" name="name" value={cls.name || ''} onChange={HandleChange} className="mt-1 block p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div className="flex items-center gap-2">
                            <label htmlFor="abbr" className="block font-medium">Abbreviation:</label>
                            <input type="text" id="abbr" name="abbr" value={cls.abbr || ''} onChange={HandleChange} className="mt-1 block p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div className="col-span-2 flex items-center gap-2">
                            <div className="flex items-center gap-2">
                                <label htmlFor="hit_die" className="block font-medium">Hit Die:</label>
                                <Listbox
                                    value={cls.hit_die || ''}
                                    onChange={(selectedId) => HandleChange({ target: { name: 'hit_die', value: selectedId } })}
                                >
                                    <div className="relative mt-1">
                                        <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600">
                                            <span className="block truncate">{RPG_DICE[cls.hit_die]?.name || 'Select a hit die'}</span>
                                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                            </span>
                                        </ListboxButton>
                                        <Transition
                                            leave="transition ease-in duration-100"
                                            leaveFrom="opacity-100"
                                            leaveTo="opacity-0"
                                        >
                                            <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto scrollbar-thin rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-gray-800 dark:text-gray-100">
                                                <ListboxOption
                                                    className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 dark:text-gray-100 hover:bg-blue-600 hover:text-white"
                                                    value={null}
                                                >
                                                    <span className="block truncate">
                                                        Select a hit die
                                                    </span>
                                                </ListboxOption>
                                                {Object.keys(RPG_DICE).map(dieKey => (
                                                    <ListboxOption
                                                        key={dieKey}
                                                        className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 dark:text-gray-100 hover:bg-blue-600 hover:text-white"
                                                        value={parseInt(dieKey)}
                                                    >
                                                        <span className="block truncate">
                                                            {RPG_DICE[dieKey].name}
                                                        </span>
                                                    </ListboxOption>
                                                ))}
                                            </ListboxOptions>
                                        </Transition>
                                    </div>
                                </Listbox>
                            </div>
                            <div className="flex items-center gap-2">
                                <label htmlFor="skill_points" className="block font-medium">Skill Points:</label>
                                <input type="number" id="skill_points" name="skill_points" value={cls.skill_points || ''} onChange={HandleChange} className="mt-1 block p-2 border rounded dark:bg-gray-700 dark:border-gray-600 w-20" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label htmlFor="cast_ability" className="block font-medium">Cast Ability:</label>
                                <Listbox
                                    value={cls.cast_ability || null}
                                    onChange={(selectedId) => HandleChange({ target: { name: 'cast_ability', value: selectedId } })}
                                >
                                    <div className="relative mt-1">
                                        <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600">
                                            <span className="block truncate">{ABILITY_MAP[cls.cast_ability]?.name || 'Select an ability'}</span>
                                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                            </span>
                                        </ListboxButton>
                                        <Transition
                                            leave="transition ease-in duration-100"
                                            leaveFrom="opacity-100"
                                            leaveTo="opacity-0"
                                        >
                                            <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto scrollbar-thin rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-gray-800 dark:text-gray-100">
                                                <ListboxOption
                                                    className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 dark:text-gray-100 hover:bg-blue-600 hover:text-white"
                                                    value={null}
                                                >
                                                    <span className="block truncate">
                                                        Select an ability
                                                    </span>
                                                </ListboxOption>
                                                {Object.keys(ABILITY_MAP).map(abilityKey => (
                                                    <ListboxOption
                                                        key={abilityKey}
                                                        className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 dark:text-gray-100 hover:bg-blue-600 hover:text-white"
                                                        value={parseInt(abilityKey)}
                                                    >
                                                        <span className="block truncate">
                                                            {ABILITY_MAP[abilityKey].name}
                                                        </span>
                                                    </ListboxOption>
                                                ))}
                                            </ListboxOptions>
                                        </Transition>
                                    </div>
                                </Listbox>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 justify-end pb-1">
                            <label htmlFor="edition_id" className="block font-medium">Edition:</label>
                            <Listbox
                                value={cls.edition_id || ''}
                                onChange={(selectedId) => HandleChange({ target: { name: 'edition_id', value: selectedId } })}
                            >
                                <div className="relative mt-1">
                                    <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600">
                                        <span className="block truncate">{EDITION_MAP[cls.edition_id]?.abbr || 'Select an edition'}</span>
                                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                        </span>
                                    </ListboxButton>
                                    <Transition
                                        leave="transition ease-in duration-100"
                                        leaveFrom="opacity-100"
                                        leaveTo="opacity-0"
                                    >
                                        <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto scrollbar-thin rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-gray-800 dark:text-gray-100">
                                            <ListboxOption
                                                className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 dark:text-gray-100 hover:bg-blue-600 hover:text-white"
                                                value={null}
                                            >
                                                <span className="block truncate">
                                                    Select an edition
                                                </span>
                                            </ListboxOption>
                                            {EDITION_LIST.map(edition => (
                                                <ListboxOption
                                                    key={edition.id}
                                                    className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 dark:text-gray-100 hover:bg-blue-600 hover:text-white"
                                                    value={edition.id}
                                                >
                                                    <span className="block truncate">
                                                        {edition.abbr}
                                                    </span>
                                                </ListboxOption>
                                            ))}
                                        </ListboxOptions>
                                    </Transition>
                                </div>
                            </Listbox>
                        </div>
                        <div className="flex items-center gap-2 justify-end pb-1">
                            <label htmlFor="display" className="ml-2 font-medium">Display</label>
                            <input type="checkbox" id="display" name="display" checked={cls.display} onChange={HandleChange} className="form-checkbox h-5 w-5 text-blue-600 rounded dark:bg-gray-700 dark:border-gray-600 accent-blue-600 checked:bg-blue-600 dark:checked:bg-blue-600" />
                        </div>
                        <div className="flex items-center gap-2 justify-end pb-1">
                            <label htmlFor="is_prestige" className="ml-2 font-medium">Prestige Class</label>
                            <input type="checkbox" id="is_prestige" name="is_prestige" checked={cls.is_prestige} onChange={HandleChange} className="form-checkbox h-5 w-5 text-blue-600 rounded dark:bg-gray-700 dark:border-gray-600 accent-blue-600 checked:bg-blue-600 dark:checked:bg-blue-600" />
                        </div>
                        <div className="flex items-center gap-2 justify-end pb-1">
                            <label htmlFor="can_cast" className="ml-2 font-medium">Caster</label>
                            <input type="checkbox" id="can_cast" name="can_cast" checked={cls.can_cast} onChange={HandleChange} className="form-checkbox h-5 w-5 text-blue-600 rounded dark:bg-gray-700 dark:border-gray-600 accent-blue-600 checked:bg-blue-600 dark:checked:bg-blue-600" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 md:col-span-2 mb-0">
                        <MarkdownEditor
                            value={cls.desc || ''}
                            onChange={(newDescription) => setCls(prevCls => ({ ...prevCls, desc: newDescription }))}
                            label="Class Description"
                            id="desc"
                            name="desc"
                        />
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
