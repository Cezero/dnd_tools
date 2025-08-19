# Dungeon Overview

Dungeons are **underground complexes** that serve as primary adventure locations in D&D. Understanding dungeon types, construction, and mechanics is essential for procedural generation, encounter design, and adventure management systems.

## Dungeon Types by Purpose

### Ruined Structure
**Characteristics:**
- **Originally occupied** - Built by previous inhabitants
- **Now abandoned** - Original creators are gone
- **New inhabitants** - Wandering creatures have moved in
- **Disabled traps** - Most traps already triggered
- **Wandering monsters** - Common due to lack of organization

**AI Implementation:**
```pseudocode
class RuinedDungeon {
    trapProbability: 0.1    // Most already triggered
    wanderingMonsters: 0.8  // High chance of random creatures
    guardPosts: 0.2         // Few organized defenses
    treasure: "scattered"   // Distributed randomly
    
    function generateEncounter() {
        return random.choice([
            "scavenging_creature",
            "territorial_beast", 
            "treasure_hunter",
            "trap_remnant"
        ])
    }
}
```

### Occupied Structure
**Characteristics:**
- **Currently active** - Intelligent creatures live there
- **Organized defenses** - Guards, patrols, communication
- **Functional design** - Doors, corridors sized for inhabitants
- **Controlled monsters** - Pets, minions, or allies
- **Active traps** - Maintained and reset regularly

**Implementation Pattern:**
```pseudocode
class OccupiedDungeon {
    trapProbability: 0.6     // Well-maintained
    wanderingMonsters: 0.3   // Controlled environment
    guardPosts: 0.9          // Heavy security
    treasure: "centralized"  // Stored in vaults/treasury
    
    function generateLayout() {
        return {
            entryPoints: "heavily_guarded",
            corridors: "patrolled",
            chambers: "purpose_built",
            treasury: "well_protected"
        }
    }
}
```

### Safe Storage
**Characteristics:**
- **Protective purpose** - Built to safeguard valuables
- **Heavy trap presence** - Maximum security measures
- **Minimal wandering** - Few living creatures
- **Guardian focus** - Undead, constructs, summoned creatures
- **Valuable contents** - Treasure, artifacts, important remains

**Security Implementation:**
```pseudocode
class SafeStorageDungeon {
    trapProbability: 0.95    // Maximum trapping
    wanderingMonsters: 0.1   // Very few random creatures
    guardPosts: 0.7          // Specific guardian placements
    treasure: "vault_concentrated" // Centralized storage
    
    guardianTypes: [
        "undead",      // No sustenance needed
        "construct",   // Tireless guardians
        "summoned",    // Appear when needed
        "magical_trap" // Automated defenses
    ]
}
```

### Natural Cavern Complex
**Characteristics:**
- **Naturally formed** - No intelligent construction
- **Irregular layout** - Organic, maze-like passages
- **Minimal traps** - Only natural hazards
- **Ecosystem approach** - Predator-prey relationships
- **Environmental variety** - Fungi, water features, minerals

**Generation Logic:**
```pseudocode
class NaturalCaverns {
    trapProbability: 0.05    // Only natural hazards
    wanderingMonsters: 0.9   // Natural ecosystem
    guardPosts: 0.1          // Territorial creatures only
    treasure: "environmental" // Natural formations, deposits
    
    function generateFeatures() {
        return random.choice([
            "fungal_forest",
            "underground_stream", 
            "crystal_formations",
            "mineral_deposits",
            "cave_paintings"
        ])
    }
}
```

## Dungeon Terrain Elements

### Wall Types and Properties
| Wall Type | Thickness | Break DC | Hardness | Hit Points | Climb DC |
|-----------|-----------|----------|----------|------------|----------|
| **Masonry** | 1 ft | 35 | 8 | 90 hp | 20 |
| **Superior masonry** | 1 ft | 35 | 8 | 90 hp | 25 |
| **Reinforced masonry** | 1 ft | 45 | 8 | 180 hp | 15 |
| **Hewn stone** | 3 ft | 50 | 8 | 540 hp | 25 |
| **Unworked stone** | 5 ft | 65 | 8 | 900 hp | 15 |
| **Iron** | 3 in | 30 | 10 | 90 hp | 25 |
| **Paper** | Paper-thin | 5 | 0 | 1 hp | 30 |
| **Wood** | 6 in | 20 | 5 | 30 hp | 21 |
| **Magically treated** | — | +20 | — | +100 hp | — |

### Door Mechanics
**Simple Doors:**
- **Wooden** - AC 3, Hardness 5, 10 hp, Break DC 13
- **Stone** - AC 4, Hardness 8, 15 hp, Break DC 16
- **Iron** - AC 5, Hardness 10, 20 hp, Break DC 18

**Complex Doors:**
- **Reinforced** - Double hit points, +5 Break DC
- **Barred** - +10 Break DC from one side
- **Locked** - Requires key or lock picking
- **Magically sealed** - Spell resistance, enhanced properties

### Lighting Systems
```pseudocode
class DungeonLighting {
    lightSources: {
        "none": 0,           // Total darkness
        "torch": 20,         // 20-foot radius bright light
        "lantern": 30,       // 30-foot radius bright light  
        "magical": 60,       // Variable radius
        "daylight_spell": 60 // Bright as daylight
    }
    
    function calculateVisibility(lightLevel, distance) {
        if (distance <= lightLevel) return "bright"
        if (distance <= lightLevel * 2) return "shadowy"
        return "darkness"
    }
}
```

## Dungeon Design Principles

### Room Purpose Categories
- **Entry chambers** - First impression, often trapped
- **Guard posts** - Defensive positions, alert systems
- **Living quarters** - Residential areas, personal items
- **Work areas** - Forges, labs, workshops
- **Storage** - Supplies, treasure, equipment
- **Temples/shrines** - Religious or ceremonial spaces
- **Prisons** - Holding areas, interrogation rooms
- **Secret areas** - Hidden passages, concealed rooms

### Encounter Balance
```pseudocode
function calculateEncounterLevel(dungeonLevel, roomType, occupantType) {
    baseEL = dungeonLevel
    
    // Adjust for room importance
    if (roomType == "treasury") baseEL += 2
    if (roomType == "boss_chamber") baseEL += 3
    if (roomType == "guard_post") baseEL += 1
    
    // Adjust for occupant organization
    if (occupantType == "organized") baseEL += 1
    if (occupantType == "elite_unit") baseEL += 2
    
    return Math.max(1, baseEL)
}
```

### Procedural Generation Guidelines
1. **Establish purpose** - Determine dungeon type and history
2. **Plan major areas** - Entry, core, treasure, escape routes
3. **Connect with passages** - Logical flow and choke points
4. **Populate with inhabitants** - Appropriate to dungeon type
5. **Place encounters** - Balanced challenge progression
6. **Add environmental features** - Lighting, air, water, hazards

---

> **🎯 AI Implementation**: Essential for procedural dungeon generation, encounter design, and adventure management systems in D&D applications.

**See Also**: [Dungeon Features](features.md) • [Trap Systems](../../traps/) • [Encounter Design](../encounters/) • [Exploration Rules](../../exploration/)
