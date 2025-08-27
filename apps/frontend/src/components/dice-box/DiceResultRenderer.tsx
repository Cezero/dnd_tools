import React from 'react';

import type { LocalDiceRollResult, DieRoll } from './types';

interface DiceResultRendererProps {
    results: LocalDiceRollResult[];
    critHighlight?: boolean;
}

export function DiceResultRenderer({ results, critHighlight = false }: DiceResultRendererProps): React.JSX.Element {
    if (results.length === 1) {
        return <SingleResultRenderer result={results[0]} critHighlight={critHighlight} />;
    } else {
        return <MultipleResultsRenderer results={results} critHighlight={critHighlight} />;
    }
}

interface SingleResultRendererProps {
    result: LocalDiceRollResult;
    critHighlight?: boolean;
}

function SingleResultRenderer({ result, critHighlight = false }: SingleResultRendererProps): React.JSX.Element {
    const { rolls, value, originalNotation, group } = result;
    const title = generateTitle(originalNotation || 'Unknown', group);

    return (
        <span className="text-sm text-gray-600 dark:text-gray-300">
            {title}:{' '}
            <span className="font-mono">
                {rolls.map((roll: DieRoll, index) => {
                    const rollElement = renderDieRoll(roll.value, roll.die, false, critHighlight);
                    return <React.Fragment key={index}>{rollElement}</React.Fragment>;
                })}
                <span className="ml-2 font-bold text-base text-gray-900 dark:text-white">
                    = {value}
                </span>
            </span>
        </span>
    );
}

interface MultipleResultsRendererProps {
    results: LocalDiceRollResult[];
    critHighlight?: boolean;
}

function MultipleResultsRenderer({ results, critHighlight = false }: MultipleResultsRendererProps): React.JSX.Element {
    return (
        <span className="text-sm text-gray-600 dark:text-gray-300 flex flex-wrap gap-2">
            {results.map((result, resultIndex) => {
                const { rolls, value, originalNotation, group } = result;
                const title = generateTitle(originalNotation || 'Unknown', group);

                return (
                    <span key={resultIndex} className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1">
                        {title}:{' '}
                        <span className="font-mono">
                            {rolls.map((roll: DieRoll, index) => {
                                const rollElement = renderDieRoll(roll.value, roll.die, false, critHighlight);
                                return <React.Fragment key={index}>{rollElement}</React.Fragment>;
                            })}
                            <span className="ml-2 font-bold text-base text-gray-900 dark:text-white">
                                = {value}
                            </span>
                        </span>
                    </span>
                );
            })}
        </span>
    );
}

function renderDieRoll(value: number, sides: number, isDropped: boolean = false, critHighlight: boolean): React.JSX.Element {
    const isCriticalSuccess = value === sides;
    const isCriticalFailure = value === 1 && sides > 1;

    let rollClasses = "inline-block px-2 py-1 mx-1 rounded text-xs font-semibold min-w-[20px] text-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600";

    if (critHighlight) {
        if (isCriticalSuccess) {
            rollClasses = "inline-block px-2 py-1 mx-1 rounded text-xs font-semibold min-w-[20px] text-center bg-gradient-to-br from-green-500 to-green-600 text-white shadow-sm";
        } else if (isCriticalFailure) {
            rollClasses = "inline-block px-2 py-1 mx-1 rounded text-xs font-semibold min-w-[20px] text-center bg-gradient-to-br from-red-500 to-red-600 text-white shadow-sm";
        }
    }

    if (isDropped) {
        rollClasses += " opacity-50 line-through";
    }

    return (
        <span className={rollClasses}>
            {value}
        </span>
    );
}

function generateTitle(notation: string, group?: string): string {
    if (group) {
        return `${group}: ${notation}`;
    }
    return notation;
} 
