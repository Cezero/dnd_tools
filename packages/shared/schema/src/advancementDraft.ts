import { z } from 'zod';

import { commonValidations } from './common.js';
import {
    AdvancementFeatSchema,
    AdvancementSkillSchema,
    AdvancementSpellSchema,
    CharacterFeatureChoiceDraftSchema,
    CreateAdvancementFeatSchema,
    CreateAdvancementSkillSchema,
} from './character.js';

/**
 * Draft-safe variant of AdvancementSpell.
 *
 * In the database, AdvancementSpell is keyed by (advancementId, spellId) and does not have
 * a standalone `id`. In draft state we keep the minimal fields needed for editing.
 */
export const AdvancementSpellDraftSchema = AdvancementSpellSchema.omit({ advancementId: true });

/**
 * Draft-safe advancement edit state.
 *
 * This state is stored in Redis for interactive editing (character creation, editing the current
 * advancement, and level-up). IDs may be negative draft-only values.
 *
 * Notes:
 * - `version` reflects the persisted advancement version when editing an existing row.
 * - For level-up creation, `version` should start at 1.
 * - Retraining is out of scope; future retraining should create a new persisted version row and
 *   would be represented by a different save mode (TODO).
 */
export const AdvancementEditStateSchema = z.object({
    /** Draft or persisted advancement id. May be negative for draft-only instances. */
    advancementId: z.number().int(),

    /** Draft or persisted character id. May be negative during character creation drafts. */
    characterId: z.number().int(),

    /** Target level for this advancement. */
    level: z.number().int().min(1, 'Level must be at least 1'),

    /** Persisted version when applicable (see CharacterAdvancement.version). */
    version: z.number().int().min(1, 'Version must be at least 1').optional(),

    classId: commonValidations.positiveInt('Class ID'),
    secondaryClassId: commonValidations.positiveInt('Secondary class ID').nullable(),
    hitPoints: commonValidations.nonNegativeInt('Hit points'),
    abilityId: commonValidations.positiveInt('Ability ID').nullable(),
    notes: z.string().max(1000, 'Notes must be less than 1000 characters').nullable(),

    skills: z.array(CreateAdvancementSkillSchema),
    feats: z.array(CreateAdvancementFeatSchema),
    spellsKnown: z.array(AdvancementSpellDraftSchema),
    featureChoices: z.array(CharacterFeatureChoiceDraftSchema),
});

export type AdvancementEditState = z.infer<typeof AdvancementEditStateSchema>;

export type AdvancementSkillDraft = z.infer<typeof CreateAdvancementSkillSchema>;
export type AdvancementFeatDraft = z.infer<typeof CreateAdvancementFeatSchema>;
export type AdvancementSpellDraft = z.infer<typeof AdvancementSpellDraftSchema>;

/**
 * Minimal summary schema for viewing advancements in UI workflows.
 *
 * This is intended for lightweight lists (e.g. showing current level and what is editable).
 * Not all consumers need this; include only if referenced by new APIs.
 */
export const AdvancementDraftSummarySchema = z.object({
    advancementId: z.number().int(),
    characterId: z.number().int(),
    level: z.number().int().min(1),
    version: z.number().int().min(1).optional(),
});

export type AdvancementDraftSummary = z.infer<typeof AdvancementDraftSummarySchema>;

