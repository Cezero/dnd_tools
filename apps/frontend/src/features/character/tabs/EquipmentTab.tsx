import React from 'react';

import type { RaceSummary, Race, CharacterWithAllDetailsResponse } from '@shared/schema';
import { CURRENCY_LIST } from '@shared/static-data';

interface EquipmentTabProps {
    character: CharacterWithAllDetailsResponse;
    onUpdate: (data: Partial<CharacterWithAllDetailsResponse>) => void;
    races?: RaceSummary[];
    selectedRaceDetails?: Race | null;
}

export function EquipmentTab({
    character,
    onUpdate,
    races: _races = [],
    selectedRaceDetails: _selectedRaceDetails
}: EquipmentTabProps): React.JSX.Element {
    const handleMoneyChange = (currencyId: number, value: number) => {
        const newMoney = { ...character.money, [currencyId]: value };
        onUpdate({ money: newMoney });
    };

    const handleEquipmentAdd = (item: string) => {
        if (item.trim()) {
            const newEquipment = [...character.equipment, item.trim()];
            onUpdate({ equipment: newEquipment });
        }
    };

    const handleEquipmentRemove = (index: number) => {
        const newEquipment = character.equipment.filter((_, i) => i !== index);
        onUpdate({ equipment: newEquipment });
    };

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Equipment
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Money */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Money
                    </h3>
                    <div className="space-y-3">
                        {CURRENCY_LIST.map((currency) => (
                            <div key={currency.id} className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {currency.name} ({currency.abbreviation})
                                </label>
                                <input
                                    type="number"
                                    value={character.money[currency.id] || 0}
                                    onChange={(e) => handleMoneyChange(currency.id, parseInt(e.target.value) || 0)}
                                    className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    min="0"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Equipment */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Equipment
                    </h3>
                    <div className="space-y-4">
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                placeholder="Add equipment item..."
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleEquipmentAdd(e.currentTarget.value);
                                        e.currentTarget.value = '';
                                    }
                                }}
                            />
                            <button
                                onClick={(e) => {
                                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                    handleEquipmentAdd(input.value);
                                    input.value = '';
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                Add
                            </button>
                        </div>

                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {character.equipment.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                                    <button
                                        onClick={() => handleEquipmentRemove(index)}
                                        className="text-red-500 hover:text-red-700 text-sm focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            {character.equipment.length === 0 && (
                                <p className="text-sm text-gray-500 italic">
                                    No equipment added yet.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 
