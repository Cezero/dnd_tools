import type { CharacterWithAllDetailsResponse, FeatureProgression, DnDClass, Race } from '@shared/schema';
import type { DisplayType } from '@shared/static-data';
import type { FormattedCharacterResult, DisplayResult } from '@/lib/formatters/types';
import type { ResolutionContext, PendingChoice } from '@/features/character/types';

export interface CharacterExplorerData {
    character: CharacterWithAllDetailsResponse | null;
    resolvedProgressions: FeatureProgression[];
    formattedCharacterResult: FormattedCharacterResult | null;
    formattedDisplayResult: DisplayResult | null;
    resolutionContext: ResolutionContext | null;
    pendingChoices: PendingChoice[];
    selectedDisplayType: DisplayType;
    isLoading: boolean;
    error: string | null;
}

