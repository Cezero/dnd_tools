import { buildValidatedRouter } from '@/lib/buildValidatedRouter';
import { requireAuth, requireAdmin } from '@/middleware/authMiddleware';
import {
    CreateDiceBoxAdminConfigRequestSchema,
    UpdateDiceBoxAdminConfigRequestSchema,
    DiceBoxConfigIdParamSchema
} from '@shared/schema';
import { DiceBoxController } from './diceBoxController';

const { router: DiceBoxRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

// Public routes (no authentication required)
get('/config', {}, DiceBoxController.getFullConfig);

// User routes (require authentication)
get('/configs/available', requireAuth, {}, DiceBoxController.getAvailableConfigs);
get('/config/user', requireAuth, {}, DiceBoxController.getUserDiceConfig);
put('/config/user', requireAuth, {}, DiceBoxController.updateUserDiceConfig);

// Admin routes (require authentication and admin privileges)
get('/admin/config', requireAuth, requireAdmin, {}, DiceBoxController.getAdminConfig);
post('/admin/config', requireAuth, requireAdmin, { body: CreateDiceBoxAdminConfigRequestSchema }, DiceBoxController.createOrUpdateAdminConfig);
put('/admin/config', requireAuth, requireAdmin, { body: UpdateDiceBoxAdminConfigRequestSchema }, DiceBoxController.createOrUpdateAdminConfig);
deleteRoute('/admin/config/:id', requireAuth, requireAdmin, { params: DiceBoxConfigIdParamSchema }, DiceBoxController.deleteAdminConfig);

export { DiceBoxRouter }; 
