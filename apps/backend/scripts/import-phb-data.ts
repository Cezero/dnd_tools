#!/usr/bin/env ts-node

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { PrismaClient } from '@shared/prisma-client/client';
import { EDITION_IDS, Pantheon, SOURCE_BOOK_MAP, ALIGNMENT_LIST, CLASS_MAP } from '@shared/static-data';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration constants
const PHB_SOURCE_BOOK_ID = 45; // 3.5e Player's Handbook
const EDITION_ID = EDITION_IDS.DND_3_5E; // 3.5e
const GREYHAWK_PANTHEON_ID = Pantheon.Greyhawk; // 1

// Initialize Prisma client
const prisma = new PrismaClient();

// Types for CSV data
interface DomainCSVRow {
    domain: string;
    deities: string;
    ds1: string;
    ds2: string;
    ds3: string;
    ds4: string;
    ds5: string;
    ds6: string;
    ds7: string;
    ds8: string;
    ds9: string;
    pageNumber: string;
}

interface DeityCSVRow {
    deity: string;
    title: string;
    alignment: string;
    domains: string;
    typicalWorshipers: string;
    pageNumber: string;
}

// Function to find alignment by name using ALIGNMENT_LIST
function findAlignmentByName(alignmentText: string): number | null {
    const normalizedText = alignmentText.toLowerCase().trim();

    // Special case: "neutral" maps to "true neutral"
    if (normalizedText === 'neutral') {
        const trueNeutral = ALIGNMENT_LIST.find(a =>
            a.name.toLowerCase() === 'true neutral'
        );
        return trueNeutral ? trueNeutral.id : null;
    }

    const alignment = ALIGNMENT_LIST.find(a =>
        a.name.toLowerCase() === normalizedText
    );

    return alignment ? alignment.id : null;
}

// Logging utilities
class ImportLogger {
    private logs: string[] = [];
    private errors: string[] = [];
    private warnings: string[] = [];

    log(message: string): void {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
        this.logs.push(logMessage);
    }

    error(message: string): void {
        const timestamp = new Date().toISOString();
        const errorMessage = `[${timestamp}] ERROR: ${message}`;
        console.error(errorMessage);
        this.errors.push(errorMessage);
    }

    warn(message: string): void {
        const timestamp = new Date().toISOString();
        const warnMessage = `[${timestamp}] WARNING: ${message}`;
        console.warn(warnMessage);
        this.warnings.push(warnMessage);
    }

    getSummary(): { logs: string[]; errors: string[]; warnings: string[] } {
        return {
            logs: this.logs,
            errors: this.errors,
            warnings: this.warnings,
        };
    }
}

const logger = new ImportLogger();

// Utility functions
function parseCSV<T>(filePath: string, headers: string[]): T[] {
    try {
        const content = readFileSync(filePath, 'utf-8');
        const lines = content.trim().split('\n');

        if (lines.length < 2) {
            throw new Error('CSV file must have at least a header and one data row');
        }

        const _headerLine = lines[0];
        const dataLines = lines.slice(1).filter(line => line.trim() !== '');

        const results: T[] = [];

        for (const line of dataLines) {
            const values = line.split('|').map(val => val.trim());
            if (values.length !== headers.length) {
                logger.warn(`Skipping malformed line: ${line}`);
                continue;
            }

            const row: Record<string, string> = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });

            results.push(row as T);
        }

        return results;
    } catch (error) {
        logger.error(`Failed to parse CSV file ${filePath}: ${error}`);
        throw error;
    }
}

function normalizeName(name: string): string {
    return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

function findRaceByName(name: string, races: Array<{ id: number; name: string }>): { id: number; name: string } | null {
    const normalizedName = normalizeName(name);

    // Direct match
    let race = races.find(r => normalizeName(r.name) === normalizedName);
    if (race) return race;

    // Handle common variations
    const variations: Record<string, string[]> = {
        'half-elf': ['half elf', 'halfelf'],
        'half-orc': ['half orc', 'halforc'],
    };

    for (const [standard, variants] of Object.entries(variations)) {
        if (variants.includes(normalizedName)) {
            race = races.find(r => normalizeName(r.name) === standard);
            if (race) return race;
        }
    }

    return null;
}

function findClassByName(name: string): { id: number; name: string } | null {
    const normalizedName = normalizeName(name);

    // Find class in static data for the correct edition
    const staticClass = Object.values(CLASS_MAP).find(c =>
        normalizeName(c.name) === normalizedName && c.editionId === EDITION_ID
    );

    if (staticClass) {
        return { id: staticClass.id, name: staticClass.name };
    }

    return null;
}

async function findSpellByName(name: string): Promise<{ id: number; name: string } | null> {
    try {
        const spell = await prisma.spell.findFirst({
            where: {
                name: {
                    equals: name,
                },
                editionId: EDITION_ID,
            },
        });
        return spell;
    } catch (error) {
        logger.warn(`Error finding spell "${name}": ${error}`);
        return null;
    }
}

// Main import functions
async function importDomains(): Promise<void> {
    logger.log('Starting domain import...');

    const csvPath = join(__dirname, 'phb_domains.csv');
    const headers = ['domain', 'deities', 'ds1', 'ds2', 'ds3', 'ds4', 'ds5', 'ds6', 'ds7', 'ds8', 'ds9', 'pageNumber'];

    const domainRows = parseCSV<DomainCSVRow>(csvPath, headers);
    logger.log(`Parsed ${domainRows.length} domain rows from CSV`);

    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const row of domainRows) {
        try {
            // Check if domain already exists
            const existingDomain = await prisma.domain.findFirst({
                where: {
                    name: row.domain,
                    editionId: EDITION_ID,
                },
            });

            if (existingDomain) {
                logger.log(`Skipping existing domain: ${row.domain}`);
                skippedCount++;
                continue;
            }

            // Create domain
            const domain = await prisma.domain.create({
                data: {
                    name: row.domain,
                    editionId: EDITION_ID,
                },
            });

            logger.log(`Created domain: ${row.domain} (ID: ${domain.id})`);

            // Add source book reference
            await prisma.domainSourceMap.create({
                data: {
                    domainId: domain.id,
                    sourceBookId: PHB_SOURCE_BOOK_ID,
                    pageNumber: parseInt(row.pageNumber),
                },
            });

            // Process domain spells (DS1-DS9)
            const spellLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const spellNames = [row.ds1, row.ds2, row.ds3, row.ds4, row.ds5, row.ds6, row.ds7, row.ds8, row.ds9];

            for (let i = 0; i < spellLevels.length; i++) {
                const spellName = spellNames[i];
                if (!spellName || spellName.trim() === '') continue;

                const spell = await findSpellByName(spellName);
                if (spell) {
                    await prisma.domainSpell.create({
                        data: {
                            domainId: domain.id,
                            spellId: spell.id,
                            spellLevel: spellLevels[i],
                        },
                    });
                    logger.log(`  Added domain spell: ${spellName} (Level ${spellLevels[i]})`);
                } else {
                    logger.warn(`  Could not find spell: ${spellName} for domain ${row.domain}`);
                }
            }

            importedCount++;
        } catch (error) {
            logger.error(`Failed to import domain ${row.domain}: ${error}`);
            errorCount++;
        }
    }

    logger.log(`Domain import complete: ${importedCount} imported, ${skippedCount} skipped, ${errorCount} errors`);
}

async function importDeities(): Promise<void> {
    logger.log('Starting deity import...');

    const csvPath = join(__dirname, 'phb_deities.csv');
    const headers = ['deity', 'title', 'alignment', 'domains', 'typicalWorshipers', 'pageNumber'];

    const deityRows = parseCSV<DeityCSVRow>(csvPath, headers);
    logger.log(`Parsed ${deityRows.length} deity rows from CSV`);

    // Get existing races for 3.5e (classes are handled via static data)
    const races = await prisma.race.findMany({
        where: { editionId: EDITION_ID },
    });

    logger.log(`Found ${races.length} races for 3.5e`);

    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const row of deityRows) {
        try {
            // Check if deity already exists
            const existingDeity = await prisma.deity.findFirst({
                where: {
                    name: row.deity,
                    editionId: EDITION_ID,
                },
            });

            if (existingDeity) {
                logger.log(`Skipping existing deity: ${row.deity}`);
                skippedCount++;
                continue;
            }

            // Map alignment
            const alignmentId = findAlignmentByName(row.alignment);
            if (alignmentId === null) {
                logger.error(`Unknown alignment for ${row.deity}: ${row.alignment}`);
                errorCount++;
                continue;
            }

            // Create deity
            const deity = await prisma.deity.create({
                data: {
                    name: row.deity,
                    title: row.title || null,
                    alignmentId: alignmentId,
                    editionId: EDITION_ID,
                    pantheonId: GREYHAWK_PANTHEON_ID,
                },
            });

            logger.log(`Created deity: ${row.deity} (ID: ${deity.id})`);

            // Add source book reference
            await prisma.deitySourceMap.create({
                data: {
                    deityId: deity.id,
                    sourceBookId: PHB_SOURCE_BOOK_ID,
                    pageNumber: parseInt(row.pageNumber),
                },
            });

            // Process domains
            const domainNames = row.domains.split(',').map(d => d.trim());
            for (const domainName of domainNames) {
                const domain = await prisma.domain.findFirst({
                    where: {
                        name: domainName,
                        editionId: EDITION_ID,
                    },
                });

                if (domain) {
                    await prisma.deityDomain.create({
                        data: {
                            deityId: deity.id,
                            domainId: domain.id,
                        },
                    });
                    logger.log(`  Linked domain: ${domainName}`);
                } else {
                    logger.warn(`  Could not find domain: ${domainName} for deity ${row.deity}`);
                }
            }

            // Process typical worshipers
            const worshiperNames = row.typicalWorshipers.split(',').map(w => w.trim());
            for (const worshiperName of worshiperNames) {
                // Try to find as race first
                let race = findRaceByName(worshiperName, races);
                if (race) {
                    await prisma.deityRaceMap.create({
                        data: {
                            deityId: deity.id,
                            raceId: race.id,
                        },
                    });
                    logger.log(`  Linked race: ${worshiperName}`);
                    continue;
                }

                // Try to find as class using static data
                let cls = findClassByName(worshiperName);
                if (cls) {
                    await prisma.deityClassMap.create({
                        data: {
                            deityId: deity.id,
                            classId: cls.id,
                        },
                    });
                    logger.log(`  Linked class: ${worshiperName}`);
                    continue;
                }

                // If neither found, log warning
                logger.warn(`  Could not resolve worshiper: ${worshiperName} for deity ${row.deity}`);
            }

            importedCount++;
        } catch (error) {
            logger.error(`Failed to import deity ${row.deity}: ${error}`);
            errorCount++;
        }
    }

    logger.log(`Deity import complete: ${importedCount} imported, ${skippedCount} skipped, ${errorCount} errors`);
}

// Main execution function
async function main(): Promise<void> {
    try {
        logger.log('Starting PHB domain and deity import...');
        logger.log(`Using source book ID: ${PHB_SOURCE_BOOK_ID} (3.5e PHB)`);
        logger.log(`Using edition ID: ${EDITION_ID} (3.5e)`);
        logger.log(`Using pantheon ID: ${GREYHAWK_PANTHEON_ID} (Greyhawk)`);

        // Verify source book exists and has correct flags
        const sourceBookData = SOURCE_BOOK_MAP[PHB_SOURCE_BOOK_ID];
        if (!sourceBookData) {
            throw new Error(`Source book with ID ${PHB_SOURCE_BOOK_ID} not found in static data`);
        }

        const sourceBook = await prisma.sourceBook.findUnique({
            where: { id: PHB_SOURCE_BOOK_ID },
        });

        if (!sourceBook) {
            throw new Error(`Source book with ID ${PHB_SOURCE_BOOK_ID} not found in database`);
        }

        if (!sourceBookData.hasDomains || !sourceBookData.hasDeities) {
            logger.warn(`Source book ${sourceBookData.name} does not have hasDomains or hasDeities set to true in static data`);
        }

        logger.log(`Verified source book: ${sourceBookData.name} (${sourceBookData.abbreviation})`);

        // Import domains first
        await importDomains();

        // Import deities second (depends on domains)
        await importDeities();

        logger.log('PHB import completed successfully!');

        // Print summary
        const summary = logger.getSummary();
        console.log('\n=== IMPORT SUMMARY ===');
        console.log(`Total logs: ${summary.logs.length}`);
        console.log(`Total warnings: ${summary.warnings.length}`);
        console.log(`Total errors: ${summary.errors.length}`);

        if (summary.errors.length > 0) {
            console.log('\n=== ERRORS ===');
            summary.errors.forEach(error => console.log(error));
        }

        if (summary.warnings.length > 0) {
            console.log('\n=== WARNINGS ===');
            summary.warnings.forEach(warning => console.log(warning));
        }

    } catch (error) {
        logger.error(`Fatal error during import: ${error}`);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch((error) => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}

export { main as importPHBData };
