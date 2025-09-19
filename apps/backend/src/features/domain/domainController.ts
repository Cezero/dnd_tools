import { Response } from 'express';

import { ValidatedParamsT, ValidatedParamsBodyT, ValidatedBodyT, ValidatedNoInput } from '@/util/validated-types';
import {
    DomainIdParamRequest,
    CreateDomainRequest,
    UpdateDomainRequest,
    GetAllDomainsResponse,
    Domain,
} from '@shared/schema';

import { domainService } from './domainService.js';

/**
 * Fetches all domains from the database.
 */
export async function GetAllDomains(req: ValidatedNoInput<GetAllDomainsResponse>, res: Response) {
    const domains = await domainService.getAllDomains();
    res.json(domains);
}

/**
 * Fetches a single domain by its ID.
 */
export async function GetDomainById(req: ValidatedParamsT<DomainIdParamRequest, Domain>, res: Response) {
    const domain = await domainService.getDomainById(req.params);

    if (!domain) {
        res.status(404).json({ error: 'Domain not found' });
        return;
    }

    res.json(domain);
}

/**
 * Creates a new domain.
 */
export async function CreateDomain(req: ValidatedBodyT<CreateDomainRequest, Domain>, res: Response) {
    const domain = await domainService.createDomain(req.body);
    res.status(201).json(domain);
}

/**
 * Updates an existing domain.
 */
export async function UpdateDomain(req: ValidatedParamsBodyT<DomainIdParamRequest, UpdateDomainRequest, Domain>, res: Response) {
    const domain = await domainService.updateDomain(req.body, req.params);
    res.json(domain);
}

/**
 * Deletes a domain.
 */
export async function DeleteDomain(req: ValidatedParamsT<DomainIdParamRequest, void>, res: Response) {
    await domainService.deleteDomain(req.params);
    res.status(204).send();
}

