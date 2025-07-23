import type {
    DiceBoxAdminConfig,
    CreateDiceBoxAdminConfigRequest,
    UpdateDiceBoxAdminConfigRequest,
    GetAllDiceConfigsResponse,
    DiceBoxConfig
} from '@shared/schema';

export interface DiceBoxService {
    getAvailableConfigs(): Promise<GetAllDiceConfigsResponse>;
    getUserDiceConfig(userId: number): Promise<DiceBoxAdminConfig>;
    updateUserDiceConfig(userId: number, userConfig: DiceBoxAdminConfig): Promise<void>;
    getAdminConfig(): Promise<DiceBoxAdminConfig | null>;
    createOrUpdateAdminConfig(data: CreateDiceBoxAdminConfigRequest): Promise<DiceBoxAdminConfig>;
    getFullConfig(): Promise<DiceBoxConfig | null>;
    deleteAdminConfig(configId: number): Promise<void>;
} 
