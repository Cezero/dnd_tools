import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FetchSkillById, CreateSkill, UpdateSkill } from '@/features/admin/features/skill-management/SkillService';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/24/solid';
import { ABILITY_MAP } from '@shared/static-data';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import type { Skill } from '@shared/prisma-client';
import type { SkillFormData, SkillUpdateData } from './schema';

/* TODO: change "Try Again" to selector, "Yes", "No", "Varies" instead of boolean
*/

export function SkillEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [skill, setSkill] = useState<SkillFormData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [message, setMessage] = useState('');
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const FetchSkillAndLookups = async () => {
            try {
                if (id === 'new') {
                    setSkill({
                        name: '',
                        abilityId: null,
                        trainedOnly: false,
                        affectedByArmor: false,
                        checkDescription: '',
                        actionDescription: '',
                        retryTypeId: null,
                        retryDescription: '',
                        specialNotes: '',
                        synergyNotes: '',
                        untrainedNotes: '',
                        description: ''
                    });
                } else {
                    const data = await FetchSkillById(id);
                    setSkill({
                        name: data.name,
                        abilityId: data.abilityId,
                        trainedOnly: data.trainedOnly || false,
                        affectedByArmor: data.affectedByArmor,
                        checkDescription: data.checkDescription || '',
                        actionDescription: data.actionDescription || '',
                        retryTypeId: data.retryTypeId,
                        retryDescription: data.retryDescription || '',
                        specialNotes: data.specialNotes || '',
                        synergyNotes: data.synergyNotes || '',
                        untrainedNotes: data.untrainedNotes || '',
                        description: data.description || ''
                    });
                }
            } catch (err) {
                setError(err instanceof Error ? err : new Error(String(err)));
            } finally {
                setIsLoading(false);
            }
        };

        FetchSkillAndLookups();
    }, [id]);

    const HandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;

        setSkill(prevSkill => {
            if (!prevSkill) return prevSkill;
            return {
                ...prevSkill,
                [name]: type === 'checkbox' ? checked : (name === 'abilityId' ? parseInt(value) || null : value)
            };
        });
    };

    const HandleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        if (!skill) return;

        try {
            if (id === 'new') {
                const response = await CreateSkill(skill);
                setMessage('Skill created successfully!');
                navigate(`/admin/skills/${response.id}`, { state: { fromListParams: fromListParams, refresh: true } });
            } else {
                await UpdateSkill(id, skill);
                setMessage('Skill updated successfully!');
                navigate(`/admin/skills/${id}`, { state: { fromListParams: fromListParams, refresh: true } });
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            setMessage(`Error updating skill: ${err instanceof Error ? err.message : String(err)}`);
        }
    };

    if (isLoading) return <div className="p-4 bg-white dark:bg-[#121212]">Loading skill for editing...</div>;
    if (error) return <div className="p-4 bg-white dark:bg-[#121212] dark:text-red-500">Error: {error.message}</div>;
    if (!skill && id !== 'new') return <div className="p-4 bg-white dark:bg-[#121212]">Skill not found.</div>;

    return (
        <div className="p-4 bg-white dark:bg-[#121212] scrollbar-track-gray-300 scrollbar-thumb-gray-400 dark:scrollbar-track-gray-700 dark:scrollbar-thumb-gray-500">
            <h1 className="text-2xl font-bold mb-4">{id === 'new' ? 'Create New Skill' : `Edit Skill: ${skill.name}`}</h1>
            {message && <div className="mb-4 p-2 rounded text-green-700 bg-green-100 dark:bg-green-800 dark:text-green-200">{message}</div>}
            {error && <div className="mb-4 p-2 rounded text-red-700 bg-red-100 dark:bg-red-800 dark:text-red-200">Error: {error.message || String(error)}</div>}
            <form onSubmit={HandleSubmit}>
                <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2">
                        <label htmlFor="name" className="block font-medium">Skill:</label>
                        <input type="text" id="name" name="name" value={skill.name || ''} onChange={HandleChange} className="mt-1 block p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="abilityId" className="block font-medium">Ability Score:</label>
                        <Listbox
                            value={skill.abilityId || null}
                            onChange={(selectedId) => HandleChange({ target: { name: 'abilityId', value: selectedId?.toString() || '' } } as React.ChangeEvent<HTMLInputElement>)}
                        >
                            {({ open }) => (
                                <div className="relative mt-1">
                                    <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600">
                                        <span className="block truncate">{ABILITY_MAP[skill.abilityId || 0]?.name || 'Select an ability'}</span>
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
                                                        Select an ability
                                                    </span>
                                                )}
                                            </ListboxOption>
                                            {Object.values(ABILITY_MAP).map(ability => (
                                                <ListboxOption
                                                    key={ability.id}
                                                    className={({ focus }) =>
                                                        `relative cursor-default select-none py-2 pl-3 pr-9 ${focus ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-100'}`
                                                    }
                                                    value={ability.id}
                                                >
                                                    {({ selected }) => (
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
                        <input type="checkbox" id="trainedOnly" name="trainedOnly" checked={skill.trainedOnly} onChange={HandleChange} className="mr-2" />
                        <label htmlFor="trainedOnly" className="font-medium">Trained Only</label>
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" id="affectedByArmor" name="affectedByArmor" checked={skill.affectedByArmor} onChange={HandleChange} className="mr-2" />
                        <label htmlFor="affectedByArmor" className="font-medium">Armor Check Penalty</label>
                    </div>
                </div>
                <MarkdownEditor
                    value={skill.description}
                    onChange={(content) => HandleChange({ target: { name: 'description', value: content } } as React.ChangeEvent<HTMLInputElement>)}
                    editorId="skill-description-editor"
                />
                <MarkdownEditor
                    value={skill.checkDescription}
                    label='Check'
                    onChange={(content) => HandleChange({ target: { name: 'checkDescription', value: content } } as React.ChangeEvent<HTMLInputElement>)}
                    editorId="skill-check-editor"
                />
                <MarkdownEditor
                    value={skill.actionDescription}
                    label='Action'
                    onChange={(content) => HandleChange({ target: { name: 'actionDescription', value: content } } as React.ChangeEvent<HTMLInputElement>)}
                    editorId="skill-action-editor"
                />
                <div className="flex items-center gap-2">
                    <div className="flex items-center w-30">
                        <input type="checkbox" id="retryTypeId" name="retryTypeId" checked={!!skill.retryTypeId} onChange={(e) => HandleChange({ target: { name: 'retryTypeId', value: e.target.checked ? 1 : null } } as React.ChangeEvent<HTMLInputElement>)} className="mr-2" />
                        <label htmlFor="retryTypeId" className="font-medium">Try Again:</label>
                    </div>
                    <input type="text" id="retryDescription" name="retryDescription" value={skill.retryDescription || ''} onChange={HandleChange} className="w-4/5 mt-1 block p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <MarkdownEditor
                    value={skill.synergyNotes}
                    label='Synergy'
                    onChange={(content) => HandleChange({ target: { name: 'synergyNotes', value: content } } as React.ChangeEvent<HTMLInputElement>)}
                    editorId="skill-synergy-desc-editor"
                />
                <div className="flex items-center gap-2">
                    <label htmlFor="untrainedNotes" className="block font-medium w-30">Untrained:</label>
                    <input type="text" id="untrainedNotes" name="untrainedNotes" value={skill.untrainedNotes || ''} onChange={HandleChange} className="w-4/5 mt-1 block p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <MarkdownEditor
                    value={skill.specialNotes}
                    label='Special'
                    onChange={(content) => HandleChange({ target: { name: 'specialNotes', value: content } } as React.ChangeEvent<HTMLInputElement>)}
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