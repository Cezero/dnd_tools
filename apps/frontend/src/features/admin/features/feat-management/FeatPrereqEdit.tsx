import { Dialog } from '@base-ui-components/react/dialog';
import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { z } from 'zod';

import {
    ValidatedForm,
    ValidatedInput,
    useValidatedForm
} from '@/components/forms';
import { FeatPrerequisiteMapSchema } from '@shared/schema';
import { ABILITY_SELECT_LIST, FEAT_PREREQUISITE_TYPE_SELECT_LIST, FeatPrerequisiteType, SelectOption, SKILL_SELECT_LIST } from '@shared/static-data';
import { CustomSelect } from '@/components/forms/FormComponents';
import { FeatService } from './FeatService';

// Type definitions for the form state
type FeatPrerequisiteFormData = z.infer<typeof FeatPrerequisiteMapSchema>;

interface FeatPrereqEditProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (prereq: FeatPrerequisiteFormData) => void;
    initialPrereqData: FeatPrerequisiteFormData;
}

export function FeatPrereqEdit({ isOpen, onClose, onSave, initialPrereqData }: FeatPrereqEditProps) {
    const [prereq, setPrereq] = useState<FeatPrerequisiteFormData | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [featOptions, setFeatOptions] = useState<SelectOption[]>([]);

    // Initialize form data with default values
    const initialFormData: FeatPrerequisiteFormData = {
        ...initialPrereqData,
        index: initialPrereqData.index || 0,
        typeId: null,
        referenceId: null,
        amount: null,
    };

    const [formData, setFormData] = useState<FeatPrerequisiteFormData>(initialFormData);

    // Determine which schema to use based on whether we're creating or editing
    const schema = FeatPrerequisiteMapSchema;

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
        const fetchFeats = async () => {
            const feats = await FeatService.getAllFeats(undefined, undefined);
            setFeatOptions(feats.map(feat => ({ value: feat.id, label: feat.name })));
        }
        fetchFeats();
        if (initialPrereqData) {
            setFormData({
                ...initialPrereqData,
                index: initialPrereqData.index || 0,
                typeId: initialPrereqData.typeId || null,
                referenceId: initialPrereqData.referenceId || null,
                amount: initialPrereqData.amount || null,
            });
        }
    }, [initialPrereqData]);

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
            onSave(formData);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save prerequisite');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    // Create listbox props for type
    const typeListboxProps = {
        value: formData.typeId,
        onChange: (value: string | number | null) => {
            setFormData(prev => ({ ...prev, typeId: value as number | null }));
            form.validation.validateField('typeId', value);
        },
        error: form.validation.getError('typeId'),
        hasError: form.validation.hasError('typeId')
    };

    // Create listbox props for reference
    const referenceListboxProps = {
        value: formData.referenceId,
        onChange: (value: string | number | null) => {
            setFormData(prev => ({ ...prev, referenceId: value as number | null }));
            form.validation.validateField('referenceId', value);
        },
        error: form.validation.getError('referenceId'),
        hasError: form.validation.hasError('referenceId')
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Backdrop className="fixed inset-0 bg-black bg-opacity-25 z-40" />
            <Dialog.Portal>
                <Dialog.Popup className="fixed inset-0 flex items-center justify-center p-2">
                    <div className="w-full max-w-md transform overflow-visible rounded-2xl bg-white p-2 text-left align-middle shadow-xl transition-all dark:bg-gray-800">
                        <Dialog.Title className="text-lg border rounded-2xl p-2 dark:border-gray-700 font-medium mb-4 dark:bg-gray-900">
                            Edit Feat Prerequisite
                        </Dialog.Title>
                        {message && <div className="mb-4 p-2 rounded text-green-700 bg-green-100 dark:bg-green-800 dark:text-green-200">{message}</div>}
                        {error && <div className="mb-4 p-2 rounded text-red-700 bg-red-100 dark:bg-red-800 dark:text-red-200">Error: {error}</div>}

                        <ValidatedForm
                            onSubmit={HandleSubmit}
                            validationState={form.validation.validationState}
                            isLoading={isLoading}
                            formData={formData}
                            setFormData={setFormData}
                            validation={form.validation}
                        >
                            <div className="flex flex-col gap-2 p-2">
                                <div className="flex flex-col">
                                    <CustomSelect
                                        label="Type"
                                        required
                                        placeholder="Prerequisite Type"
                                        value={formData.typeId}
                                        componentExtraClassName='flex items-center gap-2'
                                        labelExtraClassName='w-32'
                                        itemTextExtraClassName='w-34'
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, typeId: value as number | null }))}
                                        options={FEAT_PREREQUISITE_TYPE_SELECT_LIST}
                                    />
                                </div>
                                {formData.typeId === FeatPrerequisiteType.FEAT && (
                                    <CustomSelect
                                        label="Reference"
                                        required
                                        value={formData.referenceId}
                                        componentExtraClassName='flex items-center gap-2'
                                        labelExtraClassName='w-32'
                                        itemTextExtraClassName='w-34'
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, referenceId: value as number | null }))}
                                        options={featOptions}
                                    />
                                ) || formData.typeId === FeatPrerequisiteType.ABILITY && (
                                    <>
                                        <CustomSelect
                                            label="Reference"
                                            required
                                            value={formData.referenceId}
                                            componentExtraClassName='flex items-center gap-2'
                                            labelExtraClassName='w-32'
                                            itemTextExtraClassName='w-34'
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, referenceId: value as number | null }))}
                                            options={ABILITY_SELECT_LIST}
                                        />
                                        <ValidatedInput
                                            field="amount"
                                            label="Min Score"
                                            type="number"
                                            min={1}
                                            step={1}
                                            placeholder="Minimum required score"
                                            componentExtraClassName='flex items-center gap-2'
                                            labelExtraClassName='w-32'
                                            inputExtraClassName='w-20'
                                        />
                                    </>
                                ) || formData.typeId === FeatPrerequisiteType.SKILL && (
                                    <>
                                        <CustomSelect
                                            label="Reference"
                                            required
                                            value={formData.referenceId}
                                            componentExtraClassName='flex items-center gap-2'
                                            labelExtraClassName='w-32'
                                            itemTextExtraClassName='w-34'
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, referenceId: value as number | null }))}
                                            options={SKILL_SELECT_LIST}
                                        />
                                        <ValidatedInput
                                            field="amount"
                                            label="Min Rank"
                                            type="number"
                                            min={1}
                                            step={1}
                                            placeholder="Minimum required rank"
                                            componentExtraClassName='flex items-center gap-2'
                                            labelExtraClassName='w-32'
                                            inputExtraClassName='w-20'
                                        />
                                    </>
                                ) || formData.typeId === FeatPrerequisiteType.BAB && (
                                    <>
                                        <ValidatedInput
                                            field="amount"
                                            label="Base Attack Bonus"
                                            type="number"
                                            min={1}
                                            step={1}
                                            placeholder="Minimum required base attack bonus"
                                            componentExtraClassName='flex items-center gap-2'
                                            labelExtraClassName='w-34'
                                            inputExtraClassName='w-20'
                                        />
                                    </>
                                ) || formData.typeId === FeatPrerequisiteType.SPELLCASTING && (
                                    <>
                                        <ValidatedInput
                                            field="amount"
                                            label="Caster Level"
                                            type="number"
                                            min={1}
                                            step={1}
                                            placeholder="Minimum required caster level"
                                            componentExtraClassName='flex items-center gap-2'
                                            labelExtraClassName='w-32'
                                            inputExtraClassName='w-20'
                                        />
                                    </>
                                )}

                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    className="inline-flex justify-center rounded-md border border-transparent bg-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200"
                                    onClick={onClose}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isLoading || form.validation.validationState.hasErrors}
                                >
                                    {isLoading ? 'Saving...' : 'Save Prerequisite'}
                                </button>
                            </div>
                        </ValidatedForm>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
} 