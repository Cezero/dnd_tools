import React, { useState, useEffect, useCallback, useRef } from 'react';

import { useDiceBox , DiceButton } from '@/components/dice-box';
import { SliderControl } from '@/components/forms';
import { CustomSelect } from '@/components/forms/FormComponents';
import { GenericList } from '@/components/generic-list';
import { ColorPicker } from '@/components/widgets';
import { generateDiceColorScheme } from '@/utils/color-scheme';
import type { DiceBoxAdminConfig } from '@shared/schema';
import { doesThemeIgnoreColor , getDiceThemeById, THREE_D_DICE_THEME_SELECT_LIST } from '@shared/static-data';

import { DICE_CONFIGURATION_COLUMNS } from './DiceConfigurationsColumns';
import { DiceConfigurationService } from './DiceConfigurationService';


export function DiceConfigurationPage(): React.JSX.Element {
    const [config, setConfig] = useState<DiceBoxAdminConfig & { id?: number }>(DiceConfigurationService.getDefaultConfig());
    const [_selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [listKey, setListKey] = useState(0); // For refreshing the list
    const { isReady, reinitialize, updateConfigWithAdminConfig, clearAdminTestFlag, rollDice } = useDiceBox();
    const debounceTimeoutRef = useRef<number | null>(null);
    const isInitializedRef = useRef<boolean>(false);
    const isSavingRef = useRef<boolean>(false);
    const _isUnmountingRef = useRef<boolean>(false);



    // Debug function to completely reset DiceBox
    const handleForceReset = async () => {
        console.log('Force resetting DiceBox...');

        // Check initial state
        const container = document.querySelector('[data-dice-box]');
        const canvas = document.getElementById('dice-canvas');
        console.log('Initial state - Container:', !!container, 'Canvas:', !!canvas);

        try {
            // Force reinitialize the DiceBox
            console.log('Reinitializing DiceBox...');
            await reinitialize();

            console.log('DiceBox reset complete');

            // Check state after reinitialize
            const canvasAfterReinit = document.getElementById('dice-canvas');
            console.log('After reinitialize - Canvas:', !!canvasAfterReinit);

            // Check if it's ready after a delay
            setTimeout(() => {
                console.log('DiceBox ready status after reset:', isReady);
                const finalCanvas = document.getElementById('dice-canvas');
                console.log('Final state - Canvas:', !!finalCanvas);
            }, 2000);

        } catch (error) {
            console.error('Failed to reset DiceBox:', error);
        }
    };

    // Service function for the GenericList
    const getConfigurationsService = async () => {
        try {
            const response = await DiceConfigurationService.getAvailableConfigs();
            return {
                results: response.results,
                total: response.total
            };
        } catch (error) {
            console.error('Failed to load configurations:', error);
            return { results: [], total: 0 };
        }
    };

    useEffect(() => {
        loadDefaultConfig();
    }, []);

    // Apply configuration to DiceBox when it becomes ready
    useEffect(() => {
        if (isReady && config && !configAppliedRef.current) {
            updateConfigWithAdminConfig(config);
            configAppliedRef.current = true;
        }
    }, [isReady, config, updateConfigWithAdminConfig]);

    // Track previous config to detect actual changes
    const previousConfigRef = useRef<{ theme: number; themeColor: string; scale: number } | null>(null);
    const configAppliedRef = useRef<boolean>(false);

    // Debounced update function
    const debouncedUpdate = useCallback(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(() => {
            if (isReady && config) {
                try {
                    updateConfigWithAdminConfig(config);
                } catch (error) {
                    console.error('Failed to update DiceBox config:', error);
                }
            }
        }, 300); // 300ms debounce delay
    }, [isReady, updateConfigWithAdminConfig, config]);

    // Update DiceBox when config changes and DiceBox is ready (with debouncing)
    useEffect(() => {
        // Check if config actually changed - include all DiceBox properties
        const currentConfig = {
            theme: config.theme,
            themeColor: config.themeColor,
            scale: config.scale,
            gravity: config.gravity,
            mass: config.mass,
            friction: config.friction,
            restitution: config.restitution,
            angularDamping: config.angularDamping,
            linearDamping: config.linearDamping,
            spinForce: config.spinForce,
            throwForce: config.throwForce,
            startingHeight: config.startingHeight,
            settleTimeout: config.settleTimeout,
            lightIntensity: config.lightIntensity,
            enableShadows: config.enableShadows,
            shadowTransparency: config.shadowTransparency
        };
        const configChanged = JSON.stringify(previousConfigRef.current) !== JSON.stringify(currentConfig);

        if (isReady && config && isInitializedRef.current && configChanged && !isSavingRef.current) {
            debouncedUpdate();
        }

        // Update the previous config ref
        previousConfigRef.current = currentConfig;

        // Mark as initialized after first load
        if (isReady && !isInitializedRef.current) {
            isInitializedRef.current = true;
        }

        // Cleanup timeout on unmount
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [
        config.theme, config.themeColor, config.scale,
        config.gravity, config.mass, config.friction, config.restitution,
        config.angularDamping, config.linearDamping, config.spinForce, config.throwForce,
        config.startingHeight, config.settleTimeout, config.lightIntensity,
        config.enableShadows, config.shadowTransparency,
        isReady, debouncedUpdate, config
    ]);

    const loadDefaultConfig = async () => {
        try {
            setIsLoading(true);
            const response = await DiceConfigurationService.getAdminConfig();
            if (response) {
                setConfig(response);
                setSelectedConfigId(response.id);
            } else {
                // No config exists, start with a new one
                setConfig({
                    ...DiceConfigurationService.getDefaultConfig(),
                    name: 'New Configuration',
                    isDefault: true
                });
                setSelectedConfigId(null);
            }
            // Reset the applied flag so the loaded config gets applied
            configAppliedRef.current = false;
        } catch (error) {
            console.error('Failed to load dice configuration:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectConfig = async (selectedConfig: DiceBoxAdminConfig) => {
        try {
            // selectedConfig is now a full DiceBoxAdminConfig object
            setConfig(selectedConfig);
            setSelectedConfigId(selectedConfig.id);
            // Reset the applied flag so the new config gets applied
            configAppliedRef.current = false;
        } catch (error) {
            console.error('Failed to load selected configuration:', error);
        }
    };

    const handleDetailConfig = (selectedConfig: DiceBoxAdminConfig) => {
        // Same as handleSelectConfig - loads the configuration into the edit form
        handleSelectConfig(selectedConfig);
    };

    const handleDeleteConfig = async (config: DiceBoxAdminConfig) => {
        try {
            await DiceConfigurationService.deleteAdminConfig(config.id);
            // Refresh the list after deletion
            setListKey(prev => prev + 1);
        } catch (error) {
            console.error('Failed to delete configuration:', error);
        }
    };

    const _handleSetDefault = async (configId: number) => {
        try {
            // TODO: Implement set default endpoint
            console.log('Setting default config:', configId);
            // Refresh the list after setting default
            setListKey(prev => prev + 1);
        } catch (error) {
            console.error('Failed to set default configuration:', error);
        }
    };

    const handleNewConfiguration = () => {
        setConfig({
            ...DiceConfigurationService.getDefaultConfig(),
            name: 'New Configuration',
            isDefault: false
        });
        setSelectedConfigId(null);
        // Reset the applied flag so the new config gets applied
        configAppliedRef.current = false;
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            isSavingRef.current = true;
            setSaveStatus('idle');

            if (config.id) {
                // Update existing configuration
                await DiceConfigurationService.updateAdminConfig(config);
            } else {
                // Create new configuration
                await DiceConfigurationService.createAdminConfig(config);
            }

            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);

            // Clear admin test flag to restore user config and refresh cache
            await clearAdminTestFlag();

            // Refresh the list
            setListKey(prev => prev + 1);

            // If this was a new config, load it back to get the ID
            if (!config.id) {
                await loadDefaultConfig();
            }
        } catch (error) {
            console.error('Failed to save dice configuration:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } finally {
            setIsSaving(false);
            // Delay clearing the saving flag to prevent immediate reinitialization
            setTimeout(() => {
                isSavingRef.current = false;
            }, 1000);
        }
    };

    const handleReset = () => {
        if (config.id) {
            // Reset to the last saved version
            loadDefaultConfig();
        } else {
            // Reset to default values for new config
            setConfig({
                ...DiceConfigurationService.getDefaultConfig(),
                name: 'New Configuration',
                isDefault: false
            });
        }
    };

    const handleConfigChange = (updates: Partial<DiceBoxAdminConfig>) => {
        setConfig({ ...config, ...updates });
    };



    // Check if the current theme ignores the theme color
    const themeIgnoresColor = React.useMemo(() => {
        if (typeof config.theme === 'number') {
            const themeData = getDiceThemeById(config.theme);
            return themeData?.ignoresThemeColor ?? false;
        } else if (typeof config.theme === 'string') {
            // Handle string system names during migration
            return doesThemeIgnoreColor(config.theme);
        }
        return false;
    }, [config.theme]);

    // Generate dice color scheme from current theme color
    const diceColorScheme = React.useMemo(() => {
        try {
            return generateDiceColorScheme(config.themeColor);
        } catch (error) {
            console.error('Failed to generate dice color scheme:', error);
            return null;
        }
    }, [config.themeColor]);

    if (isLoading) {
        return (
            <div className="bg-gray-50 dark:bg-gray-900 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-64 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                            <div className="h-96 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Dice Configuration Management
                    </h1>

                    {/* Debug Section */}
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-4">
                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                            🚨 DiceBox Debug Tools
                        </h3>
                        <div className="text-sm text-red-700 dark:text-red-300 mb-3">
                            <p>DiceBox Status: {isReady ? '✅ Ready' : '❌ Not Ready'}</p>
                            <p>If dice rolling is broken, try the reset button below:</p>
                        </div>
                        <div className="space-x-2">
                            <button
                                onClick={handleForceReset}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            >
                                🔄 Force Reset DiceBox
                            </button>
                            <button
                                onClick={() => {
                                    console.log('Manual test - trying to roll dice...');
                                    rollDice('1d6', 'debug-test');
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                🎲 Test Roll (Bypass Ready Check)
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Configuration List - Full Width */}
                    <div className="bg-white border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg shadow-sm">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Stored Configurations
                                </h2>
                                <button
                                    onClick={handleNewConfiguration}
                                    className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                    New Config
                                </button>
                            </div>
                        </div>
                        <div className="p-2">
                            <GenericList
                                key={listKey}
                                columns={DICE_CONFIGURATION_COLUMNS}
                                serviceFunction={getConfigurationsService}
                                itemDesc="configuration"
                                initialLimit={10}
                                functions={{
                                    edit: handleSelectConfig,
                                    delete: handleDeleteConfig,
                                    detail: handleDetailConfig
                                }}
                            />
                        </div>
                    </div>

                    {/* Configuration Editor - Full Width */}
                    <div className="bg-white border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg shadow-sm">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {config.id ? 'Edit Configuration' : 'New Configuration'}
                            </h2>
                        </div>
                        <div className="p-6">
                            {/* Configuration Name and Default Flag */}
                            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Configuration Name
                                    </label>
                                    <input
                                        type="text"
                                        value={config.name}
                                        onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter configuration name..."
                                    />
                                </div>
                                <div className="flex items-center">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={config.isDefault}
                                            onChange={(e) => setConfig(prev => ({ ...prev, isDefault: e.target.checked }))}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                            Set as default configuration
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mb-6 flex flex-wrap gap-4">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || !config.name.trim()}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSaving ? 'Saving...' : config.id ? 'Update Configuration' : 'Create Configuration'}
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                                >
                                    Reset
                                </button>
                                {saveStatus === 'success' && (
                                    <span className="px-4 py-2 bg-green-100 text-green-800 rounded-md">
                                        Configuration saved successfully!
                                    </span>
                                )}
                                {saveStatus === 'error' && (
                                    <span className="px-4 py-2 bg-red-100 text-red-800 rounded-md">
                                        Failed to save configuration
                                    </span>
                                )}
                            </div>

                            {/* Configuration Form */}
                            <div className="space-y-8">
                                {/* Physics and Visual Settings - Side by Side */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Visual Controls and Test Dice */}
                                    <div className="space-y-6">
                                        {/* Visual Controls */}
                                        <div className="bg-content rounded-lg p-6 shadow-sm">
                                            <h3 className="text-lg font-semibold mb-4">Visual Settings</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <CustomSelect
                                                    options={THREE_D_DICE_THEME_SELECT_LIST}
                                                    value={typeof config.theme === 'number' ? config.theme : 1}
                                                    onValueChange={(theme) => handleConfigChange({ theme })}
                                                    label="Theme"
                                                />
                                                <div className="space-y-2">
                                                    <ColorPicker
                                                        label="Theme Color"
                                                        value={config.themeColor}
                                                        onChange={(color) => handleConfigChange({ themeColor: color })}
                                                        disabled={themeIgnoresColor}
                                                    />
                                                    {themeIgnoresColor && (
                                                        <p className="text-sm text-gray-500 italic">
                                                            This theme uses its own built-in colors and ignores the theme color setting.
                                                        </p>
                                                    )}
                                                </div>
                                                <SliderControl
                                                    label="Scale"
                                                    value={config.scale}
                                                    min={0.1}
                                                    max={9}
                                                    step={0.1}
                                                    onChange={(value) => handleConfigChange({ scale: value })}
                                                />
                                                <SliderControl
                                                    label="Light Intensity"
                                                    value={config.lightIntensity}
                                                    min={0}
                                                    max={5}
                                                    step={0.1}
                                                    onChange={(value) => handleConfigChange({ lightIntensity: value })}
                                                />
                                                <SliderControl
                                                    label="Shadow Transparency"
                                                    value={config.shadowTransparency}
                                                    min={0}
                                                    max={1}
                                                    step={0.01}
                                                    onChange={(value) => handleConfigChange({ shadowTransparency: value })}
                                                />
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium">
                                                        Enable Shadows
                                                    </label>
                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={config.enableShadows}
                                                            onChange={(e) => handleConfigChange({ enableShadows: e.target.checked })}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-content rounded"
                                                        />
                                                        <span className="ml-2 text-sm">
                                                            {config.enableShadows ? 'Enabled' : 'Disabled'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dice Testing */}
                                        <div className="bg-content rounded-lg p-6 shadow-sm">
                                            <h3 className="text-lg font-semibold mb-4">Test Dice</h3>
                                            <p className="text-sm text-secondary mb-4">
                                                Click on any die to test roll it with the current configuration.
                                            </p>
                                            <div className="grid grid-cols-7 gap-2">
                                                <DiceButton
                                                    diceType="d4"
                                                    colors={diceColorScheme?.default}
                                                />
                                                <DiceButton
                                                    diceType="d6"
                                                    colors={diceColorScheme?.default}
                                                />
                                                <DiceButton
                                                    diceType="d8"
                                                    colors={diceColorScheme?.default}
                                                />
                                                <DiceButton
                                                    diceType="d10"
                                                    colors={diceColorScheme?.default}
                                                />
                                                <DiceButton
                                                    diceType="d12"
                                                    colors={diceColorScheme?.default}
                                                />
                                                <DiceButton
                                                    diceType="d20"
                                                    colors={diceColorScheme?.default}
                                                />
                                                <DiceButton
                                                    diceType="d100"
                                                    colors={diceColorScheme?.default}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Physics Controls */}
                                    <div className="bg-content rounded-lg p-6 shadow-sm">
                                        <h3 className="text-lg font-semibold mb-4">Physics Settings</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <SliderControl
                                                label="Gravity"
                                                value={config.gravity}
                                                min={0}
                                                max={5}
                                                step={0.1}
                                                onChange={(value) => handleConfigChange({ gravity: value })}
                                            />
                                            <SliderControl
                                                label="Mass"
                                                value={config.mass}
                                                min={0}
                                                max={5}
                                                step={0.1}
                                                onChange={(value) => handleConfigChange({ mass: value })}
                                            />
                                            <SliderControl
                                                label="Friction"
                                                value={config.friction}
                                                min={0}
                                                max={2}
                                                step={0.1}
                                                onChange={(value) => handleConfigChange({ friction: value })}
                                            />
                                            <SliderControl
                                                label="Restitution"
                                                value={config.restitution}
                                                min={0}
                                                max={2}
                                                step={0.1}
                                                onChange={(value) => handleConfigChange({ restitution: value })}
                                            />
                                            <SliderControl
                                                label="Angular Damping"
                                                value={config.angularDamping}
                                                min={0}
                                                max={2}
                                                step={0.1}
                                                onChange={(value) => handleConfigChange({ angularDamping: value })}
                                            />
                                            <SliderControl
                                                label="Linear Damping"
                                                value={config.linearDamping}
                                                min={0}
                                                max={2}
                                                step={0.1}
                                                onChange={(value) => handleConfigChange({ linearDamping: value })}
                                            />
                                            <SliderControl
                                                label="Spin Force"
                                                value={config.spinForce}
                                                min={0}
                                                max={20}
                                                step={1}
                                                onChange={(value) => handleConfigChange({ spinForce: value })}
                                            />
                                            <SliderControl
                                                label="Throw Force"
                                                value={config.throwForce}
                                                min={0}
                                                max={20}
                                                step={1}
                                                onChange={(value) => handleConfigChange({ throwForce: value })}
                                            />
                                            <SliderControl
                                                label="Starting Height"
                                                value={config.startingHeight}
                                                min={1}
                                                max={20}
                                                step={1}
                                                onChange={(value) => handleConfigChange({ startingHeight: value })}
                                            />
                                            <SliderControl
                                                label="Settle Timeout (ms)"
                                                value={config.settleTimeout}
                                                min={1000}
                                                max={10000}
                                                step={10}
                                                onChange={(value) => handleConfigChange({ settleTimeout: value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 
