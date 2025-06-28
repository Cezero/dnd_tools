import express, { RequestHandler } from 'express';
import {
    GetRaces,
    GetAllRaces,
    GetRaceById,
    CreateRace,
    UpdateRace,
    DeleteRace,
    GetRaceTraits,
    GetRaceTraitBySlug,
    CreateRaceTrait,
    UpdateRaceTrait,
    DeleteRaceTrait,
    GetAllRaceTraits,
} from '../controllers/RaceController.js';
import { RequireAdmin } from '../../../middleware/RequireAdmin.js';

export const RaceRouter = express.Router();

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
RaceRouter.get('/', GetRaces as RequestHandler);

RaceRouter.get('/all', GetAllRaces as RequestHandler);

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
 *                   slug:
 *                     type: string
 *                     description: The trait slug.
 *                   name:
 *                     type: string
 *                     description: The trait name.
 *                   description:
 *                     type: string
 *                     description: The trait description.
 *                   hasValue:
 *                     type: boolean
 *                     description: Indicates if the trait has an associated value.
 *       500:
 *         description: Server error.
 */
RaceRouter.get('/traits', RequireAdmin as RequestHandler, GetRaceTraits as RequestHandler);

RaceRouter.get('/traits/all', GetAllRaceTraits as RequestHandler);

/**
 * @swagger
 * /api/admin/races/traits/{slug}:
 *   get:
 *     summary: Retrieve a single race trait by slug.
 *     description: Fetches a single race trait based on its slug.
 *     tags:
 *       - Admin - Races
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: The slug of the race trait to retrieve.
 *     responses:
 *       200:
 *         description: A single race trait.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 slug:
 *                   type: string
 *                   description: The trait slug.
 *                 name:
 *                   type: string
 *                   description: The trait name.
 *                 description:
 *                   type: string
 *                   description: The trait description.
 *                 hasValue:
 *                   type: boolean
 *                   description: Indicates if the trait has an associated value.
 *       404:
 *         description: Race trait not found.
 *       500:
 *         description: Server error.
 */
RaceRouter.get('/traits/:slug', GetRaceTraitBySlug as unknown as RequestHandler);

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
 *               - slug
 *             properties:
 *               slug:
 *                 type: string
 *                 description: The slug of the race trait.
 *               name:
 *                 type: string
 *                 description: The name of the race trait.
 *               description:
 *                 type: string
 *                 description: The description of the race trait.
 *               hasValue:
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
 *                 slug:
 *                   type: string
 *                   description: The slug of the newly created race trait.
 *                 message:
 *                   type: string
 *                   description: Success message.
 *       401:
 *         description: Unauthorized, admin privileges required.
 *       500:
 *         description: Server error.
 */
RaceRouter.post('/traits', RequireAdmin as RequestHandler, CreateRaceTrait as RequestHandler);

/**
 * @swagger
 * /api/admin/races/traits/{slug}:
 *   put:
 *     summary: Update an existing race trait.
 *     description: Updates a race trait by its slug. Requires admin authentication.
 *     tags:
 *       - Admin - Races
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: The slug of the race trait to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the race trait.
 *               description:
 *                 type: string
 *                 description: The description of the race trait.
 *               hasValue:
 *                 type: boolean
 *                 description: Whether the trait has an associated value.
 *     responses:
 *       200:
 *         description: Race trait updated successfully.
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
 *         description: Race trait not found.
 *       500:
 *         description: Server error.
 */
RaceRouter.put('/traits/:slug', RequireAdmin as RequestHandler, UpdateRaceTrait as unknown as RequestHandler);

/**
 * @swagger
 * /api/admin/races/traits/{slug}:
 *   delete:
 *     summary: Delete a race trait by slug.
 *     description: Deletes a race trait by its slug. Requires admin authentication.
 *     tags:
 *       - Admin - Races
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: The slug of the race trait to delete.
 *     responses:
 *       200:
 *         description: Race trait deleted successfully.
 *       401:
 *         description: Unauthorized, admin privileges required.
 *       404:
 *         description: Race trait not found.
 *       500:
 *         description: Server error.
 */
RaceRouter.delete('/traits/:slug', RequireAdmin as RequestHandler, DeleteRaceTrait as unknown as RequestHandler);

/**
 * @swagger
 * /api/admin/races/{id}:
 *   get:
 *     summary: Retrieve a single race by ID.
 *     description: Fetches a single race based on its ID, including associated languages, ability adjustments, and traits.
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
 *         description: A single race with its associated data.
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
 *                 description:
 *                   type: string
 *                   description: The race description.
 *                 sizeId:
 *                   type: integer
 *                   description: The size ID.
 *                 speed:
 *                   type: integer
 *                   description: The race speed.
 *                 favoredClassId:
 *                   type: integer
 *                   description: The favored class ID.
 *                 editionId:
 *                   type: integer
 *                   description: The edition ID.
 *                 isVisible:
 *                   type: boolean
 *                   description: Whether the race is visible.
 *                 languages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       languageId:
 *                         type: integer
 *                         description: The language ID.
 *                       isAutomatic:
 *                         type: boolean
 *                         description: Whether the language is automatic.
 *                 abilityAdjustments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       abilityId:
 *                         type: integer
 *                         description: The ability ID.
 *                       value:
 *                         type: integer
 *                         description: The adjustment value.
 *                 traits:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       traitId:
 *                         type: string
 *                         description: The trait ID.
 *                       value:
 *                         type: string
 *                         description: The trait value.
 *                       trait:
 *                         type: object
 *                         properties:
 *                           slug:
 *                             type: string
 *                             description: The trait slug.
 *                           name:
 *                             type: string
 *                             description: The trait name.
 *                           description:
 *                             type: string
 *                             description: The trait description.
 *                           hasValue:
 *                             type: boolean
 *                             description: Whether the trait has a value.
 *       404:
 *         description: Race not found.
 *       500:
 *         description: Server error.
 */
RaceRouter.get('/:id', GetRaceById as unknown as RequestHandler);

/**
 * @swagger
 * /api/admin/races:
 *   post:
 *     summary: Create a new race.
 *     description: Creates a new race with the provided data. Requires admin authentication.
 *     tags:
 *       - Admin - Races
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
 *               - sizeId
 *               - speed
 *               - favoredClassId
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the race.
 *               description:
 *                 type: string
 *                 description: The description of the race.
 *               sizeId:
 *                 type: integer
 *                 description: The size ID of the race.
 *               speed:
 *                 type: integer
 *                 description: The speed of the race.
 *               favoredClassId:
 *                 type: integer
 *                 description: The favored class ID.
 *               editionId:
 *                 type: integer
 *                 description: The edition ID.
 *               isVisible:
 *                 type: boolean
 *                 description: Whether the race is visible.
 *               languages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     languageId:
 *                       type: integer
 *                       description: The language ID.
 *                     isAutomatic:
 *                       type: boolean
 *                       description: Whether the language is automatic.
 *               adjustments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     abilityId:
 *                       type: integer
 *                       description: The ability ID.
 *                     value:
 *                       type: integer
 *                       description: The adjustment value.
 *               traits:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     traitId:
 *                       type: string
 *                       description: The trait ID.
 *                     value:
 *                       type: string
 *                       description: The trait value.
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
 *                   description: Success message.
 *       401:
 *         description: Unauthorized, admin privileges required.
 *       500:
 *         description: Server error.
 */
RaceRouter.post('/', RequireAdmin as RequestHandler, CreateRace as RequestHandler);

/**
 * @swagger
 * /api/admin/races/{id}:
 *   put:
 *     summary: Update an existing race.
 *     description: Updates a race by its ID. Requires admin authentication.
 *     tags:
 *       - Admin - Races
 *     security:
 *       - AdminAuth: []
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
 *                 description: The name of the race.
 *               description:
 *                 type: string
 *                 description: The description of the race.
 *               sizeId:
 *                 type: integer
 *                 description: The size ID of the race.
 *               speed:
 *                 type: integer
 *                 description: The speed of the race.
 *               favoredClassId:
 *                 type: integer
 *                 description: The favored class ID.
 *               editionId:
 *                 type: integer
 *                 description: The edition ID.
 *               isVisible:
 *                 type: boolean
 *                 description: Whether the race is visible.
 *               languages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     languageId:
 *                       type: integer
 *                       description: The language ID.
 *                     isAutomatic:
 *                       type: boolean
 *                       description: Whether the language is automatic.
 *               adjustments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     abilityId:
 *                       type: integer
 *                       description: The ability ID.
 *                     value:
 *                       type: integer
 *                       description: The adjustment value.
 *               traits:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     traitId:
 *                       type: string
 *                       description: The trait ID.
 *                     value:
 *                       type: string
 *                       description: The trait value.
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
 *                   description: Success message.
 *       401:
 *         description: Unauthorized, admin privileges required.
 *       404:
 *         description: Race not found.
 *       500:
 *         description: Server error.
 */
RaceRouter.put('/:id', RequireAdmin as RequestHandler, UpdateRace as unknown as     RequestHandler);

/**
 * @swagger
 * /api/admin/races/{id}:
 *   delete:
 *     summary: Delete a race by ID.
 *     description: Deletes a race by its ID. Requires admin authentication.
 *     tags:
 *       - Admin - Races
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the race to delete.
 *     responses:
 *       200:
 *         description: Race deleted successfully.
 *       401:
 *         description: Unauthorized, admin privileges required.
 *       404:
 *         description: Race not found.
 *       500:
 *         description: Server error.
 */
RaceRouter.delete('/:id', RequireAdmin as RequestHandler, DeleteRace as unknown as RequestHandler); 