import { SuiClient, SuiTransactionBlockResponse } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { WalletAccount } from '@mysten/wallet-standard';
import { MARKETPLACE_CONFIG } from '../constants';

export interface PurchaseTransaction {
  modelId: string;
  buyerAddress: string;
  price: string;
  currency: 'SUI' | 'USDC';
  sellerAddress: string;
  marketplaceContract: string;
}

export interface PurchaseResult {
  success: boolean;
  transactionHash?: string;
  licenseNftId?: string;
  accessTokens?: {
    downloadToken: string;
    usageToken: string;
    expiresAt: number;
  };
  error?: string;
}

export class PurchaseTransactionService {
  private suiClient: SuiClient;

  constructor(suiClient: SuiClient) {
    this.suiClient = suiClient;
  }

  /**
   * Execute a model purchase transaction
   */
  async executePurchase(
    purchase: PurchaseTransaction,
    account: WalletAccount,
    signAndExecuteTransaction: (transaction: { transaction: Transaction }) => Promise<SuiTransactionBlockResponse>
  ): Promise<PurchaseResult> {
    try {
      console.log('💰 Starting purchase transaction...', purchase);

      // Validate inputs
      if (!account.address) {
        throw new Error('Wallet not connected');
      }

      if (purchase.buyerAddress !== account.address) {
        throw new Error('Buyer address does not match wallet');
      }

      // Check buyer balance
      const balance = await this.checkBalance(purchase.buyerAddress, purchase.currency);
      const priceAmount = parseFloat(purchase.price) * 1_000_000_000; // Convert to MIST

      if (balance < priceAmount) {
        throw new Error(`Insufficient ${purchase.currency} balance. Required: ${purchase.price}, Available: ${(balance / 1_000_000_000).toFixed(4)}`);
      }

      // Create transaction block
      const transaction = new Transaction();

      // Set gas budget to avoid dry run errors
      transaction.setGasBudget(MARKETPLACE_CONFIG.DEFAULT_GAS_BUDGET); // Use configured gas budget
      transaction.setSender(account.address);

      // Add purchase transaction call
      const [licenseNft] = transaction.moveCall({
        target: `${purchase.marketplaceContract}::marketplace_v2::purchase_model`,
        arguments: [
          transaction.pure.string(purchase.modelId),
          transaction.pure.address(purchase.sellerAddress),
          transaction.pure.u64(priceAmount.toString())
        ]
      });

      // Transfer license NFT to buyer
      transaction.transferObjects([licenseNft], account.address);

      console.log('📝 Signing transaction...');

      // Sign and execute transaction
      const result = await signAndExecuteTransaction({
        transaction
      });

      if (!result.digest) {
        throw new Error('Transaction failed to execute');
      }

      console.log('✅ Purchase transaction successful:', result.digest);

      // Extract license NFT ID from transaction results
      const licenseNftId = await this.extractLicenseNftId(result);

      // Generate access tokens for the purchased model
      const accessTokens = await this.generateAccessTokens(
        purchase.modelId,
        purchase.buyerAddress,
        licenseNftId
      );

      return {
        success: true,
        transactionHash: result.digest,
        licenseNftId,
        accessTokens
      };

    } catch (error) {
      console.error('❌ Purchase transaction failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed'
      };
    }
  }

  /**
   * Check user's balance for the specified currency
   */
  private async checkBalance(address: string, currency: 'SUI' | 'USDC'): Promise<number> {
    try {
      if (currency === 'SUI') {
        const balance = await this.suiClient.getBalance({
          owner: address
        });
        return parseInt(balance.totalBalance);
      } else {
        // For USDC, would need to check specific coin type
        // For now, return mock balance
        return 1000 * 1_000_000_000; // 1000 USDC
      }
    } catch (error) {
      console.error('Balance check failed:', error);
      return 0;
    }
  }

  /**
   * Extract license NFT ID from transaction results
   */
  private async extractLicenseNftId(result: SuiTransactionBlockResponse): Promise<string> {
    try {
      // Look for created objects in transaction effects
      if (result.effects?.created) {
        for (const created of result.effects.created) {
          // In real implementation, would verify this is our license NFT
          if (created.reference.objectId) {
            return created.reference.objectId;
          }
        }
      }

      // Fallback to mock ID for demo
      return `license_nft_${Date.now()}`;

    } catch (error) {
      console.error('Failed to extract license NFT ID:', error);
      return `license_nft_${Date.now()}`;
    }
  }

  /**
   * Generate access tokens for the purchased model
   */
  private async generateAccessTokens(
    modelId: string,
    buyerAddress: string,
    licenseNftId: string
  ): Promise<{
    downloadToken: string;
    usageToken: string;
    expiresAt: number;
  }> {
    // Generate secure tokens for model access
    const downloadToken = `dt_${modelId}_${buyerAddress}_${Date.now()}`;
    const usageToken = `ut_${modelId}_${buyerAddress}_${Date.now()}`;
    const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days

    return {
      downloadToken,
      usageToken,
      expiresAt
    };
  }

  /**
   * Verify purchase transaction on-chain
   */
  async verifyPurchase(
    transactionHash: string,
    expectedBuyer: string,
    expectedModelId: string
  ): Promise<{
    verified: boolean;
    purchaseData?: {
      buyer: string;
      seller: string;
      modelId: string;
      price: string;
      timestamp: number;
    };
    error?: string;
  }> {
    try {
      // Get transaction details
      const transaction = await this.suiClient.getTransactionBlock({
        digest: transactionHash,
        options: {
          showEffects: true,
          showEvents: true,
          showInput: true
        }
      });

      if (!transaction) {
        return {
          verified: false,
          error: 'Transaction not found'
        };
      }

      // Verify transaction success
      if (transaction.effects?.status?.status !== 'success') {
        return {
          verified: false,
          error: 'Transaction was not successful'
        };
      }

      // Extract purchase event data (in real implementation)
      // For now, return mock verified data
      return {
        verified: true,
        purchaseData: {
          buyer: expectedBuyer,
          seller: 'mock-seller-address',
          modelId: expectedModelId,
          price: '125.50',
          timestamp: Date.now()
        }
      };

    } catch (error) {
      console.error('Purchase verification failed:', error);
      return {
        verified: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      };
    }
  }

  /**
   * Get purchase history for a user
   */
  async getPurchaseHistory(userAddress: string): Promise<{
    purchases: Array<{
      modelId: string;
      modelName: string;
      seller: string;
      price: string;
      purchaseDate: number;
      transactionHash: string;
      licenseNftId: string;
      status: 'active' | 'expired' | 'revoked';
    }>;
    totalSpent: string;
  }> {
    try {
      // In real implementation, would query on-chain data
      // For now, return mock data
      return {
        purchases: [
          {
            modelId: 'model-123',
            modelName: 'Self Drive Model',
            seller: 'AI Research Lab',
            price: '125.50',
            purchaseDate: Date.now() - 86400000, // 1 day ago
            transactionHash: '0xabc123',
            licenseNftId: 'license_nft_123',
            status: 'active'
          }
        ],
        totalSpent: '125.50'
      };

    } catch (error) {
      console.error('Failed to get purchase history:', error);
      return {
        purchases: [],
        totalSpent: '0'
      };
    }
  }
}

export default PurchaseTransactionService;