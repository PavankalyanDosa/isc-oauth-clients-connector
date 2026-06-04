import { createConnector, readConfig } from '@sailpoint/connector-sdk'
import { ServiceFactory } from '../services/ServiceFactory'

export const connector = async () => {
    const config = await readConfig()
    const services = ServiceFactory.create(config)

    return createConnector()
        .stdTestConnection(async (context, input, res) => {
            await services.oauthClients.testConnection()
            res.send({})
        })
        .stdAccountList(async (context, input, res) => {
            for await (const account of services.oauthClients.listAccounts()) {
                res.send(account)
            }
        })
        .stdAccountRead(async (_context, input, res) => {
            const id = 'simple' in input.key ? input.key.simple.id : input.identity
            const account = await services.oauthClients.readAccount(id)
            res.send(account)
        })
        .stdEntitlementList(async (context, input, res) => {
            for await (const scope of services.scopes.listEntitlements()) {
                res.send(scope)
            }
        })
}
