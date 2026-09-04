import type {
    ResolvedCharacterCompanionDraft,
    ResolvedSelectedFormDraft,
} from '@shared/schema';
import { CHARACTER_COMPANION_ROLES, usesHandleAnimal } from '@shared/static-data';

import type { RevisedStatBlockExtras } from './types';

/**
 * Builds extras that sit after a companion or pet revised stat block.
 */
export function formatCompanionExtras(
    companion: ResolvedCharacterCompanionDraft,
    monsterName?: string
): RevisedStatBlockExtras {
    const tricks = usesHandleAnimal(companion.role)
        ? (companion.tricks ?? []).map((row) => {
            const name = row.trick?.name ?? `Trick ${row.trickId}`;
            const attackAll = name.toLowerCase() === 'attack' && row.timesTrained >= 2
                ? ' (trained to attack all creatures)'
                : row.timesTrained > 1
                    ? ` ×${row.timesTrained}`
                    : '';
            const source = row.fromPurpose ? ' [purpose]' : row.isBonus ? ' [bonus]' : '';
            return {
                trickId: row.trickId,
                name,
                suffix: `${attackAll}${source}`,
                description: row.trick?.description?.trim() || null,
            };
        })
        : [];

    return {
        role: CHARACTER_COMPANION_ROLES[companion.role]?.name ?? 'Companion',
        creatureName: companion.name?.trim() || null,
        purpose: usesHandleAnimal(companion.role) ? companion.trickPurpose?.name ?? null : null,
        tricks,
        progression: null,
        specials: (companion.progression?.specials ?? []).map((special) => special.name),
        notes: [],
        monsterId: companion.monsterId,
        monsterName: companion.computedStatBlock?.name
            ?? monsterName
            ?? `Monster ${companion.monsterId}`,
    };
}

/**
 * Builds extras that sit after a wild-shape Alternate Form revised stat block.
 */
export function formatSelectedFormExtras(form: ResolvedSelectedFormDraft): RevisedStatBlockExtras {
    const notes: string[] = [];
    if (form.notes.gearMelded) {
        notes.push('Gear melds into the form.');
    }
    if (form.notes.hpUnchangedByConstitution) {
        notes.push('Hit points do not change with the new Constitution.');
    }
    if (form.notes.spellcastingSpeechRequired) {
        notes.push('Spellcasting still requires speech.');
    }
    if (form.notes.spellcastingHandsRequired) {
        notes.push('Spellcasting still requires hands.');
    }
    if (form.notes.isElementalForm) {
        notes.push('Elemental form: take elemental extraordinary, supernatural, and spell-like abilities, plus feats.');
    }

    return {
        role: form.notes.isElementalForm ? 'Elemental Wild Shape' : 'Wild Shape',
        creatureName: form.monsterName,
        purpose: null,
        tricks: [],
        progression: null,
        specials: [],
        notes,
        monsterId: form.monsterId,
        monsterName: form.monsterName,
    };
}
