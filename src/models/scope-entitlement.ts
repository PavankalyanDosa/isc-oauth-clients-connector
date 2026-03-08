import { StdEntitlementListOutput } from '@sailpoint/connector-sdk'

export class ScopeEntitlement {
    id!: string
    name!: string

    static from(scopeString: string): ScopeEntitlement {
        const entitlement = new ScopeEntitlement()
        entitlement.id = scopeString
        entitlement.name = scopeString    // scope string IS the display name — no enrichment catalog available
        return entitlement
    }

    toStdEntitlementListOutput(): StdEntitlementListOutput {
        return {
            type: 'group',
            identity: this.id,
            uuid: this.id,
            attributes: {
                id: this.id,
                name: this.name,
            }
        }
    }
}
