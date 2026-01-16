import { z } from 'zod';
import { commonValidations } from './common.js';

export const SpellcastingProgressionSchema = z.object({
    id: commonValidations.positiveInt('Progression ID'),
    classId: commonValidations.positiveInt('Class ID'),
    classLevel: z.number().int().min(1, 'Class level must be at least 1').max(20, 'Class level must be at most 20'),
});

export const SpellcastingSlotSchema = z.object({
    id: commonValidations.positiveInt('Slot ID'),
    progressionId: commonValidations.positiveInt('Progression ID'),
    spellLevel: commonValidations.nonNegativeInt('Spell level', 9),
    slotsPerDay: commonValidations.nonNegativeInt('Slots per day', 10),
});

export const SpellcastingLinkSchema = z.object({
    id: commonValidations.positiveInt('Link ID'),
    featureProgressionId: commonValidations.positiveInt('Feature progression ID'),
    progressionId: commonValidations.positiveInt('Progression ID'),
    inheritedFrom: z.string().nullable(),
    levelOffset: z.number().int().nullable(),
});

// Create schemas for spellcasting progression and slots
export const CreateSpellcastingSlotSchema = SpellcastingSlotSchema.omit({
    id: true,
    progressionId: true, // Will be set by the class service
});

export const CreateSpellcastingProgressionSchema = SpellcastingProgressionSchema.omit({
    id: true,
    classId: true, // Will be set by the class service
}).extend({
    slots: z.array(CreateSpellcastingSlotSchema).optional(),
});

export const SpellcastingProgressionWithSlotsSchema = SpellcastingProgressionSchema.extend({
    slots: z.array(SpellcastingSlotSchema).optional(),
});

// Type exports
export type SpellcastingProgression = z.infer<typeof SpellcastingProgressionSchema>;
export type SpellcastingSlot = z.infer<typeof SpellcastingSlotSchema>;
export type SpellcastingLink = z.infer<typeof SpellcastingLinkSchema>;
export type CreateSpellcastingProgressionRequest = z.infer<typeof CreateSpellcastingProgressionSchema>;
export type CreateSpellcastingSlotRequest = z.infer<typeof CreateSpellcastingSlotSchema>;
export type SpellcastingProgressionWithSlots = z.infer<typeof SpellcastingProgressionWithSlotsSchema>; 
