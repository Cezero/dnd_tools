import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { TrashIcon } from '@heroicons/react/24/outline';

import {
    ValidatedForm,
    ValidatedInput,
    useValidatedForm,
    CustomSelect,
    CustomCheckbox
} from '@/components/forms';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { ClassService } from '@/features/admin/features/class-management/ClassService';
import { ClassFeatureAssoc } from '@/features/admin/features/class-management/ClassFeatureAssoc';
import { CreateClassSchema, UpdateClassSchema } from '@shared/schema';
import { RPG_DICE_SELECT_LIST, ABILITY_SELECT_LIST, EDITION_SELECT_LIST_FULL, _SKILL_MAP, SKILL_SELECT_LIST, BAB_PROGRESSION_SELECT_LIST, SAVE_PROGRESSION_SELECT_LIST, SPELL_PROGRESSION_SELECT_LIST } from '@shared/static-data';

// Type definitions for the form state
type ClassFormData = z.infer<typeof CreateClassSchema> | z.infer<typeof UpdateClassSchema>;

export default function ClassEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [cls, setCls] = useState<ClassFormData | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFeatureAssocOpen, setIsFeatureAssocOpen] = useState(false);

    // Determine which schema to use based on whether we're creating or editing
    const schema = id === 'new' ? CreateClassSchema : UpdateClassSchema;

    /**
     * Handles adding a skill to the class.
     */
    const handleAddSkill = useCallback((skillId: number) => {
        setFormData(prev => {
            const newSkillEntry = { classId: parseInt(id), skillId };
            const existingIndex = prev.skills?.findIndex(skill => skill.skillId === skillId) ?? -1;

            if (existingIndex !== -1) {
                // Skill already exists, don't add duplicate
                return prev;
            } else {
                return { ...prev, skills: [...(prev.skills || []), newSkillEntry] };
            }
        });
    }, [id]);

    /**
     * Handles the removal of a skill from the class's skill list.
     */
    const handleRemoveSkill = useCallback((skillId: number) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills?.filter(skill => skill.skillId !== skillId) || []
        }));
    }, []);

    // Initialize form data with default values
    const initialFormData: ClassFormData = {
        name: '',
        abbreviation: '',
        editionId: 1,
        isPrestige: false,
        isVisible: true,
        canCastSpells: false,
        hitDie: 1,
        skillPoints: 0,
        description: '',
        castingAbilityId: null,
        babProgression: 2, // poor
        fortProgression: 2, // poor
        refProgression: 2, // poor
        willProgression: 2, // poor
        spellProgression: null,
        ...(id !== 'new' && { id: parseInt(id) })
    };

    const [formData, setFormData] = useState<ClassFormData>(initialFormData);

    // Use the validated form hook
    const form = useValidatedForm(
        schema,
        formData,
        setFormData,
        {
            validateOnChange: true,
            validateOnBlur: true,
            debounceMs: 300
        }
    );

    useEffect(() => {
        const fetchClass = async () => {
            if (id === 'new') {
                setCls(initialFormData);
                return;
            }

            try {
                setIsLoading(true);
                const fetchedClass = await ClassService.getClassById(undefined, { id: parseInt(id) });
                setCls(fetchedClass);
                setFormData(fetchedClass);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch class');
            } finally {
                setIsLoading(false);
            }
        };

        fetchClass();
    }, [id]);

    // Handle new feature from association dialog
    useEffect(() => {
        if (location.state?.newFeature) {
            const newFeature = location.state.newFeature;
            // Add the new feature to the form data
            const currentFeatures = formData.features || [];
            setFormData(prev => ({
                ...prev,
                features: [...currentFeatures, {
                    classId: parseInt(id),
                    description: '',
                    featureSlug: newFeature.slug,
                    level: 1
                }]
            }));
            // Clear the state
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, id, navigate]);

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
            if (id === 'new') {
                const newClass = await ClassService.createClass(formData as z.infer<typeof CreateClassSchema>);
                setMessage('Class created successfully!');
                setTimeout(() => navigate(`/admin/classes/${newClass.id}`), 1500);
            } else {
                await ClassService.updateClass(formData as z.infer<typeof UpdateClassSchema>, { id: parseInt(id) });
                setMessage('Class updated successfully!');
                navigate(`/admin/classes/${id}`, { state: { fromListParams: location.state?.fromListParams, refresh: true } });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save class');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !cls) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    if (error && !cls) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={() => navigate('/admin/classes')}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Back to Classes
                </button>
            </div>
        );
    }

    if (!cls) {
        return <div>No class data available</div>;
    }

    return (
        <div className="w-4/5 mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">
                    {id === 'new' ? 'Create New Class' : 'Edit Class'}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex flex-col gap-2">
                        <ValidatedInput
                            field="name"
                            label="Class Name"
                            type="text"
                            required
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-2/7"
                            inputExtraClassName="w-5/7"
                            placeholder="e.g., Wizard, Fighter, Cleric"
                            data-1p-ignore
                        />
                        <ValidatedInput
                            field="abbreviation"
                            label="Abbreviation"
                            type="text"
                            required
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-2/7"
                            inputExtraClassName="w-5/7"
                            placeholder="e.g., Wiz, Ftr, Clr"
                        />

                        <CustomSelect
                            label="Hit Die"
                            required
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-2/7"
                            itemExtraClassName="w-24"
                            itemTextExtraClassName="w-16"
                            value={formData.hitDie}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, hitDie: value as number }))}
                            options={RPG_DICE_SELECT_LIST.map(die => ({ value: die.value, label: die.label }))}
                            placeholder="Select hit die"
                        />
                        <ValidatedInput
                            field="skillPoints"
                            label="Skill Point Base"
                            type="number"
                            min={0}
                            max={10}
                            step={1}
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-2/7"
                        />
                    </div>
                    <div className="flex justify-end">
                        <div className="flex flex-col gap-2">
                            <CustomSelect
                                label="Edition"
                                required
                                componentExtraClassName="flex items-center gap-2"
                                labelExtraClassName="w-16"
                                itemExtraClassName="w-24"
                                itemTextExtraClassName="w-16"
                                value={formData.editionId}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, editionId: value as number }))}
                                options={EDITION_SELECT_LIST_FULL}
                                placeholder="Select edition"
                            />
                            <CustomCheckbox
                                label="Prestige Class"
                                checked={formData.isPrestige as boolean}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPrestige: checked }))}
                            />
                            <CustomCheckbox
                                label="Visible in Lists"
                                checked={formData.isVisible as boolean}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVisible: checked }))}
                            />
                            <CustomCheckbox
                                label="Can Cast Spells"
                                checked={formData.canCastSpells as boolean}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, canCastSpells: checked }))}
                            />
                            {formData.canCastSpells && (
                                <CustomSelect
                                    label="Casting Ability"
                                    value={formData.castingAbilityId}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, castingAbilityId: value as number | null }))}
                                    options={ABILITY_SELECT_LIST.map(ability => ({ value: ability.value, label: ability.label }))}
                                    placeholder="Select casting ability"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Progression Types Section */}
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Progression Types</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <CustomSelect
                                label="Base Attack Bonus"
                                required
                                componentExtraClassName="flex items-center gap-2"
                                labelExtraClassName="w-32"
                                itemExtraClassName="w-24"
                                itemTextExtraClassName="w-16"
                                value={formData.babProgression}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, babProgression: value as 0 | 1 | 2 }))}
                                options={BAB_PROGRESSION_SELECT_LIST}
                                placeholder="Select BAB progression"
                            />
                            <CustomSelect
                                label="Fortitude Save"
                                required
                                componentExtraClassName="flex items-center gap-2"
                                labelExtraClassName="w-32"
                                itemExtraClassName="w-24"
                                itemTextExtraClassName="w-16"
                                value={formData.fortProgression}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, fortProgression: value as 0 | 2 }))}
                                options={SAVE_PROGRESSION_SELECT_LIST}
                                placeholder="Select Fort progression"
                            />
                        </div>
                        <div className="space-y-4">
                            <CustomSelect
                                label="Reflex Save"
                                required
                                componentExtraClassName="flex items-center gap-2"
                                labelExtraClassName="w-32"
                                itemExtraClassName="w-24"
                                itemTextExtraClassName="w-16"
                                value={formData.refProgression}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, refProgression: value as 0 | 2 }))}
                                options={SAVE_PROGRESSION_SELECT_LIST}
                                placeholder="Select Ref progression"
                            />
                            <CustomSelect
                                label="Will Save"
                                required
                                componentExtraClassName="flex items-center gap-2"
                                labelExtraClassName="w-32"
                                itemExtraClassName="w-24"
                                itemTextExtraClassName="w-16"
                                value={formData.willProgression}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, willProgression: value as 0 | 2 }))}
                                options={SAVE_PROGRESSION_SELECT_LIST}
                                placeholder="Select Will progression"
                            />
                        </div>
                    </div>
                    {formData.canCastSpells && (
                        <div className="mt-4">
                            <CustomSelect
                                label="Spell Progression"
                                componentExtraClassName="flex items-center gap-2"
                                labelExtraClassName="w-32"
                                itemExtraClassName="w-32"
                                itemTextExtraClassName="w-24"
                                value={formData.spellProgression}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, spellProgression: value as 0 | 1 | 2 | 3 | 4 | null }))}
                                options={SPELL_PROGRESSION_SELECT_LIST}
                                placeholder="Select spell progression"
                            />
                        </div>
                    )}
                </div>

                <div className="mt-6">
                    <div className="space-y-2">
                        <MarkdownEditor
                            id="description"
                            value={formData.description || ''}
                            onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                        />
                        {form.validation.getError('description') && (
                            <span className="text-red-500 text-sm">{form.validation.getError('description')}</span>
                        )}
                    </div>
                </div>

                {/* Class Skills Section */}
                <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Class Skills</h3>
                    <div className="flex flex-wrap gap-2 mb-2 p-2 border rounded dark:border-gray-600 min-h-[40px]">
                        {formData.skills && formData.skills.length > 0 ? (
                            formData.skills.map((skill, index) => (
                                <span key={skill.skillId} className="group relative text-sm pt-1 pb-1 pl-0 pr-0 cursor-pointer">
                                    {_SKILL_MAP[skill.skillId]?.name || 'Unknown Skill'}
                                    {index < formData.skills!.length - 1 && ','}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSkill(skill.skillId)}
                                        className="absolute inset-0 flex items-center justify-center text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove Skill"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </span>
                            ))
                        ) : (
                            <span className="text-gray-500 dark:text-gray-400">No skills added.</span>
                        )}
                        <CustomSelect
                            label=""
                            value={null}
                            componentExtraClassName="flex items-center gap-1 text-sm"
                            itemExtraClassName="w-48 text-sm leading-4 py-0.75"
                            itemTextExtraClassName="w-48"
                            onValueChange={(value) => {
                                if (value) {
                                    handleAddSkill(value as number);
                                }
                            }}
                            options={SKILL_SELECT_LIST
                                .filter(skill => !formData.skills?.some(cs => cs.skillId === skill.value))}
                            placeholder="Add"
                        />
                    </div>
                </div>

                {/* Class Features Section */}
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Class Features</h3>
                        <button
                            type="button"
                            onClick={() => setIsFeatureAssocOpen(true)}
                            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                        >
                            Add Features
                        </button>
                    </div>

                    {formData.features && formData.features.length > 0 ? (
                        <div className="space-y-2">
                            {formData.features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-4 p-3 border border-gray-200 rounded-md dark:border-gray-600">
                                    <div className="flex-1">
                                        <div className="font-medium">{feature.featureSlug}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm">Level:</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={feature.level}
                                            onChange={(e) => {
                                                const newFeatures = [...(formData.features || [])];
                                                newFeatures[index] = { ...feature, level: parseInt(e.target.value) };
                                                setFormData(prev => ({ ...prev, features: newFeatures }));
                                            }}
                                            className="w-16 px-2 py-1 border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newFeatures = formData.features?.filter((_, i) => i !== index) || [];
                                            setFormData(prev => ({ ...prev, features: newFeatures }));
                                        }}
                                        className="px-2 py-1 text-red-500 hover:text-red-700"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-gray-500 text-center py-4 border border-dashed border-gray-300 rounded-md dark:border-gray-600">
                            No features associated with this class
                        </div>
                    )}
                </div>
                <div className="flex justify-end space-x-4 mt-8">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/classes')}
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
                        {isLoading ? 'Saving...' : id === 'new' ? 'Create Class' : 'Update Class'}
                    </button>
                </div>
            </ValidatedForm >

            {/* Class Feature Association Dialog */}
            < ClassFeatureAssoc
                isOpen={isFeatureAssocOpen}
                onClose={() => setIsFeatureAssocOpen(false)
                }
                onSave={(selectedFeatures) => {
                    console.log('[ClassEdit] selectedFeatures received', selectedFeatures);
                    const newFeatures = selectedFeatures.map(feature => ({
                        classId: parseInt(id),
                        description: '',
                        featureSlug: feature.slug,
                        level: feature.level
                    }));
                    console.log('[ClassEdit] newFeatures', newFeatures);
                    setFormData(prev => {
                        console.log('[ClassEdit] replacing features with', newFeatures);
                        return {
                            ...prev,
                            features: newFeatures
                        };
                    });
                    setIsFeatureAssocOpen(false);
                }}
                initialSelectedFeatureIds={formData.features?.map(f => f.featureSlug) || []}
                classId={id !== 'new' ? parseInt(id) : undefined}
            />
        </div >
    );
}
