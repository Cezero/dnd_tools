import { Response } from 'express';

import { BadRequestError } from '@/errors/BadRequestError';
import { prisma } from '@/lib/prisma';
import { ValidatedParamsT, ValidatedParamsBodyT, ValidatedParamsQueryT } from '@/util/validated-types';
import {
    CharacterIdParamRequest,
    CharacterSelectedFormIdParamRequest,
    CreateCharacterSelectedFormRequest,
    EligibleFormsQueryRequest,
    GetAllCharacterSelectedFormsResponse,
    GetEligibleFormsResponse,
    GetResolvedSelectedFormsResponse,
    UpdateCharacterSelectedFormRequest,
} from '@shared/schema';
import { DraftType } from '@shared/static-data';

import { DraftLockService } from '../shared/draftState/DraftLockService';

import { selectedFormService } from './selectedFormService.js';

const draftLockService = new DraftLockService();

/**
 * Confirms the authenticated user owns the character.
 */
async function requireCharacterOwner(characterId: number, userId: number | undefined, res: Response): Promise<boolean> {
    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return false;
    }
    if (characterId < 0) {
        const lockedBy = await draftLockService.checkLock(DraftType.Character, characterId);
        if (lockedBy !== userId) {
            res.status(403).json({ error: 'You do not have permission to modify this character' });
            return false;
        }
        return true;
    }
    const character = await prisma.character.findUnique({
        where: { id: characterId },
        select: { userId: true },
    });
    if (!character) {
        res.status(404).json({ error: 'Character not found' });
        return false;
    }
    if (character.userId !== userId) {
        res.status(403).json({ error: 'You do not have permission to modify this character' });
        return false;
    }
    return true;
}

function handleWriteError(error: unknown, res: Response): boolean {
    if (error instanceof BadRequestError) {
        res.status(400).json({ error: error.message });
        return true;
    }
    return false;
}

/**
 * GET /api/characters/:id/selected-forms
 */
export async function GetSelectedForms(
    req: ValidatedParamsT<CharacterIdParamRequest, GetAllCharacterSelectedFormsResponse>,
    res: Response
) {
    if (!(await requireCharacterOwner(req.params.id, req.user?.id, res))) {
        return;
    }
    const forms = await selectedFormService.getSelectedForms(req.params.id);
    res.json(forms);
}

/**
 * GET /api/characters/:id/selected-forms/resolved
 */
export async function GetResolvedSelectedForms(
    req: ValidatedParamsT<CharacterIdParamRequest, GetResolvedSelectedFormsResponse>,
    res: Response
) {
    if (!(await requireCharacterOwner(req.params.id, req.user?.id, res))) {
        return;
    }
    const forms = await selectedFormService.getResolvedSelectedForms(req.params.id);
    res.json(forms);
}

/**
 * GET /api/characters/:id/eligible-forms?featureId=
 */
export async function GetEligibleForms(
    req: ValidatedParamsQueryT<CharacterIdParamRequest, EligibleFormsQueryRequest, GetEligibleFormsResponse>,
    res: Response
) {
    if (!(await requireCharacterOwner(req.params.id, req.user?.id, res))) {
        return;
    }
    try {
        const forms = await selectedFormService.getEligibleForms(req.params.id, req.query.featureId);
        res.json(forms);
    } catch (error) {
        if (handleWriteError(error, res)) {
            return;
        }
        throw error;
    }
}

/**
 * POST /api/characters/:id/selected-forms
 */
export async function CreateSelectedForm(
    req: ValidatedParamsBodyT<CharacterIdParamRequest, CreateCharacterSelectedFormRequest, GetAllCharacterSelectedFormsResponse>,
    res: Response
) {
    if (!(await requireCharacterOwner(req.params.id, req.user?.id, res))) {
        return;
    }
    try {
        const created = await selectedFormService.createSelectedForm({
            ...req.body,
            characterId: req.params.id,
        });
        res.status(201).json(created);
    } catch (error) {
        if (handleWriteError(error, res)) {
            return;
        }
        throw error;
    }
}

/**
 * PUT /api/characters/selected-forms/:id
 */
export async function UpdateSelectedForm(
    req: ValidatedParamsBodyT<CharacterSelectedFormIdParamRequest, UpdateCharacterSelectedFormRequest, GetAllCharacterSelectedFormsResponse>,
    res: Response
) {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const existing = await prisma.characterSelectedForm.findUnique({
        where: { id: req.params.id },
        include: { character: { select: { userId: true } } },
    });
    if (!existing) {
        res.status(404).json({ error: 'Selected form not found' });
        return;
    }
    if (existing.character.userId !== userId) {
        res.status(403).json({ error: 'You do not have permission to update this form' });
        return;
    }
    try {
        const updated = await selectedFormService.updateSelectedForm(req.body, req.params);
        res.json(updated);
    } catch (error) {
        if (handleWriteError(error, res)) {
            return;
        }
        throw error;
    }
}

/**
 * DELETE /api/characters/selected-forms/:id
 */
export async function DeleteSelectedForm(
    req: ValidatedParamsT<CharacterSelectedFormIdParamRequest, void>,
    res: Response
) {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const existing = await prisma.characterSelectedForm.findUnique({
        where: { id: req.params.id },
        include: { character: { select: { userId: true } } },
    });
    if (!existing) {
        res.status(404).json({ error: 'Selected form not found' });
        return;
    }
    if (existing.character.userId !== userId) {
        res.status(403).json({ error: 'You do not have permission to delete this form' });
        return;
    }
    await selectedFormService.deleteSelectedForm(req.params);
    res.json({ message: 'Selected form deleted successfully' });
}
