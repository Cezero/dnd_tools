import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import { FeatureEditForm } from '@/components/feature-system/FeatureEditForm';
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
import { CreateDomainRequest, UpdateDomainRequest, UpdateDomainSchema, CreateDomainSchema, FeatureWithRelations, Feature, CreateFeatureRequest, Domain } from '@shared/schema';
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
    const [domain, setDomain] = useState<Domain | null>(null);
    const [isLoadingDomain, setIsLoadingDomain] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // Feature management state (separate from form data)
    const [features, setFeatures] = useState<FeatureWithRelations[]>([]);

    // Feature dialog state
    const [isProgressionDialogOpen, setIsProgressionDialogOpen] = useState(false);
    const [editingProgression, setEditingProgression] = useState<FeatureWithRelations | null>(null);
    const [preSelectedFeature, setPreSelectedFeature] = useState<Feature | null | undefined>(undefined);

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

    // FeatureWithRelations management handlers
    const handleAddFeature = useCallback((feature: { id: number; name: string; description: string; slug: string }) => {
        // Create a new feature object
        // FeatureWithRelations is now the unified Feature model
        // Create feature directly with feature fields

        // Create a default feature for the new feature
        // FeatureWithRelations is now the unified Feature model
        const defaultProgression: FeatureWithRelations = {
            id: feature.id,
            name: feature.name,
            slug: feature.slug,
            description: feature.description,
            displayInCharacterSheet: true,
            sourceType: FeatureSourceType.Domain,
            domainId: id === 'new' ? 0 : parseInt(id as string),
            level: 1,
            entities: [],
            prerequisites: []
        };
        setFeatures(prev => [...prev, defaultProgression]);
    }, [id]);

    const handleEditProgression = useCallback((feature: FeatureWithRelations) => {
        setEditingProgression(feature);
        setIsProgressionDialogOpen(true);
    }, []);

    const handleRemoveProgression = useCallback((progressionId: number) => {
        setFeatures(prev => prev.filter(p => p.id !== progressionId));
    }, []);

    const handleSaveProgression = useCallback((feature: FeatureWithRelations) => {
        if (editingProgression) {
            // Update existing feature
            setFeatures(prev => prev.map(p =>
                p.id === editingProgression.id ? feature : p
            ));
        } else {
            // Add new feature
            setFeatures(prev => [...prev, feature]);
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
                const fetchedDomain = await DomainQueryHooks.getDomainById(parseInt(id!));

                // Transform the domain data for the form
                const formDomainData: DomainFormData = {
                    ...fetchedDomain,
                    features: fetchedDomain.features?.map(feature => {
                        // FeatureWithRelations is now the unified Feature model, no need to remove feature property
                        const progressionData = feature;
                        return {
                            ...progressionData,
                            entities: feature.entities || []
                        };
                    }) || []
                };

                setFormData(formDomainData);
                setDomain(fetchedDomain);

                // Set feature features for display
                setFeatures(fetchedDomain.features || []);
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Failed to fetch domain');
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
            // Map features to features, ensuring featureIds match
            const validProgressions = features.map(feature => {
                const { id: _, ...progressionData } = feature;
                return {
                    ...progressionData,
                    entities: feature.entities?.map(entity => {
                        const { id: _, featureId: __, ...entityData } = entity;
                        return entityData;
                    }) || []
                };
            }) as CreateFeatureRequest[];

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
                        state={{
                            features,
                            editingProgression,
                            isProgressionDialogOpen,
                            preSelectedFeature: preSelectedFeature ?? null
                        }}
                        updateState={(update) => {
                            if (update.type === 'SET_EDITING_PROGRESSION') {
                                setEditingProgression(update.payload.editingProgression);
                            } else if (update.type === 'SET_IS_PROGRESSION_DIALOG_OPEN') {
                                setIsProgressionDialogOpen(update.payload.isProgressionDialogOpen);
                            } else if (update.type === 'SET_PRE_SELECTED_FEATURE') {
                                setPreSelectedFeature(update.payload.preSelectedFeature);
                            } else if (update.type === 'REMOVE_FEATURE_PROGRESSION') {
                                handleRemoveProgression(update.payload.featureId);
                            } else if (update.type === 'SET_FEATURES') {
                                setFeatures(update.payload.features);
                            }
                        }}
                        contextType={FeatureSourceType.Domain}
                        contextId={id === 'new' ? 0 : parseInt(id as string)}
                        parentType="domain"
                        title="Domain Features"
                        emptyMessage="No features added. Click 'Add Feature' to add domain-granted features."
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

            {/* Feature Feature Dialog */}
            <FeatureEditForm
                isOpen={isProgressionDialogOpen}
                onClose={() => {
                    setIsProgressionDialogOpen(false);
                    setEditingProgression(null);
                    setPreSelectedFeature(undefined);
                }}
                featureId={
                    editingProgression?.id
                        ? editingProgression.id
                        : preSelectedFeature?.id
                            ? preSelectedFeature.id
                            : 'new'
                }
                onSave={(feature: Feature, features: FeatureWithRelations[]) => {
                    const featureWithRelations = features[0] || feature as FeatureWithRelations;
                    handleSaveProgression(featureWithRelations);
                }}
                mode="modal"
                context={
                    id && id !== 'new'
                        ? {
                              sourceType: FeatureSourceType.Domain,
                              parentId: parseInt(id),
                              parentType: 'domain'
                          }
                        : undefined
                }
            />
        </div>
    );
}
