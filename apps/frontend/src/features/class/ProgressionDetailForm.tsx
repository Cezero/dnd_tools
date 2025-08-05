import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { CustomSelect } from '@/components/forms';
import {
    FeatureProgressionWithRelationsSchema,
    FeatureModifierSchema,
    FeatureSpecialEffectSchema,
    FeatureChoiceSchema
} from '@shared/schema';
import { FeatureModifierType, FeatureSpecialEffectType } from '@shared/static-data';

interface ProgressionDetailFormProps {
    progression: z.infer<typeof FeatureProgressionWithRelationsSchema> | null;
    availableFeatures: Array<{ id: number; name: string; description: string; slug: string }>;
    preSelectedFeature?: string;
    onSave: (progression: z.infer<typeof FeatureProgressionWithRelationsSchema>) => void;
    onCancel: () => void;
}

type DetailType = 'modifier' | 'effect' | 'choice' | null;

export function ProgressionDetailForm({
    progression,
    availableFeatures,
    preSelectedFeature,
    onSave,
    onCancel
}: ProgressionDetailFormProps) {
    const [formData, setFormData] = useState<z.infer<typeof FeatureProgressionWithRelationsSchema>>({
        id: progression?.id || 0,
        sourceType: progression?.sourceType || 1, // 1 for Class
        classId: progression?.classId || 0,
        level: progression?.level || 1,
        featureId: progression?.featureId || 0,
        feature: progression?.feature,
        modifiers: progression?.modifiers || [],
        choices: progression?.choices || [],
        effects: progression?.effects || [],
    });

    const [detailType, setDetailType] = useState<DetailType>(() => {
        // Determine initial detail type based on existing data
        if (progression?.modifiers && progression.modifiers.length > 0) return 'modifier';
        if (progression?.effects && progression.effects.length > 0) return 'effect';
        if (progression?.choices && progression.choices.length > 0) return 'choice';
        return null;
    });

    const [detailData, setDetailData] = useState<any>(() => {
        // Initialize detail data based on existing progression
        if (progression?.modifiers?.[0]) return progression.modifiers[0];
        if (progression?.effects?.[0]) return progression.effects[0];
        if (progression?.choices?.[0]) return progression.choices[0];
        return {};
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Create the updated progression with the detail data
        const updatedProgression: z.infer<typeof FeatureProgressionWithRelationsSchema> = {
            ...formData,
            modifiers: detailType === 'modifier' ? [detailData] : [],
            effects: detailType === 'effect' ? [detailData] : [],
            choices: detailType === 'choice' ? [detailData] : [],
        };

        onSave(updatedProgression);
    };

    const handleDetailTypeChange = (type: DetailType) => {
        setDetailType(type);
        setDetailData({}); // Reset detail data when type changes
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Progression Info */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>

                <div>
                    <CustomSelect
                        label="Feature"
                        required
                        value={formData.featureId.toString()}
                        onValueChange={(value) => {
                            const feature = availableFeatures.find(f => f.id === parseInt(value));
                            setFormData(prev => ({
                                ...prev,
                                featureId: parseInt(value),
                                feature: feature || undefined,
                            }));
                        }}
                        options={availableFeatures.map(f => ({ value: f.id.toString(), label: f.name }))}
                        placeholder="Select a feature"
                        disabled={!!preSelectedFeature}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Level</label>
                    <input
                        type="number"
                        min="1"
                        max="20"
                        value={formData.level}
                        onChange={(e) => setFormData(prev => ({ ...prev, level: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                        required
                    />
                </div>
            </div>

            {/* Detail Type Selection */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Progression Detail</h3>

                <div className="space-y-2">
                    <label className="block text-sm font-medium">Detail Type</label>
                    <div className="space-y-2">
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="detailType"
                                value="modifier"
                                checked={detailType === 'modifier'}
                                onChange={(e) => handleDetailTypeChange(e.target.value as DetailType)}
                                className="mr-2"
                            />
                            Modifier (Attack bonus, damage, etc.)
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="detailType"
                                value="effect"
                                checked={detailType === 'effect'}
                                onChange={(e) => handleDetailTypeChange(e.target.value as DetailType)}
                                className="mr-2"
                            />
                            Special Effect (Wild shape form, favored enemy, etc.)
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="detailType"
                                value="choice"
                                checked={detailType === 'choice'}
                                onChange={(e) => handleDetailTypeChange(e.target.value as DetailType)}
                                className="mr-2"
                            />
                            Choice (Feat selection, feature selection, etc.)
                        </label>
                    </div>
                </div>
            </div>

            {/* Conditional Detail Forms */}
            {detailType && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                        {detailType === 'modifier' && 'Modifier Details'}
                        {detailType === 'effect' && 'Effect Details'}
                        {detailType === 'choice' && 'Choice Details'}
                    </h3>

                    {detailType === 'modifier' && (
                        <ModifierDetailForm
                            data={detailData}
                            onChange={setDetailData}
                        />
                    )}

                    {detailType === 'effect' && (
                        <EffectDetailForm
                            data={detailData}
                            onChange={setDetailData}
                        />
                    )}

                    {detailType === 'choice' && (
                        <ChoiceDetailForm
                            data={detailData}
                            onChange={setDetailData}
                        />
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    disabled={!detailType}
                >
                    {progression ? 'Update' : 'Add'} Progression
                </button>
            </div>
        </form>
    );
}

// Modifier Detail Form Component
interface ModifierDetailFormProps {
    data: any;
    onChange: (data: any) => void;
}

function ModifierDetailForm({ data, onChange }: ModifierDetailFormProps) {
    const modifierTypeOptions = Object.entries(FeatureModifierType).map(([key, value]) => ({
        value: value.toString(),
        label: key
    }));

    return (
        <div className="space-y-4">
            <div>
                <CustomSelect
                    label="Modifier Type"
                    required
                    value={data.modifierType?.toString() || ''}
                    onValueChange={(value) => onChange({ ...data, modifierType: parseInt(value) })}
                    options={modifierTypeOptions}
                    placeholder="Select modifier type"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Value</label>
                <input
                    type="text"
                    value={data.value || ''}
                    onChange={(e) => onChange({ ...data, value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                    placeholder="e.g., +2, 1d6, 30ft"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Applies To (Optional)</label>
                <input
                    type="text"
                    value={data.appliesTo || ''}
                    onChange={(e) => onChange({ ...data, appliesTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                    placeholder="e.g., melee attacks, fire spells"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Condition Key (Optional)</label>
                    <input
                        type="text"
                        value={data.appliesIfChoiceKey || ''}
                        onChange={(e) => onChange({ ...data, appliesIfChoiceKey: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                        placeholder="e.g., weapon_type"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Condition Value (Optional)</label>
                    <input
                        type="text"
                        value={data.appliesIfChoiceValue || ''}
                        onChange={(e) => onChange({ ...data, appliesIfChoiceValue: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                        placeholder="e.g., longsword"
                    />
                </div>
            </div>
        </div>
    );
}

// Effect Detail Form Component
interface EffectDetailFormProps {
    data: any;
    onChange: (data: any) => void;
}

function EffectDetailForm({ data, onChange }: EffectDetailFormProps) {
    const effectTypeOptions = Object.entries(FeatureSpecialEffectType).map(([key, value]) => ({
        value: value.toString(),
        label: key
    }));

    return (
        <div className="space-y-4">
            <div>
                <CustomSelect
                    label="Effect Type"
                    required
                    value={data.effectType?.toString() || ''}
                    onValueChange={(value) => onChange({ ...data, effectType: parseInt(value) })}
                    options={effectTypeOptions}
                    placeholder="Select effect type"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Key</label>
                <input
                    type="text"
                    value={data.key || ''}
                    onChange={(e) => onChange({ ...data, key: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                    placeholder="e.g., form_name, enemy_type"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Value</label>
                <input
                    type="text"
                    value={data.value || ''}
                    onChange={(e) => onChange({ ...data, value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                    placeholder="e.g., bear, undead"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Numeric Value (Optional)</label>
                <input
                    type="number"
                    value={data.numericValue || ''}
                    onChange={(e) => onChange({ ...data, numericValue: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                    placeholder="e.g., 5, 10"
                />
            </div>
        </div>
    );
}

// Choice Detail Form Component
interface ChoiceDetailFormProps {
    data: any;
    onChange: (data: any) => void;
}

function ChoiceDetailForm({ data, onChange }: ChoiceDetailFormProps) {
    const choiceTypeOptions = [
        { value: 'Feat', label: 'Feat' },
        { value: 'ClassFeature', label: 'Class Feature' }
    ];

    return (
        <div className="space-y-4">
            <div>
                <CustomSelect
                    label="Choice Type"
                    required
                    value={data.choiceType || ''}
                    onValueChange={(value) => onChange({ ...data, choiceType: value })}
                    options={choiceTypeOptions}
                    placeholder="Select choice type"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Label</label>
                <input
                    type="text"
                    value={data.label || ''}
                    onChange={(e) => onChange({ ...data, label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                    placeholder="e.g., Choose a feat, Select a weapon proficiency"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Pick Count</label>
                <input
                    type="number"
                    min="1"
                    value={data.pickCount || ''}
                    onChange={(e) => onChange({ ...data, pickCount: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                    placeholder="e.g., 1, 2"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Feat ID (Optional)</label>
                    <input
                        type="number"
                        value={data.featId || ''}
                        onChange={(e) => onChange({ ...data, featId: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                        placeholder="e.g., 123"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Chosen Feature ID (Optional)</label>
                    <input
                        type="number"
                        value={data.chosenFeatureId || ''}
                        onChange={(e) => onChange({ ...data, chosenFeatureId: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                        placeholder="e.g., 456"
                    />
                </div>
            </div>
        </div>
    );
} 
