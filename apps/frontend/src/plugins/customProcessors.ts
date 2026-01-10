import type { ElementContent } from 'hast';
import { h } from 'hastscript';

import { extractDiceType } from '@/lib/DiceUtils';
import { getPreRenderedTable } from '@/lib/TableResolution';
import { MarkdownComponentProps, MarkdownProcessingOptions } from '@/plugins/types';
import {
    getMonsterIdByName,
    getSpellIdByName,
    getFeatIdByName,
    getItemIdByName,
    getClassIdByName,
    getRaceIdByName,
    getDomainIdByName,
    getDeityIdByName,
} from '@/services/cache';


import { embedReactComponent } from './embedReactComponent';

// Individual directive processing functions
export function createEntityLink(type: string, rawValue: string, options?: MarkdownProcessingOptions): ElementContent {
    const entityType = type.toLowerCase();
    let id: number | undefined;

    // Use cache-based lookup (functions use centralized accessor internally)
    switch (entityType) {
        case 'monster':
            id = getMonsterIdByName(rawValue);
            break;
        case 'spell':
            id = getSpellIdByName(rawValue);
            break;
        case 'feat':
            id = getFeatIdByName(rawValue);
            break;
        case 'item':
            id = getItemIdByName(rawValue);
            break;
        case 'class':
            id = getClassIdByName(rawValue);
            break;
        case 'race':
            id = getRaceIdByName(rawValue);
            break;
        case 'domain':
            id = getDomainIdByName(rawValue);
            break;
        case 'deity':
            id = getDeityIdByName(rawValue);
            break;
        default:
            // Unknown entity type, id remains undefined
            break;
    }

    const href = id ? `/${entityType}s/${id}` : undefined;
    const props: Record<string, string> = {
        className: 'entity-link',
    };

    // Add href if available
    if (href) {
        props.href = href;
    }

    // Add data attributes for entity tooltip support
    if (id && href) {
        props['data-entity-type'] = entityType;
        props['data-entity-id'] = String(id);
    }

    return h('a', props, rawValue);
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
    spell: (rawValue, _props, options) => createEntityLink('spell', rawValue, options),
    monster: (rawValue, _props, options) => createEntityLink('monster', rawValue, options),
    feat: (rawValue, _props, options) => createEntityLink('feat', rawValue, options),
    item: (rawValue, _props, options) => createEntityLink('item', rawValue, options),
    class: (rawValue, _props, options) => createEntityLink('class', rawValue, options),
    race: (rawValue, _props, options) => createEntityLink('race', rawValue, options),
    domain: (rawValue, _props, options) => createEntityLink('domain', rawValue, options),
    deity: (rawValue, _props, options) => createEntityLink('deity', rawValue, options),
    dice: (rawValue, _props, _options) => createDiceButton(rawValue),
    var: (rawValue, props, _options) => createVariable(rawValue, props),
    table: (rawValue, props, options) => createTable(rawValue, props, options),
}; 
