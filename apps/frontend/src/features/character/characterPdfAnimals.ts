import type { QueryClient } from '@tanstack/react-query';
import type jsPDF from 'jspdf';

import { CacheQueryHooks } from '@/services/query/CacheQueryHooks';
import type {
    ResolvedCharacterCompanionDraft,
    ResolvedSelectedFormDraft,
} from '@shared/schema';
import { CharacterCompanionRole } from '@shared/static-data';

import { CharacterQueryHooks } from './CharacterQueryHooks';
import {
    buildRevisedStatBlock,
    formatCompanionExtras,
    formatSelectedFormExtras,
} from './stat-block';
import type {
    GenerateAnimalsPagesArgs,
    PdfAnimalPageBlock,
    RevisedStatBlockExtras,
    RevisedStatBlockLookups,
} from './stat-block';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const OUTER_BOX_X = 32;
const OUTER_BOX_Y = 26;
const OUTER_BOX_WIDTH = 553;
const OUTER_BOX_HEIGHT = 750;
const CONTENT_X = 44;
const CONTENT_WIDTH = 524;
const CONTENT_TOP = 64;
const CONTENT_BOTTOM = 764;
const LINE_HEIGHT = 10;
const BLOCK_GAP = 12;
const BODY_SIZE = 8;
const TITLE_SIZE = 11;
const GROUP_SIZE = 9;

/**
 * Loads resolved animals and name caches, then appends packed portrait pages.
 * Adds no pages when the character has no companions, pets, or selected forms.
 */
export async function appendAnimalsPages(
    doc: jsPDF,
    characterId: number,
    characterName: string,
    queryClient?: QueryClient
): Promise<void> {
    const { companions, forms, lookups, monsterNameById } = await loadAnimalsPdfData(
        characterId,
        queryClient
    );
    const blocks = collectPdfAnimalBlocks(companions, forms, lookups, monsterNameById);
    if (blocks.length === 0) {
        return;
    }
    drawAnimalsPages(doc, { characterName, blocks });
}

/**
 * Fetches view-mode resolution and skill/feat/monster caches for PDF lookups.
 */
async function loadAnimalsPdfData(
    characterId: number,
    queryClient?: QueryClient
): Promise<{
    companions: ResolvedCharacterCompanionDraft[];
    forms: ResolvedSelectedFormDraft[];
    lookups: RevisedStatBlockLookups;
    monsterNameById: Map<number, string>;
}> {
    const resolved = queryClient
        ? await queryClient.fetchQuery({
            queryKey: CharacterQueryHooks.getCharacterResolvedQueryKey(characterId),
            queryFn: () => CharacterQueryHooks.getCharacterResolvedQueryFn({
                pathParams: { id: characterId },
            }),
            staleTime: 0,
            gcTime: 10 * 60 * 1000,
        })
        : await CharacterQueryHooks.getCharacterResolved(characterId);

    const [skillsResponse, featsResponse, monstersResponse] = await Promise.all([
        CacheQueryHooks.getSkillsCache(),
        CacheQueryHooks.getFeatsCache(),
        CacheQueryHooks.getMonstersCache(),
    ]);

    const skillNameById = new Map<number, string>();
    for (const skill of skillsResponse?.results ?? []) {
        skillNameById.set(skill.id, skill.name);
    }
    const featNameById = new Map<number, string>();
    for (const feat of featsResponse?.results ?? []) {
        featNameById.set(feat.id, feat.name);
    }
    const monsterNameById = new Map<number, string>();
    for (const monster of monstersResponse?.results ?? []) {
        monsterNameById.set(monster.id, monster.name);
    }

    return {
        companions: resolved.resolvedCharacter.resolvedCompanions ?? [],
        forms: resolved.resolvedCharacter.resolvedSelectedForms ?? [],
        lookups: { skillNameById, featNameById },
        monsterNameById,
    };
}

/**
 * Groups class companions (no section header), then pets, then wild-shape forms.
 */
export function collectPdfAnimalBlocks(
    companions: ResolvedCharacterCompanionDraft[],
    forms: ResolvedSelectedFormDraft[],
    lookups: RevisedStatBlockLookups,
    monsterNameById: Map<number, string>
): PdfAnimalPageBlock[] {
    const blocks: PdfAnimalPageBlock[] = [];
    const classCompanions = companions.filter((row) => row.role !== CharacterCompanionRole.Pet);
    const pets = companions.filter((row) => row.role === CharacterCompanionRole.Pet);

    for (const companion of classCompanions) {
        const block = companionToPdfBlock(
            companion,
            lookups,
            monsterNameById.get(companion.monsterId),
            ''
        );
        if (block) {
            blocks.push(block);
        }
    }
    for (const companion of pets) {
        const block = companionToPdfBlock(
            companion,
            lookups,
            monsterNameById.get(companion.monsterId),
            'Pets'
        );
        if (block) {
            blocks.push(block);
        }
    }
    for (const form of forms) {
        if (!form.computedStatBlock) {
            continue;
        }
        blocks.push({
            groupLabel: 'Wild Shape Forms',
            model: buildRevisedStatBlock({ block: form.computedStatBlock, lookups }),
            extras: formatSelectedFormExtras(form),
        });
    }
    return blocks;
}

function companionToPdfBlock(
    companion: ResolvedCharacterCompanionDraft,
    lookups: RevisedStatBlockLookups,
    monsterName: string | undefined,
    groupLabel: string
): PdfAnimalPageBlock | null {
    if (!companion.computedStatBlock) {
        return null;
    }
    return {
        groupLabel,
        model: buildRevisedStatBlock({ block: companion.computedStatBlock, lookups }),
        extras: formatCompanionExtras(companion, monsterName),
    };
}

/**
 * Packs revised stat blocks onto portrait letter pages, starting a new page only when
 * the next block (plus its group header) will not fit.
 */
function drawAnimalsPages(doc: jsPDF, args: GenerateAnimalsPagesArgs): void {
    startAnimalsPage(doc, args.characterName);
    let y = CONTENT_TOP;
    let currentGroup: string | null = null;

    for (const block of args.blocks) {
        const needsGroupHeader = block.groupLabel.length > 0 && block.groupLabel !== currentGroup;
        const height = measureAnimalBlock(doc, block, needsGroupHeader);
        if (y + height > CONTENT_BOTTOM && y > CONTENT_TOP) {
            startAnimalsPage(doc, args.characterName);
            y = CONTENT_TOP;
            currentGroup = null;
        }
        const drawGroupHeader = block.groupLabel.length > 0 && block.groupLabel !== currentGroup;
        y = drawAnimalBlock(doc, block, y, drawGroupHeader);
        currentGroup = block.groupLabel;
    }
}

function startAnimalsPage(doc: jsPDF, characterName: string): void {
    doc.addPage([PAGE_WIDTH, PAGE_HEIGHT], 'portrait');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.setFillColor(255, 255, 255);
    doc.rect(OUTER_BOX_X, OUTER_BOX_Y, OUTER_BOX_WIDTH, OUTER_BOX_HEIGHT, 'FD');

    doc.setFont('ArchivoNarrow', 'bold');
    doc.setFontSize(TITLE_SIZE);
    doc.setTextColor(0, 0, 0);
    doc.text('Animals & Pets', CONTENT_X, 46);
    doc.setFont('ArchivoNarrow', 'normal');
    doc.setFontSize(BODY_SIZE);
    doc.text(characterName, CONTENT_X + CONTENT_WIDTH, 46, { align: 'right' });
}

function measureAnimalBlock(
    doc: jsPDF,
    block: PdfAnimalPageBlock,
    includeGroupHeader: boolean
): number {
    return renderAnimalBlock(doc, block, 0, includeGroupHeader, true);
}

function drawAnimalBlock(
    doc: jsPDF,
    block: PdfAnimalPageBlock,
    y: number,
    includeGroupHeader: boolean
): number {
    return renderAnimalBlock(doc, block, y, includeGroupHeader, false);
}

/**
 * Measures or draws one revised block plus extras. Returns the y after the block gap.
 */
function renderAnimalBlock(
    doc: jsPDF,
    block: PdfAnimalPageBlock,
    startY: number,
    includeGroupHeader: boolean,
    dryRun: boolean
): number {
    let y = startY;
    if (includeGroupHeader) {
        if (!dryRun) {
            doc.setFont('ArchivoNarrow', 'bold');
            doc.setFontSize(GROUP_SIZE);
            doc.text(block.groupLabel, CONTENT_X, y);
        }
        y += LINE_HEIGHT + 2;
    }

    const displayName = block.extras.creatureName ?? block.extras.monsterName;
    if (!dryRun) {
        doc.setFont('ArchivoNarrow', 'bold');
        doc.setFontSize(BODY_SIZE + 1);
        doc.text(`${displayName}  ${block.extras.role}`, CONTENT_X, y);
    }
    y += LINE_HEIGHT;

    y = renderWrappedLine(doc, block.model.header, y, dryRun, true);
    for (const line of block.model.lines) {
        y = renderLabeledLine(doc, line.label, line.text, y, dryRun);
    }

    y += 4;
    y = renderExtraLine(doc, 'Purpose', block.extras.purpose, y, dryRun);
    y = renderExtraLine(doc, 'Tricks', formatTricksForPdf(block.extras), y, dryRun);
    y = renderExtraLine(doc, 'Companion', block.extras.progression, y, dryRun);
    y = renderExtraLine(
        doc,
        'Specials',
        block.extras.specials.length > 0 ? block.extras.specials.join(', ') : null,
        y,
        dryRun
    );
    for (const note of block.extras.notes) {
        y = renderWrappedLine(doc, note, y, dryRun, false);
    }

    if (!dryRun) {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.4);
        doc.line(CONTENT_X, y + 3, CONTENT_X + CONTENT_WIDTH, y + 3);
        doc.setDrawColor(0, 0, 0);
    }
    return y + BLOCK_GAP;
}

function formatTricksForPdf(extras: RevisedStatBlockExtras): string | null {
    if (extras.tricks.length === 0) {
        return null;
    }
    return extras.tricks
        .map((trick) => `${trick.name}${trick.suffix}`)
        .join(', ');
}

function renderExtraLine(
    doc: jsPDF,
    label: string,
    value: string | null,
    y: number,
    dryRun: boolean
): number {
    if (!value) {
        return y;
    }
    return renderLabeledLine(doc, label, value, y, dryRun);
}

function renderLabeledLine(
    doc: jsPDF,
    label: string,
    text: string,
    y: number,
    dryRun: boolean
): number {
    if (label.length === 0) {
        return renderWrappedLine(doc, text, y, dryRun, false);
    }
    doc.setFontSize(BODY_SIZE);
    const prefix = `${label} – `;
    const labelWidth = Math.min(doc.getTextWidth(prefix), CONTENT_WIDTH * 0.35);
    const wrapped = doc.splitTextToSize(text, CONTENT_WIDTH - labelWidth);
    if (!dryRun) {
        doc.setFont('ArchivoNarrow', 'bold');
        doc.text(prefix, CONTENT_X, y);
        doc.setFont('ArchivoNarrow', 'normal');
        if (wrapped.length > 0) {
            doc.text(wrapped[0], CONTENT_X + labelWidth, y);
            for (let index = 1; index < wrapped.length; index += 1) {
                doc.text(wrapped[index], CONTENT_X, y + index * LINE_HEIGHT);
            }
        }
    }
    return y + Math.max(1, wrapped.length) * LINE_HEIGHT;
}

function renderWrappedLine(
    doc: jsPDF,
    text: string,
    y: number,
    dryRun: boolean,
    bold: boolean
): number {
    doc.setFontSize(BODY_SIZE);
    const wrapped = doc.splitTextToSize(text, CONTENT_WIDTH);
    if (!dryRun) {
        doc.setFont('ArchivoNarrow', bold ? 'bold' : 'normal');
        for (let index = 0; index < wrapped.length; index += 1) {
            doc.text(wrapped[index], CONTENT_X, y + index * LINE_HEIGHT);
        }
    }
    return y + Math.max(1, wrapped.length) * LINE_HEIGHT;
}

