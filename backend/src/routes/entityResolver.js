import express from 'express';
import { entityResolvers } from '../lib/resolvers.js';
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
        const resolver = entityResolvers[getTableNameForType(type)];

        if (resolver) {
            const resolvedData = await resolver(names);
            results[type.toLowerCase()] = resolvedData;
        } else {
            throw new Error(`Unknown or unsupported entity type for resolution: ${type}`);
        }
    }
    res.json(results);
});

export default entityResolverRouter;