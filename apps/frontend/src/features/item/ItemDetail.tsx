import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { DetailPage } from '@/components/common/DetailPage';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { ItemWithDetails } from '@shared/schema';
import {
    WEAPON_CATEGORIES,
    WEAPON_TYPES,
    DAMAGE_TYPES,
    ARMOR_CATEGORIES
} from '@shared/static-data';

import { ItemApi } from './ItemApi';
import { formatCostAsCurrency } from './utils';

export function ItemDetail(): React.JSX.Element {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAdmin, isLoading: isAuthLoading } = useAuthAuto();
    const [item, setItem] = useState<ItemWithDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const fetchItem = async () => {
            if (!id) return;

            try {
                setIsLoading(true);
                const fetchedItem = await ItemApi.getItemById(undefined, { id: parseInt(id) });
                setItem(fetchedItem);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch item');
            } finally {
                setIsLoading(false);
            }
        };

        fetchItem();
    }, [id]);

    const handleBack = () => {
        navigate(`/items${fromListParams ? `?${fromListParams}` : ''}`);
    };

    const handleEdit = () => {
        navigate(`/items/${id}/edit`, { state: { fromListParams: fromListParams } });
    };

    if (error) {
        return (
            <div className="p-4">
                <div className="text-red-500 mb-4">{error}</div>
                <button
                    onClick={handleBack}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Back to Items
                </button>
            </div>
        );
    }

    return (
        <DetailPage
            isLoading={isAuthLoading || isLoading}
            item={item}
            itemName="Item"
            isAdmin={isAdmin}
            onBack={handleBack}
            onEdit={handleEdit}
        >
            <div className="flex flex-col mb-2">
                <h1 className="text-2xl font-bold mb-2">{item!.name}</h1>
                <div className="text-lg italic">
                    {item!.weapon && (
                        <div>{WEAPON_CATEGORIES[item!.weapon.category]?.name.toLowerCase() || 'Unknown'} {WEAPON_TYPES[item!.weapon.type]?.name.toLowerCase() || 'Unknown'} {item!.weapon.reach ? '(reach)' : ''}</div>
                    )}
                    {item!.armor && (
                        <div>{ARMOR_CATEGORIES[item!.armor.category]?.name.toLowerCase() || 'Unknown'}</div>
                    )}
                </div>
            </div>
            <div className="mb-2">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2"><div className="font-semibold">Cost:</div> {formatCostAsCurrency(item!.cost?.toString())}</div>
                    <div className="flex items-center gap-2"><div className="font-semibold">Weight:</div> {item!.weight !== null ? `${item!.weight.toString()}` + (parseFloat(item!.weight.toString()) === 1 ? ' lb.' : ' lbs.') : '-'}</div>
                    {item!.quantity && (<div className="flex items-center gap-2"><div className="font-semibold">Quantity:</div> {item!.quantity}</div>)}
                </div>
            </div>
            {/* Weapon Details */}
            {item!.weapon && (
                <div className="mb-4 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                            <div className="font-semibold">Damage (M):</div>
                            {item!.weapon.damageMedium} ({item!.weapon.critical}) {DAMAGE_TYPES[parseInt(item!.weapon.damageType)]?.name.toLowerCase()}
                            {item!.weapon.nonlethal ? <div className="italic"> (non-lethal)</div> : ''}
                            {item!.weapon.double ? <div className="italic"> (double)</div> : ''}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="font-semibold">Damage (S):</div>
                            {item!.weapon.damageSmall} ({item!.weapon.critical}) {DAMAGE_TYPES[parseInt(item!.weapon.damageType)]?.name.toLowerCase()}
                            {item!.weapon.nonlethal ? <div className="italic"> (non-lethal)</div> : ''}
                            {item!.weapon.double ? <div className="italic"> (double)</div> : ''}
                        </div>
                    </div>
                    {item!.weapon.range && (<div className="flex items-center gap-2"><div className="font-semibold">Range Increment:</div>{item!.weapon.range} ft.</div>)}
                    {item!.weapon.attackBonus && (<div className="flex items-center gap-2"><div className="font-semibold">Attack Bonus:</div>{item!.weapon.attackBonus > 0 ? '+' : ''}{item!.weapon.attackBonus}</div>)}
                </div>
            )}

            {/* Armor Details */}
            {item!.armor && (
                <div className="mb-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            {item!.armor.bonus !== null && (
                                <p><strong>Armor Bonus:</strong> +{item!.armor.bonus}</p>
                            )}
                            {item!.armor.dexterityCap !== null && (
                                <p><strong>Dexterity Cap:</strong> +{item!.armor.dexterityCap}</p>
                            )}
                        </div>
                        <div>
                            {item!.armor.checkPenalty !== null && (
                                <p><strong>Check Penalty:</strong> {item!.armor.checkPenalty}</p>
                            )}
                            {item!.armor.arcaneSpellFailure !== null && (
                                <p><strong>Arcane Spell Failure:</strong> {item!.armor.arcaneSpellFailure}%</p>
                            )}
                            {item!.armor.speedCapThirty !== null && (
                                <p><strong>Speed Cap (30ft):</strong> {item!.armor.speedCapThirty}ft</p>
                            )}
                            {item!.armor.speedCapTwenty !== null && (
                                <p><strong>Speed Cap (20ft):</strong> {item!.armor.speedCapTwenty}ft</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {item!.description && (
                <div className="mb-6">
                    <ProcessMarkdown markdown={item!.description} id="description" />
                </div>
            )}
        </DetailPage>
    );
} 
