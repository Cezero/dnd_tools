import type { ElementContent } from 'hast';
import { h } from 'hastscript';

import { extractDiceType } from '@/lib/DiceUtils';
import { formatDiceDisplay } from '@/lib/Formatters';
import { getPreRenderedTable } from '@/lib/TableResolution';
import { MarkdownComponentProps, MarkdownProcessingOptions } from '@/plugins/types';
import { SPELL_NAME_MAP, CLASS_NAME_MAP } from '@shared/static-data';

import { embedReactComponent } from './embedReactComponent';


const entityTypes = {
    spell: SPELL_NAME_MAP,
    class: CLASS_NAME_MAP,
};

// Individual directive processing functions
export function createEntityLink(type: string, rawValue: string): ElementContent {
    const entityType = type.toLowerCase() as keyof typeof entityTypes;
    const id = entityTypes[entityType]?.[rawValue];
    const href = id ? `/${entityType}s/${id}` : undefined;
    return h('a', {
        href,
        className: 'entity-link',
    }, rawValue);
}

export function createDiceButton(rawValue: string): ElementContent {
    const diceType = extractDiceType(rawValue);
    return h('span', { className: 'dice-notation-container inline-flex items-center' }, [
        { type: 'text', value: `${rawValue} ` },
        embedReactComponent('dicebutton', {
            diceType,
            className: 'h-6 w-6 inline-block align-middle',
            'data-dice': rawValue,
            rollNotation: rawValue,
        })
    ]);
}

export function createVariable(rawValue: string, props: MarkdownComponentProps): ElementContent {
    const value = props.userVars?.[rawValue];
    return { type: 'text', value: value !== undefined ? String(value) : `[var: ${rawValue}]` };
}

export function createTable(rawValue: string, props: MarkdownComponentProps, options: MarkdownProcessingOptions): ElementContent {
    if (!options.enableTables) {
        return { type: 'text', value: `[table: ${rawValue}]` };
    }

    try {
        const hastTable = getPreRenderedTable(rawValue, props.id);
        if (hastTable) {
            return hastTable;
        } else {
            return h('div', { className: 'reference-table-error' }, `[Missing table: ${rawValue}]`);
        }
    } catch (error) {
        // If the error indicates preloading is still in progress, show a loading state
        if (error instanceof Error && error.message.includes('preloading still in progress')) {
            return h('div', { className: 'reference-table-loading' }, `[Loading table: ${rawValue}]`);
        }

        // For other errors, show the error message
        return h('div', { className: 'reference-table-error' }, `[Error loading table: ${rawValue}]`);
    }
}

// Directive processor map
export const directiveProcessors: Record<string, (rawValue: string, props: MarkdownComponentProps, options: MarkdownProcessingOptions) => ElementContent> = {
    spell: (rawValue, props, options) => createEntityLink('spell', rawValue),
    class: (rawValue, props, options) => createEntityLink('class', rawValue),
    dice: (rawValue, props, options) => createDiceButton(rawValue),
    var: (rawValue, props, options) => createVariable(rawValue, props),
    table: (rawValue, props, options) => createTable(rawValue, props, options),
}; 
