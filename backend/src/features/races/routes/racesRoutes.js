import express from 'express';
import {
    getRaces,
    getRaceById,
    createRace,
    updateRace,
    deleteRace,
} from '../controllers/racesController.js';
import { requireAdmin } from '../../../middleware/requireAdmin.js';

const router = express.Router();

/**
 * @swagger
 * /api/admin/races:
 *   get:
 *     summary: Retrieve a list of races with pagination and filters.
 *     description: Fetches a paginated list of races. Can be filtered by name and description.
 *     tags:
 *       - Admin - Races
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
 *         description: Filter races by name (case-insensitive, partial match).
 *       - in: query
 *         name: description
 *         schema:
 *           type: string
 *         description: Filter races by description (case-insensitive, partial match).
 *     responses:
 *       200:
 *         description: A list of races.
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
 *                         description: The race ID.
 *                       name:
 *                         type: string
 *                         description: The race name.
 *                       description:
 *                         type: string
 *                         description: The race description.
 *                 totalItems:
 *                   type: integer
 *                   description: The total number of races.
 *                 totalPages:
 *                   type: integer
 *                   description: The total number of pages.
 *                 currentPage:
 *                   type: integer
 *                   description: The current page number.
 *       500:
 *         description: Server error.
 */
router.get('/', requireAdmin, getRaces);

/**
 * @swagger
 * /api/admin/races/{id}:
 *   get:
 *     summary: Retrieve a single race by ID.
 *     description: Fetches a single race based on its ID.
 *     tags:
 *       - Admin - Races
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the race to retrieve.
 *     responses:
 *       200:
 *         description: A single race.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The race ID.
 *                 name:
 *                   type: string
 *                   description: The race name.
 *                 abbr:
 *                   type: string
 *                   description: The race abbreviation.
 *                 editionId:
 *                   type: integer
 *                   nullable: true
 *                   description: The ID of the edition the race belongs to.
 *                 display:
 *                   type: boolean
 *                   description: Whether the race should be displayed.
 *       404:
 *         description: Race not found.
 *       500:
 *         description: Server error.
 */
router.get('/:id', requireAdmin, getRaceById);

/**
 * @swagger
 * /api/admin/races:
 *   post:
 *     summary: Create a new race.
 *     description: Adds a new race to the database.
 *     tags:
 *       - Admin - Races
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - abbr
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the race.
 *               abbr:
 *                 type: string
 *                 description: The abbreviation for the race.
 *               editionId:
 *                 type: integer
 *                 nullable: true
 *                 description: The ID of the edition the race belongs to.
 *               display:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the race should be displayed.
 *     responses:
 *       201:
 *         description: Race created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The ID of the newly created race.
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error.
 */
router.post('/', requireAdmin, createRace);

/**
 * @swagger
 * /api/admin/races/{id}:
 *   put:
 *     summary: Update an existing race.
 *     description: Updates the details of a race by its ID.
 *     tags:
 *       - Admin - Races
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the race to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The updated name of the race.
 *               abbr:
 *                 type: string
 *                 description: The updated abbreviation for the race.
 *               editionId:
 *                 type: integer
 *                 nullable: true
 *                 description: The updated ID of the edition the race belongs to.
 *               display:
 *                 type: boolean
 *                 description: Whether the race should be displayed.
 *     responses:
 *       200:
 *         description: Race updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Race not found or no changes made.
 *       500:
 *         description: Server error.
 */
router.put('/:id', requireAdmin, updateRace);

/**
 * @swagger
 * /api/admin/races/{id}:
 *   delete:
 *     summary: Delete a race by ID.
 *     description: Deletes a race from the database by its ID.
 *     tags:
 *       - Admin - Races
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the race to delete.
 *     responses:
 *       204:
 *         description: Race deleted successfully (No Content).
 *       404:
 *         description: Race not found.
 *       500:
 *         description: Server error.
 */
router.delete('/:id', requireAdmin, deleteRace);

export default router; 