import { routes as spellRoutes, navigation as spellNavigation } from '@/features/spells/config/spellConfig';
import { routes as characterRoutes, navigation as characterNavigation } from '@/features/characters/config/characterConfig';
import { routes as adminRoutes } from '@/features/admin/config/adminConfig';
import { routes as skillRoutes } from '@/features/admin/features/skillMgmt/config/skillConfig';
import { routes as featRoutes } from '@/features/admin/features/featMgmt/config/featConfig';

export const featureRoutes = [...spellRoutes, ...characterRoutes, ...adminRoutes, ...skillRoutes, ...featRoutes];
export const featureNavigation = [characterNavigation, spellNavigation]; 