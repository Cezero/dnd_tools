import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

import { ClassVariantSpellOverride } from '@shared/schema';

interface SpellAdditionManagerProps {
    spellAdditions: ClassVariantSpellOverride[];
    onUpdate: (additions: ClassVariantSpellOverride[]) => void;
    isLoading?: boolean;
}

export function SpellAdditionManager({ spellAdditions, onUpdate, isLoading = false }: SpellAdditionManagerProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const handleAddAddition = () => {
        setIsAdding(true);
    };

    const handleSaveAddition = (addition: ClassVariantSpellOverride) => {
        if (editingIndex !== null) {
            // Update existing addition
            const newAdditions = [...spellAdditions];
            newAdditions[editingIndex] = addition;
            onUpdate(newAdditions);
            setEditingIndex(null);
        } else {
            // Add new addition
            onUpdate([...spellAdditions, addition]);
            setIsAdding(false);
        }
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingIndex(null);
    };

    const handleDelete = (index: number) => {
        if (window.confirm('Are you sure you want to delete this spell addition?')) {
            const newAdditions = spellAdditions.filter((_, i) => i !== index);
            onUpdate(newAdditions);
        }
    };

    const handleEdit = (index: number) => {
        setEditingIndex(index);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                    Spell Additions ({spellAdditions.length})
                </h4>
                <button
                    type="button"
                    onClick={handleAddAddition}
                    disabled={isLoading || isAdding}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <PlusIcon className="h-4 w-4" />
                    <span>Add Spell</span>
                </button>
            </div>

            {/* Spell Addition List */}
            <div className="space-y-3">
                {spellAdditions.map((addition, index) => (
                    <div key={index} className="p-4 bg-gray-50 border border-gray-200 rounded-md dark:bg-gray-700 dark:border-gray-600">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h5 className="font-medium text-gray-900 dark:text-white">
                                    Spell ID: {addition.spellId}
                                </h5>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Level: {addition.level}
                                </p>
                            </div>
                            <div className="flex space-x-2 ml-4">
                                <button
                                    type="button"
                                    onClick={() => handleEdit(index)}
                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                    title="Edit spell addition"
                                >
                                    <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(index)}
                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                    title="Delete spell addition"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add/Edit Form */}
            {(isAdding || editingIndex !== null) && (
                <SpellAdditionForm
                    addition={editingIndex !== null ? spellAdditions[editingIndex] : null}
                    onSave={handleSaveAddition}
                    onCancel={handleCancel}
                />
            )}

            {spellAdditions.length === 0 && !isAdding && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>No spell additions configured.</p>
                    <p className="text-sm">Click "Add Spell" to add spells to this variant class.</p>
                </div>
            )}
        </div>
    );
}

interface SpellAdditionFormProps {
    addition: ClassVariantSpellOverride | null;
    onSave: (addition: ClassVariantSpellOverride) => void;
    onCancel: () => void;
}

function SpellAdditionForm({ addition, onSave, onCancel }: SpellAdditionFormProps) {
    const [formData, setFormData] = useState({
        spellId: addition?.spellId || 0,
        level: addition?.level || 1,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // For new additions, we don't have id and variantId yet
        const additionData = addition
            ? { ...addition, ...formData } // Update existing
            : {
                id: 0, // Temporary ID for new additions
                variantId: 0, // Will be set by parent
                ...formData
            };
        onSave(additionData);
    };

    return (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-900/20 dark:border-blue-800">
            <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-4">
                {addition ? 'Edit Spell Addition' : 'Add Spell Addition'}
            </h5>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="spellId" className="block text-sm font-medium text-blue-900 dark:text-blue-100">
                        Spell ID
                    </label>
                    <input
                        type="number"
                        id="spellId"
                        value={formData.spellId}
                        onChange={(e) => setFormData(prev => ({ ...prev, spellId: parseInt(e.target.value) || 0 }))}
                        className="mt-1 block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-blue-600 dark:bg-blue-800 dark:text-white"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="level" className="block text-sm font-medium text-blue-900 dark:text-blue-100">
                        Level
                    </label>
                    <input
                        type="number"
                        id="level"
                        min="1"
                        max="9"
                        value={formData.level}
                        onChange={(e) => setFormData(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                        className="mt-1 block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-blue-600 dark:bg-blue-800 dark:text-white"
                        required
                    />
                </div>
                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 border border-blue-300 rounded-md text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-800"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                        {addition ? 'Update' : 'Add'} Spell
                    </button>
                </div>
            </form>
        </div>
    );
}
