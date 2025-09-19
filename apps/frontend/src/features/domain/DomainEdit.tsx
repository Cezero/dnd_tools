import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import { FeatureSystemApi, FeatureProgressionDetailEdit } from '@/components/feature-system';
import { FeatureDisplay } from '@/components/feature-system/FeatureDisplay';
import {
    ValidatedForm,
    ValidatedInput,
    useValidatedForm,
    SpellSearchInput,
    SourceEditor
} from '@/components/forms';
import { CustomSelect } from '@/components/forms/FormComponents';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { CreateDomainRequest, UpdateDomainRequest, UpdateDomainSchema, CreateDomainSchema, FeatureProgression, Feature, CreateFeatureProgressionRequest, UpdateFeatureRequest } from '@shared/schema';
import { EDITION_SELECT_LIST_FULL, SourceType, FeatureSourceType } from '@shared/static-data';

import { DomainApi } from './DomainApi';

// Type definitions for the form state
type DomainFormData = CreateDomainRequest | UpdateDomainRequest;


export function DomainEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [domain, setDomain] = useState<DomainFormData | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Feature management state (separate from form data)
    const [features, setFeatures] = useState<Feature[]>([]);
    const [featureProgressions, setFeatureProgressions] = useState<FeatureProgression[]>([]);
    const [isFeatureDialogOpen, setIsFeatureDialogOpen] = useState(false);
    const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
    const [featureFormData, setFeatureFormData] = useState<{ name: string; slug: string; description: string }>({
        name: '',
        slug: '',
        description: ''
    });

    // Progression dialog state
    const [isProgressionDialogOpen, setIsProgressionDialogOpen] = useState(false);
    const [editingProgression, setEditingProgression] = useState<FeatureProgression | null>(null);
    const [preSelectedFeature, setPreSelectedFeature] = useState<{ id: number; name: string; description: string; slug: string } | undefined>(undefined);

    const fromListParams = location.state?.fromListParams || '';

    // Determine which schema to use based on whether we're creating or editing
    const schema = id === 'new' ? CreateDomainSchema : UpdateDomainSchema;

    // Initialize form data with default values
    const initialFormData: DomainFormData = useMemo(() => ({
        name: '',
        editionId: 1,
        domainSpells: [],
        sourceBookInfo: [],
        features: [],
        ...(id !== 'new' && { id: parseInt(id) })
    }), [id]);

    const [formData, setFormData] = useState<DomainFormData>(initialFormData);

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

    // FeatureProgression management handlers
    const handleAddFeature = useCallback(() => {
        setEditingFeature(null);
        setFeatureFormData({ name: '', slug: '', description: '' });
        setIsFeatureDialogOpen(true);
    }, []);

    const handleEditFeature = useCallback((feature: Feature) => {
        setEditingFeature(feature);
        setFeatureFormData({
            name: feature.name,
            slug: feature.slug,
            description: feature.description
        });
        setIsFeatureDialogOpen(true);
    }, []);

    const handleFeatureSave = useCallback((feature: Feature) => {
        if (editingFeature) {
            // Update existing feature
            setFeatures(prev => prev.map(f => f.id === editingFeature.id ? feature : f));
        } else {
            // Add new feature with temporary ID
            const newFeature = {
                ...feature,
                id: Math.floor(Date.now() + Math.random() * 1000) // Temporary ID as integer
            };
            setFeatures(prev => [...prev, newFeature]);

            // Create a default progression for the new feature
            const defaultProgression: FeatureProgression = {
                id: Date.now() + Math.random(), // Temporary ID for frontend
                sourceType: FeatureSourceType.Domain,
                classId: null,
                raceId: null,
                domainId: id === 'new' ? 0 : parseInt(id as string),
                level: 1,
                featureId: newFeature.id,
                variantOverrideId: null,
                entities: []
            };
            setFeatureProgressions(prev => [...prev, defaultProgression]);
        }

        setIsFeatureDialogOpen(false);
        setEditingFeature(null);
        setFeatureFormData({ name: '', slug: '', description: '' });
    }, [editingFeature, id]);

    const handleRemoveFeature = useCallback((featureId: number) => {
        setFeatures(prev => prev.filter(f => f.id !== featureId));
        setFeatureProgressions(prev => prev.filter(p => p.featureId !== featureId));
    }, []);

    const handleEditProgression = useCallback((progression: FeatureProgression) => {
        setEditingProgression(progression);
        setIsProgressionDialogOpen(true);
    }, []);

    const handleRemoveProgression = useCallback((progressionId: number) => {
        setFeatureProgressions(prev => prev.filter(p => p.id !== progressionId));
    }, []);

    const handleAddProgression = useCallback((featureId: number) => {
        const newProgression: FeatureProgression = {
            id: Date.now() + Math.random(), // Temporary ID for frontend
            sourceType: FeatureSourceType.Domain,
            classId: null,
            raceId: null,
            domainId: id === 'new' ? 0 : parseInt(id as string),
            level: 1,
            featureId: featureId,
            variantOverrideId: null,
            entities: []
        };

        // Find the feature to set as pre-selected
        const feature = features.find(f => f.id === featureId);
        if (feature) {
            setPreSelectedFeature({
                id: feature.id,
                name: feature.name,
                description: feature.description,
                slug: feature.slug
            });
        }

        setEditingProgression(newProgression);
        setIsProgressionDialogOpen(true);
    }, [id, features]);

    const handleSaveProgression = useCallback((progression: FeatureProgression) => {
        if (editingProgression) {
            // Update existing progression
            setFeatureProgressions(prev => prev.map(p =>
                p.id === editingProgression.id ? progression : p
            ));
        } else {
            // Add new progression
            setFeatureProgressions(prev => [...prev, progression]);
        }

        setIsProgressionDialogOpen(false);
        setEditingProgression(null);
        setPreSelectedFeature(undefined);
    }, [editingProgression]);

    useEffect(() => {
        const fetchDomain = async () => {
            if (id === 'new') {
                setDomain(initialFormData);
                return;
            }

            try {
                setIsLoading(true);
                const fetchedDomain = await DomainApi.getDomainById(undefined, { id: parseInt(id) });

                // Transform the domain data for the form
                const formDomainData: DomainFormData = {
                    ...fetchedDomain,
                    features: fetchedDomain.features?.map(progression => {
                        const { feature: _feature, ...progressionData } = progression;
                        return {
                            ...progressionData,
                            entities: progression.entities || []
                        };
                    }) || []
                };

                setDomain(formDomainData);
                setFormData(formDomainData);

                // Set separate features state for feature management
                const domainFeatures = fetchedDomain.features?.map(progression => {
                    if (!progression.feature) {
                        throw new Error('Feature progression must have a feature');
                    }
                    return {
                        ...progression.feature,
                        prerequisites: progression.feature.prerequisites || []
                    };
                }) || [];
                setFeatures(domainFeatures);

                // Set feature progressions for display
                setFeatureProgressions(fetchedDomain.features || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch domain');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDomain();
    }, [id, initialFormData]);

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

            // First, handle feature creation/updates
            const updatedFeatureProgressions = await Promise.all(
                features.map(async (feature) => {
                    let featureId = feature.id;

                    // Check if this is a new feature (temporary ID)
                    if (featureId > 1000000000) { // Temporary IDs are large numbers
                        // Create new feature
                        const createResponse = await FeatureSystemApi.createFeature({
                            name: feature.name,
                            slug: feature.slug,
                            description: feature.description,
                            prerequisites: feature.prerequisites || []
                        });
                        featureId = parseInt(createResponse.id);
                    } else {
                        // Update existing feature
                        await FeatureSystemApi.updateFeature({
                            name: feature.name,
                            slug: feature.slug,
                            description: feature.description,
                            prerequisites: feature.prerequisites || []
                        } as UpdateFeatureRequest, { id: featureId });
                    }

                    // Find the corresponding feature progression
                    const progression = featureProgressions.find(p => p.featureId === feature.id);
                    if (progression) {
                        const { id: _, ...progressionData } = progression;
                        return {
                            ...progressionData,
                            featureId: featureId,
                            entities: progression.entities?.map(entity => {
                                const { id: _, progressionId: __, feat: _feat, feature: _feature, item: _item, domain: _domain, ...entityData } = entity;
                                return entityData;
                            }) || []
                        };
                    }
                    return null;
                })
            );

            // Filter out null values and update formData with proper featureIds
            const validProgressions = updatedFeatureProgressions.filter(p => p !== null) as CreateFeatureProgressionRequest[];

            const domainData = {
                ...formData,
                features: validProgressions
            };

            // Create or update domain
            let createdDomainId: string | null = null;
            if (id === 'new') {
                const response = await DomainApi.createDomain(domainData as CreateDomainRequest);
                setMessage('Domain created successfully');
                createdDomainId = response.id;
            } else {
                await DomainApi.updateDomain(domainData as UpdateDomainRequest, { id: parseInt(id) });
                setMessage('Domain updated successfully');
            }

            // Navigate back after a short delay
            setTimeout(() => {
                navigate(`/domains/${createdDomainId || id}${fromListParams ? `?${fromListParams}` : ''}`);
            }, 1000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save domain');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        navigate(`/domains${fromListParams ? `?${fromListParams}` : ''}`);
    };

    if (isLoading && id !== 'new') {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">
                {id === 'new' ? 'Create New Domain' : `Edit Domain: ${domain?.name || ''}`}
            </h1>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            {message && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                    {message}
                </div>
            )}

            <ValidatedForm
                onSubmit={handleSubmit}
                validationState={form.validation.validationState}
                isLoading={isLoading}
                formData={formData}
                setFormData={setFormData}
                validation={form.validation}
            >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left column - Main fields */}
                    <div className="lg:col-span-2 space-y-4">
                        <div>
                            <ValidatedInput
                                field="name"
                                label="Domain Name"
                                type="text"
                                required
                                placeholder="Enter domain name"
                                componentExtraClassName="flex items-center gap-2"
                            />
                        </div>

                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Domain Spells</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Select up to 9 spells for this domain, one for each spell level (1-9).
                            </p>
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => {
                                    const existingSpell = formData.domainSpells?.find(ds => ds.spellLevel === level);
                                    return (
                                        <div key={level} className="flex items-center gap-3">
                                            <div className="w-16 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Level {level}
                                            </div>
                                            <div className="flex-1">
                                                <SpellSearchInput
                                                    value={existingSpell?.spellId || null}
                                                    onValueChange={(spellId) => {
                                                        const currentSpells = formData.domainSpells || [];
                                                        let newSpells;

                                                        if (spellId === null) {
                                                            // Remove the spell for this level
                                                            newSpells = currentSpells.filter(ds => ds.spellLevel !== level);
                                                        } else {
                                                            // Add or update the spell for this level
                                                            const existingIndex = currentSpells.findIndex(ds => ds.spellLevel === level);
                                                            const newSpell = { spellId, spellLevel: level };

                                                            if (existingIndex >= 0) {
                                                                newSpells = [...currentSpells];
                                                                newSpells[existingIndex] = newSpell;
                                                            } else {
                                                                newSpells = [...currentSpells, newSpell];
                                                            }
                                                        }

                                                        setFormData({ ...formData, domainSpells: newSpells });
                                                    }}
                                                    label=""
                                                    placeholder={`Search for a level ${level} spell...`}
                                                    componentExtraClassName="flex items-center gap-2"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right column - Edition and Source info */}
                    <div className="space-y-4">
                        <div>
                            <CustomSelect
                                label="Edition"
                                options={EDITION_SELECT_LIST_FULL}
                                value={formData.editionId}
                                onValueChange={(value) => setFormData({ ...formData, editionId: value })}
                                componentExtraClassName="flex items-center gap-2"
                            />
                        </div>

                        <div>
                            <SourceEditor
                                sources={formData.sourceBookInfo || []}
                                onSourcesChange={(sources) => setFormData({ ...formData, sourceBookInfo: sources })}
                                sourceType={SourceType.Domains}
                            />
                        </div>
                    </div>
                </div>

                {/* Domain Features Section */}
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-semibold">Domain Features</h2>
                        <button
                            type="button"
                            onClick={handleAddFeature}
                            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-white"
                        >
                            Add Feature
                        </button>
                    </div>

                    {/* Display existing features */}
                    {features.length > 0 ? (
                        <div className="space-y-4 border p-4 rounded-md dark:border-gray-600">
                            {features.map((feature) => {
                                // Get progressions for this feature
                                const featureProgs = featureProgressions.filter(p => p.featureId === feature.id);

                                return (
                                    <div key={feature.id} className="relative">
                                        {/* Remove feature button */}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFeature(feature.id)}
                                            className="absolute top-2 right-2 z-10 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600"
                                            aria-label="Remove feature"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>

                                        {/* Edit feature button */}
                                        <button
                                            type="button"
                                            onClick={() => handleEditFeature(feature)}
                                            className="absolute top-2 right-10 z-10 text-blue-600 hover:text-blue-400"
                                        >
                                            <PencilIcon className="h-4 w-4" />
                                        </button>

                                        <FeatureDisplay
                                            feature={feature}
                                            progressions={featureProgs}
                                            onEditProgression={handleEditProgression}
                                            onRemoveProgression={handleRemoveProgression}
                                            onAddProgression={() => handleAddProgression(feature.id)}
                                            showAddProgressionButton={true}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-gray-500 dark:text-gray-400 italic p-4 border rounded-md dark:border-gray-600">
                            No features added. Click "Add Feature" to add domain-granted features.
                        </div>
                    )}
                </div>

                <div className="flex gap-2 mt-6">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                    >
                        {isLoading ? 'Saving...' : (id === 'new' ? 'Create Domain' : 'Update Domain')}
                    </button>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Cancel
                    </button>
                </div>
            </ValidatedForm>

            {/* Feature Edit Dialog */}
            {isFeatureDialogOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-semibold mb-4">
                            {editingFeature ? 'Edit Feature' : 'Add Feature'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Feature Name</label>
                                <input
                                    type="text"
                                    value={featureFormData.name}
                                    onChange={(e) => setFeatureFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                    placeholder="Enter feature name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Feature Slug</label>
                                <input
                                    type="text"
                                    value={featureFormData.slug}
                                    onChange={(e) => setFeatureFormData(prev => ({ ...prev, slug: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                    placeholder="Enter feature slug"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <MarkdownEditor
                                    id="feature-description"
                                    value={featureFormData.description}
                                    onChange={(value) => setFeatureFormData(prev => ({ ...prev, description: value }))}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-2 mt-6">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsFeatureDialogOpen(false);
                                    setEditingFeature(null);
                                    setFeatureFormData({ name: '', slug: '', description: '' });
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const feature: Feature = {
                                        id: editingFeature?.id || 0,
                                        name: featureFormData.name,
                                        slug: featureFormData.slug,
                                        description: featureFormData.description,
                                        prerequisites: editingFeature?.prerequisites || []
                                    };
                                    handleFeatureSave(feature);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                {editingFeature ? 'Update' : 'Add'} Feature
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Feature Progression Dialog */}
            <FeatureProgressionDetailEdit
                isOpen={isProgressionDialogOpen}
                onClose={() => {
                    setIsProgressionDialogOpen(false);
                    setEditingProgression(null);
                    setPreSelectedFeature(undefined);
                }}
                progression={editingProgression}
                onSave={handleSaveProgression}
                preSelectedFeature={preSelectedFeature}
                showSourceTypeSelector={false}
            />
        </div>
    );
}
