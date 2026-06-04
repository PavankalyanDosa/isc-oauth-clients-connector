import { SimpleKey, StdAccountListOutput, StdAccountReadOutput } from '@sailpoint/connector-sdk'

export class OAuthClientAccount {
    id!: string
    name!: string
    description!: string
    enabled!: boolean
    type!: string
    grantTypes!: string[]
    scopes!: string[]
    accessType!: string
    created!: string
    modified!: string
    lastUsed!: string
    consentRequired!: boolean
    claimsSupported!: boolean
    strongAuthSupported!: boolean
    accessTokenValiditySeconds!: number
    refreshTokenValiditySeconds!: number
    internal!: boolean
    metadata!: string
    integrationId!: string
    businessName!: string
    homepageUrl!: string
    redirectUris!: string[]

    static fromApiResponse(raw: {
        id: string
        name: string
        description?: string | null
        enabled?: boolean | null
        type?: string | null
        grantTypes?: string[] | null
        scope?: string[] | null
        accessType?: string | null
        created?: string | null
        modified?: string | null
        lastUsed?: string | null
        consentRequired?: boolean | null
        claimsSupported?: boolean | null
        strongAuthSupported?: boolean | null
        accessTokenValiditySeconds?: number | null
        refreshTokenValiditySeconds?: number | null
        internal?: boolean | null
        metadata?: unknown
        integrationId?: string | null
        businessName?: string | null
        homepageUrl?: string | null
        redirectUris?: string[] | null
    }): OAuthClientAccount {
        const account = new OAuthClientAccount()
        account.id = raw.id
        account.name = raw.name ?? raw.id    // fallback to id if name is absent
        account.description = raw.description ?? ''
        account.enabled = raw.enabled ?? false
        account.type = raw.type ?? ''
        account.grantTypes = raw.grantTypes ?? []
        account.scopes = raw.scope ?? []     // API field is "scope" (singular)
        account.accessType = raw.accessType ?? ''
        account.created = raw.created ?? ''
        account.modified = raw.modified ?? ''
        account.lastUsed = raw.lastUsed ?? ''
        account.consentRequired = raw.consentRequired ?? false
        account.claimsSupported = raw.claimsSupported ?? false
        account.strongAuthSupported = raw.strongAuthSupported ?? false
        account.accessTokenValiditySeconds = raw.accessTokenValiditySeconds ?? 0
        account.refreshTokenValiditySeconds = raw.refreshTokenValiditySeconds ?? 0
        account.internal = raw.internal ?? false
        account.metadata = raw.metadata == null ? '' : JSON.stringify(raw.metadata)
        account.integrationId = raw.integrationId ?? ''
        account.businessName = raw.businessName ?? ''
        account.homepageUrl = raw.homepageUrl ?? ''
        account.redirectUris = raw.redirectUris ?? []
        return account
    }

    toStdAccountListOutput(): StdAccountListOutput {
        return {
            key: SimpleKey(this.id),
            disabled: !this.enabled,
            locked: false,
            attributes: {
                id: this.id,
                name: this.name,
                description: this.description,
                enabled: this.enabled,
                type: this.type,
                grantTypes: this.grantTypes,
                scopes: this.scopes,          // schema attribute name is "scopes" (plural)
                accessType: this.accessType,
                created: this.created,
                modified: this.modified,
                lastUsed: this.lastUsed,
                consentRequired: this.consentRequired,
                claimsSupported: this.claimsSupported,
                strongAuthSupported: this.strongAuthSupported,
                accessTokenValiditySeconds: this.accessTokenValiditySeconds,
                refreshTokenValiditySeconds: this.refreshTokenValiditySeconds,
                internal: this.internal,
                metadata: this.metadata,
                integrationId: this.integrationId,
                businessName: this.businessName,
                homepageUrl: this.homepageUrl,
                redirectUris: this.redirectUris,
            }
        }
    }

    toStdAccountReadOutput(): StdAccountReadOutput {
        return this.toStdAccountListOutput()
    }
}
