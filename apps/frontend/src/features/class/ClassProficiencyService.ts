import type { ProficiencyFeat } from '@/components/feature-system';
import { FeatApi } from '@/features/feat/FeatApi';
import { FeatureProgression } from '@shared/schema';
import { FeatBenefitType, FeatureSpecialEffectType, SpecialFeatureId } from '@shared/static-data';

export const ClassProficiencyService = {
    /**
     * Fetch all feats that provide weapon or armor proficiencies
     */
    async getProficiencyFeats(): Promise<ProficiencyFeat[]> {
        try {
            // Use the new proficiency query endpoint
            const response = await FeatApi.featQuery({ queryType: 'proficiency' });

            // Extract proficiency type from benefits
            const proficiencyFeats: ProficiencyFeat[] = [];

            for (const feat of response.results) {
                if (feat.benefits && feat.benefits.length > 0) {
                    const proficiencyBenefit = feat.benefits.find(benefit =>
                        benefit.typeId === FeatBenefitType.PROFICIENCY
                    );

                    if (proficiencyBenefit && proficiencyBenefit.referenceId) {
                        proficiencyFeats.push({
                            id: feat.id,
                            name: feat.name,
                            proficiencyTypeId: proficiencyBenefit.referenceId
                        });
                    }
                }
            }

            return proficiencyFeats;
        } catch (error) {
            console.error('Failed to fetch proficiency feats:', error);
            return [];
        }
    },

    /**
     * Extract proficiencies from feature progressions
     */
    getClassProficiencies(
        progressions: FeatureProgression[]
    ): Array<{ featId: number; itemId: number; featName: string; itemName?: string }> {
        return progressions
            .filter(prog => prog.featureId === SpecialFeatureId.ClassProficiency)
            .flatMap(prog =>
                prog.effects
                    ?.filter((effect) => effect.effectType === FeatureSpecialEffectType.Proficiency)
                    .map((effect) => ({
                        featId: effect.featId || 0,
                        itemId: effect.itemId || -1,
                        featName: effect.feat?.name || `Feat ${effect.featId}`,
                        itemName: effect.itemId === -1 ? undefined : (effect.item?.name || `Item ${effect.itemId}`)
                    })) || []
            )
            .filter(prof => prof.featId > 0);
    },

    /**
     * Remove a proficiency from class proficiencies progression
     */
    removeProficiency(
        featureProgressions: FeatureProgression[],
        setFeatureProgressions: (progressions: FeatureProgression[]) => void,
        featId: number,
        itemId: number
    ) {
        const updatedProgressions = featureProgressions.map(prog => {
            if (prog.featureId === SpecialFeatureId.ClassProficiency) {
                // Remove the specific proficiency effect
                const updatedEffects = prog.effects?.filter(effect =>
                    !(effect.effectType === FeatureSpecialEffectType.Proficiency &&
                        effect.featId === featId &&
                        effect.itemId === itemId)
                ) || [];

                return {
                    ...prog,
                    effects: updatedEffects
                };
            }
            return prog;
        });

        // Remove the progression entirely if it has no effects left
        const finalProgressions = updatedProgressions.filter(prog =>
            !(prog.featureId === SpecialFeatureId.ClassProficiency) ||
            (prog.effects && prog.effects.length > 0)
        );

        setFeatureProgressions(finalProgressions);
    }
}; 
