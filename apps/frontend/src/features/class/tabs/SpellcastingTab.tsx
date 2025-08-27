import React from 'react';

import { CustomSelect, CustomCheckbox } from '@/components/forms';
import { SpellProgressionEditor } from '@/components/spell-progression';
import type { CreateSpellcastingProgressionRequest } from '@shared/schema';
import { ABILITY_SELECT_LIST, CASTING_TYPE_SELECT_LIST, CastingType } from '@shared/static-data';

import type { ClassTabProps } from './types';

export function SpellcastingTab({
    formData,
    setFormData,
    validation: _validation,
    isLoading: _isLoading = false,
    spellcastingProgression = [],
    setSpellcastingProgression,
    spellsKnownProgression = [],
    setSpellsKnownProgression
}: ClassTabProps): React.JSX.Element {
    console.log('SpellcastingTab received progression:', spellcastingProgression);
    return (
        <div className="p-6 space-y-6">
            {/* Casting Configuration */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Casting Configuration</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="max-w-md">
                        <CustomSelect
                            label="Casting Ability"
                            required
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-32"
                            value={formData.castingAbilityId}
                            onValueChange={(value) => setFormData({ ...formData, castingAbilityId: value as number | null })}
                            options={ABILITY_SELECT_LIST.map(ability => ({ value: ability.value, label: ability.label }))}
                            placeholder="Select casting ability"
                        />
                    </div>

                    <div className="max-w-md">
                        <CustomSelect
                            label="Casting Type"
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-32"
                            value={formData.castingType}
                            onValueChange={(value) => setFormData({ ...formData, castingType: value as CastingType | null })}
                            options={CASTING_TYPE_SELECT_LIST}
                            placeholder="Select casting type"
                        />
                    </div>
                </div>

                <div className="max-w-md">
                    <CustomCheckbox
                        label="Has Spells Known"
                        checked={formData.spellsKnown || false}
                        onCheckedChange={(checked) => setFormData({ ...formData, spellsKnown: checked })}
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Check if this class has a limited number of spells known (like Bards or Sorcerers)
                    </p>
                </div>
            </div>

            {/* Spell Progression */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Spell Progression</h3>
                {formData.canCastSpells ? (
                    <>
                        {/* How to Use Info Box */}
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="text-sm text-blue-800 dark:text-blue-200">
                                <div className="font-medium mb-2">How to Use:</div>
                                <div className="space-y-1">
                                    <div>• Click on any cell to edit spell slots for that level</div>
                                    <div>• Empty cells indicate no spellcasting at that level</div>
                                    <div>• Clear All to reset all spell slots</div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Spell Slots Progression */}
                            <div>
                                <h4 className="text-md font-medium mb-3">Spell Slots by Level</h4>
                                <SpellProgressionEditor
                                    progression={spellcastingProgression || []}
                                    originalProgression={spellcastingProgression || []}
                                    onProgressionChange={(newProgression: CreateSpellcastingProgressionRequest[]) => {
                                        if (setSpellcastingProgression) {
                                            // Convert from editor format back to database format
                                            // Only include levels that have slots
                                            const dbProgression = newProgression
                                                .filter(level => level.slots && level.slots.length > 0)
                                                .map(level => ({
                                                    id: 0, // Will be set by backend
                                                    classId: 0, // Will be set by backend
                                                    classLevel: level.classLevel,
                                                    slots: level.slots.map(slot => ({
                                                        id: 0, // Will be set by backend
                                                        progressionId: 0, // Will be set by backend
                                                        spellLevel: slot.spellLevel,
                                                        slotsPerDay: slot.slotsPerDay
                                                    }))
                                                }));
                                            setSpellcastingProgression(dbProgression);
                                        }
                                    }}
                                    readOnly={_isLoading}
                                    editorId="spell-slots"
                                />
                            </div>

                            {/* Spells Known Progression */}
                            {formData.spellsKnown && (
                                <div>
                                    <h4 className="text-md font-medium mb-3">Spells Known by Level</h4>
                                    <SpellProgressionEditor
                                        progression={spellsKnownProgression || []}
                                        originalProgression={spellsKnownProgression || []}
                                        onProgressionChange={(newProgression: CreateSpellcastingProgressionRequest[]) => {
                                            if (setSpellsKnownProgression) {
                                                // Convert from editor format back to database format
                                                // Only include levels that have slots
                                                const dbProgression = newProgression
                                                    .filter(level => level.slots && level.slots.length > 0)
                                                    .map(level => ({
                                                        id: 0, // Will be set by backend
                                                        classId: 0, // Will be set by backend
                                                        classLevel: level.classLevel,
                                                        slots: level.slots.map(slot => ({
                                                            id: 0, // Will be set by backend
                                                            progressionId: 0, // Will be set by backend
                                                            spellLevel: slot.spellLevel,
                                                            slotsPerDay: slot.slotsPerDay
                                                        }))
                                                    }));
                                                setSpellsKnownProgression(dbProgression);
                                            }
                                        }}
                                        readOnly={_isLoading}
                                        editorId="spells-known"
                                    />
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="border border-gray-200 rounded-md dark:border-gray-600 p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Spellcasting is disabled for this class. Enable "Can Cast Spells" in the Basic Info tab to configure spell progression.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
