import express, { RequestHandler } from 'express';
import {
    GetClasses,
    GetAllClasses,
    GetClassById,
    CreateClass,
    UpdateClass,
    DeleteClass,
} from '../controllers/ClassController.js';
import { RequireAdmin } from '../../../middleware/RequireAdmin.js';

export const ClassRouter = express.Router();

/**
 * @swagger
 * /api/admin/classes:
 *   get:
 *     summary: Retrieve a list of classes with pagination and filters.
 *     description: Fetches a paginated list of classes. Can be filtered by name and abbreviation.
 *     tags:
 *       - Admin - Classes
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
 *         description: Filter classes by name (case-insensitive, partial match).
 *       - in: query
 *         name: abbreviation
 *         schema:
 *           type: string
 *         description: Filter classes by abbreviation (case-insensitive, partial match).
 *       - in: query
 *         name: editionId
 *         schema:
 *           type: integer
 *         description: Filter classes by edition ID.
 *       - in: query
 *         name: isPrestige
 *         schema:
 *           type: boolean
 *         description: Filter classes by prestige class status.
 *       - in: query
 *         name: isVisible
 *         schema:
 *           type: boolean
 *         description: Filter classes by display status.
 *       - in: query
 *         name: canCastSpells
 *         schema:
 *           type: boolean
 *         description: Filter classes by caster status.
 *       - in: query
 *         name: hitDie
 *         schema:
 *           type: integer
 *         description: Filter classes by hit die.
 *     responses:
 *       200:
 *         description: A list of classes.
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
 *                         description: The class ID.
 *                       name:
 *                         type: string
 *                         description: The class name.
 *                       abbreviation:
 *                         type: string
 *                         description: The class abbreviation.
 *                       editionId:
 *                         type: integer
 *                         description: The edition ID.
 *                       isPrestige:
 *                         type: boolean
 *                         description: Whether the class is a prestige class.
 *                       isVisible:
 *                         type: boolean
 *                         description: Whether the class is displayed.
 *                       canCastSpells:
 *                         type: boolean
 *                         description: Whether the class is a caster.
 *                       hitDie:
 *                         type: integer
 *                         description: The class's hit die.
 *                 totalItems:
 *                   type: integer
 *                   description: The total number of classes.
 *                 totalPages:
 *                   type: integer
 *                   description: The total number of pages.
 *                 currentPage:
 *                   type: integer
 *                   description: The current page number.
 *       500:
 *         description: Server error.
 */
ClassRouter.get('/', GetClasses as RequestHandler);

/**
 * @swagger
 * /api/admin/classes/all:
 *   get:
 *     summary: Retrieve all classes.
 *     description: Fetches a list of all classes without pagination.
 *     tags:
 *       - Admin - Classes
 *     responses:
 *       200:
 *         description: A list of all classes.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: The class ID.
 *                   name:
 *                     type: string
 *                     description: The class name.
 *       500:
 *         description: Server error.
 */
ClassRouter.get('/all', GetAllClasses as RequestHandler);

/**
 * @swagger
 * /api/admin/classes/{id}:
 *   get:
 *     summary: Retrieve a single class by ID.
 *     description: Fetches a single class based on its ID.
 *     tags:
 *       - Admin - Classes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the class to retrieve.
 *     responses:
 *       200:
 *         description: A single class.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The class ID.
 *                 name:
 *                   type: string
 *                   description: The class name.
 *                 abbreviation:
 *                   type: string
 *                   description: The class abbreviation.
 *                 editionId:
 *                   type: integer
 *                   description: The edition ID.
 *                 isPrestige:
 *                   type: boolean
 *                   description: Whether the class is a prestige class.
 *                 isVisible:
 *                   type: boolean
 *                   description: Whether the class is displayed.
 *                 canCastSpells:
 *                   type: boolean
 *                   description: Whether the class is a caster.
 *                 hitDie:
 *                   type: integer
 *                   description: The class's hit die.
 *       404:
 *         description: Class not found.
 *       500:
 *         description: Server error.
 */
ClassRouter.get('/:id', GetClassById as unknown as RequestHandler);

/**
 * @swagger
 * /api/admin/classes:
 *   post:
 *     summary: Create a new class.
 *     description: Creates a new class with the provided data. Requires admin authentication.
 *     tags:
 *       - Admin - Classes
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
 *               - abbreviation
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the class.
 *               abbreviation:
 *                 type: string
 *                 description: The abbreviation of the class.
 *               editionId:
 *                 type: integer
 *                 description: The edition ID.
 *               isPrestige:
 *                 type: boolean
 *                 description: Whether the class is a prestige class.
 *               isVisible:
 *                 type: boolean
 *                 description: Whether the class is visible.
 *               canCastSpells:
 *                 type: boolean
 *                 description: Whether the class can cast spells.
 *               hitDie:
 *                 type: integer
 *                 description: The hit die of the class.
 *               skillPoints:
 *                 type: integer
 *                 description: The skill points of the class.
 *               castingAbilityId:
 *                 type: integer
 *                 description: The casting ability ID.
 *               description:
 *                 type: string
 *                 description: The description of the class.
 *     responses:
 *       201:
 *         description: Class created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The ID of the newly created class.
 *                 message:
 *                   type: string
 *                   description: Success message.
 *       401:
 *         description: Unauthorized, admin privileges required.
 *       500:
 *         description: Server error.
 */
ClassRouter.post('/', RequireAdmin as RequestHandler, CreateClass as RequestHandler);

/**
 * @swagger
 * /api/admin/classes/{id}:
 *   put:
 *     summary: Update an existing class.
 *     description: Updates a class by its ID. Requires admin authentication.
 *     tags:
 *       - Admin - Classes
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the class to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the class.
 *               abbreviation:
 *                 type: string
 *                 description: The abbreviation of the class.
 *               editionId:
 *                 type: integer
 *                 description: The edition ID.
 *               isPrestige:
 *                 type: boolean
 *                 description: Whether the class is a prestige class.
 *               isVisible:
 *                 type: boolean
 *                 description: Whether the class is visible.
 *               canCastSpells:
 *                 type: boolean
 *                 description: Whether the class can cast spells.
 *               hitDie:
 *                 type: integer
 *                 description: The hit die of the class.
 *               skillPoints:
 *                 type: integer
 *                 description: The skill points of the class.
 *               castingAbilityId:
 *                 type: integer
 *                 description: The casting ability ID.
 *               description:
 *                 type: string
 *                 description: The description of the class.
 *     responses:
 *       200:
 *         description: Class updated successfully.
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
 *         description: Class not found.
 *       500:
 *         description: Server error.
 */
ClassRouter.put('/:id', RequireAdmin as RequestHandler, UpdateClass as unknown as RequestHandler);

/**
 * @swagger
 * /api/admin/classes/{id}:
 *   delete:
 *     summary: Delete a class by ID.
 *     description: Deletes a class by its ID. Requires admin authentication.
 *     tags:
 *       - Admin - Classes
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the class to delete.
 *     responses:
 *       200:
 *         description: Class deleted successfully.
 *       401:
 *         description: Unauthorized, admin privileges required.
 *       404:
 *         description: Class not found.
 *       500:
 *         description: Server error.
 */
ClassRouter.delete('/:id', RequireAdmin as RequestHandler, DeleteClass as unknown as RequestHandler); 