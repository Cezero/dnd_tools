import {
    Domain,
    GetAllDomainsResponse,
    CreateDomainRequest,
    UpdateDomainRequest,
    DomainIdParamRequest,
    CreateResponse,
    UpdateResponse,
} from '@shared/schema';

export interface DomainService {
    // CRUD operations
    getAllDomains(): Promise<GetAllDomainsResponse>;
    getDomainById(query: DomainIdParamRequest): Promise<Domain | null>;
    createDomain(data: CreateDomainRequest): Promise<CreateResponse>;
    updateDomain(data: UpdateDomainRequest, query: DomainIdParamRequest): Promise<UpdateResponse>;
    deleteDomain(query: DomainIdParamRequest): Promise<UpdateResponse>;
}
