import { FeatureBonusType } from "@shared/static-data";

/**
 * Format a value with a sign (+ for positive, - for negative)
 */
export function formatSignedValue(value: number): string {
    return value > 0 ? `+${value}` : value.toString();
}

/**
 * Format a base string with bonus type information
 */
export function formatWithBonusType(baseString: string, bonusType?: number | null): string {
    if (bonusType !== null && bonusType !== undefined) {
        const bonusTypeName = Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown';
        return `${baseString} (${bonusTypeName})`;
    }
    return baseString;
}

/**
 * Join strings with commas, filtering out empty strings
 */
export function joinWithCommas(...strings: (string | undefined | null)[]): string {
    return strings.filter(Boolean).join(', ');
}

/**
 * Format language name from language ID
 */
export function formatLanguageName(languageId: number, languageSelectList: Array<{ value: number; label: string }>): string {
    const languageOption = languageSelectList.find(lang => lang.value === languageId);
    return languageOption?.label || `Language ${languageId}`;
}


