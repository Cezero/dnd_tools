import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { TrashIcon } from '@heroicons/react/24/outline';

import {
    ValidatedForm,
    ValidatedInput,
    useValidatedForm,
    CustomSelect,
    CustomCheckbox
} from '@/components/forms';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { ClassService } from './ClassService';
import { ClassFeatureAssoc } from './ClassFeatureAssoc';
import { ClassProficiencyService, type ProficiencyFeat, type ProficiencyItem } from './ClassProficiencyService';
import { ClassProficiencyInQueryResponse, CreateClassSchema, UpdateClassSchema } from '@shared/schema';
import { RPG_DICE_SELECT_LIST, ABILITY_SELECT_LIST, EDITION_SELECT_LIST_FULL, _SKILL_MAP, SKILL_SELECT_LIST, BAB_PROGRESSION_SELECT_LIST, SAVE_PROGRESSION_SELECT_LIST, SPELL_PROGRESSION_SELECT_LIST, SPELLS_KNOWN_SELECT_LIST, SpellsKnownType, FEATURE_ASPECT_SELECT_LIST, ASPECT_FORMATTERS } from '@shared/static-data';
import { ClassFeatureProgressionDetailInQueryResponse } from '@shared/schema';
import { formatProgression } from '@/lib/Formatters';

// Type definitions for the form state
type ClassFormData = z.infer<typeof CreateClassSchema> | z.infer<typeof UpdateClassSchema>;

// Feature Progression Form Component
interface FeatureProgressionFormProps {
    progression: ClassFeatureProgressionDetailInQueryResponse | null;
    availableFeatures: Array<{ featureSlug: string; description: string; level: number }>;
    preSelectedFeature?: string;
    onSave: (progression: ClassFeatureProgressionDetailInQueryResponse) => void;
    onCancel: () => void;
}

function FeatureProgressionForm({ progression, availableFeatures, preSelectedFeature, onSave, onCancel }: FeatureProgressionFormProps) {
    const [formData, setFormData] = useState<ClassFeatureProgressionDetailInQueryResponse>({
        featureSlug: progression?.featureSlug || preSelectedFeature || '',
        level: progression?.level || 1,
        aspect: progression?.aspect || '',
        valueInt: progression?.valueInt || null,
        valueString: progression?.valueString || null,
        note: progression?.note || null,
        featureName: progression?.featureName || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <CustomSelect
                    label="Feature"
                    required
                    value={formData.featureSlug}
                    onValueChange={(value) => {
                        const feature = availableFeatures.find(f => f.featureSlug === value);
                        setFormData(prev => ({
                            ...prev,
                            featureSlug: value as string,
                            featureName: feature?.featureSlug || '',
                        }));
                    }}
                    options={availableFeatures.map(f => ({ value: f.featureSlug, label: f.featureSlug }))}
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

            <div>
                <CustomSelect
                    label="Aspect"
                    required
                    value={formData.aspect}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, aspect: value as string }))}
                    options={FEATURE_ASPECT_SELECT_LIST}
                    placeholder="Select an aspect"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Numeric Value</label>
                <input
                    type="number"
                    value={formData.valueInt || ''}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        valueInt: e.target.value ? parseInt(e.target.value) : null
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                    placeholder="e.g., 1, 2, -1"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">String Value</label>
                <input
                    type="text"
                    value={formData.valueString || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, valueString: e.target.value || null }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                    placeholder="e.g., 1d6, Large, 30ft"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Note</label>
                <textarea
                    value={formData.note || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value || null }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                    rows={3}
                    placeholder="Additional description or clarification"
                />
            </div>

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
                >
                    {progression ? 'Update' : 'Add'} Progression
                </button>
            </div>
        </form>
    );
}

export default function ClassEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [cls, setCls] = useState<ClassFormData | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFeatureAssocOpen, setIsFeatureAssocOpen] = useState(false);
    const [isProficiencyDialogOpen, setIsProficiencyDialogOpen] = useState(false);
    const [proficiencyFeats, setProficiencyFeats] = useState<ProficiencyFeat[]>([]);
    const [selectedProficiencyFeat, setSelectedProficiencyFeat] = useState<ProficiencyFeat | null>(null);
    const [proficiencyItems, setProficiencyItems] = useState<ProficiencyItem[]>([]);
    const [selectedProficiencyItem, setSelectedProficiencyItem] = useState<number | null>(null);
    const [proficiencyDisplay, setProficiencyDisplay] = useState<ClassProficiencyInQueryResponse[]>([]);
    const [featureProgressions, setFeatureProgressions] = useState<ClassFeatureProgressionDetailInQueryResponse[]>([]);
    const [isProgressionDialogOpen, setIsProgressionDialogOpen] = useState(false);
    const [editingProgression, setEditingProgression] = useState<ClassFeatureProgressionDetailInQueryResponse | null>(null);
    const [preSelectedFeature, setPreSelectedFeature] = useState<string | undefined>(undefined);

    // Determine which schema to use based on whether we're creating or editing
    const schema = id === 'new' ? CreateClassSchema : UpdateClassSchema;

    /**
     * Handles adding a skill to the class.
     */
    const handleAddSkill = useCallback((skillId: number) => {
        setFormData(prev => {
            const newSkillEntry = { classId: parseInt(id), skillId };
            const existingIndex = prev.skills?.findIndex(skill => skill.skillId === skillId) ?? -1;

            if (existingIndex !== -1) {
                // Skill already exists, don't add duplicate
                return prev;
            } else {
                return { ...prev, skills: [...(prev.skills || []), newSkillEntry] };
            }
        });
    }, [id]);

    /**
     * Handles the removal of a skill from the class's skill list.
     */
    const handleRemoveSkill = useCallback((skillId: number) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills?.filter(skill => skill.skillId !== skillId) || []
        }));
    }, []);

    /**
 * Handles adding a proficiency to the class.
 */
    const handleAddProficiency = useCallback(async (featId: number, itemId: number) => {
        setFormData(prev => {
            const newProficiencyEntry = { classId: parseInt(id), featId, itemId };
            const existingIndex = prev.proficiencies?.findIndex(prof =>
                prof.featId === featId && prof.itemId === itemId
            ) ?? -1;

            if (existingIndex !== -1) {
                // Proficiency already exists, don't add duplicate
                return prev;
            } else {
                const newProficiencies = [...(prev.proficiencies || []), newProficiencyEntry];

                // Update display information
                ClassProficiencyService.getProficiencyDisplay(newProficiencies).then(displayInfo => {
                    setProficiencyDisplay(displayInfo);
                });

                return { ...prev, proficiencies: newProficiencies };
            }
        });
    }, [id]);

    /**
 * Handles the removal of a proficiency from the class's proficiency list.
 */
    const handleRemoveProficiency = useCallback((featId: number, itemId: number) => {
        setFormData(prev => {
            const newProficiencies = prev.proficiencies?.filter(prof =>
                !(prof.featId === featId && prof.itemId === itemId)
            ) || [];

            // Update display information
            ClassProficiencyService.getProficiencyDisplay(newProficiencies).then(displayInfo => {
                setProficiencyDisplay(displayInfo);
            });

            return { ...prev, proficiencies: newProficiencies };
        });
    }, []);

    /**
     * Opens the proficiency dialog and loads proficiency feats
     */
    const handleOpenProficiencyDialog = useCallback(async () => {
        try {
            const feats = await ClassProficiencyService.getProficiencyFeats();
            setProficiencyFeats(feats);
            setSelectedProficiencyFeat(null);
            setSelectedProficiencyItem(null);
            setProficiencyItems([]);
            setIsProficiencyDialogOpen(true);
        } catch (error) {
            console.error('Failed to load proficiency feats:', error);
        }
    }, []);

    /**
     * Handles feat selection in the proficiency dialog
     */
    const handleFeatSelection = useCallback(async (featId: number) => {
        const feat = proficiencyFeats.find(f => f.id === featId);
        if (feat) {
            setSelectedProficiencyFeat(feat);
            setSelectedProficiencyItem(null);

            // Load items for this proficiency type
            try {
                const items = await ClassProficiencyService.getItemsByProficiencyType(feat.proficiencyTypeId);
                setProficiencyItems(items);
            } catch (error) {
                console.error('Failed to load items for proficiency type:', error);
                setProficiencyItems([]);
            }
        }
    }, [proficiencyFeats]);

    /**
     * Handles item selection in the proficiency dialog
     */
    const handleItemSelection = useCallback((itemId: number) => {
        setSelectedProficiencyItem(itemId);
    }, []);

    /**
     * Handles adding the selected proficiency
     */
    const handleAddSelectedProficiency = useCallback(() => {
        if (selectedProficiencyFeat && selectedProficiencyItem !== null) {
            handleAddProficiency(selectedProficiencyFeat.id, selectedProficiencyItem);
            setIsProficiencyDialogOpen(false);
        }
    }, [selectedProficiencyFeat, selectedProficiencyItem, handleAddProficiency]);

    // Initialize form data with default values
    const initialFormData: ClassFormData = {
        name: '',
        abbreviation: '',
        editionId: 1,
        isPrestige: false,
        isVisible: true,
        canCastSpells: false,
        hitDie: 1,
        skillPoints: 0,
        description: '',
        castingAbilityId: null,
        babProgression: 2, // poor
        fortProgression: 2, // poor
        refProgression: 2, // poor
        willProgression: 2, // poor
        spellProgression: null,
        spellsKnown: null,
        featureProgression: [],
        ...(id !== 'new' && { id: parseInt(id) })
    };

    const [formData, setFormData] = useState<ClassFormData>(initialFormData);

    /**
     * Handles adding a feature progression to the class.
     */
    const handleAddProgression = useCallback((progression: ClassFeatureProgressionDetailInQueryResponse) => {
        setFormData(prev => {
            const existingIndex = prev.featureProgression?.findIndex(p =>
                p.featureSlug === progression.featureSlug &&
                p.level === progression.level &&
                p.aspect === progression.aspect
            ) ?? -1;

            if (existingIndex !== -1) {
                // Progression already exists, don't add duplicate
                return prev;
            } else {
                return {
                    ...prev,
                    featureProgression: [...(prev.featureProgression || []), progression]
                };
            }
        });
    }, [id]);

    /**
     * Handles the removal of a feature progression from the class.
     */
    const handleRemoveProgression = useCallback((featureSlug: string, level: number, aspect: string) => {
        setFormData(prev => ({
            ...prev,
            featureProgression: prev.featureProgression?.filter(p =>
                !(p.featureSlug === featureSlug && p.level === level && p.aspect === aspect)
            ) || []
        }));
    }, []);

    /**
     * Handles updating a feature progression.
     */
    const handleUpdateProgression = useCallback((oldProgression: ClassFeatureProgressionDetailInQueryResponse, updatedProgression: ClassFeatureProgressionDetailInQueryResponse) => {
        setFormData(prev => {
            const progressionIndex = prev.featureProgression?.findIndex(p =>
                p.featureSlug === oldProgression.featureSlug &&
                p.level === oldProgression.level &&
                p.aspect === oldProgression.aspect
            ) ?? -1;

            if (progressionIndex === -1) {
                // If we can't find the old progression, just add the new one
                return {
                    ...prev,
                    featureProgression: [...(prev.featureProgression || []), updatedProgression]
                };
            }

            const newFeatureProgression = [...(prev.featureProgression || [])];
            newFeatureProgression[progressionIndex] = updatedProgression;

            return {
                ...prev,
                featureProgression: newFeatureProgression
            };
        });
    }, [id]);

    /**
     * Opens the progression dialog for adding a new progression.
     */
    const handleOpenProgressionDialog = useCallback(() => {
        setEditingProgression(null);
        setIsProgressionDialogOpen(true);
    }, []);

    /**
     * Opens the progression dialog for editing an existing progression.
     */
    const handleEditProgression = useCallback((progression: ClassFeatureProgressionDetailInQueryResponse) => {
        setEditingProgression(progression);
        setIsProgressionDialogOpen(true);
    }, []);

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
        const fetchClass = async () => {
            if (id === 'new') {
                setCls(initialFormData);
                return;
            }

            try {
                setIsLoading(true);
                const fetchedClass = await ClassService.getClassById(undefined, { id: parseInt(id) });
                setCls(fetchedClass);
                setFormData(fetchedClass);

                // Load proficiency display information
                if (fetchedClass.proficiencies && fetchedClass.proficiencies.length > 0) {
                    const displayInfo = await ClassProficiencyService.getProficiencyDisplay(fetchedClass.proficiencies);
                    setProficiencyDisplay(displayInfo);
                }

                // Set feature progressions
                if (fetchedClass.featureProgression) {
                    setFeatureProgressions(fetchedClass.featureProgression);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch class');
            } finally {
                setIsLoading(false);
            }
        };

        fetchClass();
    }, [id]);

    // Handle new feature from association dialog
    useEffect(() => {
        if (location.state?.newFeature) {
            const newFeature = location.state.newFeature;
            // Add the new feature to the form data
            const currentFeatures = formData.features || [];
            setFormData(prev => ({
                ...prev,
                features: [...currentFeatures, {
                    classId: parseInt(id),
                    description: '',
                    featureSlug: newFeature.slug,
                    level: 1
                }]
            }));
            // Clear the state
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, id, navigate]);

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
            if (id === 'new') {
                const newClass = await ClassService.createClass(formData as z.infer<typeof CreateClassSchema>);
                setMessage('Class created successfully!');
                setTimeout(() => navigate(`/admin/classes/${newClass.id}`), 1500);
            } else {
                await ClassService.updateClass(formData as z.infer<typeof UpdateClassSchema>, { id: parseInt(id) });
                setMessage('Class updated successfully!');
                navigate(`/admin/classes/${id}`, { state: { fromListParams: location.state?.fromListParams, refresh: true } });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save class');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !cls) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    if (error && !cls) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={() => navigate('/admin/classes')}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Back to Classes
                </button>
            </div>
        );
    }

    if (!cls) {
        return <div>No class data available</div>;
    }

    return (
        <div className="w-4/5 mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">
                    {id === 'new' ? 'Create New Class' : 'Edit Class'}
                </h1>
            </div>

            {message && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md dark:bg-green-900/20 dark:border-green-800">
                    <p className="text-green-700 dark:text-green-300">{message}</p>
                </div>
            )}

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800">
                    <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
            )}

            <ValidatedForm
                onSubmit={HandleSubmit}
                validationState={form.validation.validationState}
                isLoading={isLoading}
                formData={formData}
                setFormData={setFormData}
                validation={form.validation}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex flex-col gap-2">
                        <ValidatedInput
                            field="name"
                            label="Class Name"
                            type="text"
                            required
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-2/7"
                            inputExtraClassName="w-5/7"
                            placeholder="e.g., Wizard, Fighter, Cleric"
                            data-1p-ignore
                        />
                        <ValidatedInput
                            field="abbreviation"
                            label="Abbreviation"
                            type="text"
                            required
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-2/7"
                            inputExtraClassName="w-5/7"
                            placeholder="e.g., Wiz, Ftr, Clr"
                        />

                        <CustomSelect
                            label="Hit Die"
                            required
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-2/7"
                            itemExtraClassName="w-24"
                            itemTextExtraClassName="w-16"
                            value={formData.hitDie}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, hitDie: value as number }))}
                            options={RPG_DICE_SELECT_LIST.map(die => ({ value: die.value, label: die.label }))}
                            placeholder="Select hit die"
                        />
                        <ValidatedInput
                            field="skillPoints"
                            label="Skill Point Base"
                            type="number"
                            min={0}
                            max={10}
                            step={1}
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-2/7"
                        />
                    </div>
                    <div className="flex justify-end">
                        <div className="flex flex-col gap-2">
                            <CustomSelect
                                label="Edition"
                                required
                                componentExtraClassName="flex items-center gap-2"
                                labelExtraClassName="w-16"
                                itemExtraClassName="w-24"
                                itemTextExtraClassName="w-16"
                                value={formData.editionId}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, editionId: value as number }))}
                                options={EDITION_SELECT_LIST_FULL}
                                placeholder="Select edition"
                            />
                            <CustomCheckbox
                                label="Prestige Class"
                                checked={formData.isPrestige as boolean}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPrestige: checked }))}
                            />
                            <CustomCheckbox
                                label="Visible in Lists"
                                checked={formData.isVisible as boolean}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVisible: checked }))}
                            />
                            <CustomCheckbox
                                label="Can Cast Spells"
                                checked={formData.canCastSpells as boolean}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, canCastSpells: checked }))}
                            />
                            {formData.canCastSpells && (
                                <CustomSelect
                                    label="Casting Ability"
                                    value={formData.castingAbilityId}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, castingAbilityId: value as number | null }))}
                                    options={ABILITY_SELECT_LIST.map(ability => ({ value: ability.value, label: ability.label }))}
                                    placeholder="Select casting ability"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Progression Types Section */}
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Progression Types</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <CustomSelect
                                label="Base Attack Bonus"
                                required
                                componentExtraClassName="flex items-center gap-2"
                                labelExtraClassName="w-32"
                                itemExtraClassName="w-24"
                                itemTextExtraClassName="w-16"
                                value={formData.babProgression}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, babProgression: value as 0 | 1 | 2 }))}
                                options={BAB_PROGRESSION_SELECT_LIST}
                                placeholder="Select BAB progression"
                            />
                            <CustomSelect
                                label="Fortitude Save"
                                required
                                componentExtraClassName="flex items-center gap-2"
                                labelExtraClassName="w-32"
                                itemExtraClassName="w-24"
                                itemTextExtraClassName="w-16"
                                value={formData.fortProgression}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, fortProgression: value as 0 | 2 }))}
                                options={SAVE_PROGRESSION_SELECT_LIST}
                                placeholder="Select Fort progression"
                            />
                        </div>
                        <div className="space-y-4">
                            <CustomSelect
                                label="Reflex Save"
                                required
                                componentExtraClassName="flex items-center gap-2"
                                labelExtraClassName="w-32"
                                itemExtraClassName="w-24"
                                itemTextExtraClassName="w-16"
                                value={formData.refProgression}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, refProgression: value as 0 | 2 }))}
                                options={SAVE_PROGRESSION_SELECT_LIST}
                                placeholder="Select Ref progression"
                            />
                            <CustomSelect
                                label="Will Save"
                                required
                                componentExtraClassName="flex items-center gap-2"
                                labelExtraClassName="w-32"
                                itemExtraClassName="w-24"
                                itemTextExtraClassName="w-16"
                                value={formData.willProgression}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, willProgression: value as 0 | 2 }))}
                                options={SAVE_PROGRESSION_SELECT_LIST}
                                placeholder="Select Will progression"
                            />
                        </div>
                    </div>
                    {formData.canCastSpells && (
                        <div className="mt-4 space-y-4">
                            <CustomSelect
                                label="Spell Progression"
                                componentExtraClassName="flex items-center gap-2"
                                labelExtraClassName="w-32"
                                itemExtraClassName="w-32"
                                itemTextExtraClassName="w-24"
                                value={formData.spellProgression}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, spellProgression: value as 0 | 1 | 2 | 3 | 4 | null }))}
                                options={SPELL_PROGRESSION_SELECT_LIST}
                                placeholder="Select spell progression"
                            />
                            <CustomSelect
                                label="Spells Known Progression"
                                componentExtraClassName="flex items-center gap-2"
                                labelExtraClassName="w-32"
                                itemExtraClassName="w-32"
                                itemTextExtraClassName="w-24"
                                value={formData.spellsKnown}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, spellsKnown: value as 0 | 1 | 2 | null }))}
                                options={SPELLS_KNOWN_SELECT_LIST}
                                placeholder="Select spells known progression"
                            />
                        </div>
                    )}
                </div>

                <div className="mt-6">
                    <div className="space-y-2">
                        <MarkdownEditor
                            id="description"
                            value={formData.description || ''}
                            onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                        />
                        {form.validation.getError('description') && (
                            <span className="text-red-500 text-sm">{form.validation.getError('description')}</span>
                        )}
                    </div>
                </div>

                {/* Class Skills Section */}
                <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Class Skills</h3>
                    <div className="flex flex-wrap gap-2 mb-2 p-2 border rounded dark:border-gray-600 min-h-[40px]">
                        {formData.skills && formData.skills.length > 0 ? (
                            formData.skills.map((skill, index) => (
                                <span key={skill.skillId} className="group relative text-sm pt-1 pb-1 pl-0 pr-0 cursor-pointer">
                                    {_SKILL_MAP[skill.skillId]?.name || 'Unknown Skill'}
                                    {index < formData.skills!.length - 1 && ','}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSkill(skill.skillId)}
                                        className="absolute inset-0 flex items-center justify-center text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove Skill"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </span>
                            ))
                        ) : (
                            <span className="text-gray-500 dark:text-gray-400">No skills added.</span>
                        )}
                        <CustomSelect
                            key={`skill-select-${formData.skills?.length || 0}`}
                            label=""
                            value={null}
                            componentExtraClassName="flex items-center gap-1 text-sm"
                            itemExtraClassName="w-48 text-sm leading-4 py-0.75"
                            itemTextExtraClassName="w-48"
                            onValueChange={(value) => {
                                if (value) {
                                    handleAddSkill(value as number);
                                }
                            }}
                            options={SKILL_SELECT_LIST
                                .filter(skill => !formData.skills?.some(cs => cs.skillId === skill.value))}
                            placeholder="Add"
                        />
                    </div>
                </div>

                {/* Class Proficiencies Section */}
                <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Class Proficiencies</h3>
                    <div className="flex flex-wrap gap-2 mb-2 p-2 border rounded dark:border-gray-600 min-h-[40px]">
                        {proficiencyDisplay.length > 0 ? (
                            proficiencyDisplay.map((proficiency, index) => (
                                <span key={`${proficiency.featId}-${proficiency.itemId}`} className="group relative text-sm pt-1 pb-1 pl-0 pr-0 cursor-pointer">
                                    {proficiency.itemName} ({proficiency.featName})
                                    {index < proficiencyDisplay.length - 1 && ','}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveProficiency(proficiency.featId, proficiency.itemId)}
                                        className="absolute inset-0 flex items-center justify-center text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove Proficiency"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </span>
                            ))
                        ) : (
                            <span className="text-gray-500 dark:text-gray-400">No proficiencies added.</span>
                        )}
                        <button
                            type="button"
                            onClick={handleOpenProficiencyDialog}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Add
                        </button>
                    </div>
                </div>

                {/* Class Features Section */}
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Class Features</h3>
                        <button
                            type="button"
                            onClick={() => setIsFeatureAssocOpen(true)}
                            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                        >
                            Add Features
                        </button>
                    </div>

                    {formData.features && formData.features.length > 0 ? (
                        <div className="space-y-2">
                            {formData.features.map((feature, index) => {
                                const featureProgressions = formData.featureProgression?.filter(p => p.featureSlug === feature.featureSlug) || [];

                                return (
                                    <div key={index} className="border border-gray-200 rounded-md dark:border-gray-600">
                                        <div className="flex items-center gap-4 p-3">
                                            <div className="flex-1">
                                                <div className="font-medium">{feature.featureSlug}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm">Level:</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="20"
                                                    value={feature.level}
                                                    onChange={(e) => {
                                                        const newFeatures = [...(formData.features || [])];
                                                        newFeatures[index] = { ...feature, level: parseInt(e.target.value) };
                                                        setFormData(prev => ({ ...prev, features: newFeatures }));
                                                    }}
                                                    className="w-16 px-2 py-1 border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                                                    id={`feature-level-${feature.featureSlug}-${index}`}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newFeatures = formData.features?.filter((_, i) => i !== index) || [];
                                                    setFormData(prev => ({ ...prev, features: newFeatures }));
                                                }}
                                                className="px-2 py-1 text-red-500 hover:text-red-700"
                                            >
                                                Remove
                                            </button>
                                        </div>

                                        {/* Feature Progressions */}
                                        {featureProgressions.length > 0 && (
                                            <div className="border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-3">
                                                <div className="flex flex-wrap gap-2 items-center">
                                                    {featureProgressions.map((progression, progIndex) => (
                                                        <div key={progIndex} className="flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEditProgression(progression)}
                                                                className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                                            >
                                                                {(() => {
                                                                    const formatted = formatProgression(progression);
                                                                    return `L${progression.level}: ${formatted.label}${formatted.value ? ` ${formatted.value}` : ''}${formatted.note ? ` (${formatted.note})` : ''}`;
                                                                })()}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveProgression(progression.featureSlug, progression.level, progression.aspect)}
                                                                className="text-red-500 hover:text-red-700"
                                                                title="Remove Progression"
                                                            >
                                                                <TrashIcon className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingProgression(null);
                                                            setPreSelectedFeature(feature.featureSlug);
                                                            setIsProgressionDialogOpen(true);
                                                        }}
                                                        className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                                    >
                                                        Add Progression
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Add Progression button for features without progressions */}
                                        {featureProgressions.length === 0 && (
                                            <div className="border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingProgression(null);
                                                        setPreSelectedFeature(feature.featureSlug);
                                                        setIsProgressionDialogOpen(true);
                                                    }}
                                                    className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                                >
                                                    Add Progression
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-gray-500 text-center py-4 border border-dashed border-gray-300 rounded-md dark:border-gray-600">
                            No features associated with this class
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-4 mt-8">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/classes')}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading || form.validation.validationState.hasErrors}
                    >
                        {isLoading ? 'Saving...' : id === 'new' ? 'Create Class' : 'Update Class'}
                    </button>
                </div>
            </ValidatedForm >

            {/* Class Feature Association Dialog */}
            < ClassFeatureAssoc
                isOpen={isFeatureAssocOpen}
                onClose={() => setIsFeatureAssocOpen(false)
                }
                onSave={(selectedFeatures) => {
                    console.log('[ClassEdit] selectedFeatures received', selectedFeatures);
                    const newFeatures = selectedFeatures.map(feature => ({
                        classId: parseInt(id),
                        description: '',
                        featureSlug: feature.slug,
                        level: feature.level
                    }));
                    console.log('[ClassEdit] newFeatures', newFeatures);
                    setFormData(prev => {
                        console.log('[ClassEdit] replacing features with', newFeatures);
                        return {
                            ...prev,
                            features: newFeatures
                        };
                    });
                    setIsFeatureAssocOpen(false);
                }}
                initialSelectedFeatureIds={formData.features?.map(f => f.featureSlug) || []}
                classId={id !== 'new' ? parseInt(id) : undefined}
            />

            {/* Class Proficiency Dialog */}
            {isProficiencyDialogOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-25 z-40 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Add Class Proficiency</h3>

                        <div className="space-y-4">
                            {/* Feat Selection */}
                            <div>
                                <CustomSelect
                                    label="Select Proficiency Feat"
                                    popupExtraClassName='w-60'
                                    triggerExtraClassName="w-60"
                                    itemExtraClassName="w-68"
                                    itemTextExtraClassName="w-60"
                                    value={selectedProficiencyFeat?.id || null}
                                    onValueChange={(value) => handleFeatSelection(value as number)}
                                    options={proficiencyFeats.map(feat => ({ value: feat.id, label: feat.name }))}
                                    placeholder="Choose a proficiency feat"
                                />
                            </div>

                            {/* Item Selection - only show if feat is selected */}
                            {selectedProficiencyFeat && (
                                <div>
                                    <CustomSelect
                                        label="Select Items"
                                        popupExtraClassName='w-60'
                                        triggerExtraClassName="w-60"
                                        itemExtraClassName="w-68"
                                        itemTextExtraClassName="w-60"
                                        value={selectedProficiencyItem}
                                        onValueChange={(value) => handleItemSelection(value as number)}
                                        options={[
                                            { value: -1, label: 'All Items' },
                                            ...proficiencyItems
                                                .filter(item => !formData.proficiencies?.some(prof =>
                                                    prof.featId === selectedProficiencyFeat.id && prof.itemId === item.id
                                                ))
                                                .sort((a, b) => a.name.localeCompare(b.name))
                                                .map(item => ({ value: item.id, label: item.name }))
                                        ]}
                                        placeholder="Choose items or 'All Items'"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-2 mt-6">
                            <button
                                type="button"
                                onClick={() => setIsProficiencyDialogOpen(false)}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleAddSelectedProficiency}
                                disabled={!selectedProficiencyFeat || selectedProficiencyItem === null}
                                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add Proficiency
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Feature Progression Dialog */}
            {isProgressionDialogOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-25 z-40 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">
                            {editingProgression ? 'Edit Feature Progression' : 'Add Feature Progression'}
                        </h3>

                        <FeatureProgressionForm
                            progression={editingProgression}
                            availableFeatures={formData.features || []}
                            preSelectedFeature={preSelectedFeature}
                            onSave={(progression) => {
                                if (editingProgression) {
                                    handleUpdateProgression(editingProgression, progression);
                                } else {
                                    handleAddProgression(progression);
                                }
                                setIsProgressionDialogOpen(false);
                                setPreSelectedFeature(undefined);
                            }}
                            onCancel={() => {
                                setIsProgressionDialogOpen(false);
                                setPreSelectedFeature(undefined);
                            }}
                        />
                    </div>
                </div>
            )}
        </div >
    );
}
