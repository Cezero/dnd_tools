import React, { useCallback, useRef } from 'react';

import { useDiceBox } from '@/components/dice-box';
import type { LocalDiceRollResult } from '@/components/dice-box/types';
import { useCacheFunctions } from '@/services/cache';
import { CurrencyId, CURRENCY } from '@shared/static-data';

/**
 * Starting gold dice notation mapping by class name
 * Based on D&D 3.5e Player's Handbook Table 4-1: Starting Gold
 */
const STARTING_GOLD_TABLE: Record<string, string> = {
    'barbarian': '4d4 × 10',
    'paladin': '6d4 × 10',
    'bard': '4d4 × 10',
    'ranger': '6d4 × 10',
    'cleric': '5d4 × 10',
    'rogue': '5d4 × 10',
    'druid': '2d4 × 10',
    'sorcerer': '3d4 × 10',
    'fighter': '6d4 × 10',
    'wizard': '3d4 × 10',
    'monk': '5d4', // Note: no × 10 multiplier
};

/**
 * Normalize class name for lookup (lowercase, trim)
 */
function normalizeClassName(name: string): string {
    return name.toLowerCase().trim();
}

/**
 * Parse dice notation with optional multiplier
 * Examples: "4d4 × 10" -> { dice: "4d4", multiplier: 10 }
 *          "5d4" -> { dice: "5d4", multiplier: 1 }
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
 * Hook to generate random starting gold for a character based on their class
 * Uses dice utilities to roll the dice and returns the result in gold pieces
 */
export function useStartingGold() {
    const { rollDice, onRollComplete, isReady } = useDiceBox();
    const { getClassNameById } = useCacheFunctions();
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
                    console.log(`Starting gold: rolled ${goldResult.value}, multiplier: ${multiplier}, final: ${finalValue}`);
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
        const classData = await getClassNameById(classId);
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
    }, [isReady, getClassNameById, rollDice]);

    /**
     * Convert gold pieces to Money object
     * Does NOT upconvert to platinum - keeps gold as gold
     */
    const convertGpToMoney = useCallback((gp: number): { platinum: number; gold: number; silver: number; copper: number } => {
        // Keep gold as gold, don't convert to platinum
        const gold = Math.floor(gp);
        const goldDecimal = gp - gold;

        // Convert decimal part to silver and copper
        const silver = Math.floor(goldDecimal * 10);
        const copper = Math.round((goldDecimal * 10 - silver) * 10);

        return { platinum: 0, gold, silver, copper };
    }, []);

    return {
        generateRandomGold,
        convertGpToMoney,
        isReady,
    };
}

