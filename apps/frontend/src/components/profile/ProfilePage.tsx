import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfileService } from '@/services/UserProfileService';
import { DiceBoxService } from '@/services/DiceBoxService';
import { DICE_THEME_SELECT_LIST, doesThemeIgnoreColor, getSystemNameById } from '@shared/static-data';
import type { UserProfileResponse, UpdateUserProfileRequest, GetAllDiceConfigsResponse, UserDiceConfig } from '@shared/schema';

import { UserIcon, Cog6ToothIcon, CubeIcon } from '@heroicons/react/24/outline';
import { withAuthContext } from '@/components/auth/withAuth';
import { CustomSelect } from '@/components/forms/FormComponents';
import { SliderControl } from '@/components/forms';
import { ColorPicker } from '@/components/widgets';
import { DiceButton, useDiceBox } from '@/components/dice-box';
import { generateDiceColorScheme } from '@/utils/color-scheme';
import type { AuthContextType } from '@/components/auth/types';
import type { DiceBoxAdminConfig } from '@shared/schema';

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
                                    <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                                        <div className="space-y-3">
                                            <div className="h-4 bg-gray-200 rounded"></div>
                                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                                    <div className="space-y-2">
                                        <div className="h-3 bg-gray-200 rounded"></div>
                                        <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                                        <div className="h-3 bg-gray-200 rounded w-3/5"></div>
                                    </div>
                                </div>
                            </div>
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
                    <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
                        <p className="text-red-800 dark:text-red-200">{error}</p>
                        <button
                            onClick={loadProfile}
                            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Profile</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Manage your account settings and preferences
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Tab Navigation */}
                    <div className="lg:col-span-1">
                        <nav className="space-y-1">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.id
                                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        <Icon className="mr-3 h-5 w-5" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                            {(() => {
                                const activeTabConfig = tabs.find(tab => tab.id === activeTab);
                                if (!activeTabConfig) return null;
                                const TabComponent = activeTabConfig.component;
                                return <TabComponent profile={profile} onUpdate={handleUpdate} />;
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export const ProfilePage = withAuthContext(ProfilePageComponent);

// Tab Components
function IdentityTab({ profile, onUpdate }: { profile: UserProfileResponse | null; onUpdate: (data: Partial<UpdateUserProfileRequest>) => Promise<void> }): React.JSX.Element {
    const [formData, setFormData] = useState({
        username: profile?.username || '',
        email: profile?.email || '',
        firstName: profile?.firstName || '',
        lastName: profile?.lastName || '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    const handleSave = async (): Promise<void> => {
        try {
            setIsSaving(true);
            setMessage('');
            await onUpdate(formData);
            setMessage('Profile updated successfully');
        } catch (err) {
            setMessage('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Identity Information</h2>

            {message && (
                <div className={`mb-4 p-3 rounded ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message}
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Username
                    </label>
                    <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        First Name
                    </label>
                    <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Last Name
                    </label>
                    <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <div className="pt-4">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function DndPreferencesTab({ profile, onUpdate }: { profile: UserProfileResponse | null; onUpdate: (data: Partial<UpdateUserProfileRequest>) => Promise<void> }): React.JSX.Element {
    const [formData, setFormData] = useState({
        preferredEditionId: profile?.preferredEditionId || 1,
        showAdvancedOptions: profile?.showAdvancedOptions || false,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    const handleSave = async (): Promise<void> => {
        try {
            setIsSaving(true);
            setMessage('');
            await onUpdate(formData);
            setMessage('Preferences updated successfully');
        } catch (err) {
            setMessage('Failed to update preferences');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">D&D Preferences</h2>

            {message && (
                <div className={`mb-4 p-3 rounded ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message}
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Preferred Edition
                    </label>
                    <CustomSelect
                        value={formData.preferredEditionId}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, preferredEditionId: value as number }))}
                        options={[
                            { value: 1, label: '3.5 Edition' },
                            { value: 2, label: 'Pathfinder 1e' },
                        ]}
                    />
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="showAdvancedOptions"
                        checked={formData.showAdvancedOptions}
                        onChange={(e) => setFormData(prev => ({ ...prev, showAdvancedOptions: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="showAdvancedOptions" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Show Advanced Options
                    </label>
                </div>

                <div className="pt-4">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Save Preferences'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function DiceConfigTab({ profile, onUpdate }: { profile: UserProfileResponse | null; onUpdate: (data: Partial<UpdateUserProfileRequest>) => Promise<void> }): React.JSX.Element {
    const [availableConfigs, setAvailableConfigs] = useState<GetAllDiceConfigsResponse | null>(null);
    const [userConfig, setUserConfig] = useState<UserDiceConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const { diceBox } = useDiceBox();

    const getCurrentValue = (propertyName: string, defaultValue: any) => {
        if (userConfig?.overrides && userConfig.overrides[propertyName] !== undefined) {
            return userConfig.overrides[propertyName];
        }
        if (userConfig?.configId && availableConfigs) {
            const config = availableConfigs.results.find(c => c.id === userConfig.configId);
            if (config && config[propertyName as keyof typeof config] !== undefined) {
                return config[propertyName as keyof typeof config];
            }
        }
        return defaultValue;
    };

    useEffect(() => {
        loadAvailableConfigs();
    }, []);

    const loadAvailableConfigs = async () => {
        try {
            setIsLoading(true);
            const [configsResponse, userConfigResponse] = await Promise.all([
                DiceBoxService.getAvailableConfigs(),
                DiceBoxService.getUserDiceConfig()
            ]);
            setAvailableConfigs(configsResponse);
            setUserConfig(userConfigResponse);
        } catch (err) {
            console.error('Failed to load dice configurations:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!userConfig) return;

        try {
            setIsSaving(true);
            setMessage('');
            await DiceBoxService.updateUserDiceConfig(userConfig);
            setMessage('Dice configuration updated successfully');

            // Refresh the dice box with new configuration
            if (diceBox) {
                diceBox.configure(userConfig);
            }
        } catch (err) {
            console.error('Failed to update dice configuration:', err);
            setMessage('Failed to update dice configuration');
        } finally {
            setIsSaving(false);
        }
    };

    const handleOverrideChange = (propertyName: string, value: string | number | boolean) => {
        if (!userConfig) return;

        setUserConfig(prev => {
            if (!prev) return prev;

            const newOverrides = { ...prev.overrides };
            if (value === getCurrentValue(propertyName, null)) {
                // Remove override if it matches the base value
                delete newOverrides[propertyName];
            } else {
                // Set override
                newOverrides[propertyName] = value;
            }

            return {
                ...prev,
                overrides: newOverrides
            };
        });
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
                    <div className="space-y-4">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!availableConfigs || !userConfig) {
        return (
            <div className="p-6">
                <div className="text-red-600">Failed to load dice configurations</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Dice Configuration</h2>

            {message && (
                <div className={`mb-4 p-3 rounded ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message}
                </div>
            )}

            <div className="space-y-6">
                {/* Configuration Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Base Configuration
                    </label>
                    <CustomSelect
                        value={userConfig.configId}
                        onValueChange={(value) => setUserConfig(prev => prev ? { ...prev, configId: value as number } : null)}
                        options={availableConfigs.results.map(config => ({
                            value: config.id,
                            label: config.name
                        }))}
                    />
                </div>

                {/* Theme Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Theme
                    </label>
                    <CustomSelect
                        value={getCurrentValue('theme', 'default')}
                        onValueChange={(value) => handleOverrideChange('theme', value)}
                        options={DICE_THEME_SELECT_LIST}
                    />
                </div>

                {/* Color Scheme */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Color Scheme
                    </label>
                    <ColorPicker
                        value={getCurrentValue('colorScheme', '#000000')}
                        onChange={(color) => handleOverrideChange('colorScheme', color)}
                        disabled={doesThemeIgnoreColor(getCurrentValue('theme', 'default'))}
                    />
                </div>

                {/* Size Slider */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Size: {getCurrentValue('size', 100)}%
                    </label>
                    <SliderControl
                        value={getCurrentValue('size', 100)}
                        onChange={(value) => handleOverrideChange('size', value)}
                        min={50}
                        max={200}
                        step={10}
                    />
                </div>

                {/* Test Dice */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Test Dice
                    </label>
                    <div className="flex space-x-2">
                        <DiceButton diceType="d4" />
                        <DiceButton diceType="d6" />
                        <DiceButton diceType="d8" />
                        <DiceButton diceType="d10" />
                        <DiceButton diceType="d12" />
                        <DiceButton diceType="d20" />
                        <DiceButton diceType="d100" />
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            </div>
        </div>
    );
} 
