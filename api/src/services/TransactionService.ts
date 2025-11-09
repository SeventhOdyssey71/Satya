import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock, TransactionResult } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { fromB64, toB64 } from '@mysten/sui.js/utils';
import { createLogger } from '../utils/logger';

const logger = createLogger();

export interface TransactionConfig {
  sender: string;
  gasBudget?: number;
  gasPrice?: number;
}

export interface TransactionSignRequest {
  transactionBlock: string; // Base64 encoded transaction block
  walletAddress: string;
  options?: {
    showInput?: boolean;
    showRawInput?: boolean;
    showEffects?: boolean;
    showEvents?: boolean;
    showObjectChanges?: boolean;
    showBalanceChanges?: boolean;
  };
}

export interface SignedTransactionResponse {
  transactionBlockBytes: string;
  signature: string;
  transactionDigest?: string;
  effects?: any;
  events?: any[];
  objectChanges?: any[];
  balanceChanges?: any[];
}

export interface MarketplaceTransaction {
  type: 'create_listing' | 'purchase_listing' | 'update_listing' | 'cancel_listing';
  params: any;
  sender: string;
}

export class TransactionService {
  private suiClient: SuiClient;
  private contractPackageId: string;
  private marketplaceObjectId: string;

  constructor() {
    const network = process.env.SUI_NETWORK || 'testnet';
    this.suiClient = new SuiClient({ url: getFullnodeUrl(network as any) });
    
    this.contractPackageId = process.env.MARKETPLACE_PACKAGE_ID || '';
    this.marketplaceObjectId = process.env.MARKETPLACE_OBJECT_ID || '';

    if (!this.contractPackageId || !this.marketplaceObjectId) {
      logger.warn('Marketplace contract IDs not configured');
    }
  }

  /**
   * Creates a transaction block for marketplace operations
   */
  async createMarketplaceTransaction(
    transaction: MarketplaceTransaction,
    config: TransactionConfig
  ): Promise<string> {
    try {
      const txb = new TransactionBlock();
      
      // Set transaction sender and gas configuration
      txb.setSender(config.sender);
      
      if (config.gasBudget) {
        txb.setGasBudget(config.gasBudget);
      }

      // Add marketplace-specific move calls based on transaction type
      switch (transaction.type) {
        case 'create_listing':
          await this.addCreateListingCall(txb, transaction.params);
          break;
        
        case 'purchase_listing':
          await this.addPurchaseListingCall(txb, transaction.params);
          break;
        
        case 'update_listing':
          await this.addUpdateListingCall(txb, transaction.params);
          break;
        
        case 'cancel_listing':
          await this.addCancelListingCall(txb, transaction.params);
          break;
        
        default:
          throw new Error(`Unknown transaction type: ${transaction.type}`);
      }

      // Build and return the transaction block as base64
      const transactionBlockBytes = await txb.build({
        client: this.suiClient,
        onlyTransactionKind: false
      });

      return toB64(transactionBlockBytes);

    } catch (error) {
      logger.error('Error creating marketplace transaction:', error);
      throw new Error('Failed to create transaction');
    }
  }

  /**
   * Executes a signed transaction
   */
  async executeSignedTransaction(
    signedTx: SignedTransactionResponse
  ): Promise<any> {
    try {
      const result = await this.suiClient.executeTransactionBlock({
        transactionBlock: signedTx.transactionBlockBytes,
        signature: signedTx.signature,
        options: {
          showInput: true,
          showRawInput: false,
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true
        }
      });

      logger.info('Transaction executed successfully', {
        digest: result.digest,
        status: result.effects?.status?.status
      });

      return result;

    } catch (error) {
      logger.error('Error executing signed transaction:', error);
      throw new Error('Failed to execute transaction');
    }
  }

  /**
   * Gets transaction details by digest
   */
  async getTransactionDetails(digest: string): Promise<any> {
    try {
      const result = await this.suiClient.getTransactionBlock({
        digest,
        options: {
          showInput: true,
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true
        }
      });

      return result;

    } catch (error) {
      logger.error('Error fetching transaction details:', error);
      throw new Error('Failed to fetch transaction details');
    }
  }

  /**
   * Estimates gas cost for a transaction
   */
  async estimateGasCost(transactionBlock: string): Promise<{
    computationCost: number;
    storageCost: number;
    storageRebate: number;
    totalCost: number;
  }> {
    try {
      const txBytes = fromB64(transactionBlock);
      
      // Use dry run to estimate gas
      const dryRunResult = await this.suiClient.dryRunTransactionBlock({
        transactionBlock: txBytes
      });

      if (dryRunResult.effects.status.status !== 'success') {
        throw new Error('Transaction would fail during execution');
      }

      const gasUsed = dryRunResult.effects.gasUsed;
      
      return {
        computationCost: parseInt(gasUsed.computationCost),
        storageCost: parseInt(gasUsed.storageCost),
        storageRebate: parseInt(gasUsed.storageRebate),
        totalCost: parseInt(gasUsed.computationCost) + parseInt(gasUsed.storageCost) - parseInt(gasUsed.storageRebate)
      };

    } catch (error) {
      logger.error('Error estimating gas cost:', error);
      throw new Error('Failed to estimate gas cost');
    }
  }

  /**
   * Gets the current gas price
   */
  async getCurrentGasPrice(): Promise<number> {
    try {
      const gasPrice = await this.suiClient.getReferenceGasPrice();
      return Number(gasPrice);
    } catch (error) {
      logger.error('Error fetching gas price:', error);
      return 1000; // Default fallback gas price
    }
  }

  /**
   * Checks if a wallet has sufficient SUI balance for a transaction
   */
  async checkSufficientBalance(
    walletAddress: string, 
    estimatedCost: number
  ): Promise<{ sufficient: boolean; balance: number; required: number }> {
    try {
      const balance = await this.suiClient.getBalance({
        owner: walletAddress,
        coinType: '0x2::sui::SUI'
      });

      const currentBalance = parseInt(balance.totalBalance);
      const sufficient = currentBalance >= estimatedCost;

      return {
        sufficient,
        balance: currentBalance,
        required: estimatedCost
      };

    } catch (error) {
      logger.error('Error checking balance:', error);
      return { sufficient: false, balance: 0, required: estimatedCost };
    }
  }

  // Private helper methods for marketplace operations

  private async addCreateListingCall(txb: TransactionBlock, params: any): Promise<void> {
    if (!this.contractPackageId) {
      throw new Error('Marketplace contract not configured');
    }

    // Add move call for creating a listing
    txb.moveCall({
      target: `${this.contractPackageId}::marketplace::create_listing`,
      arguments: [
        txb.object(this.marketplaceObjectId),
        txb.pure(params.title),
        txb.pure(params.description),
        txb.pure(params.price),
        txb.pure(params.category),
        txb.pure(params.blobId),
        txb.pure(params.metadata || {})
      ]
    });
  }

  private async addPurchaseListingCall(txb: TransactionBlock, params: any): Promise<void> {
    if (!this.contractPackageId) {
      throw new Error('Marketplace contract not configured');
    }

    // Get payment coin for the purchase
    const paymentCoin = txb.splitCoins(txb.gas, [txb.pure(params.amount)]);

    // Add move call for purchasing a listing
    txb.moveCall({
      target: `${this.contractPackageId}::marketplace::purchase_listing`,
      arguments: [
        txb.object(this.marketplaceObjectId),
        txb.pure(params.listingId),
        paymentCoin
      ]
    });
  }

  private async addUpdateListingCall(txb: TransactionBlock, params: any): Promise<void> {
    if (!this.contractPackageId) {
      throw new Error('Marketplace contract not configured');
    }

    txb.moveCall({
      target: `${this.contractPackageId}::marketplace::update_listing`,
      arguments: [
        txb.object(this.marketplaceObjectId),
        txb.pure(params.listingId),
        txb.pure(params.newPrice || params.price),
        txb.pure(params.newDescription || params.description)
      ]
    });
  }

  private async addCancelListingCall(txb: TransactionBlock, params: any): Promise<void> {
    if (!this.contractPackageId) {
      throw new Error('Marketplace contract not configured');
    }

    txb.moveCall({
      target: `${this.contractPackageId}::marketplace::cancel_listing`,
      arguments: [
        txb.object(this.marketplaceObjectId),
        txb.pure(params.listingId)
      ]
    });
  }

  /**
   * Utility method to create a simple SUI transfer transaction
   */
  async createTransferTransaction(
    sender: string,
    recipient: string,
    amount: number
  ): Promise<string> {
    try {
      const txb = new TransactionBlock();
      txb.setSender(sender);

      const coin = txb.splitCoins(txb.gas, [txb.pure(amount)]);
      txb.transferObjects([coin], txb.pure(recipient));

      const transactionBlockBytes = await txb.build({
        client: this.suiClient,
        onlyTransactionKind: false
      });

      return toB64(transactionBlockBytes);

    } catch (error) {
      logger.error('Error creating transfer transaction:', error);
      throw new Error('Failed to create transfer transaction');
    }
  }

  /**
   * Validates a transaction block before signing
   */
  async validateTransaction(transactionBlock: string): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    try {
      const txBytes = fromB64(transactionBlock);
      
      // Perform dry run to validate transaction
      const dryRunResult = await this.suiClient.dryRunTransactionBlock({
        transactionBlock: txBytes
      });

      const valid = dryRunResult.effects.status.status === 'success';
      const errors: string[] = [];

      if (!valid) {
        if (dryRunResult.effects.status.error) {
          errors.push(dryRunResult.effects.status.error);
        }
      }

      return { valid, errors };

    } catch (error) {
      logger.error('Error validating transaction:', error);
      return {
        valid: false,
        errors: ['Transaction validation failed']
      };
    }
  }
}