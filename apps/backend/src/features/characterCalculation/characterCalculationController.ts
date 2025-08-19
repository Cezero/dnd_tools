import { Response } from 'express';

import { ValidatedParamsT } from '@/util/validated-types';
import { CharacterIdParamRequest } from '@shared/schema';

import { characterCalculationService } from './characterCalculationService';
import { characterService } from '../character/characterService';

/**
 * Get calculated character stats including analog skills
 */
export async function GetCharacterCalculatedStats(
    req: ValidatedParamsT<CharacterIdParamRequest, unknown>,
    res: Response
) {
    try {
        // Get the character with all details
        const character = await characterService.getCharacterWithAllDetails(req.params);

        if (!character) {
            res.status(404).json({ error: 'Character not found' });
            return;
        }

        // Calculate character stats
        const calculatedStats = await characterCalculationService.calculateCharacterStats(character);

        res.json(calculatedStats);
    } catch (error) {
        console.error('Error calculating character stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Get analog skills for a character
 */
export async function GetCharacterAnalogSkills(
    req: ValidatedParamsT<CharacterIdParamRequest, unknown>,
    res: Response
) {
    try {
        // Get the character with all details
        const character = await characterService.getCharacterWithAllDetails(req.params);

        if (!character) {
            res.status(404).json({ error: 'Character not found' });
            return;
        }

        // Get analog skills
        const analogSkills = await characterCalculationService.getCharacterAnalogSkills(character);

        res.json({ analogSkills });
    } catch (error) {
        console.error('Error getting character analog skills:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
