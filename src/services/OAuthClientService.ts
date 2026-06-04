import { SimpleKey, StdAccountListOutput, StdAccountReadOutput } from '@sailpoint/connector-sdk'
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

    async readAccount(id: string): Promise<StdAccountReadOutput> {
        const account = await this.apiClient.getOAuthClient(id)
        return {
            ...account.toStdAccountReadOutput(),
            key: SimpleKey(id),
        }
    }
}
