import React from 'react';

import { useDiceBox } from './index';

export function DiceBoxExample(): React.JSX.Element {
    const { rollDice, isReady, isRolling, lastResult, clearResults } = useDiceBox();

    const rollTypes = [
        { notation: '3d6', label: '3d6 (Standard)', group: 'standard' },
        { notation: '4d6', label: '4d6 (D&D Stats)', group: 'stats' },
        { notation: '1d20', label: '1d20 (Initiative)', group: 'initiative' },
        { notation: '2d10', label: '2d10 (Percentile)', group: 'percentile' },
        { notation: '1d100', label: '1d100 (Direct)', group: 'direct' },
    ];

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">DiceBox Integration Example</h2>

            <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Status: {isReady ? 'Ready' : 'Initializing...'}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {rollTypes.map(({ notation, label, group }) => (
                    <button
                        key={group}
                        onClick={() => rollDice(notation, group)}
                        disabled={!isReady || isRolling}
                        className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {isRolling ? 'Rolling...' : label}
                    </button>
                ))}
            </div>

            {lastResult && (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">
                            {lastResult.group ? `${lastResult.group.charAt(0).toUpperCase() + lastResult.group.slice(1)} Roll` : 'Roll Result'}
                        </h3>
                        <button
                            onClick={clearResults}
                            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            Clear
                        </button>
                    </div>
                    <div className="space-y-1">
                        <p><strong>Notation:</strong> {lastResult.notation}</p>
                        <p><strong>Individual Rolls:</strong> [{lastResult.results.join(', ')}]</p>
                        <p><strong>Total:</strong> <span className="text-xl font-bold text-blue-600">{lastResult.total}</span></p>
                    </div>
                </div>
            )}

            <div className="text-sm text-gray-500 dark:text-gray-400">
                <p>Click anywhere on the screen to hide the dice after rolling.</p>
            </div>
        </div>
    );
} 
