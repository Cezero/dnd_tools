import React from 'react';

import { EntityAppliesToType, ABILITY_MAP } from '@shared/static-data';

import type { ValueTooltipProps } from './types';

/**
 * ValueTooltip component that displays a tooltip with calculation breakdown
 * when hovering over a calculated value.
 * 
 * The tooltip displays breakdown components in the format:
 * "0 (Ranks) + 3 (WIS)" for skills (ranks always shown, even if zero)
 * "10 (base) + 5 (armor) + 2 (DEX)" for AC (base always shown)
 * "0 (Base) + 1 (CON)" for saves (base always shown, even if zero)
 * 
 * Components are reordered to show base/ranks first, then modifiers.
 * Base/Ranks are always shown (even if zero), but modifiers are only shown if non-zero.
 * Ability names are replaced with abbreviations (e.g., "Dexterity" -> "DEX", "Constitution" -> "CON").
 * The total is omitted since it's already displayed as the value being hovered over.
 */
export function ValueTooltip({ breakdown, children }: ValueTooltipProps): React.JSX.Element {
    if (!breakdown?.components || breakdown.components.length === 0) {
        return <>{children}</>;
    }

    // Separate components into base/ranks (always shown) and modifiers (filter zero)
    const baseComponents: typeof breakdown.components = [];
    const modifierComponents: typeof breakdown.components = [];

    for (const component of breakdown.components) {
        const source = component.source || component.description || '';
        const lowerSource = source.toLowerCase();

        // Check if this is a base component (ranks, base save, or "10" for AC)
        // These should always be shown, even if zero
        if (lowerSource === 'ranks' || lowerSource === 'base save' || source === '10' || lowerSource === 'base') {
            baseComponents.push(component);
        } else {
            // For modifiers, only include non-zero values
            const value = typeof component.value === 'number' ? component.value : parseFloat(String(component.value));
            if (!isNaN(value) && value !== 0) {
                modifierComponents.push(component);
            }
        }
    }

    // Combine: base first (always shown), then modifiers (non-zero only)
    const orderedComponents = [...baseComponents, ...modifierComponents];

    // If there are no components to show, just render children without tooltip
    if (orderedComponents.length === 0) {
        return <>{children}</>;
    }

    // Format the breakdown string
    const breakdownString = orderedComponents
        .map((component, index) => {
            const value = typeof component.value === 'number' ? component.value : parseFloat(String(component.value));
            let displaySource = component.source || component.description || 'unknown';

            // If component has sourceType and sourceId, use them to get the proper display name
            if (component.sourceType === EntityAppliesToType.Ability && component.sourceId) {
                // Use ability abbreviation instead of full name
                displaySource = ABILITY_MAP[component.sourceId]?.abbreviation || displaySource;
            }

            const formattedValue = value > 0 ? `+${value}` : `${value}`;
            return index === 0
                ? `${value} (${displaySource})`
                : ` ${formattedValue} (${displaySource})`;
        })
        .join('');

    return (
        <span
            className="cursor-help"
            title={breakdownString}
        >
            {children}
        </span>
    );
}
