import type {
    DiceBoxAdminConfig,
    CreateDiceBoxAdminConfigRequest,
    UpdateDiceBoxAdminConfigRequest,
    GetAllDiceConfigsResponse,
    DiceBoxConfig,
    UserDiceConfig
} from '@shared/schema';

export interface DiceBoxService {
    getAvailableConfigs(): Promise<GetAllDiceConfigsResponse>;
    getUserDiceConfig(userId: number): Promise<UserDiceConfig>;
    updateUserDiceConfig(userId: number, baseConfigId: number, overrides: Record<string, string>): Promise<void>;
    getAdminConfig(): Promise<DiceBoxAdminConfig | null>;
    createOrUpdateAdminConfig(data: CreateDiceBoxAdminConfigRequest | (UpdateDiceBoxAdminConfigRequest & { id?: number })): Promise<DiceBoxAdminConfig>;
    getFullConfig(): Promise<DiceBoxAdminConfig | null>;
    deleteAdminConfig(configId: number): Promise<void>;
} 
