import { Response } from 'express';

import { ValidatedParamsT, ValidatedParamsBodyT, ValidatedNoInput } from '@/util/validated-types'
import { SpellIdParamRequest, SpellClassParamRequest, UpdateSpellRequest, GetSpellResponse, GetAllSpellsResponse, ClassSpellListResponse } from '@shared/schema';

import { spellService } from './spellService';

export async function GetAllSpells(req: ValidatedNoInput<GetAllSpellsResponse>, res: Response) {
    const result = await spellService.getAllSpells();
    res.json(result);
}

export async function GetSpellById(req: ValidatedParamsT<SpellIdParamRequest, GetSpellResponse>, res: Response) {
    const spell = await spellService.getSpellById({ id: req.params.id });

    if (!spell) {
        res.status(404).json({ error: `Spell not found: ${req.params.id}` });
        return;
    }

    res.json(spell);
}

export async function UpdateSpell(req: ValidatedParamsBodyT<SpellIdParamRequest, UpdateSpellRequest>, res: Response) {
    const result = await spellService.updateSpell({ id: req.params.id }, req.body);
    res.json(result);
}

export async function DeleteSpell(req: ValidatedParamsT<SpellIdParamRequest>, res: Response) {
    await spellService.deleteSpell({ id: req.params.id });
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
