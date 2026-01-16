import React from 'react';

import { useDiceBox } from '@/components/dice-box';

import type { DiceLinkProps } from './types';

/**
 * DiceLink component that provides a clickable text link for rolling dice.
 * 
 * Uses the DiceBox system to roll dice, which automatically handles
 * toast notifications and log panel entries via DiceBoxProvider.
 * 
 * @param notation - Dice notation (e.g., "1d20+5", "1d8+3")
 * @param label - Optional label to display (defaults to the notation)
 * @param className - Optional CSS classes
 */
export function DiceLink({ notation, label, className = '' }: DiceLinkProps): React.JSX.Element {
    const { rollDice, isReady, isRolling } = useDiceBox();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        if (!isReady || isRolling) {
            return;
        }
        rollDice(notation, 'character-detail');
    };

    const displayText = label || notation;
    const isDisabled = !isReady || isRolling;

    return (
        <a
            href="#"
            onClick={handleClick}
            className={`text-blue-600 hover:text-blue-800 hover:underline cursor-pointer ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
            title={isDisabled ? 'Dice box not ready' : `Roll ${notation}`}
        >
            {displayText}
        </a>
    );
}
