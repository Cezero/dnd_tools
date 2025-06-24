import express from 'express';
import {
    getSkills,
    getAllSkills,
    getSkillById,
    createSkill,
    updateSkill,
    deleteSkill,
} from '../controllers/skillsController.js';
import { requireAdmin } from '../../../middleware/requireAdmin.js';

const router = express.Router();

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
 *         name: skill_name
 *         schema:
 *           type: string
 *         description: Filter skills by name (case-insensitive, partial match).
 *       - in: query
 *         name: ability_id
 *         schema:
 *           type: integer
 *         description: Filter skills by ability ID.
 *       - in: query
 *         name: trained_only
 *         schema:
 *           type: boolean
 *         description: Filter skills by trained only status.
 *       - in: query
 *         name: skill_armor_check_penalty
 *         schema:
 *           type: boolean
 *         description: Filter skills by armor check penalty status.
 *       - in: query
 *         name: edition_id
 *         schema:
 *           type: integer
 *         description: Filter skills by edition ID.
 *       - in: query
 *         name: display
 *         schema:
 *           type: boolean
 *         description: Filter skills by display status.
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
 *                       skill_id:
 *                         type: integer
 *                         description: The skill ID.
 *                       skill_name:
 *                         type: string
 *                         description: The skill name.
 *                       ability_id:
 *                         type: integer
 *                         description: The ability ID.
 *                       trained_only:
 *                         type: boolean
 *                         description: Whether the skill is trained only.
 *                       skill_armor_check_penalty:
 *                         type: boolean
 *                         description: Whether the skill has an armor check penalty.
 *                       edition_id:
 *                         type: integer
 *                         description: The edition ID.
 *                       display:
 *                         type: boolean
 *                         description: Whether the skill is displayed.
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
router.get('/', getSkills);

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
 *                   skill_id:
 *                     type: integer
 *                     description: The skill ID.
 *                   skill_name:
 *                     type: string
 *                     description: The skill name.
 *       500:
 *         description: Server error.
 */
router.get('/all', getAllSkills);

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
 *                 skill_id:
 *                   type: integer
 *                   description: The skill ID.
 *                 skill_name:
 *                   type: string
 *                   description: The skill name.
 *                 ability_id:
 *                   type: integer
 *                   description: The ability ID.
 *                 trained_only:
 *                   type: boolean
 *                   description: Whether the skill is trained only.
 *                 skill_armor_check_penalty:
 *                   type: boolean
 *                   description: Whether the skill has an armor check penalty.
 *                 edition_id:
 *                   type: integer
 *                   description: The edition ID.
 *                 display:
 *                   type: boolean
 *                   description: Whether the skill is displayed.
 *                 skill_description:
 *                   type: string
 *                   description: The description of the skill.
 *       404:
 *         description: Skill not found.
 *       500:
 *         description: Server error.
 */
router.get('/:id', getSkillById);

/**
 * @swagger
 * /api/admin/skills:
 *   post:
 *     summary: Create a new skill.
 *     description: Adds a new skill to the database. Requires admin authentication.
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
 *               - skill_name
 *               - ability_id
 *               - trained_only
 *               - skill_armor_check_penalty
 *             properties:
 *               skill_name:
 *                 type: string
 *                 description: The name of the skill.
 *               ability_id:
 *                 type: integer
 *                 description: The ID of the primary ability score for the skill.
 *               trained_only:
 *                 type: boolean
 *                 description: Indicates if the skill can only be used if trained.
 *               skill_armor_check_penalty:
 *                 type: boolean
 *                 description: Indicates if the skill incurs an armor check penalty.
 *               skill_description:
 *                 type: string
 *                 description: Full description of the skill (Markdown supported).
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
router.post('/', requireAdmin, createSkill);

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
 *               skill_name:
 *                 type: string
 *                 description: The name of the skill.
 *               ability_id:
 *                 type: integer
 *                 description: The ID of the primary ability score for the skill.
 *               trained_only:
 *                 type: boolean
 *                 description: Indicates if the skill can only be used if trained.
 *               skill_armor_check_penalty:
 *                 type: boolean
 *                 description: Indicates if the skill incurs an armor check penalty.
 *               skill_description:
 *                 type: string
 *                 description: Full description of the skill (Markdown supported).
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
router.put('/:id', requireAdmin, updateSkill);

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
router.delete('/:id', requireAdmin, deleteSkill);

export default router; 