import { Configuration, OAuthClientsApi } from 'sailpoint-api-client'
import { ConnectorError } from '@sailpoint/connector-sdk'
import { OAuthClientAccount } from './models/oauth-client-account'
import { ScopeEntitlement } from './models/scope-entitlement'

export class ISCApiClient {
    private oauthClientsApi: OAuthClientsApi

    constructor(config: Record<string, unknown>) {
        // Validate required config fields — fail fast at construction time
        if (!config.clientId) {
            throw new ConnectorError('Missing required config: clientId')
        }
        if (!config.clientSecret) {
            throw new ConnectorError('Missing required config: clientSecret')
        }
        if (!config.baseUrl) {
            throw new ConnectorError('Missing required config: baseUrl')
        }

        // Wire readConfig() values into sailpoint-api-client Configuration
        // Use clientId + clientSecret (not a token) so SDK handles token refresh automatically
        // tokenUrl must be explicit — SDK does not infer it from baseurl in all versions
        const apiConfig = new Configuration({
            baseurl: config.baseUrl as string,
            clientId: config.clientId as string,
            clientSecret: config.clientSecret as string,
            tokenUrl: `${config.baseUrl}/oauth/token`,
        })

        this.oauthClientsApi = new OAuthClientsApi(apiConfig)
    }

    async testConnection(): Promise<void> {
        // Perform a lightweight API call to verify auth and connectivity
        // limit:1 fetches minimal data; count:true verifies query execution
        // Any error here — 401, 403, network failure — must propagate as ConnectorError
        try {
            await this.oauthClientsApi.listOauthClients({})
        } catch (err) {
            throw new ConnectorError(`Test connection failed: ${(err as Error).message}`)
        }
    }

    async *listOAuthClients(): AsyncGenerator<OAuthClientAccount> {
        // The v3 SDK's OAuthClientsApiListOauthClientsRequest only accepts `filters`
        // (no limit/offset parameters). The API returns all clients in a single call.
        // Streaming is preserved via the async generator — callers still get one item at a time.
        let clients
        try {
            clients = await this.oauthClientsApi.listOauthClients({})
        } catch (err) {
            throw new ConnectorError(`Failed to list OAuth clients: ${(err as Error).message}`)
        }
        if (!clients.data || clients.data.length === 0) return
        for (const client of clients.data) {
            yield OAuthClientAccount.fromApiResponse(client)
        }
    }

    async *listScopes(): AsyncGenerator<ScopeEntitlement> {
        // Derive unique scopes from all OAuth clients — no hardcoded list
        // This ensures the entitlement catalog reflects what is actually in use
        // and automatically includes new ISC scopes as they are granted to clients
        const seen = new Set<string>()
        for await (const account of this.listOAuthClients()) {
            for (const scope of account.scopes) {
                if (!seen.has(scope)) {
                    seen.add(scope)
                    yield ScopeEntitlement.from(scope)
                }
            }
        }
    }
}
