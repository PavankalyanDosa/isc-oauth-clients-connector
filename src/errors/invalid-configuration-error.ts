import { ConnectorError, ConnectorErrorType } from '@sailpoint/connector-sdk'

const INVALID_CONFIGURATION =
    (ConnectorErrorType as typeof ConnectorErrorType & { InvalidConfiguration?: ConnectorErrorType })
        .InvalidConfiguration ?? ('invalidConfiguration' as ConnectorErrorType)

export class InvalidConfigurationError extends ConnectorError {
    constructor(message: string) {
        super(message, INVALID_CONFIGURATION)
        this.name = 'InvalidConfigurationError'
    }
}
