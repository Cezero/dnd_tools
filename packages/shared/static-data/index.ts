// shared-data index.ts

// Export all data modules explicitly
export * from './src/types';
export * from './src/AbilityData';
export * from './src/SkillData';
export * from './src/CommonData';
export * from './src/ClassData';
export * from './src/SourceData';
export * from './src/SpellData';
export * from './src/FeatData';
export * from './src/ItemData';
export * from './src/FeatureData';
export * from './src/FormatterData';
export * from './src/FormulaDefinitions';
export * from './src/GenericList';
export * from './src/DeityData';

// Export DiceData with explicit names to avoid conflicts
export * from './src/DiceData';

// Re-export specific modules for direct access
export * as AbilityData from './src/AbilityData';
export * as SkillData from './src/SkillData';
export * as CommonData from './src/CommonData';
export * as ClassData from './src/ClassData';
export * as SourceData from './src/SourceData';
export * as SpellData from './src/SpellData';
export * as FeatData from './src/FeatData';
export * as ItemData from './src/ItemData';
export * as DiceData from './src/DiceData';
export * as FeatureData from './src/FeatureData';
export * as FormatterData from './src/FormatterData';
export * as FormulaDefinitions from './src/FormulaDefinitions';
export * as DeityData from './src/DeityData';
export * as AttackDefinitionData from './src/AttackDefinitionData';
