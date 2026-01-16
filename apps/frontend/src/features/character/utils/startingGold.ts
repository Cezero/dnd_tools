import React, { useCallback, useRef } from 'react';

import { useDiceBox } from '@/components/dice-box';
import type { LocalDiceRollResult } from '@/components/dice-box/types';
import { useCacheFunctions } from '@/services/cache';
import { STARTING_GOLD_TABLE } from '@shared/static-data';

import { convertGpToMoney } from './moneyUtils';

/**
 * Normalize class name for lookup (lowercase, trim)
 * 
 * Helper function used by the useStartingGold hook to match class names
 * against the STARTING_GOLD_TABLE keys.
 * 
 * @param name - The class name to normalize
 * @returns Normalized class name (lowercase, trimmed)
 */
function normalizeClassName(name: string): string {
    return name.toLowerCase().trim();
}

/**
 * Parse dice notation with optional multiplier
 * 
 * Parses dice notation strings from STARTING_GOLD_TABLE into dice and multiplier components.
 * Examples: "4d4 × 10" -> { dice: "4d4", multiplier: 10 }
 *          "5d4" -> { dice: "5d4", multiplier: 1 }
 * 
 * @param notation - The dice notation string to parse
 * @returns Object with dice string and multiplier number
 */
function parseDiceNotation(notation: string): { dice: string; multiplier: number } {
    const trimmed = notation.trim();
    const multiplierMatch = trimmed.match(/×\s*(\d+)$/);

    if (multiplierMatch) {
        const multiplier = parseInt(multiplierMatch[1], 10);
        const dice = trimmed.substring(0, multiplierMatch.index).trim();
        return { dice, multiplier };
    }

    return { dice: trimmed, multiplier: 1 };
}

/**
 * Hook to generate random starting gold for a character based on their class.
 * 
 * Uses dice utilities to roll the dice and returns the result in gold pieces.
 * The starting gold table is defined in @shared/static-data (STARTING_GOLD_TABLE).
 * 
 * **Frontend-only utility**: This hook is used only in the frontend for generating
 * starting gold when creating new characters.
 * 
 * @returns Object with:
 * - `generateRandomGold`: Function to generate random gold for a class
 * - `convertGpToMoney`: Helper to convert gold pieces to Money object
 * - `isReady`: Boolean indicating if dice box is ready
 * 
 * @see STARTING_GOLD_TABLE - Starting gold table in @shared/static-data
 */
export function useStartingGold() {
    const { rollDice, onRollComplete, isReady } = useDiceBox();
    const { getClassSummaryById } = useCacheFunctions();
    const isRollPendingRef = useRef(false);
    const resolveRef = useRef<((value: number) => void) | null>(null);
    const rejectRef = useRef<((error: Error) => void) | null>(null);

    // Store multiplier for current roll
    const multiplierRef = useRef<number>(1);
    const unsubscribeRef = useRef<(() => void) | null>(null);

    // Set up roll complete callback once
    React.useEffect(() => {
        const unsubscribe = onRollComplete((result: LocalDiceRollResult | LocalDiceRollResult[]) => {
            if (!isRollPendingRef.current) {
                return;
            }

            const results = Array.isArray(result) ? result : [result];
            const goldResult = results.find(r => r.group?.startsWith('starting-gold'));

            if (goldResult) {
                isRollPendingRef.current = false;
                const resolve = resolveRef.current;
                const reject = rejectRef.current;
                const multiplier = multiplierRef.current;

                // Clear refs
                resolveRef.current = null;
                rejectRef.current = null;
                multiplierRef.current = 1;

                if (resolve) {
                    // Apply multiplier to the dice result
                    const finalValue = goldResult.value * multiplier;
                    resolve(finalValue);
                }
            }
        });

        unsubscribeRef.current = unsubscribe;

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };
    }, [onRollComplete]);

    const generateRandomGold = useCallback(async (classId: number): Promise<number> => {
        if (!isReady) {
            throw new Error('Dice box is not ready');
        }

        if (isRollPendingRef.current) {
            throw new Error('A gold roll is already in progress');
        }

        // Get class name
        const classData = getClassSummaryById(classId);
        if (!classData?.name) {
            throw new Error(`Class with ID ${classId} not found`);
        }

        const className = normalizeClassName(classData.name);
        const notation = STARTING_GOLD_TABLE[className];

        if (!notation) {
            throw new Error(`No starting gold table entry for class: ${classData.name}`);
        }

        // Parse notation
        const { dice, multiplier } = parseDiceNotation(notation);

        // Store multiplier for use in callback
        multiplierRef.current = multiplier;

        // Roll just the dice part (dice box doesn't handle multiplication in notation)
        const groupName = `starting-gold: ${classData.name}`;

        // Set up promise
        return new Promise<number>((resolve, reject) => {
            isRollPendingRef.current = true;
            resolveRef.current = resolve;
            rejectRef.current = reject;

            // Roll dice (just the dice part, multiplier will be applied in callback)
            try {
                rollDice(dice, groupName);
            } catch (error) {
                isRollPendingRef.current = false;
                resolveRef.current = null;
                rejectRef.current = null;
                multiplierRef.current = 1;
                reject(error instanceof Error ? error : new Error('Failed to roll dice'));
            }
        });
    }, [isReady, getClassSummaryById, rollDice]);

    return {
        generateRandomGold,
        convertGpToMoney,
        isReady,
    };
}

