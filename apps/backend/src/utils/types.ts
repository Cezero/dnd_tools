import type { ProgressionType } from '@shared/static-data';

/**
 * Extracted race mechanics from feature features
 */
export interface RaceMechanics {
    sizeId: number | null;
    speed: number | null;
    favoredClassId: number | null;
    levelAdjustment: number | null;
}

/**
 * Extracted class mechanics from feature features
 * 
 * TODO We don't use ProgressionType any longer
 */
export interface ClassMechanics {
    hitDie: number | null;
    skillPoints: number | null;
    babProgression: ProgressionType | null;
    fortProgression: ProgressionType | null;
    refProgression: ProgressionType | null;
    willProgression: ProgressionType | null;
}
