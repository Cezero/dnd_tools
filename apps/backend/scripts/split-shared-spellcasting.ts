/**
 * Create shared spell table features (one feature per table, CONDITIONAL_SCALING).
 *
 * 3.5 PHB (editionId 5):
 *   wizard-spells-per-day          → Wizard 27
 *   sorcerer-spells-per-day/known  → Sorcerer 26
 *   divine-spells-per-day          → Cleric 19 + Druid 20
 *   half-caster-spells-per-day     → Paladin 23 + Ranger 24
 *   bard-spells-per-day/known      → Bard 18
 *
 * Unlinks per-level spellcasting-* copies. Does not delete Feature rows
 * (see cleanup-orphan-spellcasting-features.ts) and does not merge chassis
 * (see merge-spellcasting-chassis.ts).
 *
 *   pnpm --filter backend exec tsx scripts/split-shared-spellcasting.ts
 */

import { PrismaClient } from '@shared/prisma-client';
import {
    EntityAppliesToType,
    EntityType,
    FeatureSourceType,
    FormulaId,
} from '@shared/static-data';

const prisma = new PrismaClient();

const BARD_CLASS_ID = 18;
const CLERIC_CLASS_ID = 19;
const DRUID_CLASS_ID = 20;
const PALADIN_CLASS_ID = 23;
const RANGER_CLASS_ID = 24;
const SORCERER_CLASS_ID = 26;
const WIZARD_CLASS_ID = 27;

interface ConditionalColumn {
    spellLevel: number;
    thresholds: number[];
    values: number[];
}

interface SpellTableSpec {
    slug: string;
    name: string;
    description: string;
    appliesTo: number;
    classIds: number[];
    narrativeSlugs: string[];
    columns: ConditionalColumn[];
}

type SlotGrid = Record<number, Record<number, number>>;

/**
 * Collapse a class-level × spell-level grid into CONDITIONAL_SCALING breakpoints.
 */
function columnsFromGrid(grid: SlotGrid): ConditionalColumn[] {
    const spellLevels = new Set<number>();
    for (const row of Object.values(grid)) {
        for (const spellLevel of Object.keys(row)) {
            spellLevels.add(Number(spellLevel));
        }
    }

    const columns: ConditionalColumn[] = [];
    for (const spellLevel of [...spellLevels].sort((a, b) => a - b)) {
        const thresholds: number[] = [];
        const values: number[] = [];
        let last: number | null = null;
        for (let level = 1; level <= 20; level++) {
            const row = grid[level];
            if (!row || !(spellLevel in row)) {
                continue;
            }
            const value = row[spellLevel];
            if (last === null || value !== last) {
                thresholds.push(level);
                values.push(value);
                last = value;
            }
        }
        columns.push({ spellLevel, thresholds, values });
    }
    return columns;
}

const WIZARD_SLOTS = columnsFromGrid({
    1: { 0: 3, 1: 1 },
    2: { 0: 4, 1: 2 },
    3: { 0: 4, 1: 2, 2: 1 },
    4: { 0: 4, 1: 3, 2: 2 },
    5: { 0: 4, 1: 3, 2: 2, 3: 1 },
    6: { 0: 4, 1: 3, 2: 3, 3: 2 },
    7: { 0: 4, 1: 4, 2: 3, 3: 2, 4: 1 },
    8: { 0: 4, 1: 4, 2: 3, 3: 3, 4: 2 },
    9: { 0: 4, 1: 4, 2: 4, 3: 3, 4: 2, 5: 1 },
    10: { 0: 4, 1: 4, 2: 4, 3: 3, 4: 3, 5: 2 },
    11: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 3, 5: 2, 6: 1 },
    12: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 3, 5: 3, 6: 2 },
    13: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 4, 5: 3, 6: 2, 7: 1 },
    14: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 4, 5: 3, 6: 3, 7: 2 },
    15: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 3, 7: 2, 8: 1 },
    16: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 3, 7: 3, 8: 2 },
    17: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4, 7: 3, 8: 2, 9: 1 },
    18: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4, 7: 3, 8: 3, 9: 2 },
    19: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4, 7: 4, 8: 3, 9: 3 },
    20: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, 9: 4 },
});

const SORCERER_SLOTS = columnsFromGrid({
    1: { 0: 5, 1: 3 },
    2: { 0: 6, 1: 4 },
    3: { 0: 6, 1: 5 },
    4: { 0: 6, 1: 6, 2: 3 },
    5: { 0: 6, 1: 6, 2: 4 },
    6: { 0: 6, 1: 6, 2: 5, 3: 3 },
    7: { 0: 6, 1: 6, 2: 6, 3: 4 },
    8: { 0: 6, 1: 6, 2: 6, 3: 5, 4: 3 },
    9: { 0: 6, 1: 6, 2: 6, 3: 6, 4: 4 },
    10: { 0: 6, 1: 6, 2: 6, 3: 6, 4: 5, 5: 3 },
    11: { 0: 6, 1: 6, 2: 6, 3: 6, 4: 6, 5: 4 },
    12: { 0: 6, 1: 6, 2: 6, 3: 6, 4: 6, 5: 5, 6: 3 },
    13: { 0: 6, 1: 6, 2: 6, 3: 6, 4: 6, 5: 6, 6: 4 },
    14: { 0: 6, 1: 6, 2: 6, 3: 6, 4: 6, 5: 6, 6: 5, 7: 3 },
    15: { 0: 6, 1: 6, 2: 6, 3: 6, 4: 6, 5: 6, 6: 6, 7: 4 },
    16: { 0: 6, 1: 6, 2: 6, 3: 6, 4: 6, 5: 6, 6: 6, 7: 5, 8: 3 },
    17: { 0: 6, 1: 6, 2: 6, 3: 6, 4: 6, 5: 6, 6: 6, 7: 6, 8: 4 },
    18: { 0: 6, 1: 6, 2: 6, 3: 6, 4: 6, 5: 6, 6: 6, 7: 6, 8: 5, 9: 3 },
    19: { 0: 6, 1: 6, 2: 6, 3: 6, 4: 6, 5: 6, 6: 6, 7: 6, 8: 6, 9: 4 },
    20: { 0: 6, 1: 6, 2: 6, 3: 6, 4: 6, 5: 6, 6: 6, 7: 6, 8: 6, 9: 6 },
});

const SORCERER_KNOWN = columnsFromGrid({
    1: { 0: 4, 1: 2 },
    2: { 0: 5, 1: 2 },
    3: { 0: 5, 1: 3 },
    4: { 0: 6, 1: 3, 2: 1 },
    5: { 0: 6, 1: 4, 2: 2 },
    6: { 0: 7, 1: 4, 2: 2, 3: 1 },
    7: { 0: 7, 1: 5, 2: 3, 3: 2 },
    8: { 0: 8, 1: 5, 2: 3, 3: 2, 4: 1 },
    9: { 0: 8, 1: 5, 2: 4, 3: 3, 4: 2 },
    10: { 0: 9, 1: 5, 2: 4, 3: 3, 4: 2, 5: 1 },
    11: { 0: 9, 1: 5, 2: 5, 3: 3, 4: 3, 5: 2 },
    12: { 0: 9, 1: 5, 2: 5, 3: 4, 4: 3, 5: 2, 6: 1 },
    13: { 0: 9, 1: 5, 2: 5, 3: 4, 4: 4, 5: 3, 6: 2 },
    14: { 0: 9, 1: 5, 2: 5, 3: 4, 4: 4, 5: 3, 6: 2, 7: 1 },
    15: { 0: 9, 1: 5, 2: 5, 3: 4, 4: 4, 5: 4, 6: 3, 7: 2 },
    16: { 0: 9, 1: 5, 2: 5, 3: 4, 4: 4, 5: 4, 6: 3, 7: 2, 8: 1 },
    17: { 0: 9, 1: 5, 2: 5, 3: 4, 4: 4, 5: 4, 6: 3, 7: 3, 8: 2 },
    18: { 0: 9, 1: 5, 2: 5, 3: 4, 4: 4, 5: 4, 6: 3, 7: 3, 8: 2, 9: 1 },
    19: { 0: 9, 1: 5, 2: 5, 3: 4, 4: 4, 5: 4, 6: 3, 7: 3, 8: 3, 9: 2 },
    20: { 0: 9, 1: 5, 2: 5, 3: 4, 4: 4, 5: 4, 6: 3, 7: 3, 8: 3, 9: 3 },
});

const DIVINE_SLOTS = columnsFromGrid({
    1: { 0: 3, 1: 1 },
    2: { 0: 4, 1: 2 },
    3: { 0: 4, 1: 2, 2: 1 },
    4: { 0: 5, 1: 3, 2: 2 },
    5: { 0: 5, 1: 3, 2: 2, 3: 1 },
    6: { 0: 5, 1: 3, 2: 3, 3: 2 },
    7: { 0: 6, 1: 4, 2: 3, 3: 2, 4: 1 },
    8: { 0: 6, 1: 4, 2: 3, 3: 3, 4: 2 },
    9: { 0: 6, 1: 4, 2: 4, 3: 3, 4: 2, 5: 1 },
    10: { 0: 6, 1: 4, 2: 4, 3: 3, 4: 3, 5: 2 },
    11: { 0: 6, 1: 5, 2: 4, 3: 4, 4: 3, 5: 2, 6: 1 },
    12: { 0: 6, 1: 5, 2: 4, 3: 4, 4: 3, 5: 3, 6: 2 },
    13: { 0: 6, 1: 5, 2: 5, 3: 4, 4: 4, 5: 3, 6: 2, 7: 1 },
    14: { 0: 6, 1: 5, 2: 5, 3: 4, 4: 4, 5: 3, 6: 3, 7: 2 },
    15: { 0: 6, 1: 5, 2: 5, 3: 5, 4: 4, 5: 4, 6: 3, 7: 2, 8: 1 },
    16: { 0: 6, 1: 5, 2: 5, 3: 5, 4: 4, 5: 4, 6: 3, 7: 3, 8: 2 },
    17: { 0: 6, 1: 5, 2: 5, 3: 5, 4: 5, 5: 4, 6: 4, 7: 3, 8: 2, 9: 1 },
    18: { 0: 6, 1: 5, 2: 5, 3: 5, 4: 5, 5: 4, 6: 4, 7: 3, 8: 3, 9: 2 },
    19: { 0: 6, 1: 5, 2: 5, 3: 5, 4: 5, 5: 5, 6: 4, 7: 4, 8: 3, 9: 3 },
    20: { 0: 6, 1: 5, 2: 5, 3: 5, 4: 5, 5: 5, 6: 4, 7: 4, 8: 4, 9: 4 },
});

const HALF_CASTER_SLOTS = columnsFromGrid({
    4: { 1: 0 },
    5: { 1: 0 },
    6: { 1: 1 },
    7: { 1: 1 },
    8: { 1: 1, 2: 0 },
    9: { 1: 1, 2: 0 },
    10: { 1: 1, 2: 1 },
    11: { 1: 1, 2: 1, 3: 0 },
    12: { 1: 1, 2: 1, 3: 1 },
    13: { 1: 1, 2: 1, 3: 1 },
    14: { 1: 2, 2: 1, 3: 1, 4: 0 },
    15: { 1: 2, 2: 1, 3: 1, 4: 1 },
    16: { 1: 2, 2: 2, 3: 1, 4: 1 },
    17: { 1: 2, 2: 2, 3: 2, 4: 1 },
    18: { 1: 3, 2: 2, 3: 2, 4: 1 },
    19: { 1: 3, 2: 3, 3: 3, 4: 2 },
    20: { 1: 3, 2: 3, 3: 3, 4: 3 },
});

const BARD_SLOTS = columnsFromGrid({
    1: { 0: 2 },
    2: { 0: 3, 1: 0 },
    3: { 0: 3, 1: 1 },
    4: { 0: 3, 1: 2, 2: 0 },
    5: { 0: 3, 1: 3, 2: 1 },
    6: { 0: 3, 1: 3, 2: 2 },
    7: { 0: 3, 1: 3, 2: 2, 3: 0 },
    8: { 0: 3, 1: 3, 2: 3, 3: 1 },
    9: { 0: 3, 1: 3, 2: 3, 3: 2 },
    10: { 0: 3, 1: 3, 2: 3, 3: 2, 4: 0 },
    11: { 0: 3, 1: 3, 2: 3, 3: 3, 4: 1 },
    12: { 0: 3, 1: 3, 2: 3, 3: 3, 4: 2 },
    13: { 0: 3, 1: 3, 2: 3, 3: 3, 4: 2, 5: 0 },
    14: { 0: 4, 1: 3, 2: 3, 3: 3, 4: 3, 5: 1 },
    15: { 0: 4, 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
    16: { 0: 4, 1: 4, 2: 4, 3: 3, 4: 3, 5: 2, 6: 0 },
    17: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 3, 5: 3, 6: 1 },
    18: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 4, 5: 3, 6: 2 },
    19: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 3 },
    20: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4 },
});

const BARD_KNOWN = columnsFromGrid({
    1: { 0: 4 },
    2: { 0: 5, 1: 2 },
    3: { 0: 6, 1: 3 },
    4: { 0: 6, 1: 3, 2: 2 },
    5: { 0: 6, 1: 4, 2: 3 },
    6: { 0: 6, 1: 4, 2: 3 },
    7: { 0: 6, 1: 4, 2: 4, 3: 2 },
    8: { 0: 6, 1: 4, 2: 4, 3: 3 },
    9: { 0: 6, 1: 4, 2: 4, 3: 3 },
    10: { 0: 6, 1: 4, 2: 4, 3: 4, 4: 2 },
    11: { 0: 6, 1: 4, 2: 4, 3: 4, 4: 3 },
    12: { 0: 6, 1: 4, 2: 4, 3: 4, 4: 3 },
    13: { 0: 6, 1: 4, 2: 4, 3: 4, 4: 4, 5: 2 },
    14: { 0: 6, 1: 4, 2: 4, 3: 4, 4: 4, 5: 3 },
    15: { 0: 6, 1: 4, 2: 4, 3: 4, 4: 4, 5: 3 },
    16: { 0: 6, 1: 5, 2: 4, 3: 4, 4: 4, 5: 4, 6: 2 },
    17: { 0: 6, 1: 5, 2: 5, 3: 4, 4: 4, 5: 4, 6: 3 },
    18: { 0: 6, 1: 5, 2: 5, 3: 5, 4: 4, 5: 4, 6: 3 },
    19: { 0: 6, 1: 5, 2: 5, 3: 5, 4: 5, 5: 4, 6: 4 },
    20: { 0: 6, 1: 5, 2: 5, 3: 5, 4: 5, 5: 5, 6: 4 },
});

const SPELL_TABLES: SpellTableSpec[] = [
    {
        slug: 'wizard-spells-per-day',
        name: 'Wizard Spells Per Day',
        description: 'Wizard spells-per-day table (PHB 3.5). One CONDITIONAL_SCALING entity per spell level.',
        appliesTo: EntityAppliesToType.SpellcastingProgression,
        classIds: [WIZARD_CLASS_ID],
        narrativeSlugs: ['wizardspells'],
        columns: WIZARD_SLOTS,
    },
    {
        slug: 'sorcerer-spells-per-day',
        name: 'Sorcerer Spells Per Day',
        description: 'Sorcerer spells-per-day table (PHB 3.5). One CONDITIONAL_SCALING entity per spell level.',
        appliesTo: EntityAppliesToType.SpellcastingProgression,
        classIds: [SORCERER_CLASS_ID],
        narrativeSlugs: ['sorcererspells'],
        columns: SORCERER_SLOTS,
    },
    {
        slug: 'sorcerer-spells-known',
        name: 'Sorcerer Spells Known',
        description: 'Sorcerer spells-known table (PHB 3.5). One CONDITIONAL_SCALING entity per spell level.',
        appliesTo: EntityAppliesToType.SpellsKnownProgression,
        classIds: [SORCERER_CLASS_ID],
        narrativeSlugs: ['sorcererspells'],
        columns: SORCERER_KNOWN,
    },
    {
        slug: 'divine-spells-per-day',
        name: 'Divine Spells Per Day',
        description: 'Cleric/Druid spells-per-day table (PHB 3.5, no domain bonus slots).',
        appliesTo: EntityAppliesToType.SpellcastingProgression,
        classIds: [CLERIC_CLASS_ID, DRUID_CLASS_ID],
        narrativeSlugs: ['clericspells', 'druidspells'],
        columns: DIVINE_SLOTS,
    },
    {
        slug: 'half-caster-spells-per-day',
        name: 'Half-Caster Spells Per Day',
        description: 'Paladin/Ranger spells-per-day table (PHB 3.5). 0 means bonus slots only.',
        appliesTo: EntityAppliesToType.SpellcastingProgression,
        classIds: [PALADIN_CLASS_ID, RANGER_CLASS_ID],
        narrativeSlugs: ['paladinspells', 'rangerspells'],
        columns: HALF_CASTER_SLOTS,
    },
    {
        slug: 'bard-spells-per-day',
        name: 'Bard Spells Per Day',
        description: 'Bard spells-per-day table (PHB 3.5). 0 means bonus slots only.',
        appliesTo: EntityAppliesToType.SpellcastingProgression,
        classIds: [BARD_CLASS_ID],
        narrativeSlugs: ['bardspells'],
        columns: BARD_SLOTS,
    },
    {
        slug: 'bard-spells-known',
        name: 'Bard Spells Known',
        description: 'Bard spells-known table (PHB 3.5).',
        appliesTo: EntityAppliesToType.SpellsKnownProgression,
        classIds: [BARD_CLASS_ID],
        narrativeSlugs: ['bardspells'],
        columns: BARD_KNOWN,
    },
];

const COPY_SLUG_PREFIXES = [
    'spellcasting-wizard-',
    'spellcasting-sorcerer-',
    'spellcasting-cleric-',
    'spellcasting-druid-',
    'spellcasting-paladin-',
    'spellcasting-ranger-',
    'spellcasting-bard-',
    'spellcasting-spells-known-bard',
];

/**
 * Join numeric threshold/value arrays to the comma-separated DB format.
 */
function toCsv(values: number[]): string {
    return values.join(',');
}

/**
 * Create or update a FeatureFormulaParams row for a spell-table entity.
 */
async function upsertFormulaParams(
    existingId: number | null,
    thresholds: string,
    values: string
): Promise<number> {
    const payload = {
        formulaId: FormulaId.CONDITIONAL_SCALING,
        formulaStartLevel: 1,
        baseValue: null,
        maxValue: null,
        thresholds,
        values,
        includeProgressionLevel: true,
        featureLevelZero: false,
    };

    if (existingId) {
        await prisma.featureFormulaParams.update({
            where: { id: existingId },
            data: payload,
        });
        return existingId;
    }

    const created = await prisma.featureFormulaParams.create({ data: payload });
    return created.id;
}

/**
 * Create or update one Base entity (and its formula) for a spell level on a table feature.
 */
async function upsertSpellEntity(
    featureId: number,
    appliesTo: number,
    column: ConditionalColumn
): Promise<void> {
    const existing = await prisma.featureEntity.findFirst({
        where: {
            featureId,
            appliesTo,
            appliesToId: column.spellLevel,
        },
        include: { formulaParams: true },
    });

    const formulaParamsId = await upsertFormulaParams(
        existing?.formulaParamsId ?? null,
        toCsv(column.thresholds),
        toCsv(column.values)
    );

    if (existing) {
        await prisma.featureEntity.update({
            where: { id: existing.id },
            data: {
                type: EntityType.Base,
                appliesTo,
                appliesToId: column.spellLevel,
                value: null,
                formulaParamsId,
                displayInDetail: false,
            },
        });
        return;
    }

    await prisma.featureEntity.create({
        data: {
            featureId,
            type: EntityType.Base,
            appliesTo,
            appliesToId: column.spellLevel,
            value: null,
            formulaParamsId,
            groupingId: 0,
            displayInDetail: false,
        },
    });
}

/**
 * Create or reuse a one-table spell feature and write its per-spell-level entities.
 */
async function upsertSpellTable(spec: SpellTableSpec): Promise<number> {
    let feature = await prisma.feature.findUnique({ where: { slug: spec.slug } });

    if (!feature) {
        feature = await prisma.feature.create({
            data: {
                slug: spec.slug,
                name: spec.name,
                description: spec.description,
                displayInCharacterSheet: false,
                sourceType: FeatureSourceType.Class,
                level: 1,
            },
        });
        console.log(`Created feature ${spec.slug} (id ${feature.id}).`);
    } else {
        console.log(`Reusing feature ${spec.slug} (id ${feature.id}).`);
    }

    for (const column of spec.columns) {
        await upsertSpellEntity(feature.id, spec.appliesTo, column);
        console.log(`  Spell level ${column.spellLevel}: CONDITIONAL_SCALING ${column.thresholds.join(',')} → ${column.values.join(',')}.`);
    }

    const variantLinks = spec.narrativeSlugs.length === 0
        ? []
        : await prisma.featureClassMap.findMany({
            where: { feature: { slug: { in: spec.narrativeSlugs } } },
            select: { classId: true },
        });
    const classIds = [...new Set([
        ...spec.classIds,
        ...variantLinks.map((link) => link.classId),
    ])];

    if (classIds.length > 0) {
        await prisma.featureClassMap.createMany({
            data: classIds.map((classId) => ({
                featureId: feature.id,
                classId,
            })),
            skipDuplicates: true,
        });
        console.log(`  Linked ${spec.slug} to class IDs: ${classIds.join(', ')}.`);
    }

    return feature.id;
}

/**
 * Unlink leftover per-level spellcasting copies from all 3.5 PHB casters.
 */
async function unlinkLevelCopies(): Promise<void> {
    const result = await prisma.featureClassMap.deleteMany({
        where: {
            feature: {
                OR: COPY_SLUG_PREFIXES.map((prefix) => ({ slug: { startsWith: prefix } })),
            },
        },
    });
    console.log(`Unlinked ${result.count} leftover per-level spellcasting FeatureClassMap rows.`);
}

async function main(): Promise<void> {
    console.log('Creating shared spell table features (CONDITIONAL_SCALING)...\n');

    for (const spec of SPELL_TABLES) {
        await upsertSpellTable(spec);
        console.log('');
    }

    await unlinkLevelCopies();

    console.log('\nDone. Next: merge-spellcasting-chassis.ts, then cleanup-orphan-spellcasting-features.ts.');
}

main()
    .catch((error: unknown) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
