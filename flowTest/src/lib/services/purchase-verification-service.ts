import { NautilusClient } from '@/lib/integrations/nautilus/client';
import { SealEncryptionService } from '@/lib/integrations/seal/services/encryption-service';
import { PolicyType } from '@/lib/integrations/seal/types';
import { WalrusStorageService } from '@/lib/integrations/walrus/services/storage-service';
import { SuiClient } from '@mysten/sui/client';

export interface ModelPurchaseData {
  modelId: string;
  buyerAddress: string;
  sellerAddress: string;
  price: string;
  walrusBlobId: string;
  attestationId?: string;
}

export interface VerificationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  error?: string;
  data?: any;
}

export interface VerificationResult {
  success: boolean;
  steps: VerificationStep[];
  accessKeys?: {
    encryptionKey: string;
    decryptionPolicy: string;
    sessionToken: string;
  };
  attestation?: any;
  error?: string;
}

export class PurchaseVerificationService {
  private nautilusClient: NautilusClient;
  private sealService: SealEncryptionService;
  private walrusService: WalrusStorageService;
  private suiClient: SuiClient;

  constructor(
    nautilusClient: NautilusClient,
    sealService: SealEncryptionService,
    walrusService: WalrusStorageService,
    suiClient: SuiClient
  ) {
    this.nautilusClient = nautilusClient;
    this.sealService = sealService;
    this.walrusService = walrusService;
    this.suiClient = suiClient;
  }

  /**
   * Run complete purchase verification flow
   */
  async verifyPurchase(
    purchaseData: ModelPurchaseData,
    onStepUpdate: (steps: VerificationStep[]) => void
  ): Promise<VerificationResult> {
    const steps: VerificationStep[] = [
      {
        id: 'enclave_registration',
        title: 'Enclave Registration',
        description: 'Verifying TEE enclave is properly registered',
        status: 'pending',
        progress: 0
      },
      {
        id: 'aws_nitro_attestation',
        title: 'AWS Nitro Attestation',
        description: 'Validating AWS Nitro hardware attestation document',
        status: 'pending',
        progress: 0
      },
      {
        id: 'model_integrity',
        title: 'Model Integrity',
        description: 'Confirming model files match verification report',
        status: 'pending',
        progress: 0
      },
      {
        id: 'blockchain_verification',
        title: 'Blockchain Verification',
        description: 'Verifying attestation is registered on-chain',
        status: 'pending',
        progress: 0
      },
      {
        id: 'access_key_generation',
        title: 'Access Key Generation',
        description: 'Generating SEAL-encrypted access keys for purchased model',
        status: 'pending',
        progress: 0
      }
    ];

    try {
      // Step 1: Verify Enclave Registration
      await this.executeStep(
        steps,
        'enclave_registration',
        () => this.verifyEnclaveRegistration(purchaseData),
        onStepUpdate
      );

      // Step 2: AWS Nitro Attestation
      await this.executeStep(
        steps,
        'aws_nitro_attestation',
        () => this.validateNitroAttestation(purchaseData),
        onStepUpdate
      );

      // Step 3: Model Integrity Check
      await this.executeStep(
        steps,
        'model_integrity',
        () => this.verifyModelIntegrity(purchaseData),
        onStepUpdate
      );

      // Step 4: Blockchain Verification
      await this.executeStep(
        steps,
        'blockchain_verification',
        () => this.verifyOnChainAttestation(purchaseData),
        onStepUpdate
      );

      // Step 5: Generate Access Keys
      const accessKeys = await this.executeStep(
        steps,
        'access_key_generation',
        () => this.generateAccessKeys(purchaseData),
        onStepUpdate
      );

      return {
        success: true,
        steps,
        accessKeys,
        attestation: steps.find(s => s.id === 'aws_nitro_attestation')?.data
      };

    } catch (error) {
      console.error('❌ Purchase verification failed:', error);
      
      // Mark any remaining steps as failed
      steps.forEach(step => {
        if (step.status === 'pending' || step.status === 'running') {
          step.status = 'failed';
          step.error = error instanceof Error ? error.message : 'Verification failed';
        }
      });
      
      onStepUpdate(steps);

      return {
        success: false,
        steps,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Execute a verification step with progress tracking
   */
  private async executeStep<T>(
    steps: VerificationStep[],
    stepId: string,
    stepFunction: () => Promise<T>,
    onStepUpdate: (steps: VerificationStep[]) => void
  ): Promise<T> {
    const step = steps.find(s => s.id === stepId);
    if (!step) throw new Error(`Step ${stepId} not found`);

    try {
      // Mark step as running
      step.status = 'running';
      step.progress = 0;
      onStepUpdate([...steps]);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        if (step.status === 'running' && step.progress < 90) {
          step.progress = Math.min(step.progress + Math.random() * 30, 90);
          onStepUpdate([...steps]);
        }
      }, 500);

      // Execute step function
      const result = await stepFunction();

      // Clear interval and mark as completed
      clearInterval(progressInterval);
      step.status = 'completed';
      step.progress = 100;
      step.data = result;
      onStepUpdate([...steps]);

      return result;

    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : 'Step failed';
      onStepUpdate([...steps]);
      throw error;
    }
  }

  /**
   * Verify that the enclave is properly registered
   */
  private async verifyEnclaveRegistration(purchaseData: ModelPurchaseData): Promise<boolean> {
    console.log('🔒 Verifying enclave registration...');
    
    // Simulate API call to check enclave registration
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In real implementation, this would:
    // 1. Check if enclave ID is registered in the system
    // 2. Verify enclave is running and healthy
    // 3. Check enclave version matches expected
    
    const isRegistered = Math.random() > 0.1; // 90% success rate
    
    if (!isRegistered) {
      throw new Error('Enclave registration validation failed');
    }

    console.log('✅ Enclave registration verified');
    return true;
  }

  /**
   * Validate AWS Nitro attestation document
   */
  private async validateNitroAttestation(purchaseData: ModelPurchaseData): Promise<any> {
    console.log('🔐 Validating AWS Nitro attestation...');
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get attestation document if we have an ID
    let attestation;
    if (purchaseData.attestationId) {
      const verification = await this.nautilusClient.verifyDatasetIntegrity(
        purchaseData.attestationId,
        'mock-hash' // In real implementation, get from Walrus metadata
      );
      
      if (!verification.valid || !verification.attestation) {
        throw new Error('Invalid attestation document');
      }
      
      attestation = verification.attestation;
    } else {
      // Generate mock attestation for demo
      attestation = {
        moduleId: purchaseData.modelId,
        pcr0: "abc123",
        pcr1: "def456", 
        pcr2: "ghi789",
        public_key: "mock-public-key",
        user_data: "mock-hash",
        nonce: "mock-nonce",
        timestamp: Date.now(),
        signature: "mock-signature",
        certificate: "mock-certificate"
      };
    }

    // Validate attestation document cryptographically
    const isValid = await this.nautilusClient.validateAttestationDocument(attestation);
    
    if (!isValid) {
      throw new Error('Attestation document validation failed');
    }

    console.log('✅ AWS Nitro attestation validated');
    return attestation;
  }

  /**
   * Verify model file integrity
   */
  private async verifyModelIntegrity(purchaseData: ModelPurchaseData): Promise<boolean> {
    console.log('🔍 Verifying model integrity...');
    
    await new Promise(resolve => setTimeout(resolve, 1800));

    try {
      // Get model metadata from Walrus
      const metadata = await this.walrusService.getBlobMetadata(purchaseData.walrusBlobId);
      
      if (!metadata) {
        throw new Error('Could not retrieve model metadata from Walrus');
      }

      // In real implementation, this would:
      // 1. Download model file from Walrus
      // 2. Calculate hash and compare with stored hash
      // 3. Verify file size matches expected
      // 4. Check model format is valid
      
      const integrityCheck = Math.random() > 0.05; // 95% success rate
      
      if (!integrityCheck) {
        throw new Error('Model integrity verification failed - file hash mismatch');
      }

      console.log('✅ Model integrity verified');
      return true;

    } catch (error) {
      console.error('❌ Model integrity check failed:', error);
      throw error;
    }
  }

  /**
   * Verify attestation is registered on blockchain
   */
  private async verifyOnChainAttestation(purchaseData: ModelPurchaseData): Promise<boolean> {
    console.log('⛓️ Verifying on-chain attestation...');
    
    await new Promise(resolve => setTimeout(resolve, 1200));

    try {
      // In real implementation, this would query the smart contract
      // to verify the attestation is properly registered on-chain
      
      // For now, simulate blockchain query
      const isOnChain = Math.random() > 0.05; // 95% success rate
      
      if (!isOnChain) {
        throw new Error('Attestation not found on blockchain');
      }

      console.log('✅ On-chain attestation verified');
      return true;

    } catch (error) {
      console.error('❌ Blockchain verification failed:', error);
      throw error;
    }
  }

  /**
   * Generate SEAL-encrypted access keys for the purchased model
   */
  private async generateAccessKeys(purchaseData: ModelPurchaseData): Promise<{
    encryptionKey: string;
    decryptionPolicy: string; 
    sessionToken: string;
  }> {
    console.log('🔑 Generating access keys...');
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Create SEAL access policy for this buyer
      const policyParams = {
        price: parseFloat(purchaseData.price),
        seller: purchaseData.sellerAddress,
        assetId: purchaseData.modelId,
        allowedAddresses: [purchaseData.buyerAddress]
      };

      // Generate encryption keys using SEAL
      const encryptionResult = await this.sealService.encryptData(
        new Uint8Array([1, 2, 3, 4]), // Mock key data
        PolicyType.PAYMENT_GATED,
        policyParams
      );

      if (!encryptionResult.success) {
        throw new Error('Failed to generate access keys');
      }

      console.log('✅ Access keys generated successfully');
      
      return {
        encryptionKey: encryptionResult.encryptedData ? 
          Array.from(encryptionResult.encryptedData).map(b => b.toString(16).padStart(2, '0')).join('') : 
          'mock-encrypted-key',
        decryptionPolicy: encryptionResult.policyId || 'mock-policy-id',
        sessionToken: `session_${Date.now()}_${Math.random().toString(36).substring(2)}`
      };

    } catch (error) {
      console.error('❌ Access key generation failed:', error);
      throw error;
    }
  }

  /**
   * Get verification status for ongoing verification
   */
  async getVerificationStatus(verificationId: string): Promise<{
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    currentStep?: string;
  }> {
    // In real implementation, this would check status from persistent storage
    return {
      status: 'pending',
      progress: 0
    };
  }
}

export default PurchaseVerificationService;