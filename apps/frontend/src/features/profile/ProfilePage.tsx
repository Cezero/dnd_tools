import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfileService } from '@/services/UserProfileService';
import { DiceBoxService } from '@/services/DiceBoxService';
import { DICE_THEME_SELECT_LIST, doesThemeIgnoreColor, getSystemNameById } from '@shared/static-data';
import type { UserProfileResponse, UpdateUserProfileRequest, DiceBoxAdminConfig, GetAllDiceConfigsResponse } from '@shared/schema';
import { UserIcon, Cog6ToothIcon, CubeIcon } from '@heroicons/react/24/outline';
import { withAuthContext } from '@/components/auth/withAuth';
import { CustomSelect } from '@/components/forms/FormComponents';
import { SliderControl } from '@/components/forms';
import { ColorPicker } from '@/components/widgets';
import { DiceButton, useDiceBox } from '@/components/dice-box';
import { generateDiceColorScheme } from '@/utils/color-scheme';
import type { AuthContextType } from '@/components/auth/types';

interface ProfilePageProps {
    auth: AuthContextType;
}

interface TabConfig {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    component: React.ComponentType<{ profile: UserProfileResponse | null; onUpdate: (data: Partial<UpdateUserProfileRequest>) => Promise<void> }>;
}

const tabs: TabConfig[] = [
    {
        id: 'identity',
        label: 'Identity',
        icon: UserIcon,
        component: IdentityTab
    },
    {
        id: 'dnd-preferences',
        label: 'DnD Preferences',
        icon: Cog6ToothIcon,
        component: DndPreferencesTab
    },
    {
        id: 'dice-config',
        label: 'Dice Configuration',
        icon: CubeIcon,
        component: DiceConfigTab
    }
];

function ProfilePageComponent({ auth }: ProfilePageProps): React.JSX.Element {
    const [activeTab, setActiveTab] = useState<string>('identity');
    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async (): Promise<void> => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await UserProfileService.getUserProfile({});
            setProfile(response);
        } catch (err) {
            console.error('Failed to load profile:', err);
            setError('Failed to load profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async (data: Partial<UpdateUserProfileRequest>): Promise<void> => {
        try {
            const response = await UserProfileService.updateUserProfile(data);
            setProfile(response.user);

            // Update auth context with new token and user data
            if (response.token) {
                localStorage.setItem('token', response.token);
                // Note: You might need to add a method to refresh user data in auth context
            }

            // Note: No need to refresh dice config here since the DiceBox is already properly configured
            // from the test dice interactions on the profile page
        } catch (err) {
            console.error('Failed to update profile:', err);
            throw err;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
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

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                                    Error loading profile
                                </h3>
                                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                    {error}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const ActiveTabComponent = tabs.find(tab => tab.id === activeTab)?.component || IdentityTab;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex space-x-8">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`${activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                            } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="mt-6">
                        <ActiveTabComponent profile={profile} onUpdate={handleUpdate} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function IdentityTab({ profile, onUpdate }: { profile: UserProfileResponse | null; onUpdate: (data: Partial<UpdateUserProfileRequest>) => Promise<void> }): React.JSX.Element {
    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Identity Information
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your account information and preferences.
            </p>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Username
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {profile?.username || 'Not available'}
                    </p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {profile?.email || 'Not available'}
                    </p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Account Type
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {profile?.isAdmin ? 'Administrator' : 'User'}
                    </p>
                </div>
            </div>
        </div>
    );
}

function DndPreferencesTab({ profile, onUpdate }: { profile: UserProfileResponse | null; onUpdate: (data: Partial<UpdateUserProfileRequest>) => Promise<void> }): React.JSX.Element {
    const [preferredEditionId, setPreferredEditionId] = useState<number | null>(profile?.preferredEditionId || null);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);

    useEffect(() => {
        if (profile?.preferredEditionId !== undefined) {
            setPreferredEditionId(profile.preferredEditionId);
        }
    }, [profile]);

    const handleSave = async (): Promise<void> => {
        try {
            setIsUpdating(true);
            await onUpdate({
                preferredEditionId: preferredEditionId
            });
        } catch (error) {
            console.error('Failed to update DnD preferences:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                DnD Preferences
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
                Configure your Dungeons & Dragons preferences.
            </p>
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Preferred Edition
                    </label>
                    <select
                        value={preferredEditionId || ''}
                        onChange={(e) => setPreferredEditionId(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Select an edition...</option>
                        <option value="1">1st Edition</option>
                        <option value="2">2nd Edition</option>
                        <option value="3">3rd Edition</option>
                        <option value="3.5">3.5 Edition</option>
                        <option value="4">4th Edition</option>
                        <option value="5">5th Edition</option>
                    </select>
                </div>

                <div>
                    <button
                        onClick={handleSave}
                        disabled={isUpdating}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isUpdating ? 'Saving...' : 'Save Preferences'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function DiceConfigTab({ profile, onUpdate }: { profile: UserProfileResponse | null; onUpdate: (data: Partial<UpdateUserProfileRequest>) => Promise<void> }): React.JSX.Element {
    const [availableConfigs, setAvailableConfigs] = useState<GetAllDiceConfigsResponse | null>(null);
    const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
    const [selectedConfig, setSelectedConfig] = useState<DiceBoxAdminConfig | null>(null);
    const [overrides, setOverrides] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingConfigs, setIsLoadingConfigs] = useState(true);
    const { isReady, reinitializeWithConfig } = useDiceBox();
    const isInitializedRef = useRef<boolean>(false);

    // Helper function to get current value (override or base config)
    const getCurrentValue = (propertyName: string, defaultValue: any) => {
        const overrideValue = overrides[propertyName];
        if (overrideValue !== undefined) {
            // Convert string to appropriate type
            if (typeof defaultValue === 'number') {
                return parseFloat(overrideValue);
            } else if (typeof defaultValue === 'boolean') {
                return overrideValue === 'true';
            }
            return overrideValue;
        }
        return selectedConfig?.[propertyName as keyof DiceBoxAdminConfig] ?? defaultValue;
    };

    // Check if the current theme ignores the theme color
    const currentTheme = getCurrentValue('theme', 1);
    const themeIgnoresColor = currentTheme ? (() => {
        if (typeof currentTheme === 'number') {
            const systemName = getSystemNameById(currentTheme);
            return systemName ? doesThemeIgnoreColor(systemName) : false;
        } else if (typeof currentTheme === 'string') {
            return doesThemeIgnoreColor(currentTheme);
        }
        return false;
    })() : false;

    // Generate dice color scheme from current configuration
    const diceColorScheme = React.useMemo(() => {
        try {
            const themeColor = getCurrentValue('themeColor', '#2e8555');
            const iconColor = getCurrentValue('iconColor', selectedConfig?.iconColor || themeColor);

            // Use iconColor if available, otherwise fall back to themeColor
            const baseColor = iconColor || themeColor;
            return generateDiceColorScheme(baseColor);
        } catch (error) {
            console.error('Failed to generate dice color scheme:', error);
            return null;
        }
    }, [overrides.themeColor, overrides.iconColor, selectedConfig?.themeColor, selectedConfig?.iconColor]);

    // Load available dice configurations
    const loadAvailableConfigs = async () => {
        try {
            setIsLoadingConfigs(true);
            const configs = await DiceBoxService.getAvailableConfigs();
            setAvailableConfigs(configs);
        } catch (error) {
            console.error('Failed to load available configs:', error);
        } finally {
            setIsLoadingConfigs(false);
        }
    };

    // Update selectedConfig when selectedConfigId or availableConfigs change
    useEffect(() => {
        if (availableConfigs && selectedConfigId) {
            const config = availableConfigs.results.find(c => c.id === selectedConfigId);
            setSelectedConfig(config || null);
        } else {
            setSelectedConfig(null);
        }
    }, [selectedConfigId, availableConfigs]);

    // Load available configs on mount
    useEffect(() => {
        loadAvailableConfigs();
    }, []);

    // Initialize with user's current dice configuration
    useEffect(() => {
        if (profile?.diceConfig) {
            setSelectedConfigId(profile.diceConfig.baseConfigId);
            setOverrides(profile.diceConfig.overrides);
        }
    }, [profile]);

    // Initialize DiceBox when everything is ready
    useEffect(() => {
        // Wait for all required data to be loaded
        if (isReady && selectedConfig && profile?.diceConfig && !isInitializedRef.current) {
            try {

                // Get only the properties that DiceBox.updateConfig() supports (from DiceBoxConfig type)
                const theme = getCurrentValue('theme', 1);
                const themeColor = getCurrentValue('themeColor', '#2e8555');
                const scale = getCurrentValue('scale', 6);
                const lightIntensity = getCurrentValue('lightIntensity', 1);
                const enableShadows = getCurrentValue('enableShadows', true);
                const shadowTransparency = getCurrentValue('shadowTransparency', 0.8);
                const gravity = getCurrentValue('gravity', 1);
                const mass = getCurrentValue('mass', 1);
                const friction = getCurrentValue('friction', 0.8);
                const restitution = getCurrentValue('restitution', 0);
                const angularDamping = getCurrentValue('angularDamping', 0.4);
                const linearDamping = getCurrentValue('linearDamping', 0.4);
                const spinForce = getCurrentValue('spinForce', 4);
                const throwForce = getCurrentValue('throwForce', 5);
                const startingHeight = getCurrentValue('startingHeight', 8);
                const settleTimeout = getCurrentValue('settleTimeout', 5000);

                // Convert numeric theme ID to system name for DiceBox
                const themeSystemName = typeof theme === 'number'
                    ? getSystemNameById(theme)
                    : theme;

                const configToApply = {
                    theme: themeSystemName,
                    themeColor: themeColor,
                    scale: scale,
                    lightIntensity: lightIntensity,
                    enableShadows: enableShadows,
                    shadowTransparency: shadowTransparency,
                    gravity: gravity,
                    mass: mass,
                    friction: friction,
                    restitution: restitution,
                    angularDamping: angularDamping,
                    linearDamping: linearDamping,
                    spinForce: spinForce,
                    throwForce: throwForce,
                    startingHeight: startingHeight,
                    settleTimeout: settleTimeout
                };

                // Only pass properties that DiceBox.updateConfig() supports (from DiceBoxConfig type)
                reinitializeWithConfig(configToApply);

                // Mark as initialized
                isInitializedRef.current = true;
            } catch (error) {
                console.error('Failed to update DiceBox with user config:', error);
            }
        } else if (isReady && selectedConfig && !isInitializedRef.current) {
            // Fallback: Initialize with selected config even if user profile isn't loaded yet
            try {

                const configToApply = {
                    theme: typeof selectedConfig.theme === 'number'
                        ? getSystemNameById(selectedConfig.theme)
                        : selectedConfig.theme,
                    themeColor: selectedConfig.themeColor,
                    scale: selectedConfig.scale,
                    lightIntensity: selectedConfig.lightIntensity,
                    enableShadows: selectedConfig.enableShadows,
                    shadowTransparency: selectedConfig.shadowTransparency,
                    gravity: selectedConfig.gravity,
                    mass: selectedConfig.mass,
                    friction: selectedConfig.friction,
                    restitution: selectedConfig.restitution,
                    angularDamping: selectedConfig.angularDamping,
                    linearDamping: selectedConfig.linearDamping,
                    spinForce: selectedConfig.spinForce,
                    throwForce: selectedConfig.throwForce,
                    startingHeight: selectedConfig.startingHeight,
                    settleTimeout: selectedConfig.settleTimeout
                };

                reinitializeWithConfig(configToApply);
                isInitializedRef.current = true;
            } catch (error) {
                console.error('Failed to update DiceBox with fallback config:', error);
            }
        } else if (isReady && selectedConfig && profile?.diceConfig && isInitializedRef.current) {
            // Re-initialize if user profile is loaded after initial initialization
            try {

                // Get only the properties that DiceBox.updateConfig() supports (from DiceBoxConfig type)
                const theme = getCurrentValue('theme', 1);
                const themeColor = getCurrentValue('themeColor', '#2e8555');
                const scale = getCurrentValue('scale', 6);
                const lightIntensity = getCurrentValue('lightIntensity', 1);
                const enableShadows = getCurrentValue('enableShadows', true);
                const shadowTransparency = getCurrentValue('shadowTransparency', 0.8);
                const gravity = getCurrentValue('gravity', 1);
                const mass = getCurrentValue('mass', 1);
                const friction = getCurrentValue('friction', 0.8);
                const restitution = getCurrentValue('restitution', 0);
                const angularDamping = getCurrentValue('angularDamping', 0.4);
                const linearDamping = getCurrentValue('linearDamping', 0.4);
                const spinForce = getCurrentValue('spinForce', 4);
                const throwForce = getCurrentValue('throwForce', 5);
                const startingHeight = getCurrentValue('startingHeight', 8);
                const settleTimeout = getCurrentValue('settleTimeout', 5000);

                // Convert numeric theme ID to system name for DiceBox
                const themeSystemName = typeof theme === 'number'
                    ? getSystemNameById(theme)
                    : theme;

                const configToApply = {
                    theme: themeSystemName,
                    themeColor: themeColor,
                    scale: scale,
                    lightIntensity: lightIntensity,
                    enableShadows: enableShadows,
                    shadowTransparency: shadowTransparency,
                    gravity: gravity,
                    mass: mass,
                    friction: friction,
                    restitution: restitution,
                    angularDamping: angularDamping,
                    linearDamping: linearDamping,
                    spinForce: spinForce,
                    throwForce: throwForce,
                    startingHeight: startingHeight,
                    settleTimeout: settleTimeout
                };

                reinitializeWithConfig(configToApply);
            } catch (error) {
                console.error('Failed to re-update DiceBox with user config:', error);
            }
        }
    }, [isReady, selectedConfig, profile?.diceConfig, overrides]);

    const handleSave = async () => {
        if (!selectedConfigId) return;

        try {
            setIsLoading(true);
            await onUpdate({
                diceConfig: {
                    baseConfigId: selectedConfigId,
                    overrides
                }
            });
        } catch (error) {
            console.error('Failed to update dice configuration:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOverrideChange = (propertyName: string, value: string | number | boolean) => {
        setOverrides(prev => {
            const newOverrides = {
                ...prev,
                [propertyName]: value.toString()
            };
            return newOverrides;
        });
    };

    // Debounced DiceBox update
    const debouncedUpdateDiceBox = useCallback(() => {
        if (!isReady) {
            return;
        }

        // Don't update if we don't have a selected config yet
        if (!selectedConfig) {
            return;
        }

        try {
            // Get only the properties that DiceBox.updateConfig() supports (from DiceBoxConfig type)
            const theme = getCurrentValue('theme', 1);
            const themeColor = getCurrentValue('themeColor', '#2e8555');
            const scale = getCurrentValue('scale', 6);
            const lightIntensity = getCurrentValue('lightIntensity', 1);
            const enableShadows = getCurrentValue('enableShadows', true);
            const shadowTransparency = getCurrentValue('shadowTransparency', 0.8);
            const gravity = getCurrentValue('gravity', 1);
            const mass = getCurrentValue('mass', 1);
            const friction = getCurrentValue('friction', 0.8);
            const restitution = getCurrentValue('restitution', 0);
            const angularDamping = getCurrentValue('angularDamping', 0.4);
            const linearDamping = getCurrentValue('linearDamping', 0.4);
            const spinForce = getCurrentValue('spinForce', 4);
            const throwForce = getCurrentValue('throwForce', 5);
            const startingHeight = getCurrentValue('startingHeight', 8);
            const settleTimeout = getCurrentValue('settleTimeout', 5000);

            // Convert numeric theme ID to system name for DiceBox
            const themeSystemName = typeof theme === 'number'
                ? getSystemNameById(theme)
                : theme;

            const configToApply = {
                theme: themeSystemName,
                themeColor: themeColor,
                scale: scale,
                lightIntensity: lightIntensity,
                enableShadows: enableShadows,
                shadowTransparency: shadowTransparency,
                gravity: gravity,
                mass: mass,
                friction: friction,
                restitution: restitution,
                angularDamping: angularDamping,
                linearDamping: linearDamping,
                spinForce: spinForce,
                throwForce: throwForce,
                startingHeight: startingHeight,
                settleTimeout: settleTimeout
            };

            // Only pass properties that DiceBox.updateConfig() supports (from DiceBoxConfig type)
            reinitializeWithConfig(configToApply);
        } catch (error) {
            console.error('Failed to update DiceBox configuration:', error);
        }
    }, [isReady, reinitializeWithConfig, selectedConfig, overrides]);

    // Debounce timer ref
    const debounceTimerRef = useRef<number | null>(null);

    // Track previous overrides to detect actual changes
    const previousOverridesRef = useRef<Record<string, string>>({});

    // Update DiceBox when properties change (debounced)
    useEffect(() => {
        // Only trigger if overrides actually changed
        const overridesChanged = JSON.stringify(previousOverridesRef.current) !== JSON.stringify(overrides);

        if (!overridesChanged) {
            return;
        }

        // Trigger on any property changes that affect DiceBox behavior
        const diceBoxProps = [
            'theme', 'themeColor', 'scale', 'lightIntensity', 'enableShadows', 'shadowTransparency',
            'gravity', 'mass', 'friction', 'restitution', 'angularDamping', 'linearDamping',
            'spinForce', 'throwForce', 'startingHeight', 'settleTimeout'
        ];
        const hasDiceBoxChanges = diceBoxProps.some(prop => prop in overrides);

        if (hasDiceBoxChanges && isReady && isInitializedRef.current) {
            // Don't trigger debounced updates during initial user config load
            if (profile?.diceConfig && Object.keys(overrides).length === 0) {
                return;
            }

            // Clear existing timer
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            // Set new timer
            debounceTimerRef.current = setTimeout(() => {
                debouncedUpdateDiceBox();
            }, 500);
        }

        // Update the previous overrides ref
        previousOverridesRef.current = overrides;

        // Mark as initialized after first load
        if (isReady && !isInitializedRef.current) {
            isInitializedRef.current = true;
        }

        // Cleanup timer on unmount
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [overrides, isReady, debouncedUpdateDiceBox]);



    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Dice Configuration
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
                Select a base dice configuration and customize it to your preferences. Your overrides will be applied on top of the base configuration.
            </p>

            {isLoadingConfigs ? (
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Base Configuration Selection */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Base Configuration
                        </h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Select Base Configuration
                            </label>
                            <select
                                value={selectedConfigId || ''}
                                onChange={(e) => setSelectedConfigId(Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select a configuration...</option>
                                {availableConfigs?.results.map(config => (
                                    <option key={config.id} value={config.id}>
                                        {config.name} {config.isDefault ? '(Default)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Configuration Overrides */}
                    {selectedConfig && (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Customize Configuration
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                    Adjust these settings to override the base configuration. Leave empty to use the base configuration value.
                                </p>

                                {/* Visual and Physics Settings - Side by Side */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Visual Controls and Test Dice */}
                                    <div className="space-y-6">
                                        {/* Visual Controls */}
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 shadow-sm">
                                            <h4 className="text-md font-semibold mb-4 text-gray-900 dark:text-white">Visual Settings</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <CustomSelect
                                                    options={DICE_THEME_SELECT_LIST}
                                                    value={getCurrentValue('theme', 1)}
                                                    onValueChange={(theme) => handleOverrideChange('theme', theme)}
                                                    label="3D Dice Theme"
                                                />
                                                <div className="space-y-2">
                                                    <ColorPicker
                                                        label="Theme Color"
                                                        value={getCurrentValue('themeColor', '#2e8555')}
                                                        onChange={(color) => handleOverrideChange('themeColor', color)}
                                                        disabled={themeIgnoresColor}
                                                    />
                                                    {themeIgnoresColor && (
                                                        <p className="text-sm text-gray-500 italic">
                                                            This theme uses its own built-in colors and ignores the theme color setting.
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <ColorPicker
                                                        label="Dice Button Color (Optional)"
                                                        value={getCurrentValue('iconColor', selectedConfig?.iconColor || getCurrentValue('themeColor', '#2e8555'))}
                                                        onChange={(color) => handleOverrideChange('iconColor', color)}
                                                    />
                                                    <p className="text-sm text-gray-500 italic">
                                                        Custom color for dice button icons. Leave empty to use theme color.
                                                    </p>
                                                </div>
                                                <SliderControl
                                                    label="Scale"
                                                    value={getCurrentValue('scale', 6)}
                                                    min={0.1}
                                                    max={9}
                                                    step={0.1}
                                                    onChange={(value) => handleOverrideChange('scale', value)}
                                                />
                                                <SliderControl
                                                    label="Light Intensity"
                                                    value={getCurrentValue('lightIntensity', 1)}
                                                    min={0}
                                                    max={5}
                                                    step={0.1}
                                                    onChange={(value) => handleOverrideChange('lightIntensity', value)}
                                                />
                                                <SliderControl
                                                    label="Shadow Transparency"
                                                    value={getCurrentValue('shadowTransparency', 0.8)}
                                                    min={0}
                                                    max={1}
                                                    step={0.01}
                                                    onChange={(value) => handleOverrideChange('shadowTransparency', value)}
                                                />
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Enable Shadows
                                                    </label>
                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={getCurrentValue('enableShadows', true)}
                                                            onChange={(e) => handleOverrideChange('enableShadows', e.target.checked)}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                                                        />
                                                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                                            {getCurrentValue('enableShadows', true) ? 'Enabled' : 'Disabled'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dice Testing */}
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 shadow-sm">
                                            <h4 className="text-md font-semibold mb-4 text-gray-900 dark:text-white">Test Dice</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
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
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 shadow-sm">
                                        <h4 className="text-md font-semibold mb-4 text-gray-900 dark:text-white">Physics Settings</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <SliderControl
                                                label="Gravity"
                                                value={getCurrentValue('gravity', 1)}
                                                min={0}
                                                max={5}
                                                step={0.1}
                                                onChange={(value) => handleOverrideChange('gravity', value)}
                                            />
                                            <SliderControl
                                                label="Mass"
                                                value={getCurrentValue('mass', 1)}
                                                min={0}
                                                max={5}
                                                step={0.1}
                                                onChange={(value) => handleOverrideChange('mass', value)}
                                            />
                                            <SliderControl
                                                label="Friction"
                                                value={getCurrentValue('friction', 0.8)}
                                                min={0}
                                                max={2}
                                                step={0.1}
                                                onChange={(value) => handleOverrideChange('friction', value)}
                                            />
                                            <SliderControl
                                                label="Restitution"
                                                value={getCurrentValue('restitution', 0)}
                                                min={0}
                                                max={2}
                                                step={0.1}
                                                onChange={(value) => handleOverrideChange('restitution', value)}
                                            />
                                            <SliderControl
                                                label="Angular Damping"
                                                value={getCurrentValue('angularDamping', 0.4)}
                                                min={0}
                                                max={2}
                                                step={0.1}
                                                onChange={(value) => handleOverrideChange('angularDamping', value)}
                                            />
                                            <SliderControl
                                                label="Linear Damping"
                                                value={getCurrentValue('linearDamping', 0.4)}
                                                min={0}
                                                max={2}
                                                step={0.1}
                                                onChange={(value) => handleOverrideChange('linearDamping', value)}
                                            />
                                            <SliderControl
                                                label="Spin Force"
                                                value={getCurrentValue('spinForce', 4)}
                                                min={0}
                                                max={20}
                                                step={1}
                                                onChange={(value) => handleOverrideChange('spinForce', value)}
                                            />
                                            <SliderControl
                                                label="Throw Force"
                                                value={getCurrentValue('throwForce', 5)}
                                                min={0}
                                                max={20}
                                                step={1}
                                                onChange={(value) => handleOverrideChange('throwForce', value)}
                                            />
                                            <SliderControl
                                                label="Starting Height"
                                                value={getCurrentValue('startingHeight', 8)}
                                                min={1}
                                                max={20}
                                                step={1}
                                                onChange={(value) => handleOverrideChange('startingHeight', value)}
                                            />
                                            <SliderControl
                                                label="Settle Timeout (ms)"
                                                value={getCurrentValue('settleTimeout', 5000)}
                                                min={1000}
                                                max={10000}
                                                step={10}
                                                onChange={(value) => handleOverrideChange('settleTimeout', value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={!selectedConfigId || isLoading}
                            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export const ProfilePage = withAuthContext(ProfilePageComponent); 
