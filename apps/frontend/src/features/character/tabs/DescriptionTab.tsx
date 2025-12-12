import React from 'react';

import { CustomSelect } from '@/components/forms/FormComponents';
import type { TabComponentProps } from '@/features/character/types';
import { CharacterEditStateUpdateType } from '@/features/character/types';
import {
    ALIGNMENT_LIST
} from '@shared/static-data';

export function DescriptionTab({
    state,
    updateState,
    isLoading
}: TabComponentProps): React.JSX.Element {

    const getSizeForRace = (): string => {
        // TODO: Get race details from resolved data or state
        // For now, return a placeholder
        return 'Medium';
    };

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Description
            </h2>

            {/* Loading State */}
            {isLoading && (
                <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg shadow-sm p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                Loading character data...
                            </h3>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Character Name
                    </h3>
                    <input
                        type="text"
                        value={state.name}
                        onChange={(e) => updateState({ type: CharacterEditStateUpdateType.SET_NAME, payload: { name: e.target.value } })}
                        placeholder="Enter character name..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Alignment */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Alignment
                        </h3>
                        <CustomSelect
                            value={state.alignmentId || 0}
                            onValueChange={(value) => updateState({ type: CharacterEditStateUpdateType.SET_ALIGNMENT, payload: { alignmentId: value } })}
                            options={ALIGNMENT_LIST}
                            placeholder="Select alignment..."
                            componentExtraClassName="mb-4"
                        />
                    </div>

                    {/* Character Info */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Character Information
                        </h3>
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <p><strong>Race:</strong> {/* TODO: Get race name from resolved data */} Not selected</p>
                            <p><strong>Size:</strong> {getSizeForRace()}</p>
                            <p><strong>Age:</strong> {state.age || 'Not set'}</p>
                            <p><strong>Height:</strong> {state.height ? `${state.height} inches` : 'Not set'}</p>
                            <p><strong>Weight:</strong> {state.weight || 'Not set'}</p>
                            <p><strong>Eyes:</strong> {state.eyes || 'Not set'}</p>
                            <p><strong>Hair:</strong> {state.hair || 'Not set'}</p>
                            <p><strong>Gender:</strong> {state.gender || 'Not set'}</p>
                        </div>
                    </div>
                </div>

                {/* Physical Description */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Physical Description
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Age
                            </label>
                            <input
                                type="number"
                                value={state.age || ''}
                                onChange={(e) => updateState({ type: CharacterEditStateUpdateType.SET_AGE, payload: { age: e.target.value ? parseInt(e.target.value) : null } })}
                                placeholder="Enter age..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Height (inches)
                            </label>
                            <input
                                type="number"
                                value={state.height || ''}
                                onChange={(e) => updateState({ type: CharacterEditStateUpdateType.SET_HEIGHT, payload: { height: e.target.value ? parseInt(e.target.value) : null } })}
                                placeholder="Enter height..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Weight
                            </label>
                            <input
                                type="text"
                                value={state.weight || ''}
                                onChange={(e) => updateState({ type: CharacterEditStateUpdateType.SET_WEIGHT, payload: { weight: e.target.value } })}
                                placeholder="Enter weight..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Eyes
                            </label>
                            <input
                                type="text"
                                value={state.eyes || ''}
                                onChange={(e) => updateState({ type: CharacterEditStateUpdateType.SET_EYES, payload: { eyes: e.target.value } })}
                                placeholder="Enter eye color..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Hair
                            </label>
                            <input
                                type="text"
                                value={state.hair || ''}
                                onChange={(e) => updateState({ type: CharacterEditStateUpdateType.SET_HAIR, payload: { hair: e.target.value } })}
                                placeholder="Enter hair color..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Gender
                            </label>
                            <input
                                type="text"
                                value={state.gender || ''}
                                onChange={(e) => updateState({ type: CharacterEditStateUpdateType.SET_GENDER, payload: { gender: e.target.value } })}
                                placeholder="Enter gender..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Notes
                    </h3>
                    <textarea
                        value={state.notes || ''}
                        onChange={(e) => updateState({ type: CharacterEditStateUpdateType.SET_NOTES, payload: { notes: e.target.value } })}
                        placeholder="Enter character notes, background, or other information..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>
        </div>
    );
}
