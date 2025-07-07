import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';

import { Select } from '@base-ui-components/react/select';
import { Checkbox } from '@base-ui-components/react/checkbox';
import { ChevronUpDownIcon } from '@heroicons/react/24/solid';
import {
    ValidatedForm,
    ValidatedInput,
    useValidatedForm
} from '@/components/forms';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { SkillService } from '@/features/admin/features/skill-management/SkillService';
import { CreateSkillSchema, UpdateSkillSchema } from '@shared/schema';
import { ABILITY_MAP, ABILITY_SELECT_LIST, SKILL_RETRY_TYPE_MAP } from '@shared/static-data';
import { CustomCheckbox, CustomSelect } from '@/components/forms/FormComponents';


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
        if (!form.validation.validateForm(formData)) {
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

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">
                    {id === 'new' ? 'Create New Skill' : 'Edit Skill'}
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
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <ValidatedInput
                                field="name"
                                label="Skill Name"
                                type="text"
                                componentExtraClassName="flex items-center gap-2"
                                labelExtraClassName="w-25"
                                inputExtraClassName="w-auto"
                                required
                                placeholder="e.g., Acrobatics, Diplomacy, Stealth"
                            />
                            <div className="flex flex-col gap-2">
                                <CustomSelect
                                    label="Ability"
                                    labelExtraClassName="w-15"
                                    itemExtraClassName="w-18"
                                    itemTextExtraClassName="w-10"
                                    componentExtraClassName="w-30 flex items-center gap-2"
                                    options={ABILITY_SELECT_LIST}
                                    value={formData.abilityId}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, abilityId: value as number }))}
                                />
                            </div>
                        </div>

                    </div>
                    <div className="space-y-2 flex justify-end">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <CustomCheckbox
                                    label="Trained Only"
                                    checked={formData.trainedOnly as boolean}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, trainedOnly: checked }))}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <CustomCheckbox
                                    label="Armor Check Penalty"
                                    checked={formData.affectedByArmor as boolean}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, affectedByArmor: checked }))}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                <MarkdownEditor
                        value={formData.description || ''}
                        id="description"
                        label="Description"
                        onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                    />
                    {form.validation.getError('description') && (
                        <span className="text-red-500 text-sm">{form.validation.getError('description')}</span>
                    )}
                    <CustomSelect
                        label="Try Again"
                        labelExtraClassName="w-20"
                        itemTextExtraClassName="w-15"
                        componentExtraClassName="flex items-center gap-2"
                        options={Object.values(SKILL_RETRY_TYPE_MAP).map((type, index) => ({ value: index, label: type }))}
                        value={formData.retryTypeId}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, retryTypeId: value as number }))}
                    />
                    <MarkdownEditor
                        value={formData.retryDescription || ''}
                        id="retry"
                        label="Retry"
                        onChange={(value) => setFormData(prev => ({ ...prev, retryDescription: value }))}
                    />
                    {form.validation.getError('retryDescription') && (
                        <span className="text-red-500 text-sm">{form.validation.getError('retryDescription')}</span>
                    )}

                    <MarkdownEditor
                        value={formData.untrainedNotes || ''}
                        id="untrained"
                        label="Untrained"
                        onChange={(value) => setFormData(prev => ({ ...prev, untrainedNotes: value }))}
                    />
                    {form.validation.getError('untrainedNotes') && (
                        <span className="text-red-500 text-sm">{form.validation.getError('untrainedNotes')}</span>
                    )}

                    <MarkdownEditor
                        value={formData.checkDescription || ''}
                        id="check"
                        label="Check"
                        onChange={(value) => setFormData(prev => ({ ...prev, checkDescription: value }))}
                    />
                    {form.validation.getError('checkDescription') && (
                        <span className="text-red-500 text-sm">{form.validation.getError('checkDescription')}</span>
                    )}
                    <MarkdownEditor
                        value={formData.actionDescription || ''}
                        id="action"
                        label="Action"
                        onChange={(value) => setFormData(prev => ({ ...prev, actionDescription: value }))}
                    />
                    {form.validation.getError('actionDescription') && (
                        <span className="text-red-500 text-sm">{form.validation.getError('actionDescription')}</span>
                    )}
                    <MarkdownEditor
                        value={formData.synergyNotes || ''}
                        id="synergy"
                        label="Synergy"
                        onChange={(value) => setFormData(prev => ({ ...prev, synergyNotes: value }))}
                    />
                    {form.validation.getError('synergyNotes') && (
                        <span className="text-red-500 text-sm">{form.validation.getError('synergyNotes')}</span>
                    )}
                    <MarkdownEditor
                        value={formData.specialNotes || ''}
                        id="special"
                        label="Special"
                        onChange={(value) => setFormData(prev => ({ ...prev, specialNotes: value }))}
                    />
                    {form.validation.getError('specialNotes') && (
                        <span className="text-red-500 text-sm">{form.validation.getError('specialNotes')}</span>
                    )}
                </div>

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
                        disabled={isLoading || form.validation.validationState.hasErrors}
                    >
                        {isLoading ? 'Saving...' : id === 'new' ? 'Create Skill' : 'Update Skill'}
                    </button>
                </div>
            </ValidatedForm>
        </div>
    );
} 