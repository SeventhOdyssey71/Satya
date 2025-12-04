import {
  BrowserPasskeyProvider,
  PasskeyKeypair,
} from '@mysten/sui/keypairs/passkey'
import { SuiClient, SuiTransactionBlockResponse } from '@mysten/sui/client'
import { PublicKey } from '@mysten/sui/cryptography'
import { Transaction } from '@mysten/sui/transactions'
import { PasskeyAuthResult, StoredWalletData, STORAGE_KEYS, APP_CONFIG } from './types'

export class PasskeyWallet {
  private keypair: PasskeyKeypair | null = null
  private provider: BrowserPasskeyProvider
  private client: SuiClient
  private address: string | null = null

  constructor(suiClient: SuiClient, appName: string = APP_CONFIG.APP_NAME) {
    this.provider = new BrowserPasskeyProvider(appName, {
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        requireResidentKey: true,
      }
    })
    this.client = suiClient
  }

  async createWallet(): Promise<PasskeyAuthResult> {
    try {
      // Check if we already have a passkey saved
      const existingWallet = this.getStoredWallet()
      if (existingWallet) {
        // Return existing passkey forever
        return {
          success: true,
          address: existingWallet.address,
          publicKey: existingWallet.publicKey,
        }
      }

      // Check if WebAuthn is supported
      if (!PasskeyWallet.isSupported()) {
        return {
          success: false,
          error: 'WebAuthn is not supported in this browser'
        }
      }

      // Create Sui keypair with passkey
      this.keypair = await PasskeyKeypair.getPasskeyInstance(this.provider)
      const publicKey = this.keypair.getPublicKey()
      this.address = publicKey.toSuiAddress()

      const publicKeyBase64 = publicKey.toBase64()
      
      // Save wallet data in structured format
      this.saveWallet({
        address: this.address,
        publicKey: publicKeyBase64,
        createdAt: Date.now(),
        version: APP_CONFIG.STORAGE_VERSION
      })

      return {
        success: true,
        keypair: this.keypair,
        address: this.address,
        publicKey: publicKeyBase64,
      }
    } catch (error) {
      console.error('Passkey creation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async recoverWallet(): Promise<PasskeyAuthResult> {
    try {
      // Check if we have saved data first
      const storedWallet = this.getStoredWallet()
      if (storedWallet) {
        // Verify the stored data by attempting authentication
        try {
          this.keypair = await PasskeyKeypair.getPasskeyInstance(this.provider)
          const publicKey = this.keypair.getPublicKey()
          const recoveredAddress = publicKey.toSuiAddress()
          
          // Validate that recovered address matches stored address
          if (recoveredAddress !== storedWallet.address) {
            throw new Error('Address mismatch: stored and recovered addresses do not match')
          }
          
          this.address = storedWallet.address
          return {
            success: true,
            address: storedWallet.address,
            publicKey: storedWallet.publicKey,
            keypair: this.keypair
          }
        } catch (verificationError) {
          console.warn('Stored wallet verification failed, attempting full recovery:', verificationError)
          // Fall through to full recovery process
        }
      }

      // Use recovery method from passkey-app for deterministic recovery
      const testMessage1 = new TextEncoder().encode('Sui wallet recovery 1')
      const possiblePks1 = await PasskeyKeypair.signAndRecover(this.provider, testMessage1)
      
      const testMessage2 = new TextEncoder().encode('Sui wallet recovery 2')
      const possiblePks2 = await PasskeyKeypair.signAndRecover(this.provider, testMessage2)
      
      const commonPk = this.findCommonPublicKey(possiblePks1, possiblePks2)
      if (!commonPk) {
        throw new Error('Could not recover wallet - no common public key found')
      }
      
      this.keypair = new PasskeyKeypair(commonPk.toRawBytes(), this.provider)
      this.address = commonPk.toSuiAddress()
      
      const publicKeyBase64 = commonPk.toBase64()
      
      // Save the recovered wallet
      this.saveWallet({
        address: this.address,
        publicKey: publicKeyBase64,
        createdAt: Date.now(),
        version: APP_CONFIG.STORAGE_VERSION
      })

      return {
        success: true,
        keypair: this.keypair,
        address: this.address,
        publicKey: publicKeyBase64,
      }
    } catch (error) {
      console.error('Passkey recovery failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Recovery failed'
      }
    }
  }

  private findCommonPublicKey(pks1: PublicKey[], pks2: PublicKey[]): PublicKey | null {
    for (const pk1 of pks1) {
      for (const pk2 of pks2) {
        if (pk1.toBase64() === pk2.toBase64()) {
          return pk1
        }
      }
    }
    return null
  }

  async connect(): Promise<PasskeyAuthResult> {
    // Check if WebAuthn is supported first
    if (!PasskeyWallet.isSupported()) {
      return {
        success: false,
        error: 'WebAuthn is not supported in this browser'
      }
    }
    
    // Check if we have saved passkey
    const storedWallet = this.getStoredWallet()
    if (storedWallet) {
      // Try to recover/authenticate with existing passkey
      return await this.recoverWallet()
    }
    
    // Create new passkey if none exists
    return await this.createWallet()
  }

  getAddress(): string | null {
    if (this.address) return this.address
    const storedWallet = this.getStoredWallet()
    return storedWallet?.address || null
  }

  getPublicKey(): string | null {
    const storedWallet = this.getStoredWallet()
    return storedWallet?.publicKey || null
  }

  isConnected(): boolean {
    return !!this.getAddress()
  }

  async signPersonalMessage(message: string): Promise<string> {
    if (!this.keypair) {
      throw new Error('Wallet not initialized')
    }

    const messageBytes = new TextEncoder().encode(message)
    const { signature } = await this.keypair.signPersonalMessage(messageBytes)
    return signature
  }

  async signTransaction(tx: Transaction): Promise<string> {
    if (!this.keypair || !this.address) {
      throw new Error('Wallet not initialized')
    }

    tx.setSender(this.address)
    const txBytes = await tx.build({ client: this.client })
    const signature = await this.keypair.signTransaction(txBytes)
    return signature.signature
  }

  async signAndExecuteTransaction(params: {
    transaction: Transaction
    options?: {
      showBalanceChanges?: boolean
      showEvents?: boolean
      showInput?: boolean
      showEffects?: boolean
      showObjectChanges?: boolean
    }
  }): Promise<SuiTransactionBlockResponse> {
    if (!this.keypair || !this.address) {
      throw new Error('Wallet not initialized')
    }

    return this.client.signAndExecuteTransaction({
      signer: this.keypair,
      transaction: params.transaction,
      options: params.options
    })
  }

  disconnect(): void {
    this.keypair = null
    this.address = null
    this.clearStoredWallet()
  }

  /**
   * Storage helper methods
   */
  private getStoredWallet(): StoredWalletData | null {
    if (typeof window === 'undefined') return null
    
    try {
      // Try new format first
      const walletData = localStorage.getItem(STORAGE_KEYS.WALLET_DATA)
      if (walletData) {
        return JSON.parse(walletData)
      }
      
      // Try legacy format for migration
      const legacyAddress = localStorage.getItem(STORAGE_KEYS.LEGACY_ADDRESS)
      const legacyPublicKey = localStorage.getItem(STORAGE_KEYS.LEGACY_PUBLIC_KEY)
      
      if (legacyAddress && legacyPublicKey) {
        const migratedData: StoredWalletData = {
          address: legacyAddress,
          publicKey: legacyPublicKey,
          createdAt: Date.now(),
          version: APP_CONFIG.STORAGE_VERSION
        }
        
        // Save in new format and cleanup legacy
        this.saveWallet(migratedData)
        localStorage.removeItem(STORAGE_KEYS.LEGACY_ADDRESS)
        localStorage.removeItem(STORAGE_KEYS.LEGACY_PUBLIC_KEY)
        
        return migratedData
      }
    } catch (error) {
      console.error('Failed to parse stored wallet data:', error)
      this.clearStoredWallet()
    }
    
    return null
  }
  
  private saveWallet(data: StoredWalletData): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(STORAGE_KEYS.WALLET_DATA, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save wallet data:', error)
      throw new Error('Failed to save wallet data to storage')
    }
  }
  
  private clearStoredWallet(): void {
    if (typeof window === 'undefined') return
    
    // Clear both new and legacy storage
    localStorage.removeItem(STORAGE_KEYS.WALLET_DATA)
    localStorage.removeItem(STORAGE_KEYS.LEGACY_ADDRESS)
    localStorage.removeItem(STORAGE_KEYS.LEGACY_PUBLIC_KEY)
  }

  /**
   * Check if WebAuthn is supported
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' && !!(
      window.PublicKeyCredential &&
      navigator.credentials &&
      typeof navigator.credentials.create === 'function' &&
      typeof navigator.credentials.get === 'function'
    )
  }
}