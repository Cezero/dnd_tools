import { routes as adminRoutes } from '@/features/admin/config/AdminConfig';
import { routes as featRoutes } from '@/features/feat/FeatConfig';
import { routes as skillRoutes } from '@/features/skill/SkillConfig';
import { routes as characterRoutes } from '@/features/character/CharacterConfig';
import { routes as spellRoutes } from '@/features/spell/SpellConfig';
import { routes as classRoutes } from '@/features/class/ClassConfig';
import { routes as raceRoutes } from '@/features/race/RaceConfig';
import { routes as itemRoutes } from '@/features/item/ItemConfig';
import { routes as profileRoutes } from '@/components/profile/ProfileConfig';
import { routes as featureSystemRoutes } from '@/components/feature-system/FeatureConfig';
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
    ...profileRoutes,
    ...featureSystemRoutes,
]; 
