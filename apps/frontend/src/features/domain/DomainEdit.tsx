import { useQueryClient } from '@tanstack/react-query';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import { FeatureProgressionDetailEdit } from '@/components/feature-system';
import { FeaturesManager } from '@/components/feature-system/FeaturesManager';
import {
    ValidatedForm,
    ValidatedInput,
    useValidatedForm,
    SpellSearchInput,
    SourceEditor
} from '@/components/forms';
import { CustomSelect } from '@/components/forms/FormComponents';
import { DomainQueryHooks } from '@/services/query/DomainQueryHooks';
import { CreateDomainRequest, UpdateDomainRequest, UpdateDomainSchema, CreateDomainSchema, FeatureProgression, Feature, CreateFeatureProgressionRequest } from '@shared/schema';
import { EDITION_LIST, SourceType, FeatureSourceType } from '@shared/static-data';

// Type definitions for the form state
type DomainFormData = CreateDomainRequest | UpdateDomainRequest;


export function DomainEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Use imperative API for data fetching and mutations
    const [domain, setDomain] = useState<unknown | null>(null);
    const [isLoadingDomain, setIsLoadingDomain] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [domainError, setDomainError] = useState<Error | null>(null);


    // Feature management state (separate from form data)
    const [features, setFeatures] = useState<Feature[]>([]);
    const [featureProgressions, setFeatureProgressions] = useState<FeatureProgression[]>([]);
    const queryClient = useQueryClient();

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
    const handleAddFeature = useCallback((feature: { id: number; name: string; description: string; slug: string }) => {
        // Add new feature to features list
        const newFeature: Feature = {
            id: feature.id,
            name: feature.name,
            slug: feature.slug,
            description: feature.description,
            displayInCharacterSheet: true,
            prerequisites: []
        };
        setFeatures(prev => [...prev, newFeature]);

        // Create a default progression for the new feature
        const defaultProgression: FeatureProgression = {
            id: Date.now() + Math.random(),
            sourceType: FeatureSourceType.Domain,
            classId: null,
            raceId: null,
            domainId: id === 'new' ? 0 : parseInt(id as string),
            level: 1,
            featureId: feature.id,
            variantOverrideId: null,
            entities: [],
            feature: newFeature
        };
        setFeatureProgressions(prev => [...prev, defaultProgression]);
    }, [id]);

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
                return;
            }

            try {
                setIsLoadingDomain(true);
                setDomainError(null);
                const fetchedDomain = await DomainQueryHooks.getDomainById(parseInt(id!));

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

                setFormData(formDomainData);
                setDomain(fetchedDomain);

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
                const error = err instanceof Error ? err : new Error('Failed to fetch domain');
                setDomainError(error);
                setError(error.message);
            } finally {
                setIsLoadingDomain(false);
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
            // Map features to progressions, ensuring featureIds match
            const validProgressions = featureProgressions.map(progression => {
                const { id: _, ...progressionData } = progression;
                return {
                    ...progressionData,
                    entities: progression.entities?.map(entity => {
                        const { id: _, progressionId: __, feat: _feat, feature: _feature, item: _item, domain: _domain, ...entityData } = entity;
                        return entityData;
                    }) || []
                };
            }) as CreateFeatureProgressionRequest[];

            const domainData = {
                ...formData,
                features: validProgressions
            };

            // Create or update domain using imperative API
            if (id === 'new') {
                setIsCreating(true);
                const response = await DomainQueryHooks.createDomain(domainData as CreateDomainRequest);
                setMessage('Domain created successfully');
                setTimeout(() => {
                    navigate(`/domains/${response.id}${fromListParams ? `?${fromListParams}` : ''}`);
                }, 1000);
            } else {
                setIsUpdating(true);
                await DomainQueryHooks.updateDomain(parseInt(id), domainData as UpdateDomainRequest);
                setMessage('Domain updated successfully');
                setTimeout(() => {
                    navigate(`/domains/${id}${fromListParams ? `?${fromListParams}` : ''}`);
                }, 1000);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save domain');
        } finally {
            setIsCreating(false);
            setIsUpdating(false);
        }
    };

    const handleCancel = () => {
        navigate(`/domains${fromListParams ? `?${fromListParams}` : ''}`);
    };

    if (isLoadingDomain && id !== 'new') {
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
                isLoading={isCreating || isUpdating}
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
                                options={EDITION_LIST}
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
                    <FeaturesManager
                        featureProgressions={featureProgressions}
                        onEditProgression={handleEditProgression}
                        onRemoveProgression={handleRemoveProgression}
                        onAddFeature={handleAddFeature}
                        contextType={FeatureSourceType.Domain}
                        contextId={id === 'new' ? 0 : parseInt(id as string)}
                        parentType="domain"
                        title="Domain Features"
                        emptyMessage="No features added. Click 'Add Feature' to add domain-granted features."
                        setEditingProgression={setEditingProgression}
                        setPreSelectedFeature={setPreSelectedFeature}
                        setIsProgressionDialogOpen={setIsProgressionDialogOpen}
                    />
                </div>

                <div className="flex gap-2 mt-6">
                    <button
                        type="submit"
                        disabled={isCreating || isUpdating}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                    >
                        {isCreating || isUpdating ? 'Saving...' : (id === 'new' ? 'Create Domain' : 'Update Domain')}
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
