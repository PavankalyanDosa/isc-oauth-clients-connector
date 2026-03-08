import { createConnector, readConfig } from '@sailpoint/connector-sdk'
import { ISCApiClient } from './isc-api-client'

export const connector = async () => {
    const config = await readConfig()
    const client = new ISCApiClient(config)

    return createConnector()
        .stdTestConnection(async (context, input, res) => {
            await client.testConnection()
            res.send({})
        })
        .stdAccountList(async (context, input, res) => {
            // Stream accounts one-at-a-time — NEVER buffer into array
            // Prevents 3-minute ISC connector timeout on large tenants
            for await (const account of client.listOAuthClients()) {
                res.send(account.toStdAccountListOutput())
            }
        })
        .stdEntitlementList(async (context, input, res) => {
            // Stream entitlements one-at-a-time — dynamically derived from OAuth clients
            for await (const scope of client.listScopes()) {
                res.send(scope.toStdEntitlementListOutput())
            }
        })
}
