import { Dialog } from '@base-ui-components/react/dialog';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { AttackDefinition } from '@/features/character/types';
import type { CharacterItem as CharacterItemSchema } from '@shared/schema';
import type { CharacterWithAllDetailsResponse } from '@shared/schema';

interface AttackDefinitionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (definition: Omit<AttackDefinition, 'id'>) => void;
    attackDefinition?: AttackDefinition | null;
    character: CharacterWithAllDetailsResponse;
    characterItems: CharacterItemSchema[];
}

export function AttackDefinitionModal({
    isOpen,
    onClose,
    onSave,
    attackDefinition,
    character,
    characterItems,
}: AttackDefinitionModalProps): React.JSX.Element {
    const [mainHandCharacterItemId, setMainHandCharacterItemId] = useState<number | null>(null);
    const [offHandCharacterItemId, setOffHandCharacterItemId] = useState<number | null>(null);
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
                // For dual wield (has off-hand item), also mark the next slot as taken
                if (def.offHandCharacterItemId !== null && def.attackSlot < 7) {
                    slots.add(def.attackSlot + 1);
                }
            }
        }
        // Exclude the current definition's slot if editing
        if (attackDefinition && attackDefinition.attackSlot !== null && attackDefinition.attackSlot !== undefined) {
            slots.delete(attackDefinition.attackSlot);
            if (attackDefinition.offHandCharacterItemId !== null && attackDefinition.attackSlot < 7) {
                slots.delete(attackDefinition.attackSlot + 1);
            }
        }
        return slots;
    }, [existingDefinitions, attackDefinition]);

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

    // Calculate the next available slot
    const nextAvailableSlot = useMemo(() => {
        // Check if we're creating a new attack (not editing)
        const isCreating = !attackDefinition;

        if (!isCreating) {
            return null; // Don't suggest a slot when editing
        }

        const isDualWield = offHandCharacterItemId !== null;
        return calculateNextAvailableSlot(isDualWield);
    }, [attackDefinition, offHandCharacterItemId, calculateNextAvailableSlot]);

    // Filter character items to only weapons (for main hand and off hand)
    const weaponItems = useMemo(() => {
        return characterItems.filter(item => {
            // Find the base item to check if it's a weapon
            // For now, we'll include all items - the backend will validate
            return true;
        });
    }, [characterItems]);

    // Initialize form when modal opens or when editing a different attack definition
    useEffect(() => {
        // Only initialize when modal first opens (was closed, now open) or when editing a different definition
        const isOpening = isOpen && !wasOpenRef.current;
        const editingDifferentId = attackDefinition && attackDefinition.id !== lastInitializedIdRef.current;

        if (isOpen && (isOpening || editingDifferentId)) {
            if (attackDefinition) {
                setMainHandCharacterItemId(attackDefinition.mainHandCharacterItemId);
                setOffHandCharacterItemId(attackDefinition.offHandCharacterItemId);
                setAttackSlot(attackDefinition.attackSlot);
                lastInitializedIdRef.current = attackDefinition.id;
            } else {
                setMainHandCharacterItemId(null);
                setOffHandCharacterItemId(null);
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
        const isDualWield = offHandCharacterItemId !== null;

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
        });
        onClose();
    };

    const isSlotDisabled = (slot: number): boolean => {
        if (takenSlots.has(slot)) return true;
        // For dual wield, also disable if slot+1 is taken
        const isDualWield = offHandCharacterItemId !== null;
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
                                        Off Hand Item (optional, for dual wield)
                                    </label>
                                    <select
                                        value={offHandCharacterItemId || ''}
                                        onChange={(e) => setOffHandCharacterItemId(e.target.value ? parseInt(e.target.value, 10) : null)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">None (single weapon)</option>
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
                                {offHandCharacterItemId !== null && attackSlot !== null && attackSlot < 7 && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Dual wield will occupy slots {attackSlot} and {attackSlot + 1}
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

