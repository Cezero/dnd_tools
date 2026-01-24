import { prisma } from '@/lib/prisma';
import type {
    CreateSpellPreparationRequest,
    UpdateSpellPreparationRequest,
    CharacterSpellPreparationResponse,
    FeatureWithRelations,
    Spell,
    AddSpellKnownResponse,
    RemoveSpellKnownResponse,
    CharacterWithAllDetailsResponse,
    ResolvedCharacterResult,
    CreateResponse,
    UpdateResponse,
} from '@shared/schema';
import { DraftType, EntityAppliesToType, EntityType, SpellSlotType } from '@shared/static-data';

import { characterCrudService } from './characterCrudService';
import { AvailableFeatService } from '../../characterResolution/availableFeatService';
import { buildCharacterEditState } from '../../characterResolution/characterEditStateBuilder';
import { CharacterResolutionService } from '../../characterResolution/characterResolutionService';
import { CharacterResolvedResultsService } from '../../characterResolution/characterResolvedResultsService';
import { ResolvedFeatureService } from '../../characterResolution/resolvedFeatureService';
import type { CharacterEditState, ResolutionContext, UserChoices } from '../../characterResolution/types';
import { classService } from '../../class/classService';
import { featService } from '../../feat/featService';
import { featureSystemService } from '../../featureSystem/featureSystemService';
import { raceService } from '../../race/raceService';
import { DraftStateService } from '../../shared/draftState/DraftStateService';
import { spellService } from '../../spell';

/**
 * Service for managing character spell operations.
 * 
 * Handles spell preparations, known spells, spell validation, and integration
 * with the character resolution system for spellbook class free grants.
 */
export const characterSpellService = {
    async createSpellPreparation(characterId: number, data: CreateSpellPreparationRequest): Promise<CreateResponse> {
        // Check if a preparation already exists with the same combination
        const slotType = data.slotType ?? 0;
        const existing = await prisma.characterSpellPreparation.findFirst({
            where: {
                characterId: characterId,
                classId: data.classId,
                spellId: data.spellId,
                spellLevel: data.spellLevel,
                slotType: slotType,
                featId: data.featId ?? null,
            },
        });

        let result;
        if (existing) {
            // Update existing preparation by incrementing quantity
            result = await prisma.characterSpellPreparation.update({
                where: { id: existing.id },
                data: {
                    quantity: {
                        increment: data.quantity,
                    },
                },
            });
        } else {
            // Create new preparation
            result = await prisma.characterSpellPreparation.create({
                data: {
                    characterId: characterId,
                    ...data,
                    slotType: slotType,
                },
            });
        }

        return { id: result.id.toString(), message: 'Spell preparation created successfully' };
    },

    async updateSpellPreparation(preparationId: number, data: UpdateSpellPreparationRequest): Promise<UpdateResponse> {
        await prisma.characterSpellPreparation.update({
            where: {
                id: preparationId,
            },
            data,
        });

        return { message: 'Spell preparation updated successfully' };
    },

    async deleteSpellPreparation(preparationId: number): Promise<UpdateResponse> {
        await prisma.characterSpellPreparation.delete({
            where: {
                id: preparationId,
            },
        });

        return { message: 'Spell preparation deleted successfully' };
    },

    async getCharacterSpellPreparations(characterId: number): Promise<CharacterSpellPreparationResponse[]> {
        const preparations = await prisma.characterSpellPreparation.findMany({
            where: { characterId: characterId },
            include: {
                feat: true,
            },
        });

        return preparations.map(prep => ({
            ...prep,
            slotType: prep.slotType as SpellSlotType,
        })) as CharacterSpellPreparationResponse[];
    },

    async getCharacterDomains(characterId: number, classId: number): Promise<number[]> {
        // Get all features for this class via many-to-many relationship
        // Domain choices can be associated with any feature for the class
        const classLinks = await prisma.featureClassMap.findMany({
            where: { classId },
            select: { featureId: true }
        });
        const progressionIds = classLinks.map(link => link.featureId);

        const features = await prisma.feature.findMany({
            where: {
                id: { in: progressionIds }
            },
            select: {
                id: true
            }
        });

        const finalProgressionIds = features.map(p => p.id);

        if (finalProgressionIds.length === 0) {
            return [];
        }

        // Get character's feature choices where appliesTo = Domain
        // and the feature is associated with this class
        const domainChoices = await prisma.characterFeatureChoice.findMany({
            where: {
                characterId,
                featureId: { in: progressionIds },
                featureEntity: {
                    appliesTo: EntityAppliesToType.Domain,
                }
            },
            include: {
                featureEntity: {
                    select: {
                        appliesTo: true
                    }
                }
            }
        });

        // Filter to ensure appliesTo is actually Domain and extract domain IDs
        const domainIds = Array.from(new Set(
            domainChoices
                .filter(choice => choice.featureEntity?.appliesTo === EntityAppliesToType.Domain)
                .map(choice => choice.appliesToId)
                .filter((id): id is number => id !== null)
        ));

        return domainIds;
    },

    async getAvailableSpellsForClass(
        characterId: number,
        classId: number,
        resolvedProgressions?: FeatureWithRelations[]
    ): Promise<{
        spells: Array<{ spell: Spell; classSpellLevel: number | null; isKnown: boolean; isFreeGrant?: boolean }>;
        domainSpells: Array<{ domainId: number; domainName: string; spell: Spell; spellLevel: number; classSpellLevel: number | null; isKnown: boolean }>;
        availableFreeSpells?: number;
    }> {
        // Get character
        const character = await prisma.userCharacter.findUnique({
            where: { id: characterId },
            include: {
                advancements: {
                    include: {
                        spellsKnown: {
                            select: {
                                spellId: true,
                                isFreeGrant: true
                            }
                        }
                    }
                },
                disallowedSources: {
                    select: {
                        sourceBookId: true
                    }
                },
                abilityScores: {
                    select: {
                        abilityId: true,
                        value: true
                    }
                }
            }
        });

        if (!character) {
            throw new Error('Character not found');
        }

        // Get class details
        const classDetails = await prisma.class.findUnique({
            where: { id: classId },
            select: {
                canCastSpells: true,
                spellsKnown: true,
            }
        });

        if (!classDetails || !classDetails.canCastSpells) {
            return { spells: [], domainSpells: [] };
        }

        const characterLevel = character.advancements.length;
        const disallowedSourceIds = character.disallowedSources.map(ds => ds.sourceBookId);
        const knownSpellIds = new Set(
            character.advancements.flatMap(adv => adv.spellsKnown.map(s => s.spellId))
        );

        // Get character's domains for this class
        const domainIds = await characterSpellService.getCharacterDomains(characterId, classId);

        // Get domain spells if character has domains
        let domainSpells: Array<{ domainId: number; domainName: string; spell: Spell; spellLevel: number; classSpellLevel: number | null; isKnown: boolean }> = [];
        if (domainIds.length > 0) {
            const domainSpellData = await spellService.getDomainSpells(domainIds, characterLevel, classId);

            domainSpells = domainSpellData.map(ds => {
                // Filter by source restrictions
                const spellSourceIds = ds.spell.sourceBookInfo?.map(sb => sb.sourceBookId) || [];
                const isDisallowed = spellSourceIds.some(sid => disallowedSourceIds.includes(sid));

                if (isDisallowed) {
                    return null;
                }

                return {
                    domainId: ds.domainId,
                    domainName: ds.domainName,
                    spell: ds.spell,
                    spellLevel: ds.spellLevel,
                    classSpellLevel: ds.classSpellLevel,
                    isKnown: knownSpellIds.has(ds.spell.id)
                };
            }).filter((ds): ds is NonNullable<typeof ds> => ds !== null);
        }

        // Check if this is a spellbook class (has EntityAppliesToType.SpellbookSpell in resolved features or database)
        let isSpellbookClass = false;
        let availableFreeSpells: number | undefined = undefined;
        let hasZeroLevelGrant = false;

        if (resolvedProgressions) {
            for (const feature of resolvedProgressions) {
                // Check if this feature applies to the class via many-to-many relationship
                const appliesToClass = feature.classes && feature.classes.some(c => c.classId === classId);

                if (appliesToClass && feature.entities) {
                    for (const entity of feature.entities) {
                        if (entity.type === EntityType.Choice &&
                            entity.appliesTo === EntityAppliesToType.SpellbookSpell) {
                            isSpellbookClass = true;
                            break;
                        }
                    }
                    if (isSpellbookClass) break;
                }
            }

            // Calculate available free spells for spellbook classes
            if (isSpellbookClass) {
                const characterWithDetails = await characterCrudService.getCharacterWithAllDetails({ id: characterId });
                if (characterWithDetails) {
                    availableFreeSpells = ResolvedFeatureService.getAvailableSpellbookSpells(
                        resolvedProgressions,
                        characterLevel,
                        classId,
                        characterWithDetails
                    );

                    // Check if 0th level spells are granted via feature
                    hasZeroLevelGrant = ResolvedFeatureService.hasZeroLevelSpellbookSpellsGrant(
                        resolvedProgressions,
                        classId
                    );
                }
            }
        } else {
            // If resolved features are not provided, check database directly via many-to-many relationship
            // First, find features linked to this class
            const classLinks = await prisma.featureClassMap.findMany({
                where: { classId },
                select: { featureId: true }
            });
            const progressionIds = classLinks.map(link => link.featureId);

            if (progressionIds.length > 0) {
                // Check for spellbook class (EntityType.Other + SpellbookSpell)
                const spellbookProgression = await prisma.featureEntity.findFirst({
                    where: {
                        featureId: { in: progressionIds },
                        feature: {
                            level: { lte: characterLevel }
                        },
                        type: EntityType.Other,
                        appliesTo: EntityAppliesToType.SpellbookSpell
                    }
                });

                if (spellbookProgression) {
                    isSpellbookClass = true;
                }

                // Check for 0th level spell grant (EntityType.Other + SpellbookSpell + appliesToId: 0 + appliesToSubId: -1)
                const zeroLevelGrantEntity = await prisma.featureEntity.findFirst({
                    where: {
                        featureId: { in: progressionIds },
                        feature: {
                            level: { lte: characterLevel }
                        },
                        type: EntityType.Other,
                        appliesTo: EntityAppliesToType.SpellbookSpell,
                        appliesToId: 0,
                        appliesToSubId: -1
                    }
                });

                if (zeroLevelGrantEntity) {
                    hasZeroLevelGrant = true;
                }
            }
        }

        // Get spells for this class
        let spells: Array<{ spell: Spell; classSpellLevel: number | null; isKnown: boolean; isFreeGrant?: boolean }> = [];

        // Build map of spellId -> isFreeGrant for known spells
        const spellFreeGrantMap = new Map<number, boolean>();
        for (const advancement of character.advancements) {
            for (const spellKnown of advancement.spellsKnown) {
                spellFreeGrantMap.set(spellKnown.spellId, spellKnown.isFreeGrant);
            }
        }

        if (classDetails.spellsKnown && !isSpellbookClass) {
            // For spellsKnown classes (Sorcerer, Bard, etc.), get spells from AdvancementSpell
            // This includes 0th level spells that players have selected
            const knownSpells = await prisma.advancementSpell.findMany({
                where: {
                    advancement: {
                        characterId,
                        classId
                    }
                },
                include: {
                    spell: {
                        include: {
                            levelMapping: {
                                where: { classId },
                                select: {
                                    classId: true,
                                    level: true
                                }
                            },
                            descriptorIds: {
                                select: {
                                    descriptorId: true
                                }
                            },
                            schoolIds: {
                                select: {
                                    schoolId: true
                                }
                            },
                            subSchoolIds: {
                                select: {
                                    subSchoolId: true
                                }
                            },
                            componentIds: {
                                select: {
                                    componentId: true
                                }
                            },
                            sourceBookInfo: {
                                select: {
                                    sourceBookId: true,
                                    pageNumber: true,
                                    sourceBook: {
                                        select: {
                                            id: true,
                                            abbreviation: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            spells = knownSpells.map(as => {
                const spellSourceIds = as.spell.sourceBookInfo?.map(sb => sb.sourceBookId) || [];
                const isDisallowed = spellSourceIds.some(sid => disallowedSourceIds.includes(sid));

                if (isDisallowed) {
                    return null;
                }

                return {
                    spell: as.spell,
                    classSpellLevel: as.spell.levelMapping[0]?.level ?? null,
                    isKnown: true,
                    isFreeGrant: as.isFreeGrant
                };
            }).filter((s): s is NonNullable<typeof s> => s !== null);
        } else if (isSpellbookClass) {
            // For spellbook classes, query all spells from SpellLevelMap
            // 0th level spells are marked as known if the grant feature exists
            // Non-0th level spells come from AdvancementSpell
            const spellLevelMappings = await prisma.spellLevelMap.findMany({
                where: {
                    classId,
                    level: { lte: characterLevel }
                },
                include: {
                    spell: {
                        include: {
                            levelMapping: {
                                where: { classId },
                                select: {
                                    classId: true,
                                    level: true
                                }
                            },
                            descriptorIds: {
                                select: {
                                    descriptorId: true
                                }
                            },
                            schoolIds: {
                                select: {
                                    schoolId: true
                                }
                            },
                            subSchoolIds: {
                                select: {
                                    subSchoolId: true
                                }
                            },
                            componentIds: {
                                select: {
                                    componentId: true
                                }
                            },
                            sourceBookInfo: {
                                select: {
                                    sourceBookId: true,
                                    pageNumber: true,
                                    sourceBook: {
                                        select: {
                                            id: true,
                                            abbreviation: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            spells = spellLevelMappings.map(slm => {
                const spellSourceIds = slm.spell.sourceBookInfo?.map(sb => sb.sourceBookId) || [];
                const isDisallowed = spellSourceIds.some(sid => disallowedSourceIds.includes(sid));

                if (isDisallowed) {
                    return null;
                }

                // For 0th level spells: mark as known if grant feature exists
                // For non-0th level spells: check AdvancementSpell records
                const isZeroLevel = slm.level === 0;
                let isKnown: boolean;
                let isFreeGrant: boolean | undefined = undefined;

                if (isZeroLevel && hasZeroLevelGrant) {
                    // 0th level spell with grant feature - always known (no database record)
                    isKnown = true;
                    isFreeGrant = true; // These are free grants via feature
                } else {
                    // Non-0th level spell or 0th level without grant - check AdvancementSpell
                    isKnown = knownSpellIds.has(slm.spell.id);
                    isFreeGrant = isKnown ? spellFreeGrantMap.get(slm.spell.id) : undefined;
                }

                return {
                    spell: slm.spell,
                    classSpellLevel: slm.level,
                    isKnown,
                    isFreeGrant
                };
            }).filter((s): s is NonNullable<typeof s> => s !== null);
        } else {
            // For non-spellsKnown classes, get all available spells from SpellLevelMap
            const spellLevelMappings = await prisma.spellLevelMap.findMany({
                where: {
                    classId,
                    level: { lte: characterLevel }
                },
                include: {
                    spell: {
                        include: {
                            levelMapping: {
                                where: { classId },
                                select: {
                                    classId: true,
                                    level: true
                                }
                            },
                            descriptorIds: {
                                select: {
                                    descriptorId: true
                                }
                            },
                            schoolIds: {
                                select: {
                                    schoolId: true
                                }
                            },
                            subSchoolIds: {
                                select: {
                                    subSchoolId: true
                                }
                            },
                            componentIds: {
                                select: {
                                    componentId: true
                                }
                            },
                            sourceBookInfo: {
                                select: {
                                    sourceBookId: true,
                                    pageNumber: true,
                                    sourceBook: {
                                        select: {
                                            id: true,
                                            abbreviation: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            spells = spellLevelMappings.map(slm => {
                const spellSourceIds = slm.spell.sourceBookInfo?.map(sb => sb.sourceBookId) || [];
                const isDisallowed = spellSourceIds.some(sid => disallowedSourceIds.includes(sid));

                if (isDisallowed) {
                    return null;
                }

                const isKnown = knownSpellIds.has(slm.spell.id);
                return {
                    spell: slm.spell,
                    classSpellLevel: slm.level,
                    isKnown,
                    isFreeGrant: isKnown ? spellFreeGrantMap.get(slm.spell.id) : undefined
                };
            }).filter((s): s is NonNullable<typeof s> => s !== null);
        }

        return {
            spells,
            domainSpells,
            ...(availableFreeSpells !== undefined && { availableFreeSpells })
        };
    },

    async getMaxCastableSpellLevel(classId: number, characterLevel: number): Promise<number> {
        // Get spellcasting from feature-based system
        const features = await featureSystemService.getFeaturesByClassId(classId);

        // Extract spellcasting feature IDs from feature entities
        const spellcastingProgressionIds: number[] = [];
        for (const feature of features) {
            if (feature.entities) {
                for (const entity of feature.entities) {
                    if (entity.appliesTo === EntityAppliesToType.SpellcastingProgression &&
                        entity.appliesToId !== null &&
                        typeof entity.appliesToId === 'number') {
                        spellcastingProgressionIds.push(entity.appliesToId);
                    }
                }
            }
        }

        let maxSpellLevel = 0;

        if (spellcastingProgressionIds.length > 0) {
            // Get spellcasting from FeatureWithRelations entities
            const features = await prisma.spellcastingProgression.findMany({
                where: {
                    id: { in: spellcastingProgressionIds },
                    classLevel: { lte: characterLevel }
                },
                include: {
                    slots: true
                },
                orderBy: {
                    classLevel: 'desc'
                },
                take: 1
            });

            if (features.length > 0 && features[0].slots && features[0].slots.length > 0) {
                maxSpellLevel = Math.max(...features[0].slots.map(slot => slot.spellLevel));
            }
        }

        return maxSpellLevel;
    },

    async validateSpellLevelForAdvancement(classId: number, advancementLevel: number, spellLevel: number): Promise<boolean> {
        const maxCastableLevel = await characterSpellService.getMaxCastableSpellLevel(classId, advancementLevel);
        return spellLevel <= maxCastableLevel;
    },

    async countFreeGrantsForAdvancement(advancementId: number): Promise<number> {
        const count = await prisma.advancementSpell.count({
            where: {
                advancementId,
                isFreeGrant: true
            }
        });
        return count;
    },

    async addSpellKnown(
        characterId: number,
        classId: number,
        spellId: number,
        advancementId: number,
        isFreeGrant: boolean = false,
        resolvedProgressions?: FeatureWithRelations[]
    ): Promise<AddSpellKnownResponse> {
        // Verify advancement belongs to character and class
        const advancement = await prisma.characterAdvancement.findFirst({
            where: {
                id: advancementId,
                characterId,
                classId
            }
        });

        if (!advancement) {
            throw new Error('Advancement not found or does not belong to character/class');
        }

        // Get spell level for this class
        const spellLevelMapping = await prisma.spellLevelMap.findFirst({
            where: {
                spellId,
                classId
            }
        });

        if (!spellLevelMapping) {
            throw new Error('Spell is not available for this class');
        }

        const spellLevel = spellLevelMapping.level;

        // ALWAYS validate spell level (for both free grants and ad-hoc scribing)
        const isValidSpellLevel = await characterSpellService.validateSpellLevelForAdvancement(classId, advancement.level, spellLevel);
        if (!isValidSpellLevel) {
            const maxCastableLevel = await characterSpellService.getMaxCastableSpellLevel(classId, advancement.level);
            throw new Error(`Cannot scribe ${spellLevel} level spell at character level ${advancement.level}. Maximum castable level is ${maxCastableLevel}`);
        }

        // When isFreeGrant: true, also validate quantity limit
        // Declare variables outside the block so they're accessible in the response section
        let characterForValidation: CharacterWithAllDetailsResponse | null = null;
        let effectiveResolvedProgressionsForValidation: FeatureWithRelations[] | undefined = resolvedProgressions;

        if (isFreeGrant) {
            // Get character with all details for resolved features calculation
            characterForValidation = await characterCrudService.getCharacterWithAllDetails({ id: characterId });
            if (!characterForValidation) {
                throw new Error('Character not found');
            }

            // Try to get resolved features from state first (if character is being edited)
            if (!effectiveResolvedProgressionsForValidation) {
                const resolvedResultsService = new CharacterResolvedResultsService();
                const resolvedResults = await resolvedResultsService.getResolvedResults(characterId);
                if (resolvedResults?.resolvedProgressions) {
                    effectiveResolvedProgressionsForValidation = resolvedResults.resolvedProgressions;
                }
            }

            if (!effectiveResolvedProgressionsForValidation) {
                throw new Error(
                    'Free-grant spellbook operations require an active character resolution session. ' +
                    'Start viewing/editing the character to initialize resolved state, then retry.'
                );
            }

            // Calculate available free spells for this advancement level
            const availableFreeSpells = ResolvedFeatureService.getAvailableSpellbookSpells(
                effectiveResolvedProgressionsForValidation!,
                advancement.level,
                classId,
                characterForValidation
            );

            // Count existing free grants for this advancement
            const freeSpellsUsed = await characterSpellService.countFreeGrantsForAdvancement(advancementId);

            if (freeSpellsUsed >= availableFreeSpells) {
                throw new Error(`Maximum free spells reached for this level. Available: ${availableFreeSpells}, Used: ${freeSpellsUsed}`);
            }
        }

        // Check if spell is already known
        const existing = await prisma.advancementSpell.findUnique({
            where: {
                advancementId_spellId: {
                    advancementId,
                    spellId
                }
            }
        });

        if (existing) {
            return { message: 'Spell already known' };
        }

        // Add spell to AdvancementSpell with isFreeGrant flag
        await prisma.advancementSpell.create({
            data: {
                advancementId,
                spellId,
                isFreeGrant
            }
        });

        // Get updated character with the new spell
        const updatedCharacter = await characterCrudService.getCharacterWithAllDetails({ id: characterId });
        if (!updatedCharacter) {
            throw new Error('Character not found after adding spell');
        }

        // Check for active resolution state
        const resolvedResultsService = new CharacterResolvedResultsService();
        let resolvedCharacterResult: ResolvedCharacterResult | undefined;

        const resolvedResults = await resolvedResultsService.getResolvedResults(characterId);

        if (resolvedResults) {
            // Re-resolve features with updated character state
            const advancementForResolution = updatedCharacter.advancements?.find(adv => adv.id === advancementId);
            const raceDetails = updatedCharacter.raceId ? await raceService.getRaceById({ id: updatedCharacter.raceId }) : null;
            const classDetails = classId ? await classService.getClassById({ id: classId }) : null;
            const secondaryClassDetails = advancementForResolution?.secondaryClassId
                ? await classService.getClassById({ id: advancementForResolution.secondaryClassId })
                : null;

            // Extract user choices from character feature choices
            const userChoices: UserChoices = {};
            if (updatedCharacter.advancements) {
                for (const adv of updatedCharacter.advancements) {
                    if (adv.featureChoices) {
                        for (const choice of adv.featureChoices) {
                            // Find the entity in resolved features to get appliesTo type
                            if (resolvedResults?.resolvedProgressions) {
                                for (const feature of resolvedResults.resolvedProgressions) {
                                    if (feature.id === choice.featureId && feature.entities) {
                                        const entity = feature.entities.find(e => e.id === choice.featureEntityId);
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
            }

            // Build resolution context
            const context: ResolutionContext = {
                character: updatedCharacter,
                targetLevel: advancement.level,
                advancement: advancementForResolution,
                raceDetails,
                classDetails: classDetails ?? null,
                secondaryClassDetails: secondaryClassDetails ?? null,
                isGestalt: !!secondaryClassDetails,
                userChoices: Object.keys(userChoices).length > 0 ? userChoices : undefined,
                includePendingChoices: true,
                resolveCascading: true,
                maxResolutionDepth: 10,
            };

            // Re-resolve features
            const resolutionResult = await CharacterResolutionService.resolveCharacterFeatures(
                updatedCharacter,
                advancement.level,
                context
            );

            // Rebuild CharacterEditState from updated character
            const updatedCharacterState = buildCharacterEditState(
                updatedCharacter,
                advancement.level,
                !!secondaryClassDetails
            );

            // Build ResolvedCharacterResult
            const classSkills = ResolvedFeatureService.getClassSkills(resolutionResult.resolvedProgressions);
            const skillBonuses = await ResolvedFeatureService.getSkillBonuses(resolutionResult.resolvedProgressions);
            const grantedFeats = ResolvedFeatureService.getGrantedFeats(resolutionResult.resolvedProgressions);

            // Calculate class levels for available feats
            const classLevels = new Map<number, number>();
            if (updatedCharacter.advancements) {
                for (const adv of updatedCharacter.advancements) {
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
                advancement.level,
                classLevels
            );
            const availableFighterBonusFeats = ResolvedFeatureService.getAvailableFighterBonusFeats(
                resolutionResult.resolvedProgressions
            );

            // Calculate qualified feats (list of feats the character qualifies for)
            const allFeatsResponse = await featService.getAllFeats();
            const qualifiedFeats = await AvailableFeatService.getQualifiedFeats(
                updatedCharacter,
                resolutionResult.resolvedProgressions,
                classDetails,
                raceDetails,
                allFeatsResponse.results
            );

            const resolvedCharacterResultForSession: ResolvedCharacterResult = {
                resolvedProgressions: resolutionResult.resolvedProgressions,
                pendingChoices: resolutionResult.pendingChoices,
                classSkills,
                skillBonuses,
                grantedFeats: grantedFeats.map(f => f.appliesToId!).filter((id): id is number => id !== null),
                availableFeatsCount,
                availableFighterBonusFeats,
                qualifiedFeats,
                warnings: resolutionResult.warnings,
                errors: resolutionResult.errors
            };

            // Update state and resolved results
            const stateService = new DraftStateService();
            await stateService.setState(DraftType.Character, characterId, updatedCharacterState as CharacterEditState);
            await resolvedResultsService.setResolvedResults(characterId, resolvedCharacterResultForSession);

            resolvedCharacterResult = resolvedCharacterResultForSession;
        }

        // Build response with free spell counts if this was a free grant
        // Note: Backend updates resolution state automatically, but does not return resolvedCharacter
        // Frontend should call resolution.refreshState() to refresh resolution state
        const response: AddSpellKnownResponse = {
            message: 'Spell added successfully'
        };

        if (isFreeGrant && characterForValidation) {
            // Use the character and resolved features from validation (already fetched)
            let effectiveResolvedProgressions = effectiveResolvedProgressionsForValidation;
            const characterForResponse = characterForValidation;

            // If we still don't have resolved features, fetch them now
            if (!effectiveResolvedProgressions) {
                // Load race and class details for resolution
                const raceDetails = characterForResponse.raceId ? await raceService.getRaceById({ id: characterForResponse.raceId }) : null;
                const classDetails = classId ? await classService.getClassById({ id: classId }) : null;

                // Find secondary class if this is a gestalt advancement
                const advancementForResolution = characterForResponse.advancements?.find(adv => adv.id === advancementId);
                const secondaryClassDetails = advancementForResolution?.secondaryClassId
                    ? await classService.getClassById({ id: advancementForResolution.secondaryClassId })
                    : null;

                // Build initial context without user choices for first pass
                const initialContext: ResolutionContext = {
                    character: characterForResponse,
                    targetLevel: advancement.level,
                    advancement: advancementForResolution,
                    raceDetails,
                    classDetails: classDetails ?? null,
                    secondaryClassDetails: secondaryClassDetails ?? null,
                    isGestalt: !!secondaryClassDetails,
                    userChoices: undefined,
                    includePendingChoices: false,
                    resolveCascading: false,
                    maxResolutionDepth: 10,
                };

                // First pass: Resolve base features to get features
                const firstPassResult = await CharacterResolutionService.resolveCharacterFeatures(
                    characterForResponse,
                    advancement.level,
                    initialContext
                );

                // Extract user choices from character feature choices
                const userChoices: UserChoices = {};
                if (characterForResponse.advancements) {
                    for (const adv of characterForResponse.advancements) {
                        if (adv.featureChoices) {
                            for (const choice of adv.featureChoices) {
                                // Find the entity in resolved features to get appliesTo type
                                for (const feature of firstPassResult.resolvedProgressions) {
                                    if (feature.id === choice.featureId && feature.entities) {
                                        const entity = feature.entities.find(e => e.id === choice.featureEntityId);
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
                const finalContext: ResolutionContext = {
                    character: characterForResponse,
                    targetLevel: advancement.level,
                    advancement: advancementForResolution,
                    raceDetails,
                    classDetails: classDetails ?? null,
                    secondaryClassDetails: secondaryClassDetails ?? null,
                    isGestalt: !!secondaryClassDetails,
                    userChoices: Object.keys(userChoices).length > 0 ? userChoices : undefined,
                    includePendingChoices: false,
                    resolveCascading: true,
                    maxResolutionDepth: 10,
                };

                // Resolve character features with user choices
                const resolutionResult = await CharacterResolutionService.resolveCharacterFeatures(
                    characterForResponse,
                    advancement.level,
                    finalContext
                );

                effectiveResolvedProgressions = resolutionResult.resolvedProgressions;
            }

            // Calculate available free spells for this advancement level
            const availableFreeSpells = ResolvedFeatureService.getAvailableSpellbookSpells(
                effectiveResolvedProgressions!,
                advancement.level,
                classId,
                characterForResponse!
            );

            // Count free grants for this advancement (including the one we just added)
            const freeSpellsUsed = await characterSpellService.countFreeGrantsForAdvancement(advancementId);
            const remainingFreeSpells = availableFreeSpells - freeSpellsUsed;

            response.freeSpellsUsed = freeSpellsUsed;
            response.availableFreeSpells = availableFreeSpells;
            response.remainingFreeSpells = Math.max(0, remainingFreeSpells);
        }

        return response;
    },

    async removeSpellKnown(characterId: number, spellId: number, advancementId: number): Promise<RemoveSpellKnownResponse> {
        // Verify advancement belongs to character and get the spell to check if it was a free grant
        const advancement = await prisma.characterAdvancement.findFirst({
            where: {
                id: advancementId,
                characterId
            },
            include: {
                spellsKnown: {
                    where: {
                        spellId
                    }
                }
            }
        });

        if (!advancement) {
            throw new Error('Advancement not found or does not belong to character');
        }

        // Check if the spell being removed was a free grant
        const spellToRemove = advancement.spellsKnown[0];
        const wasFreeGrant = spellToRemove?.isFreeGrant ?? false;

        // Remove spell from AdvancementSpell
        await prisma.advancementSpell.delete({
            where: {
                advancementId_spellId: {
                    advancementId,
                    spellId
                }
            }
        });

        // Get updated character without the removed spell
        const updatedCharacter = await characterCrudService.getCharacterWithAllDetails({ id: characterId });
        if (!updatedCharacter) {
            throw new Error('Character not found after removing spell');
        }

        // Check for active resolution state
        const resolvedResultsService = new CharacterResolvedResultsService();
        let resolvedCharacterResult: ResolvedCharacterResult | undefined;

        const resolvedResults = await resolvedResultsService.getResolvedResults(characterId);

        if (resolvedResults) {
            // Re-resolve features with updated character state
            const classId = advancement.classId;
            const advancementForResolution = updatedCharacter.advancements?.find(adv => adv.id === advancementId);
            const raceDetails = updatedCharacter.raceId ? await raceService.getRaceById({ id: updatedCharacter.raceId }) : null;
            const classDetails = classId ? await classService.getClassById({ id: classId }) : null;
            const secondaryClassDetails = advancementForResolution?.secondaryClassId
                ? await classService.getClassById({ id: advancementForResolution.secondaryClassId })
                : null;

            // Extract user choices from character feature choices
            const userChoices: UserChoices = {};
            if (updatedCharacter.advancements) {
                for (const adv of updatedCharacter.advancements) {
                    if (adv.featureChoices) {
                        for (const choice of adv.featureChoices) {
                            // Find the entity in resolved features to get appliesTo type
                            if (resolvedResults?.resolvedProgressions) {
                                for (const feature of resolvedResults.resolvedProgressions) {
                                    if (feature.id === choice.featureId && feature.entities) {
                                        const entity = feature.entities.find(e => e.id === choice.featureEntityId);
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
            }

            // Build resolution context
            const context: ResolutionContext = {
                character: updatedCharacter,
                targetLevel: advancement.level,
                advancement: advancementForResolution,
                raceDetails,
                classDetails: classDetails ?? null,
                secondaryClassDetails: secondaryClassDetails ?? null,
                isGestalt: !!secondaryClassDetails,
                userChoices: Object.keys(userChoices).length > 0 ? userChoices : undefined,
                includePendingChoices: true,
                resolveCascading: true,
                maxResolutionDepth: 10,
            };

            // Re-resolve features
            const resolutionResult = await CharacterResolutionService.resolveCharacterFeatures(
                updatedCharacter,
                advancement.level,
                context
            );

            // Rebuild CharacterEditState from updated character
            const updatedCharacterState = buildCharacterEditState(
                updatedCharacter,
                advancement.level,
                !!secondaryClassDetails
            );

            // Build ResolvedCharacterResult
            const classSkills = ResolvedFeatureService.getClassSkills(resolutionResult.resolvedProgressions);
            const skillBonuses = await ResolvedFeatureService.getSkillBonuses(resolutionResult.resolvedProgressions);
            const grantedFeats = ResolvedFeatureService.getGrantedFeats(resolutionResult.resolvedProgressions);

            // Calculate class levels for available feats
            const classLevels = new Map<number, number>();
            if (updatedCharacter.advancements) {
                for (const adv of updatedCharacter.advancements) {
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
                advancement.level,
                classLevels
            );
            const availableFighterBonusFeats = ResolvedFeatureService.getAvailableFighterBonusFeats(
                resolutionResult.resolvedProgressions
            );

            // Calculate qualified feats (list of feats the character qualifies for)
            const allFeatsResponse = await featService.getAllFeats();
            const qualifiedFeats = await AvailableFeatService.getQualifiedFeats(
                updatedCharacter,
                resolutionResult.resolvedProgressions,
                classDetails,
                raceDetails,
                allFeatsResponse.results
            );

            const resolvedCharacterResultForSession: ResolvedCharacterResult = {
                resolvedProgressions: resolutionResult.resolvedProgressions,
                pendingChoices: resolutionResult.pendingChoices,
                classSkills,
                skillBonuses,
                grantedFeats: grantedFeats.map(f => f.appliesToId!).filter((id): id is number => id !== null),
                availableFeatsCount,
                availableFighterBonusFeats,
                qualifiedFeats,
                warnings: resolutionResult.warnings,
                errors: resolutionResult.errors
            };

            // Update state and resolved results
            const stateService = new DraftStateService();
            await stateService.setState(DraftType.Character, characterId, updatedCharacterState as CharacterEditState);
            await resolvedResultsService.setResolvedResults(characterId, resolvedCharacterResultForSession);

            resolvedCharacterResult = resolvedCharacterResultForSession;
        }

        // Build response with free spell counts if this was a free grant
        // Note: Backend updates resolution session automatically, but does not return resolvedCharacter
        // Frontend should call resolution.refreshState() to refresh resolution state
        const response: RemoveSpellKnownResponse = {
            message: 'Spell removed successfully'
        };

        if (wasFreeGrant && resolvedCharacterResult) {
            // Use resolved features from the state update (already done above)
            const effectiveResolvedProgressions = resolvedCharacterResult.resolvedProgressions;

            // Calculate available free spells for this advancement level
            const availableFreeSpells = ResolvedFeatureService.getAvailableSpellbookSpells(
                effectiveResolvedProgressions,
                advancement.level,
                advancement.classId,
                updatedCharacter
            );

            // Count free grants for this advancement (after removal)
            const freeSpellsUsed = await characterSpellService.countFreeGrantsForAdvancement(advancementId);
            const remainingFreeSpells = availableFreeSpells - freeSpellsUsed;

            response.freeSpellsUsed = freeSpellsUsed;
            response.availableFreeSpells = availableFreeSpells;
            response.remainingFreeSpells = Math.max(0, remainingFreeSpells);
        }

        return response;
    },
};
