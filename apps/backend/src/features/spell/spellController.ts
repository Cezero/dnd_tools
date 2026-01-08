import { Response } from 'express';

import { ValidatedParamsT, ValidatedParamsBodyT, ValidatedNoInput, ValidatedBodyT, ValidatedQueryT } from '@/util/validated-types'
import { SpellIdParamRequest, SpellClassParamRequest, UpdateSpellRequest, GetSpellResponse, GetAllSpellsResponse, ClassSpellListResponse, SpellCacheResponse } from '@shared/schema';

import { spellService } from './spellService';

export async function GetAllSpells(req: ValidatedNoInput<GetAllSpellsResponse>, res: Response) {
    const result = await spellService.getAllSpells();
    res.json(result);
}

export async function GetSpellById(req: ValidatedParamsT<SpellIdParamRequest, GetSpellResponse>, res: Response) {
    const spell = await spellService.getSpellById(req.params);

    if (!spell) {
        res.status(404).json({ error: `Spell not found: ${req.params.id}` });
        return;
    }

    res.json(spell);
}

export async function UpdateSpell(req: ValidatedParamsBodyT<SpellIdParamRequest, UpdateSpellRequest>, res: Response) {
    const result = await spellService.updateSpell(req.params, req.body);
    res.json(result);
}

export async function DeleteSpell(req: ValidatedParamsT<SpellIdParamRequest>, res: Response) {
    await spellService.deleteSpell(req.params);
    res.json({ message: 'Spell deleted successfully' });
}

export async function GetSpellsForClass(req: ValidatedParamsT<SpellClassParamRequest, ClassSpellListResponse>, res: Response) {
    try {
        const { classId, level } = req.params;
        const result = await spellService.getSpellsForClass(classId, level);
        res.json(result);
    } catch (_error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function GetSpellCache(req: ValidatedNoInput<SpellCacheResponse>, res: Response) {
    const spells = await spellService.getSpellCache();
    res.json(spells);
}
