import React, { useCallback } from 'react';

import { CharacterDetailStateUpdateType, type DescriptionTabProps } from '@/features/character/types';

/**
 * DescriptionTab displays editable notes.
 * 
 * **Sync Pattern**: This tab follows the standardized state → useEffect → API + refreshState pattern.
 * - Updates state via `updateState()` when notes change
 * - CharacterDetail component automatically syncs state changes to backend
 * - Do NOT call APIs directly - use `updateState()` instead
 * 
 * @see CharacterDetail component for sync pattern documentation
 */
export function DescriptionTab({ state, updateState }: DescriptionTabProps): React.JSX.Element {
    const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        updateState({
            type: CharacterDetailStateUpdateType.SET_NOTES,
            payload: { notes: e.target.value || null }
        });
    }, [updateState]);

    const notes = state.notes || '';
    const characterCount = notes.length;
    const maxCharacters = 10000;
    const isNearLimit = characterCount > maxCharacters * 0.8; // 80% of limit
    const isAtLimit = characterCount >= maxCharacters;

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notes</h2>
            <div>
                <textarea
                    value={notes}
                    onChange={handleNotesChange}
                    placeholder="Enter notes about your character..."
                    maxLength={maxCharacters}
                    className="w-full h-[calc(100vh-300px)] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
                <div className="mt-2 flex justify-end">
                    <span
                        className={`text-sm ${isAtLimit
                            ? 'text-red-600 dark:text-red-400'
                            : isNearLimit
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        {characterCount.toLocaleString()} / {maxCharacters.toLocaleString()} characters
                    </span>
                </div>
            </div>
        </div>
    );
}
