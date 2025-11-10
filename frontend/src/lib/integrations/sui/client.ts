import { SuiClient, SuiTransactionBlockResponse } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { DataListing, PurchaseRequest, MarketplaceError, ErrorCode } from '../types';

export interface SuiMarketplaceConfig {
  network: 'mainnet' | 'testnet' | 'devnet' | 'localnet';
  packageId: string;
  marketplaceObjectId: string;
}

export class SuiMarketplaceClient {
  private client: SuiClient;
  private config: SuiMarketplaceConfig;

  constructor(config: SuiMarketplaceConfig) {
    this.config = config;
    this.client = new SuiClient({
      url: this.getNetworkUrl(config.network)
    });
  }

  async createListing(
    listing: Omit<DataListing, 'id' | 'createdAt' | 'isActive'>,
    keypair: Ed25519Keypair
  ): Promise<string> {
    try {
      // In development, return mock listing ID if SUI network is not available
      if (process.env.NODE_ENV === 'development' && (!this.config.packageId || !this.config.marketplaceObjectId)) {
        const mockListingId = `dev_listing_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        console.warn('SUI Marketplace: Using development mock listing ID', { mockListingId });
        return mockListingId;
      }
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${this.config.packageId}::data_marketplace::create_listing`,
        arguments: [
          tx.object(this.config.marketplaceObjectId),
          tx.pure.string(listing.title),
          tx.pure.string(listing.description),
          tx.pure.string(listing.category),
          tx.pure.u64(listing.price.toString()),
          tx.pure.string(listing.encryptedBlobId),
          tx.pure.string(listing.encryptionPolicyId),
          tx.pure.vector('u8', Array.from(Buffer.from(listing.dataHash, 'hex'))),
          tx.pure.u32(listing.maxDownloads || 100),
          tx.pure.u32(30), // expiry days
          tx.object('0x6') // clock object
        ]
      });

      const result = await this.client.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true
        }
      });

      if (result.effects?.status?.status !== 'success') {
        throw new Error('Transaction failed');
      }

      const listingId = this.extractListingIdFromEvents(result);
      return listingId;
    } catch (error) {
      throw new MarketplaceError(
        ErrorCode.NETWORK_ERROR,
        `Failed to create listing: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async purchaseData(
    request: PurchaseRequest,
    paymentCoin: string,
    keypair: Ed25519Keypair
  ): Promise<string> {
    try {
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${this.config.packageId}::data_marketplace::purchase_data`,
        arguments: [
          tx.object(this.config.marketplaceObjectId),
          tx.pure.string(request.listingId),
          tx.object(paymentCoin),
          tx.pure.u32(request.accessDuration || 24),
          tx.object('0x6') // clock object
        ]
      });

      const result = await this.client.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true
        }
      });

      if (result.effects?.status?.status !== 'success') {
        throw new Error('Transaction failed');
      }

      const purchaseId = this.extractPurchaseIdFromEvents(result);
      return purchaseId;
    } catch (error) {
      throw new MarketplaceError(
        ErrorCode.NETWORK_ERROR,
        `Failed to purchase data: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async confirmDownload(
    purchaseId: string,
    attestationId: string | null,
    keypair: Ed25519Keypair
  ): Promise<void> {
    try {
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${this.config.packageId}::data_marketplace::confirm_download`,
        arguments: [
          tx.object(this.config.marketplaceObjectId),
          tx.pure.string(purchaseId),
          tx.pure.vector('string', attestationId ? [attestationId] : [])
        ]
      });

      const result = await this.client.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: {
          showEffects: true
        }
      });

      if (result.effects?.status?.status !== 'success') {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      throw new MarketplaceError(
        ErrorCode.NETWORK_ERROR,
        `Failed to confirm download: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async createDispute(
    purchaseId: string,
    reason: string,
    evidenceHash: string | null,
    keypair: Ed25519Keypair
  ): Promise<string> {
    try {
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${this.config.packageId}::data_marketplace::create_dispute`,
        arguments: [
          tx.object(this.config.marketplaceObjectId),
          tx.pure.string(purchaseId),
          tx.pure.string(reason),
          tx.pure.vector('vector<u8>', evidenceHash ? [Array.from(Buffer.from(evidenceHash, 'hex'))] : []),
          tx.object('0x6') // clock object
        ]
      });

      const result = await this.client.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true
        }
      });

      if (result.effects?.status?.status !== 'success') {
        throw new Error('Transaction failed');
      }

      const disputeId = this.extractDisputeIdFromEvents(result);
      return disputeId;
    } catch (error) {
      throw new MarketplaceError(
        ErrorCode.NETWORK_ERROR,
        `Failed to create dispute: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getListing(listingId: string): Promise<DataListing | null> {
    try {
      const marketplaceObject = await this.client.getObject({
        id: this.config.marketplaceObjectId,
        options: {
          showContent: true
        }
      });

      // Parse marketplace content and find listing
      // This would need proper parsing based on the actual object structure
      return null; // Placeholder
    } catch (error) {
      return null;
    }
  }

  async getPurchase(purchaseId: string): Promise<any> {
    try {
      const marketplaceObject = await this.client.getObject({
        id: this.config.marketplaceObjectId,
        options: {
          showContent: true
        }
      });

      // Parse marketplace content and find purchase
      return null; // Placeholder
    } catch (error) {
      return null;
    }
  }

  async getMarketplaceStats(): Promise<{
    totalListings: number;
    totalVolume: string;
    platformBalance: string;
  }> {
    try {
      const result = await this.client.devInspectTransactionBlock({
        transactionBlock: (() => {
          const tx = new Transaction();
          tx.moveCall({
            target: `${this.config.packageId}::data_marketplace::get_marketplace_stats`,
            arguments: [tx.object(this.config.marketplaceObjectId)]
          });
          return tx;
        })(),
        sender: '0x1'
      });

      // Parse the result
      const stats = result.results?.[0]?.returnValues;
      if (stats) {
        return {
          totalListings: parseInt(String(stats[0][0])),
          totalVolume: String(stats[1][0]),
          platformBalance: String(stats[2][0])
        };
      }

      return {
        totalListings: 0,
        totalVolume: '0',
        platformBalance: '0'
      };
    } catch (error) {
      throw new MarketplaceError(
        ErrorCode.NETWORK_ERROR,
        `Failed to get marketplace stats: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private getNetworkUrl(network: string): string {
    const networks = {
      mainnet: 'https://fullnode.mainnet.sui.io:443',
      testnet: 'https://fullnode.testnet.sui.io:443',
      devnet: 'https://fullnode.devnet.sui.io:443',
      localnet: 'http://localhost:9000'
    };
    return networks[network as keyof typeof networks] || networks.testnet;
  }

  private extractListingIdFromEvents(result: SuiTransactionBlockResponse): string {
    const events = result.events || [];
    const listingEvent = events.find(e => 
      e.type.includes('ListingCreated')
    );
    
    if (listingEvent && listingEvent.parsedJson) {
      return (listingEvent.parsedJson as any).listing_id;
    }
    
    throw new Error('Could not extract listing ID from transaction');
  }

  private extractPurchaseIdFromEvents(result: SuiTransactionBlockResponse): string {
    const events = result.events || [];
    const purchaseEvent = events.find(e => 
      e.type.includes('PurchaseMade')
    );
    
    if (purchaseEvent && purchaseEvent.parsedJson) {
      return (purchaseEvent.parsedJson as any).purchase_id;
    }
    
    throw new Error('Could not extract purchase ID from transaction');
  }

  private extractDisputeIdFromEvents(result: SuiTransactionBlockResponse): string {
    const events = result.events || [];
    const disputeEvent = events.find(e => 
      e.type.includes('DisputeCreated')
    );
    
    if (disputeEvent && disputeEvent.parsedJson) {
      return (disputeEvent.parsedJson as any).dispute_id;
    }
    
    throw new Error('Could not extract dispute ID from transaction');
  }
}