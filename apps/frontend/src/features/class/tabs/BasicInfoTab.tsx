import React from 'react';

import {
    ValidatedInput,
    CustomSelect,
    CustomCheckbox,
    SourceEditor
} from '@/components/forms';
import { generateClassProgression } from '@/lib/ClassProgression';
import { ClassProgressionTable } from '@/lib/ClassProgressionTable';
import {
    RPG_DICE_LIST,
    EDITION_LIST,
    EditionId,
    SourceType,
    ProgressionType,
    BAB_PROGRESSION_LIST,
    SAVE_PROGRESSION_LIST,
} from '@shared/static-data';

import type { ClassTabProps } from './types';

export function BasicInfoTab({
    formData,
    setFormData,
    isLoading: _isLoading = false,
    isVariant,
    setIsVariant,
    baseClassId,
    setBaseClassId,
    availableBaseClasses
}: ClassTabProps): React.JSX.Element {
    const progressionConfig = {
        babProgression: formData.babProgression,
        fortProgression: formData.fortProgression,
        refProgression: formData.refProgression,
        willProgression: formData.willProgression,
    };
    const progression = generateClassProgression(progressionConfig);

    return (
        <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Basic Info and Progression */}
                <div className="space-y-6">
                    <div className="space-y-4">
                        <ValidatedInput
                            field="name"
                            label="Class Name"
                            type="text"
                            required
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-45"
                            inputExtraClassName="w-32"
                            data-1p-ignore
                        />
                        <ValidatedInput
                            field="abbreviation"
                            label="Abbreviation"
                            type="text"
                            required
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-45"
                            inputExtraClassName="w-32"
                        />
                        <CustomSelect
                            label="Hit Die"
                            required
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-45"
                            itemExtraClassName="w-32"
                            itemTextExtraClassName="w-32"
                            value={formData.hitDie}
                            onValueChange={(value) => setFormData({ ...formData, hitDie: value as number })}
                            options={RPG_DICE_LIST.map(die => ({ id: die.id, name: die.name }))}
                            useAbbreviation={false}
                            placeholder="Select hit die"
                        />
                        <ValidatedInput
                            field="skillPoints"
                            label="Skill Point Base"
                            type="number"
                            min={0}
                            max={10}
                            step={1}
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-45"
                        />
                        <CustomSelect
                            label="Base Attack Bonus"
                            required
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-45"
                            itemExtraClassName="w-32"
                            itemTextExtraClassName="w-32"
                            value={formData.babProgression}
                            onValueChange={(value) => setFormData({ ...formData, babProgression: value as ProgressionType })}
                            options={BAB_PROGRESSION_LIST}
                            useAbbreviation={false}
                            placeholder="Select BAB progression"
                        />
                        <CustomSelect
                            label="Fortitude Save"
                            required
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-45"
                            itemExtraClassName="w-32"
                            itemTextExtraClassName="w-32"
                            value={formData.fortProgression}
                            onValueChange={(value) => setFormData({ ...formData, fortProgression: value as ProgressionType })}
                            options={SAVE_PROGRESSION_LIST}
                            useAbbreviation={false}
                            placeholder="Select Fortitude progression"
                        />
                        <CustomSelect
                            label="Reflex Save"
                            required
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-45"
                            itemExtraClassName="w-32"
                            itemTextExtraClassName="w-32"
                            value={formData.refProgression}
                            onValueChange={(value) => setFormData({ ...formData, refProgression: value as ProgressionType })}
                            options={SAVE_PROGRESSION_LIST}
                            useAbbreviation={false}
                            placeholder="Select Reflex progression"
                        />
                        <CustomSelect
                            label="Will Save"
                            required
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-45"
                            itemExtraClassName="w-32"
                            itemTextExtraClassName="w-32"
                            value={formData.willProgression}
                            onValueChange={(value) => setFormData({ ...formData, willProgression: value as ProgressionType })}
                            options={SAVE_PROGRESSION_LIST}
                            useAbbreviation={false}
                            placeholder="Select Will progression"
                        />
                    </div>
                </div>

                {/* Right Column - Edition, Checkboxes, and Preview */}
                <div className="space-y-6">
                    <div className="space-y-4">
                        <CustomSelect
                            label="Edition"
                            required
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-32"
                            itemExtraClassName="w-32"
                            itemTextExtraClassName="w-32"
                            value={formData.editionId}
                            onValueChange={(value) => setFormData({ ...formData, editionId: value as number })}
                            options={EDITION_LIST}
                            useAbbreviation={false}
                            placeholder="Select edition"
                        />
                        <CustomCheckbox
                            label="Prestige Class"
                            checked={formData.isPrestige as boolean}
                            onCheckedChange={(checked) => setFormData({ ...formData, isPrestige: checked })}
                        />
                        {/* Variant Toggle - only show for new classes and 3.5E edition */}
                        {formData.editionId === EditionId.DND_3_5E && (
                            <CustomCheckbox
                                label="This is a variant class"
                                checked={isVariant || false}
                                onCheckedChange={(checked) => setIsVariant?.(checked)}
                            />
                        )}
                        {/* Base Class Selector - only show when creating a variant */}
                        {isVariant && availableBaseClasses && setBaseClassId && (
                            <div className="space-y-2">
                                <label htmlFor="baseClassId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Base Class *
                                </label>
                                <select
                                    id="baseClassId"
                                    value={baseClassId || 0}
                                    onChange={(e) => setBaseClassId(parseInt(e.target.value))}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    required
                                >
                                    <option value={0}>Select a base class...</option>
                                    {availableBaseClasses.map((baseClass) => (
                                        <option key={baseClass.id} value={baseClass.id}>
                                            {baseClass.name}
                                        </option>
                                    ))}
                                </select>
                                {baseClassId === 0 && (
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                        Please select a base class for the variant
                                    </p>
                                )}
                            </div>
                        )}
                        <CustomCheckbox
                            label="Visible in Lists"
                            checked={formData.isVisible as boolean}
                            onCheckedChange={(checked) => setFormData({ ...formData, isVisible: checked })}
                        />
                        <CustomCheckbox
                            label="Can Cast Spells"
                            checked={formData.canCastSpells as boolean}
                            onCheckedChange={(checked) => setFormData({ ...formData, canCastSpells: checked })}
                        />
                        {formData.canCastSpells && (
                            <CustomCheckbox
                                label="Divine Caster"
                                checked={formData.isDivine as boolean}
                                onCheckedChange={(checked) => setFormData({ ...formData, isDivine: checked })}
                            />
                        )}
                    </div>

                    <div>
                        <h4 className="text-md font-medium mb-2">Class Progression Preview</h4>
                        <ClassProgressionTable
                            progression={progression}
                        />
                    </div>
                </div>
            </div>

            {/* Source References - moved to bottom */}
            <div className="mt-8">
                <SourceEditor
                    sources={formData.sourceBookInfo || []}
                    onSourcesChange={(sources) => setFormData({ ...formData, sourceBookInfo: sources })}
                    sourceType={SourceType.Classes}
                    editionId={formData.editionId as EditionId}
                />
            </div>
        </div>
    );
}
