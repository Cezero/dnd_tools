import React from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { CustomSelect } from '@/components/forms/FormComponents';
import { LANGUAGE_SELECT_LIST } from '@shared/static-data';
import { LanguageService } from '../../../lib/LanguageService';
import type { RaceTabProps } from './types';

export function LanguagesTab({
    formData,
    featureProgressions = [],
    onAddLanguage,
    onRemoveLanguage
}: RaceTabProps): React.JSX.Element {
    // Helper functions to extract languages from feature progression
    const getLanguages = () => {
        // Use LanguageService to extract languages
        const automaticLanguageIds = LanguageService.getAutomaticLanguages(featureProgressions);
        const bonusLanguageIds = LanguageService.getBonusLanguages(featureProgressions);

        const automaticLanguages = automaticLanguageIds.map(languageId => ({
            languageId,
            isAutomatic: true
        }));

        const bonusLanguages = bonusLanguageIds.map(languageId => ({
            languageId,
            isAutomatic: false
        }));

        return [...automaticLanguages, ...bonusLanguages];
    };

    const automaticLanguages = getLanguages().filter(lang => lang.isAutomatic);
    const bonusLanguages = getLanguages().filter(lang => !lang.isAutomatic);

    return (
        <div className="p-6 space-y-6">
            <div>
                <h2 className="text-xl font-semibold mb-4">Languages</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Configure languages for this race. Automatic languages are known by all members of this race, while bonus languages can be chosen during character creation.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Automatic Languages */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Automatic Languages</h3>
                        <div className="flex flex-wrap gap-2 mb-2 p-2 border rounded dark:border-gray-600 min-h-[40px]">
                            {automaticLanguages.length === 0 && <span className="text-gray-500 dark:text-gray-400">No automatic languages added.</span>}
                            {automaticLanguages.map((lang, index) => (
                                <span key={lang.languageId} className="group relative text-sm pt-1 pb-1 pl-0 pr-0 cursor-pointer">
                                    {LANGUAGE_SELECT_LIST.find(l => l.value === lang.languageId)?.label || 'Unknown Language'}
                                    {index < automaticLanguages.length - 1 && ','}
                                    <button
                                        type="button"
                                        onClick={() => onRemoveLanguage?.(lang.languageId)}
                                        className="absolute inset-0 flex items-center justify-center text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove Language"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </span>
                            ))}
                            <CustomSelect
                                label=""
                                value={null}
                                componentExtraClassName="flex items-center gap-1 text-sm"
                                itemExtraClassName="w-24 text-sm"
                                itemTextExtraClassName="w-16"
                                onValueChange={(value) => {
                                    if (value !== null && value !== undefined && onAddLanguage) {
                                        onAddLanguage(value as number, true);
                                    }
                                }}
                                options={LANGUAGE_SELECT_LIST
                                    .filter(lang => !getLanguages().some(rl => rl.languageId === lang.value))}
                                placeholder="Add"
                            />
                        </div>
                    </div>

                    {/* Bonus Languages */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Bonus Languages</h3>
                        <div className="flex flex-wrap gap-2 mb-2 p-2 border rounded dark:border-gray-600 min-h-[40px]">
                            {bonusLanguages.length === 0 && <span className="text-gray-500 dark:text-gray-400">No bonus languages added.</span>}
                            {bonusLanguages.map((lang, index) => (
                                <span key={lang.languageId} className="group relative text-sm pt-1 pb-1 pl-0 pr-0 cursor-pointer">
                                    {LANGUAGE_SELECT_LIST.find(l => l.value === lang.languageId)?.label || 'Unknown Language'}
                                    {index < bonusLanguages.length - 1 && ','}
                                    <button
                                        type="button"
                                        onClick={() => onRemoveLanguage?.(lang.languageId)}
                                        className="absolute inset-0 flex items-center justify-center text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove Language"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </span>
                            ))}
                            <CustomSelect
                                label=""
                                value={null}
                                componentExtraClassName="flex items-center gap-1 text-sm"
                                itemExtraClassName="w-24 text-sm"
                                itemTextExtraClassName="w-16"
                                onValueChange={(value) => {
                                    if (value !== null && value !== undefined && onAddLanguage) {
                                        onAddLanguage(value as number, false);
                                    }
                                }}
                                options={LANGUAGE_SELECT_LIST
                                    .filter(lang => !getLanguages().some(rl => rl.languageId === lang.value))}
                                placeholder="Add"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
