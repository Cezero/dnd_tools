import { PreviewCard } from '@base-ui-components/react/preview-card';
import React from 'react';

import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { formatCostAsCurrency } from '@/features/item/utils';
import { ItemQueryHooks } from '@/services/query/ItemQueryHooks';
import { WEAPON_CATEGORIES, WEAPON_TYPES, DAMAGE_TYPES, ARMOR_CATEGORIES } from '@shared/static-data';

import type { ItemTooltipProps } from './types';

export function ItemTooltip({ itemId, children, href: _href }: ItemTooltipProps): React.JSX.Element {
    const [isOpen, setIsOpen] = React.useState(false);

    // Fetch item data with lazy loading (only enabled when tooltip is open)
    const { data: item, isLoading } = ItemQueryHooks.useGetItemById(
        { pathParams: { id: itemId } },
        { enabled: isOpen }
    );

    return (
        <PreviewCard.Root open={isOpen} onOpenChange={setIsOpen}>
            <PreviewCard.Trigger
                render={(props) => {
                    if (React.isValidElement(children)) {
                        return React.cloneElement(children, props);
                    }
                    return <span {...props}>{children}</span>;
                }}
            />
            <PreviewCard.Portal>
                <PreviewCard.Positioner sideOffset={8}>
                    <PreviewCard.Popup className="max-w-md p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                        {isLoading ? (
                            <div className="p-4">Loading item...</div>
                        ) : item ? (
                            <div className="max-h-96 overflow-y-auto space-y-3">
                                <div className="flex flex-col">
                                    <h3 className="text-lg font-bold mb-1">{item.name}</h3>
                                    <div className="text-sm italic text-gray-600 dark:text-gray-400">
                                        {item.weapon && (
                                            <div>
                                                {WEAPON_CATEGORIES[item.weapon.category]?.name.toLowerCase() || 'Unknown'}{' '}
                                                {WEAPON_TYPES[item.weapon.type]?.name.toLowerCase() || 'Unknown'}
                                                {item.weapon.reach ? ' (reach)' : ''}
                                            </div>
                                        )}
                                        {item.armor && (
                                            <div>{ARMOR_CATEGORIES[item.armor.category]?.name.toLowerCase() || 'Unknown'}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">Cost:</span>
                                        <span>{formatCostAsCurrency(item.cost?.toString())}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">Weight:</span>
                                        <span>
                                            {item.weight !== null
                                                ? `${item.weight.toString()}${parseFloat(item.weight.toString()) === 1 ? ' lb.' : ' lbs.'}`
                                                : '-'}
                                        </span>
                                    </div>
                                    {item.quantity && (
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">Quantity:</span>
                                            <span>{item.quantity}</span>
                                        </div>
                                    )}
                                </div>
                                {item.weapon && (
                                    <div className="space-y-2 text-sm">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-semibold">Damage (M):</span>
                                                <span>
                                                    {item.weapon.damageMedium} ({item.weapon.critical}){' '}
                                                    {DAMAGE_TYPES[parseInt(item.weapon.damageType)]?.name.toLowerCase()}
                                                    {item.weapon.nonlethal && <span className="italic"> (non-lethal)</span>}
                                                    {item.weapon.double && <span className="italic"> (double)</span>}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="font-semibold">Damage (S):</span>
                                                <span>
                                                    {item.weapon.damageSmall} ({item.weapon.critical}){' '}
                                                    {DAMAGE_TYPES[parseInt(item.weapon.damageType)]?.name.toLowerCase()}
                                                    {item.weapon.nonlethal && <span className="italic"> (non-lethal)</span>}
                                                    {item.weapon.double && <span className="italic"> (double)</span>}
                                                </span>
                                            </div>
                                        </div>
                                        {item.weapon.range && (
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">Range Increment:</span>
                                                <span>{item.weapon.range} ft.</span>
                                            </div>
                                        )}
                                        {item.weapon.attackBonus && (
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">Attack Bonus:</span>
                                                <span>
                                                    {item.weapon.attackBonus > 0 ? '+' : ''}
                                                    {item.weapon.attackBonus}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {item.armor && (
                                    <div className="text-sm">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1">
                                                {item.armor.bonus !== null && (
                                                    <div>
                                                        <span className="font-semibold">Armor Bonus:</span> +{item.armor.bonus}
                                                    </div>
                                                )}
                                                {item.armor.dexterityCap !== null && (
                                                    <div>
                                                        <span className="font-semibold">Dexterity Cap:</span> +{item.armor.dexterityCap}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                {item.armor.checkPenalty !== null && (
                                                    <div>
                                                        <span className="font-semibold">Check Penalty:</span> {item.armor.checkPenalty}
                                                    </div>
                                                )}
                                                {item.armor.arcaneSpellFailure !== null && (
                                                    <div>
                                                        <span className="font-semibold">Arcane Spell Failure:</span>{' '}
                                                        {item.armor.arcaneSpellFailure}%
                                                    </div>
                                                )}
                                                {item.armor.speedCapThirty !== null && (
                                                    <div>
                                                        <span className="font-semibold">Speed Cap (30ft):</span> {item.armor.speedCapThirty}ft
                                                    </div>
                                                )}
                                                {item.armor.speedCapTwenty !== null && (
                                                    <div>
                                                        <span className="font-semibold">Speed Cap (20ft):</span> {item.armor.speedCapTwenty}ft
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {item.description && (
                                    <div className="text-sm">
                                        <ProcessMarkdown markdown={item.description} id={`item-${itemId}-description`} />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 text-red-600 dark:text-red-400">Failed to load item</div>
                        )}
                    </PreviewCard.Popup>
                </PreviewCard.Positioner>
            </PreviewCard.Portal>
        </PreviewCard.Root>
    );
}
