import { Response, NextFunction } from 'express';

import type { ValidatedParamsT, ValidatedParamsBodyT } from '@/util/validated-types';
import type { DnDClass, ClassSummary, ClassWithId } from '@shared/schema';

import {
    initializeSession,
    getSessionState,
    applyUpdate,
    saveSession,
    cancelSession,
    type SessionControllerConfig
} from '../shared/session/GenericSessionController';
import { ClassSaveService } from './classSaveService';
import { ClassSessionService } from './classSessionService';
import { classUpdateApplierConfig } from './classUpdateApplierConfig';
import type { ClassEditState, ClassUpdate } from './types';
import { classService } from '../class/classService';

/**
 * Configuration for class session controller.
 * 
 * Provides all dependencies and strategies needed for the generic controller
 * to handle class session operations.
 */
const classSessionService = new ClassSessionService();
const classSessionControllerConfig: SessionControllerConfig<number, ClassEditState, ClassUpdate, DnDClass> = {
    entityService: {
        getById: async (id: number) => {
            return classService.getClassById({ id });
        }
    },
    sessionService: classSessionService.getGenericService(),
    buildInitialState: (cls: DnDClass, classId: number): ClassEditState => {
        return {
            classId,
            name: cls.name,
            abbreviation: cls.abbreviation,
            editionId: cls.editionId,
            isPrestige: cls.isPrestige,
            isVisible: cls.isVisible,
            canCastSpells: cls.canCastSpells,
            spellsKnown: cls.spellsKnown,
            isDivine: cls.isDivine,
            description: cls.description ?? null,
            featureProgressions: cls.features || [],
            spellcastingProgression: cls.spellcastingProgression || [],
            spellsKnownProgression: cls.spellsKnownProgression || []
        };
    },
    updateApplierConfig: classUpdateApplierConfig,
    saveService: {
        saveSessionToMySQL: async (classId: number, state: ClassEditState) => {
            const saveService = new ClassSaveService();
            await saveService.saveSessionToMySQL(classId, state);
        }
    },
    getEntityIdFromParams: (params: { [key: string]: string | number }) => {
        const classId = typeof params.classId === 'string' ? parseInt(params.classId, 10) : params.classId;
        return isNaN(classId as number) ? null : (classId as number);
    },
    getSessionIdFromParams: (params: { [key: string]: string | number }) => {
        return typeof params.sessionId === 'string' ? params.sessionId : null;
    }
};

/**
 * Initialize a new class editing session.
 * 
 * **Implementation Note**: This function delegates to the generic `initializeSession`
 * function with Class-specific configuration. All session initialization logic
 * is handled by the generic controller.
 * 
 * @see GenericSessionController.initializeSession - Generic implementation
 */
export async function InitializeClassSession(
    req: ValidatedParamsT<{ classId: string }, { sessionId: string; classState: ClassEditState }>,
    res: Response,
    next: NextFunction
): Promise<void> {
    // Wrap the generic controller to transform response format
    const wrappedReq = req as unknown as ValidatedParamsT<{ [key: string]: string }, { sessionId: string; state: ClassEditState }>;
    const originalJson = res.json.bind(res);

    res.json = function (body: unknown) {
        if (body && typeof body === 'object' && 'sessionId' in body && 'state' in body) {
            const genericResponse = body as { sessionId: string; state: ClassEditState };
            return originalJson({
                sessionId: genericResponse.sessionId,
                classState: genericResponse.state
            });
        }
        return originalJson(body);
    };

    await initializeSession(wrappedReq, res, next, classSessionControllerConfig as unknown as SessionControllerConfig<number, ClassEditState, unknown, DnDClass>);
}

/**
 * Get current session state.
 * 
 * **Implementation Note**: This function delegates to the generic `getSessionState`
 * function with Class-specific configuration.
 * 
 * @see GenericSessionController.getSessionState - Generic implementation
 */
export async function GetClassSessionState(
    req: ValidatedParamsT<{ classId: string; sessionId: string }, { classState: ClassEditState }>,
    res: Response,
    next: NextFunction
): Promise<void> {
    // Wrap the generic controller to transform response format
    const wrappedReq = req as unknown as ValidatedParamsT<{ [key: string]: string }, { state: ClassEditState }>;
    const originalJson = res.json.bind(res);

    res.json = function (body: unknown) {
        if (body && typeof body === 'object' && 'state' in body) {
            const genericResponse = body as { state: ClassEditState };
            return originalJson({
                classState: genericResponse.state
            });
        }
        return originalJson(body);
    };

    await getSessionState(wrappedReq, res, next, classSessionControllerConfig as unknown as SessionControllerConfig<number, ClassEditState, unknown, unknown>);
}

/**
 * Apply an update to the class session.
 * 
 * **Implementation Note**: This function delegates to the generic `applyUpdate`
 * function with Class-specific configuration.
 * 
 * @see GenericSessionController.applyUpdate - Generic implementation
 */
export async function ApplyClassUpdate(
    req: ValidatedParamsBodyT<{ classId: string; sessionId: string }, { update: ClassUpdate }>,
    res: Response,
    next: NextFunction
): Promise<void> {
    // Wrap the generic controller to transform response format
    const wrappedReq = req as unknown as ValidatedParamsBodyT<{ [key: string]: string }, { update: ClassUpdate }>;
    const originalJson = res.json.bind(res);

    res.json = function (body: unknown) {
        if (body && typeof body === 'object' && 'state' in body) {
            const genericResponse = body as { state: ClassEditState };
            return originalJson({
                classState: genericResponse.state
            });
        }
        return originalJson(body);
    };

    await applyUpdate(wrappedReq, res, next, classSessionControllerConfig as unknown as SessionControllerConfig<number, ClassEditState, ClassUpdate, unknown>);
}

/**
 * Save session to MySQL.
 * 
 * **Implementation Note**: This function delegates to the generic `saveSession`
 * function with Class-specific configuration.
 * 
 * @see GenericSessionController.saveSession - Generic implementation
 */
export async function SaveClassSession(
    req: ValidatedParamsT<{ classId: string; sessionId: string }, { class: ClassSummary }>,
    res: Response,
    next: NextFunction
): Promise<void> {
    // Capture entityId before wrapping request
    const entityId = classSessionControllerConfig.getEntityIdFromParams(req.params);
    if (!entityId) {
        res.status(400).json({ error: 'Invalid entity ID' });
        return;
    }

    // Wrap the generic controller to transform response format
    const wrappedReq = req as unknown as ValidatedParamsT<{ [key: string]: string }, { entity: DnDClass }>;
    const originalJson = res.json.bind(res);

    res.json = function (body: unknown) {
        if (body && typeof body === 'object' && 'entity' in body) {
            const genericResponse = body as { entity: DnDClass };
            // Transform to ClassSummary format (includes id field)
            const classSummary: ClassSummary = {
                id: entityId,
                name: genericResponse.entity.name,
                abbreviation: genericResponse.entity.abbreviation,
                editionId: genericResponse.entity.editionId,
                isPrestige: genericResponse.entity.isPrestige,
                isVisible: genericResponse.entity.isVisible,
                canCastSpells: genericResponse.entity.canCastSpells,
                spellsKnown: genericResponse.entity.spellsKnown,
                isDivine: genericResponse.entity.isDivine,
                description: genericResponse.entity.description,
                sourceBookInfo: genericResponse.entity.sourceBookInfo
            };
            return originalJson({
                class: classSummary
            });
        }
        return originalJson(body);
    };

    await saveSession(wrappedReq, res, next, classSessionControllerConfig as unknown as SessionControllerConfig<number, ClassEditState, unknown, DnDClass>);
}

/**
 * Cancel session (delete without saving).
 * 
 * **Implementation Note**: This function delegates to the generic `cancelSession`
 * function with Class-specific configuration.
 * 
 * @see GenericSessionController.cancelSession - Generic implementation
 */
export async function CancelClassSession(
    req: ValidatedParamsT<{ classId: string; sessionId: string }, { message: string }>,
    res: Response,
    next: NextFunction
): Promise<void> {
    const wrappedReq = req as unknown as ValidatedParamsT<{ [key: string]: string }, { message: string }>;
    await cancelSession(wrappedReq, res, next, classSessionControllerConfig as unknown as SessionControllerConfig<number, ClassEditState, unknown, unknown>);
}
