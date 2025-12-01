import {
  BrowserPasskeyProvider,
  PasskeyKeypair,
} from '@mysten/sui/keypairs/passkey'
import { SuiClient } from '@mysten/sui/client'

export interface PasskeyAuthResult {
  success: boolean
  keypair?: PasskeyKeypair
  address?: string
  error?: string
}

export class PasskeyAuth {
  private suiClient: SuiClient

  constructor(suiClient: SuiClient) {
    this.suiClient = suiClient
  }

  /**
   * Create a new passkey for the user
   */
  async createPasskey(username: string): Promise<PasskeyAuthResult> {
    try {
      // Check if WebAuthn is supported
      if (!PasskeyAuth.isSupported()) {
        return {
          success: false,
          error: 'WebAuthn is not supported in this browser'
        }
      }

      // Create passkey provider
      const provider = new BrowserPasskeyProvider('Satya Protocol', {})

      // Create Sui keypair with passkey
      const keypair = await PasskeyKeypair.getPasskeyInstance(provider)
      const publicKey = keypair.getPublicKey()
      const address = publicKey.toSuiAddress()

      // Store for future use
      localStorage.setItem('satya_passkey_address', address)

      return {
        success: true,
        keypair,
        address,
      }
    } catch (error) {
      console.error('Passkey creation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Authenticate using existing passkey
   */
  async authenticateWithPasskey(): Promise<PasskeyAuthResult> {
    try {
      // Check if we have a stored address (indicates passkey was created)
      const storedAddress = localStorage.getItem('satya_passkey_address')
      if (!storedAddress) {
        return {
          success: false,
          error: 'No passkey found. Please create one first.'
        }
      }

      // Create passkey provider
      const provider = new BrowserPasskeyProvider('Satya Protocol', {})

      // Authenticate with existing passkey
      const keypair = await PasskeyKeypair.getPasskeyInstance(provider)
      const publicKey = keypair.getPublicKey()
      const address = publicKey.toSuiAddress()

      return {
        success: true,
        keypair,
        address,
      }
    } catch (error) {
      console.error('Passkey authentication failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }
    }
  }

  /**
   * Check if passkey is available
   */
  hasStoredPasskey(): boolean {
    return !!localStorage.getItem('satya_passkey_address')
  }

  /**
   * Clear stored passkey data
   */
  clearPasskey(): void {
    localStorage.removeItem('satya_passkey_address')
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