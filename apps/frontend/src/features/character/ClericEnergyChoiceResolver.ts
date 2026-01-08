import type { CharacterWithAllDetailsResponse, CharacterFeatureChoice, Deity } from '@shared/schema';

/**
 * Resolves cleric energy type choice from deity alignment or character alignment
 * Handles the linked choice between Turn/Rebuke Undead and Spontaneous Casting
 */
export class ClericEnergyChoiceResolver {
    /**
     * Derives or retrieves cleric energy choice for a character
     */
    static resolveClericEnergyChoice(
        character: CharacterWithAllDetailsResponse,
        deity: Deity | null | undefined,
        choices: Map<string, CharacterFeatureChoice>
    ): {
        energyType: 'positive' | 'negative';
        turnRebuke: 'turn' | 'rebuke';
        spontaneousCasting: 'cure' | 'inflict';
    } | null {
        // Check if explicit choice exists
        const choice = choices.get('cleric-energy-type');
        if (choice && choice.choiceData) {
            const data = choice.choiceData as {
                energyType?: 'positive' | 'negative';
                turnRebuke?: 'turn' | 'rebuke';
                spontaneousCasting?: 'cure' | 'inflict';
            };
            
            return {
                energyType: data.energyType || (data.turnRebuke === 'turn' ? 'positive' : 'negative'),
                turnRebuke: data.turnRebuke || (data.energyType === 'positive' ? 'turn' : 'rebuke'),
                spontaneousCasting: data.spontaneousCasting || (data.energyType === 'positive' ? 'cure' : 'inflict'),
            };
        }

        // Derive from deity alignment
        if (deity) {
            const deityAlignment = deity.alignmentId;
            if (deityAlignment) {
                // Good alignment (1 = LG, 2 = NG, 3 = CG, or any with Good component)
                if (this.isGoodAlignment(deityAlignment)) {
                    return {
                        energyType: 'positive',
                        turnRebuke: 'turn',
                        spontaneousCasting: 'cure',
                    };
                }
                
                // Evil alignment (7 = LE, 8 = NE, 9 = CE, or any with Evil component)
                if (this.isEvilAlignment(deityAlignment)) {
                    return {
                        energyType: 'negative',
                        turnRebuke: 'rebuke',
                        spontaneousCasting: 'inflict',
                    };
                }
            }
        }

        // Derive from character alignment if no deity
        if (character.alignmentId) {
            if (this.isGoodAlignment(character.alignmentId)) {
                return {
                    energyType: 'positive',
                    turnRebuke: 'turn',
                    spontaneousCasting: 'cure',
                };
            }
            
            if (this.isEvilAlignment(character.alignmentId)) {
                return {
                    energyType: 'negative',
                    turnRebuke: 'rebuke',
                    spontaneousCasting: 'inflict',
                };
            }
        }

        // Neutral cleric of neutral deity - requires explicit choice
        // Return null to indicate choice is needed
        return null;
    }

    /**
     * Checks if an alignment ID represents a Good alignment
     * Alignments: 1=LG, 2=NG, 3=CG (all have Good component)
     */
    private static isGoodAlignment(alignmentId: number): boolean {
        return alignmentId === 1 || alignmentId === 2 || alignmentId === 3;
    }

    /**
     * Checks if an alignment ID represents an Evil alignment
     * Alignments: 7=LE, 8=NE, 9=CE (all have Evil component)
     */
    private static isEvilAlignment(alignmentId: number): boolean {
        return alignmentId === 7 || alignmentId === 8 || alignmentId === 9;
    }

    /**
     * Checks if a cleric needs to make an explicit energy type choice
     * (Neutral cleric of neutral deity)
     */
    static needsExplicitChoice(
        character: CharacterWithAllDetailsResponse,
        deity: Deity | null | undefined
    ): boolean {
        // If explicit choice exists, no need for another
        // This would be checked by the caller

        // Neutral deity
        if (deity && deity.alignmentId) {
            const isNeutral = !this.isGoodAlignment(deity.alignmentId) && !this.isEvilAlignment(deity.alignmentId);
            if (isNeutral) {
                // Neutral character
                if (character.alignmentId) {
                    const charIsNeutral = !this.isGoodAlignment(character.alignmentId) && !this.isEvilAlignment(character.alignmentId);
                    if (charIsNeutral) {
                        return true;
                    }
                }
            }
        }

        // No deity, neutral character
        if (!deity && character.alignmentId) {
            const charIsNeutral = !this.isGoodAlignment(character.alignmentId) && !this.isEvilAlignment(character.alignmentId);
            if (charIsNeutral) {
                return true;
            }
        }

        return false;
    }
}

