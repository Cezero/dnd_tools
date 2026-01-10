import type { GetMonsterResponse } from '@shared/schema';

export interface MonsterDisplayContentProps {
    monster: GetMonsterResponse | null | undefined;
    showHeader?: boolean;
}
