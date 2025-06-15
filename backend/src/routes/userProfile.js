import express from 'express';
import { getUserProfile, updateUserProfile } from '../controllers/userProfileController.js';

const router = express.Router();

router.get('/', getUserProfile);
router.put('/', updateUserProfile);

export default router;