import {
    AssumeAwsRoleRequest,
    AssumeAwsRoleResponse,
    Connector,
    RawResponse,
    ResponseType,
    StandardCommand,
    StdAccountListOutput,
    StdAccountReadOutput,
    StdEntitlementListOutput,
} from '@sailpoint/connector-sdk'
import { PassThrough } from 'stream'
import { connector } from './index'
import { ServiceFactory } from './services/ServiceFactory'
import { ISCApiClient } from './services/http/ISCApiClient'

var mockReadConfig = jest.fn()

jest.mock('@sailpoint/connector-sdk', () => {
    const actual = jest.requireActual('@sailpoint/connector-sdk')

    return {
        ...actual,
        readConfig: (...args: unknown[]) => mockReadConfig(...args),
    }
})

jest.mock('./services/http/ISCApiClient', () => ({
    ISCApiClient: jest.fn(),
}))

jest.mock('./services/ServiceFactory', () => ({
    ServiceFactory: {
        create: jest.fn(),
    },
}))

const createContext = () => ({
    reloadConfig() {
        return Promise.resolve()
    },
    assumeAwsRole(assumeAwsRoleRequest: AssumeAwsRoleRequest): Promise<AssumeAwsRoleResponse> {
        return Promise.resolve(new AssumeAwsRoleResponse('accessKeyId', 'secretAccessKey', 'sessionToken', '123'))
    },
})

const collectResponses = async (command: StandardCommand, input?: unknown): Promise<RawResponse[]> => {
    const responses: RawResponse[] = []
    const output = new PassThrough({ objectMode: true }).on('data', (chunk) => responses.push(chunk as RawResponse))

    await (await connector())._exec(command, createContext(), input, output)

    return responses
}

const mockTestConnection = jest.fn()
const mockListAccounts = jest.fn()
const mockReadAccount = jest.fn()
const mockListEntitlements = jest.fn()

describe('connector parity', () => {
    beforeEach(() => {
        mockReadConfig.mockReset()
        ;(ISCApiClient as jest.Mock).mockReset()
        mockTestConnection.mockReset()
        mockListAccounts.mockReset()
        mockReadAccount.mockReset()
        mockListEntitlements.mockReset()

        mockReadConfig.mockResolvedValue({
            clientId: 'client-id',
            clientSecret: 'client-secret',
            baseUrl: 'https://tenant.example.com',
        })

        ;(ServiceFactory.create as jest.Mock).mockReturnValue({
            oauthClients: {
                testConnection: mockTestConnection,
                listAccounts: mockListAccounts,
                readAccount: mockReadAccount,
            },
            scopes: {
                listEntitlements: mockListEntitlements,
            },
        })
    })

    it('preserves test connection, account list, and entitlement list behavior after the refactor', async () => {
        const accountOutputs: StdAccountListOutput[] = [
            {
                key: { simple: { id: 'client-1' } },
                disabled: false,
                locked: false,
                attributes: { id: 'client-1', scopes: ['scope:a', 'scope:b'] },
            },
            {
                key: { simple: { id: 'client-2' } },
                disabled: true,
                locked: false,
                attributes: { id: 'client-2', scopes: ['scope:b'] },
            },
        ]
        const entitlementOutputs: StdEntitlementListOutput[] = [
            {
                type: 'group',
                identity: 'scope:a',
                uuid: 'scope:a',
                attributes: { id: 'scope:a', name: 'scope:a' },
            },
            {
                type: 'group',
                identity: 'scope:b',
                uuid: 'scope:b',
                attributes: { id: 'scope:b', name: 'scope:b' },
            },
        ]

        mockTestConnection.mockResolvedValue(undefined)
        mockListAccounts.mockReturnValue(
            (async function* () {
                for (const account of accountOutputs) {
                    yield account
                }
            })()
        )
        mockListEntitlements.mockReturnValue(
            (async function* () {
                for (const scope of entitlementOutputs) {
                    yield scope
                }
            })()
        )

        expect((await connector()).sdkVersion).toStrictEqual(Connector.SDK_VERSION)

        await expect(collectResponses(StandardCommand.StdTestConnection)).resolves.toStrictEqual([
            new RawResponse({}, ResponseType.Output),
        ])
        expect(mockTestConnection).toHaveBeenCalledTimes(1)

        await expect(collectResponses(StandardCommand.StdAccountList)).resolves.toStrictEqual([
            new RawResponse(accountOutputs[0], ResponseType.Output),
            new RawResponse(accountOutputs[1], ResponseType.Output),
        ])
        expect(mockListAccounts).toHaveBeenCalledTimes(1)

        await expect(collectResponses(StandardCommand.StdEntitlementList)).resolves.toStrictEqual([
            new RawResponse(entitlementOutputs[0], ResponseType.Output),
            new RawResponse(entitlementOutputs[1], ResponseType.Output),
        ])
        expect(mockListEntitlements).toHaveBeenCalledTimes(1)
        expect(ServiceFactory.create).toHaveBeenCalled()
    })

    it('executes std:account:read and returns a single mapped account', async () => {
        const account: StdAccountReadOutput = {
            key: { simple: { id: 'client-1' } },
            disabled: false,
            locked: false,
            attributes: {
                id: 'client-1',
                name: 'Client One',
                description: 'Desc',
                businessName: 'Biz',
                scopes: ['sp:search:read'],
            },
        }

        mockReadAccount.mockResolvedValue(account)

        const responses = await collectResponses(StandardCommand.StdAccountRead, {
            key: { simple: { id: 'client-1' } },
        })

        expect(responses).toStrictEqual([new RawResponse(account, ResponseType.Output)])
        expect(mockReadAccount).toHaveBeenCalledWith('client-1')
    })

    it('executes the real service factory path and derives unique entitlements from account outputs', async () => {
        const actualFactory = jest.requireActual('./services/ServiceFactory') as typeof import('./services/ServiceFactory')
        const config = {
            clientId: 'client-id',
            clientSecret: 'client-secret',
            baseUrl: 'https://tenant.example.com',
        }
        const apiClient = {
            testConnection: jest.fn().mockResolvedValue(undefined),
            listOAuthClients: jest.fn().mockImplementation(async function* () {
                yield {
                    toStdAccountListOutput: () =>
                        ({
                            key: { simple: { id: 'client-1' } },
                            disabled: false,
                            locked: false,
                            attributes: { id: 'client-1', scopes: ['scope:a', 'scope:b'] },
                        }) as StdAccountListOutput,
                }
                yield {
                    toStdAccountListOutput: () =>
                        ({
                            key: { simple: { id: 'client-2' } },
                            disabled: false,
                            locked: false,
                            attributes: { id: 'client-2', scopes: ['scope:b', 'scope:c'] },
                        }) as StdAccountListOutput,
                }
                yield {
                    toStdAccountListOutput: () =>
                        ({
                            key: { simple: { id: 'client-3' } },
                            disabled: false,
                            locked: false,
                            attributes: { id: 'client-3', scopes: 'not-an-array' },
                        }) as StdAccountListOutput,
                }
            }),
        }

        ;(ISCApiClient as jest.Mock).mockImplementation(() => apiClient)

        const services = actualFactory.ServiceFactory.create(config)
        const accounts: StdAccountListOutput[] = []
        const entitlements: StdEntitlementListOutput[] = []

        await services.oauthClients.testConnection()
        for await (const account of services.oauthClients.listAccounts()) {
            accounts.push(account)
        }
        for await (const entitlement of services.scopes.listEntitlements()) {
            entitlements.push(entitlement)
        }

        expect(ISCApiClient).toHaveBeenCalledWith(config)
        expect(apiClient.testConnection).toHaveBeenCalledTimes(1)
        expect(apiClient.listOAuthClients).toHaveBeenCalledTimes(2)
        expect(accounts).toStrictEqual([
            {
                key: { simple: { id: 'client-1' } },
                disabled: false,
                locked: false,
                attributes: { id: 'client-1', scopes: ['scope:a', 'scope:b'] },
            },
            {
                key: { simple: { id: 'client-2' } },
                disabled: false,
                locked: false,
                attributes: { id: 'client-2', scopes: ['scope:b', 'scope:c'] },
            },
            {
                key: { simple: { id: 'client-3' } },
                disabled: false,
                locked: false,
                attributes: { id: 'client-3', scopes: 'not-an-array' },
            },
        ])
        expect(entitlements).toStrictEqual([
            {
                type: 'group',
                identity: 'scope:a',
                uuid: 'scope:a',
                attributes: { id: 'scope:a', name: 'scope:a' },
            },
            {
                type: 'group',
                identity: 'scope:b',
                uuid: 'scope:b',
                attributes: { id: 'scope:b', name: 'scope:b' },
            },
            {
                type: 'group',
                identity: 'scope:c',
                uuid: 'scope:c',
                attributes: { id: 'scope:c', name: 'scope:c' },
            },
        ])
    })
})
