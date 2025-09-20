import React, { useState, useEffect, useMemo } from 'react';

import { CustomSelect } from '@/components/forms/FormComponents';
import type { CharacterWithAllDetailsResponse } from '@shared/schema';
import {
    EDITION_LIST,
    hasAdvancedOptions,
    getAdvancedOptionsForEdition,
    isAdvancedOptionAvailable,
    GetCharacterOptionsSourceBookList,
    GetSourceBookSettingList,
    Setting,
    GetSourceBookTypeList,
    SourceType,
    EditionId,
} from '@shared/static-data';

interface ConfigurationTabProps {
    character: CharacterWithAllDetailsResponse;
    onUpdate: (data: Partial<CharacterWithAllDetailsResponse>) => void;
}

export function ConfigurationTab({
    character,
    onUpdate
}: ConfigurationTabProps): React.JSX.Element {
    const [disallowedSources, setDisallowedSources] = useState<number[]>([]);
    const [excludeForgottenRealms, setExcludeForgottenRealms] = useState<boolean>(false);
    const [excludeEberron, setExcludeEberron] = useState<boolean>(false);

    // Initialize disallowed sources from character data
    useEffect(() => {
        if (character.disallowedSources) {
            setDisallowedSources(character.disallowedSources.map(ds => ds.sourceBookId));
        }
    }, [character.disallowedSources]);

    // Initialize exclusion states based on current disallowed sources
    useEffect(() => {
        if (!character.editionId) return;

        const forgottenRealmsSources = GetSourceBookSettingList(Setting.ForgottenRealms, character.editionId as EditionId);
        const eberronSources = GetSourceBookSettingList(Setting.Eberron, character.editionId as EditionId);

        const frIds = forgottenRealmsSources.map(s => s.id);
        const eberronIds = eberronSources.map(s => s.id);

        // Check if all Forgotten Realms sources are disallowed
        const allFrDisallowed = frIds.length > 0 && frIds.every(id => disallowedSources.includes(id));
        setExcludeForgottenRealms(allFrDisallowed);

        // Check if all Eberron sources are disallowed
        const allEberronDisallowed = eberronIds.length > 0 && eberronIds.every(id => disallowedSources.includes(id));
        setExcludeEberron(allEberronDisallowed);
    }, [character.editionId, disallowedSources]);

    // Check if current edition has advanced options
    const showAdvancedOptions = character.editionId && hasAdvancedOptions(character.editionId);

    // Get available sources for the selected edition
    const availableSources = useMemo(() => {
        if (!character.editionId) return [];

        // Get character options sourcebooks for the edition
        const characterOptionsSources = GetCharacterOptionsSourceBookList(character.editionId as EditionId);

        // Get setting-specific sourcebooks to exclude
        const forgottenRealmsSources = GetSourceBookSettingList(Setting.ForgottenRealms, character.editionId as EditionId);
        const eberronSources = GetSourceBookSettingList(Setting.Eberron, character.editionId as EditionId);

        // Filter out excluded setting books
        let filteredSources = characterOptionsSources;

        if (excludeForgottenRealms) {
            const frIds = forgottenRealmsSources.map(s => s.id);
            filteredSources = filteredSources.filter(s => !frIds.includes(s.id));
        }

        if (excludeEberron) {
            const eberronIds = eberronSources.map(s => s.id);
            filteredSources = filteredSources.filter(s => !eberronIds.includes(s.id));
        }

        // Get Core book IDs for this edition
        const coreBooks = GetSourceBookTypeList(SourceType.Core, character.editionId as EditionId);

        // Convert to format with alwaysAvailable flag (Core books)
        return filteredSources.map(source => ({
            value: source.id,
            label: source.name,
            alwaysAvailable: coreBooks.some(book => book.id === source.id)
        }));
    }, [character.editionId, excludeForgottenRealms, excludeEberron]);

    const handleDisallowedSourceToggle = (sourceId: number) => {
        // Check if this source is always available
        const source = availableSources.find(s => s.value === sourceId);
        if (source?.alwaysAvailable) {
            return; // Don't allow toggling always available sources
        }

        const newDisallowed = disallowedSources.includes(sourceId)
            ? disallowedSources.filter(id => id !== sourceId)
            : [...disallowedSources, sourceId];

        setDisallowedSources(newDisallowed);

        // Update character with new disallowed sources
        const updatedDisallowedSources = newDisallowed.map(sourceBookId => ({
            id: 0, // Will be set by backend
            characterId: character.id,
            sourceBookId
        }));

        onUpdate({ disallowedSources: updatedDisallowedSources });
    };

    const handleExclusionToggle = (setting: Setting, isExcluded: boolean) => {
        if (!character.editionId) return;

        const settingSources = GetSourceBookSettingList(setting, character.editionId as EditionId);
        const settingIds = settingSources.map(s => s.id);

        let newDisallowed: number[];
        if (isExcluded) {
            // Add all setting sources to disallowed list
            newDisallowed = [...new Set([...disallowedSources, ...settingIds])];
        } else {
            // Remove all setting sources from disallowed list
            newDisallowed = disallowedSources.filter(id => !settingIds.includes(id));
        }

        setDisallowedSources(newDisallowed);

        // Update character with new disallowed sources
        const updatedDisallowedSources = newDisallowed.map(sourceBookId => ({
            id: 0, // Will be set by backend
            characterId: character.id,
            sourceBookId
        }));

        onUpdate({ disallowedSources: updatedDisallowedSources });
    };

    const handleEditionChange = (editionId: number | null) => {
        const updateData: Partial<CharacterWithAllDetailsResponse> = { editionId };

        if (editionId) {
            const newAdvancedOptions = getAdvancedOptionsForEdition(editionId);

            // Reset advanced options that are not available for the new edition
            if (!newAdvancedOptions.includes('allowVariantClasses')) {
                updateData.allowVariantClasses = false;
            }
            if (!newAdvancedOptions.includes('isGestalt')) {
                updateData.isGestalt = false;
            }
            if (!newAdvancedOptions.includes('ignoreLevelAdjustment')) {
                updateData.ignoreLevelAdjustment = false;
            }
        }

        onUpdate(updateData);
    };

    return (
        <div className="space-y-6 p-6">
            {/* Edition Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Edition
                </label>
                <CustomSelect
                    options={EDITION_LIST}
                    useAbbreviation={false}
                    value={character.editionId}
                    onValueChange={handleEditionChange}
                    placeholder="Select an edition"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Choose the D&D edition for this character. This affects available content and rules.
                </p>
            </div>

            {/* Advanced Options - Edition-specific */}
            {showAdvancedOptions && (
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                            Advanced Options
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            These options are specific to your selected edition.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {isAdvancedOptionAvailable(character.editionId!, 'allowVariantClasses') && (
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={character.allowVariantClasses}
                                    onChange={(e) => onUpdate({ allowVariantClasses: e.target.checked })}
                                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Allow Variant Classes
                                    </span>
                                </div>
                            </label>
                        )}

                        {isAdvancedOptionAvailable(character.editionId!, 'isGestalt') && (
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={character.isGestalt}
                                    onChange={(e) => onUpdate({ isGestalt: e.target.checked })}
                                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Allow Gestalt Characters
                                    </span>
                                </div>
                            </label>
                        )}

                        {isAdvancedOptionAvailable(character.editionId!, 'ignoreLevelAdjustment') && (
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={character.ignoreLevelAdjustment}
                                    onChange={(e) => onUpdate({ ignoreLevelAdjustment: e.target.checked })}
                                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Ignore Level Adjustment
                                    </span>
                                </div>
                            </label>
                        )}
                    </div>
                </div>
            )}

            {/* Setting Exclusions */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Setting Exclusions
                </h3>

                <div className="flex items-center gap-4">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={excludeForgottenRealms}
                            onChange={(e) => {
                                const isExcluded = e.target.checked;
                                setExcludeForgottenRealms(isExcluded);
                                handleExclusionToggle(Setting.ForgottenRealms, isExcluded);
                            }}
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Exclude Forgotten Realms Sources
                            </span>
                        </div>
                    </label>

                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={excludeEberron}
                            onChange={(e) => {
                                const isExcluded = e.target.checked;
                                setExcludeEberron(isExcluded);
                                handleExclusionToggle(Setting.Eberron, isExcluded);
                            }}
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Exclude Eberron Sources
                            </span>
                        </div>
                    </label>
                </div>
            </div>

            {/* Source Restrictions */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Source Restrictions
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Choose which source books are disallowed for this character. By default, all sources are allowed.
                </p>

                {availableSources.length > 0 ? (
                    <div className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                            {availableSources.map(source => {
                                const isAlwaysAvailable = source.alwaysAvailable;
                                const isDisallowed = disallowedSources.includes(source.value);

                                return (
                                    <label key={source.value} className={`flex items-center ${isAlwaysAvailable ? 'opacity-50' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={isDisallowed}
                                            onChange={() => handleDisallowedSourceToggle(source.value)}
                                            disabled={isAlwaysAvailable}
                                            className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded disabled:opacity-50"
                                        />
                                        <span className={`text-sm ${isAlwaysAvailable ? 'text-gray-500 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {source.label}
                                            {isAlwaysAvailable && (
                                                <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                                                    (Always Available)
                                                </span>
                                            )}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Please select an edition to see available source books.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
