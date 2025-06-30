import express, { RequestHandler } from 'express';

import {
    ReferenceTableQuerySchema,
    ReferenceTableIdentifierParamSchema,
    CreateReferenceTableSchema,
    UpdateReferenceTableSchema
} from '@shared/schema';

import {
    GetReferenceTables,
    GetReferenceTable,
    CreateReferenceTable,
    UpdateReferenceTable,
    DeleteReferenceTable,
} from './referenceTableController.js';
import { requireAdmin } from '../../middleware/authMiddleware.js';
import { validateRequest } from '../../middleware/validateRequest.js';

export const ReferenceTableRouter = express.Router();

/**
 * @swagger
 * /api/admin/referencetables:
 *   get:
 *     summary: Retrieve a list of reference tables with pagination and filters.
 *     description: Fetches a paginated list of reference tables. Can be filtered by name and slug.
 *     tags:
 *       - Admin - Reference Tables
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
 *           default: 25
 *         description: The number of items per page.
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, slug]
 *           default: name
 *         description: The field to sort by.
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: The sort order.
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter tables by name (case-insensitive, partial match).
 *       - in: query
 *         name: slug
 *         schema:
 *           type: string
 *         description: Filter tables by slug (case-insensitive, partial match).
 *     responses:
 *       200:
 *         description: A list of reference tables.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                   description: The current page number.
 *                 limit:
 *                   type: integer
 *                   description: The number of items per page.
 *                 total:
 *                   type: integer
 *                   description: The total number of tables.
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: The table ID.
 *                       name:
 *                         type: string
 *                         description: The table name.
 *                       description:
 *                         type: string
 *                         description: The table description.
 *                       slug:
 *                         type: string
 *                         description: The table slug.
 *                       row_count:
 *                         type: integer
 *                         description: The number of rows in the table.
 *                       column_count:
 *                         type: integer
 *                         description: The number of columns in the table.
 *       500:
 *         description: Server error.
 */
ReferenceTableRouter.get('/', validateRequest({ query: ReferenceTableQuerySchema }) as RequestHandler, GetReferenceTables as RequestHandler);

/**
 * @swagger
 * /api/admin/referencetables/{identifier}:
 *   get:
 *     summary: Retrieve a single reference table by ID or slug.
 *     description: Fetches a single reference table based on its ID or slug, including all columns, rows, and cells.
 *     tags:
 *       - Admin - Reference Tables
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           oneOf:
 *             - type: integer
 *             - type: string
 *         description: The ID or slug of the reference table to retrieve.
 *     responses:
 *       200:
 *         description: A single reference table with its complete structure.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 table:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: The table ID.
 *                     name:
 *                       type: string
 *                       description: The table name.
 *                     description:
 *                       type: string
 *                       description: The table description.
 *                     slug:
 *                       type: string
 *                       description: The table slug.
 *                 headers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: The column ID.
 *                       header:
 *                         type: string
 *                         description: The column header.
 *                       columnIndex:
 *                         type: integer
 *                         description: The column index.
 *                       alignment:
 *                         type: string
 *                         description: The column alignment.
 *                 rows:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: The row ID.
 *                       rowIndex:
 *                         type: integer
 *                         description: The row index.
 *                       label:
 *                         type: string
 *                         description: The row label.
 *                       cells:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             rowId:
 *                               type: integer
 *                               description: The row ID.
 *                             columnId:
 *                               type: integer
 *                               description: The column ID.
 *                             value:
 *                               type: string
 *                               description: The cell value.
 *                             colSpan:
 *                               type: integer
 *                               description: The column span.
 *                             rowSpan:
 *                               type: integer
 *                               description: The row span.
 *       404:
 *         description: Reference table not found.
 *       500:
 *         description: Server error.
 */
ReferenceTableRouter.get('/:identifier', validateRequest({ params: ReferenceTableIdentifierParamSchema }) as RequestHandler, GetReferenceTable as unknown as RequestHandler);

/**
 * @swagger
 * /api/admin/referencetables:
 *   post:
 *     summary: Create a new reference table.
 *     description: Creates a new reference table with the provided data. Requires admin authentication.
 *     tags:
 *       - Admin - Reference Tables
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
 *               - slug
 *               - headers
 *               - rows
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the reference table.
 *               description:
 *                 type: string
 *                 description: The description of the reference table.
 *               slug:
 *                 type: string
 *                 description: The slug of the reference table.
 *               headers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     header:
 *                       type: string
 *                       description: The column header.
 *                     alignment:
 *                       type: string
 *                       description: The column alignment.
 *               rows:
 *                 type: array
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       column_index:
 *                         type: integer
 *                         description: The column index.
 *                       value:
 *                         type: string
 *                         description: The cell value.
 *                       col_span:
 *                         type: integer
 *                         description: The column span.
 *                       row_span:
 *                         type: integer
 *                         description: The row span.
 *     responses:
 *       201:
 *         description: Reference table created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The ID of the newly created reference table.
 *                 message:
 *                   type: string
 *                   description: Success message.
 *       400:
 *         description: Bad request, missing required fields.
 *       401:
 *         description: Unauthorized, admin privileges required.
 *       500:
 *         description: Server error.
 */
ReferenceTableRouter.post('/', requireAdmin as RequestHandler, validateRequest({ body: CreateReferenceTableSchema }) as RequestHandler, CreateReferenceTable as RequestHandler);

/**
 * @swagger
 * /api/admin/referencetables/{id}:
 *   put:
 *     summary: Update an existing reference table.
 *     description: Updates a reference table by its ID. Requires admin authentication.
 *     tags:
 *       - Admin - Reference Tables
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the reference table to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - slug
 *               - headers
 *               - rows
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the reference table.
 *               description:
 *                 type: string
 *                 description: The description of the reference table.
 *               slug:
 *                 type: string
 *                 description: The slug of the reference table.
 *               headers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     header:
 *                       type: string
 *                       description: The column header.
 *                     alignment:
 *                       type: string
 *                       description: The column alignment.
 *               rows:
 *                 type: array
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       column_index:
 *                         type: integer
 *                         description: The column index.
 *                       value:
 *                         type: string
 *                         description: The cell value.
 *                       col_span:
 *                         type: integer
 *                         description: The column span.
 *                       row_span:
 *                         type: integer
 *                         description: The row span.
 *     responses:
 *       200:
 *         description: Reference table updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message.
 *       400:
 *         description: Bad request, missing required fields.
 *       401:
 *         description: Unauthorized, admin privileges required.
 *       404:
 *         description: Reference table not found.
 *       500:
 *         description: Server error.
 */
ReferenceTableRouter.put('/:identifier', requireAdmin as RequestHandler, validateRequest({ params: ReferenceTableIdentifierParamSchema, body: UpdateReferenceTableSchema }) as RequestHandler, UpdateReferenceTable as unknown as RequestHandler);

/**
 * @swagger
 * /api/admin/referencetables/{id}:
 *   delete:
 *     summary: Delete a reference table by ID.
 *     description: Deletes a reference table by its ID. Requires admin authentication.
 *     tags:
 *       - Admin - Reference Tables
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the reference table to delete.
 *     responses:
 *       200:
 *         description: Reference table deleted successfully.
 *       401:
 *         description: Unauthorized, admin privileges required.
 *       404:
 *         description: Reference table not found.
 *       500:
 *         description: Server error.
 */
ReferenceTableRouter.delete('/:identifier', requireAdmin as RequestHandler, validateRequest({ params: ReferenceTableIdentifierParamSchema }) as RequestHandler, DeleteReferenceTable as unknown as RequestHandler); 