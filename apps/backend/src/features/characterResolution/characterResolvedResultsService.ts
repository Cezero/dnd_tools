import type { ResolvedCharacterResult } from '@shared/schema';

import { getRedisClient } from '../shared/session/redisClient';
import type { RedisSessionClient } from '../shared/session/types';


/**
 * Service for managing resolved character results separately from character state.
 * 
 * Resolved results are stored in a separate Redis key to keep them independent
 * from the character state, which allows for different caching strategies and
 * update frequencies.
 * 
 * **Redis Key Pattern**: `state:character:${characterId}:resolved`
 * 
 * @see EntityStateService - For character state storage
 */
export class CharacterResolvedResultsService {
    private redis: RedisSessionClient;
    private readonly TTL_SECONDS = 30 * 60; // 30 minutes

    constructor() {
        this.redis = getRedisClient();
    }

    /**
     * Builds Redis key for resolved results.
     */
    private buildResolvedKey(characterId: number): string {
        return `state:character:${characterId}:resolved`;
    }

    /**
     * Retrieves resolved results from Redis.
     * 
     * @param characterId - The character ID
     * @returns The resolved results, or null if not found
     */
    async getResolvedResults(characterId: number): Promise<ResolvedCharacterResult | null> {
        const key = this.buildResolvedKey(characterId);
        
        try {
            const value = await this.redis.get(key);
            
            if (!value) {
                return null;
            }
            
            return JSON.parse(value) as ResolvedCharacterResult;
        } catch (error) {
            console.error(`Error getting resolved results for character ${characterId}:`, error);
            return null;
        }
    }

    /**
     * Stores resolved results in Redis.
     * 
     * @param characterId - The character ID
     * @param resolvedResults - The resolved results to store
     */
    async setResolvedResults(characterId: number, resolvedResults: ResolvedCharacterResult): Promise<void> {
        const key = this.buildResolvedKey(characterId);
        
        try {
            const serialized = JSON.stringify(resolvedResults);
            await this.redis.setEx(key, this.TTL_SECONDS, serialized);
        } catch (error) {
            console.error(`Error setting resolved results for character ${characterId}:`, error);
            throw new Error(`Failed to set resolved results: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Deletes resolved results from Redis.
     * 
     * @param characterId - The character ID
     */
    async deleteResolvedResults(characterId: number): Promise<void> {
        const key = this.buildResolvedKey(characterId);
        
        try {
            await this.redis.del(key);
        } catch (error) {
            console.error(`Error deleting resolved results for character ${characterId}:`, error);
            // Don't throw - deletion is best effort
        }
    }
}
