import React, { useState } from 'react';
import { z } from 'zod';
import { CustomSelect } from '@/components/forms';
import { ClassFeatureSpecialEffectSchema } from '@shared/schema';
import { SpecialEffectType } from '@shared/static-data';
import { ClassFeatureService } from './ClassFeatureService';

interface ClassFeatureEffectsSectionProps {
    featureId: number;
    effects: z.infer<typeof ClassFeatureSpecialEffectSchema>[];
    onEffectsChange: (effects: z.infer<typeof ClassFeatureSpecialEffectSchema>[]) => void;
    isInline?: boolean;
}

export function ClassFeatureEffectsSection({
    featureId,
    effects,
    onEffectsChange,
    isInline = false
}: ClassFeatureEffectsSectionProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const effectTypeOptions = Object.entries(SpecialEffectType).map(([key, value]) => ({
        value: value.toString(),
        label: key
    }));

    const handleAddEffect = async (effect: Omit<z.infer<typeof ClassFeatureSpecialEffectSchema>, 'id' | 'progressionId'>) => {
        try {
            // Note: This would need a progressionId, which should be passed from parent
            // For now, we'll use a placeholder approach
            const tempEffect: z.infer<typeof ClassFeatureSpecialEffectSchema> = {
                id: Date.now(), // Temporary ID for frontend
                progressionId: 0, // This should be set by parent component
                ...effect
            };
            onEffectsChange([...effects, tempEffect]);
            setIsAdding(false);
        } catch (error) {
            console.error('Failed to create effect:', error);
        }
    };

    const handleUpdateEffect = async (index: number, effect: z.infer<typeof ClassFeatureSpecialEffectSchema>) => {
        try {
            const updatedEffects = [...effects];
            updatedEffects[index] = effect;
            onEffectsChange(updatedEffects);
            setEditingIndex(null);
        } catch (error) {
            console.error('Failed to update effect:', error);
        }
    };

    const handleDeleteEffect = async (index: number) => {
        const effect = effects[index];
        try {
            const updatedEffects = effects.filter((_, i) => i !== index);
            onEffectsChange(updatedEffects);
        } catch (error) {
            console.error('Failed to delete effect:', error);
        }
    };

    const containerClass = isInline ? "space-y-4" : "border rounded-lg p-4";

    return (
        <div className={containerClass}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Special Effects</h3>
                <button
                    type="button"
                    onClick={() => setIsAdding(true)}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                    Add Effect
                </button>
            </div>

            {/* Existing Effects */}
            {effects.map((effect, index) => (
                <div key={effect.id} className="border rounded p-3 mb-2">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <p><strong>Type:</strong> {Object.keys(SpecialEffectType)[effect.effectType]}</p>
                            {effect.key && <p><strong>Key:</strong> {effect.key}</p>}
                            {effect.value && <p><strong>Value:</strong> {effect.value}</p>}
                            {effect.numericValue !== null && <p><strong>Numeric Value:</strong> {effect.numericValue}</p>}
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
                                onClick={() => handleDeleteEffect(index)}
                                className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            {/* Add/Edit Effect Dialog */}
            {(isAdding || editingIndex !== null) && (
                <EffectForm
                    effect={editingIndex !== null ? effects[editingIndex] : undefined}
                    onSave={(effect) => {
                        if (editingIndex !== null) {
                            handleUpdateEffect(editingIndex, effect);
                        } else {
                            handleAddEffect(effect);
                        }
                    }}
                    onCancel={() => {
                        setIsAdding(false);
                        setEditingIndex(null);
                    }}
                    effectTypeOptions={effectTypeOptions}
                />
            )}
        </div>
    );
}

// EffectForm Component
interface EffectFormProps {
    effect?: z.infer<typeof ClassFeatureSpecialEffectSchema>;
    onSave: (effect: Omit<z.infer<typeof ClassFeatureSpecialEffectSchema>, 'id' | 'progressionId'>) => void;
    onCancel: () => void;
    effectTypeOptions: Array<{ value: string; label: string }>;
}

function EffectForm({ effect, onSave, onCancel, effectTypeOptions }: EffectFormProps) {
    const initialData = {
        effectType: effect?.effectType || 0,
        key: effect?.key || '',
        value: effect?.value || '',
        numericValue: effect?.numericValue || null,
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
                    {effect ? 'Edit Special Effect' : 'Add Special Effect'}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <CustomSelect
                            label="Effect Type"
                            required
                            value={formData.effectType.toString()}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, effectType: parseInt(value) as z.infer<typeof ClassFeatureSpecialEffectSchema>['effectType'] }))}
                            options={effectTypeOptions}
                            placeholder="Select effect type"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Key (Optional)</label>
                        <input
                            type="text"
                            value={formData.key}
                            onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                            placeholder="e.g., enemy-type, form-type"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Value (Optional)</label>
                        <input
                            type="text"
                            value={formData.value}
                            onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                            placeholder="e.g., undead, wolf"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Numeric Value (Optional)</label>
                        <input
                            type="number"
                            value={formData.numericValue || ''}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                numericValue: e.target.value ? parseInt(e.target.value) : null
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                            placeholder="e.g., 2, 5, 10"
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
                            {effect ? 'Update' : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 
