import type { CharacterWithAllDetailsResponse, ResolvedCharacterResult } from '@shared/schema';

import { companionAdvancementService } from '../companion/companionAdvancementService';
import { selectedFormService } from '../selectedForm/selectedFormService';

/**
 * Computes companion and wild-shape sheets from the overlaid character snapshot
 * and attaches them to a ResolvedCharacterResult for Redis.
 */
export async function attachResolvedAnimals(
    result: ResolvedCharacterResult,
    character: CharacterWithAllDetailsResponse
): Promise<ResolvedCharacterResult> {
    const [resolvedCompanions, resolvedSelectedForms] = await Promise.all([
        companionAdvancementService.resolveCompanionsFromSnapshot(character),
        selectedFormService.resolveSelectedFormsFromSnapshot(character),
    ]);

    return {
        ...result,
        resolvedCompanions,
        resolvedSelectedForms,
    };
}
