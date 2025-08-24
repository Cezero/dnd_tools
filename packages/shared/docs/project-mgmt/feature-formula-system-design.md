# Feature Formula System Design

This document outlines the design and implementation details for the formula system in D&D Tools, updated to reflect the current state of the codebase.

## Current Status Assessment

### ✅ Completed Components
- **Formula System Redesign**: Replaced text-based `valueFormula` with `formulaId` system
- **Generic Formula Library**: Comprehensive formulas in `shared/static-data/src/FormulaDefinitions.ts`
- **D&D 3.5 Pattern Analysis**: Complete analysis of actual scaling patterns from SRD
- **Schema Updates**: Updated schemas to use `formulaId` instead of `valueFormula`
- **Formula Documentation**: Comprehensive analysis and guidelines in `formula-system-analysis.md`
- **Formula Calculator**: Complete implementation in `frontend/src/lib/formulaCalculator.ts` with FeatureModifierFormulaParams support
- **Formula Display**: Complete implementation in `frontend/src/lib/Formatters.ts`
- **Formula Testing**: EVERY_N_LEVELS formula tested with Barbarian class features, **CONDITIONAL_SCALING formula tested with Monk Flurry of Blows**, **ATTRIBUTE_BASED and ATTRIBUTE_MODIFIER formulas tested**, **LEVEL_TIMES_VALUE formula tested with healing features**, **VALUE_PLUS_LEVEL formula tested with Monk Diamond Soul**
- **Formula Integration**: Fully integrated with FeatureModifier.formulaId
- **FeatureModifierFormulaParams Model**: Database model for storing formula-specific parameters (interval, formulaStartLevel, thresholds, values, attributeId)
- **Enhanced Formula Parameters**: Updated all formulas to use `scalingValue` from FeatureModifier.value and parameters from FeatureModifierFormulaParams
- **Formula Preview UI**: Dynamic preview component in FeatureProgressionDetailEdit showing actual progression patterns
- **Schema Validation**: Fixed validation issues with optional formula parameters using `.partial()`
- **Backend Integration**: Complete backend support for new formula parameter structure in classService and featureSystemService
- **Class Modeling**: Barbarian class successfully modeled with formula-based features, **Monk class successfully modeled with conditional scaling**
- **Frontend Formula Integration**: Complete formula selection, preview, and validation
- **Backend Formula Support**: Complete backend support for formula parameter creation and loading
- **Conditional Scaling**: Complete implementation with thresholds and values parameters
- **ExtraAttacks Modifier Type**: New modifier type for extra attacks per round/action
- **Attribute-Dependent Formulas**: Complete implementation for attribute-based calculations
- **Healing Features**: LEVEL_TIMES_VALUE formula and Healing modifier type implemented for Monk Wholeness of Body and Paladin Lay on Hands

### ❌ Critical Missing Components
- **Formula System Testing**: EVERY_N_LEVELS, CONDITIONAL_SCALING, ATTRIBUTE_BASED, ATTRIBUTE_MODIFIER, LEVEL_TIMES_VALUE, and VALUE_PLUS_LEVEL formulas tested, other formulas need validation
- **Class Feature Modeling**: Barbarian and Monk completed, other core classes pending
- **Backend Calculation Engine**: Formula evaluation not integrated with character calculations
- **Character Sheet Integration**: Formula results not applied to character stats
- **Feature Prerequisites Validation**: No enforcement logic

## Formula System Architecture

### Key Formula Differences

#### LINEAR_SCALING vs LEVEL_TIMES_VALUE
These two formulas are easily confused but serve different purposes:

**LINEAR_SCALING (Since Feature Started)**
- **Formula**: `(level - startLevel + 1) × scalingValue`
- **Use Case**: When a feature should scale based on how long it has been active
- **Example**: A feature that starts at level 5 with scalingValue = 2
  - Level 5: (5-5+1) × 2 = 1 × 2 = **2**
  - Level 7: (7-5+1) × 2 = 3 × 2 = **6**
  - Level 10: (10-5+1) × 2 = 6 × 2 = **12**

**LEVEL_TIMES_VALUE (Total Level)**
- **Formula**: `level × scalingValue`
- **Use Case**: When a feature should scale with total character level
- **Example**: A feature that starts at level 5 with scalingValue = 2
  - Level 5: 5 × 2 = **10**
  - Level 7: 7 × 2 = **14**
  - Level 10: 10 × 2 = **20**

### Where Formulas Live
- **Formula Definitions**: `shared/static-data/src/FormulaDefinitions.ts`
- **Formula Calculator**: `frontend/src/lib/formulaCalculator.ts`
- **Formula Display**: `frontend/src/lib/Formatters.ts` with `getFormulaProgressionPattern()`
- **Formula Categories**: 8 generic formulas covering D&D 3.5 scaling patterns
- **Formula Parameters**: Level-based with `startLevel` support for progression-based calculations
- **Formula Database**: `FeatureModifierFormulaParams` model for storing interval, formulaStartLevel, thresholds, values, and attributeId
- **Formula Preview**: Dynamic preview in `FeatureProgressionDetailEdit.tsx` showing actual progression patterns

### Current Implementation
- **Frontend Calculation**: Complete implementation with formula preview and display
- **Formula Integration**: Fully integrated with FeatureModifierFormulaParams system
- **Formula Testing**: EVERY_N_LEVELS formula validated with Barbarian features, **CONDITIONAL_SCALING formula validated with Monk Flurry of Blows**, **ATTRIBUTE_BASED and ATTRIBUTE_MODIFIER formulas validated**
- **Display Logic**: Formula-based progressions show transition levels correctly
- **Class Modeling**: Barbarian class features successfully modeled, **Monk class features successfully modeled with conditional scaling**
- **Backend Integration**: Fixed formula parameter loading and creation in ClassService
- **Formula Description Display**: Fixed formula description display in Edit Progression dialog
- **Schema Validation**: Fixed validation issues with proper formula parameter handling
- **Conditional Scaling**: Complete implementation with proper threshold and value handling
- **ExtraAttacks Support**: New modifier type with proper formatter and display
- **Attribute-Dependent Formulas**: Complete implementation with attribute parameter support
- **Healing Features**: LEVEL_TIMES_VALUE formula and Healing modifier type implemented

### Formula System Analysis Results
- **Multiple Modifier Scaling**: Rare pattern (only 2-3 features in core content)
- **Current System Adequate**: FeatureModifier-level formulas handle all cases
- **No Refactor Needed**: Moving formulas to FeatureProgression level not worth complexity cost
- **Documentation**: Analysis results documented for future reference

## Formula Definitions

### Formula Categories

#### 1. Linear Scaling (Since Feature Started)
```typescript
[FormulaId.LINEAR_SCALING]: {
    id: FormulaId.LINEAR_SCALING,
    name: 'Linear Scaling (Since Feature Started)',
    description: 'Scales linearly since the feature started: (level - startLevel + 1) × scalingValue. Use when the feature should scale based on how long it has been active.',
    parameters: [
        { name: 'level', description: 'Character level', required: true },
        { name: 'startLevel', description: 'Starting level for the progression', required: true },
        { name: 'scalingValue', description: 'Value to scale by', required: true }
    ],
    calculate: (params) => {
        if (params.level < params.startLevel) return 0;
        const levelsSinceStart = params.level - params.startLevel + 1;
        return levelsSinceStart * params.scalingValue;
    }
}
```

#### 2. Every N Levels
```typescript
[FormulaId.EVERY_N_LEVELS]: {
    id: FormulaId.EVERY_N_LEVELS,
    name: 'Every N Levels',
    description: 'Increases every N levels starting from a specific level',
    parameters: [
        { name: 'level', description: 'Character level', required: true },
        { name: 'startLevel', description: 'Starting level for the progression', required: true },
        { name: 'scalingValue', description: 'Value to scale by', required: true },
        { name: 'interval', description: 'Level interval', required: true },
        { name: 'formulaStartLevel', description: 'Level when formula progression begins', required: false }
    ],
    calculate: (params) => {
        if (params.level < params.startLevel) return 0;
        if (params.formulaStartLevel && params.level < params.formulaStartLevel) {
            return params.scalingValue;
        }
        let intervals;
        if (params.formulaStartLevel) {
            const levelsSinceStart = params.level - params.formulaStartLevel;
            intervals = Math.floor(levelsSinceStart / params.interval) + 1;
        } else {
            intervals = Math.floor((params.level - params.startLevel) / params.interval);
        }
        return params.scalingValue + (intervals * params.scalingValue);
    }
}
```

#### 3. Conditional Scaling
```typescript
[FormulaId.CONDITIONAL_SCALING]: {
    id: FormulaId.CONDITIONAL_SCALING,
    name: 'Conditional Scaling',
    description: 'Different values based on level thresholds',
    parameters: [
        { name: 'level', description: 'Character level', required: true },
        { name: 'startLevel', description: 'Starting level for the progression', required: true },
        { name: 'scalingValue', description: 'Base scaling value', required: true },
        { name: 'thresholds', description: 'Level thresholds (comma-separated)', required: true },
        { name: 'values', description: 'Corresponding values (comma-separated)', required: true }
    ],
    calculate: (params) => {
```

#### 4. Level Times Value (Total Level)
```typescript
[FormulaId.LEVEL_TIMES_VALUE]: {
    id: FormulaId.LEVEL_TIMES_VALUE,
    name: 'Level Times Value (Total Level)',
    description: 'Total character level multiplied by a base value: level × scalingValue. Use when the feature should scale with total character level, not just since the feature started.',
    parameters: [
        { name: 'level', description: 'Character level', required: true },
        { name: 'startLevel', description: 'Starting level for the progression', required: true },
        { name: 'scalingValue', description: 'Base value to multiply by level', required: true }
    ],
    calculate: (params) => {
        if (params.level < params.startLevel) return 0;
        return params.level * params.scalingValue;
    }
}
```

#### 5. Value Plus Level
```typescript
[FormulaId.VALUE_PLUS_LEVEL]: {
    id: FormulaId.VALUE_PLUS_LEVEL,
    name: 'Value Plus Level',
    description: 'Fixed value plus character level: scalingValue + level. Use for features like Spell Resistance.',
    parameters: [
        { name: 'level', description: 'Character level', required: true },
        { name: 'startLevel', description: 'Starting level for the progression', required: true },
        { name: 'scalingValue', description: 'Fixed value to add to level', required: true }
    ],
    calculate: (params) => {
        if (params.level < params.startLevel) return 0;
        return params.scalingValue + params.level;
    }
}
```
        // Handle incomplete parameters gracefully
        if (!params.thresholds || !params.values) {
            return params.scalingValue;
        }

        const thresholdsStr = params.thresholds.toString().trim();
        const valuesStr = params.values.toString().trim();

        // If parameters are empty, return base value
        if (!thresholdsStr || !valuesStr) {
            return params.scalingValue;
        }

        const thresholds = thresholdsStr.split(',').map(t => t.trim()).filter(t => t).map(Number);
        const values = valuesStr.split(',').map(v => v.trim()).filter(v => v).map(Number);

        // Validate that we have valid numbers
        if (thresholds.some(isNaN) || values.some(isNaN)) {
            return params.scalingValue;
        }

        if (thresholds.length === 0) {
            return params.scalingValue;
        }

        // For conditional scaling, values array can be one longer than thresholds
        if (values.length < thresholds.length || values.length > thresholds.length + 1) {
            return params.scalingValue;
        }

        // Use thresholds as absolute levels (not relative to startLevel)
        const absoluteThresholds = thresholds;

        // Find the highest threshold that the level is >= to
        for (let i = absoluteThresholds.length - 1; i >= 0; i--) {
            if (params.level >= absoluteThresholds[i]) {
                return values[i];
            }
        }

        // If we get here, level is before all thresholds
        return values[0];
    }
}
```

#### 4. Dice Scaling
```typescript
[FormulaId.DICE_SCALING]: {
    id: FormulaId.DICE_SCALING,
    name: 'Dice Scaling',
    description: 'Dice scaling patterns (e.g., +1d6 every N levels)',
    parameters: [
        { name: 'level', description: 'Character level', required: true },
        { name: 'startLevel', description: 'Starting level for the progression', required: true },
        { name: 'scalingValue', description: 'Base dice count', required: true },
        { name: 'interval', description: 'Level interval for additional dice', required: true }
    ],
    calculate: (params) => {
        if (params.level < params.startLevel) return 0;
        const levelsSinceStart = params.level - params.startLevel;
        const intervals = Math.floor(levelsSinceStart / params.interval);
        return (intervals + 1) * params.scalingValue;
    }
}
```

#### 5. Attribute-Based
```typescript
[FormulaId.ATTRIBUTE_BASED]: {
    id: FormulaId.ATTRIBUTE_BASED,
    name: 'Attribute Based',
    description: 'Base value plus attribute modifier (e.g., 3 + CHA modifier)',
    parameters: [
        { name: 'baseValue', description: 'Base value to add to attribute modifier', required: true },
        { name: 'attributeId', description: 'Attribute ID to use for modifier', required: true }
    ],
    calculate: (params) => {
        // This will be calculated in frontend with character context
        return params.baseValue; // Placeholder - frontend will add attribute modifier
    }
}
```

#### 6. Attribute Modifier
```typescript
[FormulaId.ATTRIBUTE_MODIFIER]: {
    id: FormulaId.ATTRIBUTE_MODIFIER,
    name: 'Attribute Modifier',
    description: 'Just the attribute modifier (e.g., +WIS modifier to AC)',
    parameters: [
        { name: 'attributeId', description: 'Attribute ID to use for modifier', required: true }
    ],
    calculate: (params) => {
        // This will be calculated in frontend with character context
        return 0; // Placeholder - frontend will return attribute modifier
    }
}
```

#### 7. Level Times Attribute
```typescript
[FormulaId.LEVEL_TIMES_ATTRIBUTE]: {
    id: FormulaId.LEVEL_TIMES_ATTRIBUTE,
    name: 'Level Times Attribute',
    description: 'Level multiplied by attribute modifier (e.g., level × CHA modifier)',
    parameters: [
        { name: 'attributeId', description: 'Attribute ID to use for modifier', required: true }
    ],
    calculate: (params) => {
        // This will be calculated in frontend with character context
        return 0; // Placeholder - frontend will return level × attribute modifier
    }
}
```

## Database Schema

### FeatureModifier Model
```prisma
model FeatureModifier {
    id                   Int     @id @default(autoincrement())
    featureProgressionId Int
    type                 Int
    value                Int
    bonusType            Int?
    appliesTo            Int?
    appliesToId          Int?
    formulaParamsId      Int?
    appliesIfChoiceKey   String?
    appliesIfChoiceValue String?

    featureProgression       FeatureProgression         @relation(fields: [featureProgressionId], references: [id])
    conditions               FeatureModifierCondition[]
    formulaParams            FeatureModifierFormulaParams?  @relation(fields: [formulaParamsId], references: [id])
}
```

### FeatureModifierFormulaParams Model
```prisma
model FeatureModifierFormulaParams {
    id                Int     @id @default(autoincrement())
    formulaId         Int
    interval          Int?
    formulaStartLevel Int?
    attributeId       Int?
    thresholds        String? // Comma-separated level thresholds (e.g., "1,4,8")
    values            String? // Comma-separated corresponding values (e.g., "-2,-1,0")

    featureModifier FeatureModifier[]
}
```

## Zod Schemas

### FeatureModifierFormulaParamsSchema
```typescript
export const FeatureModifierFormulaParamsSchema = z.object({
    id: z.number().int().positive('Formula params ID must be a positive integer'),
    formulaId: z.number().int().positive('Formula ID must be a positive integer'),
    interval: z.number().int().positive('Interval must be a positive integer').optional().nullable(),
    formulaStartLevel: z.number().int().positive('Formula start level must be a positive integer').optional().nullable(),
    attributeId: z.number().int().positive('Attribute ID must be a positive integer').optional().nullable(),
    thresholds: z.string().nullable(), // Comma-separated level thresholds (e.g., "1,4,8")
    values: z.string().nullable(), // Comma-separated corresponding values (e.g., "-2,-1,0")
});
```

### FeatureModifierSchema
```typescript
export const FeatureModifierSchema = z.object({
    id: z.number().int().positive('Modifier ID must be a positive integer'),
    featureProgressionId: z.number().int().positive('Feature progression ID must be a positive integer'),
    type: z.nativeEnum(ModifierType),
    value: z.number().int(),
    formulaParamsId: z.number().int().nullable(),
    bonusType: z.nativeEnum(FeatureBonusType).nullable(),
    appliesTo: z.nativeEnum(ModifierAppliesToType).nullable(),
    appliesToId: z.number().int().nullable(),
    appliesIfChoiceKey: z.string().nullable(),
    appliesIfChoiceValue: z.string().nullable(),
    conditions: z.array(FeatureModifierConditionSchema).optional(),
    formulaParams: FeatureModifierFormulaParamsSchema.optional().nullable(),
});
```

## Frontend Integration

### Formula Calculator
```typescript
// frontend/src/lib/formulaCalculator.ts
export const FormulaCalculator = {
    calculateModifierValue(modifier: FeatureModifierWithConditions, context: FormulaContext): number {
        const formulaId = modifier.formulaParams?.formulaId;
        if (formulaId) {
            const formula = FORMULA_MAP[formulaId];
            if (!formula) {
                console.warn(`Unknown formula ID: ${formulaId}`);
                return modifier.value;
            }

            const params: Record<string, number> = {};
            if (context.level) {
                params.level = context.level;
            }

            for (const param of formula.parameters) {
                if (param.name === 'startLevel') {
                    params[param.name] = context.progressionLevel;
                } else if (param.name === 'scalingValue') {
                    params[param.name] = modifier.value;
                } else if (param.name === 'interval') {
                    if ((modifier as any).formulaParams?.interval) {
                        params[param.name] = (modifier as any).formulaParams.interval;
                    } else {
                        params[param.name] = modifier.value;
                    }
                } else if (param.name === 'formulaStartLevel') {
                    if ((modifier as any).formulaParams?.formulaStartLevel) {
                        params[param.name] = (modifier as any).formulaParams.formulaStartLevel;
                    }
                } else if (param.name === 'thresholds') {
                    if ((modifier as any).formulaParams?.thresholds) {
                        params[param.name] = (modifier as any).formulaParams.thresholds;
                    } else {
                        params[param.name] = '';
                    }
                } else if (param.name === 'values') {
                    if ((modifier as any).formulaParams?.values) {
                        params[param.name] = (modifier as any).formulaParams.values;
                    } else {
                        params[param.name] = '';
                    }
                } else if (param.name === 'attributeId') {
                    if ((modifier as any).formulaParams?.attributeId) {
                        params[param.name] = (modifier as any).formulaParams.attributeId;
                    }
                }
            }

            return calculateFormula(formulaId, params);
        }
        return modifier.value;
    }
};
```

### Formula Preview Component
```typescript
// frontend/src/components/feature-system/FeatureProgressionDetailEdit.tsx
function FormulaPreview({ modifier, progressionLevel }: { modifier: any; progressionLevel: number }) {
    const formulaId = modifier.formulaParams?.formulaId;
    if (!formulaId) {
        return null;
    }

    const formula = FORMULA_MAP[formulaId];
    if (!formula) {
        return <p className="text-xs text-red-600 dark:text-red-400">Unknown formula</p>;
    }

    // Generate progression values for levels 1-20
    const progressionValues: Array<{ level: number; value: number }> = [];
    for (let level = 1; level <= 20; level++) {
        try {
            const context = { level, progressionLevel: progressionLevel as number };
            const value = FormulaCalculator.calculateModifierValue(modifier, context);
            // Include all levels, including when value is 0 (for transition points)
            progressionValues.push({ level, value });
        } catch (error) {
            // Skip levels that fail to calculate (e.g., incomplete conditional scaling parameters)
            console.debug(`Failed to calculate formula for level ${level}:`, error);
        }
    }

    // Find transition points where the value changes
    const transitionPoints: Array<{ level: number; value: number }> = [];
    let lastValue = 0;

    for (const { level, value } of progressionValues) {
        if (value !== lastValue) {
            transitionPoints.push({ level, value });
            lastValue = value;
        }
    }

    // Format the progression pattern
    const patternParts = transitionPoints.map(({ level, value }) => {
        const formatter = PROGRESSION_FORMATTERS[modifier.appliesTo];
        const formattedValue = formatter.value(value, modifier.appliesToId, modifier.bonusType);
        return `Level ${level} (${formattedValue})`;
    });

    return (
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            <strong>Progression:</strong> {patternParts.join(' → ')}
        </div>
    );
}
```

## Backend Integration

### Class Service
```typescript
// backend/src/features/class/classService.ts
async createClass(data: CreateClassRequest): Promise<CreateResponse> {
    return await prisma.$transaction(async (tx) => {
        // Create the class
        const createdClass = await tx.class.create({
            data: {
                name: data.name,
                abbreviation: data.abbreviation,
                // ... other fields
            },
        });

        // Create feature progressions
        if (data.features && data.features.length > 0) {
            for (const progression of data.features) {
                const { modifiers, choices, effects, ...progressionData } = progression;
                
                const featureProgression = await tx.featureProgression.create({
                    data: {
                        ...progressionData,
                        classId: createdClass.id,
                    },
                });

                // Create related modifiers
                if (modifiers && modifiers.length > 0) {
                    for (const modifier of modifiers) {
                        const { conditions, formulaParams, ...modifierData } = modifier;

                        // Create formula params first if they exist
                        let formulaParamsId = null;
                        if (formulaParams) {
                            const createdFormulaParams = await tx.featureModifierFormulaParams.create({
                                data: {
                                    formulaId: formulaParams.formulaId,
                                    interval: formulaParams.interval,
                                    formulaStartLevel: formulaParams.formulaStartLevel,
                                    attributeId: formulaParams.attributeId,
                                    thresholds: formulaParams.thresholds,
                                    values: formulaParams.values,
                                },
                            });
                            formulaParamsId = createdFormulaParams.id;
                        }

                        // Create the modifier with formula params reference
                        const createdModifier = await tx.featureModifier.create({
                            data: {
                                ...modifierData,
                                featureProgressionId: featureProgression.id,
                                formulaParamsId: formulaParamsId,
                            },
                        });

                        // Create related conditions if any
                        if (conditions && conditions.length > 0) {
                            await tx.featureModifierCondition.createMany({
                                data: conditions.map(condition => ({
                                    ...condition,
                                    featureModifierId: createdModifier.id,
                                })),
                            });
                        }
                    }
                }
            }
        }

        return { id: createdClass.id, message: 'Class created successfully' };
    });
}
```

## Security Considerations

### Formula Evaluation Security
1. **Input Validation**
   - Validate all formula parameters
   - Sanitize user-provided values
   - Limit formula complexity

2. **Error Handling**
   - Provide safe error messages
   - Don't expose system information
   - Graceful degradation for invalid formulas

3. **Access Control**
   - Validate user permissions for formula creation
   - Audit formula modifications
   - Rate limit formula evaluations

## Key Files for Implementation

### Current Implementation
- `frontend/src/components/feature-system/FeatureProgressionDetailEdit.tsx` - Formula input UI
- `shared/schema/src/feature.ts` - Feature system schemas with formulaId
- `frontend/src/lib/formulaCalculator.ts` - Formula calculation utilities
- `frontend/src/lib/Formatters.ts` - Formula display and progression formatting
- `shared/static-data/src/FormulaDefinitions.ts` - Complete formula library
- `backend/src/features/class/classService.ts` - Backend class service with formula support
- `backend/prisma/schema.prisma` - Database schema with FeatureModifierFormulaParams

### Missing Implementation
- Backend character calculation service (new service)
- Feature resolution service (new service)
- Character sheet component with formula integration (enhance existing)
- PDF export functionality (new service)
- D&D 3.5 rule validation (new service)

## Success Criteria

### Phase 1 Success
- [x] Generic formula definitions working
- [x] Parameterized formula evaluation functional
- [x] FeatureModifier.value integration complete
- [x] Basic formula validation working
- [x] EVERY_N_LEVELS formula tested with Barbarian features
- [x] **CONDITIONAL_SCALING formula tested with Monk Flurry of Blows**
- [x] **ATTRIBUTE_BASED and ATTRIBUTE_MODIFIER formulas tested**
- [x] **LEVEL_TIMES_VALUE formula tested with healing features**
- [x] Formula display and progression formatting complete
- [x] Conditional scaling implementation complete
- [x] ExtraAttacks modifier type implemented
- [x] Attribute-dependent formulas implemented
- [x] Healing features implemented
- [ ] All remaining formula types tested across core classes
- [ ] All core classes successfully modeled

### Phase 2 Success
- [ ] Character sheet integration complete
- [ ] Backend calculation service functional
- [ ] Feature resolution service working
- [ ] Feature prerequisites validation implemented

### Phase 3 Success
- [ ] Advanced UI features enhance usability
- [ ] Formula preview system functional
- [ ] System is ready for production use
- [ ] Documentation is complete and accurate

## Migration Notes

Since this is a new system that isn't fully implemented, no migration strategy is needed. The generic formula system can be implemented directly, replacing the current complex formula definitions with the new parameterized approach.

## Next Steps

1. **Test remaining formula types** - Validate LINEAR_SCALING, DICE_SCALING, and LEVEL_TIMES_ATTRIBUTE formulas across different classes
2. **Model remaining core classes** - Test all formula types across different classes
3. **Implement backend character calculation** - Create character calculation service
4. **Integrate with character sheets** - Connect formulas to character display
5. **Add prerequisites validation** - Implement feature requirement checking

## New Formula Implementation: LEVEL_TIMES_VALUE for Healing Features

### **Analysis of D&D 3.5 Healing Features**

#### **Monk's Wholeness of Body (7th level+)**
- **Formula**: `2 × monk level` hit points per day
- **Pattern**: Base value (2) multiplied by character level
- **Usage**: Self-healing, can be spread across multiple uses

#### **Paladin's Lay on Hands (2nd level+)**
- **Formula**: `paladin level × CHA bonus` hit points per day
- **Pattern**: Character level multiplied by attribute modifier
- **Usage**: Touch healing, can be spread across multiple recipients

### **Implementation Requirements**

#### **1. New Formula: LEVEL_TIMES_VALUE**
```typescript
[FormulaId.LEVEL_TIMES_VALUE]: {
    id: FormulaId.LEVEL_TIMES_VALUE,
    name: 'Level Times Value',
    description: 'Character level multiplied by a base value (e.g., 2 × level for healing)',
    parameters: [
        { name: 'level', description: 'Character level', required: true },
        { name: 'startLevel', description: 'Starting level for the progression', required: true },
        { name: 'scalingValue', description: 'Base value to multiply by level (from FeatureModifier.value)', required: true }
    ],
    calculate: (params) => {
        // If character level is before the starting level, return 0
        if (params.level < params.startLevel) {
            return 0;
        }
        return params.level * params.scalingValue;
    }
}
```

#### **2. New ModifierAppliesToType: Healing**
```typescript
export const ModifierAppliesToType = {
    // ... existing types ...
    Healing: 18,        // Healing hit points per day
} as const;
```

#### **3. Update Compatibility Matrix**
```typescript
[ModifierType.Quantity]: [
    // ... existing types ...
    ModifierAppliesToType.Healing, // Healing per day
],
```

#### **4. Add Formatter for Healing**
```typescript
[ModifierAppliesToType.Healing]: fmt((valueInt, appliesToId, bonusType) => {
    const base = `${valueInt} hit point${valueInt !== 1 ? 's' : ''} per day`;
    return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
}),
```

### **Usage Examples**

#### **Monk Wholeness of Body**
- **FeatureProgression.level**: 7 (starts at 7th level)
- **FeatureModifier.value**: 2
- **Formula**: LEVEL_TIMES_VALUE
- **ModifierAppliesTo**: Healing
- **Result**: 2 × monk level hit points per day (only at 7th level and above)
- **Example**: Level 7 Monk = 14 hit points per day, Level 10 Monk = 20 hit points per day

#### **Paladin Lay on Hands**
- **FeatureProgression.level**: 2 (starts at 2nd level)
- **FeatureModifier.value**: 1 (base multiplier)
- **Formula**: LEVEL_TIMES_ATTRIBUTE (already exists)
- **AttributeId**: Charisma (3)
- **ModifierAppliesTo**: Healing
- **Result**: paladin level × CHA bonus hit points per day (only at 2nd level and above)
- **Example**: Level 2 Paladin with +3 CHA = 6 hit points per day, Level 8 Paladin with +3 CHA = 24 hit points per day

### **Implementation Priority**
1. **Add LEVEL_TIMES_VALUE formula** to FormulaDefinitions.ts
2. **Add Healing ModifierAppliesToType** to FeatureData.ts
3. **Update compatibility matrix** to include Healing
4. **Add Healing formatter** to Formatters.ts
5. **Test with Monk Wholeness of Body** implementation
6. **Test with Paladin Lay on Hands** implementation
7. **Update documentation** to reflect new formula and modifier type

## New Formula Implementation: VALUE_PLUS_LEVEL for Spell Resistance Features

### **Analysis of D&D 3.5 Spell Resistance Features**

#### **Monk's Diamond Soul (13th level+)**
- **Formula**: `10 + monk level` Spell Resistance
- **Pattern**: Fixed value (10) plus character level
- **Usage**: Provides spell resistance equal to the calculated value

### **Implementation Requirements**

#### **1. New Formula: VALUE_PLUS_LEVEL**
```typescript
[FormulaId.VALUE_PLUS_LEVEL]: {
    id: FormulaId.VALUE_PLUS_LEVEL,
    name: 'Value Plus Level',
    description: 'Fixed value plus character level (e.g., 10 + level for Spell Resistance)',
    parameters: [
        { name: 'level', description: 'Character level', required: true },
        { name: 'startLevel', description: 'Starting level for the progression', required: true },
        { name: 'scalingValue', description: 'Fixed value to add to level (from FeatureModifier.value)', required: true }
    ],
    calculate: (params) => {
        // If character level is before the starting level, return 0
        if (params.level < params.startLevel) {
            return 0;
        }
        return params.scalingValue + params.level;
    }
}
```

#### **2. New ModifierAppliesToType: SpellResistance**
```typescript
export const ModifierAppliesToType = {
    // ... existing types ...
    SpellResistance: 19, // Spell Resistance (SR)
} as const;
```

#### **3. Update Compatibility Matrix**
```typescript
[ModifierType.Quantity]: [
    // ... existing types ...
    ModifierAppliesToType.SpellResistance, // Spell Resistance (SR)
],
```

#### **4. Add Formatter for SpellResistance**
```typescript
[ModifierAppliesToType.SpellResistance]: fmt((valueInt, appliesToId, bonusType) => {
    const base = `SR ${valueInt}`;
    return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
}),
```

### **Usage Examples**

#### **Monk Diamond Soul**
- **FeatureProgression.level**: 13 (starts at 13th level)
- **FeatureModifier.value**: 10
- **Formula**: VALUE_PLUS_LEVEL
- **ModifierAppliesTo**: SpellResistance
- **Result**: 10 + monk level Spell Resistance (only at 13th level and above)
- **Example**: Level 13 Monk = SR 23, Level 20 Monk = SR 30

### **Implementation Priority**
1. **Add VALUE_PLUS_LEVEL formula** to FormulaDefinitions.ts
2. **Add SpellResistance ModifierAppliesToType** to FeatureData.ts
3. **Update compatibility matrix** to include SpellResistance
4. **Add SpellResistance formatter** to Formatters.ts
5. **Test with Monk Diamond Soul** implementation
6. **Update documentation** to reflect new formula and modifier type

### **Benefits**
- **Generic Solution**: VALUE_PLUS_LEVEL works for any "X + level" pattern
- **Consistent with Existing System**: Follows same parameter structure as other formulas
- **Extensible**: Can be used for other level-based additions beyond spell resistance
- **Clear Separation**: Distinguishes spell resistance from other quantity types

### **Benefits**
- **Generic Solution**: LEVEL_TIMES_VALUE works for any "X × level" pattern
- **Consistent with Existing System**: Follows same parameter structure as other formulas
- **Extensible**: Can be used for other level-based multipliers beyond healing
- **Clear Separation**: Distinguishes healing from other quantity types
