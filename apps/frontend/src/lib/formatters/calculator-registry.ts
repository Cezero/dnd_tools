import { FormulaId } from '@shared/static-data';

import {
    FormulaCalculatorImpl,
    ChoiceCalculatorImpl,
    ConditionalValueDetectorImpl
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

// Unified calculator registry interface
interface ICalculatorRegistry {
    // Core unified methods
    registerCalculator(
        calculatorType: 'formula' | 'choice' | 'progression' | 'transition' | 'conditional',
        typeId: number,
        calculator: FormulaCalculator | IChoiceCalculator | ProgressionGenerator | TransitionDetector | ConditionalValueDetector
    ): void;

    getCalculator(
        calculatorType: 'formula' | 'choice' | 'progression' | 'transition' | 'conditional',
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
        calculatorType: 'formula' | 'choice' | 'progression' | 'transition' | 'conditional',
        typeId: number,
        calculator: FormulaCalculator | IChoiceCalculator | ProgressionGenerator | TransitionDetector | ConditionalValueDetector
    ): void {
        const key = this.generateKey(calculatorType, typeId);
        this.calculators.set(key, calculator);
    }

    // Core unified getter method
    getCalculator(
        calculatorType: 'formula' | 'choice' | 'progression' | 'transition' | 'conditional',
        typeId: number
    ): FormulaCalculator | IChoiceCalculator | ProgressionGenerator | TransitionDetector | ConditionalValueDetector | undefined {
        const key = this.generateKey(calculatorType, typeId);
        return this.calculators.get(key);
    }

    // Convenience wrapper methods for common registration patterns

    // Formula calculator convenience wrappers
    registerFormulaCalculator(formulaType: FormulaId, calculator: FormulaCalculator): void {
        this.registerCalculator('formula', formulaType, calculator);
    }

    registerChoiceCalculator(choiceType: number, calculator: IChoiceCalculator): void {
        this.registerCalculator('choice', choiceType, calculator);
    }

    registerProgressionGenerator(progressionType: number, generator: ProgressionGenerator): void {
        this.registerCalculator('progression', progressionType, generator);
    }

    registerTransitionDetector(transitionType: number, detector: TransitionDetector): void {
        this.registerCalculator('transition', transitionType, detector);
    }

    registerConditionalValueDetector(conditionType: number, detector: ConditionalValueDetector): void {
        this.registerCalculator('conditional', conditionType, detector);
    }

    // Convenience getter methods
    getFormulaCalculator(formulaType: FormulaId): FormulaCalculator | undefined {
        return this.getCalculator('formula', formulaType) as FormulaCalculator | undefined;
    }

    getChoiceCalculator(choiceType: number): IChoiceCalculator | undefined {
        return this.getCalculator('choice', choiceType) as IChoiceCalculator | undefined;
    }

    getProgressionGenerator(progressionType: number): ProgressionGenerator | undefined {
        return this.getCalculator('progression', progressionType) as ProgressionGenerator | undefined;
    }

    getTransitionDetector(transitionType: number): TransitionDetector | undefined {
        return this.getCalculator('transition', transitionType) as TransitionDetector | undefined;
    }

    getConditionalValueDetector(conditionType: number): ConditionalValueDetector | undefined {
        return this.getCalculator('conditional', conditionType) as ConditionalValueDetector | undefined;
    }

    // Generate hierarchical key for calculator storage
    private generateKey(calculatorType: string, typeId: number): string {
        return `${calculatorType}:${typeId}`;
    }

    // Legacy methods for backward compatibility during transition
    getDefaultFormulaCalculator(): FormulaCalculator {
        // This will be removed after all callers are updated
        console.warn('Using legacy getDefaultFormulaCalculator method. Please update to use getFormulaCalculator with specific formula type.');
        return this.getFormulaCalculator(FormulaId.LINEAR_SCALING) || new FormulaCalculatorImpl();
    }

    getDefaultChoiceCalculator(): IChoiceCalculator {
        // This will be removed after all callers are updated
        console.warn('Using legacy getDefaultChoiceCalculator method. Please update to use getChoiceCalculator with specific choice type.');
        return this.getChoiceCalculator(0) || new ChoiceCalculatorImpl();
    }

    getDefaultProgressionGenerator(): ProgressionGenerator {
        // This will be removed after all callers are updated
        console.warn('Using legacy getDefaultProgressionGenerator method. Please update to use getProgressionGenerator with specific progression type.');
        return this.getProgressionGenerator(0) || new ProgressionGeneratorImpl();
    }

    getDefaultTransitionDetector(): TransitionDetector {
        // This will be removed after all callers are updated
        console.warn('Using legacy getDefaultTransitionDetector method. Please update to use getTransitionDetector with specific transition type.');
        return this.getTransitionDetector(0) || new TransitionDetectorImpl();
    }

    getDefaultConditionalValueDetector(): ConditionalValueDetector {
        // This will be removed after all callers are updated
        console.warn('Using legacy getDefaultConditionalValueDetector method. Please update to use getConditionalValueDetector with specific condition type.');
        return this.getConditionalValueDetector(0) || new ConditionalValueDetectorImpl();
    }

    private initializeDefaultCalculators(): void {
        // Create calculator instances
        const formulaCalculator = new FormulaCalculatorImpl();
        const choiceCalculator = new ChoiceCalculatorImpl();
        const progressionGenerator = new ProgressionGeneratorImpl();
        const transitionDetector = new TransitionDetectorImpl();
        const conditionalValueDetector = new ConditionalValueDetectorImpl();

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

        // Register default choice calculator
        this.registerChoiceCalculator(0, choiceCalculator); // Default choice type

        // Register default progression generator
        this.registerProgressionGenerator(0, progressionGenerator); // Default progression type

        // Register default transition detector
        this.registerTransitionDetector(0, transitionDetector); // Default transition type

        // Register default conditional value detector
        this.registerConditionalValueDetector(0, conditionalValueDetector); // Default condition type
    }
}

// Export a singleton instance
export const calculatorRegistry = new CalculatorRegistry();
