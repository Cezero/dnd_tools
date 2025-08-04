import React, { useState } from 'react';
import { z } from 'zod';
import { CustomSelect } from '@/components/forms';
import { ClassFeatureModifierSchema } from '@shared/schema';
import { ModifierType } from '@shared/static-data';
import { ClassFeatureService } from './ClassFeatureService';

interface ClassFeatureModifiersSectionProps {
    featureId: number;
    modifiers: z.infer<typeof ClassFeatureModifierSchema>[];
    onModifiersChange: (modifiers: z.infer<typeof ClassFeatureModifierSchema>[]) => void;
    isInline?: boolean;
}

export function ClassFeatureModifiersSection({
    featureId,
    modifiers,
    onModifiersChange,
    isInline = false
}: ClassFeatureModifiersSectionProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const modifierTypeOptions = Object.entries(ModifierType).map(([key, value]) => ({
        value: value.toString(),
        label: key
    }));

    const handleAddModifier = async (modifier: Omit<z.infer<typeof ClassFeatureModifierSchema>, 'id' | 'featureId'>) => {
        try {
            await ClassFeatureService.createClassFeatureModifier(
                { ...modifier, featureId },
                { featureId }
            );

            // Add the new modifier to the list with a temporary ID for frontend
            const tempModifier: z.infer<typeof ClassFeatureModifierSchema> = {
                id: Date.now(), // Temporary ID for frontend
                featureId,
                ...modifier
            };
            onModifiersChange([...modifiers, tempModifier]);
            setIsAdding(false);
        } catch (error) {
            console.error('Failed to create modifier:', error);
        }
    };

    const handleUpdateModifier = async (index: number, modifier: z.infer<typeof ClassFeatureModifierSchema>) => {
        try {
            await ClassFeatureService.updateClassFeatureModifier(
                { ...modifier, featureId },
                { id: modifier.id }
            );

            const updatedModifiers = [...modifiers];
            updatedModifiers[index] = modifier;
            onModifiersChange(updatedModifiers);
            setEditingIndex(null);
        } catch (error) {
            console.error('Failed to update modifier:', error);
        }
    };

    const handleDeleteModifier = async (index: number) => {
        const modifier = modifiers[index];
        try {
            await ClassFeatureService.deleteClassFeatureModifier(undefined, { id: modifier.id });
            const updatedModifiers = modifiers.filter((_, i) => i !== index);
            onModifiersChange(updatedModifiers);
        } catch (error) {
            console.error('Failed to delete modifier:', error);
        }
    };

    const containerClass = isInline ? "space-y-4" : "border rounded-lg p-4";

    return (
        <div className={containerClass}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Modifiers</h3>
                <button
                    type="button"
                    onClick={() => setIsAdding(true)}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                    Add Modifier
                </button>
            </div>

            {/* Existing Modifiers */}
            {modifiers.map((modifier, index) => (
                <div key={modifier.id} className="border rounded p-3 mb-2">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <p><strong>Type:</strong> {Object.keys(ModifierType)[modifier.modifierType]}</p>
                            <p><strong>Value:</strong> {modifier.value}</p>
                            {modifier.appliesTo && <p><strong>Applies To:</strong> {modifier.appliesTo}</p>}
                            {modifier.appliesIfChoiceKey && (
                                <p><strong>Condition:</strong> {modifier.appliesIfChoiceKey} = {modifier.appliesIfChoiceValue}</p>
                            )}
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
                                onClick={() => handleDeleteModifier(index)}
                                className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            {/* Add/Edit Modifier Dialog */}
            {(isAdding || editingIndex !== null) && (
                <ModifierForm
                    modifier={editingIndex !== null ? modifiers[editingIndex] : undefined}
                    onSave={(modifier) => {
                        if (editingIndex !== null) {
                            handleUpdateModifier(editingIndex, modifier);
                        } else {
                            handleAddModifier(modifier);
                        }
                    }}
                    onCancel={() => {
                        setIsAdding(false);
                        setEditingIndex(null);
                    }}
                    modifierTypeOptions={modifierTypeOptions}
                />
            )}
        </div>
    );
}

// ModifierForm Component
interface ModifierFormProps {
    modifier?: z.infer<typeof ClassFeatureModifierSchema>;
    onSave: (modifier: Omit<z.infer<typeof ClassFeatureModifierSchema>, 'id' | 'featureId'>) => void;
    onCancel: () => void;
    modifierTypeOptions: Array<{ value: string; label: string }>;
}

function ModifierForm({ modifier, onSave, onCancel, modifierTypeOptions }: ModifierFormProps) {
    const initialData = {
        modifierType: modifier?.modifierType || 0,
        value: modifier?.value || '',
        appliesTo: modifier?.appliesTo || '',
        appliesIfChoiceKey: modifier?.appliesIfChoiceKey || '',
        appliesIfChoiceValue: modifier?.appliesIfChoiceValue || '',
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
                    {modifier ? 'Edit Modifier' : 'Add Modifier'}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <CustomSelect
                            label="Modifier Type"
                            required
                            value={formData.modifierType.toString()}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, modifierType: parseInt(value) as z.infer<typeof ClassFeatureModifierSchema>['modifierType'] }))}
                            options={modifierTypeOptions}
                            placeholder="Select modifier type"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Value</label>
                        <input
                            type="text"
                            value={formData.value}
                            onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                            required
                            placeholder="e.g., +2, 1d6, 30ft"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Applies To (Optional)</label>
                        <input
                            type="text"
                            value={formData.appliesTo}
                            onChange={(e) => setFormData(prev => ({ ...prev, appliesTo: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                            placeholder="e.g., attack rolls, damage rolls"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Condition Key (Optional)</label>
                        <input
                            type="text"
                            value={formData.appliesIfChoiceKey}
                            onChange={(e) => setFormData(prev => ({ ...prev, appliesIfChoiceKey: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                            placeholder="e.g., weapon-type"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Condition Value (Optional)</label>
                        <input
                            type="text"
                            value={formData.appliesIfChoiceValue}
                            onChange={(e) => setFormData(prev => ({ ...prev, appliesIfChoiceValue: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                            placeholder="e.g., longsword"
                        />
                    </div>

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
                            {modifier ? 'Update' : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 
