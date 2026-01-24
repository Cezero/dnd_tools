import { useCallback, useEffect, useMemo, useState } from 'react';

import { DraftApi } from '@/services/api/EntityApi';
import type { DraftSaveResponse, ValidationError, ValidationErrorResponse } from '@shared/schema';
import type { DraftAction } from '@shared/static-data';
import { DraftType } from '@shared/static-data';

import { useGenericResolution } from '@/lib/hooks/useGenericResolution';

type ErrorWithValidationErrors = Error & {
    validationErrors?: ValidationError[];
};

/**
 * Hook for managing a CharacterAdvancement draft session.
 *
 * This is a thin wrapper around the generic draft editing lifecycle:
 * - startEditing / cancel via DraftApi
 * - updateValue via DraftApi.updateValue
 *
 * The actual resolved-character updates are delivered separately via WebSocket topic subscriptions.
 */
export function useAdvancementDraft(
    advancementId: number | null,
    options?: {
        /**
         * Optional context passed to `startEditing`.
         *
         * This is required for `id=0` advancement drafts (create / level-up) so the backend can initialize
         * the draft state (e.g., characterId, level, mode).
         */
        startEditingContext?: unknown;
        /**
         * Optional callback invoked when the backend mints a new draft id (id=0 -> negative id).
         *
         * Use this to propagate the minted id into component state (e.g., `currentAdvancementId`).
         */
        onResolvedDraftId?: (resolvedDraftId: number) => void;
    }
): {
    draftId: number | null;
    isLoading: boolean;
    error: string | null;
    updateValue: (path: string, value: unknown, action?: DraftAction) => Promise<{ success: boolean; id?: number }>;
    save: () => Promise<number>;
    cancel: () => Promise<void>;
    refreshState: () => Promise<void>;
} {
    const [activeAdvancementId, setActiveAdvancementId] = useState<number | null>(advancementId);
    const startEditingContext = options?.startEditingContext;
    const onResolvedDraftId = options?.onResolvedDraftId;

    useEffect(() => {
        setActiveAdvancementId(advancementId);
    }, [advancementId]);

    const api = useMemo(
        () => ({
            startEditing: async (id: number) => DraftApi.startEditing(DraftType.Advancement, id, startEditingContext),
            fetchEntity: async (_id: number) => ({ state: null }),
            cancel: async (id: number) => {
                await DraftApi.cancel(DraftType.Advancement, id);
            },
        }),
        [startEditingContext]
    );

    const resolution = useGenericResolution<number, null, never>(
        activeAdvancementId,
        api,
        (resolvedId) => {
            setActiveAdvancementId(resolvedId);
            onResolvedDraftId?.(resolvedId);
        }
    );

    const save = useCallback(async (): Promise<number> => {
        if (activeAdvancementId === null) {
            throw new Error('Cannot save: advancement draft ID is null');
        }

        const result: DraftSaveResponse = await DraftApi.save(DraftType.Advancement, activeAdvancementId);

        if (!result.success) {
            const validationErrorResponse = result as ValidationErrorResponse;
            const error = new Error('Validation failed') as ErrorWithValidationErrors;
            error.validationErrors = validationErrorResponse.errors;
            throw error;
        }

        await resolution.save();

        const id = (result as { id?: number }).id;
        return typeof id === 'number' ? id : activeAdvancementId;
    }, [activeAdvancementId, resolution]);

    const updateValue = useCallback(
        async (path: string, value: unknown, action?: DraftAction): Promise<{ success: boolean; id?: number }> => {
            if (activeAdvancementId === null) {
                throw new Error('Cannot update value: advancement draft ID is null');
            }

            const response = await DraftApi.updateValue(
                DraftType.Advancement,
                activeAdvancementId,
                path,
                value as string | number | boolean | null,
                action
            );

            if (!response.success) {
                throw new Error('Failed to update advancement draft');
            }

            return response;
        },
        [activeAdvancementId]
    );

    return {
        draftId: activeAdvancementId,
        isLoading: resolution.isLoading,
        error: resolution.error,
        updateValue,
        save,
        cancel: resolution.cancel,
        refreshState: resolution.refreshState,
    };
}

