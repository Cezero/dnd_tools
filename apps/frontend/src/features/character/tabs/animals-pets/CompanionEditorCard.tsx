import { TrashIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useMemo, useState } from 'react';

import { GenericSearchInput } from '@/components/forms';
import { CustomSelect } from '@/components/forms/FormComponents';
import { FeatSubIdSelectionModal } from '@/features/character/components/FeatSubIdSelectionModal';
import { createStableDraftRowId } from '@/features/character/utils/draftKeyUtils';
import { formatHitDiceNotation } from '@/lib/formatHitDice';
import { useCacheFunctions } from '@/services/cache/CacheFunctions';
import type {
    CharacterCompanionDraft,
    CreatureAdvancementDraft,
    FeatCacheEntry,
} from '@shared/schema';
import {
    CHARACTER_COMPANION_ROLES,
    CharacterCompanionRole,
    computeStartingHitPoints,
    ensureCreatureAdvancements,
    getCompanionSkillPointsPerHd,
    getFeatSlotsForAddedHitDie,
    isFamiliarCompanionType,
    startingHitDiceFromMonster,
    sumAdvancementHitPoints,
    usesHandleAnimal,
} from '@shared/static-data';

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
    const [featModal, setFeatModal] = useState<{ sequence: number; feat: FeatCacheEntry } | null>(null);
    const { getItemNameMap } = useCacheFunctions();
    const itemNameMap = getItemNameMap();

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
    const monster = lookups.monsterById.get(companion.monsterId);
    const maxHpAtFirstLevel = companion.maxHpAtFirstLevel ?? false;
    const bonusHd = isFamiliarCompanionType(role)
        ? 0
        : (resolved?.progression?.bonusHd ?? 0);
    const starting = startingHitDiceFromMonster(monster ?? {});
    const baseHd = monster?.hitDiceQty && monster.hitDiceQty > 0 ? monster.hitDiceQty : 1;
    const skillPointsPerHd = getCompanionSkillPointsPerHd(monster?.intelligence);

    useEffect(() => {
        if (!monster) {
            return;
        }
        const next = ensureCreatureAdvancements({
            existing: companion.advancements ?? [],
            starting,
            bonusHd,
            maxHpAtFirstLevel,
            createId: (sequence) => createStableDraftRowId(`companion-adv:${companion.id}:${sequence}`),
        });
        if (!advancementsNeedUpdate(companion.advancements ?? [], next, maxHpAtFirstLevel)) {
            return;
        }
        onChange({
            ...companion,
            advancements: next,
            hitPoints: sumAdvancementHitPoints(next),
        });
    }, [
        bonusHd,
        companion,
        maxHpAtFirstLevel,
        monster,
        onChange,
    ]);

    const advancements = companion.advancements ?? [];

    const tricksUsed = (companion.tricks ?? []).reduce((sum, row) => sum + row.timesTrained, 0);
    const trainedSlotsMax = resolved?.budgets.trainedSlotsMax
        ?? (usesHandleAnimal(role) ? 3 : 0);
    const bonusSlotsMax = resolved?.budgets.bonusSlotsMax ?? 0;
    const trickSlotsMax = trainedSlotsMax + bonusSlotsMax;
    const handleAnimalAvailable = usesHandleAnimal(role) && trickSlotsMax > 0;
    const remainingTricks = trickSlotsMax - tricksUsed;

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

    const replaceAdvancement = (nextRow: CreatureAdvancementDraft) => {
        const nextAdvancements = advancements.map((row) => (
            row.sequence === nextRow.sequence ? nextRow : row
        ));
        onChange({
            ...companion,
            advancements: nextAdvancements,
            hitPoints: sumAdvancementHitPoints(nextAdvancements),
        });
    };

    const setAdvancementHitPoints = (sequence: number, hitPoints: number) => {
        const current = advancements.find((row) => row.sequence === sequence);
        if (!current) {
            return;
        }
        replaceAdvancement({ ...current, hitPoints: Math.max(0, hitPoints) });
    };

    const addSkill = (sequence: number, skillId: number | null, remaining: number) => {
        if (!skillId || remaining < 1) {
            return;
        }
        const current = advancements.find((row) => row.sequence === sequence);
        if (!current || (current.skills ?? []).some((row) => row.skillId === skillId && !row.skillSubId)) {
            return;
        }
        replaceAdvancement({
            ...current,
            skills: [
                ...(current.skills ?? []),
                {
                    id: createStableDraftRowId(`companion-adv-skill:${companion.id}:${sequence}:${skillId}`),
                    skillId,
                    skillSubId: null,
                    ranks: 1,
                },
            ],
        });
    };

    const setSkillRanks = (sequence: number, skillId: number, skillSubId: number | null, ranks: number) => {
        const current = advancements.find((row) => row.sequence === sequence);
        if (!current) {
            return;
        }
        replaceAdvancement({
            ...current,
            skills: (current.skills ?? [])
                .map((row) => (
                    row.skillId === skillId && (row.skillSubId ?? null) === skillSubId
                        ? { ...row, ranks }
                        : row
                ))
                .filter((row) => row.ranks > 0),
        });
    };

    const commitFeat = (sequence: number, featId: number, featSubId: number | null) => {
        const current = advancements.find((row) => row.sequence === sequence);
        if (!current) {
            return;
        }
        if ((current.feats ?? []).some((row) => row.featId === featId)) {
            return;
        }
        replaceAdvancement({
            ...current,
            feats: [
                ...(current.feats ?? []),
                {
                    id: createStableDraftRowId(`companion-adv-feat:${companion.id}:${sequence}:${featId}`),
                    featId,
                    featSubId,
                    notes: null,
                },
            ],
        });
    };

    const addFeat = (sequence: number, featId: number | null, remaining: number) => {
        if (!featId || remaining < 1) {
            return;
        }
        const feat = lookups.feats.find((row) => row.id === featId);
        if (feat?.useSubId) {
            setFeatModal({ sequence, feat });
            return;
        }
        commitFeat(sequence, featId, null);
    };

    const removeFeat = (sequence: number, featId: number) => {
        const current = advancements.find((row) => row.sequence === sequence);
        if (!current) {
            return;
        }
        replaceAdvancement({
            ...current,
            feats: (current.feats ?? []).filter((row) => row.featId !== featId),
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
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={maxHpAtFirstLevel}
                            onChange={(e) => onChange({
                                ...companion,
                                maxHpAtFirstLevel: e.target.checked,
                            })}
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Max HP at 1st Level
                        </span>
                    </label>
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

            {advancements.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-medium">Hit Dice</h4>
                    {advancements.map((row) => {
                        const addedIndex = row.sequence - 1;
                        const isBase = row.sequence === 1;
                        const label = isBase
                            ? `Starting ${formatHitDiceNotation(row.hitDiceQty, row.hitDiceType) || 'HD'}`
                            : `Bonus HD ${addedIndex} (${formatHitDiceNotation(row.hitDiceQty, row.hitDiceType) || '1d8'})`;
                        const skillMax = isBase ? 0 : skillPointsPerHd;
                        const featMax = isBase ? 0 : getFeatSlotsForAddedHitDie(baseHd, addedIndex);
                        const skillUsed = (row.skills ?? []).reduce((sum, skill) => sum + skill.ranks, 0);
                        const remainingSkill = skillMax - skillUsed;
                        const remainingFeat = featMax - (row.feats ?? []).length;
                        const startingHp = computeStartingHitPoints(starting, maxHpAtFirstLevel);
                        return (
                            <div
                                key={row.id}
                                className="border border-gray-200 dark:border-gray-600 rounded-md p-3 space-y-2"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium flex-1">{label}</span>
                                    <label className="flex items-center gap-2 text-sm">
                                        <span>HP</span>
                                        <input
                                            type="number"
                                            min={0}
                                            value={isBase && maxHpAtFirstLevel ? startingHp : row.hitPoints}
                                            disabled={isBase && maxHpAtFirstLevel}
                                            onChange={(e) => setAdvancementHitPoints(
                                                row.sequence,
                                                parseInt(e.target.value, 10) || 0
                                            )}
                                            className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 disabled:opacity-70"
                                        />
                                    </label>
                                </div>
                                {skillMax > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs text-gray-500">
                                            Skill ranks {skillUsed}/{skillMax}
                                        </p>
                                        {(row.skills ?? []).map((skill) => {
                                            const skillName = lookups.skills.find((entry) => entry.id === skill.skillId)?.name
                                                ?? `Skill ${skill.skillId}`;
                                            return (
                                                <div key={skill.id} className="flex items-center gap-2 text-sm">
                                                    <span className="flex-1">{skillName}</span>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={remainingSkill + skill.ranks}
                                                        value={skill.ranks}
                                                        onChange={(e) => setSkillRanks(
                                                            row.sequence,
                                                            skill.skillId,
                                                            skill.skillSubId ?? null,
                                                            parseInt(e.target.value, 10) || 0
                                                        )}
                                                        className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                                                    />
                                                </div>
                                            );
                                        })}
                                        {remainingSkill > 0 && (
                                            <GenericSearchInput
                                                value={null}
                                                onValueChange={(skillId) => addSkill(row.sequence, skillId, remainingSkill)}
                                                items={lookups.skills}
                                                label="Add skill"
                                                placeholder="Search skills..."
                                                filter={(skill) => !(row.skills ?? []).some((assigned) => assigned.skillId === skill.id)}
                                            />
                                        )}
                                    </div>
                                )}
                                {featMax > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs text-gray-500">
                                            Feats {(row.feats ?? []).length}/{featMax}
                                        </p>
                                        {(row.feats ?? []).map((feat) => {
                                            const featName = lookups.feats.find((entry) => entry.id === feat.featId)?.name
                                                ?? `Feat ${feat.featId}`;
                                            const subName = feat.featSubId
                                                ? itemNameMap.get(feat.featSubId)
                                                : null;
                                            return (
                                                <div key={feat.id} className="flex items-center gap-2 text-sm">
                                                    <span className="flex-1">
                                                        {featName}
                                                        {subName ? ` (${subName})` : ''}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFeat(row.sequence, feat.featId)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        {remainingFeat > 0 && (
                                            <GenericSearchInput
                                                value={null}
                                                onValueChange={(featId) => addFeat(row.sequence, featId, remainingFeat)}
                                                items={lookups.feats}
                                                label="Add feat"
                                                placeholder="Search feats..."
                                                filter={(feat) => !(row.feats ?? []).some((assigned) => assigned.featId === feat.id)}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
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

            <FeatSubIdSelectionModal
                isOpen={featModal !== null}
                onClose={() => setFeatModal(null)}
                onConfirm={(weaponId) => {
                    if (featModal) {
                        commitFeat(featModal.sequence, featModal.feat.id, weaponId);
                    }
                    setFeatModal(null);
                }}
                feat={featModal?.feat ?? null}
                resolvedProgressions={[]}
            />
        </div>
    );
}

/**
 * True when ensure produced a different row count, missing sequence, or max-HP overwrite.
 */
function advancementsNeedUpdate(
    current: CreatureAdvancementDraft[],
    next: CreatureAdvancementDraft[],
    maxHpAtFirstLevel: boolean
): boolean {
    if (current.length !== next.length) {
        return true;
    }
    const currentBySequence = new Map(current.map((row) => [row.sequence, row]));
    for (const row of next) {
        const existing = currentBySequence.get(row.sequence);
        if (!existing) {
            return true;
        }
        if (maxHpAtFirstLevel && row.sequence === 1 && existing.hitPoints !== row.hitPoints) {
            return true;
        }
    }
    return false;
}
