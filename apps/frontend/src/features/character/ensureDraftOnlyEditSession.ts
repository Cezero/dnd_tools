import { DraftApi } from '@/services/api/EntityApi';
import { UserSessionApi } from '@/services/api/UserSessionApi';
import { DraftType } from '@shared/static-data';

import type { AdvancementCreateContext, DraftOnlyEditSession } from './types';

/**
 * Ensure Redis + session exist for a minted character edit URL.
 *
 * “New character” calls `startEditing` with `id = 0` and then navigates here.
 * Refresh / deploy / TTL expiry keeps the same negative URL but Redis may be gone.
 * This re-runs `startEditing` for the URL id (backend re-inits empty create state
 * when the key is missing) and restores or remints the paired advancement draft.
 *
 * @param draftCharacterId - Negative character draft id from the edit URL
 * @returns The character id (unchanged) and the advancement draft id to use
 */
export async function ensureDraftOnlyEditSession(
    draftCharacterId: number
): Promise<DraftOnlyEditSession> {
    const characterStart = await DraftApi.startEditing(DraftType.Character, draftCharacterId);
    if (!characterStart.success) {
        throw new Error('Failed to resume character draft');
    }

    const advancementContext: AdvancementCreateContext = {
        characterId: draftCharacterId,
        level: 1,
        mode: 'create',
    };

    const session = await UserSessionApi.getMySession();
    const existingAdvancementId = session.editing.find(
        (ref) => ref.draftType === DraftType.Advancement && typeof ref.id === 'number' && ref.id < 0
    )?.id;

    if (typeof existingAdvancementId === 'number') {
        const advancementStart = await DraftApi.startEditing(
            DraftType.Advancement,
            existingAdvancementId,
            advancementContext
        );
        if (!advancementStart.success) {
            throw new Error('Failed to resume advancement draft');
        }

        return {
            characterId: draftCharacterId,
            advancementDraftId: existingAdvancementId,
        };
    }

    const mintedAdvancement = await DraftApi.startEditing(
        DraftType.Advancement,
        0,
        advancementContext
    );
    if (!mintedAdvancement.success || typeof mintedAdvancement.id !== 'number') {
        throw new Error('Failed to start advancement draft for create');
    }

    return {
        characterId: draftCharacterId,
        advancementDraftId: mintedAdvancement.id,
    };
}
