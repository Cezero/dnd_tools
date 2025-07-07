import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';

import {
    ValidatedForm,
    ValidatedInput,
    useValidatedForm,
    CustomSelect,
    CustomCheckbox
} from '@/components/forms';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { ClassService } from '@/features/admin/features/class-management/ClassService';
import { CreateClassSchema, UpdateClassSchema, ClassIdParamSchema } from '@shared/schema';
import { RPG_DICE_SELECT_LIST, EDITION_SELECT_LIST, ABILITY_SELECT_LIST, EDITION_SELECT_LIST_FULL } from '@shared/static-data';

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
        <div className="max-w-4xl mx-auto p-6">
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
                            label="Edition"
                            required
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-2/7"
                            itemExtraClassName="w-24"
                            itemTextExtraClassName="w-16"
                            value={formData.editionId}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, editionId: value as number }))}
                            options={EDITION_SELECT_LIST_FULL.map(edition => ({ value: edition.value, label: edition.label }))}
                            placeholder="Select edition"
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
                <div className="mt-6">
                    <div className="space-y-2">
                        <MarkdownEditor
                            value={formData.description || ''}
                            onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                        />
                        {form.validation.getError('description') && (
                            <span className="text-red-500 text-sm">{form.validation.getError('description')}</span>
                        )}
                    </div>
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
            </ValidatedForm>
        </div>
    );
}
