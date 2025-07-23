import type {
    DiceBoxConfig,
    DiceBoxAdminConfig,
    CreateDiceBoxAdminConfigRequest,
    UpdateDiceBoxAdminConfigRequest,
    GetAllDiceConfigsResponse
} from '@shared/schema';

import {
    DiceBoxAdminConfigSchema,
    CreateDiceBoxAdminConfigRequestSchema,
    UpdateDiceBoxAdminConfigRequestSchema,
    GetAllDiceConfigsResponseSchema,
    UpdateResponseSchema,
    DiceBoxConfigIdParamSchema
} from '@shared/schema';

import { typedApi } from './Api';
import { z } from 'zod';

// API functions for user dice configuration
const getAvailableConfigsApi = typedApi({
    path: '/dicebox/configs/available',
    method: 'GET',
    responseSchema: GetAllDiceConfigsResponseSchema
});

const getUserDiceConfigApi = typedApi({
    path: '/dicebox/config/user',
    method: 'GET',
    responseSchema: DiceBoxAdminConfigSchema
});

const updateUserDiceConfigApi = typedApi<typeof DiceBoxAdminConfigSchema, typeof UpdateResponseSchema>({
    path: '/dicebox/config/user',
    method: 'PUT',
    requestSchema: DiceBoxAdminConfigSchema,
    responseSchema: UpdateResponseSchema
});

// Existing API functions
const getFullConfigApi = typedApi({
    path: '/dicebox/config',
    method: 'GET',
    responseSchema: DiceBoxAdminConfigSchema.nullable()
});

const getAdminConfigApi = typedApi({
    path: '/dicebox/admin/config',
    method: 'GET',
    responseSchema: DiceBoxAdminConfigSchema.nullable()
});

const createOrUpdateAdminConfigApi = typedApi<typeof CreateDiceBoxAdminConfigRequestSchema, typeof UpdateResponseSchema>({
    path: '/dicebox/admin/config',
    method: 'POST',
    requestSchema: CreateDiceBoxAdminConfigRequestSchema,
    responseSchema: UpdateResponseSchema
});

const updateAdminConfigApi = typedApi<typeof UpdateDiceBoxAdminConfigRequestSchema, typeof UpdateResponseSchema>({
    path: '/dicebox/admin/config',
    method: 'PUT',
    requestSchema: UpdateDiceBoxAdminConfigRequestSchema,
    responseSchema: UpdateResponseSchema
});

const deleteAdminConfigApi = typedApi<undefined, typeof UpdateResponseSchema, typeof DiceBoxConfigIdParamSchema>({
    path: '/dicebox/admin/config/:id',
    method: 'DELETE',
    paramsSchema: DiceBoxConfigIdParamSchema,
    responseSchema: UpdateResponseSchema
});

export class DiceBoxService {
    // Get available admin dice configurations for user selection
    static async getAvailableConfigs(): Promise<GetAllDiceConfigsResponse> {
        return getAvailableConfigsApi(undefined);
    }

    // Get user's dice configuration
    static async getUserDiceConfig(): Promise<DiceBoxAdminConfig> {
        return getUserDiceConfigApi(undefined);
    }

    // Update user's dice configuration
    static async updateUserDiceConfig(userConfig: DiceBoxAdminConfig): Promise<{ message: string }> {
        return updateUserDiceConfigApi(userConfig);
    }

    // Get the full DiceBox configuration for frontend use
    static async getFullConfig(): Promise<DiceBoxAdminConfig | null> {
        try {
            return await getFullConfigApi(undefined);
        } catch (error) {
            if (error instanceof Error && error.message.includes('404')) {
                return null;
            }
            throw error;
        }
    }

    // Get the current DiceBox admin configuration (admin only)
    static async getAdminConfig(): Promise<DiceBoxAdminConfig | null> {
        try {
            return await getAdminConfigApi(undefined);
        } catch (error) {
            if (error instanceof Error && error.message.includes('404')) {
                return null;
            }
            throw error;
        }
    }

    // Create a new admin configuration (admin only)
    static async createAdminConfig(data: CreateDiceBoxAdminConfigRequest): Promise<{ message: string }> {
        return createOrUpdateAdminConfigApi(data);
    }

    // Update an existing admin configuration (admin only)
    static async updateAdminConfig(data: UpdateDiceBoxAdminConfigRequest): Promise<{ message: string }> {
        return updateAdminConfigApi(data);
    }

    // Delete a DiceBox admin configuration (admin only)
    static async deleteAdminConfig(configId: number): Promise<{ message: string }> {
        return deleteAdminConfigApi(undefined, { id: configId });
    }
} 
