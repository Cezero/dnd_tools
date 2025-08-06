import React, { useState, useEffect } from 'react';
import { Dialog } from '@base-ui-components/react/dialog';
import { ScrollArea } from '@base-ui-components/react/scroll-area';
import { ValidatedCustomSelect, ValidatedInput, ValidatedForm, useValidatedForm, useFormContext } from '@/components/forms';
import { FeatureProgressionWithRelationsSchema, FeatureProgressionWithRelations } from '@shared/schema';
import { FEATURE_MODIFIER_SELECT_LIST, FeatureSpecialEffectType } from '@shared/static-data';

interface FeatureProgressionDetailEditProps {
    isOpen: boolean;
    onClose: () => void;
    progression: FeatureProgressionWithRelations | null;
    onSave: (progression: FeatureProgressionWithRelations) => void;
    preSelectedFeature?: { id: number; name: string; description: string; slug: string };
}

export function FeatureProgressionDetailEdit({
    isOpen,
    onClose,
    progression,
    onSave,
    preSelectedFeature
}: FeatureProgressionDetailEditProps) {
    const [formData, setFormData] = useState<Record<string, unknown>>({
        id: progression?.id || 0,
        sourceType: progression?.sourceType || 1, // 1 for Class
        classId: progression?.classId || 0,
        raceId: progression?.raceId || null,
        level: progression?.level || 1,
        featureId: progression?.featureId || 0,
        appliesToType: progression?.appliesToType || null,
        appliesTo: progression?.appliesTo || null,

        // Determine the type based on existing data
        progressionType: progression?.modifiers?.length ? 'modifier' :
            progression?.effects?.length ? 'effect' :
                progression?.choices?.length ? 'choice' : 'modifier',

        modifiers: progression?.modifiers || [],
        choices: progression?.choices || [],
        effects: progression?.effects || [],
    });

    // Set up validation
    const form = useValidatedForm(FeatureProgressionWithRelationsSchema, formData, setFormData, {
        validateOnChange: false,
        validateOnBlur: false
    });

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate the form
        if (!form.validation.validateForm(formData)) {
            return;
        }

        // Create the updated progression with all details
        const updatedProgression: FeatureProgressionWithRelations = {
            ...formData as FeatureProgressionWithRelations,
            modifiers: formData.modifiers as any[] || [],
            effects: formData.effects as any[] || [],
            choices: formData.choices as any[] || [],
        };

        onSave(updatedProgression);
        onClose();
    };

    // Helper functions to manage multiple details
    const addModifier = () => {
        const newModifier = {
            modifierType: 0,
            value: 0,
            appliesIfChoiceKey: null,
            appliesIfChoiceValue: null,
        };
        setFormData(prev => ({
            ...prev,
            modifiers: [...(prev.modifiers as any[] || []), newModifier]
        }));
    };

    const removeModifier = (index: number) => {
        setFormData(prev => ({
            ...prev,
            modifiers: (prev.modifiers as any[] || []).filter((_, i) => i !== index)
        }));
    };

    const addEffect = () => {
        const newEffect = {
            effectType: 0,
            key: null,
            value: null,
            numericValue: null,
        };
        setFormData(prev => ({
            ...prev,
            effects: [...(prev.effects as any[] || []), newEffect]
        }));
    };

    const removeEffect = (index: number) => {
        setFormData(prev => ({
            ...prev,
            effects: (prev.effects as any[] || []).filter((_, i) => i !== index)
        }));
    };

    const addChoice = () => {
        const newChoice = {
            label: '',
            pickCount: 1,
            choiceType: 'Feat' as const,
            choiceBehavior: 'Single' as const,
            featId: null,
            chosenFeatureId: null,
        };
        setFormData(prev => ({
            ...prev,
            choices: [...(prev.choices as any[] || []), newChoice]
        }));
    };

    const removeChoice = (index: number) => {
        setFormData(prev => ({
            ...prev,
            choices: (prev.choices as any[] || []).filter((_, i) => i !== index)
        }));
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Backdrop className="fixed inset-0 bg-black bg-opacity-25 z-40" />
            <Dialog.Portal>
                <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-2">
                    <div className="w-full max-w-2xl max-h-[90vh] transform rounded-2xl bg-white dark:bg-gray-800 flex flex-col shadow-xl transition-all">
                        {/* Fixed Header */}
                        <div className="p-6 border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
                            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {progression ? 'Edit' : 'Add'} {preSelectedFeature?.name || progression?.feature?.name || 'Feature'} Progression
                            </Dialog.Title>
                        </div>

                        {/* Scrollable Content */}
                        <div className="overflow-visible">
                            <ScrollArea.Root>
                                <ScrollArea.Viewport>
                                    <ScrollArea.Content className="max-h-[calc(80vh-10rem)]">
                                        <ValidatedForm
                                            onSubmit={handleSubmit}
                                            formData={formData}
                                            setFormData={setFormData}
                                            validation={form.validation}
                                            className="space-y-6 p-6"
                                        >
                                            <div className="space-y-4">
                                                <ValidatedInput
                                                    field="level"
                                                    label="Level"
                                                    type="number"
                                                    min={1}
                                                    max={20}
                                                    required
                                                    componentExtraClassName="flex items-center gap-2"
                                                />

                                                <ValidatedCustomSelect
                                                    field="progressionType"
                                                    label="Progression Type"
                                                    required
                                                    options={[
                                                        { value: 'modifier', label: 'Modifier' },
                                                        { value: 'effect', label: 'Special Effect' },
                                                        { value: 'choice', label: 'Choice' }
                                                    ]}
                                                    placeholder="Select progression type"
                                                    componentExtraClassName="flex items-center gap-2"
                                                />
                                            </div>

                                            {/* Conditional rendering based on progression type */}
                                            {(formData.progressionType as string) === 'modifier' && (
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <h3 className="text-lg font-medium">Modifiers</h3>
                                                        <button
                                                            type="button"
                                                            onClick={addModifier}
                                                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                                                        >
                                                            Add Modifier
                                                        </button>
                                                    </div>

                                                    {(formData.modifiers as any[] || []).length === 0 ? (
                                                        <p className="text-gray-500 text-sm">No modifiers added</p>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {(formData.modifiers as any[] || []).map((modifier, index) => (
                                                                <div key={index} className="border border-gray-200 rounded-md p-3 dark:border-gray-600">
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <span className="text-sm font-medium">Modifier {index + 1}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeModifier(index)}
                                                                            className="text-red-500 hover:text-red-700 text-sm"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                    <ModifierDetailForm
                                                                        index={index}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {(formData.progressionType as string) === 'effect' && (
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <h3 className="text-lg font-medium">Special Effects</h3>
                                                        <button
                                                            type="button"
                                                            onClick={addEffect}
                                                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                                                        >
                                                            Add Effect
                                                        </button>
                                                    </div>

                                                    {(formData.effects as any[] || []).length === 0 ? (
                                                        <p className="text-gray-500 text-sm">No effects added</p>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {(formData.effects as any[] || []).map((effect, index) => (
                                                                <div key={index} className="border border-gray-200 rounded-md p-3 dark:border-gray-600">
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <span className="text-sm font-medium">Effect {index + 1}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeEffect(index)}
                                                                            className="text-red-500 hover:text-red-700 text-sm"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                    <EffectDetailForm
                                                                        index={index}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {(formData.progressionType as string) === 'choice' && (
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <h3 className="text-lg font-medium">Choices</h3>
                                                        <button
                                                            type="button"
                                                            onClick={addChoice}
                                                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                                                        >
                                                            Add Choice
                                                        </button>
                                                    </div>

                                                    {(formData.choices as any[] || []).length === 0 ? (
                                                        <p className="text-gray-500 text-sm">No choices added</p>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {(formData.choices as any[] || []).map((choice, index) => (
                                                                <div key={index} className="border border-gray-200 rounded-md p-3 dark:border-gray-600">
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <span className="text-sm font-medium">Choice {index + 1}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeChoice(index)}
                                                                            className="text-red-500 hover:text-red-700 text-sm"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                    <ChoiceDetailForm
                                                                        index={index}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </ValidatedForm>
                                    </ScrollArea.Content>
                                </ScrollArea.Viewport>
                                <ScrollArea.Scrollbar orientation="vertical" className="Scrollbar">
                                    <ScrollArea.Thumb className="Thumb" />
                                </ScrollArea.Scrollbar>
                            </ScrollArea.Root>
                        </div>

                        {/* Fixed Footer with Cancel and Add/Update Buttons */}
                        <div className="p-6 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex-shrink-0">
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        // Trigger form submission
                                        const formElement = document.querySelector('form') as HTMLFormElement;
                                        if (formElement) {
                                            formElement.requestSubmit();
                                        }
                                    }}
                                    className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={form.validation.validationState.hasErrors}
                                >
                                    {progression ? 'Update' : 'Add'} Progression
                                </button>
                            </div>
                        </div>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

// Modifier Detail Form Component
interface ModifierDetailFormProps {
    index: number;
}

function ModifierDetailForm({ index }: ModifierDetailFormProps) {
    const { formData, setFormData } = useFormContext();
    const modifiers = formData.modifiers as any[] || [];
    const modifier = modifiers[index] || {};
    const [showConditional, setShowConditional] = useState(false);

    return (
        <div className="space-y-4">
            <div>
                <ValidatedCustomSelect
                    field={`modifiers.${index}.modifierType`}
                    label="Type"
                    required
                    options={FEATURE_MODIFIER_SELECT_LIST}
                    placeholder="Select modifier type"
                    componentExtraClassName="flex items-center gap-2"
                    nested
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <ValidatedInput
                        field={`modifiers.${index}.value`}
                        label="Value"
                        type="number"
                        required
                        componentExtraClassName="flex items-center gap-2"
                        nested
                    />
                </div>
                <div>
                    <ValidatedInput
                        field={`modifiers.${index}.appliesTo`}
                        label="Applies To"
                        type="text"
                        componentExtraClassName="flex items-center gap-2"
                        nested
                    />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id={`conditional-${index}`}
                    checked={showConditional}
                    onChange={(e) => setShowConditional(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={`conditional-${index}`} className="text-sm font-medium">
                    Conditional (Applies If Choice)
                </label>
            </div>

            {showConditional && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <ValidatedInput
                            field={`modifiers.${index}.appliesIfChoiceKey`}
                            label="Key"
                            type="text"
                            componentExtraClassName="flex items-center gap-2"
                            nested
                        />
                    </div>
                    <div>
                        <ValidatedInput
                            field={`modifiers.${index}.appliesIfChoiceValue`}
                            label="Value"
                            type="text"
                            componentExtraClassName="flex items-center gap-2"
                            nested
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// Effect Detail Form Component
interface EffectDetailFormProps {
    index: number;
}

function EffectDetailForm({ index }: EffectDetailFormProps) {
    const { formData, setFormData } = useFormContext();
    const effects = formData.effects as any[] || [];
    const effect = effects[index] || {};

    const effectTypeOptions = Object.entries(FeatureSpecialEffectType).map(([key, value]) => ({
        value: value.toString(),
        label: key
    }));

    return (
        <div className="space-y-4">
            <div>
                <ValidatedCustomSelect
                    field={`effects.${index}.effectType`}
                    label="Effect Type"
                    required
                    options={effectTypeOptions}
                    placeholder="Select effect type"
                    nested
                />
            </div>

            <div>
                <ValidatedInput
                    field={`effects.${index}.key`}
                    label="Key"
                    type="text"
                    required
                    componentExtraClassName="flex items-center gap-2"
                    nested
                />
            </div>

            <div>
                <ValidatedInput
                    field={`effects.${index}.value`}
                    label="Value"
                    type="text"
                    componentExtraClassName="flex items-center gap-2"
                    nested
                />
            </div>

            <div>
                <ValidatedInput
                    field={`effects.${index}.numericValue`}
                    label="Numeric Value (Optional)"
                    type="number"
                    componentExtraClassName="flex items-center gap-2"
                    nested
                />
            </div>
        </div>
    );
}

// Choice Detail Form Component
interface ChoiceDetailFormProps {
    index: number;
}

function ChoiceDetailForm({ index }: ChoiceDetailFormProps) {
    const { formData, setFormData } = useFormContext();
    const choices = formData.choices as any[] || [];
    const choice = choices[index] || {};

    const choiceTypeOptions = [
        { value: 'Feat', label: 'Feat' },
        { value: 'ClassFeature', label: 'Class Feature' }
    ];

    return (
        <div className="space-y-4">
            <div>
                <ValidatedCustomSelect
                    field={`choices.${index}.choiceType`}
                    label="Choice Type"
                    required
                    options={choiceTypeOptions}
                    placeholder="Select choice type"
                    nested
                />
            </div>

            <div>
                <ValidatedInput
                    field={`choices.${index}.label`}
                    label="Label"
                    type="text"
                    required
                    componentExtraClassName="flex items-center gap-2"
                    nested
                />
            </div>

            <div>
                <ValidatedInput
                    field={`choices.${index}.pickCount`}
                    label="Pick Count"
                    type="number"
                    min={1}
                    required
                    componentExtraClassName="flex items-center gap-2"
                    nested
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <ValidatedInput
                        field={`choices.${index}.featId`}
                        label="Feat ID (Optional)"
                        type="number"
                        componentExtraClassName="flex items-center gap-2"
                        nested
                    />
                </div>
                <div>
                    <ValidatedInput
                        field={`choices.${index}.chosenFeatureId`}
                        label="Chosen Feature ID (Optional)"
                        type="number"
                        componentExtraClassName="flex items-center gap-2"
                        nested
                    />
                </div>
            </div>
        </div>
    );
}
