import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

export async function PUT(request: NextRequest) {
  let tempFile: string | null = null;
  
  try {
    const data = await request.arrayBuffer();
    const buffer = Buffer.from(data);
    
    console.log('Data size:', buffer.byteLength, 'bytes');
    
    // Create a temporary file
    tempFile = join(tmpdir(), `walrus-upload-${Date.now()}.bin`);
    writeFileSync(tempFile, buffer);
    console.log('Temp file created:', tempFile);
    
    // Use Walrus CLI to upload
    try {
      const command = `walrus store --epochs 1 "${tempFile}"`;
      console.log('Executing:', command);
      
      const output = execSync(command, {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });
      
      console.log('Walrus CLI output:', output);
      
      // Parse the blob ID from the output
      const blobIdMatch = output.match(/Blob ID:\s*([A-Za-z0-9_-]+)/);
      if (!blobIdMatch) {
        throw new Error('Could not extract blob ID from Walrus output');
      }
      
      const blobId = blobIdMatch[1];
      console.log('Extracted blob ID:', blobId);
      
      return NextResponse.json({
        blobId: blobId,
        success: true,
      });
      
    } catch (cmdError: any) {
      console.error('Walrus CLI error:', cmdError.message);
      console.error('Error output:', cmdError.stderr);
      throw new Error(`Walrus CLI failed: ${cmdError.message}`);
    }
    
  } catch (error) {
    console.error('Upload error details:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  } finally {
    // Clean up temp file
    if (tempFile) {
      try {
        unlinkSync(tempFile);
        console.log('Temp file cleaned up');
      } catch (e) {
        console.error('Failed to clean up temp file:', e);
      }
    }
  }
}