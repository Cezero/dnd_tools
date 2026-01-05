import { ClassSkillService } from '@/features/class/ClassSkillService';
import { CharacterCalculationService } from '@/lib/character-calculation';
import type { CombatValuesResult } from '@/lib/character-calculation/calculations/combatValues';
import { SaveType } from '@/lib/character-calculation/calculations/savingThrows';
import { getAllCharacterFeats } from '@/lib/character-calculation/core/featAccessor';
import type { BreakdownMap } from '@/lib/character-calculation/types';
import { canUseTwoHanded, isTwoHandedWeapon } from '@/lib/character-calculation/utils/weaponHelpers';
import type { FeatureProgression, ItemWithDetails, CharacterItem, CharacterWithAllDetailsResponse, DnDClass, Race, FeatureEntityCondition } from '@shared/schema';
import { EntityAppliesToType, EntityType, AbilityId, SKILL_LIST, CRAFT_SKILL_MAP, KNOWLEDGE_SKILL_MAP, SkillSubType, SKILL_SUB_TYPE_COMPATIBILITY, SpecialFeatureId, BreakdownComponentType, FeatureEntityConditionType } from '@shared/static-data';
import { getBABProgression } from '@shared/utils';

import { conditionLabelerRegistry } from './condition-labeler-registry';
import { conditionValueFormatterRegistry } from './condition-value-formatter-registry';
import { DisplayStrategyBase } from './displayStrategyBase';
import { weaponNameLabeler, type WeaponNameLabelerContext } from './label-formatters';
import { WeightFormatter, CriticalFormatter, AttackBonusFormatter, DistanceFormatter, SizeCategoryFormatter, DamageTypeFormatter, DamageStringFormatter } from './pure-formatters';
import type {
    DisplayContext,
    DisplayResult,
    GroupedLevelItem,
    FormattedEntityResult,
    CharacterSheetDisplayResult,
    FormattedItemWithLevel,
    FormattedCharacterResult,
    FormattedAbilityScore,
    FormattedClassLevel,
    FormattedInitiative,
    FormattedGrapple,
    CalculatedEntity,
    FormattedAttackResult,
    FormattedSkill,
    FormattedSavingThrow,
    FormattedArmorClass,
    FormattedFeat,
    FormattedFeature,
    FormattedProficiency,
    CalculationBreakdown,
    BreakdownComponent,
} from './types';

export class CharacterSheetDisplayStrategy extends DisplayStrategyBase {
    protected formatProgressions(
        progressions: FeatureProgression[],
        context?: DisplayContext,
        showLabels: boolean = true
    ): CharacterSheetDisplayResult {
        // Process all progressions through phases 1-4 (skip grouping phases)
        const allFormattedItems: FormattedItemWithLevel[] = [];

        // Set displayBonusType to false for character sheet display
        const characterSheetContext: DisplayContext = {
            ...context,
            displayBonusType: false
        };

        for (const progression of progressions) {
            const calculatedValues = this.generateValues(progression, characterSheetContext);
            const formattedItems = this.formattingPhase.formatItems(calculatedValues, progression.level, showLabels, characterSheetContext);
            allFormattedItems.push(...formattedItems);
        }

        // Convert to FormattedEntityResult and apply conditions
        const individualEntities: FormattedEntityResult[] = allFormattedItems.map(item => {
            let formattedValue = item.formattedValue;

            // Apply condition formatting if entity has conditions
            if (item.entity.conditions && item.entity.conditions.length > 0) {
                formattedValue = this.formatConditions(
                    item.entity.conditions,
                    formattedValue,
                    item.entity
                );
            }

            return {
                formattedValue,
                breakdown: item.breakdown,
                entity: item.entity,
                level: item.level,
                computedValue: this.extractComputedValue(item),
                structuredData: this.extractStructuredData(item)
            };
        });

        // Group by EntityAppliesToType
        const groupedByType = this.groupByEntityType(individualEntities);

        return {
            formattedValue: '', // Not used for character sheet
            breakdown: { components: [] },
            showBreakdown: false,
            components: [],
            levelEntries: [],
            groupedByType,
            individualEntities
        };
    }

    /**
     * Extract computed numeric value from formatted item
     */
    private extractComputedValue(item: FormattedItemWithLevel): number | undefined {
        // For bonuses, try to extract the numeric value
        if (item.entity.type === 0 && item.entity.value !== null) { // EntityType.Bonus
            // Handle both number and string values
            if (typeof item.entity.value === 'number') {
                return item.entity.value;
            }
            // If it's a string, try to parse it as a number
            const parsed = parseFloat(item.entity.value);
            return isNaN(parsed) ? undefined : parsed;
        }

        // For other types, try to extract from breakdown
        if (item.breakdown.components.length > 0) {
            const lastComponent = item.breakdown.components[item.breakdown.components.length - 1];
            if (typeof lastComponent.value === 'number') {
                return lastComponent.value;
            }
        }

        return undefined;
    }

    /**
     * Extract structured data from formatted item
     * TODO: what is the poiunt of this function? when is it called?
     */
    private extractStructuredData(item: FormattedItemWithLevel): FormattedEntityResult['structuredData'] {
        const entity = item.entity;

        // For bonuses
        if (entity.type === 0) { // EntityType.Bonus
            const value = typeof entity.value === 'number' ? entity.value : 0;
            return {
                type: 'bonus',
                value: value,
                target: this.getTargetName(entity)
            };
        }

        // For uses
        if (entity.appliesTo === EntityAppliesToType.Uses) {
            const value = typeof entity.value === 'number' ? entity.value : 0;
            return {
                type: 'uses',
                value: value,
                interval: 'day' // Default, could be extracted from formula params
            };
        }

        // For proficiencies
        if (entity.appliesTo === EntityAppliesToType.Feat) {
            return {
                type: 'proficiency',
                value: 1, // Proficiency is binary
                target: this.getTargetName(entity)
            };
        }

        return undefined;
    }

    /**
     * Get target name for structured data
     */
    private getTargetName(entity: CalculatedEntity): string | undefined {
        if (entity.item?.name) {
            return entity.item.name;
        }
        if (entity.feat?.name) {
            return entity.feat.name;
        }
        if (entity.feature?.name) {
            return entity.feature.name;
        }
        return undefined;
    }

    /**
     * Format conditions by grouping conditions of the same type together.
     * This is the same logic as GroupingPhase.formatConditions but made accessible here.
     */
    private formatConditions(
        conditions: FeatureEntityCondition[],
        formattedValue: string,
        entity: CalculatedEntity
    ): string {
        if (conditions.length === 0) {
            return formattedValue;
        }

        let hasSpellSchoolCondition = false;
        // Step 1: Group conditions by type
        const conditionsByType = new Map<FeatureEntityConditionType, number[]>();
        for (const condition of conditions) {
            if (!conditionsByType.has(condition.conditionType)) {
                conditionsByType.set(condition.conditionType, []);
            }
            conditionsByType.get(condition.conditionType)!.push(condition.conditionValue);
        }

        const formattedConditions: string[] = [];

        // Step 2: Process each condition type
        for (const [conditionType, conditionValues] of conditionsByType) {
            if (conditionType === FeatureEntityConditionType.spell_school) {
                hasSpellSchoolCondition = true;
            }
            // Step 2a: Format each condition value
            const formatter = conditionValueFormatterRegistry.getFormatter(conditionType);
            const formattedValues = conditionValues
                .map(value => formatter ? formatter.format(value) : '')
                .filter(Boolean)
                .join(', ');

            if (formattedValues) {
                // Step 2b: Apply labeler to the formatted values with entity context
                const labeler = conditionLabelerRegistry.getLabeler(conditionType, entity.appliesTo);
                const labeledCondition = labeler ? labeler(formattedValues, entity) : formattedValues;
                formattedConditions.push(labeledCondition);
            }
        }

        // Step 3: Combine with the main formatted value
        if (formattedConditions.length === 0) {
            return formattedValue;
        }

        if (hasSpellSchoolCondition && entity.appliesTo === EntityAppliesToType.SpellSvDC) {
            return `${formattedConditions.join(' ')} ${formattedValue}`;
        }

        return `${formattedValue} ${formattedConditions.join(' ')}`;
    }

    /**
     * Group entities by EntityAppliesToType
     */
    private groupByEntityType(entities: FormattedEntityResult[]): Record<EntityAppliesToType, FormattedEntityResult[]> {
        const grouped: Record<EntityAppliesToType, FormattedEntityResult[]> = {} as Record<EntityAppliesToType, FormattedEntityResult[]>;

        for (const entity of entities) {
            const appliesTo = entity.entity.appliesTo;
            if (appliesTo !== null && appliesTo !== undefined) {
                if (!grouped[appliesTo]) {
                    grouped[appliesTo] = [];
                }
                grouped[appliesTo].push(entity);
            }
        }

        return grouped;
    }

    /**
     * Override Phase 6 to implement DisplayType.CharacterSheet specific logic
     */
    protected createDisplayResult(
        withinProgressionGrouped: GroupedLevelItem[],
        context?: DisplayContext,
        _progression?: FeatureProgression
    ): DisplayResult {
        // DisplayType.CharacterSheet: filter to current character level only
        const currentLevel = context?.character?.classLevels ?
            Math.max(...Object.values(context.character.classLevels)) : 1;

        // Find the item for the current level
        const currentItem = withinProgressionGrouped.find(item => item.level === currentLevel);

        if (!currentItem) {
            return {
                formattedValue: '',
                breakdown: { components: [] },
                showBreakdown: context?.showBreakdown || false,
                components: [],
                levelEntries: []
            };
        }

        return {
            formattedValue: currentItem.formattedValue,
            breakdown: { components: [] },
            showBreakdown: context?.showBreakdown || false,
            components: [],
            levelEntries: []
        };
    }

    /**
     * Format attack result for character sheet display
     */
    formatAttack(
        attackResult: CombatValuesResult,
        item: ItemWithDetails | CharacterItem | null,
        weaponNameContext?: WeaponNameLabelerContext
    ): FormattedAttackResult {
        const attackBonusFormatter = new AttackBonusFormatter();
        const weightFormatter = new WeightFormatter();
        const criticalFormatter = new CriticalFormatter();
        const distanceFormatter = new DistanceFormatter();
        const sizeCategoryFormatter = new SizeCategoryFormatter();
        const damageTypeFormatter = new DamageTypeFormatter();

        // Format attack bonus with nonlethal handling
        const attackBonus = attackResult.nonlethalAttackBonus !== undefined
            ? attackBonusFormatter.formatWithNonlethal(attackResult.value, attackResult.nonlethalAttackBonus)
            : attackBonusFormatter.format({
                id: 0,
                type: 0,
                progressionId: 0,
                appliesTo: null,
                value: attackResult.value,
                calculatedValue: null,
                groupingId: 0,
                displayInDetail: true,
            } as CalculatedEntity);

        // Format damage using DamageStringFormatter
        const damageFormatter = new DamageStringFormatter();
        const damage = damageFormatter.formatFromComponents(
            attackResult.damage.baseDamage,
            attackResult.damage.abilityModifier,
            attackResult.damage.featBonus
        );

        // Format critical
        const critical = criticalFormatter.format({
            id: 0,
            type: 0,
            progressionId: 0,
            appliesTo: null,
            value: attackResult.critical,
            calculatedValue: null,
            groupingId: 0,
            displayInDetail: true,
        } as CalculatedEntity);

        // Format range using DistanceFormatter
        const range = attackResult.range
            ? distanceFormatter.format({
                id: 0,
                type: 0,
                progressionId: 0,
                appliesTo: null,
                value: attackResult.range,
                calculatedValue: null,
                groupingId: 0,
                displayInDetail: true,
            } as CalculatedEntity)
            : null;

        // Format weight from item
        const weight = item && 'weight' in item && item.weight
            ? weightFormatter.format({
                id: 0,
                type: 0,
                progressionId: 0,
                appliesTo: null,
                value: typeof item.weight === 'object' && 'toNumber' in item.weight
                    ? item.weight.toNumber()
                    : item.weight,
                calculatedValue: null,
                groupingId: 0,
                displayInDetail: true,
            } as CalculatedEntity)
            : null;

        // Format damage type from item
        const type = item && 'weapon' in item && item.weapon?.damageType
            ? damageTypeFormatter.format({
                id: 0,
                type: 0,
                progressionId: 0,
                appliesTo: null,
                appliesToId: parseInt(item.weapon.damageType, 10),
                value: null,
                calculatedValue: null,
                groupingId: 0,
                displayInDetail: true,
            } as CalculatedEntity)
            : null;

        // Format size from item
        const size = item && 'sizeId' in item && item.sizeId
            ? sizeCategoryFormatter.format({
                id: 0,
                type: 0,
                progressionId: 0,
                appliesTo: null,
                appliesToId: item.sizeId,
                value: 0, // Use 0 to indicate no value modifier, just display size category name
                calculatedValue: null,
                groupingId: 0,
                displayInDetail: true,
            } as CalculatedEntity)
            : null;

        // Apply weapon name labeler if context is provided
        let weaponName = attackResult.weaponName;
        if (weaponNameContext) {
            weaponName = weaponNameLabeler(weaponName, weaponNameContext);
        }

        return {
            attackBonus,
            damage,
            critical,
            range,
            weight,
            type,
            size,
            weaponName,
        };
    }

    /**
     * Format complete character for character sheet display
     */
    formatCharacter(
        character: CharacterWithAllDetailsResponse,
        resolvedProgressions: FeatureProgression[],
        items: ItemWithDetails[],
        characterItems: CharacterItem[],
        classDetailsMap: Map<number, DnDClass>,
        context?: DisplayContext,
        race?: Race | null
    ): FormattedCharacterResult {
        // 1. Format attacks (refactored to use phased processing)
        const attacks = this.formatAttacks(
            character,
            resolvedProgressions,
            items,
            characterItems,
            classDetailsMap,
            context
        );

        // 2. Format skills using progressions
        const skills = this.formatSkills(
            character,
            resolvedProgressions,
            items,
            characterItems,
            classDetailsMap,
            context
        );

        // 3. Format saving throws using progressions
        const savingThrows = this.formatSavingThrows(
            character,
            resolvedProgressions,
            items,
            classDetailsMap,
            context
        );

        // 4. Format armor class using progressions
        const armorClass = this.formatArmorClass(
            character,
            resolvedProgressions,
            items,
            characterItems,
            context
        );

        // 5. Format feats using progressions
        const feats = this.formatFeats(
            character,
            resolvedProgressions,
            context
        );

        // 6. Format features using progressions
        const features = this.formatFeatures(
            resolvedProgressions,
            context
        );

        // 7. Format proficiencies using progressions
        const proficiencies = this.formatProficiencies(resolvedProgressions, context);

        // 8. Format abilities
        const abilities = this._formatAbilities(character, resolvedProgressions, context);

        // 9. Format initiative
        const initiative = this._formatInitiative(character, resolvedProgressions, context);

        // 10. Format base attack bonus
        const baseAttackBonus = this._formatBaseAttackBonus(character, classDetailsMap);

        // 11. Format grapple
        const grapple = this._formatGrapple(character, resolvedProgressions, classDetailsMap, context);

        // 12. Format speed
        const speed = this._formatSpeed(character, resolvedProgressions, race ?? null);

        // 13. Format hit points
        const hitPoints = this._formatHitPoints(character);

        // 14. Format class levels
        const classLevels = this._formatClassLevels(character, classDetailsMap);

        return {
            abilities,
            attacks,
            skills,
            savingThrows,
            armorClass,
            initiative,
            baseAttackBonus,
            grapple,
            speed,
            hitPoints,
            classLevels,
            feats,
            features,
            proficiencies
        };
    }

    /**
     * Format attacks using phased processing
     */
    private formatAttacks(
        character: CharacterWithAllDetailsResponse,
        resolvedProgressions: FeatureProgression[],
        items: ItemWithDetails[],
        characterItems: CharacterItem[],
        classDetailsMap: Map<number, DnDClass>,
        context?: DisplayContext
    ): FormattedAttackResult[] {
        const attacks: FormattedAttackResult[] = [];

        if (!character.attackDefinitions || character.attackDefinitions.length === 0) {
            return attacks;
        }

        // Get attack bonuses from progressions using phased processing
        const _attackProgressions = resolvedProgressions.filter(prog =>
            prog.entities?.some(entity => entity.appliesTo === EntityAppliesToType.Attack)
        );

        // Process each attack definition
        for (const definition of character.attackDefinitions) {
            if (definition.attackSlot === null) continue;

            try {
                // Find items for this attack
                const mainHandItem = definition.mainHandCharacterItemId
                    ? items.find(item => {
                        const charItem = characterItems.find(ci => ci.id === definition.mainHandCharacterItemId);
                        return charItem && item.id === charItem.baseItemId;
                    })
                    : undefined;

                const offHandItem = definition.offHandCharacterItemId
                    ? items.find(item => {
                        const charItem = characterItems.find(ci => ci.id === definition.offHandCharacterItemId);
                        return charItem && item.id === charItem.baseItemId;
                    })
                    : undefined;

                // Calculate combat values
                const combatContext = {
                    mainHandItem,
                    offHandItem,
                };

                const results = CharacterCalculationService.getCombatValues(
                    character,
                    resolvedProgressions,
                    combatContext,
                    classDetailsMap,
                    context?.featsMap
                );

                // Format each result
                for (let index = 0; index < results.length; index++) {
                    const result = results[index];
                    const itemForFormatting = index === 0 ? mainHandItem : offHandItem;

                    // Determine weapon name labeler context
                    const isDualWield = offHandItem !== undefined && offHandItem !== null;
                    const isMainHand = index === 0;
                    const isTwoHanded = isMainHand && mainHandItem
                        ? (isTwoHandedWeapon(mainHandItem) || canUseTwoHanded(mainHandItem, offHandItem))
                        : false;

                    const weaponNameContext: WeaponNameLabelerContext = {
                        isDualWield,
                        isMainHand,
                        isTwoHanded,
                    };

                    // Use formatAttack with weapon name labeler context
                    const formatted = this.formatAttack(result, itemForFormatting ?? null, weaponNameContext);
                    attacks.push(formatted);
                }
            } catch (error) {
                console.error('Error formatting attack:', error);
                // Continue with next attack
            }
        }

        return attacks;
    }

    /**
     * Format skills using progressions
     */
    private formatSkills(
        character: CharacterWithAllDetailsResponse,
        resolvedProgressions: FeatureProgression[],
        _items: ItemWithDetails[],
        _characterItems: CharacterItem[],
        classDetailsMap: Map<number, DnDClass>,
        _context?: DisplayContext
    ): FormattedSkill[] {
        const skills: FormattedSkill[] = [];

        // Get skill bonuses from progressions using formatProgressions
        const skillProgressions = resolvedProgressions.filter(prog =>
            prog.entities?.some(entity => entity.appliesTo === EntityAppliesToType.Skill)
        );

        // Calculate class levels
        const classLevelCounts = new Map<number, number>();
        for (const advancement of character.advancements) {
            const currentLevel = classLevelCounts.get(advancement.classId) ?? 0;
            classLevelCounts.set(advancement.classId, currentLevel + 1);
            if (advancement.secondaryClassId) {
                const secondaryLevel = classLevelCounts.get(advancement.secondaryClassId) ?? 0;
                classLevelCounts.set(advancement.secondaryClassId, secondaryLevel + 1);
            }
        }

        // Get ability scores
        const abilityScores = character.abilityScores.map(a => ({
            abilityId: a.abilityId,
            score: a.value,
            modifier: CharacterCalculationService.getAbilityModifier(character, a.abilityId, resolvedProgressions, _context?.featsMap)
        }));

        // Collect all unique skill entries
        const skillEntryMap = new Map<string, {
            skillId: number;
            skillSubId: number | null;
            customSubtype: string | null;
            totalRanks: number;
            miscBonus: number;
        }>();

        const allocatableSkills = SKILL_LIST.filter(skill =>
            skill.abilityId !== 0 && !skill.isAnalog
        );

        // Process skill entries from advancements
        for (const advancement of character.advancements) {
            const classDetails = classDetailsMap.get(advancement.classId);

            for (const skillEntry of (advancement.skills || [])) {
                if (!allocatableSkills.some(s => s.id === skillEntry.skillId)) {
                    continue;
                }

                const key = `${skillEntry.skillId}|${skillEntry.skillSubId ?? 'null'}|${skillEntry.customSubtype ?? 'null'}`;

                let entry = skillEntryMap.get(key);
                if (!entry) {
                    entry = {
                        skillId: skillEntry.skillId,
                        skillSubId: skillEntry.skillSubId,
                        customSubtype: skillEntry.customSubtype,
                        totalRanks: 0,
                        miscBonus: 0
                    };
                    skillEntryMap.set(key, entry);
                }

                const isClassSkill = ClassSkillService.isSkillClassSkillForAdvancement(
                    classDetails,
                    advancement,
                    skillEntry.skillId,
                    skillEntry.skillSubId,
                    skillEntry.customSubtype
                );

                if (isClassSkill) {
                    entry.totalRanks += skillEntry.pointsSpent;
                } else {
                    entry.totalRanks += skillEntry.pointsSpent * 0.5;
                }
            }
        }

        // Get skill bonuses from progressions
        for (const progression of skillProgressions) {
            if (!progression.entities) continue;

            for (const entity of progression.entities) {
                if (entity.appliesTo === EntityAppliesToType.Skill && entity.appliesToId) {
                    // Skip entities with conditions - these are conditional modifiers and should not be included in misc bonus
                    if (entity.conditions && entity.conditions.length > 0) {
                        continue;
                    }

                    // Handle both bonus entities (with value) and other entities that might grant skill bonuses
                    // For bonus entities, use the value directly
                    // For other entities, check if they have a computed value
                    let bonusValue = 0;
                    if (entity.type === EntityType.Bonus && entity.value) {
                        bonusValue = entity.value;
                    } else if (entity.type === EntityType.Other && entity.value) {
                        // Some skill bonuses might be Other type
                        bonusValue = entity.value;
                    }

                    if (bonusValue !== 0) {
                        const key = `${entity.appliesToId}|${entity.appliesToSubId ?? 'null'}|null`;
                        let entry = skillEntryMap.get(key);
                        // If entry doesn't exist, create it (for skills with bonuses but no ranks)
                        if (!entry) {
                            entry = {
                                skillId: entity.appliesToId,
                                skillSubId: entity.appliesToSubId ?? null,
                                customSubtype: null,
                                totalRanks: 0,
                                miscBonus: 0
                            };
                            skillEntryMap.set(key, entry);
                        }
                        entry.miscBonus += bonusValue;
                    }
                }
            }
        }

        // Convert to formatted skills
        for (const entry of skillEntryMap.values()) {
            const skillData = SKILL_LIST.find(s => s.id === entry.skillId);
            if (!skillData) continue;

            const abilityScore = abilityScores.find(a => a.abilityId === skillData.abilityId);
            const abilityMod = abilityScore?.modifier ?? 0;

            const ranks = Math.floor(entry.totalRanks);
            const total = ranks + abilityMod + entry.miscBonus;

            // Check if class skill
            let isClassSkill = false;
            for (const [classId] of classLevelCounts.entries()) {
                const classDetails = classDetailsMap.get(classId);
                if (classDetails?.features) {
                    const hasClassSkill = classDetails.features.some(prog =>
                        prog.featureId === SpecialFeatureId.ClassSkill &&
                        prog.entities?.some(entity =>
                            entity.appliesTo === EntityAppliesToType.Skill &&
                            entity.appliesToId === entry.skillId &&
                            (entity.appliesToSubId === entry.skillSubId ||
                                entity.appliesToSubId === -1 ||
                                (entity.appliesToSubId === null && entry.skillSubId === null))
                        )
                    );
                    if (hasClassSkill) {
                        isClassSkill = true;
                        break;
                    }
                }
            }

            // Format skill name
            let skillName = skillData.name;
            if (SKILL_SUB_TYPE_COMPATIBILITY[SkillSubType.skillSubId].includes(entry.skillId as 6 | 19) && entry.skillSubId) {
                if (entry.skillId === 6) {
                    const craftSubtype = CRAFT_SKILL_MAP[entry.skillSubId as keyof typeof CRAFT_SKILL_MAP];
                    if (craftSubtype) skillName = `${skillData.name} (${craftSubtype.name})`;
                }
                if (entry.skillId === 19) {
                    const knowledgeSubtype = KNOWLEDGE_SKILL_MAP[entry.skillSubId as keyof typeof KNOWLEDGE_SKILL_MAP];
                    if (knowledgeSubtype) skillName = `${skillData.name} (${knowledgeSubtype.name})`;
                }
            }
            if (SKILL_SUB_TYPE_COMPATIBILITY[SkillSubType.customSubtype].includes(entry.skillId as 32 | 33) && entry.customSubtype && entry.customSubtype !== '__placeholder__') {
                skillName = `${skillData.name} (${entry.customSubtype})`;
            }

            skills.push({
                skillId: entry.skillId,
                skillSubId: entry.skillSubId,
                customSubtype: entry.customSubtype,
                skillName,
                total: this.formatModifier(total),
                abilityMod: this.formatModifier(abilityMod),
                ranks: ranks.toString(),
                misc: this.formatModifier(entry.miscBonus),
                isClassSkill,
                breakdown: {
                    components: [
                        { source: 'Ability Modifier', value: abilityMod, type: BreakdownComponentType.base },
                        { source: 'Ranks', value: ranks, type: BreakdownComponentType.base },
                        { source: 'Misc Bonus', value: entry.miscBonus, type: BreakdownComponentType.base }
                    ]
                }
            });
        }

        // Add skills with 0 ranks that don't have entries
        for (const skillData of allocatableSkills) {
            const needsSubtype = SKILL_SUB_TYPE_COMPATIBILITY[SkillSubType.skillSubId].includes(skillData.id as 6 | 19) ||
                SKILL_SUB_TYPE_COMPATIBILITY[SkillSubType.customSubtype].includes(skillData.id as 32 | 33);

            if (!needsSubtype) {
                const hasEntry = skills.some(s => s.skillId === skillData.id && s.skillSubId === null && s.customSubtype === null);
                if (!hasEntry) {
                    const abilityScore = abilityScores.find(a => a.abilityId === skillData.abilityId);
                    const abilityMod = abilityScore?.modifier ?? 0;

                    let isClassSkill = false;
                    for (const [classId] of classLevelCounts.entries()) {
                        const classDetails = classDetailsMap.get(classId);
                        if (classDetails?.features) {
                            const hasClassSkill = classDetails.features.some(prog =>
                                prog.featureId === SpecialFeatureId.ClassSkill &&
                                prog.entities?.some(entity =>
                                    entity.appliesTo === EntityAppliesToType.Skill &&
                                    entity.appliesToId === skillData.id &&
                                    (entity.appliesToSubId === -1 || entity.appliesToSubId === null)
                                )
                            );
                            if (hasClassSkill) {
                                isClassSkill = true;
                                break;
                            }
                        }
                    }

                    skills.push({
                        skillId: skillData.id,
                        skillSubId: null,
                        customSubtype: null,
                        skillName: skillData.name,
                        total: this.formatModifier(abilityMod),
                        abilityMod: this.formatModifier(abilityMod),
                        ranks: '0',
                        misc: this.formatModifier(0),
                        isClassSkill,
                        breakdown: {
                            components: [
                                { source: 'Ability Modifier', value: abilityMod, type: BreakdownComponentType.base }
                            ]
                        }
                    });
                }
            }
        }

        skills.sort((a, b) => a.skillName.localeCompare(b.skillName));
        return skills;
    }

    /**
     * Format saving throws using progressions
     */
    private formatSavingThrows(
        character: CharacterWithAllDetailsResponse,
        resolvedProgressions: FeatureProgression[],
        _items: ItemWithDetails[],
        classDetailsMap: Map<number, DnDClass>,
        context?: DisplayContext
    ): { fortitude: FormattedSavingThrow; reflex: FormattedSavingThrow; will: FormattedSavingThrow } {
        const fortResult = CharacterCalculationService.getSavingThrow(character, SaveType.Fortitude, resolvedProgressions, classDetailsMap, context?.featsMap);
        const refResult = CharacterCalculationService.getSavingThrow(character, SaveType.Reflex, resolvedProgressions, classDetailsMap, context?.featsMap);
        const willResult = CharacterCalculationService.getSavingThrow(character, SaveType.Will, resolvedProgressions, classDetailsMap, context?.featsMap);

        return {
            fortitude: {
                total: this.formatModifier(fortResult.value),
                base: this.formatModifier(fortResult.breakdown.base.value),
                abilityMod: this.formatModifier(fortResult.breakdown.abilityMod.value),
                misc: this.formatModifier(fortResult.breakdown.feat.value + fortResult.breakdown.feature.value + fortResult.breakdown.item.value),
                breakdown: {
                    components: [
                        { source: 'Base', value: fortResult.breakdown.base.value, type: BreakdownComponentType.base },
                        { source: 'Ability Modifier', value: fortResult.breakdown.abilityMod.value, type: BreakdownComponentType.base },
                        { source: 'Misc', value: fortResult.breakdown.feat.value + fortResult.breakdown.feature.value + fortResult.breakdown.item.value, type: BreakdownComponentType.base }
                    ]
                }
            },
            reflex: {
                total: this.formatModifier(refResult.value),
                base: this.formatModifier(refResult.breakdown.base.value),
                abilityMod: this.formatModifier(refResult.breakdown.abilityMod.value),
                misc: this.formatModifier(refResult.breakdown.feat.value + refResult.breakdown.feature.value + refResult.breakdown.item.value),
                breakdown: {
                    components: [
                        { source: 'Base', value: refResult.breakdown.base.value, type: BreakdownComponentType.base },
                        { source: 'Ability Modifier', value: refResult.breakdown.abilityMod.value, type: BreakdownComponentType.base },
                        { source: 'Misc', value: refResult.breakdown.feat.value + refResult.breakdown.feature.value + refResult.breakdown.item.value, type: BreakdownComponentType.base }
                    ]
                }
            },
            will: {
                total: this.formatModifier(willResult.value),
                base: this.formatModifier(willResult.breakdown.base.value),
                abilityMod: this.formatModifier(willResult.breakdown.abilityMod.value),
                misc: this.formatModifier(willResult.breakdown.feat.value + willResult.breakdown.feature.value + willResult.breakdown.item.value),
                breakdown: {
                    components: [
                        { source: 'Base', value: willResult.breakdown.base.value, type: BreakdownComponentType.base },
                        { source: 'Ability Modifier', value: willResult.breakdown.abilityMod.value, type: BreakdownComponentType.base },
                        { source: 'Misc', value: willResult.breakdown.feat.value + willResult.breakdown.feature.value + willResult.breakdown.item.value, type: BreakdownComponentType.base }
                    ]
                }
            }
        };
    }

    /**
     * Format armor class using progressions
     */
    private formatArmorClass(
        character: CharacterWithAllDetailsResponse,
        resolvedProgressions: FeatureProgression[],
        items: ItemWithDetails[],
        characterItems: CharacterItem[],
        context?: DisplayContext
    ): FormattedArmorClass {
        // Convert items to format expected by getAC
        const acItems = items.filter(item => {
            const charItem = characterItems.find(ci => ci.baseItemId === item.id);
            return charItem && (item.armor || item.weapon); // Include armor and potentially shields
        }).map(item => ({
            id: item.id,
            armor: item.armor ? { bonus: item.armor.bonus } : undefined,
            weapon: item.weapon
        }));

        const acResult = CharacterCalculationService.getAC(character, resolvedProgressions, acItems, context?.featsMap);
        const touchAC = CharacterCalculationService.getTouchAC(character, resolvedProgressions, context?.featsMap);
        const flatFootedAC = CharacterCalculationService.getFlatFootedAC(character, resolvedProgressions, context?.featsMap);

        return {
            total: acResult.value.toString(),
            base: acResult.breakdown.base.value.toString(),
            armor: acResult.breakdown.armor.value.toString(),
            shield: acResult.breakdown.shield.value.toString(),
            dex: this.formatModifier(acResult.breakdown.dex.value),
            size: this.formatModifier(acResult.breakdown.size.value),
            natural: acResult.breakdown.natural.value.toString(),
            deflection: acResult.breakdown.deflection.value.toString(),
            misc: this.formatModifier(acResult.breakdown.misc.value),
            touchAC: touchAC.toString(),
            flatFootedAC: flatFootedAC.toString(),
            breakdown: {
                components: [
                    { source: 'Base', value: acResult.breakdown.base.value, type: BreakdownComponentType.base },
                    { source: 'Armor', value: acResult.breakdown.armor.value, type: BreakdownComponentType.base },
                    { source: 'Shield', value: acResult.breakdown.shield.value, type: BreakdownComponentType.base },
                    { source: 'Dex Modifier', value: acResult.breakdown.dex.value, type: BreakdownComponentType.base },
                    { source: 'Size Modifier', value: acResult.breakdown.size.value, type: BreakdownComponentType.base },
                    { source: 'Natural Armor', value: acResult.breakdown.natural.value, type: BreakdownComponentType.base },
                    { source: 'Deflection', value: acResult.breakdown.deflection.value, type: BreakdownComponentType.base },
                    { source: 'Misc', value: acResult.breakdown.misc.value, type: BreakdownComponentType.base }
                ]
            }
        };
    }

    /**
     * Format feats using progressions
     * Now includes feats from both AdvancementFeat and CharacterFeatureChoice sources
     */
    private formatFeats(
        character: CharacterWithAllDetailsResponse,
        resolvedProgressions: FeatureProgression[],
        _context?: DisplayContext
    ): FormattedFeat[] {
        const feats: FormattedFeat[] = [];
        const processedFeatIds = new Set<number>();

        // Get all feats from both sources using unified accessor
        const allCharacterFeats = getAllCharacterFeats(character, resolvedProgressions);

        // Create a map of featId -> feat name from resolved progressions
        const featNameMap = new Map<number, string>();
        for (const progression of resolvedProgressions) {
            if (!progression.entities) continue;
            for (const entity of progression.entities) {
                if (entity.appliesTo === EntityAppliesToType.Feat && entity.appliesToId && entity.feat?.name) {
                    featNameMap.set(entity.appliesToId, entity.feat.name);
                }
            }
        }

        // Process all character feats
        for (const characterFeat of allCharacterFeats) {
            // Skip if we've already processed this feat (avoid duplicates)
            if (processedFeatIds.has(characterFeat.featId)) {
                continue;
            }
            processedFeatIds.add(characterFeat.featId);

            // Get feat name from map or use placeholder
            const featName = featNameMap.get(characterFeat.featId) || `Feat ${characterFeat.featId}`;

            // Determine source name for breakdown
            let sourceName = 'Selected';
            let level = 1;
            if (characterFeat.source === 'choice' && characterFeat.sourceFeature) {
                sourceName = characterFeat.sourceFeature.featureName;
                level = characterFeat.sourceFeature.level;
            } else {
                // For advancement feats, find the advancement level
                for (const advancement of character.advancements) {
                    if (advancement.feats?.some(f => f.featId === characterFeat.featId)) {
                        level = advancement.level;
                        break;
                    }
                }
            }

            // Format value (feats typically don't have numeric values, but we'll use +1 as a placeholder)
            const formattedValue = '+1';

            feats.push({
                featId: characterFeat.featId,
                featName,
                formattedValue,
                breakdown: {
                    components: [
                        { source: sourceName, value: 1, type: BreakdownComponentType.base }
                    ]
                },
                level
            });
        }

        // Also include feats from resolved progressions that might not be in allCharacterFeats
        // (e.g., granted feats that aren't stored as choices or advancements)
        for (const progression of resolvedProgressions) {
            if (!progression.entities) continue;

            for (const entity of progression.entities) {
                if (entity.appliesTo === EntityAppliesToType.Feat && entity.appliesToId) {
                    // Skip if already processed
                    if (processedFeatIds.has(entity.appliesToId)) {
                        continue;
                    }
                    processedFeatIds.add(entity.appliesToId);

                    const featName = entity.feat?.name || `Feat ${entity.appliesToId}`;
                    const entityValue = entity.value ?? 0;
                    const formattedValue = entityValue >= 0 ? `+${entityValue}` : `${entityValue}`;

                    feats.push({
                        featId: entity.appliesToId,
                        featName,
                        formattedValue,
                        breakdown: {
                            components: [
                                { source: progression.feature?.name || 'Feature', value: 1, type: BreakdownComponentType.base }
                            ]
                        },
                        level: progression.level
                    });
                }
            }
        }

        return feats;
    }

    /**
     * Format features using progressions
     */
    private formatFeatures(
        resolvedProgressions: FeatureProgression[],
        context?: DisplayContext
    ): FormattedFeature[] {
        const features: FormattedFeature[] = [];

        // Use formatProgressions to format features
        const displayResult = this.formatProgressions(resolvedProgressions, context);

        // Extract features from individualEntities (CharacterSheetDisplayResult uses individualEntities, not levelEntries)
        if (displayResult.individualEntities && displayResult.individualEntities.length > 0) {
            for (const entity of displayResult.individualEntities) {
                // Get featureId from the entity's progression
                const progression = resolvedProgressions.find(p =>
                    p.entities?.some(e => e.id === entity.entity?.id)
                );
                const featureId = progression?.featureId || 0;

                features.push({
                    featureId,
                    featureName: progression?.feature?.name || `Feature ${featureId}`,
                    formattedValue: entity.formattedValue,
                    breakdown: entity.breakdown,
                    level: entity.level
                });
            }
        }

        return features;
    }

    /**
     * Format proficiencies using progressions
     */
    private formatProficiencies(
        resolvedProgressions: FeatureProgression[],
        context?: DisplayContext
    ): FormattedProficiency[] {
        const proficiencies: FormattedProficiency[] = [];

        // Filter for proficiency progressions - include both ClassProficiency special feature
        // and any progression that has proficiency entities (for racial weapon proficiencies, etc.)
        const proficiencyProgressions = resolvedProgressions.filter(p =>
            p.featureId === SpecialFeatureId.ClassProficiency ||
            (p.entities?.some(entity => entity.type === EntityType.Proficiency && entity.appliesTo === EntityAppliesToType.Feat) ?? false)
        );

        if (proficiencyProgressions.length === 0) {
            return proficiencies;
        }

        // Use formatProgressions to format proficiencies
        const displayResult = this.formatProgressions(proficiencyProgressions, context);

        // Extract proficiencies from individualEntities (CharacterSheetDisplayResult uses individualEntities, not levelEntries)
        if (displayResult.individualEntities && displayResult.individualEntities.length > 0) {
            for (const entity of displayResult.individualEntities) {
                proficiencies.push({
                    formattedValue: entity.formattedValue,
                    breakdown: entity.breakdown,
                    level: entity.level
                });
            }
        }

        return proficiencies;
    }

    /**
     * Convert calculation service breakdown to formatter breakdown
     */
    private _convertBreakdown(breakdownMap: Record<string, { value: number; source: string | null; sourceType?: string | null }> | BreakdownMap): CalculationBreakdown {
        const components: BreakdownComponent[] = [];
        // Handle both BreakdownMap (with index signature) and specific breakdown map types
        // Use type assertion to access properties - specific breakdown maps don't have index signatures
        const map = breakdownMap as Record<string, { value: number; source: string | null; sourceType?: string | null }>;
        for (const key in map) {
            if (!Object.prototype.hasOwnProperty.call(map, key)) continue;
            const component = map[key];
            if (component && typeof component === 'object' && 'value' in component) {
                // Map sourceType to BreakdownComponentType
                // Calculation service uses string sourceType, formatter uses enum BreakdownComponentType
                let type: BreakdownComponentType = BreakdownComponentType.base;
                // Most calculation service breakdowns are base values, so default to base

                components.push({
                    source: component.source || key,
                    value: component.value,
                    type,
                    description: component.source || undefined
                });
            }
        }
        return { components };
    }

    /**
     * Format ability scores
     */
    private _formatAbilities(
        character: CharacterWithAllDetailsResponse,
        resolvedProgressions: FeatureProgression[],
        context?: DisplayContext
    ): FormattedAbilityScore[] {
        const abilities: FormattedAbilityScore[] = [];

        for (const abilityId of [AbilityId.Strength, AbilityId.Dexterity, AbilityId.Constitution, AbilityId.Intelligence, AbilityId.Wisdom, AbilityId.Charisma]) {
            const result = CharacterCalculationService.getAbilityScore(character, abilityId, resolvedProgressions, context?.featsMap);
            const modifier = CharacterCalculationService.getAbilityModifier(character, abilityId, resolvedProgressions, context?.featsMap);

            abilities.push({
                abilityId,
                score: result.value.toString(),
                modifier: this.formatModifier(modifier),
                breakdown: this._convertBreakdown(result.breakdown as unknown as Record<string, { value: number; source: string | null; sourceType?: string | null }>)
            });
        }

        return abilities;
    }

    /**
     * Format initiative
     */
    private _formatInitiative(
        character: CharacterWithAllDetailsResponse,
        resolvedProgressions: FeatureProgression[],
        context?: DisplayContext
    ): FormattedInitiative {
        const result = CharacterCalculationService.getInitiative(character, resolvedProgressions, context?.featsMap);

        return {
            total: this.formatModifier(result.value),
            dexMod: this.formatModifier(result.breakdown.dexMod.value),
            misc: this.formatModifier(result.breakdown.feat.value + result.breakdown.feature.value + result.breakdown.item.value),
            breakdown: this._convertBreakdown(result.breakdown as unknown as Record<string, { value: number; source: string | null; sourceType?: string | null }>)
        };
    }

    /**
     * Format base attack bonus
     */
    private _formatBaseAttackBonus(
        character: CharacterWithAllDetailsResponse,
        classDetailsMap: Map<number, DnDClass>
    ): string {
        // Calculate class levels
        const classLevelCounts = new Map<number, number>();
        for (const advancement of character.advancements) {
            const currentLevel = classLevelCounts.get(advancement.classId) ?? 0;
            classLevelCounts.set(advancement.classId, currentLevel + 1);
        }

        // Calculate total BAB
        let totalBAB = 0;
        for (const [classId, level] of classLevelCounts.entries()) {
            const classDetails = classDetailsMap.get(classId);
            if (classDetails?.babProgression !== undefined) {
                const babString = getBABProgression(level, classDetails.babProgression);
                const match = babString.match(/\+(\d+)/);
                if (match) {
                    totalBAB += parseInt(match[1], 10);
                }
            }
        }

        // Format BAB with iterative attacks
        if (totalBAB <= 0) return '+0';
        const attacks: number[] = [];
        let current = totalBAB;
        while (current > 0) {
            attacks.push(current);
            current -= 5;
        }
        return attacks.map(a => `+${a}`).join('/');
    }

    /**
     * Format grapple
     */
    private _formatGrapple(
        character: CharacterWithAllDetailsResponse,
        resolvedProgressions: FeatureProgression[],
        classDetailsMap: Map<number, DnDClass>,
        context?: DisplayContext
    ): FormattedGrapple {
        // Calculate BAB
        const classLevelCounts = new Map<number, number>();
        for (const advancement of character.advancements) {
            const currentLevel = classLevelCounts.get(advancement.classId) ?? 0;
            classLevelCounts.set(advancement.classId, currentLevel + 1);
        }

        let totalBAB = 0;
        for (const [classId, level] of classLevelCounts.entries()) {
            const classDetails = classDetailsMap.get(classId);
            if (classDetails?.babProgression !== undefined) {
                const babString = getBABProgression(level, classDetails.babProgression);
                const match = babString.match(/\+(\d+)/);
                if (match) {
                    totalBAB += parseInt(match[1], 10);
                }
            }
        }

        // Get Str modifier
        const strMod = CharacterCalculationService.getAbilityModifier(character, AbilityId.Strength, resolvedProgressions, context?.featsMap);

        // Get size modifier (from race or default to Medium = 0)
        const sizeMod = 0; // TODO: Get from race sizeId

        // Calculate total
        const total = totalBAB + strMod + sizeMod;

        return {
            total: this.formatModifier(total),
            bab: this.formatModifier(totalBAB),
            strMod: this.formatModifier(strMod),
            sizeMod: this.formatModifier(sizeMod),
            misc: this.formatModifier(0), // TODO: Add misc bonuses from features/feats
            breakdown: {
                components: [
                    { source: 'BAB', value: totalBAB, type: BreakdownComponentType.base },
                    { source: 'Str Modifier', value: strMod, type: BreakdownComponentType.base },
                    { source: 'Size Modifier', value: sizeMod, type: BreakdownComponentType.base }
                ]
            }
        };
    }

    /**
     * Format speed
     */
    private _formatSpeed(
        character: CharacterWithAllDetailsResponse,
        resolvedProgressions: FeatureProgression[],
        race: Race | null
    ): string {
        const result = CharacterCalculationService.getSpeed(character, resolvedProgressions, race);
        return `${result.value} ft.`;
    }

    /**
     * Format hit points
     */
    private _formatHitPoints(character: CharacterWithAllDetailsResponse): string {
        const hitPoints = character.advancements.reduce((sum, adv) => sum + adv.hitPoints, 0);
        return hitPoints.toString();
    }

    /**
     * Format class levels
     */
    private _formatClassLevels(
        character: CharacterWithAllDetailsResponse,
        classDetailsMap: Map<number, DnDClass>
    ): FormattedClassLevel[] {
        const classLevelCounts = new Map<number, number>();
        for (const advancement of character.advancements) {
            const currentLevel = classLevelCounts.get(advancement.classId) ?? 0;
            classLevelCounts.set(advancement.classId, currentLevel + 1);

            if (advancement.secondaryClassId) {
                const secondaryLevel = classLevelCounts.get(advancement.secondaryClassId) ?? 0;
                classLevelCounts.set(advancement.secondaryClassId, secondaryLevel + 1);
            }
        }

        const classLevels: FormattedClassLevel[] = [];
        for (const [classId, level] of classLevelCounts.entries()) {
            const classDetails = classDetailsMap.get(classId);
            classLevels.push({
                classId,
                className: classDetails?.name ?? `Class ${classId}`,
                level
            });
        }

        return classLevels;
    }

    /**
     * Helper to format modifier as string
     */
    private formatModifier(mod: number): string {
        return mod >= 0 ? `+${mod}` : `${mod}`;
    }
}

