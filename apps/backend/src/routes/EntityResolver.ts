import express, { Request, Response } from 'express';
import { EntityResolvers } from '../lib/Resolvers.js';

export const EntityResolverRouter = express.Router();

EntityResolverRouter.post('/resolve', async (req: Request, res: Response) => {
    const { queries } = req.body as { queries: Array<{ type: string; name: string }> };

    const results: Record<string, any> = {};
    const groupedQueries: Record<string, string[]> = {};

    for (const { type, name } of queries) {
        if (!groupedQueries[type]) {
            groupedQueries[type] = [];
        }
        groupedQueries[type].push(name);
    }

    for (const type in groupedQueries) {
        const names = groupedQueries[type];
        const resolver = EntityResolvers[type.toLowerCase()];

        if (resolver) {
            const resolvedData = await resolver(names);
            results[type.toLowerCase()] = resolvedData;
        } else {
            throw new Error(`Unknown or unsupported entity type for resolution: ${type}`);
        }
    }
    res.json(results);
}); 