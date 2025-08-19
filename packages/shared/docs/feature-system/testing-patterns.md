# Testing Patterns

*Testing patterns for validating D&D feature implementations.*

## Core Testing Principles

### **Test Both Positive and Negative Cases**
Always test that features apply when they should AND don't apply when they shouldn't.

### **Test Edge Cases**
Validate behavior at boundaries, with missing data, and unusual conditions.

### **Test Integration**
Ensure features work together correctly, especially with stacking rules.

## Feature Validation Tests

### **Barbarian Rage Testing**
```typescript
describe('Barbarian Rage', () => {
    test('provides correct bonuses when active', async () => {
        const character = createTestCharacter({
            class: 'Barbarian',
            level: 1
        });
        
        const modifiers = await calculateCharacterModifiers(character.id, {
            activeTokens: ['rage_active']
        });
        
        expect(modifiers.attributes.STR).toBe(20); // Base 16 + 4 morale
        expect(modifiers.attributes.CON).toBe(18); // Base 14 + 4 morale
        expect(modifiers.saves.Will).toBe(2); // +2 morale bonus
        expect(modifiers.AC.total).toBe(8); // -2 penalty
    });
    
    test('does not provide bonuses when inactive', async () => {
        const character = createTestCharacter({
            class: 'Barbarian',
            level: 1
        });
        
        const modifiers = await calculateCharacterModifiers(character.id, {
            activeTokens: []
        });
        
        expect(modifiers.attributes.STR).toBe(16); // Base only
        expect(modifiers.attributes.CON).toBe(14); // Base only
        expect(modifiers.saves.Will).toBe(0); // No bonus
        expect(modifiers.AC.total).toBe(10); // No penalty
    });
    
    test('scales correctly at higher levels', async () => {
        const character = createTestCharacter({
            class: 'Barbarian',
            level: 11
        });
        
        const modifiers = await calculateCharacterModifiers(character.id, {
            activeTokens: ['rage_active']
        });
        
        expect(modifiers.attributes.STR).toBe(22); // Base 16 + 6 morale
        expect(modifiers.attributes.CON).toBe(20); // Base 14 + 6 morale
    });
});
```

### **Sneak Attack Testing**
```typescript
describe('Rogue Sneak Attack', () => {
    test('applies only with correct conditions', async () => {
        const character = createTestCharacter({
            class: 'Rogue',
            level: 3
        });
        
        // Normal attack
        let damage = await calculateDamage(character.id, {
            attackType: ['melee'],
            weaponId: WEAPON_ID.SHORTSWORD
        });
        expect(damage.extraDice).toEqual([]);
        
        // Sneak attack
        damage = await calculateDamage(character.id, {
            attackType: ['melee', 'sneak_attack'],
            weaponId: WEAPON_ID.SHORTSWORD
        });
        expect(damage.extraDice).toContain({ count: 2, die: 6 }); // 2d6
    });
    
    test('scales correctly with level', async () => {
        const character = createTestCharacter({
            class: 'Rogue',
            level: 5
        });
        
        const damage = await calculateDamage(character.id, {
            attackType: ['melee', 'sneak_attack']
        });
        expect(damage.extraDice).toContain({ count: 3, die: 6 }); // 3d6
    });
});
```

### **Favored Enemy Testing**
```typescript
describe('Ranger Favored Enemy', () => {
    test('provides bonuses against chosen enemy', async () => {
        const character = createTestCharacter({
            class: 'Ranger',
            level: 1,
            choices: [{
                key: 'favored_enemy_1',
                value: 'dragon'
            }]
        });
        
        // Against non-favored enemy
        let modifiers = await calculateCharacterModifiers(character.id, {
            targetTags: ['humanoid']
        });
        expect(modifiers.attack.total).toBe(5); // Base attack
        
        // Against favored enemy
        modifiers = await calculateCharacterModifiers(character.id, {
            targetTags: ['dragon']
        });
        expect(modifiers.attack.total).toBe(7); // +2 favored enemy bonus
    });
});
```

## Bonus Stacking Tests

### **Bonus Type Stacking**
```typescript
describe('Bonus Stacking', () => {
    test('same type bonuses do not stack', async () => {
        const character = createTestCharacter({
            class: 'Fighter',
            level: 1,
            items: [
                { type: 'belt', bonusType: 'enhancement', value: 4 },
                { type: 'belt', bonusType: 'enhancement', value: 2 }
            ]
        });
        
        const modifiers = await calculateCharacterModifiers(character.id, {});
        expect(modifiers.attributes.STR).toBe(20); // Base 16 + 4 (highest only)
    });
    
    test('different type bonuses stack', async () => {
        const character = createTestCharacter({
            class: 'Barbarian',
            level: 1,
            items: [
                { type: 'belt', bonusType: 'enhancement', value: 4 }
            ]
        });
        
        const modifiers = await calculateCharacterModifiers(character.id, {
            activeTokens: ['rage_active']
        });
        expect(modifiers.attributes.STR).toBe(24); // Base 16 + 4 enhancement + 4 morale
    });
});
```

## Choice Validation Tests

### **Choice Dependencies**
```typescript
describe('Choice Dependencies', () => {
    test('modifiers apply only with correct choices', async () => {
        const character = createTestCharacter({
            class: 'Fighter',
            level: 4,
            choices: [{
                key: 'weapon_specialization',
                value: 'longsword'
            }]
        });
        
        // Using specialized weapon
        let modifiers = await calculateCharacterModifiers(character.id, {
            weaponId: WEAPON_ID.LONGSWORD
        });
        expect(modifiers.damage.bonus).toBe(2);
        
        // Using different weapon
        modifiers = await calculateCharacterModifiers(character.id, {
            weaponId: WEAPON_ID.SHORTSWORD
        });
        expect(modifiers.damage.bonus).toBe(0);
    });
});
```

## Error Handling Tests

### **Missing Data**
```typescript
describe('Error Handling', () => {
    test('handles missing choices gracefully', async () => {
        const character = createTestCharacter({
            class: 'Ranger',
            level: 1
            // No favored enemy choice
        });
        
        const modifiers = await calculateCharacterModifiers(character.id, {
            targetTags: ['dragon']
        });
        expect(modifiers.attack.total).toBe(5); // Base attack only
    });
    
    test('handles invalid conditions gracefully', async () => {
        const character = createTestCharacter({
            class: 'Barbarian',
            level: 1
        });
        
        const modifiers = await calculateCharacterModifiers(character.id, {
            activeTokens: ['invalid_token']
        });
        expect(modifiers.attributes.STR).toBe(16); // Base only
    });
});
```

## Performance Tests

### **Caching Validation**
```typescript
describe('Performance', () => {
    test('caches character progressions', async () => {
        const character = createTestCharacter({
            class: 'Barbarian',
            level: 1
        });
        
        // First call
        const start1 = Date.now();
        await calculateCharacterModifiers(character.id, {});
        const time1 = Date.now() - start1;
        
        // Second call (should be cached)
        const start2 = Date.now();
        await calculateCharacterModifiers(character.id, {});
        const time2 = Date.now() - start2;
        
        expect(time2).toBeLessThan(time1 * 0.5); // Should be significantly faster
    });
});
```

## Testing Checklist

Before considering a feature complete, verify:

- [ ] **Positive cases** work correctly
- [ ] **Negative cases** don't apply incorrectly
- [ ] **Edge cases** are handled gracefully
- [ ] **Bonus stacking** follows D&D rules
- [ ] **Choice dependencies** work correctly
- [ ] **Error conditions** are handled
- [ ] **Performance** is acceptable
- [ ] **Integration** with other features works

## Key Testing Principles

1. **Test the behavior, not the implementation**
2. **Use realistic test data**
3. **Test both success and failure paths**
4. **Validate D&D rules compliance**
5. **Test performance with realistic loads**
6. **Document test scenarios clearly**

For implementation details, see **[runtime-calculation.md](runtime-calculation.md)** and **[common-pitfalls.md](common-pitfalls.md)**.
