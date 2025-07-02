import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { Api } from '@/services/Api';
import { TrashIcon } from '@heroicons/react/24/outline';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { SPELL_DESCRIPTOR_LIST, SPELL_SCHOOL_LIST, SPELL_COMPONENT_LIST, SPELL_RANGE_LIST, SPELL_RANGE_MAP, SPELL_SUBSCHOOL_LIST_BY_SCHOOL_ID, SOURCE_BOOK_LIST, CLASS_LIST, CLASS_MAP } from '@shared/static-data';
import type { Spell } from '@shared/prisma-client/client';
import { z } from 'zod';

// Zod validation schemas
const SpellIdParamSchema = z.object({
    id: z.string().transform((val) => parseInt(val)),
});

const SpellUpdateSchema = z.object({
    name: z.string().min(1, 'Spell name is required').max(200, 'Spell name must be less than 200 characters'),
    summary: z.string().max(1000, 'Summary must be less than 1000 characters').optional(),
    description: z.string().max(10000, 'Description must be less than 10000 characters').optional(),
    castingTime: z.string().max(200, 'Casting time must be less than 200 characters').optional(),
    range: z.string().max(200, 'Range must be less than 200 characters').optional(),
    rangeTypeId: z.number().int().positive('Range type ID must be a positive integer').optional(),
    rangeValue: z.string().max(100, 'Range value must be less than 100 characters').optional(),
    area: z.string().max(200, 'Area must be less than 200 characters').optional(),
    duration: z.string().max(200, 'Duration must be less than 200 characters').optional(),
    savingThrow: z.string().max(200, 'Saving throw must be less than 200 characters').optional(),
    spellResistance: z.string().max(200, 'Spell resistance must be less than 200 characters').optional(),
    editionId: z.number().int().positive('Edition ID must be a positive integer'),
    baseLevel: z.number().int().min(0, 'Base level must be non-negative').max(20, 'Base level must be at most 20'),
    effect: z.string().max(500, 'Effect must be less than 500 characters').optional(),
    target: z.string().max(200, 'Target must be less than 200 characters').optional(),
    schools: z.array(z.number().int().positive()).optional(),
    subschools: z.array(z.number().int().positive()).optional(),
    descriptors: z.array(z.number().int().positive()).optional(),
    components: z.array(z.number().int().positive()).optional(),
    levelMapping: z.array(z.object({
        classId: z.number().int().positive(),
        level: z.number().int().min(0).max(20),
    })).optional(),
    sourceId: z.number().int().positive().optional(),
    pageNumber: z.number().int().min(1).optional(),
});

type SpellIdParam = z.infer<typeof SpellIdParamSchema>;
type SpellUpdateRequest = z.infer<typeof SpellUpdateSchema>;

// Extended spell type with relations for editing
type SpellForEdit = Spell & {
    levelMapping: Array<{
        classId: number;
        level: number;
    }>;
    schools: Array<{ schoolId: number }>;
    subschools: Array<{ subschoolId: number }>;
    descriptors: Array<{ descriptorId: number }>;
    sources: Array<{ bookId: number; pageNumber: number | null }>;
    components?: number[];
};

export function SpellEdit(): React.JSX.Element {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';
    const [spell, setSpell] = useState<SpellForEdit | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<any>(null);
    const [message, setMessage] = useState<string>('');
    const [selectedClassToAdd, setSelectedClassToAdd] = useState<string>('');

    useEffect(() => {
        const FetchSpellAndLookups = async () => {
            try {
                const validatedParams = SpellIdParamSchema.parse({ id });
                const data = await Api<SpellForEdit>(`/spells/${validatedParams.id}`);
                setSpell(() => ({ // Use functional update to ensure latest state
                    ...data,
                    components: data.components || [], // Ensure components is an array
                    descriptors: data.descriptors || [], // Ensure descriptors is an array
                    schools: data.schools || [], // Ensure schools is an array
                    subschools: data.subschools || [], // Ensure subschools is an array
                }));

            } catch (err) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        FetchSpellAndLookups();
    }, [id]);

    const HandleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | string) => {
        let name: string, value: string | number;

        // MDEditor passes value directly as the first argument, not an event object
        if (typeof e === 'string') {
            name = 'description';
            value = e;
        } else {
            // For other input types, destructure from e.target
            ({ name, value } = e.target);
        }

        if (name === 'rangeTypeId') {
            const selectedRange = SPELL_RANGE_MAP[parseInt(value as string)];
            setSpell(prevSpell => prevSpell ? ({
                ...prevSpell,
                rangeTypeId: parseInt(value as string),
                range: selectedRange ? selectedRange.range_name : ''
            }) : null);
        } else if (name === 'schools') {
            const schoolId = parseInt((e as React.ChangeEvent<HTMLInputElement>).target.value);
            setSpell(prevSpell => {
                if (!prevSpell) return null;
                const newSchools = (e as React.ChangeEvent<HTMLInputElement>).target.checked
                    ? [...prevSpell.schools, { schoolId }]
                    : prevSpell.schools.filter(s => s.schoolId !== schoolId);
                return { ...prevSpell, schools: newSchools };
            });
        } else if (name === 'subschools') {
            const subschoolId = parseInt((e as React.ChangeEvent<HTMLInputElement>).target.value);
            setSpell(prevSpell => {
                if (!prevSpell) return null;
                const newSubschools = (e as React.ChangeEvent<HTMLInputElement>).target.checked
                    ? [...prevSpell.subschools, { subschoolId }]
                    : prevSpell.subschools.filter(s => s.subschoolId !== subschoolId);
                return { ...prevSpell, subschools: newSubschools };
            });
        } else if (name === 'descriptors') {
            const descriptorId = parseInt((e as React.ChangeEvent<HTMLInputElement>).target.value);
            setSpell(prevSpell => {
                if (!prevSpell) return null;
                const newDescriptors = (e as React.ChangeEvent<HTMLInputElement>).target.checked
                    ? [...prevSpell.descriptors, { descriptorId }]
                    : prevSpell.descriptors.filter(d => d.descriptorId !== descriptorId);
                return { ...prevSpell, descriptors: newDescriptors };
            });
        } else if (name === 'components') {
            const componentId = parseInt((e as React.ChangeEvent<HTMLInputElement>).target.value);
            setSpell(prevSpell => {
                if (!prevSpell) return null;
                const newComponents = (e as React.ChangeEvent<HTMLInputElement>).target.checked
                    ? [...(prevSpell.components || []), componentId]
                    : (prevSpell.components || []).filter(id => id !== componentId);
                return { ...prevSpell, components: newComponents };
            });
        } else {
            setSpell(prevSpell => prevSpell ? ({
                ...prevSpell,
                [name]: value
            }) : null);
        }
    };

    const HandleClassLevelChange = (index: number, field: string, value: number) => {
        setSpell(prevSpell => {
            if (!prevSpell) return null;
            if (field === 'level' && value === -1) {
                // If 'Remove' is selected, remove the class level
                return {
                    ...prevSpell,
                    levelMapping: prevSpell.levelMapping.toSpliced(index, 1)
                };
            } else {
                return {
                    ...prevSpell,
                    levelMapping: prevSpell.levelMapping.map((cl, i) =>
                        i === index ? { ...cl, [field]: value } : cl
                    )
                };
            }
        });
    };

    const HandleAddClassLevel = () => {
        if (selectedClassToAdd && spell) {
            const newClassId = parseInt(selectedClassToAdd);
            const existingClass = spell.levelMapping.find(cl => cl.classId === newClassId);
            if (!existingClass) {
                setSpell(prevSpell => prevSpell ? ({
                    ...prevSpell,
                    levelMapping: [...prevSpell.levelMapping, { classId: newClassId, level: 0 }]
                }) : null);
            } else {
                setMessage('Class already added.');
            }
            setSelectedClassToAdd(''); // Reset selection
        }
    };

    const HandleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        if (!spell) return;

        try {
            const payload: SpellUpdateRequest = {
                ...spell,
                levelMapping: spell.levelMapping.map(cl => ({
                    classId: parseInt(cl.classId.toString()),
                    level: parseInt(cl.level.toString())
                })).filter(cl => !isNaN(cl.classId) && !isNaN(cl.level)),
                sourceId: spell.sources.length > 0 ? spell.sources[0].bookId : undefined,
                pageNumber: spell.sources.length > 0 ? spell.sources[0].pageNumber || undefined : undefined,
                effect: spell.effect || undefined,
                target: spell.target || undefined,
                schools: spell.schools.map(s => s.schoolId),
                subschools: spell.subschools.map(s => s.subschoolId),
                descriptors: spell.descriptors.map(d => d.descriptorId),
                components: spell.components || [],
            };

            // Validate the payload
            const validatedPayload = SpellUpdateSchema.parse(payload);

            await Api(`/spells/${id}`, {
                method: 'PUT',
                body: JSON.stringify(validatedPayload),
            });
            setMessage('Spell updated successfully!');
            navigate(`/spells/${id}`, { state: { fromListParams: fromListParams } }); // Redirect to view spell page, passing list params
        } catch (err) {
            setError(err);
            setMessage(`Error updating spell: ${err instanceof Error ? err.message : String(err)}`);
        }
    };

    if (isLoading) return <div className="p-4 bg-white  dark:bg-[#121212]">Loading spell for editing...</div>;
    if (error) return <div className="p-4 bg-white  dark:bg-[#121212] dark:text-red-500">Error: {error.message}</div>;
    if (!spell) return <div className="p-4 bg-white  dark:bg-[#121212]">Spell not found.</div>;

    return (
        <div className="p-4 bg-white dark:bg-[#121212]">
            <h1 className="text-2xl font-bold mb-4">Edit Spell: {spell.name}</h1>
            {message && <div className="mb-4 p-2 rounded text-green-700 bg-green-100 dark:bg-green-800 dark:text-green-200">{message}</div>}
            {error && <div className="mb-4 p-2 rounded text-red-700 bg-red-100 dark:bg-red-800 dark:text-red-200">Error: {error.message || String(error)}</div>}
            <form onSubmit={HandleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 auto-rows-auto">
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2">
                            <label htmlFor="castingTime" className="block text-lg w-48 font-medium">Casting Time:</label>
                            <input type="text" id="castingTime" name="castingTime" value={spell.castingTime || ''} onChange={HandleChange} className="mt-1 block w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <label htmlFor="range" className="block text-lg w-48 font-medium">Range (Text):</label>
                            <input type="text" id="range" name="range" value={spell.range || ''} readOnly className="mt-1 block w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600 bg-gray-100" />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <label htmlFor="rangeTypeId" className="block text-lg w-48 font-medium">Range:</label>
                            <select id="rangeTypeId" name="rangeTypeId" value={spell.rangeTypeId || ''} onChange={HandleChange} className="mt-1 block w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600">
                                <option value="">Select a range</option>
                                {SPELL_RANGE_LIST.map(range => (
                                    <option key={range.id} value={range.id}>
                                        {range.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <label htmlFor="rangeValue" className="block text-lg w-48 font-medium">Range Value:</label>
                            <input type="text" id="rangeValue" name="rangeValue" value={spell.rangeValue || ''} onChange={HandleChange} className="mt-1 block w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <label htmlFor="effect" className="block text-lg w-48 font-medium">Effect:</label>
                            <input type="text" id="effect" name="effect" value={spell.effect || ''} onChange={HandleChange} className="mt-1 block w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <label htmlFor="area" className="block text-lg w-48 font-medium">Area:</label>
                            <input type="text" id="area" name="area" value={spell.area || ''} onChange={HandleChange} className="mt-1 block w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <label htmlFor="target" className="block text-lg w-48 font-medium">Target:</label>
                            <input type="text" id="target" name="target" value={spell.target || ''} onChange={HandleChange} className="mt-1 block w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <label htmlFor="duration" className="block text-lg w-48 font-medium">Duration:</label>
                            <input type="text" id="duration" name="duration" value={spell.duration || ''} onChange={HandleChange} className="mt-1 block w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <label htmlFor="savingThrow" className="block text-lg w-48 font-medium">Saving Throw:</label>
                            <input type="text" id="savingThrow" name="savingThrow" value={spell.savingThrow || ''} onChange={HandleChange} className="mt-1 block w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <label htmlFor="spellResistance" className="block text-lg w-48 font-medium">Spell Resistance:</label>
                            <input type="text" id="spellResistance" name="spellResistance" value={spell.spellResistance || ''} onChange={HandleChange} className="mt-1 block w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <label htmlFor="sourceId" className="block text-lg w-48 font-medium">Source:</label>
                            <div className="flex items-center gap-2 w-full">
                                <select id="sourceId" name="sourceId" value={spell.sources[0]?.bookId || ''} onChange={HandleChange} className="mt-1 block w-64 p-1 border rounded dark:bg-gray-700 dark:border-gray-600">
                                    <option value="">Select a source</option>
                                    {SOURCE_BOOK_LIST.map(source => (
                                        <option key={source.id} value={source.id}>
                                            {source.name}
                                        </option>
                                    ))}
                                </select>

                                {spell.sources.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <label htmlFor="pageNumber" className="block text-lg font-medium">Pg:</label>
                                        <input type="number" id="pageNumber" name="pageNumber" value={spell.sources[0]?.pageNumber || ''} onChange={HandleChange} className="mt-1 block w-16 p-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="schools" className="block text-lg font-medium">Schools & Subschools:</label>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-y-2 gap-x-2 mt-1">
                            {SPELL_SCHOOL_LIST.map(school => (
                                <div key={school.id} className="p-2 border rounded dark:border-gray-600">
                                    <label className="inline-flex items-center font-bold text-base">
                                        <input
                                            type="checkbox"
                                            value={school.id}
                                            checked={spell.schools.some(s => s.schoolId === school.id)}
                                            onChange={HandleChange}
                                            name="schools"
                                            className="form-checkbox h-4 w-4 text-blue-600 dark:bg-gray-700 dark:border-gray-600 rounded accent-blue-600 checked:bg-blue-600 dark:checked:bg-blue-600"
                                        />
                                        <span className="ml-2">{school.name}</span>
                                    </label>
                                    {
                                        SPELL_SUBSCHOOL_LIST_BY_SCHOOL_ID[school.id]?.length > 0 && (
                                            <div className="ml-6 mt-1 grid grid-cols-1 gap-y-0.5">
                                                {SPELL_SUBSCHOOL_LIST_BY_SCHOOL_ID[school.id].map(subschool => (
                                                    <label key={subschool.id} className="inline-flex items-center text-sm">
                                                        <input
                                                            type="checkbox"
                                                            value={subschool.id}
                                                            checked={spell.subschools.some(s => s.subschoolId === subschool.id)}
                                                            onChange={HandleChange}
                                                            name="subschools"
                                                            className="form-checkbox h-4 w-4 text-blue-600 dark:bg-gray-700 dark:border-gray-600 rounded accent-blue-600 checked:bg-blue-600 dark:checked:bg-blue-600"
                                                        />
                                                        <span className="ml-2">{subschool.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )
                                    }
                                </div>
                            ))}
                        </div>
                        <div className="mt-1">
                            <label htmlFor="descriptors" className="block text-lg font-medium">Descriptors:</label>
                            <div className="grid grid-cols-4 gap-y-0.25 p-2 mt-1 border rounded dark:border-gray-600">
                                {SPELL_DESCRIPTOR_LIST.map(descriptor => (
                                    <div key={descriptor.id}>
                                        <label className="inline-flex items-center text-base">
                                            <input
                                                type="checkbox"
                                                name="descriptors"
                                                value={descriptor.id}
                                                checked={spell.descriptors.some(d => d.descriptorId === descriptor.id)}
                                                onChange={HandleChange}
                                                className="form-checkbox h-4 w-4 text-blue-600 dark:bg-gray-700 dark:border-gray-600 rounded accent-blue-600 checked:bg-blue-600 dark:checked:bg-blue-600"
                                            />
                                            <span className="ml-2 text-gray-700 dark:text-gray-300">{descriptor.name}</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-1">
                            <label htmlFor="components" className="block text-lg font-medium">Components:</label>
                            <div className="flex items-center gap-3 p-2 mt-1 border rounded dark:border-gray-600">
                                {SPELL_COMPONENT_LIST.map(component => (
                                    <div key={component.id}>
                                        <label className="inline-flex items-center text-base">
                                            <input
                                                type="checkbox"
                                                name="components"
                                                value={component.id}
                                                checked={spell.components?.includes(component.id) || false}
                                                onChange={HandleChange}
                                                className="form-checkbox h-4 w-4 text-blue-600 dark:bg-gray-700 dark:border-gray-600 rounded accent-blue-600 checked:bg-blue-600 dark:checked:bg-blue-600"
                                            />
                                            <span className="ml-1 text-gray-700 dark:text-gray-300">{component.name}</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-2">
                    <h3 className="text-lg font-medium">Class Levels:</h3>
                    <div className="flex items-center gap-2">
                        {spell.levelMapping.map((cl, index) => (
                            <div key={index} className="flex items-center gap-1">
                                <span className="block">{CLASS_MAP[cl.classId]?.name || 'Unknown Class'}:</span>
                                <Listbox
                                    value={cl.level || 0}
                                    onChange={(value) => HandleClassLevelChange(index, 'level', value)}
                                    as="div"
                                    className="relative inline-block text-left"
                                >
                                    <ListboxButton className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm p-1 bg-white text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
                                        {cl.level !== -1 ? cl.level : <TrashIcon className="w-4 h-4 text-red-500" />}
                                    </ListboxButton>
                                    <ListboxOptions className="absolute z-10 p-1 bg-white shadow-lg rounded-md text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-gray-300 dark:bg-gray-700">
                                        {[...Array(10).keys()].map(level => (
                                            <ListboxOption
                                                key={level}
                                                className={({ focus }) =>
                                                    `cursor-default select-none relative p-1 ${focus ? 'text-white bg-blue-600' : 'text-gray-900 dark:text-gray-300'}`
                                                }
                                                value={level}
                                            >
                                                {level}
                                            </ListboxOption>
                                        ))}
                                        <ListboxOption
                                            key="-1"
                                            className={({ focus }) =>
                                                `cursor-default select-none relative pl-0.5 ${focus ? 'text-white bg-blue-600' : 'text-gray-900 dark:text-gray-300'}`
                                            }
                                            value={-1}
                                        >
                                            <TrashIcon className="w-4 h-4 text-red-500" />
                                        </ListboxOption>
                                    </ListboxOptions>
                                </Listbox>
                            </div>
                        ))}
                        <select
                            value={selectedClassToAdd}
                            onChange={(e) => setSelectedClassToAdd(e.target.value)}
                            className="block p-1 border rounded dark:bg-gray-700 dark:border-gray-600 mr-1 w-48"
                        >
                            <option value="">Add Class</option>
                            {CLASS_LIST
                                .filter(cls => {
                                    const classIdsInUse = new Set(spell.levelMapping.map(c => c.classId));
                                    return !classIdsInUse.has(cls.id);
                                })
                                .map(cls => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.name}
                                    </option>
                                ))}
                        </select>
                        <button
                            type="button"
                            onClick={HandleAddClassLevel}
                            className="p-1.5 bg-green-600 rounded hover:bg-green-700"
                        >
                            Add
                        </button>
                    </div>
                </div>
                <div className="mt-2">
                    <label htmlFor="summary" className="block text-lg font-medium">Spell Summary:</label>
                    <input type="text" id="summary" name="summary" value={spell.summary || ''} onChange={HandleChange} className="mt-1 block w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div className="mt-2">
                    <MarkdownEditor
                        id="description"
                        name="description"
                        label="Spell Description"
                        value={spell.description || ''}
                        onChange={HandleChange}
                    />
                </div>
                <div className="flex mt-1 gap-2">
                    <button type="submit" className="px-4 py-2 bg-blue-600  rounded hover:bg-blue-700">Save Changes</button>
                    <button type="button" onClick={() => {
                        navigate(`/spells/${id}`, { state: { fromListParams: fromListParams } });
                    }} className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 dark:bg-gray-600  dark:hover:bg-gray-500">Cancel</button>
                </div>
            </form>
        </div>
    );
}
