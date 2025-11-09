import { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit';
import { apiClient } from './api-client';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  walletAddress: string | null;
  token: string | null;
}

export function useAuth() {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signMessage } = useSignPersonalMessage();
  
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    walletAddress: null,
    token: null,
  });

  const authenticate = useCallback(async () => {
    if (!currentAccount?.address) {
      setAuthState(prev => ({ 
        ...prev, 
        error: 'No wallet connected',
        isAuthenticated: false,
        token: null 
      }));
      return false;
    }

    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get nonce from backend
      const nonceResponse = await apiClient.getNonce(currentAccount.address);
      if (!nonceResponse.success || !nonceResponse.data) {
        throw new Error(nonceResponse.error?.message || 'Failed to get nonce');
      }

      const nonce = nonceResponse.data.nonce;
      
      // Create message to sign
      const message = `Login to Satya Marketplace\nNonce: ${nonce}\nAddress: ${currentAccount.address}`;
      
      // Sign message with wallet
      const signatureResult = await signMessage({
        message: new TextEncoder().encode(message),
      });

      // Authenticate with backend
      const authResponse = await apiClient.authenticateWallet(
        currentAccount.address,
        signatureResult.signature
      );

      if (authResponse.success && authResponse.data?.token) {
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          error: null,
          walletAddress: currentAccount.address,
          token: authResponse.data.token,
        });
        return true;
      } else {
        throw new Error(authResponse.error?.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
        isAuthenticated: false,
        token: null,
      }));
      return false;
    }
  }, [currentAccount?.address, signMessage]);

  const logout = useCallback(() => {
    apiClient.clearAuthToken();
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      error: null,
      walletAddress: null,
      token: null,
    });
  }, []);

  // Auto-authenticate when wallet is connected
  useEffect(() => {
    if (currentAccount?.address && !authState.isAuthenticated && !authState.isLoading) {
      authenticate();
    } else if (!currentAccount?.address && authState.isAuthenticated) {
      logout();
    }
  }, [currentAccount?.address, authState.isAuthenticated, authState.isLoading, authenticate, logout]);

  return {
    ...authState,
    authenticate,
    logout,
  };
}