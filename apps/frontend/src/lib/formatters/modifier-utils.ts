import type { FeatureWithRelations } from '@shared/schema';
import type { CalculationMethodType } from '@shared/static-data';
import { EntityType } from '@shared/static-data';

import type { BreakdownComponent } from './types';

/**
 * Format a numeric modifier with a leading plus sign for non-negative values.
 * This is the canonical helper for rendering modifiers in the frontend
 * (character sheet, class progression tables, PDF, etc.).
 *
 * Examples:
 * - 3  -> "+3"
 * - 0  -> "+0"
 * - -2 -> "-2"
 */
export function formatSignedModifier(value: number): string {
    return value >= 0 ? `+${value}` : `${value}`;
}

/**
 * Convenience helper for creating a breakdown component that represents
 * a modifier value, using the shared sign-formatting helper.
 *
 * This keeps the representation of signed modifiers DRY between
 * character-sheet style breakdowns and other formatter consumers.
 */
export function createSignedModifierBreakdownComponent(
    value: number,
    source: string,
    type: CalculationMethodType,
    sourceType?: number,
    sourceId?: number
): BreakdownComponent {
    return {
        source,
        value: formatSignedModifier(value),
        type,
        sourceType,
        sourceId
    };
}

/**
 * Determine whether a feature is a pure base-mechanics container.
 *
 * A feature is considered \"base-only\" if it has at least one entity and
 * every entity uses EntityType.Base. Features with no entities, or with
 * at least one non-Base entity, are not treated as base-only.
 */
export function isBaseOnlyFeature(feature: FeatureWithRelations): boolean {
    const entities = feature.entities;

    if (!entities || entities.length === 0) {
        return false;
    }

    return entities.every(entity => entity.type === EntityType.Base);
}

