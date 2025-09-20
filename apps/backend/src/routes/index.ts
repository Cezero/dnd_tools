import { Router } from 'express';

import { authRoutes } from '../features/auth';
import { characterRoutes } from '../features/character';
import { CharacterCalculationRouter } from '../features/characterCalculation/characterCalculationRoutes';
import { classRoutes } from '../features/class';
import { VariantClassRouter } from '../features/class/variantClassRoutes';
import { DeityRouter } from '../features/deity';
import { diceBoxRoutes } from '../features/diceBox';
import { DomainRouter } from '../features/domain';
import { featRoutes } from '../features/feat';
import { featureRoutes } from '../features/featureSystem';
import { itemRoutes } from '../features/item';
import { raceRoutes } from '../features/race';
import { referenceTableRoutes } from '../features/referencetables';
import { skillRoutes } from '../features/skill';
import { spellRoutes } from '../features/spell';
import { userProfileRoutes } from '../features/userProfile';

const router = Router();

// Register all feature routes
router.use('/auth', authRoutes);
router.use('/characters', characterRoutes);
router.use('/classes', classRoutes);
router.use('/classes', VariantClassRouter);
router.use('/deities', DeityRouter);
router.use('/domains', DomainRouter);
router.use('/dicebox', diceBoxRoutes);
router.use('/feats', featRoutes);
router.use('/features', featureRoutes);
router.use('/races', raceRoutes);
router.use('/referencetables', referenceTableRoutes);
router.use('/skills', skillRoutes);
router.use('/spells', spellRoutes);
router.use('/user/profile', userProfileRoutes);
router.use('/items', itemRoutes);
router.use('/', CharacterCalculationRouter);

export { router as routes }; 
