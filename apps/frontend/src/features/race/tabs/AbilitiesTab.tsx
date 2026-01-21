import React, { useState } from 'react';

import { formatSignedValue } from '@/lib/formatterUtils';
import { ABILITY_LIST, EntityAppliesToType, EntityType, FeatureSourceType } from '@shared/static-data';


import type { RaceTabProps } from './types';

export function AbilitiesTab({
    features = [],
    onAbilityChange
}: RaceTabProps): React.JSX.Element {
    const [focusedAbilityId, setFocusedAbilityId] = useState<number | null>(null);
    const [editingAbilityValue, setEditingAbilityValue] = useState('');

    // Helper function to extract ability adjustments from feature feature
    const getAbilityAdjustments = () => {
        const abilityFeatures = features.filter(fp =>
            fp.sourceType === FeatureSourceType.Race &&
            fp.entities?.some(e => e.type === EntityType.Base && e.appliesTo === EntityAppliesToType.Ability)
        );

        return ABILITY_LIST.map(ability => {
            const abilityFeature = abilityFeatures.find(fp =>
                fp.sourceType === FeatureSourceType.Race &&
                fp.entities?.some(e =>
                    e.type === EntityType.Base &&
                    e.appliesTo === EntityAppliesToType.Ability &&
                    e.appliesToId === ability.id
                )
            );
            const abilityEntity = abilityFeature?.entities?.find(e =>
                e.type === EntityType.Base &&
                e.appliesTo === EntityAppliesToType.Ability &&
                e.appliesToId === ability.id
            );
            return {
                abilityId: ability.id,
                value: abilityEntity?.value || 0
            };
        });
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h2 className="text-xl font-semibold mb-4">Ability Adjustments</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Configure ability score adjustments for this race. These adjustments are applied to characters of this race.
                </p>

                <div className="grid grid-cols-3 gap-2 border rounded p-4 dark:border-gray-600">
                    {ABILITY_LIST.map(ability => (
                        <div key={ability.id} className="flex items-center gap-2">
                            <label htmlFor={`ability-${ability.id}`} className="text-sm font-medium w-20">
                                {ability.name}:
                            </label>
                            <input
                                type="text"
                                id={`ability-${ability.id}`}
                                value={focusedAbilityId === ability.id ? editingAbilityValue : (() => {
                                    const adjustment = getAbilityAdjustments().find(adj => adj.abilityId === ability.id)?.value || 0;
                                    return formatSignedValue(adjustment);
                                })()}
                                onChange={(e) => setEditingAbilityValue(e.target.value)}
                                onFocus={() => {
                                    setFocusedAbilityId(ability.id);
                                    const currentAdjustment = getAbilityAdjustments().find(adj => adj.abilityId === ability.id)?.value || 0;
                                    setEditingAbilityValue(String(currentAdjustment));
                                }}
                                onBlur={() => {
                                    if (onAbilityChange) {
                                        const parsedValue = editingAbilityValue === '' || editingAbilityValue === '-' ? 0 : parseInt(editingAbilityValue) || 0;
                                        onAbilityChange(ability.id, parsedValue);
                                    }
                                    setFocusedAbilityId(null);
                                    setEditingAbilityValue('');
                                }}
                                className="w-10 p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
