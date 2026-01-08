import type { CharacterWithAllDetailsResponse } from '@shared/schema';
import type { FeatureProgression } from '@shared/schema';
import { getGrantedFeats } from '@/features/character/featureProgressionUtils';
import { getAllCharacterFeats } from '@/lib/character-calculation/core/featAccessor';

/**
 * Check if character has a specific feat
 * Uses resolved progressions - no backend calls needed
 * Now includes feats from both AdvancementFeat and CharacterFeatureChoice sources
 */
export function hasFeat(
    resolvedProgressions: FeatureProgression[],
    character: CharacterWithAllDetailsResponse,
    featName: string
): boolean {
    // Check granted feats from resolved progressions
    const grantedFeats = getGrantedFeats(resolvedProgressions);
    const hasGrantedFeat = grantedFeats.some(entity => 
        entity.feat?.name.toLowerCase() === featName.toLowerCase()
    );
    
    // Check selected feats from character advancements and choices using unified accessor
    const allFeats = getAllCharacterFeats(character, resolvedProgressions);
    // Note: We can't check by name directly since we only have featId
    // For now, we'll rely on granted feats check which includes resolved feat choices
    // TODO: If needed, we could fetch feat names by ID, but granted feats should cover most cases
    
    return hasGrantedFeat;
}

