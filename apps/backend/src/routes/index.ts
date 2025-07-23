import { Router } from 'express';

import { authRoutes } from '../features/auth';
import { characterRoutes } from '../features/character';
import { classRoutes } from '../features/class';
import { diceBoxRoutes } from '../features/diceBox';
import { featRoutes } from '../features/feat';
import { raceRoutes } from '../features/race';
import { referenceTableRoutes } from '../features/referencetables';
import { skillRoutes } from '../features/skill';
import { spellRoutes } from '../features/spell';
import { userProfileRoutes } from '../features/userProfile';
import { itemRoutes } from '../features/item';

const router = Router();

// Register all feature routes
router.use('/auth', authRoutes);
router.use('/characters', characterRoutes);
router.use('/classes', classRoutes);
router.use('/dicebox', diceBoxRoutes);
router.use('/feats', featRoutes);
router.use('/races', raceRoutes);
router.use('/referencetables', referenceTableRoutes);
router.use('/skills', skillRoutes);
router.use('/spells', spellRoutes);
router.use('/user/profile', userProfileRoutes);
router.use('/items', itemRoutes);

export { router as routes }; 
