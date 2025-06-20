import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import MarkdownEditor from '@/components/MarkdownEditor';
import api from '@/services/api';
import lookupService from '@/services/LookupService';
import Icon from '@mdi/react';
import { mdiTrashCan } from '@mdi/js';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { SPELL_DESCRIPTOR_LIST, SPELL_SCHOOL_LIST, SPELL_COMPONENT_LIST, SPELL_RANGE_LIST, SPELL_SUBSCHOOL_LIST_BY_SCHOOL_ID } from 'shared-data/src/spellData';

function SpellEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';
    const [spell, setSpell] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [spellRanges, setSpellRanges] = useState([]);
    const [spellClasses, setSpellClasses] = useState([]);
    const [spellSources, setSpellSources] = useState([]);
    const [selectedClassToAdd, setSelectedClassToAdd] = useState('');
    const [spellSchools, setSpellSchools] = useState([]);
    const [spellDescriptors, setSpellDescriptors] = useState([]);
    const [spellComponents, setSpellComponents] = useState([]);

    useEffect(() => {
        const fetchSpellAndLookups = async () => {
            try {
                await lookupService.initialize();
                setSpellRanges(SPELL_RANGE_LIST);

                const classes = lookupService.getAll('classes');
                setSpellClasses(classes);

                const sources = lookupService.getAll('sources');
                setSpellSources(sources);

                setSpellSchools(SPELL_SCHOOL_LIST);

                setSpellDescriptors(SPELL_DESCRIPTOR_LIST);

                setSpellComponents(SPELL_COMPONENT_LIST);

                const data = await api(`/spells/${id}`);
                setSpell(prevSpell => ({ // Use functional update to ensure latest state
                    ...data,
                    components: data.components || [], // Ensure components is an array
                    descriptors: data.descriptors || [], // Ensure descriptors is an array
                    schools: data.schools || [], // Ensure schools is an array
                    subschools: data.subschools || [], // Ensure subschools is an array
                    spell_effect: data.spell_effect || '', // Ensure spell_effect is a string
                    spell_target: data.spell_target || '' // Ensure spell_target is a string
                }));

            } catch (err) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSpellAndLookups();
    }, [id]);

    const handleChange = (e) => {
        let name, value;

        // MDEditor passes value directly as the first argument, not an event object
        if (typeof e === 'string') {
            name = 'spell_description';
            value = e;
        } else {
            // For other input types, destructure from e.target
            ({ name, value } = e.target);
        }

        if (name === 'spell_range_id') {
            const selectedRange = spellRanges.find(range => range.range_id === parseInt(value));
            setSpell(prevSpell => ({
                ...prevSpell,
                spell_range_id: parseInt(value),
                spell_range: selectedRange ? selectedRange.range_name : ''
            }));
        } else if (name === 'class_id') {
            // For simplicity, handle single class selection for now
            const selectedClassId = parseInt(value);
            setSpell(prevSpell => ({
                ...prevSpell,
                class_levels: selectedClassId ? [{ class_id: selectedClassId, spell_level: prevSpell.class_levels[0]?.spell_level || 0 }] : []
            }));
        } else if (name === 'source_id') {
            // For simplicity, handle single source selection for now
            const selectedSourceId = parseInt(value);
            setSpell(prevSpell => ({
                ...prevSpell,
                sources: selectedSourceId ? [{ book_id: selectedSourceId, page_number: prevSpell.sources[0]?.page_number || null }] : []
            }));
        } else if (name === 'page_number') {
            const newPageNumber = parseInt(value);
            setSpell(prevSpell => ({
                ...prevSpell,
                sources: prevSpell.sources.length > 0 ? [{ ...prevSpell.sources[0], page_number: newPageNumber }] : []
            }));
        } else if (name === 'schools') {
            const schoolId = parseInt(e.target.value);
            setSpell(prevSpell => {
                const newSchools = e.target.checked
                    ? [...prevSpell.schools, schoolId]
                    : prevSpell.schools.filter(id => id !== schoolId);
                return { ...prevSpell, schools: newSchools };
            });
        } else if (name === 'subschools') {
            const subschoolId = parseInt(e.target.value);
            setSpell(prevSpell => {
                const newSubschools = e.target.checked
                    ? [...prevSpell.subschools, subschoolId]
                    : prevSpell.subschools.filter(id => id !== subschoolId);
                return { ...prevSpell, subschools: newSubschools };
            });
        } else if (name === 'descriptors') {
            const descriptorId = parseInt(e.target.value);
            setSpell(prevSpell => {
                const newDescriptors = e.target.checked
                    ? [...prevSpell.descriptors, descriptorId]
                    : prevSpell.descriptors.filter(id => id !== descriptorId);
                return { ...prevSpell, descriptors: newDescriptors };
            });
        } else if (name === 'components') {
            const componentId = parseInt(e.target.value);
            setSpell(prevSpell => {
                const newComponents = e.target.checked
                    ? [...prevSpell.components, componentId]
                    : prevSpell.components.filter(id => id !== componentId);
                return { ...prevSpell, components: newComponents };
            });
        } else {
            setSpell(prevSpell => ({
                ...prevSpell,
                [name]: value
            }));
        }
    };

    const handleClassLevelChange = (index, field, value) => {
        setSpell(prevSpell => {
            if (field === 'spell_level' && parseInt(value) === -1) {
                // If 'Remove' is selected, remove the class level
                return {
                    ...prevSpell,
                    class_levels: prevSpell.class_levels.filter((_, i) => i !== index)
                };
            } else {
                return {
                    ...prevSpell,
                    class_levels: prevSpell.class_levels.map((cl, i) =>
                        i === index ? { ...cl, [field]: parseInt(value) } : cl
                    )
                };
            }
        });
    };

    const handleAddClassLevel = () => {
        if (selectedClassToAdd) {
            const newClassId = parseInt(selectedClassToAdd);
            const existingClass = spell.class_levels.find(cl => cl.class_id === newClassId);
            if (!existingClass) {
                setSpell(prevSpell => ({
                    ...prevSpell,
                    class_levels: [...prevSpell.class_levels, { class_id: newClassId, spell_level: 0 }]
                }));
            } else {
                setMessage('Class already added.');
            }
            setSelectedClassToAdd(''); // Reset selection
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        try {
            const payload = {
                ...spell,
                class_levels: spell.class_levels.map(cl => ({
                    class_id: parseInt(cl.class_id),
                    spell_level: parseInt(cl.spell_level)
                })).filter(cl => !isNaN(cl.class_id) && !isNaN(cl.spell_level)),
                source_id: spell.sources.length > 0 ? spell.sources[0].book_id : null,
                page_number: spell.sources.length > 0 ? spell.sources[0].page_number : null,
                spell_effect: spell.spell_effect || null,
                spell_target: spell.spell_target || null
            };

            // Remove complex objects and single-entry class/source fields
            delete payload.class_id; // Remove the single class_id
            delete payload.spell_level; // Remove the single spell_level
            delete payload.sources; // Remove the sources array, as source_id and page_number are sent separately
            payload.schools = spell.schools;
            payload.subschools = spell.subschools;
            payload.descriptors = spell.descriptors; // Use spell.descriptors directly
            payload.components = spell.components;

            await api(`/spells/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });
            setMessage('Spell updated successfully!');
            navigate(`/spells/${id}`, { state: { fromListParams: fromListParams } }); // Redirect to view spell page, passing list params
        } catch (err) {
            setError(err);
            setMessage(`Error updating spell: ${err.message || err}`);
        }
    };

    if (isLoading) return <div className="p-4 bg-white  dark:bg-[#121212]  min-h-screen">Loading spell for editing...</div>;
    if (error) return <div className="p-4 bg-white  dark:bg-[#121212] dark:text-red-500 min-h-screen">Error: {error.message}</div>;
    if (!spell) return <div className="p-4 bg-white  dark:bg-[#121212]  min-h-screen">Spell not found.</div>;

    return (
        <div className="p-4 bg-white dark:bg-[#121212] min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Edit Spell: {spell.spell_name}</h1>
            {message && <div className="mb-4 p-2 rounded text-green-700 bg-green-100 dark:bg-green-800 dark:text-green-200">{message}</div>}
            {error && <div className="mb-4 p-2 rounded text-red-700 bg-red-100 dark:bg-red-800 dark:text-red-200">Error: {error.message || String(error)}</div>}
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 auto-rows-auto">
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2">
                            <label htmlFor="cast_time" className="block text-lg w-48 font-medium">Casting Time:</label>
                            <input type="text" id="cast_time" name="cast_time" value={spell.cast_time || ''} onChange={handleChange} className="mt-1 block w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <label htmlFor="spell_range" className="block text-lg w-48 font-medium">Range (Text):</label>
                            <input type="text" id="spell_range" name="spell_range" value={spell.spell_range || ''} readOnly className="mt-1 block w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600 bg-gray-100 dark:bg-gray-800" />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <label htmlFor="spell_range_id" className="block text-lg w-48 font-medium">Range:</label>
                            <select id="spell_range_id" name="spell_range_id" value={spell.spell_range_id || ''} onChange={handleChange} className="mt-1 block w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600">
                                <option value="">Select a range</option>
                                {spellRanges.map(range => (
                                    <option key={range.id} value={range.id}>
                                        {range.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <label htmlFor="spell_range_value" className="block text-lg w-48 font-medium">Range Value:</label>
                            <input type="text" id="spell_range_value" name="spell_range_value" value={spell.spell_range_value || ''} onChange={handleChange} className="mt-1 block w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <label htmlFor="spell_effect" className="block text-lg w-48 font-medium">Effect:</label>
                            <input type="text" id="spell_effect" name="spell_effect" value={spell.spell_effect || ''} onChange={handleChange} className="mt-1 block w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <label htmlFor="spell_area" className="block text-lg w-48 font-medium">Area:</label>
                            <input type="text" id="spell_area" name="spell_area" value={spell.spell_area || ''} onChange={handleChange} className="mt-1 block w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <label htmlFor="spell_target" className="block text-lg w-48 font-medium">Target:</label>
                            <input type="text" id="spell_target" name="spell_target" value={spell.spell_target || ''} onChange={handleChange} className="mt-1 block w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <label htmlFor="spell_duration" className="block text-lg w-48 font-medium">Duration:</label>
                            <input type="text" id="spell_duration" name="spell_duration" value={spell.spell_duration || ''} onChange={handleChange} className="mt-1 block w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <label htmlFor="spell_save" className="block text-lg w-48 font-medium">Saving Throw:</label>
                            <input type="text" id="spell_save" name="spell_save" value={spell.spell_save || ''} onChange={handleChange} className="mt-1 block w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <label htmlFor="spell_resistance" className="block text-lg w-48 font-medium">Spell Resistance:</label>
                            <input type="text" id="spell_resistance" name="spell_resistance" value={spell.spell_resistance || ''} onChange={handleChange} className="mt-1 block w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <label htmlFor="source_id" className="block text-lg w-48 font-medium">Source:</label>
                            <div className="flex items-center gap-2 w-full">
                                <select id="source_id" name="source_id" value={spell.sources[0]?.book_id || ''} onChange={handleChange} className="mt-1 block w-64 p-1 border rounded dark:bg-gray-700 dark:border-gray-600">
                                    <option value="">Select a source</option>
                                    {spellSources.map(source => (
                                        <option key={source.book_id} value={source.book_id}>
                                            {source.title}
                                        </option>
                                    ))}
                                </select>

                                {spell.sources.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <label htmlFor="page_number" className="block text-lg font-medium">Pg:</label>
                                        <input type="number" id="page_number" name="page_number" value={spell.sources[0]?.page_number || ''} onChange={handleChange} className="mt-1 block w-16 p-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="schools" className="block text-lg font-medium">Schools & Subschools:</label>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-y-2 gap-x-2 mt-1">
                            {spellSchools.map(school => (
                                <div key={school.id} className="p-2 border rounded dark:border-gray-600">
                                    <label className="inline-flex items-center font-bold text-base">
                                        <input
                                            type="checkbox"
                                            value={school.id}
                                            checked={spell.schools.includes(school.id)}
                                            onChange={handleChange}
                                            name="schools"
                                            className="form-checkbox h-4 w-4 text-blue-600 dark:bg-gray-700 dark:border-gray-600 rounded accent-blue-600 checked:bg-blue-600 dark:checked:bg-blue-600"
                                        />
                                        <span className="ml-2">{school.name}</span>
                                    </label>
                                    {
                                        SPELL_SUBSCHOOL_LIST_BY_SCHOOL_ID[school.id].length > 0 && (
                                            <div className="ml-6 mt-1 grid grid-cols-1 gap-y-0.5">
                                                {SPELL_SUBSCHOOL_LIST_BY_SCHOOL_ID[school.id].map(subschool => (
                                                    <label key={subschool.id} className="inline-flex items-center text-sm">
                                                        <input
                                                            type="checkbox"
                                                            value={subschool.id}
                                                            checked={spell.subschools.includes(subschool.id)}
                                                            onChange={handleChange}
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
                                {spellDescriptors.map(descriptor => (
                                    <div key={descriptor.id}>
                                        <label className="inline-flex items-center text-base">
                                            <input
                                                type="checkbox"
                                                name="descriptors"
                                                value={descriptor.id}
                                                checked={spell.descriptors.includes(descriptor.id)}
                                                onChange={handleChange}
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
                                {spellComponents.map(component => (
                                    <div key={component.id}>
                                        <label className="inline-flex items-center text-base">
                                            <input
                                                type="checkbox"
                                                name="components"
                                                value={component.id}
                                                checked={spell.components.includes(component.id)}
                                                onChange={handleChange}
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
                        {spell.class_levels.map((cl, index) => (
                            <div key={index} className="flex items-center gap-1">
                                <span className="block">{lookupService.getById('classes', cl.class_id)?.class_name || 'Unknown Class'}:</span>
                                <Listbox
                                    value={cl.spell_level || 0}
                                    onChange={(value) => handleClassLevelChange(index, 'spell_level', value)}
                                    as="div"
                                    className="relative inline-block text-left"
                                >
                                    <ListboxButton className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm p-1 bg-white text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
                                        {cl.spell_level !== -1 ? cl.spell_level : <Icon path={mdiTrashCan} size={0.8} color="red" />}
                                    </ListboxButton>
                                    <ListboxOptions className="absolute z-10 p-1 bg-white shadow-lg rounded-md text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-gray-300 dark:bg-gray-700">
                                        {[...Array(10).keys()].map(level => (
                                            <ListboxOption
                                                key={level}
                                                className={({ active }) =>
                                                    `cursor-default select-none relative p-1 ${active ? 'text-white bg-blue-600' : 'text-gray-900 dark:text-gray-300'}`
                                                }
                                                value={level}
                                            >
                                                {level}
                                            </ListboxOption>
                                        ))}
                                        <ListboxOption
                                            key="-1"
                                            className={({ active }) =>
                                                `cursor-default select-none relative pl-0.5 ${active ? 'text-white bg-blue-600' : 'text-gray-900 dark:text-gray-300'}`
                                            }
                                            value={-1}
                                        >
                                            <Icon path={mdiTrashCan} size={0.6} color="red" />
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
                            {spellClasses
                                .filter(cls => {
                                    const addedClassNames = new Set(spell.class_levels.map(cl => lookupService.getById('classes', cl.class_id)?.class_name).filter(Boolean));
                                    return !addedClassNames.has(cls.class_name);
                                })
                                .map(cls => (
                                    <option key={cls.class_id} value={cls.class_id}>
                                        {cls.class_name}
                                    </option>
                                ))}
                        </select>
                        <button
                            type="button"
                            onClick={handleAddClassLevel}
                            className="p-1.5 bg-green-600 rounded hover:bg-green-700"
                        >
                            Add
                        </button>
                    </div>
                </div>
                <div className="mt-2">
                    <label htmlFor="spell_summary" className="block text-lg font-medium">Spell Summary:</label>
                    <input type="text" id="spell_summary" name="spell_summary" value={spell.spell_summary || ''} onChange={handleChange} className="mt-1 block w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div className="mt-2">
                    <MarkdownEditor
                        id="spell_description"
                        name="spell_description"
                        label="Spell Description"
                        value={spell.spell_description || ''}
                        onChange={handleChange}
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

export default SpellEdit; 