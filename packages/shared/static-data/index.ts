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

// Re-export specific modules for direct access
export * as AbilityData from './src/AbilityData';
export * as SkillData from './src/SkillData';
export * as CommonData from './src/CommonData';
export * as ClassData from './src/ClassData';
export * as SourceData from './src/SourceData';
export * as SpellData from './src/SpellData';
export * as FeatData from './src/FeatData';
export * as ItemData from './src/ItemData';

// Default export for backward compatibility
import * as AbilityDataModule from './src/AbilityData';
import * as SkillDataModule from './src/SkillData';
import * as CommonDataModule from './src/CommonData';
import * as ClassDataModule from './src/ClassData';
import * as SourceDataModule from './src/SourceData';
import * as SpellDataModule from './src/SpellData';
import * as FeatDataModule from './src/FeatData';
import * as ItemDataModule from './src/ItemData';

const staticData = {
    AbilityData: AbilityDataModule,
    SkillData: SkillDataModule,
    CommonData: CommonDataModule,
    ClassData: ClassDataModule,
    SourceData: SourceDataModule,
    SpellData: SpellDataModule,
    FeatData: FeatDataModule,
    ItemData: ItemDataModule,
};

export default staticData; 