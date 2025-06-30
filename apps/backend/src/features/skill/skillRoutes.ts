import express, { RequestHandler } from 'express';

import {
    SkillQuerySchema,
    SkillIdParamSchema,
    CreateSkillSchema,
    UpdateSkillSchema
} from '@shared/schema';

import {
    GetSkills,
    GetAllSkills,
    GetSkillById,
    CreateSkill,
    UpdateSkill,
    DeleteSkill,
} from './skillController.js';
import { requireAdmin } from '../../middleware/authMiddleware.js';
import { validateRequest } from '../../middleware/validateRequest.js';

export const SkillRouter = express.Router();

/**
 * @swagger
 * /api/admin/skills:
 *   get:
 *     summary: Retrieve a list of skills with pagination and filters.
 *     description: Fetches a paginated list of skills. Can be filtered by name, ability score, trained only status, armor check penalty status, edition, and display status.
 *     tags:
 *       - Admin - Skills
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of items per page.
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter skills by name (case-insensitive, partial match).
 *       - in: query
 *         name: abilityId
 *         schema:
 *           type: integer
 *         description: Filter skills by ability ID.
 *       - in: query
 *         name: isTrainedOnly
 *         schema:
 *           type: boolean
 *         description: Filter skills by trained only status.
 *       - in: query
 *         name: hasArmorCheckPenalty
 *         schema:
 *           type: boolean
 *         description: Filter skills by armor check penalty status.
 *       - in: query
 *         name: abbreviation
 *         schema:
 *           type: string
 *         description: Filter skills by abbreviation.
 *     responses:
 *       200:
 *         description: A list of skills.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: The skill ID.
 *                       name:
 *                         type: string
 *                         description: The skill name.
 *                       abilityId:
 *                         type: integer
 *                         description: The ability ID.
 *                       isTrainedOnly:
 *                         type: boolean
 *                         description: Whether the skill is trained only.
 *                       hasArmorCheckPenalty:
 *                         type: boolean
 *                         description: Whether the skill has an armor check penalty.
 *                       description:
 *                         type: string
 *                         description: The description of the skill.
 *                       abbreviation:
 *                         type: string
 *                         description: The abbreviation of the skill.
 *                 totalItems:
 *                   type: integer
 *                   description: The total number of skills.
 *                 totalPages:
 *                   type: integer
 *                   description: The total number of pages.
 *                 currentPage:
 *                   type: integer
 *                   description: The current page number.
 *       500:
 *         description: Server error.
 */
SkillRouter.get('/', validateRequest({ query: SkillQuerySchema }) as RequestHandler, GetSkills as RequestHandler);

/**
 * @swagger
 * /api/admin/skills/all:
 *   get:
 *     summary: Retrieve all skills.
 *     description: Fetches a list of all skills without pagination.
 *     tags:
 *       - Admin - Skills
 *     responses:
 *       200:
 *         description: A list of all skills.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: The skill ID.
 *                   name:
 *                     type: string
 *                     description: The skill name.
 *       500:
 *         description: Server error.
 */
SkillRouter.get('/all', GetAllSkills as RequestHandler);

/**
 * @swagger
 * /api/admin/skills/{id}:
 *   get:
 *     summary: Retrieve a single skill by ID.
 *     description: Fetches a single skill based on its ID.
 *     tags:
 *       - Admin - Skills
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the skill to retrieve.
 *     responses:
 *       200:
 *         description: A single skill.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The skill ID.
 *                 name:
 *                   type: string
 *                   description: The skill name.
 *                 abilityId:
 *                   type: integer
 *                   description: The ability ID.
 *                 isTrainedOnly:
 *                   type: boolean
 *                   description: Whether the skill is trained only.
 *                 hasArmorCheckPenalty:
 *                   type: boolean
 *                   description: Whether the skill has an armor check penalty.
 *                 description:
 *                   type: string
 *                   description: The description of the skill.
 *                 abbreviation:
 *                   type: string
 *                   description: The abbreviation of the skill.
 *                 check:
 *                   type: string
 *                   description: The skill check description.
 *                 action:
 *                   type: string
 *                   description: The skill action description.
 *                 tryAgain:
 *                   type: string
 *                   description: The try again description.
 *                 tryAgainDescription:
 *                   type: string
 *                   description: The try again description.
 *                 special:
 *                   type: string
 *                   description: The special description.
 *                 synergyDescription:
 *                   type: string
 *                   description: The synergy description.
 *                 untrainedDescription:
 *                   type: string
 *                   description: The untrained description.
 *       404:
 *         description: Skill not found.
 *       500:
 *         description: Server error.
 */
SkillRouter.get('/:id', validateRequest({ params: SkillIdParamSchema }) as RequestHandler, GetSkillById as unknown as RequestHandler);

/**
 * @swagger
 * /api/admin/skills:
 *   post:
 *     summary: Create a new skill.
 *     description: Creates a new skill with the provided data. Requires admin authentication.
 *     tags:
 *       - Admin - Skills
 *     security:
 *       - AdminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - abilityId
 *               - isTrainedOnly
 *               - hasArmorCheckPenalty
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the skill.
 *               abilityId:
 *                 type: integer
 *                 description: The ability ID.
 *               isTrainedOnly:
 *                 type: boolean
 *                 description: Whether the skill is trained only.
 *               hasArmorCheckPenalty:
 *                 type: boolean
 *                 description: Whether the skill has an armor check penalty.
 *               description:
 *                 type: string
 *                 description: The description of the skill.
 *               abbreviation:
 *                 type: string
 *                 description: The abbreviation of the skill.
 *               check:
 *                 type: string
 *                 description: The skill check description.
 *               action:
 *                 type: string
 *                 description: The skill action description.
 *               tryAgain:
 *                 type: string
 *                 description: The try again description.
 *               tryAgainDescription:
 *                 type: string
 *                 description: The try again description.
 *               special:
 *                 type: string
 *                 description: The special description.
 *               synergyDescription:
 *                 type: string
 *                 description: The synergy description.
 *               untrainedDescription:
 *                 type: string
 *                 description: The untrained description.
 *     responses:
 *       201:
 *         description: Skill created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The ID of the newly created skill.
 *                 message:
 *                   type: string
 *                   description: Success message.
 *       401:
 *         description: Unauthorized, admin privileges required.
 *       500:
 *         description: Server error.
 */
SkillRouter.post('/', requireAdmin as RequestHandler, validateRequest({ body: CreateSkillSchema }) as RequestHandler, CreateSkill as RequestHandler);

/**
 * @swagger
 * /api/admin/skills/{id}:
 *   put:
 *     summary: Update an existing skill.
 *     description: Updates a skill by its ID. Requires admin authentication.
 *     tags:
 *       - Admin - Skills
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the skill to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the skill.
 *               abilityId:
 *                 type: integer
 *                 description: The ability ID.
 *               isTrainedOnly:
 *                 type: boolean
 *                 description: Whether the skill is trained only.
 *               hasArmorCheckPenalty:
 *                 type: boolean
 *                 description: Whether the skill has an armor check penalty.
 *               description:
 *                 type: string
 *                 description: The description of the skill.
 *               abbreviation:
 *                 type: string
 *                 description: The abbreviation of the skill.
 *               check:
 *                 type: string
 *                 description: The skill check description.
 *               action:
 *                 type: string
 *                 description: The skill action description.
 *               tryAgain:
 *                 type: string
 *                 description: The try again description.
 *               tryAgainDescription:
 *                 type: string
 *                 description: The try again description.
 *               special:
 *                 type: string
 *                 description: The special description.
 *               synergyDescription:
 *                 type: string
 *                 description: The synergy description.
 *               untrainedDescription:
 *                 type: string
 *                 description: The untrained description.
 *     responses:
 *       200:
 *         description: Skill updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message.
 *       401:
 *         description: Unauthorized, admin privileges required.
 *       404:
 *         description: Skill not found.
 *       500:
 *         description: Server error.
 */
SkillRouter.put('/:id', requireAdmin as RequestHandler, validateRequest({ params: SkillIdParamSchema, body: UpdateSkillSchema }) as RequestHandler, UpdateSkill as unknown as RequestHandler);

/**
 * @swagger
 * /api/admin/skills/{id}:
 *   delete:
 *     summary: Delete a skill by ID.
 *     description: Deletes a skill by its ID. Requires admin authentication.
 *     tags:
 *       - Admin - Skills
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the skill to delete.
 *     responses:
 *       200:
 *         description: Skill deleted successfully.
 *       401:
 *         description: Unauthorized, admin privileges required.
 *       404:
 *         description: Skill not found.
 *       500:
 *         description: Server error.
 */
SkillRouter.delete('/:id', requireAdmin as RequestHandler, validateRequest({ params: SkillIdParamSchema }) as RequestHandler, DeleteSkill as unknown as RequestHandler); 