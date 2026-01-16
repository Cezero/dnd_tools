import type { ResolutionContext } from '@/features/character/types';
import type { FormattedCharacterResult, DisplayResult } from '@/lib/formatters/types';
import type { CharacterWithAllDetailsResponse, FeatureProgression, PendingChoice } from '@shared/schema';
import type { DisplayType } from '@shared/static-data';

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

/**
 * Props for JsonViewer component
 */
export interface JsonViewerProps {
    data: unknown;
    loading?: boolean;
    error?: string | null;
}

/**
 * Props for CharacterExplorerDetailTabs component
 */
export interface CharacterExplorerDetailTabsProps {
    activeTab: string;
    explorerData: CharacterExplorerData;
    selectedDisplayType: DisplayType;
    onDisplayTypeChange: (type: DisplayType) => void;
}

