import React, { useState, useEffect } from 'react';
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
import { ClassService } from '@/features/admin/features/class-management/ClassService';
import { CreateClassSchema, UpdateClassSchema, ClassIdParamSchema } from '@shared/schema';
import { RPG_DICE_SELECT_LIST, EDITION_SELECT_LIST, ABILITY_SELECT_LIST } from '@shared/static-data';



// Type definitions for the form state
type CreateClassFormData = z.infer<typeof CreateClassSchema>;
type UpdateClassFormData = z.infer<typeof UpdateClassSchema>;
type ClassFormData = CreateClassFormData | UpdateClassFormData;

export default function ClassEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [cls, setCls] = useState<ClassFormData | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Determine which schema to use based on whether we're creating or editing
    const schema = id === 'new' ? CreateClassSchema : UpdateClassSchema;

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
        ...(id !== 'new' && { id: parseInt(id) })
    };

    const [formData, setFormData] = useState<ClassFormData>(initialFormData);

    // Use the validated form hook
    const { validation, createFieldProps, createCheckboxProps } = useValidatedForm(
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
            if (id === 'new') {
                const newClass = await ClassService.createClass(formData as z.infer<typeof CreateClassSchema>);
                setMessage('Class created successfully!');
                setTimeout(() => navigate(`/admin/classes/${newClass.id}`), 1500);
            } else {
                await ClassService.updateClass(formData as z.infer<typeof UpdateClassSchema>, { id: parseInt(id) });
                setMessage('Class updated successfully!');
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

    // Create field props for each form field
    const nameProps = createFieldProps('name');
    const abbreviationProps = createFieldProps('abbreviation');
    const hitDieProps = createFieldProps('hitDie');
    const skillPointsProps = createFieldProps('skillPoints');
    const descriptionProps = createFieldProps('description');

    const isPrestigeProps = createCheckboxProps('isPrestige');
    const isVisibleProps = createCheckboxProps('isVisible');
    const canCastSpellsProps = createCheckboxProps('canCastSpells');

    // Create listbox props for hit die
    const hitDieListboxProps = {
        value: formData.hitDie,
        onChange: (value: string | number | null) => {
            const numValue = value as number;
            setFormData(prev => ({ ...prev, hitDie: numValue }));
            validation.validateField('hitDie', numValue);
        },
        error: validation.getError('hitDie'),
        hasError: validation.hasError('hitDie')
    };

    // Create listbox props for edition
    const editionListboxProps = {
        value: formData.editionId,
        onChange: (value: string | number | null) => {
            const numValue = value as number;
            setFormData(prev => ({ ...prev, editionId: numValue }));
            validation.validateField('editionId', numValue);
        },
        error: validation.getError('editionId'),
        hasError: validation.hasError('editionId')
    };

    // Create listbox props for casting ability
    const castingAbilityListboxProps = {
        value: formData.castingAbilityId,
        onChange: (value: string | number | null) => {
            setFormData(prev => ({ ...prev, castingAbilityId: value as number | null }));
            validation.validateField('castingAbilityId', value);
        },
        error: validation.getError('castingAbilityId'),
        hasError: validation.hasError('castingAbilityId')
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">
                    {id === 'new' ? 'Create New Class' : 'Edit Class'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    {id === 'new' ? 'Create a new character class' : 'Modify class details'}
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
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Basic Information</h2>

                        <ValidatedInput
                            name="name"
                            label="Class Name"
                            type="text"
                            required
                            placeholder="e.g., Wizard, Fighter, Cleric"
                            {...nameProps}
                        />

                        <ValidatedInput
                            name="abbreviation"
                            label="Abbreviation"
                            type="text"
                            required
                            placeholder="e.g., Wiz, Ftr, Clr"
                            {...abbreviationProps}
                        />

                        <ValidatedListbox
                            name="editionId"
                            label="Edition"
                            value={formData.editionId}
                            onChange={(value) => setFormData(prev => ({ ...prev, editionId: value as number }))}
                            options={EDITION_SELECT_LIST}
                            required
                            {...editionListboxProps}
                        />

                        <ValidatedListbox
                            name="hitDie"
                            label="Hit Die"
                            value={formData.hitDie}
                            onChange={(value) => setFormData(prev => ({ ...prev, hitDie: value as number }))}
                            options={RPG_DICE_SELECT_LIST}
                            required
                            {...hitDieListboxProps}
                        />

                        <ValidatedInput
                            name="skillPoints"
                            label="Skill Points per Level"
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            {...skillPointsProps}
                        />
                    </div>

                    {/* Class Properties */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Class Properties</h2>

                        <ValidatedCheckbox
                            name="isPrestige"
                            label="Prestige Class"
                            {...isPrestigeProps}
                        />

                        <ValidatedCheckbox
                            name="isVisible"
                            label="Visible to Players"
                            {...isVisibleProps}
                        />

                        <ValidatedCheckbox
                            name="canCastSpells"
                            label="Can Cast Spells"
                            {...canCastSpellsProps}
                        />

                        {formData.canCastSpells && (
                            <>
                                <ValidatedListbox
                                    name="castingAbilityId"
                                    label="Casting Ability"
                                    value={formData.castingAbilityId}
                                    onChange={(value) => setFormData(prev => ({ ...prev, castingAbilityId: value as number | null }))}
                                    options={ABILITY_SELECT_LIST}
                                    placeholder="Select casting ability"
                                    {...castingAbilityListboxProps}
                                />
                            </>
                        )}
                    </div>
                </div>

                {/* Description */}
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-4">Description</h2>
                    <div className="space-y-2">
                        <label htmlFor="description" className="block font-medium">
                            Class Description
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
                        onClick={() => navigate('/admin/classes')}
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
                        {isLoading ? 'Saving...' : id === 'new' ? 'Create Class' : 'Update Class'}
                    </button>
                </div>
            </ValidatedForm>
        </div>
    );
}
