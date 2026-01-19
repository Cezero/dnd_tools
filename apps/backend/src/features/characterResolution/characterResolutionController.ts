import { Response, NextFunction } from 'express';

import type { ValidatedParamsT, ValidatedParamsBodyT } from '@/util/validated-types';
import type { CharacterWithAllDetailsResponse, FeatInQueryResponse, ClassSpellSelection, FeatureProgression } from '@shared/schema';
import { EntityAppliesToType } from '@shared/static-data';

import { applyUpdateToState as genericApplyUpdateToState } from '../shared/session/GenericUpdateApplier';

import { AvailableFeatService } from './availableFeatService';
import { buildCharacterEditState } from './characterEditStateBuilder';
import { characterUpdateApplierConfig } from './characterUpdateApplierConfig';
import { CharacterResolutionService } from './characterResolutionService';
import type { ResolvedCharacterResult } from './characterSessionService';
import { CharacterSessionService } from './characterSessionService';
import { ResolvedFeatureService } from './resolvedFeatureService';
import { GestaltMechanicsResolver } from './gestaltMechanicsResolver';
import type { CharacterUpdate, UserChoices, CharacterEditState } from './types';
import { characterService } from '../character/characterService';
import { classService } from '../class/classService';
import { featService } from '../feat/featService';
import { featureSystemService } from '../featureSystem/featureSystemService';
import { raceService } from '../race/raceService';

/**
 * Filters out entities with invalid appliesTo values from progressions.
 * This prevents validation errors when returning data to the frontend.
 * 
 * Logs warnings for each filtered entity to help identify database records that need fixing.
 * 
 * @param progressions - Array of feature progressions to filter
 * @returns Filtered progressions with only valid entities
 */
function filterInvalidAppliesToEntities(progressions: FeatureProgression[]): FeatureProgression[] {
    const validAppliesToValues = new Set(Object.values(EntityAppliesToType));
    return progressions.map(progression => {
        if (!progression.entities || progression.entities.length === 0) {
            return progression;
        }

        const validEntities: typeof progression.entities = [];
        const invalidEntities: typeof progression.entities = [];

        for (const entity of progression.entities) {
            if (validAppliesToValues.has(entity.appliesTo)) {
                validEntities.push(entity);
            } else {
                invalidEntities.push(entity);
            }
        }

        // Log warnings for invalid entities
        if (invalidEntities.length > 0) {
            for (const entity of invalidEntities) {
                console.warn(
                    `[Character Resolution] Filtered entity with invalid appliesTo value:`,
                    {
                        progressionId: progression.id,
                        entityId: entity.id,
                        invalidAppliesTo: entity.appliesTo,
                        entityType: entity.type,
                        appliesToId: entity.appliesToId,
                        validAppliesToValues: Array.from(validAppliesToValues).sort((a, b) => a - b)
                    }
                );
            }
        }

        return {
            ...progression,
            entities: validEntities
        };
    });
}

/**
 * Calculate spell selection data for all spellcasting classes in a character.
 * 
 * This function iterates through all classes the character has (from advancements)
 * and calculates spell selection data for each spellcasting class using resolved progressions.
 * 
 * @param characterId - The character ID
 * @param character - The character data with advancements
 * @param resolvedProgressions - The resolved feature progressions
 * @returns Record mapping classId (as string) to ClassSpellSelection data
 */
async function calculateSpellSelection(
    characterId: number,
    character: CharacterWithAllDetailsResponse,
    resolvedProgressions: FeatureProgression[]
): Promise<Record<string, ClassSpellSelection>> {
    const spellSelection: Record<string, ClassSpellSelection> = {};

    if (!character.advancements || character.advancements.length === 0) {
        return spellSelection;
    }

    // Get all unique class IDs from advancements (including secondary classes)
    const classIds = new Set<number>();
    for (const adv of character.advancements) {
        if (adv.classId) {
            classIds.add(adv.classId);
        }
        if (adv.secondaryClassId) {
            classIds.add(adv.secondaryClassId);
        }
    }

    // For each class, check if it's spellcasting and calculate spell selection data
    for (const classId of classIds) {
        try {
            const spellData = await characterService.getAvailableSpellsForClass(
                characterId,
                classId,
                resolvedProgressions
            );

            // Only include if the class has spells or is a spellcasting class
            if (spellData.spells.length > 0 || spellData.domainSpells.length > 0 || spellData.availableFreeSpells !== undefined) {
                // Transform to match schema format
                const spells = spellData.spells.map(s => ({
                    ...s.spell,
                    classSpellLevel: s.classSpellLevel,
                    isKnown: s.isKnown,
                }));

                const domainSpells = spellData.domainSpells.map(ds => ({
                    ...ds.spell,
                    classSpellLevel: ds.classSpellLevel,
                    isKnown: ds.isKnown,
                    domainId: ds.domainId,
                    domainName: ds.domainName,
                    domainSpellLevel: ds.spellLevel,
                }));

                spellSelection[classId.toString()] = {
                    spells,
                    ...(domainSpells.length > 0 && { domainSpells }),
                    ...(spellData.availableFreeSpells !== undefined && { availableFreeSpells: spellData.availableFreeSpells }),
                };
            }
        } catch (error) {
            // Log error but don't fail resolution if spell selection calculation fails
            console.error(`Failed to calculate spell selection for class ${classId}:`, error);
        }
    }

    return spellSelection;
}

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
        const targetLevel = character.characterLevel || 1;
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
        const skillBonuses = await ResolvedFeatureService.getSkillBonuses(resolutionResult.resolvedProgressions);
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

        const availableFeatsCount = ResolvedFeatureService.getAvailableFeatsCount(
            resolutionResult.resolvedProgressions,
            targetLevel,
            classLevels
        );
        const availableFighterBonusFeats = ResolvedFeatureService.getAvailableFighterBonusFeats(
            resolutionResult.resolvedProgressions
        );

        // Calculate qualified feats (list of feats the character qualifies for)
        // This filters all feats by prerequisites, proficiencies, owned feats, etc.
        const allFeatsResponse = await featService.getAllFeats();
        const qualifiedFeats = await AvailableFeatService.getQualifiedFeats(
            character,
            resolutionResult.resolvedProgressions,
            classDetails,
            raceDetails,
            allFeatsResponse.results
        );

        // Calculate spell selection data for all spellcasting classes
        const spellSelection = await calculateSpellSelection(
            characterId,
            character,
            resolutionResult.resolvedProgressions
        );

        // Create character edit state
        const characterState = buildCharacterEditState(
            character,
            targetLevel,
            !!secondaryClassDetails
        );

        // Enrich progressions with filtered class/race info (only for character's classes/race)
        let enrichedProgressions = resolutionResult.resolvedProgressions;
        const progressionIds = enrichedProgressions.map(p => p.id);
        if (progressionIds.length > 0) {
            const enriched = await featureSystemService.getFeatureProgressionsByIds(
                progressionIds,
                undefined,
                true // Include class/race info
            );

            const enrichedMap = new Map(enriched.map(p => [p.id, p]));

            // Collect all class IDs from all advancements
            const characterClassIds = new Set<number>();
            if (character.advancements) {
                for (const adv of character.advancements) {
                    if (adv.classId) {
                        characterClassIds.add(adv.classId);
                    }
                    if (adv.secondaryClassId) {
                        characterClassIds.add(adv.secondaryClassId);
                    }
                }
            }
            const characterRaceId = character.raceId;

            enrichedProgressions = enrichedProgressions.map(progression => {
                const enrichedProg = enrichedMap.get(progression.id);
                if (!enrichedProg) {
                    return progression;
                }

                const filteredClasses = enrichedProg.classes?.filter(c => characterClassIds.has(c.classId)) || [];
                const filteredRaces = enrichedProg.races?.filter(r => r.raceId === characterRaceId) || [];

                return {
                    ...progression,
                    ...(filteredClasses.length > 0 ? { classes: filteredClasses } : {}),
                    ...(filteredRaces.length > 0 ? { races: filteredRaces } : {})
                };
            });
        }

        // Filter out entities with invalid appliesTo values before storing in session
        enrichedProgressions = filterInvalidAppliesToEntities(enrichedProgressions);

        // Resolve formula values for BAB and saves
        let resolvedFormulaValues = ResolvedFeatureService.resolveFormulaValues(
            enrichedProgressions,
            character,
            targetLevel as number
        );

        // Apply gestalt mechanics resolution (deferred until after full resolution)
        if (character.isGestalt || character.advancements?.some(adv => adv.secondaryClassId !== null && adv.secondaryClassId !== 0)) {
            resolvedFormulaValues = GestaltMechanicsResolver.resolveGestaltMechanics(
                character,
                enrichedProgressions,
                resolvedFormulaValues
            );
        }

        // Build ResolvedCharacterResult for session
        const resolvedCharacterResult: ResolvedCharacterResult = {
            resolvedProgressions: enrichedProgressions,
            pendingChoices: resolutionResult.pendingChoices,
            classSkills,
            skillBonuses,
            grantedFeats: grantedFeats.map(f => f.appliesToId!).filter((id): id is number => id !== null),
            availableFeatsCount,
            availableFighterBonusFeats,
            qualifiedFeats,
            ...(Object.keys(spellSelection).length > 0 && { spellSelection }),
            ...(Object.keys(resolvedFormulaValues).length > 0 && { resolvedFormulaValues }),
            effectiveClassDetails: resolutionResult.effectiveClassDetails ?? null,
            warnings: resolutionResult.warnings,
            errors: resolutionResult.errors,
            sessionId: '', // Will be assigned by createSession
        };

        // Create session
        const sessionService = new CharacterSessionService();
        const session = await sessionService.createSession(
            character,
            userId,
            characterState,
            resolvedCharacterResult
        );

        // Update sessionId in result
        resolvedCharacterResult.sessionId = session.id;

        // Build response
        const result: ResolvedCharacterResult = resolvedCharacterResult;

        res.json(result);
    } catch (error) {
        console.error('Error initializing resolution session:', error);
        if (error instanceof Error) {
            console.error('Error stack:', error.stack);
            console.error('Error message:', error.message);
        }
        res.status(500).json({
            error: 'Failed to initialize resolution session',
            details: error instanceof Error ? error.message : String(error)
        });
    }
}

/**
 * Resume an existing resolution session or create a new one if none exists.
 * 
 * This function always returns a session. If an active session exists for the character,
 * it returns that session. If no session exists, it automatically creates a new session
 * using the same logic as `InitializeSession` and returns it.
 * 
 * This eliminates the need for the frontend to make two API calls (resume + initialize)
 * when no session exists, simplifying the code and improving performance.
 * 
 * @param req - Express request with validated characterId parameter
 * @param res - Express response
 * @param _next - Express next function
 */
export async function ResumeSession(
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
        const sessionService = new CharacterSessionService();
        const session = await sessionService.getSession(characterId, userId);

        // Get character to check current level
        const character = await characterService.getCharacterWithAllDetails({ id: characterId });
        if (!character) {
            res.status(404).json({ error: 'Character not found' });
            return;
        }

        const targetLevel = character.characterLevel || 1;

        // If session exists, check if it needs to be re-resolved
        // Re-resolve if cached progressions include levels above the character's current level
        if (session) {
            const progressionLevels = session.resolvedResult.resolvedProgressions?.map(p => p.level) || [];
            const maxCachedLevel = progressionLevels.length > 0 ? Math.max(...progressionLevels) : 0;
            const needsReResolution = maxCachedLevel > targetLevel;

            if (!needsReResolution) {
                // Filter cached session data to remove invalid appliesTo values (and log them)
                const filteredProgressions = filterInvalidAppliesToEntities(session.resolvedResult.resolvedProgressions);

                // Build response from session
                const classSkills = ResolvedFeatureService.getClassSkills(filteredProgressions);
                const skillBonuses = await ResolvedFeatureService.getSkillBonuses(filteredProgressions);
                const grantedFeats = ResolvedFeatureService.getGrantedFeats(filteredProgressions);

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

                const availableFeatsCount = ResolvedFeatureService.getAvailableFeatsCount(
                    filteredProgressions,
                    session.characterState.level,
                    classLevels
                );
                const availableFighterBonusFeats = ResolvedFeatureService.getAvailableFighterBonusFeats(
                    filteredProgressions
                );

                // Calculate qualified feats (list of feats the character qualifies for)
                // Compute fresh each time since it depends on current character state
                const allFeatsResponse = await featService.getAllFeats();
                const raceDetails = character.raceId ? await raceService.getRaceById({ id: character.raceId }) : null;
                const classDetails = character.advancements?.[0]?.classId
                    ? await classService.getClassById({ id: character.advancements[0].classId })
                    : null;
                const qualifiedFeats = await AvailableFeatService.getQualifiedFeats(
                    character,
                    filteredProgressions,
                    classDetails,
                    raceDetails,
                    allFeatsResponse.results
                );

                // Calculate spell selection data for all spellcasting classes
                const spellSelection = await calculateSpellSelection(
                    characterId,
                    character,
                    filteredProgressions
                );

                const validPendingChoices = session.resolvedResult.pendingChoices;

                // Enrich progressions with filtered class/race info (only for character's classes/race)
                let enrichedProgressions = filteredProgressions;
                const progressionIds = enrichedProgressions.map(p => p.id);
                if (progressionIds.length > 0) {
                    const character = await characterService.getCharacterWithAllDetails({ id: characterId });
                    if (character) {
                        const classDetails = character.advancements?.[0]?.classId
                            ? await classService.getClassById({ id: character.advancements[0].classId })
                            : null;
                        const secondaryClassDetails = character.advancements?.[0]?.secondaryClassId
                            ? await classService.getClassById({ id: character.advancements[0].secondaryClassId })
                            : null;

                        const enriched = await featureSystemService.getFeatureProgressionsByIds(
                            progressionIds,
                            undefined,
                            true // Include class/race info
                        );

                        const enrichedMap = new Map(enriched.map(p => [p.id, p]));

                        // Collect all class IDs from all advancements
                        const characterClassIds = new Set<number>();
                        if (character.advancements) {
                            for (const adv of character.advancements) {
                                if (adv.classId) {
                                    characterClassIds.add(adv.classId);
                                }
                                if (adv.secondaryClassId) {
                                    characterClassIds.add(adv.secondaryClassId);
                                }
                            }
                        }
                        const characterRaceId = character.raceId;

                        enrichedProgressions = enrichedProgressions.map(progression => {
                            const enrichedProg = enrichedMap.get(progression.id);
                            if (!enrichedProg) {
                                return progression;
                            }

                            const filteredClasses = enrichedProg.classes?.filter(c => characterClassIds.has(c.classId)) || [];
                            const filteredRaces = enrichedProg.races?.filter(r => r.raceId === characterRaceId) || [];

                            return {
                                ...progression,
                                ...(filteredClasses.length > 0 ? { classes: filteredClasses } : {}),
                                ...(filteredRaces.length > 0 ? { races: filteredRaces } : {})
                            };
                        });
                    }
                }

                // Final pass: filter out entities with invalid appliesTo values from all progressions
                enrichedProgressions = filterInvalidAppliesToEntities(enrichedProgressions);

                const result: ResolvedCharacterResult = {
                    resolvedProgressions: enrichedProgressions,
                    pendingChoices: validPendingChoices,
                    classSkills,
                    skillBonuses,
                    grantedFeats: grantedFeats.map(f => f.appliesToId!).filter((id): id is number => id !== null),
                    availableFeatsCount,
                    availableFighterBonusFeats,
                    qualifiedFeats,
                    ...(Object.keys(spellSelection).length > 0 && { spellSelection }),
                    ...(session.resolvedResult.resolvedFormulaValues && Object.keys(session.resolvedResult.resolvedFormulaValues).length > 0
                        ? { resolvedFormulaValues: session.resolvedResult.resolvedFormulaValues }
                        : {}),
                    effectiveClassDetails: session.resolvedResult.effectiveClassDetails ?? null,
                    warnings: session.resolvedResult.warnings,
                    errors: session.resolvedResult.errors,
                    sessionId: session.id,
                };

                res.json(result);
                return;
            } else {
                // Session exists but needs re-resolution - delete it and create a new one
                sessionService.deleteSessionById(session.id);
            }
        }

        // No session exists (or was just deleted) - create a new one using the same logic as InitializeSession

        // Verify ownership (character already loaded above)
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

        // targetLevel already calculated above (line 352)
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
        const skillBonuses = await ResolvedFeatureService.getSkillBonuses(resolutionResult.resolvedProgressions);
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

        const availableFeatsCount = ResolvedFeatureService.getAvailableFeatsCount(
            resolutionResult.resolvedProgressions,
            targetLevel,
            classLevels
        );
        const availableFighterBonusFeats = ResolvedFeatureService.getAvailableFighterBonusFeats(
            resolutionResult.resolvedProgressions
        );

        // Calculate qualified feats (list of feats the character qualifies for)
        // This filters all feats by prerequisites, proficiencies, owned feats, etc.
        const allFeatsResponse = await featService.getAllFeats();
        const qualifiedFeats = await AvailableFeatService.getQualifiedFeats(
            character,
            resolutionResult.resolvedProgressions,
            classDetails,
            raceDetails,
            allFeatsResponse.results
        );

        // Calculate spell selection data for all spellcasting classes
        const spellSelection = await calculateSpellSelection(
            characterId,
            character,
            resolutionResult.resolvedProgressions
        );

        // Create character edit state
        const characterState = buildCharacterEditState(
            character,
            targetLevel,
            !!secondaryClassDetails
        );

        const validPendingChoices = resolutionResult.pendingChoices;

        // Enrich progressions with filtered class/race info (only for character's classes/race)
        let enrichedProgressions = resolutionResult.resolvedProgressions;
        const progressionIds = enrichedProgressions.map(p => p.id);
        if (progressionIds.length > 0) {
            const enriched = await featureSystemService.getFeatureProgressionsByIds(
                progressionIds,
                undefined,
                true // Include class/race info
            );

            const enrichedMap = new Map(enriched.map(p => [p.id, p]));

            // Collect all class IDs from all advancements
            const characterClassIds = new Set<number>();
            if (character.advancements) {
                for (const adv of character.advancements) {
                    if (adv.classId) {
                        characterClassIds.add(adv.classId);
                    }
                    if (adv.secondaryClassId) {
                        characterClassIds.add(adv.secondaryClassId);
                    }
                }
            }
            const characterRaceId = character.raceId;

            enrichedProgressions = enrichedProgressions.map(progression => {
                const enrichedProg = enrichedMap.get(progression.id);
                if (!enrichedProg) {
                    return progression;
                }

                const filteredClasses = enrichedProg.classes?.filter(c => characterClassIds.has(c.classId)) || [];
                const filteredRaces = enrichedProg.races?.filter(r => r.raceId === characterRaceId) || [];

                return {
                    ...progression,
                    ...(filteredClasses.length > 0 ? { classes: filteredClasses } : {}),
                    ...(filteredRaces.length > 0 ? { races: filteredRaces } : {})
                };
            });
        }

        // Filter out entities with invalid appliesTo values
        enrichedProgressions = filterInvalidAppliesToEntities(enrichedProgressions);

        // Resolve formula values for BAB and saves
        let resolvedFormulaValues = ResolvedFeatureService.resolveFormulaValues(
            enrichedProgressions,
            character,
            targetLevel as number
        );

        // Apply gestalt mechanics resolution (deferred until after full resolution)
        if (character.isGestalt || character.advancements?.some(adv => adv.secondaryClassId !== null && adv.secondaryClassId !== 0)) {
            resolvedFormulaValues = GestaltMechanicsResolver.resolveGestaltMechanics(
                character,
                enrichedProgressions,
                resolvedFormulaValues
            );
        }

        // Build ResolvedCharacterResult for session
        const resolvedCharacterResult: ResolvedCharacterResult = {
            resolvedProgressions: enrichedProgressions,
            pendingChoices: validPendingChoices,
            classSkills,
            skillBonuses,
            grantedFeats: grantedFeats.map(f => f.appliesToId!).filter((id): id is number => id !== null),
            availableFeatsCount,
            availableFighterBonusFeats,
            qualifiedFeats,
            ...(Object.keys(spellSelection).length > 0 && { spellSelection }),
            ...(Object.keys(resolvedFormulaValues).length > 0 && { resolvedFormulaValues }),
            effectiveClassDetails: resolutionResult.effectiveClassDetails ?? null,
            warnings: resolutionResult.warnings,
            errors: resolutionResult.errors,
            sessionId: '', // Will be assigned by createSession
        };

        // Create session
        const newSession = await sessionService.createSession(
            character,
            userId,
            characterState,
            resolvedCharacterResult
        );

        // Update sessionId in result
        resolvedCharacterResult.sessionId = newSession.id;

        // Build response
        const result: ResolvedCharacterResult = resolvedCharacterResult;

        res.json(result);
    } catch (error) {
        console.error('Error resuming resolution session:', error);
        if (error instanceof Error) {
            console.error('Error stack:', error.stack);
            console.error('Error message:', error.message);
        }
        res.status(500).json({
            error: 'Failed to resume resolution session',
            details: error instanceof Error ? error.message : String(error)
        });
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
        const session = await sessionService.getSessionById(sessionId);

        if (!session || session.characterId !== characterId || session.userId !== userId) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        // Apply update to character state using generic update applier
        const updatedState = genericApplyUpdateToState(session.characterState, req.body.update, characterUpdateApplierConfig);

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
        for (const _choice of updatedState.featureChoices) {
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

        // Build ResolvedCharacterResult
        const classSkills = ResolvedFeatureService.getClassSkills(resolutionResult.resolvedProgressions);
        const skillBonuses = await ResolvedFeatureService.getSkillBonuses(resolutionResult.resolvedProgressions);
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

        const availableFeatsCount = ResolvedFeatureService.getAvailableFeatsCount(
            resolutionResult.resolvedProgressions,
            updatedState.level,
            classLevels
        );
        const availableFighterBonusFeats = ResolvedFeatureService.getAvailableFighterBonusFeats(
            resolutionResult.resolvedProgressions
        );

        // Calculate qualified feats (list of feats the character qualifies for)
        // This filters all feats by prerequisites, proficiencies, owned feats, etc.
        const allFeatsResponse = await featService.getAllFeats();
        const qualifiedFeats = await AvailableFeatService.getQualifiedFeats(
            character,
            resolutionResult.resolvedProgressions,
            classDetails,
            raceDetails,
            allFeatsResponse.results
        );

        // Calculate spell selection data for all spellcasting classes
        const spellSelection = await calculateSpellSelection(
            characterId,
            character,
            resolutionResult.resolvedProgressions
        );

        const validPendingChoices = resolutionResult.pendingChoices;

        // Enrich progressions with filtered class/race info (only for character's classes/race)
        let enrichedProgressions = resolutionResult.resolvedProgressions;
        const progressionIds = enrichedProgressions.map(p => p.id);
        if (progressionIds.length > 0) {
            const enriched = await featureSystemService.getFeatureProgressionsByIds(
                progressionIds,
                undefined,
                true // Include class/race info
            );

            const enrichedMap = new Map(enriched.map(p => [p.id, p]));

            // Collect all class IDs from all advancements
            const characterClassIds = new Set<number>();
            if (character.advancements) {
                for (const adv of character.advancements) {
                    if (adv.classId) {
                        characterClassIds.add(adv.classId);
                    }
                    if (adv.secondaryClassId) {
                        characterClassIds.add(adv.secondaryClassId);
                    }
                }
            }
            const characterRaceId = character.raceId;

            enrichedProgressions = enrichedProgressions.map(progression => {
                const enrichedProg = enrichedMap.get(progression.id);
                if (!enrichedProg) {
                    return progression;
                }

                const filteredClasses = enrichedProg.classes?.filter(c => characterClassIds.has(c.classId)) || [];
                const filteredRaces = enrichedProg.races?.filter(r => r.raceId === characterRaceId) || [];

                return {
                    ...progression,
                    ...(filteredClasses.length > 0 ? { classes: filteredClasses } : {}),
                    ...(filteredRaces.length > 0 ? { races: filteredRaces } : {})
                };
            });
        }

        // Filter out entities with invalid appliesTo values
        enrichedProgressions = filterInvalidAppliesToEntities(enrichedProgressions);

        // Resolve formula values for BAB and saves
        let resolvedFormulaValues = ResolvedFeatureService.resolveFormulaValues(
            enrichedProgressions,
            character,
            updatedState.level
        );

        // Apply gestalt mechanics resolution (deferred until after full resolution)
        if (character.isGestalt || character.advancements?.some(adv => adv.secondaryClassId !== null && adv.secondaryClassId !== 0)) {
            resolvedFormulaValues = GestaltMechanicsResolver.resolveGestaltMechanics(
                character,
                enrichedProgressions,
                resolvedFormulaValues
            );
        }

        const resolvedCharacterResult: ResolvedCharacterResult = {
            resolvedProgressions: enrichedProgressions,
            pendingChoices: validPendingChoices,
            classSkills,
            skillBonuses,
            grantedFeats: grantedFeats.map(f => f.appliesToId!).filter((id): id is number => id !== null),
            availableFeatsCount,
            availableFighterBonusFeats,
            qualifiedFeats,
            ...(Object.keys(spellSelection).length > 0 && { spellSelection }),
            ...(Object.keys(resolvedFormulaValues).length > 0 && { resolvedFormulaValues }),
            effectiveClassDetails: resolutionResult.effectiveClassDetails ?? null,
            warnings: resolutionResult.warnings,
            errors: resolutionResult.errors,
            sessionId: session.id,
        };

        // Update session
        await sessionService.updateSession(session.sessionKey, updatedState, resolvedCharacterResult);

        // Build response
        const result: ResolvedCharacterResult = resolvedCharacterResult;

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
        const session = await sessionService.getSessionById(sessionId);

        if (!session || session.characterId !== characterId || session.userId !== userId) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        // Filter cached session data to remove invalid appliesTo values (and log them)
        const filteredProgressions = filterInvalidAppliesToEntities(session.resolvedResult.resolvedProgressions);

        // Build response from session (same as ResumeSession)
        const classSkills = ResolvedFeatureService.getClassSkills(filteredProgressions);
        const skillBonuses = await ResolvedFeatureService.getSkillBonuses(filteredProgressions);
        const grantedFeats = ResolvedFeatureService.getGrantedFeats(filteredProgressions);

        const character = await characterService.getCharacterWithAllDetails({ id: characterId });
        if (!character) {
            res.status(404).json({ error: 'Character not found' });
            return;
        }

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

        const availableFeatsCount = ResolvedFeatureService.getAvailableFeatsCount(
            filteredProgressions,
            session.characterState.level,
            classLevels
        );
        const availableFighterBonusFeats = ResolvedFeatureService.getAvailableFighterBonusFeats(
            filteredProgressions
        );

        // Calculate qualified feats (list of feats the character qualifies for)
        // Compute fresh each time since it depends on current character state
        const allFeatsResponse = await featService.getAllFeats();
        const raceDetails = character.raceId ? await raceService.getRaceById({ id: character.raceId }) : null;
        const classDetails = character.advancements?.[0]?.classId
            ? await classService.getClassById({ id: character.advancements[0].classId })
            : null;
        const qualifiedFeats = await AvailableFeatService.getQualifiedFeats(
            character,
            filteredProgressions,
            classDetails,
            raceDetails,
            allFeatsResponse.results
        );

        // Filter out invalid pending choices (those with invalid options)
        const validPendingChoices = session.resolvedResult.pendingChoices;

        const result: ResolvedCharacterResult = {
            resolvedProgressions: filteredProgressions,
            pendingChoices: validPendingChoices,
            classSkills,
            skillBonuses,
            grantedFeats: grantedFeats.map(f => f.appliesToId!).filter((id): id is number => id !== null),
            availableFeatsCount,
            availableFighterBonusFeats,
            qualifiedFeats,
            ...(session.resolvedResult.resolvedFormulaValues && Object.keys(session.resolvedResult.resolvedFormulaValues).length > 0
                ? { resolvedFormulaValues: session.resolvedResult.resolvedFormulaValues }
                : {}),
            effectiveClassDetails: session.resolvedResult.effectiveClassDetails ?? null,
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
        const session = await sessionService.getSessionById(sessionId);

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
        const session = await sessionService.getSessionById(sessionId);

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
 * Apply an update to character state.
 * 
 * **Implementation Note**: This function delegates to the generic update applier
 * with Character-specific configuration. All update logic is handled by the generic
 * applier using the strategy functions in `characterUpdateApplierConfig`.
 * 
 * @param state - Current character edit state
 * @param update - Update operation to apply
 * @returns Updated character edit state
 * 
 * @see GenericUpdateApplier - Generic implementation
 * @see characterUpdateApplierConfig - Character-specific update strategies
 */
function applyUpdateToState(state: CharacterEditState, update: CharacterUpdate): CharacterEditState {
    return genericApplyUpdateToState(state, update, characterUpdateApplierConfig);
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
        const targetLevel = character.characterLevel || 1;

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

        // Filter qualified feats (feats the character qualifies for)
        const qualifiedFeats = await AvailableFeatService.getQualifiedFeats(
            character,
            resolutionResult.resolvedProgressions,
            classDetails,
            raceDetails,
            allFeats
        );

        res.json({
            results: qualifiedFeats,
            total: qualifiedFeats.length
        });
    } catch (error) {
        console.error('Error getting available feats:', error);
        res.status(500).json({ error: 'Failed to get available feats' });
    }
}

