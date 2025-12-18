import type { BreakdownComponent, BreakdownMap } from '../types';

/**
 * Build a formatted breakdown string from breakdown components
 */
export function buildBreakdownString(breakdown: BreakdownMap): string {
    const parts: string[] = [];
    
    for (const [key, component] of Object.entries(breakdown)) {
        if (component.value === 0 && component.sourceType !== 'base') {
            continue; // Skip zero values except base
        }
        
        const formattedValue = component.value >= 0 
            ? `+${component.value}` 
            : `${component.value}`;
        
        if (component.source) {
            parts.push(`${formattedValue} (${component.source})`);
        } else {
            parts.push(formattedValue);
        }
    }
    
    return parts.join(' + ');
}

/**
 * Create a breakdown component
 */
export function createBreakdownComponent(
    value: number,
    source: string | null,
    sourceType: BreakdownComponent['sourceType'],
    sourceId?: number,
    context?: BreakdownComponent['context']
): BreakdownComponent {
    return {
        value,
        source,
        sourceType,
        sourceId,
        context,
    };
}

/**
 * Add breakdown components together
 */
export function addBreakdownComponents(
    ...components: BreakdownComponent[]
): BreakdownComponent {
    const total = components.reduce((sum, comp) => sum + comp.value, 0);
    const sources = components
        .filter(c => c.source)
        .map(c => c.source)
        .join(', ');
    
    return {
        value: total,
        source: sources || null,
        sourceType: components[0]?.sourceType ?? null,
    };
}

