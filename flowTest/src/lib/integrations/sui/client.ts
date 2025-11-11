import { SuiClient, SuiTransactionBlockResponse } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { DataListing, PurchaseRequest, MarketplaceError, ErrorCode } from '../types';
import { MARKETPLACE_CONFIG } from '../../constants';

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
    // This method is deprecated - use createListingTransactionWithCreatorCap instead
    throw new Error('Use createListingTransactionWithCreatorCap instead');
  }

  // Create a transaction with dynamic CreatorCap lookup
  createListingTransactionWithCreatorCap(
    listing: Omit<DataListing, 'id' | 'createdAt' | 'isActive'>,
    sellerAddress: string,
    creatorCapId: string
  ): Transaction {
    const tx = new Transaction();
    
    // Set a reasonable gas budget for the transaction
    tx.setGasBudget(MARKETPLACE_CONFIG.DEFAULT_GAS_BUDGET); // 0.1 SUI gas budget
    tx.setSender(sellerAddress); // Set the sender address
    
    console.log('Creating marketplace listing transaction with:');
    console.log('- Package ID:', this.config.packageId);
    console.log('- Marketplace Object:', this.config.marketplaceObjectId);
    console.log('- Creator Cap:', creatorCapId);
    console.log('- Seller Address:', sellerAddress);
    
    tx.moveCall({
      target: `${this.config.packageId}::marketplace_v2::create_listing`,
      arguments: [
        tx.object(this.config.marketplaceObjectId), // marketplace
        tx.object(creatorCapId), // creator_cap (user's owned object)
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
    walletSigner: any // dapp-kit wallet signer
  ): Promise<string> {
    try {
      // Validate configuration
      if (!this.config.packageId || !this.config.marketplaceObjectId) {
        throw new Error('SUI marketplace configuration missing: packageId and marketplaceObjectId required');
      }
      
      // Get user address from wallet
      const userAddress = walletSigner.toSuiAddress ? walletSigner.toSuiAddress() : 
                          (walletSigner.address || walletSigner.getAddress?.());
      
      if (!userAddress) {
        throw new Error('Unable to get user address from wallet');
      }

      // Find user's CreatorCap for this marketplace
      console.log('Looking for CreatorCap owned by user:', userAddress);
      const ownedObjects = await this.client.getOwnedObjects({
        owner: userAddress,
        filter: {
          StructType: `${this.config.packageId}::marketplace_v2::CreatorCap`
        },
        options: { showContent: true }
      });

      if (!ownedObjects.data || ownedObjects.data.length === 0) {
        throw new Error(`No CreatorCap found for user ${userAddress}. User needs to create/mint a CreatorCap first.`);
      }

      const creatorCapId = ownedObjects.data[0].data?.objectId;
      if (!creatorCapId) {
        throw new Error('Invalid CreatorCap object found');
      }

      console.log('Found CreatorCap:', creatorCapId);
      
      const tx = this.createListingTransactionWithCreatorCap(listing, userAddress, creatorCapId);

      console.log('Prompting user to sign marketplace listing transaction...');

      // Use wallet signer to prompt user for transaction signing
      let result;
      if (walletSigner.signAndExecuteTransaction) {
        // Use dapp-kit wallet signing
        result = await walletSigner.signAndExecuteTransaction({
          transaction: tx,
          options: {
            showEffects: true,
            showEvents: true,
            showInput: true,
            showObjectChanges: true
          }
        });
      } else {
        // Fallback to direct client signing (for Ed25519Keypair)
        result = await this.client.signAndExecuteTransaction({
          signer: walletSigner,
          transaction: tx,
          options: {
            showEffects: true,
            showEvents: true,
            showInput: true,
            showObjectChanges: true
          }
        });
      }

      if (result.effects?.status?.status !== 'success') {
        const error = result.effects?.status?.error || 'Transaction execution failed';
        console.error('Transaction execution failed:', error);
        console.error('Full transaction result:', JSON.stringify(result, null, 2));
        console.error('Transaction effects:', JSON.stringify(result.effects, null, 2));
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