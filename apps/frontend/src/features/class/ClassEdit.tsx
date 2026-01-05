import {
    DocumentTextIcon,
    ShieldCheckIcon,
    AcademicCapIcon,
    SparklesIcon,
    BeakerIcon
} from '@heroicons/react/24/outline';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';


import { FeatureProgressionDetailEdit } from '@/components/feature-system';
import { FeatureSystemApi } from '@/components/feature-system/FeatureSystemApi';
import {
    ValidatedForm,
    useValidatedForm,
} from '@/components/forms';
import {
    CreateClassSchema,
    UpdateClassSchema,
    CreateClassRequest,
    UpdateClassRequest,
    BaseClassVariantSchema,
    CreateClassVariantRequest,
    UpdateClassVariantRequest,
    FeatureProgression,
    SpellcastingProgressionWithSlots,
    FeatureEntity,
    ClassVariantFeatureProgressionOverride,
    ClassVariantSpellOverrideCreate
} from '@shared/schema';
import {
    EntityType,
    SpecialFeatureId,
    EntityAppliesToType,
    FeatureSourceType,
} from '@shared/static-data';
import {
    isVariantId,
    extractBaseClassId,
    applyFeatureProgressionOverrides,
    generateFeatureProgressionOverrides
} from '@shared/utils';

import { ClassQueryHooks } from '@/services/query/ClassQueryHooks';

import { ClassApi } from './ClassApi';
import { ClassFeatureAssoc } from './ClassFeatureAssoc';
import { ClassProficiencyService } from './ClassProficiencyService';
import { ClassSkillService } from './ClassSkillService';
import { SpellOverrideTab } from './SpellOverrideTab';
import {
    BasicInfoTab,
    SkillsTab,
    ProficienciesTab,
    FeaturesTab,
    SpellcastingTab,
    DescriptionTab,
    type TabConfig,
    type ClassFormData
} from './tabs';
import { VariantClassApi } from './VariantClassApi';

export default function ClassEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();

    // Check if this is a variant class from ID or user toggle
    const [isVariant, setIsVariant] = useState(() => {
        if (id === 'new') {
            return location.state?.isVariant || false;
        }
        return isVariantId(parseInt(id));
    });
    const [baseClassId, setBaseClassId] = useState<number>(0);
    const [availableBaseClasses, setAvailableBaseClasses] = useState<Array<{ id: number; name: string }>>([]);
    const [cls, setCls] = useState<ClassFormData | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Helper function to create a feature progression with correct source type and classId for variants
     */
    const createFeatureProgression = useCallback((baseProgression: Partial<FeatureProgression>): FeatureProgression => {
        return {
            id: Date.now() + Math.random(), // Temporary ID for frontend
            sourceType: isVariant ? FeatureSourceType.ClassVariant : FeatureSourceType.Class,
            classId: isVariant ? null : parseInt(id || '0'),
            raceId: null,
            domainId: null, // Set domainId to null for class-based progressions
            variantOverrideId: null, // Will be set by backend for variants
            level: 1, // Default to level 1
            ...baseProgression,
        } as FeatureProgression;
    }, [isVariant, id]);
    const [activeTab, setActiveTab] = useState<string>('basic');
    const [isFeatureAssocOpen, setIsFeatureAssocOpen] = useState(false);

    // Base class data (for variants)
    const [baseClassData, setBaseClassData] = useState<{
        features: FeatureProgression[];
        spellcastingProgression: SpellcastingProgressionWithSlots[];
        spellsKnownProgression: SpellcastingProgressionWithSlots[];
    } | null>(null);

    // Variant overrides (for variants) - store with IDs for shared utility, convert to create objects for API
    const [variantOverrides, setVariantOverrides] = useState<{
        featureProgressionOverrides: ClassVariantFeatureProgressionOverride[];
        spellOverrides: ClassVariantSpellOverrideCreate[];
    }>({
        featureProgressionOverrides: [],
        spellOverrides: []
    });

    // Current display data (resolved for variants, direct for base classes)
    const [featureProgressions, setFeatureProgressions] = useState<FeatureProgression[]>([]);
    const [spellcastingProgression, setSpellcastingProgression] = useState<SpellcastingProgressionWithSlots[]>([]);
    const [spellsKnownProgression, setSpellsKnownProgression] = useState<SpellcastingProgressionWithSlots[]>([]);
    const [isProgressionDialogOpen, setIsProgressionDialogOpen] = useState(false);
    const [editingProgression, setEditingProgression] = useState<FeatureProgression | null>(null);
    const [preSelectedFeature, setPreSelectedFeature] = useState<{ id: number; name: string; description: string; slug: string } | undefined>(undefined);

    // Ref to track if we've already processed the newFeature
    const processedNewFeatureRef = useRef<boolean>(false);
    // Ref to track current preSelectedFeature
    const preSelectedFeatureRef = useRef<{ id: number; name: string; description: string; slug: string } | undefined>(undefined);

    // Update ref when preSelectedFeature changes
    useEffect(() => {
        preSelectedFeatureRef.current = preSelectedFeature;
    }, [preSelectedFeature]);

    // Use shared override utilities (no need for local implementations)

    // Use ref to access current variantOverrides without creating dependency
    const variantOverridesRef = useRef(variantOverrides);
    variantOverridesRef.current = variantOverrides;

    // Resolve display data for variants (base class + overrides) - only on initial load
    const resolveDisplayData = useCallback(() => {
        if (!isVariant || !baseClassData) {
            // For base classes, use the current state directly
            return;
        }

        // Set flag to prevent circular updates
        isResolvingDisplayDataRef.current = true;

        // Apply feature overrides to base class features using shared utility
        // The frontend works with objects that have temporary IDs, just like regular class editing
        const resolvedFeatures = applyFeatureProgressionOverrides(
            baseClassData.features,
            variantOverridesRef.current.featureProgressionOverrides
        );

        // TODO: Apply spell additions to spellcasting progression
        // For now, just use base spellcasting data
        const resolvedSpellcasting = baseClassData.spellcastingProgression;
        const resolvedSpellsKnown = baseClassData.spellsKnownProgression;

        // Update the display data
        setFeatureProgressions(resolvedFeatures);
        setSpellcastingProgression(resolvedSpellcasting);
        setSpellsKnownProgression(resolvedSpellsKnown);

        // Clear flag after state updates
        setTimeout(() => {
            isResolvingDisplayDataRef.current = false;
        }, 0);
    }, [isVariant, baseClassData]); // No dependency on variantOverrides to prevent circular updates

    // Only resolve display data when creating a new variant (not when editing existing variants)
    // Existing variants come pre-resolved from the backend
    useEffect(() => {
        if (baseClassData && id === 'new' && isVariant) {
            resolveDisplayData();
        }
    }, [baseClassData, resolveDisplayData, id, isVariant]);


    // Generate feature progression overrides when user makes changes using shared utility
    // Generate override objects based on user changes to the resolved class
    const generateFeatureProgressionOverridesForForm = useCallback((currentFeatures: FeatureProgression[]): ClassVariantFeatureProgressionOverride[] => {
        if (!isVariant || !baseClassData) {
            return [];
        }

        // Use shared utility to generate overrides with temporary IDs
        return generateFeatureProgressionOverrides(baseClassData.features, currentFeatures);
    }, [isVariant, baseClassData]);

    // Update variant overrides when features change (but not when resolving display data)
    const updateVariantOverrides = useCallback(() => {
        if (!isVariant) {
            return;
        }

        const featureProgressionOverrides = generateFeatureProgressionOverridesForForm(featureProgressions);
        setVariantOverrides(prev => ({
            ...prev,
            featureProgressionOverrides
        }));
    }, [isVariant, featureProgressions, generateFeatureProgressionOverridesForForm]);

    // Update overrides when features change, but use a ref to prevent circular updates
    const isResolvingDisplayDataRef = useRef(false);

    useEffect(() => {
        // Don't update overrides if we're currently resolving display data
        if (isResolvingDisplayDataRef.current) {
            return;
        }
        updateVariantOverrides();
    }, [updateVariantOverrides]);

    // Determine which schema to use based on whether we're creating or editing and if it's a variant
    const schema = useMemo(() => {
        return id === 'new'
            ? (isVariant ? BaseClassVariantSchema : CreateClassSchema)
            : (isVariant ? BaseClassVariantSchema : UpdateClassSchema);
    }, [id, isVariant]);

    /**
     * Handles adding a class skill via the feature system.
     */
    const handleAddSkill = useCallback((skillId: number) => {
        ClassSkillService.addSkill(featureProgressions, setFeatureProgressions, skillId, parseInt(id || '0'));
    }, [featureProgressions, setFeatureProgressions, id]);

    /**
     * Handles removing a class skill via the feature system.
     */
    const handleRemoveSkill = useCallback((skillId: number) => {
        ClassSkillService.removeSkill(featureProgressions, setFeatureProgressions, skillId);
    }, [featureProgressions, setFeatureProgressions]);

    /**
     * Handles adding a proficiency via the feature system.
     */
    const handleAddProficiency = useCallback(async (featId: number, itemId: number) => {
        try {
            setFeatureProgressions(prev => {
                // Check if class proficiency progression already exists
                let classProficiencyProgression = prev.find(fp =>
                    fp.featureId === SpecialFeatureId.ClassProficiency
                );

                if (!classProficiencyProgression) {
                    // Create the main class proficiency progression if it doesn't exist
                    classProficiencyProgression = createFeatureProgression({
                        featureId: SpecialFeatureId.ClassProficiency,
                        feature: {
                            id: SpecialFeatureId.ClassProficiency,
                            slug: 'class-proficiency',
                            name: 'Class Proficiency',
                            description: 'Class proficiency feature',
                        },
                        entities: []
                    });
                    prev = [...prev, classProficiencyProgression];
                }

                // Check if this specific proficiency already exists
                const existingProficiency = classProficiencyProgression.entities?.find(e =>
                    e.appliesTo === EntityAppliesToType.Feat &&
                    e.appliesToId === featId &&
                    e.appliesToSubId === itemId
                );

                if (existingProficiency) {
                    return prev;
                }

                // Add the proficiency as an entity
                const newEntity: FeatureEntity = {
                    id: Date.now() + Math.random(),
                    progressionId: classProficiencyProgression.id,
                    type: EntityType.Other,
                    value: 0,
                    appliesTo: EntityAppliesToType.Feat,
                    appliesToId: featId,
                    appliesToSubId: itemId,
                    bonusType: null,
                    filterType: null,
                    groupingId: 1, // Group all class proficiencies together as one feature
                    displayInDetail: true,
                };

                // Create a new array with the updated progression
                return prev.map(p => {
                    if (p.id === classProficiencyProgression.id) {
                        return {
                            ...p,
                            entities: [...(p.entities || []), newEntity]
                        };
                    }
                    return p;
                });
            });
        } catch (error) {
            console.error('Failed to add proficiency:', error);
        }
    }, [createFeatureProgression]);

    /**
     * Handles removing a proficiency via the feature system.
     */
    const handleRemoveProficiency = useCallback((featId: number, itemId: number) => {
        ClassProficiencyService.removeProficiency(featureProgressions, setFeatureProgressions, featId, itemId);
    }, [featureProgressions, setFeatureProgressions]);

    // Initialize form data with default values
    const initialFormData = useMemo((): ClassFormData => ({
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
        spellcastingProgression: [],
        ...(id !== 'new' && { id: parseInt(id) })
    }), [id]);

    const [formData, setFormData] = useState<ClassFormData>(initialFormData);

    // Tab configuration - must be after formData declaration
    const tabs: TabConfig[] = [
        { id: 'basic', label: 'Basic Info', icon: DocumentTextIcon, component: BasicInfoTab },
        ...(formData.canCastSpells ? [{ id: 'spells', label: 'Spellcasting', icon: BeakerIcon, component: SpellcastingTab }] : []),
        ...(isVariant && formData.canCastSpells ? [{ id: 'spellOverrides', label: 'Spell Overrides', icon: BeakerIcon, component: SpellOverrideTab }] : []),
        { id: 'skills', label: 'Skills', icon: ShieldCheckIcon, component: SkillsTab },
        { id: 'proficiencies', label: 'Proficiencies', icon: AcademicCapIcon, component: ProficienciesTab },
        { id: 'features', label: 'Features', icon: SparklesIcon, component: FeaturesTab },
        { id: 'description', label: 'Description', icon: DocumentTextIcon, component: DescriptionTab }
    ];

    const CurrentTabComponent = tabs.find(tab => tab.id === activeTab)?.component;

    /**
     * Handles adding a feature progression to the class.
     */
    const handleAddProgression = useCallback((progression: FeatureProgression) => {
        setFeatureProgressions(prev => {
            // The progression should now include feature data from FeatureProgressionDetailEdit
            // But provide fallback in case it doesn't
            const progressionWithFeature = {
                ...progression,
                feature: progression.feature || {
                    id: progression.featureId,
                    name: preSelectedFeatureRef.current?.name || `Feature ${progression.featureId}`,
                    description: preSelectedFeatureRef.current?.description || '',
                    slug: preSelectedFeatureRef.current?.slug || `feature-${progression.featureId}`,
                }
            };

            // Always add as a new progression - allow multiple progressions per feature/level
            return [...prev, progressionWithFeature];
        });
    }, []); // Remove preSelectedFeature dependency to prevent infinite re-renders

    /**
     * Handles adding a feature to the class by creating a default level 1 progression.
     */
    const handleAddFeature = useCallback(async (feature: { id: number; name: string; description: string; slug: string }) => {
        try {
            // Fetch the feature's existing progressions to copy entities
            const existingProgressions = await FeatureSystemApi.getFeatureProgressions(undefined, { id: feature.id });

            // Find the first progression with entities to copy, or use empty entities
            const sourceProgression = existingProgressions.find(p => p.entities && p.entities.length > 0);
            const entitiesToCopy = sourceProgression?.entities || [];

            const defaultProgression: FeatureProgression = createFeatureProgression({
                featureId: feature.id,
                feature: {
                    id: feature.id,
                    name: feature.name,
                    description: feature.description,
                    slug: feature.slug,
                    prerequisites: sourceProgression?.feature?.prerequisites || []
                },
                entities: entitiesToCopy.map(entity => ({
                    ...entity,
                    id: Date.now() + Math.random(), // New temporary ID
                    progressionId: 0 // Will be set when progression is saved
                }))
            });

            setFeatureProgressions(prev => [...prev, defaultProgression]);
        } catch (error) {
            console.error('Failed to fetch feature progressions:', error);
            // Fallback to creating progression without entities
            const defaultProgression: FeatureProgression = createFeatureProgression({
                featureId: feature.id,
                feature: {
                    id: feature.id,
                    name: feature.name,
                    description: feature.description,
                    slug: feature.slug,
                },
                entities: [],
            });
            setFeatureProgressions(prev => [...prev, defaultProgression]);
        }
    }, [createFeatureProgression]);

    /**
     * Handles the removal of a feature progression from the class.
     */
    const handleRemoveProgression = useCallback((progressionId: number) => {
        setFeatureProgressions(prev => prev.filter(p => p.id !== progressionId));
    }, []);

    /**
     * Handles updating a feature progression.
     */
    const handleUpdateProgression = useCallback((oldProgression: FeatureProgression, updatedProgression: FeatureProgression) => {
        setFeatureProgressions(prev => {
            const progressionIndex = prev.findIndex(p => p.id === oldProgression.id);

            if (progressionIndex === -1) {
                // If we can't find the old progression, just add the new one
                return [...prev, updatedProgression];
            }

            const newFeatureProgressions = [...prev];
            newFeatureProgressions[progressionIndex] = updatedProgression;

            return newFeatureProgressions;
        });
    }, []);

    /**
     * Opens the progression dialog for editing an existing progression.
     */
    const handleEditProgression = useCallback((progression: FeatureProgression) => {
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
                // Use unified API call - backend will determine if it's a variant from the ID
                const fetchedClass = await ClassApi.getClassById(undefined, { id: parseInt(id) });
                setCls(fetchedClass);
                setFormData(fetchedClass);

                if (isVariant) {
                    // For variants, we need to load the base class data and existing overrides
                    const extractedBaseClassId = extractBaseClassId(parseInt(id));
                    setBaseClassId(extractedBaseClassId);

                    // Load base class data
                    const baseClassData = await ClassApi.getClassById(undefined, { id: extractedBaseClassId });
                    setBaseClassData({
                        features: baseClassData.features || [],
                        spellcastingProgression: baseClassData.spellcastingProgression || [],
                        spellsKnownProgression: baseClassData.spellsKnownProgression || []
                    });

                    // Load existing variant overrides
                    const variantData = await VariantClassApi.getVariantById(undefined, { id: parseInt(id) });
                    setVariantOverrides({
                        featureProgressionOverrides: variantData.featureProgressionOverrides || [],
                        spellOverrides: variantData.spellOverrides || []
                    });
                } else {
                    // For base classes, use the data directly
                    setBaseClassData(null);
                    setVariantOverrides({
                        featureProgressionOverrides: [],
                        spellOverrides: []
                    });
                }

                // Load feature progressions from the class data (resolved for variants)
                if (fetchedClass.features) {
                    setFeatureProgressions(fetchedClass.features);
                } else {
                    setFeatureProgressions([]);
                }

                // Load spellcasting progression from the class data
                if (fetchedClass.spellcastingProgression) {
                    setSpellcastingProgression(fetchedClass.spellcastingProgression);
                } else {
                    setSpellcastingProgression([]);
                }

                // Load spells known progression from the class data
                if (fetchedClass.spellsKnownProgression) {
                    setSpellsKnownProgression(fetchedClass.spellsKnownProgression);
                } else {
                    setSpellsKnownProgression([]);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch class');
            } finally {
                setIsLoading(false);
            }
        };

        fetchClass();
    }, [id, initialFormData, isVariant]);

    // Fetch available base classes when working with variants
    useEffect(() => {
        const fetchBaseClasses = async () => {
            if (isVariant) {
                try {
                    const response = await ClassApi.getClasses({
                        baseClassesOnly: true,
                        isVisible: true,
                        isPrestige: false,
                        editionIds: [4, 5] // 3E and 3.5E classes only
                    });
                    const baseClasses = response.results;
                    setAvailableBaseClasses(baseClasses.map(cls => ({ id: cls.id, name: cls.name })));
                } catch (err) {
                    console.error('Failed to fetch base classes:', err);
                }
            }
        };

        fetchBaseClasses();
    }, [isVariant]);

    // Load base class data when baseClassId is selected
    useEffect(() => {
        const loadBaseClassData = async () => {
            if (isVariant && baseClassId > 0 && id === 'new') {
                try {
                    const baseClassData = await ClassApi.getClassById(undefined, { id: baseClassId });
                    // Set form data with base class data, but keep variant-specific fields
                    setFormData({
                        ...baseClassData,
                        name: '', // Clear name so user must enter variant name
                    });

                    // Store base class data separately for variant resolution
                    setBaseClassData({
                        features: baseClassData.features || [],
                        spellcastingProgression: baseClassData.spellcastingProgression || [],
                        spellsKnownProgression: baseClassData.spellsKnownProgression || []
                    });

                    // Reset variant overrides when loading new base class
                    setVariantOverrides({
                        featureProgressionOverrides: [],
                        spellOverrides: []
                    });
                } catch (err) {
                    console.error('Failed to load base class data:', err);
                }
            }
        };

        loadBaseClassData();
    }, [baseClassId, isVariant, id]);

    // Handle new feature from association dialog
    useEffect(() => {
        if (location.state?.newFeature && !processedNewFeatureRef.current) {
            const newFeature = location.state.newFeature;
            processedNewFeatureRef.current = true;

            // Add the new feature progression to the list
            const newProgression: FeatureProgression = createFeatureProgression({
                featureId: newFeature.featureId,
                feature: {
                    id: newFeature.featureId,
                    name: newFeature.name,
                    description: newFeature.description,
                    slug: newFeature.slug,
                },
                entities: [],
            });
            setFeatureProgressions(prev => [...prev, newProgression]);
            // Clear the state
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state?.newFeature, navigate, location.pathname, createFeatureProgression]);

    const HandleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        // Validate the entire form (skip validation for variants as we add required fields later)
        if (!isVariant && !form.validation.validateForm(formData)) {
            setError('Please fix the validation errors before submitting');
            return;
        }

        try {
            setIsLoading(true);
            const {
                features: _features,
                spellcastingProgression: _spellcastingProgression,
                spellsKnownProgression: _spellsKnownProgression,
                isPrestige: _isPrestige,
                canCastSpells: _canCastSpells,
                editionId: _editionId,
                isVisible: _isVisible,
                spellsKnown: _spellsKnown,
                castingAbilityId: _castingAbilityId,
                castingType: _castingType,
                ...createVariantData
            } = formData;
            if (isVariant) {
                // For variants, create variant data with overrides
                const variantData = {
                    ...createVariantData,
                    baseClassId: baseClassId,
                    sourceBookInfo: createVariantData.sourceBookInfo,
                    featureProgressionOverrides: variantOverrides.featureProgressionOverrides.map(override => ({
                        originalFeatureProgressionId: override.originalFeatureProgressionId,
                        removeEntities: override.removeEntities?.map(entity => ({
                            featureEntityId: entity.featureEntityId
                        })) || [],
                        replacementFeatureProgression: override.replacementFeatureProgression?.map(progression => {
                            const { id: _, ...progressionData } = progression;
                            return {
                                ...progressionData,
                                entities: progression.entities?.map(entity => {
                                    const { id: _, progressionId: __, feat: _feat, feature: _feature, item: _item, domain: _domain, ...entityData } = entity;
                                    // Ensure formulaParams is properly structured for backend
                                    if (entityData.formulaParams && entityData.formulaParams.formulaId) {
                                        // Keep the formulaParams data but remove any temporary IDs
                                        const formulaParamsData = { ...entityData.formulaParams };
                                        delete (formulaParamsData as { id?: unknown }).id; // Remove id if it exists
                                        entityData.formulaParams = formulaParamsData;
                                        // Remove formulaParamsId as it will be set by the backend
                                        delete entityData.formulaParamsId;
                                    } else {
                                        // If no formula is selected, remove formulaParams entirely
                                        delete entityData.formulaParams;
                                        delete entityData.formulaParamsId;
                                    }
                                    return entityData;
                                }) || []
                            };
                        }) || []
                    })),
                    spellOverrides: variantOverrides.spellOverrides
                };

                if (id === 'new') {
                    // For variant creation, we need to add baseClassId from the form
                    if (baseClassId === 0) {
                        setError('Please select a base class for the variant');
                        return;
                    }
                    await VariantClassApi.createVariant(variantData as CreateClassVariantRequest);
                    setMessage('Variant class created successfully!');
                    // Invalidate class caches
                    await queryClient.invalidateQueries({ 
                        queryKey: ['classes'],
                        exact: false
                    });
                    setTimeout(() => navigate('/classes'), 1500);
                } else {
                    const numericId = parseInt(id);
                    await VariantClassApi.updateVariant(variantData as UpdateClassVariantRequest, { id: numericId });
                    setMessage('Variant class updated successfully!');
                    // Invalidate class caches
                    await queryClient.invalidateQueries({ 
                        queryKey: ClassQueryHooks.getClassByIdQueryKey(numericId)
                    });
                    await queryClient.invalidateQueries({ 
                        queryKey: ['classes'],
                        exact: false
                    });
                    navigate(`/classes/${id}`, { state: { fromListParams: location.state?.fromListParams, refresh: true, isVariant } });
                }
            } else {
                // For regular classes, prepare the complete class data including feature progressions and spellcasting progression
                const classData = {
                    ...formData,
                    features: featureProgressions.map(prog => {
                        const { id: _, ...progressionData } = prog;
                        return {
                            ...progressionData,
                            // Remove temporary IDs from related entities
                            entities: prog.entities?.map(entity => {
                                const { id: _, progressionId: __, feat: _feat, feature: _feature, item: _item, domain: _domain, ...entityData } = entity;
                                // Ensure formulaParams is properly structured for backend
                                if (entityData.formulaParams && entityData.formulaParams.formulaId) {
                                    // Keep the formulaParams data but remove any temporary IDs
                                    const formulaParamsData = { ...entityData.formulaParams };
                                    delete (formulaParamsData as { id?: unknown }).id; // Remove id if it exists
                                    entityData.formulaParams = formulaParamsData;
                                    // Remove formulaParamsId as it will be set by the backend
                                    delete entityData.formulaParamsId;
                                } else {
                                    // If no formula is selected, remove formulaParams entirely
                                    delete entityData.formulaParams;
                                    delete entityData.formulaParamsId;
                                }
                                // The backend will use appliesToId to link to the actual feat/feature/item
                                // No need to send the related objects
                                return entityData;
                            }) || [],

                        };
                    }),
                    spellcastingProgression: spellcastingProgression.map(prog => {
                        const { id: _, classId: __, ...progressionData } = prog;
                        return {
                            ...progressionData,
                            slots: prog.slots?.map(slot => {
                                const { id: _, progressionId: __, ...slotData } = slot;
                                return slotData;
                            }) || []
                        };
                    }),
                    spellsKnownProgression: spellsKnownProgression.map(prog => {
                        const { id: _, classId: __, ...progressionData } = prog;
                        return {
                            ...progressionData,
                            slots: prog.slots?.map(slot => {
                                const { id: _, progressionId: __, ...slotData } = slot;
                                return slotData;
                            }) || []
                        };
                    })
                };

                if (id === 'new') {
                    const newClass = await ClassApi.createClass(classData as CreateClassRequest);
                    setMessage('Class created successfully!');
                    // Invalidate class caches
                    await queryClient.invalidateQueries({ 
                        queryKey: ['classes'],
                        exact: false
                    });
                    setTimeout(() => navigate(`/classes/${newClass.id}`), 1500);
                } else {
                    const numericId = parseInt(id);
                    await ClassApi.updateClass(classData as UpdateClassRequest, { id: numericId });
                    setMessage('Class updated successfully!');
                    // Invalidate class caches
                    await queryClient.invalidateQueries({ 
                        queryKey: ClassQueryHooks.getClassByIdQueryKey(numericId)
                    });
                    await queryClient.invalidateQueries({ 
                        queryKey: ['classes'],
                        exact: false
                    });
                    navigate(`/classes/${id}`, { state: { fromListParams: location.state?.fromListParams, refresh: true, isVariant } });
                }
            }
        } catch (err) {
            console.error('Error saving class:', err);
            console.error('Error details:', {
                name: err instanceof Error ? err.name : 'Unknown',
                message: err instanceof Error ? err.message : 'Unknown error',
                stack: err instanceof Error ? err.stack : 'No stack trace'
            });

            // Try to extract more detailed error information
            let errorMessage = 'Failed to save class';
            if (err instanceof Error) {
                errorMessage = err.message;
            } else if (typeof err === 'object' && err !== null) {
                // Try to extract error details from response
                const errorObj = err as { response?: { data?: { error?: string } }; message?: string };
                if (errorObj.response?.data?.error) {
                    errorMessage = errorObj.response.data.error;
                } else if (errorObj.message) {
                    errorMessage = errorObj.message;
                }
            }

            setError(errorMessage);
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
                    onClick={() => navigate('/classes')}
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

    // Group progressions by feature for display
    const progressionsByFeature = featureProgressions.reduce((acc, progression) => {
        const featureId = progression.featureId;
        if (!acc[featureId]) {
            acc[featureId] = {
                feature: progression.feature,
                progressions: []
            };
        }
        acc[featureId].progressions.push(progression);
        return acc;
    }, {} as Record<number, { feature: { id: number; name: string; description: string; slug: string }; progressions: FeatureProgression[] }>);

    return (
        <div className="w-4/5 mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">
                    {id === 'new'
                        ? (isVariant ? 'Create New Variant Class' : 'Create New Class')
                        : (isVariant ? 'Edit Variant Class' : 'Edit Class')
                    }
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
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                    {/* Tab Navigation */}
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex space-x-8 px-6">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="bg-white dark:bg-gray-800">
                        {CurrentTabComponent && (
                            <CurrentTabComponent
                                formData={formData}
                                setFormData={setFormData}
                                validation={form.validation}
                                isLoading={isLoading}
                                featureProgressions={featureProgressions}
                                setFeatureProgressions={setFeatureProgressions}
                                spellcastingProgression={spellcastingProgression}
                                setSpellcastingProgression={setSpellcastingProgression}
                                spellsKnownProgression={spellsKnownProgression}
                                setSpellsKnownProgression={setSpellsKnownProgression}
                                isFeatureAssocOpen={isFeatureAssocOpen}
                                setIsFeatureAssocOpen={setIsFeatureAssocOpen}
                                isProgressionDialogOpen={isProgressionDialogOpen}
                                setIsProgressionDialogOpen={setIsProgressionDialogOpen}
                                // Spell override props for variant classes
                                baseClassId={baseClassId}
                                spellOverrides={variantOverrides.spellOverrides}
                                onSpellOverridesUpdate={(overrides) => setVariantOverrides(prev => ({ ...prev, spellOverrides: overrides }))}
                                editingProgression={editingProgression}
                                setEditingProgression={setEditingProgression}
                                preSelectedFeature={preSelectedFeature}
                                setPreSelectedFeature={setPreSelectedFeature}
                                onRemoveProgression={handleRemoveProgression}
                                onAddFeature={handleAddFeature}
                                onEditProgression={handleEditProgression}
                                onAddSkill={handleAddSkill}
                                onRemoveSkill={handleRemoveSkill}
                                onAddProficiency={handleAddProficiency}
                                onRemoveProficiency={handleRemoveProficiency}
                                classId={id !== 'new' ? parseInt(id) : undefined}
                                // Variant-specific props
                                isVariant={isVariant}
                                setIsVariant={setIsVariant}
                                setBaseClassId={setBaseClassId}
                                availableBaseClasses={availableBaseClasses}
                            />
                        )}
                    </div>
                </div>

                <div className="flex justify-end space-x-4 mt-8">
                    <button
                        type="button"
                        onClick={() => navigate('/classes')}
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
                        {isLoading ? 'Saving...' : id === 'new'
                            ? (isVariant ? 'Create Variant' : 'Create Class')
                            : (isVariant ? 'Update Variant' : 'Update Class')
                        }
                    </button>
                </div>
            </ValidatedForm>

            {/* Class Feature Association Dialog */}
            <ClassFeatureAssoc
                isOpen={isFeatureAssocOpen}
                onClose={() => setIsFeatureAssocOpen(false)}
                onSave={(_selectedFeatures) => {
                    // The SharedFeaturesTab component handles the change detection logic
                    // This onSave handler is not used - the actual logic is in FeaturesTab.tsx
                    console.warn('ClassEdit onSave handler called but not used - change detection handled by SharedFeaturesTab');
                    setIsFeatureAssocOpen(false);
                }}
                initialSelectedFeatureIds={Object.keys(progressionsByFeature)
                    .map(id => parseInt(id))
                    .filter(featureId =>
                        featureId !== SpecialFeatureId.ClassSkill &&
                        featureId !== SpecialFeatureId.ClassProficiency
                    )}
                classId={id !== 'new' ? parseInt(id) : undefined}
            />

            {/* Feature Progression Dialog */}
            <FeatureProgressionDetailEdit
                isOpen={isProgressionDialogOpen}
                onClose={() => {
                    setIsProgressionDialogOpen(false);
                    setPreSelectedFeature(undefined);
                }}
                progression={editingProgression}
                onSave={(progression) => {
                    if (editingProgression) {
                        handleUpdateProgression(editingProgression, progression);
                    } else {
                        handleAddProgression(progression);
                    }
                    setIsProgressionDialogOpen(false);
                    setPreSelectedFeature(undefined);
                }}
                preSelectedFeature={preSelectedFeature}
                showSourceTypeSelector={false}
            />
        </div>
    );
}
