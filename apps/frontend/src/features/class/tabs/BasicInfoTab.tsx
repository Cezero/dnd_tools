import React, { useMemo } from 'react';

import {
    ValidatedInput,
    CustomSelect,
    CustomCheckbox,
    SourceEditor
} from '@/components/forms';
import { generateClassProgression } from '@/lib/ClassProgression';
import { ClassProgressionTable } from '@/lib/ClassProgressionTable';
import { extractClassMechanics } from '@/lib/feature-extraction/classMechanicsExtractor';
import {
    RPG_DICE_LIST,
    EDITION_LIST,
    EditionId,
    SourceType,
    ProgressionType,
    BAB_PROGRESSION_LIST,
    SAVE_PROGRESSION_LIST,
} from '@shared/static-data';

import { findClassMechanicsProgression, updateClassMechanicsEntity } from '../classMechanicsHelpers';
import type { ClassTabProps } from './types';

export function BasicInfoTab({
    formData,
    setFormData,
    isLoading: _isLoading = false,
    featureProgressions = [],
    setFeatureProgressions,
    classId
}: ClassTabProps): React.JSX.Element {
    // Extract mechanics from progressions
    const mechanics = useMemo(() => {
        if (!classId) {
            return {
                hitDie: null,
                skillPoints: null,
                babProgression: null,
                fortProgression: null,
                refProgression: null,
                willProgression: null,
            };
        }
        return extractClassMechanics(featureProgressions, classId);
    }, [featureProgressions, classId]);

    // Helper to update progressions directly
    const handleMechanicsFieldChange = (
        field: 'hitDie' | 'skillPoints' | 'babProgression' | 'fortProgression' | 'refProgression' | 'willProgression',
        value: number | null
    ) => {
        // Update progressions if available
        if (setFeatureProgressions && classId && value !== null) {
            const mechanicsProgression = findClassMechanicsProgression(featureProgressions, classId);
            if (mechanicsProgression) {
                updateClassMechanicsEntity(mechanicsProgression, field, value, featureProgressions, setFeatureProgressions);
            }
        }
    };
    const progressionConfig = {
        babProgression: mechanics.babProgression ?? 0,
        fortProgression: mechanics.fortProgression ?? 0,
        refProgression: mechanics.refProgression ?? 0,
        willProgression: mechanics.willProgression ?? 0,
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
                            value={mechanics.hitDie ?? undefined}
                            onValueChange={(value) => handleMechanicsFieldChange('hitDie', value as number)}
                            options={RPG_DICE_LIST.map(die => ({ id: die.id, name: die.name }))}
                            useAbbreviation={false}
                            placeholder="Select hit die"
                        />
                        <div className="flex items-center gap-2">
                            <label className={`block font-medium w-45 ${mechanics.skillPoints === null ? 'text-gray-400' : ''}`}>
                                Skill Point Base
                            </label>
                            <input
                                type="number"
                                min={0}
                                max={10}
                                step={1}
                                value={mechanics.skillPoints ?? ''}
                                onChange={(e) => handleMechanicsFieldChange('skillPoints', e.target.value ? parseInt(e.target.value, 10) : null)}
                                className="w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                        <CustomSelect
                            label="Base Attack Bonus"
                            required
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-45"
                            itemExtraClassName="w-32"
                            itemTextExtraClassName="w-32"
                            value={mechanics.babProgression ?? undefined}
                            onValueChange={(value) => handleMechanicsFieldChange('babProgression', value as number)}
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
                            value={mechanics.fortProgression ?? undefined}
                            onValueChange={(value) => handleMechanicsFieldChange('fortProgression', value as number)}
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
                            value={mechanics.refProgression ?? undefined}
                            onValueChange={(value) => handleMechanicsFieldChange('refProgression', value as number)}
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
                            value={mechanics.willProgression ?? undefined}
                            onValueChange={(value) => handleMechanicsFieldChange('willProgression', value as number)}
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
