import { z } from 'zod';

export const SpellcastingProgressionSchema = z.object({
    id: z.number().int().positive('Progression ID must be a positive integer'),
    classId: z.number().int().positive('Class ID must be a positive integer'),
    casterLevel: z.number().int().min(1, 'Caster level must be at least 1').max(20, 'Caster level must be at most 20'),
});

export const SpellcastingSlotSchema = z.object({
    id: z.number().int().positive('Slot ID must be a positive integer'),
    progressionId: z.number().int().positive('Progression ID must be a positive integer'),
    spellLevel: z.number().int().min(0, 'Spell level must be at least 0').max(9, 'Spell level must be at most 9'),
    slotsPerDay: z.number().int().min(0, 'Slots per day must be at least 0').max(10, 'Slots per day must be at most 10'),
});

export const SpellcastingLinkSchema = z.object({
    id: z.number().int().positive('Link ID must be a positive integer'),
    featureProgressionId: z.number().int().positive('Feature progression ID must be a positive integer'),
    progressionId: z.number().int().positive('Progression ID must be a positive integer'),
    inheritedFrom: z.string().nullable(),
    levelOffset: z.number().int().nullable(),
});

// Type exports
export type SpellcastingProgression = z.infer<typeof SpellcastingProgressionSchema>;
export type SpellcastingSlot = z.infer<typeof SpellcastingSlotSchema>;
export type SpellcastingLink = z.infer<typeof SpellcastingLinkSchema>; 
