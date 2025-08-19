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
- **Formula Testing**: EVERY_N_LEVELS formula tested with Barbarian class features
- **Formula Integration**: Fully integrated with FeatureModifier.formulaId
- **FeatureModifierFormulaParams Model**: Database model for storing formula-specific parameters (interval, formulaStartLevel)
- **Enhanced Formula Parameters**: Updated all formulas to use `scalingValue` from FeatureModifier.value and `interval` from FeatureModifierFormulaParams
- **Formula Preview UI**: Dynamic preview component in FeatureProgressionDetailEdit showing actual progression patterns
- **Schema Validation**: Fixed validation issues with optional formula parameters using `.partial()`
- **Backend Integration**: Complete backend support for new formula parameter structure in classService and featureSystemService
- **Class Modeling**: Barbarian class successfully modeled with formula-based features
- **Frontend Formula Integration**: Complete formula selection, preview, and validation
- **Backend Formula Support**: Complete backend support for formula parameter creation and loading

### ❌ Critical Missing Components
- **Formula System Testing**: Only EVERY_N_LEVELS formula tested, other formulas need validation
- **Class Feature Modeling**: Barbarian completed, other core classes pending
- **Backend Calculation Engine**: Formula evaluation not integrated with character calculations
- **Character Sheet Integration**: Formula results not applied to character stats
- **Feature Prerequisites Validation**: No enforcement logic

## Formula System Architecture

### Where Formulas Live
- **Formula Definitions**: `shared/static-data/src/FormulaDefinitions.ts`
- **Formula Calculator**: `frontend/src/lib/formulaCalculator.ts`
- **Formula Display**: `frontend/src/lib/Formatters.ts` with `getFormulaProgressionPattern()`
- **Formula Categories**: 5 generic formulas covering D&D 3.5 scaling patterns
- **Formula Parameters**: Level-based with `startLevel` support for progression-based calculations
- **Formula Database**: `FeatureModifierFormulaParams` model for storing interval and formulaStartLevel
- **Formula Preview**: Dynamic preview in `FeatureProgressionDetailEdit.tsx` showing actual progression patterns

### Current Implementation
- **Frontend Calculation**: Complete implementation with formula preview and display
- **Formula Integration**: Fully integrated with FeatureModifierFormulaParams system
- **Formula Testing**: EVERY_N_LEVELS formula validated with Barbarian features
- **Display Logic**: Formula-based progressions show transition levels correctly
- **Class Modeling**: Barbarian class features successfully modeled
- **Backend Integration**: Fixed formula parameter loading and creation in ClassService
- **Formula Description Display**: Fixed formula description display in Edit Progression dialog
- **Schema Validation**: Fixed validation issues with proper formula parameter handling

### Formula System Analysis Results
- **Multiple Modifier Scaling**: Rare pattern (only 2-3 features in core content)
- **Current System Adequate**: FeatureModifier-level formulas handle all cases
- **No Refactor Needed**: Moving formulas to FeatureProgression level not worth complexity cost
- **Documentation**: Analysis results documented for future reference

## Formula Definitions

### Formula Categories

#### 1. Linear Scaling
```typescript
[FormulaId.LINEAR_SCALING]: {
    id: FormulaId.LINEAR_SCALING,
    name: 'Linear Scaling',
    description: 'Scales linearly with level starting from a specific level',
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
        if (params.level < params.startLevel) return 0;
        const thresholds = params.thresholds.toString().split(',').map(Number);
        const values = params.values.toString().split(',').map(Number);
        const adjustedThresholds = thresholds.map(t => t + params.startLevel - 1);
        
        for (let i = adjustedThresholds.length - 1; i >= 0; i--) {
            if (params.level >= adjustedThresholds[i]) {
                return values[i];
            }
        }
        return params.scalingValue;
    }
}
```

#### 4. Resource Pattern
```typescript
[FormulaId.RESOURCE_PATTERN]: {
    id: FormulaId.RESOURCE_PATTERN,
    name: 'Resource Pattern',
    description: 'Uses per day patterns (e.g., 1 to 6 uses per day)',
    parameters: [
        { name: 'level', description: 'Character level', required: true },
        { name: 'startLevel', description: 'Starting level for the progression', required: true },
        { name: 'scalingValue', description: 'Base uses per day', required: true },
        { name: 'interval', description: 'Level interval for additional uses', required: true }
    ],
    calculate: (params) => {
        if (params.level < params.startLevel) return 0;
        const levelsSinceStart = params.level - params.startLevel + 1;
        return params.scalingValue + Math.floor((levelsSinceStart - 1) / params.interval);
    }
}
```

#### 5. Dice Scaling
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
    id                Int  @id @default(autoincrement())
    formulaId         Int
    interval          Int
    formulaStartLevel Int?

    featureModifier   FeatureModifier[]
}
```

## Zod Schemas

### FeatureModifierFormulaParamsSchema
```typescript
export const FeatureModifierFormulaParamsSchema = z.object({
    id: z.number().int().positive('Formula params ID must be a positive integer'),
    formulaId: z.number().int().positive('Formula ID must be a positive integer'),
    interval: z.number().int().positive('Interval must be a positive integer'),
    formulaStartLevel: z.number().int().positive('Formula start level must be a positive integer').optional().nullable(),
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
        const context = { level, progressionLevel };
        const value = FormulaCalculator.calculateModifierValue(modifier, context);
        if (value > 0) {
            progressionValues.push({ level, value });
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
- [x] Formula display and progression formatting complete
- [ ] All formula types tested across core classes
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

1. **Test All Formulas**: Validate all formula types across different classes
2. **Model Core Classes**: Complete modeling of all core D&D 3.5 classes
3. **Implement Backend Calculation**: Create character calculation service
4. **Integrate with Character Sheets**: Connect formulas to character display
5. **Add Prerequisites Validation**: Implement feature requirement checking
