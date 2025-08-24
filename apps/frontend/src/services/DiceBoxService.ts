import { z } from 'zod';

import type {
    DiceBoxConfig,
    DiceBoxAdminConfig,
    CreateDiceBoxAdminConfigRequest,
    UpdateDiceBoxAdminConfigRequest,
    GetAllDiceConfigsResponse,
    UpdateUserDiceConfigRequest
} from '@shared/schema';
import {
    DiceBoxAdminConfigSchema,
    CreateDiceBoxAdminConfigRequestSchema,
    UpdateDiceBoxAdminConfigRequestSchema,
    GetAllDiceConfigsResponseSchema,
    UpdateResponseSchema,
    DiceBoxConfigIdParamSchema,
    UpdateUserDiceConfigSchema
} from '@shared/schema';

import { typedApi } from './Api';

// API functions for user dice configuration
const getAvailableConfigsApi = typedApi({
    path: '/dicebox/configs/available',
    method: 'GET',
    responseSchema: GetAllDiceConfigsResponseSchema
});

const getUserDiceConfigApi = typedApi({
    path: '/dicebox/config/user',
    method: 'GET',
    responseSchema: UpdateUserDiceConfigSchema
});

const updateUserDiceConfigApi = typedApi<typeof UpdateUserDiceConfigSchema, typeof UpdateResponseSchema>({
    path: '/dicebox/config/user',
    method: 'PUT',
    requestSchema: UpdateUserDiceConfigSchema,
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

const createAdminConfigApi = typedApi<typeof CreateDiceBoxAdminConfigRequestSchema, typeof UpdateResponseSchema>({
    path: '/dicebox/admin/config',
    method: 'POST',
    requestSchema: CreateDiceBoxAdminConfigRequestSchema,
    responseSchema: UpdateResponseSchema
});

const updateAdminConfigApi = typedApi<typeof UpdateDiceBoxAdminConfigRequestSchema, typeof UpdateResponseSchema, typeof DiceBoxConfigIdParamSchema>({
    path: '/dicebox/admin/config/:id',
    method: 'PUT',
    requestSchema: UpdateDiceBoxAdminConfigRequestSchema,
    paramsSchema: DiceBoxConfigIdParamSchema,
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
    static async getUserDiceConfig(): Promise<UpdateUserDiceConfigRequest> {
        return getUserDiceConfigApi(undefined);
    }

    // Update user's dice configuration
    static async updateUserDiceConfig(userConfig: UpdateUserDiceConfigRequest): Promise<{ message: string }> {
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
        return createAdminConfigApi(data);
    }

    // Update an existing admin configuration (admin only)
    static async updateAdminConfig(data: UpdateDiceBoxAdminConfigRequest): Promise<{ message: string }> {
        // Extract the config ID from the config object for the URL parameter
        const configId = (data.config as any).id;
        if (!configId) {
            throw new Error('Config ID is required for update operations');
        }

        // Remove the ID from the config data since it's now in the URL
        const { id, ...configData } = data.config as any;
        const updateData = { config: configData };

        return updateAdminConfigApi(updateData, { id: configId });
    }

    // Delete a DiceBox admin configuration (admin only)
    static async deleteAdminConfig(configId: number): Promise<{ message: string }> {
        return deleteAdminConfigApi(undefined, { id: configId });
    }
} 
