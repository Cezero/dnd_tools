import { TrashIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect } from 'react';

import { CustomSelect } from '@/components/forms/FormComponents';
import { SpellSearchInput } from '@/components/forms/SpellSearchInput';
import { SpellApi } from '@/features/spell/SpellApi';
import { ClassVariantSpellOverrideCreate, Spell } from '@shared/schema';
import { SPELL_ID_LIST } from '@shared/static-data';

import type { ClassTabProps } from './tabs/types';

interface SpellOverrideTabProps extends ClassTabProps {
    baseClassId: number;
    spellOverrides: ClassVariantSpellOverrideCreate[];
    onSpellOverridesUpdate: (overrides: ClassVariantSpellOverrideCreate[]) => void;
}

export function SpellOverrideTab({
    baseClassId,
    spellOverrides,
    onSpellOverridesUpdate,
    isLoading = false
}: SpellOverrideTabProps) {
    const [baseClassSpells, setBaseClassSpells] = useState<Spell[]>([]);
    const [loadingSpells, setLoadingSpells] = useState(false);
    const [newSpellLevel, setNewSpellLevel] = useState<number | null>(null);
    const [newSpellId, setNewSpellId] = useState<number | null>(null);

    // Load base class spells when base class changes
    useEffect(() => {
        if (baseClassId > 0) {
            setLoadingSpells(true);
            SpellApi.getSpellsForClass(undefined, { classId: baseClassId })
                .then(response => {
                    setBaseClassSpells(response.results);
                })
                .catch(error => {
                    console.error('Failed to load base class spells:', error);
                    setBaseClassSpells([]);
                })
                .finally(() => {
                    setLoadingSpells(false);
                });
        } else {
            setBaseClassSpells([]);
        }
    }, [baseClassId]);

    // Auto-add spell when both level and spell are selected
    useEffect(() => {
        if (newSpellLevel !== null && newSpellId !== null) {
            const newOverride: ClassVariantSpellOverrideCreate = {
                spellId: newSpellId,
                level: newSpellLevel
            };
            onSpellOverridesUpdate([...spellOverrides, newOverride]);
            setNewSpellLevel(null);
            setNewSpellId(null);
        }
    }, [newSpellLevel, newSpellId, spellOverrides, onSpellOverridesUpdate]);

    // Filter spells for add input (exclude base class spells)
    const availableSpellsForAdding = SPELL_ID_LIST.filter(spell =>
        !baseClassSpells.some(baseSpell => baseSpell.id === spell.id)
    );

    // Filter spells for remove input (only base class spells)
    const availableSpellsForRemoving = SPELL_ID_LIST.filter(spell =>
        baseClassSpells.some(baseSpell => baseSpell.id === spell.id)
    );

    // Separate additions and removals
    const additions = spellOverrides.filter(override => override.level > 0);
    const removals = spellOverrides.filter(override => override.level === -1);

    const handleAddSpell = (spellId: number | null) => {
        setNewSpellId(spellId);
    };

    const handleRemoveSpell = (spellId: number | null) => {
        if (spellId) {
            const newOverride: ClassVariantSpellOverrideCreate = {
                spellId,
                level: -1
            };
            onSpellOverridesUpdate([...spellOverrides, newOverride]);
        }
    };

    const handleDeleteOverride = (index: number) => {
        const newOverrides = [...spellOverrides];
        newOverrides.splice(index, 1);
        onSpellOverridesUpdate(newOverrides);
    };

    const getSpellName = (spellId: number) => {
        const spell = SPELL_ID_LIST.find(s => s.id === spellId);
        return spell?.name || `Unknown Spell (${spellId})`;
    };

    if (loadingSpells) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-gray-500">Loading base class spells...</div>
            </div>
        );
    }

    const levelOptions = [
        { value: 1, label: 'Level 1' },
        { value: 2, label: 'Level 2' },
        { value: 3, label: 'Level 3' },
        { value: 4, label: 'Level 4' },
        { value: 5, label: 'Level 5' },
        { value: 6, label: 'Level 6' },
        { value: 7, label: 'Level 7' },
        { value: 8, label: 'Level 8' },
        { value: 9, label: 'Level 9' }
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Added Spells Column */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Added Spells</h3>

                    <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <CustomSelect
                                value={newSpellLevel}
                                onValueChange={setNewSpellLevel}
                                options={levelOptions}
                                placeholder="Select level"
                                label="Spell Level"
                            />
                            <SpellSearchInput
                                value={newSpellId}
                                onValueChange={handleAddSpell}
                                label="Spell"
                                placeholder="Search for a spell..."
                                spellList={availableSpellsForAdding}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        {additions.length === 0 ? (
                            <div className="text-gray-500 dark:text-gray-400 text-sm italic">No spells added</div>
                        ) : (
                            additions.map((override, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                    <div>
                                        <div className="font-medium text-green-900 dark:text-green-100">
                                            {getSpellName(override.spellId)}
                                        </div>
                                        <div className="text-sm text-green-700 dark:text-green-300">
                                            Level {override.level}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteOverride(spellOverrides.indexOf(override))}
                                        disabled={isLoading}
                                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Removed Spells Column */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Removed Spells</h3>

                    <div>
                        <SpellSearchInput
                            value={null}
                            onValueChange={handleRemoveSpell}
                            label="Remove Spell"
                            placeholder="Search for a spell to remove..."
                            spellList={availableSpellsForRemoving}
                        />
                    </div>

                    <div className="space-y-2">
                        {removals.length === 0 ? (
                            <div className="text-gray-500 dark:text-gray-400 text-sm italic">No spells removed</div>
                        ) : (
                            removals.map((override, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <div>
                                        <div className="font-medium text-red-900 dark:text-red-100">
                                            {getSpellName(override.spellId)}
                                        </div>
                                        <div className="text-sm text-red-700 dark:text-red-300">
                                            Removed from base class
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteOverride(spellOverrides.indexOf(override))}
                                        disabled={isLoading}
                                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Spell Override Summary</h4>
                <div className="text-sm text-gray-600 dark:text-gray-300 flex flex-wrap gap-4">
                    <span>Base spells: {baseClassSpells.length}</span>
                    <span>Added: {additions.length}</span>
                    <span>Removed: {removals.length}</span>
                    <span>Final count: {baseClassSpells.length + additions.length - removals.length}</span>
                </div>
            </div>
        </div>
    );
}
