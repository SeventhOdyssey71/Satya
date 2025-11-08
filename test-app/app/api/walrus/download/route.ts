import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blobId = searchParams.get('blobId');
    
    if (!blobId) {
      return NextResponse.json(
        { error: 'Blob ID is required' },
        { status: 400 }
      );
    }

    console.log('Downloading blob:', blobId);

    // Use Walrus CLI to read the blob
    try {
      const command = `walrus read ${blobId}`;
      console.log('Executing:', command);
      
      const output = execSync(command, {
        encoding: 'buffer',
        maxBuffer: 100 * 1024 * 1024, // 100MB buffer
      });
      
      console.log('Downloaded blob size:', output.byteLength, 'bytes');
      
      return new NextResponse(output, {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });
      
    } catch (cmdError: any) {
      console.error('Walrus CLI error:', cmdError.message);
      throw new Error(`Walrus CLI failed: ${cmdError.message}`);
    }
    
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Download failed' },
      { status: 500 }
    );
  }
}