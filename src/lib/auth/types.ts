import { PasskeyKeypair } from '@mysten/sui/keypairs/passkey'

export interface PasskeyAuthResult {
  success: boolean
  keypair?: PasskeyKeypair
  address?: string
  publicKey?: string
  error?: string
}

export interface StoredWalletData {
  address: string
  publicKey: string
  createdAt: number
  version: string
}

export const STORAGE_KEYS = {
  WALLET_DATA: 'satya_passkey_wallet',
  // Legacy keys for migration
  LEGACY_ADDRESS: 'satya_passkey_address',
  LEGACY_PUBLIC_KEY: 'satya_passkey_publickey'
} as const

export const APP_CONFIG = {
  APP_NAME: 'Satya Protocol',
  STORAGE_VERSION: '1.0.0'
} as const