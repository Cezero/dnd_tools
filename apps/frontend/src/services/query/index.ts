export { createQueryHooks } from './QueryHooksFactory';
export { CacheQueryHooks } from './CacheQueryHooks';
// Feature-specific query hooks have been moved to their respective feature folders:
// - ClassQueryHooks → features/class/ClassQueryHooks
// - RaceQueryHooks → features/race/RaceQueryHooks
// - CharacterQueryHooks → features/character/CharacterQueryHooks
// - FeatureQueryHooks → components/feature-system/FeatureQueryHooks
// - FeatQueryHooks → features/feat/FeatQueryHooks
// - SpellQueryHooks → features/spell/SpellQueryHooks
// - DomainQueryHooks → features/domain/DomainQueryHooks
// - CompanionQueryHooks → features/companion/CompanionQueryHooks
// - ItemQueryHooks → features/item/ItemQueryHooks
// Remaining query hooks (SkillQueryHooks, MonsterQueryHooks, TrickQueryHooks, DeityQueryHooks)
// should be moved to their respective feature folders when those features are reorganized.
