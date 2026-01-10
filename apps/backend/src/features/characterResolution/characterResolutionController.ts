import { Response, NextFunction } from 'express';
import type { ValidatedParamsT, ValidatedParamsBodyT, ValidatedBodyT } from '@/util/validated-types';
import { CharacterResolutionService } from './characterResolutionService';
import { CharacterSessionService } from './characterSessionService';
import { ResolvedFeatureService } from './resolvedFeatureService';
import { AvailableFeatService } from './availableFeatService';
import { characterService } from '../character/characterService';
import { raceService } from '../race/raceService';
import { classService } from '../class/classService';
import { featService } from '../feat/featService';
import type { CharacterEditState, ResolutionResult, CharacterUpdate, UserChoices } from './types';
import type { ResolvedCharacterResult } from './characterSessionService';
import type { CharacterWithAllDetailsResponse, FeatInQueryResponse } from '@shared/schema';

/**
 * Initialize a new resolution session
 */
export async function InitializeSession(
    req: ValidatedParamsT<{ characterId: string }, ResolvedCharacterResult>,
    res: Response,
    _next: NextFunction
) {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    const characterId = typeof req.params.characterId === 'string' 
        ? parseInt(req.params.characterId, 10)
        : req.params.characterId;
    if (isNaN(characterId)) {
        res.status(400).json({ error: 'Invalid character ID' });
        return;
    }

    try {
        // Load character with all details
        const character = await characterService.getCharacterWithAllDetails({ id: characterId });
        if (!character) {
            res.status(404).json({ error: 'Character not found' });
            return;
        }

        // Verify ownership
        if (character.userId !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // Load race and class details
        const raceDetails = character.raceId ? await raceService.getRaceById({ id: character.raceId }) : null;
        const classDetails = character.advancements?.[0]?.classId
            ? await classService.getClassById({ id: character.advancements[0].classId })
            : null;
        const secondaryClassDetails = character.advancements?.[0]?.secondaryClassId
            ? await classService.getClassById({ id: character.advancements[0].secondaryClassId })
            : null;

        // Calculate target level
        const targetLevel = character.level || 1;
        const advancement = character.advancements?.find(adv => adv.level === targetLevel);

        // Create initial resolution context (without user choices)
        const initialContext = {
            character,
            targetLevel,
            advancement,
            raceDetails,
            classDetails,
            secondaryClassDetails,
            isGestalt: !!secondaryClassDetails,
            userChoices: undefined, // No user choices yet
            includePendingChoices: false, // Don't include pending choices in first pass
            resolveCascading: false, // Don't resolve cascading in first pass
            maxResolutionDepth: 10,
        };

        // First pass: Resolve base features to get progressions
        const firstPassResult = await CharacterResolutionService.resolveCharacterFeatures(
            character,
            targetLevel,
            initialContext
        );

        // Extract user choices from character feature choices by looking up entities in resolved progressions
        const userChoices: UserChoices = {};
        if (character.advancements) {
            for (const adv of character.advancements) {
                if (adv.featureChoices) {
                    for (const choice of adv.featureChoices) {
                        // Find the entity in resolved progressions to get appliesTo type
                        for (const progression of firstPassResult.resolvedProgressions) {
                            if (progression.id === choice.progressionId && progression.entities) {
                                const entity = progression.entities.find(e => e.id === choice.featureEntityId);
                                if (entity && choice.appliesToId) {
                                    const appliesToType = entity.appliesTo;
                                    if (!userChoices[appliesToType]) {
                                        userChoices[appliesToType] = [];
                                    }
                                    if (!userChoices[appliesToType].includes(choice.appliesToId)) {
                                        userChoices[appliesToType].push(choice.appliesToId);
                                    }
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }

        // Second pass: Resolve with user choices included
        const context = {
            character,
            targetLevel,
            advancement,
            raceDetails,
            classDetails,
            secondaryClassDetails,
            isGestalt: !!secondaryClassDetails,
            userChoices: Object.keys(userChoices).length > 0 ? userChoices : undefined,
            includePendingChoices: true,
            resolveCascading: true,
            maxResolutionDepth: 10,
        };

        // Resolve features with user choices
        const resolutionResult = await CharacterResolutionService.resolveCharacterFeatures(
            character,
            targetLevel,
            context
        );

        // Extract derived data
        const classSkills = ResolvedFeatureService.getClassSkills(resolutionResult.resolvedProgressions);
        const skillBonuses = ResolvedFeatureService.getSkillBonuses(resolutionResult.resolvedProgressions);
        const grantedFeats = ResolvedFeatureService.getGrantedFeats(resolutionResult.resolvedProgressions);
        
        // Calculate class levels for available feats
        const classLevels = new Map<number, number>();
        if (character.advancements) {
            for (const adv of character.advancements) {
                const currentLevel = classLevels.get(adv.classId) ?? 0;
                classLevels.set(adv.classId, currentLevel + 1);
                if (adv.secondaryClassId) {
                    const secondaryLevel = classLevels.get(adv.secondaryClassId) ?? 0;
                    classLevels.set(adv.secondaryClassId, secondaryLevel + 1);
                }
            }
        }

        const availableFeats = ResolvedFeatureService.getAvailableFeats(
            resolutionResult.resolvedProgressions,
            targetLevel,
            classLevels
        );
        const availableFighterBonusFeats = ResolvedFeatureService.getAvailableFighterBonusFeats(
            resolutionResult.resolvedProgressions
        );

        // Create character edit state
        const characterState: CharacterEditState = {
            characterId: character.id,
            abilityScores: character.abilityScores?.map(as => ({
                abilityId: as.abilityId,
                value: as.value
            })) || [],
            skillRanks: character.advancements?.flatMap(adv => 
                adv.skillRanks?.map(sr => ({
                    skillId: sr.skillId,
                    skillSubId: sr.skillSubId,
                    customSubtype: sr.customSubtype,
                    pointsSpent: sr.pointsSpent
                })) || []
            ) || [],
            raceId: character.raceId,
            classId: character.advancements?.[0]?.classId || null,
            secondaryClassId: character.advancements?.[0]?.secondaryClassId || null,
            level: targetLevel,
            editionId: character.editionId,
            isGestalt: !!secondaryClassDetails,
            allowVariantClasses: character.allowVariantClasses || false,
            ignoreLevelAdjustment: character.ignoreLevelAdjustment || false,
            featureChoices: character.advancements?.flatMap(adv => adv.featureChoices || []) || [],
            selectedFeats: [], // TODO: Extract from character
            disallowedSources: character.disallowedSources?.map(ds => ({
                sourceType: ds.sourceType,
                sourceId: ds.sourceId
            })) || [],
        };

        // Create session
        const sessionService = new CharacterSessionService();
        const session = await sessionService.createSession(
            character,
            userId,
            characterState,
            resolutionResult
        );

        // Build response
        const result: ResolvedCharacterResult = {
            resolvedProgressions: resolutionResult.resolvedProgressions,
            pendingChoices: resolutionResult.pendingChoices,
            classSkills,
            skillBonuses,
            grantedFeats: grantedFeats.map(f => f.appliesToId!).filter((id): id is number => id !== null),
            availableFeats,
            availableFighterBonusFeats,
            warnings: resolutionResult.warnings,
            errors: resolutionResult.errors,
            sessionId: session.id,
        };

        res.json(result);
    } catch (error) {
        console.error('Error initializing resolution session:', error);
        res.status(500).json({ error: 'Failed to initialize resolution session' });
    }
}

/**
 * Resume an existing resolution session
 */
export async function ResumeSession(
    req: ValidatedParamsT<{ characterId: string }, ResolvedCharacterResult | null>,
    res: Response,
    _next: NextFunction
) {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    const characterId = typeof req.params.characterId === 'string' 
        ? parseInt(req.params.characterId, 10)
        : req.params.characterId;
    if (isNaN(characterId)) {
        res.status(400).json({ error: 'Invalid character ID' });
        return;
    }

    try {
        const sessionService = new CharacterSessionService();
        const session = sessionService.getSession(characterId, userId);

        if (!session) {
            res.json(null);
            return;
        }

        // Build response from session
        const classSkills = ResolvedFeatureService.getClassSkills(session.resolvedResult.resolvedProgressions);
        const skillBonuses = ResolvedFeatureService.getSkillBonuses(session.resolvedResult.resolvedProgressions);
        const grantedFeats = ResolvedFeatureService.getGrantedFeats(session.resolvedResult.resolvedProgressions);
        
        // Calculate class levels for available feats
        const character = await characterService.getCharacterWithAllDetails({ id: characterId });
        const classLevels = new Map<number, number>();
        if (character?.advancements) {
            for (const adv of character.advancements) {
                const currentLevel = classLevels.get(adv.classId) ?? 0;
                classLevels.set(adv.classId, currentLevel + 1);
                if (adv.secondaryClassId) {
                    const secondaryLevel = classLevels.get(adv.secondaryClassId) ?? 0;
                    classLevels.set(adv.secondaryClassId, secondaryLevel + 1);
                }
            }
        }

        const availableFeats = ResolvedFeatureService.getAvailableFeats(
            session.resolvedResult.resolvedProgressions,
            session.characterState.level,
            classLevels
        );
        const availableFighterBonusFeats = ResolvedFeatureService.getAvailableFighterBonusFeats(
            session.resolvedResult.resolvedProgressions
        );

        const result: ResolvedCharacterResult = {
            resolvedProgressions: session.resolvedResult.resolvedProgressions,
            pendingChoices: session.resolvedResult.pendingChoices,
            classSkills,
            skillBonuses,
            grantedFeats: grantedFeats.map(f => f.appliesToId!).filter((id): id is number => id !== null),
            availableFeats,
            availableFighterBonusFeats,
            warnings: session.resolvedResult.warnings,
            errors: session.resolvedResult.errors,
            sessionId: session.id,
        };

        res.json(result);
    } catch (error) {
        console.error('Error resuming resolution session:', error);
        res.status(500).json({ error: 'Failed to resume resolution session' });
    }
}

/**
 * Apply an update to the resolution session
 */
export async function ApplyUpdate(
    req: ValidatedParamsBodyT<{ characterId: string; sessionId: string }, { update: CharacterUpdate }>,
    res: Response,
    _next: NextFunction
) {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    const characterId = parseInt(req.params.characterId);
    const sessionId = req.params.sessionId;

    if (isNaN(characterId)) {
        res.status(400).json({ error: 'Invalid character ID' });
        return;
    }

    try {
        const sessionService = new CharacterSessionService();
        const session = sessionService.getSessionById(sessionId);

        if (!session || session.characterId !== characterId || session.userId !== userId) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        // Apply update to character state
        const updatedState = applyUpdateToState(session.characterState, req.body.update);

        // Re-resolve features with updated state
        const character = await characterService.getCharacterWithAllDetails({ id: characterId });
        if (!character) {
            res.status(404).json({ error: 'Character not found' });
            return;
        }

        // Load race and class details
        const raceDetails = updatedState.raceId ? await raceService.getRaceById({ id: updatedState.raceId }) : null;
        const classDetails = updatedState.classId
            ? await classService.getClassById({ id: updatedState.classId })
            : null;
        const secondaryClassDetails = updatedState.secondaryClassId
            ? await classService.getClassById({ id: updatedState.secondaryClassId })
            : null;

        // Extract user choices from updated state
        const userChoices: UserChoices = {};
        for (const choice of updatedState.featureChoices) {
            // Reconstruct userChoices from featureChoices
            // This is simplified - may need refinement
        }

        const context = {
            character,
            targetLevel: updatedState.level,
            advancement: character.advancements?.find(adv => adv.level === updatedState.level),
            raceDetails,
            classDetails,
            secondaryClassDetails,
            isGestalt: updatedState.isGestalt,
            userChoices,
            includePendingChoices: true,
            resolveCascading: true,
            maxResolutionDepth: 10,
        };

        const resolutionResult = await CharacterResolutionService.resolveCharacterFeatures(
            character,
            updatedState.level,
            context
        );

        // Update session
        await sessionService.updateSession(session.sessionKey, updatedState, resolutionResult);

        // Build response
        const classSkills = ResolvedFeatureService.getClassSkills(resolutionResult.resolvedProgressions);
        const skillBonuses = ResolvedFeatureService.getSkillBonuses(resolutionResult.resolvedProgressions);
        const grantedFeats = ResolvedFeatureService.getGrantedFeats(resolutionResult.resolvedProgressions);
        
        const classLevels = new Map<number, number>();
        if (character.advancements) {
            for (const adv of character.advancements) {
                const currentLevel = classLevels.get(adv.classId) ?? 0;
                classLevels.set(adv.classId, currentLevel + 1);
                if (adv.secondaryClassId) {
                    const secondaryLevel = classLevels.get(adv.secondaryClassId) ?? 0;
                    classLevels.set(adv.secondaryClassId, secondaryLevel + 1);
                }
            }
        }

        const availableFeats = ResolvedFeatureService.getAvailableFeats(
            resolutionResult.resolvedProgressions,
            updatedState.level,
            classLevels
        );
        const availableFighterBonusFeats = ResolvedFeatureService.getAvailableFighterBonusFeats(
            resolutionResult.resolvedProgressions
        );

        const result: ResolvedCharacterResult = {
            resolvedProgressions: resolutionResult.resolvedProgressions,
            pendingChoices: resolutionResult.pendingChoices,
            classSkills,
            skillBonuses,
            grantedFeats: grantedFeats.map(f => f.appliesToId!).filter((id): id is number => id !== null),
            availableFeats,
            availableFighterBonusFeats,
            warnings: resolutionResult.warnings,
            errors: resolutionResult.errors,
            sessionId: session.id,
        };

        res.json(result);
    } catch (error) {
        console.error('Error applying update:', error);
        res.status(500).json({ error: 'Failed to apply update' });
    }
}

/**
 * Get current state of resolution session
 */
export async function GetCurrentState(
    req: ValidatedParamsT<{ characterId: string; sessionId: string }, ResolvedCharacterResult>,
    res: Response,
    _next: NextFunction
) {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    const characterId = parseInt(req.params.characterId);
    const sessionId = req.params.sessionId;

    if (isNaN(characterId)) {
        res.status(400).json({ error: 'Invalid character ID' });
        return;
    }

    try {
        const sessionService = new CharacterSessionService();
        const session = sessionService.getSessionById(sessionId);

        if (!session || session.characterId !== characterId || session.userId !== userId) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        // Build response from session (same as ResumeSession)
        const classSkills = ResolvedFeatureService.getClassSkills(session.resolvedResult.resolvedProgressions);
        const skillBonuses = ResolvedFeatureService.getSkillBonuses(session.resolvedResult.resolvedProgressions);
        const grantedFeats = ResolvedFeatureService.getGrantedFeats(session.resolvedResult.resolvedProgressions);
        
        const character = await characterService.getCharacterWithAllDetails({ id: characterId });
        const classLevels = new Map<number, number>();
        if (character?.advancements) {
            for (const adv of character.advancements) {
                const currentLevel = classLevels.get(adv.classId) ?? 0;
                classLevels.set(adv.classId, currentLevel + 1);
                if (adv.secondaryClassId) {
                    const secondaryLevel = classLevels.get(adv.secondaryClassId) ?? 0;
                    classLevels.set(adv.secondaryClassId, secondaryLevel + 1);
                }
            }
        }

        const availableFeats = ResolvedFeatureService.getAvailableFeats(
            session.resolvedResult.resolvedProgressions,
            session.characterState.level,
            classLevels
        );
        const availableFighterBonusFeats = ResolvedFeatureService.getAvailableFighterBonusFeats(
            session.resolvedResult.resolvedProgressions
        );

        const result: ResolvedCharacterResult = {
            resolvedProgressions: session.resolvedResult.resolvedProgressions,
            pendingChoices: session.resolvedResult.pendingChoices,
            classSkills,
            skillBonuses,
            grantedFeats: grantedFeats.map(f => f.appliesToId!).filter((id): id is number => id !== null),
            availableFeats,
            availableFighterBonusFeats,
            warnings: session.resolvedResult.warnings,
            errors: session.resolvedResult.errors,
            sessionId: session.id,
        };

        res.json(result);
    } catch (error) {
        console.error('Error getting current state:', error);
        res.status(500).json({ error: 'Failed to get current state' });
    }
}

/**
 * Save session to database
 */
export async function SaveSession(
    req: ValidatedParamsT<{ characterId: string; sessionId: string }, { character: CharacterWithAllDetailsResponse }>,
    res: Response,
    _next: NextFunction
) {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    const characterId = parseInt(req.params.characterId);
    const sessionId = req.params.sessionId;

    if (isNaN(characterId)) {
        res.status(400).json({ error: 'Invalid character ID' });
        return;
    }

    try {
        const sessionService = new CharacterSessionService();
        const session = sessionService.getSessionById(sessionId);

        if (!session || session.characterId !== characterId || session.userId !== userId) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        // TODO: Persist session state to MySQL database
        // This will need to update the character, ability scores, skill ranks, feature choices, etc.
        // For now, this is a placeholder

        // Delete session after saving
        await sessionService.deleteSessionById(sessionId);

        // Reload character to return updated data
        const character = await characterService.getCharacterWithAllDetails({ id: characterId });
        if (!character) {
            res.status(404).json({ error: 'Character not found' });
            return;
        }

        res.json({ character });
    } catch (error) {
        console.error('Error saving session:', error);
        res.status(500).json({ error: 'Failed to save session' });
    }
}

/**
 * Cancel session without saving
 */
export async function CancelSession(
    req: ValidatedParamsT<{ characterId: string; sessionId: string }, { success: boolean }>,
    res: Response,
    _next: NextFunction
) {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    const characterId = parseInt(req.params.characterId);
    const sessionId = req.params.sessionId;

    if (isNaN(characterId)) {
        res.status(400).json({ error: 'Invalid character ID' });
        return;
    }

    try {
        const sessionService = new CharacterSessionService();
        const session = sessionService.getSessionById(sessionId);

        if (!session || session.characterId !== characterId || session.userId !== userId) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        await sessionService.deleteSessionById(sessionId);

        res.json({ success: true });
    } catch (error) {
        console.error('Error canceling session:', error);
        res.status(500).json({ error: 'Failed to cancel session' });
    }
}

/**
 * Apply an update to character state
 */
function applyUpdateToState(state: CharacterEditState, update: CharacterUpdate): CharacterEditState {
    const newState = { ...state };

    switch (update.type) {
        case 'SET_ABILITY_SCORE':
            const abilityIndex = newState.abilityScores.findIndex(as => as.abilityId === update.payload.abilityId);
            if (abilityIndex >= 0) {
                newState.abilityScores[abilityIndex] = { ...newState.abilityScores[abilityIndex], value: update.payload.value };
            } else {
                newState.abilityScores.push({ abilityId: update.payload.abilityId, value: update.payload.value });
            }
            break;
        case 'SET_SKILL_RANK':
            const skillIndex = newState.skillRanks.findIndex(sr =>
                sr.skillId === update.payload.skillId &&
                sr.skillSubId === update.payload.skillSubId &&
                sr.customSubtype === update.payload.customSubtype
            );
            if (update.payload.pointsSpent === 0) {
                // Remove skill rank entry if pointsSpent is 0
                if (skillIndex >= 0) {
                    newState.skillRanks.splice(skillIndex, 1);
                }
            } else if (skillIndex >= 0) {
                // Update existing skill rank
                newState.skillRanks[skillIndex] = { ...newState.skillRanks[skillIndex], pointsSpent: update.payload.pointsSpent };
            } else {
                // Add new skill rank
                newState.skillRanks.push({
                    skillId: update.payload.skillId,
                    skillSubId: update.payload.skillSubId,
                    customSubtype: update.payload.customSubtype,
                    pointsSpent: update.payload.pointsSpent
                });
            }
            break;
        case 'SET_RACE':
            newState.raceId = update.payload.raceId;
            break;
        case 'SET_CLASS':
            newState.classId = update.payload.classId;
            break;
        case 'SET_SECONDARY_CLASS':
            newState.secondaryClassId = update.payload.secondaryClassId;
            newState.isGestalt = update.payload.secondaryClassId !== null;
            break;
        case 'SET_LEVEL':
            newState.level = update.payload.level;
            break;
        case 'MAKE_CHOICE':
            // Add or update feature choice
            const choiceIndex = newState.featureChoices.findIndex(fc =>
                fc.progressionId === update.payload.progressionId &&
                fc.featureEntityId === update.payload.featureEntityId
            );
            if (choiceIndex >= 0) {
                newState.featureChoices[choiceIndex] = {
                    ...newState.featureChoices[choiceIndex],
                    appliesToId: update.payload.appliesToId,
                    appliesToSubId: update.payload.appliesToSubId
                };
            } else {
                newState.featureChoices.push({
                    id: 0, // Will be assigned by database
                    progressionId: update.payload.progressionId,
                    featureEntityId: update.payload.featureEntityId,
                    appliesToId: update.payload.appliesToId,
                    appliesToSubId: update.payload.appliesToSubId
                });
            }
            break;
        case 'SET_FEAT':
            if (!newState.selectedFeats.includes(update.payload.featId)) {
                newState.selectedFeats.push(update.payload.featId);
            }
            break;
        case 'REMOVE_FEAT':
            newState.selectedFeats = newState.selectedFeats.filter(id => id !== update.payload.featId);
            break;
        case 'SET_DISALLOWED_SOURCE':
            if (!newState.disallowedSources.some(ds => ds.sourceType === update.payload.sourceType && ds.sourceId === update.payload.sourceId)) {
                newState.disallowedSources.push({
                    sourceType: update.payload.sourceType,
                    sourceId: update.payload.sourceId
                });
            }
            break;
        case 'REMOVE_DISALLOWED_SOURCE':
            newState.disallowedSources = newState.disallowedSources.filter(
                ds => !(ds.sourceType === update.payload.sourceType && ds.sourceId === update.payload.sourceId)
            );
            break;
    }

    return newState;
}

/**
 * Get available feats for a character
 */
export async function GetAvailableFeats(
    req: ValidatedParamsT<{ characterId: string }, { results: FeatInQueryResponse[]; total: number }>,
    res: Response,
    _next: NextFunction
) {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    const characterId = typeof req.params.characterId === 'string' 
        ? parseInt(req.params.characterId, 10)
        : req.params.characterId;
    if (isNaN(characterId)) {
        res.status(400).json({ error: 'Invalid character ID' });
        return;
    }

    try {
        // Load character with all details
        const character = await characterService.getCharacterWithAllDetails({ id: characterId });
        if (!character) {
            res.status(404).json({ error: 'Character not found' });
            return;
        }

        // Verify ownership
        if (character.userId !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // Load race and class details
        const raceDetails = character.raceId ? await raceService.getRaceById({ id: character.raceId }) : null;
        const classDetails = character.advancements?.[0]?.classId
            ? await classService.getClassById({ id: character.advancements[0].classId })
            : null;

        // Calculate target level
        const targetLevel = character.level || 1;

        // Create resolution context to get resolved progressions
        const context = {
            character,
            targetLevel,
            advancement: character.advancements?.find(adv => adv.level === targetLevel),
            raceDetails,
            classDetails,
            secondaryClassDetails: character.advancements?.[0]?.secondaryClassId
                ? await classService.getClassById({ id: character.advancements[0].secondaryClassId })
                : null,
            isGestalt: !!character.advancements?.[0]?.secondaryClassId,
            userChoices: undefined,
            includePendingChoices: false,
            resolveCascading: true,
            maxResolutionDepth: 10,
        };

        // Resolve features to get progressions
        const resolutionResult = await CharacterResolutionService.resolveCharacterFeatures(
            character,
            targetLevel,
            context
        );

        // Get all feats
        const allFeatsResponse = await featService.getAllFeats();
        const allFeats = allFeatsResponse.results;

        // Filter available feats
        const availableFeats = await AvailableFeatService.getAvailableFeats(
            character,
            resolutionResult.resolvedProgressions,
            classDetails,
            raceDetails,
            allFeats
        );

        res.json({
            results: availableFeats,
            total: availableFeats.length
        });
    } catch (error) {
        console.error('Error getting available feats:', error);
        res.status(500).json({ error: 'Failed to get available feats' });
    }
}

