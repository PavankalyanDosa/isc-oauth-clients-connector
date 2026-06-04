import { StdAccountListOutput, StdEntitlementListOutput } from '@sailpoint/connector-sdk'
import { ScopeEntitlement } from '../models/scope-entitlement'
import { OAuthClientService } from './OAuthClientService'

export class ScopeService {
    constructor(private readonly oauthClients: OAuthClientService) {}

    async *listEntitlements(): AsyncGenerator<StdEntitlementListOutput> {
        const seen = new Set<string>()

        for await (const account of this.oauthClients.listAccounts()) {
            for (const scope of this.getScopes(account)) {
                if (seen.has(scope)) {
                    continue
                }

                seen.add(scope)
                yield ScopeEntitlement.from(scope).toStdEntitlementListOutput()
            }
        }
    }

    private getScopes(account: StdAccountListOutput): string[] {
        // Task 1 derives entitlements from serialized account outputs, so keep the
        // attribute dependency isolated and validated in one place.
        const rawScopes: unknown = account.attributes?.scopes
        if (!Array.isArray(rawScopes)) {
            return []
        }

        return rawScopes.filter((scope): scope is string => typeof scope === 'string')
    }
}
