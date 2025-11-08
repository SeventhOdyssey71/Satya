/**
 * Satya Marketplace Service
 * Integrates Seal (encryption), Walrus (storage), and Nautilus (TEE processing)
 * to create a secure data marketplace
 */

import { SealEncryptionService } from './seal/services/encryption-service';
import { WalrusStorageService } from './walrus/services/storage-service';
import { NautilusClient } from './nautilus/client';
import { SuiClient } from '@mysten/sui.js/client';

// Types
interface DataListing {
  id: string;
  seller: string;
  title: string;
  description: string;
  price: bigint;
  category: string;
  size: number;
  sampleAvailable: boolean;
  
  // Technical details
  encryptedBlobId: string;    // Walrus storage ID
  encryptionPolicyId: string; // Seal policy ID
  dataHash: string;           // For verification
  attestationId?: string;     // Nautilus attestation
  
  // Access control
  allowedBuyers?: string[];
  expiryDate?: Date;
  maxDownloads?: number;
}

interface PurchaseRequest {
  listingId: string;
  buyer: string;
  paymentAmount: bigint;
  accessDuration?: number; // hours
}

interface DataAccess {
  listingId: string;
  buyer: string;
  decryptionKey?: Uint8Array;
  expiresAt: Date;
  downloadCount: number;
  attestation?: any;
}

export class MarketplaceService {
  private seal: SealEncryptionService;
  private walrus: WalrusStorageService;
  private nautilus: NautilusClient;
  private sui: SuiClient;
  
  constructor(config: {
    suiNetwork: string;
    marketplacePackageId: string;
    nautilusUrl: string;
  }) {
    this.seal = new SealEncryptionService();
    this.walrus = new WalrusStorageService();
    this.nautilus = new NautilusClient({
      enclaveUrl: config.nautilusUrl,
      suiNetwork: config.suiNetwork,
      marketplacePackageId: config.marketplacePackageId
    });
    this.sui = new SuiClient({ url: this.getNetworkUrl(config.suiNetwork) });
  }

  /**
   * SELLER FLOW: List data for sale
   */
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
    console.log('Starting data listing process...');
    
    // 1. Process data
    const dataBytes = params.data instanceof File 
      ? new Uint8Array(await params.data.arrayBuffer())
      : params.data;
    
    // 2. Generate data hash for verification
    const dataHash = await this.hashData(dataBytes);
    
    // 3. Create encryption policy (buyer must be authorized)
    const encryptionPolicy = await this.seal.createPolicy('MARKETPLACE', {
      seller: params.seller,
      allowedBuyers: params.allowedBuyers || [],
      expiryHours: 24 * 30, // 30 days default
    });
    
    // 4. Encrypt data with Seal
    console.log('Encrypting data with Seal...');
    const encrypted = await this.seal.encryptData(
      dataBytes,
      'MARKETPLACE',
      { policyId: encryptionPolicy.id }
    );
    
    // 5. Upload encrypted data to Walrus
    console.log('Uploading to Walrus...');
    const uploadResult = await this.walrus.uploadData(encrypted.ciphertext, {
      epochs: 5,
      metadata: {
        encrypted: true,
        policyId: encryptionPolicy.id,
        dataHash
      }
    });
    
    // 6. If sample provided, process in Nautilus for attestation
    let attestationId: string | undefined;
    if (params.sampleData) {
      console.log('Creating sample attestation in Nautilus...');
      const attestation = await this.nautilus.uploadFile({
        file: params.sampleData,
        type: 'sample'
      });
      attestationId = attestation.attestation_id;
    }
    
    // 7. Register on blockchain
    console.log('Registering on Sui blockchain...');
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
      maxDownloads: 100
    };
    
    await this.registerListingOnChain(listing);
    
    console.log('Data listed successfully!');
    return listing;
  }

  /**
   * BUYER FLOW: Purchase and access data
   */
  async purchaseData(request: PurchaseRequest): Promise<DataAccess> {
    console.log('Starting purchase process...');
    
    // 1. Get listing details
    const listing = await this.getListing(request.listingId);
    
    // 2. Verify payment amount
    if (request.paymentAmount < listing.price) {
      throw new Error('Insufficient payment amount');
    }
    
    // 3. Create escrow transaction on Sui
    console.log('Creating escrow payment...');
    const escrowTx = await this.createEscrowPayment({
      listing,
      buyer: request.buyer,
      amount: request.paymentAmount
    });
    
    // 4. Grant decryption permission via Seal
    console.log('Granting decryption access...');
    await this.seal.grantAccess(
      listing.encryptionPolicyId,
      request.buyer,
      request.accessDuration || 24 // Default 24 hours
    );
    
    // 5. Create access record
    const access: DataAccess = {
      listingId: request.listingId,
      buyer: request.buyer,
      expiresAt: new Date(Date.now() + (request.accessDuration || 24) * 60 * 60 * 1000),
      downloadCount: 0
    };
    
    console.log('Purchase completed! Access granted.');
    return access;
  }

  /**
   * BUYER FLOW: Download and decrypt purchased data
   */
  async downloadPurchasedData(
    listingId: string,
    buyer: string,
    verifyInEnclave: boolean = false
  ): Promise<Uint8Array> {
    console.log('Starting download process...');
    
    // 1. Verify access rights
    const access = await this.verifyAccess(listingId, buyer);
    if (!access) {
      throw new Error('No valid access found');
    }
    
    // 2. Get listing details
    const listing = await this.getListing(listingId);
    
    // 3. Download encrypted data from Walrus
    console.log('Downloading from Walrus...');
    const encryptedData = await this.walrus.downloadBlob(listing.encryptedBlobId);
    
    // 4. If verification requested, process in Nautilus first
    if (verifyInEnclave) {
      console.log('Verifying in secure enclave...');
      const verification = await this.nautilus.processFile({
        fileId: listing.encryptedBlobId,
        operation: 'verify',
        metadata: { expectedHash: listing.dataHash }
      });
      
      if (!verification.valid) {
        throw new Error('Data verification failed');
      }
      
      // Store attestation
      access.attestation = verification.attestation;
    }
    
    // 5. Decrypt data using Seal
    console.log('Decrypting data...');
    const decrypted = await this.seal.decryptData(
      encryptedData,
      listing.encryptionPolicyId,
      { requester: buyer }
    );
    
    // 6. Verify data integrity
    const downloadedHash = await this.hashData(decrypted.data);
    if (downloadedHash !== listing.dataHash) {
      throw new Error('Data integrity check failed');
    }
    
    // 7. Update download count
    access.downloadCount++;
    await this.updateAccessRecord(access);
    
    // 8. Release escrow payment to seller
    if (access.downloadCount === 1) {
      console.log('Releasing payment to seller...');
      await this.releaseEscrowPayment(listingId, buyer);
    }
    
    console.log('Download completed successfully!');
    return decrypted.data;
  }

  /**
   * VERIFICATION: Process data sample in Nautilus enclave
   */
  async verifyDataSample(
    listingId: string,
    sampleData: Uint8Array
  ): Promise<{
    valid: boolean;
    attestation: string;
    metrics?: any;
  }> {
    console.log('Verifying data sample in TEE...');
    
    const listing = await this.getListing(listingId);
    
    // Upload sample to Nautilus
    const result = await this.nautilus.uploadFile({
      file: sampleData,
      type: 'verification'
    });
    
    // Process and generate attestation
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

  /**
   * DISPUTE: Handle disputed transactions
   */
  async disputePurchase(params: {
    listingId: string;
    buyer: string;
    reason: string;
    evidence?: any;
  }): Promise<void> {
    console.log('Processing dispute...');
    
    // 1. Freeze escrow
    await this.freezeEscrow(params.listingId, params.buyer);
    
    // 2. Request data verification in Nautilus
    const listing = await this.getListing(params.listingId);
    const encryptedData = await this.walrus.downloadBlob(listing.encryptedBlobId);
    
    // 3. Create attestation of current state
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
    
    // 4. Submit to DAO/arbitration
    await this.submitToArbitration({
      dispute: params,
      attestation: disputeAttestation
    });
    
    console.log('Dispute submitted for arbitration');
  }

  // ============= HELPER METHODS =============

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
    // Implementation would call Sui Move contract
    console.log('Registering listing on chain:', listing.id);
  }

  private async getListing(listingId: string): Promise<DataListing> {
    // Implementation would fetch from blockchain
    throw new Error('Not implemented');
  }

  private async verifyAccess(listingId: string, buyer: string): Promise<DataAccess | null> {
    // Implementation would check blockchain records
    throw new Error('Not implemented');
  }

  private async createEscrowPayment(params: any): Promise<any> {
    // Implementation would create Sui transaction
    throw new Error('Not implemented');
  }

  private async releaseEscrowPayment(listingId: string, buyer: string): Promise<void> {
    // Implementation would release funds
    throw new Error('Not implemented');
  }

  private async freezeEscrow(listingId: string, buyer: string): Promise<void> {
    // Implementation would freeze escrow
    throw new Error('Not implemented');
  }

  private async updateAccessRecord(access: DataAccess): Promise<void> {
    // Implementation would update records
    throw new Error('Not implemented');
  }

  private async submitToArbitration(params: any): Promise<void> {
    // Implementation would submit dispute
    throw new Error('Not implemented');
  }
}

// Example usage
export async function demonstrateMarketplace() {
  const marketplace = new MarketplaceService({
    suiNetwork: 'testnet',
    marketplacePackageId: '0x...',
    nautilusUrl: 'http://localhost:3000'
  });

  // Seller lists data
  const listing = await marketplace.listDataForSale({
    data: new Uint8Array([1, 2, 3, 4, 5]), // Your data
    title: 'Premium Dataset',
    description: 'High-quality training data',
    price: BigInt(100000000), // 0.1 SUI
    category: 'ML Training Data',
    seller: '0xSeller...',
    sampleData: new Uint8Array([1, 2]) // Optional sample
  });

  // Buyer purchases
  const access = await marketplace.purchaseData({
    listingId: listing.id,
    buyer: '0xBuyer...',
    paymentAmount: listing.price,
    accessDuration: 48 // 48 hours
  });

  // Buyer downloads
  const data = await marketplace.downloadPurchasedData(
    listing.id,
    '0xBuyer...',
    true // Verify in enclave
  );
}