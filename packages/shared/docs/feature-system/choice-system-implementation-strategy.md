# Choice System Implementation Strategy

*Frontend UI enhancements for complex choice scenarios using existing schema capabilities.*

## **Analysis: Existing Schema is Complete**

After examining the existing Prisma schema, I discovered that **the backend schema already supports all the required functionality**. The gaps are primarily in the **frontend UI**, not the backend.

### ✅ **What's Already Available**

#### **1. FeatureChoice Model (Complete)**
```prisma
model FeatureChoice {
    id              Int            @id @default(autoincrement())
    progressionId   Int
    label           String?        // Display text for the choice
    pickCount       Int?           // Number of selections allowed
    choiceType      ChoiceType     // Feat or Feature
    choiceBehavior  ChoiceBehavior // Single, Multiple, Allocation
    featId          Int?           // Specific feat (if applicable)
    chosenFeatureId Int?           // Specific feature (if applicable)
    
    // Relationships
    featureProgression     FeatureProgression       @relation(fields: [progressionId], references: [id])
    feat                   Feat?                    @relation(fields: [featId], references: [id])
    feature                Feature?                 @relation(fields: [chosenFeatureId], references: [id])
    characterFeatureChoice CharacterFeatureChoice[]
}
```

#### **2. CharacterFeatureChoice Model (Complete)**
```prisma
model CharacterFeatureChoice {
    id              Int     @id @default(autoincrement())
    characterId     Int
    featureChoiceId Int
    progressionId   Int
    advancementId   Int
    key             String? // For choice identification
    value           String  // The actual choice made
    choiceIndex     Int?    // For multiple choices
    
    // Relationships
    featureProgression FeatureProgression   @relation(fields: [progressionId], references: [id])
    featureChoice      FeatureChoice        @relation(fields: [featureChoiceId], references: [id])
    advancement        CharacterAdvancement @relation(fields: [advancementId], references: [id])
    
    @@unique([advancementId, progressionId, key])
}
```

#### **3. FeatureModifier with Choice Dependencies (Complete)**
```prisma
model FeatureModifier {
    // ... other fields
    appliesIfChoiceKey: String?    // Choice key that enables this modifier
    appliesIfChoiceValue: String?  // Specific choice value required
}
```

### ✅ **What This Already Supports**

1. **Specific Feat Selection**: `featId` field in `FeatureChoice`
2. **Choice Dependencies**: `appliesIfChoiceKey` and `appliesIfChoiceValue` in `FeatureModifier`
3. **Multiple Choices**: `pickCount` and `choiceBehavior` fields
4. **Choice Tracking**: `CharacterFeatureChoice` stores actual player selections
5. **Choice Identification**: `key` field for identifying specific choices

## **Actual Gaps: Frontend UI Only**

The gaps are primarily in the **frontend UI**, not the backend schema:

### **1. ✅ UI for Specific Feat Selection - IMPLEMENTED**
- ✅ Edit Progression dialog now allows selecting specific feats within choices
- ✅ Dropdown for `FeatureChoice.featId` when `choiceType === 'Feat'`
- ✅ Supports both filtered choice selection via `FeatureProgression.appliesToType`/`appliesTo` AND specific choice selection via `FeatureChoice.featId`

### **2. ✅ Level-Dependent Filtering UI - ALREADY HANDLED**
- ✅ **Level-dependent filtering**: Handled by single FeatureProgression entries with multiple FeatureChoice entries
- ✅ **Level-specific options**: Each level has its own FeatureProgression with multiple choices for that level

### **3. No Choice Selection UI for Players**
- No interface for players to make choices during character creation
- No validation of prerequisites during choice selection

### **4. ✅ Choice Dependency Configuration UI - ALREADY IMPLEMENTED**
- ✅ `appliesIfChoiceKey` and `appliesIfChoiceValue` fields available in modifier form
- ✅ UI for setting up choice-dependent modifiers already exists

### **5. ✅ Clear Distinction Between Choice Approaches - IMPLEMENTED**
- ✅ UI guidance explains when to use filtered vs specific choice selection
- ✅ Clear guidance on when to use `FeatureProgression.appliesToType` vs `FeatureChoice.featId`

## **Implementation Status: Frontend UI Enhancements - COMPLETED**

### **Phase 1: ✅ Extend FeatureProgressionDetailEdit - COMPLETED**

#### **1.1 ✅ Add Specific Feat Selection UI - COMPLETED**

The UI now supports both filtered choice selection via `FeatureProgression.appliesToType`/`appliesTo` AND specific feat selection via `FeatureChoice.featId`:

```typescript
// Added to ChoiceDetailForm when choiceType === 'Feat'
{isFeatChoice && (
    <div>
        <ValidatedCustomSelect
            field={`choices.${index}.featId`}
            label="Specific Feat (Optional)"
            options={availableFeats.map(feat => ({ value: feat.id, label: feat.name }))}
            placeholder="Select a specific feat or leave empty for filtered choice"
            nested
        />
        <p className="text-xs text-gray-500 mt-1">
            Leave empty to use filtered choice selection above. Use this for specific options like Monk bonus feats.
        </p>
    </div>
)}
```

#### **1.2 ✅ Add Choice Key Field - COMPLETED**

```typescript
// Added to ChoiceDetailForm
<div>
    <ValidatedInput
        field={`choices.${index}.key`}
        label="Choice Key (for dependencies)"
        type="text"
        placeholder="e.g., monk_bonus_feat_level_1"
        componentExtraClassName="flex items-center gap-2"
        nested
    />
    <p className="text-xs text-gray-500 mt-1">
        Used by modifiers to check if this choice was made
    </p>
</div>
```

#### **1.3 ✅ Add Choice Approach Guidance - COMPLETED**

UI guidance added to help users understand when to use each approach:

```typescript
// Added explanation section before choice form
<div className="border border-blue-200 rounded-md p-3 bg-blue-50 dark:bg-blue-900/20">
    <h4 className="text-sm font-medium mb-2 text-blue-800 dark:text-blue-200">
        Choice Selection Approach
    </h4>
    <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
        <p><strong>Filtered Choice:</strong> Use "Applies To Type" and "Applies To" below for broad categories (e.g., "any fighter bonus feat")</p>
        <p><strong>Specific Choice:</strong> Use "Specific Feat" below for predefined options (e.g., "Improved Grapple or Stunning Fist")</p>
    </div>
</div>
```

#### **1.2 Add Choice Dependency Configuration**

```typescript
// Add choice dependency fields to modifier form
const ModifierForm = ({ modifier, onChange, availableChoices = [] }) => {
    return (
        <div className="space-y-4">
            {/* ... existing modifier fields ... */}
            
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Applies If Choice Key
                </label>
                <input
                    type="text"
                    value={modifier.appliesIfChoiceKey || ''}
                    onChange={(e) => onChange({ ...modifier, appliesIfChoiceKey: e.target.value })}
                    placeholder="e.g., monk_bonus_feat_level_1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Applies If Choice Value
                </label>
                <input
                    type="text"
                    value={modifier.appliesIfChoiceValue || ''}
                    onChange={(e) => onChange({ ...modifier, appliesIfChoiceValue: e.target.value })}
                    placeholder="e.g., improved_grapple"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
            </div>
        </div>
    );
};
```

### **Phase 2: Create Choice Selection UI for Players**

#### **2.1 Choice Selection Component**

```typescript
// frontend/src/components/choice-system/ChoiceSelection.tsx

export const ChoiceSelection = ({ 
    character, 
    featureChoice, 
    onSelect,
    availableFeats = []
}) => {
    const [selectedOption, setSelectedOption] = useState(null);
    const [validationErrors, setValidationErrors] = useState([]);
    
    // Get available options based on choice configuration
    const getAvailableOptions = useCallback(() => {
        if (featureChoice.featId) {
            // Specific feat is already selected
            return [availableFeats.find(f => f.id === featureChoice.featId)].filter(Boolean);
        }
        
        // Return all available feats (would need filtering logic)
        return availableFeats;
    }, [featureChoice, availableFeats]);
    
    // Validate option prerequisites
    const validateOption = useCallback(async (featId: number) => {
        const response = await fetch(`/api/feats/${featId}/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ characterId: character.id })
        });
        
        const result = await response.json();
        return result.valid;
    }, [character.id]);
    
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">{featureChoice.label}</h3>
            
            {featureChoice.choiceType === 'Feat' && (
                <div className="grid grid-cols-2 gap-4">
                    {getAvailableOptions().map(feat => (
                        <Button
                            key={feat.id}
                            variant={selectedOption === feat.id ? 'default' : 'outline'}
                            onClick={async () => {
                                const isValid = await validateOption(feat.id);
                                if (isValid) {
                                    setSelectedOption(feat.id);
                                    onSelect({ 
                                        type: 'feat', 
                                        id: feat.id,
                                        key: featureChoice.key,
                                        value: feat.name.toLowerCase().replace(/\s+/g, '_')
                                    });
                                } else {
                                    setValidationErrors([`${feat.name}: Prerequisites not met`]);
                                }
                            }}
                        >
                            <div className="text-left">
                                <div className="font-medium">{feat.name}</div>
                                <div className="text-sm text-gray-500">{feat.description}</div>
                            </div>
                        </Button>
                    ))}
                </div>
            )}
            
            {validationErrors.length > 0 && (
                <div className="text-red-600 text-sm">
                    {validationErrors.map((error, index) => (
                        <div key={index}>{error}</div>
                    ))}
                </div>
            )}
        </div>
    );
};
```

### **Phase 3: Backend Service Enhancements**

#### **3.1 Add Feat Validation Endpoint**

```typescript
// backend/src/features/feat/featController.ts

@Controller('feats')
export class FeatController {
    @Post(':id/validate')
    async validateFeatPrerequisites(
        @Param('id') featId: number,
        @Body() data: { characterId: number }
    ) {
        const character = await this.characterService.getCharacter(data.characterId);
        const feat = await this.featService.getFeat(featId);
        
        const isValid = await this.featValidationService.validatePrerequisites(feat, character);
        
        return { valid: isValid };
    }
}
```

#### **3.2 Add Choice Resolution Service**

```typescript
// backend/src/features/choice/choiceResolutionService.ts

export class ChoiceResolutionService {
    // Get available choices for a character at a specific level
    async getAvailableChoices(characterId: number, progressionId: number): Promise<FeatureChoice[]> {
        const character = await this.characterService.getCharacter(characterId);
        const progression = await this.featureService.getProgression(progressionId);
        
        // Get choices for this progression
        const choices = await this.prisma.featureChoice.findMany({
            where: { progressionId },
            include: { feat: true, feature: true }
        });
        
        // Filter based on character level and existing choices
        return choices.filter(choice => this.isChoiceAvailable(choice, character));
    }
    
    // Check if a choice is available for a character
    private isChoiceAvailable(choice: FeatureChoice, character: Character): boolean {
        // Check if character already made this choice
        const existingChoice = character.featureChoices.find(
            fc => fc.featureChoiceId === choice.id
        );
        
        if (existingChoice) return false;
        
        // Check prerequisites if specific feat is required
        if (choice.featId) {
            return this.validateFeatPrerequisites(choice.featId, character);
        }
        
        return true;
    }
}
```

## **Implementation Examples Using Existing Schema**

### **1. Monk Bonus Feats**

You're absolutely correct! The level-dependent filtering is handled by a single `FeatureProgression` entry with multiple `FeatureChoice` entries. Here's the correct model:

```typescript
// Level 1: Single FeatureProgression with multiple FeatureChoice entries
const monkBonusFeatLevel1: FeatureProgression = {
    level: 1,
    sourceType: FeatureSourceType.Class,
    classId: MONK_CLASS_ID,
    appliesToType: FeatureAppliesToType.Feat,
    appliesTo: FeatureFeatChoiceFilter.MonkBonus,
    modifiers: [],
    choices: [
        {
            choiceType: ChoiceType.Feat,
            choiceBehavior: ChoiceBehavior.Single,
            label: "Bonus Feat",
            key: "monk_bonus_feat_level_1",
            featId: FEAT_MAP.IMPROVED_GRAPPLE // Specific feat
        },
        {
            choiceType: ChoiceType.Feat,
            choiceBehavior: ChoiceBehavior.Single,
            label: "Bonus Feat", 
            key: "monk_bonus_feat_level_1",
            featId: FEAT_MAP.STUNNING_FIST // Specific feat
        }
    ],
    effects: []
};

// Level 2: Single FeatureProgression with multiple FeatureChoice entries
const monkBonusFeatLevel2: FeatureProgression = {
    level: 2,
    sourceType: FeatureSourceType.Class,
    classId: MONK_CLASS_ID,
    appliesToType: FeatureAppliesToType.Feat,
    appliesTo: FeatureFeatChoiceFilter.MonkBonus,
    modifiers: [],
    choices: [
        {
            choiceType: ChoiceType.Feat,
            choiceBehavior: ChoiceBehavior.Single,
            label: "Bonus Feat",
            key: "monk_bonus_feat_level_2", 
            featId: FEAT_MAP.COMBAT_REFLEXES // Specific feat
        },
        {
            choiceType: ChoiceType.Feat,
            choiceBehavior: ChoiceBehavior.Single,
            label: "Bonus Feat",
            key: "monk_bonus_feat_level_2",
            featId: FEAT_MAP.DEFLECT_ARROWS // Specific feat
        }
    ],
    effects: []
};
```

### **2. Ranger Fighting Style with Dependencies**

```typescript
// Level 2: Combat Style Choice
const rangerCombatStyle: FeatureProgression = {
    level: 2,
    sourceType: FeatureSourceType.Class,
    classId: RANGER_CLASS_ID,
    appliesToType: FeatureAppliesToType.Feat,
    appliesTo: FeatureFeatChoiceFilter.RangerCombatStyle,
    modifiers: [
        // Rapid Shot (if archery chosen)
        {
            type: ModifierType.Other,
            appliesTo: ModifierAppliesToType.Feat,
            appliesToId: FEAT_MAP.RAPID_SHOT,
            value: 0,
            bonusType: FeatureBonusType.Other,
            appliesIfChoiceKey: "ranger_combat_style",
            appliesIfChoiceValue: "archery"
        },
        // Two-Weapon Fighting (if two-weapon chosen)
        {
            type: ModifierType.Other,
            appliesTo: ModifierAppliesToType.Feat,
            appliesToId: FEAT_MAP.TWO_WEAPON_FIGHTING,
            value: 0,
            bonusType: FeatureBonusType.Other,
            appliesIfChoiceKey: "ranger_combat_style",
            appliesIfChoiceValue: "two_weapon"
        }
    ],
    choices: [{
        choiceType: ChoiceType.Feature,
        choiceBehavior: ChoiceBehavior.Single,
        label: "Choose Combat Style: Archery or Two-Weapon Combat",
        key: "ranger_combat_style",
    }],
    effects: []
};
```

## **Implementation Timeline**

### **Week 1: Frontend UI Enhancements**
- [ ] Extend FeatureProgressionDetailEdit with specific feat selection
- [ ] Add choice dependency configuration UI
- [ ] Add choice key input fields

### **Week 2: Choice Selection UI**
- [ ] Create ChoiceSelection component for character creation
- [ ] Add feat validation during choice selection
- [ ] Integrate with character advancement workflow

### **Week 3: Backend Services**
- [ ] Add feat validation endpoint
- [ ] Create choice resolution service
- [ ] Add choice availability checking

### **Week 4: Testing and Integration**
- [ ] Test Monk bonus feats workflow
- [ ] Test Ranger fighting style dependencies
- [ ] Test Rogue special abilities
- [ ] Update documentation

## **Success Criteria**

- [ ] Edit Progression dialog allows selecting specific feats
- [ ] Choice dependencies can be configured in modifier form
- [ ] Players can make choices during character creation
- [ ] Prerequisites are validated during choice selection
- [ ] Character sheet displays choices correctly
- [ ] All existing functionality remains intact

## **Key Insight**

The existing schema is **much more capable** than initially thought. The `FeatureChoice` model with `featId`, `key`, and `value` fields, combined with `FeatureModifier`'s `appliesIfChoiceKey` and `appliesIfChoiceValue` fields, already supports:

1. **Specific feat selection** via `featId`
2. **Choice dependencies** via `appliesIfChoiceKey`/`appliesIfChoiceValue`
3. **Choice tracking** via `CharacterFeatureChoice`
4. **Multiple choice behaviors** via `choiceBehavior`
5. **Level-dependent filtering** via single `FeatureProgression` entries with multiple `FeatureChoice` entries

The implementation should focus on **frontend UI enhancements** to expose these existing capabilities, rather than extending the schema.
