import { SOURCE_BOOK_MAP, SOURCE_BOOK_FILTER_MAP, SOURCE_BOOK_SETTING_MAP, SourceType, Setting, EditionId } from '@shared/static-data';
import { isEditionCompatible } from './EditionUtils';

interface SourceReference {
    sourceBookId: number;
    pageNumber?: number;
}

/**
 * Get source books by type with optional edition filtering
 */
export function GetSourceBookTypeList(sourceType: SourceType, editionId?: EditionId) {
    if (editionId) {
        return SOURCE_BOOK_FILTER_MAP[sourceType].map(sb => SOURCE_BOOK_MAP[sb]).filter(book => isEditionCompatible(book.editionId, editionId, book.isVisible !== false));
    } else {
        return SOURCE_BOOK_FILTER_MAP[sourceType].map(sb => SOURCE_BOOK_MAP[sb]);
    }
}

/**
 * Get character options source books for an edition
 */
export function GetCharacterOptionsSourceBookList(editionId: EditionId) {
    const SOURCE_BOOKS_WITH_CHARACTER_OPTIONS = [...new Set([
        SourceType.Classes,
        SourceType.Spells,
        SourceType.Races,
        SourceType.Domains,
        SourceType.Deities
    ].flatMap(sourceType => SOURCE_BOOK_FILTER_MAP[sourceType]))];

    return SOURCE_BOOKS_WITH_CHARACTER_OPTIONS.map(sb => SOURCE_BOOK_MAP[sb]).filter(book => isEditionCompatible(book.editionId, editionId, book.isVisible !== false));
}

/**
 * Get source books by setting with optional edition filtering
 */
export function GetSourceBookSettingList(setting: Setting, editionId?: EditionId) {
    if (editionId) {
        return SOURCE_BOOK_SETTING_MAP[setting].map(sb => SOURCE_BOOK_MAP[sb]).filter(book => isEditionCompatible(book.editionId, editionId, book.isVisible !== false));
    } else {
        return SOURCE_BOOK_SETTING_MAP[setting].map(sb => SOURCE_BOOK_MAP[sb]);
    }
}

/**
 * Get formatted source display string
 */
export function GetSourceDisplay(sources: SourceReference[], useAbbrev: boolean = false): string {
    if (!sources || sources.length === 0) return '';

    return sources.map(source => {
        const book = SOURCE_BOOK_MAP[source.sourceBookId];
        if (book) {
            const displayTitle = useAbbrev ? book.abbreviation : book.name;
            return source.pageNumber ? `${displayTitle} (pg ${source.pageNumber})` : displayTitle;
        }
        return 'Unknown Source';
    }).join(', ');
}
