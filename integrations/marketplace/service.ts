import { SealEncryptionService } from '../seal/services/encryption-service';
import { WalrusStorageService } from '../walrus/services/storage-service';
import { NautilusClient } from '../nautilus/client';
import { SuiClient } from '@mysten/sui.js/client';
import {
  DataListing,
  PurchaseRequest,
  DataAccess,
  DisputeRequest,
  MarketplaceError,
  ErrorCode,
  OperationResult
} from '../types';

interface MarketplaceConfig {
  suiNetwork: string;
  marketplacePackageId: string;
  nautilusUrl: string;
}

export class MarketplaceService {
  private seal: SealEncryptionService;
  private walrus: WalrusStorageService;
  private nautilus: NautilusClient;
  private sui: SuiClient;
  private listings: Map<string, DataListing> = new Map();
  private accessRecords: Map<string, DataAccess> = new Map();
  
  constructor(config: MarketplaceConfig) {
    this.seal = new SealEncryptionService();
    this.walrus = new WalrusStorageService();
    this.nautilus = new NautilusClient({
      enclaveUrl: config.nautilusUrl,
      suiNetwork: config.suiNetwork,
      marketplacePackageId: config.marketplacePackageId
    });
    this.sui = new SuiClient({ url: this.getNetworkUrl(config.suiNetwork) });
  }

  async listDataForSale(params: {
    data: File | Uint8Array;
    title: string;
    description: string;
    price: bigint;
    category: string;
    seller: string;
    allowedBuyers?: string[];
    sampleData?: Uint8Array;
  }): Promise<DataListing> {
    try {
      const dataBytes = params.data instanceof File 
        ? new Uint8Array(await params.data.arrayBuffer())
        : params.data;
      
      const dataHash = await this.hashData(dataBytes);
      
      const encryptionPolicy = await this.seal.createPolicy('MARKETPLACE', {
        seller: params.seller,
        allowedBuyers: params.allowedBuyers || [],
        expiryHours: 24 * 30
      });
      
      const encrypted = await this.seal.encryptData(
        dataBytes,
        'MARKETPLACE',
        { policyId: encryptionPolicy.id }
      );
      
      const uploadResult = await this.walrus.uploadData(encrypted.ciphertext, {
        epochs: 5,
        metadata: {
          encrypted: true,
          policyId: encryptionPolicy.id,
          dataHash
        }
      });
      
      let attestationId: string | undefined;
      if (params.sampleData) {
        const attestation = await this.nautilus.uploadFile({
          file: params.sampleData,
          type: 'sample'
        });
        attestationId = attestation.attestation_id;
      }
      
      const listing: DataListing = {
        id: this.generateListingId(),
        seller: params.seller,
        title: params.title,
        description: params.description,
        price: params.price,
        category: params.category,
        size: dataBytes.length,
        sampleAvailable: !!params.sampleData,
        encryptedBlobId: uploadResult.blobId,
        encryptionPolicyId: encryptionPolicy.id,
        dataHash,
        attestationId,
        allowedBuyers: params.allowedBuyers,
        maxDownloads: 100,
        createdAt: new Date(),
        isActive: true
      };
      
      await this.registerListingOnChain(listing);
      
      // Store in memory for testing
      this.listings.set(listing.id, listing);
      
      return listing;
    } catch (error) {
      throw new MarketplaceError(
        ErrorCode.STORAGE_FAILED,
        `Failed to list data: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async purchaseData(request: PurchaseRequest): Promise<DataAccess> {
    try {
      const listing = await this.getListing(request.listingId);
      
      if (request.paymentAmount < listing.price) {
        throw new MarketplaceError(
          ErrorCode.INSUFFICIENT_PAYMENT,
          'Insufficient payment amount'
        );
      }
      
      await this.createEscrowPayment({
        listing,
        buyer: request.buyer,
        amount: request.paymentAmount
      });
      
      await this.seal.grantAccess(
        listing.encryptionPolicyId,
        request.buyer,
        request.accessDuration || 24
      );
      
      const access: DataAccess = {
        listingId: request.listingId,
        buyer: request.buyer,
        expiresAt: new Date(Date.now() + (request.accessDuration || 24) * 60 * 60 * 1000),
        downloadCount: 0
      };
      
      // Store access record
      this.accessRecords.set(`${request.listingId}:${request.buyer}`, access);
      
      return access;
    } catch (error) {
      if (error instanceof MarketplaceError) {
        throw error;
      }
      throw new MarketplaceError(
        ErrorCode.NETWORK_ERROR,
        `Purchase failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async downloadPurchasedData(
    listingId: string,
    buyer: string,
    verifyInEnclave: boolean = false
  ): Promise<Uint8Array> {
    try {
      const access = await this.verifyAccess(listingId, buyer);
      if (!access) {
        throw new MarketplaceError(ErrorCode.ACCESS_DENIED, 'No valid access found');
      }
      
      const listing = await this.getListing(listingId);
      const encryptedData = await this.walrus.downloadBlob(listing.encryptedBlobId);
      
      if (verifyInEnclave) {
        const verification = await this.nautilus.processFile({
          fileId: listing.encryptedBlobId,
          operation: 'verify',
          metadata: { expectedHash: listing.dataHash }
        });
        
        if (!verification.valid) {
          throw new MarketplaceError(ErrorCode.HASH_MISMATCH, 'Data verification failed');
        }
        
        access.attestation = verification.attestation;
      }
      
      const decrypted = await this.seal.decryptData(
        encryptedData,
        listing.encryptionPolicyId,
        { requester: buyer }
      );
      
      const downloadedHash = await this.hashData(decrypted.data);
      if (downloadedHash !== listing.dataHash) {
        throw new MarketplaceError(ErrorCode.HASH_MISMATCH, 'Data integrity check failed');
      }
      
      access.downloadCount++;
      await this.updateAccessRecord(access);
      
      if (access.downloadCount === 1) {
        await this.releaseEscrowPayment(listingId, buyer);
      }
      
      return decrypted.data;
    } catch (error) {
      if (error instanceof MarketplaceError) {
        throw error;
      }
      throw new MarketplaceError(
        ErrorCode.NETWORK_ERROR,
        `Download failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async verifyDataSample(listingId: string, sampleData: Uint8Array): Promise<{
    valid: boolean;
    attestation: string;
    metrics?: any;
  }> {
    const listing = await this.getListing(listingId);
    
    const result = await this.nautilus.uploadFile({
      file: sampleData,
      type: 'verification'
    });
    
    const attestation = await this.nautilus.createAttestation({
      fileId: result.file_id,
      operation: 'sample_verification',
      metadata: {
        listingId,
        expectedHash: listing.dataHash,
        timestamp: Date.now()
      }
    });
    
    return {
      valid: true,
      attestation: attestation.id,
      metrics: attestation.metadata
    };
  }

  async disputePurchase(params: DisputeRequest): Promise<void> {
    await this.freezeEscrow(params.listingId, params.buyer);
    
    const listing = await this.getListing(params.listingId);
    const encryptedData = await this.walrus.downloadBlob(listing.encryptedBlobId);
    
    const disputeAttestation = await this.nautilus.createAttestation({
      fileId: listing.encryptedBlobId,
      operation: 'dispute_verification',
      metadata: {
        listingId: params.listingId,
        buyer: params.buyer,
        reason: params.reason,
        evidence: params.evidence,
        timestamp: Date.now()
      }
    });
    
    await this.submitToArbitration({
      dispute: params,
      attestation: disputeAttestation
    });
  }

  private async hashData(data: Uint8Array): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private generateListingId(): string {
    return `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getNetworkUrl(network: string): string {
    const networks: Record<string, string> = {
      testnet: 'https://fullnode.testnet.sui.io:443',
      mainnet: 'https://fullnode.mainnet.sui.io:443',
      devnet: 'https://fullnode.devnet.sui.io:443'
    };
    return networks[network] || networks.testnet;
  }

  private async registerListingOnChain(listing: DataListing): Promise<void> {
    // TODO: Implement Sui Move contract call
  }

  private async getListing(listingId: string): Promise<DataListing> {
    const listing = this.listings.get(listingId);
    if (!listing) {
      throw new MarketplaceError(ErrorCode.LISTING_NOT_FOUND, 'Listing not found');
    }
    return listing;
  }

  private async verifyAccess(listingId: string, buyer: string): Promise<DataAccess | null> {
    return this.accessRecords.get(`${listingId}:${buyer}`) || null;
  }

  private async createEscrowPayment(params: any): Promise<any> {
    // TODO: Implement Sui escrow
  }

  private async releaseEscrowPayment(listingId: string, buyer: string): Promise<void> {
    // TODO: Implement escrow release
  }

  private async freezeEscrow(listingId: string, buyer: string): Promise<void> {
    // TODO: Implement escrow freeze
  }

  private async updateAccessRecord(access: DataAccess): Promise<void> {
    this.accessRecords.set(`${access.listingId}:${access.buyer}`, access);
  }

  private async submitToArbitration(params: any): Promise<void> {
    // TODO: Implement arbitration submission
  }
}