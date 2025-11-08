import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { WalrusClient } from './WalrusClientStub';
import { SealService } from './SealService';
import { NautilusService } from './NautilusService';
import { createLogger } from '../utils/logger';

const logger = createLogger();

export interface ListingData {
  title: string;
  description: string;
  price: number;
  category: string;
  fileHash: string;
  encryptionKey?: string;
  metadata?: any;
  sellerAddress: string;
}

export interface ListingFilters {
  page: number;
  limit: number;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface PurchaseData {
  listingId: string;
  buyerAddress: string;
  paymentTxHash: string;
}

export interface DownloadRequest {
  purchaseId: string;
  buyerAddress: string;
}

export class MarketplaceService {
  private suiClient: SuiClient;
  private walrusClient: WalrusClient;
  private sealService: SealService;
  private nautilusService: NautilusService;
  private contractPackageId: string;
  private marketplaceObjectId: string;

  constructor() {
    // Initialize Sui client
    const network = process.env.SUI_NETWORK || 'testnet';
    this.suiClient = new SuiClient({ url: getFullnodeUrl(network as any) });
    
    // Initialize integration services
    this.walrusClient = new WalrusClient();
    this.sealService = new SealService();
    this.nautilusService = new NautilusService();

    // Contract addresses (from deployment)
    this.contractPackageId = process.env.MARKETPLACE_PACKAGE_ID || '';
    this.marketplaceObjectId = process.env.MARKETPLACE_OBJECT_ID || '';

    if (!this.contractPackageId || !this.marketplaceObjectId) {
      logger.warn('Marketplace contract IDs not configured, using mock mode');
    }
  }

  async getListings(filters: ListingFilters) {
    try {
      // Get listings from smart contract
      const listings = await this.fetchListingsFromContract(filters);
      
      // Enrich with off-chain data
      const enrichedListings = await Promise.all(
        listings.map(async (listing: any) => {
          try {
            // Get TEE verification status
            const verification = await this.nautilusService.getVerificationStatus(listing.id);
            
            return {
              ...listing,
              verified: verification?.verified || false,
              qualityScore: verification?.qualityScore || null,
              lastUpdated: new Date().toISOString()
            };
          } catch (error) {
            logger.warn(`Failed to get verification for listing ${listing.id}:`, error);
            return listing;
          }
        })
      );

      return {
        listings: enrichedListings,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: enrichedListings.length,
          totalPages: Math.ceil(enrichedListings.length / filters.limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching listings:', error);
      throw new Error('Failed to fetch marketplace listings');
    }
  }

  async createListing(data: ListingData) {
    try {
      logger.info('Creating new marketplace listing', { title: data.title, seller: data.sellerAddress });

      // Step 1: Store file on Walrus
      const walrusUpload = await this.walrusClient.storeBlob(data.fileHash);
      if (!walrusUpload.blobId) {
        throw new Error('Failed to store file on Walrus');
      }

      // Step 2: Encrypt with SEAL (if encryption key provided)
      let sealPolicyId = null;
      if (data.encryptionKey) {
        sealPolicyId = await this.sealService.createPolicy({
          type: 'payment-gated',
          price: data.price,
          allowedBuyers: []
        });
      }

      // Step 3: Submit to Nautilus TEE for verification
      const verificationRequest = await this.nautilusService.submitVerification({
        blobId: walrusUpload.blobId,
        metadata: {
          title: data.title,
          category: data.category,
          expectedFormat: data.metadata?.format
        }
      });

      // Step 4: Create listing in smart contract
      const listingTx = await this.createListingOnChain({
        ...data,
        blobId: walrusUpload.blobId,
        sealPolicyId,
        verificationRequestId: verificationRequest.requestId
      });

      return {
        id: listingTx.objectId,
        title: data.title,
        description: data.description,
        price: data.price,
        category: data.category,
        sellerAddress: data.sellerAddress,
        blobId: walrusUpload.blobId,
        sealPolicyId,
        verificationStatus: 'pending',
        transactionHash: listingTx.digest,
        createdAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error creating listing:', error);
      throw new Error('Failed to create listing');
    }
  }

  async getListing(listingId: string) {
    try {
      // Get listing details from smart contract
      const listing = await this.fetchListingFromContract(listingId);
      if (!listing) {
        return null;
      }

      // Get additional data from services
      const [verification, downloadCount] = await Promise.all([
        this.nautilusService.getVerificationStatus(listingId),
        this.getListingStats(listingId)
      ]);

      return {
        ...listing,
        verified: verification?.verified || false,
        qualityScore: verification?.qualityScore || null,
        attestation: verification?.attestation || null,
        downloadCount: downloadCount.downloads,
        viewCount: downloadCount.views
      };

    } catch (error) {
      logger.error('Error fetching listing:', error);
      throw new Error('Failed to fetch listing details');
    }
  }

  async purchaseListing(data: PurchaseData) {
    try {
      logger.info('Processing purchase', { listingId: data.listingId, buyer: data.buyerAddress });

      // Step 1: Verify payment transaction
      const paymentValid = await this.verifyPaymentTransaction(data.paymentTxHash);
      if (!paymentValid) {
        throw new Error('Invalid payment transaction');
      }

      // Step 2: Create purchase record on-chain
      const purchaseTx = await this.createPurchaseOnChain(data);

      // Step 3: Grant SEAL access if listing is encrypted
      const listing = await this.fetchListingFromContract(data.listingId);
      if (listing.sealPolicyId) {
        await this.sealService.grantAccess({
          policyId: listing.sealPolicyId,
          buyerAddress: data.buyerAddress
        });
      }

      return {
        purchaseId: purchaseTx.objectId,
        listingId: data.listingId,
        buyerAddress: data.buyerAddress,
        amount: listing.price,
        transactionHash: purchaseTx.digest,
        accessGranted: !!listing.sealPolicyId,
        purchasedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error processing purchase:', error);
      throw new Error('Failed to process purchase');
    }
  }

  async getDownloadLink(data: DownloadRequest) {
    try {
      // Verify purchase ownership
      const purchase = await this.verifyPurchaseOwnership(data.purchaseId, data.buyerAddress);
      if (!purchase) {
        throw new Error('Purchase not found or unauthorized');
      }

      // Get listing details
      const listing = await this.fetchListingFromContract(purchase.listingId);
      if (!listing) {
        throw new Error('Listing not found');
      }

      // Generate download URL from Walrus
      const downloadUrl = await this.walrusClient.getDownloadUrl(listing.blobId);

      // If encrypted, provide decryption key
      let decryptionKey = null;
      if (listing.sealPolicyId) {
        decryptionKey = await this.sealService.getDecryptionKey({
          policyId: listing.sealPolicyId,
          buyerAddress: data.buyerAddress
        });
      }

      return {
        downloadUrl,
        decryptionKey,
        filename: listing.metadata?.filename || `${listing.title}.dat`,
        expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour expiry
        instructions: decryptionKey 
          ? 'File is encrypted. Use the provided decryption key to access content.'
          : 'File is ready for download.'
      };

    } catch (error) {
      logger.error('Error generating download link:', error);
      throw new Error('Failed to generate download link');
    }
  }

  // Private helper methods

  private async fetchListingsFromContract(filters: ListingFilters): Promise<any[]> {
    if (!this.contractPackageId) {
      // Return mock data for demo
      return this.generateMockListings(filters);
    }

    try {
      // Query smart contract for active listings
      const response = await this.suiClient.getDynamicFields({
        parentId: this.marketplaceObjectId
      });

      // Process and filter results
      const listings = await Promise.all(
        response.data.map(async (field) => {
          const listing = await this.suiClient.getObject({
            id: field.objectId,
            options: { showContent: true }
          });
          return this.parseListingObject(listing);
        })
      );

      return this.filterListings(listings, filters);
    } catch (error) {
      logger.error('Error querying contract:', error);
      return this.generateMockListings(filters);
    }
  }

  private async fetchListingFromContract(listingId: string): Promise<any> {
    if (!this.contractPackageId) {
      return this.generateMockListing(listingId);
    }

    try {
      const listing = await this.suiClient.getObject({
        id: listingId,
        options: { showContent: true }
      });

      return this.parseListingObject(listing);
    } catch (error) {
      logger.error('Error fetching listing from contract:', error);
      return null;
    }
  }

  private async createListingOnChain(data: any) {
    if (!this.contractPackageId) {
      return { objectId: `mock_${Date.now()}`, digest: `mock_tx_${Date.now()}` };
    }

    // Implementation would create actual transaction
    const tx = new TransactionBlock();
    // Add move calls for creating listing
    // Return transaction result
    return { objectId: 'pending', digest: 'pending' };
  }

  private async createPurchaseOnChain(data: PurchaseData) {
    if (!this.contractPackageId) {
      return { objectId: `purchase_${Date.now()}`, digest: `tx_${Date.now()}` };
    }

    // Implementation would create actual purchase transaction
    return { objectId: 'pending', digest: 'pending' };
  }

  private async verifyPaymentTransaction(txHash: string): Promise<boolean> {
    try {
      const tx = await this.suiClient.getTransactionBlock({
        digest: txHash,
        options: { showEffects: true }
      });

      return tx.effects?.status?.status === 'success';
    } catch (error) {
      logger.error('Error verifying payment:', error);
      return false;
    }
  }

  private async verifyPurchaseOwnership(purchaseId: string, buyerAddress: string): Promise<any> {
    // Mock implementation for demo
    return {
      listingId: 'mock_listing',
      buyerAddress,
      verified: true
    };
  }

  private async getListingStats(listingId: string) {
    // Mock implementation
    return {
      downloads: Math.floor(Math.random() * 50),
      views: Math.floor(Math.random() * 200)
    };
  }

  private parseListingObject(obj: any): any {
    // Parse Sui object into listing format
    return {
      id: obj.objectId,
      // Parse fields from object content
    };
  }

  private filterListings(listings: any[], filters: ListingFilters): any[] {
    let filtered = listings;

    if (filters.category) {
      filtered = filtered.filter(l => l.category === filters.category);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(l => 
        l.title.toLowerCase().includes(search) || 
        l.description.toLowerCase().includes(search)
      );
    }

    if (filters.minPrice !== undefined) {
      filtered = filtered.filter(l => l.price >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter(l => l.price <= filters.maxPrice!);
    }

    // Pagination
    const start = (filters.page - 1) * filters.limit;
    return filtered.slice(start, start + filters.limit);
  }

  private generateMockListings(filters: ListingFilters): any[] {
    // Generate mock data for demo
    const mockListings = [
      {
        id: 'listing_1',
        title: 'Financial Market Data Q3 2024',
        description: 'Comprehensive stock market data with real-time pricing',
        price: 2.5,
        category: 'financial',
        sellerAddress: '0x123...abc',
        createdAt: new Date().toISOString()
      },
      {
        id: 'listing_2', 
        title: 'Healthcare Analytics Dataset',
        description: 'Anonymized patient outcome data for research',
        price: 5.0,
        category: 'healthcare',
        sellerAddress: '0x456...def',
        createdAt: new Date().toISOString()
      }
    ];

    return this.filterListings(mockListings, filters);
  }

  private generateMockListing(listingId: string): any {
    return {
      id: listingId,
      title: 'Sample Dataset',
      description: 'Mock dataset for demonstration',
      price: 1.0,
      category: 'other',
      sellerAddress: '0x123...abc',
      blobId: 'mock_blob',
      createdAt: new Date().toISOString()
    };
  }
}