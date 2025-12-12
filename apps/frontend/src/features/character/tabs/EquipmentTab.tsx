import React from 'react';

import type { TabComponentProps } from '@/features/character/types';
import { CharacterEditStateUpdateType } from '@/features/character/types';
import { CURRENCY_LIST } from '@shared/static-data';

export function EquipmentTab({
    state,
    updateState,
    isLoading
}: TabComponentProps): React.JSX.Element {
    const handleMoneyChange = (currencyId: number, value: number) => {
        const newMoney = { ...state.money, [currencyId]: value };
        updateState({ type: CharacterEditStateUpdateType.SET_MONEY, payload: { money: newMoney } });
    };

    const handleEquipmentAdd = (item: string) => {
        if (item.trim()) {
            const newItem = {
                id: Date.now(),
                quantity: 1,
                location: null,
                notes: item.trim()
            };
            const newItems = [...state.equipment, newItem];
            updateState({ type: CharacterEditStateUpdateType.SET_EQUIPMENT, payload: { equipment: newItems } });
        }
    };

    const handleEquipmentRemove = (index: number) => {
        const newItems = state.equipment.filter((_, i) => i !== index);
        updateState({ type: CharacterEditStateUpdateType.SET_EQUIPMENT, payload: { equipment: newItems } });
    };

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Equipment
            </h2>

            {/* Loading State */}
            {isLoading && (
                <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg shadow-sm p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                Loading character data...
                            </h3>
                        </div>
                    </div>
                </div>
            )}

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
                                    value={state.money[currency.id] || 0}
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
                            {state.equipment.map((item, index) => (
                                <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div className="flex items-center space-x-4">
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{item.quantity}x</span>
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{item.notes}</span>
                                        {item.location && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400">({item.location})</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleEquipmentRemove(index)}
                                        className="text-red-500 hover:text-red-700 text-sm focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            {state.equipment.length === 0 && (
                                <p className="text-sm text-gray-500 italic">
                                    No equipment added yet.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Equipment Summary */}
            <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Equipment Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Total Items</h4>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {state.equipment.length} items
                        </p>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Total Value</h4>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {/* TODO: Calculate total value from equipment */}
                            Not calculated
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
