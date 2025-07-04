import { TrashIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';

import {
    ValidatedForm,
    ValidatedInput,
    ValidatedCheckbox,
    ValidatedListbox,
    useValidatedForm
} from '@/components/forms';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { SpellService } from '@/features/spell/SpellService';
import { SpellLevelMapping, GetSpellResponse, UpdateSpellSchema, UpdateSpellRequest, SpellIdParamSchema } from '@shared/schema';
import { SPELL_DESCRIPTOR_LIST, SPELL_SCHOOL_LIST, SPELL_COMPONENT_LIST, SPELL_RANGE_LIST, SPELL_RANGE_MAP, SPELL_SUBSCHOOL_LIST_BY_SCHOOL_ID, CLASS_LIST, CLASS_MAP } from '@shared/static-data';

export function SpellEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [spell, setSpell] = useState<GetSpellResponse | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedClassToAdd, setSelectedClassToAdd] = useState<string>('');
    const [selectedLevelToAdd, setSelectedLevelToAdd] = useState<number>(1);
    const [classLevelMappings, setClassLevelMappings] = useState<SpellLevelMapping[]>([]);
    const fromListParams = location.state?.fromListParams || '';


    const [formData, setFormData] = useState<UpdateSpellRequest | null>(null);

    // Use the validated form hook
    const { validation, createFieldProps, createCheckboxProps } = useValidatedForm(
        UpdateSpellSchema,
        formData,
        setFormData,
        {
            validateOnChange: true,
            validateOnBlur: true,
            debounceMs: 300
        }
    );

    useEffect(() => {
        const fetchSpell = async () => {
            try {
                setIsLoading(true);
                const validatedId = SpellIdParamSchema.parse({ id: id });
                const fetchedSpell = await SpellService.getSpellById(undefined, validatedId);
                setSpell(fetchedSpell);
                setFormData(fetchedSpell);

                // Initialize class level mappings if they exist in the fetched spell
                if (fetchedSpell.levelMapping) {
                    setClassLevelMappings(fetchedSpell.levelMapping);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch spell');
            } finally {
                setIsLoading(false);
            }
        };

        fetchSpell();
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
            setFormData(prev => ({
                ...prev,
                rangeTypeId: parseInt(value as string),
                range: selectedRange ? selectedRange.name : ''
            }));
        } else if (name === 'schools') {
            const schoolId = parseInt((e as React.ChangeEvent<HTMLInputElement>).target.value);
            setFormData(prev => {
                const newSchools = (e as React.ChangeEvent<HTMLInputElement>).target.checked
                    ? [...prev.schoolIds, { schoolId }]
                    : prev.schoolIds.filter(s => s.schoolId !== schoolId);
                return { ...prev, schoolIds: newSchools };
            });
        } else if (name === 'subschools') {
            const subschoolId = parseInt((e as React.ChangeEvent<HTMLInputElement>).target.value);
            setFormData(prev => {
                const newSubschools = (e as React.ChangeEvent<HTMLInputElement>).target.checked
                    ? [...(prev.subSchoolIds || []), { subSchoolId: subschoolId }]
                    : (prev.subSchoolIds || []).filter(s => s.subSchoolId !== subschoolId);
                return { ...prev, subSchoolIds: newSubschools };
            });
        } else if (name === 'descriptors') {
            const descriptorId = parseInt((e as React.ChangeEvent<HTMLInputElement>).target.value);
            setFormData(prev => {
                const newDescriptors = (e as React.ChangeEvent<HTMLInputElement>).target.checked
                    ? [...(prev.descriptorIds || []), { descriptorId }]
                    : (prev.descriptorIds || []).filter(d => d.descriptorId !== descriptorId);
                return { ...prev, descriptorIds: newDescriptors };
            });
        } else if (name === 'components') {
            const componentId = parseInt((e as React.ChangeEvent<HTMLInputElement>).target.value);
            setFormData(prev => {
                const newComponents = (e as React.ChangeEvent<HTMLInputElement>).target.checked
                    ? [...(prev.componentIds || []), { componentId }]
                    : (prev.componentIds || []).filter(c => c.componentId !== componentId);
                return { ...prev, componentIds: newComponents };
            });
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const HandleAddClassLevel = () => {
        if (selectedClassToAdd && selectedLevelToAdd >= 0 && selectedLevelToAdd <= 20) {
            const classId = parseInt(selectedClassToAdd);
            const newMapping: SpellLevelMapping = { classId, level: selectedLevelToAdd };

            // Check if this class is already mapped
            const existingIndex = classLevelMappings.findIndex(mapping => mapping.classId === classId);

            if (existingIndex !== -1) {
                // Update existing mapping
                const updatedMappings = [...classLevelMappings];
                updatedMappings[existingIndex] = newMapping;
                setClassLevelMappings(updatedMappings);
            } else {
                // Add new mapping
                setClassLevelMappings([...classLevelMappings, newMapping]);
            }

            setSelectedClassToAdd('');
            setSelectedLevelToAdd(1);
        }
    };

    const HandleRemoveClassLevel = (classId: number) => {
        setClassLevelMappings(classLevelMappings.filter(mapping => mapping.classId !== classId));
    };

    const HandleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        // Validate the entire form
        if (!validation.validateForm(formData)) {
            return;
        }

        try {
            setIsLoading(true);

            // Prepare the data with class level mappings
            const submitData = {
                ...formData,
                levelMapping: classLevelMappings
            };

            await SpellService.updateSpell(submitData as z.infer<typeof UpdateSpellSchema>, { id: parseInt(id) });
            setMessage('Spell updated successfully!');
            navigate(`/spells/${id}`, { state: { fromListParams: fromListParams, refresh: true } });

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save spell');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !spell) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    if (error && !spell) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={() => navigate('/spells')}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Back to Spells
                </button>
            </div>
        );
    }

    if (!spell) {
        return <div>No spell data available</div>;
    }

    // Create field props for each form field
    const nameProps = {
        ...createFieldProps('name'),
        value: formData.name as string || ''
    };
    const summaryProps = {
        ...createFieldProps('summary'),
        value: formData.summary as string || ''
    };
    const castingTimeProps = {
        ...createFieldProps('castingTime'),
        value: formData.castingTime as string || ''
    };
    const rangeValueProps = {
        ...createFieldProps('rangeValue'),
        value: formData.rangeValue as string || ''
    };
    const effectProps = {
        ...createFieldProps('effect'),
        value: formData.effect as string || ''
    };
    const areaProps = {
        ...createFieldProps('area'),
        value: formData.area as string || ''
    };
    const targetProps = {
        ...createFieldProps('target'),
        value: formData.target as string || ''
    };
    const durationProps = {
        ...createFieldProps('duration'),
        value: formData.duration as string || ''
    };
    const savingThrowProps = {
        ...createFieldProps('savingThrow'),
        value: formData.savingThrow as string || ''
    };
    const spellResistanceProps = {
        ...createFieldProps('spellResistance'),
        value: formData.spellResistance as string || ''
    };

    // Create listbox props for base level
    const baseLevelListboxProps = {
        value: formData.baseLevel,
        onChange: (value: string | number | null) => {
            const numValue = value as number;
            setFormData(prev => ({ ...prev, baseLevel: numValue }));
            validation.validateField('baseLevel', numValue);
        },
        error: validation.getError('baseLevel'),
        hasError: validation.hasError('baseLevel')
    };

    // Create listbox props for range type
    const rangeTypeListboxProps = {
        value: formData.rangeTypeId,
        onChange: (value: string | number | null) => {
            const numValue = value as number;
            setFormData(prev => ({ ...prev, rangeTypeId: numValue }));
            validation.validateField('rangeTypeId', numValue);
        },
        error: validation.getError('rangeTypeId'),
        hasError: validation.hasError('rangeTypeId')
    };

    // Get available classes for selection (filter out already selected ones)
    const availableClasses = CLASS_LIST.filter(dndClass =>
        dndClass.canCastSpells &&
        dndClass.isVisible &&
        !classLevelMappings.some(mapping => mapping.classId === dndClass.id)
    );

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">
                    {id === 'new' ? 'Create New Spell' : 'Edit Spell'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    {id === 'new' ? 'Create a new spell' : 'Modify spell details'}
                </p>
            </div>

            {message && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md dark:bg-green-900/20 dark:border-green-800">
                    <p className="text-green-700 dark:text-green-300">{message}</p>
                </div>
            )}

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800">
                    <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
            )}

            <ValidatedForm
                onSubmit={HandleSubmit}
                validationState={validation.validationState}
                isLoading={isLoading}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <ValidatedInput
                            name="name"
                            label="Spell Name"
                            type="text"
                            required
                            placeholder="e.g., Magic Missile, Fireball, Cure Wounds"
                            {...nameProps}
                        />

                        <ValidatedInput
                            name="summary"
                            label="Spell Summary"
                            type="text"
                            placeholder="Brief description of the spell"
                            {...summaryProps}
                        />
                        <ValidatedListbox
                            name="baseLevel"
                            label="Base Level"
                            value={formData.baseLevel}
                            onChange={(value) => setFormData(prev => ({ ...prev, baseLevel: value as number }))}
                            options={[...Array(10).keys()].map(level => ({ value: level, label: level.toString() }))}
                            required
                            {...baseLevelListboxProps}
                        />
                    </div>

                    {/* Spell Properties */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Spell Properties</h2>

                        <ValidatedInput
                            name="castingTime"
                            label="Casting Time"
                            type="text"
                            placeholder="e.g., 1 standard action"
                            {...castingTimeProps}
                        />

                        <ValidatedListbox
                            name="rangeTypeId"
                            label="Range Type"
                            value={formData.rangeTypeId}
                            onChange={(value) => setFormData(prev => ({ ...prev, rangeTypeId: value as number }))}
                            options={SPELL_RANGE_LIST.map(range => ({ value: range.id, label: range.name }))}
                            placeholder="Select range type"
                            {...rangeTypeListboxProps}
                        />

                        <ValidatedInput
                            name="rangeValue"
                            label="Range Value"
                            type="text"
                            placeholder="e.g., 25 ft., touch, personal"
                            {...rangeValueProps}
                        />

                        <ValidatedInput
                            name="effect"
                            label="Effect"
                            type="text"
                            placeholder="e.g., Ray, Burst, Wall"
                            {...effectProps}
                        />

                        <ValidatedInput
                            name="area"
                            label="Area"
                            type="text"
                            placeholder="e.g., 20-ft. radius"
                            {...areaProps}
                        />

                        <ValidatedInput
                            name="target"
                            label="Target"
                            type="text"
                            placeholder="e.g., One creature, All creatures in area"
                            {...targetProps}
                        />

                        <ValidatedInput
                            name="duration"
                            label="Duration"
                            type="text"
                            placeholder="e.g., 1 minute/level, Instantaneous"
                            {...durationProps}
                        />

                        <ValidatedInput
                            name="savingThrow"
                            label="Saving Throw"
                            type="text"
                            placeholder="e.g., Reflex half, Will negates"
                            {...savingThrowProps}
                        />

                        <ValidatedInput
                            name="spellResistance"
                            label="Spell Resistance"
                            type="text"
                            placeholder="e.g., Yes, No"
                            {...spellResistanceProps}
                        />
                    </div>
                </div>

                {/* Class Level Mappings */}
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-4">Class Level Mappings</h2>

                    {/* Current Class Level Mappings */}
                    {classLevelMappings.length > 0 && (
                        <div className="mb-4">
                            <h3 className="text-lg font-medium mb-2">Current Class Levels</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {classLevelMappings.map((mapping) => {
                                    const dndClass = CLASS_MAP[mapping.classId];
                                    return (
                                        <div key={mapping.classId} className="flex items-center justify-between p-2 border rounded dark:border-gray-600">
                                            <span className="text-sm">
                                                {dndClass?.name || 'Unknown Class'} - Level {mapping.level}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => HandleRemoveClassLevel(mapping.classId)}
                                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Add New Class Level Mapping */}
                    <div className="border rounded p-4 dark:border-gray-600">
                        <h3 className="text-lg font-medium mb-3">Add Class Level</h3>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">Class</label>
                                <select
                                    value={selectedClassToAdd}
                                    onChange={(e) => setSelectedClassToAdd(e.target.value)}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                >
                                    <option value="">Select a class</option>
                                    {availableClasses.map(dndClass => (
                                        <option key={dndClass.id} value={dndClass.id}>
                                            {dndClass.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-24">
                                <label className="block text-sm font-medium mb-1">Level</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="20"
                                    value={selectedLevelToAdd}
                                    onChange={(e) => setSelectedLevelToAdd(parseInt(e.target.value) || 0)}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={HandleAddClassLevel}
                                    disabled={!selectedClassToAdd || selectedLevelToAdd < 0 || selectedLevelToAdd > 20}
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                        {availableClasses.length === 0 && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                All available classes have been assigned levels for this spell.
                            </p>
                        )}
                    </div>
                </div>

                {/* Schools & Subschools */}
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-4">Schools & Subschools</h2>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-y-2 gap-x-2">
                        {SPELL_SCHOOL_LIST.map(school => (
                            <div key={school.id} className="p-2 border rounded dark:border-gray-600">
                                <label className="inline-flex items-center font-bold text-base">
                                    <input
                                        type="checkbox"
                                        value={school.id}
                                        checked={formData.schoolIds?.some(s => s.schoolId === school.id) || false}
                                        onChange={HandleChange}
                                        name="schools"
                                        className="mr-2"
                                    />
                                    <span>{school.name}</span>
                                </label>
                                {(SPELL_SUBSCHOOL_LIST_BY_SCHOOL_ID[school.id] as any[])?.length > 0 && (
                                    <div className="ml-6 mt-1 grid grid-cols-1 gap-y-0.5">
                                        {(SPELL_SUBSCHOOL_LIST_BY_SCHOOL_ID[school.id] as any[]).map(subschool => (
                                            <label key={subschool.id} className="inline-flex items-center text-sm">
                                                <input
                                                    type="checkbox"
                                                    value={subschool.id}
                                                    checked={formData.subSchoolIds?.some(s => s.subSchoolId === subschool.id) || false}
                                                    onChange={HandleChange}
                                                    name="subschools"
                                                    className="mr-2"
                                                />
                                                <span>{subschool.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Descriptors */}
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-4">Descriptors</h2>
                    <div className="grid grid-cols-4 gap-y-0.25 p-2 border rounded dark:border-gray-600">
                        {SPELL_DESCRIPTOR_LIST.map(descriptor => (
                            <div key={descriptor.id}>
                                <label className="inline-flex items-center text-base">
                                    <input
                                        type="checkbox"
                                        name="descriptors"
                                        value={descriptor.id}
                                        checked={formData.descriptorIds?.some(d => d.descriptorId === descriptor.id) || false}
                                        onChange={HandleChange}
                                        className="mr-2"
                                    />
                                    <span className="text-gray-700 dark:text-gray-300">{descriptor.name}</span>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Components */}
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-4">Components</h2>
                    <div className="flex items-center gap-3 p-2 border rounded dark:border-gray-600">
                        {SPELL_COMPONENT_LIST.map(component => (
                            <div key={component.id}>
                                <label className="inline-flex items-center text-base">
                                    <input
                                        type="checkbox"
                                        name="components"
                                        value={component.id}
                                        checked={formData.componentIds?.some(c => c.componentId === component.id) || false}
                                        onChange={HandleChange}
                                        className="mr-1"
                                    />
                                    <span className="text-gray-700 dark:text-gray-300">{component.name}</span>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Description */}
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-4">Description</h2>
                    <div className="space-y-2">
                        <label htmlFor="description" className="block font-medium">
                            Spell Description
                        </label>
                        <MarkdownEditor
                            value={formData.description || ''}
                            onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                        />
                        {validation.getError('description') && (
                            <span className="text-red-500 text-sm">{validation.getError('description')}</span>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 mt-8">
                    <button
                        type="button"
                        onClick={() => navigate(`/spells${fromListParams ? `?${fromListParams}` : ''}`)}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading || validation.validationState.hasErrors}
                    >
                        {isLoading ? 'Saving...' : id === 'new' ? 'Create Spell' : 'Update Spell'}
                    </button>
                </div>
            </ValidatedForm>
        </div>
    );
} 