/**
 * Frontend Integration Examples for Sui Wallet Authentication and Transaction Signing
 * 
 * This file provides complete examples of how to integrate with the Sui wallet API
 * from a frontend application (React/Next.js/Vue/Angular)
 */

import { 
  WalletAdapter, 
  AuthChallenge, 
  AuthSession, 
  UnsignedTransaction,
  SignedTransaction,
  TransactionResult,
  ApiResponse 
} from '../types/wallet';

// ============================================================================
// 1. API CLIENT UTILITY
// ============================================================================

class SatyaApiClient {
  private baseUrl: string;
  private session: AuthSession | null = null;

  constructor(baseUrl: string = 'http://localhost:3001/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    // Add auth header if we have a session
    if (this.session?.sessionToken) {
      headers.Authorization = `Bearer ${this.session.sessionToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json() as ApiResponse<T>;
    
    if (!response.ok) {
      throw new Error((data as any).error?.message || 'API request failed');
    }

    return data;
  }

  // Authentication methods
  async getAuthChallenge(walletAddress: string): Promise<AuthChallenge> {
    const response = await this.request<AuthChallenge>('/auth/challenge', {
      method: 'POST',
      body: JSON.stringify({ walletAddress }),
    });
    return response.data!;
  }

  async verifyAuthSignature(
    walletAddress: string,
    signature: string,
    signedMessage: string,
    publicKey?: string
  ): Promise<AuthSession> {
    const response = await this.request<AuthSession>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({
        walletAddress,
        signature,
        signedMessage,
        publicKey,
      }),
    });
    
    this.session = response.data!;
    return this.session;
  }

  async refreshSession(): Promise<AuthSession> {
    const response = await this.request<AuthSession>('/auth/refresh', {
      method: 'POST',
    });
    
    this.session = response.data!;
    return this.session;
  }

  // Marketplace methods
  async createListing(listingData: any): Promise<UnsignedTransaction> {
    const response = await this.request<UnsignedTransaction>('/marketplace/listings', {
      method: 'POST',
      body: JSON.stringify(listingData),
    });
    return response.data!;
  }

  async submitSignedListingTransaction(
    transactionBlock: string,
    signature: string,
    listingData: any
  ): Promise<TransactionResult> {
    const response = await this.request<TransactionResult>('/marketplace/listings/submit-signed', {
      method: 'POST',
      body: JSON.stringify({
        transactionBlock,
        signature,
        listingData,
      }),
    });
    return response.data!;
  }

  async purchaseListing(listingId: string): Promise<UnsignedTransaction> {
    const response = await this.request<UnsignedTransaction>('/marketplace/purchase', {
      method: 'POST',
      body: JSON.stringify({ listingId }),
    });
    return response.data!;
  }

  async submitSignedPurchaseTransaction(
    transactionBlock: string,
    signature: string,
    purchaseData: any
  ): Promise<TransactionResult> {
    const response = await this.request<TransactionResult>('/marketplace/purchase/submit-signed', {
      method: 'POST',
      body: JSON.stringify({
        transactionBlock,
        signature,
        purchaseData,
      }),
    });
    return response.data!;
  }

  async estimateGas(transactionBlock: string): Promise<any> {
    const response = await this.request('/auth/estimate-gas', {
      method: 'POST',
      body: JSON.stringify({ transactionBlock }),
    });
    return response.data!;
  }

  // Getters
  getSession(): AuthSession | null {
    return this.session;
  }

  isAuthenticated(): boolean {
    return !!this.session && new Date(this.session.expiresAt) > new Date();
  }

  logout(): void {
    this.session = null;
  }
}

// ============================================================================
// 2. WALLET ADAPTER FOR SUI WALLET
// ============================================================================

// Browser environment type declarations
interface WindowWithWallet {
  suiWallet?: {
    requestPermissions: (options: any) => Promise<any>;
    getAccounts: () => Promise<string[]>;
    disconnect?: () => Promise<void>;
    signPersonalMessage: (options: any) => Promise<any>;
    signTransactionBlock: (options: any) => Promise<any>;
  };
}

declare const window: WindowWithWallet;

class SuiWalletAdapter implements WalletAdapter {
  name = 'Sui Wallet';
  icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiI+PC9zdmc+';
  url = 'https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil';

  isInstalled(): boolean {
    return typeof window !== 'undefined' && !!(window as any).suiWallet;
  }

  async connect(): Promise<any> {
    if (!this.isInstalled()) {
      throw new Error('Sui Wallet is not installed');
    }

    try {
      const wallet = (window as any).suiWallet;
      const permission = await wallet.requestPermissions({
        permissions: ['viewAccount'],
      });

      if (!permission) {
        throw new Error('User rejected connection');
      }

      const accounts = await wallet.getAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      return {
        address: accounts[0],
        publicKey: '', // Would be populated by the wallet
        walletType: this.name,
        connected: true,
      };
    } catch (error) {
      throw new Error(`Connection failed: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.isInstalled() && (window as any).suiWallet) {
      await (window as any).suiWallet.disconnect?.();
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.isInstalled()) {
      throw new Error('Sui Wallet is not installed');
    }

    try {
      const wallet = (window as any).suiWallet;
      const result = await wallet.signPersonalMessage({
        message: new TextEncoder().encode(message),
      });

      return result.signature;
    } catch (error) {
      throw new Error(`Message signing failed: ${error}`);
    }
  }

  async signTransaction(transaction: UnsignedTransaction): Promise<SignedTransaction> {
    if (!this.isInstalled()) {
      throw new Error('Sui Wallet is not installed');
    }

    try {
      const wallet = (window as any).suiWallet;
      const result = await wallet.signTransactionBlock({
        transactionBlock: transaction.transactionBlock,
      });

      return {
        transactionBlockBytes: result.transactionBlockBytes,
        signature: result.signature,
      };
    } catch (error) {
      throw new Error(`Transaction signing failed: ${error}`);
    }
  }

  async getPublicKey(): Promise<string> {
    // Implementation depends on wallet API
    throw new Error('Method not implemented');
  }

  async getAddress(): Promise<string> {
    if (!this.isInstalled()) {
      throw new Error('Sui Wallet is not installed');
    }

    const accounts = await (window as any).suiWallet?.getAccounts();
    return accounts?.[0] || '';
  }
}

// ============================================================================
// 3. REACT HOOK FOR WALLET INTEGRATION (Pseudo-code for reference)
// ============================================================================

// Note: This would require React imports in an actual React application
// import { useState, useEffect, useCallback, createContext, useContext } from 'react';

interface WalletContextState {
  wallet: any | null;
  connecting: boolean;
  connected: boolean;
  session: AuthSession | null;
  apiClient: SatyaApiClient;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  authenticate: () => Promise<void>;
  signTransaction: (transaction: UnsignedTransaction) => Promise<SignedTransaction>;
  createListing: (listingData: any) => Promise<TransactionResult>;
  purchaseListing: (listingId: string) => Promise<TransactionResult>;
}

// In a React application, you would create context like this:
// const WalletContext = createContext<WalletContextState | null>(null);

// Hook for accessing wallet context
function useWallet(): WalletContextState {
  // In React: const context = useContext(WalletContext);
  // For demo purposes, return a mock implementation
  throw new Error('This is example code. Implement with actual React hooks.');
}

// Wallet Management Class (Plain TypeScript Implementation)
class WalletManager {
  private wallet: any | null = null;
  private connecting: boolean = false;
  private connected: boolean = false;
  private session: AuthSession | null = null;
  
  private apiClient = new SatyaApiClient();
  private walletAdapter = new SuiWalletAdapter();

  async connect(): Promise<void> {
    if (this.connecting || this.connected) return;

    this.connecting = true;
    try {
      const walletInfo = await this.walletAdapter.connect();
      this.wallet = walletInfo;
      this.connected = true;
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    } finally {
      this.connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.walletAdapter.disconnect();
      this.wallet = null;
      this.connected = false;
      this.session = null;
      this.apiClient.logout();
    } catch (error) {
      console.error('Wallet disconnection failed:', error);
    }
  }

  async authenticate(): Promise<AuthSession> {
    if (!this.wallet?.address) {
      throw new Error('Wallet not connected');
    }

    try {
      // Get authentication challenge
      const challenge = await this.apiClient.getAuthChallenge(this.wallet.address);
      
      // Sign the challenge message
      const signature = await this.walletAdapter.signMessage(challenge.message);
      
      // Verify the signature and get session
      const authSession = await this.apiClient.verifyAuthSignature(
        this.wallet.address,
        signature,
        challenge.message,
        this.wallet.publicKey
      );
      
      this.session = authSession;
      return authSession;
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  }

  async signTransaction(transaction: UnsignedTransaction): Promise<SignedTransaction> {
    if (!this.wallet?.address) {
      throw new Error('Wallet not connected');
    }

    return await this.walletAdapter.signTransaction(transaction);
  }

  async createListing(listingData: any): Promise<TransactionResult> {
    if (!this.session) {
      throw new Error('Not authenticated');
    }

    try {
      // Create the unsigned transaction
      const unsignedTx = await this.apiClient.createListing(listingData);
      
      // Sign the transaction
      const signedTx = await this.signTransaction(unsignedTx);
      
      // Submit the signed transaction
      const result = await this.apiClient.submitSignedListingTransaction(
        signedTx.transactionBlockBytes,
        signedTx.signature,
        listingData
      );
      
      return result;
    } catch (error) {
      console.error('Listing creation failed:', error);
      throw error;
    }
  }

  async purchaseListing(listingId: string): Promise<TransactionResult> {
    if (!this.session) {
      throw new Error('Not authenticated');
    }

    try {
      // Create the unsigned transaction
      const unsignedTx = await this.apiClient.purchaseListing(listingId);
      
      // Sign the transaction
      const signedTx = await this.signTransaction(unsignedTx);
      
      // Submit the signed transaction
      const result = await this.apiClient.submitSignedPurchaseTransaction(
        signedTx.transactionBlockBytes,
        signedTx.signature,
        { listingId, buyerAddress: this.wallet?.address }
      );
      
      return result;
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  // Getters
  getWallet() { return this.wallet; }
  isConnecting() { return this.connecting; }
  isConnected() { return this.connected; }
  getSession() { return this.session; }
  isAuthenticated() { return !!this.session; }
}

// ============================================================================
// 4. USAGE EXAMPLES
// ============================================================================

// Example usage of the WalletManager
async function exampleUsage() {
  const walletManager = new WalletManager();

  try {
    // Connect wallet
    await walletManager.connect();
    console.log('Wallet connected:', walletManager.getWallet());

    // Authenticate
    const session = await walletManager.authenticate();
    console.log('Authenticated with session:', session);

    // Create a listing
    const listingData = {
      title: 'Sample Dataset',
      description: 'A test dataset for demonstration',
      price: 1.0,
      category: 'other',
      fileHash: 'sample_hash_123',
    };

    const listingResult = await walletManager.createListing(listingData);
    console.log('Listing created:', listingResult);

    // Purchase a listing
    const purchaseResult = await walletManager.purchaseListing('listing_id_123');
    console.log('Purchase completed:', purchaseResult);

  } catch (error) {
    console.error('Wallet operation failed:', error);
  } finally {
    // Cleanup
    await walletManager.disconnect();
  }
}

// Example of direct API usage
async function directApiExample() {
  const apiClient = new SatyaApiClient();
  const walletAdapter = new SuiWalletAdapter();

  try {
    // Connect wallet directly
    const wallet = await walletAdapter.connect();
    console.log('Connected to wallet:', wallet.address);

    // Get authentication challenge
    const challenge = await apiClient.getAuthChallenge(wallet.address);
    console.log('Auth challenge:', challenge.nonce);

    // Sign authentication message
    const signature = await walletAdapter.signMessage(challenge.message);

    // Verify signature and get session
    const session = await apiClient.verifyAuthSignature(
      wallet.address,
      signature,
      challenge.message
    );
    console.log('Session token:', session.sessionToken);

  } catch (error) {
    console.error('Direct API usage failed:', error);
  }
}

export default {
  SatyaApiClient,
  SuiWalletAdapter,
  WalletManager,
  useWallet,
  exampleUsage,
  directApiExample,
};