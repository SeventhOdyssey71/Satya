import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  // This route now proxies to the backend API
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
  
  try {
    const formData = new FormData();
    const buffer = Buffer.from(await request.arrayBuffer());
    const file = new File([buffer], 'upload.bin', { type: 'application/octet-stream' });
    formData.append('file', file);

    const response = await fetch(`${backendUrl}/api/walrus/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (response.ok) {
      return NextResponse.json({
        blobId: data.data.blobId,
        success: true,
      });
    } else {
      throw new Error(data.error?.message || 'Upload failed');
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}