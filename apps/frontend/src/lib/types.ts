import type { CharacterWithAllDetailsResponse, FeatureWithRelations } from '@shared/schema';

export interface ProgressionRow {
    level: number;
    bab: string;
    fort: string;
    ref: string;
    will: string;
    // For spell-related columns we prefer formatted strings from the formatting system
    // so placeholders like "—" come from formatters rather than grid logic.
    spells?: { [spellLevel: number]: string };
    spellsKnown?: { [spellLevel: number]: string };
}

export interface ClassProgressionConfig {
    features: FeatureWithRelations[];
    classId?: number;
    spellcastingProgression?: Array<{
        classLevel: number;
        slots?: Array<{
            spellLevel: number;
            slotsPerDay: number;
        }>;
    }>;
    spellsKnownProgression?: Array<{
        classLevel: number;
        slots?: Array<{
            spellLevel: number;
            slotsPerDay: number;
        }>;
    }>;
}

/**
 * Minimal character object for formula calculations in progression generation.
 * Only includes the properties needed for formula evaluation.
 * Used as a mock character when calculating BAB and saving throws for progression tables.
 * 
 * Note: This is a minimal mock that satisfies the type system. The actual formula
 * calculation functions may not use all properties of CharacterWithAllDetailsResponse.
 */
export interface MinimalCharacterForFormula {
    abilityScores: CharacterWithAllDetailsResponse['abilityScores'];
    advancements: CharacterWithAllDetailsResponse['advancements'];
}
