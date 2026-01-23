import { createResolutionHook } from '@/lib/hooks/createResolutionHook';
import { DraftType } from '@shared/static-data';


import { CharacterQueryHooks } from './CharacterQueryHooks';
import { CharacterResolutionApi, type ResolvedCharacterResult } from './CharacterResolutionApi';

const useCharacterResolutionBase = createResolutionHook<number, ResolvedCharacterResult, never>({
    draftType: DraftType.Character,
    api: {
        startEditing: CharacterResolutionApi.startEditing,
        fetchEntity: async (id: number) => {
            // Fetch character data using normal entity service (NOT state management endpoint)
            // Note: CharacterSchema may not include all resolved fields, but we use normal service
            const characterData = await CharacterQueryHooks.getCharacterById(id);
            return {
                state: characterData as unknown as ResolvedCharacterResult,
            };
        },
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

    return {
        resolvedCharacter: resolution.state,
        isLoading: resolution.isLoading,
        error: resolution.error,
        updateValue: resolution.updateValue,
        save: resolution.save,
        cancel: resolution.cancel,
        refreshState: resolution.refreshState,
    };
}
