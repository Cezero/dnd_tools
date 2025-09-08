-- Migration Script: FeatureModifier and FeatureChoice to FeatureEntity
-- This script migrates existing data from the old separate tables to the new unified FeatureEntity table

-- Step 1: Migrate FeatureModifier entries to FeatureEntity
-- Modifier types (0-4) remain unchanged
INSERT INTO FeatureEntity (
    progressionId,
    appliesTo,
    appliesToId,
    appliesToSubId,  -- Maps from FeatureModifier.itemId
    formulaParamsId,
    groupingId,
    type,            -- Maps from FeatureModifier.type (unchanged 0-4)
    value,           -- Maps from FeatureModifier.value
    bonusType,       -- Maps from FeatureModifier.bonusType
    itemId,          -- Keep as itemId for now (may need to be moved to appliesToSubId)
    displayInDetail, -- Maps from FeatureModifier.displayInDetail
    filterType       -- NULL for modifiers
)
SELECT 
    progressionId,
    appliesTo,
    appliesToId,
    itemId as appliesToSubId,  -- Move itemId to appliesToSubId
    formulaParamsId,
    groupingId,
    type,            -- ModifierType (0-4)
    value,
    bonusType,
    NULL as itemId,  -- Clear itemId since it's now in appliesToSubId
    displayInDetail,
    NULL as filterType
FROM FeatureModifier;

-- Step 2: Migrate FeatureChoice entries to FeatureEntity
-- Choice behaviors become new type values (5-7)
INSERT INTO FeatureEntity (
    progressionId,
    appliesTo,
    appliesToId,
    appliesToSubId,  -- NULL for choices
    formulaParamsId,
    groupingId,
    type,            -- Maps from FeatureChoice.behavior + 5 (5-7)
    value,           -- Maps from FeatureChoice.pickCount (always 1)
    bonusType,       -- NULL for choices
    itemId,          -- NULL for choices
    displayInDetail, -- Default true for choices
    filterType       -- Maps from FeatureChoice.filterType
)
SELECT 
    progressionId,
    appliesTo,
    appliesToId,
    NULL as appliesToSubId,
    formulaParamsId,
    groupingId,
    behavior + 5 as type,  -- Convert behavior (0-2) to type (5-7)
    COALESCE(pickCount, 1) as value,  -- Use pickCount as value, default to 1
    NULL as bonusType,
    NULL as itemId,
    true as displayInDetail,
    filterType
FROM FeatureChoice;

-- Step 3: Migrate FeatureModifierCondition to FeatureEntityCondition
-- This requires mapping the old featureModifierId to the new featureEntityId
INSERT INTO FeatureEntityCondition (
    featureEntityId,
    conditionType,
    conditionValue
)
SELECT 
    fe.id as featureEntityId,
    fmc.conditionType,
    fmc.conditionValue
FROM FeatureModifierCondition fmc
JOIN FeatureModifier fm ON fmc.featureModifierId = fm.id
JOIN FeatureEntity fe ON (
    fe.progressionId = fm.progressionId 
    AND fe.type = fm.type 
    AND fe.appliesTo = fm.appliesTo 
    AND fe.appliesToId = fm.appliesToId
    AND fe.appliesToSubId = fm.itemId
    AND fe.value = fm.value
    AND fe.bonusType = fm.bonusType
    AND fe.formulaParamsId = fm.formulaParamsId
    AND fe.groupingId = fm.groupingId
    AND fe.displayInDetail = fm.displayInDetail
);

-- Step 4: Update FeatureFormulaParams relationships
-- Update the featureModifier and featureChoice arrays to point to featureEntity
-- Note: This step may need to be handled in the application layer since Prisma
-- doesn't support direct array updates in SQL

-- Step 5: Update CharacterFeatureChoice to reference FeatureEntity instead of FeatureChoice
-- This requires mapping the old featureChoiceId to the new featureEntityId
UPDATE CharacterFeatureChoice cfc
JOIN FeatureChoice fc ON cfc.featureChoiceId = fc.id
JOIN FeatureEntity fe ON (
    fe.progressionId = fc.progressionId 
    AND fe.type = fc.behavior + 5  -- Convert behavior to type
    AND fe.appliesTo = fc.appliesTo 
    AND fe.appliesToId = fc.appliesToId
    AND fe.value = COALESCE(fc.pickCount, 1)
    AND fe.filterType = fc.filterType
    AND fe.formulaParamsId = fc.formulaParamsId
    AND fe.groupingId = fc.groupingId
)
SET cfc.featureEntityId = fe.id
WHERE cfc.featureChoiceId IS NOT NULL;

-- Step 6: Verification queries (run these to check migration success)

-- Check modifier migration
SELECT 
    'Modifiers' as entity_type,
    COUNT(*) as original_count
FROM FeatureModifier
UNION ALL
SELECT 
    'Migrated Modifiers' as entity_type,
    COUNT(*) as migrated_count
FROM FeatureEntity 
WHERE type BETWEEN 0 AND 4;

-- Check choice migration  
SELECT 
    'Choices' as entity_type,
    COUNT(*) as original_count
FROM FeatureChoice
UNION ALL
SELECT 
    'Migrated Choices' as entity_type,
    COUNT(*) as migrated_count
FROM FeatureEntity 
WHERE type BETWEEN 5 AND 7;

-- Check condition migration
SELECT 
    'Modifier Conditions' as entity_type,
    COUNT(*) as original_count
FROM FeatureModifierCondition
UNION ALL
SELECT 
    'Entity Conditions' as entity_type,
    COUNT(*) as migrated_count
FROM FeatureEntityCondition;

-- Step 7: Clean up old tables (UNCOMMENT AFTER VERIFICATION)
-- DROP TABLE FeatureModifierCondition;
-- DROP TABLE FeatureModifier;
-- DROP TABLE FeatureChoice;

-- Step 8: Update FeatureProgression relationships (UNCOMMENT AFTER VERIFICATION)
-- ALTER TABLE FeatureProgression DROP COLUMN modifiers;
-- ALTER TABLE FeatureProgression DROP COLUMN choices;
