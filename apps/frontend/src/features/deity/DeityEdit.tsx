import { TrashIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import {
    ValidatedForm,
    ValidatedInput,
    useValidatedForm
} from '@/components/forms';
import { CustomSelect } from '@/components/forms/FormComponents';
import { SourceEditor } from '@/components/forms/SourceEditor';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { DomainApi } from '@/features/domain/DomainApi';
import { ItemApi } from '@/features/item/ItemApi';
import { RaceApi } from '@/features/race/RaceApi';
import { CreateDeityRequest, UpdateDeityRequest, UpdateDeitySchema, CreateDeitySchema } from '@shared/schema';
import { EDITION_SELECT_LIST_FULL, ALIGNMENT_SELECT_LIST, AlignmentId, EDITION_IDS, SourceType, PANTHEON_SELECT_LIST, ITEM_TYPE_ENUM, GetBaseClassesByEdition, CLASS_MAP } from '@shared/static-data';

import { DeityApi } from './DeityApi';

// Type definitions for the form state
type DeityFormData = CreateDeityRequest | UpdateDeityRequest;

export function DeityEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [deity, setDeity] = useState<DeityFormData | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [domains, setDomains] = useState<{ id: number; name: string }[]>([]);
    const [weapons, setWeapons] = useState<{ id: number; name: string }[]>([]);
    const [races, setRaces] = useState<{ id: number; name: string }[]>([]);

    const fromListParams = location.state?.fromListParams || '';

    // Determine which schema to use based on whether we're creating or editing
    const schema = id === 'new' ? CreateDeitySchema : UpdateDeitySchema;

    // Initialize form data with default values
    const initialFormData: DeityFormData = useMemo(() => ({
        name: '',
        title: '',
        alignmentId: AlignmentId.LawfulGood,
        description: '',
        editionId: EDITION_IDS.ODND,
        pantheonId: null,
        sourceBookInfo: [],
        classIds: [],
        raceIds: [],
        domainIds: [],
        favoredWeaponIds: [],
        ...(id !== 'new' && { id: parseInt(id) })
    }), [id]);

    const [formData, setFormData] = useState<DeityFormData>(initialFormData);

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
        const fetchData = async () => {
            try {
                setIsLoading(true);

                // Fetch domains, weapons, and races in parallel
                const [domainsResponse, weaponsResponse, racesResponse] = await Promise.all([
                    DomainApi.getDomains({}),
                    ItemApi.itemQuery({
                        queryType: 'byType',
                        typeId: ITEM_TYPE_ENUM.Weapon
                    }),
                    RaceApi.getRaces({})
                ]);

                setDomains(domainsResponse.results.map(d => ({ id: d.id, name: d.name })));
                setWeapons(weaponsResponse.results.map(w => ({ id: w.id, name: w.name })));
                setRaces(racesResponse.results.map(r => ({ id: r.id, name: r.name })));

                // Fetch deity if editing
                if (id === 'new') {
                    setDeity(initialFormData);
                } else {
                    const fetchedDeity = await DeityApi.getDeityById(undefined, { id: parseInt(id) });
                    setDeity(fetchedDeity);

                    // Transform the deity data for the form (convert domains/favoredWeapons to IDs)
                    const { domains, favoredWeapons, ...deityWithoutRelations } = fetchedDeity;
                    const formData = {
                        ...deityWithoutRelations,
                        domainIds: domains?.map(d => d.id) || [],
                        favoredWeaponIds: favoredWeapons?.map(fw => fw.id) || [],
                    };
                    setFormData(formData);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
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

            if (id === 'new') {
                const response = await DeityApi.createDeity(formData as CreateDeityRequest);
                setMessage('Deity created successfully');
                navigate(`/deities/${response.id}${fromListParams ? `?${fromListParams}` : ''}`);
            } else {
                await DeityApi.updateDeity(formData as UpdateDeityRequest, { id: parseInt(id) });
                setMessage('Deity updated successfully');
                navigate(`/deities/${id}${fromListParams ? `?${fromListParams}` : ''}`);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save deity');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && id !== 'new') {
        return (
            <div className="p-4">
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg">Loading deity...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">
                {id === 'new' ? 'Create New Deity' : `Edit Deity: ${deity?.name || ''}`}
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
                                options={ALIGNMENT_SELECT_LIST}
                                value={formData.alignmentId}
                                onValueChange={(value) => setFormData({ ...formData, alignmentId: value })}
                                componentExtraClassName="flex items-center gap-2"
                                labelExtraClassName="w-30"
                            />
                        </div>

                        <div>
                            <CustomSelect
                                label="Pantheon"
                                options={PANTHEON_SELECT_LIST}
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
                                        ...(formData.classIds || []).map(id => ({ id, name: CLASS_MAP[id]?.name || 'Unknown Class', type: 'class' as const })),
                                        ...(formData.raceIds || []).map(id => ({ id, name: races.find(r => r.id === id)?.name || 'Unknown Race', type: 'race' as const }))
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
                                    options={GetBaseClassesByEdition(formData.editionId)
                                        .filter(c => !(formData.classIds || []).includes(c.value))
                                        .sort((a, b) => a.label.localeCompare(b.label))
                                        .map(c => ({ value: c.value, label: c.label }))}
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
                                    options={races
                                        .filter(r => !(formData.raceIds || []).includes(r.id))
                                        .sort((a, b) => a.name.localeCompare(b.name))
                                        .map(r => ({ value: r.id, label: r.name }))}
                                    placeholder="Add Race"
                                />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">Domains</h3>
                            <div className="flex flex-wrap gap-2 mb-2 p-2">
                                {(formData.domainIds || []).length === 0 && <span className="text-gray-500 dark:text-gray-400">No domains added.</span>}
                                {(formData.domainIds || []).map((domainId, index) => {
                                    const domainData = domains.find(d => d.id === domainId);
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
                                    options={domains
                                        .filter(d => !(formData.domainIds || []).includes(d.id))
                                        .sort((a, b) => a.name.localeCompare(b.name))
                                        .map(d => ({ value: d.id, label: d.name }))}
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
                                        .map(w => ({ value: w.id, label: w.name }))}
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
                                options={EDITION_SELECT_LIST_FULL}
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
                        disabled={isLoading}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                    >
                        {isLoading ? 'Saving...' : (id === 'new' ? 'Create Deity' : 'Update Deity')}
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
