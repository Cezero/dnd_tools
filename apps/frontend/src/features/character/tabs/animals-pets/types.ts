import type {
    CharacterCompanionDraft,
    CharacterSelectedFormDraft,
    FeatCacheEntry,
    FeatureWithRelations,
    ResolvedCharacterCompanionDraft,
    SkillCacheEntry,
    Trick,
    TrickPurposeWithRelations,
} from '@shared/schema';

/**
 * Shared lookup data for companion/pet editors.
 */
export interface CompanionEditorLookups {
    purposes: TrickPurposeWithRelations[];
    tricks: Trick[];
    skills: SkillCacheEntry[];
    feats: FeatCacheEntry[];
    companionTypeById: Map<number, number>;
    monsterNameById: Map<number, string>;
}

/**
 * Props for a single companion or pet editor card.
 */
export interface CompanionEditorCardProps {
    companion: CharacterCompanionDraft;
    resolved?: ResolvedCharacterCompanionDraft;
    lookups: CompanionEditorLookups;
    canDelete: boolean;
    onChange: (next: CharacterCompanionDraft) => void;
    onDelete: () => void;
}

/**
 * Props for the wild-shape form picker.
 */
export interface WildShapeSectionProps {
    characterId: number;
    features: FeatureWithRelations[];
    selectedForms: CharacterSelectedFormDraft[];
    onAdd: (featureId: number, monsterId: number) => void;
    onRemove: (selectedFormId: number) => void;
}

/**
 * A wild-shape feature that can unlock selected forms.
 */
export interface WildShapeFeatureOption {
    featureId: number;
    name: string;
    slug: string;
}
