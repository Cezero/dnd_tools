import { describe, it, expect } from 'vitest';

import { applyUpdateToState } from './GenericUpdateApplier';
import type { UpdateApplierConfig } from './GenericUpdateApplier';

/**
 * Tests for GenericUpdateApplier.
 * 
 * These tests verify that the generic update applier correctly applies
 * updates using strategy functions from the configuration.
 */

describe('GenericUpdateApplier', () => {
    interface TestState {
        name: string;
        value: number;
        items: string[];
    }

    type TestUpdate =
        | { type: 'SET_NAME'; payload: { name: string } }
        | { type: 'SET_VALUE'; payload: { value: number } }
        | { type: 'ADD_ITEM'; payload: { item: string } };

    const testConfig: UpdateApplierConfig<TestState, TestUpdate> = {
        applyFieldUpdate: (state, field, value) => ({ ...state, [field]: value }),
        isFieldUpdate: (update) => update.type === 'SET_NAME' || update.type === 'SET_VALUE',
        extractFieldUpdate: (update) => {
            if (update.type === 'SET_NAME') {
                return { field: 'name', value: update.payload.name };
            }
            if (update.type === 'SET_VALUE') {
                return { field: 'value', value: update.payload.value };
            }
            return null;
        },
        isProgressionUpdate: () => false,
        applyProgressionUpdate: (state) => state,
        isEntityUpdate: () => false,
        applyEntityUpdate: (state) => state,
        isSpecialUpdate: (update) => update.type === 'ADD_ITEM',
        applySpecialUpdate: (state, update) => {
            if (update.type === 'ADD_ITEM') {
                return {
                    ...state,
                    items: [...state.items, update.payload.item]
                };
            }
            return state;
        }
    };

    describe('applyUpdateToState', () => {
        it('should apply field updates', () => {
            const state: TestState = { name: 'Old', value: 10, items: [] };
            const update: TestUpdate = { type: 'SET_NAME', payload: { name: 'New' } };

            const result = applyUpdateToState(state, update, testConfig);

            expect(result.name).toBe('New');
            expect(result.value).toBe(10);
        });

        it('should apply special updates', () => {
            const state: TestState = { name: 'Test', value: 10, items: ['a'] };
            const update: TestUpdate = { type: 'ADD_ITEM', payload: { item: 'b' } };

            const result = applyUpdateToState(state, update, testConfig);

            expect(result.items).toEqual(['a', 'b']);
        });

        it('should return unchanged state for unknown update types', () => {
            const state: TestState = { name: 'Test', value: 10, items: [] };
            const update = { type: 'UNKNOWN', payload: {} } as unknown as TestUpdate;

            const result = applyUpdateToState(state, update, testConfig);

            expect(result).toEqual(state);
        });
    });
});
