# ISC OAuth Clients Connector

A SailPoint Identity Security Cloud (ISC) SaaS connector that enables account aggregation and provisioning of OAuth 2.0 clients from your ISC tenant. This connector supports stateful delta synchronization for efficient account list operations and comprehensive OAuth client lifecycle management.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
  - [Connection Settings](#connection-settings)
  - [Account Aggregation](#account-aggregation)
  - [Entitlement Mapping](#entitlement-mapping)
- [Standard Commands](#standard-commands)
  - [Test Connection](#test-connection)
  - [Account List](#account-list)
  - [Account Read](#account-read)
  - [Entitlement List](#entitlement-list)
- [Stateful Processing](#stateful-processing)
- [API Reference](#api-reference)
- [Error Handling](#error-handling)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Best Practices](#best-practices)

## Overview

The **ISC OAuth Clients Connector** provides seamless integration between SailPoint Identity Security Cloud and OAuth 2.0 client applications managed within your ISC tenant. It enables identity administrators to:

- **Aggregate OAuth clients** as accounts from ISC into your identity management workflows
- **Manage OAuth scopes** as entitlements with full access control capabilities
- **Track account changes** efficiently through stateful delta synchronization
- **Provision OAuth clients** with scope assignments across target systems
- **Monitor account lifecycle** with comprehensive read operations

This connector is ideal for organizations that need to manage OAuth 2.0 applications as first-class identity objects in SailPoint ISC.

### Key Capabilities

- **Account Aggregation**: Read OAuth 2.0 clients from ISC and import as accounts
- **Stateful Delta Sync**: Only retrieve changed accounts since last aggregation (reduces data transfer)
- **Entitlement Discovery**: Automatically map OAuth scopes as entitlements
- **Account Read**: Retrieve detailed information about individual OAuth clients
- **Scope Management**: Manage OAuth scopes with full assignment capabilities
- **Connection Testing**: Validate ISC connectivity and credential validity
- **Error Recovery**: Comprehensive error handling and logging

## Features

### Account Aggregation

- **Standard List Command**: Retrieve all OAuth 2.0 clients from ISC
- **Stateful Processing**: 
  - Tracks modification timestamps across aggregation runs
  - Only returns newly created or modified accounts
  - Significantly reduces data transfer for large OAuth client populations
  - Maintains state between aggregation cycles
- **Timestamp Filtering**: Efficient filtering based on account modification times
- **Full Account Details**: Includes client ID, name, status, and associated scopes

### Entitlement Management

- **Automatic Scope Discovery**: Extracts all unique OAuth scopes from accounts
- **Scope-as-Entitlement**: Maps OAuth scopes as entitlements for access control
- **Entitlement Attributes**: Includes scope name and identifier
- **Relationships**: Tracks which accounts have access to which scopes

### Account Operations

- **Create**: Provision new OAuth 2.0 clients in target systems
- **Read**: Retrieve comprehensive details about specific OAuth clients
- **Update**: Modify OAuth client properties and scope assignments
- **Delete**: Remove OAuth clients and revoke access
- **Query**: Search and filter accounts by various attributes

### Connection Security

- **Personal Access Token Auth**: Secure authentication using ISC PAT credentials
- **TLS/HTTPS**: Encrypted communication with ISC APIs
- **Credential Validation**: Connection testing before aggregate operations

## Architecture

```
┌──────────────────────────┐
│  ISC Tenant              │
│  (OAuth 2.0 Clients)     │
└────────────┬─────────────┘
             │
             │ ISC API
             ▼
┌──────────────────────────────────────┐
│  ISC OAuth Clients Connector         │
│                                      │
│  • Test Connection                   │
│  • List Accounts (Stateful)          │
│  • Read Account Details              │
│  • Discover Entitlements             │
│  • Track Modifications               │
└────────┬─────────────────────────────┘
         │
         │ Connector SDK
         ▼
┌──────────────────────┐
│  SailPoint ISC       │
│  (Source System)     │
└──────────────────────┘
         │
         │ Workflows/Provisioning
         ▼
┌──────────────────────────┐
│  Target Systems          │
│  (Service integrations)  │
└──────────────────────────┘
```

## Quick Start

### 1. Prerequisites

- SailPoint ISC tenant access
- Node.js 16+ and npm
- Personal Access Token (PAT) with OAuth client read permissions
- TypeScript knowledge for customization

### 2. Install the Connector

```bash
# Clone the repository
git clone https://github.com/PavankalyanDosa/isc-oauth-clients-connector.git
cd isc-oauth-clients-connector

# Install dependencies
npm install

# Build the project
npm run build

# Create deployment package
npm run pack-zip
```

### 3. Deploy to ISC

```bash
# Use SailPoint CLI to upload
sail conn upload -c isc-oauth-clients-connector -f ./dist/isc-oauth-clients-connector-1.0.0.zip
```

### 4. Create a Source in ISC

1. Navigate to **Admin** > **Connections** > **Sources**
2. Click **Create Source**
3. Select **ISC OAuth Clients Connector**
4. Configure connection settings:
   - **Base URL**: `https://tenant.api.identitynow.com`
   - **Client ID**: Your ISC PAT client ID
   - **Client Secret**: Your ISC PAT client secret
5. Test the connection
6. Complete source creation

### 5. Run Account Aggregation

1. In the source details, click **Aggregate Now**
2. Monitor the aggregation job in **Admin** > **System** > **Aggregation Logs**
3. Verify accounts are imported in **Admin** > **Accounts**

## Installation

### From Source

```bash
npm install
npm run build
```

### Build Outputs

- **dist/index.js** - Compiled connector code
- **dist/isc-oauth-clients-connector-1.0.0.zip** - Deployment package

### Environment Requirements

| Component | Version | Purpose |
|-----------|---------|---------|
| Node.js | 16+ | JavaScript runtime |
| npm | 7+ | Package management |
| TypeScript | 4.5+ | Type safety |
| @sailpoint/connector-sdk | Latest | Connector framework |

## Configuration

### Connection Settings

Connection configuration is provided when creating a source in SailPoint ISC.

```json
{
  "baseUrl": "https://tenant.api.identitynow.com",
  "clientId": "your-pat-client-id",
  "clientSecret": "your-pat-client-secret"
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `baseUrl` | string | Yes | ISC tenant API URL (e.g., `https://tenant.api.identitynow.com`) |
| `clientId` | string | Yes | Personal Access Token client ID |
| `clientSecret` | string | Yes | Personal Access Token client secret |

### Account Aggregation

Accounts represent OAuth 2.0 clients stored in your ISC tenant.

#### Account Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | string | Unique OAuth client identifier |
| `name` | string | OAuth client name |
| `enabled` | boolean | Whether the OAuth client is enabled |
| `scope` | array | Array of OAuth scopes granted to client |
| `modified` | string | ISO 8601 timestamp of last modification |
| `metadata` | object | Custom metadata associated with client |

#### Account Example

```json
{
  "key": {
    "simple": {
      "id": "oauth-client-12345"
    }
  },
  "disabled": false,
  "locked": false,
  "attributes": {
    "id": "oauth-client-12345",
    "name": "Mobile App Integration",
    "enabled": true,
    "scope": ["sp:search:read", "sp:create:entitlements"],
    "modified": "2026-06-03T15:30:00Z",
    "metadata": {
      "owner": "platform-team",
      "environment": "production"
    }
  }
}
```

### Entitlement Mapping

OAuth scopes are automatically discovered and mapped as entitlements.

#### Entitlement Format

| Attribute | Type | Description |
|-----------|------|-------------|
| `type` | string | Always `group` for scope entitlements |
| `identity` | string | Scope name (e.g., `sp:search:read`) |
| `uuid` | string | Unique identifier matching identity |
| `attributes` | object | Scope metadata and display name |

#### Entitlement Example

```json
{
  "type": "group",
  "identity": "sp:search:read",
  "uuid": "sp:search:read",
  "attributes": {
    "id": "sp:search:read",
    "name": "Search Read Access"
  }
}
```

## Standard Commands

All connector commands follow the SailPoint Connector SDK standard command patterns.

### Test Connection

**Command**: `std:test-connection`

Validates ISC connectivity and credential validity.

**Input**: None

**Output**: 
- Success (empty response): Connection is valid
- Error: Invalid credentials or connectivity issue

**Example Usage**

```bash
# Triggered automatically when testing source connection in ISC UI
```

**Error Scenarios**

| Scenario | Error Message | Resolution |
|----------|---------------|-----------|
| Invalid credentials | `401 Unauthorized` | Verify Client ID and Client Secret |
| Invalid base URL | `Connection refused` | Verify ISC tenant URL is correct |
| Network error | `ECONNREFUSED` | Check network connectivity to ISC |

### Account List

**Command**: `std:account:list`

Retrieves all OAuth 2.0 clients from ISC.

**Features**:
- **Stateful Processing**: Tracks modification timestamps
- **Delta Sync**: Returns only changed accounts since last run
- **Full History**: Can perform full re-aggregation if needed

**Input** (when stateful):

```typescript
{
  "stateful": true,
  "state": {
    "modifiedSince": "2026-06-03T10:00:00Z"  // ISO 8601 timestamp
  }
}
```

**Output**: Stream of OAuth client accounts

```json
{
  "key": { "simple": { "id": "client-id" } },
  "disabled": false,
  "locked": false,
  "attributes": {
    "id": "client-id",
    "name": "Client Name",
    "enabled": true,
    "scope": ["scope1", "scope2"],
    "modified": "2026-06-03T15:30:00Z"
  }
}
```

**State Management**

- **Initial Run**: No state provided, returns all accounts
- **Subsequent Runs**: State contains last execution's `modifiedSince`
- **Filtering**: Server-side timestamp filtering reduces data transfer
- **State Update**: Latest modification timestamp automatically saved

**Performance Benefits**

| Scenario | Without State | With State | Improvement |
|----------|---------------|-----------|-------------|
| 1000 accounts, 50 changed | 1000 accounts | 50 accounts | 95% reduction |
| 10000 accounts, 200 changed | 10000 accounts | 200 accounts | 98% reduction |

### Account Read

**Command**: `std:account:read`

Retrieves detailed information about a specific OAuth client.

**Input**: Account identity (ID or key)

```json
{
  "key": {
    "simple": {
      "id": "oauth-client-id"
    }
  }
}
```

**Output**: Detailed account object

```json
{
  "key": { "simple": { "id": "oauth-client-id" } },
  "disabled": false,
  "locked": false,
  "attributes": {
    "id": "oauth-client-id",
    "name": "Client Name",
    "description": "Client Description",
    "enabled": true,
    "businessName": "Department Name",
    "scope": ["sp:search:read", "sp:create:entitlements"],
    "modified": "2026-06-03T15:30:00Z",
    "metadata": {}
  }
}
```

**Error Handling**

| Error | HTTP Status | Cause | Resolution |
|-------|-------------|-------|-----------|
| Account Not Found | 404 | Client ID doesn't exist | Verify client ID is correct |
| Unauthorized | 401 | Invalid credentials | Check PAT credentials |
| Server Error | 500+ | ISC API error | Check ISC status and retry |

### Entitlement List

**Command**: `std:entitlement:list`

Discovers all unique OAuth scopes from provisioned accounts.

**Input**: None

**Output**: Stream of OAuth scope entitlements

```json
{
  "type": "group",
  "identity": "sp:search:read",
  "uuid": "sp:search:read",
  "attributes": {
    "id": "sp:search:read",
    "name": "Search Read Access"
  }
}
```

**Scope Discovery Process**

1. Iterates through all OAuth clients
2. Collects all scopes from each client
3. Deduplicates scopes (each unique scope appears once)
4. Returns as standardized entitlements

**Common Scopes**

| Scope | Description |
|-------|-------------|
| `sp:search:read` | Read search data |
| `sp:create:entitlements` | Create entitlements |
| `sp:manage:application` | Manage applications |
| `sp:manage:sources` | Manage sources |
| `sp:read:account` | Read account information |
| `sp:write:account` | Write account information |

## Stateful Processing

Stateful processing enables efficient delta synchronization by tracking account modifications.

### How It Works

```
┌─────────────────────────────────────────────────────┐
│                First Aggregation                    │
│                                                     │
│  • No state available                              │
│  • Retrieve all OAuth clients                      │
│  • Track latest modification timestamp             │
│  • Save state: { modifiedSince: "2026-06-03T..." } │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│              Second Aggregation (Later)             │
│                                                     │
│  • Read saved state from ISC                       │
│  • Query accounts modified after stored timestamp  │
│  • Only receive changed accounts                   │
│  • Update state with new timestamp                 │
└─────────────────────────────────────────────────────┘
```

### Implementation Details

**State Structure**

```typescript
interface AccountListState {
  modifiedSince: string  // ISO 8601 timestamp
}
```

**Timestamp Comparison**

- Uses string-based ISO 8601 comparison
- Timestamps in UTC timezone
- Millisecond precision supported
- Accounts with `modified >= modifiedSince` are returned

**State Persistence**

- Managed by SailPoint ISC
- Automatically saved after successful aggregation
- Persists across aggregation cycles
- Cleared on manual full re-aggregation

### Configuration in ISC

Stateful processing is automatically enabled when:
1. Source uses this connector
2. Account List command executes with stateful flag
3. ISC manages state persistence

No additional configuration required in the connector itself.

## API Reference

### Core Classes

#### ISCApiClient

Handles communication with ISC OAuth Clients API.

```typescript
class ISCApiClient {
  constructor(config: {
    baseUrl: string
    clientId: string
    clientSecret: string
  })

  async testConnection(): Promise<void>
  async listOAuthClients(input?: StdAccountListInput): 
    AsyncGenerator<OAuthClientAccount>
  async getOAuthClient(id: string): Promise<OAuthClientAccount>
}
```

#### OAuthClientService

Business logic for account and entitlement operations.

```typescript
class OAuthClientService {
  async testConnection(): Promise<void>
  async *listAccounts(input?: StdAccountListInput): 
    AsyncGenerator<StdAccountListOutput>
  async readAccount(id: string): Promise<StdAccountReadOutput>
}
```

#### ScopeService

Manages OAuth scope to entitlement mapping.

```typescript
class ScopeService {
  async *listEntitlements(): AsyncGenerator<StdEntitlementListOutput>
}
```

### Error Types

#### InvalidConfigurationError

Thrown when configuration is invalid or missing.

```typescript
throw new InvalidConfigurationError(
  'Missing required configuration: baseUrl'
)
```

#### NotFoundError

Thrown when an OAuth client cannot be found.

```typescript
throw new NotFoundError(`OAuth client not found: ${id}`)
```

## Error Handling

### Common Errors

#### 401 Unauthorized

**Cause**: Invalid or expired PAT credentials

**Resolution**:
1. Verify Client ID and Client Secret in source configuration
2. Ensure PAT has not expired in ISC
3. Confirm PAT has `oauth-client:read` and `oauth-client:write` scopes

#### 404 Not Found

**Cause**: OAuth client does not exist in ISC

**Resolution**:
1. Verify client ID exists in ISC
2. Confirm account has not been deleted
3. Check for typos in client identifier

#### Connection Timeout

**Cause**: Network or ISC availability issue

**Resolution**:
1. Verify ISC tenant URL is correct
2. Check network connectivity to ISC
3. Verify firewall rules allow outbound HTTPS (port 443)
4. Check ISC system status page

### Error Recovery

The connector implements automatic retry logic:
- **Transient Errors** (5xx, timeout): Automatic retry with exponential backoff
- **Permanent Errors** (4xx): Fail immediately with clear error message
- **Max Retries**: 3 attempts with 1-5 second delays

## Troubleshooting

### Issue: Aggregation Fails with "Connection Refused"

**Diagnosis**:
```bash
# Test connectivity
curl -I https://tenant.api.identitynow.com
```

**Solutions**:
- Verify ISC tenant URL in configuration
- Check network connectivity and firewall rules
- Ensure you have outbound HTTPS access (port 443)

### Issue: "401 Unauthorized" Error

**Diagnosis**:
1. Go to ISC > Admin > System > API Management
2. Verify PAT is active and not expired
3. Check scopes include `oauth-client:read`

**Solution**:
- Create new PAT with required scopes
- Update source configuration with new credentials
- Test connection in ISC UI

### Issue: No Accounts Imported

**Diagnosis**:
1. Check aggregation logs: **Admin** > **System** > **Aggregation Logs**
2. Verify OAuth clients exist in ISC: **Admin** > **Integrations** > **OAuth**
3. Confirm PAT has read permissions

**Solution**:
- Create test OAuth clients in ISC first
- Verify PAT scope includes `oauth-client:read`
- Re-run aggregation after confirming prerequisites

### Issue: Stateful Aggregation Runs Slowly

**Cause**: Large number of accounts or modified records

**Solutions**:
- First run aggregates all accounts (expected slowness)
- Subsequent runs should be faster (delta only)
- If consistently slow, check ISC API performance
- Consider increasing aggregation frequency

### Debug Logging

Enable verbose logging:

```bash
# Set environment variable
export DEBUG=connector:*

# Then run aggregation from ISC UI
```

## Development

### Build

```bash
# Clean and build
npm run clean
npm run build

# Build with source maps
npm run build:debug
```

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- src/services/OAuthClientService.spec.ts

# Watch mode for development
npm test -- --watch
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run type-check
```

### Project Structure

```
src/
├── index.ts                 # Connector entry point
├── controller/
│   └── connector.ts         # Standard command implementations
├── services/
│   ├── OAuthClientService.ts    # Account operations
│   ├── ScopeService.ts          # Entitlement operations
│   ├── ServiceFactory.ts        # Dependency injection
│   └── http/
│       └── ISCApiClient.ts      # ISC API communication
├── models/
│   ├── oauth-client-account.ts  # Data models
│   └── scope-entitlement.ts
└── errors/
    ├── invalid-configuration-error.ts
    └── not-found-error.ts
```

### Adding Custom Logic

To extend the connector with custom business logic:

1. **Modify Service Layer**: Edit `src/services/OAuthClientService.ts`
2. **Add Filtering**: Implement in `listAccounts()` method
3. **Custom Mapping**: Update `toStdAccountListOutput()` in model
4. **Rebuild**: `npm run build && npm run pack-zip`
5. **Deploy**: Upload new ZIP to ISC

### Publishing Changes

```bash
# Commit changes
git add .
git commit -m "feat: description of changes"

# Tag version
git tag v1.1.0

# Push to repository
git push origin main
git push origin v1.1.0
```

## Best Practices

### Account Aggregation

✅ **DO**:
- Run initial full aggregation during off-hours
- Use stateful processing for regular aggregations
- Monitor aggregation logs for errors
- Schedule aggregations during low-traffic periods

❌ **DON'T**:
- Modify ISC OAuth clients during active aggregation
- Disable stateful processing unnecessarily
- Run multiple simultaneous aggregations
- Store credentials in version control

### Source Configuration

✅ **DO**:
- Use dedicated PAT with minimal required scopes
- Document custom OAuth client naming conventions
- Review source role mappings regularly
- Keep source configuration in sync with ISC

❌ **DON'T**:
- Reuse production PAT across multiple sources
- Share PAT credentials via email or chat
- Use admin PAT for OAuth client connector
- Skip connection testing before production use

### Provisioning Workflows

✅ **DO**:
- Test provisioning workflows in sandbox first
- Implement approval workflows for scope changes
- Monitor provisioning job logs
- Document approval requirements

❌ **DON'T**:
- Provision to production without testing
- Bypass approval workflows
- Provision large batches without staging
- Leave failed provisioning tasks unresolved

### Troubleshooting

✅ **DO**:
- Check ISC system status first
- Review aggregation and provisioning logs
- Test connectivity with curl or similar tools
- Verify credentials and permissions

❌ **DON'T**:
- Assume ISC is down without verification
- Modify production configuration without testing
- Restart connector without checking dependencies
- Skip validation in staging environment

## Support and Contribution

### Getting Help

- Review [ISC Documentation](https://developer.sailpoint.com)
- Check [Connector SDK Documentation](https://github.com/sailpoint-oss/connector-sdk)
- Contact SailPoint Professional Services for enterprise support

### Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and test thoroughly
4. Commit with clear messages: `git commit -am 'Add feature'`
5. Push to branch: `git push origin feature/my-feature`
6. Submit a Pull Request

### Reporting Issues

Report bugs with:
- Clear description of the issue
- Steps to reproduce
- Expected vs. actual behavior
- Connector version and ISC version
- Error logs and stack traces (sanitized)

## License

This project is licensed under the SailPoint Developer License Agreement.

## Changelog

### Version 1.1.0 (2026-06-03)

**Features**:
- ✨ Implement stateful account list with delta synchronization
- ✨ Add modification timestamp tracking for efficient delta sync
- ✨ Support stateful input in account list handler

**Improvements**:
- 🔧 Refactor timestamp comparison logic
- 🔧 Update service layer to accept stateful input
- 📦 Add connector-spec.json stateful configuration

**Testing**:
- ✂️ Remove legacy test files for fresh test suite
- ✂️ Consolidate test infrastructure

### Version 1.0.0 (2026-05-01)

**Initial Release**:
- Account aggregation from ISC OAuth clients
- Entitlement discovery from OAuth scopes
- Account read and connection test commands
- Full error handling and logging

## Related Resources

- [SailPoint Connector SDK](https://github.com/sailpoint-oss/connector-sdk)
- [ISC API Documentation](https://developer.sailpoint.com/apis/isc/)
- [Connector Deployment Guide](https://developer.sailpoint.com/isc/guides/connectors/)
- [OAuth 2.0 Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)
