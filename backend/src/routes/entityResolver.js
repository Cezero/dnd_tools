import express from 'express';
import { timedQuery } from '../db/queryTimer.js';
import { getTableNameForType } from '../db/schemaUtil.js';

const entityResolverRouter = express.Router();

entityResolverRouter.post('/resolve', async (req, res) => {
    const { queries } = req.body;

    const results = {};
    const groupedQueries = {};

    for (const { type, name } of queries) {
        if (!groupedQueries[type]) {
            groupedQueries[type] = [];
        }
        groupedQueries[type].push(name);
    }

    for (const type in groupedQueries) {
        const names = groupedQueries[type];
        const table = getTableNameForType(type);
        const placeholders = names.map(() => '?').join(', ');
        if (table === 'spells') {
            const { rows } = await timedQuery(
                `SELECT spell_id, spell_name FROM spells WHERE spell_name IN (${placeholders})`,
                names,
                `Resolve ${type}:${names.join(', ')}`
            );
            results[`${type.toLowerCase()}`] = {};
            for (const row of rows) {
                results[`${type.toLowerCase()}`][row.spell_name.toLowerCase()] = row.spell_id;
            }
        } else {
            throw new Error(`Unknown type: ${type}`);
        }
    }
    res.json(results);
});

export default entityResolverRouter;