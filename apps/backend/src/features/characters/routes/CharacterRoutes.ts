import express, { RequestHandler } from 'express';
import {
    GetAllCharacters,
    GetCharacterById,
    CreateCharacter,
    UpdateCharacter,
    DeleteCharacter
} from '../controllers/CharacterController.js';

export const CharacterRouter = express.Router();

/**
 * @swagger
 * /api/characters:
 *   get:
 *     summary: Retrieve a list of characters with pagination and filters.
 *     description: Fetches a paginated list of characters. Can be filtered by name and user ID.
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
 *           enum: [name, createdAt, age]
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
 *         description: Filter characters by name (case-insensitive, partial match).
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter characters by user ID.
 *     responses:
 *       200:
 *         description: A list of characters.
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
 *                   description: The total number of characters.
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: The character ID.
 *                       name:
 *                         type: string
 *                         description: The character name.
 *                       userId:
 *                         type: integer
 *                         description: The user ID.
 *                       raceId:
 *                         type: integer
 *                         description: The race ID.
 *                       alignmentId:
 *                         type: integer
 *                         description: The alignment ID.
 *                       age:
 *                         type: integer
 *                         description: The character age.
 *                       height:
 *                         type: string
 *                         description: The character height.
 *                       weight:
 *                         type: string
 *                         description: The character weight.
 *                       eyes:
 *                         type: string
 *                         description: The character eye color.
 *                       hair:
 *                         type: string
 *                         description: The character hair color.
 *                       race_name:
 *                         type: string
 *                         description: The race name.
 *       500:
 *         description: Server error.
 */
CharacterRouter.get('/', GetAllCharacters as RequestHandler);

/**
 * @swagger
 * /api/characters/{id}:
 *   get:
 *     summary: Retrieve a single character by ID.
 *     description: Fetches a single character based on its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the character to retrieve.
 *     responses:
 *       200:
 *         description: A single character.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The character ID.
 *                 name:
 *                   type: string
 *                   description: The character name.
 *                 userId:
 *                   type: integer
 *                   description: The user ID.
 *                 raceId:
 *                   type: integer
 *                   description: The race ID.
 *                 alignmentId:
 *                   type: integer
 *                   description: The alignment ID.
 *                 age:
 *                   type: integer
 *                   description: The character age.
 *                 height:
 *                   type: string
 *                   description: The character height.
 *                 weight:
 *                   type: string
 *                   description: The character weight.
 *                 eyes:
 *                   type: string
 *                   description: The character eye color.
 *                 hair:
 *                   type: string
 *                   description: The character hair color.
 *                 race_name:
 *                   type: string
 *                   description: The race name.
 *       404:
 *         description: Character not found.
 *       500:
 *         description: Server error.
 */
CharacterRouter.get('/:id', GetCharacterById as unknown as RequestHandler);

/**
 * @swagger
 * /api/characters:
 *   post:
 *     summary: Create a new character.
 *     description: Creates a new character with the provided data.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - name
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: The user ID.
 *               name:
 *                 type: string
 *                 description: The character name.
 *               raceId:
 *                 type: integer
 *                 description: The race ID.
 *               alignmentId:
 *                 type: integer
 *                 description: The alignment ID.
 *               age:
 *                 type: integer
 *                 description: The character age.
 *               height:
 *                 type: string
 *                 description: The character height.
 *               weight:
 *                 type: string
 *                 description: The character weight.
 *               eyes:
 *                 type: string
 *                 description: The character eye color.
 *               hair:
 *                 type: string
 *                 description: The character hair color.
 *     responses:
 *       201:
 *         description: Character created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The ID of the newly created character.
 *                 message:
 *                   type: string
 *                   description: Success message.
 *       400:
 *         description: Bad request, validation error.
 *       500:
 *         description: Server error.
 */
CharacterRouter.post('/', CreateCharacter as RequestHandler);

/**
 * @swagger
 * /api/characters/{id}:
 *   put:
 *     summary: Update an existing character.
 *     description: Updates a character by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the character to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - name
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: The user ID.
 *               name:
 *                 type: string
 *                 description: The character name.
 *               raceId:
 *                 type: integer
 *                 description: The race ID.
 *               alignmentId:
 *                 type: integer
 *                 description: The alignment ID.
 *               age:
 *                 type: integer
 *                 description: The character age.
 *               height:
 *                 type: string
 *                 description: The character height.
 *               weight:
 *                 type: string
 *                 description: The character weight.
 *               eyes:
 *                 type: string
 *                 description: The character eye color.
 *               hair:
 *                 type: string
 *                 description: The character hair color.
 *     responses:
 *       200:
 *         description: Character updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message.
 *       400:
 *         description: Bad request, validation error.
 *       404:
 *         description: Character not found.
 *       500:
 *         description: Server error.
 */
CharacterRouter.put('/:id', UpdateCharacter as unknown as RequestHandler);

/**
 * @swagger
 * /api/characters/{id}:
 *   delete:
 *     summary: Delete a character by ID.
 *     description: Deletes a character by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the character to delete.
 *     responses:
 *       200:
 *         description: Character deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message.
 *       404:
 *         description: Character not found.
 *       500:
 *         description: Server error.
 */
CharacterRouter.delete('/:id', DeleteCharacter as unknown as RequestHandler); 