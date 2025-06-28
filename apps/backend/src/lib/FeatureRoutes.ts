import { Router } from 'express';
import { CharacterRouter } from '../features/characters/routes/CharacterRoutes.js';
import { ClassRouter } from '../features/classes/routes/ClassRoutes.js';
import { FeatRouter } from '../features/feats/routes/FeatRoutes.js';
import { RaceRouter } from '../features/races/routes/RaceRoutes.js';
import { ReferenceTableRouter } from '../features/referencetables/routes/ReferenceTableRoutes.js';
import { SkillRouter } from '../features/skills/routes/SkillRoutes.js';
import { SpellRouter } from '../features/spells/routes/SpellRoutes.js';

interface FeatureRoute {
    path: string;
    router: Router;
}

export const featureRoutes: FeatureRoute[] = [
    { path: '/api/characters', router: CharacterRouter },
    { path: '/api/classes', router: ClassRouter },
    { path: '/api/feats', router: FeatRouter },
    { path: '/api/races', router: RaceRouter },
    { path: '/api/referencetables', router: ReferenceTableRouter },
    { path: '/api/skills', router: SkillRouter },
    { path: '/api/spells', router: SpellRouter },
]; 