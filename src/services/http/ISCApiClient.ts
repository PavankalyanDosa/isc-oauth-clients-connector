import { ConnectorError } from '@sailpoint/connector-sdk'
import { Configuration, OAuthClientsApi } from 'sailpoint-api-client'
import { OAuthClientAccount } from '../../models/oauth-client-account'
import { ScopeEntitlement } from '../../models/scope-entitlement'
import { InvalidConfigurationError, NotFoundError } from '../../errors'

export class ISCApiClient {
    private oauthClientsApi: OAuthClientsApi

    constructor(config: Record<string, unknown>) {
        if (!config.clientId) {
            throw new InvalidConfigurationError('Missing required config: clientId')
        }
        if (!config.clientSecret) {
            throw new InvalidConfigurationError('Missing required config: clientSecret')
        }
        if (!config.baseUrl) {
            throw new InvalidConfigurationError('Missing required config: baseUrl')
        }

        const baseUrl = config.baseUrl as string
        const apiConfig = new Configuration({
            baseurl: baseUrl,
            clientId: config.clientId as string,
            clientSecret: config.clientSecret as string,
            tokenUrl: `${baseUrl}/oauth/token`,
        })

        this.oauthClientsApi = new OAuthClientsApi(apiConfig)
    }

    async testConnection(): Promise<void> {
        try {
            await this.oauthClientsApi.listOauthClients({})
        } catch (err) {
            throw new ConnectorError(`Test connection failed: ${(err as Error).message}`)
        }
    }

    async getOAuthClient(id: string): Promise<OAuthClientAccount> {
        try {
            const client = await this.oauthClientsApi.getOauthClient({ id })
            return OAuthClientAccount.fromApiResponse(client.data)
        } catch (err) {
            const message = (err as Error).message
            const status = (err as { response?: { status?: number } }).response?.status
            if (status === 404 || message.includes('404')) {
                throw new NotFoundError(`OAuth client not found: ${id}`)
            }
            throw new ConnectorError(`Failed to read OAuth client: ${message}`)
        }
    }

    async *listOAuthClients(): AsyncGenerator<OAuthClientAccount> {
        let clients
        try {
            clients = await this.oauthClientsApi.listOauthClients({})
        } catch (err) {
            throw new ConnectorError(`Failed to list OAuth clients: ${(err as Error).message}`)
        }
        if (!clients.data || clients.data.length === 0) {
            return
        }
        for (const client of clients.data) {
            yield OAuthClientAccount.fromApiResponse(client)
        }
    }

    async *listScopes(): AsyncGenerator<ScopeEntitlement> {
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
