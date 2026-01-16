import type { BreakdownComponent, BreakdownMap, FeatBenefit, FeatureBonus } from '../types';

/**
 * Build a formatted breakdown string from breakdown components.
 * 
 * Processes all components in a breakdown map and formats them as a human-readable string
 * showing how the total value is calculated (e.g., "+2 (Dex modifier) + 1 (Feat: Weapon Focus)").
 * 
 * **Usage:**
 * - Called by calculation functions to generate the `breakdownString` in `CalculationResult`
 * - Used by the formatting system to display calculation details
 * - Automatically skips zero values (except base values)
 * 
 * @param breakdown - The breakdown map to format (must extend BreakdownMap)
 * @returns A formatted string showing all non-zero components
 * 
 * @example
 * ```typescript
 * const breakdown: InitiativeBreakdownMap = {
 *     dexMod: createBreakdownComponent(2, 'Dex modifier', 'ability', AbilityId.Dexterity),
 *     feat: createBreakdownComponent(1, 'Feat: Improved Initiative', 'feat', featId),
 *     feature: createBreakdownComponent(0, null, null),
 *     item: createBreakdownComponent(0, null, null),
 * };
 * const result = buildBreakdownString(breakdown);
 * // Returns: "+2 (Dex modifier) + 1 (Feat: Improved Initiative)"
 * ```
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
 * Create a breakdown component following the standard architecture pattern.
 * 
 * This is the standard way to create breakdown components for calculation functions.
 * All calculation breakdown maps should use this function to create their components,
 * ensuring consistency and type safety.
 * 
 * **Architecture Pattern:**
 * - Always use this function instead of creating breakdown components inline
 * - Returns the standard `BreakdownComponent` type (not custom types)
 * - All calculation breakdown maps must use `BreakdownComponent` for their fields
 * - No type assertions are needed when using this function
 * 
 * @param value - The numeric value of this component
 * @param source - Human-readable source description (e.g., "Dex modifier", "Feat: Weapon Focus")
 * @param sourceType - The type of source (e.g., 'ability', 'feat', 'feature', 'item')
 * @param sourceId - Optional ID of the source entity (e.g., ability ID, feat ID)
 * @param context - Optional context information (e.g., itemId, weaponType, abilityId)
 * @returns A BreakdownComponent following the standard structure
 * 
 * @example
 * ```typescript
 * const dexMod = createBreakdownComponent(
 *     2,
 *     'Dex modifier',
 *     'ability',
 *     AbilityId.Dexterity
 * );
 * ```
 * 
 * @see {@link BreakdownComponent} for the component structure
 * @see {@link BreakdownMap} for how components are used in breakdown maps
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
 * Create a breakdown component for feat bonuses.
 * 
 * Standardizes the creation of feat breakdown components across all calculation functions.
 * Automatically formats the source string with feat names and handles zero values.
 * 
 * @param featBonus - The total feat bonus value
 * @param featBenefits - Array of feat benefits that contributed to this bonus
 * @returns A BreakdownComponent for the feat bonus
 * 
 * @example
 * ```typescript
 * const { featBonus, featBenefits } = resolveStandardBonuses(...);
 * feat: createFeatBreakdownComponent(featBonus, featBenefits),
 * ```
 */
export function createFeatBreakdownComponent(
    featBonus: number,
    featBenefits: FeatBenefit[]
): BreakdownComponent {
    return createBreakdownComponent(
        featBonus,
        featBonus > 0 ? `Feat: ${featBenefits.map(b => b.source.name).join(', ')}` : null,
        featBonus > 0 ? 'feat' : null,
        featBenefits[0]?.source.id
    );
}

/**
 * Create a breakdown component for feature bonuses.
 * 
 * Standardizes the creation of feature breakdown components across all calculation functions.
 * Automatically formats the source string with feature names and handles zero values.
 * 
 * @param featureBonus - The total feature bonus value
 * @param featureBonuses - Array of feature bonuses that contributed to this bonus
 * @returns A BreakdownComponent for the feature bonus
 * 
 * @example
 * ```typescript
 * const { featureBonus, featureBonuses } = resolveStandardBonuses(...);
 * feature: createFeatureBreakdownComponent(featureBonus, featureBonuses),
 * ```
 */
export function createFeatureBreakdownComponent(
    featureBonus: number,
    featureBonuses: FeatureBonus[]
): BreakdownComponent {
    return createBreakdownComponent(
        featureBonus,
        featureBonus > 0 ? `Feature: ${featureBonuses.map(b => b.source.name).join(', ')}` : null,
        featureBonus > 0 ? 'feature' : null,
        featureBonuses[0]?.source.id
    );
}

/**
 * Create a breakdown component for item bonuses.
 * 
 * Standardizes the creation of item breakdown components across all calculation functions.
 * Handles zero values and optional item source strings.
 * 
 * @param itemBonus - The total item bonus value
 * @param itemSource - Optional source string describing the item (e.g., "armor: 123")
 * @returns A BreakdownComponent for the item bonus
 * 
 * @example
 * ```typescript
 * item: createItemBreakdownComponent(itemBonus, itemSource),
 * ```
 */
export function createItemBreakdownComponent(
    itemBonus: number,
    itemSource?: string | null
): BreakdownComponent {
    return createBreakdownComponent(
        itemBonus,
        itemBonus > 0 ? (itemSource ?? 'item') : null,
        itemBonus > 0 ? 'item' : null
    );
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

