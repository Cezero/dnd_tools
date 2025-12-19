import { Dialog } from '@base-ui-components/react/dialog';
import React, { useState, useEffect } from 'react';

import {
    ValidatedForm,
    ValidatedInput,
    useValidatedForm
} from '@/components/forms';
import { CustomSelect } from '@/components/forms/FormComponents';
import { FeatQueryHooks } from '@/services/query/FeatQueryHooks';
import { FeatureQueryHooks } from '@/services/query/FeatureQueryHooks';
import { FeatPrerequisiteMap, FeatPrerequisiteMapSchema } from '@shared/schema';
import { ABILITY_LIST, FEAT_PREREQUISITE_TYPE_LIST, FeatPrerequisiteType, CoreComponent, SKILL_LIST, FeatureSourceType, SIZE_LIST } from '@shared/static-data';

import { PrereqOptions } from './FeatUtil';


// Type definitions for the form state
type FeatPrerequisiteFormData = FeatPrerequisiteMap;

interface FeatPrereqEditProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (prereq: FeatPrerequisiteFormData) => void;
    initialPrereqData: FeatPrerequisiteFormData;
}

export function FeatPrereqEdit({ isOpen, onClose, onSave, initialPrereqData }: FeatPrereqEditProps) {
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [classFeatureOptions, setClassFeatureOptions] = useState<CoreComponent[]>([]);
    const [classLevelOptions, setClassLevelOptions] = useState<CoreComponent[]>([]);

    // Use the query hook to get feats
    const { data: featsResponse } = FeatQueryHooks.useGetFeats({});
    const featOptions = featsResponse?.results || [];

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

    // Use query hook for features - get class features specifically
    const { data: featuresData, isLoading: _isLoadingFeatures, error: _featuresError } = FeatureQueryHooks.useGetFeatures({
        sourceTypes: [FeatureSourceType.Class] // Get class features
    });

    useEffect(() => {
        if (featuresData?.results) {
            setClassFeatureOptions(featuresData.results);
        }
    }, [featuresData]);

    useEffect(() => {
        const fetchClassLevelOptions = async () => {
            const options = await PrereqOptions(FeatPrerequisiteType.CLASSLEVEL);
            setClassLevelOptions(options);
        };

        fetchClassLevelOptions();
    }, []);

    useEffect(() => {
        if (initialPrereqData) {
            setFormData(prev => {
                // Only update if values actually changed to prevent infinite loops
                const newData = {
                    ...initialPrereqData,
                    index: initialPrereqData.index || 0,
                    typeId: initialPrereqData.typeId || null,
                    referenceId: initialPrereqData.referenceId || null,
                    amount: initialPrereqData.amount || null,
                };
                
                // Check if values actually changed
                if (
                    prev.index === newData.index &&
                    prev.typeId === newData.typeId &&
                    prev.referenceId === newData.referenceId &&
                    prev.amount === newData.amount
                ) {
                    return prev; // No change, return previous state
                }
                
                return newData;
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialPrereqData?.index, initialPrereqData?.typeId, initialPrereqData?.referenceId, initialPrereqData?.amount]);

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
                                        options={FEAT_PREREQUISITE_TYPE_LIST}
                                    />
                                </div>
                                {formData.typeId === FeatPrerequisiteType.FEAT && (
                                    <CustomSelect
                                        label="Reference"
                                        required
                                        value={formData.referenceId}
                                        componentExtraClassName='flex items-center gap-2'
                                        labelExtraClassName='w-32'
                                        itemTextExtraClassName='w-58'
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
                                            options={ABILITY_LIST}
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
                                            options={SKILL_LIST}
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
                                ) || formData.typeId === FeatPrerequisiteType.CLASSLEVEL && (
                                    <>
                                        <CustomSelect
                                            label="Reference"
                                            required
                                            value={formData.referenceId}
                                            componentExtraClassName='flex items-center gap-2'
                                            labelExtraClassName='w-32'
                                            itemTextExtraClassName='w-34'
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, referenceId: value as number | null }))}
                                            options={classLevelOptions}
                                        />
                                        <ValidatedInput
                                            field="amount"
                                            label="Level"
                                            type="number"
                                            min={1}
                                            step={1}
                                            placeholder="Minimum required level"
                                            componentExtraClassName='flex items-center gap-2'
                                            labelExtraClassName='w-32'
                                            inputExtraClassName='w-20'
                                        />
                                    </>
                                ) || formData.typeId === FeatPrerequisiteType.CLASSFEATURE && (
                                    <CustomSelect
                                        label="Reference"
                                        required
                                        value={formData.referenceId}
                                        componentExtraClassName='flex items-center gap-2'
                                        labelExtraClassName='w-32'
                                        itemTextExtraClassName='w-70'
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, referenceId: value as number | null }))}
                                        options={classFeatureOptions}
                                    />
                                ) || formData.typeId === FeatPrerequisiteType.SIZE && (
                                    <>
                                        <CustomSelect
                                            label="Size"
                                            required
                                            value={formData.referenceId}
                                            componentExtraClassName='flex items-center gap-2'
                                            labelExtraClassName='w-32'
                                            itemTextExtraClassName='w-34'
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, referenceId: value as number | null }))}
                                            options={SIZE_LIST}
                                        />
                                        <CustomSelect
                                            label="Comparison"
                                            required
                                            value={formData.amount}
                                            componentExtraClassName='flex items-center gap-2'
                                            labelExtraClassName='w-32'
                                            itemTextExtraClassName='w-34'
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, amount: value as number | null }))}
                                            options={[
                                                { id: 0, name: 'Exactly this size' },
                                                { id: 1, name: 'This size or larger' },
                                                { id: 2, name: 'This size or smaller' }
                                            ]}
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
