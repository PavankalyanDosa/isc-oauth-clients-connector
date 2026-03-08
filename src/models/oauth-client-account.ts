import { SimpleKey, StdAccountListOutput } from '@sailpoint/connector-sdk'

export class OAuthClientAccount {
    id!: string
    name!: string
    description!: string
    grantTypes!: string[]
    scopes!: string[]

    static fromApiResponse(raw: {
        id: string
        name: string
        description?: string | null
        grantTypes?: string[] | null
        scope?: string[] | null
    }): OAuthClientAccount {
        const account = new OAuthClientAccount()
        account.id = raw.id
        account.name = raw.name ?? raw.id    // fallback to id if name is absent
        account.description = raw.description ?? ''
        account.grantTypes = raw.grantTypes ?? []
        account.scopes = raw.scope ?? []     // API field is "scope" (singular)
        return account
    }

    toStdAccountListOutput(): StdAccountListOutput {
        return {
            key: SimpleKey(this.id),
            disabled: false,
            locked: false,
            attributes: {
                id: this.id,
                name: this.name,
                description: this.description,
                grantTypes: this.grantTypes,
                scopes: this.scopes,          // schema attribute name is "scopes" (plural)
            }
        }
    }
}
