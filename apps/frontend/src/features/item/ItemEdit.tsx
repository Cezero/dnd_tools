import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import { AxeSword, ArmorVest } from '@/assets/icons';
import {
    ValidatedForm,
    ValidatedInput,
    CustomCheckbox,
    useValidatedForm
} from '@/components/forms';
import { CustomSelect, CustomSelectMulti } from '@/components/forms/FormComponents';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { ItemQueryHooks } from '@/features/item/ItemQueryHooks';
import { type Weapon, type Armor, CreateItemRequest, UpdateItemRequest, CreateItemSchema, UpdateItemSchema } from '@shared/schema';
import {
    WEAPON_CATEGORY_LIST,
    WEAPON_TYPE_LIST,
    DAMAGE_TYPE_LIST,
    ARMOR_CATEGORY_LIST,
    ITEM_TYPE_LIST,
    SIZE_LIST
} from '@shared/static-data';

import { formatCostAsCurrency, parseCurrencyInput, parseWeightInput } from './utils';

// Type definitions for the form state
type ItemFormData = Omit<CreateItemRequest | UpdateItemRequest, 'weight' | 'cost'> & {
    weight?: string | null; // String for form input
    cost?: string | null; // String for form input
};

export function ItemEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Use imperative API for data fetching and mutations
    const [item, setItem] = useState<unknown | null>(null);
    const [isLoadingItem, setIsLoadingItem] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [itemError, setItemError] = useState<Error | null>(null);
    const fromListParams = location.state?.fromListParams || '';

    // Multi-select state for weapon damage type
    const [selectedDamageTypes, setSelectedDamageTypes] = useState<number[]>([]);
    const [damageTypeLogic, setDamageTypeLogic] = useState<'or' | 'and'>('or');

    // Toggle states for showing weapon/armor sections
    const [showWeaponProperties, setShowWeaponProperties] = useState(false);
    const [showArmorProperties, setShowArmorProperties] = useState(false);

    // Determine which schema to use based on whether we're creating or editing
    const schema = id === 'new' ? CreateItemSchema : UpdateItemSchema;

    // Initialize form data with default values
    const initialFormData: ItemFormData = useMemo(() => ({
        name: '',
        description: '',
        typeId: 3,
        cost: null,
        weight: null,
        sizeId: 5,
        armor: null,
        weapon: null,
        ...(id !== 'new' && { id: parseInt(id) })
    }), [id]);

    const [formData, setFormData] = useState<ItemFormData>(initialFormData);

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

    // Helper functions for damage type string conversion
    const parseDamageTypeString = (damageTypeString: string | null): { values: number[], logic: 'or' | 'and' } => {
        if (!damageTypeString) return { values: [], logic: 'or' };

        if (damageTypeString.includes('&')) {
            const values = damageTypeString.split('&').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
            return { values, logic: 'and' };
        } else if (damageTypeString.includes('|')) {
            const values = damageTypeString.split('|').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
            return { values, logic: 'or' };
        } else {
            const value = parseInt(damageTypeString);
            return { values: isNaN(value) ? [] : [value], logic: 'or' };
        }
    };

    const formatDamageTypeString = (values: number[], logic: 'or' | 'and'): string => {
        if (values.length === 0) return '';
        if (values.length === 1) return values[0].toString();

        const separator = logic === 'and' ? '&' : '|';
        return values.join(separator);
    };

    // Update damage type when multi-select changes
    const handleDamageTypeChange = (values: number[]) => {
        setSelectedDamageTypes(values);
        const damageTypeString = formatDamageTypeString(values, damageTypeLogic);
        setFormData(prev => ({
            ...prev,
            weapon: { ...prev.weapon!, damageType: damageTypeString }
        }));
    };

    const handleDamageTypeLogicChange = (logic: 'or' | 'and') => {
        setDamageTypeLogic(logic);
        const damageTypeString = formatDamageTypeString(selectedDamageTypes, logic);
        setFormData(prev => ({
            ...prev,
            weapon: { ...prev.weapon!, damageType: damageTypeString }
        }));
    };

    // Load item data with imperative API
    useEffect(() => {
        const fetchItem = async () => {
            if (id === 'new') {
                setFormData(initialFormData);
                return;
            }

            try {
                setIsLoadingItem(true);
                setItemError(null);
                const fetchedItem = await ItemQueryHooks.getItemById(parseInt(id!));
                setItem(fetchedItem);

                const itemWithDisplayCost = {
                    ...fetchedItem,
                    cost: fetchedItem.cost ? formatCostAsCurrency(fetchedItem.cost.toString()) : null,
                    weight: fetchedItem.weight !== null ? fetchedItem.weight.toString() : null
                };

                setFormData(itemWithDisplayCost);

                // Set toggle states based on existing data
                setShowWeaponProperties(!!fetchedItem.weapon);
                setShowArmorProperties(!!fetchedItem.armor);

                // Parse damage type string for multi-select
                if (fetchedItem.weapon?.damageType) {
                    const { values, logic } = parseDamageTypeString(fetchedItem.weapon.damageType);
                    setSelectedDamageTypes(values);
                    setDamageTypeLogic(logic);
                }
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Failed to fetch item');
                setItemError(error);
                setError(error.message);
            } finally {
                setIsLoadingItem(false);
            }
        };

        fetchItem();
    }, [id, initialFormData]);

    // Helper functions to check if weapon/armor objects are empty/default
    const isWeaponEmpty = (weapon: Weapon | null): boolean => {
        if (!weapon) return true;
        return (
            weapon.category === 1 &&
            weapon.type === 1 &&
            weapon.attackBonus === null &&
            !weapon.damageSmall &&
            !weapon.damageMedium &&
            !weapon.critical &&
            !weapon.range &&
            !weapon.damageType &&
            !weapon.reach &&
            !weapon.double &&
            !weapon.nonlethal
        );
    };

    const isArmorEmpty = (armor: Armor | null): boolean => {
        if (!armor) return true;
        return (
            armor.category === 1 &&
            armor.bonus === null &&
            armor.dexterityCap === null &&
            armor.checkPenalty === null &&
            armor.arcaneSpellFailure === null &&
            armor.speedCapThirty === null &&
            armor.speedCapTwenty === null
        );
    };

    const HandleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        // Validate the entire form
        if (!form.validation.validateForm(formData)) {
            return;
        }

        try {
            // Prepare data for API submission
            // The Zod schema will handle the string to Decimal conversion
            let submitData = {
                ...formData,
                cost: formData.cost ? parseCurrencyInput(formData.cost) : null,
                weight: typeof formData.weight === 'string' ? parseWeightInput(formData.weight)?.toString() : formData.weight
            };

            // Clean up empty weapon/armor objects
            if (isWeaponEmpty(submitData.weapon)) {
                submitData.weapon = null;
            }
            if (isArmorEmpty(submitData.armor)) {
                submitData.armor = null;
            }

            if (id === 'new') {
                setIsCreating(true);
                const newItem = await ItemQueryHooks.createItem(submitData);
                setMessage('Item created successfully!');
                setTimeout(() => navigate(`/items/${newItem.id}`, { state: { fromListParams: fromListParams, refresh: true } }), 150);
            } else {
                setIsUpdating(true);
                await ItemQueryHooks.updateItem(parseInt(id), submitData);
                setMessage('Item updated successfully!');
                navigate(`/items/${id}`, { state: { fromListParams: fromListParams, refresh: true } });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save item');
        } finally {
            setIsCreating(false);
            setIsUpdating(false);
        }
    };

    // Handle item type change
    const handleTypeChange = (newType: number) => {
        setFormData(prev => ({
            ...prev,
            typeId: newType as number,
            // Clear weapon/armor data when type changes
            weapon: newType === 2 ? (prev.weapon || {
                category: 1,
                type: 1,
                attackBonus: null,
                damageSmall: '',
                damageMedium: '',
                critical: '',
                range: '',
                damageType: '',
                reach: false,
                double: false,
                nonlethal: false
            }) : null,
            armor: newType === 1 ? (prev.armor || {
                category: 1,
                bonus: null,
                dexterityCap: null,
                checkPenalty: null,
                arcaneSpellFailure: null,
                speedCapThirty: null,
                speedCapTwenty: null
            }) : null
        }));

        // Set default visibility based on type
        setShowWeaponProperties(newType === 2);
        setShowArmorProperties(newType === 1);

        // Reset damage type multi-select state when switching to weapon
        if (newType === 2) {
            setSelectedDamageTypes([]);
            setDamageTypeLogic('or');
        }
    };

    // Handle weapon properties toggle
    const handleWeaponToggle = () => {
        const newShowWeapon = !showWeaponProperties;
        setShowWeaponProperties(newShowWeapon);

        // Initialize weapon data if showing and it doesn't exist
        if (newShowWeapon && !formData.weapon) {
            setFormData(prev => ({
                ...prev,
                weapon: {
                    category: 1,
                    type: 1,
                    attackBonus: null,
                    damageSmall: '',
                    damageMedium: '',
                    critical: '',
                    range: '',
                    damageType: '',
                    reach: false,
                    double: false,
                    nonlethal: false
                }
            }));
        }
    };

    // Handle armor properties toggle
    const handleArmorToggle = () => {
        const newShowArmor = !showArmorProperties;
        setShowArmorProperties(newShowArmor);

        // Initialize armor data if showing and it doesn't exist
        if (newShowArmor && !formData.armor) {
            setFormData(prev => ({
                ...prev,
                armor: {
                    category: 1,
                    bonus: null,
                    dexterityCap: null,
                    checkPenalty: null,
                    arcaneSpellFailure: null,
                    speedCapThirty: null,
                    speedCapTwenty: null
                }
            }));
        }
    };

    if (isLoadingItem && !item) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    if (error && !item) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={() => navigate('/items')}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Back to Items
                </button>
            </div>
        );
    }

    if (!item) {
        return <div>No item data available</div>;
    }

    return (
        <div className="w-4/5 mx-auto p-4">
            <div className="mb-4">
                <h1 className="text-3xl font-bold">
                    {id === 'new' ? 'Create New Item' : 'Edit Item'}
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
                isLoading={isLoadingItem}
                formData={formData}
                setFormData={setFormData}
                validation={form.validation}
            >
                {/* Basic Item Information */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="space-y-2">
                        <ValidatedInput
                            field="name"
                            label="Item Name"
                            type="text"
                            required
                            componentExtraClassName='flex items-center gap-2'
                            labelExtraClassName='w-24'
                            inputExtraClassName='w-50'
                            placeholder="e.g., Longsword, Chain Mail, Backpack"
                            data-1p-ignore
                        />
                        <CustomSelect
                            label="Item Type"
                            required
                            componentExtraClassName='flex items-center gap-2'
                            labelExtraClassName='w-24'
                            itemTextExtraClassName='w-36'
                            options={ITEM_TYPE_LIST}
                            value={formData.typeId}
                            onValueChange={handleTypeChange}
                        />

                    </div>
                    <div className='space-y-2'>
                        <ValidatedInput
                            field="weight"
                            label="Weight (lbs)"
                            type="text"
                            placeholder="1/2 or 0.5"
                            componentExtraClassName='flex items-center gap-2'
                            labelExtraClassName='w-24'
                            inputExtraClassName='w-20'
                        />
                        <ValidatedInput
                            field="cost"
                            label="Cost"
                            type="text"
                            componentExtraClassName='flex items-center gap-2'
                            labelExtraClassName='w-24'
                            inputExtraClassName='w-50'
                            placeholder="e.g., 15 gp, 2 sp, 5 cp"
                        />
                        <ValidatedInput
                            field="quantity"
                            label="Quantity"
                            type="number"
                            placeholder="0"
                            componentExtraClassName='flex items-center gap-2'
                            labelExtraClassName='w-24'
                            inputExtraClassName='w-20'
                        />
                        <CustomSelect
                            label="Size"
                            componentExtraClassName='flex items-center gap-2'
                            labelExtraClassName='w-24'
                            itemTextExtraClassName='w-36'
                            options={SIZE_LIST}
                            value={formData.sizeId ?? 5}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, sizeId: value as number }))}
                        />
                    </div>
                </div>

                {/* Property Toggle Buttons */}
                <div className="mb-4 flex gap-4">
                    <button
                        type="button"
                        onClick={handleWeaponToggle}
                    >
                        <AxeSword className={`w-6 h-6 hover:text-blue-500 dark:hover:text-blue-400 ${showWeaponProperties ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                    </button>
                    <button
                        type="button"
                        onClick={handleArmorToggle}
                    >
                        <ArmorVest className={`w-6 h-6 hover:text-blue-500 dark:hover:text-blue-400 ${showArmorProperties ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                    </button>
                </div>

                {/* Weapon Properties */}
                {showWeaponProperties && formData.weapon && (
                    <div className="mb-4 p-4 border rounded-lg dark:border-gray-600">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <CustomSelect
                                    label="Weapon Category"
                                    componentExtraClassName='flex items-center gap-2'
                                    labelExtraClassName='w-36'
                                    itemTextExtraClassName='w-16'
                                    required
                                    options={WEAPON_CATEGORY_LIST}
                                    value={formData.weapon.category}
                                    onValueChange={(value) => setFormData(prev => ({
                                        ...prev,
                                        weapon: { ...prev.weapon!, category: value as number }
                                    }))}
                                />
                                <CustomSelect
                                    label="Weapon Type"
                                    componentExtraClassName='flex items-center gap-2'
                                    labelExtraClassName='w-36'
                                    itemTextExtraClassName='w-38'
                                    required
                                    options={WEAPON_TYPE_LIST}
                                    value={formData.weapon.type}
                                    onValueChange={(value) => setFormData(prev => ({
                                        ...prev,
                                        weapon: { ...prev.weapon!, type: value as number }
                                    }))}
                                />
                                <ValidatedInput
                                    field="weapon.range"
                                    label="Range"
                                    type="text"
                                    placeholder="e.g., 10 ft"
                                    componentExtraClassName='flex items-center gap-2'
                                    labelExtraClassName='w-36'
                                    inputExtraClassName='w-50'
                                    nested
                                />
                                <CustomCheckbox
                                    label="Reach Weapon"
                                    labelPosition='left'
                                    componentExtraClassName='flex items-center gap-2'
                                    labelClassName='w-36'
                                    checked={formData.weapon.reach}
                                    onCheckedChange={(checked) => setFormData(prev => ({
                                        ...prev,
                                        weapon: { ...prev.weapon!, reach: checked }
                                    }))}
                                />
                                <CustomCheckbox
                                    label="Double Weapon"
                                    labelPosition='left'
                                    componentExtraClassName='flex items-center gap-2'
                                    labelClassName='w-36'
                                    checked={formData.weapon.double}
                                    onCheckedChange={(checked) => setFormData(prev => ({
                                        ...prev,
                                        weapon: { ...prev.weapon!, double: checked }
                                    }))}
                                />
                                <ValidatedInput
                                    field="weapon.attackBonus"
                                    label="Attack Bonus"
                                    type="number"
                                    componentExtraClassName='flex items-center gap-2'
                                    labelExtraClassName='w-36'
                                    inputExtraClassName='w-16'
                                    placeholder="0"
                                    nested
                                />
                            </div>
                            <div className="space-y-2">
                                <ValidatedInput
                                    field="weapon.damageSmall"
                                    label="Damage (Small)"
                                    type="text"
                                    placeholder="e.g., 1d4"
                                    componentExtraClassName='flex items-center gap-2'
                                    labelExtraClassName='w-36'
                                    inputExtraClassName='w-24'
                                    nested
                                />
                                <ValidatedInput
                                    field="weapon.damageMedium"
                                    label="Damage (Medium)"
                                    type="text"
                                    placeholder="e.g., 1d6"
                                    componentExtraClassName='flex items-center gap-2'
                                    labelExtraClassName='w-36'
                                    inputExtraClassName='w-24'
                                    nested
                                />
                                <ValidatedInput
                                    field="weapon.critical"
                                    label="Critical"
                                    type="text"
                                    placeholder="e.g., 19-20/x2"
                                    componentExtraClassName='flex items-center gap-2'
                                    labelExtraClassName='w-36'
                                    inputExtraClassName='w-24'
                                    nested
                                />
                                <CustomSelectMulti
                                    label="Damage Type"
                                    selectedValues={selectedDamageTypes}
                                    onSelectedValuesChange={handleDamageTypeChange}
                                    logicType={damageTypeLogic}
                                    onLogicChange={handleDamageTypeLogicChange}
                                    options={DAMAGE_TYPE_LIST}
                                    componentExtraClassName='flex items-center gap-2'
                                    labelExtraClassName='w-36'
                                    itemTextExtraClassName='w-24'
                                    popupExtraClassName='w-36'
                                    placeholder="Select damage types"
                                />
                                <CustomCheckbox
                                    label="Non-Lethal"
                                    labelPosition='left'
                                    componentExtraClassName='flex items-center gap-2'
                                    labelClassName='w-36'
                                    checked={formData.weapon.nonlethal}
                                    onCheckedChange={(checked) => setFormData(prev => ({
                                        ...prev,
                                        weapon: { ...prev.weapon!, nonlethal: checked }
                                    }))}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Armor Properties */}
                {showArmorProperties && formData.armor && (
                    <div className="mb-4 p-4 border rounded-lg dark:border-gray-600">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <CustomSelect
                                    label="Armor Category"
                                    componentExtraClassName='flex items-center gap-2'
                                    labelExtraClassName='w-40'
                                    itemTextExtraClassName='w-16'
                                    required
                                    options={ARMOR_CATEGORY_LIST}
                                    value={formData.armor.category}
                                    onValueChange={(value) => setFormData(prev => ({
                                        ...prev,
                                        armor: { ...prev.armor!, category: value as number }
                                    }))}
                                />
                                <ValidatedInput
                                    field="armor.bonus"
                                    label="Armor Bonus"
                                    componentExtraClassName='flex items-center gap-2'
                                    labelExtraClassName='w-40'
                                    inputExtraClassName='w-50'
                                    type="number"
                                    placeholder="0"
                                    nested
                                />

                                <ValidatedInput
                                    field="armor.dexterityCap"
                                    label="Max Dex Bonus"
                                    type="number"
                                    placeholder="0"
                                    componentExtraClassName='flex items-center gap-2'
                                    labelExtraClassName='w-40'
                                    inputExtraClassName='w-16'
                                    nested
                                />
                                <ValidatedInput
                                    field="armor.checkPenalty"
                                    label="Armor Check Penalty"
                                    type="number"
                                    placeholder="0"
                                    componentExtraClassName='flex items-center gap-2'
                                    labelExtraClassName='w-40'
                                    inputExtraClassName='w-16'
                                    nested
                                />
                            </div>
                            <div className="space-y-2">
                                <ValidatedInput
                                    field="armor.arcaneSpellFailure"
                                    label="Arcane Spell Failure (%)"
                                    type="number"
                                    placeholder="0"
                                    componentExtraClassName='flex items-center gap-2'
                                    labelExtraClassName='w-44'
                                    inputExtraClassName='w-16'
                                    nested
                                />

                                <ValidatedInput
                                    field="armor.speedCapThirty"
                                    label="Speed Cap (30ft base)"
                                    type="number"
                                    placeholder="30"
                                    componentExtraClassName='flex items-center gap-2'
                                    labelExtraClassName='w-44'
                                    inputExtraClassName='w-16'
                                    nested
                                />

                                <ValidatedInput
                                    field="armor.speedCapTwenty"
                                    label="Speed Cap (20ft base)"
                                    type="number"
                                    placeholder="20"
                                    componentExtraClassName='flex items-center gap-2'
                                    labelExtraClassName='w-44'
                                    inputExtraClassName='w-16'
                                    nested
                                />
                            </div>
                        </div>
                    </div>
                )}
                {/* Description */}
                <div className="mb-6">
                    <MarkdownEditor
                        value={formData.description || ''}
                        id="description"
                        label="Description"
                        onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                    />
                    {form.validation.getError('description') && (
                        <span className="text-red-500 text-sm">{form.validation.getError('description')}</span>
                    )}
                </div>
                <div className="flex justify-end space-x-4 mt-8">
                    <button
                        type="button"
                        onClick={() => navigate(`/items${fromListParams ? `?${fromListParams}` : ''}`)}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        disabled={isLoadingItem}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoadingItem || form.validation.validationState.hasErrors}
                    >
                        {isLoadingItem ? 'Saving...' : id === 'new' ? 'Create Item' : 'Update Item'}
                    </button>
                </div>
            </ValidatedForm>
        </div>
    );
} 
