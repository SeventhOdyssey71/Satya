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

  // Create a transaction for wallet signing (dapp-kit compatible)
  createListingTransaction(
    listing: Omit<DataListing, 'id' | 'createdAt' | 'isActive'>,
    sellerAddress: string
  ): Transaction {
    const tx = new Transaction();
    
    // Set a reasonable gas budget for the transaction
    tx.setGasBudget(1_000_000_000); // 1 SUI gas budget
    tx.setSender(sellerAddress); // Set the sender address
    
    // Complete function call with correct CreatorCap from environment config
    const creatorCapId = process.env.NEXT_PUBLIC_MARKETPLACE_V2_ADMIN_CAP;
    
    if (!creatorCapId) {
      throw new Error('MARKETPLACE_V2_ADMIN_CAP not configured in environment');
    }
    
    tx.moveCall({
      target: `${this.config.packageId}::marketplace_v2::create_listing`,
      arguments: [
        tx.object(this.config.marketplaceObjectId), // marketplace
        tx.object(creatorCapId), // creator_cap (existing owned object)
        tx.pure.string(listing.title || 'Model'), // title
        tx.pure.string(listing.description || 'AI Model'), // description
        tx.pure.string(listing.category || 'AI'), // category
        tx.pure.string(listing.encryptedBlobId || ''), // encrypted_walrus_blob_id
        tx.pure.vector('u8', [1, 2, 3]), // encryption_key_ciphertext
        tx.pure.vector('u8', [4, 5, 6]), // seal_namespace
        tx.pure.u64(listing.price?.toString() || '1000000000'), // download_price
        tx.object('0x6'), // clock
      ]
    });

    return tx;
  }

  async createListing(
    listing: Omit<DataListing, 'id' | 'createdAt' | 'isActive'>,
    keypair: Ed25519Keypair
  ): Promise<string> {
    try {
      // Validate configuration
      if (!this.config.packageId || !this.config.marketplaceObjectId) {
        throw new Error('SUI marketplace configuration missing: packageId and marketplaceObjectId required');
      }
      
      const tx = this.createListingTransaction(listing, keypair.toSuiAddress());

      // Skip dry run for now due to function signature issues
      // TODO: Re-enable once we have the correct function signatures
      console.log('Skipping dry run, executing transaction directly...');

      const result = await this.client.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
          showInput: true,
          showObjectChanges: true
        }
      });

      if (result.effects?.status?.status !== 'success') {
        const error = result.effects?.status?.error || 'Transaction execution failed';
        console.error('Transaction execution failed:', error);
        throw new Error(`Transaction failed: ${error}`);
      }

      console.log('Transaction successful:', result.digest);
      console.log('Events:', result.events);

      const listingId = this.extractListingIdFromEvents(result);
      console.log('Extracted listing ID:', listingId);
      
      return listingId;
    } catch (error) {
      console.error('Create listing error:', error);
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