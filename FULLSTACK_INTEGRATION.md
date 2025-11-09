# Satya Marketplace - Full Stack Integration

This document outlines the complete frontend-backend integration for the Satya Data Marketplace, connecting the React frontend with the TypeScript API backend that includes Sui wallet integration, Walrus storage, SEAL encryption, and Nautilus TEE verification.

## Architecture Overview

### Backend API (`/api`)
- **Location**: `/Users/eromonseleodigie/Satya/api/`
- **Framework**: Express.js with TypeScript
- **Port**: 3001
- **Features**:
  - Sui wallet authentication with signature verification
  - Marketplace operations (create/list/purchase listings)
  - Walrus storage integration
  - SEAL encryption services
  - Nautilus TEE verification
  - Rate limiting and security middleware

### Frontend App (`/test-app`)
- **Location**: `/Users/eromonseleodigie/Satya/test-app/`
- **Framework**: Next.js 16 with React 19 and TypeScript
- **Port**: 3000
- **Features**:
  - Sui wallet integration with @mysten/dapp-kit
  - Real-time marketplace browsing and purchasing
  - Seller dashboard for listing creation
  - Wallet authentication and session management
  - Integrated Walrus file upload/download
  - Nautilus TEE data verification

## Configuration

### Environment Variables

#### Backend API (`.env`)
```bash
PORT=3001
FRONTEND_URL=http://localhost:3000

# Sui Configuration
SUI_NETWORK=testnet
SUI_RPC_URL=https://fullnode.testnet.sui.io:443

# Marketplace Contracts
MARKETPLACE_PACKAGE_ID=0xecc6c881f3d4710978a7782855588f8313a59b5cf390625fb9389ef2fd0bfaf0
MARKETPLACE_OBJECT_ID=0x4327bff4225a7418a3623534e2ffecb215f933cdfb61a63dbaed2bb09b3d7dd2

# JWT Configuration
JWT_SECRET=your-secret-key-here
```

#### Frontend App (`.env.local`)
```bash
# Backend API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_API_TIMEOUT=30000

# Sui Configuration
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.testnet.sui.io:443

# App Configuration
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_MOCK_MODE=false
```

## Key Integration Components

### 1. Authentication Flow
- **Frontend**: Uses `useAuth()` hook with Sui wallet signing
- **Backend**: JWT-based authentication with wallet signature verification
- **Process**:
  1. Frontend requests nonce from `/api/auth/nonce/:walletAddress`
  2. User signs authentication message with wallet
  3. Frontend sends signature to `/api/auth/wallet`
  4. Backend verifies signature and returns JWT token
  5. Token used for authenticated API calls

### 2. API Client Integration
- **File**: `/test-app/lib/api-client.ts`
- **Purpose**: Centralized HTTP client with automatic JWT token management
- **Features**:
  - Automatic token injection in request headers
  - Error handling and token refresh
  - Typed response interfaces
  - Timeout configuration

### 3. Marketplace Operations

#### Listing Creation
- **Frontend**: `useMarketplace()` hook with `createListing()`
- **Backend**: `/api/marketplace/listings` (POST)
- **Process**:
  1. Upload file to Walrus storage
  2. Generate file hash for verification
  3. Create blockchain transaction
  4. User signs transaction with wallet
  5. Submit signed transaction to complete listing

#### Purchase Flow
- **Frontend**: `purchaseListing()` function
- **Backend**: `/api/marketplace/purchase` (POST)
- **Process**:
  1. Create purchase transaction
  2. User signs payment transaction
  3. Execute smart contract call
  4. Grant access to encrypted data

### 4. File Upload/Download
- **Upload**: Integrated with Walrus storage via `/api/walrus/upload`
- **Download**: Secure download links via `/api/marketplace/downloads/:purchaseId`
- **Client**: Enhanced `WalrusClient` with real API integration

### 5. Wallet Integration
- **Provider**: `@mysten/dapp-kit` with Sui testnet
- **Features**: Auto-connect, transaction signing, account management
- **UI**: `ConnectButton` component in header for wallet connection

## Updated Frontend Components

### 1. Buyer Marketplace (`/test-app/components/buyer-marketplace.tsx`)
- Real API integration for listing browsing
- Wallet authentication checks
- Purchase flow with transaction signing
- Download functionality for purchased data
- Error handling and loading states

### 2. Seller Dashboard (`/test-app/components/seller-dashboard.tsx`)
- File upload to Walrus storage
- Listing creation with blockchain integration
- Real-time status tracking
- Authentication requirements

### 3. API Service Hooks
- **`useAuth()`**: Wallet authentication management
- **`useMarketplace()`**: Marketplace operations
- **Custom clients**: WalrusClient, NautilusClient integration

## Running the Full Stack

### 1. Start the Backend API
```bash
cd /Users/eromonseleodigie/Satya/api
npm install
npm run build
npm start
```
The API will be available at `http://localhost:3001`

### 2. Start the Frontend App
```bash
cd /Users/eromonseleodigie/Satya/test-app
pnpm install
pnpm dev
```
The frontend will be available at `http://localhost:3000`

### 3. Connect Your Wallet
1. Open `http://localhost:3000` in your browser
2. Click the "Connect Wallet" button in the header
3. Connect a Sui wallet (Sui Wallet, Suiet, etc.)
4. Sign the authentication message when prompted

## API Endpoints Integration

### Authentication
- `GET /api/auth/nonce/:walletAddress` - Get signing nonce
- `POST /api/auth/wallet` - Authenticate with wallet signature

### Marketplace
- `GET /api/marketplace/listings` - Browse all listings
- `GET /api/marketplace/listings/:id` - Get specific listing
- `POST /api/marketplace/listings` - Create new listing (authenticated)
- `POST /api/marketplace/purchase` - Purchase listing (authenticated)
- `GET /api/marketplace/downloads/:purchaseId` - Get download link (authenticated)

### Walrus Storage
- `POST /api/walrus/upload` - Upload file to Walrus
- `GET /api/walrus/download/:blobId` - Download file from Walrus
- `GET /api/walrus/info/:blobId` - Get file information

### Nautilus TEE
- `POST /api/nautilus/verify` - Request data verification
- `GET /api/nautilus/attestation/:requestId` - Get attestation result
- `POST /api/nautilus/process` - Process data in enclave

## Security Features

1. **CORS**: Configured to allow frontend origin
2. **Rate Limiting**: Applied to all API endpoints
3. **Authentication**: JWT-based with wallet signature verification
4. **Input Validation**: Express-validator on all endpoints
5. **Error Handling**: Comprehensive error middleware
6. **Helmet**: Security headers middleware

## Testing the Integration

### 1. Create a Listing
1. Navigate to the "Sell Data" tab
2. Fill in listing details (title, description, category, price)
3. Upload a file
4. Click "Create Listing" and sign the transaction

### 2. Browse and Purchase
1. Navigate to the "Marketplace" tab
2. Browse available listings
3. Click "Preview" to verify data with Nautilus
4. Click "Buy" and sign the purchase transaction

### 3. Download Purchased Data
1. Navigate to "My Purchases" tab
2. Click "Download Dataset" for completed purchases

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure backend FRONTEND_URL matches frontend origin
2. **Wallet Connection**: Check Sui wallet extension is installed and connected to testnet
3. **API Timeout**: Increase NEXT_PUBLIC_API_TIMEOUT if operations are slow
4. **Transaction Failures**: Ensure wallet has sufficient SUI balance for gas fees

### Debug Mode
Set `NEXT_PUBLIC_DEBUG_MODE=true` in frontend environment to enable detailed logging.

## Architecture Benefits

1. **Separation of Concerns**: Clean API layer with frontend abstraction
2. **Type Safety**: Full TypeScript integration across stack
3. **Scalability**: Modular service architecture
4. **Security**: Multi-layer authentication and validation
5. **Developer Experience**: Hot reloading, error boundaries, loading states
6. **Blockchain Integration**: Native Sui wallet and smart contract support

This integration provides a complete, production-ready data marketplace with Web3 authentication, decentralized storage, and trusted execution environments.