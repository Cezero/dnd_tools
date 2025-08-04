import React, { useState } from 'react';
import { z } from 'zod';
import { CustomSelect } from '@/components/forms';
import { ClassFeatureChoiceSchema } from '@shared/schema';
import { ClassFeatureService } from './ClassFeatureService';

interface ClassFeatureChoicesSectionProps {
    featureId: number;
    choices: z.infer<typeof ClassFeatureChoiceSchema>[];
    onChoicesChange: (choices: z.infer<typeof ClassFeatureChoiceSchema>[]) => void;
    isInline?: boolean;
}

export function ClassFeatureChoicesSection({
    featureId,
    choices,
    onChoicesChange,
    isInline = false
}: ClassFeatureChoicesSectionProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const choiceTypeOptions = [
        { value: 'Feat', label: 'Feat' },
        { value: 'ClassFeature', label: 'Class Feature' }
    ];

    const handleAddChoice = async (choice: Omit<z.infer<typeof ClassFeatureChoiceSchema>, 'id' | 'progressionId'>) => {
        try {
            // Note: This would need a progressionId, which should be passed from parent
            // For now, we'll use a placeholder approach
            const tempChoice: z.infer<typeof ClassFeatureChoiceSchema> = {
                id: Date.now(), // Temporary ID for frontend
                progressionId: 0, // This should be set by parent component
                ...choice
            };
            onChoicesChange([...choices, tempChoice]);
            setIsAdding(false);
        } catch (error) {
            console.error('Failed to create choice:', error);
        }
    };

    const handleUpdateChoice = async (index: number, choice: z.infer<typeof ClassFeatureChoiceSchema>) => {
        try {
            const updatedChoices = [...choices];
            updatedChoices[index] = choice;
            onChoicesChange(updatedChoices);
            setEditingIndex(null);
        } catch (error) {
            console.error('Failed to update choice:', error);
        }
    };

    const handleDeleteChoice = async (index: number) => {
        const choice = choices[index];
        try {
            const updatedChoices = choices.filter((_, i) => i !== index);
            onChoicesChange(updatedChoices);
        } catch (error) {
            console.error('Failed to delete choice:', error);
        }
    };

    const containerClass = isInline ? "space-y-4" : "border rounded-lg p-4";

    return (
        <div className={containerClass}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Feature Choices</h3>
                <button
                    type="button"
                    onClick={() => setIsAdding(true)}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                    Add Choice
                </button>
            </div>

            {/* Existing Choices */}
            {choices.map((choice, index) => (
                <div key={choice.id} className="border rounded p-3 mb-2">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <p><strong>Type:</strong> {choice.choiceType}</p>
                            {choice.label && <p><strong>Label:</strong> {choice.label}</p>}
                            {choice.pickCount && <p><strong>Pick Count:</strong> {choice.pickCount}</p>}
                            {choice.featId && <p><strong>Feat ID:</strong> {choice.featId}</p>}
                            {choice.chosenFeatureId && <p><strong>Chosen Feature ID:</strong> {choice.chosenFeatureId}</p>}
                        </div>
                        <div className="flex space-x-2">
                            <button
                                type="button"
                                onClick={() => setEditingIndex(index)}
                                className="px-2 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                            >
                                Edit
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeleteChoice(index)}
                                className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            {/* Add/Edit Choice Dialog */}
            {(isAdding || editingIndex !== null) && (
                <ChoiceForm
                    choice={editingIndex !== null ? choices[editingIndex] : undefined}
                    onSave={(choice) => {
                        if (editingIndex !== null) {
                            handleUpdateChoice(editingIndex, choice);
                        } else {
                            handleAddChoice(choice);
                        }
                    }}
                    onCancel={() => {
                        setIsAdding(false);
                        setEditingIndex(null);
                    }}
                    choiceTypeOptions={choiceTypeOptions}
                />
            )}
        </div>
    );
}

// ChoiceForm Component
interface ChoiceFormProps {
    choice?: z.infer<typeof ClassFeatureChoiceSchema>;
    onSave: (choice: Omit<z.infer<typeof ClassFeatureChoiceSchema>, 'id' | 'progressionId'>) => void;
    onCancel: () => void;
    choiceTypeOptions: Array<{ value: string; label: string }>;
}

function ChoiceForm({ choice, onSave, onCancel, choiceTypeOptions }: ChoiceFormProps) {
    const initialData = {
        label: choice?.label || '',
        pickCount: choice?.pickCount || null,
        choiceType: choice?.choiceType || 'Feat',
        featId: choice?.featId || null,
        chosenFeatureId: choice?.chosenFeatureId || null,
    };

    const [formData, setFormData] = useState(initialData);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-25 z-40 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">
                    {choice ? 'Edit Feature Choice' : 'Add Feature Choice'}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <CustomSelect
                            label="Choice Type"
                            required
                            value={formData.choiceType}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, choiceType: value as 'Feat' | 'ClassFeature' }))}
                            options={choiceTypeOptions}
                            placeholder="Select choice type"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Label (Optional)</label>
                        <input
                            type="text"
                            value={formData.label || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                            placeholder="e.g., Choose a feat, Select a weapon"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Pick Count (Optional)</label>
                        <input
                            type="number"
                            min="1"
                            value={formData.pickCount || ''}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                pickCount: e.target.value ? parseInt(e.target.value) : null
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                            placeholder="e.g., 1, 2, 3"
                        />
                    </div>

                    {formData.choiceType === 'Feat' && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Feat ID (Optional)</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.featId || ''}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    featId: e.target.value ? parseInt(e.target.value) : null
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                                placeholder="e.g., 1, 2, 3"
                            />
                        </div>
                    )}

                    {formData.choiceType === 'ClassFeature' && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Chosen Feature ID (Optional)</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.chosenFeatureId || ''}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    chosenFeatureId: e.target.value ? parseInt(e.target.value) : null
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                                placeholder="e.g., 1, 2, 3"
                            />
                        </div>
                    )}

                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                            {choice ? 'Update' : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 
