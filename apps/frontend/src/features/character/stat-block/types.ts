import type { CompanionComputedStatBlock } from '@shared/schema';

/**
 * Name lookups used when formatting a revised stat block.
 */
export interface RevisedStatBlockLookups {
    skillNameById: Map<number, string>;
    featNameById: Map<number, string>;
}

/**
 * One labeled line in the Alexandrian short stat block.
 */
export interface RevisedStatBlockLine {
    label: string;
    text: string;
}

/**
 * Structured short revised 3.5 stat block for viewer and PDF.
 */
export interface RevisedStatBlockModel {
    header: string;
    lines: RevisedStatBlockLine[];
}

/**
 * One known trick shown after a companion or pet stat block.
 */
export interface RevisedStatBlockTrick {
    trickId: number;
    name: string;
    suffix: string;
    description: string | null;
}

/**
 * Extras that sit after the Alexandrian template.
 */
export interface RevisedStatBlockExtras {
    role: string;
    creatureName: string | null;
    purpose: string | null;
    tricks: RevisedStatBlockTrick[];
    progression: string | null;
    specials: string[];
    notes: string[];
    monsterId: number;
    monsterName: string;
}

/**
 * Input for building a revised block from a computed monster sheet.
 */
export interface BuildRevisedStatBlockArgs {
    block: CompanionComputedStatBlock;
    lookups: RevisedStatBlockLookups;
}

/**
 * Props for the RevisedStatBlock viewer/PDF-shared renderer.
 */
export interface RevisedStatBlockProps {
    model: RevisedStatBlockModel;
    extras: RevisedStatBlockExtras;
}

/**
 * Props for a trick name that links to the trick page and shows a description tooltip.
 */
export interface TrickNameLinkProps {
    trick: RevisedStatBlockTrick;
}

/**
 * One companion, pet, or wild-shape block ready for PDF packing.
 */
export interface PdfAnimalPageBlock {
    groupLabel: string;
    model: RevisedStatBlockModel;
    extras: RevisedStatBlockExtras;
}

/**
 * Arguments for appending packed Animals & Pets pages to a character PDF.
 */
export interface GenerateAnimalsPagesArgs {
    characterName: string;
    blocks: PdfAnimalPageBlock[];
}
