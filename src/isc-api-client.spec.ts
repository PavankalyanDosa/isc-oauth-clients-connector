import { ConnectorErrorType } from '@sailpoint/connector-sdk'
import { OAuthClientAccount } from './models/oauth-client-account'
import { OAuthClientsApi } from 'sailpoint-api-client'
import { ISCApiClient } from './services/http/ISCApiClient'

const mockListOauthClients = jest.fn()
const mockGetOauthClient = jest.fn()
const mockPatchOauthClient = jest.fn()

jest.mock('sailpoint-api-client', () => {
    return {
        Configuration: jest.fn().mockImplementation((config) => config),
        OAuthClientsApi: jest.fn().mockImplementation(() => ({
            listOauthClients: mockListOauthClients,
            getOauthClient: mockGetOauthClient,
            patchOauthClient: mockPatchOauthClient,
        })),
    }
})

describe('ISC API client', () => {
    beforeEach(() => {
        ;(OAuthClientsApi as jest.Mock).mockClear()
        mockListOauthClients.mockReset()
        mockGetOauthClient.mockReset()
        mockPatchOauthClient.mockReset()
    })

    it('account:read reads and maps an OAuth client successfully', async () => {
        const client = new ISCApiClient({
            baseUrl: 'https://tenant.api.identitynow.com',
            clientId: 'client-id',
            clientSecret: 'client-secret',
        })

        mockGetOauthClient.mockResolvedValue({
            data: {
                id: 'client-1',
                name: 'Client One',
                enabled: true,
                scope: ['sp:search:read'],
                metadata: { owner: 'team-a' },
            },
        })

        await expect(client.getOAuthClient('client-1')).resolves.toBeInstanceOf(OAuthClientAccount)
        await expect(client.getOAuthClient('client-1')).resolves.toMatchObject({
            id: 'client-1',
            name: 'Client One',
            scopes: ['sp:search:read'],
            metadata: JSON.stringify({ owner: 'team-a' }),
        })
    })

    it('maps getOauthClient 404 into a connector not found error', async () => {
        const client = new ISCApiClient({
            baseUrl: 'https://tenant.api.identitynow.com',
            clientId: 'client-id',
            clientSecret: 'client-secret',
        })

        mockGetOauthClient.mockRejectedValue(new Error('404 Not Found'))

        await expect(client.getOAuthClient('missing-client')).rejects.toMatchObject({
            type: ConnectorErrorType.NotFound,
        })
    })

    it('account:read maps non-404 getOauthClient failures into a generic connector error', async () => {
        const client = new ISCApiClient({
            baseUrl: 'https://tenant.api.identitynow.com',
            clientId: 'client-id',
            clientSecret: 'client-secret',
        })

        mockGetOauthClient.mockRejectedValue(new Error('500 Internal Server Error'))

        await expect(client.getOAuthClient('client-1')).rejects.toMatchObject({
            type: ConnectorErrorType.Generic,
            message: 'Failed to read OAuth client: 500 Internal Server Error',
        })
    })

    it('account:read rejects missing required configuration with an invalid configuration error type', () => {
        expect(() => new ISCApiClient({
            baseUrl: 'https://tenant.api.identitynow.com',
            clientSecret: 'client-secret',
        })).toThrow('Missing required config: clientId')

        try {
            new ISCApiClient({
                baseUrl: 'https://tenant.api.identitynow.com',
                clientSecret: 'client-secret',
            })
        } catch (err) {
            expect(err).toMatchObject({
                type: 'invalidConfiguration',
                name: 'InvalidConfigurationError',
            })
        }
    })

    it('account:read keeps list and scope derivation behavior intact', async () => {
        const client = new ISCApiClient({
            baseUrl: 'https://tenant.api.identitynow.com',
            clientId: 'client-id',
            clientSecret: 'client-secret',
        })

        mockListOauthClients.mockResolvedValue({
            data: [
                { id: 'client-1', name: 'Client One', scope: ['scope:a', 'scope:b'], enabled: true },
                { id: 'client-2', name: 'Client Two', scope: ['scope:b', 'scope:c'], enabled: false },
            ],
        })

        const accounts: OAuthClientAccount[] = []
        const scopes: string[] = []

        for await (const account of client.listOAuthClients()) {
            accounts.push(account)
        }
        for await (const scope of client.listScopes()) {
            scopes.push(scope.id)
        }

        expect(accounts).toHaveLength(2)
        expect(accounts[0].toStdAccountReadOutput()).toMatchObject({
            key: { simple: { id: 'client-1' } },
            disabled: false,
            attributes: { scopes: ['scope:a', 'scope:b'] },
        })
        expect(scopes).toStrictEqual(['scope:a', 'scope:b', 'scope:c'])
    })

    it('account:read maps OAuth client fields into standard read output with defaults', () => {
        const full = OAuthClientAccount.fromApiResponse({
            id: 'client-1',
            name: 'Client One',
            description: 'Desc',
            enabled: true,
            type: 'CONFIDENTIAL',
            grantTypes: ['CLIENT_CREDENTIALS'],
            scope: ['sp:search:read'],
            accessType: 'OFFLINE',
            created: '2026-06-01T00:00:00.000Z',
            modified: '2026-06-02T00:00:00.000Z',
            lastUsed: '2026-06-03T00:00:00.000Z',
            consentRequired: true,
            claimsSupported: true,
            strongAuthSupported: true,
            accessTokenValiditySeconds: 3600,
            refreshTokenValiditySeconds: 7200,
            internal: true,
            metadata: { region: 'us' },
            integrationId: 'integration-1',
            businessName: 'Biz',
            homepageUrl: 'https://example.com',
            redirectUris: ['https://example.com/callback'],
        })
        const minimal = OAuthClientAccount.fromApiResponse({
            id: 'client-2',
            name: '',
        })

        expect(full.toStdAccountReadOutput()).toMatchObject({
            key: { simple: { id: 'client-1' } },
            disabled: false,
            locked: false,
            attributes: {
                id: 'client-1',
                name: 'Client One',
                description: 'Desc',
                enabled: true,
                type: 'CONFIDENTIAL',
                grantTypes: ['CLIENT_CREDENTIALS'],
                scopes: ['sp:search:read'],
                accessType: 'OFFLINE',
                created: '2026-06-01T00:00:00.000Z',
                modified: '2026-06-02T00:00:00.000Z',
                lastUsed: '2026-06-03T00:00:00.000Z',
                consentRequired: true,
                claimsSupported: true,
                strongAuthSupported: true,
                accessTokenValiditySeconds: 3600,
                refreshTokenValiditySeconds: 7200,
                internal: true,
                metadata: JSON.stringify({ region: 'us' }),
                integrationId: 'integration-1',
                businessName: 'Biz',
                homepageUrl: 'https://example.com',
                redirectUris: ['https://example.com/callback'],
            },
        })
        expect(minimal.toStdAccountReadOutput()).toMatchObject({
            key: { simple: { id: 'client-2' } },
            disabled: false,
            locked: false,
            attributes: {
                name: '',
                description: '',
                enabled: true,
                grantTypes: [],
                scopes: [],
                metadata: '',
                redirectUris: [],
            },
        })
    })
})
