import { Dialog } from '@base-ui-components/react/dialog';
import React, { useState, useEffect } from 'react';

import {
    ValidatedForm,
    ValidatedInput,
    useValidatedForm
} from '@/components/forms';
import { CustomSelect } from '@/components/forms/FormComponents';
import { CompanionBenefitOptions } from '@/features/companion/CompanionUtil';
import { CreateCompanionBenefitMapSchema, type CreateCompanionBenefitMapRequest } from '@shared/schema';
import {
    COMPANION_BENEFIT_TYPE_BY_ID,
    COMPANION_BENEFIT_TYPE_LIST,
    CompanionBenefitType,
    COMPANION_BENEFIT_TYPES,
} from '@shared/static-data';
import { CompanionBenefitConditionEditor } from './CompanionBenefitConditionEditor';

type CompanionBenefitFormData = CreateCompanionBenefitMapRequest;

interface CompanionBenefitEditProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (benefit: CompanionBenefitFormData) => void;
    initialBenefitData: CompanionBenefitFormData;
    companionId: number;
}

export function CompanionBenefitEdit({ isOpen, onClose, onSave, initialBenefitData, companionId: _companionId }: CompanionBenefitEditProps) {
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Initialize form data with default values
    const initialFormData: CompanionBenefitFormData = {
        ...initialBenefitData,
        index: initialBenefitData.index || 0,
        typeId: initialBenefitData.typeId || null,
        referenceId: initialBenefitData.referenceId || null,
        amount: initialBenefitData.amount || null,
        conditions: initialBenefitData.conditions || [],
    };

    const [formData, setFormData] = useState<CompanionBenefitFormData>(initialFormData);

    // Use the validated form hook
    const form = useValidatedForm(
        CreateCompanionBenefitMapSchema,
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
            setFormData(prev => {
                // Only update if values actually changed to prevent infinite loops
                // Clean conditions - remove id and companionBenefitMapId fields
                const cleanedConditions = (initialBenefitData.conditions || []).map(condition => ({
                    conditionType: condition.conditionType,
                    conditionValue: condition.conditionValue,
                }));
                const newData = {
                    ...initialBenefitData,
                    index: initialBenefitData.index || 0,
                    typeId: initialBenefitData.typeId || null,
                    referenceId: initialBenefitData.referenceId || null,
                    amount: initialBenefitData.amount || null,
                    conditions: cleanedConditions,
                };

                // Check if values actually changed
                if (
                    prev.index === newData.index &&
                    prev.typeId === newData.typeId &&
                    prev.referenceId === newData.referenceId &&
                    prev.amount === newData.amount &&
                    JSON.stringify(prev.conditions) === JSON.stringify(newData.conditions)
                ) {
                    return prev; // No change, return previous state
                }

                return newData;
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialBenefitData?.index, initialBenefitData?.typeId, initialBenefitData?.referenceId, initialBenefitData?.amount]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        // Validate the entire form
        if (!form.validation.validateForm(formData)) {
            return;
        }

        try {
            setIsLoading(true);
            // Clean up condition data - remove id and companionBenefitMapId before saving
            // Filter out any conditions that don't have a conditionType set (incomplete conditions)
            // The formData might have nested structure from the editor, so we need to check both locations
            const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
                const parts = path.split('.');
                let current: unknown = obj;
                for (const part of parts) {
                    if (current && typeof current === 'object') {
                        if (Array.isArray(current) && /^\d+$/.test(part)) {
                            current = current[parseInt(part, 10)];
                        } else if (part in (current as Record<string, unknown>)) {
                            current = (current as Record<string, unknown>)[part];
                        } else {
                            return undefined;
                        }
                    } else {
                        return undefined;
                    }
                }
                return current;
            };

            // Read condition values directly from formData using the correct nested path
            const cleanedConditions: Array<{ conditionType: number; conditionValue: number }> = [];
            const conditionsCount = formData.conditions?.length || 0;
            
            for (let i = 0; i < conditionsCount; i++) {
                // Read from nested path (as used by the editor with fieldPrefix="conditions")
                let conditionType = getNestedValue(formData, `conditions.${i}.conditionType`);
                let conditionValue = getNestedValue(formData, `conditions.${i}.conditionValue`);
                
                // Fallback to direct array access if nested path doesn't exist
                if (conditionType === undefined && formData.conditions?.[i]) {
                    conditionType = formData.conditions[i].conditionType;
                    conditionValue = formData.conditions[i].conditionValue;
                }
                
                // Only include conditions with a valid conditionType
                if (conditionType !== null && conditionType !== undefined && typeof conditionType === 'number') {
                    cleanedConditions.push({
                        conditionType: conditionType,
                        conditionValue: typeof conditionValue === 'number' ? conditionValue : 0,
                    });
                }
            }

            const cleanedFormData = {
                ...formData,
                conditions: cleanedConditions,
            };
            onSave(cleanedFormData);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save benefit');
        } finally {
            setIsLoading(false);
        }
    };

    const addCondition = () => {
        const newCondition = {
            conditionType: null as number | null,
            conditionValue: 0,
        };
        setFormData(prev => ({
            ...prev,
            conditions: [...(prev.conditions || []), newCondition]
        }));
    };

    const removeCondition = (conditionIndex: number) => {
        setFormData(prev => ({
            ...prev,
            conditions: (prev.conditions || []).filter((_, ci) => ci !== conditionIndex)
        }));
    };

    if (!isOpen) return null;

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Backdrop className="fixed inset-0 bg-black bg-opacity-25 z-40" />
            <Dialog.Portal>
                <Dialog.Popup className="fixed inset-0 flex items-center justify-center p-2">
                    <div className="w-full max-w-md transform overflow-visible rounded-2xl bg-white p-2 text-left align-middle shadow-xl transition-all dark:bg-gray-800">
                        <Dialog.Title className="text-lg border rounded-2xl p-2 dark:border-gray-700 font-medium mb-4 dark:bg-gray-900">
                            Edit Companion Benefit
                        </Dialog.Title>
                        {message && <div className="mb-4 p-2 rounded text-green-700 bg-green-100 dark:bg-green-800 dark:text-green-200">{message}</div>}
                        {error && <div className="mb-4 p-2 rounded text-red-700 bg-red-100 dark:bg-red-800 dark:text-red-200">Error: {error}</div>}

                        <ValidatedForm
                            onSubmit={handleSubmit}
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
                                        itemTextExtraClassName='w-32'
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, typeId: value as number | null }))}
                                        options={COMPANION_BENEFIT_TYPE_LIST}
                                    />
                                </div>

                                {formData.typeId && COMPANION_BENEFIT_TYPES[formData.typeId]?.hasSubId && (
                                    <div className="flex flex-col">
                                        <CustomSelect
                                            label={`${COMPANION_BENEFIT_TYPE_BY_ID[formData.typeId]} Reference`}
                                            required
                                            value={formData.referenceId}
                                            componentExtraClassName='flex items-center gap-2'
                                            labelExtraClassName='w-32'
                                            itemTextExtraClassName='w-40'
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, referenceId: value as number | null }))}
                                            options={CompanionBenefitOptions(formData.typeId)}
                                        />
                                    </div>
                                )}
                                {formData.typeId && formData.typeId !== CompanionBenefitType.HitPoints && (
                                    <ValidatedInput
                                        field="amount"
                                        label="Benefit Amount"
                                        type="number"
                                        componentExtraClassName='flex items-center gap-2'
                                        inputExtraClassName='w-20'
                                        labelExtraClassName='w-32'
                                        placeholder="e.g., 2, -1, 0" />
                                )}
                                {formData.typeId === CompanionBenefitType.HitPoints && (
                                    <ValidatedInput
                                        field="amount"
                                        label="Hit Points"
                                        type="number"
                                        componentExtraClassName='flex items-center gap-2'
                                        inputExtraClassName='w-20'
                                        labelExtraClassName='w-32'
                                        placeholder="e.g., 5" />
                                )}

                                {/* Conditions Section */}
                                <div className="mt-2">
                                    <CompanionBenefitConditionEditor
                                        index={0}
                                        conditions={formData.conditions || []}
                                        onAddCondition={addCondition}
                                        onRemoveCondition={removeCondition}
                                        fieldPrefix="conditions"
                                    />
                                </div>
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

