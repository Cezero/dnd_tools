import { routes as spellRoutes, navigation as spellNavigation } from '@/features/spells/config/spellConfig';
import { routes as characterRoutes, navigation as characterNavigation } from '@/features/characters/config/characterConfig';
import { routes as adminRoutes } from '@/features/admin/config/adminConfig';
import { routes as skillRoutes } from '@/features/admin/features/skillMgmt/config/skillConfig';

export const featureRoutes = [...spellRoutes, ...characterRoutes, ...adminRoutes, ...skillRoutes];
export const featureNavigation = [characterNavigation, spellNavigation]; 