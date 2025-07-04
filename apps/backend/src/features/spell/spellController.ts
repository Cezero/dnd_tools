import { Response } from 'express';

import { ValidatedQueryT, ValidatedParamsT, ValidatedParamsBodyT } from '@/util/validated-types'
import { SpellIdParamRequest, SpellQueryRequest, SpellQueryResponse, UpdateSpellRequest, GetSpellResponse } from '@shared/schema';

import { spellService } from './spellService';

export async function GetSpells(req: ValidatedQueryT<SpellQueryRequest, SpellQueryResponse>, res: Response) {
    const result = await spellService.getSpells(req.query);
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