import { routes as adminRoutes } from '@/features/admin/config/AdminConfig';
import { routes as featRoutes } from '@/features/admin/features/feat-management/FeatConfig';
import { routes as skillRoutes } from '@/features/admin/features/skill-management/SkillConfig';
import { routes as characterRoutes, navigation as characterNavigation } from '@/features/character/CharacterConfig';
import { routes as spellRoutes, navigation as spellNavigation } from '@/features/spell/SpellConfig';
import { RouteConfig, NavigationItem } from '@/types';

export const FeatureRoutes: RouteConfig[] = [...spellRoutes, ...characterRoutes, ...adminRoutes, ...skillRoutes, ...featRoutes];
export const FeatureNavigation: NavigationItem[] = [characterNavigation, spellNavigation]; 