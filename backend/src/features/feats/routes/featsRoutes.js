import express from 'express';
import {
    getFeats,
    getAllFeats,
    getFeatById,
    createFeat,
    updateFeat,
    deleteFeat,
    getFeatBenefits,
    getFeatBenefitById,
    createFeatBenefit,
    updateFeatBenefit,
    deleteFeatBenefit,
    getAllFeatBenefits,
    getFeatPrereqs,
    getFeatPrereqById,
    createFeatPrereq,
    updateFeatPrereq,
    deleteFeatPrereq,
    getAllFeatPrereqs,
} from '../controllers/featsController.js';
import { requireAdmin } from '../../../middleware/requireAdmin.js';

const router = express.Router();

/**
 * @swagger
 * /api/admin/feats:
 *   get:
 *     summary: Retrieve a list of feats with pagination and filters.
 *     description: Fetches a paginated list of feats. Can be filtered by name, type, and various text fields.
 *     tags:
 *       - Admin - Feats
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
 *                       feat_id:
 *                         type: integer
 *                         description: The feat ID.
 *                       feat_name:
 *                         type: string
 *                         description: The feat name.
 *                       feat_type:
 *                         type: integer
 *                         description: The feat type.
 *                       feat_description:
 *                         type: string
 *                         description: The feat description.
 *                       feat_benefit:
 *                         type: string
 *                         description: The feat benefit.
 *                       feat_normal:
 *                         type: string
 *                         description: The feat normal.
 *                       feat_special:
 *                         type: string
 *                         description: The feat special.
 *                       feat_prereq:
 *                         type: string
 *                         description: The feat prerequisite.
 *                       feat_multi_times:
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
router.get('/', getFeats);

/**
 * @swagger
 * /api/admin/feats/all:
 *   get:
 *     summary: Retrieve all feats.
 *     description: Fetches a list of all feats without pagination.
 *     tags:
 *       - Admin - Feats
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
 *                   feat_id:
 *                     type: integer
 *                     description: The feat ID.
 *                   feat_name:
 *                     type: string
 *                     description: The feat name.
 *       500:
 *         description: Server error.
 */
router.get('/all', getAllFeats);

/**
 * @swagger
 * /api/admin/feats/{id}:
 *   get:
 *     summary: Retrieve a single feat by ID.
 *     description: Fetches a single feat based on its ID, including associated benefits and prerequisites.
 *     tags:
 *       - Admin - Feats
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
 *                 feat_id:
 *                   type: integer
 *                   description: The feat ID.
 *                 feat_name:
 *                   type: string
 *                   description: The feat name.
 *                 feat_type:
 *                   type: integer
 *                   description: The feat type.
 *                 feat_description:
 *                   type: string
 *                   description: The feat description.
 *                 feat_benefit:
 *                   type: string
 *                   description: The feat benefit.
 *                 feat_normal:
 *                   type: string
 *                   description: The feat normal.
 *                 feat_special:
 *                   type: string
 *                   description: The feat special.
 *                 feat_prereq:
 *                   type: string
 *                   description: The feat prerequisite.
 *                 feat_multi_times:
 *                   type: boolean
 *                   description: Whether the feat can be taken multiple times.
 *                 benefits:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       benefit_id:
 *                         type: integer
 *                         description: The benefit ID.
 *                       feat_id:
 *                         type: integer
 *                         description: The associated feat ID.
 *                       benefit_type:
 *                         type: integer
 *                         description: The type of benefit.
 *                       benefit_type_id:
 *                         type: integer
 *                         description: The ID of the specific type (e.g., skill ID).
 *                       benefit_amount:
 *                         type: integer
 *                         description: The amount of the benefit.
 *                 prereqs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       prereq_id:
 *                         type: integer
 *                         description: The prerequisite ID.
 *                       feat_id:
 *                         type: integer
 *                         description: The associated feat ID.
 *                       prereq_type:
 *                         type: integer
 *                         description: The type of prerequisite.
 *                       prereq_amount:
 *                         type: integer
 *                         description: The amount required for the prerequisite.
 *                       prereq_type_id:
 *                         type: integer
 *                         description: The ID of the specific prerequisite type.
 *       404:
 *         description: Feat not found.
 *       500:
 *         description: Server error.
 */
router.get('/:id', getFeatById);

/**
 * @swagger
 * /api/admin/feats:
 *   post:
 *     summary: Create a new feat.
 *     description: Adds a new feat to the database. Requires admin authentication.
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
 *               feat_name:
 *                 type: string
 *                 description: The name of the feat.
 *               feat_type:
 *                 type: integer
 *                 description: The type of the feat.
 *               feat_description:
 *                 type: string
 *                 description: Full description of the feat (Markdown supported).
 *               feat_benefit:
 *                 type: string
 *                 description: Description of the feat's benefit.
 *               feat_normal:
 *                 type: string
 *                 description: Description of the feat's normal usage.
 *               feat_special:
 *                 type: string
 *                 description: Description of the feat's special usage.
 *               feat_prereq:
 *                 type: string
 *                 description: Description of the feat's prerequisites.
 *               feat_multi_times:
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
router.post('/', requireAdmin, createFeat);

/**
 * @swagger
 * /api/admin/feats/{id}:
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
 *               feat_name:
 *                 type: string
 *                 description: The name of the feat.
 *               feat_type:
 *                 type: integer
 *                 description: The type of the feat.
 *               feat_description:
 *                 type: string
 *                 description: Full description of the feat (Markdown supported).
 *               feat_benefit:
 *                 type: string
 *                 description: Description of the feat's benefit.
 *               feat_normal:
 *                 type: string
 *                 description: Description of the feat's normal usage.
 *               feat_special:
 *                 type: string
 *                 description: Description of the feat's special usage.
 *               feat_prereq:
 *                 type: string
 *                 description: Description of the feat's prerequisites.
 *               feat_multi_times:
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
router.put('/:id', requireAdmin, updateFeat);

/**
 * @swagger
 * /api/admin/feats/{id}:
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
router.delete('/:id', requireAdmin, deleteFeat);

/**
 * @swagger
 * /api/admin/feats/benefits:
 *   get:
 *     summary: Retrieve a list of feat benefits.
 *     description: Fetches a paginated list of feat benefits. Can be filtered by feat ID, benefit type, etc.
 *     tags:
 *       - Admin - Feats
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
 *         name: feat_id
 *         schema:
 *           type: integer
 *         description: Filter benefits by associated feat ID.
 *       - in: query
 *         name: benefit_type
 *         schema:
 *           type: integer
 *         description: Filter benefits by type.
 *     responses:
 *       200:
 *         description: A list of feat benefits.
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
 *                       benefit_id:
 *                         type: integer
 *                         description: The benefit ID.
 *                       feat_id:
 *                         type: integer
 *                         description: The associated feat ID.
 *                       benefit_type:
 *                         type: integer
 *                         description: The type of benefit.
 *                       benefit_type_id:
 *                         type: integer
 *                         description: The ID of the specific type.
 *                       benefit_amount:
 *                         type: integer
 *                         description: The amount of the benefit.
 *                 totalItems:
 *                   type: integer
 *                   description: The total number of feat benefits.
 *                 totalPages:
 *                   type: integer
 *                   description: The total number of pages.
 *                 currentPage:
 *                   type: integer
 *                   description: The current page number.
 *       500:
 *         description: Server error.
 */
router.get('/benefits', requireAdmin, getFeatBenefits);

/**
 * @swagger
 * /api/admin/feats/benefits/all:
 *   get:
 *     summary: Retrieve all feat benefits.
 *     description: Fetches a list of all feat benefits without pagination.
 *     tags:
 *       - Admin - Feats
 *     responses:
 *       200:
 *         description: A list of all feat benefits.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   benefit_id:
 *                     type: integer
 *                     description: The benefit ID.
 *                   feat_id:
 *                     type: integer
 *                     description: The associated feat ID.
 *                   benefit_type:
 *                     type: integer
 *                     description: The type of benefit.
 *                   benefit_type_id:
 *                     type: integer
 *                     description: The ID of the specific type.
 *                   benefit_amount:
 *                     type: integer
 *                     description: The amount of the benefit.
 *       500:
 *         description: Server error.
 */
router.get('/benefits/all', getAllFeatBenefits);

/**
 * @swagger
 * /api/admin/feats/benefits/{id}:
 *   get:
 *     summary: Retrieve a single feat benefit by ID.
 *     description: Fetches a single feat benefit based on its ID.
 *     tags:
 *       - Admin - Feats
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the feat benefit to retrieve.
 *     responses:
 *       200:
 *         description: A single feat benefit.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 benefit_id:
 *                   type: integer
 *                   description: The benefit ID.
 *                 feat_id:
 *                   type: integer
 *                   description: The associated feat ID.
 *                 benefit_type:
 *                   type: integer
 *                   description: The type of benefit.
 *                 benefit_type_id:
 *                   type: integer
 *                   description: The ID of the specific type.
 *                 benefit_amount:
 *                   type: integer
 *                   description: The amount of the benefit.
 *       404:
 *         description: Feat benefit not found.
 *       500:
 *         description: Server error.
 */
router.get('/benefits/:id', getFeatBenefitById);

/**
 * @swagger
 * /api/admin/feats/benefits:
 *   post:
 *     summary: Create a new feat benefit.
 *     description: Adds a new feat benefit to the database. Requires admin authentication.
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
 *               - feat_id
 *               - benefit_type
 *             properties:
 *               feat_id:
 *                 type: integer
 *                 description: The ID of the associated feat.
 *               benefit_type:
 *                 type: integer
 *                 description: The type of benefit.
 *               benefit_type_id:
 *                 type: integer
 *                 description: The ID of the specific type (e.g., skill ID).
 *               benefit_amount:
 *                 type: integer
 *                 description: The amount of the benefit.
 *     responses:
 *       201:
 *         description: Feat benefit created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The ID of the newly created feat benefit.
 *                 message:
 *                   type: string
 *                   description: Success message.
 *       401:
 *         description: Unauthorized, admin privileges required.
 *       500:
 *         description: Server error.
 */
router.post('/benefits', requireAdmin, createFeatBenefit);

/**
 * @swagger
 * /api/admin/feats/benefits/{id}:
 *   put:
 *     summary: Update an existing feat benefit.
 *     description: Updates a feat benefit by its ID. Requires admin authentication.
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
 *         description: The ID of the feat benefit to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               feat_id:
 *                 type: integer
 *                 description: The ID of the associated feat.
 *               benefit_type:
 *                 type: integer
 *                 description: The type of benefit.
 *               benefit_type_id:
 *                 type: integer
 *                 description: The ID of the specific type (e.g., skill ID).
 *               benefit_amount:
 *                 type: integer
 *                 description: The amount of the benefit.
 *     responses:
 *       200:
 *         description: Feat benefit updated successfully.
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
 *         description: Feat benefit not found.
 *       500:
 *         description: Server error.
 */
router.put('/benefits/:id', requireAdmin, updateFeatBenefit);

/**
 * @swagger
 * /api/admin/feats/benefits/{id}:
 *   delete:
 *     summary: Delete a feat benefit by ID.
 *     description: Deletes a feat benefit by its ID. Requires admin authentication.
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
 *         description: The ID of the feat benefit to delete.
 *     responses:
 *       204:
 *         description: Feat benefit deleted successfully.
 *       401:
 *         description: Unauthorized, admin privileges required.
 *       404:
 *         description: Feat benefit not found.
 *       500:
 *         description: Server error.
 */
router.delete('/benefits/:id', requireAdmin, deleteFeatBenefit);

/**
 * @swagger
 * /api/admin/feats/prereqs:
 *   get:
 *     summary: Retrieve a list of feat prerequisites.
 *     description: Fetches a paginated list of feat prerequisites. Can be filtered by feat ID, prerequisite type, etc.
 *     tags:
 *       - Admin - Feats
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
 *         name: feat_id
 *         schema:
 *           type: integer
 *         description: Filter prerequisites by associated feat ID.
 *       - in: query
 *         name: prereq_type
 *         schema:
 *           type: integer
 *         description: Filter prerequisites by type.
 *     responses:
 *       200:
 *         description: A list of feat prerequisites.
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
 *                       prereq_id:
 *                         type: integer
 *                         description: The prerequisite ID.
 *                       feat_id:
 *                         type: integer
 *                         description: The associated feat ID.
 *                       prereq_type:
 *                         type: integer
 *                         description: The type of prerequisite.
 *                       prereq_amount:
 *                         type: integer
 *                         description: The amount required for the prerequisite.
 *                       prereq_type_id:
 *                         type: integer
 *                         description: The ID of the specific type.
 *                 totalItems:
 *                   type: integer
 *                   description: The total number of feat prerequisites.
 *                 totalPages:
 *                   type: integer
 *                   description: The total number of pages.
 *                 currentPage:
 *                   type: integer
 *                   description: The current page number.
 *       500:
 *         description: Server error.
 */
router.get('/prereqs', requireAdmin, getFeatPrereqs);

/**
 * @swagger
 * /api/admin/feats/prereqs/all:
 *   get:
 *     summary: Retrieve all feat prerequisites.
 *     description: Fetches a list of all feat prerequisites without pagination.
 *     tags:
 *       - Admin - Feats
 *     responses:
 *       200:
 *         description: A list of all feat prerequisites.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   prereq_id:
 *                     type: integer
 *                     description: The prerequisite ID.
 *                   feat_id:
 *                     type: integer
 *                     description: The associated feat ID.
 *                   prereq_type:
 *                     type: integer
 *                     description: The type of prerequisite.
 *                   prereq_amount:
 *                     type: integer
 *                     description: The amount required for the prerequisite.
 *                   prereq_type_id:
 *                     type: integer
 *                     description: The ID of the specific type.
 *       500:
 *         description: Server error.
 */
router.get('/prereqs/all', getAllFeatPrereqs);

/**
 * @swagger
 * /api/admin/feats/prereqs/{id}:
 *   get:
 *     summary: Retrieve a single feat prerequisite by ID.
 *     description: Fetches a single feat prerequisite based on its ID.
 *     tags:
 *       - Admin - Feats
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the feat prerequisite to retrieve.
 *     responses:
 *       200:
 *         description: A single feat prerequisite.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 prereq_id:
 *                   type: integer
 *                   description: The prerequisite ID.
 *                 feat_id:
 *                   type: integer
 *                   description: The associated feat ID.
 *                 prereq_type:
 *                   type: integer
 *                   description: The type of prerequisite.
 *                 prereq_amount:
 *                   type: integer
 *                   description: The amount required for the prerequisite.
 *                 prereq_type_id:
 *                   type: integer
 *                   description: The ID of the specific type.
 *       404:
 *         description: Feat prerequisite not found.
 *       500:
 *         description: Server error.
 */
router.get('/prereqs/:id', getFeatPrereqById);

/**
 * @swagger
 * /api/admin/feats/prereqs:
 *   post:
 *     summary: Create a new feat prerequisite.
 *     description: Adds a new feat prerequisite to the database. Requires admin authentication.
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
 *               - feat_id
 *               - prereq_type
 *             properties:
 *               feat_id:
 *                 type: integer
 *                 description: The ID of the associated feat.
 *               prereq_type:
 *                 type: integer
 *                 description: The type of prerequisite.
 *               prereq_amount:
 *                 type: integer
 *                 description: The amount required for the prerequisite.
 *               prereq_type_id:
 *                 type: integer
 *                 description: The ID of the specific prerequisite type.
 *     responses:
 *       201:
 *         description: Feat prerequisite created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The ID of the newly created feat prerequisite.
 *                 message:
 *                   type: string
 *                   description: Success message.
 *       401:
 *         description: Unauthorized, admin privileges required.
 *       500:
 *         description: Server error.
 */
router.post('/prereqs', requireAdmin, createFeatPrereq);

/**
 * @swagger
 * /api/admin/feats/prereqs/{id}:
 *   put:
 *     summary: Update an existing feat prerequisite.
 *     description: Updates a feat prerequisite by its ID. Requires admin authentication.
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
 *         description: The ID of the feat prerequisite to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               feat_id:
 *                 type: integer
 *                 description: The ID of the associated feat.
 *               prereq_type:
 *                 type: integer
 *                 description: The type of prerequisite.
 *               prereq_amount:
 *                 type: integer
 *                 description: The amount required for the prerequisite.
 *               prereq_type_id:
 *                 type: integer
 *                 description: The ID of the specific prerequisite type.
 *     responses:
 *       200:
 *         description: Feat prerequisite updated successfully.
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
 *         description: Feat prerequisite not found.
 *       500:
 *         description: Server error.
 */
router.put('/prereqs/:id', requireAdmin, updateFeatPrereq);

/**
 * @swagger
 * /api/admin/feats/prereqs/{id}:
 *   delete:
 *     summary: Delete a feat prerequisite by ID.
 *     description: Deletes a feat prerequisite by its ID. Requires admin authentication.
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
 *         description: The ID of the feat prerequisite to delete.
 *     responses:
 *       204:
 *         description: Feat prerequisite deleted successfully.
 *       401:
 *         description: Unauthorized, admin privileges required.
 *       404:
 *         description: Feat prerequisite not found.
 *       500:
 *         description: Server error.
 */
router.delete('/prereqs/:id', requireAdmin, deleteFeatPrereq);

export default router; 