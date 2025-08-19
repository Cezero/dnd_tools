# Content Restoration Plan

## 🔍 Audit Summary

The content audit revealed **57 major content gaps** between the cleaned HTML source and existing markdown files. The key findings:

### 📊 Categories of Content Gaps

**✅ Correctly Excluded (Database Content):**
- **865 individual data files** (classes, spells, monsters) - correctly excluded from markdown
- These belong in the database, not documentation

**❌ Missing Rules Content (57 major gaps):**
- **Rules and mechanics** that should be in markdown but are severely summarized or missing
- Some HTML files are **97x larger** than their supposed markdown equivalents
- Many "matches" are actually **completely different topics**

### 🎯 Priority Categories for Restoration

#### **P1 - Critical Rules Missing (20+ files)**
1. **Special Abilities** (`srd_specialAbilities.htm`) - 86K chars vs 1.3K markdown
   - Covers: Extraordinary, Supernatural, Spell-like abilities
   - Current markdown: tiny creature spellcasting summary
   - **Action**: Create comprehensive special abilities rules

2. **Magic Items** (Multiple files: wondrous, artifacts, armor, etc.)
   - Each 15K-25K chars vs 1.3K markdown  
   - **Action**: Create magic item creation and mechanics rules

3. **Feats** (`srd_feats.htm`) - 62K chars vs 1.3K markdown
   - Complete feat mechanics and prerequisites
   - **Action**: Create feat rules and mechanics (not individual feat data)

#### **P2 - Important Mechanics (15 files)**
4. **Dungeon Construction** (`srd_dungeons.htm`) - 42K chars
   - Complete dungeon design rules, terrain, traps
   - **Action**: Create dungeon mechanics and construction

5. **Spell Descriptions** (`srd_magicOverview_spellDescriptions.htm`) - 32K chars
   - Spell mechanics, components, targeting rules
   - **Action**: Create spell mechanics (not individual spells)

6. **Wilderness** (`srd_wilderness.htm`) - 55K chars  
   - Weather, getting lost, survival mechanics
   - **Action**: Create wilderness and exploration rules

#### **P3 - Combat/Movement Expansions (22 files)**
7. **Movement and Position** (Multiple files)
   - Some correctly matched but HTML has much more detail
   - **Action**: Expand existing movement markdown with missing content

### 📋 Restoration Strategy

#### **Phase 1: Core Rules Creation**
- **Special Abilities** - Create comprehensive ability types documentation
- **Magic Item Mechanics** - Create item creation and usage rules  
- **Feat System** - Create feat mechanics and prerequisites system

#### **Phase 2: Environment and Exploration**
- **Dungeon Construction** - Create dungeon design rules
- **Wilderness Mechanics** - Create exploration and survival rules
- **Spell Mechanics** - Create spellcasting rules (not individual spells)

#### **Phase 3: Content Enhancement**
- **Expand existing files** where HTML has significantly more detail
- **Cross-reference integration** between new and existing content
- **Update index and quick-reference** to include new content

### 🛠️ Implementation Approach

#### **Content Conversion Process:**
1. **Extract relevant sections** from HTML using content-aware parsing
2. **Convert to professional markdown** with proper structure
3. **Split into appropriately-sized files** (50-200 lines each)
4. **Add cross-references** to related content
5. **Exclude individual data records** (preserve for database)

#### **Quality Assurance:**
- **Manual review** of critical rules sections
- **Verify completeness** against original HTML
- **Ensure no duplication** with database content
- **Test cross-references** and navigation

### 📁 New File Structure

```
dnd-rules/v3.x/
├── abilities/
│   ├── special-abilities/           # NEW: From srd_specialAbilities.htm
│   │   ├── overview.md
│   │   ├── extraordinary.md
│   │   ├── supernatural.md
│   │   └── spell-like.md
├── magic/
│   ├── items/                      # NEW: From multiple magic item files  
│   │   ├── creation-rules.md
│   │   ├── mechanics.md
│   │   └── categories.md
├── character/
│   ├── feats/                      # NEW: From srd_feats.htm
│   │   ├── feat-system.md
│   │   └── prerequisites.md
├── environments/
│   ├── dungeons/                   # NEW: From srd_dungeons.htm
│   │   ├── construction.md
│   │   ├── terrain.md
│   │   └── features.md
│   ├── wilderness/                 # NEW: From srd_wilderness.htm
│   │   ├── weather.md
│   │   ├── getting-lost.md
│   │   └── survival.md
```

### ⚠️ Critical Note

**Do NOT restore individual data records:**
- ❌ Individual spell descriptions → Database
- ❌ Individual monster stats → Database  
- ❌ Individual class progression → Database
- ❌ Individual feat descriptions → Database

**DO restore rules and mechanics:**
- ✅ How spells work
- ✅ How feats work
- ✅ How magic items work
- ✅ Combat mechanics
- ✅ Environment rules

### 📊 Expected Results

- **~30 new markdown files** covering missing rule systems
- **~50,000 lines** of restored content (rules only)
- **Complete rule coverage** without individual data duplication
- **Properly sized files** for AI agent consumption (50-200 lines each)
