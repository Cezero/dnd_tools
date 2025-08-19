# Weather and Survival

Weather conditions significantly impact **travel**, **survival**, and **combat** in wilderness environments. Understanding weather mechanics is essential for realistic travel systems and survival challenges in D&D applications.

## Temperature Effects

### Heat Dangers
**Severe Heat (above 90°F):**
- **Fort save DC 15** - Every 10 minutes of activity
- **Failure** - 1d4 nonlethal damage and fatigue
- **Heavy clothing/armor** - Additional +4 to DC

**Extreme Heat (above 110°F):**
- **Fort save DC 15** - Every minute of activity  
- **Failure** - 1d4 nonlethal damage and fatigue
- **Metal armor** - Conducts heat, +2 to DC

**Implementation:**
```pseudocode
class HeatHazard {
    function checkHeatExposure(character, temperature, activityLevel) {
        baseDC = 15
        interval = getCheckInterval(temperature)
        
        // Modifiers
        if (character.wearingHeavyClothing()) baseDC += 4
        if (character.wearingMetalArmor() && temperature > 110) baseDC += 2
        if (activityLevel == "strenuous") baseDC += 2
        
        if (!character.makeFortitudeSave(baseDC)) {
            character.takeNonlethalDamage(rollD4())
            character.applyCondition("fatigued")
        }
    }
}
```

### Cold Dangers
**Severe Cold (below 40°F):**
- **Fort save DC 15** - Every 10 minutes of exposure
- **Failure** - 1d6 nonlethal damage
- **Wet conditions** - Double damage

**Extreme Cold (below 0°F):**
- **Fort save DC 15** - Every minute of exposure
- **Failure** - 1d6 lethal damage
- **Exposed skin** - Frostbite risk

**Cold Protection:**
```pseudocode
class ColdProtection {
    protectionValues: {
        "winter_clothing": 10,    // +10°F effective temperature
        "cold_weather_outfit": 10,
        "furs": 5,
        "magical_warmth": 20,
        "shelter": 15
    }
    
    function calculateEffectiveTemperature(baseTemp, protections) {
        effectiveTemp = baseTemp
        
        protections.forEach(protection => {
            effectiveTemp += this.protectionValues[protection] || 0
        })
        
        return effectiveTemp
    }
}
```

## Precipitation Impact

### Rain Effects
**Light Rain:**
- **No mechanical effect** - Cosmetic only
- **Visibility** - Slightly reduced but not significantly

**Heavy Rain:**
- **Visibility reduced** - Half normal range
- **Ranged attacks** - -4 penalty
- **Perception (hearing)** - -4 penalty due to noise
- **Getting lost** - Increases navigation DC

**Stormy Weather:**
- **Severe wind and rain** - Combined effects
- **Lightning risk** - Potential electrical damage
- **Travel impossible** - May require shelter

### Snow and Ice
**Light Snow:**
- **Visibility reduced** - One category decrease
- **Tracks easier** - +2 to Survival for tracking

**Heavy Snow:**
- **Visibility severely limited** - Two categories decrease
- **Difficult terrain** - Movement at half speed
- **Cold exposure** - As severe cold conditions

**Ice Hazards:**
```pseudocode
class IceHazards {
    function checkIceWalking(character, surface) {
        balanceDC = getSurfaceDC(surface)
        
        if (character.hasClimbing()) balanceDC -= 2
        if (character.hasSpikes()) balanceDC -= 4
        
        if (!character.makeBalanceCheck(balanceDC)) {
            character.fallProne()
            if (surface == "steep_ice") {
                character.slide(rollD4() * 10) // feet
            }
        }
    }
    
    surfaceDCs: {
        "light_ice": 10,
        "heavy_ice": 15, 
        "steep_ice": 20
    }
}
```

## Wind Effects

### Wind Strength Categories
| Wind Force | Speed | Ranged Attack Penalty | Size Affected | Special Effects |
|------------|-------|----------------------|---------------|-----------------|
| **Light** | 0-10 mph | None | None | None |
| **Moderate** | 11-20 mph | None | None | None |
| **Strong** | 21-30 mph | -2 | Tiny creatures | Difficult flight |
| **Severe** | 31-50 mph | -4 | Small creatures | Impossible flight |
| **Windstorm** | 51-74 mph | Impossible | Medium creatures | Blown down |
| **Hurricane** | 75+ mph | Impossible | Large creatures | Massive damage |

### Wind Implementation
```pseudocode
class WindEffects {
    function applyWindToCharacter(character, windSpeed) {
        windCategory = getWindCategory(windSpeed)
        
        if (windCategory.affectedSizes.includes(character.size)) {
            if (windCategory.effect == "blown_down") {
                character.makeStrengthCheck(windCategory.dc) || character.fallProne()
            }
            
            if (windCategory.effect == "blown_away") {
                character.makeStrengthCheck(windCategory.dc) || character.moveInWindDirection(60)
            }
        }
        
        // Apply ranged attack penalties
        character.rangedAttackPenalty += windCategory.rangedPenalty
    }
}
```

## Visibility Conditions

### Light and Darkness
- **Bright light** - Normal vision and activities
- **Shadowy illumination** - Concealment (20% miss chance)
- **Darkness** - Total concealment (50% miss chance)
- **Supernatural darkness** - No vision regardless of light sources

### Weather Visibility
- **Clear** - Normal visibility ranges
- **Light obstruction** - 3/4 normal range
- **Moderate obstruction** - 1/2 normal range  
- **Heavy obstruction** - 1/4 normal range
- **Total obstruction** - No visibility beyond 5 feet

## Survival Integration

### Daily Weather Checks
```pseudocode
function processDaily WeatherEffects(party, weather) {
    party.members.forEach(member => {
        // Temperature effects
        if (weather.isExtreme()) {
            checkTemperatureExposure(member, weather)
        }
        
        // Precipitation effects
        if (weather.hasHeavyPrecipitation()) {
            member.equipment.forEach(item => {
                if (!item.isWaterproof()) {
                    item.applyWaterDamage()
                }
            })
        }
        
        // Wind effects
        if (weather.hasStrongWinds()) {
            applyWindEffects(member, weather.windSpeed)
        }
    })
}
```

### Equipment Considerations
- **Waterproof containers** - Protect gear from rain
- **Cold weather clothing** - Essential for temperature protection
- **Climbing gear** - Spikes for ice, ropes for wind
- **Shelter materials** - Tents, tarps for protection

---

> **🎯 AI Implementation**: Essential for travel systems, survival challenges, and environmental realism in D&D applications.

**See Also**: [Wilderness Exploration](exploration.md) • [Environmental Hazards](../hazards/) • [Survival Skills](../../skills/survival.md) • [Travel Mechanics](../../exploration/travel.md)
