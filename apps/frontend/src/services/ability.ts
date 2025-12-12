export function getAbilityModifier(abilityScores: Array<{ abilityId: number; value: number }>, abilityId: number): number {
    const abilityScore = abilityScores.find(score => score.abilityId === abilityId);
    const score = abilityScore?.value ?? 10;
    return Math.floor((score - 10) / 2);
}
