import React from 'react';
import { useNavigate } from 'react-router-dom';

import { CharacterQueryHooks } from '@/services/query/CharacterQueryHooks';
import type { GetAllCharactersResponse } from '@shared/schema';

export function CharacterExplorerList(): React.JSX.Element {
    const navigate = useNavigate();
    const { data, isLoading, error } = CharacterQueryHooks.useGetAllCharactersAdmin();

    if (isLoading) {
        return (
            <div className="p-4">
                <div className="text-gray-600 dark:text-gray-400">Loading characters...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <div className="text-red-600 dark:text-red-400">Error loading characters: {error instanceof Error ? error.message : 'Unknown error'}</div>
            </div>
        );
    }

    const characters = (data as GetAllCharactersResponse | undefined)?.results || [];

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Character Data Explorer</h1>
            <div className="mb-4 text-gray-600 dark:text-gray-400">
                Select a character to view its resolved data structures
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Owner
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Level
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Class/Level
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Race
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {characters.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                    No characters found
                                </td>
                            </tr>
                        ) : (
                            characters.map((character) => (
                                <tr
                                    key={character.id}
                                    onClick={() => navigate(`/admin/characters/${character.id}`)}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {character.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {(character as unknown as { user?: { username?: string } }).user?.username || 'Unknown'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {(character as unknown as { characterLevel?: number }).characterLevel || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {(character as unknown as { classLevelString?: string }).classLevelString || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {character.race?.name || '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

