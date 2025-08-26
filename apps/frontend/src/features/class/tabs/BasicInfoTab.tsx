import React from 'react';

import {
    ValidatedInput,
    CustomSelect,
    CustomCheckbox
} from '@/components/forms';
import { generateClassProgression } from '@/lib/ClassProgression';
import { ClassProgressionTable } from '@/lib/ClassProgressionTable';
import {
    RPG_DICE_SELECT_LIST,
    EDITION_SELECT_LIST_FULL,
    BAB_PROGRESSION_SELECT_LIST,
    SAVE_PROGRESSION_SELECT_LIST,
} from '@shared/static-data';

import type { ClassTabProps } from './types';

export function BasicInfoTab({
    formData,
    setFormData,
    validation,
    isLoading: _isLoading = false
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
                            options={RPG_DICE_SELECT_LIST.map(die => ({ value: die.value, label: die.label }))}
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
                            onValueChange={(value) => setFormData({ ...formData, babProgression: value })}
                            options={BAB_PROGRESSION_SELECT_LIST}
                            placeholder="Select BAB progression"
                        />
                        {validation?.babProgression && (
                            <p className="text-red-500 text-sm mt-1">{validation.babProgression}</p>
                        )}
                        <CustomSelect
                            label="Fortitude Save"
                            required
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-45"
                            itemExtraClassName="w-32"
                            itemTextExtraClassName="w-32"
                            value={formData.fortProgression}
                            onValueChange={(value) => setFormData({ ...formData, fortProgression: value })}
                            options={SAVE_PROGRESSION_SELECT_LIST}
                            placeholder="Select Fortitude progression"
                        />
                        {validation?.fortProgression && (
                            <p className="text-red-500 text-sm mt-1">{validation.fortProgression}</p>
                        )}
                        <CustomSelect
                            label="Reflex Save"
                            required
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-45"
                            itemExtraClassName="w-32"
                            itemTextExtraClassName="w-32"
                            value={formData.refProgression}
                            onValueChange={(value) => setFormData({ ...formData, refProgression: value })}
                            options={SAVE_PROGRESSION_SELECT_LIST}
                            placeholder="Select Reflex progression"
                        />
                        {validation?.refProgression && (
                            <p className="text-red-500 text-sm mt-1">{validation.refProgression}</p>
                        )}
                        <CustomSelect
                            label="Will Save"
                            required
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-45"
                            itemExtraClassName="w-32"
                            itemTextExtraClassName="w-32"
                            value={formData.willProgression}
                            onValueChange={(value) => setFormData({ ...formData, willProgression: value })}
                            options={SAVE_PROGRESSION_SELECT_LIST}
                            placeholder="Select Will progression"
                        />
                        {validation?.willProgression && (
                            <p className="text-red-500 text-sm mt-1">{validation.willProgression}</p>
                        )}
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
                            options={EDITION_SELECT_LIST_FULL}
                            placeholder="Select edition"
                        />
                        <CustomCheckbox
                            label="Prestige Class"
                            checked={formData.isPrestige as boolean}
                            onCheckedChange={(checked) => setFormData({ ...formData, isPrestige: checked })}
                        />
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
                    </div>
                    <div>
                        <h4 className="text-md font-medium mb-2">Class Progression Preview</h4>
                        <ClassProgressionTable
                            progression={progression}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
