import { StdAccountListOutput } from '@sailpoint/connector-sdk'
import { ISCApiClient } from './http/ISCApiClient'

export class OAuthClientService {
    constructor(private readonly apiClient: ISCApiClient) {}

    async testConnection(): Promise<void> {
        await this.apiClient.testConnection()
    }

    async *listAccounts(): AsyncGenerator<StdAccountListOutput> {
        for await (const account of this.apiClient.listOAuthClients()) {
            yield account.toStdAccountListOutput()
        }
    }
}
