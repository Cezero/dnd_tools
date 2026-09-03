import { formatHitDiceNotation } from '@/lib/formatHitDice';
import {
    MANEUVERABILITY_MAP,
    MONSTER_TYPE_MAP,
    MOVEMENT_TYPE_MAP,
    MovementTypeId,
    SIZE_MAP,
} from '@shared/static-data';

import type { BuildRevisedStatBlockArgs, RevisedStatBlockLine, RevisedStatBlockModel } from './types';

const SENSE_PATTERNS = [
    /darkvision\s+\d+\s*ft\.?/i,
    /low-light vision/i,
    /blindsight\s+\d+\s*ft\.?/i,
    /blindsense\s+\d+\s*ft\.?/i,
    /scent/i,
    /tremorsense\s+\d+\s*ft\.?/i,
];

/**
 * Formats a signed modifier for display (`+3`, `-1`, `+0`).
 */
export function formatSigned(value: number | null | undefined): string {
    const numeric = value ?? 0;
    return numeric >= 0 ? `+${numeric}` : `${numeric}`;
}

/**
 * Builds an Alexandrian short revised 3.5 stat block from a computed monster sheet.
 */
export function buildRevisedStatBlock(args: BuildRevisedStatBlockArgs): RevisedStatBlockModel {
    const { block, lookups } = args;
    const header = buildHeader(block);
    const lines: RevisedStatBlockLine[] = [
        { label: 'DETECTION', text: buildDetection(block, lookups) },
        { label: 'DEFENSES', text: buildDefenses(block) },
        { label: 'ACTIONS', text: buildActions(block) },
    ];

    const specialQualities = (block.specialQualities ?? '').trim();
    if (specialQualities.length > 0) {
        lines.push({ label: 'SQ', text: specialQualities });
    }

    lines.push(
        { label: '', text: buildAbilities(block) },
        { label: '', text: buildSaves(block) },
        { label: 'FEATS', text: buildFeats(block, lookups) },
        { label: 'SKILLS', text: buildSkills(block, lookups) },
    );

    return { header, lines };
}

function buildHeader(block: BuildRevisedStatBlockArgs['block']): string {
    const cr = block.challengeRating ? `CR ${block.challengeRating}` : 'CR —';
    const alignment = block.alignment?.trim() || null;
    const sizeName = block.sizeId !== null && block.sizeId !== undefined
        ? SIZE_MAP[block.sizeId]?.name ?? null
        : null;
    const typeNames = (block.types ?? [])
        .map((row) => MONSTER_TYPE_MAP[row.typeId]?.name)
        .filter((name): name is string => Boolean(name));
    const identity = [alignment, sizeName, typeNames.join(' ')].filter(Boolean).join(' ');
    return `${block.name} (${cr})${identity.length > 0 ? ` – ${identity}` : ''}`;
}

function buildDetection(
    block: BuildRevisedStatBlockArgs['block'],
    lookups: BuildRevisedStatBlockArgs['lookups']
): string {
    const parts: string[] = [];
    const senses = collectSenses(block);
    if (senses.length > 0) {
        parts.push(`Senses ${senses.join(', ')}`);
    }
    parts.push(`Listen ${formatSigned(findSkillBonus(block, lookups, 'Listen'))}`);
    parts.push(`Spot ${formatSigned(findSkillBonus(block, lookups, 'Spot'))}`);
    parts.push(`Init ${formatSigned(block.initiative)}`);
    return parts.join('; ');
}

function buildDefenses(block: BuildRevisedStatBlockArgs['block']): string {
    const parts = [
        `AC ${block.armorClass ?? 10}, touch ${block.touchAC ?? 10}, flat-footed ${block.flatFootedAC ?? 10}`,
        `hp ${formatHitPoints(block)}`,
    ];
    return parts.join('; ');
}

function buildActions(block: BuildRevisedStatBlockArgs['block']): string {
    const parts: string[] = [`Spd ${formatSpeed(block)}`];
    const melee = (block.fullAttack ?? block.attack ?? '').trim();
    if (melee.length > 0) {
        parts.push(`Melee ${melee}`);
    }
    if (block.space !== null && block.space !== undefined) {
        parts.push(`Space ${block.space} ft.`);
    }
    if (block.reach !== null && block.reach !== undefined) {
        const reach = `Reach ${block.reach} ft.`;
        const optional = block.optionalReach
            ? `${reach} (${block.optionalReach} ft.${block.optionalReachDescription ? ` ${block.optionalReachDescription}` : ''})`
            : reach;
        parts.push(optional);
    }
    parts.push(`Base Atk ${formatSigned(block.baseAttack)}`);
    parts.push(`Grapple ${formatSigned(block.grapple)}`);
    const specialAttacks = (block.specialAttacks ?? '').trim();
    if (specialAttacks.length > 0) {
        parts.push(`SA ${specialAttacks}`);
    }
    return parts.join('; ');
}

function buildAbilities(block: BuildRevisedStatBlockArgs['block']): string {
    return [
        `STR ${formatAbilityScore(block.strength)}`,
        `DEX ${formatAbilityScore(block.dexterity)}`,
        `CON ${formatAbilityScore(block.constitution)}`,
        `INT ${formatAbilityScore(block.intelligence)}`,
        `WIS ${formatAbilityScore(block.wisdom)}`,
        `CHA ${formatAbilityScore(block.charisma)}`,
    ].join(', ');
}

function buildSaves(block: BuildRevisedStatBlockArgs['block']): string {
    return [
        `FORT ${formatSigned(block.fortSave)}`,
        `REF ${formatSigned(block.refSave)}`,
        `WILL ${formatSigned(block.willSave)}`,
    ].join(', ');
}

function buildFeats(
    block: BuildRevisedStatBlockArgs['block'],
    lookups: BuildRevisedStatBlockArgs['lookups']
): string {
    const names = (block.feats ?? [])
        .map((feat) => lookups.featNameById.get(feat.featId) ?? `Feat ${feat.featId}`)
        .filter((name) => name.length > 0);
    return names.length > 0 ? names.join(', ') : '—';
}

function buildSkills(
    block: BuildRevisedStatBlockArgs['block'],
    lookups: BuildRevisedStatBlockArgs['lookups']
): string {
    const names = (block.skills ?? []).map((skill) => {
        const name = lookups.skillNameById.get(skill.skillId) ?? `Skill ${skill.skillId}`;
        return `${name} ${formatSigned(skill.ranks)}`;
    });
    return names.length > 0 ? names.join(', ') : '—';
}

function formatAbilityScore(value: number | null | undefined): string {
    return value === null || value === undefined ? '—' : `${value}`;
}

/**
 * Alexandrian HP line: total and the full HD calculation (`26 (4d12)`, `30 (4d10+8)`).
 */
function formatHitPoints(block: BuildRevisedStatBlockArgs['block']): string {
    const total = block.averageHP ?? 0;
    const qty = block.hitDiceQty ?? 0;
    const primaryNotation = formatHitDiceNotation(qty, block.hitDiceType);
    const parts: string[] = [];
    if (qty > 0 && primaryNotation) {
        parts.push(primaryNotation);
    }
    for (const extra of block.extraHitDice ?? []) {
        const extraNotation = formatHitDiceNotation(extra.hitDiceQty, extra.hitDiceType);
        if (extra.hitDiceQty > 0 && extraNotation) {
            parts.push(extraNotation);
        }
        if (extra.bonusHP) {
            parts.push(extra.bonusHP > 0 ? `+${extra.bonusHP}` : `${extra.bonusHP}`);
        }
    }
    if (block.bonusHP) {
        parts.push(block.bonusHP > 0 ? `+${block.bonusHP}` : `${block.bonusHP}`);
    }
    const calculation = parts.length > 0 ? parts.join('') : `${qty} HD`;
    return `${total} (${calculation})`;
}

function formatSpeed(block: BuildRevisedStatBlockArgs['block']): string {
    const speeds: string[] = [];
    if (block.baseSpeed !== null && block.baseSpeed !== undefined) {
        speeds.push(`${block.baseSpeed} ft.`);
    }
    for (const alternate of block.alternateSpeeds ?? []) {
        const typeName = MOVEMENT_TYPE_MAP[alternate.movementTypeId]?.name;
        if (!typeName || alternate.movementTypeId === MovementTypeId.Land) {
            continue;
        }
        const maneuver = alternate.maneuverability
            ? MANEUVERABILITY_MAP[alternate.maneuverability]?.name
            : null;
        const suffix = maneuver ? ` (${maneuver})` : '';
        speeds.push(`${typeName.toLowerCase()} ${alternate.speed} ft.${suffix}`);
    }
    return speeds.length > 0 ? speeds.join(', ') : '—';
}

function collectSenses(block: BuildRevisedStatBlockArgs['block']): string[] {
    const haystack = [
        block.specialQualities ?? '',
        ...(block.specialAbilities ?? []).map((row) => row.ability?.name ?? ''),
        ...(block.specialAbilities ?? []).map((row) => row.ability?.description ?? ''),
    ].join(' ');

    const found: string[] = [];
    for (const pattern of SENSE_PATTERNS) {
        const match = haystack.match(pattern);
        if (match) {
            found.push(match[0].toLowerCase());
        }
    }
    return found;
}

function findSkillBonus(
    block: BuildRevisedStatBlockArgs['block'],
    lookups: BuildRevisedStatBlockArgs['lookups'],
    skillName: string
): number {
    const target = skillName.toLowerCase();
    for (const skill of block.skills ?? []) {
        const name = lookups.skillNameById.get(skill.skillId);
        if (name?.toLowerCase() === target) {
            return skill.ranks ?? 0;
        }
    }
    return 0;
}
