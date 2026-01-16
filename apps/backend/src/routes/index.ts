import { Router } from 'express';

import { authRoutes } from '../features/auth';
import { characterRoutes } from '../features/character';
import { CharacterCalculationRouter } from '../features/characterCalculation/characterCalculationRoutes';
import { CharacterResolutionRouter } from '../features/characterResolution/characterResolutionRoutes';
import { classRoutes } from '../features/class';
import { CompanionRouter } from '../features/companion';
import { DeityRouter } from '../features/deity';
import { diceBoxRoutes } from '../features/diceBox';
import { DomainRouter } from '../features/domain';
import { featRoutes } from '../features/feat';
import { featureRoutes } from '../features/featureSystem';
import { itemRoutes } from '../features/item';
import { monsterRoutes } from '../features/monster';
import { raceRoutes } from '../features/race';
import { referenceTableRoutes } from '../features/referencetables';
import { skillRoutes } from '../features/skill';
import { sourcebookRoutes } from '../features/sourcebook';
import { spellRoutes } from '../features/spell';
import { TransformationFormRouter } from '../features/transformationForm';
import { TrickRouter } from '../features/trick';
import { userProfileRoutes } from '../features/userProfile';

const router = Router();

// Register all feature routes
router.use('/auth', authRoutes);
router.use('/characters', characterRoutes);
router.use('/characters', CharacterResolutionRouter);
router.use('/classes', classRoutes);
router.use('/deities', DeityRouter);
router.use('/domains', DomainRouter);
router.use('/companions', CompanionRouter);
router.use('/tricks', TrickRouter);
router.use('/transformation-forms', TransformationFormRouter);
router.use('/dicebox', diceBoxRoutes);
router.use('/feats', featRoutes);
router.use('/features', featureRoutes);
router.use('/races', raceRoutes);
router.use('/referencetables', referenceTableRoutes);
router.use('/skills', skillRoutes);
router.use('/spells', spellRoutes);
router.use('/sourcebooks', sourcebookRoutes);
router.use('/user/profile', userProfileRoutes);
router.use('/items', itemRoutes);
router.use('/monsters', monsterRoutes);
router.use('/', CharacterCalculationRouter);

export { router as routes }; 
