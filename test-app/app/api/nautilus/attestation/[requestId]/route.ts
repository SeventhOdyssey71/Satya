import { NextRequest, NextResponse } from 'next/server';

// Mock in-memory storage for demo purposes
// In production, this would be a proper database or cache
const mockAttestations = new Map<string, any>();
const mockProcessingTime = new Map<string, number>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    // Check if we already have an attestation
    if (mockAttestations.has(requestId)) {
      return NextResponse.json(mockAttestations.get(requestId));
    }

    // Simulate processing time
    const startTime = mockProcessingTime.get(requestId) || Date.now();
    if (!mockProcessingTime.has(requestId)) {
      mockProcessingTime.set(requestId, startTime);
    }

    const processingTime = Date.now() - startTime;
    const minProcessingTime = 2000; // 2 seconds minimum

    if (processingTime < minProcessingTime) {
      // Still processing
      return NextResponse.json(null, { status: 404 });
    }

    // Generate mock attestation result
    const mockAttestation = {
      assetId: `asset_${requestId}`,
      dataHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      verificationResult: {
        authentic: Math.random() > 0.1, // 90% success rate
        quality: Math.floor(Math.random() * 40) + 60, // 60-100% quality
        size: Math.floor(Math.random() * 10000000) + 1000, // 1KB - 10MB
        format: ['json', 'csv', 'parquet', 'xlsx'][Math.floor(Math.random() * 4)],
        timestamp: new Date().toISOString(),
      },
      pcr: `0x${Math.random().toString(16).substr(2, 64)}`,
      signature: `0x${Math.random().toString(16).substr(2, 128)}`,
      enclaveId: `enclave_${Math.random().toString(36).substr(2, 16)}`,
    };

    // Store the result
    mockAttestations.set(requestId, mockAttestation);
    
    // Clean up processing time tracking
    mockProcessingTime.delete(requestId);

    return NextResponse.json(mockAttestation);

  } catch (error) {
    console.error('Attestation retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}