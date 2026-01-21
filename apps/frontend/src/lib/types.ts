import type { CharacterWithAllDetailsResponse, FeatureWithRelations } from '@shared/schema';

export interface ProgressionRow {
    level: number;
    bab: string;
    fort: number;
    ref: number;
    will: number;
    spells?: { [spellLevel: number]: number };
    spellsKnown?: { [spellLevel: number]: number };
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
