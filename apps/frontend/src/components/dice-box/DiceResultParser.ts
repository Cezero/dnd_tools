import type { DiceResult } from './DiceBoxManager';

export interface ParsedDiceResult {
    title: string;
    description: string;
    individualRolls: string[];
    total: number | string;
    hasSpecialResults: boolean;
    notation: string;
    group?: string;
}

export class DiceResultParser {
    /**
     * Parse a DiceResult into a formatted display structure for toasts
     */
    static parseResult(result: DiceResult): ParsedDiceResult {
        const { notation, results, total, group } = result;

        // Generate title based on notation and group
        const title = this.generateTitle(notation, group);

        // Format individual die results
        const individualRolls = this.formatIndividualRolls(results, notation);

        // Generate description with formatted results
        const description = this.generateDescription(individualRolls, total);

        // Check for special results (critical hits, etc.)
        const hasSpecialResults = this.hasSpecialResults(results, notation);

        return {
            title,
            description,
            individualRolls,
            total,
            hasSpecialResults,
            notation,
            group
        };
    }

    /**
     * Generate a user-friendly title for the roll
     */
    private static generateTitle(notation: string, group?: string): string {
        if (group) {
            // Capitalize first letter of group
            const groupName = group.charAt(0).toUpperCase() + group.slice(1);
            return `${groupName} Roll: ${notation}`;
        }
        return `Dice Roll: ${notation}`;
    }

    /**
     * Format individual die results with die type indicators
     */
    private static formatIndividualRolls(results: number[], notation: string): string[] {
        // Extract die type from notation (e.g., "3d6" -> "d6")
        const dieType = this.extractDieType(notation);

        return results.map((value, index) => {
            const rollClass = this.getRollClass(value, dieType);
            return `${rollClass}${value}`;
        });
    }

    /**
     * Extract die type from notation
     */
    private static extractDieType(notation: string): string {
        const match = notation.match(/d(\d+)/);
        return match ? `d${match[1]}` : 'd6'; // Default to d6 if parsing fails
    }

    /**
     * Get CSS class for roll styling based on value and die type
     */
    private static getRollClass(value: number, dieType: string): string {
        const sides = parseInt(dieType.substring(1));

        // Critical success (max value)
        if (value === sides) {
            return 'crit-success ';
        }

        // Critical failure (1 on most dice, but not on d1)
        if (value === 1 && sides > 1) {
            return 'crit-failure ';
        }

        // Special handling for d20 (natural 20 and natural 1)
        if (sides === 20) {
            if (value === 20) return 'crit-success ';
            if (value === 1) return 'crit-failure ';
        }

        return '';
    }

    /**
     * Generate description with formatted results and total
     */
    private static generateDescription(individualRolls: string[], total: number | string): string {
        const rollsText = individualRolls.join(', ');

        if (typeof total === 'number') {
            return `${rollsText} = ${total}`;
        } else {
            return `${rollsText} = ${total}`;
        }
    }

    /**
     * Check if the roll contains any special results
     */
    private static hasSpecialResults(results: number[], notation: string): boolean {
        const dieType = this.extractDieType(notation);
        const sides = parseInt(dieType.substring(1));

        return results.some(value => {
            // Critical success
            if (value === sides) return true;

            // Critical failure (1 on most dice)
            if (value === 1 && sides > 1) return true;

            return false;
        });
    }

    /**
     * Parse raw DiceBox results (for future enhancement)
     * This method can be expanded to handle more complex roll structures
     */
    static parseRawResults(rawResults: any): ParsedDiceResult | null {
        try {
            // Handle the actual DiceBox format: array of roll objects
            if (Array.isArray(rawResults) && rawResults.length > 0) {
                const firstRoll = rawResults[0];
                const rolls = firstRoll.rolls || [];
                const total = firstRoll.value || 0;

                // Extract individual die values
                const dieValues = rolls.map((roll: any) => roll.value);

                // Create notation from roll data
                const notation = `${firstRoll.qty}d${firstRoll.sides}`;

                const diceResult: DiceResult = {
                    notation,
                    results: dieValues,
                    total
                };

                return this.parseResult(diceResult);
            }
        } catch (error) {
            console.error('Error parsing raw dice results:', error);
        }

        return null;
    }

    /**
     * Generate a short summary for compact display
     */
    static generateSummary(result: DiceResult): string {
        const { notation, results, total } = result;

        if (results.length === 1) {
            return `${notation}: ${total}`;
        } else {
            const rollsText = results.join(', ');
            return `${notation}: [${rollsText}] = ${total}`;
        }
    }

    /**
     * Check if a roll is a critical success
     */
    static isCriticalSuccess(value: number, dieType: string): boolean {
        const sides = parseInt(dieType.substring(1));
        return value === sides;
    }

    /**
     * Check if a roll is a critical failure
     */
    static isCriticalFailure(value: number, dieType: string): boolean {
        const sides = parseInt(dieType.substring(1));
        return value === 1 && sides > 1;
    }
} 
