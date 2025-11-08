/**
 * TypeScript definitions for Sui wallet integration
 */

// Wallet Connection Types
export interface WalletInfo {
  name: string;
  icon: string;
  downloadUrl?: string;
}

export interface ConnectedWallet {
  address: string;
  publicKey: string;
  walletType: string;
  connected: boolean;
}

// Authentication Types
export interface AuthChallenge {
  message: string;
  nonce: string;
  timestamp: number;
  walletAddress: string;
}

export interface AuthVerificationRequest {
  walletAddress: string;
  signature: string;
  signedMessage: string;
  publicKey?: string;
}

export interface AuthSession {
  sessionToken: string;
  walletAddress: string;
  expiresAt: string;
  tokenType: 'Bearer';
}

// Transaction Types
export interface TransactionRequest {
  type: 'create_listing' | 'purchase_listing' | 'transfer' | 'update_listing' | 'cancel_listing';
  params: any;
  walletAddress: string;
  gasBudget?: number;
}

export interface UnsignedTransaction {
  transactionBlock: string; // Base64 encoded transaction bytes
  digest?: string;
  gasEstimate: GasEstimate;
  requiresApproval: boolean;
}

export interface SignedTransaction {
  transactionBlockBytes: string;
  signature: string;
  transactionDigest?: string;
}

export interface TransactionResult {
  digest: string;
  status: 'success' | 'failure';
  effects?: any;
  events?: any[];
  objectChanges?: ObjectChange[];
  balanceChanges?: BalanceChange[];
  gasUsed?: GasUsed;
  error?: string;
}

// Gas and Balance Types
export interface GasEstimate {
  computationCost: number;
  storageCost: number;
  storageRebate: number;
  totalCost: number;
}

export interface GasUsed {
  computationCost: string;
  storageCost: string;
  storageRebate: string;
  nonRefundableStorageFee: string;
}

export interface BalanceInfo {
  total: number;
  available: number;
  locked: number;
  formatted: string;
  coinType: string;
}

export interface BalanceChange {
  owner: string;
  coinType: string;
  amount: string;
}

// Object Changes
export interface ObjectChange {
  type: 'created' | 'mutated' | 'deleted' | 'wrapped' | 'published';
  sender?: string;
  owner?: string;
  objectType?: string;
  objectId?: string;
  version?: string;
  previousVersion?: string;
  digest?: string;
}

// Marketplace Specific Types
export interface ListingTransaction {
  type: 'create_listing';
  listingData: {
    title: string;
    description: string;
    price: number;
    category: string;
    fileHash: string;
    encryptionKey?: string;
    metadata?: any;
  };
}

export interface PurchaseTransaction {
  type: 'purchase_listing';
  purchaseData: {
    listingId: string;
    amount: number;
  };
}

export interface TransferTransaction {
  type: 'transfer';
  transferData: {
    recipient: string;
    amount: number;
    coinType?: string;
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  message?: string;
  timestamp?: string;
}

export interface WalletAuthResponse extends ApiResponse<AuthSession> {}

export interface TransactionResponse extends ApiResponse<UnsignedTransaction> {}

export interface TransactionSubmissionResponse extends ApiResponse<TransactionResult> {}

// Error Types
export interface WalletError {
  code: string;
  message: string;
  details?: any;
}

export type WalletErrorCode = 
  | 'WALLET_NOT_CONNECTED'
  | 'WALLET_NOT_INSTALLED'
  | 'USER_REJECTED'
  | 'INSUFFICIENT_BALANCE'
  | 'TRANSACTION_FAILED'
  | 'NETWORK_ERROR'
  | 'INVALID_ADDRESS'
  | 'SIGNATURE_FAILED'
  | 'SESSION_EXPIRED'
  | 'RATE_LIMITED'
  | 'VALIDATION_ERROR';

// Rate Limiting Types
export interface RateLimitInfo {
  totalOperations: number;
  operationsByType: { [key: string]: number };
  resetTime: number;
  remaining: number;
}

export interface WalletUsage {
  walletAddress: string;
  rateLimitInfo: RateLimitInfo;
  dailyTransactions: number;
  monthlyVolume: number;
}

// Frontend Integration Types
export interface WalletAdapter {
  name: string;
  icon: string;
  url: string;
  isInstalled(): boolean;
  connect(): Promise<ConnectedWallet>;
  disconnect(): Promise<void>;
  signMessage(message: string): Promise<string>;
  signTransaction(transaction: UnsignedTransaction): Promise<SignedTransaction>;
  getPublicKey(): Promise<string>;
  getAddress(): Promise<string>;
}

export interface WalletContextState {
  wallet: ConnectedWallet | null;
  connecting: boolean;
  connected: boolean;
  session: AuthSession | null;
  balance: BalanceInfo | null;
  usage: WalletUsage | null;
  connect: (walletName: string) => Promise<void>;
  disconnect: () => Promise<void>;
  authenticate: () => Promise<void>;
  signTransaction: (transaction: UnsignedTransaction) => Promise<SignedTransaction>;
  refreshBalance: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// Configuration Types
export interface SuiWalletConfig {
  network: 'mainnet' | 'testnet' | 'devnet' | 'localnet';
  rpcUrl?: string;
  faucetUrl?: string;
  explorerUrl?: string;
}

export interface ApiConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
  rateLimiting?: {
    maxRequests: number;
    windowMs: number;
  };
}

// Utility Types
export type SuiAddress = string;
export type TransactionDigest = string;
export type ObjectId = string;
export type Base64String = string;
export type HexString = string;