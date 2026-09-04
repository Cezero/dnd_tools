import type { CharacterBonusSkillRankDraft, CharacterWithAllDetailsResponse, ItemWithDetails, CharacterItem as CharacterItemSchema, FeatCacheEntry, FeatureWithRelations } from '@shared/schema';
import { EntityAppliesToType } from '@shared/static-data';

import type { AttackDefinition , Money } from '../types';

/**
 * Props for EquipmentPurchaseDialog component
 */
export interface EquipmentPurchaseDialogProps {
    isOpen: boolean;
    onClose: () => void;
    money: Money;
    onPurchase: (item: ItemWithDetails, newMoney: Money) => void;
}

/**
 * Props for FeatSubIdSelectionModal component
 */
export interface FeatSubIdSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (weaponId: number) => void;
    feat: FeatCacheEntry | null;
    resolvedProgressions: FeatureWithRelations[];
}

/**
 * Props for BonusSkillRanksDialog.
 * `existingCustomSubtypes` is used to match Profession/Perform text to an existing casing.
 */
export interface BonusSkillRanksDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (grant: Omit<CharacterBonusSkillRankDraft, 'id' | 'characterId'>) => void;
    existingGrant?: CharacterBonusSkillRankDraft | null;
    existingCustomSubtypes: string[];
}

/**
 * Props for AttackDefinitionModal component
 */
export interface AttackDefinitionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (definition: Omit<AttackDefinition, 'id'>) => void;
    attackDefinition?: AttackDefinition | null;
    character: CharacterWithAllDetailsResponse;
    characterItems: CharacterItemSchema[];
    items?: ItemWithDetails[]; // Optional: base items to check if offhand is a shield
}

/**
 * Props for SelectedEntityDisplay component
 */
export interface SelectedEntityDisplayProps {
    choiceType: EntityAppliesToType;
    selectedValue: number;
    showHeader?: boolean;
}

/**
 * Props for EquipmentList component
 */
export interface EquipmentListProps<T extends ItemWithDetails = ItemWithDetails> {
    // Data fetching
    dataFetcher: () => Promise<{ results: T[]; total: number }>;

    // Column definitions
    columns: import('@tanstack/react-table').ColumnDef<T, unknown>[];

    // Grouping fields
    groupingFields: string[];

    // Action button configuration
    actionButtonLabel: string;
    onAction: (item: T) => void;
    isActionDisabled?: (item: T) => boolean;

    // Proficiency filtering
    proficientWeaponCategories?: number[];
    proficientArmorCategories?: number[];
    proficientItemIds?: number[];
    allowAll?: boolean;

    // Search
    searchPlaceholder?: string;

    // State persistence
    storageKey?: string;

    // Display
    itemDesc?: string;

    // Height configuration
    maxHeight?: number | 'auto';
}
