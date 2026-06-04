import { SimpleKey, StdAccountListInput, StdAccountListOutput, StdAccountReadOutput } from '@sailpoint/connector-sdk'
import { ISCApiClient } from './http/ISCApiClient'

export class OAuthClientService {
    constructor(private readonly apiClient: ISCApiClient) {}

    async testConnection(): Promise<void> {
        await this.apiClient.testConnection()
    }

    async *listAccounts(input?: StdAccountListInput): AsyncGenerator<StdAccountListOutput> {
        const modifiedSince = input?.stateful ? input.state?.modifiedSince : undefined

        for await (const account of this.apiClient.listOAuthClients()) {
            const output = account.toStdAccountListOutput()

            if (!modifiedSince || this.isModifiedAfter(output, modifiedSince)) {
                yield output
            }
        }
    }

    async readAccount(id: string): Promise<StdAccountReadOutput> {
        const account = await this.apiClient.getOAuthClient(id)
        return {
            ...account.toStdAccountReadOutput(),
            key: SimpleKey(id),
        }
    }

    private isModifiedAfter(account: StdAccountListOutput, modifiedSince: string): boolean {
        const modified = String(account.attributes?.modified ?? '')

        if (!modified) {
            return false
        }

        return modified > modifiedSince
    }
}
