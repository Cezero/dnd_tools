import React from 'react';

import { CustomSelect } from '@/components/forms/FormComponents';
import { DISPLAY_TYPE_LIST, DisplayType } from '@shared/static-data';

import { JsonViewer } from './JsonViewer';
import type { CharacterExplorerData, CharacterExplorerDetailTabsProps } from './types';

export function CharacterExplorerDetailTabs({
    activeTab,
    explorerData,
    selectedDisplayType,
    onDisplayTypeChange,
}: CharacterExplorerDetailTabsProps): React.JSX.Element {
    switch (activeTab) {
        case 'resolved-progressions':
            return (
                <div>
                    <h2 className="text-xl font-semibold mb-4">Resolved Progressions</h2>
                    <JsonViewer
                        data={explorerData.resolvedProgressions}
                        loading={explorerData.isLoading}
                        error={explorerData.error}
                    />
                </div>
            );

        case 'formatted-character':
            return (
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Formatted Character</h2>
                        <div className="w-64">
                            <CustomSelect
                                value={selectedDisplayType}
                                onValueChange={onDisplayTypeChange}
                                options={DISPLAY_TYPE_LIST}
                                label="Display Type"
                                placeholder="Select display type"
                            />
                        </div>
                    </div>
                    {selectedDisplayType === DisplayType.CharacterSheet ? (
                        <JsonViewer
                            data={explorerData.formattedCharacterResult}
                            loading={explorerData.isLoading}
                            error={explorerData.error}
                        />
                    ) : (
                        <JsonViewer
                            data={explorerData.formattedDisplayResult}
                            loading={explorerData.isLoading}
                            error={explorerData.error}
                        />
                    )}
                </div>
            );

        case 'raw-character':
            return (
                <div>
                    <h2 className="text-xl font-semibold mb-4">Raw Character Data</h2>
                    <JsonViewer
                        data={explorerData.character}
                        loading={explorerData.isLoading}
                        error={explorerData.error}
                    />
                </div>
            );

        case 'resolution-context':
            return (
                <div>
                    <h2 className="text-xl font-semibold mb-4">Resolution Context</h2>
                    <JsonViewer
                        data={explorerData.resolutionContext}
                        loading={explorerData.isLoading}
                        error={explorerData.error}
                    />
                </div>
            );

        case 'pending-choices':
            return (
                <div>
                    <h2 className="text-xl font-semibold mb-4">Pending Choices</h2>
                    <JsonViewer
                        data={explorerData.pendingChoices}
                        loading={explorerData.isLoading}
                        error={explorerData.error}
                    />
                </div>
            );

        default:
            return (
                <div>
                    <p className="text-gray-600 dark:text-gray-400">Select a tab to view data</p>
                </div>
            );
    }
}

