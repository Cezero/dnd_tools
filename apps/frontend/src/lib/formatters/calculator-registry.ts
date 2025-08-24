import type {
    FormulaCalculator,
    ProgressionGenerator,
    TransitionDetector,
    ConditionalValueDetector
} from './interfaces';
import {
    formulaCalculator,
    choiceCalculator,
    conditionalValueDetector
} from './calculators';
import {
    progressionGenerator,
    transitionDetector
} from './progression-generators';

/**
 * Registry for managing all calculation components
 */
export class CalculatorRegistry {
    private formulaCalculators = new Map<number, FormulaCalculator>();
    private choiceCalculators = new Map<number, any>(); // Will be properly typed when we have choice calculation interfaces
    private progressionGenerators = new Map<number, ProgressionGenerator>();
    private transitionDetectors = new Map<number, TransitionDetector>();
    private conditionalValueDetectors = new Map<number, ConditionalValueDetector>();

    constructor() {
        this.initializeDefaultCalculators();
    }

    /**
     * Get the default formula calculator
     */
    getFormulaCalculator(): FormulaCalculator {
        return formulaCalculator;
    }

    /**
     * Get the default choice calculator
     */
    getChoiceCalculator(): any { // Will be properly typed when we have choice calculation interfaces
        return choiceCalculator;
    }

    /**
     * Get the default progression generator
     */
    getProgressionGenerator(): ProgressionGenerator {
        return progressionGenerator;
    }

    /**
     * Get the default transition detector
     */
    getTransitionDetector(): TransitionDetector {
        return transitionDetector;
    }

    /**
     * Get the default conditional value detector
     */
    getConditionalValueDetector(): ConditionalValueDetector {
        return conditionalValueDetector;
    }

    /**
     * Register a formula calculator for a specific formula type
     */
    registerFormulaCalculator(formulaType: number, calculator: FormulaCalculator): void {
        this.formulaCalculators.set(formulaType, calculator);
    }

    /**
     * Register a choice calculator for a specific choice type
     */
    registerChoiceCalculator(choiceType: number, calculator: any): void { // Will be properly typed when we have choice calculation interfaces
        this.choiceCalculators.set(choiceType, calculator);
    }

    /**
     * Register a progression generator for a specific progression type
     */
    registerProgressionGenerator(progressionType: number, generator: ProgressionGenerator): void {
        this.progressionGenerators.set(progressionType, generator);
    }

    /**
     * Register a transition detector for a specific transition type
     */
    registerTransitionDetector(transitionType: number, detector: TransitionDetector): void {
        this.transitionDetectors.set(transitionType, detector);
    }

    /**
     * Register a conditional value detector for a specific condition type
     */
    registerConditionalValueDetector(conditionType: number, detector: ConditionalValueDetector): void {
        this.conditionalValueDetectors.set(conditionType, detector);
    }

    /**
     * Get a formula calculator for a specific formula type
     */
    getFormulaCalculatorForType(formulaType: number): FormulaCalculator | undefined {
        return this.formulaCalculators.get(formulaType) || formulaCalculator;
    }

    /**
     * Get a choice calculator for a specific choice type
     */
    getChoiceCalculatorForType(choiceType: number): any | undefined { // Will be properly typed when we have choice calculation interfaces
        return this.choiceCalculators.get(choiceType) || choiceCalculator;
    }

    /**
     * Get a progression generator for a specific progression type
     */
    getProgressionGeneratorForType(progressionType: number): ProgressionGenerator | undefined {
        return this.progressionGenerators.get(progressionType) || progressionGenerator;
    }

    /**
     * Get a transition detector for a specific transition type
     */
    getTransitionDetectorForType(transitionType: number): TransitionDetector | undefined {
        return this.transitionDetectors.get(transitionType) || transitionDetector;
    }

    /**
     * Get a conditional value detector for a specific condition type
     */
    getConditionalValueDetectorForType(conditionType: number): ConditionalValueDetector | undefined {
        return this.conditionalValueDetectors.get(conditionType) || conditionalValueDetector;
    }

    private initializeDefaultCalculators(): void {
        // For now, we're using the default calculators for all types
        // In the future, we can register specific calculators for different formula/choice types
        // This allows for extensibility and customization
    }
}

// Export a singleton instance
export const calculatorRegistry = new CalculatorRegistry();
