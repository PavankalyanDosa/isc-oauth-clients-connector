import { OAuthClientService } from './OAuthClientService'
import { ScopeService } from './ScopeService'
import { ISCApiClient } from './http/ISCApiClient'

export class ServiceFactory {
    static create(config: Record<string, unknown>) {
        const apiClient = new ISCApiClient(config)
        const oauthClients = new OAuthClientService(apiClient)

        return {
            oauthClients,
            scopes: new ScopeService(oauthClients),
        }
    }
}
