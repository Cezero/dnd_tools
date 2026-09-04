import { Dialog } from '@base-ui-components/react/dialog';
import React, { useEffect, useMemo, useState } from 'react';

import { CustomSelect } from '@/components/forms/FormComponents';
import {
    getSkillSubtypes,
    hasSubtypes,
    isAnalogSkill,
    resolveCustomSubtypeCasing,
    usesCustomSubtype,
} from '@/lib/skill-utils';
import { getSkillSelectFull } from '@/services/cache';

import type { BonusSkillRanksDialogProps } from './types';

/**
 * Dialog for adding or editing a DM-granted bonus skill rank.
 * Craft/Knowledge show a subtype dropdown; Profession/Perform show a text field
 * that matches existing custom subtypes case-insensitively.
 */
export function BonusSkillRanksDialog({
    isOpen,
    onClose,
    onConfirm,
    existingGrant,
    existingCustomSubtypes,
}: BonusSkillRanksDialogProps): React.JSX.Element {
    const [skillId, setSkillId] = useState<number | null>(null);
    const [skillSubId, setSkillSubId] = useState<number | null>(null);
    const [customSubtype, setCustomSubtype] = useState('');
    const [ranks, setRanks] = useState('');
    const [description, setDescription] = useState('');

    const skillOptions = useMemo(() => (
        getSkillSelectFull()
            .filter((skill) => !isAnalogSkill(skill.id))
            .map((skill) => ({ id: skill.id, name: skill.name }))
    ), []);

    const subtypeOptions = useMemo(() => {
        if (skillId == null || !hasSubtypes(skillId)) {
            return [];
        }
        return getSkillSubtypes(skillId).map((subtype) => ({
            id: subtype.id,
            name: subtype.name,
        }));
    }, [skillId]);

    const needsSubtypeDropdown = skillId != null && hasSubtypes(skillId);
    const needsCustomSubtype = skillId != null && usesCustomSubtype(skillId);

    useEffect(() => {
        if (!isOpen) {
            setSkillId(null);
            setSkillSubId(null);
            setCustomSubtype('');
            setRanks('');
            setDescription('');
            return;
        }
        if (existingGrant) {
            setSkillId(existingGrant.skillId);
            setSkillSubId(existingGrant.skillSubId);
            setCustomSubtype(existingGrant.customSubtype ?? '');
            setRanks(String(existingGrant.ranks));
            setDescription(existingGrant.description);
        }
    }, [isOpen, existingGrant]);

    const parsedRanks = Number.parseInt(ranks, 10);
    const canConfirm = skillId != null
        && Number.isInteger(parsedRanks)
        && parsedRanks >= 1
        && description.trim().length > 0
        && (!needsSubtypeDropdown || skillSubId != null)
        && (!needsCustomSubtype || customSubtype.trim().length > 0);

    const handleSkillChange = (nextSkillId: number): void => {
        setSkillId(nextSkillId);
        setSkillSubId(null);
        setCustomSubtype('');
    };

    const handleConfirm = (): void => {
        if (skillId == null || !canConfirm) {
            return;
        }
        const resolvedCustomSubtype = needsCustomSubtype
            ? resolveCustomSubtypeCasing(customSubtype, existingCustomSubtypes)
            : null;
        onConfirm({
            skillId,
            skillSubId: needsSubtypeDropdown ? skillSubId : null,
            customSubtype: resolvedCustomSubtype,
            ranks: parsedRanks,
            description: description.trim(),
        });
        onClose();
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Backdrop className="fixed inset-0 bg-black bg-opacity-25 z-40" />
            <Dialog.Portal>
                <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-md transform overflow-visible rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-800">
                        <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4">
                            {existingGrant ? 'Edit Bonus Ranks' : 'Add Bonus Ranks'}
                        </Dialog.Title>
                        <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Grant free ranks in a skill. These count as spent ranks on the sheet and do not use skill points.
                        </Dialog.Description>

                        <div className="space-y-4">
                            <CustomSelect
                                label="Skill"
                                required
                                value={skillId ?? 0}
                                onValueChange={handleSkillChange}
                                options={skillOptions}
                                placeholder="Select a skill"
                                componentExtraClassName="w-full"
                            />

                            {needsSubtypeDropdown && (
                                <CustomSelect
                                    label="Subtype"
                                    required
                                    value={skillSubId ?? 0}
                                    onValueChange={(value) => setSkillSubId(value)}
                                    options={subtypeOptions}
                                    placeholder="Select a subtype"
                                    componentExtraClassName="w-full"
                                />
                            )}

                            {needsCustomSubtype && (
                                <label className="block">
                                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Subtype
                                    </span>
                                    <input
                                        type="text"
                                        value={customSubtype}
                                        onChange={(event) => setCustomSubtype(event.target.value)}
                                        placeholder="e.g. Sailor"
                                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </label>
                            )}

                            <label className="block">
                                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Amount
                                </span>
                                <input
                                    type="number"
                                    min={1}
                                    step={1}
                                    value={ranks}
                                    onChange={(event) => setRanks(event.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </label>

                            <label className="block">
                                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </span>
                                <input
                                    type="text"
                                    maxLength={255}
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    placeholder="Why these ranks were granted"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </label>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={!canConfirm}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
