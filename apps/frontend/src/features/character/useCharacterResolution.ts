import { useEffect, useState } from 'react';

import { createResolutionHook } from '@/lib/hooks/createResolutionHook';
import { useTopicSubscription } from '@/lib/hooks/useTopicSubscription';
import { DraftType } from '@shared/static-data';
import { CharacterResolutionApi, type ResolvedCharacterResult } from './CharacterResolutionApi';

const useCharacterResolutionBase = createResolutionHook<number, ResolvedCharacterResult, never>({
    draftType: DraftType.Character,
    api: {
        startEditing: CharacterResolutionApi.startEditing,
        fetchEntity: async (_id: number) => ({ state: null }),
        cancel: async (id: number) => {
            await CharacterResolutionApi.cancel(id);
        },
        save: CharacterResolutionApi.save,
    },
});

/**
 * Hook for managing character editing.
 * 
 * **Implementation Note**: This hook is a thin wrapper around `createResolutionHook`
 * that provides Character-specific API configuration. All editing management logic
 * is handled by the factory function.
 * 
 * @param characterId - The character ID to manage editing for (null if not yet loaded)
 * @returns Object containing character state and operations
 * 
 * @see createResolutionHook - Factory implementation
 */
export function useCharacterResolution(characterId: number | null) {
    const resolution = useCharacterResolutionBase(characterId);
    const [resolvedCharacter, setResolvedCharacter] = useState<ResolvedCharacterResult | null>(null);

    // Seed resolved state via read-only endpoint (useful before WS connects).
    useEffect(() => {
        if (!characterId) {
            setResolvedCharacter(null);
            return;
        }
        if (characterId < 1) {
            // Draft-only character creation uses topic updates; there is no persisted character to resolve via GET.
            setResolvedCharacter(null);
            return;
        }

        CharacterResolutionApi.getResolved(characterId)
            .then((result) => {
                setResolvedCharacter(result.resolvedCharacter);
            })
            .catch((error) => {
                console.error('Failed to fetch resolved character:', error);
            });
    }, [characterId]);

    // Subscribe to resolved character topic updates.
    useTopicSubscription<ResolvedCharacterResult>(
        'characterResolved',
        characterId,
        (payload) => {
            setResolvedCharacter(payload);
        }
    );

    return {
        resolvedCharacter,
        isLoading: resolution.isLoading,
        error: resolution.error,
        updateValue: resolution.updateValue,
        save: resolution.save,
        cancel: resolution.cancel,
        refreshState: resolution.refreshState,
    };
}
