# Smart Content Restoration Strategy

## 📊 Analysis Findings

**Current State:**
- **125 existing markdown files**
- **66.4% are AI-optimal size** (50-150 lines) 
- **29 files need splitting** (>150 lines)
- **13 files too small** (<50 lines) - could be expanded
- **Strong cross-reference network** (599 links)

## 🎯 Revised Restoration Approach

### **Strategy 1: Fix Existing Issues First**
Before adding new content, optimize what we have:

#### **Phase 1A: Split Oversized Files (29 files)**
1. **conditions/condition-reference.md** (310 lines) 
   - Split into: individual condition categories
   - Keep alphabetical index as overview

2. **combat/modifiers/combat-modifiers.md** (237 lines)
   - Split into: situational modifiers, environmental modifiers, stacking rules

3. **magic/schools/schools-overview.md** (220 lines)
   - Split into: individual school files (Evocation, Illusion, etc.)

#### **Phase 1B: Enhance Small Files (13 files)**
- Expand files under 50 lines with missing mechanics
- Focus on files that support tool development

### **Strategy 2: Add Missing Rule Systems**
Target content gaps that would **help AI agents build D&D tools**:

#### **Priority 1: Special Abilities Framework**
**Current Gap:** `srd_specialAbilities.htm` (86K chars) vs tiny markdown fragments

**AI Tool Value:** Essential for character/monster management
- How special abilities work in code
- When they trigger in gameplay
- How they interact with other systems

**New Files (50-100 lines each):**
```
abilities/special-abilities/
├── overview.md              # What are special abilities
├── extraordinary.md         # Ex abilities - how they work
├── supernatural.md          # Su abilities - magic interaction  
├── spell-like.md           # Sp abilities - like spells but not
├── natural-abilities.md    # Natural abilities
└── ability-interactions.md # How they stack/conflict
```

#### **Priority 2: Magic Item System**
**Current Gap:** Multiple 15K-25K magic item files vs generic summaries

**AI Tool Value:** Critical for inventory/treasure management
- Item creation rules for procedural generation
- Item mechanics for character sheets
- Pricing and balancing for treasure systems

**New Files:**
```
magic/items/
├── item-basics.md          # How magic items work
├── activation.md           # Command words, triggers, etc.
├── creation-overview.md    # Creating magic items
├── pricing-rules.md        # Item value calculation
├── item-types.md          # Categories of items
└── cursed-items.md        # Cursed item mechanics
```

#### **Priority 3: Feat Prerequisites System**
**Current Gap:** `srd_feats.htm` (62K chars) vs minimal content

**AI Tool Value:** Essential for character builder validation
- Prerequisite checking algorithms
- Feat dependency trees
- Multiclass feat interactions

**New Files:**
```
character/feats/
├── feat-basics.md          # How feats work
├── prerequisites.md        # Prerequisite types and checking
├── bonus-feats.md         # Class bonus feats
├── feat-types.md          # Fighter vs general vs metamagic
└── multiclass-feats.md    # Cross-class interactions
```

### **Strategy 3: Environment Systems**
**AI Tool Value:** For encounter/adventure generation tools

#### **Dungeon Generation Rules**
```
environments/dungeons/
├── generation-basics.md    # Random dungeon principles
├── room-types.md          # Types of rooms and their purposes
├── corridor-design.md     # Connecting spaces
├── trap-placement.md      # Where/when to place traps
└── lighting-air.md        # Environmental factors
```

#### **Wilderness Exploration**
```
environments/wilderness/
├── getting-lost.md        # Navigation mechanics
├── weather-effects.md     # Weather on gameplay
├── survival-basics.md     # Food, water, shelter
└── random-encounters.md   # Encounter frequency/timing
```

## 🛠️ Implementation Plan

### **Content Extraction Strategy**
1. **Identify focused sections** from large HTML files
2. **Extract rule mechanics** (not individual data)
3. **Convert to 50-100 line chunks** with clear purpose
4. **Add cross-references** to existing content
5. **Focus on AI/tool development utility**

### **Example: Special Abilities Extraction**
From `srd_specialAbilities.htm` (1,065 lines), extract:

**Extract Section: "Extraordinary Abilities" (lines 100-250)**
```markdown
# Extraordinary Abilities (Ex)

Extraordinary abilities are **nonmagical abilities** that are natural to the creature but beyond what most creatures can accomplish.

## Key Characteristics
- **Not magical** - not affected by antimagic
- **Cannot be dispelled** - dispel magic has no effect
- **No spell resistance** - SR doesn't apply
- **No attack of opportunity** - using doesn't provoke AoO

## How They Work
Extraordinary abilities work automatically or can be activated at will...
[Continue for ~75 more lines covering mechanics]
```

### **Quality Criteria**
Each new file must:
- **50-100 lines** optimal for AI processing
- **Single focused topic** that aids tool development
- **Clear mechanics** not individual data records
- **Cross-references** to related systems
- **Practical examples** for implementation

### **Development Priority**
1. **Character creation tools** → Special abilities, feats, prerequisites
2. **Combat managers** → Combat modifiers, special attacks  
3. **Inventory systems** → Magic items, equipment mechanics
4. **Adventure tools** → Dungeon generation, wilderness exploration

## 📊 Expected Results
- **~25 new markdown files** (not 30+ as originally planned)
- **All files 50-150 lines** for optimal AI consumption
- **Enhanced existing files** through targeted expansion
- **Complete rule coverage** for tool development
- **No individual data duplication** (database remains separate)

This approach prioritizes **quality over quantity** and focuses on content that directly supports AI agents building D&D management tools.
