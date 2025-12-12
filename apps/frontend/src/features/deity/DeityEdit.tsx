import { TrashIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import {
    ValidatedForm,
    ValidatedInput,
    useValidatedForm
} from '@/components/forms';
import { CustomSelect } from '@/components/forms/FormComponents';
import { SourceEditor } from '@/components/forms/SourceEditor';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { useCacheFunctions } from '@/services/cache';
import { DeityQueryHooks } from '@/services/query/DeityQueryHooks';
import { ItemQueryHooks } from '@/services/query/ItemQueryHooks';
import { CreateDeityRequest, UpdateDeityRequest, UpdateDeitySchema, CreateDeitySchema } from '@shared/schema';
import { EDITION_LIST, ALIGNMENT_LIST, AlignmentId, EditionId, SourceType, PANTHEON_LIST, ITEM_TYPE_ENUM, CoreComponent } from '@shared/static-data';

// TODO check if the Domain and Weapon queries should be using the cached GetDomainSelectByEdition and GetWeaponSelectByEdition functions

// Type definitions for the form state
type DeityFormData = CreateDeityRequest | UpdateDeityRequest;

export function DeityEdit() {
    const { getClassNameById, getBaseClassSelectByEdition, getRaceNameById, getRaceSelectByEdition, getDomainNameById, getDomainSelectByEdition } = useCacheFunctions();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    // State for race and domain options
    const [raceOptions, setRaceOptions] = useState<CoreComponent[]>([]);
    const [domainOptions, setDomainOptions] = useState<CoreComponent[]>([]);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [weapons, setWeapons] = useState<CoreComponent[]>([]);
    const [availableClasses, setAvailableClasses] = useState<CoreComponent[]>([]);

    // Use imperative API for data fetching and mutations
    const [deityData, setDeityData] = useState<unknown | null>(null);
    const [isLoadingDeity, setIsLoadingDeity] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [deityError, setDeityError] = useState<Error | null>(null);
    const [weaponsData, setWeaponsData] = useState<unknown | null>(null);

    const fromListParams = location.state?.fromListParams || '';

    // Determine which schema to use based on whether we're creating or editing
    const schema = id === 'new' ? CreateDeitySchema : UpdateDeitySchema;

    // Initialize form data with default values
    const initialFormData: DeityFormData = useMemo(() => ({
        name: '',
        title: '',
        alignmentId: AlignmentId.LawfulGood,
        description: '',
        editionId: EditionId.ODND,
        pantheonId: null,
        sourceBookInfo: [],
        classIds: [],
        raceIds: [],
        domainIds: [],
        favoredWeaponIds: [],
        ...(id !== 'new' && { id: parseInt(id) })
    }), [id]);

    const [formData, setFormData] = useState<DeityFormData>(initialFormData);

    // Fetch race and domain options when edition changes
    const fetchOptions = useCallback(async (editionId: number) => {
        setIsLoadingOptions(true);
        try {
            const [races, domains] = await Promise.all([
                getRaceSelectByEdition(editionId),
                getDomainSelectByEdition(editionId)
            ]);
            setRaceOptions(races || []);
            setDomainOptions(domains || []);
        } catch (error) {
            console.error('Failed to fetch options:', error);
            setRaceOptions([]);
            setDomainOptions([]);
        } finally {
            setIsLoadingOptions(false);
        }
    }, [getRaceSelectByEdition, getDomainSelectByEdition]);

    useEffect(() => {
        if (formData.editionId) {
            fetchOptions(formData.editionId);
        }
    }, [formData.editionId, fetchOptions]);

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

    // Load weapons data with imperative API
    useEffect(() => {
        const fetchWeapons = async () => {
            try {
                const weapons = await ItemQueryHooks.itemQuery({
                    requestData: {
                        queryType: 'byType',
                        typeId: ITEM_TYPE_ENUM.Weapon
                    }
                });
                setWeaponsData(weapons);
                if (weapons?.results) {
                    setWeapons(weapons.results);
                }
            } catch (error) {
                console.error('Failed to fetch weapons:', error);
            }
        };
        fetchWeapons();
    }, []);

    // Load available classes when edition changes
    useEffect(() => {
        const classes = getBaseClassSelectByEdition(formData.editionId);
        setAvailableClasses(classes);
    }, [formData.editionId, getBaseClassSelectByEdition]);

    // Load deity data with imperative API
    useEffect(() => {
        const fetchDeity = async () => {
            if (id === 'new') {
                return;
            }

            try {
                setIsLoadingDeity(true);
                setDeityError(null);
                const fetchedDeity = await DeityQueryHooks.getDeityById(parseInt(id!));
                setDeityData(fetchedDeity);

                // Transform the deity data for the form (convert domains/favoredWeapons to IDs)
                const { domains, favoredWeapons, ...deityWithoutRelations } = fetchedDeity;
                const transformedData = {
                    ...deityWithoutRelations,
                    domainIds: domains?.map(d => d.id) || [],
                    favoredWeaponIds: favoredWeapons?.map(fw => fw.id) || [],
                };
                setFormData(transformedData);
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Failed to fetch deity');
                setDeityError(error);
                setError(error.message);
            } finally {
                setIsLoadingDeity(false);
            }
        };

        fetchDeity();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        // Validate the entire form
        if (!form.validation.validateForm(formData)) {
            return;
        }

        try {
            if (id === 'new') {
                setIsCreating(true);
                const response = await DeityQueryHooks.createDeity(formData as CreateDeityRequest);
                setMessage('Deity created successfully');
                navigate(`/deities/${response.id}${fromListParams ? `?${fromListParams}` : ''}`);
            } else {
                setIsUpdating(true);
                await DeityQueryHooks.updateDeity(parseInt(id), formData as UpdateDeityRequest);
                setMessage('Deity updated successfully');
                navigate(`/deities/${id}${fromListParams ? `?${fromListParams}` : ''}`);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save deity');
        } finally {
            setIsCreating(false);
            setIsUpdating(false);
        }
    };

    if (isLoadingDeity && id !== 'new') {
        return (
            <div className="p-4">
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg">Loading deity...</div>
                </div>
            </div>
        );
    }

    if (deityError) {
        return (
            <div className="p-4">
                <div className="text-red-600">Error loading deity: {deityError.message}</div>
            </div>
        );
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">
                {id === 'new' ? 'Create New Deity' : `Edit Deity: ${deityData?.name || ''}`}
            </h1>

            {message && (
                <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                    {message}
                </div>
            )}

            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
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
                                label="Deity Name"
                                type="text"
                                required
                                placeholder="Enter deity name"
                                componentExtraClassName="flex items-center gap-2"
                                labelExtraClassName="w-30"
                                data-1p-ignore
                            />
                        </div>

                        <div>
                            <ValidatedInput
                                field="title"
                                label="Title"
                                type="text"
                                placeholder="e.g., God of War, Goddess of Nature"
                                componentExtraClassName="flex items-center gap-2"
                                labelExtraClassName="w-30"
                            />
                        </div>

                        <div>
                            <CustomSelect
                                label="Alignment"
                                options={ALIGNMENT_LIST}
                                value={formData.alignmentId}
                                onValueChange={(value) => setFormData({ ...formData, alignmentId: value as AlignmentId })}
                                componentExtraClassName="flex items-center gap-2"
                                labelExtraClassName="w-30"
                            />
                        </div>

                        <div>
                            <CustomSelect
                                label="Pantheon"
                                options={PANTHEON_LIST}
                                value={formData.pantheonId}
                                onValueChange={(value) => setFormData({ ...formData, pantheonId: value })}
                                componentExtraClassName="flex items-center gap-2"
                                labelExtraClassName="w-30"
                            />
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">Typical Worshipers</h3>
                            <div className="flex flex-wrap gap-2 mb-2 p-2">
                                {/* Display combined list of classes and races */}
                                {(() => {
                                    const allWorshippers = [
                                        ...(formData.classIds || []).map(id => ({ id, name: getClassNameById(id)?.name || 'Unknown Class', type: 'class' as const })),
                                        ...(formData.raceIds || []).map(id => ({ id, name: getRaceNameById(id)?.name || 'Unknown Race', type: 'race' as const }))
                                    ].sort((a, b) => a.name.localeCompare(b.name));

                                    if (allWorshippers.length === 0) {
                                        return <span className="text-gray-500 dark:text-gray-400">No worshippers added.</span>;
                                    }

                                    return allWorshippers.map((worshipper, index) => (
                                        <span key={`${worshipper.type}-${worshipper.id}`} className="group relative text-sm pt-1 pb-1 pl-0 pr-0 cursor-pointer">
                                            {worshipper.name}
                                            {index < allWorshippers.length - 1 && ','}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (worshipper.type === 'class') {
                                                        const newClassIds = (formData.classIds || []).filter(id => id !== worshipper.id);
                                                        setFormData({ ...formData, classIds: newClassIds });
                                                    } else {
                                                        const newRaceIds = (formData.raceIds || []).filter(id => id !== worshipper.id);
                                                        setFormData({ ...formData, raceIds: newRaceIds });
                                                    }
                                                }}
                                                className="absolute inset-0 flex items-center justify-center text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                title={`Remove ${worshipper.type === 'class' ? 'Class' : 'Race'}`}
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </span>
                                    ));
                                })()}

                                {/* Add Class button */}
                                <CustomSelect
                                    label=""
                                    value={null}
                                    componentExtraClassName="flex items-center gap-1 text-sm"
                                    itemExtraClassName="w-36 text-sm"
                                    itemTextExtraClassName="w-36"
                                    onValueChange={(value) => {
                                        if (value !== null && value !== undefined) {
                                            const newClassIds = [...(formData.classIds || []), value as number];
                                            setFormData({ ...formData, classIds: newClassIds });
                                        }
                                    }}
                                    options={availableClasses
                                        .filter(c => !(formData.classIds || []).includes(c.id))
                                        .sort((a, b) => a.name.localeCompare(b.name))}
                                    placeholder="Add Class"
                                />

                                {/* Add Race button */}
                                <CustomSelect
                                    label=""
                                    value={null}
                                    componentExtraClassName="flex items-center gap-1 text-sm"
                                    itemExtraClassName="w-36 text-sm"
                                    itemTextExtraClassName="w-36"
                                    onValueChange={(value) => {
                                        if (value !== null && value !== undefined) {
                                            const newRaceIds = [...(formData.raceIds || []), value as number];
                                            setFormData({ ...formData, raceIds: newRaceIds });
                                        }
                                    }}
                                    options={raceOptions
                                        .filter(r => !(formData.raceIds || []).includes(r.id))
                                        .sort((a, b) => a.name.localeCompare(b.name))
                                        .map(r => ({ id: r.id, name: r.name }))}
                                    disabled={isLoadingOptions}
                                    placeholder="Add Race"
                                />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">Domains</h3>
                            <div className="flex flex-wrap gap-2 mb-2 p-2">
                                {(formData.domainIds || []).length === 0 && <span className="text-gray-500 dark:text-gray-400">No domains added.</span>}
                                {(formData.domainIds || []).map((domainId, index) => {
                                    const domainData = getDomainNameById(domainId);
                                    return (
                                        <span key={domainId} className="group relative text-sm pt-1 pb-1 pl-0 pr-0 cursor-pointer">
                                            {domainData?.name || 'Unknown Domain'}
                                            {index < (formData.domainIds || []).length - 1 && ','}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newDomainIds = (formData.domainIds || []).filter(id => id !== domainId);
                                                    setFormData({ ...formData, domainIds: newDomainIds });
                                                }}
                                                className="absolute inset-0 flex items-center justify-center text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Remove Domain"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </span>
                                    );
                                })}
                                <CustomSelect
                                    label=""
                                    value={null}
                                    componentExtraClassName="flex items-center gap-1 text-sm"
                                    itemExtraClassName="w-24 text-sm"
                                    itemTextExtraClassName="w-16"
                                    onValueChange={(value) => {
                                        if (value !== null && value !== undefined) {
                                            const newDomainIds = [...(formData.domainIds || []), value as number];
                                            setFormData({ ...formData, domainIds: newDomainIds });
                                        }
                                    }}
                                    options={domainOptions
                                        .filter(d => !(formData.domainIds || []).includes(d.id))
                                        .sort((a, b) => a.name.localeCompare(b.name))
                                        .map(d => ({ id: d.id, name: d.name }))}
                                    disabled={isLoadingOptions}
                                    placeholder="Add"
                                />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">Favored Weapons</h3>
                            <div className="flex flex-wrap gap-2 mb-2 p-2">
                                {(formData.favoredWeaponIds || []).length === 0 && <span className="text-gray-500 dark:text-gray-400">No favored weapons added.</span>}
                                {(formData.favoredWeaponIds || []).map((weaponId, index) => {
                                    const weaponData = weapons.find(w => w.id === weaponId);
                                    return (
                                        <span key={weaponId} className="group relative text-sm pt-1 pb-1 pl-0 pr-0 cursor-pointer">
                                            {weaponData?.name || 'Unknown Weapon'}
                                            {index < (formData.favoredWeaponIds || []).length - 1 && ','}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newFavoredWeaponIds = (formData.favoredWeaponIds || []).filter(id => id !== weaponId);
                                                    setFormData({ ...formData, favoredWeaponIds: newFavoredWeaponIds });
                                                }}
                                                className="absolute inset-0 flex items-center justify-center text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Remove Favored Weapon"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </span>
                                    );
                                })}
                                <CustomSelect
                                    label=""
                                    value={null}
                                    componentExtraClassName="flex items-center gap-1 text-sm"
                                    itemExtraClassName="w-46 text-sm"
                                    itemTextExtraClassName="w-46"
                                    onValueChange={(value) => {
                                        if (value !== null && value !== undefined) {
                                            const newFavoredWeaponIds = [...(formData.favoredWeaponIds || []), value as number];
                                            setFormData({ ...formData, favoredWeaponIds: newFavoredWeaponIds });
                                        }
                                    }}
                                    options={weapons
                                        .filter(w => !(formData.favoredWeaponIds || []).includes(w.id))
                                        .sort((a, b) => a.name.localeCompare(b.name))
                                        .map(w => ({ id: w.id, name: w.name }))}
                                    placeholder="Add"
                                />
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
                                sourceType={SourceType.Deities}
                                sources={formData.sourceBookInfo || []}
                                onSourcesChange={(sources) => setFormData({ ...formData, sourceBookInfo: sources })}
                            />
                        </div>
                    </div>
                </div>
                <div>
                    <MarkdownEditor
                        value={formData.description || ''}
                        onChange={(value) => setFormData({ ...formData, description: value })}
                    />
                </div>
                <div className="flex gap-2 mt-6">
                    <button
                        type="submit"
                        disabled={isCreating || isUpdating}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                    >
                        {isCreating || isUpdating ? 'Saving...' : (id === 'new' ? 'Create Deity' : 'Update Deity')}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Cancel
                    </button>
                </div>
            </ValidatedForm>
        </div>
    );
}
