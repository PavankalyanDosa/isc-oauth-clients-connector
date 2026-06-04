import { ConnectorError, ConnectorErrorType } from '@sailpoint/connector-sdk'

const INVALID_CONFIGURATION = 'invalidConfiguration' as unknown as ConnectorErrorType

export class InvalidConfigurationError extends ConnectorError {
    constructor(message: string) {
        super(message, INVALID_CONFIGURATION)
        this.name = 'InvalidConfigurationError'
    }
}
