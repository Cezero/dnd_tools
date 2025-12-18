import type { CharacterWithAllDetailsResponse } from '@shared/schema';
import type { FeatureProgression } from '@shared/schema';
import { ResolvedFeatureService } from '@/features/character/ResolvedFeatureService';

/**
 * Check if character has a specific feat
 * Uses resolved progressions - no backend calls needed
 */
export function hasFeat(
    resolvedProgressions: FeatureProgression[],
    character: CharacterWithAllDetailsResponse,
    featName: string
): boolean {
    // Check granted feats from resolved progressions
    const grantedFeats = ResolvedFeatureService.getGrantedFeats(resolvedProgressions);
    const hasGrantedFeat = grantedFeats.some(entity => 
        entity.feat?.name.toLowerCase() === featName.toLowerCase()
    );
    
    // Check selected feats from character advancements
    // Note: advancement.feats contains { advancementId, featId } - need to check featId against feat name
    // For now, we'll rely on granted feats check which is more reliable
    const hasSelectedFeat = false; // TODO: Implement feat name lookup from featId if needed
    
    return hasGrantedFeat || hasSelectedFeat;
}

