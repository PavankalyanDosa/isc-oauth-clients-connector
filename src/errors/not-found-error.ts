import { ConnectorError, ConnectorErrorType } from '@sailpoint/connector-sdk'

export class NotFoundError extends ConnectorError {
    constructor(message: string) {
        super(message, ConnectorErrorType.NotFound)
        this.name = 'NotFoundError'
    }
}
