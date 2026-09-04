import { Dialog } from '@base-ui-components/react/dialog';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

import { isOneHandedMeleeWeapon } from '@/lib/character-calculation/utils/weaponHelpers';
import { ARMOR_CATEGORY_ENUM } from '@shared/static-data';

import type { AttackDefinitionModalProps } from './types';

export function AttackDefinitionModal({
    isOpen,
    onClose,
    onSave,
    attackDefinition,
    character,
    characterItems,
    items = [],
}: AttackDefinitionModalProps): React.JSX.Element {
    const [mainHandCharacterItemId, setMainHandCharacterItemId] = useState<number | null>(null);
    const [offHandCharacterItemId, setOffHandCharacterItemId] = useState<number | null>(null);
    const [wieldTwoHanded, setWieldTwoHanded] = useState(false);
    const [attackSlot, setAttackSlot] = useState<number | null>(null);

    // Track the last attack definition ID we initialized from to avoid unnecessary resets
    const lastInitializedIdRef = useRef<number | null>(null);
    const wasOpenRef = useRef<boolean>(false);

    // Get existing attack definitions to determine which slots are taken
    const existingDefinitions = character?.attackDefinitions || [];
    const takenSlots = useMemo(() => {
        const slots = new Set<number>();
        for (const def of existingDefinitions) {
            if (def && def.attackSlot !== null && def.attackSlot !== undefined) {
                slots.add(def.attackSlot);
                // For dual wield (has off-hand item that is not a shield), also mark the next slot as taken
                if (def.offHandCharacterItemId !== null && def.attackSlot < 7) {
                    // Check if offhand is a shield
                    const offHandCharItem = characterItems.find(ci => ci.id === def.offHandCharacterItemId);
                    const isOffHandShield = offHandCharItem?.baseItemId && items.length > 0
                        ? items.find(i => i.id === offHandCharItem.baseItemId)?.armor?.category === ARMOR_CATEGORY_ENUM.Shield
                        : false;
                    // Only mark slot+1 as taken if it's dual-wield (not a shield)
                    if (!isOffHandShield) {
                        slots.add(def.attackSlot + 1);
                    }
                }
            }
        }
        // Exclude the current definition's slot if editing
        if (attackDefinition && attackDefinition.attackSlot !== null && attackDefinition.attackSlot !== undefined) {
            slots.delete(attackDefinition.attackSlot);
            if (attackDefinition.offHandCharacterItemId !== null && attackDefinition.attackSlot < 7) {
                // Check if offhand is a shield
                const offHandCharItem = characterItems.find(ci => ci.id === attackDefinition.offHandCharacterItemId);
                const isOffHandShield = offHandCharItem?.baseItemId && items.length > 0
                    ? items.find(i => i.id === offHandCharItem.baseItemId)?.armor?.category === ARMOR_CATEGORY_ENUM.Shield
                    : false;
                // Only delete slot+1 if it was marked as taken (i.e., if it was dual-wield)
                if (!isOffHandShield) {
                    slots.delete(attackDefinition.attackSlot + 1);
                }
            }
        }
        return slots;
    }, [existingDefinitions, attackDefinition, characterItems, items]);

    // Helper function to calculate next available slot
    const calculateNextAvailableSlot = useCallback((forDualWield: boolean): number | null => {
        // Helper to check if a slot is available
        const isSlotAvailable = (slot: number, forDualWield: boolean): boolean => {
            if (takenSlots.has(slot)) return false;
            if (forDualWield) {
                if (slot === 7) return false; // Can't use slot 7 for dual wield
                if (takenSlots.has(slot + 1)) return false; // Need slot+1 to be free
            }
            return true;
        };

        // Find the first available slot
        for (let slot = 1; slot <= 7; slot++) {
            if (isSlotAvailable(slot, forDualWield)) {
                return slot;
            }
        }

        return null; // No available slots
    }, [takenSlots]);

    // Helper to check if offhand item is a shield (not a weapon for dual-wield)
    const isOffHandShield = useMemo(() => {
        if (!offHandCharacterItemId || items.length === 0) {
            return false;
        }
        const offHandCharItem = characterItems.find(ci => ci.id === offHandCharacterItemId);
        if (!offHandCharItem?.baseItemId) {
            return false;
        }
        const offHandItem = items.find(i => i.id === offHandCharItem.baseItemId);
        return offHandItem?.armor?.category === ARMOR_CATEGORY_ENUM.Shield;
    }, [offHandCharacterItemId, characterItems, items]);

    const mainHandCatalogItem = useMemo(() => {
        if (!mainHandCharacterItemId || items.length === 0) {
            return undefined;
        }
        const mainHandCharItem = characterItems.find(ci => ci.id === mainHandCharacterItemId);
        if (!mainHandCharItem?.baseItemId) {
            return undefined;
        }
        return items.find(i => i.id === mainHandCharItem.baseItemId);
    }, [mainHandCharacterItemId, characterItems, items]);

    const canWieldTwoHanded = Boolean(
        mainHandCatalogItem
        && isOneHandedMeleeWeapon(mainHandCatalogItem)
        && (offHandCharacterItemId === null || isOffHandShield)
    );

    // Calculate the next available slot
    const nextAvailableSlot = useMemo(() => {
        // Check if we're creating a new attack (not editing)
        const isCreating = !attackDefinition;

        if (!isCreating) {
            return null; // Don't suggest a slot when editing
        }

        // Only treat as dual-wield if offhand is not a shield
        const isDualWield = offHandCharacterItemId !== null && !isOffHandShield;
        return calculateNextAvailableSlot(isDualWield);
    }, [attackDefinition, offHandCharacterItemId, isOffHandShield, calculateNextAvailableSlot]);

    // Filter character items to weapons and shields
    const weaponItems = useMemo(() => {
        if (items.length === 0) {
            return characterItems;
        }
        return characterItems.filter((charItem) => {
            const catalogItem = items.find((item) => item.id === charItem.baseItemId);
            if (!catalogItem) {
                return true;
            }
            return catalogItem.weapon != null
                || catalogItem.armor?.category === ARMOR_CATEGORY_ENUM.Shield;
        });
    }, [characterItems, items]);

    // Initialize form when modal opens or when editing a different attack definition
    useEffect(() => {
        // Only initialize when modal first opens (was closed, now open) or when editing a different definition
        const isOpening = isOpen && !wasOpenRef.current;
        const editingDifferentId = attackDefinition && attackDefinition.id !== lastInitializedIdRef.current;

        if (isOpen && (isOpening || editingDifferentId)) {
            if (attackDefinition) {
                setMainHandCharacterItemId(attackDefinition.mainHandCharacterItemId);
                setOffHandCharacterItemId(attackDefinition.offHandCharacterItemId);
                setWieldTwoHanded(attackDefinition.wieldTwoHanded ?? false);
                setAttackSlot(attackDefinition.attackSlot);
                lastInitializedIdRef.current = attackDefinition.id;
            } else {
                setMainHandCharacterItemId(null);
                setOffHandCharacterItemId(null);
                setWieldTwoHanded(false);
                // Default to next available slot when creating a new attack
                const defaultSlot = calculateNextAvailableSlot(false);
                setAttackSlot(defaultSlot);
                lastInitializedIdRef.current = null;
            }
        }

        // Track modal open state
        wasOpenRef.current = isOpen;

        // Reset refs when modal closes
        if (!isOpen) {
            lastInitializedIdRef.current = null;
        }
    }, [isOpen, attackDefinition, calculateNextAvailableSlot]);

    // Update slot when dual-wield status changes (for new attacks only)
    useEffect(() => {
        // Only update slot if we're creating a new attack (not editing) and slot is currently set
        if (!attackDefinition && attackSlot !== null && nextAvailableSlot !== null) {
            // Check if current slot is still valid
            const isDualWield = offHandCharacterItemId !== null;
            const isCurrentSlotValid = !takenSlots.has(attackSlot) &&
                (!isDualWield || (attackSlot !== 7 && !takenSlots.has(attackSlot + 1)));

            // If current slot is invalid, update to next available
            if (!isCurrentSlotValid) {
                setAttackSlot(nextAvailableSlot);
            }
        }
    }, [offHandCharacterItemId, attackDefinition, attackSlot, nextAvailableSlot, takenSlots]);

    const handleSave = () => {
        // Only treat as dual-wield if offhand is not a shield
        const isDualWield = offHandCharacterItemId !== null && !isOffHandShield;

        // Validation based on items
        if (isDualWield) {
            // Dual wield: both items required and different
            if (!mainHandCharacterItemId || !offHandCharacterItemId) {
                alert('Dual wield requires both main hand and off hand items');
                return;
            }
            if (mainHandCharacterItemId === offHandCharacterItemId) {
                alert('Main hand and off hand items must be different');
                return;
            }
            // Dual wield cannot use slot 7
            if (attackSlot === 7) {
                alert('Dual wield cannot use attack slot 7 (off-hand would need slot 8)');
                return;
            }
            // Check if slot+1 is taken
            if (attackSlot !== null && takenSlots.has(attackSlot + 1)) {
                alert(`Attack slot ${attackSlot + 1} is already occupied (needed for dual wield off-hand)`);
                return;
            }
        } else if (mainHandCharacterItemId === null) {
            // Single weapon: main hand item is required
            alert('Attack requires a main hand item');
            return;
        }

        // Check slot conflicts
        if (attackSlot !== null) {
            if (takenSlots.has(attackSlot)) {
                alert(`Attack slot ${attackSlot} is already occupied`);
                return;
            }
        }

        onSave({
            attackSlot,
            mainHandCharacterItemId,
            offHandCharacterItemId,
            wieldTwoHanded: isDualWield ? false : wieldTwoHanded,
        });
        onClose();
    };

    const isSlotDisabled = (slot: number): boolean => {
        if (takenSlots.has(slot)) return true;
        // For dual wield, also disable if slot+1 is taken
        // Only treat as dual-wield if offhand is not a shield
        const isDualWield = offHandCharacterItemId !== null && !isOffHandShield;
        if (isDualWield) {
            if (slot === 7) return true; // Can't use slot 7 for dual wield
            if (takenSlots.has(slot + 1)) return true;
        }
        return false;
    };

    if (!isOpen) {
        return <></>;
    }

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Backdrop className="fixed inset-0 bg-black bg-opacity-25 z-40" />
            <Dialog.Portal>
                <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl transform overflow-visible rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-800">
                        <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4">
                            {attackDefinition ? 'Edit Attack Definition' : 'Add Attack Definition'}
                        </Dialog.Title>

                        <div className="space-y-4">
                            {/* Main Hand Item */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Main Hand Item *
                                </label>
                                <select
                                    value={mainHandCharacterItemId || ''}
                                    onChange={(e) => setMainHandCharacterItemId(e.target.value ? parseInt(e.target.value, 10) : null)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select an item...</option>
                                    {weaponItems.map(item => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Off Hand Item (optional, for dual wield) */}
                            {mainHandCharacterItemId && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Off Hand Item (optional — weapon for full-attack two-weapon fighting, or shield)
                                    </label>
                                    <select
                                        value={offHandCharacterItemId || ''}
                                        onChange={(e) => setOffHandCharacterItemId(e.target.value ? parseInt(e.target.value, 10) : null)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">None (standard action — no two-weapon penalty)</option>
                                        {weaponItems
                                            .filter(item => item.id !== mainHandCharacterItemId)
                                            .map(item => (
                                                <option key={item.id} value={item.id}>
                                                    {item.name}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            )}

                            {canWieldTwoHanded && (
                                <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={wieldTwoHanded}
                                        onChange={(e) => setWieldTwoHanded(e.target.checked)}
                                        className="mt-0.5"
                                    />
                                    <span>
                                        Wield two-handed (1.5× Strength damage). Use this for a dedicated two-hand grip, not for a standard-action attack.
                                    </span>
                                </label>
                            )}

                            {/* Attack Slot */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Attack Slot
                                </label>
                                <select
                                    value={attackSlot || ''}
                                    onChange={(e) => setAttackSlot(e.target.value ? parseInt(e.target.value, 10) : null)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">None (not displayed on sheet)</option>
                                    {[1, 2, 3, 4, 5, 6, 7].map(slot => (
                                        <option
                                            key={slot}
                                            value={slot}
                                            disabled={isSlotDisabled(slot)}
                                        >
                                            Slot {slot}
                                            {isSlotDisabled(slot) ? ' (occupied)' : ''}
                                        </option>
                                    ))}
                                </select>
                                {offHandCharacterItemId !== null && !isOffHandShield && attackSlot !== null && attackSlot < 7 && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Dual wield will occupy slots {attackSlot} and {attackSlot + 1}
                                    </p>
                                )}
                                {isOffHandShield && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Shield in offhand - single weapon attack (not dual-wield)
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                            >
                                {attackDefinition ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

