import { Dialog } from '@base-ui-components/react/dialog';
import React, { useState, useEffect } from 'react';
import { z } from 'zod';

import {
    ValidatedForm,
    ValidatedInput,
    useValidatedForm
} from '@/components/forms';
import { FeatOptions } from '@/features/admin/features/feat-management/FeatUtil';
import { FeatBenefitMapSchema } from '@shared/schema';
import { FEAT_BENEFIT_TYPE_BY_ID, FEAT_BENEFIT_TYPE_SELECT_LIST, FeatBenefitType } from '@shared/static-data';
import { CustomSelect } from '@/components/forms/FormComponents';

type FeatBenefitFormData = z.infer<typeof FeatBenefitMapSchema>;

interface FeatBenefitEditProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (benefit: FeatBenefitFormData) => void;
    initialBenefitData: FeatBenefitFormData;
    featId: number;
}

export function FeatBenefitEdit({ isOpen, onClose, onSave, initialBenefitData, featId }: FeatBenefitEditProps) {
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Initialize form data with default values
    const initialFormData: FeatBenefitFormData = {
        ...initialBenefitData,
        index: initialBenefitData.index || 0,
        typeId: null,
        referenceId: null,
        amount: null,
    };

    const [formData, setFormData] = useState<FeatBenefitFormData>(initialFormData);

    // Determine which schema to use based on whether we're creating or editing
    const schema = FeatBenefitMapSchema;

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
        if (initialBenefitData) {
            setFormData({
                ...initialBenefitData,
                index: initialBenefitData.index || 0,
                typeId: initialBenefitData.typeId || null,
                referenceId: initialBenefitData.referenceId || null,
                amount: initialBenefitData.amount || null,
            });
        }
    }, [initialBenefitData]);

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
            setError(err instanceof Error ? err.message : 'Failed to save benefit');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Backdrop className="fixed inset-0 bg-black bg-opacity-25 z-40" />
            <Dialog.Portal>
                <Dialog.Popup className="fixed inset-0 flex items-center justify-center p-2">
                    <div className="w-full max-w-md transform overflow-visible rounded-2xl bg-white p-2 text-left align-middle shadow-xl transition-all dark:bg-gray-800">
                        <Dialog.Title className="text-lg border rounded-2xl p-2 dark:border-gray-700 font-medium mb-4 dark:bg-gray-900">
                            Edit Feat Benefit
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
                                        label="Benefit Type"
                                        required
                                        value={formData.typeId}
                                        componentExtraClassName='flex items-center gap-2'
                                        labelExtraClassName='w-32'
                                        itemTextExtraClassName='w-20'
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, typeId: value as number | null }))}
                                        options={FEAT_BENEFIT_TYPE_SELECT_LIST}
                                    />
                                </div>

                                {formData.typeId && (
                                    <div className="flex flex-col">
                                        <CustomSelect
                                            label={`${FEAT_BENEFIT_TYPE_BY_ID[formData.typeId]} Reference`}
                                            required
                                            value={formData.referenceId}
                                            componentExtraClassName='flex items-center gap-2'
                                            labelExtraClassName='w-32'
                                            itemTextExtraClassName='w-40'
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, referenceId: value as number | null }))}
                                            options={FeatOptions(formData.typeId)}
                                        />
                                    </div>
                                )}
                                {formData.typeId && formData.typeId !== FeatBenefitType.PROFICIENCY && (
                                <ValidatedInput
                                    field="amount"
                                    label="Benefit Amount"
                                    type="number"
                                    componentExtraClassName='flex items-center gap-2'
                                    inputExtraClassName='w-20'
                                    labelExtraClassName='w-32'
                                    placeholder="e.g., 2, -1, 0" />
                                )}
                            </div>

                            <div className="mt-4 flex justify-end space-x-3">
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
                                    {isLoading ? 'Saving...' : 'Save Benefit'}
                                </button>
                            </div>
                        </ValidatedForm>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
