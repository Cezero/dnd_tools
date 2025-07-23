import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthAuto } from '@/components/auth';
import { useDiceBox } from '@/components/dice-box';
import { RaceTraitMapSchema } from '@shared/schema';

export function CharacterCreate(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading: isAuthLoading } = useAuthAuto();
    const { rollDice, isReady, isRolling, pendingRoll, lastResult } = useDiceBox();

    if (isAuthLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    const handleRollAttributes = () => {
        rollDice('3d6', 'attributes');
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <div className="w-full max-w-md">
                <h1 className="text-2xl font-bold mb-4">Create Character</h1>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleRollAttributes}
                            disabled={!isReady || isRolling}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isRolling && pendingRoll === 'attributes' ? 'Rolling...' : 'Roll 3d6 for Attributes'}
                        </button>

                        {lastResult && lastResult.group === 'attributes' && (
                            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded">
                                <h3 className="font-semibold mb-2">Roll Result:</h3>
                                <p><strong>Notation:</strong> {lastResult.notation}</p>
                                <p><strong>Individual Rolls:</strong> [{lastResult.results.join(', ')}]</p>
                                <p><strong>Total:</strong> <span className="text-xl font-bold text-blue-600">{lastResult.total}</span></p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 
