import express from 'express';
import {
    getClasses,
    getAllClasses,
    getClassById,
    createClass,
    updateClass,
    deleteClass,
} from '../controllers/classesController.js';
import { requireAdmin } from '../../../middleware/requireAdmin.js';

const router = express.Router();

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
 *         name: class_name
 *         schema:
 *           type: string
 *         description: Filter classes by name (case-insensitive, partial match).
 *       - in: query
 *         name: class_abbr
 *         schema:
 *           type: string
 *         description: Filter classes by abbreviation (case-insensitive, partial match).
 *       - in: query
 *         name: edition_id
 *         schema:
 *           type: integer
 *         description: Filter classes by edition ID.
 *       - in: query
 *         name: is_prestige_class
 *         schema:
 *           type: boolean
 *         description: Filter classes by prestige class status.
 *       - in: query
 *         name: display
 *         schema:
 *           type: boolean
 *         description: Filter classes by display status.
 *       - in: query
 *         name: caster
 *         schema:
 *           type: boolean
 *         description: Filter classes by caster status.
 *       - in: query
 *         name: hit_die
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
 *                       class_id:
 *                         type: integer
 *                         description: The class ID.
 *                       class_name:
 *                         type: string
 *                         description: The class name.
 *                       class_abbr:
 *                         type: string
 *                         description: The class abbreviation.
 *                       edition_id:
 *                         type: integer
 *                         description: The edition ID.
 *                       is_prestige_class:
 *                         type: boolean
 *                         description: Whether the class is a prestige class.
 *                       display:
 *                         type: boolean
 *                         description: Whether the class is displayed.
 *                       caster:
 *                         type: boolean
 *                         description: Whether the class is a caster.
 *                       hit_die:
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
router.get('/', getClasses);

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
 *                   class_id:
 *                     type: integer
 *                     description: The class ID.
 *                   class_name:
 *                     type: string
 *                     description: The class name.
 *       500:
 *         description: Server error.
 */
router.get('/all', getAllClasses);

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
 *                 class_id:
 *                   type: integer
 *                   description: The class ID.
 *                 class_name:
 *                   type: string
 *                   description: The class name.
 *                 class_abbr:
 *                   type: string
 *                   description: The class abbreviation.
 *                 edition_id:
 *                   type: integer
 *                   description: The edition ID.
 *                 is_prestige_class:
 *                   type: boolean
 *                   description: Whether the class is a prestige class.
 *                 display:
 *                   type: boolean
 *                   description: Whether the class is displayed.
 *                 caster:
 *                   type: boolean
 *                   description: Whether the class is a caster.
 *                 hit_die:
 *                   type: integer
 *                   description: The class's hit die.
 *       404:
 *         description: Class not found.
 *       500:
 *         description: Server error.
 */
router.get('/:id', getClassById);

/**
 * @swagger
 * /api/admin/classes:
 *   post:
 *     summary: Create a new class.
 *     description: Adds a new class to the database.
 *     tags:
 *       - Admin - Classes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class_name
 *               - class_abbr
 *               - edition_id
 *               - is_prestige_class
 *               - display
 *               - caster
 *               - hit_die
 *             properties:
 *               class_name:
 *                 type: string
 *                 description: The name of the class.
 *               class_abbr:
 *                 type: string
 *                 description: The abbreviation of the class.
 *               edition_id:
 *                 type: integer
 *                 description: The ID of the edition the class belongs to.
 *               is_prestige_class:
 *                 type: boolean
 *                 description: Whether the class is a prestige class.
 *               display:
 *                 type: boolean
 *                 description: Whether the class should be displayed.
 *               caster:
 *                 type: boolean
 *                 description: Whether the class is a caster.
 *               hit_die:
 *                 type: integer
 *                 description: The hit die of the class.
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
 *       400:
 *         description: Invalid input.
 *       500:
 *         description: Server error.
 */
router.post('/', requireAdmin, createClass);

/**
 * @swagger
 * /api/admin/classes/{id}:
 *   put:
 *     summary: Update an existing class.
 *     description: Updates a class based on its ID.
 *     tags:
 *       - Admin - Classes
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
 *               class_name:
 *                 type: string
 *                 description: The name of the class.
 *               class_abbr:
 *                 type: string
 *                 description: The abbreviation of the class.
 *               edition_id:
 *                 type: integer
 *                 description: The ID of the edition the class belongs to.
 *               is_prestige_class:
 *                 type: boolean
 *                 description: Whether the class is a prestige class.
 *               display:
 *                 type: boolean
 *                 description: Whether the class should be displayed.
 *               caster:
 *                 type: boolean
 *                 description: Whether the class is a caster.
 *               hit_die:
 *                 type: integer
 *                 description: The hit die of the class.
 *     responses:
 *       200:
 *         description: Class updated successfully.
 *       400:
 *         description: Invalid input.
 *       404:
 *         description: Class not found.
 *       500:
 *         description: Server error.
 */
router.put('/:id', requireAdmin, updateClass);

/**
 * @swagger
 * /api/admin/classes/{id}:
 *   delete:
 *     summary: Delete a class by ID.
 *     description: Deletes a class based on its ID.
 *     tags:
 *       - Admin - Classes
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
 *       404:
 *         description: Class not found.
 *       500:
 *         description: Server error.
 */
router.delete('/:id', requireAdmin, deleteClass);

export default router; 