import { FormulaId } from '@shared/static-data';

import {
    FormulaCalculatorImpl,
} from './calculators';
import {
    ProgressionGeneratorImpl,
    TransitionDetectorImpl
} from './progression-generators';
import type {
    FormulaCalculator,
    ProgressionGenerator,
    TransitionDetector,
    ConditionalValueDetector,
    IChoiceCalculator,
} from './types';
import { CalculatorType, ProgressionGeneratorType, TransitionDetectorType } from './types';

// Unified calculator registry interface
interface ICalculatorRegistry {
    // Core unified methods
    registerCalculator(
        calculatorType: CalculatorType,
        typeId: number,
        calculator: FormulaCalculator | IChoiceCalculator | ProgressionGenerator | TransitionDetector | ConditionalValueDetector
    ): void;

    getCalculator(
        calculatorType: CalculatorType,
        typeId: number
    ): FormulaCalculator | IChoiceCalculator | ProgressionGenerator | TransitionDetector | ConditionalValueDetector | undefined;
}

/**
 * Registry for managing all calculation components
 * Follows the same pattern as FormatterRegistry with hierarchical keys
 */
export class CalculatorRegistry implements ICalculatorRegistry {
    // Use hierarchical keys: `${calculatorType}:${typeId}`
    private calculators = new Map<string, FormulaCalculator | IChoiceCalculator | ProgressionGenerator | TransitionDetector | ConditionalValueDetector>();

    constructor() {
        this.initializeDefaultCalculators();
    }

    // Core unified registration method
    registerCalculator(
        calculatorType: CalculatorType,
        typeId: number,
        calculator: FormulaCalculator | IChoiceCalculator | ProgressionGenerator | TransitionDetector | ConditionalValueDetector
    ): void {
        const key = this.generateKey(calculatorType, typeId);
        this.calculators.set(key, calculator);
    }

    // Core unified getter method
    getCalculator(
        calculatorType: CalculatorType,
        typeId: number
    ): FormulaCalculator | IChoiceCalculator | ProgressionGenerator | TransitionDetector | ConditionalValueDetector | undefined {
        const key = this.generateKey(calculatorType, typeId);
        return this.calculators.get(key);
    }

    // Convenience wrapper methods for common registration patterns

    // Formula calculator convenience wrappers
    registerFormulaCalculator(formulaType: FormulaId, calculator: FormulaCalculator): void {
        this.registerCalculator(CalculatorType.Formula, formulaType, calculator);
    }

    registerChoiceCalculator(choiceType: number, calculator: IChoiceCalculator): void {
        this.registerCalculator(CalculatorType.Choice, choiceType, calculator);
    }

    registerProgressionGenerator(progressionType: number, generator: ProgressionGenerator): void {
        this.registerCalculator(CalculatorType.Progression, progressionType, generator);
    }

    registerTransitionDetector(transitionType: number, detector: TransitionDetector): void {
        this.registerCalculator(CalculatorType.Transition, transitionType, detector);
    }

    registerConditionalValueDetector(conditionType: number, detector: ConditionalValueDetector): void {
        this.registerCalculator(CalculatorType.Conditional, conditionType, detector);
    }

    // Convenience getter methods
    getFormulaCalculator(formulaType: FormulaId): FormulaCalculator | undefined {
        return this.getCalculator(CalculatorType.Formula, formulaType) as FormulaCalculator | undefined;
    }

    getChoiceCalculator(choiceType: number): IChoiceCalculator | undefined {
        return this.getCalculator(CalculatorType.Choice, choiceType) as IChoiceCalculator | undefined;
    }

    getProgressionGenerator(progressionType: number): ProgressionGenerator | undefined {
        return this.getCalculator(CalculatorType.Progression, progressionType) as ProgressionGenerator | undefined;
    }

    getDefaultProgressionGenerator(): ProgressionGenerator | undefined {
        return this.getProgressionGenerator(ProgressionGeneratorType.default);
    }

    getTransitionDetector(transitionType: number): TransitionDetector | undefined {
        return this.getCalculator(CalculatorType.Transition, transitionType) as TransitionDetector | undefined;
    }

    getDefaultTransitionDetector(): TransitionDetector | undefined {
        return this.getTransitionDetector(TransitionDetectorType.default);
    }

    getConditionalValueDetector(conditionType: number): ConditionalValueDetector | undefined {
        return this.getCalculator(CalculatorType.Conditional, conditionType) as ConditionalValueDetector | undefined;
    }

    // Generate hierarchical key for calculator storage
    private generateKey(calculatorType: CalculatorType, typeId: number): string {
        return `${calculatorType}:${typeId}`;
    }

    private initializeDefaultCalculators(): void {
        // Create calculator instances
        const formulaCalculator = new FormulaCalculatorImpl();
        const progressionGenerator = new ProgressionGeneratorImpl();
        const transitionDetector = new TransitionDetectorImpl();

        // Register default calculators for all formula types
        this.registerFormulaCalculator(FormulaId.LINEAR_SCALING, formulaCalculator);
        this.registerFormulaCalculator(FormulaId.EVERY_N_LEVELS, formulaCalculator);
        this.registerFormulaCalculator(FormulaId.CONDITIONAL_SCALING, formulaCalculator);
        this.registerFormulaCalculator(FormulaId.DICE_SCALING, formulaCalculator);
        this.registerFormulaCalculator(FormulaId.ABILITY_BASED, formulaCalculator);
        this.registerFormulaCalculator(FormulaId.ABILITY_MODIFIER, formulaCalculator);
        this.registerFormulaCalculator(FormulaId.LEVEL_TIMES_ABILITY, formulaCalculator);
        this.registerFormulaCalculator(FormulaId.LEVEL_TIMES_VALUE, formulaCalculator);
        this.registerFormulaCalculator(FormulaId.VALUE_PLUS_LEVEL, formulaCalculator);
        this.registerFormulaCalculator(FormulaId.LEVEL_PLUS_ABILITY, formulaCalculator);

        // Register progression generators and transition detectors
        this.registerProgressionGenerator(ProgressionGeneratorType.default, progressionGenerator); // Default progression generator
        this.registerTransitionDetector(TransitionDetectorType.default, transitionDetector); // Default transition detector
    }
}

// Export a singleton instance
export const calculatorRegistry = new CalculatorRegistry();
