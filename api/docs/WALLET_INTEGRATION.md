# Sui Wallet Integration Guide

This document provides a comprehensive guide for integrating Sui wallet functionality into the Satya Data Marketplace API and frontend applications.

## Overview

The Satya API now supports proper Sui wallet integration with the following features:

- **Wallet Authentication**: Message signing for secure authentication
- **Transaction Signing**: User-controlled transaction approval and signing
- **Session Management**: Secure session tokens with expiration
- **Rate Limiting**: Protection against abuse and spam
- **Gas Estimation**: Transparent fee calculation
- **Multi-wallet Support**: Extensible architecture for various Sui wallets

## Architecture

```
Frontend App (React/Vue/Angular)
    ↓
Wallet Adapter (Sui Wallet, Suiet, etc.)
    ↓
Satya API Server
    ↓
Sui Network (Testnet/Mainnet)
```

## API Endpoints

### Authentication

#### 1. Get Authentication Challenge
```http
POST /api/auth/challenge
Content-Type: application/json

{
  "walletAddress": "0x1234...abcd"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Authenticate wallet for Satya API\n\nWallet Address: 0x1234...abcd\nNonce: abc123\nTimestamp: 1699123456789\n\nThis signature proves you control this wallet address.",
    "nonce": "abc123",
    "timestamp": 1699123456789,
    "walletAddress": "0x1234...abcd"
  }
}
```

#### 2. Verify Signature and Create Session
```http
POST /api/auth/verify
Content-Type: application/json

{
  "walletAddress": "0x1234...abcd",
  "signature": "base64_signature",
  "signedMessage": "full_message_that_was_signed",
  "publicKey": "optional_public_key"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionToken": "hex_encoded_session_token",
    "walletAddress": "0x1234...abcd",
    "expiresAt": "2024-01-15T12:00:00.000Z",
    "tokenType": "Bearer"
  }
}
```

#### 3. Refresh Session
```http
POST /api/auth/refresh
Authorization: Bearer session_token
```

#### 4. Get User Profile
```http
GET /api/auth/profile
Authorization: Bearer session_token
```

#### 5. Estimate Gas Cost
```http
POST /api/auth/estimate-gas
Authorization: Bearer session_token
Content-Type: application/json

{
  "transactionBlock": "base64_transaction_bytes"
}
```

### Marketplace Operations

#### 1. Create Listing (Returns Unsigned Transaction)
```http
POST /api/marketplace/listings
Authorization: Bearer session_token
Content-Type: application/json

{
  "title": "Financial Dataset Q4 2024",
  "description": "Comprehensive market analysis data",
  "price": 2.5,
  "category": "financial",
  "fileHash": "sha256_hash",
  "encryptionKey": "optional_encryption_key",
  "metadata": {}
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionBlock": "base64_unsigned_transaction",
    "requiresUserSignature": true,
    "title": "Financial Dataset Q4 2024",
    "price": 2.5,
    "gasEstimate": {
      "computationCost": 1000000,
      "storageCost": 2000000,
      "totalCost": 3000000
    }
  }
}
```

#### 2. Submit Signed Listing Transaction
```http
POST /api/marketplace/listings/submit-signed
Authorization: Bearer session_token
Content-Type: application/json

{
  "transactionBlock": "base64_transaction_bytes",
  "signature": "wallet_signature",
  "listingData": {
    "title": "Financial Dataset Q4 2024",
    "description": "Comprehensive market analysis data"
  }
}
```

#### 3. Purchase Listing (Returns Unsigned Transaction)
```http
POST /api/marketplace/purchase
Authorization: Bearer session_token
Content-Type: application/json

{
  "listingId": "listing_object_id"
}
```

#### 4. Submit Signed Purchase Transaction
```http
POST /api/marketplace/purchase/submit-signed
Authorization: Bearer session_token
Content-Type: application/json

{
  "transactionBlock": "base64_transaction_bytes",
  "signature": "wallet_signature",
  "purchaseData": {
    "listingId": "listing_object_id",
    "buyerAddress": "0x1234...abcd"
  }
}
```

## Authentication Flow

### 1. Frontend Authentication Process

```javascript
// 1. Connect wallet
const wallet = await walletAdapter.connect();

// 2. Get authentication challenge
const challenge = await apiClient.getAuthChallenge(wallet.address);

// 3. Sign the challenge message
const signature = await walletAdapter.signMessage(challenge.message);

// 4. Verify signature and get session
const session = await apiClient.verifyAuthSignature(
  wallet.address,
  signature,
  challenge.message
);

// 5. Use session token for authenticated requests
apiClient.setSession(session);
```

### 2. Authentication Headers

All authenticated requests must include:

```http
Authorization: Bearer session_token
```

Or for direct signature verification:

```http
Authorization: Wallet base64_signature_data
```

## Transaction Flow

### 1. Create Listing Flow

```javascript
// 1. Create unsigned transaction
const unsignedTx = await apiClient.createListing(listingData);

// 2. Show gas estimate to user
console.log(`Gas cost: ${unsignedTx.gasEstimate.totalCost} MIST`);

// 3. User approves and signs transaction
const signedTx = await walletAdapter.signTransaction(unsignedTx);

// 4. Submit signed transaction
const result = await apiClient.submitSignedListingTransaction(
  signedTx.transactionBlockBytes,
  signedTx.signature,
  listingData
);

console.log('Listing created:', result.transactionHash);
```

### 2. Purchase Flow

```javascript
// 1. Create unsigned purchase transaction
const unsignedTx = await apiClient.purchaseListing(listingId);

// 2. Check user balance and gas cost
const balance = await walletAdapter.getBalance();
if (balance.total < unsignedTx.gasEstimate.totalCost + purchaseAmount) {
  throw new Error('Insufficient balance');
}

// 3. User approves and signs transaction
const signedTx = await walletAdapter.signTransaction(unsignedTx);

// 4. Submit signed transaction
const result = await apiClient.submitSignedPurchaseTransaction(
  signedTx.transactionBlockBytes,
  signedTx.signature,
  { listingId, buyerAddress: wallet.address }
);

console.log('Purchase completed:', result.transactionHash);
```

## Wallet Adapter Implementation

### Sui Wallet Adapter

```typescript
class SuiWalletAdapter implements WalletAdapter {
  name = 'Sui Wallet';
  icon = 'wallet_icon_url';
  url = 'https://chrome.google.com/webstore/detail/sui-wallet/...';

  isInstalled(): boolean {
    return typeof window !== 'undefined' && !!window.suiWallet;
  }

  async connect(): Promise<ConnectedWallet> {
    const wallet = window.suiWallet;
    const permission = await wallet.requestPermissions({
      permissions: ['viewAccount'],
    });

    if (!permission) {
      throw new Error('User rejected connection');
    }

    const accounts = await wallet.getAccounts();
    return {
      address: accounts[0],
      publicKey: '',
      walletType: this.name,
      connected: true,
    };
  }

  async signMessage(message: string): Promise<string> {
    const wallet = window.suiWallet;
    const result = await wallet.signPersonalMessage({
      message: new TextEncoder().encode(message),
    });
    return result.signature;
  }

  async signTransaction(transaction: UnsignedTransaction): Promise<SignedTransaction> {
    const wallet = window.suiWallet;
    const result = await wallet.signTransactionBlock({
      transactionBlock: transaction.transactionBlock,
    });

    return {
      transactionBlockBytes: result.transactionBlockBytes,
      signature: result.signature,
    };
  }
}
```

## Security Considerations

### 1. Message Signing Security

- **Nonce Protection**: Each authentication message includes a unique nonce
- **Timestamp Validation**: Messages expire after 15 minutes
- **Address Verification**: Signed message must match the claimed wallet address
- **Replay Attack Prevention**: Nonces cannot be reused

### 2. Session Management

- **Token Expiration**: Session tokens expire after 24 hours
- **Secure Generation**: Tokens use cryptographic hashing with secrets
- **Rate Limiting**: Authentication attempts are rate-limited per wallet

### 3. Transaction Security

- **User Control**: All transactions require explicit user approval
- **Gas Estimation**: Users see gas costs before signing
- **Balance Checking**: Insufficient balance errors are handled gracefully
- **Validation**: All transaction parameters are validated before submission

## Rate Limiting

### 1. General Rate Limits

- **API Requests**: 1000 requests per 15 minutes per IP
- **Authentication**: 10 attempts per 15 minutes per IP
- **Marketplace Operations**: 50 requests per 5 minutes per IP

### 2. Wallet-Specific Limits

- **Listing Creation**: 5 listings per 5 minutes per wallet
- **Purchases**: 10 purchases per 5 minutes per wallet
- **Transfers**: 20 transfers per 5 minutes per wallet

## Error Handling

### Common Error Codes

```typescript
type WalletErrorCode = 
  | 'WALLET_NOT_CONNECTED'      // User hasn't connected wallet
  | 'WALLET_NOT_INSTALLED'      // Wallet extension not installed
  | 'USER_REJECTED'             // User rejected wallet action
  | 'INSUFFICIENT_BALANCE'      // Not enough SUI for transaction
  | 'TRANSACTION_FAILED'        // Blockchain transaction failed
  | 'NETWORK_ERROR'             // Network connectivity issues
  | 'INVALID_ADDRESS'           // Malformed wallet address
  | 'SIGNATURE_FAILED'          // Message/transaction signing failed
  | 'SESSION_EXPIRED'           // Authentication session expired
  | 'RATE_LIMITED'              // Too many requests
  | 'VALIDATION_ERROR'          // Invalid request parameters
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": {
      "additionalInfo": "Additional context"
    }
  },
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

## Environment Variables

```env
# Required
SUI_NETWORK=testnet
MARKETPLACE_PACKAGE_ID=0x...
MARKETPLACE_OBJECT_ID=0x...

# Optional
JWT_SECRET=your_session_secret
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

## Frontend Integration Examples

See `/src/examples/frontend-integration.ts` for complete React integration examples including:

- Wallet connection management
- Authentication flow
- Transaction signing
- Error handling
- TypeScript types

## Testing

### 1. Wallet Connection Testing

```javascript
// Test wallet installation detection
expect(walletAdapter.isInstalled()).toBe(true);

// Test connection flow
const wallet = await walletAdapter.connect();
expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{64}$/);
```

### 2. Authentication Testing

```javascript
// Test challenge generation
const challenge = await apiClient.getAuthChallenge(walletAddress);
expect(challenge.nonce).toHaveLength(32);
expect(challenge.timestamp).toBeLessThan(Date.now() + 1000);

// Test signature verification
const signature = await walletAdapter.signMessage(challenge.message);
const session = await apiClient.verifyAuthSignature(
  walletAddress, signature, challenge.message
);
expect(session.sessionToken).toBeDefined();
```

### 3. Transaction Testing

```javascript
// Test transaction creation
const unsignedTx = await apiClient.createListing(mockListingData);
expect(unsignedTx.transactionBlock).toBeDefined();
expect(unsignedTx.requiresUserSignature).toBe(true);

// Test transaction signing
const signedTx = await walletAdapter.signTransaction(unsignedTx);
expect(signedTx.signature).toBeDefined();
expect(signedTx.transactionBlockBytes).toBeDefined();
```

## Migration from Simple Auth

### Before (Simple Bearer Token)

```http
Authorization: Bearer wallet_address
```

### After (Proper Wallet Authentication)

```http
Authorization: Bearer session_token
```

### Backward Compatibility

The API maintains backward compatibility for existing integrations, but new applications should use the proper wallet authentication flow.

## Support and Troubleshooting

### Common Issues

1. **"Wallet not installed"**
   - Solution: Ensure Sui Wallet extension is installed and enabled

2. **"User rejected connection"**
   - Solution: User must approve wallet connection in the extension

3. **"Session expired"**
   - Solution: Refresh session token or re-authenticate

4. **"Insufficient balance"**
   - Solution: Check SUI balance and gas requirements

5. **"Rate limited"**
   - Solution: Wait for rate limit window to reset

### Debug Logging

Enable debug logging to troubleshoot issues:

```javascript
// In development
localStorage.setItem('DEBUG', 'wallet:*');

// Check console for detailed logs
```

## Contributing

When adding new wallet adapters or modifying authentication flow:

1. Follow existing patterns in `/src/utils/walletUtils.ts`
2. Add proper TypeScript types in `/src/types/wallet.ts`
3. Include comprehensive error handling
4. Add rate limiting for new endpoints
5. Update documentation and examples

## Resources

- [Sui Wallet Documentation](https://docs.sui.io/concepts/cryptography/transaction-auth/signatures)
- [Sui TypeScript SDK](https://github.com/MystenLabs/sui/tree/main/sdk/typescript)
- [Frontend Integration Examples](./src/examples/frontend-integration.ts)
- [API Type Definitions](./src/types/wallet.ts)