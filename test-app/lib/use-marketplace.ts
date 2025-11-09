import { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount, useSignTransactionBlock } from '@mysten/dapp-kit';
import { apiClient, type ListingData, type CreateListingRequest } from './api-client';
import { useAuth } from './use-auth';

export interface MarketplaceState {
  listings: ListingData[];
  isLoading: boolean;
  error: string | null;
  totalListings: number;
  currentPage: number;
}

export interface CreateListingState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export interface PurchaseState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  purchaseId?: string;
}

export function useMarketplace() {
  const { isAuthenticated } = useAuth();
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signTransactionBlock } = useSignTransactionBlock();

  const [marketplaceState, setMarketplaceState] = useState<MarketplaceState>({
    listings: [],
    isLoading: false,
    error: null,
    totalListings: 0,
    currentPage: 1,
  });

  const [createListingState, setCreateListingState] = useState<CreateListingState>({
    isLoading: false,
    error: null,
    success: false,
  });

  const [purchaseState, setPurchaseState] = useState<PurchaseState>({
    isLoading: false,
    error: null,
    success: false,
  });

  const fetchListings = useCallback(async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
  }) => {
    setMarketplaceState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await apiClient.getListings(params);
      
      if (response.success && response.data) {
        setMarketplaceState({
          listings: response.data.listings,
          isLoading: false,
          error: null,
          totalListings: response.data.total,
          currentPage: response.data.page,
        });
      } else {
        throw new Error(response.error?.message || 'Failed to fetch listings');
      }
    } catch (error) {
      console.error('Fetch listings error:', error);
      setMarketplaceState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch listings',
      }));
    }
  }, []);

  const getListing = useCallback(async (id: string): Promise<ListingData | null> => {
    try {
      const response = await apiClient.getListing(id);
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to fetch listing');
      }
    } catch (error) {
      console.error('Get listing error:', error);
      return null;
    }
  }, []);

  const createListing = useCallback(async (listingData: CreateListingRequest): Promise<boolean> => {
    if (!isAuthenticated || !currentAccount?.address) {
      setCreateListingState({
        isLoading: false,
        error: 'Please connect and authenticate your wallet',
        success: false,
      });
      return false;
    }

    setCreateListingState({ isLoading: true, error: null, success: false });

    try {
      const response = await apiClient.createListing(listingData);
      
      if (response.success && response.data) {
        // Check if we need to sign a transaction
        if (response.data.requiresUserSignature && response.data.transactionBlock) {
          try {
            const signedTx = await signTransactionBlock({
              transactionBlock: response.data.transactionBlock,
            });

            // Submit signed transaction
            const submitResponse = await apiClient.submitSignedListing(
              signedTx.transactionBlockBytes,
              signedTx.signature,
              listingData
            );

            if (submitResponse.success) {
              setCreateListingState({ isLoading: false, error: null, success: true });
              // Refresh listings
              await fetchListings();
              return true;
            } else {
              throw new Error(submitResponse.error?.message || 'Failed to submit signed transaction');
            }
          } catch (signError) {
            throw new Error(`Transaction signing failed: ${signError}`);
          }
        } else {
          setCreateListingState({ isLoading: false, error: null, success: true });
          // Refresh listings
          await fetchListings();
          return true;
        }
      } else {
        throw new Error(response.error?.message || 'Failed to create listing');
      }
    } catch (error) {
      console.error('Create listing error:', error);
      setCreateListingState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create listing',
        success: false,
      });
      return false;
    }
  }, [isAuthenticated, currentAccount?.address, signTransactionBlock, fetchListings]);

  const purchaseListing = useCallback(async (listingId: string): Promise<boolean> => {
    if (!isAuthenticated || !currentAccount?.address) {
      setPurchaseState({
        isLoading: false,
        error: 'Please connect and authenticate your wallet',
        success: false,
      });
      return false;
    }

    setPurchaseState({ isLoading: true, error: null, success: false });

    try {
      const response = await apiClient.purchaseListing({ listingId });
      
      if (response.success && response.data) {
        // Check if we need to sign a transaction
        if (response.data.requiresUserSignature && response.data.transactionBlock) {
          try {
            const signedTx = await signTransactionBlock({
              transactionBlock: response.data.transactionBlock,
            });

            // Submit signed transaction
            const submitResponse = await apiClient.submitSignedPurchase(
              signedTx.transactionBlockBytes,
              signedTx.signature,
              { listingId }
            );

            if (submitResponse.success) {
              setPurchaseState({ 
                isLoading: false, 
                error: null, 
                success: true,
                purchaseId: submitResponse.data?.purchaseId 
              });
              return true;
            } else {
              throw new Error(submitResponse.error?.message || 'Failed to submit signed purchase');
            }
          } catch (signError) {
            throw new Error(`Transaction signing failed: ${signError}`);
          }
        } else {
          setPurchaseState({ 
            isLoading: false, 
            error: null, 
            success: true,
            purchaseId: response.data.purchaseId 
          });
          return true;
        }
      } else {
        throw new Error(response.error?.message || 'Failed to purchase listing');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      setPurchaseState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to purchase listing',
        success: false,
      });
      return false;
    }
  }, [isAuthenticated, currentAccount?.address, signTransactionBlock]);

  const getDownloadLink = useCallback(async (purchaseId: string): Promise<string | null> => {
    try {
      const response = await apiClient.getDownloadLink(purchaseId);
      if (response.success && response.data) {
        return response.data.downloadUrl;
      } else {
        throw new Error(response.error?.message || 'Failed to get download link');
      }
    } catch (error) {
      console.error('Download link error:', error);
      return null;
    }
  }, []);

  // Reset states
  const resetCreateListingState = useCallback(() => {
    setCreateListingState({ isLoading: false, error: null, success: false });
  }, []);

  const resetPurchaseState = useCallback(() => {
    setPurchaseState({ isLoading: false, error: null, success: false });
  }, []);

  // Load listings on mount
  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return {
    marketplaceState,
    createListingState,
    purchaseState,
    fetchListings,
    getListing,
    createListing,
    purchaseListing,
    getDownloadLink,
    resetCreateListingState,
    resetPurchaseState,
  };
}