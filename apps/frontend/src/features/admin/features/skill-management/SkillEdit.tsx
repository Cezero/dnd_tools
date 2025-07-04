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
import { SkillService } from '@/features/admin/features/skill-management/SkillService';
import { CreateSkillSchema, UpdateSkillSchema } from '@shared/schema';
import { ABILITY_MAP } from '@shared/static-data';



// Type definitions for the form state
type CreateSkillFormData = z.infer<typeof CreateSkillSchema>;
type UpdateSkillFormData = z.infer<typeof UpdateSkillSchema>;
type SkillFormData = CreateSkillFormData | UpdateSkillFormData;

export function SkillEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [skill, setSkill] = useState<SkillFormData | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fromListParams = location.state?.fromListParams || '';

    // Determine which schema to use based on whether we're creating or editing
    const schema = id === 'new' ? CreateSkillSchema : UpdateSkillSchema;

    // Initialize form data with default values
    const initialFormData: SkillFormData = useMemo(() => ({
        name: '',
        abilityId: 1,
        trainedOnly: false,
        affectedByArmor: false,
        checkDescription: '',
        actionDescription: '',
        retryTypeId: null,
        retryDescription: '',
        specialNotes: '',
        synergyNotes: '',
        untrainedNotes: '',
        description: '',
        ...(id !== 'new' && { id: parseInt(id) })
    }), [id]);

    const [formData, setFormData] = useState<SkillFormData>(initialFormData);

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
        const fetchSkill = async () => {
            if (id === 'new') {
                setSkill(initialFormData);
                return;
            }

            try {
                setIsLoading(true);
                const fetchedSkill = await SkillService.getSkillById(undefined, { id: parseInt(id) });
                setSkill(fetchedSkill);
                setFormData(fetchedSkill);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch skill');
            } finally {
                setIsLoading(false);
            }
        };

        fetchSkill();
    }, [id, initialFormData]);

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
                const newSkill = await SkillService.createSkill(formData as z.infer<typeof CreateSkillSchema>);
                setMessage('Skill created successfully!');
                setTimeout(() => navigate(`/admin/skills/${newSkill.id}`, { state: { fromListParams: fromListParams, refresh: true } }), 1500);
            } else {
                await SkillService.updateSkill(formData as z.infer<typeof UpdateSkillSchema>, { id: parseInt(id) });
                setMessage('Skill updated successfully!');
                navigate(`/admin/skills/${id}`, { state: { fromListParams: fromListParams, refresh: true } });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save skill');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !skill) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    if (error && !skill) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={() => navigate('/admin/skills')}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Back to Skills
                </button>
            </div>
        );
    }

    if (!skill) {
        return <div>No skill data available</div>;
    }

    // Create field props for each form field
    const nameProps = createFieldProps('name');
    const retryDescriptionProps = createFieldProps('retryDescription');
    const untrainedNotesProps = createFieldProps('untrainedNotes');

    const trainedOnlyProps = createCheckboxProps('trainedOnly');
    const affectedByArmorProps = createCheckboxProps('affectedByArmor');

    // Create listbox props for ability
    const abilityListboxProps = {
        value: formData.abilityId,
        onChange: (value: string | number | null) => {
            const numValue = value as number;
            setFormData(prev => ({ ...prev, abilityId: numValue }));
            validation.validateField('abilityId', numValue);
        },
        error: validation.getError('abilityId'),
        hasError: validation.hasError('abilityId')
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">
                    {id === 'new' ? 'Create New Skill' : 'Edit Skill'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    {id === 'new' ? 'Create a new skill' : 'Modify skill details'}
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
                            label="Skill Name"
                            type="text"
                            required
                            placeholder="e.g., Acrobatics, Diplomacy, Stealth"
                            {...nameProps}
                        />

                        <ValidatedListbox
                            name="abilityId"
                            label="Ability Score"
                            value={formData.abilityId}
                            onChange={(value) => setFormData(prev => ({ ...prev, abilityId: value as number }))}
                            options={Object.values(ABILITY_MAP).map(ability => ({ value: ability.id, label: ability.name }))}
                            required
                            {...abilityListboxProps}
                        />

                        <ValidatedCheckbox
                            name="trainedOnly"
                            label="Trained Only"
                            {...trainedOnlyProps}
                        />

                        <ValidatedCheckbox
                            name="affectedByArmor"
                            label="Armor Check Penalty"
                            {...affectedByArmorProps}
                        />
                    </div>

                    {/* Skill Properties */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Skill Properties</h2>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center w-30">
                                <input
                                    type="checkbox"
                                    id="retryTypeId"
                                    name="retryTypeId"
                                    checked={!!formData.retryTypeId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, retryTypeId: e.target.checked ? 1 : null }))}
                                    className="mr-2"
                                />
                                <label htmlFor="retryTypeId" className="font-medium">Try Again:</label>
                            </div>
                            <ValidatedInput
                                name="retryDescription"
                                label=""
                                type="text"
                                placeholder="Description of retry conditions"
                                {...retryDescriptionProps}
                            />
                        </div>

                        <ValidatedInput
                            name="untrainedNotes"
                            label="Untrained Description"
                            type="text"
                            placeholder="What happens when used untrained"
                            {...untrainedNotesProps}
                        />
                    </div>
                </div>

                {/* Descriptions */}
                <div className="mt-6 space-y-6">
                    <h2 className="text-xl font-semibold">Descriptions</h2>

                    <div className="space-y-2">
                        <label htmlFor="description" className="block font-medium">
                            Skill Description
                        </label>
                        <MarkdownEditor
                            value={formData.description || ''}
                            onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                        />
                        {validation.getError('description') && (
                            <span className="text-red-500 text-sm">{validation.getError('description')}</span>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="checkDescription" className="block font-medium">
                            Skill Check Description
                        </label>
                        <MarkdownEditor
                            value={formData.checkDescription || ''}
                            onChange={(value) => setFormData(prev => ({ ...prev, checkDescription: value }))}
                        />
                        {validation.getError('checkDescription') && (
                            <span className="text-red-500 text-sm">{validation.getError('checkDescription')}</span>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="actionDescription" className="block font-medium">
                            Action Description
                        </label>
                        <MarkdownEditor
                            value={formData.actionDescription || ''}
                            onChange={(value) => setFormData(prev => ({ ...prev, actionDescription: value }))}
                        />
                        {validation.getError('actionDescription') && (
                            <span className="text-red-500 text-sm">{validation.getError('actionDescription')}</span>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="synergyNotes" className="block font-medium">
                            Synergy Notes
                        </label>
                        <MarkdownEditor
                            value={formData.synergyNotes || ''}
                            onChange={(value) => setFormData(prev => ({ ...prev, synergyNotes: value }))}
                        />
                        {validation.getError('synergyNotes') && (
                            <span className="text-red-500 text-sm">{validation.getError('synergyNotes')}</span>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="specialNotes" className="block font-medium">
                            Special Notes
                        </label>
                        <MarkdownEditor
                            value={formData.specialNotes || ''}
                            onChange={(value) => setFormData(prev => ({ ...prev, specialNotes: value }))}
                        />
                        {validation.getError('specialNotes') && (
                            <span className="text-red-500 text-sm">{validation.getError('specialNotes')}</span>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 mt-8">
                    <button
                        type="button"
                        onClick={() => navigate(`/admin/skills${fromListParams ? `?${fromListParams}` : ''}`)}
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
                        {isLoading ? 'Saving...' : id === 'new' ? 'Create Skill' : 'Update Skill'}
                    </button>
                </div>
            </ValidatedForm>
        </div>
    );
} 