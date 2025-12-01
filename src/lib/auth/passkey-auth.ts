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
   * Create a new passkey for the user (only if one doesn't exist)
   */
  async createPasskey(username: string): Promise<PasskeyAuthResult> {
    try {
      // Check if we already have a passkey
      const existingAddress = localStorage.getItem('satya_passkey_address')
      if (existingAddress) {
        return {
          success: false,
          error: 'Passkey already exists. Use authenticate instead.'
        }
      }

      // Check if WebAuthn is supported
      if (!PasskeyAuth.isSupported()) {
        return {
          success: false,
          error: 'WebAuthn is not supported in this browser'
        }
      }

      // Create passkey provider - allow platform authenticators (Touch ID, Windows Hello)
      const provider = new BrowserPasskeyProvider('Satya Protocol', {
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Enable built-in biometrics
          userVerification: 'preferred',
          requireResidentKey: true,
        },
      })

      // Create Sui keypair with passkey
      const keypair = await PasskeyKeypair.getPasskeyInstance(provider)
      const publicKey = keypair.getPublicKey()
      const address = publicKey.toSuiAddress()

      // Store the address and keypair data for consistent reuse
      localStorage.setItem('satya_passkey_address', address)
      localStorage.setItem('satya_passkey_created', 'true')

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

      // Create passkey provider - allow platform authenticators (Touch ID, Windows Hello)
      const provider = new BrowserPasskeyProvider('Satya Protocol', {
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Enable built-in biometrics
          userVerification: 'preferred',
          requireResidentKey: true,
        },
      })

      // Authenticate with existing passkey
      const keypair = await PasskeyKeypair.getPasskeyInstance(provider)
      
      // Always return the stored address to maintain consistency
      return {
        success: true,
        keypair,
        address: storedAddress, // Use stored address instead of regenerating
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
    return !!localStorage.getItem('satya_passkey_address') && 
           !!localStorage.getItem('satya_passkey_created')
  }

  /**
   * Clear stored passkey data
   */
  clearPasskey(): void {
    localStorage.removeItem('satya_passkey_address')
    localStorage.removeItem('satya_passkey_created')
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