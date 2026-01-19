import { Response, NextFunction } from 'express';

import type { ValidatedParamsT, ValidatedParamsBodyT } from '@/util/validated-types';
import type { Race, RaceSummary } from '@shared/schema';

import {
    initializeSession,
    getSessionState,
    applyUpdate,
    saveSession,
    cancelSession,
    type SessionControllerConfig
} from '../shared/session/GenericSessionController';
import { RaceSaveService } from './raceSaveService';
import { RaceSessionService } from './raceSessionService';
import { raceUpdateApplierConfig } from './raceUpdateApplierConfig';
import type { RaceEditState, RaceUpdate } from './types';
import { raceService } from '../race/raceService';

/**
 * Configuration for race session controller.
 * 
 * Provides all dependencies and strategies needed for the generic controller
 * to handle race session operations.
 */
const raceSessionService = new RaceSessionService();
const raceSessionControllerConfig: SessionControllerConfig<number, RaceEditState, RaceUpdate, Race> = {
    entityService: {
        getById: async (id: number) => {
            return raceService.getRaceById({ id });
        }
    },
    sessionService: raceSessionService.getGenericService(),
    buildInitialState: (race: Race, raceId: number): RaceEditState => {
        return {
            raceId,
            name: race.name,
            editionId: race.editionId,
            isVisible: race.isVisible,
            description: race.description ?? null,
            sourceBookInfo: race.sourceBookInfo || null,
            featureProgressions: race.features || []
        };
    },
    updateApplierConfig: raceUpdateApplierConfig,
    saveService: {
        saveSessionToMySQL: async (raceId: number, state: RaceEditState) => {
            const saveService = new RaceSaveService();
            await saveService.saveSessionToMySQL(raceId, state);
        }
    },
    getEntityIdFromParams: (params: { [key: string]: string | number }) => {
        const raceId = typeof params.raceId === 'string' ? parseInt(params.raceId, 10) : params.raceId;
        return isNaN(raceId as number) ? null : (raceId as number);
    },
    getSessionIdFromParams: (params: { [key: string]: string | number }) => {
        return typeof params.sessionId === 'string' ? params.sessionId : null;
    }
};

/**
 * Initialize a new race editing session.
 * 
 * **Implementation Note**: This function delegates to the generic `initializeSession`
 * function with Race-specific configuration. All session initialization logic
 * is handled by the generic controller.
 * 
 * @see GenericSessionController.initializeSession - Generic implementation
 */
export async function InitializeRaceSession(
    req: ValidatedParamsT<{ raceId: string }, { sessionId: string; raceState: RaceEditState }>,
    res: Response,
    next: NextFunction
): Promise<void> {
    // Wrap the generic controller to transform response format
    const wrappedReq = req as unknown as ValidatedParamsT<{ [key: string]: string }, { sessionId: string; state: RaceEditState }>;
    const originalJson = res.json.bind(res);

    res.json = function (body: unknown) {
        if (body && typeof body === 'object' && 'sessionId' in body && 'state' in body) {
            const genericResponse = body as { sessionId: string; state: RaceEditState };
            return originalJson({
                sessionId: genericResponse.sessionId,
                raceState: genericResponse.state
            });
        }
        return originalJson(body);
    };

    await initializeSession(wrappedReq, res, next, raceSessionControllerConfig as unknown as SessionControllerConfig<number, RaceEditState, unknown, Race>);
}

/**
 * Get current session state.
 * 
 * **Implementation Note**: This function delegates to the generic `getSessionState`
 * function with Race-specific configuration.
 * 
 * @see GenericSessionController.getSessionState - Generic implementation
 */
export async function GetRaceSessionState(
    req: ValidatedParamsT<{ raceId: string; sessionId: string }, { raceState: RaceEditState }>,
    res: Response,
    next: NextFunction
): Promise<void> {
    // Wrap the generic controller to transform response format
    const wrappedReq = req as unknown as ValidatedParamsT<{ [key: string]: string }, { state: RaceEditState }>;
    const originalJson = res.json.bind(res);

    res.json = function (body: unknown) {
        if (body && typeof body === 'object' && 'state' in body) {
            const genericResponse = body as { state: RaceEditState };
            return originalJson({
                raceState: genericResponse.state
            });
        }
        return originalJson(body);
    };

    await getSessionState(wrappedReq, res, next, raceSessionControllerConfig as unknown as SessionControllerConfig<number, RaceEditState, unknown, unknown>);
}

/**
 * Apply an update to the race session.
 * 
 * **Implementation Note**: This function delegates to the generic `applyUpdate`
 * function with Race-specific configuration.
 * 
 * @see GenericSessionController.applyUpdate - Generic implementation
 */
export async function ApplyRaceUpdate(
    req: ValidatedParamsBodyT<{ raceId: string; sessionId: string }, { update: RaceUpdate }>,
    res: Response,
    next: NextFunction
): Promise<void> {
    // Wrap the generic controller to transform response format
    const wrappedReq = req as unknown as ValidatedParamsBodyT<{ [key: string]: string }, { update: RaceUpdate }>;
    const originalJson = res.json.bind(res);

    res.json = function (body: unknown) {
        if (body && typeof body === 'object' && 'state' in body) {
            const genericResponse = body as { state: RaceEditState };
            return originalJson({
                raceState: genericResponse.state
            });
        }
        return originalJson(body);
    };

    await applyUpdate(wrappedReq, res, next, raceSessionControllerConfig as unknown as SessionControllerConfig<number, RaceEditState, RaceUpdate, unknown>);
}

/**
 * Save session to MySQL.
 * 
 * **Implementation Note**: This function delegates to the generic `saveSession`
 * function with Race-specific configuration.
 * 
 * @see GenericSessionController.saveSession - Generic implementation
 */
export async function SaveRaceSession(
    req: ValidatedParamsT<{ raceId: string; sessionId: string }, { race: RaceSummary }>,
    res: Response,
    next: NextFunction
): Promise<void> {
    // Capture entityId before wrapping request
    const entityId = raceSessionControllerConfig.getEntityIdFromParams(req.params);
    if (!entityId) {
        res.status(400).json({ error: 'Invalid entity ID' });
        return;
    }

    // Wrap the generic controller to transform response format
    const wrappedReq = req as unknown as ValidatedParamsT<{ [key: string]: string }, { entity: Race }>;
    const originalJson = res.json.bind(res);

    res.json = function (body: unknown) {
        if (body && typeof body === 'object' && 'entity' in body) {
            const genericResponse = body as { entity: Race };
            // Transform to RaceSummary format (includes id field)
            const raceSummary: RaceSummary = {
                id: entityId,
                name: genericResponse.entity.name,
                editionId: genericResponse.entity.editionId,
                isVisible: genericResponse.entity.isVisible,
                description: genericResponse.entity.description,
                sourceBookInfo: genericResponse.entity.sourceBookInfo
            };
            return originalJson({
                race: raceSummary
            });
        }
        return originalJson(body);
    };

    await saveSession(wrappedReq, res, next, raceSessionControllerConfig as unknown as SessionControllerConfig<number, RaceEditState, unknown, Race>);
}

/**
 * Cancel session (delete without saving).
 * 
 * **Implementation Note**: This function delegates to the generic `cancelSession`
 * function with Race-specific configuration.
 * 
 * @see GenericSessionController.cancelSession - Generic implementation
 */
export async function CancelRaceSession(
    req: ValidatedParamsT<{ raceId: string; sessionId: string }, { message: string }>,
    res: Response,
    next: NextFunction
): Promise<void> {
    const wrappedReq = req as unknown as ValidatedParamsT<{ [key: string]: string }, { message: string }>;
    await cancelSession(wrappedReq, res, next, raceSessionControllerConfig as unknown as SessionControllerConfig<number, RaceEditState, unknown, unknown>);
}
