import React, { useState, useEffect, useMemo } from 'react';

import { useAuthAuto } from '@/components/auth';
import { CustomSelect } from '@/components/forms/FormComponents';
import type { TabComponentProps } from '@/features/character/types';
import { CharacterEditStateUpdateType } from '@/features/character/types';
import {
    EDITION_LIST,
    hasAdvancedOptions,
    getAdvancedOptionsForEdition,
    isAdvancedOptionAvailable,
    Setting,
    SourceType,
    EditionId,
} from '@shared/static-data';
import { GetCharacterOptionsSourceBookList, GetSourceBookSettingList, GetSourceBookTypeList } from '@shared/utils';

export function ConfigurationTab({
    state,
    updateState,
}: TabComponentProps): React.JSX.Element {
    const { user } = useAuthAuto();
    const [disallowedSources, setDisallowedSources] = useState<number[]>([]);
    const [excludeForgottenRealms, setExcludeForgottenRealms] = useState<boolean>(false);
    const [excludeEberron, setExcludeEberron] = useState<boolean>(false);
    const [userPreferredEdition, setUserPreferredEdition] = useState<number | null>(null);

    // Load user's preferred edition and set it as default if character has no edition
    useEffect(() => {
        if (!user) return;

        // The user object from auth actually contains the full profile data
        // including preferredEditionId, even though it's typed as AuthUser
        const fullUser = user as { preferredEditionId?: number | null };
        if (fullUser.preferredEditionId) {
            setUserPreferredEdition(fullUser.preferredEditionId);

            // If no edition set, automatically set it to user's preferred edition
            if (!state.editionId) {
                updateState({ type: CharacterEditStateUpdateType.SET_EDITION, payload: { editionId: fullUser.preferredEditionId } });
            }
        }
    }, [user, state.editionId, updateState]);

    // Initialize disallowed sources from state
    useEffect(() => {
        setDisallowedSources(state.disallowedSources.map(ds => ds.sourceBookId));
    }, [state.disallowedSources]);

    // Initialize exclusion states based on current disallowed sources
    useEffect(() => {
        if (!state.editionId) return;

        const forgottenRealmsSources = GetSourceBookSettingList(Setting.ForgottenRealms, state.editionId as EditionId);
        const eberronSources = GetSourceBookSettingList(Setting.Eberron, state.editionId as EditionId);

        const frIds = forgottenRealmsSources.map(s => s.id);
        const eberronIds = eberronSources.map(s => s.id);

        // Check if all Forgotten Realms sources are disallowed
        const allFrDisallowed = frIds.length > 0 && frIds.every(id => disallowedSources.includes(id));
        setExcludeForgottenRealms(allFrDisallowed);

        // Check if all Eberron sources are disallowed
        const allEberronDisallowed = eberronIds.length > 0 && eberronIds.every(id => disallowedSources.includes(id));
        setExcludeEberron(allEberronDisallowed);
    }, [state.editionId, disallowedSources]);

    // Check if current edition has advanced options
    const showAdvancedOptions = state.editionId && hasAdvancedOptions(state.editionId);

    // Get available sources for the selected edition
    const availableSources = useMemo(() => {
        if (!state.editionId) return [];

        // Get character options sourcebooks for the edition
        const characterOptionsSources = GetCharacterOptionsSourceBookList(state.editionId as EditionId);

        // Get setting-specific sourcebooks to exclude
        const forgottenRealmsSources = GetSourceBookSettingList(Setting.ForgottenRealms, state.editionId as EditionId);
        const eberronSources = GetSourceBookSettingList(Setting.Eberron, state.editionId as EditionId);

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
        const coreBooks = GetSourceBookTypeList(SourceType.Core, state.editionId as EditionId);

        // Convert to format with alwaysAvailable flag (Core books)
        return filteredSources.map(source => ({
            value: source.id,
            label: source.name,
            alwaysAvailable: coreBooks.some(book => book.id === source.id)
        }));
    }, [state.editionId, excludeForgottenRealms, excludeEberron]);

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

        // Update configuration state with new disallowed sources
        const updatedDisallowedSources = newDisallowed.map(sourceBookId => ({
            id: 0, // Will be set by backend
            characterId: 0, // Will be set by backend
            sourceBookId
        }));

        updateState({ type: CharacterEditStateUpdateType.SET_DISALLOWED_SOURCES, payload: { disallowedSources: updatedDisallowedSources } });
    };

    const handleExclusionToggle = (setting: Setting, isExcluded: boolean) => {
        if (!state.editionId) return;

        const settingSources = GetSourceBookSettingList(setting, state.editionId as EditionId);
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

        // Update configuration state with new disallowed sources
        const updatedDisallowedSources = newDisallowed.map(sourceBookId => ({
            id: 0, // Will be set by backend
            characterId: 0, // Will be set by backend
            sourceBookId
        }));

        updateState({ type: CharacterEditStateUpdateType.SET_DISALLOWED_SOURCES, payload: { disallowedSources: updatedDisallowedSources } });
    };

    const handleEditionChange = (editionId: number | null) => {
        updateState({ type: CharacterEditStateUpdateType.SET_EDITION, payload: { editionId } });

        if (editionId) {
            const newAdvancedOptions = getAdvancedOptionsForEdition(editionId);

            // Reset advanced options that are not available for the new edition
            if (!newAdvancedOptions.includes('allowVariantClasses')) {
                updateState({ type: CharacterEditStateUpdateType.SET_ALLOW_VARIANT_CLASSES, payload: { allowVariantClasses: false } });
            }
            if (!newAdvancedOptions.includes('isGestalt')) {
                updateState({ type: CharacterEditStateUpdateType.SET_IS_GESTALT, payload: { isGestalt: false } });
            }
            if (!newAdvancedOptions.includes('ignoreLevelAdjustment')) {
                updateState({ type: CharacterEditStateUpdateType.SET_IGNORE_LEVEL_ADJUSTMENT, payload: { ignoreLevelAdjustment: false } });
            }
        }
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
                    value={state.editionId || userPreferredEdition}
                    onValueChange={handleEditionChange}
                    placeholder="Select an edition"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Choose the D&D edition for this character. This affects available content and rules.
                    {userPreferredEdition && !state.editionId && (
                        <span className="block mt-1 text-blue-600 dark:text-blue-400">
                            Defaulting to your preferred edition.
                        </span>
                    )}
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
                        {isAdvancedOptionAvailable(state.editionId!, 'allowVariantClasses') && (
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={state.allowVariantClasses}
                                    onChange={(e) => updateState({ type: CharacterEditStateUpdateType.SET_ALLOW_VARIANT_CLASSES, payload: { allowVariantClasses: e.target.checked } })}
                                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Allow Variant Classes
                                    </span>
                                </div>
                            </label>
                        )}

                        {isAdvancedOptionAvailable(state.editionId!, 'isGestalt') && (
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={state.isGestalt}
                                    onChange={(e) => updateState({ type: CharacterEditStateUpdateType.SET_IS_GESTALT, payload: { isGestalt: e.target.checked } })}
                                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Allow Gestalt Characters
                                    </span>
                                </div>
                            </label>
                        )}

                        {isAdvancedOptionAvailable(state.editionId!, 'ignoreLevelAdjustment') && (
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={state.ignoreLevelAdjustment}
                                    onChange={(e) => updateState({ type: CharacterEditStateUpdateType.SET_IGNORE_LEVEL_ADJUSTMENT, payload: { ignoreLevelAdjustment: e.target.checked } })}
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
