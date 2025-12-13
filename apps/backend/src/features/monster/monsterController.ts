import { Response } from 'express';

import {
    ValidatedParamsT,
    ValidatedParamsBodyT,
    ValidatedNoInput,
    ValidatedQueryT,
} from '@/util/validated-types';
import {
    MonsterIdParamRequest,
    GetAllMonstersQueryRequest,
    UpdateMonsterRequest,
    GetMonsterResponse,
    GetAllMonstersResponse,
    MonsterCacheResponse,
    UpdateResponse,
} from '@shared/schema';

import { monsterService } from './monsterService';

export async function GetAllMonsters(
    req: ValidatedQueryT<GetAllMonstersQueryRequest, GetAllMonstersResponse>,
    res: Response
) {
    const includeStatblockOnly = req.query?.includeStatblockOnly ?? false;
    const result = await monsterService.getAllMonsters(includeStatblockOnly);
    res.json(result);
}

export async function GetMonsterById(
    req: ValidatedParamsT<MonsterIdParamRequest, GetMonsterResponse>,
    res: Response
) {
    const monster = await monsterService.getMonsterById({ id: req.params.id });

    if (!monster) {
        res.status(404).json({ error: `Monster not found: ${req.params.id}` });
        return;
    }

    res.json(monster);
}

export async function UpdateMonster(
    req: ValidatedParamsBodyT<MonsterIdParamRequest, UpdateMonsterRequest>,
    res: Response
) {
    const result = await monsterService.updateMonster({ id: req.params.id }, req.body);
    res.json(result);
}

export async function DeleteMonster(
    req: ValidatedParamsT<MonsterIdParamRequest, UpdateResponse>,
    res: Response
) {
    await monsterService.deleteMonster({ id: req.params.id });
    res.json({ message: 'Monster deleted successfully' });
}

export async function GetMonsterCache(
    req: ValidatedNoInput<MonsterCacheResponse>,
    res: Response
) {
    const monsters = await monsterService.getMonsterCache();
    res.json(monsters);
}

