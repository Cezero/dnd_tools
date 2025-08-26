import { routes as profileRoutes } from '@/components/profile/ProfileConfig';
import { routes as adminRoutes } from '@/features/admin/config/AdminConfig';
import { routes as featureSystemRoutes } from '@/features/admin/features/feature-system/FeatureConfig';
import { routes as characterRoutes } from '@/features/character/CharacterConfig';
import { routes as classRoutes } from '@/features/class/ClassConfig';
import { routes as featRoutes } from '@/features/feat/FeatConfig';
import { routes as itemRoutes } from '@/features/item/ItemConfig';
import { routes as raceRoutes } from '@/features/race/RaceConfig';
import { routes as skillRoutes } from '@/features/skill/SkillConfig';
import { routes as spellRoutes } from '@/features/spell/SpellConfig';
import { RouteConfig } from '@/types';

export const FeatureRoutes: RouteConfig[] = [
    ...spellRoutes,
    ...characterRoutes,
    ...adminRoutes,
    ...skillRoutes,
    ...featRoutes,
    ...classRoutes,
    ...raceRoutes,
    ...itemRoutes,
    ...featureSystemRoutes,
    ...profileRoutes,
]; 
