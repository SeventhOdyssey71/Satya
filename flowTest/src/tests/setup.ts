import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Setup globals for testing
global.fetch = vi.fn()
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  useParams: () => ({ id: 'test-id' }),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_NAUTILUS_ENCLAVE_URL = 'http://localhost:8000'
process.env.NEXT_PUBLIC_NAUTILUS_VERIFICATION_URL = 'http://localhost:8001'
process.env.NEXT_PUBLIC_NAUTILUS_ATTESTATION_URL = 'http://localhost:8002'
process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ID = '0xtest123'