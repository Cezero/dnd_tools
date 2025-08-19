# Runtime Calculation Patterns

*Patterns for calculating character modifiers and resolving feature choices at runtime.*

## Core Calculation Function

### **Main Calculation Function**
```typescript
async function calculateCharacterModifiers(
    characterId: number,
    context: RuntimeContext
): Promise<ResolvedModifiers> {
    
    // 1. Get character's active progressions
    const progressions = await getActiveProgressions(characterId);
    
    // 2. Filter by prerequisites
    const validProgressions = progressions.filter(prog => 
        meetsPrerequisites(prog.prerequisites, characterId)
    );
    
    // 3. Get modifiers from valid progressions
    const allModifiers = [];
    for (const progression of validProgressions) {
        const modifiers = await getProgressionModifiers(progression.id);
        
        for (const modifier of modifiers) {
            // Check choice dependencies
            if (modifier.appliesIfChoiceKey) {
                const choice = await getCharacterChoice(
                    characterId, 
                    progression.id, 
                    modifier.appliesIfChoiceKey
                );
                if (!choice || choice.value !== modifier.appliesIfChoiceValue) {
                    continue;
                }
            }
            
            // Check runtime conditions
            if (!evaluateConditions(modifier.conditions, context)) {
                continue;
            }
            
            allModifiers.push(modifier);
        }
    }
    
    // 4. Apply stacking rules and sum bonuses
    return applyStackingRules(allModifiers);
}
```

## Runtime Context

### **Context Interface**
```typescript
interface RuntimeContext {
    attackType?: string[];
    activeTokens: string[];
    targetTags?: string[];
    weaponId?: number;
    skillId?: number;
    spellSchool?: number;
    environment?: {
        hasAntimagic: boolean;
        suppressesMagic: boolean;
    };
}
```

### **Condition Evaluation**
```typescript
function evaluateConditions(
    conditions: FeatureModifierCondition[],
    context: RuntimeContext
): boolean {
    return conditions.every(condition => {
        switch (condition.conditionType) {
            case FeatureModifierConditionType.trigger:
                return context.activeTokens.includes(condition.conditionValue);
                
            case FeatureModifierConditionType.attack_type:
                return context.attackType?.includes(condition.conditionValue) ?? false;
                
            case FeatureModifierConditionType.other:
                return evaluateCustomCondition(condition.conditionValue, context);
                
            default:
                return true;
        }
    });
}
```

### **Custom Condition Evaluation**
```typescript
function evaluateCustomCondition(
    conditionValue: string,
    context: RuntimeContext
): boolean {
    const [conditionType, conditionData] = conditionValue.split(':');
    
    switch (conditionType) {
        case 'armor_check':
            return checkArmorCondition(conditionData, context);
            
        case 'opponent_type':
            return context.targetTags?.includes(conditionData) ?? false;
            
        case 'size_small':
            return character.size === 'small';
            
        case 'target_denied_dex_bonus':
            return context.targetDeniedDexBonus ?? false;
            
        case 'using_chosen_weapon':
            return context.weaponId === getChosenWeaponId(context);
            
        default:
            return false;
    }
}
```

## Choice Resolution

### **Choice Resolution Function**
```typescript
async function resolveFeatureChoices(
    characterId: number,
    progressionId: number
): Promise<CharacterFeatureChoice[]> {
    
    const progression = await getFeatureProgression(progressionId);
    const choices = progression.choices;
    
    const characterChoices = [];
    
    for (const choice of choices) {
        switch (choice.choiceBehavior) {
            case ChoiceBehavior.Single:
                const selection = await presentSingleChoice(choice);
                characterChoices.push({
                    characterId,
                    progressionId,
                    featureChoiceId: choice.id,
                    key: choice.label,
                    value: selection.id.toString()
                });
                break;
                
            case ChoiceBehavior.Multiple:
                const selections = await presentMultipleChoice(choice);
                selections.forEach((sel, index) => {
                    characterChoices.push({
                        characterId,
                        progressionId,
                        featureChoiceId: choice.id,
                        key: `${choice.label}_${index}`,
                        value: sel.id.toString()
                    });
                });
                break;
                
            case ChoiceBehavior.Allocation:
                const allocations = await presentAllocationChoice(choice);
                allocations.forEach((allocation, index) => {
                    characterChoices.push({
                        characterId,
                        progressionId,
                        featureChoiceId: choice.id,
                        key: `allocation_${index}`,
                        value: `${allocation.targetId}:${allocation.amount}`
                    });
                });
                break;
        }
    }
    
    return characterChoices;
}
```

## Performance Optimization

### **Caching Strategies**
```typescript
// Cache character progressions
const progressionCache = new Map<number, FeatureProgression[]>();

async function getActiveProgressions(characterId: number): Promise<FeatureProgression[]> {
    if (progressionCache.has(characterId)) {
        return progressionCache.get(characterId)!;
    }
    
    const progressions = await fetchCharacterProgressions(characterId);
    progressionCache.set(characterId, progressions);
    return progressions;
}

// Cache choice results
const choiceCache = new Map<string, any>();

async function getCharacterChoice(
    characterId: number,
    progressionId: number,
    choiceKey: string
): Promise<any> {
    const cacheKey = `${characterId}:${progressionId}:${choiceKey}`;
    
    if (choiceCache.has(cacheKey)) {
        return choiceCache.get(cacheKey);
    }
    
    const choice = await fetchCharacterChoice(characterId, progressionId, choiceKey);
    choiceCache.set(cacheKey, choice);
    return choice;
}
```

### **Batch Processing**
```typescript
async function processModifiersBatch(
    modifiers: FeatureModifier[],
    context: RuntimeContext
): Promise<FeatureModifier[]> {
    const validModifiers = [];
    
    // Process in batches of 100
    for (let i = 0; i < modifiers.length; i += 100) {
        const batch = modifiers.slice(i, i + 100);
        const batchResults = await Promise.all(
            batch.map(mod => evaluateModifier(mod, context))
        );
        validModifiers.push(...batchResults.filter(Boolean));
    }
    
    return validModifiers;
}
```

## Usage Examples

### **Calculate Attack Bonus**
```typescript
const attackBonus = await calculateCharacterModifiers(characterId, {
    attackType: ['melee'],
    weaponId: WEAPON_ID.LONGSWORD,
    targetTags: ['dragon']
});

console.log(`Attack bonus: ${attackBonus.attack.total}`);
```

### **Calculate Damage**
```typescript
const damage = await calculateCharacterModifiers(characterId, {
    attackType: ['melee', 'sneak_attack'],
    weaponId: WEAPON_ID.SHORTSWORD
});

console.log(`Extra dice: ${damage.damage.extraDice}`);
```

### **Calculate Saves**
```typescript
const saves = await calculateCharacterModifiers(characterId, {
    activeTokens: ['rage_active']
});

console.log(`Will save: ${saves.saves.Will}`);
```

## Key Patterns

1. **Context-Aware Calculation**: Runtime context determines modifier application
2. **Choice Dependency**: Modifiers depend on player choices
3. **Condition Evaluation**: Complex condition parsing and evaluation
4. **Performance Optimization**: Caching and batch processing strategies
5. **Error Handling**: Graceful handling of missing data

For testing patterns, see **[testing-patterns.md](testing-patterns.md)** and **[common-pitfalls.md](common-pitfalls.md)**.
