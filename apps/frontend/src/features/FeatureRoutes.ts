import { routes as spellRoutes, navigation as spellNavigation } from '@/features/spells/components/spellConfig';
import { routes as characterRoutes, navigation as characterNavigation } from '@/features/characters/CharacterConfig';
import { routes as adminRoutes } from '@/features/admin/config/AdminConfig';
import { routes as skillRoutes } from '@/features/admin/features/skillMgmt/SkillConfig';
import { routes as featRoutes } from '@/features/admin/features/featMgmt/FeatConfig';
import { RouteConfig, NavigationItem } from '@/types';

export const FeatureRoutes: RouteConfig[] = [...spellRoutes, ...characterRoutes, ...adminRoutes, ...skillRoutes, ...featRoutes];
export const FeatureNavigation: NavigationItem[] = [characterNavigation, spellNavigation]; 