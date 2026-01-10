import { fileURLToPath } from 'url';
import { PrismaClient } from '@shared/prisma-client';
import { SOURCE_BOOK_FILTER_MAP, SOURCE_BOOK_SETTING_MAP, SourceType, Setting } from '@shared/static-data';

const __filename = fileURLToPath(import.meta.url);

const prisma = new PrismaClient();

interface MigrationReport {
    sourceBooksProcessed: number;
    sourceBooksUpdated: number;
    errors: string[];
}

/**
 * Migration script to populate SourceBook settingId and hasX flags from static data
 * 
 * This script:
 * 1. Reads SOURCE_BOOK_FILTER_MAP to determine which books have which content types
 * 2. Reads SOURCE_BOOK_SETTING_MAP to determine which books belong to which settings
 * 3. Updates all SourceBook records with:
 *    - hasClasses: true if book is in SourceType.Classes array
 *    - hasSpells: true if book is in SourceType.Spells array
 *    - hasRaces: true if book is in SourceType.Races array
 *    - hasDomains: true if book is in SourceType.Domains array
 *    - hasDeities: true if book is in SourceType.Deities array
 *    - hasItems: true if book is in SourceType.Items array
 *    - settingId: Setting enum value if book is in SOURCE_BOOK_SETTING_MAP
 * 
 * Run this script AFTER pushing the Prisma schema changes that add these fields.
 */
async function migrateSourceBookFlags(): Promise<MigrationReport> {
    const report: MigrationReport = {
        sourceBooksProcessed: 0,
        sourceBooksUpdated: 0,
        errors: [],
    };

    try {
        console.log('Starting SourceBook flags migration...');

        // Build maps from the static data
        const hasClassesMap = new Set<number>();
        const hasSpellsMap = new Set<number>();
        const hasRacesMap = new Set<number>();
        const hasDomainsMap = new Set<number>();
        const hasDeitiesMap = new Set<number>();
        const hasItemsMap = new Set<number>();
        const settingIdMap = new Map<number, number>(); // sourceBookId -> settingId

        // Populate hasX maps from SOURCE_BOOK_FILTER_MAP
        if (SOURCE_BOOK_FILTER_MAP[SourceType.Classes]) {
            SOURCE_BOOK_FILTER_MAP[SourceType.Classes].forEach(bookId => hasClassesMap.add(bookId));
        }
        if (SOURCE_BOOK_FILTER_MAP[SourceType.Spells]) {
            SOURCE_BOOK_FILTER_MAP[SourceType.Spells].forEach(bookId => hasSpellsMap.add(bookId));
        }
        if (SOURCE_BOOK_FILTER_MAP[SourceType.Races]) {
            SOURCE_BOOK_FILTER_MAP[SourceType.Races].forEach(bookId => hasRacesMap.add(bookId));
        }
        if (SOURCE_BOOK_FILTER_MAP[SourceType.Domains]) {
            SOURCE_BOOK_FILTER_MAP[SourceType.Domains].forEach(bookId => hasDomainsMap.add(bookId));
        }
        if (SOURCE_BOOK_FILTER_MAP[SourceType.Deities]) {
            SOURCE_BOOK_FILTER_MAP[SourceType.Deities].forEach(bookId => hasDeitiesMap.add(bookId));
        }
        if (SOURCE_BOOK_FILTER_MAP[SourceType.Items]) {
            SOURCE_BOOK_FILTER_MAP[SourceType.Items].forEach(bookId => hasItemsMap.add(bookId));
        }

        // Populate settingId map from SOURCE_BOOK_SETTING_MAP
        // Note: Setting enum values are numeric, so we can use them directly as settingId
        Object.entries(SOURCE_BOOK_SETTING_MAP).forEach(([settingKey, bookIds]) => {
            const settingId = Number(settingKey);
            if (!isNaN(settingId) && Array.isArray(bookIds)) {
                bookIds.forEach(bookId => {
                    // If a book appears in multiple settings, use the last one (shouldn't happen, but handle it)
                    settingIdMap.set(bookId, settingId);
                });
            }
        });

        console.log(`Built maps:`);
        console.log(`  hasClasses: ${hasClassesMap.size} books`);
        console.log(`  hasSpells: ${hasSpellsMap.size} books`);
        console.log(`  hasRaces: ${hasRacesMap.size} books`);
        console.log(`  hasDomains: ${hasDomainsMap.size} books`);
        console.log(`  hasDeities: ${hasDeitiesMap.size} books`);
        console.log(`  hasItems: ${hasItemsMap.size} books`);
        console.log(`  settingId: ${settingIdMap.size} books`);

        // Get all source books
        const sourceBooks = await prisma.sourceBook.findMany({
            orderBy: { id: 'asc' },
        });

        console.log(`\nFound ${sourceBooks.length} source books to process`);

        // Update each source book
        for (const sourceBook of sourceBooks) {
            try {
                const hasClasses = hasClassesMap.has(sourceBook.id);
                const hasSpells = hasSpellsMap.has(sourceBook.id);
                const hasRaces = hasRacesMap.has(sourceBook.id);
                const hasDomains = hasDomainsMap.has(sourceBook.id);
                const hasDeities = hasDeitiesMap.has(sourceBook.id);
                const hasItems = hasItemsMap.has(sourceBook.id);
                const settingId = settingIdMap.get(sourceBook.id) ?? null;

                // Check if update is needed
                const needsUpdate =
                    sourceBook.hasClasses !== hasClasses ||
                    sourceBook.hasSpells !== hasSpells ||
                    sourceBook.hasRaces !== hasRaces ||
                    sourceBook.hasDomains !== hasDomains ||
                    sourceBook.hasDeities !== hasDeities ||
                    sourceBook.hasItems !== hasItems ||
                    sourceBook.settingId !== settingId;

                if (needsUpdate) {
                    await prisma.sourceBook.update({
                        where: { id: sourceBook.id },
                        data: {
                            hasClasses,
                            hasSpells,
                            hasRaces,
                            hasDomains,
                            hasDeities,
                            hasItems,
                            settingId,
                        },
                    });

                    report.sourceBooksUpdated++;
                    console.log(`Updated source book ${sourceBook.id} (${sourceBook.name})`);
                }

                report.sourceBooksProcessed++;
            } catch (error) {
                const errorMsg = `Error updating source book ${sourceBook.id}: ${error instanceof Error ? error.message : String(error)}`;
                report.errors.push(errorMsg);
                console.error(errorMsg);
            }
        }

        // Validation
        console.log('\nValidating migration...');

        const totalSourceBooks = await prisma.sourceBook.count();
        const booksWithClasses = await prisma.sourceBook.count({ where: { hasClasses: true } });
        const booksWithSpells = await prisma.sourceBook.count({ where: { hasSpells: true } });
        const booksWithRaces = await prisma.sourceBook.count({ where: { hasRaces: true } });
        const booksWithDomains = await prisma.sourceBook.count({ where: { hasDomains: true } });
        const booksWithDeities = await prisma.sourceBook.count({ where: { hasDeities: true } });
        const booksWithItems = await prisma.sourceBook.count({ where: { hasItems: true } });
        const booksWithSetting = await prisma.sourceBook.count({ where: { settingId: { not: null } } });

        console.log(`\nMigration Summary:`);
        console.log(`  Source books processed: ${report.sourceBooksProcessed}`);
        console.log(`  Source books updated: ${report.sourceBooksUpdated}`);
        console.log(`\nValidation:`);
        console.log(`  Total source books: ${totalSourceBooks}`);
        console.log(`  Books with classes: ${booksWithClasses} (expected: ${hasClassesMap.size})`);
        console.log(`  Books with spells: ${booksWithSpells} (expected: ${hasSpellsMap.size})`);
        console.log(`  Books with races: ${booksWithRaces} (expected: ${hasRacesMap.size})`);
        console.log(`  Books with domains: ${booksWithDomains} (expected: ${hasDomainsMap.size})`);
        console.log(`  Books with deities: ${booksWithDeities} (expected: ${hasDeitiesMap.size})`);
        console.log(`  Books with items: ${booksWithItems} (expected: ${hasItemsMap.size})`);
        console.log(`  Books with setting: ${booksWithSetting} (expected: ${settingIdMap.size})`);

        if (report.errors.length > 0) {
            console.error(`\nErrors encountered: ${report.errors.length}`);
            report.errors.forEach((error) => console.error(`  - ${error}`));
        } else {
            console.log('\n✓ Migration completed successfully!');
        }

        return report;
    } catch (error) {
        const errorMsg = `Fatal error during migration: ${error instanceof Error ? error.message : String(error)}`;
        report.errors.push(errorMsg);
        console.error(errorMsg);
        throw error;
    }
}

// Run migration if executed directly
if (process.argv[1] && __filename === process.argv[1]) {
    migrateSourceBookFlags()
        .then((report) => {
            if (report.errors.length > 0) {
                process.exit(1);
            } else {
                process.exit(0);
            }
        })
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        })
        .finally(() => {
            prisma.$disconnect();
        });
}

export { migrateSourceBookFlags };
