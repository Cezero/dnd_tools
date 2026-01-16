
import { TrashIcon } from '@heroicons/react/24/outline';
import { useQueryClient } from '@tanstack/react-query';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import {
    ValidatedForm,
    ValidatedInput,
    useValidatedForm,
    CustomSelect,
    CustomCheckbox,
    SourceEditor
} from '@/components/forms';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { useCacheFunctions } from '@/services/cache';
import { SpellQueryHooks } from '@/services/query/SpellQueryHooks';
import { SpellLevelMapping, GetSpellResponse, UpdateSpellSchema, UpdateSpellRequest } from '@shared/schema';
import { SPELL_DESCRIPTOR_LIST, SPELL_COMPONENT_LIST, SPELL_RANGE_LIST, SPELL_RANGE_MAP, SPELL_SUBSCHOOL_BY_SCHOOL_ID_MAP, SPELL_SUBSCHOOL_MAP, SPELL_SCHOOL_LIST, SourceType, EditionId, CoreComponent } from '@shared/static-data';


export function SpellEdit() {
    const { getSpellcasterClassSelectByEdition, getClassSummaryById } = useCacheFunctions();
    const queryClient = useQueryClient();
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [spell, setSpell] = useState<GetSpellResponse | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedClassToAdd, setSelectedClassToAdd] = useState<number>(0);
    const [selectedLevelToAdd, setSelectedLevelToAdd] = useState<number>(1);
    const [classLevelMappings, setClassLevelMappings] = useState<SpellLevelMapping[]>([]);
    const [availableClasses, setAvailableClasses] = useState<CoreComponent[]>([]);
    const [classNames, setClassNames] = useState<Map<number, string>>(new Map());
    const fromListParams = location.state?.fromListParams || '';
    const loadingClassIdsRef = useRef<Set<number>>(new Set());

    const [formData, setFormData] = useState<UpdateSpellRequest | null>(null);

    // Use imperative API for data fetching and mutations
    const [spellData, setSpellData] = useState<unknown | null>(null);
    const [isLoadingSpell, setIsLoadingSpell] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [spellError, setSpellError] = useState<Error | null>(null);

    // Use the validated form hook
    const form = useValidatedForm(
        UpdateSpellSchema,
        formData,
        setFormData,
        {
            validateOnChange: true,
            validateOnBlur: true,
            debounceMs: 300
        }
    );

    // Load spell data with imperative API
    useEffect(() => {
        const fetchSpell = async () => {
            if (id === 'new') {
                return;
            }

            try {
                setIsLoadingSpell(true);
                setSpellError(null);
                const fetchedSpell = await SpellQueryHooks.getSpellById(parseInt(id!));
                setSpellData(fetchedSpell);
                setSpell(fetchedSpell);
                setFormData(fetchedSpell);

                // Initialize class level mappings if they exist in the fetched spell
                if (fetchedSpell.levelMapping) {
                    setClassLevelMappings(fetchedSpell.levelMapping);
                }
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Failed to fetch spell');
                setSpellError(error);
                setError(error.message);
            } finally {
                setIsLoadingSpell(false);
            }
        };

        fetchSpell();
    }, [id]);

    // Load available classes for spell selection (only once)
    useEffect(() => {
        let isMounted = true;

        const loadAvailableClasses = async () => {
            try {
                // Default to edition 5 (3.5e) for now - this could be made configurable
                const classes = await getSpellcasterClassSelectByEdition(EditionId.DND_3_5E);
                if (isMounted) {
                    setAvailableClasses(classes.map(cls => ({
                        id: cls.id,
                        name: cls.name,
                        abbreviation: cls.abbreviation
                    })));
                }
            } catch (error) {
                console.error('Failed to load available classes:', error);
                if (isMounted) {
                    setAvailableClasses([]);
                }
            }
        };

        loadAvailableClasses();

        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    // Load class names for classLevelMappings using getClassSummaryById
    useEffect(() => {
        if (classLevelMappings.length === 0) {
            return;
        }

        // Find class IDs that need to be loaded
        const classIdsToLoad = classLevelMappings
            .map(mapping => mapping.classId)
            .filter(classId => {
                // Skip if already in classNames or currently loading
                if (classNames.has(classId) || loadingClassIdsRef.current.has(classId)) {
                    return false;
                }
                // Mark as loading
                loadingClassIdsRef.current.add(classId);
                return true;
            });

        if (classIdsToLoad.length > 0) {
            // Load class names asynchronously
            Promise.all(
                classIdsToLoad.map(classId => getClassSummaryById(classId))
            ).then(classData => {
                setClassNames(prev => {
                    const updated = new Map(prev);
                    classData.forEach((cls, index) => {
                        if (cls) {
                            updated.set(classIdsToLoad[index], cls.name);
                        }
                        // Remove from loading set once processed
                        loadingClassIdsRef.current.delete(classIdsToLoad[index]);
                    });
                    return updated;
                });
            }).catch(error => {
                console.error('Failed to load class names:', error);
                // Remove from loading set on error so we can retry
                classIdsToLoad.forEach(id => loadingClassIdsRef.current.delete(id));
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [classLevelMappings]); // Only depend on classLevelMappings

    // Filter available classes to exclude those already in classLevelMappings
    const filteredAvailableClasses = useMemo(() => {
        const usedClassIds = classLevelMappings.map(mapping => mapping.classId);
        return availableClasses.filter(cls => !usedClassIds.includes(cls.id));
    }, [availableClasses, classLevelMappings]);

    const _HandleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | string) => {
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
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const HandleAddClassLevel = () => {
        if (selectedClassToAdd && selectedLevelToAdd >= 0 && selectedLevelToAdd <= 20) {
            const classId = selectedClassToAdd;
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

            // Reset selections
            setSelectedClassToAdd(0);
            setSelectedLevelToAdd(1);
        }
    };

    const HandleRemoveClassLevel = (classId: number) => {
        setClassLevelMappings(classLevelMappings.filter(mapping => mapping.classId !== classId));
    };

    // Handler for school selection
    const handleSchoolChange = (schoolId: number, checked: boolean) => {
        if (checked) {
            setFormData(prev => ({
                ...prev,
                schoolIds: [...(prev?.schoolIds || []), { schoolId }]
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                schoolIds: (prev?.schoolIds || []).filter(school => school.schoolId !== schoolId)
            }));
        }
    };

    // Handler for subschool selection
    const handleSubschoolChange = (subSchoolId: number, checked: boolean) => {
        if (checked) {
            setFormData(prev => ({
                ...prev,
                subSchoolIds: [...(prev?.subSchoolIds || []), { subSchoolId }]
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                subSchoolIds: (prev?.subSchoolIds || []).filter(subschool => subschool.subSchoolId !== subSchoolId)
            }));
        }
    };

    // Handler for descriptor selection
    const handleDescriptorChange = (descriptorId: number, checked: boolean) => {
        if (checked) {
            setFormData(prev => ({
                ...prev,
                descriptorIds: [...(prev?.descriptorIds || []), { descriptorId }]
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                descriptorIds: (prev?.descriptorIds || []).filter(descriptor => descriptor.descriptorId !== descriptorId)
            }));
        }
    };

    // Handler for component selection
    const handleComponentChange = (componentId: number, checked: boolean) => {
        if (checked) {
            setFormData(prev => ({
                ...prev,
                componentIds: [...(prev?.componentIds || []), { componentId }]
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                componentIds: (prev?.componentIds || []).filter(component => component.componentId !== componentId)
            }));
        }
    };

    const HandleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        // Validate the entire form
        if (!form.validation.validateForm(formData)) {
            return;
        }

        try {
            setIsLoading(true);
            setIsUpdating(true);

            // Prepare the data with class level mappings
            const submitData = {
                ...formData,
                levelMapping: classLevelMappings
            };

            await SpellQueryHooks.updateSpell(parseInt(id!), submitData as UpdateSpellRequest, queryClient);

            // Invalidate spell queries to ensure fresh data
            queryClient.invalidateQueries({ queryKey: ['spells', 'item', parseInt(id!)] });
            queryClient.invalidateQueries({ queryKey: ['spells', 'list'] });

            setMessage('Spell updated successfully!');
            navigate(`/spells/${id}`, { state: { fromListParams: fromListParams, refresh: true } });

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save spell');
        } finally {
            setIsLoading(false);
            setIsUpdating(false);
        }
    };

    if (isLoadingSpell && !spell) {
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

    // Available classes are now loaded via useEffect and stored in state

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-4">
                <h1 className="text-3xl font-bold">
                    {id === 'new' ? 'Create New Spell' : 'Edit Spell'}
                </h1>
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
                validationState={form.validation.validationState}
                isLoading={isLoading}
                formData={formData}
                setFormData={setFormData}
                validation={form.validation}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <ValidatedInput
                            field="name"
                            label="Name"
                            type="text"
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-1/5"
                            inputExtraClassName="w-4/5"
                            required
                            placeholder="e.g., Magic Missile, Fireball, Cure Wounds"
                            data-1p-ignore
                        />
                        <div className="flex items-center gap-2">
                            <label className="w-1/5">Range (raw)</label>
                            <input type="text" disabled value={formData?.range} className="w-4/5 disabled:opacity-50 disabled:cursor-not-allowed block p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <CustomSelect
                            label="Range Type"
                            value={formData?.rangeTypeId}
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-1/5"
                            itemExtraClassName="w-24"
                            itemTextExtraClassName="w-16"
                            onValueChange={(value) => setFormData(prev => ({ ...prev, rangeTypeId: value }))}
                            options={SPELL_RANGE_LIST}
                            placeholder="Select range type"
                        />
                        <ValidatedInput
                            field="rangeValue"
                            label="Range Value"
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-1/5"
                            inputExtraClassName="w-4/5"
                            type="text"
                            placeholder="e.g., 25 ft., touch, personal"
                        />
                        <ValidatedInput
                            field="duration"
                            label="Duration"
                            labelExtraClassName="w-1/5"
                            inputExtraClassName="w-4/5"
                            componentExtraClassName="flex items-center gap-2"
                            type="text"
                            placeholder="e.g., 1 minute/level, Instantaneous"
                        />
                        <ValidatedInput
                            field="castingTime"
                            label="Casting Time"
                            labelExtraClassName="w-1/5"
                            inputExtraClassName="w-4/5"
                            componentExtraClassName="flex items-center gap-2"
                            type="text"
                            placeholder="e.g., 1 standard action"
                        />
                    </div>
                    <div className="space-y-2">
                        <CustomSelect
                            label="Base Level"
                            required
                            value={formData?.baseLevel}
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-1/4"
                            onValueChange={(value) => setFormData(prev => ({ ...prev, baseLevel: value }))}
                            options={[...Array(10).keys()].map(level => ({ id: level, name: level.toString() }))}
                        />

                        <ValidatedInput
                            field="effect"
                            label="Effect"
                            labelExtraClassName="w-1/4"
                            inputExtraClassName="w-3/4"
                            componentExtraClassName="flex items-center gap-2"
                            type="text"
                            placeholder="e.g., Ray, Burst, Wall"
                        />
                        <ValidatedInput
                            field="area"
                            label="Area"
                            labelExtraClassName="w-1/4"
                            inputExtraClassName="w-3/4"
                            componentExtraClassName="flex items-center gap-2"
                            type="text"
                            placeholder="e.g., 20-ft. radius"
                        />
                        <ValidatedInput
                            field="target"
                            label="Target"
                            labelExtraClassName="w-1/4"
                            inputExtraClassName="w-3/4"
                            componentExtraClassName="flex items-center gap-2"
                            type="text"
                            placeholder="e.g., One creature, All creatures in area"
                        />
                        <ValidatedInput
                            field="savingThrow"
                            label="Saving Throw"
                            labelExtraClassName="w-1/4"
                            inputExtraClassName="w-3/4"
                            componentExtraClassName="flex items-center gap-2"
                            type="text"
                            placeholder="e.g., Reflex half, Will negates"
                        />
                        <ValidatedInput
                            field="spellResistance"
                            label="Spell Resistance"
                            labelExtraClassName="w-1/4"
                            inputExtraClassName="w-3/4"
                            componentExtraClassName="flex items-center gap-2"
                            type="text"
                            placeholder="e.g., Yes, No"
                        />
                    </div>
                </div>
                <div>
                    <ValidatedInput
                        field="summary"
                        label="Summary"
                        componentExtraClassName="flex items-center gap-2"
                        inputExtraClassName="w-full"
                        type="text"
                        placeholder="Brief description of the spell"
                    /></div>
                {/* Class Level Mappings */}
                <div className="mt-4">
                    <h2 className="text-xl font-semibold mb-4">Class Level Mappings</h2>
                    <div className="flex items-top gap-2 border rounded p-2 dark:border-gray-600">
                        <div className="w-5/7">
                            {/* Current Class Level Mappings */}
                            {classLevelMappings.length > 0 && (
                                <div className="mb-2">
                                    <div className="flex flex-wrap items-center gap-4">
                                        {classLevelMappings.map((mapping) => {
                                            const className = classNames.get(mapping.classId) || 'Unknown Class';
                                            return (
                                                <div key={mapping.classId} className="border rounded p-1 flex items-center justify-between gap-2 dark:border-gray-600">
                                                    <span className="text-sm whitespace-nowrap">
                                                        {className} - Lvl {mapping.level}
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
                        </div>
                        {/* Add New Class Level Mapping */}

                        <div className="flex items-top justify-end gap-3 w-2/7">
                            <div>
                                <CustomSelect
                                    label=""
                                    placeholder="Select a class"
                                    value={selectedClassToAdd}
                                    componentExtraClassName="flex items-center gap-2"
                                    onValueChange={(value) => setSelectedClassToAdd(value as number)}
                                    options={filteredAvailableClasses}
                                />
                            </div>
                            <div>
                                <CustomSelect
                                    label="Level"
                                    value={selectedLevelToAdd}
                                    componentExtraClassName="flex items-center gap-2"
                                    onValueChange={(value) => setSelectedLevelToAdd(value)}
                                    options={[...Array(10).keys()].map(level => ({ id: level, name: level.toString() }))}
                                />
                            </div>
                            <div>
                                <button
                                    type="button"
                                    onClick={HandleAddClassLevel}
                                    disabled={!selectedClassToAdd || selectedLevelToAdd < 0 || selectedLevelToAdd > 9 || filteredAvailableClasses.length === 0}
                                    className="px-2 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                        {filteredAvailableClasses.length === 0 && availableClasses.length > 0 && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                All available classes have been assigned levels for this spell.
                            </p>
                        )}
                    </div>
                </div>
                {/* Schools & Subschools */}
                <div className="mt-4">
                    <h2 className="text-xl font-semibold mb-4">Schools & Subschools</h2>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-y-2 gap-x-2">
                        {SPELL_SCHOOL_LIST.map(school => (
                            <div key={school.id} className="p-2 border rounded dark:border-gray-600">
                                <CustomCheckbox
                                    label={school.name}
                                    checked={(formData?.schoolIds || []).some(s => s.schoolId === school.id)}
                                    onCheckedChange={(checked) => handleSchoolChange(school.id, checked)}
                                    labelClassName="font-bold text-base"
                                />
                                {SPELL_SUBSCHOOL_BY_SCHOOL_ID_MAP[school.id] && SPELL_SUBSCHOOL_BY_SCHOOL_ID_MAP[school.id].length > 0 && (
                                    <div className="ml-6 mt-1 grid grid-cols-1 gap-y-1">
                                        {SPELL_SUBSCHOOL_BY_SCHOOL_ID_MAP[school.id].map(subschoolId => {
                                            const subschool = SPELL_SUBSCHOOL_MAP[subschoolId];
                                            if (!subschool) return null;
                                            return (
                                                <CustomCheckbox
                                                    key={`${school.id}-${subschool.id}`}
                                                    label={subschool.name}
                                                    checked={(formData?.subSchoolIds || []).some(s => s.subSchoolId === subschool.id)}
                                                    onCheckedChange={(checked) => handleSubschoolChange(subschool.id, checked)}
                                                    labelClassName="text-sm text-gray-700 dark:text-gray-300"
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Descriptors */}
                <div className="mt-4">
                    <h2 className="text-xl font-semibold mb-4">Descriptors</h2>
                    <div className="grid grid-cols-4 gap-y-1 gap-x-2 p-2 border rounded dark:border-gray-600">
                        {SPELL_DESCRIPTOR_LIST.map(descriptor => (
                            <CustomCheckbox
                                key={descriptor.id}
                                label={descriptor.name}
                                checked={(formData?.descriptorIds || []).some(d => d.descriptorId === descriptor.id)}
                                onCheckedChange={(checked) => handleDescriptorChange(descriptor.id, checked)}
                                labelClassName="text-base text-gray-700 dark:text-gray-300"
                            />
                        ))}
                    </div>
                </div>

                {/* Components */}
                <div className="mt-4">
                    <h2 className="text-xl font-semibold mb-4">Components</h2>
                    <div className="flex items-center gap-3 p-2 border rounded dark:border-gray-600">
                        {SPELL_COMPONENT_LIST.map(component => (
                            <CustomCheckbox
                                key={component.id}
                                label={component.name}
                                checked={(formData?.componentIds || []).some(c => c.componentId === component.id)}
                                onCheckedChange={(checked) => handleComponentChange(component.id, checked)}
                                labelClassName="text-base text-gray-700 dark:text-gray-300"
                            />
                        ))}
                    </div>
                </div>

                {/* Source References */}
                <div className="mt-4">
                    <SourceEditor
                        sources={formData?.sourceBookInfo || []}
                        onSourcesChange={(sources) => setFormData(prev => ({ ...prev, sourceBookInfo: sources }))}
                        sourceType={SourceType.Spells}
                    />
                </div>

                {/* Description */}
                <div className="mt-4">
                    <div className="space-y-2">
                        <MarkdownEditor
                            id="description"
                            value={formData?.description || ''}
                            onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                        />
                        {form.validation.getError('description') && (
                            <span className="text-red-500 text-sm">{form.validation.getError('description')}</span>
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
                        disabled={isLoading || form.validation.validationState.hasErrors}
                    >
                        {isLoading ? 'Saving...' : id === 'new' ? 'Create Spell' : 'Update Spell'}
                    </button>
                </div>
            </ValidatedForm>
        </div>
    );
} 
