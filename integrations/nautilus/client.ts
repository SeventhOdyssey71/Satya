interface NautilusConfig {
  enclaveUrl: string;
  suiNetwork: string;
  marketplacePackageId: string;
}

interface UploadFileRequest {
  file: Uint8Array;
  type: string;
}

interface UploadFileResponse {
  success: boolean;
  file_id: string;
  hash: string;
  attestation_id: string;
}

interface AttestationRequest {
  fileId: string;
  operation: string;
  metadata: Record<string, any>;
}

interface AttestationResponse {
  success: boolean;
  id: string;
  signature: Uint8Array;
  public_key: Uint8Array;
  metadata: Record<string, any>;
}

interface ProcessFileRequest {
  fileId: string;
  operation: string;
  metadata: Record<string, any>;
}

interface ProcessFileResponse {
  success: boolean;
  valid: boolean;
  attestation: string;
}

export class NautilusClient {
  private config: NautilusConfig;

  constructor(config: NautilusConfig) {
    this.config = config;
  }

  async uploadFile(request: UploadFileRequest): Promise<UploadFileResponse> {
    const response = await fetch(`${this.config.enclaveUrl}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: Array.from(request.file),
        type: request.type
      })
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async createAttestation(request: AttestationRequest): Promise<AttestationResponse> {
    const response = await fetch(`${this.config.enclaveUrl}/attest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Attestation failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async processFile(request: ProcessFileRequest): Promise<ProcessFileResponse> {
    const response = await fetch(`${this.config.enclaveUrl}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Process failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async healthCheck(): Promise<{ status: string; enclave_verified: boolean }> {
    const response = await fetch(`${this.config.enclaveUrl}/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async verifyAttestation(params: {
    fileId: string;
    attestationId: string;
    signature: Uint8Array;
    publicKey: Uint8Array;
  }): Promise<boolean> {
    // Mock implementation for testing
    return true;
  }

  async verifyOnChain(params: {
    attestationId: string;
    signature: Uint8Array;
    publicKey: Uint8Array;
    fileHash: string;
  }): Promise<boolean> {
    // Mock implementation for testing
    return true;
  }
}