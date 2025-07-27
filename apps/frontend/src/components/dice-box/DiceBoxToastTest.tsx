import React from 'react';
import { useDiceBox } from './DiceBoxProvider';
import { useToast } from '@/hooks/useToast';
import { DiceResultParser } from './DiceResultParser';
import { createDiceResultToastData } from './DiceResultToast';
import type { DiceResult } from './DiceBoxManager';

export function DiceBoxToastTest(): React.JSX.Element {
    const { rollDice, isReady, isRolling } = useDiceBox();
    const toastManager = useToast();

    if (!toastManager) {
        return (
            <div className="p-6 max-w-2xl mx-auto">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                        Toast System Not Available
                    </h3>
                    <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                        This component must be used within a ToastProvider.
                    </p>
                </div>
            </div>
        );
    }

    const testRolls: Array<{ notation: string; group?: string; label: string }> = [
        { notation: '1d6', label: 'Simple d6' },
        { notation: '3d6', group: 'stats', label: 'D&D Stats' },
        { notation: '1d20', group: 'initiative', label: 'Initiative' },
        { notation: '2d10', label: 'Percentile' },
        { notation: '4d6', group: 'damage', label: 'Damage Roll' }
    ];

    // Test manual toast creation
    const testManualToast = () => {
        const testResult: DiceResult = {
            notation: '1d20',
            results: [20], // Critical success
            total: 20,
            group: 'test'
        };

        const parsedResult = DiceResultParser.parseResult(testResult);
        const toastData = createDiceResultToastData(parsedResult);
        toastManager.add(toastData);
    };

    // Test critical failure toast
    const testCriticalFailure = () => {
        const testResult: DiceResult = {
            notation: '1d20',
            results: [1], // Critical failure
            total: 1,
            group: 'test'
        };

        const parsedResult = DiceResultParser.parseResult(testResult);
        const toastData = createDiceResultToastData(parsedResult);
        toastManager.add(toastData);
    };

    // Test multiple dice with mixed results
    const testMixedResults = () => {
        const testResult: DiceResult = {
            notation: '3d6',
            results: [6, 1, 4], // Critical success, critical failure, regular
            total: 11,
            group: 'test'
        };

        const parsedResult = DiceResultParser.parseResult(testResult);
        const toastData = createDiceResultToastData(parsedResult);
        toastManager.add(toastData);
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">DiceBox Toast Integration Test</h2>

            <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Status: {isReady ? '✅ Ready' : '⏳ Initializing...'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Toasts will appear in the bottom-right corner when you roll dice.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {testRolls.map(({ notation, group, label }) => (
                        <button
                            key={notation}
                            onClick={() => rollDice(notation, group)}
                            disabled={!isReady || isRolling}
                            className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {isRolling ? 'Rolling...' : label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Manual Toast Tests</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={testManualToast}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    >
                        Test Critical Success Toast
                    </button>

                    <button
                        onClick={testCriticalFailure}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                        Test Critical Failure Toast
                    </button>

                    <button
                        onClick={testMixedResults}
                        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                    >
                        Test Mixed Results Toast
                    </button>
                </div>
            </div>

            <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                <p>• Real dice rolls will automatically show toasts</p>
                <p>• Manual tests show different toast types</p>
                <p>• Toasts appear in the top-right corner</p>
                <p>• Critical hits/failures have special styling</p>
            </div>
        </div>
    );
} 
