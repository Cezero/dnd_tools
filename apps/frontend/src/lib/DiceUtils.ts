export function extractDiceType(expression: string): string {
    const match = expression.match(/(\d*)d(\d+)/i);
    return match ? `d${match[2]}` : 'd6'; // fallback to d6 if unrecognized
}
