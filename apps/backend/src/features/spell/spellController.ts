import { Request, Response } from 'express';

import { spellService } from './spellService';
import type { SpellUpdateRequest } from './types';
import { SpellQuerySchema } from '@shared/schema';

export async function GetSpells(req: Request, res: Response) {
    try {
        // Validate and transform query parameters using Zod schema
        const validatedQuery = SpellQuerySchema.parse(req.query);

        const result = await spellService.getAllSpells(validatedQuery);
        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Error fetching spells:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch spells',
        });
    }
}

export async function GetSpellById(req: Request<{ id: string }>, res: Response) {
    const spellId = parseInt(req.params.id);
    if (isNaN(spellId)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid spell ID'
        });
    }

    try {
        const spell = await spellService.getSpellById(spellId);

        if (!spell) {
            return res.status(404).json({
                success: false,
                error: `Spell not found: ${spellId}`
            });
        }

        res.json({
            success: true,
            data: spell,
        });
    } catch (error) {
        console.error('Error fetching spell by ID:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch spell',
        });
    }
}

export async function UpdateSpell(req: SpellUpdateRequest, res: Response) {
    const spellId = parseInt(req.params.id);
    if (isNaN(spellId)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid spell ID'
        });
    }

    try {
        const result = await spellService.updateSpell(spellId, req.body);
        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Error updating spell:', error);
        if (error instanceof Error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to update spell',
            });
        }
    }
}

export async function Resolve(spellNames: string[]) {
    return spellService.resolveSpellNames(spellNames);
} 