import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { DisplayType } from '@shared/static-data';

import { CharacterExplorerDetailTabs } from './CharacterExplorerDetailTabs';
import { useCharacterExplorerData } from './useCharacterExplorerData';

export function CharacterExplorerDetail(): React.JSX.Element {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<string>('resolved-progressions');
    const [selectedDisplayType, setSelectedDisplayType] = useState<DisplayType>(DisplayType.CharacterSheet);

    const characterId = id ? parseInt(id, 10) : null;
    const explorerData = useCharacterExplorerData(characterId, selectedDisplayType);

    const tabs = [
        { id: 'resolved-progressions', label: 'Resolved Progressions' },
        { id: 'formatted-character', label: 'Formatted Character' },
        { id: 'raw-character', label: 'Raw Character Data' },
        { id: 'resolution-context', label: 'Resolution Context' },
        { id: 'pending-choices', label: 'Pending Choices' },
    ];

    if (explorerData.isLoading && !explorerData.character) {
        return (
            <div className="p-4">
                <div className="text-gray-600 dark:text-gray-400">Loading character data...</div>
            </div>
        );
    }

    if (explorerData.error) {
        return (
            <div className="p-4">
                <div className="text-red-600 dark:text-red-400">Error: {explorerData.error}</div>
                <button
                    onClick={() => navigate('/admin/characters')}
                    className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white rounded"
                >
                    Back to List
                </button>
            </div>
        );
    }

    if (!explorerData.character) {
        return (
            <div className="p-4">
                <div className="text-gray-600 dark:text-gray-400">Character not found</div>
                <button
                    onClick={() => navigate('/admin/characters')}
                    className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white rounded"
                >
                    Back to List
                </button>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-2">{explorerData.character.name}</h1>
                    <button
                        onClick={() => navigate('/admin/characters')}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        ← Back to List
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <CharacterExplorerDetailTabs
                activeTab={activeTab}
                explorerData={explorerData}
                selectedDisplayType={selectedDisplayType}
                onDisplayTypeChange={setSelectedDisplayType}
            />
        </div>
    );
}

