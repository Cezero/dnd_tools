import express from 'express';
import {
    getRaces,
    getAllRaces,
    getRaceById,
    createRace,
    updateRace,
    deleteRace,
    getRaceTraits,
    getRaceTraitById,
    createRaceTrait,
    updateRaceTrait,
    deleteRaceTrait,
    getAllRaceTraits,
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
router.get('/', getRaces);

router.get('/all', getAllRaces);
/**
 * @swagger
 * /api/admin/races/traits:
 *   get:
 *     summary: Retrieve a list of race traits.
 *     description: Fetches a list of all race traits.
 *     tags:
 *       - Admin - Races
 *     responses:
 *       200:
 *         description: A list of race traits.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   trait_slug:
 *                     type: integer
 *                     description: The trait ID.
 *                   trait_name:
 *                     type: string
 *                     description: The trait name.
 *                   trait_description:
 *                     type: string
 *                     description: The trait description.
 *                   value_flag:
 *                     type: boolean
 *                     description: Indicates if the trait has an associated value.
 *       500:
 *         description: Server error.
 */
router.get('/traits', requireAdmin, getRaceTraits);

router.get('/traits/all', getAllRaceTraits);
/**
 * @swagger
 * /api/admin/races/traits/{id}:
 *   get:
 *     summary: Retrieve a single race trait by ID.
 *     description: Fetches a single race trait based on its ID.
 *     tags:
 *       - Admin - Races
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the race trait to retrieve.
 *     responses:
 *       200:
 *         description: A single race trait.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trait_slug:
 *                   type: integer
 *                   description: The trait ID.
 *                 trait_name:
 *                   type: string
 *                   description: The trait name.
 *                 trait_description:
 *                   type: string
 *                   description: The trait description.
 *                 value_flag:
 *                   type: boolean
 *                   description: Indicates if the trait has an associated value.
 *       404:
 *         description: Race trait not found.
 *       500:
 *         description: Server error.
 */
router.get('/traits/:id', getRaceTraitById);

/**
 * @swagger
 * /api/admin/races/traits:
 *   post:
 *     summary: Create a new race trait.
 *     description: Adds a new race trait to the database.
 *     tags:
 *       - Admin - Races
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trait_name
 *             properties:
 *               trait_name:
 *                 type: string
 *                 description: The name of the race trait.
 *               trait_description:
 *                 type: string
 *                 description: The description of the race trait.
 *               value_flag:
 *                 type: boolean
 *                 default: false
 *                 description: Whether the trait has an associated value.
 *     responses:
 *       201:
 *         description: Race trait created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The ID of the newly created race trait.
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error.
 */
router.post('/traits', requireAdmin, createRaceTrait);

/**
 * @swagger
 * /api/admin/races/traits/{id}:
 *   put:
 *     summary: Update an existing race trait.
 *     description: Updates the details of a race trait by its ID.
 *     tags:
 *       - Admin - Races
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the race trait to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trait_name:
 *                 type: string
 *                 description: The updated name of the race trait.
 *               trait_description:
 *                 type: string
 *                 description: The updated description of the race trait.
 *               value_flag:
 *                 type: boolean
 *                 description: Whether the trait has an associated value.
 *     responses:
 *       200:
 *         description: Race trait updated successfully.
 *       404:
 *         description: Race trait not found.
 *       500:
 *         description: Server error.
 */
router.put('/traits/:id', requireAdmin, updateRaceTrait);

/**
 * @swagger
 * /api/admin/races/traits/{id}:
 *   delete:
 *     summary: Delete a race trait by ID.
 *     description: Deletes a race trait from the database based on its ID.
 *     tags:
 *       - Admin - Races
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the race trait to delete.
 *     responses:
 *       204:
 *         description: Race trait deleted successfully.
 *       404:
 *         description: Race trait not found.
 *       500:
 *         description: Server error.
 */
router.delete('/traits/:id', requireAdmin, deleteRaceTrait);

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
router.get('/:id', getRaceById);

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
 *                 description: The ID of the edition the race belongs to.
 *               display:
 *                 type: boolean
 *                 description: Whether the race should be displayed.
 *     responses:
 *       200:
 *         description: Race updated successfully.
 *       404:
 *         description: Race not found.
 *       500:
 *         description: Server error.
 */
router.put('/:id', requireAdmin, updateRace);

/**
 * @swagger
 * /api/admin/races/{id}:
 *   delete:
 *     summary: Delete a race by ID.
 *     description: Deletes a race from the database based on its ID.
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
 *         description: Race deleted successfully.
 *       404:
 *         description: Race not found.
 *       500:
 *         description: Server error.
 */
router.delete('/:id', requireAdmin, deleteRace);

export default router;