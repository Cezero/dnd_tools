import { Dialog } from '@base-ui-components/react/dialog';
import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { z } from 'zod';

import { Select } from '@base-ui-components/react/select';
import { ChevronUpDownIcon } from '@heroicons/react/24/solid';
import {
    ValidatedForm,
    ValidatedInput,
    useValidatedForm
} from '@/components/forms';
import { FeatOptions } from '@/features/admin/features/feat-management/FeatUtil';
import { FeatBenefitSchema } from '@shared/schema';
import { FEAT_BENEFIT_TYPE_LIST, FEAT_BENEFIT_TYPE_BY_ID } from '@shared/static-data';

// Type definitions for the form state
type FeatBenefitFormData = z.infer<typeof FeatBenefitSchema>;

interface FeatBenefitEditProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (benefit: FeatBenefitFormData) => void;
    initialBenefitData: FeatBenefitFormData;
}

export function FeatBenefitEdit({ isOpen, onClose, onSave, initialBenefitData }: FeatBenefitEditProps) {
    const [benefit, setBenefit] = useState<FeatBenefitFormData | null>(null);
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
    const schema = FeatBenefitSchema;

    // Use the validated form hook
    const { validation, createFieldProps } = useValidatedForm(
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
        if (!validation.validateForm(formData)) {
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

    // Create field props for each form field
    const amountProps = {
        ...createFieldProps('amount'),
        value: formData.amount as string | number || ''
    };

    // Create listbox props for type
    const typeListboxProps = {
        value: formData.typeId,
        onChange: (value: string | number | null) => {
            setFormData(prev => ({ ...prev, typeId: value as number | null }));
            validation.validateField('typeId', value);
        },
        error: validation.getError('typeId'),
        hasError: validation.hasError('typeId')
    };

    // Create listbox props for reference
    const referenceListboxProps = {
        value: formData.referenceId,
        onChange: (value: string | number | null) => {
            setFormData(prev => ({ ...prev, referenceId: value as number | null }));
            validation.validateField('referenceId', value);
        },
        error: validation.getError('referenceId'),
        hasError: validation.hasError('referenceId')
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Backdrop className="fixed inset-0 bg-black bg-opacity-25 z-40" />
            <Dialog.Portal>
                <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-md transform overflow-visible rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-800">
                        <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                            Edit Feat Benefit
                        </Dialog.Title>
                        {message && <div className="mb-4 p-2 rounded text-green-700 bg-green-100 dark:bg-green-800 dark:text-green-200">{message}</div>}
                        {error && <div className="mb-4 p-2 rounded text-red-700 bg-red-100 dark:bg-red-800 dark:text-red-200">Error: {error}</div>}

                        <ValidatedForm
                            onSubmit={HandleSubmit}
                            validationState={validation.validationState}
                            isLoading={isLoading}
                        >
                            <div className="space-y-4">
                                <div className="flex flex-col">
                                    <label htmlFor="typeId" className="block font-medium">
                                        Benefit Type
                                    </label>
                                    <Select.Root
                                        value={formData.typeId}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, typeId: value as number | null }))}
                                        items={FEAT_BENEFIT_TYPE_LIST.map(type => ({ value: type.id, label: type.name }))}
                                    >
                                        <Select.Trigger className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600">
                                            <Select.Value>
                                                {(value) => value !== null ? FEAT_BENEFIT_TYPE_LIST.find(type => type.id === value)?.name : "Select a benefit type"}
                                            </Select.Value>
                                            <Select.Icon>
                                                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                            </Select.Icon>
                                        </Select.Trigger>
                                        <Select.Portal>
                                            <Select.Positioner>
                                                <Select.Popup className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-gray-800 dark:text-gray-100">
                                                    {FEAT_BENEFIT_TYPE_LIST.map(type => (
                                                        <Select.Item
                                                            key={type.id}
                                                            value={type.id}
                                                            className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 dark:text-gray-100 hover:bg-blue-600 hover:text-white data-[highlighted]:bg-blue-600 data-[highlighted]:text-white"
                                                        >
                                                            <Select.ItemText>
                                                                {type.name}
                                                            </Select.ItemText>
                                                        </Select.Item>
                                                    ))}
                                                </Select.Popup>
                                            </Select.Positioner>
                                        </Select.Portal>
                                    </Select.Root>
                                </div>

                                {formData.typeId && (
                                    <div className="flex flex-col">
                                        <label htmlFor="referenceId" className="block font-medium">
                                            {`${FEAT_BENEFIT_TYPE_BY_ID[formData.typeId]?.name} Reference`}
                                        </label>
                                        <Select.Root
                                            value={formData.referenceId}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, referenceId: value as number | null }))}
                                            items={FeatOptions.get(formData.typeId).map(option => ({ value: option.id, label: option.name }))}
                                        >
                                            <Select.Trigger className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600">
                                                <Select.Value>
                                                    {(value) => value !== null ? FeatOptions.get(formData.typeId).find(option => option.id === value)?.name : `Select a ${FEAT_BENEFIT_TYPE_BY_ID[formData.typeId]?.name}`}
                                                </Select.Value>
                                                <Select.Icon>
                                                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                </Select.Icon>
                                            </Select.Trigger>
                                            <Select.Portal>
                                                <Select.Positioner>
                                                    <Select.Popup className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-gray-800 dark:text-gray-100">
                                                        {FeatOptions.get(formData.typeId).map(option => (
                                                            <Select.Item
                                                                key={option.id}
                                                                value={option.id}
                                                                className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 dark:text-gray-100 hover:bg-blue-600 hover:text-white data-[highlighted]:bg-blue-600 data-[highlighted]:text-white"
                                                            >
                                                                <Select.ItemText>
                                                                    {option.name}
                                                                </Select.ItemText>
                                                            </Select.Item>
                                                        ))}
                                                    </Select.Popup>
                                                </Select.Positioner>
                                            </Select.Portal>
                                        </Select.Root>
                                    </div>
                                )}

                                <ValidatedInput
                                    name="amount"
                                    label="Benefit Amount"
                                    type="number"
                                    placeholder="e.g., 2, -1, 0"
                                    {...amountProps}
                                />
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
                                    disabled={isLoading || validation.validationState.hasErrors}
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
