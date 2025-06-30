import express, { RequestHandler } from 'express';
import {
    GetFeats,
    GetAllFeats,
    GetFeatById,
    CreateFeat,
    UpdateFeat,
    DeleteFeat,
} from './featController.js';
import { requireAdmin } from '../../middleware/authMiddleware.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import {
    FeatQuerySchema,
    FeatIdParamSchema,
    CreateFeatSchema,
    UpdateFeatSchema
} from '@shared/schema';

export const FeatRouter = express.Router();

/**
 * @swagger
 * /api/feats:
 *   get:
 *     summary: Retrieve a list of feats with pagination and filters.
 *     description: Fetches a paginated list of feats. Can be filtered by name, type, and various text fields.
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
 *         name: feat_name
 *         schema:
 *           type: string
 *         description: Filter feats by name (case-insensitive, partial match).
 *       - in: query
 *         name: feat_type
 *         schema:
 *           type: integer
 *         description: Filter feats by type ID.
 *       - in: query
 *         name: feat_description
 *         schema:
 *           type: string
 *         description: Filter feats by description (case-insensitive, partial match).
 *       - in: query
 *         name: feat_benefit
 *         schema:
 *           type: string
 *         description: Filter feats by benefit description (case-insensitive, partial match).
 *       - in: query
 *         name: feat_normal
 *         schema:
 *           type: string
 *         description: Filter feats by normal text (case-insensitive, partial match).
 *       - in: query
 *         name: feat_special
 *         schema:
 *           type: string
 *         description: Filter feats by special text (case-insensitive, partial match).
 *       - in: query
 *         name: feat_prereq
 *         schema:
 *           type: string
 *         description: Filter feats by prerequisite text (case-insensitive, partial match).
 *       - in: query
 *         name: feat_multi_times
 *         schema:
 *           type: boolean
 *         description: Filter feats by whether they can be taken multiple times.
 *     responses:
 *       200:
 *         description: A list of feats.
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
 *                         description: The feat ID.
 *                       name:
 *                         type: string
 *                         description: The feat name.
 *                       typeId:
 *                         type: integer
 *                         description: The feat type.
 *                       description:
 *                         type: string
 *                         description: The feat description.
 *                       benefit:
 *                         type: string
 *                         description: The feat benefit.
 *                       normalEffect:
 *                         type: string
 *                         description: The feat normal.
 *                       specialEffect:
 *                         type: string
 *                         description: The feat special.
 *                       prerequisites:
 *                         type: string
 *                         description: The feat prerequisite.
 *                       repeatable:
 *                         type: boolean
 *                         description: Whether the feat can be taken multiple times.
 *                 totalItems: 
 *                   type: integer
 *                   description: The total number of feats.
 *                 totalPages:
 *                   type: integer
 *                   description: The total number of pages.
 *                 currentPage:
 *                   type: integer
 *                   description: The current page number.
 *       500:
 *         description: Server error.
 */
FeatRouter.get('/', validateRequest({ query: FeatQuerySchema }) as RequestHandler, GetFeats as RequestHandler);

/**
 * @swagger
 * /api/feats/all:
 *   get:
 *     summary: Retrieve all feats.
 *     description: Fetches a list of all feats without pagination.
 *     responses:
 *       200:
 *         description: A list of all feats.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: The feat ID.
 *                   name:
 *                     type: string
 *                     description: The feat name.
 *       500:
 *         description: Server error.
 */
FeatRouter.get('/all', GetAllFeats as RequestHandler);

/**
 * @swagger
 * /api/feats/{id}:
 *   get:
 *     summary: Retrieve a single feat by ID.
 *     description: Fetches a single feat based on its ID, including associated benefits and prerequisites.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the feat to retrieve.
 *     responses:
 *       200:
 *         description: A single feat with its benefits and prerequisites.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The feat ID.
 *                 name:
 *                   type: string
 *                   description: The feat name.
 *                 typeId:
 *                   type: integer
 *                   description: The feat type.
 *                 description:
 *                   type: string
 *                   description: The feat description.
 *                 benefit:
 *                   type: string
 *                   description: The feat benefit.
 *                 normalEffect:
 *                   type: string
 *                   description: The feat normal.
 *                 specialEffect:
 *                   type: string
 *                   description: The feat special.
 *                 prerequisites:
 *                   type: string
 *                   description: The feat prerequisite.
 *                 repeatable:
 *                   type: boolean
 *                   description: Whether the feat can be taken multiple times.
 *                 benefits:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       typeId:
 *                         type: integer
 *                         description: The type of benefit.
 *                       referenceId:
 *                         type: integer
 *                         description: The ID of the specific type (e.g., skill ID).
 *                       amount:
 *                         type: integer
 *                         description: The amount of the benefit.
 *                       index:
 *                         type: integer
 *                         description: The index of the benefit.
 *                 prerequisitesMap:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       typeId:
 *                         type: integer
 *                         description: The type of prerequisite.
 *                       amount:
 *                         type: integer
 *                         description: The amount required for the prerequisite.
 *                       referenceId:
 *                         type: integer
 *                         description: The ID of the specific prerequisite type.
 *                       index:
 *                         type: integer
 *                         description: The index of the prerequisite.
 *       404:
 *         description: Feat not found.
 *       500:
 *         description: Server error.
 */
FeatRouter.get('/:id', validateRequest({ params: FeatIdParamSchema }) as RequestHandler, GetFeatById as unknown as RequestHandler);

/**
 * @swagger
 * /api/feats:
 *   post:
 *     summary: Create a new feat.
 *     description: Creates a new feat with the provided data. Requires admin authentication.
 *     tags:
 *       - Admin - Feats
 *     security:
 *       - AdminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - feat_name
 *               - feat_type
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the feat.
 *               typeId:
 *                 type: integer
 *                 description: The type of the feat.
 *               description:
 *                 type: string
 *                 description: Full description of the feat (Markdown supported).
 *               benefit:
 *                 type: string
 *                 description: Description of the feat's benefit.
 *               normalEffect:
 *                 type: string
 *                 description: Description of the feat's normal usage.
 *               specialEffect:
 *                 type: string
 *                 description: Description of the feat's special usage.
 *               prerequisites:
 *                 type: string
 *                 description: Description of the feat's prerequisites.
 *               repeatable:
 *                 type: boolean
 *                 description: Indicates if the feat can be taken multiple times.
 *               benefits:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     benefit_type:
 *                       type: integer
 *                       description: The type of benefit.
 *                     benefit_type_id:
 *                       type: integer
 *                       description: The ID of the specific type (e.g., skill ID).
 *                     benefit_amount:
 *                       type: integer
 *                       description: The amount of the benefit.
 *               prereqs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     prereq_type:
 *                       type: integer
 *                       description: The type of prerequisite.
 *                     prereq_amount:
 *                       type: integer
 *                       description: The amount required for the prerequisite.
 *                     prereq_type_id:
 *                       type: integer
 *                       description: The ID of the specific prerequisite type.
 *     responses:
 *       201:
 *         description: Feat created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The ID of the newly created feat.
 *                 message:
 *                   type: string
 *                   description: Success message.
 *       401:
 *         description: Unauthorized, admin privileges required.
 *       500:
 *         description: Server error.
 */
FeatRouter.post('/', requireAdmin as RequestHandler, validateRequest({ body: CreateFeatSchema }) as RequestHandler, CreateFeat as RequestHandler);

/**
 * @swagger
 * /api/feats/{id}:
 *   put:
 *     summary: Update an existing feat.
 *     description: Updates a feat by its ID. Requires admin authentication.
 *     tags:
 *       - Admin - Feats
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the feat to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the feat.
 *               typeId:
 *                 type: integer
 *                 description: The type of the feat.
 *               description:
 *                 type: string
 *                 description: Full description of the feat (Markdown supported).
 *               benefit:
 *                 type: string
 *                 description: Description of the feat's benefit.
 *               normalEffect:
 *                 type: string
 *                 description: Description of the feat's normal usage.
 *               specialEffect:
 *                 type: string
 *                 description: Description of the feat's special usage.
 *               prerequisites:
 *                 type: string
 *                 description: Description of the feat's prerequisites.
 *               repeatable:
 *                 type: boolean
 *                 description: Indicates if the feat can be taken multiple times.
 *               benefits:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     benefit_type:
 *                       type: integer
 *                       description: The type of benefit.
 *                     benefit_type_id:
 *                       type: integer
 *                       description: The ID of the specific type (e.g., skill ID).
 *                     benefit_amount:
 *                       type: integer
 *                       description: The amount of the benefit.
 *               prereqs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     prereq_type:
 *                       type: integer
 *                       description: The type of prerequisite.
 *                     prereq_amount:
 *                       type: integer
 *                       description: The amount required for the prerequisite.
 *                     prereq_type_id:
 *                       type: integer
 *                       description: The ID of the specific prerequisite type.
 *     responses:
 *       200:
 *         description: Feat updated successfully.
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
 *         description: Feat not found.
 *       500:
 *         description: Server error.
 */
FeatRouter.put('/:id', requireAdmin as RequestHandler, validateRequest({ params: FeatIdParamSchema, body: UpdateFeatSchema }) as RequestHandler, UpdateFeat as unknown as RequestHandler);

/**
 * @swagger
 * /api/feats/{id}:
 *   delete:
 *     summary: Delete a feat by ID.
 *     description: Deletes a feat by its ID. Requires admin authentication.
 *     tags:
 *       - Admin - Feats
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the feat to delete.
 *     responses:
 *       204:
 *         description: Feat deleted successfully.
 *       401:
 *         description: Unauthorized, admin privileges required.
 *       404:
 *         description: Feat not found.
 *       500:
 *         description: Server error.
 */
FeatRouter.delete('/:id', requireAdmin as RequestHandler, validateRequest({ params: FeatIdParamSchema }) as RequestHandler, DeleteFeat as unknown as RequestHandler); 