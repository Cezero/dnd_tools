import { TrashIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useMemo, useState } from 'react';

import { GenericSearchInput } from '@/components/forms';
import { CustomSelect } from '@/components/forms/FormComponents';
import { createStableDraftRowId } from '@/features/character/utils/draftKeyUtils';
import type { CharacterCompanionDraft } from '@shared/schema';
import { CHARACTER_COMPANION_ROLES, CharacterCompanionRole, isFamiliarCompanionType, usesHandleAnimal } from '@shared/static-data';

import { applyPurposeToCompanionDraft } from './companionDraftUtils';
import type { CompanionEditorCardProps } from './types';

/**
 * Draft editor for one companion, familiar, or pet.
 * Writes the full companion row back through onChange; CharacterEdit syncs the array.
 */
export function CompanionEditorCard({
    companion,
    resolved,
    lookups,
    canDelete,
    onChange,
    onDelete,
}: CompanionEditorCardProps): React.JSX.Element {
    const [name, setName] = useState(companion.name ?? '');

    useEffect(() => {
        setName(companion.name ?? '');
    }, [companion.name]);

    const templateType = companion.companionId !== null && companion.companionId !== undefined
        ? lookups.companionTypeById.get(companion.companionId)
        : undefined;
    const role = resolved?.role ?? (
        templateType
        ?? (companion.companionId !== null && companion.companionId !== undefined
            ? CharacterCompanionRole.AnimalCompanion
            : CharacterCompanionRole.Pet)
    );
    const roleName = CHARACTER_COMPANION_ROLES[role]?.name ?? 'Companion';
    const monsterName = resolved?.computedStatBlock?.name
        ?? lookups.monsterNameById.get(companion.monsterId)
        ?? `Monster ${companion.monsterId}`;

    const tricksUsed = (companion.tricks ?? []).reduce((sum, row) => sum + row.timesTrained, 0);
    const skillPointsUsed = (companion.skills ?? []).reduce((sum, row) => sum + row.ranks, 0);
    const featSlotsUsed = (companion.feats ?? []).length;

    const trainedSlotsMax = resolved?.budgets.trainedSlotsMax
        ?? (usesHandleAnimal(role) ? 3 : 0);
    const bonusSlotsMax = resolved?.budgets.bonusSlotsMax ?? 0;
    const trickSlotsMax = trainedSlotsMax + bonusSlotsMax;
    const skillPointsMax = resolved?.budgets.skillPointsMax ?? 0;
    const featSlotsMax = resolved?.budgets.featSlotsMax ?? 0;

    const handleAnimalAvailable = usesHandleAnimal(role) && trickSlotsMax > 0;
    const remainingTricks = trickSlotsMax - tricksUsed;
    const remainingSkillPoints = skillPointsMax - skillPointsUsed;
    const remainingFeatSlots = featSlotsMax - featSlotsUsed;

    const purposeOptions = useMemo(() => {
        return [
            { id: 0, name: 'None' },
            ...lookups.purposes.map((purpose) => ({
                id: purpose.id,
                name: `${purpose.name} (DC ${purpose.dc}, ${purpose.trainingWeeks} wk)`,
            })),
        ];
    }, [lookups.purposes]);

    const playerTricks = (companion.tricks ?? []).filter((row) => !row.fromPurpose);
    const purposeTricks = (companion.tricks ?? []).filter((row) => row.fromPurpose);

    const commitName = (raw: string) => {
        const nextName = raw.trim().length > 0 ? raw.trim() : null;
        if (nextName === (companion.name ?? null)) {
            return;
        }
        onChange({ ...companion, name: nextName });
    };

    const handlePurposeChange = (purposeId: number) => {
        const nextId = purposeId > 0 ? purposeId : null;
        if (nextId === (companion.trickPurposeId ?? null)) {
            return;
        }

        const nextPurpose = lookups.purposes.find((purpose) => purpose.id === nextId);
        if (
            nextPurpose?.replacesPurposeId
            && nextPurpose.replacesPurposeId === companion.trickPurposeId
        ) {
            const confirmed = window.confirm(
                `${nextPurpose.name} replaces the current purpose and wipes all known tricks. Continue?`
            );
            if (!confirmed) {
                return;
            }
        }

        onChange(applyPurposeToCompanionDraft(companion, nextId, lookups.purposes));
    };

    const replacePlayerTricks = (nextPlayer: CharacterCompanionDraft['tricks']) => {
        onChange({
            ...companion,
            tricks: [...purposeTricks, ...(nextPlayer ?? [])],
        });
    };

    /**
     * Sets how many times the player has trained a trick (purpose-granted times stay locked).
     */
    const setPlayerTrickTimes = (trickId: number, nextPlayerTimes: number) => {
        const currentPlayer = playerTricks.find((row) => row.trickId === trickId)?.timesTrained ?? 0;
        const available = remainingTricks + currentPlayer;
        const clamped = Math.max(0, Math.min(nextPlayerTimes, available));
        if (clamped === 0) {
            replacePlayerTricks(playerTricks.filter((row) => row.trickId !== trickId));
            return;
        }
        const existing = playerTricks.find((row) => row.trickId === trickId);
        if (existing) {
            replacePlayerTricks(playerTricks.map((row) => (
                row.trickId === trickId ? { ...row, timesTrained: clamped } : row
            )));
            return;
        }
        replacePlayerTricks([
            ...playerTricks,
            {
                id: createStableDraftRowId(`companion-trick:${companion.id}:${trickId}`),
                trickId,
                timesTrained: clamped,
                isBonus: false,
                fromPurpose: false,
            },
        ]);
    };

    const addSkill = (skillId: number | null) => {
        if (!skillId || remainingSkillPoints < 1) {
            return;
        }
        if ((companion.skills ?? []).some((row) => row.skillId === skillId && !row.skillSubId)) {
            return;
        }
        onChange({
            ...companion,
            skills: [
                ...(companion.skills ?? []),
                {
                    id: createStableDraftRowId(`companion-skill:${companion.id}:${skillId}`),
                    skillId,
                    skillSubId: null,
                    ranks: 1,
                },
            ],
        });
    };

    const setSkillRanks = (skillId: number, skillSubId: number | null, ranks: number) => {
        onChange({
            ...companion,
            skills: (companion.skills ?? [])
                .map((row) => (
                    row.skillId === skillId && (row.skillSubId ?? null) === skillSubId
                        ? { ...row, ranks }
                        : row
                ))
                .filter((row) => row.ranks > 0),
        });
    };

    const addFeat = (featId: number | null) => {
        if (!featId || remainingFeatSlots < 1) {
            return;
        }
        if ((companion.feats ?? []).some((row) => row.featId === featId)) {
            return;
        }
        onChange({
            ...companion,
            feats: [
                ...(companion.feats ?? []),
                {
                    id: createStableDraftRowId(`companion-feat:${companion.id}:${featId}`),
                    featId,
                    notes: null,
                },
            ],
        });
    };

    const removeFeat = (featId: number) => {
        onChange({
            ...companion,
            feats: (companion.feats ?? []).filter((row) => row.featId !== featId),
        });
    };

    return (
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-4">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            {roleName}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{monsterName}</span>
                    </div>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            commitName(e.target.value);
                        }}
                        onBlur={() => commitName(name)}
                        placeholder="Name"
                        className="w-full max-w-md px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                </div>
                {canDelete && (
                    <button
                        type="button"
                        onClick={onDelete}
                        className="p-2 text-red-600 hover:text-red-800"
                        title="Remove pet"
                    >
                        <TrashIcon className="h-5 w-5" />
                    </button>
                )}
            </div>

            {resolved?.progression && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    Effective {isFamiliarCompanionType(role) ? 'familiar' : 'companion'} level {resolved.progression.effectiveLevel}
                    {resolved.progression.bonusHd > 0 ? ` · +${resolved.progression.bonusHd} HD` : ''}
                    {resolved.progression.specials.length > 0
                        ? ` · ${resolved.progression.specials.map((special) => special.name).join(', ')}`
                        : ''}
                </p>
            )}

            {handleAnimalAvailable && (
                <div className="space-y-3">
                    <CustomSelect
                        label="Handle Animal Purpose"
                        value={companion.trickPurposeId ?? 0}
                        onValueChange={handlePurposeChange}
                        options={purposeOptions}
                    />
                    <p className="text-xs text-gray-500">
                        Tricks {tricksUsed}/{trickSlotsMax}
                        {` (${trainedSlotsMax} INT${bonusSlotsMax > 0 ? `, +${bonusSlotsMax} bonus` : ''})`}
                    </p>

                    <div>
                        <h4 className="text-sm font-medium mb-2">Known tricks</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            {lookups.tricks.map((trick) => {
                                const purposeTimes = purposeTricks.find((row) => row.trickId === trick.id)?.timesTrained ?? 0;
                                const playerTimes = playerTricks.find((row) => row.trickId === trick.id)?.timesTrained ?? 0;
                                const knownTimes = purposeTimes + playerTimes;
                                const maxTimes = Math.max(1, trick.maxTimesTrainable);
                                const description = trick.description?.trim() || null;
                                return (
                                    <div key={trick.id} className="flex items-center gap-2 text-sm min-w-0">
                                        <div className="flex items-center gap-1 shrink-0">
                                            {Array.from({ length: maxTimes }, (_slot, index) => {
                                                const rank = index + 1;
                                                const checked = knownTimes >= rank;
                                                const lockedByPurpose = rank <= purposeTimes;
                                                const extraNeeded = Math.max(0, rank - knownTimes);
                                                const disabled = lockedByPurpose || (!checked && extraNeeded > remainingTricks);
                                                return (
                                                    <input
                                                        key={`${trick.id}-${rank}`}
                                                        type="checkbox"
                                                        aria-label={`${trick.name} ${rank} of ${maxTimes}`}
                                                        checked={checked}
                                                        disabled={disabled}
                                                        onChange={() => {
                                                            const nextKnown = checked ? rank - 1 : rank;
                                                            setPlayerTrickTimes(trick.id, Math.max(0, nextKnown - purposeTimes));
                                                        }}
                                                    />
                                                );
                                            })}
                                        </div>
                                        <span className="relative group/trick min-w-0">
                                            <span
                                                className="cursor-help underline decoration-dotted decoration-gray-400 underline-offset-2 truncate"
                                                title={description ?? undefined}
                                            >
                                                {trick.name} (DC {trick.dc})
                                                {purposeTimes > 0 ? ' [purpose]' : ''}
                                            </span>
                                            {description && (
                                                <span
                                                    role="tooltip"
                                                    className="pointer-events-none invisible group-hover/trick:visible absolute left-0 top-full z-20 mt-1 w-64 rounded bg-gray-900 px-2 py-1 text-xs text-white shadow-lg dark:bg-gray-700"
                                                >
                                                    {description}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {skillPointsMax > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium">
                        Bonus skill ranks ({skillPointsUsed}/{skillPointsMax})
                    </h4>
                    {(companion.skills ?? []).map((row) => {
                        const skillName = lookups.skills.find((skill) => skill.id === row.skillId)?.name ?? `Skill ${row.skillId}`;
                        return (
                            <div key={`${row.skillId}-${row.skillSubId ?? 0}`} className="flex items-center gap-2 text-sm">
                                <span className="flex-1">{skillName}</span>
                                <input
                                    type="number"
                                    min={0}
                                    max={remainingSkillPoints + row.ranks}
                                    value={row.ranks}
                                    onChange={(e) => setSkillRanks(row.skillId, row.skillSubId ?? null, parseInt(e.target.value, 10) || 0)}
                                    className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                                />
                            </div>
                        );
                    })}
                    {remainingSkillPoints > 0 && (
                        <GenericSearchInput
                            value={null}
                            onValueChange={addSkill}
                            items={lookups.skills}
                            label="Add skill"
                            placeholder="Search skills..."
                            filter={(skill) => !(companion.skills ?? []).some((row) => row.skillId === skill.id)}
                        />
                    )}
                </div>
            )}

            {featSlotsMax > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium">
                        Bonus feats ({featSlotsUsed}/{featSlotsMax})
                    </h4>
                    {(companion.feats ?? []).map((row) => {
                        const featName = lookups.feats.find((feat) => feat.id === row.featId)?.name ?? `Feat ${row.featId}`;
                        return (
                            <div key={row.featId} className="flex items-center gap-2 text-sm">
                                <span className="flex-1">{featName}</span>
                                <button
                                    type="button"
                                    onClick={() => removeFeat(row.featId)}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    Remove
                                </button>
                            </div>
                        );
                    })}
                    {remainingFeatSlots > 0 && (
                        <GenericSearchInput
                            value={null}
                            onValueChange={addFeat}
                            items={lookups.feats}
                            label="Add feat"
                            placeholder="Search feats..."
                            filter={(feat) => !(companion.feats ?? []).some((row) => row.featId === feat.id)}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
