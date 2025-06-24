import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '@/services/api';
import { fetchSkillById } from '@/features/admin/features/skillMgmt/services/skillService';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/24/solid';
import { ABILITY_MAP } from 'shared-data/src/abilityData';
import MarkdownEditor from '@/components/markdown/MarkdownEditor';


/* TODO: change "Try Again" to selector, "Yes", "No", "Varies" instead of boolean
*/

export default function SkillEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [skill, setSkill] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const fetchSkillAndLookups = async () => {
            try {
                if (id === 'new') {
                    setSkill({
                        skill_name: '',
                        ability_id: null,
                        trained_only: false,
                        skill_armor_check_penalty: false,
                        skill_check: '',
                        skill_action: '',
                        skill_try_again: false,
                        skill_try_again_desc: '',
                        skill_special: '',
                        skill_synergy_desc: '',
                        untrained_desc: '',
                        skill_description: ''
                    });
                } else {
                    const data = await fetchSkillById(id);
                    setSkill({
                        skill_name: data.skill_name,
                        ability_id: data.ability_id,
                        trained_only: data.trained_only === 1,
                        skill_armor_check_penalty: data.skill_armor_check_penalty === 1,
                        skill_check: data.skill_check || '',
                        skill_action: data.skill_action || '',
                        skill_try_again: data.skill_try_again === 1,
                        skill_try_again_desc: data.skill_try_again_desc || '',
                        skill_special: data.skill_special || '',
                        skill_synergy_desc: data.skill_synergy_desc || '',
                        untrained_desc: data.untrained_desc || '',
                        skill_description: data.skill_description || ''
                    });
                }
            } catch (err) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSkillAndLookups();
    }, [id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setSkill(prevSkill => ({
            ...prevSkill,
            [name]: type === 'checkbox' ? checked : (name === 'ability_id' ? parseInt(value) : value)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        try {
            const payload = {
                skill_name: skill.skill_name,
                ability_id: skill.ability_id ? parseInt(skill.ability_id) : null,
                trained_only: skill.trained_only ? 1 : 0,
                skill_armor_check_penalty: skill.skill_armor_check_penalty ? 1 : 0,
                skill_check: skill.skill_check,
                skill_action: skill.skill_action,
                skill_try_again: skill.skill_try_again ? 1 : 0,
                skill_try_again_desc: skill.skill_try_again_desc,
                skill_special: skill.skill_special,
                skill_synergy_desc: skill.skill_synergy_desc,
                untrained_desc: skill.untrained_desc,
                skill_description: skill.skill_description
            };

            if (id === 'new') {
                const response = await api('/skills', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
                setMessage('Skill created successfully!');
                navigate(`/admin/skills/${response.id}`, { state: { fromListParams: fromListParams, refresh: true } });
            } else {
                await api(`/skills/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });
                setMessage('Skill updated successfully!');
                navigate(`/admin/skills/${id}`, { state: { fromListParams: fromListParams, refresh: true } });
            }
        } catch (err) {
            setError(err);
            setMessage(`Error updating skill: ${err.message || err}`);
        }
    };

    if (isLoading) return <div className="p-4 bg-white dark:bg-[#121212]">Loading skill for editing...</div>;
    if (error) return <div className="p-4 bg-white dark:bg-[#121212] dark:text-red-500">Error: {error.message}</div>;
    if (!skill && id !== 'new') return <div className="p-4 bg-white dark:bg-[#121212]">Skill not found.</div>;

    return (
        <div className="p-4 bg-white dark:bg-[#121212] scrollbar-track-gray-300 scrollbar-thumb-gray-400 dark:scrollbar-track-gray-700 dark:scrollbar-thumb-gray-500">
            <h1 className="text-2xl font-bold mb-4">{id === 'new' ? 'Create New Skill' : `Edit Skill: ${skill.skill_name}`}</h1>
            {message && <div className="mb-4 p-2 rounded text-green-700 bg-green-100 dark:bg-green-800 dark:text-green-200">{message}</div>}
            {error && <div className="mb-4 p-2 rounded text-red-700 bg-red-100 dark:bg-red-800 dark:text-red-200">Error: {error.message || String(error)}</div>}
            <form onSubmit={handleSubmit}>
                <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2">
                        <label htmlFor="skill_name" className="block font-medium">Skill:</label>
                        <input type="text" id="skill_name" name="skill_name" value={skill.skill_name || ''} onChange={handleChange} className="mt-1 block p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="ability_id" className="block font-medium">Ability Score:</label>
                        <Listbox
                            value={skill.ability_id || null}
                            onChange={(selectedId) => handleChange({ target: { name: 'ability_id', value: selectedId } })}
                        >
                            {({ open }) => (
                                <div className="relative mt-1">
                                    <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600">
                                        <span className="block truncate">{ABILITY_MAP[skill.ability_id]?.name || 'Select an ability'}</span>
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
                                                        Select an ability
                                                    </span>
                                                )}
                                            </ListboxOption>
                                            {Object.values(ABILITY_MAP).map(ability => (
                                                <ListboxOption
                                                    key={ability.id}
                                                    className={({ active }) =>
                                                        `relative cursor-default select-none py-2 pl-3 pr-9 ${active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-100'}`
                                                    }
                                                    value={ability.id}
                                                >
                                                    {({ selected, active }) => (
                                                        <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                            {ability.name}
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
                        <input type="checkbox" id="trained_only" name="trained_only" checked={skill.trained_only} onChange={handleChange} className="mr-2" />
                        <label htmlFor="trained_only" className="font-medium">Trained Only</label>
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" id="skill_armor_check_penalty" name="skill_armor_check_penalty" checked={skill.skill_armor_check_penalty} onChange={handleChange} className="mr-2" />
                        <label htmlFor="skill_armor_check_penalty" className="font-medium">Armor Check Penalty</label>
                    </div>
                </div>
                <MarkdownEditor
                    value={skill.skill_description}
                    onChange={(content) => handleChange({ target: { name: 'skill_description', value: content } })}
                    editorId="skill-description-editor"
                />
                <MarkdownEditor
                    value={skill.skill_check}
                    label='Check'
                    onChange={(content) => handleChange({ target: { name: 'skill_check', value: content } })}
                    editorId="skill-check-editor"
                />
                <MarkdownEditor
                    value={skill.skill_action}
                    label='Action'
                    onChange={(content) => handleChange({ target: { name: 'skill_action', value: content } })}
                    editorId="skill-action-editor"
                />
                <div className="flex items-center gap-2">
                    <div className="flex items-center w-30">
                    <input type="checkbox" id="skill_try_again" name="skill_try_again" checked={skill.skill_try_again} onChange={handleChange} className="mr-2" />
                    <label htmlFor="skill_try_again" className="font-medium">Try Again:</label>
                    </div>
                    <input type="text" id="skill_try_again_desc" name="skill_try_again_desc" value={skill.skill_try_again_desc || ''} onChange={handleChange} className="w-4/5 mt-1 block p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <MarkdownEditor
                    value={skill.skill_synergy_desc}
                    label='Synergy'
                    onChange={(content) => handleChange({ target: { name: 'skill_synergy_desc', value: content } })}
                    editorId="skill-synergy-desc-editor"
                />
                <div className="flex items-center gap-2">
                    <label htmlFor="untrained_desc" className="block font-medium w-30">Untrained:</label>
                    <input type="text" id="untrained_desc" name="untrained_desc" value={skill.untrained_desc || ''} onChange={handleChange} className="w-4/5 mt-1 block p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <MarkdownEditor
                    value={skill.skill_special}
                    label='Special'
                    onChange={(content) => handleChange({ target: { name: 'skill_special', value: content } })}
                    editorId="skill-special-editor"
                />
                <div className="mt-6 text-right">
                    <button type="button" onClick={() => navigate(`/admin/skills${fromListParams ? `?${fromListParams}` : ''}`)} className="inline-block px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 border dark:border-gray-500">Cancel</button>
                    <button type="submit" className="ml-4 inline-block px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 border dark:border-gray-500">{id === 'new' ? 'Create Skill' : 'Update Skill'}</button>
                </div>
            </form>
        </div>
    );
} 