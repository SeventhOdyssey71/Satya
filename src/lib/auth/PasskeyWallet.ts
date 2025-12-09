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

  /**
   * Helper method to find common public key from two signature attempts
   * Based on Sui SDK documentation
   */
  private findCommonPublicKey(possiblePks1: any[], possiblePks2: any[]): any | null {
    for (const pk1 of possiblePks1) {
      for (const pk2 of possiblePks2) {
        if (pk1.toRawBytes().toString() === pk2.toRawBytes().toString()) {
          return pk1
        }
      }
    }
    return null
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

      // IMPORTANT: Only create new wallet if user explicitly wants to
      // Use two-signature method to establish persistent identity
      console.log('Creating passkey with two-signature method for persistence...')
      
      // First signature to establish identity
      const message1 = new TextEncoder().encode(`${APP_CONFIG.APP_NAME} wallet creation - step 1`)
      const possiblePks1 = await PasskeyKeypair.signAndRecover(this.provider, message1)
      
      // Second signature to confirm identity  
      const message2 = new TextEncoder().encode(`${APP_CONFIG.APP_NAME} wallet creation - step 2`)
      const possiblePks2 = await PasskeyKeypair.signAndRecover(this.provider, message2)
      
      // Find the common public key (the actual user's key)
      const commonPk = this.findCommonPublicKey(possiblePks1, possiblePks2)
      if (!commonPk) {
        throw new Error('Could not establish consistent passkey identity. Please try again.')
      }
      
      // Create keypair from the recovered public key
      this.keypair = new PasskeyKeypair(commonPk.toRawBytes(), this.provider)
      const publicKey = this.keypair.getPublicKey()
      this.address = publicKey.toSuiAddress()

      const publicKeyBase64 = publicKey.toBase64()
      const publicKeyBytesHex = Array.from(commonPk.toRawBytes() as Uint8Array).map(b => b.toString(16).padStart(2, '0')).join('')
      
      console.log('New passkey wallet created with address:', this.address)
      console.log('Public key recovered and stored for reuse')
      
      // Save wallet data with raw bytes for reconstruction
      this.saveWallet({
        address: this.address,
        publicKey: publicKeyBase64,
        publicKeyBytes: publicKeyBytesHex,
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
      console.log('Authenticating with existing passkey wallet using recovery method...')
      
      const storedWallet = this.getStoredWallet()
      if (!storedWallet) {
        return {
          success: false,
          error: 'No existing wallet found'
        }
      }

      console.log('Expected address:', storedWallet.address)
      console.log('Attempting to recover passkey using stored public key...')
      
      // If we have stored public key bytes, try to reconstruct directly
      if (storedWallet.publicKeyBytes) {
        try {
          console.log('Reconstructing keypair from stored public key bytes...')
          const publicKeyBytes = Uint8Array.from(
            storedWallet.publicKeyBytes.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
          )
          
          // Test if this keypair can sign (which would confirm the user has the same passkey)
          const testKeypair = new PasskeyKeypair(publicKeyBytes, this.provider)
          
          // Test signing to verify the user still has access to this passkey
          const testMessage = new Uint8Array([1, 2, 3, 4, 5]) // Simple test message
          try {
            await testKeypair.signPersonalMessage(testMessage)
            console.log('✓ Passkey verification successful - same credential confirmed')
            
            // Success! User has the same passkey
            this.keypair = testKeypair
            this.address = storedWallet.address
            
            return {
              success: true,
              keypair: this.keypair,
              address: this.address,
              publicKey: storedWallet.publicKey,
            }
          } catch (signError) {
            console.log('Stored keypair cannot sign, passkey may have been removed or changed')
            // Fall through to recovery method
          }
        } catch (reconstructError) {
          console.log('Could not reconstruct from stored bytes, trying recovery method')
          // Fall through to recovery method
        }
      }
      
      // Recovery method: Use signAndRecover to detect if user has the same passkey
      console.log('Using signAndRecover method to verify passkey identity...')
      try {
        // Use the same messages as during creation to maintain consistency
        const message1 = new TextEncoder().encode(`${APP_CONFIG.APP_NAME} wallet recovery - step 1`)
        const possiblePks1 = await PasskeyKeypair.signAndRecover(this.provider, message1)
        
        const message2 = new TextEncoder().encode(`${APP_CONFIG.APP_NAME} wallet recovery - step 2`)
        const possiblePks2 = await PasskeyKeypair.signAndRecover(this.provider, message2)
        
        const commonPk = this.findCommonPublicKey(possiblePks1, possiblePks2)
        if (!commonPk) {
          throw new Error('Could not recover consistent passkey identity')
        }
        
        // Check if the recovered key matches our stored wallet
        const recoveredKeypair = new PasskeyKeypair(commonPk.toRawBytes(), this.provider)
        const recoveredAddress = recoveredKeypair.getPublicKey().toSuiAddress()
        
        if (recoveredAddress === storedWallet.address) {
          console.log('✓ Passkey recovery successful - same credential confirmed')
          this.keypair = recoveredKeypair
          this.address = recoveredAddress
          
          return {
            success: true,
            keypair: this.keypair,
            address: this.address,
            publicKey: storedWallet.publicKey,
          }
        } else {
          console.warn('⚠ Recovered passkey has different address than stored wallet')
          console.warn('Expected:', storedWallet.address)
          console.warn('Recovered:', recoveredAddress)
          console.log('This suggests user is using a different passkey or device')
          
          // Update storage with the new wallet identity
          const publicKeyBase64 = commonPk.toBase64()
          const publicKeyBytesHex = Array.from(commonPk.toRawBytes() as Uint8Array).map(b => b.toString(16).padStart(2, '0')).join('')
          
          this.saveWallet({
            address: recoveredAddress,
            publicKey: publicKeyBase64,
            publicKeyBytes: publicKeyBytesHex,
            createdAt: Date.now(),
            version: APP_CONFIG.STORAGE_VERSION
          })
          
          this.keypair = recoveredKeypair
          this.address = recoveredAddress
          
          return {
            success: true,
            keypair: this.keypair,
            address: this.address,
            publicKey: publicKeyBase64,
          }
        }
      } catch (recoveryError) {
        console.error('Passkey recovery failed:', recoveryError)
        return {
          success: false,
          error: 'Failed to recover passkey identity. You may need to create a new passkey.'
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

  // Force create a new wallet even if one exists (for troubleshooting)
  async recreateWallet(): Promise<PasskeyAuthResult> {
    console.log('Force creating new passkey wallet (clearing existing data)...')
    this.clearWallet()
    return await this.createNewWallet()
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