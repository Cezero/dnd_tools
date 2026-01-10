import type { EntityAppliesToType, EntityType } from '@shared/static-data';

import { calculatorRegistry } from '../calculator-registry';
import { formatterRegistry } from '../formatter-registry';
import { labelerRegistry } from '../labeler-registry';
import type { CalculatedEntity } from '../types';

/**
 * Centralized manager for all registry dependencies
 */
export class RegistryManager {
    /**
     * Get the calculator registry
     */
    getCalculatorRegistry() {
        return calculatorRegistry;
    }

    /**
     * Get the formatter registry
     */
    getFormatterRegistry() {
        return formatterRegistry;
    }

    /**
     * Get the labeler registry
     */
    getLabelerRegistry() {
        return labelerRegistry;
    }

    /**
     * Get the default progression generator
     */
    getDefaultProgressionGenerator() {
        return calculatorRegistry.getDefaultProgressionGenerator();
    }

    /**
     * Get a formula calculator by formula ID
     */
    getFormulaCalculator(formulaId: number) {
        return calculatorRegistry.getFormulaCalculator(formulaId);
    }

    /**
     * Get a formatter by entity type, subtype, and applies to
     */
    getFormatter(entityType: EntityType, appliesTo?: EntityAppliesToType) {
        return formatterRegistry.getFormatter(entityType, appliesTo);
    }

    /**
     * Apply a label using the labeler registry
     */
    applyLabel(formattedValue: string, entity: CalculatedEntity, showLabels: boolean) {
        return labelerRegistry.applyLabel(formattedValue, entity, showLabels);
    }
}
