# Wilderness Exploration

Wilderness exploration involves **navigation challenges**, **survival mechanics**, and **environmental hazards** that test characters beyond combat encounters. These systems are essential for travel mechanics, survival games, and exploration-focused adventures.

## Getting Lost Mechanics

### Conditions That Cause Loss
**Poor Visibility:**
- **Fog, snow, heavy rain** - Obscure landmarks
- **Darkness** - Without adequate light sources
- **Distance limit** - Cannot see at least 60 feet
- **Vision impairment** - Natural or magical blindness

**Difficult Terrain:**
- **Forest** - Obscures distant landmarks and sky
- **Mountains** - Complex terrain with many similar features
- **Moors and hills** - Lack of distinctive navigation points
- **Off-trail travel** - Away from roads, streams, obvious paths

### Navigation Skill Checks
**Survival DC by Circumstance:**
| Terrain Condition | DC | Notes |
|-------------------|----:|--------|
| Moor/hill with map | 6 | Easiest navigation |
| Mountain with map | 8 | Moderate with guidance |
| Moor/hill without map | 10 | Standard difficulty |
| Poor visibility | 12 | Weather/darkness penalty |
| Mountain without map | 12 | Challenging terrain |
| Forest | 15 | Most difficult terrain |

**Modifiers:**
- **Knowledge (geography/local) 5+ ranks** - +2 bonus
- **Compass or similar tool** - +2 bonus (DM discretion)
- **Ranger favored terrain** - +2 bonus
- **Native guide** - Automatic success

### Implementation Logic
```pseudocode
class NavigationSystem {
    function checkForGettingLost(party, terrain, conditions) {
        if (party.isOnRoad() || party.isFollowingStream()) {
            return false  // Cannot get lost on obvious path
        }
        
        leader = party.getNavigator()
        baseDC = getTerrainDC(terrain)
        
        // Apply condition modifiers
        if (conditions.poorVisibility) baseDC = Math.max(baseDC, 12)
        if (!party.hasMap()) baseDC += getNoMapPenalty(terrain)
        
        // Add bonuses
        bonus = 0
        if (leader.hasSkillRanks("Knowledge (geography)", 5)) bonus += 2
        if (leader.hasSkillRanks("Knowledge (local)", 5)) bonus += 2
        if (terrain == leader.favoredTerrain) bonus += 2
        
        survivalResult = leader.rollSurvival() + bonus
        return survivalResult < baseDC
    }
}
```

## Effects of Being Lost

### Immediate Consequences
- **Direction confusion** - Cannot determine true direction of travel
- **Movement penalty** - Move at half speed
- **No progress** - May move in circles or backtrack
- **Resource depletion** - Consume food/water without advancing

### Determining Lost Movement
```pseudocode
function getLostMovementDirection() {
    // Roll 1d6 for actual direction traveled
    directions = [
        "intended",      // 1: Lucky guess, go where intended
        "right_45",      // 2: 45 degrees to the right
        "right_90",      // 3: 90 degrees to the right  
        "opposite",      // 4: Directly opposite intended
        "left_90",       // 5: 90 degrees to the left
        "left_45"        // 6: 45 degrees to the left
    ]
    
    roll = random(1, 6)
    return directions[roll - 1]
}
```

### Recovery from Being Lost
**Recognizing the Problem:**
- **Automatic after 24 hours** - Characters realize they're lost
- **Earlier recognition** - Wisdom check DC 20 after 4 hours
- **Landmark spotting** - May indicate wrong direction

**Finding Direction:**
- **Survival check DC 15** - Determine correct direction
- **Celestial navigation** - Use sun/stars if visible
- **Magical assistance** - *Know direction*, divination spells
- **High ground** - Climb to spot landmarks

## Weather Systems

### Weather Effects on Travel
**Temperature Extremes:**
- **Severe heat** - Constitution checks or fatigue
- **Severe cold** - Constitution checks or damage
- **Clothing modifiers** - Appropriate gear reduces penalties

**Precipitation:**
- **Light rain** - No mechanical effect
- **Heavy rain** - Reduces visibility, may cause getting lost
- **Snow** - Difficult terrain, reduced visibility, cold damage
- **Storms** - Multiple hazards combined

### Weather Implementation
```pseudocode
class WeatherSystem {
    function generateWeatherForDay(season, terrain, climate) {
        baseWeather = getSeasonalWeather(season, climate)
        terrainModifier = getTerrainModifier(terrain)
        
        temperature = rollTemperature(baseWeather, terrainModifier)
        precipitation = rollPrecipitation(baseWeather, season)
        wind = rollWindConditions(terrain, season)
        
        return {
            temperature: temperature,
            precipitation: precipitation, 
            wind: wind,
            visibility: calculateVisibility(precipitation, wind),
            travelEffects: calculateTravelImpact(temperature, precipitation, wind)
        }
    }
    
    function applyWeatherEffects(party, weather) {
        if (weather.temperature == "extreme_cold") {
            party.members.forEach(member => {
                if (!member.hasProtection("cold")) {
                    member.makeConstitutionCheck(15)
                }
            })
        }
        
        if (weather.precipitation == "heavy") {
            party.visibility = Math.min(party.visibility, 60)
            party.shouldCheckGettingLost = true
        }
    }
}
```

## Survival Challenges

### Basic Needs
**Food Requirements:**
- **1 pound per day** - Medium humanoid
- **Survival check DC 10** - Find food in wild
- **Starvation effects** - Constitution damage after missed meals

**Water Requirements:**
- **1 gallon per day** - Normal conditions
- **2 gallons per day** - Hot climate
- **Survival check DC 15** - Find water source
- **Dehydration effects** - Rapid Constitution damage

### Shelter and Rest
**Exposure Protection:**
- **Natural shelter** - Caves, overhangs, dense trees
- **Constructed shelter** - Tents, lean-tos, snow caves
- **Magical protection** - *Endure elements*, *tiny hut*
- **Inadequate rest** - Fatigue penalties, reduced healing

### Foraging and Hunting
```pseudocode
class SurvivalMechanics {
    function attemptForaging(character, terrain, hours) {
        baseDC = getForagingDC(terrain)
        timeBonus = Math.floor(hours / 2)  // +1 per 2 hours spent
        
        result = character.rollSurvival() + timeBonus
        
        if (result >= baseDC) {
            foodFound = calculateFoodYield(result - baseDC, terrain)
            return foodFound
        }
        
        return 0  // No food found
    }
    
    function getForagingDC(terrain) {
        terrainDCs = {
            "plains": 10,
            "forest": 10, 
            "hills": 12,
            "mountains": 15,
            "desert": 20,
            "arctic": 20
        }
        
        return terrainDCs[terrain] || 15
    }
}
```

## Travel Pace and Fatigue

### Movement Rates
- **Slow pace** - ×3/4 speed, can use Stealth
- **Normal pace** - Standard movement rate
- **Fast pace** - ×1.25 speed, -5 penalty to Perception

### Forced March
- **8 hours normal** - No penalty
- **Each additional hour** - Constitution check DC 10, +2 per previous check
- **Failure result** - 1d6 nonlethal damage, fatigue condition

---

> **🎯 AI Implementation**: Critical for travel systems, survival mechanics, and exploration-focused gameplay in D&D applications.

**See Also**: [Weather Systems](weather.md) • [Terrain Types](../terrain/) • [Survival Skills](../../skills/survival.md) • [Overland Movement](../../exploration/movement.md)
