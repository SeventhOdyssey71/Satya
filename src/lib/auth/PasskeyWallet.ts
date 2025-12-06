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

  private async createNewWallet(): Promise<PasskeyAuthResult> {
    try {
      console.log('Creating NEW passkey wallet...')
      
      // Check if WebAuthn is supported
      if (!PasskeyWallet.isSupported()) {
        return {
          success: false,
          error: 'WebAuthn is not supported in this browser'
        }
      }

      // Create Sui keypair with passkey - this will prompt for new passkey creation
      this.keypair = await PasskeyKeypair.getPasskeyInstance(this.provider)
      const publicKey = this.keypair.getPublicKey()
      this.address = publicKey.toSuiAddress()

      const publicKeyBase64 = publicKey.toBase64()
      
      console.log('New passkey wallet created with address:', this.address)
      
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
        error: error instanceof Error ? error.message : 'Failed to create passkey wallet'
      }
    }
  }

  private async authenticateExistingWallet(): Promise<PasskeyAuthResult> {
    try {
      console.log('Authenticating with existing passkey wallet...')
      
      // Use existing passkey to authenticate - this should NOT create a new one
      try {
        // Get the passkey instance using the existing credential
        this.keypair = await PasskeyKeypair.getPasskeyInstance(this.provider)
        const publicKey = this.keypair.getPublicKey()
        this.address = publicKey.toSuiAddress()
        
        const storedWallet = this.getStoredWallet()
        if (storedWallet && storedWallet.address !== this.address) {
          console.warn('Authenticated address does not match stored address')
          console.warn('Stored:', storedWallet.address, 'Authenticated:', this.address)
        }
        
        // Update stored wallet with current session
        if (storedWallet) {
          this.address = storedWallet.address // Use stored address as authoritative
        } else {
          // Save this as the authoritative wallet
          this.saveWallet({
            address: this.address,
            publicKey: publicKey.toBase64(),
            createdAt: Date.now(),
            version: APP_CONFIG.STORAGE_VERSION
          })
        }
        
        console.log('Successfully authenticated with passkey wallet:', this.address)
        
        return {
          success: true,
          keypair: this.keypair,
          address: this.address,
          publicKey: publicKey.toBase64(),
        }
      } catch (authError) {
        console.error('Authentication failed:', authError)
        return {
          success: false,
          error: 'Failed to authenticate with existing passkey'
        }
      }
    } catch (error) {
      console.error('Passkey authentication failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }
    }
  }


  async connect(): Promise<PasskeyAuthResult> {
    // Check if WebAuthn is supported first
    if (!PasskeyWallet.isSupported()) {
      return {
        success: false,
        error: 'WebAuthn is not supported in this browser'
      }
    }
    
    // Check if we have a saved passkey wallet
    const storedWallet = this.getStoredWallet()
    
    if (storedWallet) {
      console.log('Found existing passkey wallet, authenticating...')
      // We have an existing wallet - authenticate with it
      return await this.authenticateExistingWallet()
    } else {
      console.log('No existing passkey wallet found, creating new one...')
      // No existing wallet - create a new one
      return await this.createNewWallet()
    }
  }

  // Force create a new wallet (used only for initial setup)
  async createWallet(): Promise<PasskeyAuthResult> {
    return await this.createNewWallet()
  }

  // Force authenticate with existing wallet (used when we know one exists)
  async authenticateWallet(): Promise<PasskeyAuthResult> {
    const storedWallet = this.getStoredWallet()
    if (!storedWallet) {
      return {
        success: false,
        error: 'No existing wallet found to authenticate with'
      }
    }
    return await this.authenticateExistingWallet()
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

  // Clear all passkey data and force fresh wallet creation
  clearWallet(): void {
    console.log('Clearing all passkey wallet data...')
    this.disconnect()
    // This will force the next connect() to create a new wallet
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
      // Ensure we only save one wallet by clearing any existing data first
      this.clearStoredWallet()
      
      console.log('Saving single passkey wallet:', data.address)
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